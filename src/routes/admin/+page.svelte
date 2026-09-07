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
	let tab = $state<'overview' | 'tamu' | 'ucapan' | 'foto' | 'konten'>('overview');
	let detailGuests = $state<GuestRow[]>([]);
	let detailWishes = $state<WishRow[]>([]);
	let detailLoading = $state(false);
	let uploadBusy = $state(false);
	let uploadMsg = $state('');
	let exportType = $state<'tamu' | 'ucapan'>('tamu');

	let kontenSaving = $state(false);
	let kontenMsg = $state('');
	let kontenEvents = $state<{ name: string; date: string; time: string; location: string; map_url: string }[]>([]);
	let kontenGifts = $state<{ type: string; provider: string; owner: string; number: string }[]>([]);
	let kontenBride = $state({ name: '', full_name: '', relation: '', instagram: '', whatsapp: '' });
	let kontenGroom = $state({ name: '', full_name: '', relation: '', instagram: '', whatsapp: '' });
	let kontenVerse = $state({ arabic: '', translation: '', source: '' });
	let kontenVerseOff = $state(false);
	let kontenThemePrimary = $state('#8b5e3c');
	let kontenThemeSecondary = $state('#f5ebe0');
	let kontenMusic = $state('');
	let kontenLivestream = $state('');
	let kontenStoryIntro = $state('');
	let kontenStoryChapters = $state<{ title: string; text: string }[]>([]);

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

	function hydrateKonten(it: InvitationItem) {
		const dj = (it.dataJson ?? {}) as Record<string, unknown>;
		const ev = Array.isArray(dj.events) ? (dj.events as typeof kontenEvents) : [];
		kontenEvents = ev.map((e) => ({ name: e.name ?? '', date: e.date ?? '', time: e.time ?? '', location: e.location ?? '', map_url: e.map_url ?? '' }));
		const gf = Array.isArray(dj.gifts) ? (dj.gifts as typeof kontenGifts) : [];
		kontenGifts = gf.map((g) => ({ type: g.type ?? 'bank', provider: g.provider ?? '', owner: g.owner ?? '', number: g.number ?? '' }));
		const cp = (dj.couple as Record<string, Record<string, string>> | undefined) ?? {};
		kontenBride = { name: cp.bride?.name ?? '', full_name: cp.bride?.full_name ?? '', relation: cp.bride?.relation ?? '', instagram: cp.bride?.instagram ?? '', whatsapp: cp.bride?.whatsapp ?? '' };
		kontenGroom = { name: cp.groom?.name ?? '', full_name: cp.groom?.full_name ?? '', relation: cp.groom?.relation ?? '', instagram: cp.groom?.instagram ?? '', whatsapp: cp.groom?.whatsapp ?? '' };
		const vs = (dj.verse as Record<string, string> | null | undefined) ?? null;
		if (!vs) { kontenVerseOff = true; kontenVerse = { arabic: '', translation: '', source: '' }; } else { kontenVerseOff = false; kontenVerse = { arabic: vs.arabic ?? '', translation: vs.translation ?? '', source: vs.source ?? '' }; }
		const th = (dj.theme as Record<string, string> | undefined) ?? {};
		kontenThemePrimary = th.primary ?? '#8b5e3c';
		kontenThemeSecondary = th.secondary ?? '#f5ebe0';
		kontenMusic = (dj.music_url as string) ?? '';
		kontenLivestream = (dj.livestream_url as string) ?? '';
		kontenStoryIntro = (dj.love_story_intro as string) ?? ((dj.love_story as unknown[]) ? '' : '');
		const ls = Array.isArray(dj.love_story) ? (dj.love_story as { title: string; text: string }[]) : [];
		kontenStoryChapters = ls.map((c) => ({ title: c.title ?? '', text: c.text ?? '' }));
		kontenMsg = '';
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
			const it = items.find((x) => x.subdomain === sd);
			if (it) hydrateKonten(it);
		} catch {
			detailGuests = [];
			detailWishes = [];
		} finally {
			detailLoading = false;
		}
	}

	async function saveKonten() {
		if (!selected) return;
		kontenSaving = true;
		kontenMsg = '';
		try {
			const it = items.find((x) => x.subdomain === selected);
			const cur = (it?.dataJson ?? {}) as Record<string, unknown>;
			const next: Record<string, unknown> = {
				...cur,
				theme: { primary: kontenThemePrimary, secondary: kontenThemeSecondary },
				events: kontenEvents.filter((e) => e.name.trim() || e.date.trim()),
				gifts: kontenGifts.filter((g) => g.number.trim()),
				couple: { bride: { ...kontenBride }, groom: { ...kontenGroom } },
				verse: kontenVerseOff ? null : { arabic: kontenVerse.arabic, translation: kontenVerse.translation, source: kontenVerse.source },
				music_url: kontenMusic.trim() || null,
				livestream_url: kontenLivestream.trim() || null,
				love_story: kontenStoryChapters.filter((c) => c.title.trim() || c.text.trim()),
				love_story_intro: kontenStoryIntro
			};
			const res = await fetch(`/api/admin/invitations?subdomain=${encodeURIComponent(selected)}`, {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ dataJson: next })
			});
			const j = await res.json().catch(() => null);
			if (!res.ok) { kontenMsg = j?.message ?? 'Gagal menyimpan.'; return; }
			if (it) it.dataJson = j.item.dataJson ?? next;
			kontenMsg = 'Tersimpan.';
		} catch { kontenMsg = 'Gagal menyimpan.'; } finally { kontenSaving = false; }
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

	function currentGallery(): string[] {
		const it = items.find((x) => x.subdomain === selected);
		const dj = (it?.dataJson ?? {}) as Record<string, unknown>;
		return Array.isArray(dj.gallery) ? (dj.gallery as string[]) : [];
	}
	async function deleteGalleryUrl(url: string) {
		if (!selected) return;
		if (!confirm('Hapus foto ini dari galeri?')) return;
		const res = await fetch(`/api/admin/upload?slug=${encodeURIComponent(selected)}&url=${encodeURIComponent(url)}`, { method: 'DELETE' });
		const j = await res.json().catch(() => null);
		if (!res.ok) { uploadMsg = j?.message ?? 'Gagal menghapus.'; return; }
		const it = items.find((x) => x.subdomain === selected);
		if (it) it.dataJson = { ...(it.dataJson ?? {}), gallery: j.gallery ?? currentGallery().filter((u) => u !== url) };
		uploadMsg = 'Foto dihapus.';
	}
	async function moveGallery(idx: number, dir: -1 | 1) {
		if (!selected) return;
		const arr = [...currentGallery()];
		const j = idx + dir;
		if (j < 0 || j >= arr.length) return;
		[arr[idx], arr[j]] = [arr[j], arr[idx]];
		const res = await fetch(`/api/admin/upload?slug=${encodeURIComponent(selected)}&reorder=${encodeURIComponent(JSON.stringify(arr))}`, { method: 'DELETE' });
		const rj = await res.json().catch(() => null);
		if (!res.ok) { uploadMsg = rj?.message ?? 'Gagal reorder.'; return; }
		const it = items.find((x) => x.subdomain === selected);
		if (it) it.dataJson = { ...(it.dataJson ?? {}), gallery: rj.gallery ?? arr };
	}

	async function uploadFiles(e: Event, kind: string = 'gallery') {
		const input = e.target as HTMLInputElement;
		if (!input.files?.length || !selected) return;
		uploadBusy = true;
		uploadMsg = '';
		try {
			const fd = new FormData();
			for (const f of Array.from(input.files)) fd.append('files', f);
			const res = await fetch(`/api/admin/upload?slug=${encodeURIComponent(selected)}&kind=${encodeURIComponent(kind)}`, { method: 'POST', body: fd });
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
	async function exportServer(fmt: 'xlsx' | 'pdf') {
		if (!selected) return;
		const res = await fetch(`/api/admin/wishes?slug=${encodeURIComponent(selected)}&format=${fmt}&type=${exportType}`);
		if (!res.ok) { alert('Export gagal.'); return; }
		const blob = await res.blob();
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = `${selected}-${exportType}.${fmt}`;
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
					<button class:active={tab === 'konten'} onclick={() => (tab = 'konten')}>Konten</button>
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
							<button class="btn btn-ghost" onclick={exportCsv}>CSV</button>
							<button class="btn btn-ghost" onclick={() => exportServer('xlsx')}>Excel</button>
							<button class="btn btn-ghost" onclick={() => exportServer('pdf')}>PDF</button>
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
						<p class="hint">Upload ke Supabase Storage bucket <code>invitation-photos/{selected}/</code> (Public, auto-kompresi 1600px JPEG). <code>kind=gallery|hero|bride|groom</code>.</p>
						<label class="btn btn-green">
							Galeri (max 12)
							<input type="file" accept="image/*" multiple hidden onchange={(e) => uploadFiles(e, 'gallery')} disabled={uploadBusy} />
						</label>
						<div class="row" style="gap:0.4rem;flex-wrap:wrap;display:flex">
							<label class="btn btn-ghost sm">Hero <input type="file" accept="image/*" hidden onchange={(e) => uploadFiles(e, 'hero')} disabled={uploadBusy} /></label>
							<label class="btn btn-ghost sm">Bride <input type="file" accept="image/*" hidden onchange={(e) => uploadFiles(e, 'bride')} disabled={uploadBusy} /></label>
							<label class="btn btn-ghost sm">Groom <input type="file" accept="image/*" hidden onchange={(e) => uploadFiles(e, 'groom')} disabled={uploadBusy} /></label>
						</div>
						{#if uploadMsg}<p class="muted">{uploadMsg}</p>{/if}
						{#if uploadBusy}<p class="muted">Mengupload…</p>{/if}
						{#if currentGallery().length > 0}
							<div class="gallery-grid">
								{#each currentGallery() as url, i}
									<div class="gcell">
										<img src={url} alt={`Foto ${i + 1}`} loading="lazy" />
										<div class="gact">
											<button class="ic sm" onclick={() => moveGallery(i, -1)} disabled={i === 0} title="Naik">↑</button>
											<button class="ic sm" onclick={() => moveGallery(i, 1)} disabled={i === currentGallery().length - 1} title="Turun">↓</button>
											<button class="ic danger sm" onclick={() => deleteGalleryUrl(url)} title="Hapus"><Trash2 size={12} /></button>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<p class="muted">Belum ada foto galeri.</p>
						{/if}
					</div>
				{:else if tab === 'konten'}
					<div class="konten">
						<p class="hint">Edit <code>data_json</code> generik (events, gifts, couple, ayat, story, theme, musik). Simpan menimpa DB; preview di <code>/{selected}</code>.</p>
						<h3>Events ({kontenEvents.length})</h3>
						{#each kontenEvents as ev, i}
							<div class="konten-row">
								<input placeholder="Nama (Akad/Resepsi)" bind:value={kontenEvents[i].name} />
								<input type="date" bind:value={kontenEvents[i].date} />
								<input placeholder="Jam (08.00 WIB)" bind:value={kontenEvents[i].time} />
								<input placeholder="Lokasi" bind:value={kontenEvents[i].location} />
								<input placeholder="Maps URL" bind:value={kontenEvents[i].map_url} />
								<button class="ic danger sm" onclick={() => (kontenEvents = kontenEvents.filter((_, j) => j !== i))}><Trash2 size={12} /></button>
							</div>
						{/each}
						<button class="btn btn-ghost sm" onclick={() => (kontenEvents = [...kontenEvents, { name: '', date: '', time: '', location: '', map_url: '' }])}><Plus size={12} /> Tambah Acara</button>

						<h3>Gifts ({kontenGifts.length})</h3>
						{#each kontenGifts as g, i}
							<div class="konten-row">
								<select bind:value={kontenGifts[i].type}><option value="bank">bank</option><option value="ewallet">ewallet</option></select>
								<input placeholder="Provider (DANA/BCA)" bind:value={kontenGifts[i].provider} />
								<input placeholder="Pemilik" bind:value={kontenGifts[i].owner} />
								<input placeholder="No. rekening" bind:value={kontenGifts[i].number} />
								<button class="ic danger sm" onclick={() => (kontenGifts = kontenGifts.filter((_, j) => j !== i))}><Trash2 size={12} /></button>
							</div>
						{/each}
						<button class="btn btn-ghost sm" onclick={() => (kontenGifts = [...kontenGifts, { type: 'ewallet', provider: 'DANA', owner: '', number: '' }])}><Plus size={12} /> Tambah Gift</button>

						<h3>Mempelai</h3>
						<div class="grid2"><label><span>Bride name</span><input bind:value={kontenBride.name} /></label><label><span>Bride full_name</span><input bind:value={kontenBride.full_name} /></label></div>
						<label><span>Bride relation</span><textarea rows="2" bind:value={kontenBride.relation}></textarea></label>
						<div class="grid2"><label><span>Bride IG</span><input bind:value={kontenBride.instagram} /></label><label><span>Bride WA</span><input bind:value={kontenBride.whatsapp} /></label></div>
						<div class="grid2"><label><span>Groom name</span><input bind:value={kontenGroom.name} /></label><label><span>Groom full_name</span><input bind:value={kontenGroom.full_name} /></label></div>
						<label><span>Groom relation</span><textarea rows="2" bind:value={kontenGroom.relation}></textarea></label>
						<div class="grid2"><label><span>Groom IG</span><input bind:value={kontenGroom.instagram} /></label><label><span>Groom WA</span><input bind:value={kontenGroom.whatsapp} /></label></div>

						<h3>Ayat</h3>
						<label class="chk"><input type="checkbox" checked={!kontenVerseOff} onchange={(e) => (kontenVerseOff = !(e.target as HTMLInputElement).checked)} /> Tampilkan ayat</label>
						{#if !kontenVerseOff}
							<label><span>Arabic</span><textarea rows="2" bind:value={kontenVerse.arabic}></textarea></label>
							<label><span>Terjemahan</span><textarea rows="3" bind:value={kontenVerse.translation}></textarea></label>
							<label><span>Sumber</span><input bind:value={kontenVerse.source} /></label>
						{/if}

						<h3>Love Story</h3>
						<label><span>Intro</span><textarea rows="2" bind:value={kontenStoryIntro}></textarea></label>
						{#each kontenStoryChapters as ch, i}
							<div class="konten-row">
								<input placeholder="Judul" bind:value={kontenStoryChapters[i].title} />
								<textarea placeholder="Teks" rows="2" bind:value={kontenStoryChapters[i].text}></textarea>
								<button class="ic danger sm" onclick={() => (kontenStoryChapters = kontenStoryChapters.filter((_, j) => j !== i))}><Trash2 size={12} /></button>
							</div>
						{/each}
						<button class="btn btn-ghost sm" onclick={() => (kontenStoryChapters = [...kontenStoryChapters, { title: '', text: '' }])}><Plus size={12} /> Tambah Bab</button>

						<h3>Tema & Media</h3>
						<div class="grid2"><label><span>Primary</span><input type="color" bind:value={kontenThemePrimary} /></label><label><span>Secondary</span><input type="color" bind:value={kontenThemeSecondary} /></label></div>
						<label><span>Music URL</span><input placeholder="/audio/wedding.mp3 atau https://..." bind:value={kontenMusic} /></label>
						<label><span>Livestream URL</span><input bind:value={kontenLivestream} /></label>

						<div class="modal-actions">
							<button class="btn btn-green" onclick={saveKonten} disabled={kontenSaving}>{kontenSaving ? 'Menyimpan…' : 'Simpan Konten'}</button>
						</div>
						{#if kontenMsg}<p class={kontenMsg === 'Tersimpan.' ? 'muted' : 'err'}>{kontenMsg}</p>{/if}
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
	.gallery-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
		gap: 0.6rem;
		margin-top: 0.6rem;
	}
	.gcell {
		border: 1px solid var(--line);
		border-radius: 10px;
		overflow: hidden;
		background: var(--paper);
	}
	.gcell img {
		width: 100%;
		aspect-ratio: 1;
		object-fit: cover;
		display: block;
	}
	.gact {
		display: flex;
		gap: 0.25rem;
		padding: 0.35rem;
		justify-content: center;
	}
	.ic.sm {
		width: 28px;
		height: 28px;
		font-size: 13px;
	}
	.konten {
		display: grid;
		gap: 0.9rem;
	}
	.konten h3 {
		margin: 1.1rem 0 0.3rem;
		font-size: 14px;
		color: var(--ink);
	}
	.konten-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
		align-items: start;
		border: 1px solid var(--line-soft);
		border-radius: 10px;
		padding: 0.6rem;
	}
	@media (min-width: 560px) {
		.konten-row {
			grid-template-columns: 1fr 1fr 1fr auto;
		}
	}
	.konten-row input,
	.konten-row select,
	.konten-row textarea {
		width: 100%;
		border: 1px solid var(--line);
		border-radius: 8px;
		padding: 0.45em 0.65em;
		font-size: 13px;
		box-sizing: border-box;
	}
	.chk {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		font-size: 13px;
		color: var(--ink-2);
	}
	.konten label span {
		display: block;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--ink-2);
		margin-bottom: 0.25rem;
	}
	.konten label input,
	.konten label textarea,
	.konten label select {
		width: 100%;
		border: 1px solid var(--line);
		border-radius: 8px;
		padding: 0.55em 0.8em;
		font-size: 13px;
		box-sizing: border-box;
	}
</style>
