<script lang="ts">
	import { wedding } from '$lib/data/wedding';
	import Ornament from './Ornament.svelte';
	import BatikTexture from './BatikTexture.svelte';
</script>

<footer class="footer">
	<BatikTexture variant="dark" opacity={0.12} size={220} />
	<div class="wrap">
		<Ornament tone="light" />

		<p class="the-wedding" data-reveal>The Wedding Of</p>
		<p class="names" data-reveal style="--d:.06s">{wedding.namesShort}</p>
		<p class="date" data-reveal style="--d:.12s">{wedding.resepsi.dayLabel}</p>

		<p class="closing" data-reveal style="--d:.18s">
			Merupakan suatu kehormatan & kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir
			dan memberikan doa restu kepada kami.
		</p>
		<p class="apology" data-reveal style="--d:.24s">Mohon maaf apabila ada kesalahan penulisan nama & gelar.</p>

		<div class="bottom" data-reveal style="--d:.30s">
			<p>© 2026 {wedding.namesShort}</p>
			<p class="credit"><a href="http://boundless.my.id/" target="_blank" rel="noopener">Boundless</a></p>
		</div>
	</div>
</footer>

<style>
	.footer {
		position: relative;
		isolation: isolate;
		padding: 4.5rem 0 8rem;
		background:
			radial-gradient(90% 70% at 50% 0%, rgba(107, 107, 107, 0.22), transparent 70%),
			var(--green-900);
		color: #ededed;
		text-align: center;
		overflow: hidden;
	}

	.footer .wrap {
		position: relative;
		z-index: 1;
	}

	.the-wedding {
		margin: 1.6rem 0 0.2rem;
		font-family: var(--font-serif);
		text-transform: uppercase;
		letter-spacing: 0.4em;
		font-size: 11px;
		color: rgba(237, 237, 237, 0.65);
	}

	.names {
		margin: 0;
		font-family: 'Great Vibes', 'Pinyon Script', cursive;
		font-weight: 400;
		font-size: clamp(50px, 12vw, 80px);
		line-height: 1;
		letter-spacing: 0.02em;
		color: #fff;
	}

	.date {
		margin: 0.5rem 0 1.6rem;
		font-family: var(--font-serif);
		font-style: italic;
		color: var(--gold);
		letter-spacing: 0.06em;
	}

	.closing {
		max-width: 30em;
		margin: 0 auto 0.4rem;
		font-size: 14px;
		line-height: 2;
		color: rgba(237, 237, 237, 0.8);
	}

	.apology {
		font-size: 12.5px;
		font-style: italic;
		color: rgba(237, 237, 237, 0.55);
		margin: 0 0 1.8rem;
	}

	.bottom {
		border-top: 1px solid rgba(255, 255, 255, 0.14);
		padding-top: 1.4rem;
		display: grid;
		gap: 0.2rem;
	}

	.bottom p {
		margin: 0;
		font-size: 12px;
		color: rgba(237, 237, 237, 0.6);
		letter-spacing: 0.04em;
	}

	.credit a {
		color: inherit;
		text-decoration: none;
		border-bottom: 1px solid currentColor;
	}

	.credit a:hover {
		color: #fff;
	}
</style>
