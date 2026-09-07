<script lang="ts">
	import { Copy, Check, MapPin, Landmark } from 'lucide-svelte';
	import { wedding } from '$lib/data/wedding';
	import Ornament from './Ornament.svelte';
	import BatikTexture from './BatikTexture.svelte';

	let { weddingData = null }: { weddingData?: typeof wedding | null } = $props();
	const w = $derived((weddingData ?? wedding) as typeof wedding);

	let copied = $state<Set<number>>(new Set());

	async function copyNumber(i: number, text: string) {
		try {
			await navigator.clipboard.writeText(text.replace(/[\s.]/g, ''));
		} catch {
			// fallback sederhana untuk browser lama
			const ta = document.createElement('textarea');
			ta.value = text.replace(/[\s.]/g, '');
			document.body.appendChild(ta);
			ta.select();
			document.execCommand('copy');
			ta.remove();
		}
		const next = new Set(copied);
		next.add(i);
		copied = next;
		setTimeout(() => {
			const clean = new Set(copied);
			clean.delete(i);
			copied = clean;
		}, 2200);
	}
</script>

<section id="gift" class="gift" aria-label="Amplop digital">
	<BatikTexture variant="dark" opacity={0.13} size={220} />
	<div class="wrap">
		<p class="kicker light" data-reveal>Amplop Digital</p>
		<h2 class="section-title light" data-reveal style="--d:.06s">Wedding Gift</h2>
		<p class="note" data-reveal style="--d:.12s">{w.gift.note}</p>

		<div class="accounts">
			{#each w.gift.accounts as acc, i}
				<article class="account-card" data-reveal style="--d:{0.15 + i * 0.1}s">
					<header class="acc-head">
						<span class="bank-logo" aria-hidden="true">
							{#if acc.bank === 'DANA'}<span class="dana">DANA</span>{:else if acc.bank === 'BCA'}<span class="bca">BCA</span>{:else if acc.bank === 'BNI'}<span class="bni">BNI</span>{:else}<Landmark size={18} />{/if}
						</span>
						<div>
							<h3>{acc.bank}</h3>
							<p>a.n. {acc.holder}</p>
						</div>
					</header>

					<div class="number-row">
						<div>
							<span class="lbl">Nomor Rekening</span>
							<strong class="num">{acc.number.replace(/(\d{4})(?=\d)/g, '$1 ')}</strong>
						</div>
						<button
							class="copy-btn"
							class:ok={copied.has(i)}
							type="button"
							aria-label="Salin nomor rekening"
							onclick={() => copyNumber(i, acc.number)}
						>
							{#if copied.has(i)}
								<Check size={15} />
								Salin
							{:else}
								<Copy size={15} />
								Salin
							{/if}
						</button>
					</div>
				</article>
			{/each}
		</div>

		<!-- Kirim hadiah offline -->
		<div class="offline" data-reveal>
			<div class="offline-icon"><MapPin size={18} /></div>
			<div>
				<h3>Kirim Hadiah</h3>
				<p>
					Kirim kado/hadiah fisik ke alamat kami di:<br />
					<strong>{w.venue.name}, {w.venue.address}</strong>
				</p>
			</div>
			<a class="btn-map-light" href={w.venue.mapsUrl} target="_blank" rel="noopener">
				Lihat Lokasi
			</a>
		</div>

		<Ornament tone="light" />
	</div>

	<div class="gift-flag" aria-hidden="true">
		<svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
			<defs>
				<filter id="cloth-ripple" x="-10%" y="-30%" width="120%" height="160%">
					<feTurbulence type="fractalNoise" baseFrequency="0.012 0.11" numOctaves="1" seed="7" result="n">
						<animate attributeName="baseFrequency" dur="3.4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1" keyTimes="0;0.5;1" values="0.012 0.11;0.014 0.13;0.012 0.11" />
					</feTurbulence>
					<feDisplacementMap in="SourceGraphic" in2="n" scale="4.5" xChannelSelector="R" yChannelSelector="G" />
				</filter>
			</defs>
			<g class="flag-layer flag-layer--back">
				<path class="flag-wave" filter="url(#cloth-ripple)" opacity="0.38" fill="var(--paper)" d="M0 30 C 140 14 340 48 480 30 C 620 12 820 52 960 30 C 1100 10 1300 54 1440 30 L1440 80 L0 80 Z">
					<animate attributeName="d" dur="2.9s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1" keyTimes="0;0.33;0.66;1" values="M0 30 C 140 14 340 48 480 30 C 620 12 820 52 960 30 C 1100 10 1300 54 1440 30 L1440 80 L0 80 Z;M0 32 C 150 46 330 18 480 32 C 630 50 810 16 960 32 C 1110 52 1290 14 1440 32 L1440 80 L0 80 Z;M0 28 C 130 8 350 52 480 28 C 610 4 830 58 960 28 C 1090 2 1310 60 1440 28 L1440 80 L0 80 Z;M0 30 C 140 14 340 48 480 30 C 620 12 820 52 960 30 C 1100 10 1300 54 1440 30 L1440 80 L0 80 Z" />
				</path>
			</g>
			<g class="flag-layer flag-layer--mid">
				<path class="flag-wave" fill="var(--paper)" opacity="0.72" d="M0 36 C 150 52 330 18 480 36 C 630 54 810 14 960 36 C 1110 56 1290 12 1440 36 L1440 80 L0 80 Z">
					<animate attributeName="d" dur="3.4s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1" keyTimes="0;0.33;0.66;1" values="M0 36 C 150 52 330 18 480 36 C 630 54 810 14 960 36 C 1110 56 1290 12 1440 36 L1440 80 L0 80 Z;M0 34 C 140 20 340 52 480 34 C 620 18 820 56 960 34 C 1100 16 1300 60 1440 34 L1440 80 L0 80 Z;M0 38 C 160 62 320 10 480 38 C 640 64 800 8 960 38 C 1120 66 1280 6 1440 38 L1440 80 L0 80 Z;M0 36 C 150 52 330 18 480 36 C 630 54 810 14 960 36 C 1110 56 1290 12 1440 36 L1440 80 L0 80 Z" />
				</path>
			</g>
			<g class="flag-layer flag-layer--front">
				<path class="flag-wave" fill="var(--paper)" d="M0 42 C 160 60 320 22 480 42 C 640 62 800 18 960 42 C 1120 64 1280 16 1440 42 L1440 80 L0 80 Z">
					<animate attributeName="d" dur="2.4s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1" keyTimes="0;0.33;0.66;1" values="M0 42 C 160 60 320 22 480 42 C 640 62 800 18 960 42 C 1120 64 1280 16 1440 42 L1440 80 L0 80 Z;M0 40 C 150 28 330 58 480 40 C 630 26 810 62 960 40 C 1110 24 1290 66 1440 40 L1440 80 L0 80 Z;M0 44 C 170 70 310 14 480 44 C 650 74 790 10 960 44 C 1130 76 1270 8 1440 44 L1440 80 L0 80 Z;M0 42 C 160 60 320 22 480 42 C 640 62 800 18 960 42 C 1120 64 1280 16 1440 42 L1440 80 L0 80 Z" />
				</path>
			</g>
		</svg>
	</div>
</section>

<style>
	.gift {
		padding: 5.5rem 0 7.2rem;
		background:
			radial-gradient(90% 55% at 50% 0%, rgba(107, 107, 107, 0.22), transparent 70%),
			linear-gradient(165deg, var(--green-900), #2e2e2e 80%);
		color: #ededed;
		position: relative;
		isolation: isolate;
		overflow: hidden;
	}

	.gift-flag {
		position: absolute;
		left: 0;
		right: 0;
		bottom: -1px;
		height: 80px;
		pointer-events: none;
		overflow: hidden;
	}

	.gift-flag svg {
		display: block;
		width: 100%;
		height: 80px;
		filter: drop-shadow(0 -6px 14px rgba(0, 0, 0, 0.2));
	}

	.flag-layer--back {
		animation: cloth-sway 2.9s ease-in-out infinite;
		transform-origin: 50% 100%;
	}

	.flag-layer--mid {
		animation: cloth-sway 3.4s ease-in-out infinite reverse;
		transform-origin: 50% 100%;
	}

	.flag-layer--front {
		animation: cloth-sway 2.4s ease-in-out infinite;
		animation-delay: -0.4s;
		transform-origin: 50% 100%;
	}

	@keyframes cloth-sway {
		0%,
		100% {
			transform: translateY(0) skewX(0deg);
		}
		28% {
			transform: translateY(-1px) skewX(0.35deg);
		}
		62% {
			transform: translateY(0.8px) skewX(-0.3deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.flag-layer--back,
		.flag-layer--mid,
		.flag-layer--front {
			animation: none;
		}
		.gift-flag animate {
			begin: indefinite;
		}
	}

	.gift :global(.batik.dark) {
		opacity: 0.13;
	}

	.gift .wrap {
		position: relative;
		z-index: 1;
	}

	.kicker.light {
		color: var(--gold);
	}

	.section-title.light {
		color: #fff;
	}

	.note {
		text-align: center;
		max-width: 33em;
		margin: 1rem auto 2.4rem;
		font-size: 15px;
		line-height: 1.9;
		color: rgba(242, 236, 217, 0.85);
	}

	.accounts {
		display: grid;
		gap: 1.3rem;
		margin-bottom: 2rem;
		width: min(100%, 720px);
		margin-inline: auto;
	}

	@media (min-width: 680px) {
		.accounts {
			grid-template-columns: 1fr 1fr;
			gap: 1.4rem;
		}
	}

	.account-card {
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.16);
		backdrop-filter: blur(4px);
		border-radius: 20px;
		padding: 1.35rem 1.4rem 1.15rem;
	}

	.acc-head {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		margin-bottom: 1rem;
	}

	.bank-logo {
		width: 46px;
		height: 46px;
		border-radius: 12px;
		display: grid;
		place-items: center;
		background: #fff;
		overflow: hidden;
		font-weight: 700;
		font-size: 17px;
		color: #00529c;
	}

	.bank-logo .bca {
		font-style: italic;
		font-weight: 800;
		letter-spacing: -0.02em;
		color: #00529c;
		font-size: 18px;
	}

	.bank-logo .bni {
		font-weight: 800;
		color: #f68b1f;
		font-size: 18px;
		letter-spacing: -0.02em;
	}

	.bank-logo:has(.dana) {
		background: #108ee9;
	}

	.bank-logo .dana {
		font-weight: 800;
		color: #fff;
		font-size: 14px;
		letter-spacing: 0.02em;
	}

	.acc-head h3 {
		margin: 0;
		font-size: 16px;
		color: #fff;
		letter-spacing: 0.04em;
	}

	.acc-head p {
		margin: 0.15rem 0 0;
		font-size: 12.5px;
		color: rgba(242, 236, 217, 0.65);
	}

	.number-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
		border-top: 1px dashed rgba(255, 255, 255, 0.18);
		padding-top: 0.85rem;
	}

	.lbl {
		display: block;
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: rgba(242, 236, 217, 0.55);
	}

	.num {
		display: block;
		margin-top: 0.2rem;
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		font-size: clamp(16px, 4.4vw, 19px);
		font-weight: 700;
		letter-spacing: 0.08em;
		color: #fff7d6;
		text-shadow: 0 1px 10px rgba(0, 0, 0, 0.45);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.copy-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		flex-shrink: 0;
		border: 1px solid rgba(255, 255, 255, 0.3);
		background: transparent;
		color: #ededed;
		border-radius: 999px;
		padding: 0.5em 1em;
		font-size: 12.5px;
		cursor: pointer;
		transition: background 0.25s ease, border-color 0.25s ease;
	}

	.copy-btn:hover {
		background: rgba(255, 255, 255, 0.12);
	}

	.copy-btn.ok {
		border-color: var(--gold);
		color: #e0e0e0;
	}

	.offline {
		display: grid;
		gap: 0.9rem;
		text-align: center;
		background: rgba(255, 255, 255, 0.05);
		border: 1px dashed rgba(255, 255, 255, 0.25);
		border-radius: 20px;
		padding: 1.6rem 1.4rem;
		margin-bottom: 2.6rem;
	}

	@media (min-width: 760px) {
		.offline {
			grid-template-columns: auto 1fr auto;
			text-align: left;
			align-items: center;
		}
	}

	.offline-icon {
		width: 42px;
		height: 42px;
		margin-inline: auto;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: var(--gold);
		color: #fff;
	}

	@media (min-width: 760px) {
		.offline-icon {
			margin-inline: 0;
		}
	}

	.offline h3 {
		margin: 0 0 0.2rem;
		font-family: var(--font-serif);
		font-size: 19px;
		color: #fff;
	}

	.offline p {
		margin: 0;
		font-size: 13.5px;
		line-height: 1.8;
		color: rgba(242, 236, 217, 0.75);
	}

	.offline p strong {
		color: #ffffff;
		font-weight: 500;
	}

	.btn-map-light {
		justify-self: center;
		display: inline-flex;
		align-items: center;
		text-decoration: none;
		border: 1px solid var(--gold);
		color: #e0e0e0;
		border-radius: 999px;
		padding: 0.6em 1.4em;
		font-size: 13px;
		letter-spacing: 0.05em;
		transition: background 0.25s ease;
	}

	.btn-map-light:hover {
		background: rgba(107, 107, 107, 0.22);
	}
</style>
