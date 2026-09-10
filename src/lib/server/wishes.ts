// Repository ucapan tamu.
// - Jika DATABASE_URL tersedia → simpan di Postgres (Supabase via pooler Supavisor,
//   tetap kompatibel dengan connection string Neon) menggunakan driver `postgres`
//   (postgres.js) dengan `prepare: false` — wajib untuk pooler mode transaksi.
// - Jika tidak → fallback ke memori proses (data hilang saat server restart;
//   cukup untuk dev/pratinjau sebelum DATABASE_URL dipasang).
//
// Kolom `wedding` menyimpan slug undangan (siap multi-undangan / SaaS multi-tema).
import { db } from './db';
import { env } from '$env/dynamic/private';
import type { Wish } from '$lib/data/wedding';

export interface NewWish {
	name: string;
	attendance: 'hadir' | 'tidak' | '';
	message: string;
	guests: number;
}

type Row = {
	id: number;
	name: string;
	attendance: string;
	message: string;
	guests: number;
	created_at: string | Date;
};

let inMemory: Wish[] = [];
let seq = 1;
let hasDb: boolean | null = null;
let initPromise: Promise<boolean> | null = null;

function rowToWish(r: Row): Wish {
	const raw = r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at);
	return {
		id: r.id,
		name: r.name,
		attendance: r.attendance === 'hadir' || r.attendance === 'tidak' ? r.attendance : '',
		message: r.message,
		guests: Number(r.guests) || (r.attendance === 'hadir' ? 1 : 0),
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
			const c = db();
			await c`
				CREATE TABLE IF NOT EXISTS guest_wishes (
					id BIGSERIAL PRIMARY KEY,
					wedding TEXT NOT NULL DEFAULT 'ruhaeni-roni',
					name TEXT NOT NULL,
					attendance TEXT NOT NULL DEFAULT '',
					message TEXT NOT NULL,
					guests INT NOT NULL DEFAULT 0,
					created_at TIMESTAMPTZ NOT NULL DEFAULT now()
				)
			`;
			await c`ALTER TABLE guest_wishes ADD COLUMN IF NOT EXISTS guests INT NOT NULL DEFAULT 0`;
			return true;
		})();
	}
	try {
		hasDb = await initPromise;
		return hasDb;
	} catch (e) {
		console.error('[wishes] Gagal inisialisasi database, memakai in-memory:', e);
		hasDb = false;
		return false;
	}
}

/** Daftar ucapan terbaru (maks `limit` + offset untuk paging). */
export async function listWishes(weddingSlug: string, limit = 30, offset = 0): Promise<Wish[]> {
	return (await listWishesWithCount(weddingSlug, limit, offset)).wishes;
}

/** Daftar ucapan + total dalam SATU query (COUNT(*) OVER()) — hemat round-trip DB. */
export async function listWishesWithCount(
	weddingSlug: string,
	limit = 30,
	offset = 0
): Promise<{ wishes: Wish[]; total: number }> {
	const lim = Math.min(100, Math.max(1, Math.floor(limit) || 30));
	const off = Math.max(0, Math.floor(offset) || 0);
	if (!(await init())) {
		return { wishes: inMemory.slice(off, off + lim), total: inMemory.length };
	}
	try {
		const rows = (await db()`
			SELECT id, name, attendance, message, guests, created_at, COUNT(*) OVER()::int AS total
			FROM guest_wishes
			WHERE wedding = ${weddingSlug}
			ORDER BY created_at DESC
			LIMIT ${lim} OFFSET ${off}
		`) as unknown as (Row & { total: number })[];
		return { wishes: rows.map(rowToWish), total: Number(rows[0]?.total ?? 0) };
	} catch (e) {
		console.error('[wishes] Gagal membaca database:', e);
		return { wishes: inMemory.slice(off, off + lim), total: inMemory.length };
	}
}

/** Simpan ucapan baru; mengembalikan data tersimpan. */
export async function addWish(weddingSlug: string, input: NewWish): Promise<Wish> {
	const wish: Wish = {
		id: 0,
		name: input.name.trim(),
		attendance: input.attendance,
		message: input.message.trim(),
		guests:
			input.attendance === 'hadir' ? Math.max(1, Math.min(10, Math.floor(input.guests) || 1)) : 0,
		createdAt: new Date().toISOString()
	};
	if (!(await init())) {
		wish.id = seq++;
		inMemory = [wish, ...inMemory];
		return wish;
	}
	try {
		const rows = (await db()`
			INSERT INTO guest_wishes (wedding, name, attendance, message, guests)
			VALUES (${weddingSlug}, ${wish.name}, ${wish.attendance}, ${wish.message}, ${wish.guests})
			RETURNING id, name, attendance, message, guests, created_at
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
		const rows = (await db()`
			SELECT COUNT(*)::int AS n FROM guest_wishes WHERE wedding = ${weddingSlug}
		`) as unknown as { n: number }[];
		return rows[0]?.n ?? 0;
	} catch (e) {
		console.error('[wishes] Gagal menghitung database:', e);
		return inMemory.length;
	}
}
