<script lang="ts">
	import { MessageCircle } from 'lucide-svelte';
	import SocialIcon from './SocialIcon.svelte';
	import { wedding } from '$lib/data/wedding';
	import Photo from './Photo.svelte';
	import Ornament from './Ornament.svelte';
	import BatikTexture from './BatikTexture.svelte';
</script>

<section id="couple" class="couple" aria-label="Pasangan mempelai">
	<BatikTexture variant="light" opacity={0.06} size={210} />
	<div class="wrap-wide">
		<div class="person">
			<div class="photo-wrap" data-reveal="zoom" style="--d:.15s">
				<span class="side-label bride" aria-hidden="true" data-reveal style="--d:.06s">THE BRIDE</span>
				<div class="photo-frame">
					<Photo base={wedding.photos.bride} alt={`Foto ${wedding.bride.name}`} eager />
					<span class="photo-ring" aria-hidden="true"></span>
					<div class="photo-caption">
						<h2 class="caption-name" data-reveal style="--d:.18s">{wedding.bride.name}</h2>
						<p class="caption-relation" data-reveal style="--d:.26s">{@html wedding.bride.relation.replace(/\n/g, '<br />')}</p>
						<div class="socials socials--overlay" data-reveal style="--d:.34s">
							{#if wedding.bride.instagram}
								<a href={wedding.bride.instagram} target="_blank" rel="noopener" aria-label="Instagram">
									<SocialIcon />
								</a>
							{/if}
							{#if wedding.bride.whatsapp}
								<a href={wedding.bride.whatsapp} target="_blank" rel="noopener" aria-label="WhatsApp">
									<MessageCircle size={17} />
								</a>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="dengan" data-reveal>
			<Ornament tone="green" />
			<p data-reveal style="--d:.08s">Dengan</p>
		</div>

		<div class="person reverse">
			<div class="photo-wrap" data-reveal="zoom" style="--d:.15s">
				<span class="side-label groom" aria-hidden="true" data-reveal style="--d:.06s">THE GROOM</span>
				<div class="photo-frame">
					<Photo base={wedding.photos.groom} alt={`Foto ${wedding.groom.name}`} eager />
					<span class="photo-ring" aria-hidden="true"></span>
					<div class="photo-caption">
						<h2 class="caption-name" data-reveal style="--d:.18s">{wedding.groom.name}</h2>
						<p class="caption-relation" data-reveal style="--d:.26s">{@html wedding.groom.relation.replace(/\n/g, '<br />')}</p>
						<div class="socials socials--overlay" data-reveal style="--d:.34s">
							{#if wedding.groom.instagram}
								<a href={wedding.groom.instagram} target="_blank" rel="noopener" aria-label="Instagram">
									<SocialIcon />
								</a>
							{/if}
							{#if wedding.groom.whatsapp}
								<a href={wedding.groom.whatsapp} target="_blank" rel="noopener" aria-label="WhatsApp">
									<MessageCircle size={17} />
								</a>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.couple {
		position: relative;
		isolation: isolate;
		padding: 4.5rem 0;
		background: var(--paper);
		overflow: hidden;
	}

	.couple :global(.batik) {
		z-index: 0;
	}

	.couple .wrap-wide,
	.couple .dengan {
		position: relative;
		z-index: 1;
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

	.photo-wrap {
		position: relative;
		width: min(100%, 380px);
		margin-inline: auto;
		display: flex;
		align-items: stretch;
		gap: 0;
	}

	.side-label {
		--r: 0deg;
		writing-mode: vertical-rl;
		text-orientation: mixed;
		display: grid;
		place-items: center;
		font-family: var(--font-serif);
		font-weight: 700;
		font-size: clamp(18px, 5vw, 30px);
		letter-spacing: 0.52em;
		line-height: 1;
		color: var(--ink);
		background: linear-gradient(180deg, var(--paper-2), var(--tan-100));
		border: 1px solid var(--line);
		padding: 1.1rem 0.62rem;
		flex-shrink: 0;
		text-transform: uppercase;
		transform: rotate(var(--r));
	}

	.side-label.bride {
		--r: 180deg;
		border-radius: 18px 0 0 18px;
		border-right: 0;
	}

	.side-label.groom {
		border-radius: 0 18px 18px 0;
		border-left: 0;
		order: 1;
	}

	:global(html.js .side-label[data-reveal]) {
		opacity: 0;
		transform: rotate(var(--r)) scale(0.62);
		letter-spacing: 0.08em;
		transform-origin: center center;
		transition:
			opacity 1.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) var(--d, 0s),
			transform 2.4s cubic-bezier(0.16, 1, 0.3, 1) var(--d, 0s),
			letter-spacing 2.2s cubic-bezier(0.16, 1, 0.3, 1) var(--d, 0s);
	}

	:global(html.js .side-label[data-reveal].is-in) {
		opacity: 1;
		transform: rotate(var(--r)) scale(1);
		letter-spacing: 0.52em;
	}

	.photo-frame {
		position: relative;
		flex: 1;
		aspect-ratio: 4 / 5;
		overflow: hidden;
		box-shadow: var(--shadow-2);
	}

	.person:not(.reverse) .photo-frame {
		border-radius: 0 220px 18px 0;
	}

	.person.reverse .photo-frame {
		border-radius: 220px 0 0 18px;
	}

	.photo-ring {
		position: absolute;
		inset: 10px;
		border: 1px solid rgba(255, 255, 255, 0.75);
		border-radius: inherit;
		pointer-events: none;
		z-index: 1;
	}

	.photo-caption {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 2;
		text-align: center;
		padding: 2.2rem 1rem 1rem;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.38) 50%, transparent 100%);
		pointer-events: none;
	}

	.photo-caption :global(.socials--overlay) {
		pointer-events: auto;
	}

	.caption-name {
		margin: 0 0 0.25rem;
		font-family: 'Great Vibes', 'Pinyon Script', cursive;
		font-weight: 400;
		font-size: clamp(34px, 7vw, 48px);
		line-height: 1;
		letter-spacing: 0.02em;
		color: #fff;
		text-shadow: 0 2px 18px rgba(0, 0, 0, 0.7);
	}

	.caption-relation {
		margin: 0;
		font-family: var(--font-serif);
		font-style: italic;
		font-size: 13px;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.92);
		text-shadow: 0 1px 10px rgba(0, 0, 0, 0.7);
	}

	.meta {
		text-align: center;
	}

	@media (min-width: 780px) {
		.meta {
			text-align: left;
		}
	}



	.socials {
		display: none;
	}

	.socials--overlay {
		display: flex;
		gap: 0.6rem;
		justify-content: center;
		margin-top: 0.7rem;
		pointer-events: auto;
	}

	.socials--overlay a {
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.55);
		background: rgba(255, 255, 255, 0.14);
		backdrop-filter: blur(6px);
		color: #fff;
		transition: background 0.25s ease, transform 0.25s ease;
	}

	.socials--overlay a:hover {
		background: rgba(255, 255, 255, 0.28);
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
