<script lang="ts">
	import { CalendarPlus, ChevronDown } from 'lucide-svelte';
	import { wedding, calendarUrl } from '$lib/data/wedding';
	import Photo from './Photo.svelte';
	import Particles from './Particles.svelte';
</script>

<section id="home" class="hero" aria-label="Pembukaan undangan">
	<div class="bg">
		<Photo base={wedding.photos.hero} alt="Foto pasangan Ruhaeni & Roni" eager />
	</div>
	<div class="veil"></div>

	<!-- partikel jatuh ala referensi (pp-bg-effects: snow, 35 partikel putih) -->
	<Particles count={35} color="rgba(255, 255, 255, 0.75)" />

	<div class="content">
		<p class="kicker-soft" data-reveal>The Wedding Of</p>
		<h1 class="names" data-reveal style="--d:.08s">
			{wedding.namesShort}
		</h1>
		<p class="date" data-reveal style="--d:.16s">{wedding.akad.dayLabel}</p>

		<div class="cta" data-reveal style="--d:.24s">
			<a class="btn-save" href={calendarUrl} target="_blank" rel="noopener">
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
		background:
			linear-gradient(180deg, rgba(17, 24, 12, 0.45) 0%, rgba(17, 24, 12, 0.15) 40%, rgba(17, 24, 12, 0.78) 100%),
			radial-gradient(90% 60% at 50% 55%, transparent 40%, rgba(17, 24, 12, 0.4));
	}

	.content {
		position: relative;
		z-index: 2;
		text-align: center;
		color: #fff;
		padding: 6rem 1.5rem 8rem;
		max-width: 700px;
	}

	.kicker-soft {
		font-family: var(--font-serif);
		text-transform: uppercase;
		letter-spacing: 0.5em;
		font-size: 12px;
		margin: 0 0 1rem;
		color: rgba(255, 255, 255, 0.9);
		text-shadow: 0 2px 18px rgba(0, 0, 0, 0.5);
	}

	.names {
		margin: 0;
		font-family: var(--font-script);
		font-weight: 400;
		font-size: clamp(54px, 15vw, 110px);
		line-height: 1.08;
		color: #fff;
		text-shadow: 0 6px 44px rgba(0, 0, 0, 0.5);
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
		color: #23341a;
		background: linear-gradient(135deg, #e9dcc0, #c5b297);
		font-weight: 600;
		font-size: 14px;
		letter-spacing: 0.08em;
		padding: 0.9em 1.9em;
		border-radius: 999px;
		box-shadow: 0 12px 34px rgba(0, 0, 0, 0.35);
		transition: transform 0.25s ease, box-shadow 0.25s ease;
	}

	.cta .btn-save:hover {
		transform: translateY(-2px);
		box-shadow: 0 16px 40px rgba(0, 0, 0, 0.42);
	}

	.dear-note {
		margin: 1.6rem auto 0;
		max-width: 30em;
		font-size: 13px;
		line-height: 1.8;
		color: rgba(255, 255, 255, 0.75);
		text-shadow: 0 1px 12px rgba(0, 0, 0, 0.6);
	}

	.scroll-cue {
		position: absolute;
		bottom: 1.4rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 2;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.5);
		display: grid;
		place-items: center;
		color: #fff;
		animation: bob 2.2s ease-in-out infinite;
		background: rgba(17, 24, 12, 0.25);
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
