<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import {
		Copy,
		Check,
		Trash2,
		Send,
		Link2,
		Users,
		UserPlus,
		Upload,
		Search,
		CheckCircle2,
		Circle,
		SlidersHorizontal,
		RotateCcw
	} from 'lucide-svelte';
	import { wedding } from '$lib/data/wedding';

	interface GuestItem {
		name: string;
		sent: boolean;
		sentAt?: string;
	}

	let single = $state('');
	let bulk = $state('');
	let guests = $state<GuestItem[]>([]);
	let search = $state('');
	let filter = $state<'all' | 'pending' | 'sent'>('all');
	let copied = $state<string | null>(null);
	let origin = $state('');
	let showTemplate = $state(false);

	const DEFAULT_TEMPLATE = `Halo {nama}, kamu diundang ke pernikahan Ruhaeni & Asep Roni 💍\n\nBuka undangannya di sini ya:\n{link}\n\nMohon doa & kehadirannya 🙏`;
	let template = $state(DEFAULT_TEMPLATE);

	const STORAGE_KEY = 'undangan_guests';
	const TEMPLATE_KEY = 'undangan_wa_template';

	onMount(() => {
		origin = window.location.origin;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				// Migration: convert string[] to GuestItem[]
				guests = parsed.map((item: string | GuestItem) => {
					if (typeof item === 'string') {
						return { name: item, sent: false };
					}
					return item;
				});
			}
			const tmpl = localStorage.getItem(TEMPLATE_KEY);
			if (tmpl) template = tmpl;
		} catch {}
	});

	$effect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(guests));
			localStorage.setItem(TEMPLATE_KEY, template);
		}
	});

	function linkFor(name: string) {
		return `${origin || page.url.origin}/${wedding.slug}?to=${encodeURIComponent(name)}`;
	}

	function waMessageFor(name: string) {
		const link = linkFor(name);
		return template.replace(/\{nama\}/g, name).replace(/\{link\}/g, link);
	}

	function waLink(name: string) {
		return `https://wa.me/?text=${encodeURIComponent(waMessageFor(name))}`;
	}

	function handleSendWa(g: GuestItem) {
		g.sent = true;
		g.sentAt = new Date().toISOString();
		guests = [...guests];
	}

	function toggleSent(g: GuestItem) {
		g.sent = !g.sent;
		g.sentAt = g.sent ? new Date().toISOString() : undefined;
		guests = [...guests];
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
		if (guests.some((g) => g.name.toLowerCase() === n.toLowerCase())) {
			single = '';
			return;
		}
		guests = [...guests, { name: n, sent: false }];
		single = '';
	}

	function addBulk() {
		const lines = bulk
			.split('\n')
			.map((s) => s.trim())
			.filter(Boolean);
		if (!lines.length) return;

		const existing = new Set(guests.map((g) => g.name.toLowerCase()));
		const newItems: GuestItem[] = [];

		for (const l of lines) {
			if (!existing.has(l.toLowerCase())) {
				existing.add(l.toLowerCase());
				newItems.push({ name: l, sent: false });
			}
		}

		guests = [...guests, ...newItems];
		bulk = '';
	}

	function remove(name: string) {
		guests = guests.filter((g) => g.name !== name);
	}

	function clearAll() {
		if (!confirm(`Hapus ${guests.length} tamu?`)) return;
		guests = [];
	}

	function resetTemplate() {
		template = DEFAULT_TEMPLATE;
	}

	const filteredGuests = $derived(
		guests.filter((g) => {
			const matchesSearch = g.name.toLowerCase().includes(search.trim().toLowerCase());
			if (!matchesSearch) return false;
			if (filter === 'pending') return !g.sent;
			if (filter === 'sent') return g.sent;
			return true;
		})
	);

	const stats = $derived({
		total: guests.length,
		sent: guests.filter((g) => g.sent).length,
		pending: guests.filter((g) => !g.sent).length
	});
</script>

<svelte:head>
	<title>Kelola Tamu — Ruhaeni & Asep Roni</title>
</svelte:head>

