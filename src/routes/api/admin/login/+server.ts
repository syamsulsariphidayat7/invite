import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { checkRateLimit, clientKey } from '$lib/server/rateLimit';

export async function POST({ request, cookies, getClientAddress }) {
	const ip = clientKey(request, (() => { try { return getClientAddress(); } catch { return 'unknown'; } })());
	const rl = checkRateLimit(`admin-login:${ip}`, 5, 15 * 60_000);
	if (!rl.allowed) error(429, `Terlalu banyak percobaan. Coba lagi ${rl.retryAfter} detik.`);
	const expected = env.ADMIN_PIN?.trim();
	if (!expected) error(500, 'PIN Admin belum dikonfigurasi.');

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Data tidak valid.');
	}
	const { pin } = (body ?? {}) as { pin?: unknown };
	if (typeof pin !== 'string' || !pin.trim()) error(400, 'PIN wajib diisi.');
	if (pin.trim() !== expected) error(401, 'PIN salah.');

	cookies.set('admin_pin', pin.trim(), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: true,
		maxAge: 60 * 60 * 24 * 7
	});

	return json({ ok: true });
}

export async function DELETE({ cookies }) {
	cookies.delete('admin_pin', { path: '/' });
	return json({ ok: true });
}
