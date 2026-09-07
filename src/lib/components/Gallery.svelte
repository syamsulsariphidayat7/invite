<script lang="ts">
	import { ChevronLeft, ChevronRight, X } from 'lucide-svelte';
	import { wedding } from '$lib/data/wedding';
	import Photo from './Photo.svelte';
	import SocialIcon from './SocialIcon.svelte';
	import BatikTexture from './BatikTexture.svelte';

	let { gallery = null, weddingData = null }: { gallery?: string[] | null; weddingData?: typeof wedding | null } = $props();
	const w = $derived((weddingData ?? wedding) as typeof wedding);
	const bases = $derived((gallery && gallery.length > 0 ? gallery : w.photos.gallery) as string[]);
	let active = $state<number | null>(null);

	function prev() {
		if (active === null) return;
		active = (active - 1 + bases.length) % bases.length;
	}

	function next() {
		if (active === null) return;
		active = (active + 1) % bases.length;
	}

	$effect(() => {
		if (active === null) return;
		document.body.style.overflow = 'hidden';
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') active = null;
			if (e.key === 'ArrowLeft') prev();
			if (e.key === 'ArrowRight') next();
		};
		window.addEventListener('keydown', onKey);
		return () => {
			document.body.style.overflow = '';
			window.removeEventListener('keydown', onKey);
		};
	});
</script>

