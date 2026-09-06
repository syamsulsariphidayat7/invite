import { error } from '@sveltejs/kit';
import { listWishes, countWishes } from '$lib/server/wishes';
import { wedding } from '$lib/data/wedding';

export const load = async ({ params }) => {
	if (params.slug !== wedding.slug) {
		error(404, 'Undangan tidak ditemukan.');
	}
	const [wishes, total] = await Promise.all([listWishes(params.slug), countWishes(params.slug)]);
	return { wishes, total, slug: params.slug };
};
