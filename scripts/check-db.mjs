// Diagnosa koneksi DB: apa yang dilihat node, dan apakah koneksi bisa jalan.
// Jalankan: node scripts/check-db.mjs   (atau: node --env-file=.env scripts/check-db.mjs)
import fs from 'node:fs';
import postgres from 'postgres';

// 1. Apa yang ada di process env (mis. dari --env-file atau shell)
const fromEnv = process.env.DATABASE_URL || '';
console.log('process.env.DATABASE_URL:', fromEnv ? fromEnv.replace(/:[^@]*@/, ':***@') : '(kosong)');

// 2. Apa yang tertulis di file .env (baris terakhir yang cocok menang, sama seperti dotenv)
let fileUrl = '';
if (fs.existsSync('.env')) {
	const matches = [...fs.readFileSync('.env', 'utf8').matchAll(/^DATABASE_URL=(.*)$/gm)];
	if (matches.length) fileUrl = matches.at(-1)[1].trim().replace(/^["']|["']$/g, '');
}
console.log('.env file DATABASE_URL  :', fileUrl ? fileUrl.replace(/:[^@]*@/, ':***@') : '(kosong)');
console.log('sama?', fromEnv === fileUrl ? 'YA' : 'TIDAK ← inilah masalahnya');

// 3. Tes koneksi dari file URL via config object (bebas masalah parsing/escape URL)
function parse(url) {
	const m = url.match(/postgresql:\/\/([^:]+):(.+)@([^:/]+):(\d+)\/([^?]+)/);
	if (!m) return null;
	return { user: m[1], password: m[2], host: m[3], port: Number(m[4]), database: m[5] };
}

const cfg = parse(fileUrl || fromEnv);
if (!cfg) {
	console.error('URL tidak bisa diparse — periksa format.');
	process.exit(1);
}
console.log(`mencoba konek → ${cfg.host}:${cfg.port} user=${cfg.user}`);

try {
	const sql = postgres({ ...cfg, prepare: false, max: 1, ssl: 'prefer', connect_timeout: 10 });
	const t = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1`;
	console.log('✅ KONEKSI OK — tabel public:', t.map((r) => r.table_name).join(', ') || '(kosong)');
	await sql.end();
} catch (e) {
	console.error('❌ GAGAL:', e.message);
	process.exit(1);
}
