<script lang="ts">
	import Hero from '$lib/components/Hero.svelte';
	import Couple from '$lib/components/Couple.svelte';
	import Verse from '$lib/components/Verse.svelte';
	import Events from '$lib/components/Events.svelte';
	import Gallery from '$lib/components/Gallery.svelte';
	import LoveStory from '$lib/components/LoveStory.svelte';
	import Gift from '$lib/components/Gift.svelte';
	import Wishes from '$lib/components/Wishes.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { wedding } from '$lib/data/wedding';
	import type { Wish } from '$lib/data/wedding';

	interface Props {
		resolved: typeof wedding;
		gallery?: string[] | null;
		wishes?: Wish[];
		total?: number;
		guest?: string;
		slug?: string;
	}

	let {
		resolved,
		gallery = null,
		wishes = [],
		total = 0,
		guest = '',
		slug = 'ruhaeni-roni'
	}: Props = $props();

	const w = $derived(resolved);
	const livestream = $derived((w as unknown as { _livestream?: string | null })._livestream);
</script>

<main class="invite theme-classic">
	<Hero weddingData={w} />
	<Couple weddingData={w} />
	<Verse weddingData={w} />
	<Events weddingData={w} />
	{#if livestream}
		<section class="livestream wrap" style="padding:1.2rem 0;text-align:center">
			<a href={livestream} target="_blank" rel="noopener" class="btn btn-green">Tonton Live Streaming</a>
		</section>
	{/if}
	<Gallery gallery={gallery} weddingData={w} />
	<LoveStory weddingData={w} />
	<Gift weddingData={w} />
	<Wishes initialWishes={wishes} initialTotal={total} guestName={guest} slug={slug} weddingData={w} />
	<Footer weddingData={w} />
</main>