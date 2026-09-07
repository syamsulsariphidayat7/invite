import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function POST({ request, cookies }) {
	const expected = env.ADMIN_PIN?.trim();
	if (!expected) error(500, 'ADMIN_PIN belum diset di env.');

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Body harus JSON.');
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
