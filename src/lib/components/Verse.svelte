<script lang="ts">
	import { wedding } from '$lib/data/wedding';
	import Ornament from './Ornament.svelte';
	import BatikTexture from './BatikTexture.svelte';

	let { weddingData = null }: { weddingData?: typeof wedding | null } = $props();
	const w = $derived(((weddingData as typeof wedding | null) ?? wedding) as typeof wedding);
	const verse = $derived((w as unknown as { verse: typeof wedding.verse | null }).verse);
</script>

<section class="verse" aria-label="Ayat Al-Qur'an">
	<BatikTexture variant="dark" opacity={0.14} size={220} />
	<div class="pattern" aria-hidden="true"></div>
	<div class="wrap">
		<Ornament tone="light" />

		{#if verse}
			<blockquote>
				<p class="arabic" lang="ar" dir="rtl" data-reveal>{verse.arabic}</p>
				<p class="orn-symbol" aria-hidden="true" data-reveal style="--d:.1s">❁</p>
				<p class="translation" data-reveal style="--d:.18s">“{verse.translation}”</p>
				<footer class="source" data-reveal style="--d:.26s">{verse.source}</footer>
			</blockquote>
		{/if}

		<Ornament tone="light" />
	</div>
</section>

<style>
	.verse {
		position: relative;
		isolation: isolate;
		padding: 5.5rem 0;
		overflow: hidden;
		background:
			radial-gradient(80% 60% at 50% 0%, rgba(107, 107, 107, 0.18), transparent 70%),
			linear-gradient(160deg, var(--green-800), var(--green-900) 65%);
		color: #ededed;
		overflow: hidden;
	}

	.pattern {
		position: absolute;
		inset: 0;
		opacity: 0.5;
		background-image:
			radial-gradient(circle at 12% 20%, rgba(255, 255, 255, 0.05) 1.5px, transparent 1.5px),
			radial-gradient(circle at 88% 82%, rgba(255, 255, 255, 0.05) 1.5px, transparent 1.5px);
		background-size: 46px 46px;
	}

	blockquote {
		margin: 0;
		padding: 1.2rem 0;
		text-align: center;
	}

	.arabic {
		margin: 0 auto;
		max-width: 22em;
		font-family: 'Amiri Quran', 'Noto Naskh Arabic', 'Amiri', serif;
		font-size: clamp(20px, 5.5vw, 28px);
		line-height: 1.9;
		letter-spacing: 0.02em;
		color: #fff;
		text-wrap: balance;
		white-space: normal;
		overflow-wrap: break-word;
	}

	.orn-symbol {
		margin: 1.2rem 0 0.6rem;
		color: var(--gold);
		font-size: 18px;
	}

	.translation {
		margin: 0 auto;
		max-width: 33em;
		font-family: var(--font-serif);
		font-style: italic;
		font-size: 16.5px;
		line-height: 1.95;
		color: rgba(237, 237, 237, 0.95);
	}

	.source {
		margin: 1.1rem 0 0;
		font-size: 13px;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--gold);
	}

	.verse :global(.orn) {
		opacity: 0.9;
	}

	.verse .wrap {
		position: relative;
		z-index: 1;
	}
</style>
