import { json, error } from '@sveltejs/kit';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';

function db() {
	const opts = { prepare: false, max: 5, idle_timeout: 20, connect_timeout: 10 };
	const m = env.DATABASE_URL.match(/postgresql:\/\/([^:]+):(.+)@([^:/]+):(\d+)\/([^?\s]+)/);
	let cfg: Record<string, unknown> | null = null;
	if (m) {
		let pw = m[2];
		try {
			if (pw.includes('%')) pw = decodeURIComponent(pw);
		} catch {}
		cfg = { user: m[1], password: pw, host: m[3], port: Number(m[4]), database: m[5] };
	}
	return cfg ? postgres({ ...(cfg as Record<string, string>), ...opts } as never) : postgres(env.DATABASE_URL, opts as never);
}

export async function GET({ locals, url }) {
	if (!locals.adminAuthed) error(401, 'Unauthorized');
	const slug = url.searchParams.get('slug')?.trim();
	if (!slug) error(400, 'slug required');
	const sql = db();
	const rows = (await sql`SELECT id, name, attendance, message, guests, created_at FROM guest_wishes WHERE wedding = ${slug} ORDER BY created_at DESC LIMIT 500`) as unknown as unknown[];
	return json({ wishes: rows });
}

export async function DELETE({ locals, url }) {
	if (!locals.adminAuthed) error(401, 'Unauthorized');
	const slug = url.searchParams.get('slug')?.trim();
	if (!slug) error(400, 'slug required');
	const id = url.searchParams.get('id');
	if (!id) error(400, 'id required');
	const sql = db();
	const res = await sql`DELETE FROM guest_wishes WHERE id = ${id} AND wedding = ${slug}`;
	if (res.count === 0) error(404, 'Ucapan tidak ditemukan.');
	return json({ ok: true });
}
