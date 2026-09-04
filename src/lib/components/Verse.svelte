<script lang="ts">
	import { wedding } from '$lib/data/wedding';
	import Ornament from './Ornament.svelte';
</script>

<section class="verse" aria-label="Ayat Al-Qur'an">
	<div class="pattern" aria-hidden="true"></div>
	<div class="wrap">
		<Ornament tone="light" />

		<blockquote data-reveal>
			<p class="arabic" lang="ar" dir="rtl">{wedding.verse.arabic}</p>
			<p class="orn-symbol" aria-hidden="true">❁</p>
			<p class="translation">“{wedding.verse.translation}”</p>
			<footer class="source">{wedding.verse.source}</footer>
		</blockquote>

		<Ornament tone="light" />
	</div>
</section>

<style>
	.verse {
		position: relative;
		padding: 5.5rem 0;
		background:
			radial-gradient(80% 60% at 50% 0%, rgba(116, 154, 85, 0.18), transparent 70%),
			linear-gradient(160deg, var(--green-800), var(--green-900) 65%);
		color: #f2ecd9;
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
		margin: 0;
		font-family: 'Amiri', 'Scheherazade New', 'Traditional Arabic', serif;
		font-size: clamp(22px, 6.5vw, 32px);
		line-height: 2.1;
		color: #fff;
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
		color: rgba(242, 236, 217, 0.95);
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
</style>
