// Seed undangan demo (idempoten) — jalankan: node scripts/seed-demo.mjs
// Membuat/memperbarui invitation subdomain "demo" dengan konten contoh.
import fs from 'node:fs';

function loadEnv() {
	const env = {};
	for (const l of fs.readFileSync('.env', 'utf8').split('\n')) {
		const m = l.match(/^([A-Z_]+)="?(.*?)"?$/);
		if (m) env[m[1]] = m[2];
	}
	return env;
}

const { default: postgres } = await import('postgres');
const env = loadEnv();
const url = env.DATABASE_URL;
if (!url) {
	console.error('DATABASE_URL kosong di .env');
	process.exit(1);
}
const mm = url.match(/postgresql:\/\/([^:]+):(.+)@([^:/]+):(\d+)\/([^?\s]+)/);
if (!mm) {
	console.error('DATABASE_URL tidak bisa di-parse');
	process.exit(1);
}
let pwd = mm[2];
try {
	if (pwd.includes('%')) pwd = decodeURIComponent(pwd);
} catch {}
const sql = postgres({ user: mm[1], password: pwd, host: mm[3], port: Number(mm[4]), database: mm[5], prepare: false, max: 2 });

const dataJson = {
	theme: { primary: '#2563eb', secondary: '#f8fafc' },
	couple: {
		bride: { name: 'Bella', full_name: 'Bella Salsabila', relation: 'Putri pertama dari Bapak Hasan & Ibu Ratna', instagram: '', whatsapp: '' },
		groom: { name: 'Andi', full_name: 'Andi Pratama', relation: 'Putra pertama dari Bapak Joko & Ibu Sri', instagram: '', whatsapp: '' }
	},
	events: [
		{ name: 'Akad Nikah', date: '2026-12-12', time: '08.00 WIB', location: 'Gedung Serbaguna, Jakarta', map_url: '' },
		{ name: 'Resepsi', date: '2026-12-12', time: '11.00 WIB', location: 'Gedung Serbaguna, Jakarta', map_url: '' }
	],
	gifts: [{ type: 'bank', provider: 'BCA', owner: 'Andi & Bella', number: '1234567890' }],
	gift_note: 'Doa restu Anda adalah hadiah terbaik bagi kami.',
	verse: { arabic: '', translation: '', source: '' },
	love_story: [
		{ title: 'Pertama Bertemu', text: 'Kami bertemu saat sama-sama mengikuti acara komunitas di kampus.' },
		{ title: 'Menjalin Kasih', text: 'Dua tahun bersama, saling mendukung dalam suka dan duka.' },
		{ title: 'Lamaran', text: 'Di penghujung tahun 2025, Andi melamar Bella di hadapan kedua keluarga.' }
	],
	love_story_intro: 'Perjalanan cinta kami dimulai dari sebuah pertemuan sederhana.',
	social: { whatsapp: '', instagram: '' },
	wishes: { minName: 2, minMessage: 2, note: '' },
	photos: { cover: '' },
	gallery: [],
	music_url: '',
	music_youtube_id: '',
	music_start_seconds: null,
	livestream_url: ''
};	// Salin galeri & foto contoh dari ruhaeni-roni supaya undangan demo tampil lengkap
	try {
		const src = await sql`SELECT data_json->'gallery' AS gallery, data_json->'photos' AS photos FROM invitations WHERE subdomain = 'ruhaeni-roni' LIMIT 1`;
		if (src.length > 0) {
			if (Array.isArray(src[0].gallery)) dataJson.gallery = src[0].gallery;
			if (src[0].photos && typeof src[0].photos === 'object' && !Array.isArray(src[0].photos)) {
				dataJson.photos = { ...src[0].photos };
			}
		}
	} catch (e) {
		console.warn('Tidak bisa menyalin foto contoh:', e.message);
	}

	try {
		const rows = await sql`
			INSERT INTO invitations (subdomain, nama_pihak_1, nama_pihak_2, tanggal_acara, template, data_json, status, access_pin)
			VALUES ('demo', 'Andi Pratama', 'Bella Salsabila', '2026-12-12', 'classic', ${sql.json(dataJson)}, 'active', '123456')
			ON CONFLICT (subdomain) DO UPDATE SET
				nama_pihak_1 = EXCLUDED.nama_pihak_1,
				nama_pihak_2 = EXCLUDED.nama_pihak_2,
				tanggal_acara = EXCLUDED.tanggal_acara,
				template = EXCLUDED.template,
				data_json = EXCLUDED.data_json,
				status = EXCLUDED.status,
				access_pin = EXCLUDED.access_pin
			RETURNING id, subdomain, status, template
	`;
	console.log('Demo terpasang:', JSON.stringify(rows[0]));
} catch (e) {
	console.error('Gagal seed demo:', e.message);
	process.exitCode = 1;
} finally {
	await sql.end();
}