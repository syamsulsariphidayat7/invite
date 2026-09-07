// Koneksi Postgres terpusat (postgres.js) — satu-satunya tempat konfigurasi DB.
// - Parser DATABASE_URL manual (bukan `new URL()` driver): password berkarakter
//   spesial seperti `?` memutus parsing URL → config object tahan karakter apa pun
//   (regex greedy ke `@` terakhir + decode bila ada percent-encoding).
// - `prepare: false` wajib untuk pooler Supavisor (mode transaksi).
// - Kompatibel dengan connection string Supabase pooler maupun Neon.
import postgres from 'postgres';
import { env } from '$env/dynamic/private';

export function dbConfigFromUrl(url: string) {
	const m = url.match(/postgresql:\/\/([^:]+):(.+)@([^:/]+):(\d+)\/([^?\s]+)/);
	if (!m) return null;
	let password = m[2];
	try {
		if (password.includes('%')) password = decodeURIComponent(password);
	} catch {
		/* biarkan apa adanya */
	}
	return { user: m[1], password, host: m[3], port: Number(m[4]), database: m[5] };
}

let sql: postgres.Sql | null = null;

export function db(): postgres.Sql {
	if (!sql) {
		const opts = { prepare: false, max: 5, idle_timeout: 20, connect_timeout: 10 };
		const cfg = dbConfigFromUrl(env.DATABASE_URL!);
		sql = cfg ? postgres({ ...cfg, ...opts }) : postgres(env.DATABASE_URL!, opts);
	}
	return sql;
}