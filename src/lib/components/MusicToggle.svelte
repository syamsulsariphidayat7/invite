<script lang="ts">
	import { Music, VolumeX } from 'lucide-svelte';
	import { wedding } from '$lib/data/wedding';
	import { musicState, toggleMusic } from '$lib/music.svelte';

	let { weddingData = null }: { weddingData?: typeof wedding | null } = $props();
	const w = $derived((weddingData ?? wedding) as typeof wedding);
	const enabled = $derived(!!(((w.music as { src?: string }).src || w.music.youtubeId)));
	let state = $state({ started: false, playing: false });
	musicState.subscribe((s) => (state = s));
</script>

{#if enabled}
	<button
		class="music-btn"
		class:playing={state.playing}
		type="button"
		aria-label={state.playing ? 'Jeda musik' : 'Putar musik'}
		onclick={() => toggleMusic()}
	>
		{#if state.playing}
			<Music size={18} />
		{:else}
			<VolumeX size={18} />
		{/if}
	</button>
{/if}

<style>
	.music-btn {
		position: fixed;
		right: max(1rem, env(safe-area-inset-right));
		bottom: 6.6rem;
		z-index: 110;
		width: 46px;
		height: 46px;
		border-radius: 50%;
		border: 0;
		cursor: pointer;
		display: grid;
		place-items: center;
		background: linear-gradient(135deg, var(--green-700), var(--green-900));
		color: #fff;
		box-shadow: 0 10px 26px rgba(0, 0, 0, 0.22);
		transition: transform 0.25s ease;
	}

	.music-btn:hover {
		transform: scale(1.06);
	}

	:global(.music-btn svg) {
		animation: spin 4s linear infinite paused;
	}

	:global(.music-btn.playing svg) {
		animation-play-state: running;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
