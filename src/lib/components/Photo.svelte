<script lang="ts">
	// Foto yang mencoba beberapa ekstensi: hero.jpg → hero.png → placeholder svg.
	// Taruh foto asli di /static/photos dengan nama dasar yang sama, mis. hero.jpg.
	let {
		base,
		alt = '',
		eager = false,
		klass = ''
	}: { base: string; alt?: string; eager?: boolean; klass?: string } = $props();

	let idx = $state(0);
	let loaded = $state(false);

	const isDirect = $derived(base.startsWith('http://') || base.startsWith('https://') || base.startsWith('/photos/') || base.startsWith('/'));
	const sources = $derived(
		isDirect
			? [base, `/photos/placeholders/${base.split('/').pop()?.split('.')[0] ?? 'hero'}.svg`]
			: [...['jpg', 'jpeg', 'png', 'webp'].map((e) => `/photos/${base}.${e}`), `/photos/placeholders/${base}.svg`]
	);
	const src = $derived(sources[idx]);
</script>

<img
	src={src}
	{alt}
	loading={eager ? 'eager' : 'lazy'}
	class={['photo-img', klass, loaded ? 'is-loaded' : ''].filter(Boolean).join(' ')}
	onerror={() => {
		if (idx < sources.length - 1) idx += 1;
	}}
	onload={() => (loaded = true)}
/>

<style>
	.photo-img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0;
		transition: opacity 0.9s ease;
	}

	.photo-img.is-loaded {
		opacity: 1;
	}

	/* tanpa JS: langsung tampil */
	:global(html:not(.js)) .photo-img {
		opacity: 1;
	}
</style>
