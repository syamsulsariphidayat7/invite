import { redirect } from '@sveltejs/kit';
import { wedding } from '$lib/data/wedding';
import { listInvitations } from '$lib/server/invitations';

export const load = async ({ url }) => {
	if (url.searchParams.get('preview') === '1') redirect(307, `/${wedding.slug}${url.search}`);
	try {
		const all = await listInvitations();
		const active = all.filter((i) => i.status === 'active');
		if (active.length > 1) {
			return { invitations: active.map((i) => ({ subdomain: i.subdomain, namaPihak1: i.namaPihak1, namaPihak2: i.namaPihak2, tanggalAcara: i.tanggalAcara })) };
		}
		if (active.length === 1 && active[0].subdomain !== wedding.slug) {
			redirect(307, `/${active[0].subdomain}${url.search}`);
		}
	} catch {}
	redirect(307, `/${wedding.slug}${url.search}`);
};
