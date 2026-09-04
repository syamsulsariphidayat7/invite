<script lang="ts">
	import { Home, Heart, CalendarDays, Images, Gift, MessageCircle } from 'lucide-svelte';

	const items = [
		{ id: 'home', label: 'Home', Icon: Home },
		{ id: 'couple', label: 'Couple', Icon: Heart },
		{ id: 'event', label: 'Event', Icon: CalendarDays },
		{ id: 'gallery', label: 'Gallery', Icon: Images },
		{ id: 'gift', label: 'Gift', Icon: Gift },
		{ id: 'wishes', label: 'Wishes', Icon: MessageCircle }
	];
</script>

<nav class="bottom-nav" aria-label="Navigasi utama">
	<ul>
		{#each items as { id, label, Icon }}
			<li>
				<a href="#{id}">
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
		box-shadow: 0 12px 36px rgba(35, 52, 26, 0.22);
	}

	.bottom-nav a {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.14rem;
		text-decoration: none;
		color: var(--ink-2);
		padding: 0.4rem 0.55rem;
		border-radius: 999px;
		transition: color 0.25s ease, background 0.25s ease, transform 0.2s ease;
		min-width: 52px;
	}

	.bottom-nav a:hover,
	.bottom-nav a:focus-visible {
		color: var(--green-700);
		background: var(--green-100);
	}

	.bottom-nav a:active {
		transform: scale(0.94);
	}

	.ic {
		display: grid;
		place-items: center;
	}

	.lbl {
		font-size: 9.5px;
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	@media (min-width: 720px) {
		.bottom-nav a {
			min-width: 74px;
		}
	}
</style>
