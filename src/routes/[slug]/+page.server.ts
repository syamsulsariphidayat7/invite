import { error } from '@sveltejs/kit';
import { listWishes, countWishes } from '$lib/server/wishes';
import { getInvitation } from '$lib/server/invitations';
import { wedding } from '$lib/data/wedding';
import { resolveWedding } from '$lib/data/resolve';

export const load = async ({ params }) => {
	const inv = await getInvitation(params.slug).catch(() => null);
	if (!inv && params.slug !== wedding.slug) error(404, 'Undangan tidak ditemukan.');
	if (inv && inv.status === 'expired') error(410, 'Undangan telah berakhir.');
	const slug = inv?.subdomain ?? params.slug;
	const [wishes, total] = await Promise.all([listWishes(slug, 30), countWishes(slug)]);
	const gallery = inv?.dataJson && Array.isArray((inv.dataJson as Record<string, unknown>).gallery) ? ((inv.dataJson as Record<string, unknown>).gallery as string[]) : null;
	const resolved = resolveWedding((inv?.dataJson as Record<string, unknown>) ?? null);
	return { wishes, total, slug, gallery, resolved, dataJson: inv?.dataJson ?? null, invitation: inv ? { subdomain: inv.subdomain, status: inv.status } : null };
};
