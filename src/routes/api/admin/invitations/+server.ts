import { json, error } from '@sveltejs/kit';
import { listInvitations, getInvitation, createInvitation, updateInvitation, deleteInvitation, validateSubdomain } from '$lib/server/invitations';

export async function GET({ locals }) {
	if (!locals.adminAuthed) error(401, 'Unauthorized');
	const items = await listInvitations();
	return json({ items });
}

export async function POST({ request, locals }) {
	if (!locals.adminAuthed) error(401, 'Unauthorized');
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Data tidak valid.');
	}
	const { subdomain, namaPihak1, namaPihak2, tanggalAcara, template, dataJson, status, accessPin, waTemplate } = (body ?? {}) as Record<string, unknown>;
	if (typeof subdomain !== 'string' || !subdomain.trim()) error(400, 'Link undangan wajib.');
	const sd = subdomain.trim().toLowerCase();
	const v = validateSubdomain(sd);
	if (v) error(400, v);
	if (status != null && typeof status !== 'string') error(400, 'status tidak valid.');
	if (status && !['draft', 'active', 'expired'].includes(status as string)) error(400, 'status harus draft/active/expired.');
	if (dataJson != null && (typeof dataJson !== 'object' || Array.isArray(dataJson))) error(400, 'Data tidak valid.');
	try {
		const row = await createInvitation({
			subdomain: sd,
			namaPihak1: typeof namaPihak1 === 'string' ? namaPihak1 : undefined,
			namaPihak2: typeof namaPihak2 === 'string' ? namaPihak2 : undefined,
			tanggalAcara: typeof tanggalAcara === 'string' ? tanggalAcara : tanggalAcara === null ? null : undefined,
			template: typeof template === 'string' ? template : undefined,
			dataJson: (dataJson as Record<string, unknown>) ?? undefined,
			status: typeof status === 'string' ? status : undefined,
			accessPin: typeof accessPin === 'string' ? accessPin : accessPin === null ? null : undefined,
			waTemplate: typeof waTemplate === 'string' ? waTemplate : waTemplate === null ? null : undefined
		});
		return json({ item: row }, { status: 201 });
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : String(e);
		if (msg.includes('duplicate') || msg.includes('unique')) error(409, 'Link undangan sudah dipakai.');
		throw e;
	}
}

export async function PATCH({ request, locals, url }) {
	if (!locals.adminAuthed) error(401, 'Unauthorized');
	const subdomain = url.searchParams.get('subdomain')?.trim().toLowerCase();
	if (!subdomain) error(400, 'Link undangan wajib.');
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Data tidak valid.');
	}
	const patch = (body ?? {}) as Record<string, unknown>;
	if (patch.status && typeof patch.status === 'string' && !['draft', 'active', 'expired'].includes(patch.status)) error(400, 'status tidak valid.');
	if (patch.dataJson != null && (typeof patch.dataJson !== 'object' || Array.isArray(patch.dataJson))) error(400, 'Data tidak valid.');
	const row = await updateInvitation(subdomain, {
		namaPihak1: typeof patch.namaPihak1 === 'string' ? patch.namaPihak1 : undefined,
		namaPihak2: typeof patch.namaPihak2 === 'string' ? patch.namaPihak2 : undefined,
		tanggalAcara: patch.tanggalAcara === null ? null : typeof patch.tanggalAcara === 'string' ? patch.tanggalAcara : undefined,
		template: typeof patch.template === 'string' ? patch.template : undefined,
		dataJson: (patch.dataJson as Record<string, unknown>) ?? undefined,
		status: typeof patch.status === 'string' ? patch.status : undefined,
		accessPin: typeof patch.accessPin === 'string' ? patch.accessPin : patch.accessPin === null ? null : undefined,
		waTemplate: typeof patch.waTemplate === 'string' ? patch.waTemplate : patch.waTemplate === null ? null : undefined
	});
	if (!row) error(404, 'Undangan tidak ditemukan.');
	return json({ item: row });
}

export async function DELETE({ url, locals }) {
	if (!locals.adminAuthed) error(401, 'Unauthorized');
	const subdomain = url.searchParams.get('subdomain')?.trim().toLowerCase();
	if (!subdomain) error(400, 'Link undangan wajib.');
	const ok = await deleteInvitation(subdomain);
	if (!ok) error(404, 'Undangan tidak ditemukan.');
	return json({ ok: true });
}
