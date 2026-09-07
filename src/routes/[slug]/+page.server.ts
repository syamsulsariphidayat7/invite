import { error } from '@sveltejs/kit';
import { listWishes, countWishes } from '$lib/server/wishes';
import { getInvitation } from '$lib/server/invitations';
import { wedding } from '$lib/data/wedding';
import { resolveWedding } from '$lib/data/resolve';

export const load = async ({ params }) => {
	if (params.slug !== wedding.slug) {
		error(404, 'Undangan tidak ditemukan.');
	}
	const [wishes, total, inv] = await Promise.all([listWishes(params.slug), countWishes(params.slug), getInvitation(params.slug).catch(() => null)]);
	const gallery = inv?.dataJson && Array.isArray((inv.dataJson as Record<string, unknown>).gallery) ? ((inv.dataJson as Record<string, unknown>).gallery as string[]) : null;
	const resolved = resolveWedding((inv?.dataJson as Record<string, unknown>) ?? null);
	return { wishes, total, slug: params.slug, gallery, resolved, dataJson: inv?.dataJson ?? null };
};
