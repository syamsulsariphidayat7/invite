import { listWishes, countWishes } from '$lib/server/wishes';
import { wedding } from '$lib/data/wedding';

export const load = async () => {
	const [wishes, total] = await Promise.all([listWishes(wedding.slug), countWishes(wedding.slug)]);
	return { wishes, total };
};
