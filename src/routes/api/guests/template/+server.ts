import { json } from '@sveltejs/kit';
import { getInvitation } from '$lib/server/invitations';
export async function GET({ url }) {
	const slug = url.searchParams.get('slug')?.trim() ?? '';
	if (!slug) return json({ waTemplate: null });
	const inv = await getInvitation(slug).catch(() => null);
	return json({ waTemplate: inv?.waTemplate ?? null });
}
