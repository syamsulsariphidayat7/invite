import { redirect } from '@sveltejs/kit';

const ROOT_SLUG = 'demo';

export const load = async ({ url }) => {
	redirect(307, `/${ROOT_SLUG}${url.search}`);
};
