// Migrasi media statis → Supabase Storage + data_json.
// Upload static/photos/*.jpg (hero, bride, groom, gallery-1..12) dan
// static/audio/wedding.mp3 ke bucket invitation-photos/{slug}/, lalu isi
// data_json.photos / .gallery / .music_url dengan URL publik Storage.
//
// Cara pakai: node scripts/migrate-media.mjs [slug]
// (slug default: ruhaeni-roni; butuh SUPABASE_URL, SUPABASE_SECRET_KEY, DATABASE_URL di .env)

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';

function loadEnv() {
	const env = {};
	for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
		const i = line.indexOf('=');
		if (i === -1) continue;
		env[line.slice(0, i)] = line.slice(i + 1).replace(/^"|"$/g, '').trim();
	}
	return env;
}

const env = loadEnv();
const slug = process.argv[2] ?? 'ruhaeni-roni';
const SUPABASE_URL = env.SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
	console.error('Butuh SUPABASE_URL + SUPABASE_SECRET_KEY di .env');
	process.exit(1);
}
if (!env.DATABASE_URL) {
	console.error('Butuh DATABASE_URL di .env');
	process.exit(1);
}

const m = env.DATABASE_URL.match(/postgresql:\/\/([^:]+):(.+)@([^:/]+):(\d+)\/([^?\s]+)/);
if (!m) {
	console.error('DATABASE_URL tidak valid.');
	process.exit(1);
}
const sql = postgres({ user: m[1], password: m[2], host: m[3], port: Number(m[4]), database: m[5], prepare: false, ssl: 'require' });

const sb = createClient(SUPABASE_URL, SERVICE_KEY);
const BUCKET = 'invitation-photos';
const publicUrl = (p) => `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${p}`;

async function upload(pathInBucket, filePath, contentType) {
	const buf = new Uint8Array(fs.readFileSync(filePath));
	const { error } = await sb.storage.from(BUCKET).upload(pathInBucket, buf, { contentType, upsert: true });
	if (error) {
		console.error('Upload gagal', pathInBucket, '→', error.message);
		process.exit(1);
	}
	console.log('✓', pathInBucket);
}

const PHOTOS_DIR = 'static/photos';
const photoBases = ['hero', 'bride', 'groom', ...Array.from({ length: 12 }, (_, i) => `gallery-${i + 1}`)];

for (const base of photoBases) {
	const jpg = path.join(PHOTOS_DIR, `${base}.jpg`);
	if (!fs.existsSync(jpg)) {
		console.warn('⚠ lewati (tidak ada):', jpg);
		continue;
	}
	await upload(`${slug}/${base}.jpg`, jpg, 'image/jpeg');
}

// musik → storage (bucket sama, path terpisah dari foto)
const audioPath = 'static/audio/wedding.mp3';
if (fs.existsSync(audioPath)) {
	await upload(`${slug}/wedding.mp3`, audioPath, 'audio/mpeg');
} else {
	console.warn('⚠ audio tidak ditemukan:', audioPath);
}

// bangun data_json baru (merge, tidak menyentuh kunci lain)
const hero = publicUrl(`${slug}/hero.jpg`);
const bride = publicUrl(`${slug}/bride.jpg`);
const groom = publicUrl(`${slug}/groom.jpg`);
const gallery = photoBases.filter((b) => b.startsWith('gallery') && fs.existsSync(path.join(PHOTOS_DIR, `${b}.jpg`))).map((b) => publicUrl(`${slug}/${b}.jpg`));
const musicUrl = fs.existsSync(audioPath) ? publicUrl(`${slug}/wedding.mp3`) : null;

const rows = await sql`SELECT data_json FROM invitations WHERE subdomain = ${slug}`;
if (rows.length === 0) {
	console.error(`Undangan ${slug} tidak ditemukan.`);
	process.exit(1);
}
const cur = rows[0].data_json ?? {};
const next = {
	...cur,
	photos: { hero, bride, groom, cover: hero },
	gallery,
	...(musicUrl ? { music_url: musicUrl } : {})
};
// Kirim objek JS langsung — postgres.js men-serialize ke JSONB dengan benar
// (string + ::jsonb justru ter-encode ganda → melanggar CHECK jsonb_typeof).
await sql`UPDATE invitations SET data_json = ${next} WHERE subdomain = ${slug}`;
console.log('\n✅ data_json diperbarui untuk', slug);
console.log('photos.hero  :', hero);
console.log('gallery      :', gallery.length, 'foto');
console.log('music_url    :', musicUrl);

await sql.end();