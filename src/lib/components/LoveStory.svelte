<script lang="ts">
	import { wedding } from '$lib/data/wedding';
	import Ornament from './Ornament.svelte';
	import BatikTexture from './BatikTexture.svelte';

	const chapters = wedding.story.chapters;
</script>

<section class="story" aria-label="Kisah cinta kami">
	<BatikTexture variant="light" opacity={0.058} size={240} />
	<div class="wrap">
		<p class="kicker" data-reveal>Love Story</p>
		<h2 class="section-title" data-reveal style="--d:.06s">The Memorable Moments</h2>
		<Ornament tone="green" />
		<p class="intro" data-reveal style="--d:.1s">{wedding.story.intro}</p>
	</div>

	<div class="timeline wrap-wide">
		{#each chapters as ch, i}
			<article class="chapter" data-reveal style="--d:{i * 0.08}s">
				<span class="node" aria-hidden="true">
					<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
						<path d="M12 21s-6.2-3.9-8.6-8.1C1.9 9.6 3.1 5.4 6.7 4.2c2-.7 4.1.1 5.3 1.7C13.2 4.3 15.3 3.5 17.3 4.2c3.6 1.2 4.8 5.4 3.3 8.7C18.2 17.1 12 21 12 21z" />
					</svg>
				</span>
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
		position: relative;
		isolation: isolate;
		padding: 5.5rem 0;
		background: linear-gradient(180deg, var(--paper-2), var(--paper) 60%);
		overflow: hidden;
	}

	.story > :not(.batik) {
		position: relative;
		z-index: 1;
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
