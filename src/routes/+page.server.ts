import { redirect } from '@sveltejs/kit';
import { wedding } from '$lib/data/wedding';

export const load = async ({ url }) => {
	redirect(307, `/${wedding.slug}${url.search}`);
};
