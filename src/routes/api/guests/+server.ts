import { json, error } from '@sveltejs/kit';
import { verifyPin, listGuests, addGuests, updateGuestSent, deleteGuest, deleteAllGuests } from '$lib/server/guests';
import { checkRateLimit, clientKey } from '$lib/server/rateLimit';

function getSlug(url: URL): string {
	return url.searchParams.get('slug')?.trim() ?? '';
}

function getPin(request: Request, url: URL): string {
	return request.headers.get('x-pin')?.trim() ?? url.searchParams.get('pin')?.trim() ?? '';
}

export async function GET({ request, url }) {
	const slug = getSlug(url);
	if (!slug) error(400, 'slug required');
	const pin = getPin(request, url);
	const auth = await verifyPin(slug, pin);
	if (!auth.ok) error(401, 'PIN salah atau tidak diberikan.');
	const guests = await listGuests(slug);
	return json({ guests });
}

export async function POST({ request, url, getClientAddress }) {
	const slug = getSlug(url);
	if (!slug) error(400, 'slug required');
	const ip = clientKey(request, (() => { try { return getClientAddress(); } catch { return 'unknown'; } })());
	const rl = checkRateLimit(`guests:${ip}:${slug}`, 20, 60_000);
	if (!rl.allowed) error(429, `Terlalu sering. Coba lagi ${rl.retryAfter} detik.`);
	const pin = getPin(request, url);
	const auth = await verifyPin(slug, pin);
	if (!auth.ok) error(401, 'PIN salah atau tidak diberikan.');
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Body harus JSON.');
	}
	const { names, website } = (body ?? {}) as { names?: unknown; website?: unknown };
	if (typeof website === 'string' && website.trim()) return json({ added: [], count: 0 }, { status: 201 });
	if (!Array.isArray(names) || names.length === 0) error(400, 'names harus array berisi minimal 1 nama.');
	const strNames = names.filter((n): n is string => typeof n === 'string').map((n) => n.trim()).filter(Boolean);
	if (strNames.length === 0) error(400, 'names harus berisi string tidak kosong.');
	if (strNames.length > 200) error(400, 'Maksimum 200 nama per request.');
	for (const n of strNames) {
		if (n.length < 2 || n.length > 100) error(400, `Nama "${n.slice(0, 20)}" harus 2-100 karakter.`);
	}
	const added = await addGuests(slug, strNames);
	return json({ added, count: added.length }, { status: 201 });
}

export async function PATCH({ request, url }) {
	const slug = getSlug(url);
	if (!slug) error(400, 'slug required');
	const pin = getPin(request, url);
	const auth = await verifyPin(slug, pin);
	if (!auth.ok) error(401, 'PIN salah atau tidak diberikan.');
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Body harus JSON.');
	}
	const { id, sent } = (body ?? {}) as { id?: unknown; sent?: unknown };
	if (typeof id !== 'string' || !id) error(400, 'id required');
	if (typeof sent !== 'boolean') error(400, 'sent harus boolean');
	const guest = await updateGuestSent(slug, id, sent);
	if (!guest) error(404, 'Tamu tidak ditemukan.');
	return json({ guest });
}

export async function DELETE({ request, url }) {
	const slug = getSlug(url);
	if (!slug) error(400, 'slug required');
	const pin = getPin(request, url);
	const auth = await verifyPin(slug, pin);
	if (!auth.ok) error(401, 'PIN salah atau tidak diberikan.');
	const id = url.searchParams.get('id');
	if (id) {
		const ok = await deleteGuest(slug, id);
		if (!ok) error(404, 'Tamu tidak ditemukan.');
		return json({ success: true });
	}
	let body: unknown = null;
	try {
		body = await request.json();
	} catch {}
	const bulkId = (body as { id?: unknown } | null)?.id;
	if (typeof bulkId === 'string' && bulkId) {
		const ok = await deleteGuest(slug, bulkId);
		if (!ok) error(404, 'Tamu tidak ditemukan.');
		return json({ success: true });
	}
	const all = url.searchParams.get('all');
	if (all === '1' || all === 'true') {
		const count = await deleteAllGuests(slug);
		return json({ success: true, deleted: count });
	}
	error(400, 'Berikan id atau all=1 untuk hapus semua.');
}
