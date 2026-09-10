import { json, error } from '@sveltejs/kit';
import { createBackup, restoreBackup } from '$lib/server/backup';

export async function GET({ locals }) {
	if (!locals.adminAuthed) error(401, 'Unauthorized');
	const payload = await createBackup();
	const body = JSON.stringify(payload, null, 2);
	const day = new Date().toISOString().slice(0, 10);
	return new Response(body, {
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'content-disposition': `attachment; filename="backup-${day}.json"`,
			'cache-control': 'no-store'
		}
	});
}

export async function POST({ request, locals }) {
	if (!locals.adminAuthed) error(401, 'Unauthorized');
	const ct = request.headers.get('content-type') ?? '';
	let payload: unknown = null;
	if (ct.includes('multipart/form-data')) {
		const form = await request.formData();
		const file = form.get('file');
		if (!(file instanceof File)) error(400, 'File backup wajib.');
		if (file.size > 10 * 1024 * 1024) error(400, 'File terlalu besar (max 10MB).');
		const text = await file.text();
		try {
			payload = JSON.parse(text);
		} catch {
			error(400, 'File JSON tidak valid.');
		}
	} else {
		try {
			payload = await request.json();
		} catch {
			error(400, 'Body JSON tidak valid.');
		}
		const maybeWrapped = payload as Record<string, unknown>;
		if (maybeWrapped?.payload) payload = maybeWrapped.payload;
		if (maybeWrapped?.backup) payload = maybeWrapped.backup;
	}
	try {
		const result = await restoreBackup(payload);
		return json({ ok: true, result });
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : String(e);
		error(400, msg);
	}
}
