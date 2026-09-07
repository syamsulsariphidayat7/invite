<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { LogOut, Plus, Trash2, Edit3, Copy, Check, ExternalLink, Upload, Users, MessageCircle } from 'lucide-svelte';

	interface InvitationItem {
		id: string;
		subdomain: string;
		namaPihak1: string;
		namaPihak2: string;
		tanggalAcara: string | null;
		template: string;
		dataJson: Record<string, unknown>;
		status: string;
		accessPin: string | null;
		waTemplate: string | null;
		createdAt: string;
	}

	interface GuestRow {
		id: string;
		name: string;
		sent: boolean;
	}

	interface WishRow {
		id: number;
		name: string;
		attendance: string;
		message: string;
	}

	let items = $state<InvitationItem[]>([]);
	let loading = $state(true);
	let err = $state('');
	let copied = $state<string | null>(null);

	let selected = $state<string | null>(null);
	let tab = $state<'overview' | 'tamu' | 'ucapan' | 'foto'>('overview');
	let detailGuests = $state<GuestRow[]>([]);
	let detailWishes = $state<WishRow[]>([]);
	let detailLoading = $state(false);
	let uploadBusy = $state(false);
	let uploadMsg = $state('');
	let exportType = $state<'tamu' | 'ucapan'>('tamu');

	let showForm = $state(false);
	let editing = $state<string | null>(null);
	let formSubdomain = $state('');
	let formPihak1 = $state('');
	let formPihak2 = $state('');
	let formTanggal = $state('');
	let formStatus = $state('draft');
	let formPin = $state('');
	let formSaving = $state(false);
	let formErr = $state('');

	async function load() {
		loading = true;
		err = '';
		try {
			const res = await fetch('/api/admin/invitations');
			if (res.status === 401) {
				await goto('/admin/login');
				return;
			}
			if (!res.ok) {
				const j = await res.json().catch(() => null);
				err = j?.message ?? 'Gagal memuat data.';
				return;
			}
			const j = await res.json();
			items = j.items ?? [];
		} catch {
			err = 'Gagal terhubung.';
		} finally {
			loading = false;
		}
	}

	onMount(load);

	function openCreate() {
		editing = null;
		formSubdomain = '';
		formPihak1 = '';
		formPihak2 = '';
		formTanggal = '';
		formStatus = 'draft';
		formPin = Math.floor(100000 + Math.random() * 900000).toString();
		formErr = '';
		showForm = true;
	}

	function openEdit(it: InvitationItem) {
		editing = it.subdomain;
		formSubdomain = it.subdomain;
		formPihak1 = it.namaPihak1;
		formPihak2 = it.namaPihak2;
		formTanggal = it.tanggalAcara ?? '';
		formStatus = it.status;
		formPin = it.accessPin ?? '';
		formErr = '';
		showForm = true;
	}

	async function submit(e: Event) {
		e.preventDefault();
		formSaving = true;
		formErr = '';
		try {
			if (editing) {
				const res = await fetch(`/api/admin/invitations?subdomain=${encodeURIComponent(editing)}`, {
					method: 'PATCH',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({
						namaPihak1: formPihak1,
						namaPihak2: formPihak2,
						tanggalAcara: formTanggal || null,
						template: 'classic',
						status: formStatus,
						accessPin: formPin || null
					})
				});
				const j = await res.json().catch(() => null);
				if (!res.ok) {
					formErr = j?.message ?? 'Gagal menyimpan.';
					return;
				}
				showForm = false;
				await load();
			} else {
				const sd = formSubdomain.trim().toLowerCase();
				if (!sd) {
					formErr = 'Subdomain wajib.';
					return;
				}
				const res = await fetch('/api/admin/invitations', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({
						subdomain: sd,
						namaPihak1: formPihak1,
						namaPihak2: formPihak2,
						tanggalAcara: formTanggal || null,
						template: 'classic',
						status: formStatus,
						accessPin: formPin || null
					})
				});
				const j = await res.json().catch(() => null);
				if (!res.ok) {
					formErr = j?.message ?? 'Gagal membuat.';
					return;
				}
				showForm = false;
				await load();
			}
		} finally {
			formSaving = false;
		}
	}

	async function del(sd: string) {
		if (!confirm(`Hapus undangan "${sd}"? Tamu & ucapan terkait ikut terhapus.`)) return;
		const res = await fetch(`/api/admin/invitations?subdomain=${encodeURIComponent(sd)}`, { method: 'DELETE' });
		if (!res.ok) {
			const j = await res.json().catch(() => null);
			alert(j?.message ?? 'Gagal menghapus.');
			return;
		}
		await load();
	}

	async function copy(text: string, id: string) {
		try {
			await navigator.clipboard.writeText(text);
		} catch {}
		copied = id;
		setTimeout(() => (copied = null), 1600);
	}

	async function logout() {
		await fetch('/api/admin/login', { method: 'DELETE' });
		await goto('/admin/login');
	}

	function previewUrl(sd: string): string {
		return `/${sd}`;
	}

	async function openDetail(sd: string, t: typeof tab = 'overview') {
		selected = sd;
		tab = t;
		detailLoading = true;
		try {
			const [gRes, wRes] = await Promise.all([
				fetch(`/api/guests?slug=${encodeURIComponent(sd)}&pin=${encodeURIComponent(items.find((x) => x.subdomain === sd)?.accessPin ?? '')}`),
				fetch(`/api/admin/wishes?slug=${encodeURIComponent(sd)}`)
			]);
			if (gRes.ok) {
				const j = await gRes.json();
				detailGuests = j.guests ?? [];
			} else detailGuests = [];
			if (wRes.ok) {
				const j = await wRes.json();
				detailWishes = j.wishes ?? [];
			} else detailWishes = [];
		} catch {
			detailGuests = [];
			detailWishes = [];
		} finally {
			detailLoading = false;
		}
	}

	async function deleteWish(id: number) {
		if (!selected) return;
		if (!confirm('Hapus ucapan ini?')) return;
		const res = await fetch(`/api/admin/wishes?slug=${encodeURIComponent(selected)}&id=${id}`, { method: 'DELETE' });
		if (!res.ok) {
			alert('Gagal menghapus.');
			return;
		}
		detailWishes = detailWishes.filter((w) => w.id !== id);
	}

	async function uploadFiles(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files?.length || !selected) return;
		uploadBusy = true;
		uploadMsg = '';
		try {
			const fd = new FormData();
			for (const f of Array.from(input.files)) fd.append('files', f);
			const res = await fetch(`/api/admin/upload?slug=${encodeURIComponent(selected)}`, { method: 'POST', body: fd });
			const j = await res.json().catch(() => null);
			if (!res.ok) {
				uploadMsg = j?.message ?? 'Upload gagal.';
				return;
			}
			const urls: string[] = j.urls ?? [];
			uploadMsg = `${urls.length} foto terupload & gallery terupdate.`;
			if (j.gallery) {
				const it = items.find((x) => x.subdomain === selected);
				if (it) it.dataJson = { ...(it.dataJson ?? {}), gallery: j.gallery };
			}
		} catch {
			uploadMsg = 'Gagal upload.';
		} finally {
			uploadBusy = false;
			input.value = '';
		}
	}

	function exportCsv() {
		if (!selected) return;
		const rows = exportType === 'tamu' ? detailGuests : detailWishes;
		if (rows.length === 0) {
			alert('Tidak ada data untuk diexport.');
			return;
		}
		let csv = '';
		if (exportType === 'tamu') {
			csv = 'Nama,Terkirim\n' + (rows as GuestRow[]).map((r) => `"${r.name.replace(/"/g, '""')}",${r.sent ? 'Ya' : 'Belum'}`).join('\n');
		} else {
			csv =
				'Nama,Kehadiran,Pesan\n' +
				(rows as WishRow[])
					.map((r) => `"${r.name.replace(/"/g, '""')}","${r.attendance}","${r.message.replace(/"/g, '""')}"`)
					.join('\n');
		}
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = `${selected}-${exportType}.csv`;
		a.click();
	}
