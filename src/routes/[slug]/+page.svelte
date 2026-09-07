<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import type { Component } from 'svelte';
	import Overlay from '$lib/components/Overlay.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import MusicToggle from '$lib/components/MusicToggle.svelte';
	import ScrollProgress from '$lib/components/ScrollProgress.svelte';
	import { layouts } from '$lib/layouts/registry';
	import { isKnownTemplate } from '$lib/layouts/meta';
	import type { LayoutProps } from '$lib/layouts/types';
	import { startMusic, setMusicSrc } from '$lib/music.svelte';

	let { data } = $props();

	let opened = $state(false);
	let overlayVisible = $state(true);

	// layout dipilih dari kolom `template` undangan; bisa di-override sesi via ?template=
	const template = $derived(
		isKnownTemplate(page.url.searchParams.get('template')) ? (page.url.searchParams.get('template') as string) : (data.template ?? 'classic')
	);
	const Layout = $derived((layouts[template] ?? layouts.classic) as Component<LayoutProps>);
	const layoutProps = $derived<Omit<LayoutProps, 'guest'>>({
		resolved: data.resolved,
		gallery: data.gallery,
		wishes: data.wishes,
		total: data.total,
		slug: data.slug
	});

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
		const r = data.resolved as unknown as Record<string, unknown>;
		const th = r?._theme as { primary?: string | null; secondary?: string | null } | undefined;
		if (th?.primary) document.documentElement.style.setProperty('--ink', th.primary);
		if (th?.secondary) document.documentElement.style.setProperty('--paper', th.secondary);
		const mu = (r?.music as { src?: string } | undefined)?.src;
		if (mu !== undefined) setMusicSrc(mu ?? '', (r?.music as { startSeconds?: number } | undefined)?.startSeconds);
		if (page.url.searchParams.has('preview')) {
			opened = true;
			overlayVisible = false;
			document.body.style.overflow = '';
			setTimeout(setupReveals, 80);
			return;
		}
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

<Layout {...layoutProps} {guest} />

{#if overlayVisible}
	<Overlay {guest} closed={opened} onopen={openInvite} weddingData={data.resolved} />
{/if}

<ScrollProgress />
<BottomNav />
<MusicToggle weddingData={data.resolved} />