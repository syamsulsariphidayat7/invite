import { db } from './db';
import { env } from '$env/dynamic/private';

export interface InvitationRow {
	id: string;
	subdomain: string;
	namaPihak1: string;
	namaPihak2: string;
	tanggalAcara: string | null;
	template: string;
	dataJson: Record<string, unknown>;
	status: string;
	ownerEmail: string | null;
	accessPin: string | null;
	waTemplate: string | null;
	createdAt: string;
	updatedAt: string;
}

type DbRow = {
	id: string;
	subdomain: string;
	nama_pihak_1: string;
	nama_pihak_2: string;
	tanggal_acara: string | Date | null;
	template: string;
	data_json: Record<string, unknown>;
	status: string;
	owner_email: string | null;
	access_pin: string | null;
	wa_template: string | null;
	created_at: string | Date;
	updated_at: string | Date;
};


function toRow(r: DbRow): InvitationRow {
	return {
		id: r.id,
		subdomain: r.subdomain,
		namaPihak1: r.nama_pihak_1,
		namaPihak2: r.nama_pihak_2,
		tanggalAcara: r.tanggal_acara ? (r.tanggal_acara instanceof Date ? r.tanggal_acara.toISOString().slice(0, 10) : String(r.tanggal_acara).slice(0, 10)) : null,
		template: r.template,
		dataJson: r.data_json ?? {},
		status: r.status,
		ownerEmail: r.owner_email,
		accessPin: r.access_pin,
		waTemplate: r.wa_template,
		createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
		updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at)
	};
}

export async function listInvitations(): Promise<InvitationRow[]> {
	if (!env.DATABASE_URL) return [];
	const rows = (await db()`SELECT id, subdomain, nama_pihak_1, nama_pihak_2, tanggal_acara, template, data_json, status, owner_email, access_pin, wa_template, created_at, updated_at FROM invitations ORDER BY created_at DESC`) as unknown as DbRow[];
	return rows.map(toRow);
}

export async function getInvitation(subdomain: string): Promise<InvitationRow | null> {
	if (!env.DATABASE_URL) return null;
	const rows = (await db()`SELECT id, subdomain, nama_pihak_1, nama_pihak_2, tanggal_acara, template, data_json, status, owner_email, access_pin, wa_template, created_at, updated_at FROM invitations WHERE subdomain = ${subdomain} LIMIT 1`) as unknown as DbRow[];
	if (rows.length === 0) return null;
	return toRow(rows[0]);
}

export async function createInvitation(input: {
	subdomain: string;
	namaPihak1?: string;
	namaPihak2?: string;
	tanggalAcara?: string | null;
	template?: string;
	dataJson?: Record<string, unknown>;
	status?: string;
	accessPin?: string | null;
	waTemplate?: string | null;
}): Promise<InvitationRow> {
	const rows = (await db()`
		INSERT INTO invitations (subdomain, nama_pihak_1, nama_pihak_2, tanggal_acara, template, data_json, status, access_pin, wa_template)
		VALUES (${input.subdomain}, ${input.namaPihak1 ?? ''}, ${input.namaPihak2 ?? ''}, ${input.tanggalAcara ?? null}, ${input.template ?? 'classic'}, ${JSON.stringify(input.dataJson ?? {})}::jsonb, ${input.status ?? 'draft'}, ${input.accessPin ?? null}, ${input.waTemplate ?? null})
		RETURNING id, subdomain, nama_pihak_1, nama_pihak_2, tanggal_acara, template, data_json, status, owner_email, access_pin, wa_template, created_at, updated_at
	`) as unknown as DbRow[];
	return toRow(rows[0]);
}

export async function updateInvitation(
	subdomain: string,
	patch: Partial<{ namaPihak1: string; namaPihak2: string; tanggalAcara: string | null; template: string; dataJson: Record<string, unknown>; status: string; accessPin: string | null; waTemplate: string | null }>
): Promise<InvitationRow | null> {
	const current = await getInvitation(subdomain);
	if (!current) return null;
	const next = {
		namaPihak1: patch.namaPihak1 ?? current.namaPihak1,
		namaPihak2: patch.namaPihak2 ?? current.namaPihak2,
		tanggalAcara: patch.tanggalAcara !== undefined ? patch.tanggalAcara : current.tanggalAcara,
		template: patch.template ?? current.template,
		dataJson: patch.dataJson ?? current.dataJson,
		status: patch.status ?? current.status,
		accessPin: patch.accessPin !== undefined ? patch.accessPin : current.accessPin,
		waTemplate: patch.waTemplate !== undefined ? patch.waTemplate : current.waTemplate
	};
	const rows = (await db()`
		UPDATE invitations SET
			nama_pihak_1 = ${next.namaPihak1},
			nama_pihak_2 = ${next.namaPihak2},
			tanggal_acara = ${next.tanggalAcara},
			template = ${next.template},
			data_json = ${JSON.stringify(next.dataJson)}::jsonb,
			status = ${next.status},
			access_pin = ${next.accessPin},
			wa_template = ${next.waTemplate}
		WHERE subdomain = ${subdomain}
		RETURNING id, subdomain, nama_pihak_1, nama_pihak_2, tanggal_acara, template, data_json, status, owner_email, access_pin, wa_template, created_at, updated_at
	`) as unknown as DbRow[];
	if (rows.length === 0) return null;
	return toRow(rows[0]);
}

export async function deleteInvitation(subdomain: string): Promise<boolean> {
	if (!env.DATABASE_URL) return false;
	const res = await db()`DELETE FROM invitations WHERE subdomain = ${subdomain}`;
	return res.count > 0;
}

export function validateSubdomain(s: string): string | null {
	if (!s || s.length < 3 || s.length > 63) return 'Subdomain 3-63 karakter.';
	if (!/^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/.test(s)) return 'Format subdomain tidak valid (huruf kecil, angka, strip).';
	const reserved = new Set(['www', 'admin', 'api', 'app', 'invite', 'mail', 'ftp', 'blog', 'shop', 'staging', 'test', 'dev', 'tamu', 'kelola']);
	if (reserved.has(s)) return `Subdomain "${s}" tidak boleh dipakai.`;
	return null;
}
