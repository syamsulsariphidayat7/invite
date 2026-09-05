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
			{ threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
		);
		document.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => observer?.observe(el));
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
	<Hero />
	<Couple />
	<Verse />
	<Events />
	<Gallery />
	<LoveStory />
	<Gift />
	<Wishes initialWishes={data.wishes} initialTotal={data.total} />
	<Footer />
</main>

{#if overlayVisible}
	<Overlay {guest} closed={opened} onopen={openInvite} />
{/if}

<BottomNav />
<MusicToggle />
