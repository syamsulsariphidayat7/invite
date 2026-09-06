<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { Copy, Check, Trash2, Send, Link2, Users, UserPlus, Upload } from 'lucide-svelte';
	import { wedding } from '$lib/data/wedding';

	let single = $state('');
	let bulk = $state('');
	let guests = $state<string[]>([]);
	let copied = $state<string | null>(null);
	let origin = $state('');

	const STORAGE_KEY = 'undangan_guests';

	onMount(() => {
		origin = window.location.origin;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) guests = JSON.parse(raw);
		} catch {}
	});

	$effect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(guests));
		}
	});

	function linkFor(name: string) {
		return `${origin || page.url.origin}/${wedding.slug}?to=${encodeURIComponent(name)}`;
	}

	function waLink(name: string) {
		const link = linkFor(name);
		const msg = `Halo ${name}, kamu diundang ke pernikahan Ruhaeni & Roni 💍\n\nBuka undangannya di sini ya:\n${link}\n\nMohon doa & kehadirannya 🙏`;
		return `https://wa.me/?text=${encodeURIComponent(msg)}`;
	}

	async function copy(text: string, id: string) {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			const ta = document.createElement('textarea');
			ta.value = text;
			document.body.appendChild(ta);
			ta.select();
			document.execCommand('copy');
			ta.remove();
		}
		copied = id;
		setTimeout(() => (copied = null), 1800);
	}

	function addSingle() {
		const n = single.trim();
		if (!n) return;
		if (guests.includes(n)) {
			single = '';
			return;
		}
		guests = [...guests, n];
		single = '';
	}

	function addBulk() {
		const lines = bulk
			.split('\n')
			.map((s) => s.trim())
			.filter(Boolean);
		if (!lines.length) return;
		const set = new Set(guests);
		for (const l of lines) set.add(l);
		guests = [...set];
		bulk = '';
	}

	function remove(name: string) {
		guests = guests.filter((g) => g !== name);
	}

	function clearAll() {
		if (!confirm(`Hapus ${guests.length} tamu?`)) return;
		guests = [];
	}
</script>

<svelte:head>
	<title>Daftar Tamu — Ruhaeni & Roni</title>
</svelte:head>

