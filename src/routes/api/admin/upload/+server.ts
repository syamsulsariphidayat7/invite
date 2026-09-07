import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createClient } from '@supabase/supabase-js';
import { getInvitation, updateInvitation } from '$lib/server/invitations';
import sharp from 'sharp';

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
		const orig = new Uint8Array(await file.arrayBuffer());
		let outBuf: Uint8Array = orig;
		let contentType = file.type;
		let ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
		try {
			const processed = await sharp(orig).rotate().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
			outBuf = new Uint8Array(processed);
			contentType = 'image/jpeg';
			ext = 'jpg';
		} catch {}
		const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
		const path = `${slug}/${safe}`;
		const { error: upErr } = await supabase.storage.from('invitation-photos').upload(path, outBuf as never, {
			contentType,
			upsert: false
		});
		if (upErr) error(500, `Upload gagal: ${upErr.message}`);
		const { data } = supabase.storage.from('invitation-photos').getPublicUrl(path);
		uploaded.push(data.publicUrl);
	}

	let galleryUrls: string[] = [];
	try {
		const inv = await getInvitation(slug);
		if (inv) {
			const cur = inv.dataJson as Record<string, unknown>;
			const arr = Array.isArray(cur.gallery) ? (cur.gallery as string[]) : [];
			const merged = [...arr, ...uploaded].slice(-120);
			await updateInvitation(slug, { dataJson: { ...cur, gallery: merged } });
			galleryUrls = merged;
		}
	} catch {}
	return json({ urls: uploaded, gallery: galleryUrls });
}

export async function DELETE({ locals, url }) {
	if (!locals.adminAuthed) error(401, 'Unauthorized');
	const slug = url.searchParams.get('slug')?.trim().toLowerCase();
	if (!slug) error(400, 'slug query required');
	const delUrl = url.searchParams.get('url');
	const reorder = url.searchParams.get('reorder');
	const supabaseUrl = env.SUPABASE_URL?.trim();
	const serviceKey = (env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
	if (!supabaseUrl || !serviceKey) error(500, 'Supabase Storage belum dikonfigurasi.');
	const supabase = createClient(supabaseUrl, serviceKey);

	if (reorder) {
		try {
			const list = JSON.parse(reorder) as string[];
			if (!Array.isArray(list)) error(400, 'reorder harus array URL.');
			const inv = await getInvitation(slug);
			if (!inv) error(404, 'Undangan tidak ditemukan.');
			await updateInvitation(slug, { dataJson: { ...(inv.dataJson as Record<string, unknown>), gallery: list } });
			return json({ gallery: list });
		} catch (e: unknown) {
			const m = e instanceof Error ? e.message : String(e);
			if (m.includes('Unauthorized') || m.includes('slug')) throw e;
			error(400, 'Format reorder tidak valid.');
		}
	}

	if (!delUrl) error(400, 'url atau reorder required');
	const inv = await getInvitation(slug);
	if (!inv) error(404, 'Undangan tidak ditemukan.');
	const cur = inv.dataJson as Record<string, unknown>;
	const arr = Array.isArray(cur.gallery) ? (cur.gallery as string[]) : [];
	const next = arr.filter((u) => u !== delUrl);
	if (next.length !== arr.length) {
		await updateInvitation(slug, { dataJson: { ...cur, gallery: next } });
	}
	try {
		const marker = '/invitation-photos/';
		const idx = delUrl.indexOf(marker);
		if (idx !== -1) {
			const path = decodeURIComponent(delUrl.slice(idx + marker.length).split('?')[0]);
			await supabase.storage.from('invitation-photos').remove([path]);
		}
	} catch {}
	return json({ gallery: next });
}
