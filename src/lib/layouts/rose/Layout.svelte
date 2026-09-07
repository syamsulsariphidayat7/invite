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

<main class="invite theme-rose">
	<Hero weddingData={w} />
	<Couple weddingData={w} />
	{#if livestream}
		<section class="livestream wrap" style="padding:1.2rem 0;text-align:center">
			<a href={livestream} target="_blank" rel="noopener" class="btn btn-green">Tonton Live Streaming</a>
		</section>
	{/if}
	<Gallery gallery={gallery} weddingData={w} />
	<Verse weddingData={w} />
	<LoveStory weddingData={w} />
	<Events weddingData={w} />
	<Gift weddingData={w} />
	<Wishes initialWishes={wishes} initialTotal={total} guestName={guest} slug={slug} weddingData={w} />
	<Footer weddingData={w} />
</main>

<style>
	/* Palet & tipografi layout "Rose" (burgundy-emas) — override design token
	   global untuk seluruh subtree. Varian per-undangan (theme di data_json)
	   tetap berjalan karena tidak menimpa --ink/--paper di sini. */
	:global(.theme-rose) {
		--green-900: #4a0e20;
		--green-800: #6b1530;
		--green-700: #8f2340;
		--green-600: #b03a58;
		--green-500: #cf6d86;
		--green-100: #fdeef2;
		--gold: #a9802c;
		--gold-2: #c9a24b;
		--gold-3: #7d5c16;
		--rose: #b05468;
		--rose-100: #fdeef2;
		--paper: #fdf6f0;
		--paper-2: #f8e9dd;
		--card: #fffdfa;
		--line: #e7d6cf;
		--line-soft: #f0e4dc;
		--ink: #43202c;
		--ink-2: #7d5b66;
		--ink-3: #ab8a93;
		--shadow-1: 0 6px 24px rgba(107, 16, 48, 0.09);
		--shadow-2: 0 18px 50px rgba(107, 16, 48, 0.16);
	}

	/* sentuhan khas rose: sudut hero lebih hangat via gradient tipis */
	:global(.theme-rose .hero) {
		background: linear-gradient(160deg, var(--green-800), var(--green-900) 70%);
	}

	:global(.theme-rose ::selection) {
		background: var(--green-800);
		color: #fff;
	}
</style>