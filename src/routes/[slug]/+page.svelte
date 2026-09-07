<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import Overlay from '$lib/components/Overlay.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import Couple from '$lib/components/Couple.svelte';
	import Verse from '$lib/components/Verse.svelte';
	import Events from '$lib/components/Events.svelte';
	import Gallery from '$lib/components/Gallery.svelte';
	import LoveStory from '$lib/components/LoveStory.svelte';
	import Gift from '$lib/components/Gift.svelte';
	import Wishes from '$lib/components/Wishes.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import MusicToggle from '$lib/components/MusicToggle.svelte';
	import ScrollProgress from '$lib/components/ScrollProgress.svelte';
	import { startMusic } from '$lib/music.svelte';

	let { data } = $props();

	let opened = $state(false);
	let overlayVisible = $state(true);

	// nama tamu lewat ?to=Nama (atau ?nama=)
	const guest = $derived(
		page.url.searchParams.get('to') ??
			page.url.searchParams.get('nama') ??
			page.url.searchParams.get('guest') ??
			''
	);

	let observer: IntersectionObserver | null = null;

	function setupReveals() {
		observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						entry.target.classList.add('is-in');
						observer?.unobserve(entry.target);
					}
				}
			},
			{ threshold: 0.12, rootMargin: '-18% 0px -18% 0px' }
		);
		const targets = document.querySelectorAll('[data-reveal]:not(.is-in)');
		targets.forEach((el) => observer?.observe(el));
		setTimeout(() => {
			document.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => {
				const r = el.getBoundingClientRect();
				if (r.top < window.innerHeight * 0.88) el.classList.add('is-in');
			});
		}, 320);
	}

	onMount(() => {
		// pratinjau instan: ?preview=1 melewati layar sampul
		if (page.url.searchParams.has('preview')) {
			opened = true;
			overlayVisible = false;
			document.body.style.overflow = '';
			setTimeout(setupReveals, 80);
			return;
		}
		// kunci scroll selama layar sampul terbuka
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = '';
			observer?.disconnect();
		};
	});

	function openInvite() {
		if (opened) return;
		opened = true;
		document.body.style.overflow = '';
		startMusic();

		// mulai animasi reveal setelah konten terlihat
		setupReveals();
		window.scrollTo({ top: 0 });

		// lepas overlay setelah animasi tirai selesai (3s + jeda)
		setTimeout(() => (overlayVisible = false), 3200);
	}
</script>

<main class="invite">
	<Hero weddingData={data.resolved} />
	<Couple weddingData={data.resolved} />
	<Verse weddingData={data.resolved} />
	<Events weddingData={data.resolved} />
	<Gallery gallery={data.gallery} />
	<LoveStory weddingData={data.resolved} />
	<Gift weddingData={data.resolved} />
	<Wishes initialWishes={data.wishes} initialTotal={data.total} guestName={guest} />
	<Footer weddingData={data.resolved} />
</main>

{#if overlayVisible}
	<Overlay {guest} closed={opened} onopen={openInvite} />
{/if}

<ScrollProgress />
<BottomNav />
	<MusicToggle weddingData={data.resolved} />
