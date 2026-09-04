// Repository ucapan tamu.
// - Jika DATABASE_URL tersedia → simpan di Neon Postgres (serverless driver).
// - Jika tidak → fallback ke memori proses (data hilang saat server restart;
//   cukup untuk pramuka/dev sebelum DATABASE_URL dipasang).
//
// Kolom `wedding` dibuat sejak awal supaya siap multi-undangan (SaaS multi-tema).
import { neon } from '@neondatabase/serverless';
import { env } from '$env/dynamic/private';
import type { Wish } from '$lib/data/wedding';

export interface NewWish {
	name: string;
	attendance: 'hadir' | 'tidak' | '';
	message: string;
}

type Row = { id: number; name: string; attendance: string; message: string; created_at: string | Date };

let inMemory: Wish[] = [];
let seq = 1;
let hasDb: boolean | null = null;
let initPromise: Promise<void> | null = null;

function rowToWish(r: Row): Wish {
	const raw = r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at);
	return {
		id: r.id,
		name: r.name,
		attendance: r.attendance === 'hadir' || r.attendance === 'tidak' ? r.attendance : '',
		message: r.message,
		createdAt: raw
	};
}

async function init(): Promise<boolean> {
	if (hasDb !== null) return hasDb;
	if (!env.DATABASE_URL) {
		console.warn('[wishes] DATABASE_URL tidak ada — memakai penyimpanan in-memory (sementara).');
		hasDb = false;
		return hasDb;
	}
	if (!initPromise) {
		initPromise = (async () => {
			const sql = neon(env.DATABASE_URL!);
			await sql`
				CREATE TABLE IF NOT EXISTS guest_wishes (
					id BIGSERIAL PRIMARY KEY,
					wedding TEXT NOT NULL DEFAULT 'ruhaeni-roni',
					name TEXT NOT NULL,
					attendance TEXT NOT NULL DEFAULT '',
					message TEXT NOT NULL,
					created_at TIMESTAMPTZ NOT NULL DEFAULT now()
				)
			`;
			hasDb = true;
		})();
	}
	try {
		await initPromise;
		return hasDb!;
	} catch (e) {
		console.error('[wishes] Gagal inisialisasi database, memakai in-memory:', e);
		hasDb = false;
		return false;
	}
}

/** Daftar ucapan terbaru (maks `limit`), diurutkan terbaru dulu. */
export async function listWishes(weddingSlug: string, limit = 30): Promise<Wish[]> {
	if (!(await init())) {
		return inMemory.slice(0, limit);
	}
	try {
		const sql = neon(env.DATABASE_URL!);
			const rows = (await sql`
				SELECT id, name, attendance, message, created_at
				FROM guest_wishes
				WHERE wedding = ${weddingSlug}
				ORDER BY created_at DESC
				LIMIT ${limit}
			`) as unknown as Row[];
			return rows.map(rowToWish);
		} catch (e) {
			console.error('[wishes] Gagal membaca database:', e);
			return inMemory.slice(0, limit);
		}
}

/** Simpan ucapan baru; mengembalikan data tersimpan. */
export async function addWish(weddingSlug: string, input: NewWish): Promise<Wish> {
	const wish: Wish = {
		id: 0,
		name: input.name.trim(),
		attendance: input.attendance,
		message: input.message.trim(),
		createdAt: new Date().toISOString()
	};
	if (!(await init())) {
		wish.id = seq++;
		inMemory = [wish, ...inMemory];
		return wish;
	}
	try {
		const sql = neon(env.DATABASE_URL!);
			const rows = (await sql`
				INSERT INTO guest_wishes (wedding, name, attendance, message)
				VALUES (${weddingSlug}, ${wish.name}, ${wish.attendance}, ${wish.message})
				RETURNING id, name, attendance, message, created_at
			`) as unknown as Row[];
			return rowToWish(rows[0]);
		} catch (e) {
			console.error('[wishes] Gagal menyimpan ke database:', e);
			// Jangan kehilangan ucapan tamu — tampung sementara di memori.
			wish.id = seq++;
			inMemory = [wish, ...inMemory];
			return wish;
		}
}

/** Total ucapan (untuk tampilan "N Ucapan"). */
export async function countWishes(weddingSlug: string): Promise<number> {
	if (!(await init())) return inMemory.length;
	try {
		const sql = neon(env.DATABASE_URL!);
			const rows = (await sql`SELECT COUNT(*)::int AS n FROM guest_wishes WHERE wedding = ${weddingSlug}`) as unknown as {
				n: number;
			}[];
			return rows[0]?.n ?? 0;
		} catch (e) {
			console.error('[wishes] Gagal menghitung database:', e);
			return inMemory.length;
		}
}
