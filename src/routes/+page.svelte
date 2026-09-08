<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	const ROOT_SLUG = 'demo';
	onMount(() => goto(`/${ROOT_SLUG}${page.url.search}`, { replaceState: true }));
</script>

<div class="redirecting"><p>Membuka undangan…</p></div>

<style>
	.redirecting {
		min-height: 100svh;
		display: grid;
		place-items: center;
		color: var(--ink-2);
		font-family: var(--font-serif);
		font-style: italic;
	}
</style>
