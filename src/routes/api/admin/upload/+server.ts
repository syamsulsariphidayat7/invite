import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createClient } from '@supabase/supabase-js';
import { getInvitation, updateInvitation } from '$lib/server/invitations';
import sharp from 'sharp';

export async function POST({ request, locals, url }) {
	if (!locals.adminAuthed) error(401, 'Unauthorized');
	const slug = url.searchParams.get('slug')?.trim().toLowerCase();
	if (!slug) error(400, 'Undangan wajib.');

	const supabaseUrl = env.SUPABASE_URL?.trim();
	const serviceKey = (env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
	if (!supabaseUrl || !serviceKey) error(500, 'Penyimpanan belum dikonfigurasi.');

	const kind = (url.searchParams.get('kind') ?? 'gallery').toLowerCase();
	const allowedKinds = new Set(['gallery', 'music']);
	if (!allowedKinds.has(kind)) error(400, 'Jenis upload tidak valid.');
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
		const isImage = file.type.startsWith('image/');
		const isAudio = file.type.startsWith('audio/');
		if (!isImage && !isAudio) error(400, `File ${file.name} bukan gambar atau audio.`);
		if (file.size > 20 * 1024 * 1024) error(400, `File ${file.name} > 20MB.`);
		const orig = new Uint8Array(await file.arrayBuffer());
		let outBuf: Uint8Array = orig;
		let contentType = file.type;
		let ext = file.name.split('.').pop()?.toLowerCase() ?? (isImage ? 'jpg' : 'mp3');
		if (isImage && kind !== 'music') {
			try {
				const processed = await sharp(orig).rotate().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
				outBuf = new Uint8Array(processed);
				contentType = 'image/jpeg';
				ext = 'jpg';
			} catch {}
		}
		const folder = kind === 'music' ? `${slug}/audio` : slug;
		const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
		const path = `${folder}/${safe}`;
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
			if (kind === 'music') {
				const url = uploaded[0] ?? '';
				await updateInvitation(slug, { dataJson: { ...cur, music_url: url } });
			} else {
				const arr = Array.isArray(cur.gallery) ? (cur.gallery as string[]) : [];
				const merged = [...arr, ...uploaded].slice(-120);
				await updateInvitation(slug, { dataJson: { ...cur, gallery: merged } });
				galleryUrls = merged;
			}
		}
	} catch {}
	return json({ urls: uploaded, gallery: galleryUrls });
}

export async function DELETE({ locals, url }) {
	if (!locals.adminAuthed) error(401, 'Unauthorized');
	const slug = url.searchParams.get('slug')?.trim().toLowerCase();
	if (!slug) error(400, 'Undangan wajib.');
	const delUrl = url.searchParams.get('url');
	const reorder = url.searchParams.get('reorder');
	const supabaseUrl = env.SUPABASE_URL?.trim();
	const serviceKey = (env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
	if (!supabaseUrl || !serviceKey) error(500, 'Penyimpanan belum dikonfigurasi.');
	const supabase = createClient(supabaseUrl, serviceKey);

	if (reorder) {
		try {
			const list = JSON.parse(reorder) as string[];
			if (!Array.isArray(list)) error(400, 'Data tidak valid.');
			const inv = await getInvitation(slug);
			if (!inv) error(404, 'Undangan tidak ditemukan.');
			await updateInvitation(slug, { dataJson: { ...(inv.dataJson as Record<string, unknown>), gallery: list } });
			return json({ gallery: list });
		} catch (e: unknown) {
			const m = e instanceof Error ? e.message : String(e);
			if (m.includes('Unauthorized') || m.includes('slug')) throw e;
			error(400, 'Data tidak valid.');
		}
	}

	if (!delUrl) error(400, 'Pilih foto yang akan dihapus.');
	const inv = await getInvitation(slug);
	if (!inv) error(404, 'Undangan tidak ditemukan.');
	const cur = inv.dataJson as Record<string, unknown>;
	const arr = Array.isArray(cur.gallery) ? (cur.gallery as string[]) : [];
	const next = arr.filter((u) => u !== delUrl);
	const photos = (cur.photos as Record<string, string | null> | undefined) ?? {};
	let nextPhotos: Record<string, string | null> | null = null;
	for (const k of ['hero', 'bride', 'groom', 'cover'] as const) {
		if (photos[k] === delUrl) {
			if (!nextPhotos) nextPhotos = { ...photos };
			nextPhotos[k] = null;
		}
	}
	if (next.length !== arr.length || nextPhotos) {
		await updateInvitation(slug, { dataJson: { ...cur, gallery: next, ...(nextPhotos ? { photos: nextPhotos } : {}) } });
	}
	try {
		const marker = '/invitation-photos/';
		const idx = delUrl.indexOf(marker);
		if (idx !== -1) {
			const path = decodeURIComponent(delUrl.slice(idx + marker.length).split('?')[0]);
			await supabase.storage.from('invitation-photos').remove([path]);
		}
	} catch {}
	return json({ gallery: next, photos: nextPhotos ?? photos });
}
