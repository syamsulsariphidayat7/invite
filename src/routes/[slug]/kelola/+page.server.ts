import { error } from '@sveltejs/kit';
import { getInvitation } from '$lib/server/invitations';

const FALLBACK_SLUG = 'demo';

export const load = async ({ params }) => {
	const inv = await getInvitation(params.slug).catch(() => null);
	if (!inv && params.slug !== FALLBACK_SLUG) error(404, 'Undangan tidak ditemukan.');
	return { slug: inv?.subdomain ?? params.slug };
};
