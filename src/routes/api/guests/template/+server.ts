import { json, error } from '@sveltejs/kit';
import { getInvitation, updateInvitation } from '$lib/server/invitations';
import { verifyPin } from '$lib/server/guests';
export async function GET({ url }) {
	const slug = url.searchParams.get('slug')?.trim() ?? '';
	if (!slug) return json({ waTemplate: null });
	const inv = await getInvitation(slug).catch(() => null);
	if (!inv) return json({ waTemplate: null });
	return json({ waTemplate: inv.waTemplate ?? null });
}
export async function POST({ request, url }) {
	const slug = url.searchParams.get('slug')?.trim() ?? '';
	if (!slug) error(400, 'Undangan wajib.');
	const pin = request.headers.get('x-pin')?.trim() ?? url.searchParams.get('pin')?.trim() ?? '';
	const auth = await verifyPin(slug, pin);
	if (!auth.ok) error(401, 'PIN salah atau tidak diberikan.');
	let body: unknown;
	try { body = await request.json(); } catch { error(400, 'Data tidak valid.'); }
	const waTemplate = (body as Record<string, unknown>).waTemplate;
	if (typeof waTemplate !== 'string') error(400, 'Template wajib.');
	const t = waTemplate.trim();
	if (!t) error(400, 'Template tidak boleh kosong.');
	if (t.length > 2000) error(400, 'Template maksimal 2000 karakter.');
	if (!t.includes('{link}')) error(400, 'Template harus mengandung {link} agar tamu dapat link undangan.');
	const row = await updateInvitation(slug, { waTemplate: t });
	if (!row) error(404, 'Undangan tidak ditemukan.');
	return json({ waTemplate: row.waTemplate });
}