<section id="gallery" class="gallery" aria-label="Galeri foto">
	<BatikTexture variant="light" opacity={0.05} size={210} />
	<div class="wrap">
		<!-- Blok ajakan filter Instagram (disembunyikan jika kosong) -->
		{#if w.instagramFilterUrl}
			<div class="ig-promo" data-reveal>
				<p>
					Bantu kami mengabadikan momen terbaik di hari pernikahan kami dengan{' '}
					<strong>“Instagram Filter”</strong> di stories. Jangan lupa tag kami ya!
				</p>
				<div class="ig-actions">
					<a class="btn ig-btn" href={w.instagramFilterUrl} target="_blank" rel="noopener">
						<SocialIcon size={15} />
						Wedding Filter
					</a>
					<a class="btn ghost-ig" href={w.social.instagram} target="_blank" rel="noopener">
						<SocialIcon size={15} />
						Instagram
					</a>
				</div>
			</div>
		{/if}

		<p class="kicker" data-reveal>Album Photos</p>
		<h2 class="section-title" data-reveal style="--d:.06s">Our Memorable Moments</h2>
		<p class="lead" data-reveal style="--d:.12s">Sebuah lembar cerita bahagia kami — galeri momen bersama keluarga & sahabat.</p>
	</div>

	<div class="grid wrap-wide">
		{#each bases as base, i}
			<button
				class="cell"
				type="button"
				style="--i:{i}"
				data-reveal
				onclick={() => (active = i)}
				aria-label={`Buka foto ${i + 1}`}
			>
				<Photo base={base} alt={`Galeri foto ${i + 1}`} />
			</button>
		{/each}
	</div>

	<!-- LIGHTBOX -->
	{#if active !== null}
		<div class="lightbox" role="dialog" aria-modal="true" tabindex="-1">
			<button class="backdrop" type="button" aria-label="Tutup galeri" onclick={() => (active = null)}></button>
			<button class="close" aria-label="Tutup" onclick={() => (active = null)}>
				<X size={22} />
			</button>
			<button class="arrow left" aria-label="Sebelumnya" onclick={prev}>
				<ChevronLeft size={26} />
			</button>
			<figure>
				<Photo base={bases[active]} alt={`Galeri foto ${active + 1}`} eager klass="lightbox-img" />
				<figcaption>{active + 1} / {bases.length}</figcaption>
			</figure>
			<button class="arrow right" aria-label="Berikutnya" onclick={next}>
				<ChevronRight size={26} />
			</button>
		</div>
	{/if}
</section>

<style>
	.gallery {
		position: relative;
		isolation: isolate;
		padding: 5rem 0;
		background: var(--paper);
		overflow: hidden;
	}

	.gallery > :not(.batik):not(.lightbox) {
		position: relative;
		z-index: 1;
	}

	.lead {
		text-align: center;
		max-width: 34em;
		margin: 0.9rem auto 2.6rem;
		font-size: 15px;
		color: var(--ink-2);
	}

	/* blok filter IG */
	.ig-promo {
		background: linear-gradient(135deg, #fdf2f4, #f7eef0 45%, #eef3e7);
		border: 1px solid var(--line);
		border-radius: 22px;
		padding: 1.7rem 1.6rem;
		margin-bottom: 3.2rem;
		text-align: center;
	}

	.ig-promo p {
		margin: 0 0 1.2rem;
		font-size: 14.5px;
		line-height: 1.9;
		color: var(--ink-2);
	}

	.ig-promo strong {
		color: var(--rose);
	}

	.ig-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.7rem;
		justify-content: center;
	}

	.ig-btn {
		background: linear-gradient(45deg, #f09433, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888);
		color: #fff;
		border-radius: 999px;
		padding: 0.7em 1.5em;
	}

	.ghost-ig {
		border: 1px solid var(--line);
		color: var(--ink-2);
		border-radius: 999px;
		padding: 0.7em 1.5em;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.9rem;
	}

	@media (min-width: 720px) {
		.grid {
			grid-template-columns: repeat(3, 1fr);
			gap: 1.1rem;
		}
	}

	.cell {
		position: relative;
		aspect-ratio: 1 / 1;
		border-radius: 16px;
		overflow: hidden;
		padding: 0;
		border: 0;
		cursor: zoom-in;
		background: var(--tan-100);
	}

	.cell::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, transparent 55%, rgba(23, 31, 17, 0.25));
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.cell:hover::after {
		opacity: 1;
	}

	/* zoom halus foto saat hover (micro-interaction ala referensi) */
	.cell :global(.photo-img) {
		transition: transform 0.7s cubic-bezier(0.2, 0.7, 0.25, 1);
	}

	.cell:hover :global(.photo-img) {
		transform: scale(1.08);
	}

	/* lightbox */
	.lightbox {
		position: fixed;
		inset: 0;
		z-index: 140;
		background: rgba(13, 18, 10, 0.93);
		display: flex;
		align-items: center;
		justify-content: center;
		animation: fade-in 0.3s ease both;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}

	.lightbox figure {
		position: relative;
		margin: 0;
		max-width: min(92vw, 820px);
		max-height: 86vh;
		width: 100%;
	}

	.lightbox :global(.lightbox-img) {
		position: relative !important;
		width: 100%;
		max-height: 82vh;
		object-fit: contain;
		border-radius: 12px;
	}

	.lightbox figcaption {
		position: absolute;
		bottom: -2rem;
		width: 100%;
		text-align: center;
		color: rgba(255, 255, 255, 0.7);
		font-size: 13px;
		letter-spacing: 0.2em;
	}

	.backdrop {
		position: absolute;
		inset: 0;
		border: 0;
		padding: 0;
		background: transparent;
		cursor: zoom-out;
	}

	.lightbox figure,
	.lightbox .close,
	.lightbox .arrow {
		z-index: 3;
	}

	.close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: 0;
		background: rgba(255, 255, 255, 0.12);
		color: #fff;
		cursor: pointer;
		display: grid;
		place-items: center;
	}

	.arrow {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 46px;
		height: 46px;
		border-radius: 50%;
		border: 0;
		background: rgba(255, 255, 255, 0.12);
		color: #fff;
		cursor: pointer;
		display: grid;
		place-items: center;
	}

	.arrow.left {
		left: 0.7rem;
	}

	.arrow.right {
		right: 0.7rem;
	}

	@media (min-width: 720px) {
		.arrow.left {
			left: 2rem;
		}

		.arrow.right {
			right: 2rem;
		}
	}
</style>
