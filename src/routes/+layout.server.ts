import { env } from '$env/dynamic/private';

export const load = () => {
	return {
		turnstileSiteKey: env.TURNSTILE_SITE_KEY?.trim() ?? ''
	};
};