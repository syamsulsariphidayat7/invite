<script lang="ts">
	import { CalendarPlus, ChevronDown } from 'lucide-svelte';
	import { wedding, calendarUrl } from '$lib/data/wedding';
	import Photo from './Photo.svelte';
	import Particles from './Particles.svelte';

	let { weddingData = null }: { weddingData?: typeof wedding | null } = $props();
	const w = $derived((weddingData ?? wedding) as typeof wedding & { calendarUrlResolved?: string });
	const heroNames = $derived(w.namesShort.split(' & '));
	const calUrl = $derived((w as unknown as Record<string, string>).calendarUrlResolved ?? calendarUrl);
</script>

<section id="home" class="hero" aria-label="Pembukaan undangan">
	<div class="bg">
		<Photo base={w.photos.hero} alt={`Foto pasangan ${w.namesShort}`} eager />
	</div>
	<div class="veil"></div>

	<!-- partikel jatuh ala referensi (pp-bg-effects: snow, 35 partikel putih) -->
	<Particles count={35} color="rgba(255, 255, 255, 0.75)" />

	<img
		class="flower-decor"
		src="/decor/flower-ed-02.png"
		alt=""
		aria-hidden="true"
		loading="eager"
		decoding="async"
		data-reveal
		style="--d:.36s"
	/>

	<div class="content">
		<p class="kicker-soft" data-reveal>The Wedding Of</p>
		<h1 class="names" data-reveal style="--d:.08s">
			<span class="n">{heroNames[0]}</span><span class="amp">&</span><span class="n">{heroNames[1] ?? ''}</span>
		</h1>
		<p class="date" data-reveal style="--d:.16s">{w.resepsi.dayLabel}</p>

		<div class="cta" data-reveal style="--d:.24s">
			<a class="btn-save" href={calUrl} target="_blank" rel="noopener">
				<CalendarPlus size={17} />
				Save The Date
			</a>
		</div>

		<p class="dear-note" data-reveal style="--d:.3s">
			Merupakan suatu kehormatan & kebahagiaan bagi kami apabila berkenan hadir.
		</p>
	</div>

	<a class="scroll-cue" href="#couple" aria-label="Gulir ke bawah">
		<ChevronDown size={20} />
	</a>
</section>

<style>
	.hero {
		position: relative;
		min-height: 100svh;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		background: var(--green-900);
	}

	.bg {
		position: absolute;
		inset: 0;
	}

	.veil {
		position: absolute;
		inset: 0;
		z-index: 1;
		pointer-events: none;
		background: linear-gradient(
			180deg,
			rgba(43, 43, 43, 0.28) 0%,
			rgba(43, 43, 43, 0.1) 16%,
			transparent 30%,
			transparent 38%,
			rgba(43, 43, 43, 0.35) 58%,
			rgba(43, 43, 43, 0.72) 80%,
			rgba(43, 43, 43, 0.92) 100%
		);
	}

	.flower-decor {
		position: absolute;
		right: -18px;
		bottom: -18px;
		z-index: 2;
		width: clamp(180px, 38vw, 420px);
		height: auto;
		pointer-events: none;
		opacity: 0.96;
		transform-origin: bottom right;
		filter: drop-shadow(0 12px 22px rgba(107, 107, 107, 0.28));
	}

	@media (max-width: 640px) {
		.flower-decor {
			width: clamp(140px, 48vw, 240px);
			right: -8px;
			bottom: -6px;
			opacity: 0.88;
		}
	}

	.content {
		position: relative;
		z-index: 3;
		text-align: center;
		color: #fff;
		padding: 7rem 1.5rem 5rem;
		max-width: 700px;
		isolation: isolate;
	}

	.content::before {
		content: '';
		position: absolute;
		inset: 4% -10% 4% -10%;
		z-index: -1;
		pointer-events: none;
		background: radial-gradient(
			ellipse 68% 62% at 50% 46%,
			rgba(43, 43, 43, 0.42) 0%,
			rgba(43, 43, 43, 0.2) 42%,
			transparent 72%
		);
		filter: blur(16px);
		border-radius: 32px;
	}

	@media (max-width: 640px) {
		.content {
			padding: 5rem 1.25rem 5rem;
		}
	}

	.kicker-soft {
		font-family: var(--font-serif);
		text-transform: uppercase;
		letter-spacing: 0.5em;
		font-size: 12px;
		margin: 0 0 1rem;
		color: rgba(255, 255, 255, 0.9);
		text-shadow: 0 2px 20px rgba(43, 43, 43, 0.85), 0 1px 6px rgba(43, 43, 43, 0.7);
	}

	.names {
		margin: 0;
		display: flex;
		align-items: baseline;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.28em;
		font-family: 'Great Vibes', 'Pinyon Script', cursive;
		font-weight: 400;
		font-size: clamp(42px, 11vw, 78px);
		line-height: 1;
		letter-spacing: 0.02em;
		color: #fff;
		text-shadow: 0 4px 28px rgba(43, 43, 43, 0.85), 0 10px 44px rgba(43, 43, 43, 0.55);
	}

	.names .amp {
		font-family: var(--font-serif);
		font-style: italic;
		font-weight: 300;
		font-size: 0.42em;
		letter-spacing: 0.08em;
		opacity: 0.92;
		align-self: center;
		transform: translateY(-0.15em);
	}

	.date {
		margin: 1.1rem 0 1.9rem;
		font-family: var(--font-serif);
		font-style: italic;
		font-weight: 500;
		font-size: clamp(16px, 4.5vw, 22px);
		letter-spacing: 0.08em;
		color: #f4ead2;
	}

	.cta .btn-save {
		display: inline-flex;
		align-items: center;
		gap: 0.6em;
		text-decoration: none;
		color: #2b2b2b;
		background: linear-gradient(135deg, #e9e9e9, #b0b0b0);
		font-weight: 600;
		font-size: 14px;
		letter-spacing: 0.08em;
		padding: 0.9em 1.9em;
		border-radius: 999px;
		box-shadow: 0 14px 36px rgba(43, 43, 43, 0.45);
		transition: transform 0.25s ease, box-shadow 0.25s ease;
	}

	.cta .btn-save:hover {
		transform: translateY(-2px);
		box-shadow: 0 18px 44px rgba(43, 43, 43, 0.55);
	}

	.dear-note {
		margin: 1.6rem auto 0;
		max-width: 30em;
		font-size: 13px;
		line-height: 1.8;
		color: rgba(255, 255, 255, 0.85);
		text-shadow: 0 2px 16px rgba(43, 43, 43, 0.85), 0 1px 4px rgba(43, 43, 43, 0.7);
	}

	.scroll-cue {
		position: absolute;
		bottom: 1.4rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 3;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.5);
		display: grid;
		place-items: center;
		color: #fff;
		animation: bob 2.2s ease-in-out infinite;
		background: rgba(107, 107, 107, 0.28);
	}

	@keyframes bob {
		0%,
		100% {
			transform: translate(-50%, 0);
		}
		50% {
			transform: translate(-50%, 8px);
		}
	}
</style>
