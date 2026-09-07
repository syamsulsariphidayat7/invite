import { error } from '@sveltejs/kit';
import { wedding } from '$lib/data/wedding';

export const load = async ({ params }) => {
	if (params.slug !== wedding.slug) {
		error(404, 'Undangan tidak ditemukan.');
	}
	return { slug: params.slug };
};
