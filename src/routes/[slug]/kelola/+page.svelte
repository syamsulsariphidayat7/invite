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
		ArrowLeft,
		Moon,
		Sun,
		ChevronDown,
		MessageSquare,
		Download
	} from 'lucide-svelte';

	let { data } = $props();
	const slug: string = $derived(data.slug);
	const w = $derived(data.resolved as unknown as { siteTitle?: string; namesShort?: string; photos?: { cover?: string; hero?: string } });
	const coverPhoto = $derived(w?.photos?.cover || w?.photos?.hero || 'hero');
	const ogImage = $derived(
		coverPhoto.startsWith('http://') || coverPhoto.startsWith('https://')
			? coverPhoto
			: `${page.url.origin}/photos/${coverPhoto}.jpg`
	);

	interface GuestRow {
		id: string;
		name: string;
		sent: boolean;
		sentAt: string | null;
	}

	let single = $state('');
	let singleEl = $state<HTMLInputElement | null>(null);
	let bulk = $state('');
	let honey = $state('');
	let guests = $state<GuestRow[]>([]);
	let search = $state('');
	let filter = $state<'all' | 'pending' | 'sent'>('all');
	let curPage = $state(1);
	const perPage = 5;
	let copied = $state<string | null>(null);
	let origin = $state('');
	let showTemplate = $state(false);
	let pin = $state('');
	let authed = $state(false);
	let pinError = $state('');
	let loading = $state(false);
	let pinChecking = $state(false);
	let selectedIds = $state<Set<string>>(new Set());
	let dark = $state(false);
	let showClearAll = $state(false);
	let clearingAll = $state(false);
	let confirmDeleteTarget = $state<GuestRow | null>(null);

	// ---- PWA install prompt ----
	interface BeforeInstallPromptEvent extends Event {
		prompt: () => Promise<void>;
		userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
	}
	let installEvt = $state<BeforeInstallPromptEvent | null>(null);
	let showInstall = $state(false);
	let installed = $state(false);
	let deletingSingle = $state(false);

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
	let templateEl = $state<HTMLTextAreaElement | null>(null);
	let templateSaving = $state(false);
	let templateSaveErr = $state('');
	let templateTouched = $state(false);
	let templateHydrated = $state(false);

	const STORAGE_PIN = $derived(`undangan_pin_${slug}`);
	const TEMPLATE_KEY = $derived(`undangan_wa_template_${slug}`);
	const hasNama = $derived(template.includes('{nama}'));
	const hasLink = $derived(template.includes('{link}'));
	const templateError = $derived(!hasLink ? 'Pesan harus mengandung {link} agar tamu mendapat link undangan.' : null);
	const templateWarn = $derived(hasLink && !hasNama ? 'Tambahkan {nama} untuk sapaan lebih personal.' : null);

	function toggleDark() {
		dark = !dark;
		try {
			localStorage.setItem('kelola_dark', dark ? '1' : '0');
		} catch {}
	}
	function headers(): Record<string, string> {
		return { 'x-pin': pin };
	}

	function apiUrl(path: string, extra?: string): string {
		const base = `/api/guests?slug=${encodeURIComponent(slug)}`;
		if (extra) return base + extra;
		return base;
	}

	onMount(async () => {
		try {
			const saved = localStorage.getItem('kelola_dark');
			dark = saved ? saved === '1' : window.matchMedia('(prefers-color-scheme: dark)').matches;
		} catch {}
		origin = window.location.origin;
		let localTmpl: string | null = null;
		try { localTmpl = localStorage.getItem(TEMPLATE_KEY); } catch {}
		let serverTmpl: string | null = null;
		try {
			const r = await fetch(`/api/guests/template?slug=${encodeURIComponent(slug)}`);
			const j = await r.json().catch(() => null) as { waTemplate?: string } | null;
			if (j?.waTemplate?.trim()) serverTmpl = j.waTemplate.trim();
		} catch {}
		if (serverTmpl) {
			serverTemplate = serverTmpl;
			if (localTmpl && localTmpl.trim() && localTmpl !== serverTmpl && localTmpl !== DEFAULT_TEMPLATE) {
				template = localTmpl;
			} else {
				template = serverTmpl;
			}
		} else if (localTmpl && localTmpl.trim()) {
			template = localTmpl;
		}
		queueMicrotask(() => { templateHydrated = true; });
		try {
			const qp = page.url.searchParams.get('pin');
			const stored = sessionStorage.getItem(STORAGE_PIN) ?? localStorage.getItem(STORAGE_PIN);
			if (qp && qp.length >= 4) {
				pin = qp;
				await tryVerify();
			} else if (stored && stored.length >= 4) {
				pin = stored;
				await tryVerify();
			}
		} catch {}
	});

	onMount(() => {
		const standalone =
			window.matchMedia('(display-mode: standalone)').matches ||
			(navigator as { standalone?: boolean }).standalone === true;
		installed = standalone;
		const onInstallPrompt = (e: Event) => {
			e.preventDefault();
			installEvt = e as BeforeInstallPromptEvent;
			if (!installed) showInstall = true;
		};
		const onInstalled = () => {
			installed = true;
			showInstall = false;
			installEvt = null;
		};
		window.addEventListener('beforeinstallprompt', onInstallPrompt);
		window.addEventListener('appinstalled', onInstalled);
		return () => {
			window.removeEventListener('beforeinstallprompt', onInstallPrompt);
			window.removeEventListener('appinstalled', onInstalled);
		};
	});

	async function installApp() {
		if (!installEvt) return;
		await installEvt.prompt();
		const choice = await installEvt.userChoice;
		installEvt = null;
		if (choice.outcome === 'accepted') {
			installed = true;
			showInstall = false;
		}
	}

	let templateSaveTimer: ReturnType<typeof setTimeout> | null = null;
	$effect(() => {
		void template;
		if (typeof window === 'undefined' || !templateHydrated) return;
		try { localStorage.setItem(TEMPLATE_KEY, template); } catch {}
		templateTouched = true;
		if (templateSaveTimer) clearTimeout(templateSaveTimer);
		templateSaveErr = '';
		if (!authed || !hasLink) return;
		templateSaveTimer = setTimeout(() => { void saveTemplate(); }, 900);
	});
	$effect(() => {
		if (!showTemplate && !showClearAll && !confirmDeleteTarget) return;
		if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				showTemplate = false;
				showClearAll = false;
				confirmDeleteTarget = null;
			}
		};
		window.addEventListener('keydown', onKey);
		return () => {
			if (typeof document !== 'undefined') document.body.style.overflow = '';
			window.removeEventListener('keydown', onKey);
		};
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
			if (templateHydrated && template.trim() !== (serverTemplate ?? '').trim() && hasLink) {
				void saveTemplate();
			}
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
		let msg = template;
		if (!msg.includes('{link}')) msg = `${msg.trim()}\n\n{link}`;
		return msg.replace(/\{nama\}/g, name).replace(/\{link\}/g, link);
	}
	function waPreview(): string { return waMessageFor('Budi Santoso'); }
	function insertToken(tok: '{nama}' | '{link}') {
		const el = templateEl;
		if (!el) { if (!template.includes(tok)) template = `${template}${template.endsWith(' ') || template.endsWith('\n') ? '' : ' '}${tok}`; return; }
		const s = el.selectionStart ?? template.length, e = el.selectionEnd ?? template.length;
		template = `${template.slice(0, s)}${tok}${template.slice(e)}`;
		requestAnimationFrame(() => { el.focus(); const p = s + tok.length; el.setSelectionRange(p, p); });
	}
	async function saveTemplate() {
		if (!authed || !hasLink) return;
		const val = template.trim();
		if (!val || val === serverTemplate) return;
		templateSaving = true; templateSaveErr = '';
		try {
			const res = await fetch(`/api/guests/template?slug=${encodeURIComponent(slug)}`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers() }, body: JSON.stringify({ waTemplate: template }) });
			const j = await res.json().catch(() => null);
			if (!res.ok) { templateSaveErr = j?.message ?? 'Gagal menyimpan template.'; return; }
			serverTemplate = j?.waTemplate ?? template;
			try { localStorage.setItem(TEMPLATE_KEY, template); } catch {}
		} catch { templateSaveErr = 'Gagal menyimpan.'; } finally { templateSaving = false; }
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
		if (!hasLink) {
			notify('Perbaiki template — harus mengandung {link}.', 'err');
			showTemplate = true;
			return;
		}
		patchSent(g, true);
	}

	function toggleSent(g: GuestRow) {
		patchSent(g, !g.sent);
	}

	async function copy(text: string, id: string) {
		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(text);
			} else throw new Error('no clipboard');
		} catch {
			try {
				const ta = document.createElement('textarea');
				ta.value = text;
				document.body.appendChild(ta);
				ta.select();
				document.execCommand('copy');
				ta.remove();
			} catch {
				notify('Gagal menyalin — salin manual.', 'err');
				return;
			}
		}
		copied = id;
		setTimeout(() => (copied = null), 1800);
		notify('Tersalin.');
	}

	async function addSingle() {
		const n = single.trim();
		if (!n || n.length < 2) {
			notify('Nama minimal 2 karakter.', 'err');
			return;
		}
		if (!authed) {
			notify('Masuk dengan PIN terlebih dahulu.', 'err');
			return;
		}
		loading = true;
		try {
			const res = await fetch(apiUrl('', ''), {
				method: 'POST',
				headers: { 'content-type': 'application/json', ...headers() },
				body: JSON.stringify({ names: [n], website: honey })
			});
			const j = await res.json().catch(() => null);
			if (!res.ok) {
				notify(j?.message ?? 'Gagal menambah tamu.', 'err');
				return;
			}
			const added: GuestRow[] = (j.added ?? []).map((g: GuestRow) => ({ id: g.id, name: g.name, sent: g.sent, sentAt: g.sentAt }));
			if (added.length === 0) {
				notify('Nama sudah ada.', 'err');
			} else {
				guests = [...guests, ...added];
				notify(`${added.length} tamu ditambahkan.`);
				single = '';
				requestAnimationFrame(() => singleEl?.focus());
			}
		} catch {
			notify('Gagal terhubung.', 'err');
		} finally {
			loading = false;
		}
	}

	async function addBulk() {
		const lines = bulk.split('\n').map((s) => s.trim()).filter(Boolean);
		if (!lines.length) {
			notify('Masukkan minimal 1 nama.', 'err');
			return;
		}
		if (!authed) {
			notify('Masuk dengan PIN terlebih dahulu.', 'err');
			return;
		}
		loading = true;
		try {
			const res = await fetch(apiUrl('', ''), {
				method: 'POST',
				headers: { 'content-type': 'application/json', ...headers() },
				body: JSON.stringify({ names: lines, website: honey })
			});
			const j = await res.json().catch(() => null);
			if (!res.ok) {
				notify(j?.message ?? 'Gagal import.', 'err');
				return;
			}
			const added: GuestRow[] = (j.added ?? []).map((g: GuestRow) => ({ id: g.id, name: g.name, sent: g.sent, sentAt: g.sentAt }));
			guests = [...guests, ...added];
			if (added.length < lines.length) {
				notify(`${added.length} ditambahkan, ${lines.length - added.length} duplikat dilewati.`, added.length ? 'ok' : 'err');
			} else {
				notify(`${added.length} tamu diimport.`);
			}
			if (added.length) bulk = '';
		} catch {
			notify('Gagal terhubung.', 'err');
		} finally {
			loading = false;
		}
	}

	async function refreshGuests() {
		try {
			const res = await fetch(apiUrl('', ''), { headers: headers() });
			if (!res.ok) return;
			const j = await res.json();
			guests = (j.guests ?? []).map((g: GuestRow) => ({ id: g.id, name: g.name, sent: g.sent, sentAt: g.sentAt }));
			const ids = new Set(guests.map((g) => g.id));
			selectedIds = new Set([...selectedIds].filter((id) => ids.has(id)));
		} catch {}
	}

	async function removeRow(g: GuestRow) {
		if (deletingSingle) return;
		deletingSingle = true;
		try {
			const res = await fetch(apiUrl('', `&id=${encodeURIComponent(g.id)}`), {
				method: 'DELETE',
				headers: headers()
			});
			if (!res.ok) {
				const j = await res.json().catch(() => null);
				if (res.status === 401) {
					notify('PIN salah — masuk ulang.', 'err');
					authed = false;
				} else {
					notify(j?.message ?? 'Gagal menghapus.', 'err');
				}
				return;
			}
			guests = guests.filter((x) => x.id !== g.id);
			selectedIds = new Set([...selectedIds].filter((id) => id !== g.id));
			confirmDeleteTarget = null;
			notify(`"${g.name}" dihapus.`);
			void refreshGuests();
		} catch {
			notify('Gagal terhubung.', 'err');
		} finally {
			deletingSingle = false;
		}
	}

	async function clearAll() {
		if (clearingAll || guests.length === 0) return;
		clearingAll = true;
		try {
			const res = await fetch(apiUrl('', '&all=1'), { method: 'DELETE', headers: headers() });
			const j = await res.json().catch(() => null);
			if (!res.ok) {
				if (res.status === 401) {
					notify('PIN salah — masuk ulang.', 'err');
					authed = false;
				} else {
					notify(j?.message ?? 'Gagal menghapus semua.', 'err');
				}
				return;
			}
			const deleted = typeof j?.deleted === 'number' ? j.deleted : guests.length;
			guests = [];
			selectedIds = new Set();
			showClearAll = false;
			notify(deleted ? `${deleted} tamu dihapus.` : 'Semua tamu dihapus.');
			void refreshGuests();
		} catch {
			notify('Gagal terhubung.', 'err');
		} finally {
			clearingAll = false;
		}
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
		if (!hasLink) {
			notify('Perbaiki template pesan — harus mengandung {link}.', 'err');
			showTemplate = true;
			return;
		}
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
	const totalPages = $derived(Math.max(1, Math.ceil(filteredGuests.length / perPage)));
	const pagedGuests = $derived(filteredGuests.slice((curPage - 1) * perPage, curPage * perPage));

	$effect(() => {
		void filter;
		void search;
		curPage = 1;
	});
	$effect(() => {
		void filteredGuests.length;
		if (curPage > totalPages) curPage = totalPages;
		if (curPage < 1) curPage = 1;
	});

	const stats = $derived({
		total: guests.length,
		sent: guests.filter((g) => g.sent).length,
		pending: guests.filter((g) => !g.sent).length
	});
</script>

<svelte:head>
	<title>Kelola Tamu — {slug}</title>
	<link rel="manifest" href={`/${slug}/kelola/manifest.webmanifest`} />
	<meta name="theme-color" content="#2563eb" />
	<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

	<meta property="og:title" content={w?.siteTitle ?? `Kelola Tamu — ${slug}`} />
	<meta property="og:description" content="Link undangan pernikahan — Kelola daftar tamu" />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:url" content="{page.url.origin}/{slug}/kelola" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content={ogImage} />
</svelte:head>

<div class="shell" class:dark={dark}>
	<header class="topbar">
		<div class="brand">
			<div class="logo-mark">
				<Users size={16} />
			</div>
			<span class="brand-name">Kelola Tamu<em>/{slug}</em></span>
		</div>
		<div class="topbar-right">
			<a class="btn btn-ghost sm" href="/{slug}" target="_blank" rel="noopener"><ExternalLink size={14} /> Lihat</a>
			<button class="btn btn-ghost sm theme-btn" onclick={toggleDark} title={dark ? 'Mode terang' : 'Mode gelap'} aria-label="Ganti tema">
				{#if dark}<Sun size={15} />{:else}<Moon size={15} />{/if}
			</button>
			{#if authed}
				<button class="icon-btn" onclick={logout} title="Keluar"><LogOut size={16} /></button>
			{/if}
		</div>
	</header>

	{#if showInstall}
		<div class="install-banner" role="dialog" aria-label="Install aplikasi">
			<div class="install-info">
				<div class="install-ic"><Download size={16} /></div>
				<div class="install-txt">
					<strong>Install aplikasi</strong>
					<span>Buka Kelola Tamu langsung dari layar utama.</span>
				</div>
			</div>
			<button class="btn btn-primary sm" onclick={installApp}>Install</button>
			<button class="icon-btn" onclick={() => (showInstall = false)} title="Tutup" aria-label="Tutup"><X size={15} /></button>
		</div>
	{/if}

	<main class="main">
		{#if !authed}
			<div class="pin-wrap">
				<div class="pin-card card">
					<div class="pin-ic"><Lock size={20} /></div>
					<h1>Masuk dengan PIN</h1>
					<p class="pin-desc">Masukkan PIN pengelola untuk mengelola daftar tamu undangan ini.</p>
					<label class="pin-field">
						<input
							type="password"
							inputmode="numeric"
							placeholder="Masukkan PIN"
							bind:value={pin}
							onkeydown={(e) => e.key === 'Enter' && tryVerify()}
							autofocus
						/>
					</label>
					{#if pinError}
						<p class="alert err"><X size={14} /> {pinError}</p>
					{/if}
					<button class="btn btn-primary" onclick={tryVerify} disabled={pinChecking}>
						{pinChecking ? 'Memeriksa…' : 'Masuk'}
					</button>
					<p class="pin-hint">PIN disimpan 24 jam di perangkat ini. Hubungi penyelenggara jika lupa PIN.</p>
				</div>
			</div>
		{:else}
			<div class="card pad form-card">
				<div class="form-card-head">
					<h3 class="sec-title"><UserPlus size={15} /> Tambah Tamu</h3>
					<button type="button" class="btn btn-primary sm" onclick={() => (showTemplate = true)}><MessageSquare size={14} /> Atur Format Pesan Whatsapp</button>
				</div>
				<pre class="tmpl-preview-full" title={waPreview()}>{waPreview()}</pre>
				<input type="text" bind:value={honey} tabindex="-1" autocomplete="off" aria-hidden="true" class="honey" />
				<label>
					<span>Nama tamu</span>
					<div class="row">
						<input
							bind:this={singleEl}
							placeholder="Contoh Anaya & Keluarga"
							bind:value={single}
							onkeydown={(e) => e.key === 'Enter' && addSingle()}
							disabled={loading}
							autofocus
						/>
						<button class="btn btn-primary" onclick={addSingle} disabled={loading}>
							<UserPlus size={15} /> Tambah
						</button>
					</div>
				</label>
			</div>

			<div class="filter-bar">
				<div class="search-box">
					<Search size={14} class="search-icon" />
					<input type="text" placeholder="Cari nama tamu…" bind:value={search} />
				</div>
				<div class="filter-left">
					<div class="tabs">
						<button type="button" class:active={filter === 'all'} onclick={() => (filter = 'all')}>
							Semua <b>({stats.total})</b>
						</button>
						<button type="button" class:active={filter === 'pending'} onclick={() => (filter = 'pending')}>
							Belum <b>({stats.pending})</b>
						</button>
						<button type="button" class:active={filter === 'sent'} onclick={() => (filter = 'sent')}>
							Terkirim <b>({stats.sent})</b>
						</button>
					</div>
					{#if guests.length > 0}
						<button class="btn danger-ghost sm" onclick={() => (showClearAll = true)} disabled={clearingAll} title="Hapus seluruh daftar tamu"><Trash2 size={13} /> Hapus Semua ({guests.length})</button>
					{/if}
				</div>
			</div>

			<div class="list">
				{#if filteredGuests.length === 0}
					<div class="empty">
						{#if guests.length === 0}
							<strong>Belum ada tamu</strong>
							<p>Tambahkan nama di form atas, lalu kirim link undangan via WhatsApp.</p>
						{:else}
							<strong>Tidak ada hasil</strong>
							<p>Tidak ada tamu yang cocok dengan filter atau pencarian.</p>
						{/if}
					</div>
				{:else}
					{#each pagedGuests as g, i}
						<article class="item" class:is-sent={g.sent}>
							<div class="info">
								<div class="name-row">
									<div class="li-avatar" style="--hue:{(g.name.charCodeAt(0) * 47) % 360}">{(g.name || '?')[0].toUpperCase()}</div>
									<strong>{g.name}</strong>
								</div>
							</div>
							<div class="actions">
								{#if g.sent}<span class="pill ok"><span class="dot"></span>Terkirim</span>{/if}
								<button
									class="icon-btn"
									class:ok={copied === `copy-${g.id}`}
									onclick={() => copy(linkFor(g.name), `copy-${g.id}`)}
									aria-label="Salin link"
									title="Salin Link"
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
								<button class="icon-btn danger" onclick={() => (confirmDeleteTarget = g)} aria-label="Hapus" title="Hapus" disabled={deletingSingle}>
									<Trash2 size={15} />
								</button>
							</div>
						</article>
					{/each}
					<div class="pagination">
						<button type="button" class="page-btn" disabled={curPage <= 1} onclick={() => (curPage -= 1)}>‹ Sebelumnya</button>
						<span class="page-info">{curPage} / {totalPages} · {filteredGuests.length} tamu</span>
						<button type="button" class="page-btn" disabled={curPage >= totalPages} onclick={() => (curPage += 1)}>Berikutnya ›</button>
					</div>
				{/if}
			</div>

		{/if}
	</main>

	{#if showTemplate}
		<div class="modal" role="dialog" aria-modal="true" aria-label="Format Pesan WhatsApp">
			<button class="modal-backdrop" aria-label="Tutup" onclick={() => (showTemplate = false)}></button>
			<div class="modal-card">
				<div class="modal-head">
					<h3><MessageSquare size={16} /> Format Pesan WhatsApp</h3>
					<button class="icon-btn sm" aria-label="Tutup" onclick={() => (showTemplate = false)}><X size={16} /></button>
				</div>
				<p class="modal-desc">Atur template yang dikirim ke tamu via WhatsApp.</p>
				<div class="tmpl-notice warn">
					<X size={14} class="tmpl-notice-icon" />
					<div class="tmpl-notice-text">Jangan hapus <code>{'{nama}'}</code> dan <code>{'{link}'}</code> — keduanya akan diganti otomatis dengan nama tamu & link undangan.</div>
				</div>
				<div class="tmpl-status">
					{#if templateSaving}<span class="hint saving">Menyimpan…</span>{:else if !templateError && templateTouched && hasLink}<span class="hint ok">Tersimpan otomatis</span>{/if}
				</div>
				{#if templateError}<p class="alert err" role="alert"><X size={14} /> {templateError}</p>{:else if templateWarn}<p class="alert warn"><X size={14} /> {templateWarn}</p>{/if}
				{#if templateSaveErr}<p class="alert err">{templateSaveErr}</p>{/if}
				<label class="tmpl-textarea">
					<textarea bind:this={templateEl} rows="10" bind:value={template} placeholder="Halo ..."></textarea>
					<span class="hint">{template.length} / 2000 karakter</span>
				</label>
				<div class="modal-actions">
					<button type="button" class="btn btn-ghost" onclick={() => (showTemplate = false)}>Batal</button>
					<button type="button" class="btn btn-ghost sm" onclick={resetTemplate}><RotateCcw size={12} /> Reset default</button>
					<button type="button" class="btn btn-primary" onclick={async () => { await saveTemplate(); if (!templateError && !templateSaveErr) showTemplate = false; }} disabled={!hasLink || templateSaving}>{templateSaving ? 'Menyimpan…' : 'Simpan'}</button>
				</div>
			</div>
		</div>
	{/if}

	{#if confirmDeleteTarget}
		<div class="modal" role="dialog" aria-modal="true" aria-label="Hapus tamu">
			<button class="modal-backdrop" aria-label="Tutup" onclick={() => !deletingSingle && (confirmDeleteTarget = null)}></button>
			<div class="modal-card">
				<div class="modal-head">
					<h3><Trash2 size={16} /> Hapus Tamu?</h3>
					<button class="icon-btn sm" aria-label="Tutup" onclick={() => !deletingSingle && (confirmDeleteTarget = null)} disabled={deletingSingle}><X size={16} /></button>
				</div>
				<p class="modal-desc">Hapus <strong>“{confirmDeleteTarget.name}”</strong> dari daftar <code>/{slug}</code>? Tindakan tidak dapat dibatalkan.</p>
				<div class="modal-actions">
					<button type="button" class="btn btn-ghost" onclick={() => (confirmDeleteTarget = null)} disabled={deletingSingle}>Batal</button>
					<button type="button" class="btn btn-primary" style="background:var(--danger);border-color:var(--danger)" onclick={() => confirmDeleteTarget && removeRow(confirmDeleteTarget)} disabled={deletingSingle}>{deletingSingle ? 'Menghapus…' : 'Hapus'}</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showClearAll}
		<div class="modal" role="dialog" aria-modal="true" aria-label="Hapus semua tamu">
			<button class="modal-backdrop" aria-label="Tutup" onclick={() => !clearingAll && (showClearAll = false)}></button>
			<div class="modal-card">
				<div class="modal-head">
					<h3><Trash2 size={16} /> Hapus Semua Tamu?</h3>
					<button class="icon-btn sm" aria-label="Tutup" onclick={() => !clearingAll && (showClearAll = false)} disabled={clearingAll}><X size={16} /></button>
				</div>
				<p class="modal-desc">Anda akan menghapus <strong>{guests.length} tamu</strong> dari daftar <code>/{slug}</code>. Tindakan ini tidak dapat dibatalkan dan PIN tetap diperlukan untuk menambah kembali.</p>
				<div class="tmpl-notice warn">
					<X size={14} class="tmpl-notice-icon" />
					<div class="tmpl-notice-text">Pastikan Anda sudah menyalin atau mengekspor data jika diperlukan.</div>
				</div>
				<div class="modal-actions">
					<button type="button" class="btn btn-ghost" onclick={() => (showClearAll = false)} disabled={clearingAll}>Batal</button>
					<button type="button" class="btn btn-primary" style="background:var(--danger);border-color:var(--danger)" onclick={clearAll} disabled={clearingAll}>{clearingAll ? 'Menghapus…' : `Hapus ${guests.length} Tamu`}</button>
				</div>
			</div>
		</div>
	{/if}

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
		--warn-bg: #fffbeb;
		--danger: #dc2626;
		--danger-bg: #fef2f2;
		--radius: 14px;
		--shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06);
		--shadow-lg: 0 16px 40px rgba(15, 23, 42, 0.14);

		--install-z: 95;

		min-height: 100svh;
		background: var(--bg);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
		color: var(--ink);
		font-size: 14px;
		line-height: 1.5;
	}

	.install-banner {
		position: fixed;
		left: 50%;
		transform: translateX(-50%);
		bottom: max(0.8rem, env(safe-area-inset-bottom));
		z-index: var(--install-z);
		width: min(100% - 1.6rem, 480px);
		display: flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.6rem 0.7rem;
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 14px;
		box-shadow: var(--shadow-lg);
		animation: install-in 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.install-info {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		min-width: 0;
		flex: 1;
	}
	.install-ic {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		border-radius: 10px;
		background: var(--accent-soft);
		color: var(--accent-strong);
		flex-shrink: 0;
	}
	.install-txt {
		display: flex;
		flex-direction: column;
		min-width: 0;
		font-size: 12px;
		line-height: 1.35;
		color: var(--ink-2);
	}
	.install-txt strong {
		color: var(--ink);
		font-size: 13px;
	}
	@keyframes install-in {
		from {
			opacity: 0;
			transform: translate(-50%, 12px);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 0);
		}
	}

	.shell * {
		box-sizing: border-box;
	}
	.honey {
		position: absolute;
		left: -9999px;
		opacity: 0;
		height: 0;
		pointer-events: none;
	}
	.sec-title {
		display: flex;
		align-items: center;
		gap: 0.45em;
		margin: 0 0 0.8rem;
		font-size: 14px;
		font-weight: 700;
		color: var(--ink);
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
		min-width: 0;
		overflow: hidden;
	}
	.form-card {
		display: grid;
		gap: 1rem;
		margin-bottom: 1.2rem;
	}
	.form-card-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	.form-card-head .sec-title { margin: 0; }
	.tmpl-preview-full {
		background: var(--bg);
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 0.7rem 0.85rem;
		font-size: 12.5px;
		line-height: 1.65;
		color: var(--ink-2);
		white-space: pre-wrap;
		word-break: break-word;
	}
	.f-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}
	.f-row > label { min-width: 0; }
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
		min-width: 0;
	}
	.row input { min-width: 0; }
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
	.tmpl-toggle {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		text-align: left;
		background: var(--bg);
		border: 1px solid var(--line);
		border-radius: 12px;
		padding: 0.85rem 1rem;
		cursor: pointer;
		font-family: inherit;
		transition:
			border-color 0.15s ease,
			background 0.15s ease;
	}
	.tmpl-toggle:hover {
		border-color: var(--accent);
		background: var(--accent-soft);
	}
	.tmpl-toggle.compact { padding: 0.6rem 0.85rem; border-radius: 10px; }
	.tmpl-toggle-left {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		min-width: 0;
	}
	.tmpl-toggle-icon {
		flex: none;
		width: 30px;
		height: 30px;
		border-radius: 8px;
		display: grid;
		place-items: center;
		background: var(--accent);
		color: #fff;
	}
	.tmpl-toggle-text {
		display: flex;
		align-items: baseline;
		gap: 0.45rem;
		min-width: 0;
		flex-wrap: wrap;
	}
	.tmpl-toggle-text strong {
		font-size: 13px;
		color: var(--ink);
		line-height: 1.2;
	}
	.tmpl-toggle-text > span {
		font-size: 11px;
		color: var(--ink-3);
		line-height: 1;
		display: inline-flex;
		gap: 0.25rem;
	}
	.tmpl-toggle-text code {
		background: var(--card);
		border: 1px solid var(--line);
		padding: 0.05em 0.3em;
		border-radius: 4px;
		font-size: 10px;
		color: var(--ink-2);
	}
	.tmpl-toggle-right {
		flex: none;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		color: var(--accent-strong);
		font-size: 12px;
		font-weight: 600;
	}
	.tmpl-toggle-action {
		white-space: nowrap;
	}
	.chev {
		transition: transform 0.2s ease;
	}
	.chev.open {
		transform: rotate(180deg);
	}
	.tmpl-collapsed.compact {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		background: var(--card);
		border: 1px solid var(--line-soft);
		border-radius: 10px;
		padding: 0.5rem 0.75rem;
		min-width: 0;
		overflow: hidden;
	}
	.tmpl-collapsed-preview {
		flex: 1;
		min-width: 0;
		font-size: 12px;
		color: var(--ink-2);
		line-height: 1.4;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.tmpl-collapsed.compact .badge {
		flex: none;
		white-space: nowrap;
	}
	.badge.sm {
		font-size: 10px;
		padding: 0.1em 0.5em;
	}
	.template-box {
		background: var(--bg);
		border: 1px solid var(--line);
		border-radius: 12px;
		padding: 1rem;
		display: grid;
		gap: 0.6rem;
	}
	.modal {
		position: fixed;
		inset: 0;
		z-index: 60;
		display: grid;
		place-items: center;
		padding: 1rem;
	}
	.modal-backdrop {
		position: absolute;
		inset: 0;
		border: 0;
		background: rgba(15, 23, 42, 0.55);
		backdrop-filter: blur(4px);
		cursor: pointer;
	}
	.modal-card {
		position: relative;
		width: min(100%, 560px);
		max-height: min(92vh, 720px);
		overflow: auto;
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 16px;
		box-shadow: var(--shadow-lg);
		padding: 1.1rem;
		display: grid;
		gap: 0.75rem;
		z-index: 1;
	}
	.modal-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}
	.modal-head h3 {
		margin: 0;
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		font-size: 15px;
		font-weight: 700;
		color: var(--ink);
	}
	.modal-desc {
		margin: 0;
		font-size: 12.5px;
		color: var(--ink-3);
	}
	.modal-desc code {
		background: var(--bg);
		border: 1px solid var(--line);
		padding: 0.05em 0.3em;
		border-radius: 4px;
		font-size: 10px;
	}
	.tmpl-textarea textarea {
		min-height: 180px;
	}
	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		flex-wrap: wrap;
		padding-top: 0.2rem;
		border-top: 1px solid var(--line-soft);
	}
	.tmpl-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.8rem;
		flex-wrap: wrap;
	}
	.tmpl-label { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-3); }
	.tmpl-chips { display: flex; gap: 0.4rem; flex-wrap: wrap; }
	.chip-btn {
		display: inline-flex; align-items: center; gap: 0.35em;
		border: 1px solid var(--line); background: var(--card); color: var(--ink-2);
		border-radius: 999px; padding: 0.32em 0.75em; font-size: 12px; font-family: inherit; cursor: pointer;
	}
	.chip-btn span { font-family: ui-monospace, monospace; font-weight: 600; }
	.chip-btn.on { background: var(--accent-soft); color: var(--accent-strong); border-color: #bfdbfe; }
	.chip-btn:hover { border-color: #cbd5e1; }
	.tmpl-status { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; }
	.badge { display: inline-flex; align-items: center; gap: 0.35em; font-size: 11px; font-weight: 600; border-radius: 999px; padding: 0.25em 0.6em; border: 1px solid var(--line); background: var(--card); color: var(--ink-2); }
	.badge.ok { background: var(--ok-bg); color: var(--ok); border-color: #a7f3d0; }
	.badge.warn { background: var(--warn-bg); color: var(--warn); border-color: #fde68a; }
	.badge.err { background: var(--danger-bg); color: var(--danger); border-color: #fecaca; }
	.badge .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
	.hint { font-size: 11px; color: var(--ink-3); }
	.hint.ok { color: var(--ok); }
	.hint.saving { color: var(--ink-2); }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
	.tmpl-preview { background: var(--card); border: 1px solid var(--line-soft); border-radius: 10px; padding: 0.7rem 0.85rem; }
	.tmpl-preview-head { font-size: 11px; font-weight: 700; color: var(--ink-3); letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 0.4rem; }
	.tmpl-preview-body { margin: 0; white-space: pre-wrap; word-break: break-word; font-family: inherit; font-size: 13px; color: var(--ink-2); line-height: 1.6; }
	.tmpl-actions { display: flex; gap: 0.5rem; justify-content: flex-end; flex-wrap: wrap; }
	.btn-subtle {
		background: transparent; border: 0; color: var(--ink-3); font-size: 12px; font-family: inherit; cursor: pointer;
		display: inline-flex; align-items: center; gap: 0.3em;
	}
	.btn-subtle:hover { color: var(--ink-2); }
	.alert.warn { color: var(--warn); background: var(--warn-bg); border: 1px solid #fde68a; }
	.tmpl-notice {
		display: flex;
		align-items: flex-start;
		gap: 0.6em;
		border-radius: 10px;
		padding: 0.7em 0.85em;
		font-size: 12.5px;
		line-height: 1.65;
		text-align: left;
	}
	.tmpl-notice.warn {
		color: #92400e;
		background: #fffbeb;
		border: 1px solid #fde68a;
	}
	.tmpl-notice-icon { flex: none; margin-top: 0.15em; color: var(--warn); }
	.tmpl-notice-text { flex: 1; min-width: 0; }
	.tmpl-notice-text code {
		background: #fff;
		border: 1px solid #fde68a;
		padding: 0.08em 0.35em;
		border-radius: 5px;
		font-size: 11px;
		font-family: ui-monospace, monospace;
		color: #92400e;
		white-space: nowrap;
	}
	.shell.dark .tmpl-notice.warn {
		background: #2b2007;
		border-color: #7a5a12;
		color: #fde68a;
	}
	.shell.dark .tmpl-notice-text code {
		background: #1e293b;
		border-color: #7a5a12;
		color: #fde68a;
	}

	/* ===== Filter bar ===== */
	.filter-bar {
		display: grid;
		gap: 0.7rem;
		margin-bottom: 1rem;
	}
	.filter-left {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-wrap: wrap;
		min-width: 0;
	}
	.filter-left .tabs { align-items: center; }
	.filter-left .tabs button,
	.filter-left .btn {
		height: 32px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}
	.filter-bar .search-box { width: 100%; }
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
	.bulk-spacer { flex: 1 1 auto; min-width: 0.5rem; }

	/* ===== List ===== */
	.list {
		display: grid;
		gap: 0.6rem;
	}
	.item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
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
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
	}
	.name-row {
		display: flex;
		align-items: center;
		gap: 0.55em;
		min-width: 0;
		flex: 1;
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
		font-size: 13px;
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
		align-items: center;
		gap: 0.35rem;
		flex: none;
	}
	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.8rem;
		margin-top: 0.8rem;
	}
	.page-btn {
		border: 1px solid var(--accent);
		background: var(--accent);
		color: #fff;
		border-radius: 999px;
		padding: 0.4em 0.9em;
		font-size: 12px;
		font-family: inherit;
		cursor: pointer;
		box-shadow: 0 1px 2px rgba(37, 99, 235, 0.2);
		transition: background 0.15s ease, opacity 0.15s ease;
	}
	.page-btn:hover:not(:disabled) { background: var(--accent-strong); border-color: var(--accent-strong); }
	.page-btn:disabled { opacity: 0.45; cursor: default; background: var(--card); color: var(--ink-3); border-color: var(--line); box-shadow: none; }
	.page-info {
		font-size: 11px;
		font-weight: 600;
		color: var(--accent-strong);
		background: var(--accent-soft);
		border: 1px solid #bfdbfe;
		border-radius: 999px;
		padding: 0.25em 0.7em;
	}
	.shell.dark .page-info { background: var(--accent-soft); border-color: #1e3a5f; }

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

	/* ===== Dark mode ===== */
	.shell.dark {
		--bg: #0f172a;
		--card: #1e293b;
		--line: #334155;
		--line-soft: #283548;
		--ink: #e2e8f0;
		--ink-2: #94a3b8;
		--ink-3: #64748b;
		--accent: #3b82f6;
		--accent-strong: #60a5fa;
		--accent-soft: #17294d;
		--ok: #4ade80;
		--ok-bg: #0d2a1c;
		--warn: #fbbf24;
		--warn-bg: #2b2007;
		--danger: #f87171;
		--danger-bg: #331118;
		--shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.35);
		--shadow-lg: 0 16px 40px rgba(0, 0, 0, 0.55);
		color-scheme: dark;
	}
	.shell.dark input,
	.shell.dark textarea,
	.shell.dark select,
	.shell.dark .search-box input,
	.shell.dark .template-box textarea {
		background: #0f1f39;
		color: var(--ink);
		border-color: var(--line);
	}
	.shell.dark input::placeholder,
	.shell.dark textarea::placeholder,
	.shell.dark .search-box input::placeholder,
	.shell.dark .template-box textarea::placeholder {
		color: var(--ink-3);
	}
	.shell.dark .card,
	.shell.dark .item,
	.shell.dark .bulk-bar,
	.shell.dark .template-box,
	.shell.dark .empty {
		background: var(--card);
		border-color: var(--line);
	}
	.shell.dark .item:hover {
		border-color: #475569;
	}
	.shell.dark .item.is-sent {
		background: #16213a;
	}
	.shell.dark .btn-ghost {
		background: #0f1f39;
		border-color: var(--line);
		color: var(--ink-2);
	}
	.shell.dark .btn-ghost:hover {
		background: #233047;
		border-color: #475569;
		color: var(--ink);
	}
	.shell.dark .icon-btn,
	.shell.dark .tabs button {
		background: #0f1f39;
		border-color: var(--line);
		color: var(--ink-2);
	}
	.shell.dark .tabs button.active {
		background: var(--accent);
		color: #fff;
		border-color: transparent;
	}
	.shell.dark .topbar {
		background: var(--card);
		border-color: var(--line);
	}
	.shell.dark .pill.ok {
		border-color: #1c6b46;
	}
	.shell.dark .icon-btn.wa {
		background: var(--ok-bg);
		border-color: #1c6b46;
	}
	.shell.dark .kpi {
		background: var(--card);
		border-color: var(--line);
	}
	.shell.dark .link:hover {
		color: var(--accent-strong);
	}
	.shell.dark .pin-card,
	.shell.dark .empty {
		border-color: var(--line);
	}
	.shell.dark input[type='password']::-webkit-credentials-auto-fill-button {
		filter: invert(0.7);
	}

	/* ===== Responsive ===== */
	@media (max-width: 760px) {
		.f-row {
			grid-template-columns: 1fr;
		}
		.filter-bar {
			grid-template-columns: 1fr;
		}
		.main {
			padding: 1rem 0.85rem 3rem;
		}
		.item { padding: 0.7rem 0.75rem; gap: 0.6rem; }
		.info strong { font-size: 12.5px; }
	}
	@media (max-width: 640px) {
		.kpis {
			display: flex;
			flex-wrap: nowrap;
			gap: 0.5rem;
			overflow-x: auto;
			padding-bottom: 0.2rem;
			justify-content: flex-start;
			scrollbar-width: none;
		}
		.kpis::-webkit-scrollbar { display: none; }
		.kpi {
			flex: 0 0 auto;
			padding: 0.5rem 0.75rem 0.5rem 0.55rem;
			gap: 0.5rem;
			border-radius: 999px;
		}
		.kpi-ic { width: 28px; height: 28px; border-radius: 50%; }
		.kpi strong { font-size: 15px; display: inline; }
		.kpi span { font-size: 10.5px; }
		.kpi > div { display: inline-flex; align-items: baseline; gap: 0.3rem; }
		.item { padding: 0.6rem 0.65rem; gap: 0.5rem; }
		.li-avatar { width: 22px; height: 22px; font-size: 11px; }
		.name-row { gap: 0.4em; }
		.info strong { white-space: normal; line-height: 1.3; word-break: break-word; }
		.link { font-size: 10.5px; }
		.actions { gap: 0.3rem; }
		.icon-btn { width: 30px; height: 30px; border-radius: 8px; }
	}
</style>