<div class="tamu">
	<div class="wrap">
		<header class="head" data-reveal>
			<p class="kicker">Tamu Undangan</p>
			<h1>Daftar Tamu & Kirim WA</h1>
			<p class="desc">
				Kelola daftar tamu, sesuaikan format pesan WhatsApp, dan lacak status pengiriman undangan personal.
			</p>
		</header>

		<!-- Kartu Tambah Tamu -->
		<div class="card" data-reveal style="--d:.08s">
			<label>
				<span><UserPlus size={13} /> Tambah satu tamu</span>
				<div class="row">
					<input
						placeholder="Nama tamu, mis. Bapak Budi / Siti & Keluarga"
						bind:value={single}
						onkeydown={(e) => e.key === 'Enter' && addSingle()}
					/>
					<button class="btn btn-green" onclick={addSingle}><UserPlus size={15} /> Tambah</button>
				</div>
			</label>

			<label>
				<span><Upload size={13} /> Import banyak sekaligus (satu nama per baris)</span>
				<textarea
					rows="3"
					placeholder="Budi Santoso&#10;Siti & Keluarga&#10;Kak Andi & Partner"
					bind:value={bulk}
				></textarea>
				<button class="btn btn-ghost" onclick={addBulk}><Upload size={15} /> Import Nama</button>
			</label>

			<div class="template-toggle">
				<button
					type="button"
					class="btn-text"
					onclick={() => (showTemplate = !showTemplate)}
				>
					<SlidersHorizontal size={13} />
					{showTemplate ? 'Tutup Pengaturan Pesan WA' : 'Ubah Format Pesan WhatsApp'}
				</button>
			</div>

			{#if showTemplate}
				<div class="template-box">
					<label>
						<span>Format Pesan WA (Gunakan <code>{'{nama}'}</code> dan <code>{'{link}'}</code>)</span>
						<textarea rows="4" bind:value={template}></textarea>
					</label>
					<div class="tmpl-actions">
						<button type="button" class="btn-subtle" onclick={resetTemplate}>
							<RotateCcw size={12} /> Reset ke Pesan Default
						</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- Status Bar & Filter -->
		<div class="filter-bar" data-reveal style="--d:.1s">
			<div class="tabs">
				<button
					type="button"
					class:active={filter === 'all'}
					onclick={() => (filter = 'all')}
				>
					Semua <b>({stats.total})</b>
				</button>
				<button
					type="button"
					class:active={filter === 'pending'}
					onclick={() => (filter = 'pending')}
				>
					Belum Dikirim <b>({stats.pending})</b>
				</button>
				<button
					type="button"
					class:active={filter === 'sent'}
					onclick={() => (filter = 'sent')}
				>
					Sudah Terkirim <b>({stats.sent})</b>
				</button>
			</div>

			<div class="search-box">
				<Search size={14} class="search-icon" />
				<input type="text" placeholder="Cari nama tamu…" bind:value={search} />
			</div>
		</div>

		<!-- Daftar Tamu -->
		<div class="list" data-reveal style="--d:.12s">
			{#if filteredGuests.length === 0}
				<div class="empty">
					{#if guests.length === 0}
						<p>Belum ada tamu. Tambahkan nama di form atas.</p>
					{:else}
						<p>Tidak ada tamu yang cocok dengan filter atau pencarian.</p>
					{/if}
				</div>
			{:else}
				{#each filteredGuests as g, i}
					<article class="item" class:is-sent={g.sent}>
						<button
							type="button"
							class="btn-check"
							class:checked={g.sent}
							onclick={() => toggleSent(g)}
							title={g.sent ? 'Tandai belum dikirim' : 'Tandai sudah dikirim'}
							aria-label="Status terkirim"
						>
							{#if g.sent}
								<CheckCircle2 size={19} />
							{:else}
								<Circle size={19} />
							{/if}
						</button>

						<div class="info">
							<div class="name-row">
								<strong>{g.name}</strong>
								{#if g.sent}
									<span class="sent-tag">Terkirim</span>
								{/if}
							</div>
							<a class="link" href={linkFor(g.name)} target="_blank" rel="noopener">
								<Link2 size={12} /> {linkFor(g.name)}
							</a>
						</div>

						<div class="actions">
							<button
								class="ic"
								class:ok={copied === `copy-${i}`}
								onclick={() => copy(linkFor(g.name), `copy-${i}`)}
								aria-label="Salin link"
								title="Salin Link Undangan"
							>
								{#if copied === `copy-${i}`}<Check size={16} />{:else}<Copy size={16} />{/if}
							</button>

							<a
								class="ic wa"
								href={waLink(g.name)}
								target="_blank"
								rel="noopener"
								onclick={() => handleSendWa(g)}
								aria-label="Kirim WA"
								title="Kirim ke WhatsApp"
							>
								<Send size={16} />
							</a>

							<button
								class="ic del"
								onclick={() => remove(g.name)}
								aria-label="Hapus"
								title="Hapus dari daftar"
							>
								<Trash2 size={16} />
							</button>
						</div>
					</article>
				{/each}
			{/if}
		</div>

		{#if guests.length > 0}
			<div class="bottom-actions">
				<button class="danger" onclick={clearAll}>
					<Trash2 size={13} /> Hapus Semua Daftar ({guests.length})
				</button>
			</div>
		{/if}

		<a class="back" href="/{wedding.slug}">← Kembali ke undangan</a>
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
		max-width: 36em;
		font-size: 13.5px;
		color: var(--ink-2);
		line-height: 1.7;
	}

	.card {
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 20px;
		padding: 1.4rem;
		display: grid;
		gap: 1.1rem;
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

	.template-toggle {
		border-top: 1px dashed var(--line);
		padding-top: 0.8rem;
	}

	.btn-text {
		background: transparent;
		border: 0;
		color: var(--ink-2);
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.45em;
		padding: 0;
	}

	.btn-text:hover {
		color: var(--ink);
		text-decoration: underline;
	}

	.template-box {
		background: var(--paper);
		border: 1px solid var(--line);
		border-radius: 14px;
		padding: 1rem;
		display: grid;
		gap: 0.6rem;
	}

	.template-box code {
		background: #fff;
		border: 1px solid var(--line);
		padding: 0.1em 0.35em;
		border-radius: 4px;
		font-size: 11px;
	}

	.tmpl-actions {
		display: flex;
		justify-content: flex-end;
	}

	.btn-subtle {
		background: transparent;
		border: 0;
		color: var(--ink-3);
		font-size: 12px;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.3em;
	}

	.btn-subtle:hover {
		color: var(--ink-2);
	}

	.filter-bar {
		display: grid;
		gap: 0.8rem;
		margin-bottom: 1.1rem;
	}

	.tabs {
		display: flex;
		gap: 0.4rem;
		overflow-x: auto;
		padding-bottom: 0.2rem;
	}

	.tabs button {
		border: 1px solid var(--line);
		background: var(--card);
		color: var(--ink-2);
		border-radius: 999px;
		padding: 0.45em 0.9em;
		font-size: 12.5px;
		cursor: pointer;
		white-space: nowrap;
		transition: all 0.2s ease;
	}

	.tabs button.active {
		background: var(--ink);
		color: #fff;
		border-color: var(--ink);
	}

	.search-box {
		position: relative;
	}

	.search-box input {
		padding-left: 2.2rem;
	}

	:global(.search-box .search-icon) {
		position: absolute;
		left: 0.8rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--ink-3);
		pointer-events: none;
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
		padding: 2rem 1rem;
		background: var(--card);
	}

	.item {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 0.75rem;
		align-items: center;
		background: var(--card);
		border: 1px solid var(--line-soft);
		border-radius: 14px;
		padding: 0.8rem 0.85rem;
		box-shadow: var(--shadow-1);
		transition: opacity 0.2s ease, border-color 0.2s ease;
	}

	.item.is-sent {
		background: rgba(255, 255, 255, 0.7);
		border-color: var(--line);
	}

	.btn-check {
		background: transparent;
		border: 0;
		color: var(--ink-3);
		cursor: pointer;
		display: grid;
		place-items: center;
		padding: 0.2rem;
		transition: color 0.2s ease;
	}

	.btn-check.checked {
		color: #10b981;
	}

	.info {
		min-width: 0;
	}

	.name-row {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.info strong {
		display: block;
		font-size: 14.5px;
		color: var(--ink);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.sent-tag {
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		background: #d1fae5;
		color: #065f46;
		padding: 0.1em 0.5em;
		border-radius: 999px;
	}

	.link {
		display: inline-flex;
		align-items: center;
		gap: 0.3em;
		font-size: 11.5px;
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
		transition: all 0.2s ease;
	}

	.ic.ok {
		border-color: var(--gold-2);
		color: var(--gold-3);
	}

	.ic.wa {
		color: #16a34a;
		background: #f0fdf4;
		border-color: #bbf7d0;
	}

	.ic.wa:hover {
		background: #22c55e;
		color: #fff;
		border-color: #22c55e;
	}

	.ic.del:hover {
		background: #fee2e2;
		color: #b91c1c;
		border-color: #fecaca;
	}

	.bottom-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 1.2rem;
	}

	.danger {
		border: 1px solid var(--line);
		background: transparent;
		border-radius: 999px;
		padding: 0.4em 0.9em;
		font-size: 12px;
		color: #b91c1c;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
	}

	.danger:hover {
		background: #fee2e2;
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
