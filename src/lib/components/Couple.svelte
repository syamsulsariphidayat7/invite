<script lang="ts">
	import { MessageCircle } from 'lucide-svelte';
	import SocialIcon from './SocialIcon.svelte';
	import { wedding } from '$lib/data/wedding';
	import Photo from './Photo.svelte';
	import Ornament from './Ornament.svelte';
</script>

<section id="couple" class="couple" aria-label="Pasangan mempelai">
	<div class="wrap-wide">
		<!-- ============ MEMPELAI WANITA ============ -->
		<div class="person" data-reveal>
			<div class="photo-frame">
				<Photo base={wedding.photos.bride} alt={`Foto ${wedding.bride.name}`} eager />
				<span class="photo-ring" aria-hidden="true"></span>
			</div>
			<div class="meta">
				<p class="kicker">The Bride</p>
				<h2 class="name">{wedding.bride.name}</h2>
				<p class="relation">{@html wedding.bride.relation.replace(/\n/g, '<br />')}</p>
				<div class="socials">
					<a href={wedding.bride.instagram || wedding.social.instagram} target="_blank" rel="noopener" aria-label="Instagram">
						<SocialIcon />
					</a>
					<a href={wedding.bride.whatsapp || wedding.social.whatsapp} target="_blank" rel="noopener" aria-label="WhatsApp">
						<MessageCircle size={17} />
					</a>
				</div>
			</div>
		</div>

		<!-- ============ "Dengan" ============ -->
		<div class="dengan" data-reveal>
			<Ornament tone="green" />
			<p>Dengan</p>
		</div>

		<!-- ============ MEMPELAI PRIA ============ -->
		<div class="person reverse" data-reveal>
			<div class="photo-frame">
				<Photo base={wedding.photos.groom} alt={`Foto ${wedding.groom.name}`} eager />
				<span class="photo-ring" aria-hidden="true"></span>
			</div>
			<div class="meta">
				<p class="kicker">The Groom</p>
				<h2 class="name">{wedding.groom.name}</h2>
				<p class="relation">{@html wedding.groom.relation.replace(/\n/g, '<br />')}</p>
				<div class="socials">
					<a href={wedding.groom.instagram || wedding.social.instagram} target="_blank" rel="noopener" aria-label="Instagram">
						<SocialIcon />
					</a>
					<a href={wedding.groom.whatsapp || wedding.social.whatsapp} target="_blank" rel="noopener" aria-label="WhatsApp">
						<MessageCircle size={17} />
					</a>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.couple {
		padding: 4.5rem 0;
		background: var(--paper);
	}

	.person {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2.2rem;
		align-items: center;
		max-width: 720px;
		margin-inline: auto;
	}

	@media (min-width: 780px) {
		.person {
			grid-template-columns: 380px 1fr;
			gap: 3.5rem;
		}

		.person.reverse {
			direction: rtl;
		}

		.person.reverse .meta {
			direction: ltr;
			text-align: right;
		}
	}

	.photo-frame {
		position: relative;
		width: min(100%, 340px);
		margin-inline: auto;
		aspect-ratio: 4 / 5;
		border-radius: 220px 220px 18px 18px;
		overflow: hidden;
		box-shadow: var(--shadow-2);
	}

	.photo-ring {
		position: absolute;
		inset: 10px;
		border: 1px solid rgba(255, 255, 255, 0.75);
		border-radius: inherit;
		pointer-events: none;
	}

	.meta {
		text-align: center;
	}

	@media (min-width: 780px) {
		.meta {
			text-align: left;
		}
	}

	.name {
		margin: 0.35rem 0 0.4rem;
		font-family: var(--font-script);
		font-weight: 400;
		font-size: clamp(40px, 9vw, 60px);
		line-height: 1.1;
		color: var(--ink);
	}

	.relation {
		margin: 0.6rem 0 1.2rem;
		font-family: var(--font-serif);
		font-style: italic;
		font-size: 16px;
		line-height: 1.8;
		color: var(--ink-2);
	}

	.socials {
		display: flex;
		gap: 0.7rem;
		justify-content: center;
	}

	@media (min-width: 780px) {
		.person:not(.reverse) .socials {
			justify-content: flex-start;
		}

		.person.reverse .socials {
			justify-content: flex-end;
		}
	}

	.socials a {
		display: grid;
		place-items: center;
		width: 42px;
		height: 42px;
		border-radius: 50%;
		border: 1px solid var(--line);
		background: var(--card);
		color: var(--green-700);
		transition: background 0.25s ease, color 0.25s ease, transform 0.25s ease;
	}

	.socials a:hover {
		background: var(--green-800);
		color: #fff;
		transform: translateY(-2px);
	}

	.dengan {
		padding: 2.6rem 0;
		text-align: center;
	}

	.dengan p {
		margin: 0.2rem 0 0;
		font-family: var(--font-script);
		font-size: 38px;
		color: var(--gold-3);
		line-height: 1;
	}
</style>
