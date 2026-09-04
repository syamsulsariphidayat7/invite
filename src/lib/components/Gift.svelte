<script lang="ts">
	import { Copy, Check, MapPin, Landmark } from 'lucide-svelte';
	import { wedding } from '$lib/data/wedding';
	import Ornament from './Ornament.svelte';

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
	<div class="wrap">
		<p class="kicker light" data-reveal>Amplop Digital</p>
		<h2 class="section-title light" data-reveal style="--d:.06s">Wedding Gift</h2>
		<p class="note" data-reveal style="--d:.12s">{wedding.gift.note}</p>

		<div class="accounts">
			{#each wedding.gift.accounts as acc, i}
				<article class="account-card" data-reveal style="--d:{0.15 + i * 0.1}s">
					<header class="acc-head">
						<span class="bank-logo" aria-hidden="true">
							{#if acc.bank === 'BCA'}<span class="bca">BCA</span>{:else if acc.bank === 'BNI'}<span class="bni">BNI</span>{:else}<Landmark size={18} />{/if}
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
					<strong>{wedding.venue.name}, {wedding.venue.address}</strong>
				</p>
			</div>
			<a class="btn-map-light" href={wedding.venue.mapsUrl} target="_blank" rel="noopener">
				Lihat Lokasi
			</a>
		</div>

		<Ornament tone="light" />
	</div>
</section>

<style>
	.gift {
		padding: 5.5rem 0;
		background:
			radial-gradient(90% 55% at 50% 0%, rgba(116, 154, 85, 0.16), transparent 70%),
			linear-gradient(165deg, var(--green-900), #1b2813 80%);
		color: #f2ecd9;
		position: relative;
		overflow: hidden;
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
	}

	@media (min-width: 760px) {
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
		padding: 1.4rem 1.5rem 1.2rem;
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
		gap: 0.8rem;
		border-top: 1px dashed rgba(255, 255, 255, 0.18);
		padding-top: 0.9rem;
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
		margin-top: 0.25rem;
		font-family: var(--font-serif);
		font-size: 20px;
		letter-spacing: 0.08em;
		color: #ffe3ae;
		font-variant-numeric: tabular-nums;
	}

	.copy-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		flex-shrink: 0;
		border: 1px solid rgba(255, 255, 255, 0.3);
		background: transparent;
		color: #f2ecd9;
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
		color: #ffd9a0;
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
		color: #23341a;
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
		color: #ffe3ae;
		font-weight: 500;
	}

	.btn-map-light {
		justify-self: center;
		display: inline-flex;
		align-items: center;
		text-decoration: none;
		border: 1px solid var(--gold);
		color: #ffd9a0;
		border-radius: 999px;
		padding: 0.6em 1.4em;
		font-size: 13px;
		letter-spacing: 0.05em;
		transition: background 0.25s ease;
	}

	.btn-map-light:hover {
		background: rgba(197, 178, 151, 0.16);
	}
</style>
