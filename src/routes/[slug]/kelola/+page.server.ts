import { error } from '@sveltejs/kit';
import { getInvitation } from '$lib/server/invitations';
import { wedding } from '$lib/data/wedding';

export const load = async ({ params }) => {
	const inv = await getInvitation(params.slug).catch(() => null);
	if (!inv && params.slug !== wedding.slug) error(404, 'Undangan tidak ditemukan.');
	return { slug: inv?.subdomain ?? params.slug };
};
