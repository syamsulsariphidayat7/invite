import { db } from './db';

export interface BackupPayload {
	version: number;
	created_at: string;
	tables: {
		invitations: unknown[];
		guest_wishes: unknown[];
		invitation_guests: unknown[];
	};
	counts: { invitations: number; guest_wishes: number; invitation_guests: number };
}

export async function createBackup(): Promise<BackupPayload> {
	const sql = db();
	const [invitations, wishes, guests] = await Promise.all([
		sql`SELECT id, subdomain, nama_pihak_1, nama_pihak_2, tanggal_acara, template, data_json, status, owner_email, access_pin, wa_template, created_at, updated_at FROM invitations ORDER BY created_at ASC`,
		sql`SELECT id, wedding, name, attendance, message, guests, created_at FROM guest_wishes ORDER BY created_at ASC`,
		sql`SELECT id, invitation_id, wedding, name, normalized_name, sent, sent_at, created_at FROM invitation_guests ORDER BY created_at ASC`
	]);
	return {
		version: 1,
		created_at: new Date().toISOString(),
		tables: {
			invitations: invitations as unknown[],
			guest_wishes: wishes as unknown[],
			invitation_guests: guests as unknown[]
		},
		counts: {
			invitations: (invitations as unknown[]).length,
			guest_wishes: (wishes as unknown[]).length,
			invitation_guests: (guests as unknown[]).length
		}
	};
}

type RestoreResult = {
	invitations: { inserted: number; skipped: number };
	guest_wishes: { inserted: number; skipped: number };
	invitation_guests: { inserted: number; skipped: number };
};

export async function restoreBackup(payload: unknown): Promise<RestoreResult> {
	if (!payload || typeof payload !== 'object') throw new Error('Format backup tidak valid.');
	const p = payload as Record<string, unknown>;
	if (p.version !== 1) throw new Error('Versi backup tidak didukung.');
	const tables = p.tables as Record<string, unknown> | undefined;
	if (!tables || typeof tables !== 'object') throw new Error('Backup rusak: tables hilang.');
	const invitations = Array.isArray(tables.invitations) ? (tables.invitations as Record<string, unknown>[]) : null;
	const wishes = Array.isArray(tables.guest_wishes) ? (tables.guest_wishes as Record<string, unknown>[]) : null;
	const guests = Array.isArray(tables.invitation_guests) ? (tables.invitation_guests as Record<string, unknown>[]) : null;
	if (!invitations || !wishes || !guests) throw new Error('Backup rusak: tabel tidak lengkap.');

	const sql = db();
	const result: RestoreResult = {
		invitations: { inserted: 0, skipped: 0 },
		guest_wishes: { inserted: 0, skipped: 0 },
		invitation_guests: { inserted: 0, skipped: 0 }
	};
	const idMap = new Map<string, string>();

	await sql.begin(async (tx) => {
		for (const row of invitations) {
			const subdomain = typeof row.subdomain === 'string' ? row.subdomain.trim().toLowerCase() : '';
			if (!subdomain) {
				result.invitations.skipped++;
				continue;
			}
			if (typeof row.data_json !== 'object' || row.data_json === null || Array.isArray(row.data_json)) {
				result.invitations.skipped++;
				continue;
			}
			const existing = (await tx`SELECT id FROM invitations WHERE subdomain = ${subdomain} LIMIT 1`) as unknown as { id: string }[];
			if (existing.length > 0) {
				if (typeof row.id === 'string') idMap.set(row.id, existing[0].id);
				result.invitations.skipped++;
				continue;
			}
			if (typeof row.id === 'string') {
				const byId = (await tx`SELECT id FROM invitations WHERE id = ${row.id} LIMIT 1`) as unknown as { id: string }[];
				if (byId.length > 0) {
					idMap.set(row.id, byId[0].id);
					result.invitations.skipped++;
					continue;
				}
			}
			try {
				const inserted = (await tx`
					INSERT INTO invitations (id, subdomain, nama_pihak_1, nama_pihak_2, tanggal_acara, template, data_json, status, owner_email, access_pin, wa_template, created_at, updated_at)
					VALUES (${row.id as string}, ${subdomain}, ${(row.nama_pihak_1 as string) ?? ''}, ${(row.nama_pihak_2 as string) ?? ''}, ${row.tanggal_acara as string | null ?? null}, ${(row.template as string) ?? 'classic'}, ${tx.json(row.data_json as never)}, ${(row.status as string) ?? 'draft'}, ${(row.owner_email as string | null) ?? null}, ${(row.access_pin as string | null) ?? null}, ${(row.wa_template as string | null) ?? null}, ${(row.created_at as string) ?? new Date().toISOString()}, ${(row.updated_at as string) ?? new Date().toISOString()})
					ON CONFLICT (subdomain) DO NOTHING RETURNING id
				`) as unknown as { id: string }[];
				if (inserted.length > 0) {
					if (typeof row.id === 'string') idMap.set(row.id, inserted[0].id);
					result.invitations.inserted++;
				} else {
					const e2 = (await tx`SELECT id FROM invitations WHERE subdomain = ${subdomain} LIMIT 1`) as unknown as { id: string }[];
					if (e2.length > 0 && typeof row.id === 'string') idMap.set(row.id, e2[0].id);
					result.invitations.skipped++;
				}
			} catch {
				result.invitations.skipped++;
			}
		}

		for (const w of wishes) {
			if (typeof w.wedding !== 'string' || typeof w.name !== 'string' || typeof w.message !== 'string') {
				result.guest_wishes.skipped++;
				continue;
			}
			try {
				const r = (await tx`
					INSERT INTO guest_wishes (id, wedding, name, attendance, message, guests, created_at)
					VALUES (${w.id as number}, ${w.wedding as string}, ${w.name as string}, ${(w.attendance as string) ?? ''}, ${w.message as string}, ${(w.guests as number) ?? 0}, ${(w.created_at as string) ?? new Date().toISOString()})
					ON CONFLICT (id) DO NOTHING RETURNING id
				`) as unknown as { id: number }[];
				if (r.length > 0) result.guest_wishes.inserted++;
				else result.guest_wishes.skipped++;
			} catch {
				result.guest_wishes.skipped++;
			}
		}

		for (const g of guests) {
			const rawInvitationId = typeof g.invitation_id === 'string' ? g.invitation_id : '';
			const mappedInvitationId = (rawInvitationId && idMap.get(rawInvitationId)) || rawInvitationId;
			if (!mappedInvitationId || typeof g.wedding !== 'string' || typeof g.name !== 'string' || typeof g.normalized_name !== 'string') {
				result.invitation_guests.skipped++;
				continue;
			}
			const invExists = (await tx`SELECT id FROM invitations WHERE id = ${mappedInvitationId} LIMIT 1`) as unknown as { id: string }[];
			if (invExists.length === 0) {
				result.invitation_guests.skipped++;
				continue;
			}
			try {
				const r = (await tx`
					INSERT INTO invitation_guests (invitation_id, wedding, name, normalized_name, sent, sent_at, created_at)
					VALUES (${mappedInvitationId}, ${g.wedding as string}, ${g.name as string}, ${g.normalized_name as string}, ${(g.sent as boolean) ?? false}, ${(g.sent_at as string | null) ?? null}, ${(g.created_at as string) ?? new Date().toISOString()})
					ON CONFLICT (invitation_id, normalized_name) DO NOTHING RETURNING id
				`) as unknown as { id: string }[];
				if (r.length > 0) result.invitation_guests.inserted++;
				else result.invitation_guests.skipped++;
			} catch {
				result.invitation_guests.skipped++;
			}
		}
	});

	return result;
}
