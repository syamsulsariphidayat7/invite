<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { wedding } from '$lib/data/wedding';

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="turnstile-sitekey" content={data?.turnstileSiteKey ?? ''} />
	<title>{wedding.siteTitle}</title>
	<meta name="description" content={wedding.metaDescription} />
	<link rel="canonical" href="https://invite.boundless.my.id/{wedding.slug}" />

	<!-- Open Graph / WhatsApp / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://invite.boundless.my.id/{wedding.slug}" />
	<meta property="og:title" content={wedding.siteTitle} />
	<meta property="og:description" content={wedding.metaDescription} />
	<meta property="og:image" content="https://invite.boundless.my.id/photos/hero.jpg" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="Foto Pernikahan {wedding.namesShort}" />
	<meta property="og:site_name" content={wedding.siteTitle} />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={wedding.siteTitle} />
	<meta name="twitter:description" content={wedding.metaDescription} />
	<meta name="twitter:image" content="https://invite.boundless.my.id/photos/hero.jpg" />

	<meta name="robots" content="index,follow" />
</svelte:head>

{@render children()}

<style>
	/* ============================================================
	   Design system — palet botanikal-gold mengikuti gaya referensi
	   (lovestory.web.id template "StoryLove"): krem, emas, hijau tua
	   ============================================================ */
	:global(:root) {
		--paper: #f5f5f5;
		--paper-2: #eeeeee;
		--card: #ffffff;
		--line: #d9d9d9;
		--line-soft: #e8e8e8;

		--ink: #2b2b2b;
		--ink-2: #6b6b6b;
		--ink-3: #9a9a9a;

		--gold: #6b6b6b;
		--gold-2: #8a8a8a;
		--gold-3: #525252;
		--tan-100: #eeeeee;

		--green-900: #3a3a3a;
		--green-800: #4a4a4a;
		--green-700: #6b6b6b;
		--green-600: #808080;
		--green-500: #9a9a9a;
		--green-100: #ededed;

		--rose: #b0b0b0;
		--rose-100: #f0f0f0;

		--font-body: 'Rubik', system-ui, sans-serif;
		--font-serif: 'Playfair Display', Georgia, serif;
		--font-display: 'Abril Fatface', Georgia, serif;
		--font-script: 'Alex Brush', cursive;
		--font-hand: 'Handlee', cursive;

		--shadow-1: 0 6px 24px rgba(0, 0, 0, 0.07);
		--shadow-2: 0 18px 50px rgba(0, 0, 0, 0.12);
		--radius: 18px;

		color-scheme: light;
	}

	:global(html) {
		scroll-behavior: smooth;
		-webkit-text-size-adjust: 100%;
	}

	:global(body) {
		margin: 0;
		background: var(--paper);
		color: var(--ink-2);
		font-family: var(--font-body);
		font-size: 16px;
		line-height: 1.7;
		font-weight: 400;
		-webkit-font-smoothing: antialiased;
		overflow-x: hidden;
	}

	:global(*),
	:global(*::before),
	:global(*::after) {
		box-sizing: border-box;
	}

	:global(img) {
		max-width: 100%;
		display: block;
	}

	:global(a) {
		color: inherit;
	}

	:global(button) {
		font-family: inherit;
	}

	:global(::selection) {
		background: var(--green-800);
		color: #fff;
	}

	:global(:focus-visible) {
		outline: 2px solid var(--gold-3);
		outline-offset: 3px;
	}

	/* --- teks pembantu umum --- */
	:global(.kicker) {
		display: block;
		text-align: center;
		font-family: var(--font-serif);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.34em;
		font-size: 11px;
		color: var(--gold-3);
		margin: 0;
	}

	:global(.section-title) {
		font-family: var(--font-serif);
		font-weight: 600;
		color: var(--ink);
		text-align: center;
		margin: 0.55em 0 0;
		line-height: 1.25;
		font-size: clamp(26px, 6vw, 38px);
	}

	:global(.wrap) {
		width: min(100% - 3rem, 660px);
		margin-inline: auto;
	}

	:global(.wrap-wide) {
		width: min(100% - 3rem, 980px);
		margin-inline: auto;
	}

	/* --- tombol --- */
	:global(.btn) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.55em;
		border: 0;
		cursor: pointer;
		text-decoration: none;
		font-weight: 500;
		font-size: 14px;
		letter-spacing: 0.06em;
		border-radius: 999px;
		padding: 0.85em 1.7em;
		transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
		-webkit-tap-highlight-color: transparent;
	}

	:global(.btn:active) {
		transform: scale(0.97);
	}

	:global(.btn-green) {
		background: linear-gradient(135deg, var(--green-600), var(--green-800));
		color: #fff;
		box-shadow: 0 10px 22px rgba(0, 0, 0, 0.14);
	}

	:global(.btn-green:hover) {
		box-shadow: 0 14px 28px rgba(0, 0, 0, 0.2);
		transform: translateY(-2px);
	}

	:global(.btn-gold) {
		background: linear-gradient(135deg, var(--gold), var(--gold-2));
		color: #fff;
		box-shadow: 0 10px 22px rgba(156, 129, 78, 0.3);
	}

	:global(.btn-ghost) {
		background: transparent;
		border: 1px solid currentColor;
	}

	:global(html.js [data-reveal]) {
		opacity: 0;
		transform: scale(0.78);
		letter-spacing: 0.14em;
		transform-origin: center center;
		transition:
			opacity 1.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) var(--d, 0s),
			transform 2.4s cubic-bezier(0.16, 1, 0.3, 1) var(--d, 0s),
			letter-spacing 2.2s cubic-bezier(0.16, 1, 0.3, 1) var(--d, 0s);
		will-change: opacity, transform;
	}

	:global(html.js [data-reveal='zoom']) {
		transform: scale(0.74);
	}

	:global(html.js [data-reveal].is-in) {
		opacity: 1;
		transform: scale(1);
		letter-spacing: inherit;
	}

	@media (prefers-reduced-motion: reduce) {
		:global(html.js [data-reveal]) {
			opacity: 1;
			transform: none;
			transition: none;
		}
	}
</style>
