<script lang="ts">
	import { onMount } from 'svelte';
	import { Home, Heart, CalendarDays, Images, Gift, MessageCircle } from 'lucide-svelte';

	const items = [
		{ id: 'home', label: 'Home', Icon: Home },
		{ id: 'couple', label: 'Couple', Icon: Heart },
		{ id: 'event', label: 'Event', Icon: CalendarDays },
		{ id: 'gallery', label: 'Gallery', Icon: Images },
		{ id: 'gift', label: 'Gift', Icon: Gift },
		{ id: 'wishes', label: 'Wishes', Icon: MessageCircle }
	];

	let active = $state('home');

	onMount(() => {
		const ids = items.map((i) => i.id);
		const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
		if (!els.length) return;
		const io = new IntersectionObserver(
			(entries) => {
				const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
				if (vis[0]?.target.id) active = vis[0].target.id;
			},
			{ rootMargin: '-20% 0px -40% 0px', threshold: [0.1, 0.25, 0.5, 0.75] }
		);
		els.forEach((el) => io.observe(el));
		const onScroll = () => {
			if (window.scrollY < 120) {
				active = 'home';
				return;
			}
			if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160) {
				active = 'wishes';
			}
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();
		return () => {
			io.disconnect();
			window.removeEventListener('scroll', onScroll);
		};
	});
</script>

<nav class="bottom-nav" aria-label="Navigasi utama">
	<ul>
		{#each items as { id, label, Icon }}
			<li>
				<a href="#{id}" class:active={active === id} aria-current={active === id ? 'page' : undefined}>
					<span class="ic"><Icon size={19} /></span>
					<span class="lbl">{label}</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>

<style>
	.bottom-nav {
		position: fixed;
		left: 50%;
		transform: translateX(-50%);
		bottom: max(0.7rem, env(safe-area-inset-bottom));
		z-index: 100;
		width: min(100% - 1.4rem, 560px);
	}

	.bottom-nav ul {
		list-style: none;
		margin: 0;
		padding: 0.4rem;
		display: flex;
		justify-content: space-between;
		gap: 0.2rem;
		background: rgba(255, 253, 248, 0.92);
		backdrop-filter: blur(14px);
		border: 1px solid var(--line);
		border-radius: 999px;
		box-shadow: 0 12px 36px rgba(0, 0, 0, 0.12);
	}

	.bottom-nav a {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.14rem;
		text-decoration: none;
		color: var(--ink-3);
		padding: 0.45rem 0.65rem;
		border-radius: 999px;
		transition: all 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
		min-width: 52px;
	}

	.bottom-nav a.active {
		color: #ffffff;
		background: var(--ink);
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
	}

	.bottom-nav a.active .lbl {
		color: #ffffff;
		font-weight: 600;
	}

	.bottom-nav a.active .ic {
		transform: scale(1.08);
	}

	.bottom-nav a:not(.active):hover,
	.bottom-nav a:not(.active):focus-visible {
		color: var(--ink);
		background: var(--green-100);
	}

	.bottom-nav a:active {
		transform: scale(0.94);
	}

	.ic {
		display: grid;
		place-items: center;
		transition: transform 0.22s ease;
	}

	.lbl {
		font-size: 9.5px;
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		transition: color 0.22s ease;
	}

	@media (min-width: 720px) {
		.bottom-nav a {
			min-width: 74px;
		}
	}
</style>
