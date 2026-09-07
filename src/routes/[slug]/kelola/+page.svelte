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
		RotateCcw,
		Lock
	} from 'lucide-svelte';

	let { data } = $props();
	const slug: string = $derived(data.slug);

	interface GuestRow {
		id: string;
		name: string;
		sent: boolean;
		sentAt: string | null;
	}

	let single = $state('');
	let bulk = $state('');
	let honey = $state('');
	let guests = $state<GuestRow[]>([]);
	let search = $state('');
	let filter = $state<'all' | 'pending' | 'sent'>('all');
	let copied = $state<string | null>(null);
	let origin = $state('');
	let showTemplate = $state(false);
	let pin = $state('');
	let authed = $state(false);
	let pinError = $state('');
	let loading = $state(false);
	let pinChecking = $state(false);
	let selectedIds = $state<Set<string>>(new Set());

	const DEFAULT_TEMPLATE = `Halo {nama}, kamu diundang ke pernikahan Ruhaeni & Asep Roni 💍\n\nBuka undangannya di sini ya:\n{link}\n\nMohon doa & kehadirannya 🙏`;
	let template = $state(DEFAULT_TEMPLATE);

	const STORAGE_PIN = $derived(`undangan_pin_${slug}`);
	const TEMPLATE_KEY = $derived(`undangan_wa_template_${slug}`);

	function headers(): Record<string, string> {
		return { 'x-pin': pin };
	}

	function apiUrl(path: string, extra?: string): string {
		const base = `/api/guests?slug=${encodeURIComponent(slug)}`;
		if (extra) return base + extra;
		return base;
	}

	onMount(() => {
		origin = window.location.origin;
		try {
			const tmpl = localStorage.getItem(TEMPLATE_KEY);
			if (tmpl) template = tmpl;
			const qp = page.url.searchParams.get('pin');
			const stored = sessionStorage.getItem(STORAGE_PIN) ?? localStorage.getItem(STORAGE_PIN);
			if (qp && qp.length >= 4) {
				pin = qp;
				tryVerify();
			} else if (stored && stored.length >= 4) {
				pin = stored;
				tryVerify();
			}
		} catch {}
	});

	$effect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem(TEMPLATE_KEY, template);
		}
	});

	async function tryVerify() {
		if (pin.length < 4) {
			pinError = 'PIN minimal 4 karakter.';
			return;
		}
		pinChecking = true;
		pinError = '';
		try {
			const res = await fetch(apiUrl('', ''), { headers: headers() });
			if (!res.ok) {
				const j = await res.json().catch(() => null);
				pinError = j?.message ?? 'PIN salah.';
				authed = false;
				return;
			}
			const j = await res.json();
			guests = (j.guests ?? []).map((g: GuestRow) => ({ id: g.id, name: g.name, sent: g.sent, sentAt: g.sentAt }));
			authed = true;
			pinError = '';
			try {
				sessionStorage.setItem(STORAGE_PIN, pin);
				localStorage.setItem(STORAGE_PIN, pin);
			} catch {}
			history.replaceState(null, '', `/${slug}/kelola`);
		} catch {
			pinError = 'Gagal memverifikasi PIN.';
		} finally {
			pinChecking = false;
		}
	}

	function logout() {
		authed = false;
		pin = '';
		pinError = '';
		try {
			sessionStorage.removeItem(STORAGE_PIN);
			localStorage.removeItem(STORAGE_PIN);
		} catch {}
	}

	function linkFor(name: string): string {
		return `${origin || page.url.origin}/${slug}?to=${encodeURIComponent(name)}`;
	}

	function waMessageFor(name: string): string {
		const link = linkFor(name);
		return template.replace(/\{nama\}/g, name).replace(/\{link\}/g, link);
	}

	function waLink(name: string): string {
		return `https://wa.me/?text=${encodeURIComponent(waMessageFor(name))}`;
	}

	async function patchSent(g: GuestRow, sent: boolean) {
		try {
			const res = await fetch(apiUrl('', ''), {
				method: 'PATCH',
				headers: { 'content-type': 'application/json', ...headers() },
				body: JSON.stringify({ id: g.id, sent })
			});
			if (!res.ok) return;
			const j = await res.json();
			g.sent = j.guest.sent;
			g.sentAt = j.guest.sentAt;
			guests = [...guests];
		} catch {}
	}

	function handleSendWa(g: GuestRow) {
		patchSent(g, true);
	}

	function toggleSent(g: GuestRow) {
		patchSent(g, !g.sent);
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

	async function addSingle() {
		const n = single.trim();
		if (!n || n.length < 2) return;
		loading = true;
		try {
			const res = await fetch(apiUrl('', ''), {
				method: 'POST',
				headers: { 'content-type': 'application/json', ...headers() },
				body: JSON.stringify({ names: [n], website: honey })
			});
			if (!res.ok) {
				const j = await res.json().catch(() => null);
				alert(j?.message ?? 'Gagal menambah tamu.');
				return;
			}
			const j = await res.json();
			const added: GuestRow[] = (j.added ?? []).map((g: GuestRow) => ({ id: g.id, name: g.name, sent: g.sent, sentAt: g.sentAt }));
			if (added.length === 0) {
				alert('Nama sudah ada.');
			} else {
				guests = [...guests, ...added];
			}
			single = '';
		} finally {
			loading = false;
		}
	}

	async function addBulk() {
		const lines = bulk.split('\n').map((s) => s.trim()).filter(Boolean);
		if (!lines.length) return;
		loading = true;
		try {
			const res = await fetch(apiUrl('', ''), {
				method: 'POST',
				headers: { 'content-type': 'application/json', ...headers() },
				body: JSON.stringify({ names: lines, website: honey })
			});
			if (!res.ok) {
				const j = await res.json().catch(() => null);
				alert(j?.message ?? 'Gagal import.');
				return;
			}
			const j = await res.json();
			const added: GuestRow[] = (j.added ?? []).map((g: GuestRow) => ({ id: g.id, name: g.name, sent: g.sent, sentAt: g.sentAt }));
			guests = [...guests, ...added];
			if (added.length < lines.length) {
				alert(`${added.length} ditambahkan, ${lines.length - added.length} duplikat dilewati.`);
			}
			bulk = '';
		} finally {
			loading = false;
		}
	}

	async function removeRow(g: GuestRow) {
		if (!confirm(`Hapus "${g.name}"?`)) return;
		const res = await fetch(apiUrl(`&id=${encodeURIComponent(g.id)}`), {
			method: 'DELETE',
			headers: headers()
		});
		if (!res.ok) {
			alert('Gagal menghapus.');
			return;
		}
		guests = guests.filter((x) => x.id !== g.id);
	}

	async function clearAll() {
		if (!confirm(`Hapus ${guests.length} tamu?`)) return;
		const res = await fetch(apiUrl('&all=1'), { method: 'DELETE', headers: headers() });
		if (!res.ok) {
			alert('Gagal menghapus semua.');
			return;
		}
		guests = [];
	}

	function resetTemplate() {
		template = DEFAULT_TEMPLATE;
	}

	function toggleSelect(id: string) {
		const n = new Set(selectedIds);
		if (n.has(id)) n.delete(id);
		else n.add(id);
		selectedIds = n;
	}
	function selectAllFiltered() {
		selectedIds = new Set(filteredGuests.map((g) => g.id));
	}
	function clearSelection() {
		selectedIds = new Set();
	}
	function selectedLinksText(): string {
		return guests
			.filter((g) => selectedIds.has(g.id))
			.map((g) => `${g.name}: ${linkFor(g.name)}`)
			.join('\n');
	}
	function selectedWaText(): string {
		return guests
			.filter((g) => selectedIds.has(g.id))
			.map((g) => waMessageFor(g.name))
			.join('\n\n---\n\n');
	}
	async function copySelectedLinks() {
		const txt = selectedLinksText();
		if (!txt) return;
		await copy(txt, 'bulk-links');
	}
	async function openSelectedWa() {
		for (const g of guests.filter((x) => selectedIds.has(x.id))) {
			window.open(waLink(g.name), '_blank');
			await new Promise((r) => setTimeout(r, 280));
			patchSent(g, true);
		}
	}
	async function markSelectedSent(sent: boolean) {
		for (const id of selectedIds) {
			const g = guests.find((x) => x.id === id);
			if (g && g.sent !== sent) await patchSent(g, sent);
		}
	}

	const filteredGuests = $derived(
		guests.filter((g) => {
			const q = search.trim().toLowerCase();
			if (q && !g.name.toLowerCase().includes(q)) return false;
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
	<title>Kelola Tamu — {slug}</title>
</svelte:head>

<div class="tamu">
	<div class="wrap">
		<header class="head">
			<p class="kicker">Tamu Undangan</p>
			<h1>Kelola Tamu — {slug}</h1>
			<p class="desc">
				Masuk dengan PIN untuk mengelola daftar tamu <code>/{slug}</code>. Tambah nama, salin link <code>?to=Nama</code>, kirim WA, dan tandai terkirim — tersinkron lintas device.
			</p>
		</header>

		{#if !authed}
			<div class="card pin-card">
				<label>
					<span><Lock size={13} /> PIN Akses</span>
					<div class="row">
						<input
							type="password"
							inputmode="numeric"
							placeholder="Masukkan PIN (min 4 karakter)"
							bind:value={pin}
							onkeydown={(e) => e.key === 'Enter' && tryVerify()}
						/>
						<button class="btn btn-green" onclick={tryVerify} disabled={pinChecking}>
							{pinChecking ? 'Memeriksa…' : 'Masuk'}
						</button>
					</div>
				</label>
				{#if pinError}
					<p class="pin-err">{pinError}</p>
				{/if}
				<p class="pin-hint">
					Admin: set <code>access_pin</code> di tabel <code>invitations</code> untuk <code>{slug}</code>. Jika kosong, gunakan PIN <code>000000</code> (dev). PIN tersimpan 24 jam di device ini.
				</p>
				<a class="back" href="/{slug}">← Kembali ke undangan</a>
			</div>
		{:else}
			<div class="card">
				<div class="pin-bar">
					<span class="pin-ok">Terautentikasi sebagai kelola <code>/{slug}</code></span>
					<button class="btn-ghost sm" onclick={logout}>Keluar</button>
				</div>

				<input type="text" bind:value={honey} tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;opacity:0;height:0;pointer-events:none;" />
				<label>
					<span><UserPlus size={13} /> Tambah satu tamu</span>
					<div class="row">
						<input
							placeholder="Nama tamu, mis. Bapak Budi / Siti & Keluarga"
							bind:value={single}
							onkeydown={(e) => e.key === 'Enter' && addSingle()}
							disabled={loading}
						/>
						<button class="btn btn-green" onclick={addSingle} disabled={loading}>
							<UserPlus size={15} /> Tambah
						</button>
					</div>
				</label>

				<label>
					<span><Upload size={13} /> Import banyak sekaligus (satu nama per baris)</span>
					<textarea
						rows="3"
						placeholder="Budi Santoso&#10;Siti & Keluarga&#10;Kak Andi & Partner"
						bind:value={bulk}
						disabled={loading}
					></textarea>
					<button class="btn btn-ghost" onclick={addBulk} disabled={loading}>
						<Upload size={15} /> Import Nama
					</button>
				</label>

				<div class="template-toggle">
					<button type="button" class="btn-text" onclick={() => (showTemplate = !showTemplate)}>
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

			<div class="filter-bar">
				<div class="tabs">
					<button type="button" class:active={filter === 'all'} onclick={() => (filter = 'all')}>
						Semua <b>({stats.total})</b>
					</button>
					<button type="button" class:active={filter === 'pending'} onclick={() => (filter = 'pending')}>
						Belum Dikirim <b>({stats.pending})</b>
					</button>
					<button type="button" class:active={filter === 'sent'} onclick={() => (filter = 'sent')}>
						Sudah Terkirim <b>({stats.sent})</b>
					</button>
				</div>
				<div class="search-box">
					<Search size={14} class="search-icon" />
					<input type="text" placeholder="Cari nama tamu…" bind:value={search} />
				</div>
			</div>

			{#if guests.length > 0}
				<div class="bulk-bar">
					<label class="bulk-check"><input type="checkbox" checked={selectedIds.size === filteredGuests.length && filteredGuests.length > 0} onchange={selectedIds.size === filteredGuests.length ? clearSelection : selectAllFiltered} /> Pilih semua ({filteredGuests.length})</label>
					{#if selectedIds.size > 0}
						<span class="bulk-count">{selectedIds.size} dipilih</span>
						<button class="btn btn-ghost sm" onclick={copySelectedLinks}>Salin Link ({selectedIds.size})</button>
						<button class="btn btn-green sm" onclick={openSelectedWa}>Kirim WA ({selectedIds.size})</button>
						<button class="btn btn-ghost sm" onclick={() => markSelectedSent(true)}>Tandai terkirim</button>
						<button class="btn btn-ghost sm" onclick={clearSelection}>Batal</button>
					{/if}
				</div>
			{/if}

			<div class="list">
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
							<label class="bulk-cb"><input type="checkbox" checked={selectedIds.has(g.id)} onchange={() => toggleSelect(g.id)} /></label>
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
									{#if g.sent}<span class="sent-tag">Terkirim</span>{/if}
								</div>
								<a class="link" href={linkFor(g.name)} target="_blank" rel="noopener">
									<Link2 size={12} /> {linkFor(g.name)}
								</a>
							</div>
							<div class="actions">
								<button
									class="ic"
									class:ok={copied === `copy-${g.id}`}
									onclick={() => copy(linkFor(g.name), `copy-${g.id}`)}
									aria-label="Salin link"
									title="Salin Link Undangan"
								>
									{#if copied === `copy-${g.id}`}<Check size={16} />{:else}<Copy size={16} />{/if}
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
								<button class="ic del" onclick={() => removeRow(g)} aria-label="Hapus" title="Hapus dari daftar">
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

			<a class="back" href="/{slug}">← Kembali ke undangan</a>
		{/if}
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
		border-radius: 20px;
		padding: 1.4rem;
		display: grid;
		gap: 1.1rem;
		box-shadow: var(--shadow-1);
		margin-bottom: 1.4rem;
	}
	.pin-card {
		max-width: 480px;
		margin-inline: auto;
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
	.pin-err {
		margin: 0;
		font-size: 13px;
		color: #b91c1c;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 10px;
		padding: 0.6em 0.9em;
	}
	.pin-hint {
		margin: 0;
		font-size: 12.5px;
		color: var(--ink-3);
		line-height: 1.6;
	}
	.pin-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		border-radius: 12px;
		padding: 0.6em 0.9em;
	}
	.pin-ok {
		font-size: 12.5px;
		color: #065f46;
	}
	.btn-ghost.sm {
		padding: 0.3em 0.8em;
		font-size: 12px;
		border-radius: 999px;
		border: 1px solid #bbf7d0;
		background: #fff;
		color: #065f46;
		cursor: pointer;
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
	.bulk-bar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 12px;
		padding: 0.6em 0.8em;
		margin-bottom: 1rem;
		font-size: 12.5px;
	}
	.bulk-check {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		font-weight: 600;
		color: var(--ink-2);
	}
	.bulk-cb {
		display: grid;
		place-items: center;
	}
	.bulk-count {
		color: var(--ink-3);
	}
	.item {
		display: grid;
		grid-template-columns: auto auto 1fr auto;
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
