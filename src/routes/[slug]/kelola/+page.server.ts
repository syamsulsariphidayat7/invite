import { error } from '@sveltejs/kit';
import { getInvitation } from '$lib/server/invitations';
import { resolveWedding } from '$lib/data/resolve';

const FALLBACK_SLUG = 'demo';

export const load = async ({ params }) => {
	const inv = await getInvitation(params.slug).catch(() => null);
	if (!inv && params.slug !== FALLBACK_SLUG) error(404, 'Undangan tidak ditemukan.');
	const resolved = resolveWedding((inv?.dataJson as Record<string, unknown>) ?? null);
	return { slug: inv?.subdomain ?? params.slug, resolved };
};
