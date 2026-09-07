import { json, error } from '@sveltejs/kit';
import { addWish, countWishes, listWishes } from '$lib/server/wishes';
import { getInvitation } from '$lib/server/invitations';
import { wedding } from '$lib/data/wedding';
import { checkRateLimit, clientKey } from '$lib/server/rateLimit';

export async function GET({ url }) {
	const slug = url.searchParams.get('slug')?.trim() || url.searchParams.get('wedding')?.trim() || wedding.slug;
	const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10) || 0);
	const limitRaw = parseInt(url.searchParams.get('limit') ?? '30', 10) || 30;
	const limit = Math.min(100, Math.max(1, limitRaw));
	const inv = await getInvitation(slug).catch(() => null);
	if (!inv && slug !== wedding.slug) error(404, 'Undangan tidak ditemukan.');
	const key = inv?.subdomain ?? slug;
	const [wishes, total] = await Promise.all([listWishes(key, limit, offset), countWishes(key)]);
	return json({ wishes, total });
}

export async function POST({ request, getClientAddress, url }) {
	const qpSlug = url.searchParams.get('slug')?.trim() || url.searchParams.get('wedding')?.trim() || null;
	const ip = clientKey(request, (() => { try { return getClientAddress(); } catch { return 'unknown'; } })());
	const rl = checkRateLimit(`wishes:${ip}`, 6, 60_000);
	if (!rl.allowed) error(429, `Terlalu sering. Coba lagi ${rl.retryAfter} detik.`);
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Format data tidak valid.');
	}

	const { name, attendance, message, guests, website, slug: bodySlug, wedding: bodyWedding } = (body ?? {}) as {
		name?: unknown;
		attendance?: unknown;
		message?: unknown;
		guests?: unknown;
		website?: unknown;
		slug?: unknown;
		wedding?: unknown;
	};
	if (typeof website === 'string' && website.trim()) {
		return json({ success: true, wish: { id: 0, name: '', attendance: '', message: '', guests: 0, createdAt: new Date().toISOString() } }, { status: 201 });
	}

	if (typeof name !== 'string' || name.trim().length < wedding.wishes.minName) {
		error(400, `Nama minimal ${wedding.wishes.minName} karakter.`);
	}
	if (typeof message !== 'string' || message.trim().length < wedding.wishes.minMessage) {
		error(400, `Ucapan minimal ${wedding.wishes.minMessage} karakter.`);
	}
	const attendanceNorm = typeof attendance === 'string' ? attendance.toLowerCase() : '';
	if (attendanceNorm !== 'hadir' && attendanceNorm !== 'tidak') {
		error(400, 'Silakan pilih konfirmasi kehadiran.');
	}
	let guestsNum = 0;
	if (attendanceNorm === 'hadir') {
		guestsNum = typeof guests === 'number' ? guests : Number(guests);
		if (!Number.isFinite(guestsNum) || guestsNum < 1 || guestsNum > 10) {
			error(400, 'Jumlah kehadiran 1-10 orang.');
		}
		guestsNum = Math.floor(guestsNum);
	}

	const rawSlug = (typeof bodySlug === 'string' && bodySlug.trim()) ? bodySlug.trim() : (typeof bodyWedding === 'string' && bodyWedding.trim()) ? bodyWedding.trim() : qpSlug ?? wedding.slug;
	const inv = await getInvitation(rawSlug).catch(() => null);
	if (!inv && rawSlug !== wedding.slug) error(404, 'Undangan tidak ditemukan.');
	const slug = inv?.subdomain ?? rawSlug;
	const turnstileToken = (body as Record<string, unknown>).turnstileToken as string | undefined;
	const tt = url.searchParams.get('turnstileToken') ?? turnstileToken;
	const { env } = await import('$env/dynamic/private');
	if (env.TURNSTILE_SECRET_KEY) {
		const secret = env.TURNSTILE_SECRET_KEY;
		if (secret && tt) {
			try {
				const vr = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ secret, response: tt, remoteip: ip }) });
				const vj = await vr.json().catch(() => null) as { success?: boolean } | null;
				if (!vj?.success) error(400, 'Verifikasi captcha gagal.');
			} catch (e) { if ((e as { status?: number })?.status === 400) throw e; }
		}
	}

	const wish = await addWish(slug, {
		name: name.trim().slice(0, 120),
		attendance: attendanceNorm as 'hadir' | 'tidak',
		message: message.trim().slice(0, 1000),
		guests: guestsNum
	});

	return json({ success: true, wish }, { status: 201 });
}