</script>

<svelte:head><title>Admin — Undangan</title></svelte:head>

<div class="admin">
	<div class="wrap-wide">
		<header class="head">
			<div>
				<h1>Admin — Undangan</h1>
				<p class="hint">Kelola subdomain, status, dan PIN kelola tamu. Foto/statis masih via <code>wedding.ts</code> + <code>static/photos</code> per-undangan (Storage Fase berikutnya).</p>
			</div>
			<div class="head-actions">
				<button class="btn btn-green" onclick={openCreate}><Plus size={16} /> Buat Undangan</button>
				<button class="btn btn-ghost" onclick={logout}><LogOut size={16} /> Keluar</button>
			</div>
		</header>

		{#if loading}
			<p class="muted">Memuat…</p>
		{:else if err}
			<p class="err">{err}</p>
		{:else if items.length === 0}
			<div class="empty">Belum ada undangan. Buat pertama dengan subdomain mis. <code>ruhaeni-roni</code>.</div>
		{:else}
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Subdomain / Link</th>
							<th>Pasangan</th>
							<th>Tanggal</th>
							<th>Status</th>
							<th>PIN Kelola</th>
							<th>Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each items as it}
							<tr class:selected={selected === it.subdomain}>
								<td>
									<button class="lnk strong" onclick={() => openDetail(it.subdomain)}><code>{it.subdomain}</code></button>
									<div class="links">
										<a href={previewUrl(it.subdomain)} target="_blank" rel="noopener"><ExternalLink size={12} /> Lihat</a>
										<a href={`/${it.subdomain}/kelola?pin=${encodeURIComponent(it.accessPin ?? '')}`} target="_blank" rel="noopener">Kelola</a>
										<button class="lnk" onclick={() => copy(`${location.origin}/${it.subdomain}`, it.subdomain)}>
											{#if copied === it.subdomain}<Check size={12} /> Tersalin{:else}<Copy size={12} /> Salin Link{/if}
										</button>
									</div>
								</td>
								<td>{it.namaPihak1 || '—'} & {it.namaPihak2 || '—'}</td>
								<td>{it.tanggalAcara ?? '—'}</td>
								<td><span class="badge" class:active={it.status === 'active'}>{it.status}</span></td>
								<td><code class="pin">{it.accessPin ?? '—'}</code></td>
								<td class="actions">
									<button class="ic" onclick={() => openEdit(it)} title="Edit"><Edit3 size={14} /></button>
									<button class="ic" onclick={() => openDetail(it.subdomain)} title="Detail"><Users size={14} /></button>
									<button class="ic danger" onclick={() => del(it.subdomain)} title="Hapus"><Trash2 size={14} /></button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}

		{#if selected}
			<div class="detail">
				<div class="detail-head">
					<h2>Detail — {selected}</h2>
					<button class="btn btn-ghost" onclick={() => (selected = null)}>Tutup</button>
				</div>
				<div class="tabs">
					<button class:active={tab === 'overview'} onclick={() => (tab = 'overview')}>Ringkasan</button>
					<button class:active={tab === 'tamu'} onclick={() => openDetail(selected!, 'tamu')}><Users size={13} /> Tamu ({detailGuests.length})</button>
					<button class:active={tab === 'ucapan'} onclick={() => openDetail(selected!, 'ucapan')}><MessageCircle size={13} /> Ucapan ({detailWishes.length})</button>
					<button class:active={tab === 'foto'} onclick={() => (tab = 'foto')}><Upload size={13} /> Foto</button>
				</div>

				{#if detailLoading}
					<p class="muted">Memuat…</p>
				{:else if tab === 'overview'}
					<div class="overview">
						<p><strong>Tamu:</strong> {detailGuests.length} ({detailGuests.filter((g) => g.sent).length} terkirim)</p>
						<p><strong>Ucapan:</strong> {detailWishes.length}</p>
						<div class="export-row">
							<select bind:value={exportType}>
								<option value="tamu">Tamu</option>
								<option value="ucapan">Ucapan</option>
							</select>
							<button class="btn btn-ghost" onclick={exportCsv}>Export CSV</button>
						</div>
					</div>
				{:else if tab === 'tamu'}
					<div class="list">
						{#if detailGuests.length === 0}
							<p class="muted">Belum ada tamu.</p>
						{:else}
							{#each detailGuests as g}
								<div class="list-item">
									<span>{g.name}</span><span class="badge" class:active={g.sent}>{g.sent ? 'Terkirim' : 'Belum'}</span>
								</div>
							{/each}
						{/if}
					</div>
				{:else if tab === 'ucapan'}
					<div class="list">
						{#if detailWishes.length === 0}
							<p class="muted">Belum ada ucapan.</p>
						{:else}
							{#each detailWishes as w}
								<div class="wish-item">
									<strong>{w.name}</strong> <span class="badge">{w.attendance}</span>
									<p class="wish-msg">{w.message}</p>
									<button class="lnk danger" onclick={() => deleteWish(w.id)}>Hapus</button>
								</div>
							{/each}
						{/if}
					</div>
				{:else if tab === 'foto'}
					<div class="upload">
						<p class="hint">Upload ke Supabase Storage bucket <code>invitation-photos/{selected}/</code> (Public). Butuh env <code>SUPABASE_URL</code> + <code>SUPABASE_SECRET_KEY</code>.</p>
						<label class="btn btn-green">
							<Upload size={14} /> Pilih Foto (max 12)
							<input type="file" accept="image/*" multiple hidden onchange={uploadFiles} disabled={uploadBusy} />
						</label>
						{#if uploadMsg}<p class="muted">{uploadMsg}</p>{/if}
						{#if uploadBusy}<p class="muted">Mengupload…</p>{/if}
					</div>
				{/if}
			</div>
		{/if}

		{#if showForm}
			<div class="modal" role="dialog" aria-modal="true">
				<button class="backdrop" type="button" aria-label="Tutup" onclick={() => (showForm = false)}></button>
				<form class="modal-card" onsubmit={submit}>
					<h2>{editing ? `Edit ${editing}` : 'Buat Undangan Baru'}</h2>
					<label>
						<span>Subdomain *</span>
						<input type="text" bind:value={formSubdomain} disabled={!!editing} placeholder="ruhaeni-roni" />
					</label>
					<div class="grid2">
						<label><span>Pihak 1</span><input type="text" bind:value={formPihak1} placeholder="Ruhaeni" /></label>
						<label><span>Pihak 2</span><input type="text" bind:value={formPihak2} placeholder="Asep Roni" /></label>
					</div>
					<label><span>Tanggal Acara</span><input type="date" bind:value={formTanggal} /></label>
					<label>
						<span>Status</span>
						<select bind:value={formStatus}>
							<option value="draft">draft</option>
							<option value="active">active</option>
							<option value="expired">expired</option>
						</select>
					</label>
					<label><span>PIN Kelola Tamu (6-digit, kosong = tanpa PIN / dev 000000)</span><input type="text" bind:value={formPin} placeholder="482913" /></label>
					{#if formErr}<p class="err">{formErr}</p>{/if}
					<div class="modal-actions">
						<button type="button" class="btn btn-ghost" onclick={() => (showForm = false)}>Batal</button>
						<button type="submit" class="btn btn-green" disabled={formSaving}>{formSaving ? 'Menyimpan…' : 'Simpan'}</button>
					</div>
					<p class="hint2">Konten lengkap (foto, ayat, gifts) masih dari <code>wedding.ts</code> untuk <code>ruhaeni-roni</code>. Panel ini mengelola DB <code>invitations</code> untuk tamu/ucapan per-subdomain.</p>
				</form>
			</div>
		{/if}
	</div>
</div>

<style>
	.admin {
		min-height: 100svh;
		background: var(--paper);
		padding: 1.6rem 0 3rem;
	}
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.2rem;
	}
	.head h1 {
		margin: 0;
		font-family: var(--font-serif);
		color: var(--ink);
	}
	.hint {
		margin: 0.35rem 0 0;
		font-size: 13px;
		color: var(--ink-2);
		max-width: 42em;
	}
	.head-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.muted {
		color: var(--ink-3);
	}
	.err {
		color: #b91c1c;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 10px;
		padding: 0.6em 0.9em;
	}
	.empty {
		background: var(--card);
		border: 1px dashed var(--line);
		border-radius: 14px;
		padding: 1.4rem;
		color: var(--ink-3);
		text-align: center;
	}
	.table-wrap {
		overflow-x: auto;
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 16px;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13.5px;
	}
	th,
	td {
		text-align: left;
		padding: 0.75rem 0.85rem;
		border-bottom: 1px solid var(--line-soft);
		vertical-align: top;
	}
	th {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--ink-2);
	}
	.links {
		display: flex;
		gap: 0.6rem;
		flex-wrap: wrap;
		margin-top: 0.3rem;
		font-size: 12px;
	}
	.links a,
	.lnk {
		display: inline-flex;
		align-items: center;
		gap: 0.25em;
		color: var(--ink-2);
		text-decoration: none;
		background: transparent;
		border: 0;
		cursor: pointer;
		font-size: 12px;
		padding: 0;
	}
	.badge {
		display: inline-block;
		border-radius: 999px;
		padding: 0.15em 0.6em;
		font-size: 11px;
		background: var(--paper-2);
		border: 1px solid var(--line);
	}
	.badge.active {
		background: #d1fae5;
		color: #065f46;
		border-color: #a7f3d0;
	}
	tr.selected {
		background: #f0fdf4;
	}
	.lnk.strong {
		font-weight: 600;
	}
	.detail {
		margin-top: 1.2rem;
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 16px;
		padding: 1.2rem;
	}
	.detail-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.8rem;
		margin-bottom: 0.8rem;
	}
	.detail-head h2 {
		margin: 0;
		font-size: 16px;
		color: var(--ink);
	}
	.tabs {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
		margin-bottom: 0.8rem;
	}
	.tabs button {
		border: 1px solid var(--line);
		background: var(--paper);
		border-radius: 999px;
		padding: 0.35em 0.85em;
		font-size: 12px;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.3em;
	}
	.tabs button.active {
		background: var(--ink);
		color: #fff;
		border-color: var(--ink);
	}
	.overview {
		display: grid;
		gap: 0.5rem;
		font-size: 13px;
	}
	.export-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	.export-row select {
		border: 1px solid var(--line);
		border-radius: 8px;
		padding: 0.4em 0.6em;
	}
	.list {
		display: grid;
		gap: 0.5rem;
	}
	.list-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5em 0.7em;
		border: 1px solid var(--line-soft);
		border-radius: 10px;
		font-size: 13px;
	}
	.wish-item {
		border: 1px solid var(--line-soft);
		border-radius: 10px;
		padding: 0.6em 0.8em;
		font-size: 13px;
	}
	.wish-msg {
		margin: 0.3rem 0 0;
		color: var(--ink-2);
	}
	.upload {
		display: grid;
		gap: 0.6rem;
	}
	.pin {
		letter-spacing: 0.08em;
	}
	.actions {
		display: flex;
		gap: 0.35rem;
	}
	.ic {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 1px solid var(--line);
		background: #fff;
		display: grid;
		place-items: center;
		cursor: pointer;
	}
	.ic.danger {
		color: #b91c1c;
	}
	.modal {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: grid;
		place-items: center;
		padding: 1rem;
	}
	.backdrop {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.45);
		border: 0;
	}
	.modal-card {
		position: relative;
		background: var(--card);
		border-radius: 18px;
		padding: 1.4rem;
		width: min(100%, 520px);
		display: grid;
		gap: 0.8rem;
		box-shadow: var(--shadow-2);
	}
	.modal-card h2 {
		margin: 0;
		font-family: var(--font-serif);
		color: var(--ink);
		font-size: 18px;
	}
	.modal-card label span {
		display: block;
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--ink-2);
		margin-bottom: 0.3rem;
	}
	.modal-card input,
	.modal-card select {
		width: 100%;
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 0.65em 0.9em;
		font-size: 14px;
		box-sizing: border-box;
	}
	.grid2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.7rem;
	}
	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.6rem;
		margin-top: 0.4rem;
	}
	.hint2 {
		margin: 0;
		font-size: 11px;
		color: var(--ink-3);
	}
</style>
