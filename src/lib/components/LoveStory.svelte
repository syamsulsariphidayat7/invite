<script lang="ts">
	import { wedding } from '$lib/data/wedding';
	import Ornament from './Ornament.svelte';

	const chapters = wedding.story.chapters;
	const numerals = ['I', 'II', 'III', 'IV', 'V'];
</script>

<section class="story" aria-label="Kisah cinta kami">
	<div class="wrap">
		<p class="kicker" data-reveal>Love Story</p>
		<h2 class="section-title" data-reveal style="--d:.06s">The Memorable Moments</h2>
		<Ornament tone="green" />
		<p class="intro" data-reveal style="--d:.1s">{wedding.story.intro}</p>
	</div>

	<div class="timeline wrap-wide">
		{#each chapters as ch, i}
			<article class="chapter" data-reveal style="--d:{i * 0.08}s">
				<span class="node" aria-hidden="true">{numerals[i % numerals.length]}</span>
				<div class="card">
					<h3 class="chapter-title">{ch.title}</h3>
					<p class="chapter-text">{ch.text}</p>
				</div>
			</article>
		{/each}
	</div>
</section>

<style>
	.story {
		padding: 5.5rem 0;
		background:
			linear-gradient(180deg, var(--paper-2), var(--paper) 60%);
	}

	:global(.story .wrap .orn) {
		margin: 1.6rem auto 1.2rem;
		transform: scale(0.85);
	}

	.intro {
		text-align: center;
		max-width: 36em;
		margin: 0 auto;
		font-family: var(--font-serif);
		font-style: italic;
		font-size: 16.5px;
		line-height: 2;
		color: var(--ink-2);
	}

	.timeline {
		position: relative;
		margin-top: 3rem;
		display: grid;
		gap: 1.4rem;
	}

	.timeline::before {
		content: '';
		position: absolute;
		left: 22px;
		top: 8px;
		bottom: 8px;
		width: 1px;
		background: linear-gradient(180deg, transparent, var(--gold) 12%, var(--gold) 88%, transparent);
	}

	@media (min-width: 760px) {
		.timeline {
			gap: 2rem;
		}

		.timeline::before {
			left: 50%;
			transform: translateX(-50%);
		}
	}

	.chapter {
		position: relative;
		display: grid;
		grid-template-columns: 44px 1fr;
		gap: 1rem;
		align-items: start;
	}

	.node {
		position: relative;
		z-index: 1;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: linear-gradient(135deg, var(--gold), var(--gold-2));
		color: #fff;
		font-family: var(--font-serif);
		font-size: 15px;
		font-weight: 600;
		box-shadow: 0 0 0 6px var(--paper-2);
	}

	@media (min-width: 760px) {
		.chapter {
			grid-template-columns: 1fr 1fr;
			column-gap: 3.4rem;
		}

		.chapter:nth-child(odd) .card {
			grid-column: 1;
			grid-row: 1;
			text-align: right;
		}

		.chapter:nth-child(odd) .node {
			grid-column: 2;
			grid-row: 1;
			justify-self: start;
		}

		.chapter:nth-child(even) .card {
			grid-column: 2;
			grid-row: 1;
			text-align: left;
		}

		.chapter:nth-child(even) .node {
			grid-column: 1;
			grid-row: 1;
			justify-self: end;
		}
	}

	.card {
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 18px;
		padding: 1.4rem 1.5rem;
		box-shadow: var(--shadow-1);
	}

	.chapter-title {
		margin: 0 0 0.5rem;
		font-family: var(--font-script);
		font-weight: 400;
		font-size: 32px;
		color: var(--green-700);
		line-height: 1.2;
	}

	.chapter-text {
		margin: 0;
		font-size: 14px;
		line-height: 1.9;
		color: var(--ink-2);
		white-space: pre-line;
	}
</style>
