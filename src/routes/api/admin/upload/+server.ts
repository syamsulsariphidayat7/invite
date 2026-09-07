import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createClient } from '@supabase/supabase-js';

export async function POST({ request, locals, url }) {
	if (!locals.adminAuthed) error(401, 'Unauthorized');
	const slug = url.searchParams.get('slug')?.trim().toLowerCase();
	if (!slug) error(400, 'slug query required');

	const supabaseUrl = env.SUPABASE_URL?.trim();
	const serviceKey = (env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
	if (!supabaseUrl || !serviceKey) error(500, 'Supabase Storage belum dikonfigurasi (SUPABASE_URL / SUPABASE_SECRET_KEY).');

	const form = await request.formData();
	const files = form.getAll('files').filter((v): v is File => v instanceof File);
	if (files.length === 0) {
		const single = form.get('file');
		if (single instanceof File) files.push(single);
	}
	if (files.length === 0) error(400, 'Tidak ada file.');
	if (files.length > 12) error(400, 'Maksimum 12 file per upload.');

	const supabase = createClient(supabaseUrl, serviceKey);
	const uploaded: string[] = [];

	for (const file of files) {
		if (!file.type.startsWith('image/')) error(400, `File ${file.name} bukan gambar.`);
		if (file.size > 8 * 1024 * 1024) error(400, `File ${file.name} > 8MB.`);
		const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
		const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
		const path = `${slug}/${safe}`;
		const buf = new Uint8Array(await file.arrayBuffer());
		const { error: upErr } = await supabase.storage.from('invitation-photos').upload(path, buf as never, {
			contentType: file.type,
			upsert: false
		});
		if (upErr) error(500, `Upload gagal: ${upErr.message}`);
		const { data } = supabase.storage.from('invitation-photos').getPublicUrl(path);
		uploaded.push(data.publicUrl);
	}

	return json({ urls: uploaded });
}
