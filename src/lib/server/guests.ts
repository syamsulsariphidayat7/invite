import { db } from './db';
import { env } from '$env/dynamic/private';

export interface GuestRow {
	id: string;
	invitationId: string;
	wedding: string;
	name: string;
	normalizedName: string;
	sent: boolean;
	sentAt: string | null;
	createdAt: string;
}

type DbGuestRow = {
	id: string;
	invitation_id: string;
	wedding: string;
	name: string;
	normalized_name: string;
	sent: boolean;
	sent_at: string | Date | null;
	created_at: string | Date;
};

let hasDb: boolean | null = null;
let initPromise: Promise<boolean> | null = null;

function rowToGuest(r: DbGuestRow): GuestRow {
	return {
		id: r.id,
		invitationId: r.invitation_id,
		wedding: r.wedding,
		name: r.name,
		normalizedName: r.normalized_name,
		sent: r.sent,
		sentAt: r.sent_at ? (r.sent_at instanceof Date ? r.sent_at.toISOString() : String(r.sent_at)) : null,
		createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at)
	};
}

async function init(): Promise<boolean> {
	if (hasDb !== null) return hasDb;
	if (!env.DATABASE_URL) {
		hasDb = false;
		return hasDb;
	}
	if (!initPromise) {
		initPromise = (async () => {
			const c = db();
			await c`ALTER TABLE invitations ADD COLUMN IF NOT EXISTS access_pin TEXT`;
			await c`ALTER TABLE invitations ADD COLUMN IF NOT EXISTS wa_template TEXT DEFAULT ''`;
			await c`
				CREATE TABLE IF NOT EXISTS invitation_guests (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
					wedding TEXT NOT NULL,
					name TEXT NOT NULL,
					normalized_name TEXT NOT NULL,
					sent BOOLEAN NOT NULL DEFAULT false,
					sent_at TIMESTAMPTZ,
					created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
					UNIQUE (invitation_id, normalized_name)
				)
			`;
			await c`CREATE INDEX IF NOT EXISTS idx_invitation_guests_wedding ON invitation_guests (wedding)`;
			await c`CREATE INDEX IF NOT EXISTS idx_invitation_guests_invitation_id ON invitation_guests (invitation_id)`;
			return true;
		})();
	}
	try {
		hasDb = await initPromise;
		return hasDb;
	} catch (e) {
		console.error('[guests] init failed:', e);
		hasDb = false;
		return false;
	}
}

function normalize(name: string): string {
	return name.trim().toLowerCase();
}

const memGuests: GuestRow[] = [];

export async function verifyPin(slug: string, pin: string): Promise<{ ok: boolean; invitationId?: string }> {
	if (!pin || pin.length < 4) return { ok: false };
	if (!(await init())) {
		if (pin === '000000') return { ok: true, invitationId: 'dev' };
		return { ok: false };
	}
	try {
		const rows = (await db()`SELECT id, access_pin FROM invitations WHERE subdomain = ${slug} LIMIT 1`) as unknown as {
			id: string;
			access_pin: string | null;
		}[];
		if (rows.length === 0) {
			if (pin === '000000') return { ok: true, invitationId: 'dev' };
			return { ok: false };
		}
		const stored = rows[0].access_pin;
		if (!stored) return { ok: true, invitationId: rows[0].id };
		if (stored === pin) return { ok: true, invitationId: rows[0].id };
		return { ok: false };
	} catch (e) {
		console.error('[guests] verifyPin failed:', e);
		return { ok: false };
	}
}

export async function getInvitationId(slug: string): Promise<string | null> {
	if (!(await init())) return null;
	try {
		const rows = (await db()`SELECT id FROM invitations WHERE subdomain = ${slug} LIMIT 1`) as unknown as {
			id: string;
		}[];
		return rows[0]?.id ?? null;
	} catch {
		return null;
	}
}

export async function listGuests(slug: string): Promise<GuestRow[]> {
	if (!(await init())) return memGuests.filter((g) => g.wedding === slug);
	try {
		const rows = (await db()`SELECT id, invitation_id, wedding, name, normalized_name, sent, sent_at, created_at FROM invitation_guests WHERE wedding = ${slug} ORDER BY created_at ASC`) as unknown as DbGuestRow[];
		return rows.map(rowToGuest);
	} catch (e) {
		console.error('[guests] list failed:', e);
		return [];
	}
}

