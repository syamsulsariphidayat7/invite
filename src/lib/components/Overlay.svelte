<script lang="ts">

	import { wedding } from '$lib/data/wedding';
	import Photo from './Photo.svelte';
	import Ornament from './Ornament.svelte';

	let { guest = '', closed = false, onopen }: { guest?: string; closed?: boolean; onopen?: () => void } =
		$props();

	const names = wedding.namesShort.split(' & ');
</script>	<div class="cover" class:hide={closed} aria-hidden={closed ? 'true' : undefined} role="dialog" aria-modal="true" tabindex="-1">
	<div class="bg">
		<Photo base={wedding.photos.cover} alt="" eager />
	</div>
	<div class="veil"></div>

	<div class="inner">
		<Ornament tone="light" />

		<p class="eyebrow">The Wedding Of</p>
		<h1 class="names">
			<span>{names[0]}</span>
			<span class="amp">&</span>
			<span>{names[1]}</span>
		</h1>
		<p class="date">{wedding.akad.dayLabel}</p>

		<Ornament tone="light" />

		<p class="dear">Kepada Yth. Bapak/Ibu/Saudara/i</p>
		<p class="guest">{guest.trim() || 'Tamu Undangan'}</p>
		<p class="invite">
			Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk hadir pada acara
			pernikahan kami.
		</p>

		<button class="btn-open" onclick={onopen}>
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 17V7A1.5 1.5 0 0 1 4 5.5Z" />
				<path d="m3 7.5 9 6 9-6" />
			</svg>
			Buka Undangan
		</button>

		<p class="apology">Mohon maaf apabila ada kesalahan penulisan nama & gelar</p>
	</div>
</div>

<style>
	.cover {
		position: fixed;
		inset: 0;
		z-index: 120;
		display: grid;
		place-items: center;
		overflow-y: auto;
		/* efek tirai: overlay naik ke atas (sama seperti referensi removeModals) */
		transition: transform 3s ease-in-out, visibility 0s linear 3s;
		will-change: transform;
	}

	.cover.hide {
		transform: translateY(-200%);
		visibility: hidden;
		pointer-events: none;
	}

	.bg {
		position: absolute;
		inset: 0;
	}

	.veil {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(120% 90% at 50% 10%, rgba(35, 52, 26, 0.35), rgba(18, 26, 13, 0.86) 75%),
			linear-gradient(180deg, rgba(20, 28, 15, 0.55), rgba(13, 19, 10, 0.92));
	}

	.inner {
		position: relative;
		width: min(100% - 3rem, 560px);
		margin: auto;
		padding: 2.5rem 0 3rem;
		text-align: center;
		color: #fdf9ee;
		animation: rise 1.1s cubic-bezier(0.2, 0.7, 0.25, 1) both 0.25s;
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(24px) scale(0.985);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	.eyebrow {
		font-family: var(--font-serif);
		text-transform: uppercase;
		letter-spacing: 0.42em;
		font-size: 11px;
		margin: 1.4rem 0 0.1rem;
		color: rgba(253, 249, 238, 0.85);
	}

	.names {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 0.5em;
		flex-wrap: wrap;
		margin: 0.4rem 0 0.2rem;
		font-family: var(--font-script);
		font-weight: 400;
		font-size: clamp(44px, 14vw, 72px);
		line-height: 1.1;
		color: #fff;
		text-shadow: 0 4px 30px rgba(0, 0, 0, 0.35);
	}

	.names .amp {
		font-size: 0.42em;
		font-family: var(--font-serif);
		color: var(--gold);
		transform: translateY(-0.3em);
		letter-spacing: 0.1em;
	}

	.date {
		margin: 0.1rem 0 1.1rem;
		font-family: var(--font-serif);
		font-style: italic;
		font-size: clamp(15px, 4vw, 19px);
		letter-spacing: 0.04em;
		color: #efe6d0;
	}

	.dear {
		margin: 1.2rem 0 0.3rem;
		font-size: 13px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgba(253, 249, 238, 0.75);
	}

	.guest {
		margin: 0.1rem 0 0.7rem;
		font-family: var(--font-hand);
		font-size: clamp(24px, 7vw, 34px);
		color: #ffd9a0;
		line-height: 1.3;
		min-height: 1.3em;
	}

	.invite {
		margin: 0 auto 1.6rem;
		max-width: 34em;
		font-size: 13.5px;
		line-height: 1.9;
		color: rgba(253, 249, 238, 0.88);
	}

	.btn-open {
		display: inline-flex;
		align-items: center;
		gap: 0.6em;
		cursor: pointer;
		border: 1px solid rgba(253, 249, 238, 0.65);
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(6px);
		color: #fff;
		font-family: var(--font-serif);
		font-size: 15px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		padding: 0.95em 2.1em;
		border-radius: 999px;
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
		transition: background 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
		animation: pulse 2.6s ease-in-out infinite;
	}

	.btn-open:hover {
		background: rgba(255, 255, 255, 0.22);
		transform: translateY(-2px);
	}

	@keyframes pulse {
		0%,
		100% {
			box-shadow: 0 8px 26px rgba(0, 0, 0, 0.3), 0 0 0 0 rgba(255, 217, 160, 0.35);
		}
		50% {
			box-shadow: 0 8px 26px rgba(0, 0, 0, 0.3), 0 0 0 14px rgba(255, 217, 160, 0);
		}
	}

	.apology {
		margin: 1.6rem 0 0;
		font-size: 11.5px;
		font-style: italic;
		color: rgba(253, 249, 238, 0.55);
	}
</style>