<div class="tamu">
	<div class="wrap">
		<header class="head" data-reveal>
			<p class="kicker">Tamu Undangan</p>
			<h1>Daftar Tamu Tujuan</h1>
			<p class="desc">
				Tambah nama tamu, lalu salin link personal <code>?to=Nama</code> untuk dikirim via WhatsApp. Data tersimpan di browser ini (localStorage).
			</p>
		</header>

		<div class="card" data-reveal style="--d:.08s">
			<label>
				<span><UserPlus size={13} /> Tambah tamu</span>
				<div class="row">
					<input placeholder="Nama tamu, mis. Bapak Budi" bind:value={single} onkeydown={(e) => e.key === 'Enter' && addSingle()} />
					<button class="btn btn-green" onclick={addSingle}><UserPlus size={15} /> Tambah</button>
				</div>
			</label>

			<label>
				<span><Upload size={13} /> Import banyak (satu nama per baris)</span>
				<textarea rows="4" placeholder="Budi Santoso&#10;Siti & Keluarga&#10;Kak Andi" bind:value={bulk}></textarea>
				<button class="btn btn-ghost" onclick={addBulk}><Upload size={15} /> Import</button>
			</label>

			<div class="stats">
				<span><Users size={14} /> {guests.length} tamu</span>
				{#if guests.length}
					<button class="danger" onclick={clearAll}><Trash2 size={14} /> Hapus semua</button>
				{/if}
			</div>
		</div>

		<div class="list" data-reveal style="--d:.12s">
			{#if guests.length === 0}
				<p class="empty">Belum ada tamu. Tambahkan nama di atas.</p>
			{:else}
				{#each guests as name, i}
					<article class="item">
						<div class="idx">{i + 1}</div>
						<div class="info">
							<strong>{name}</strong>
							<a class="link" href={linkFor(name)} target="_blank" rel="noopener"><Link2 size={12} /> {linkFor(name)}</a>
						</div>
						<div class="actions">
							<button class="ic" class:ok={copied === `copy-${i}`} onclick={() => copy(linkFor(name), `copy-${i}`)} aria-label="Salin link">
								{#if copied === `copy-${i}`}<Check size={16} />{:else}<Copy size={16} />{/if}
							</button>
							<a class="ic wa" href={waLink(name)} target="_blank" rel="noopener" aria-label="Kirim WA"><Send size={16} /></a>
							<button class="ic del" onclick={() => remove(name)} aria-label="Hapus"><Trash2 size={16} /></button>
						</div>
					</article>
				{/each}
			{/if}
		</div>

		<a class="back" href="/">← Kembali ke undangan</a>
	</div>
</div>

<style>
	.tamu {
		min-height: 100svh;
		background: var(--paper);
		padding: 2.5rem 0 4rem;
	}
	.head {
		text-align: center;
		margin-bottom: 1.8rem;
	}
	.head h1 {
		margin: 0.3rem 0 0.4rem;
		font-family: var(--font-serif);
		font-size: clamp(26px, 6vw, 34px);
		color: var(--ink);
	}
	.desc {
		margin: 0 auto;
		max-width: 34em;
		font-size: 13.5px;
		color: var(--ink-2);
		line-height: 1.7;
	}
	.desc code {
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 6px;
		padding: 0.1em 0.35em;
		font-size: 12px;
	}
	.card {
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 18px;
		padding: 1.4rem;
		display: grid;
		gap: 1rem;
		box-shadow: var(--shadow-1);
		margin-bottom: 1.4rem;
	}
	.card label span {
		display: flex;
		align-items: center;
		gap: 0.4em;
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--ink-2);
		margin-bottom: 0.45rem;
	}
	.row {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.6rem;
	}
	input,
	textarea {
		width: 100%;
		border: 1px solid var(--line);
		border-radius: 12px;
		background: #fff;
		padding: 0.7em 0.9em;
		font-family: inherit;
		font-size: 14px;
		color: var(--ink);
		box-sizing: border-box;
	}
	input:focus,
	textarea:focus {
		outline: none;
		border-color: var(--gold-2);
		box-shadow: 0 0 0 3px rgba(107, 107, 107, 0.14);
	}
	.stats {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 13px;
		color: var(--ink-2);
	}
	.stats span {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
	}
	.danger {
		border: 1px solid var(--line);
		background: transparent;
		border-radius: 999px;
		padding: 0.35em 0.8em;
		font-size: 12px;
		color: var(--ink-2);
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
	}
	.list {
		display: grid;
		gap: 0.7rem;
	}
	.empty {
		text-align: center;
		color: var(--ink-3);
		font-style: italic;
		border: 1px dashed var(--line);
		border-radius: 14px;
		padding: 1.4rem;
		background: var(--card);
	}
	.item {
		display: grid;
		grid-template-columns: 38px 1fr auto;
		gap: 0.7rem;
		align-items: center;
		background: var(--card);
		border: 1px solid var(--line-soft);
		border-radius: 14px;
		padding: 0.75rem 0.7rem;
		box-shadow: var(--shadow-1);
	}
	.idx {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: var(--green-100);
		color: var(--ink-2);
		font-size: 12px;
		font-weight: 600;
	}
	.info {
		min-width: 0;
	}
	.info strong {
		display: block;
		font-size: 14px;
		color: var(--ink);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.link {
		display: inline-flex;
		align-items: center;
		gap: 0.3em;
		font-size: 11px;
		color: var(--ink-3);
		text-decoration: none;
		word-break: break-all;
	}
	.link:hover {
		color: var(--gold-3);
	}
	.actions {
		display: flex;
		gap: 0.35rem;
	}
	.ic {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border: 1px solid var(--line);
		background: #fff;
		display: grid;
		place-items: center;
		color: var(--ink-2);
		cursor: pointer;
		text-decoration: none;
	}
	.ic.ok {
		border-color: var(--gold-2);
		color: var(--gold-3);
	}
	.ic.wa:hover {
		background: #25d366;
		color: #fff;
		border-color: #25d366;
	}
	.ic.del:hover {
		background: #fee;
		color: #a33;
		border-color: #eaa;
	}
	.back {
		display: inline-flex;
		margin-top: 1.4rem;
		font-size: 13px;
		color: var(--ink-2);
		text-decoration: none;
	}
	.back:hover {
		color: var(--ink);
	}
</style>