export async function addGuests(slug: string, names: string[]): Promise<GuestRow[]> {
	const cleaned = names
		.map((n) => n.trim())
		.filter((n) => n.length >= 2 && n.length <= 100);
	if (cleaned.length === 0) return [];

	if (!(await init())) {
		const added: GuestRow[] = [];
		for (const n of cleaned) {
			const norm = normalize(n);
			if (memGuests.some((g) => g.wedding === slug && g.normalizedName === norm)) continue;
			const row: GuestRow = {
				id: crypto.randomUUID(),
				invitationId: 'dev',
				wedding: slug,
				name: n,
				normalizedName: norm,
				sent: false,
				sentAt: null,
				createdAt: new Date().toISOString()
			};
			memGuests.push(row);
			added.push(row);
		}
		return added;
	}

	let invitationId = await getInvitationId(slug);
	if (!invitationId) {
		try {
			const rows = (await db()`
				INSERT INTO invitations (subdomain, status, data_json)
				VALUES (${slug}, 'active', '{}'::jsonb)
				ON CONFLICT (subdomain) DO UPDATE SET subdomain = EXCLUDED.subdomain
				RETURNING id
			`) as unknown as { id: string }[];
			invitationId = rows[0]?.id ?? null;
		} catch {}
	}
	if (!invitationId) throw new Error('Invitation not found. Run db/schema.sql first.');

	const added: GuestRow[] = [];
	for (const n of cleaned) {
		const norm = normalize(n);
		try {
			const rows = (await db()`
				INSERT INTO invitation_guests (invitation_id, wedding, name, normalized_name)
				VALUES (${invitationId}, ${slug}, ${n}, ${norm})
				ON CONFLICT (invitation_id, normalized_name) DO NOTHING
				RETURNING id, invitation_id, wedding, name, normalized_name, sent, sent_at, created_at
			`) as unknown as DbGuestRow[];
			if (rows.length > 0) added.push(rowToGuest(rows[0]));
		} catch {}
	}
	return added;
}

export async function updateGuestSent(slug: string, id: string, sent: boolean): Promise<GuestRow | null> {
	if (!(await init())) {
		const g = memGuests.find((x) => x.id === id && x.wedding === slug);
		if (!g) return null;
		g.sent = sent;
		g.sentAt = sent ? new Date().toISOString() : null;
		return g;
	}
	try {
		if (sent) {
			const rows = (await db()`
				UPDATE invitation_guests SET sent = true, sent_at = now()
				WHERE id = ${id} AND wedding = ${slug}
				RETURNING id, invitation_id, wedding, name, normalized_name, sent, sent_at, created_at
			`) as unknown as DbGuestRow[];
			if (rows.length === 0) return null;
			return rowToGuest(rows[0]);
		} else {
			const rows = (await db()`
				UPDATE invitation_guests SET sent = false, sent_at = null
				WHERE id = ${id} AND wedding = ${slug}
				RETURNING id, invitation_id, wedding, name, normalized_name, sent, sent_at, created_at
			`) as unknown as DbGuestRow[];
			if (rows.length === 0) return null;
			return rowToGuest(rows[0]);
		}
	} catch (e) {
		console.error('[guests] updateSent failed:', e);
		return null;
	}
}

export async function deleteGuest(slug: string, id: string): Promise<boolean> {
	if (!(await init())) {
		const idx = memGuests.findIndex((g) => g.id === id && g.wedding === slug);
		if (idx === -1) return false;
		memGuests.splice(idx, 1);
		return true;
	}
	try {
		const res = await db()`DELETE FROM invitation_guests WHERE id = ${id} AND wedding = ${slug}`;
		return res.count > 0;
	} catch {
		return false;
	}
}

export async function deleteAllGuests(slug: string): Promise<number> {
	if (!(await init())) {
		const count = memGuests.filter((g) => g.wedding === slug).length;
		for (let i = memGuests.length - 1; i >= 0; i--) {
			if (memGuests[i].wedding === slug) memGuests.splice(i, 1);
		}
		return count;
	}
	try {
		const res = await db()`DELETE FROM invitation_guests WHERE wedding = ${slug}`;
		return res.count;
	} catch {
		return 0;
	}
}
