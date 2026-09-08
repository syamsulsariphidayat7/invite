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
		Lock,
		LogOut,
		ExternalLink,
		X,
		ArrowLeft
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

	let toast = $state<{ msg: string; type: 'ok' | 'err' } | null>(null);
	let toastTimer: ReturnType<typeof setTimeout> | null = null;
	function notify(msg: string, type: 'ok' | 'err' = 'ok') {
		toast = { msg, type };
		if (toastTimer) clearTimeout(toastTimer);
		toastTimer = setTimeout(() => (toast = null), 2800);
	}

	const DEFAULT_TEMPLATE = `Halo {nama}, kamu diundang ke pernikahan Ruhaeni & Asep Roni 💍\n\nBuka undangannya di sini ya:\n{link}\n\nMohon doa & kehadirannya 🙏`;
	let serverTemplate = $state<string | null>(null);
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
		fetch(`/api/guests/template?slug=${encodeURIComponent(slug)}`).then((r) => r.json().catch(() => null)).then((j) => {
			if (j?.waTemplate?.trim()) { serverTemplate = j.waTemplate; template = j.waTemplate; }
		}).catch(() => {});
		try {
			const tmpl = localStorage.getItem(TEMPLATE_KEY);
			if (tmpl && !serverTemplate) template = tmpl;
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
			notify(`Masuk sebagai pengelola ${slug}.`);
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
		selectedIds = new Set();
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
			if (!res.ok) {
				notify('Gagal memperbarui status.', 'err');
				return;
			}
			const j = await res.json();
			g.sent = j.guest.sent;
			g.sentAt = j.guest.sentAt;
			guests = [...guests];
		} catch {
			notify('Gagal memperbarui status.', 'err');
		}
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
				notify(j?.message ?? 'Gagal menambah tamu.', 'err');
				return;
			}
			const j = await res.json();
			const added: GuestRow[] = (j.added ?? []).map((g: GuestRow) => ({ id: g.id, name: g.name, sent: g.sent, sentAt: g.sentAt }));
			if (added.length === 0) {
				notify('Nama sudah ada.', 'err');
			} else {
				guests = [...guests, ...added];
				notify(`${added.length} tamu ditambahkan.`);
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
				notify(j?.message ?? 'Gagal import.', 'err');
				return;
			}
			const j = await res.json();
			const added: GuestRow[] = (j.added ?? []).map((g: GuestRow) => ({ id: g.id, name: g.name, sent: g.sent, sentAt: g.sentAt }));
			guests = [...guests, ...added];
			if (added.length < lines.length) {
				notify(`${added.length} ditambahkan, ${lines.length - added.length} duplikat dilewati.`, 'err');
			} else {
				notify(`${added.length} tamu diimport.`);
			}
			bulk = '';
		} finally {
			loading = false;
		}
	}

	async function removeRow(g: GuestRow) {
		if (!confirm(`Hapus "${g.name}" dari daftar?`)) return;
		const res = await fetch(apiUrl('', `&id=${encodeURIComponent(g.id)}`), {
			method: 'DELETE',
			headers: headers()
		});
		if (!res.ok) {
			const j = await res.json().catch(() => null);
			notify(j?.message ?? 'Gagal menghapus.', 'err');
			return;
		}
		guests = guests.filter((x) => x.id !== g.id);
		selectedIds.delete(g.id);
		notify(`"${g.name}" dihapus.`);
	}

	async function clearAll() {
		if (!confirm(`Hapus ${guests.length} tamu dari daftar?`)) return;
		const res = await fetch(apiUrl('', '&all=1'), { method: 'DELETE', headers: headers() });
		if (!res.ok) {
			const j = await res.json().catch(() => null);
			notify(j?.message ?? 'Gagal menghapus semua.', 'err');
			return;
		}
		guests = [];
		selectedIds = new Set();
		notify('Semua tamu dihapus.');
	}

	function resetTemplate() {
		template = DEFAULT_TEMPLATE;
		notify('Template dikembalikan ke default.');
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
		notify('Link terpilih disalin.');
	}
	async function openSelectedWa() {
		const sel = guests.filter((x) => selectedIds.has(x.id));
		for (const g of sel) {
			window.open(waLink(g.name), '_blank');
			await new Promise((r) => setTimeout(r, 280));
			patchSent(g, true);
		}
		if (sel.length > 0) notify(`${sel.length} undangan WA dibuka.`);
	}
	async function markSelectedSent(sent: boolean) {
		let changed = 0;
		for (const id of selectedIds) {
			const g = guests.find((x) => x.id === id);
			if (g && g.sent !== sent) {
				await patchSent(g, sent);
				changed++;
			}
		}
		if (changed > 0) notify(`${changed} tamu ditandai ${sent ? 'terkirim' : 'belum terkirim'}.`);
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

<div class="shell">
	<header class="topbar">
		<div class="brand">
			<div class="logo-mark">
				<Users size={16} />
			</div>
			<span class="brand-name">Kelola Tamu<em>/{slug}</em></span>
		</div>
		<div class="topbar-right">
			<a class="btn btn-ghost sm" href="/{slug}" target="_blank" rel="noopener"><ExternalLink size={14} /> Lihat Undangan</a>
			{#if authed}
				<button class="icon-btn" onclick={logout} title="Keluar"><LogOut size={16} /></button>
			{/if}
		</div>
	</header>

	<main class="main">
		<nav class="crumb">
			<span class="crumb-cur">Undangan</span>
			<span class="crumb-sep">/</span>
			<a class="crumb-link" href="/{slug}">{slug}</a>
			<span class="crumb-sep">/</span>
			<span class="crumb-cur">Kelola Tamu</span>
		</nav>

		{#if !authed}
			<div class="pin-wrap">
				<div class="card pin-card">
					<div class="pin-ic"><Lock size={20} /></div>
					<h1>Masuk dengan PIN</h1>
					<p class="pin-desc">Masukkan PIN pengelola untuk mengelola daftar tamu <code>/{slug}</code>.</p>
					<label class="pin-field">
						<input
							type="password"
							inputmode="numeric"
							placeholder="Masukkan PIN (min 4 karakter)"
							bind:value={pin}
							onkeydown={(e) => e.key === 'Enter' && tryVerify()}
						/>
					</label>
					{#if pinError}
						<p class="alert err"><X size={14} /> {pinError}</p>
					{/if}
					<button class="btn btn-primary" onclick={tryVerify} disabled={pinChecking}>
						{pinChecking ? 'Memeriksa…' : 'Masuk'}
					</button>
					<p class="pin-hint">
						PIN disimpan 24 jam di perangkat ini. Admin mengatur PIN di panel admin → kolom <em>PIN Kelola</em>. Jika kosong, gunakan <code>000000</code> (dev).
					</p>
				</div>
			</div>
		{:else}
			<header class="page-head">
				<div>
					<h1>Kelola Tamu</h1>
					<p>Tambah nama, salin link undangan, kirim WA, dan tandai terkirim — tersinkron lintas device.</p>
				</div>
				<a class="btn btn-ghost" href="/{slug}" target="_blank" rel="noopener"><ExternalLink size={14} /> Buka Undangan</a>
			</header>

			<div class="kpis">
				<div class="kpi">
					<div class="kpi-ic" style="--c:#2563eb;--bg:#eff6ff"><Users size={16} /></div>
					<div><strong>{stats.total}</strong><span>Total Tamu</span></div>
				</div>
				<div class="kpi">
					<div class="kpi-ic" style="--c:#059669;--bg:#ecfdf5"><CheckCircle2 size={16} /></div>
					<div><strong>{stats.sent}</strong><span>Sudah Dikirim</span></div>
				</div>
				<div class="kpi">
					<div class="kpi-ic" style="--c:#d97706;--bg:#fffbeb"><Circle size={16} /></div>
					<div><strong>{stats.pending}</strong><span>Belum Dikirim</span></div>
				</div>
			</div>

			<div class="card pad form-card">
				<input type="text" bind:value={honey} tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;opacity:0;height:0;pointer-events:none;" />
				<div class="f-row">
					<label>
						<span>Tambahkan satu tamu</span>
						<div class="row">
							<input
								placeholder="Nama tamu, mis. Bapak Budi / Siti & Keluarga"
								bind:value={single}
								onkeydown={(e) => e.key === 'Enter' && addSingle()}
								disabled={loading}
							/>
							<button class="btn btn-primary" onclick={addSingle} disabled={loading}>
								<UserPlus size={15} /> Tambah
							</button>
						</div>
					</label>
					<label>
						<span>Import banyak sekaligus (satu nama per baris)</span>
						<div class="row bulk-row">
							<textarea
								rows="3"
								placeholder="Budi Santoso&#10;Siti & Keluarga&#10;Kak Andi & Partner"
								bind:value={bulk}
								disabled={loading}
							></textarea>
							<button class="btn btn-ghost" onclick={addBulk} disabled={loading}>
								<Upload size={15} /> Import Nama
							</button>
						</div>
					</label>
				</div>

				<div class="template-area">
					<button type="button" class="btn-text" onclick={() => (showTemplate = !showTemplate)}>
						<SlidersHorizontal size={13} />
						{showTemplate ? 'Tutup Pengaturan Pesan WA' : 'Ubah Format Pesan WhatsApp'}
					</button>

					{#if showTemplate}
						<div class="template-box">
							<label>
								<span>Format Pesan WA (gunakan <code>{'{nama}'}</code> dan <code>{'{link}'}</code>)</span>
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
						<button class="btn btn-primary sm" onclick={openSelectedWa}>Kirim WA ({selectedIds.size})</button>
						<button class="btn btn-ghost sm" onclick={() => markSelectedSent(true)}>Tandai terkirim</button>
						<button class="btn btn-ghost sm" onclick={clearSelection}>Batal</button>
					{/if}
				</div>
			{/if}

			<div class="list">
				{#if filteredGuests.length === 0}
					<div class="empty">
						{#if guests.length === 0}
							<strong>Belum ada tamu</strong>
							<p>Tambahkan nama di form atas.</p>
						{:else}
							<strong>Tidak ada hasil</strong>
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
									<div class="li-avatar">{(g.name || '?')[0].toUpperCase()}</div>
									<strong>{g.name}</strong>
									{#if g.sent}<span class="pill ok"><span class="dot"></span>Terkirim</span>{/if}
								</div>
								<a class="link" href={linkFor(g.name)} target="_blank" rel="noopener">
									<Link2 size={12} /> {linkFor(g.name)}
								</a>
							</div>
							<div class="actions">
								<button
									class="icon-btn"
									class:ok={copied === `copy-${g.id}`}
									onclick={() => copy(linkFor(g.name), `copy-${g.id}`)}
									aria-label="Salin link"
									title="Salin Link Undangan"
								>
									{#if copied === `copy-${g.id}`}<Check size={15} />{:else}<Copy size={15} />{/if}
								</button>
								<a
									class="icon-btn wa"
									href={waLink(g.name)}
									target="_blank"
									rel="noopener"
									onclick={() => handleSendWa(g)}
									aria-label="Kirim WA"
									title="Kirim ke WhatsApp"
								>
									<Send size={15} />
								</a>
								<button class="icon-btn danger" onclick={() => removeRow(g)} aria-label="Hapus" title="Hapus dari daftar">
									<Trash2 size={15} />
								</button>
							</div>
						</article>
					{/each}
				{/if}
			</div>

			{#if guests.length > 0}
				<div class="bottom-actions">
					<button class="btn danger-ghost sm" onclick={clearAll}>
						<Trash2 size={13} /> Hapus Semua Daftar ({guests.length})
					</button>
				</div>
			{/if}

			<a class="back" href="/{slug}"><ArrowLeft size={14} /> Kembali ke undangan</a>
		{/if}
	</main>

	{#if toast}
		<div class="toast" class:err={toast.type === 'err'} role="status">
			{#if toast.type === 'err'}<X size={15} />{:else}<Check size={15} />{/if}
			{toast.msg}
		</div>
	{/if}
</div>

<style>
	/* ===== Design tokens (konsisten dengan panel admin) ===== */
	.shell {
		--bg: #f4f6f8;
		--card: #ffffff;
		--line: #e2e8f0;
		--line-soft: #edf1f5;
		--ink: #0f172a;
		--ink-2: #475569;
		--ink-3: #94a3b8;
		--accent: #2563eb;
		--accent-strong: #1d4ed8;
		--accent-soft: #eff6ff;
		--ok: #16a34a;
		--ok-bg: #f0fdf4;
		--warn: #d97706;
		--danger: #dc2626;
		--danger-bg: #fef2f2;
		--radius: 12px;
		--shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06);
		--shadow-lg: 0 16px 40px rgba(15, 23, 42, 0.14);

		min-height: 100svh;
		background: var(--bg);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
		color: var(--ink);
		font-size: 14px;
		line-height: 1.5;
	}
	.shell * {
		box-sizing: border-box;
	}

	/* ===== Topbar ===== */
	.topbar {
		position: sticky;
		top: 0;
		z-index: 40;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		height: 60px;
		padding: 0 1.1rem;
		background: var(--card);
		border-bottom: 1px solid var(--line);
		box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	.logo-mark {
		width: 34px;
		height: 34px;
		border-radius: 10px;
		display: grid;
		place-items: center;
		color: #fff;
		background: var(--accent);
		box-shadow: 0 1px 3px rgba(37, 99, 235, 0.3);
	}
	.brand-name {
		font-weight: 700;
		font-size: 15px;
		color: var(--ink);
		display: inline-flex;
		align-items: baseline;
		gap: 0.4em;
	}
	.brand-name em {
		font-style: normal;
		font-size: 11.5px;
		font-weight: 600;
		color: var(--ink-3);
		letter-spacing: 0.04em;
	}
	.topbar-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	/* ===== Main ===== */
	.main {
		padding: 1.3rem 1.5rem 4rem;
		min-width: 0;
		max-width: 960px;
		margin-inline: auto;
	}
	.crumb {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 12.5px;
		color: var(--ink-3);
		margin-bottom: 1rem;
	}
	.crumb .crumb-cur {
		color: var(--ink-2);
		font-weight: 500;
	}
	.crumb-link {
		border: 0;
		background: transparent;
		color: var(--ink-2);
		font-size: 12.5px;
		font-family: inherit;
		cursor: pointer;
		padding: 0;
		text-decoration: none;
	}
	.crumb-link:hover {
		color: var(--accent-strong);
	}
	.crumb .crumb-sep {
		color: var(--ink-3);
	}

	/* ===== Page head & KPI ===== */
	.page-head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.2rem;
		flex-wrap: wrap;
	}
	.page-head h1 {
		margin: 0 0 0.15rem;
		font-size: 22px;
		font-weight: 700;
		letter-spacing: -0.01em;
	}
	.page-head p {
		margin: 0;
		font-size: 13px;
		color: var(--ink-2);
	}
	.kpis {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.9rem;
		margin-bottom: 1.2rem;
	}
	.kpi {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		padding: 0.9rem 1rem;
		box-shadow: var(--shadow);
	}
	.kpi-ic {
		flex: none;
		width: 40px;
		height: 40px;
		border-radius: 11px;
		display: grid;
		place-items: center;
		color: var(--c);
		background: var(--bg);
	}
	.kpi strong {
		display: block;
		font-size: 20px;
		line-height: 1.15;
	}
	.kpi span {
		font-size: 11.5px;
		color: var(--ink-3);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* ===== Card & form ===== */
	.card {
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
	}
	.card.pad {
		padding: 1.2rem;
	}
	.form-card {
		display: grid;
		gap: 1rem;
		margin-bottom: 1.2rem;
	}
	.f-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}
	.form-card label span {
		display: flex;
		align-items: center;
		gap: 0.4em;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--ink-3);
		margin-bottom: 0.35rem;
	}
	.row {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.6rem;
	}
	.bulk-row {
		grid-template-columns: 1fr;
		align-items: stretch;
	}
	.bulk-row .btn {
		justify-self: start;
	}
	input,
	textarea {
		width: 100%;
		border: 1px solid var(--line);
		border-radius: 10px;
		background: #fff;
		padding: 0.65em 0.9em;
		font-family: inherit;
		font-size: 14px;
		color: var(--ink);
		box-sizing: border-box;
	}
	input:focus,
	textarea:focus {
		outline: 2px solid var(--accent);
		outline-offset: -1px;
		border-color: var(--accent);
	}

	/* ===== Template WA ===== */
	.template-area {
		border-top: 1px dashed var(--line);
		padding-top: 0.8rem;
		display: grid;
		gap: 0.6rem;
	}
	.btn-text {
		background: transparent;
		border: 0;
		color: var(--ink-2);
		font-size: 13px;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.45em;
		padding: 0;
		justify-self: start;
	}
	.btn-text:hover {
		color: var(--accent-strong);
	}
	.template-box {
		background: var(--bg);
		border: 1px solid var(--line);
		border-radius: 12px;
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
		font-family: inherit;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.3em;
	}
	.btn-subtle:hover {
		color: var(--ink-2);
	}

	/* ===== Filter bar ===== */
	.filter-bar {
		display: grid;
		grid-template-columns: 1fr minmax(200px, 280px);
		gap: 0.8rem;
		align-items: center;
		margin-bottom: 1rem;
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
		padding: 0.45em 0.95em;
		font-size: 12.5px;
		font-family: inherit;
		cursor: pointer;
		white-space: nowrap;
		transition: all 0.15s ease;
	}
	.tabs button:hover {
		border-color: #d0d5dd;
		color: var(--ink);
	}
	.tabs button.active {
		background: var(--accent);
		color: #fff;
		border-color: transparent;
		box-shadow: 0 1px 2px rgba(37, 99, 235, 0.3);
	}
	.tabs b {
		font-weight: 600;
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

	/* ===== Bulk bar ===== */
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
		box-shadow: var(--shadow);
	}
	.bulk-check {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		font-weight: 600;
		color: var(--ink-2);
		cursor: pointer;
	}
	.bulk-cb {
		display: grid;
		place-items: center;
	}
	.bulk-count {
		color: var(--ink-3);
	}

	/* ===== List ===== */
	.list {
		display: grid;
		gap: 0.6rem;
	}
	.item {
		display: grid;
		grid-template-columns: auto auto 1fr auto;
		gap: 0.75rem;
		align-items: center;
		background: var(--card);
		border: 1px solid var(--line-soft);
		border-radius: 12px;
		padding: 0.75rem 0.85rem;
		box-shadow: var(--shadow);
		transition: border-color 0.15s ease;
	}
	.item:hover {
		border-color: var(--line);
	}
	.item.is-sent {
		background: #fcfcfd;
	}
	.btn-check {
		background: transparent;
		border: 0;
		color: var(--ink-3);
		cursor: pointer;
		display: grid;
		place-items: center;
		padding: 0.2rem;
		transition: color 0.15s ease;
	}
	.btn-check.checked {
		color: var(--ok);
	}
	.info {
		min-width: 0;
	}
	.name-row {
		display: flex;
		align-items: center;
		gap: 0.55em;
		min-width: 0;
	}
	.li-avatar {
		flex: none;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		font-size: 12px;
		font-weight: 700;
		color: var(--accent-strong);
		background: var(--accent-soft);
	}
	.info strong {
		font-size: 14.5px;
		color: var(--ink);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.pill {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		border-radius: 999px;
		padding: 0.15em 0.6em;
		font-size: 10.5px;
		font-weight: 600;
		background: var(--line-soft);
		color: var(--ink-2);
		border: 1px solid var(--line);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.pill .dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--ink-3);
	}
	.pill.ok {
		background: var(--ok-bg);
		color: var(--ok);
		border-color: #a7f3d0;
	}
	.pill.ok .dot {
		background: var(--ok);
	}
	.link {
		display: inline-flex;
		align-items: center;
		gap: 0.3em;
		font-size: 11.5px;
		color: var(--ink-3);
		text-decoration: none;
		word-break: break-all;
		margin-top: 0.15rem;
	}
	.link:hover {
		color: var(--accent-strong);
	}
	.actions {
		display: flex;
		gap: 0.35rem;
	}

	/* ===== Buttons ===== */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.45em;
		border-radius: 10px;
		padding: 0.55em 1em;
		font-size: 13px;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		border: 1px solid transparent;
		transition: background 0.12s ease, box-shadow 0.12s ease, transform 0.05s ease;
		text-decoration: none;
	}
	.btn:active {
		transform: translateY(1px);
	}
	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.btn-primary {
		background: var(--accent);
		color: #fff;
		box-shadow: 0 1px 2px rgba(37, 99, 235, 0.3);
	}
	.btn-primary:hover {
		background: var(--accent-strong);
		box-shadow: 0 2px 6px rgba(37, 99, 235, 0.35);
	}
	.btn-ghost {
		background: var(--card);
		border-color: var(--line);
		color: var(--ink-2);
	}
	.btn-ghost:hover {
		border-color: #d0d5dd;
		color: var(--ink);
		background: #f9fafb;
	}
	.btn.sm {
		padding: 0.35em 0.8em;
		font-size: 12px;
	}
	.danger-ghost {
		border: 1px solid var(--line);
		background: var(--card);
		color: var(--danger);
	}
	.danger-ghost:hover {
		background: var(--danger-bg);
		border-color: #fecaca;
	}
	.icon-btn {
		width: 34px;
		height: 34px;
		border-radius: 9px;
		border: 1px solid var(--line);
		background: var(--card);
		display: grid;
		place-items: center;
		cursor: pointer;
		color: var(--ink-2);
		text-decoration: none;
		transition: background 0.12s ease, color 0.12s ease;
	}
	.icon-btn:hover {
		background: var(--line-soft);
		color: var(--ink);
	}
	.icon-btn.ok {
		border-color: #a7f3d0;
		color: var(--ok);
		background: var(--ok-bg);
	}
	.icon-btn.wa {
		color: var(--ok);
		background: var(--ok-bg);
		border-color: #bbf7d0;
	}
	.icon-btn.wa:hover {
		background: #22c55e;
		color: #fff;
		border-color: #22c55e;
	}
	.icon-btn.danger {
		color: var(--danger);
	}
	.icon-btn.danger:hover {
		background: var(--danger-bg);
		border-color: #fecaca;
	}

	/* ===== Bottom & back ===== */
	.bottom-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 1.2rem;
	}
	.back {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		margin-top: 1.4rem;
		font-size: 13px;
		color: var(--ink-2);
		text-decoration: none;
	}
	.back:hover {
		color: var(--accent-strong);
	}

	/* ===== Empty ===== */
	.empty {
		background: var(--card);
		border: 1px dashed var(--line);
		border-radius: var(--radius);
		padding: 2.2rem 1.4rem;
		text-align: center;
		color: var(--ink-3);
	}
	.empty strong {
		display: block;
		font-size: 15px;
		color: var(--ink-2);
		margin-bottom: 0.25rem;
	}
	.empty p {
		margin: 0;
		font-size: 13px;
	}

	/* ===== PIN gate ===== */
	.pin-wrap {
		display: grid;
		place-items: center;
		min-height: 60svh;
	}
	.pin-card {
		width: min(100%, 440px);
		display: grid;
		gap: 0.9rem;
		padding: 2rem;
		text-align: center;
	}
	.pin-ic {
		justify-self: center;
		width: 52px;
		height: 52px;
		border-radius: 15px;
		display: grid;
		place-items: center;
		color: #fff;
		background: var(--accent);
		box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
	}
	.pin-card h1 {
		margin: 0;
		font-size: 20px;
		font-weight: 700;
	}
	.pin-desc {
		margin: -0.4rem 0 0;
		font-size: 13px;
		color: var(--ink-2);
	}
	.pin-desc code {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 12px;
		color: var(--accent-strong);
		background: var(--accent-soft);
		border-radius: 6px;
		padding: 0.1em 0.4em;
	}
	.pin-field input {
		text-align: center;
		font-size: 16px;
		letter-spacing: 0.2em;
		padding: 0.75em 0.9em;
	}
	.pin-hint {
		margin: 0.2rem 0 0;
		font-size: 12px;
		color: var(--ink-3);
		line-height: 1.6;
	}
	.pin-hint code,
	.pin-hint em {
		font-style: normal;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 11px;
		color: var(--ink-2);
	}

	/* ===== Feedback ===== */
	.alert {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5em;
		border-radius: 10px;
		padding: 0.6em 0.9em;
		font-size: 13px;
	}
	.alert.err {
		color: var(--danger);
		background: var(--danger-bg);
		border: 1px solid #fecaca;
	}
	.toast {
		position: fixed;
		bottom: 1.2rem;
		right: 1.2rem;
		z-index: 80;
		display: flex;
		align-items: center;
		gap: 0.5em;
		background: #111827;
		color: #fff;
		border-radius: 12px;
		padding: 0.7em 1.1em;
		font-size: 13px;
		box-shadow: var(--shadow-lg);
		animation: toast-in 0.18s ease;
	}
	.toast.err {
		background: var(--danger);
	}
	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ===== Responsive ===== */
	@media (max-width: 760px) {
		.f-row {
			grid-template-columns: 1fr;
		}
		.filter-bar {
			grid-template-columns: 1fr;
		}
		.kpis {
			grid-template-columns: 1fr 1fr;
		}
		.main {
			padding: 1.1rem 1rem 3rem;
		}
		.page-head {
			flex-direction: column;
			align-items: flex-start;
		}
		.item {
			grid-template-columns: auto auto 1fr;
		}
		.item .actions {
			grid-column: 3;
			justify-content: flex-end;
		}
	}
</style>