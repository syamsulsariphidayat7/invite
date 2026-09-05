<script lang="ts">
	// Efek partikel jatuh ("snow" / kelopak) — meniru pp-bg-effects referensi:
	// 35 partikel putih, jatuh dari atas ke bawah, ukuran & kecepatan acak.
	// Pure CSS animation (tanpa canvas) supaya ringan di HP.

	let { count = 35, color = 'rgba(253, 249, 238, 0.9)' }: { count?: number; color?: string } = $props();

	// Nilai deterministik dari seed (tanpa Math.random) supaya konsisten
	// antara render server & client → tidak ada mismatch hydration.
	const rand = (seed: number) => {
		const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
		return x - Math.floor(x);
	};

	const parts = Array.from({ length: count }, (_, i) => ({
		left: Math.round(rand(i + 1) * 100 * 10) / 10,
		size: Math.round((2.5 + rand(i + 7) * 4.5) * 10) / 10,
		dur: Math.round((8 + rand(i + 13) * 10) * 10) / 10,
		delay: Math.round(rand(i + 29) * 14 * 10) / 10,
		sway: Math.round((18 + rand(i + 41) * 60) * 10) / 10,
		opacity: Math.round((0.35 + rand(i + 67) * 0.55) * 100) / 100
	}));
</script>

<div class="particles" aria-hidden="true">
	{#each parts as p}
		<span
			class="part"
			style="--l:{p.left}%;--s:{p.size}px;--dur:{p.dur}s;--delay:{p.delay}s;--sway:{p.sway}px;--o:{p.opacity};--part-color:{color}"
		></span>
	{/each}
</div>

<style>
	.particles {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		z-index: 1;
	}

	.part {
		position: absolute;
		top: -5vh;
		left: var(--l);
		width: var(--s);
		height: var(--s);
		border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
		background: var(--part-color);
		opacity: var(--o);
		/* delay negatif → partikel sudah jatuh sebagian saat halaman dibuka */
		animation: fall var(--dur) linear infinite;
		animation-delay: calc(var(--delay) * -1s);
		will-change: transform;
	}

	@keyframes fall {
		0% {
			transform: translate3d(0, -5vh, 0) rotate(0deg);
		}
		20% {
			transform: translate3d(calc(var(--sway) * 0.45), 20vh, 0) rotate(70deg);
		}
		40% {
			transform: translate3d(calc(var(--sway) * -0.4), 42vh, 0) rotate(150deg);
		}
		60% {
			transform: translate3d(calc(var(--sway) * 0.35), 64vh, 0) rotate(220deg);
		}
		80% {
			transform: translate3d(calc(var(--sway) * -0.3), 86vh, 0) rotate(290deg);
		}
		100% {
			transform: translate3d(0, 108vh, 0) rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.particles {
			display: none;
		}
	}
</style>