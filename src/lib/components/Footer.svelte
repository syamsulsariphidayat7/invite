<script lang="ts">
	import { MessageCircle } from 'lucide-svelte';
	import SocialIcon from './SocialIcon.svelte';
	import { wedding } from '$lib/data/wedding';
	import Ornament from './Ornament.svelte';
</script>

<footer class="footer">
	<div class="wrap">
		<Ornament tone="light" />

		<p class="the-wedding">The Wedding Of</p>
		<p class="names">{wedding.namesShort}</p>
		<p class="date">{wedding.akad.dayLabel}</p>

		<p class="closing">
			Merupakan suatu kehormatan & kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir
			dan memberikan doa restu kepada kami.
		</p>
		<p class="apology">Mohon maaf apabila ada kesalahan penulisan nama & gelar.</p>

		<div class="socials">
			<a href={wedding.social.whatsapp} target="_blank" rel="noopener" aria-label="WhatsApp">
				<MessageCircle size={17} />
			</a>
			<a href={wedding.social.instagram} target="_blank" rel="noopener" aria-label="Instagram">
				<SocialIcon />
			</a>
		</div>

		<div class="bottom">
			<p>© 2026 {wedding.namesShort}</p>
			<p class="credit">Dibuat dengan <span aria-hidden="true">♥</span> & SvelteKit</p>
		</div>
	</div>
</footer>

<style>
	.footer {
		padding: 4.5rem 0 8rem;
		background:
			radial-gradient(90% 70% at 50% 0%, rgba(116, 154, 85, 0.14), transparent 70%),
			var(--green-900);
		color: #efe7d3;
		text-align: center;
	}

	.the-wedding {
		margin: 1.6rem 0 0.2rem;
		font-family: var(--font-serif);
		text-transform: uppercase;
		letter-spacing: 0.4em;
		font-size: 11px;
		color: rgba(239, 231, 211, 0.65);
	}

	.names {
		margin: 0;
		font-family: var(--font-script);
		font-weight: 400;
		font-size: clamp(46px, 12vw, 76px);
		line-height: 1.15;
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
		color: rgba(239, 231, 211, 0.8);
	}

	.apology {
		font-size: 12.5px;
		font-style: italic;
		color: rgba(239, 231, 211, 0.5);
		margin: 0 0 1.8rem;
	}

	.socials {
		display: flex;
		justify-content: center;
		gap: 0.9rem;
		margin-bottom: 2.6rem;
	}

	.socials a {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		border: 1px solid rgba(255, 255, 255, 0.35);
		color: #fff;
		transition: background 0.25s ease, transform 0.25s ease;
	}

	.socials a:hover {
		background: var(--gold);
		color: var(--green-900);
		transform: translateY(-2px);
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
		color: rgba(239, 231, 211, 0.55);
		letter-spacing: 0.04em;
	}

	.credit span {
		color: var(--rose);
	}
</style>
