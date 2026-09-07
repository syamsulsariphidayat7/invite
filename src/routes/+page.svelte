<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { wedding } from '$lib/data/wedding';

	let { data } = $props();

	onMount(() => {
		if (data?.invitations?.length) return;
		goto(`/${wedding.slug}${page.url.search}`, { replaceState: true });
	});
</script>

{#if data?.invitations?.length}
	<div class="listing">
		<h1>Undangan</h1>
		<p class="hint">Pilih undangan aktif</p>
		<ul>
			{#each data.invitations as inv}
				<li><a href="/{inv.subdomain}">{inv.namaPihak1} & {inv.namaPihak2} — {inv.tanggalAcara ?? inv.subdomain}</a></li>
			{/each}
		</ul>
	</div>
{:else}
	<div class="redirecting">
		<p>Membuka undangan {wedding.namesShort}…</p>
	</div>
{/if}

<style>
	.redirecting, .listing {
		min-height: 100svh;
		display: grid;
		place-items: center;
		color: var(--ink-2);
		font-family: var(--font-serif);
		font-style: italic;
	}
	.listing { place-content: center; gap: 0.6rem; font-style: normal; }
	.listing h1 { font-size: 22px; color: var(--ink); margin: 0; }
	.listing .hint { color: var(--ink-3); font-size: 13px; margin: 0; }
	.listing ul { list-style: none; padding: 0; margin: 0.8rem 0 0; display: grid; gap: 0.5rem; }
	.listing a { color: var(--ink); text-decoration: none; border: 1px solid var(--line); border-radius: 999px; padding: 0.5em 1.1em; display: inline-block; }
</style>
