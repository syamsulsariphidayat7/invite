<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { wedding } from '$lib/data/wedding';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{wedding.siteTitle}</title>
	<meta name="description" content={wedding.metaDescription} />
	<meta property="og:title" content={wedding.siteTitle} />
	<meta property="og:description" content={wedding.metaDescription} />
	<meta property="og:type" content="website" />
	<meta name="robots" content="index,follow" />
</svelte:head>

{@render children()}

<style>
	/* ============================================================
	   Design system — palet botanikal-gold mengikuti gaya referensi
	   (lovestory.web.id template "StoryLove"): krem, emas, hijau tua
	   ============================================================ */
	:global(:root) {
		--paper: #fdfbf6;
		--paper-2: #f6f0e1;
		--card: #ffffff;
		--line: #e8ddc6;
		--line-soft: #f0e8d6;

		--ink: #3d392f;
		--ink-2: #6f6a5d;
		--ink-3: #9a9382;

		--gold: #c5b297;
		--gold-2: #b39a72;
		--gold-3: #9c814e;
		--tan-100: #f4ecdc;

		--green-900: #23341a;
		--green-800: #2c431f;
		--green-700: #3c5c2b;
		--green-600: #557a3c;
		--green-500: #749a55;
		--green-100: #e9f0e0;

		--rose: #cfa2ac;
		--rose-100: #f7ebee;

		--font-body: 'Rubik', system-ui, sans-serif;
		--font-serif: 'Playfair Display', Georgia, serif;
		--font-display: 'Abril Fatface', Georgia, serif;
		--font-script: 'Alex Brush', cursive;
		--font-hand: 'Handlee', cursive;

		--shadow-1: 0 6px 24px rgba(61, 57, 47, 0.08);
		--shadow-2: 0 18px 50px rgba(61, 57, 47, 0.14);
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
		box-shadow: 0 10px 22px rgba(44, 67, 31, 0.28);
	}

	:global(.btn-green:hover) {
		box-shadow: 0 14px 28px rgba(44, 67, 31, 0.36);
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

	/* --- animasi reveal (hanya saat JS aktif) --- */
	:global(html.js [data-reveal]) {
		opacity: 0;
		transform: translateY(28px);
		transition:
			opacity 0.9s ease var(--d, 0s),
			transform 0.9s cubic-bezier(0.2, 0.7, 0.25, 1) var(--d, 0s);
		will-change: opacity, transform;
	}

	:global(html.js [data-reveal].is-in) {
		opacity: 1;
		transform: none;
	}

	@media (prefers-reduced-motion: reduce) {
		:global(html.js [data-reveal]) {
			opacity: 1;
			transform: none;
			transition: none;
		}
	}
</style>
