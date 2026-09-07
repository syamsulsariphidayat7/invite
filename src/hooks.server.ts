import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const ADMIN_COOKIE = 'admin_pin';

export const handle: Handle = async ({ event, resolve }) => {
	const cookiePin = event.cookies.get(ADMIN_COOKIE);
	const expected = env.ADMIN_PIN?.trim();
	if (expected && cookiePin && cookiePin === expected) {
		event.locals.adminAuthed = true;
	} else {
		event.locals.adminAuthed = false;
	}

	const pathname = event.url.pathname;
	if (pathname.startsWith('/admin')) {
		const isLogin = pathname === '/admin/login' || pathname.startsWith('/admin/login/');
		const isApi = pathname.startsWith('/api/admin');
		if (!isLogin && !event.locals.adminAuthed) {
			if (isApi) {
				return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });
			}
			return Response.redirect(new URL('/admin/login', event.url).toString(), 302);
		}
	}

	return resolve(event);
};
