<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { templateMeta, DEFAULT_TEMPLATE } from '$lib/layouts/meta';
	import {
		LogOut,
		Plus,
		Trash2,
		Edit3,
		Copy,
		Check,
		ExternalLink,
		Upload,
		Users,
		MessageCircle,
		LayoutDashboard,
		FileText,
		Menu,
		X,
		Image as ImageIcon,
		Music,
		MapPin,
		Link2,
		Palette,
		Search,
		Send,
		ChevronDown,
		PanelLeftClose,
		PanelLeftOpen,
		Download,
		Moon,
		Sun
	} from 'lucide-svelte';

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
	let tab = $state<'overview' | 'tamu' | 'ucapan' | 'foto' | 'konten' | 'export'>('overview');
	let detailGuests = $state<GuestRow[]>([]);
	let detailWishes = $state<WishRow[]>([]);
	let detailLoading = $state(false);
	let uploadBusy = $state(false);
	let uploadMsg = $state('');
	let exportType = $state<'tamu' | 'ucapan'>('tamu');
	let selGallery = $state<Set<string>>(new Set());
	let picker = $state<HTMLInputElement | null>(null);
	let pendingFiles = $state<File[]>([]);
	let pendingPreviews = $state<string[]>([]);

	// Layout state
	let sidebarOpen = $state(false);
	let sidebarCollapsed = $state(false);
	let userMenu = $state(false);
	let searchQ = $state('');
	let statusF = $state<'all' | 'active' | 'draft' | 'expired'>('all');

	let toast = $state<{ msg: string; type: 'ok' | 'err' } | null>(null);
	let toastTimer: ReturnType<typeof setTimeout> | null = null;
	function notify(msg: string, type: 'ok' | 'err' = 'ok') {
		toast = { msg, type };
		if (toastTimer) clearTimeout(toastTimer);
		toastTimer = setTimeout(() => (toast = null), 2800);
	}

	const tabLabels: Record<typeof tab, string> = {
		overview: 'Ringkasan',
		tamu: 'Tamu',
		ucapan: 'Ucapan',
		foto: 'Foto',
		konten: 'Konten',
		export: 'Export'
	};

	function templateLabel(id: string): string {
		return templateMeta.find((t) => t.id === id)?.label ?? id;
	}
	function initials(a: string, b: string): string {
		return ((a || '?')[0] + (b || '?')[0]).toUpperCase();
	}
	function formatDate(v: string | null): string {
		if (!v) return '—';
		const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
		const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(v);
		if (Number.isNaN(d.getTime())) return v;
		return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	const counts = $derived({
		all: items.length,
		active: items.filter((i) => i.status === 'active').length,
		draft: items.filter((i) => i.status === 'draft').length,
		expired: items.filter((i) => i.status === 'expired').length
	});

	const filteredItems = $derived(
		items.filter((it) => {
			const q = searchQ.trim().toLowerCase();
			const matchQ =
				!q ||
				it.subdomain.toLowerCase().includes(q) ||
				`${it.namaPihak1} ${it.namaPihak2}`.toLowerCase().includes(q);
			const matchS = statusF === 'all' || it.status === statusF;
			return matchQ && matchS;
		})
	);

	function coverOf(it: InvitationItem): string | null {
		const dj = (it.dataJson ?? {}) as Record<string, unknown>;
		const ph = (dj.photos as Record<string, string> | undefined) ?? {};
		if (ph.cover?.trim()) return ph.cover.trim();
		if (ph.hero?.trim()) return ph.hero.trim();
		const gal = Array.isArray(dj.gallery) ? (dj.gallery as string[]) : [];
		if (gal.length > 0) return gal[0];
		return null;
	}

	function toggleRail() {
		sidebarCollapsed = !sidebarCollapsed;
		try {
			localStorage.setItem('admin_rail', sidebarCollapsed ? '1' : '0');
		} catch {}
	}



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

	let dark = $state(false);
	function toggleDark() {
		dark = !dark;
		try {
			localStorage.setItem('admin_dark', dark ? '1' : '0');
		} catch {}
	}

	onMount(() => {
		try {
			if (localStorage.getItem('admin_rail') === '1') sidebarCollapsed = true;
			const saved = localStorage.getItem('admin_dark');
			dark = saved ? saved === '1' : window.matchMedia('(prefers-color-scheme: dark)').matches;
		} catch {}
		load();
	});

	function openCreate() {
		userMenu = false;
		editing = null;
		formSubdomain = '';
		formPihak1 = '';
		formPihak2 = '';
		formTanggal = '';
		formStatus = 'draft';
		formTemplate = DEFAULT_TEMPLATE;
		formPin = Math.floor(100000 + Math.random() * 900000).toString();
		formErr = '';
		showForm = true;
	}

	function openEdit(it: InvitationItem) {
		userMenu = false;
		editing = it.subdomain;
		formSubdomain = it.subdomain;
		formPihak1 = it.namaPihak1;
		formPihak2 = it.namaPihak2;
		formTanggal = it.tanggalAcara ?? '';
		formStatus = it.status;
		formTemplate = it.template || DEFAULT_TEMPLATE;
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
						template: formTemplate,
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
				notify('Perubahan disimpan.');
				await load();
			} else {
				const sd = formSubdomain.trim().toLowerCase();
				if (!sd) {
					formErr = 'Link undangan wajib.';
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
						template: formTemplate,
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
				notify('Undangan berhasil dibuat.');
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
			notify(j?.message ?? 'Gagal menghapus.', 'err');
			return;
		}
		if (selected === sd) closeDetail();
		notify('Undangan dihapus.');
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

	function kelolaUrl(): string {
		return `${location.origin}/${selected}/kelola?pin=${encodeURIComponent(cur?.accessPin ?? '')}`;
	}

	function kirimLinkKelola() {
		const nama = [cur?.namaPihak1, cur?.namaPihak2].filter(Boolean).join(' & ');
		const url = kelolaUrl();
		const pin = cur?.accessPin?.trim() ?? '';
		const msg =
			`Halo ${nama || 'konsumen'} 👋\n\n` +
			`Berikut link untuk mengelola daftar tamu undangan Anda:\n${url}\n\n` +
			(pin ? `PIN pengelola: ${pin}\n` : '') +
			`Gunakan PIN di halaman kelola, dan jangan bagikan PIN ke tamu. Terima kasih 🙏`;
		window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
	}

	function closeDetail() {
		selected = null;
		tab = 'overview';
		sidebarOpen = false;
		userMenu = false;
	}

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
	let kontenMusicUploading = $state(false);
	let kontenLivestream = $state('');
	let kontenStoryIntro = $state('');
	let kontenStoryChapters = $state<{ title: string; text: string }[]>([]);
	let kontenGiftNote = $state('');
	let kontenVenue = $state({ name: '', address: '', maps_url: '' });
	let kontenSocial = $state({ whatsapp: '', instagram: '' });
	let kontenWishes = $state({ minName: 2, minMessage: 2, note: '' });
	let kontenMusicYt = $state('');
	let kontenMusicStart = $state<string | number | null>('');

	let showForm = $state(false);
	let editing = $state<string | null>(null);
	let formSubdomain = $state('');
	let formPihak1 = $state('');
	let formPihak2 = $state('');
	let formTanggal = $state('');
	let formStatus = $state('draft');
	let formTemplate = $state(DEFAULT_TEMPLATE);
	let formPin = $state('');
	let formSaving = $state(false);
	let formErr = $state('');

	let cur = $derived(items.find((x) => x.subdomain === selected));

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
		const mDj = (dj.music as Record<string, unknown> | undefined) ?? null;
		kontenMusic = (dj.music_url as string) ?? (typeof mDj?.src === 'string' ? mDj.src : '');
		kontenMusicYt = (dj.music_youtube_id as string) ?? (typeof mDj?.youtubeId === 'string' ? mDj.youtubeId : '');
		const musicStartRaw = (dj.music_start_seconds as number | string | undefined) ?? (typeof mDj?.startSeconds === 'number' ? mDj.startSeconds : null);
		kontenMusicStart = musicStartRaw == null ? '' : String(musicStartRaw);
		kontenGiftNote = (dj.gift_note as string) ?? ((dj.gift as Record<string, string> | undefined)?.note ?? '');
		const vn = (dj.venue as Record<string, string> | undefined) ?? null;
		kontenVenue = { name: vn?.name ?? '', address: vn?.address ?? '', maps_url: vn?.maps_url ?? vn?.mapsUrl ?? '' };
		const sc = (dj.social as Record<string, string> | undefined) ?? null;
		kontenSocial = { whatsapp: sc?.whatsapp ?? '', instagram: sc?.instagram ?? '' };
		const ws = (dj.wishes as Record<string, unknown> | undefined) ?? null;
		kontenWishes = { minName: typeof ws?.minName === 'number' ? ws.minName : 2, minMessage: typeof ws?.minMessage === 'number' ? ws.minMessage : 2, note: typeof ws?.note === 'string' ? ws.note : '' };
		kontenLivestream = (dj.livestream_url as string) ?? '';
		kontenStoryIntro = (dj.love_story_intro as string) ?? '';
		const ls = Array.isArray(dj.love_story) ? (dj.love_story as { title: string; text: string }[]) : [];
		kontenStoryChapters = ls.map((c) => ({ title: c.title ?? '', text: c.text ?? '' }));
		kontenMsg = '';
	}

	async function openDetail(sd: string, t: typeof tab = 'overview') {
		selected = sd;
		tab = t;
		sidebarOpen = false;
		userMenu = false;
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
			const curD = (it?.dataJson ?? {}) as Record<string, unknown>;
			const next: Record<string, unknown> = {
				...curD,
				theme: { primary: kontenThemePrimary, secondary: kontenThemeSecondary },
				events: kontenEvents.filter((e) => e.name.trim() || e.date.trim()),
				gifts: kontenGifts.filter((g) => g.number.trim()),
				couple: { bride: { ...kontenBride }, groom: { ...kontenGroom } },
				verse: kontenVerseOff ? null : { arabic: kontenVerse.arabic, translation: kontenVerse.translation, source: kontenVerse.source },
				music_url: kontenMusic.trim() || null,
				music_youtube_id: kontenMusicYt.trim() || null,
				music_start_seconds:
					kontenMusicStart === '' || kontenMusicStart == null || Number.isNaN(Number(kontenMusicStart))
						? null
						: Number(kontenMusicStart),
				gift_note: kontenGiftNote.trim() || null,
				venue:
					kontenVenue.name.trim() || kontenVenue.address.trim() || kontenVenue.maps_url.trim()
						? { name: kontenVenue.name.trim(), address: kontenVenue.address.trim(), maps_url: kontenVenue.maps_url.trim() }
						: null,
				social:
					kontenSocial.whatsapp.trim() || kontenSocial.instagram.trim()
						? { whatsapp: kontenSocial.whatsapp.trim(), instagram: kontenSocial.instagram.trim() }
						: null,
				wishes: {
					minName: kontenWishes.minName,
					minMessage: kontenWishes.minMessage,
					note: kontenWishes.note.trim()
				},
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
			if (!res.ok) { kontenMsg = j?.message ?? 'Gagal menyimpan.'; notify(kontenMsg, 'err'); return; }
			if (it) it.dataJson = j.item.dataJson ?? next;
			kontenMsg = 'Tersimpan.';
			notify('Konten tersimpan.');
		} catch {
			kontenMsg = 'Gagal menyimpan.';
			notify('Gagal menyimpan.', 'err');
		} finally {
			kontenSaving = false;
		}
	}

	async function deleteWish(id: number) {
		if (!selected) return;
		if (!confirm('Hapus ucapan ini?')) return;
		const res = await fetch(`/api/admin/wishes?slug=${encodeURIComponent(selected)}&id=${id}`, { method: 'DELETE' });
		if (!res.ok) {
			notify('Gagal menghapus.', 'err');
			return;
		}
		detailWishes = detailWishes.filter((w) => w.id !== id);
		notify('Ucapan dihapus.');
	}

	function currentGallery(): string[] {
		const it = items.find((x) => x.subdomain === selected);
		const dj = (it?.dataJson ?? {}) as Record<string, unknown>;
		return Array.isArray(dj.gallery) ? (dj.gallery as string[]) : [];
	}
	function currentPhotos(): Record<string, string> {
		const dj = (cur?.dataJson ?? {}) as Record<string, unknown>;
		return (dj.photos as Record<string, string> | undefined) ?? {};
	}
	function rolesOf(url: string): string[] {
		const ph = currentPhotos();
		const roles: string[] = [];
		if (ph.hero === url) roles.push('Hero');
		if (ph.bride === url) roles.push('Bride');
		if (ph.groom === url) roles.push('Groom');
		if (ph.cover === url) roles.push('Sampul');
		return roles;
	}
	async function assignPhoto(kind: 'hero' | 'bride' | 'groom' | 'cover', url: string) {
		if (!selected) return;
		uploadBusy = true;
		uploadMsg = '';
		try {
			const it = items.find((x) => x.subdomain === selected);
			const dj = (it?.dataJson ?? {}) as Record<string, unknown>;
			const res = await fetch(`/api/admin/invitations?subdomain=${encodeURIComponent(selected)}`, {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ dataJson: { ...dj, photos: { ...currentPhotos(), [kind]: url } } })
			});
			const j = await res.json().catch(() => null);
			if (!res.ok) {
				uploadMsg = j?.message ?? 'Gagal mengatur foto.';
				notify(uploadMsg, 'err');
				return;
			}
			if (it && j?.item) it.dataJson = j.item.dataJson;
			uploadMsg = `Dijadikan ${kind === 'cover' ? 'sampul' : kind}.`;
			notify(uploadMsg);
		} catch {
			notify('Gagal mengatur foto.', 'err');
		} finally {
			uploadBusy = false;
		}
	}
	async function deleteGalleryUrl(url: string) {
		if (!selected) return;
		if (!confirm('Hapus foto ini dari galeri?')) return;
		const res = await fetch(`/api/admin/upload?slug=${encodeURIComponent(selected)}&url=${encodeURIComponent(url)}`, { method: 'DELETE' });
		const j = await res.json().catch(() => null);
		if (!res.ok) { uploadMsg = j?.message ?? 'Gagal menghapus.'; notify(uploadMsg, 'err'); return; }
		const it = items.find((x) => x.subdomain === selected);
		if (it) {
			const dj = (it.dataJson ?? {}) as Record<string, unknown>;
			const curPh = (dj.photos as Record<string, string | null> | undefined) ?? {};
			const nextPh = (j.photos as Record<string, string | null> | undefined) ?? curPh;
			it.dataJson = { ...dj, gallery: j.gallery ?? currentGallery().filter((u) => u !== url), photos: nextPh };
		}
		const n = new Set(selGallery);
		n.delete(url);
		selGallery = n;
		uploadMsg = 'Foto dihapus.';
		notify('Foto dihapus.');
	}
	function toggleGallerySel(url: string) {
		const n = new Set(selGallery);
		if (n.has(url)) n.delete(url);
		else n.add(url);
		selGallery = n;
	}
	function selectAllGallery() {
		selGallery = new Set(currentGallery());
	}
	function clearGallerySel() {
		selGallery = new Set();
	}
	async function deleteSelectedGallery() {
		if (!selected || selGallery.size === 0) return;
		if (!confirm(`Hapus ${selGallery.size} foto dari galeri?`)) return;
		uploadBusy = true;
		uploadMsg = '';
		try {
			let last: string[] | null = null;
			let lastPhotos: Record<string, string | null> | null = null;
			let okCount = 0;
			for (const u of selGallery) {
				const res = await fetch(`/api/admin/upload?slug=${encodeURIComponent(selected)}&url=${encodeURIComponent(u)}`, { method: 'DELETE' });
				const j = await res.json().catch(() => null);
				if (!res.ok) { notify(j?.message ?? 'Gagal menghapus sebagian.', 'err'); continue; }
				last = j?.gallery ?? last;
				if (j?.photos) lastPhotos = j.photos;
				okCount++;
			}
			const it = items.find((x) => x.subdomain === selected);
			if (it) {
				const dj = (it.dataJson ?? {}) as Record<string, unknown>;
				it.dataJson = { ...dj, gallery: last ?? currentGallery().filter((u) => !selGallery.has(u)), ...(lastPhotos ? { photos: lastPhotos } : {}) };
			}
			if (okCount > 0) {
				uploadMsg = `${okCount} foto dihapus.`;
				notify(`${okCount} foto dihapus.`);
			}
			selGallery = new Set();
		} catch {
			notify('Gagal menghapus.', 'err');
		} finally {
			uploadBusy = false;
		}
	}
	async function moveGallery(idx: number, dir: -1 | 1) {
		if (!selected) return;
		const arr = [...currentGallery()];
		const j = idx + dir;
		if (j < 0 || j >= arr.length) return;
		[arr[idx], arr[j]] = [arr[j], arr[idx]];
		const res = await fetch(`/api/admin/upload?slug=${encodeURIComponent(selected)}&reorder=${encodeURIComponent(JSON.stringify(arr))}`, { method: 'DELETE' });
		const rj = await res.json().catch(() => null);
		if (!res.ok) { uploadMsg = rj?.message ?? 'Gagal reorder.'; notify(uploadMsg, 'err'); return; }
		const it = items.find((x) => x.subdomain === selected);
		if (it) it.dataJson = { ...(it.dataJson ?? {}), gallery: rj.gallery ?? arr };
	}

	function startPick() {
		if (picker) {
			picker.multiple = true;
			picker.accept = 'image/*';
			picker.value = '';
			picker.click();
		}
	}
	function onPickChange() {
		if (!picker?.files?.length) return;
		const files = Array.from(picker.files);
		pendingFiles = files;
		pendingPreviews = files.map((f) => URL.createObjectURL(f));
	}
	function clearPending() {
		pendingPreviews.forEach((u) => URL.revokeObjectURL(u));
		pendingFiles = [];
		pendingPreviews = [];
	}
	async function confirmUpload() {
		if (!selected || pendingFiles.length === 0) return;
		uploadBusy = true;
		uploadMsg = '';
		try {
			const fd = new FormData();
			for (const f of pendingFiles) fd.append('files', f);
			const res = await fetch(`/api/admin/upload?slug=${encodeURIComponent(selected)}`, { method: 'POST', body: fd });
			const j = await res.json().catch(() => null);
			if (!res.ok) {
				uploadMsg = j?.message ?? 'Upload gagal.';
				notify(uploadMsg, 'err');
				return;
			}
			const urls: string[] = j.urls ?? [];
			uploadMsg = `${urls.length} foto terupload — pilih perannya di bawah.`;
			notify(`${urls.length} foto terupload.`);
			const it = items.find((x) => x.subdomain === selected);
			if (it && j.gallery) {
				const dj = (it.dataJson ?? {}) as Record<string, unknown>;
				it.dataJson = { ...dj, gallery: j.gallery };
			}
			selGallery = new Set();
			clearPending();
		} catch {
			uploadMsg = 'Gagal upload.';
			notify('Gagal upload.', 'err');
		} finally {
			uploadBusy = false;
		}
	}

	function exportCsv() {
		if (!selected) return;
		const rows = exportType === 'tamu' ? detailGuests : detailWishes;
		if (rows.length === 0) {
			notify('Tidak ada data untuk diexport.', 'err');
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
		if (!res.ok) { notify('Export gagal.', 'err'); return; }
		const blob = await res.blob();
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = `${selected}-${exportType}.${fmt}`;
		a.click();
	}
</script>

<svelte:head><title>Panel Admin — Undangan</title></svelte:head>

<div class="shell" class:dark={dark}>
	<header class="topbar">
		<div class="topbar-left">
			<button class="burger" onclick={() => (sidebarOpen = !sidebarOpen)} aria-label="Buka menu"><Menu size={20} /></button>
			<button class="collapse-btn" onclick={toggleRail} aria-label="Ciutkan/perluas sidebar" title={sidebarCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}>
				{#if sidebarCollapsed}<PanelLeftOpen size={18} />{:else}<PanelLeftClose size={18} />{/if}
			</button>
			<div class="brand">
				<div class="logo-mark">
					<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
						<path d="M7 3h4v4.5M17 3h-4v4.5" />
						<circle cx="12" cy="13" r="6.5" />
						<path d="M12 10.5v3l2 1.4" />
					</svg>
				</div>
				<span class="brand-name">Undangan<em>Panel Admin</em></span>
			</div>
		</div>
		<div class="topbar-right">
			<a class="btn btn-ghost sm top-site" href="/demo" target="_blank" rel="noopener" title="Lihat demo undangan"><ExternalLink size={15} /> <span>Demo</span></a>
			<button class="btn btn-primary sm top-create" onclick={openCreate}><Plus size={15} /> <span>Buat Undangan</span></button>
			<button class="btn btn-ghost sm theme-btn" onclick={toggleDark} title={dark ? 'Mode terang' : 'Mode gelap'} aria-label="Ganti tema">
				{#if dark}<Sun size={15} />{:else}<Moon size={15} />{/if}
			</button>
			<div class="um-wrap">
				<button class="user-chip" onclick={() => (userMenu = !userMenu)} aria-haspopup="true" aria-expanded={userMenu}>
					<div class="avatar">AD</div>
					<div class="user-meta">
						<strong>Administrator</strong>
						<span>Superuser</span>
					</div>						<span class:chev-open={userMenu}><ChevronDown size={14} class="chev" /></span>
				</button>
				{#if userMenu}
					<button class="um-backdrop" aria-label="Tutup" onclick={() => (userMenu = false)}></button>
					<div class="user-menu">
						<div class="um-head">
							<div class="avatar lg">AD</div>
							<div>
								<strong>Administrator</strong>
								<span>Panel Admin Undangan</span>
							</div>
						</div>
						<button class="um-item danger" onclick={logout}><LogOut size={14} /> Keluar</button>
					</div>
				{/if}
			</div>
		</div>
	</header>

	<div class="body" class:rail={sidebarCollapsed}>
		{#if sidebarOpen}<button class="side-overlay" aria-label="Tutup menu" onclick={() => (sidebarOpen = false)}></button>{/if}

		<aside class="sidebar" class:open={sidebarOpen} class:rail={sidebarCollapsed}>
			<p class="side-label">Menu Utama</p>
			<nav class="side-nav">
				<button class:active={!selected} onclick={closeDetail} title="Kembali ke daftar undangan">
					<LayoutDashboard size={16} /><span class="nav-txt">Daftar Undangan</span>
				</button>
			</nav>

			{#if selected}
				<p class="side-label">Kelola Undangan</p>
				<div class="side-inv">
					<div class="side-inv-mono">{initials(cur?.namaPihak1 ?? '', cur?.namaPihak2 ?? '')}</div>
					<div class="side-inv-meta">
						<strong title={selected}>{selected}</strong>
						<span>{cur?.namaPihak1 || '?'} & {cur?.namaPihak2 || '?'}</span>
					</div>
				</div>
				<nav class="side-nav">
					<button class:active={tab === 'overview'} onclick={() => openDetail(selected!, 'overview')} title="Ringkasan undangan"><LayoutDashboard size={15} /><span class="nav-txt">Ringkasan</span></button>
					<button class:active={tab === 'tamu'} onclick={() => openDetail(selected!, 'tamu')} title="Daftar tamu undangan"><Users size={15} /><span class="nav-txt">Tamu</span>{#if detailGuests.length}<span class="count">{detailGuests.length}</span>{/if}</button>
					<button class:active={tab === 'ucapan'} onclick={() => openDetail(selected!, 'ucapan')} title="Daftar ucapan & doa"><MessageCircle size={15} /><span class="nav-txt">Ucapan</span>{#if detailWishes.length}<span class="count">{detailWishes.length}</span>{/if}</button>
					<button class:active={tab === 'foto'} onclick={() => { tab = 'foto'; sidebarOpen = false; }} title="Upload & atur foto"><ImageIcon size={15} /><span class="nav-txt">Foto</span></button>
					<button class:active={tab === 'konten'} onclick={() => { tab = 'konten'; sidebarOpen = false; }} title="Isi konten undangan: events, mempelai, gifts, ayat, love story, media"><FileText size={15} /><span class="nav-txt">Edit Konten</span></button>
					<button class:active={tab === 'export'} onclick={() => { tab = 'export'; sidebarOpen = false; }} title="Export data tamu & ucapan (CSV/Excel/PDF)"><Download size={15} /><span class="nav-txt">Export</span></button>
				</nav>
				<p class="side-label">Referensi</p>
				<nav class="side-nav">
					<a href={previewUrl(selected)} target="_blank" rel="noopener" title="Buka undangan publik"><ExternalLink size={15} /><span class="nav-txt">Lihat Undangan</span></a>
					<a href={`/${selected}/kelola?pin=${encodeURIComponent(cur?.accessPin ?? '')}`} target="_blank" rel="noopener" title="Panel kelola tamu"><Users size={15} /><span class="nav-txt">Kelola Tamu</span></a>
				</nav>
			{/if}

		</aside>

		<main class="main">
			<input bind:this={picker} type="file" accept="image/*" hidden onchange={onPickChange} />
			<nav class="crumb">
				<span class="crumb-cur">Undangan</span>
				{#if selected}
					<span class="crumb-sep">/</span>
					<button class="crumb-link" onclick={closeDetail}>{selected}</button>
					<span class="crumb-sep">/</span>
					<span class="crumb-cur">{tabLabels[tab]}</span>
				{:else}
					<span class="crumb-sep">/</span>
					<span class="crumb-cur">Daftar</span>
				{/if}
			</nav>

			{#if !selected}
				<header class="page-head">
					<div>
						<h1>Daftar Undangan</h1>
						<p>Kelola undangan, status, PIN tamu, foto, dan konten setiap undangan.</p>
					</div>
				</header>

				{#if loading}
					<div class="kpis">
						<div class="kpi sk"></div>
						<div class="kpi sk"></div>
						<div class="kpi sk"></div>
						<div class="kpi sk"></div>
					</div>
					<div class="card table-wrap">
						{#each [0, 1, 2, 3, 4] as i}
							<div class="sk-row"><div class="sk sk-b" style="width:38%"></div><div class="sk sk-b" style="width:26%"></div><div class="sk sk-b" style="width:16%"></div></div>
						{/each}
					</div>
				{:else}
					<div class="kpis">
						<div class="kpi">
							<div class="kpi-ic" style="--c:var(--accent);--bg:var(--accent-soft)"><FileText size={17} /></div>
							<div><strong>{counts.all}</strong><span>Total Undangan</span></div>
						</div>
						<div class="kpi">
							<div class="kpi-ic" style="--c:var(--ok);--bg:var(--ok-bg)"><Check size={17} /></div>
							<div><strong>{counts.active}</strong><span>Aktif</span></div>
						</div>
						<div class="kpi">
							<div class="kpi-ic" style="--c:var(--warn);--bg:var(--warn-bg)"><Edit3 size={17} /></div>
							<div><strong>{counts.draft}</strong><span>Draft</span></div>
						</div>
						<div class="kpi">
							<div class="kpi-ic" style="--c:var(--ink-3);--bg:var(--line-soft)"><Trash2 size={17} /></div>
							<div><strong>{counts.expired}</strong><span>Nonaktif</span></div>
						</div>
					</div>

					{#if err}
						<div class="alert err"><X size={15} /> {err}</div>
					{:else if items.length === 0}
						<div class="empty">
							<strong>Belum ada undangan</strong>
							<p>Buat undangan pertama dengan link mis. <code>budi-ani</code>.</p>
							<button class="btn btn-primary sm" onclick={openCreate}><Plus size={14} /> Buat Undangan</button>
						</div>
					{:else}
						<div class="toolbar">
							<div class="search-box">
								<Search size={14} class="s-ic" />
								<input type="text" placeholder="Cari link atau nama pasangan…" bind:value={searchQ} />
								{#if searchQ}<button class="s-clear" onclick={() => (searchQ = '')} aria-label="Bersihkan pencarian"><X size={13} /></button>{/if}
							</div>
							<div class="chips">
								<button class:active={statusF === 'all'} onclick={() => (statusF = 'all')}>Semua <b>{counts.all}</b></button>
								<button class:active={statusF === 'active'} onclick={() => (statusF = 'active')}>Aktif <b>{counts.active}</b></button>
								<button class:active={statusF === 'draft'} onclick={() => (statusF = 'draft')}>Draft <b>{counts.draft}</b></button>
								<button class:active={statusF === 'expired'} onclick={() => (statusF = 'expired')}>Nonaktif <b>{counts.expired}</b></button>
							</div>
						</div>

						{#if filteredItems.length === 0}
							<div class="empty">
								<strong>Tidak ada hasil</strong>
								<p>Tidak ada undangan yang cocok dengan pencarian atau filter.</p>
								<button class="btn btn-ghost sm" onclick={() => { searchQ = ''; statusF = 'all'; }}><X size={14} /> Reset Filter</button>
							</div>
						{:else}
							<div class="inv-grid">
								{#each filteredItems as it}
									{@const cover = coverOf(it)}
									<div class="inv-card" class:selected={selected === it.subdomain} role="button" tabindex="0" onclick={() => openDetail(it.subdomain)} onkeydown={(e) => e.key === 'Enter' && openDetail(it.subdomain)} aria-label={`Buka ${it.subdomain}`}>
										<div class="inv-cover">
											{#if cover}
												<img src={cover} alt={`Sampul ${it.subdomain}`} loading="lazy" />
											{:else}
												<div class="inv-cover-empty">{initials(it.namaPihak1, it.namaPihak2)}</div>
											{/if}
											<span class="pill inv-status" class:ok={it.status === 'active'} class:warn={it.status === 'draft'} class:muted-pill={it.status === 'expired'}><span class="dot"></span>{it.status}</span>
										</div>
										<div class="inv-body">
											<strong class="inv-name">{it.namaPihak1 || '—'} <i>&</i> {it.namaPihak2 || '—'}</strong>
											<span class="inv-sub"><code>{it.subdomain}</code> · <span class="tag">{templateLabel(it.template)}</span></span>
											<span class="inv-meta">{formatDate(it.tanggalAcara)} · PIN <code class="pin">{it.accessPin ?? '—'}</code></span>
										</div>
										<div class="inv-actions" role="group" aria-label="Aksi">
											<a class="btn-action" href={previewUrl(it.subdomain)} target="_blank" rel="noopener" onclick={(e) => e.stopPropagation()} title="Lihat undangan"><ExternalLink size={13} /></a>
											<button class="btn-action" onclick={(e) => { e.stopPropagation(); copy(`${location.origin}/${it.subdomain}`, it.subdomain); }} title="Salin link">{#if copied === it.subdomain}<Check size={13} />{:else}<Copy size={13} />{/if}</button>
											<button class="btn-action" onclick={(e) => { e.stopPropagation(); openEdit(it); }} title="Edit"><Edit3 size={13} /></button>
											<button class="btn-action danger" onclick={(e) => { e.stopPropagation(); del(it.subdomain); }} title="Hapus"><Trash2 size={13} /></button>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					{/if}
				{/if}
			{/if}

			{#if selected}
				<header class="detail-head card">
					<div class="dh-left">
						<div class="dh-mono">{initials(cur?.namaPihak1 ?? '', cur?.namaPihak2 ?? '')}</div>
						<div>
							<h1>{cur?.namaPihak1 || '—'} <i>&</i> {cur?.namaPihak2 || '—'}</h1>
							<p class="dh-sub">
								<code>{selected}</code>
								<span class="tag">{templateLabel(cur?.template ?? '')}</span>
								<span class="pill" class:ok={cur?.status === 'active'} class:warn={cur?.status === 'draft'}><span class="dot"></span>{cur?.status}</span>
							</p>
						</div>
					</div>
					<div class="dh-actions">
						<button class="btn btn-primary" onclick={() => (tab = 'konten')} title="Isi konten undangan: events, mempelai, gifts, ayat, love story, media"><FileText size={14} /> Edit Konten</button>
						<button class="btn btn-ghost" onclick={() => cur && openEdit(cur)}><Edit3 size={14} /> Pengaturan</button>
						<a class="btn btn-ghost" href={previewUrl(selected)} target="_blank" rel="noopener"><ExternalLink size={14} /> Lihat</a>
						<a class="btn btn-ghost" href={`/${selected}/kelola?pin=${encodeURIComponent(cur?.accessPin ?? '')}`} target="_blank" rel="noopener"><Users size={14} /> Kelola Tamu</a>
						<button class="btn btn-ghost" onclick={kirimLinkKelola} title="Buka WhatsApp dengan pesan berisi link kelola tamu untuk konsumen"><Send size={14} /> Kirim Link Kelola</button>
						<button class="icon-btn sm danger" onclick={() => del(selected!)} title="Hapus undangan"><Trash2 size={15} /></button>
					</div>
				</header>

				{#if detailLoading}
					<div class="card pad">
						{#each [0, 1, 2] as i}
							<div class="sk sk-b" style="width:100%;height:14px;margin-bottom:0.7rem"></div>
						{/each}
					</div>
				{:else if tab === 'overview'}
					<div class="ov-cards">
						<div class="ov-card"><strong>{detailGuests.length}</strong><span>Tamu</span></div>
						<div class="ov-card"><strong>{detailGuests.filter((g) => g.sent).length}</strong><span>Undangan Terkirim</span></div>
						<div class="ov-card"><strong>{detailWishes.length}</strong><span>Ucapan</span></div>
					</div>
				{:else if tab === 'export'}
					<div class="card pad">
						<h3 class="sec-title">Export Data <span class="count-pill">{exportType === 'tamu' ? detailGuests.length : detailWishes.length}</span></h3>
						<p class="hint">Unduh data <strong>tamu</strong> atau <strong>ucapan</strong> undangan <code>{selected}</code> dalam format CSV, Excel, atau PDF.</p>
						<div class="export-row">
							<select bind:value={exportType}>
								<option value="tamu">Data Tamu</option>
								<option value="ucapan">Data Ucapan</option>
							</select>
							<button class="btn btn-ghost" onclick={exportCsv}>CSV</button>
							<button class="btn btn-ghost" onclick={() => exportServer('xlsx')}>Excel</button>
							<button class="btn btn-ghost" onclick={() => exportServer('pdf')}>PDF</button>
						</div>
					</div>
				{:else if tab === 'tamu'}
					<div class="card pad list">
						<div class="list-head">
							<h3 class="sec-title">Daftar Tamu <span class="count-pill">{detailGuests.length}</span></h3>
						</div>
						{#if detailGuests.length === 0}
							<p class="muted empty-note">Belum ada tamu. Tambah lewat halaman <code>/{selected}/kelola</code>.</p>
						{:else}
							{#each detailGuests as g}
								<div class="list-item">
									<div class="li-left">
										<div class="li-avatar">{(g.name || '?')[0].toUpperCase()}</div>
										<span class="li-name">{g.name}</span>
									</div>
									<span class="pill" class:ok={g.sent}><span class="dot"></span>{g.sent ? 'Terkirim' : 'Belum'}</span>
								</div>
							{/each}
						{/if}
					</div>
				{:else if tab === 'ucapan'}
					<div class="card pad list">
						<div class="list-head">
							<h3 class="sec-title">Ucapan & Doa <span class="count-pill">{detailWishes.length}</span></h3>
						</div>
						{#if detailWishes.length === 0}
							<p class="muted empty-note">Belum ada ucapan dari tamu.</p>
						{:else}
							{#each detailWishes as w}
								<div class="wish-item">
									<div class="wish-top">
										<div class="li-left">
											<div class="li-avatar accent">{(w.name || '?')[0].toUpperCase()}</div>
											<span class="li-name"><strong>{w.name}</strong></span>
											<span class="pill" class:ok={w.attendance === 'hadir'} class:warn={w.attendance === 'ragu'}>{w.attendance}</span>
										</div>
										<button class="icon-btn sm danger" onclick={() => deleteWish(w.id)} title="Hapus ucapan"><Trash2 size={14} /></button>
									</div>
									<p class="wish-msg">{w.message}</p>
								</div>
							{/each}
						{/if}
					</div>
				{:else if tab === 'foto'}
					<div class="card pad upload">
						<h3 class="sec-title">Foto — Galeri & Peran <span class="count-pill">{currentGallery().length}</span></h3>
						<p class="hint">Satu pintu upload: semua foto masuk galeri. Hero / Bride / Groom / Sampul tinggal pilih dari galeri di bawah (boleh rangkap).</p>
						{#if currentGallery().length > 0}
							<div class="role-strip">
								{#each [['hero','Hero'],['bride','Bride'],['groom','Groom'],['cover','Sampul']] as [k,label]}
									{@const url = currentPhotos()[k]}
									<div class="role-card">
										<span class="role-label">{label}</span>
										{#if url}<img src={url} alt={label} loading="lazy" />{:else}<div class="role-empty">Belum dipilih</div>{/if}
									</div>
								{/each}
							</div>
						{/if}
						<div class="dropzone" class:has-pending={pendingFiles.length > 0}>
							{#if pendingFiles.length > 0}
								<div class="pv-grid">
									{#each pendingPreviews as pv, i}
										<div class="pv-cell">
											<img src={pv} alt={`Pratinjau ${i + 1}`} />
											<button class="icon-btn sm danger pv-del" onclick={() => { URL.revokeObjectURL(pendingPreviews[i]); pendingFiles = pendingFiles.filter((_, j) => j !== i); pendingPreviews = pendingPreviews.filter((_, j) => j !== i); }} title="Hapus dari pilihan"><Trash2 size={13} /></button>
										</div>
									{/each}
								</div>
								<p class="hint">Foto baru ({pendingFiles.length}) — belum disimpan.</p>
								<div class="slot-actions">
									<button class="btn btn-primary sm" onclick={confirmUpload} disabled={uploadBusy}>{uploadBusy ? 'Mengupload…' : `Simpan ${pendingFiles.length} foto`}</button>
									<button class="btn btn-ghost sm" onclick={clearPending} disabled={uploadBusy}>Batal</button>
								</div>
							{:else}
								<button class="btn btn-ghost" onclick={startPick} disabled={uploadBusy}><Upload size={14} /> Pilih Foto (max 12)</button>
								<span class="hint">JPG/PNG/WEBP, max 8MB per file, auto-kompresi 1600px</span>
							{/if}
						</div>
						{#if pendingFiles.length === 0 && currentGallery().length > 0}
							<div class="bulk-bar">
								<label class="bulk-check">
									<input type="checkbox" checked={selGallery.size === currentGallery().length && currentGallery().length > 0} onchange={selGallery.size === currentGallery().length ? clearGallerySel : selectAllGallery} />
									Pilih semua ({currentGallery().length})
								</label>
								{#if selGallery.size > 0}
									<span class="bulk-count">{selGallery.size} dipilih</span>
									<button class="btn btn-primary sm" onclick={deleteSelectedGallery} disabled={uploadBusy}>Hapus Terpilih ({selGallery.size})</button>
									<button class="btn btn-ghost sm" onclick={clearGallerySel}>Batal</button>
								{/if}
							</div>
							<div class="gallery-grid">
								{#each currentGallery() as url, i}
									{@const roles = rolesOf(url)}
									<div class="gcell" class:sel={selGallery.has(url)}>
										<label class="gsel" title="Pilih untuk hapus massal"><input type="checkbox" checked={selGallery.has(url)} onchange={() => toggleGallerySel(url)} /></label>
										<div class="badges">
											{#each roles as role}
												<span class="role-badge">{role}</span>
											{/each}
											{#if roles.length === 0}
												<span class="role-badge plain">Galeri</span>
											{/if}
										</div>
										<img src={url} alt={`Foto ${i + 1}`} loading="lazy" />
										<div class="role-actions">
											{#each [['hero','Hero'],['bride','Bride'],['groom','Groom'],['cover','Sampul']] as [k,label]}
												<button class="role-btn" class:active={currentPhotos()[k] === url} onclick={() => assignPhoto(k as 'hero'|'bride'|'groom'|'cover', url)} disabled={uploadBusy} title={currentPhotos()[k] === url ? `${label} ✓` : `Jadikan ${label}`}>{currentPhotos()[k] === url ? `✓ ${label}` : label}</button>
											{/each}
										</div>
										<div class="gact">
											<button class="icon-btn sm" onclick={() => moveGallery(i, -1)} disabled={i === 0} title="Naik">↑</button>
											<button class="icon-btn sm" onclick={() => moveGallery(i, 1)} disabled={i === currentGallery().length - 1} title="Turun">↓</button>
											<button class="icon-btn sm danger" onclick={() => deleteGalleryUrl(url)} title="Hapus"><Trash2 size={12} /></button>
										</div>
									</div>
								{/each}
							</div>
							<p class="hint">Galeri ({currentGallery().length} foto) — centang untuk hapus massal, ↑↓ untuk urut, tombol per foto untuk jadikan Hero/Bride/Groom/Sampul (boleh rangkap).</p>
						{:else if pendingFiles.length === 0}
							<div class="slot-empty">Belum ada foto galeri — upload foto pertama di atas</div>
						{/if}
						{#if uploadMsg}<p class="hint ok">{uploadMsg}</p>{/if}
					</div>
					{:else if tab === 'konten'}
					<div class="konten">
						<div class="card pad konten-savebar">
							<div>
								<h3 class="sec-title">Konten Undangan</h3>
								<p class="hint">Isi semua konten undangan di sini (events, mempelai, gifts, ayat, love story, sosial, tema & media). Klik <strong>Simpan Konten</strong> di bawah → tersimpan ke database dan langsung tampil di halaman <code>/{selected}</code>.</p>
							</div>
						</div>
						{#if kontenMsg}<p class="hint" class:ok={kontenMsg === 'Tersimpan.'} class:err-text={kontenMsg !== 'Tersimpan.'}>{kontenMsg}</p>{/if}

						<section class="card pad k-sec">
							<h3 class="sec-title"><MapPin size={15} /> Events ({kontenEvents.length})</h3>
							{#each kontenEvents as ev, i}
								<div class="konten-row">
									<input placeholder="Nama (Akad/Resepsi)" bind:value={kontenEvents[i].name} />
									<input type="date" bind:value={kontenEvents[i].date} />
									<input placeholder="Jam (08.00 WIB)" bind:value={kontenEvents[i].time} />
									<input placeholder="Lokasi" bind:value={kontenEvents[i].location} />
									<input placeholder="Maps URL" bind:value={kontenEvents[i].map_url} />										<button class="icon-btn sm danger" onclick={() => (kontenEvents = kontenEvents.filter((_, j) => j !== i))}><Trash2 size={12} /></button>
								</div>
							{/each}
							<button class="btn btn-primary sm" onclick={() => (kontenEvents = [...kontenEvents, { name: '', date: '', time: '', location: '', map_url: '' }])}><Plus size={12} /> Tambah Acara</button>
						</section>

						<section class="card pad k-sec">
							<h3 class="sec-title"><Palette size={15} /> Gifts ({kontenGifts.length})</h3>
							{#each kontenGifts as g, i}
								<div class="konten-row">
									<select bind:value={kontenGifts[i].type}><option value="bank">bank</option><option value="ewallet">ewallet</option></select>
									<input placeholder="Provider (DANA/BCA)" bind:value={kontenGifts[i].provider} />
									<input placeholder="Pemilik" bind:value={kontenGifts[i].owner} />
									<input placeholder="No. rekening" bind:value={kontenGifts[i].number} />										<button class="icon-btn sm danger" onclick={() => (kontenGifts = kontenGifts.filter((_, j) => j !== i))}><Trash2 size={12} /></button>
								</div>
							{/each}
							<button class="btn btn-primary sm" onclick={() => (kontenGifts = [...kontenGifts, { type: 'ewallet', provider: 'DANA', owner: '', number: '' }])}><Plus size={12} /> Tambah Gift</button>
							<h3 class="sec-title sub">Amplop Digital</h3>
							<label><span>Catatan gift (opsional)</span><textarea rows="2" bind:value={kontenGiftNote}></textarea></label>
						</section>

						<section class="card pad k-sec">
							<h3 class="sec-title"><Users size={15} /> Mempelai</h3>
							<div class="grid2"><label><span>Bride name</span><input bind:value={kontenBride.name} /></label><label><span>Bride full_name</span><input bind:value={kontenBride.full_name} /></label></div>
							<label><span>Bride relation</span><textarea rows="2" bind:value={kontenBride.relation}></textarea></label>
							<div class="grid2"><label><span>Bride IG</span><input bind:value={kontenBride.instagram} /></label><label><span>Bride WA</span><input bind:value={kontenBride.whatsapp} /></label></div>
							<div class="grid2"><label><span>Groom name</span><input bind:value={kontenGroom.name} /></label><label><span>Groom full_name</span><input bind:value={kontenGroom.full_name} /></label></div>
							<label><span>Groom relation</span><textarea rows="2" bind:value={kontenGroom.relation}></textarea></label>
							<div class="grid2"><label><span>Groom IG</span><input bind:value={kontenGroom.instagram} /></label><label><span>Groom WA</span><input bind:value={kontenGroom.whatsapp} /></label></div>
						</section>

						<section class="card pad k-sec">
							<h3 class="sec-title"><MapPin size={15} /> Lokasi & Ayat</h3>
							<div class="grid2"><label><span>Nama venue</span><input bind:value={kontenVenue.name} /></label><label><span>Maps URL</span><input bind:value={kontenVenue.maps_url} /></label></div>
							<label><span>Alamat</span><textarea rows="2" bind:value={kontenVenue.address}></textarea></label>
							<h3 class="sec-title sub">Ayat</h3>
							<label class="chk"><input type="checkbox" checked={!kontenVerseOff} onchange={(e) => (kontenVerseOff = !(e.target as HTMLInputElement).checked)} /> Tampilkan ayat</label>
							{#if !kontenVerseOff}
								<label><span>Arabic</span><textarea rows="2" bind:value={kontenVerse.arabic}></textarea></label>
								<label><span>Terjemahan</span><textarea rows="3" bind:value={kontenVerse.translation}></textarea></label>
								<label><span>Sumber</span><input bind:value={kontenVerse.source} /></label>
							{/if}
						</section>

						<section class="card pad k-sec">
							<h3 class="sec-title"><FileText size={15} /> Love Story</h3>
							<label><span>Intro</span><textarea rows="2" bind:value={kontenStoryIntro}></textarea></label>
							{#each kontenStoryChapters as ch, i}
								<div class="konten-row">
									<input placeholder="Judul" bind:value={kontenStoryChapters[i].title} />
									<textarea placeholder="Teks" rows="2" bind:value={kontenStoryChapters[i].text}></textarea>										<button class="icon-btn sm danger" onclick={() => (kontenStoryChapters = kontenStoryChapters.filter((_, j) => j !== i))}><Trash2 size={12} /></button>
								</div>
							{/each}
							<button class="btn btn-primary sm" onclick={() => (kontenStoryChapters = [...kontenStoryChapters, { title: '', text: '' }])}><Plus size={12} /> Tambah Bab</button>
						</section>

						<section class="card pad k-sec">
							<h3 class="sec-title"><Link2 size={15} /> Sosial & Ucapan</h3>
							<div class="grid2"><label><span>WhatsApp footer</span><input placeholder="https://wa.me/62812..." bind:value={kontenSocial.whatsapp} /></label><label><span>Instagram footer</span><input placeholder="https://instagram.com/..." bind:value={kontenSocial.instagram} /></label></div>
							<div class="grid2"><label><span>Min. nama (karakter)</span><input type="number" min="1" max="50" bind:value={kontenWishes.minName} /></label><label><span>Min. pesan (karakter)</span><input type="number" min="1" max="500" bind:value={kontenWishes.minMessage} /></label></div>
							<label><span>Catatan ucapan</span><input placeholder="Khusus untuk tamu undangan" bind:value={kontenWishes.note} /></label>
						</section>

						<section class="card pad k-sec">
							<h3 class="sec-title"><Music size={15} /> Tema & Media</h3>
							<div class="grid2"><label><span>Primary</span><input type="color" bind:value={kontenThemePrimary} /></label><label><span>Secondary</span><input type="color" bind:value={kontenThemeSecondary} /></label></div>
							<label>
								<span>Music URL</span>
								<div class="row">
									<input placeholder="/audio/wedding.mp3 atau https://..." bind:value={kontenMusic} />
									<button class="btn btn-primary sm" onclick={() => document.getElementById('music-upload')?.click()} disabled={kontenMusicUploading}><Upload size={14} /> {kontenMusicUploading ? 'Upload…' : 'Upload'}</button>
								</div>
								<input id="music-upload" type="file" accept="audio/*" hidden onchange={async (e) => {
									const files = (e.target as HTMLInputElement).files;
									if (!files?.length) return;
									const fd = new FormData();
									for (const f of files) fd.append('files', f);
									kontenMusicUploading = true;
									try {
										const res = await fetch(`/api/admin/upload?slug=${encodeURIComponent(selected!)}&kind=music`, { method: 'POST', body: fd });
										const j = await res.json().catch(() => null);
										if (!res.ok) { notify(j?.message ?? 'Upload gagal.', 'err'); return; }
										const url = (j.urls ?? [])[0];
										if (url) { kontenMusic = url; notify('Musik terupload — klik Simpan Konten.'); }
									} catch { notify('Gagal upload.', 'err'); } finally { kontenMusicUploading = false; (e.target as HTMLInputElement).value = ''; }
								}} />
							</label>
							<div class="grid2"><label><span>YouTube (fallback)</span><input placeholder="dQw4w9WgXcQ atau https://youtu.be/..." bind:value={kontenMusicYt} /></label><label><span>Mulai detik ke-</span><input type="number" min="0" max="600" bind:value={kontenMusicStart} /></label></div>
							<label><span>Livestream URL</span><input bind:value={kontenLivestream} /></label>
						</section>

						<div class="sticky-save">
							<button class="btn btn-primary" onclick={saveKonten} disabled={kontenSaving}>{kontenSaving ? 'Menyimpan…' : 'Simpan Konten'}</button>
						</div>
					</div>
				{/if}
			{/if}
		</main>
	</div>

	{#if showForm}
		<div class="modal" role="dialog" aria-modal="true">
			<button class="modal-x" type="button" aria-label="Tutup" onclick={() => (showForm = false)}><X size={18} /></button>
			<form class="modal-card" onsubmit={submit}>
				<h2>{editing ? `Edit ${editing}` : 'Buat Undangan Baru'}</h2>
				<label>
				<span>Link Undangan *</span>
				<input type="text" bind:value={formSubdomain} disabled={!!editing} placeholder="budi-ani" />
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
				<label>
					<span>Template / Layout</span>
					<select bind:value={formTemplate}>
						{#each templateMeta as t}
							<option value={t.id}>{t.label} — {t.description}</option>
						{/each}
					</select>
				</label>
				<label><span>PIN Kelola Tamu (6-digit, kosongkan jika tidak pakai PIN)</span><input type="text" bind:value={formPin} placeholder="482913" /></label>
				{#if formErr}<p class="alert err">{formErr}</p>{/if}
				<div class="modal-actions">
					<button type="button" class="btn btn-ghost" onclick={() => (showForm = false)}>Batal</button>
					<button type="submit" class="btn btn-primary" disabled={formSaving}>{formSaving ? 'Menyimpan…' : 'Simpan'}</button>
				</div>
			</form>
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
	/* ===== Design tokens khusus admin (mandiri dari tema undangan) ===== */
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
	.topbar-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
	}
	.burger,
	.collapse-btn {
		width: 36px;
		height: 36px;
		flex: none;
		border: 1px solid var(--line);
		border-radius: 10px;
		background: var(--card);
		color: var(--ink-2);
		cursor: pointer;
		display: grid;
		place-items: center;
		transition: background 0.12s ease, color 0.12s ease;
	}
	.burger:hover,
	.collapse-btn:hover {
		background: var(--line-soft);
		color: var(--ink);
	}
	.burger {
		display: none;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		min-width: 0;
	}
	.logo-mark {
		flex: none;
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
		white-space: nowrap;
	}
	.brand-name em {
		font-style: normal;
		font-size: 11px;
		font-weight: 600;
		color: var(--ink-3);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	.topbar-right {
		display: flex;
		align-items: center;
		gap: 0.7rem;
	}
	.top-create {
		white-space: nowrap;
	}

	/* ===== User menu ===== */
	.um-wrap {
		position: relative;
	}
	.user-chip {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.3rem 0.55rem;
		border-radius: 12px;
		border: 0;
		background: transparent;
		font-family: inherit;
		cursor: pointer;
		transition: background 0.12s ease;
	}
	.user-chip:hover {
		background: var(--line-soft);
	}
	.avatar {
		flex: none;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: var(--accent);
		color: #fff;
		font-size: 12px;
		font-weight: 700;
	}
	.avatar.lg {
		width: 38px;
		height: 38px;
		font-size: 13px;
	}
	.avatar.sm {
		width: 28px;
		height: 28px;
		font-size: 11px;
	}
	.user-meta {
		display: grid;
		line-height: 1.2;
		text-align: left;
	}
	.user-meta strong {
		font-size: 12.5px;
		color: var(--ink);
	}
	.user-meta span {
		font-size: 11px;
		color: var(--ink-3);
	}
	.chev {
		color: var(--ink-3);
		transition: transform 0.15s ease;
		display: flex;
	}
	.chev-open .chev {
		transform: rotate(180deg);
	}
	.um-backdrop {
		position: fixed;
		inset: 0;
		z-index: 44;
		border: 0;
		background: transparent;
	}
	.user-menu {
		position: absolute;
		right: 0;
		top: calc(100% + 6px);
		z-index: 45;
		width: 240px;
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 14px;
		box-shadow: var(--shadow-lg);
		padding: 0.5rem;
		display: grid;
		gap: 2px;
		animation: pop-in 0.14s ease;
	}
	@keyframes pop-in {
		from {
			opacity: 0;
			transform: translateY(-6px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
	.um-head {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		padding: 0.6rem 0.6rem 0.7rem;
		border-bottom: 1px solid var(--line-soft);
		margin-bottom: 0.3rem;
	}
	.um-head strong {
		display: block;
		font-size: 13.5px;
		color: var(--ink);
	}
	.um-head span {
		font-size: 11.5px;
		color: var(--ink-3);
	}
	.um-item {
		display: flex;
		align-items: center;
		gap: 0.55em;
		width: 100%;
		border: 0;
		background: transparent;
		border-radius: 9px;
		padding: 0.55em 0.7em;
		font-size: 13px;
		font-family: inherit;
		color: var(--ink-2);
		cursor: pointer;
		text-align: left;
	}
	.um-item:hover {
		background: var(--line-soft);
		color: var(--ink);
	}
	.um-item.danger {
		color: var(--danger);
	}
	.um-item.danger:hover {
		background: var(--danger-bg);
	}
	.um-sep {
		height: 1px;
		background: var(--line-soft);
		margin: 0.2rem 0;
	}

	/* ===== Body grid ===== */
	.body {
		display: grid;
		grid-template-columns: 248px 1fr;
		align-items: start;
		min-height: calc(100svh - 60px);
		transition: grid-template-columns 0.18s ease;
	}
	.body.rail {
		grid-template-columns: 64px 1fr;
	}
	.sidebar {
		position: sticky;
		top: 60px;
		align-self: start;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1.1rem 0.9rem;
		min-height: calc(100svh - 60px);
		background: var(--card);
		border-right: 1px solid var(--line);
		color: var(--ink-2);
	}
	.side-label {
		margin: 0.7rem 0 0.25rem;
		padding: 0 0.6rem;
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-3);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.side-nav {
		display: grid;
		gap: 2px;
	}
	.side-nav button,
	.side-nav a {
		display: flex;
		align-items: center;
		gap: 0.6em;
		width: 100%;
		text-align: left;
		border: 0;
		background: transparent;
		border-radius: 9px;
		padding: 0.55em 0.7em;
		font-size: 13.5px;
		font-family: inherit;
		color: var(--ink-2);
		text-decoration: none;
		cursor: pointer;
		transition: background 0.12s ease, color 0.12s ease;
	}
	.side-nav button:hover,
	.side-nav a:hover {
		background: var(--line-soft);
		color: var(--ink);
	}
	.side-nav button.active {
		background: var(--accent-soft);
		color: var(--accent-strong);
		box-shadow: inset 3px 0 0 var(--accent);
		font-weight: 600;
	}
	.side-nav .count {
		margin-left: auto;
		font-size: 11px;
		font-weight: 600;
		background: var(--line-soft);
		border-radius: 999px;
		padding: 0.05em 0.55em;
		color: var(--ink-3);
	}
	.side-nav button.active .count {
		background: rgba(37, 99, 235, 0.14);
		color: var(--accent-strong);
	}
	.side-inv {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.55rem 0.6rem;
		border-radius: 12px;
		background: var(--line-soft);
		border: 1px solid var(--line);
	}
	.side-inv-mono {
		flex: none;
		width: 34px;
		height: 34px;
		border-radius: 10px;
		display: grid;
		place-items: center;
		font-size: 12px;
		font-weight: 700;
		color: #fff;
		background: var(--accent);
	}
	.side-inv-meta {
		display: grid;
		min-width: 0;
	}
	.side-inv-meta strong {
		font-size: 13px;
		color: var(--ink);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.side-inv-meta span {
		font-size: 11.5px;
		color: var(--ink-3);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.side-overlay {
		display: none;
	}

	/* ===== Rail (sidebar dicuitkan) ===== */
	.sidebar.rail {
		padding: 1.1rem 0.5rem;
	}
	.sidebar.rail .side-label,
	.sidebar.rail .nav-txt,
	.sidebar.rail .count,
	.sidebar.rail .side-inv-meta {
		display: none;
	}
	.sidebar.rail .side-nav button,
	.sidebar.rail .side-nav a {
		justify-content: center;
		padding: 0.6em 0;
	}
	.sidebar.rail .side-inv {
		justify-content: center;
		padding: 0.4rem 0;
	}
	.sidebar.rail .side-foot {
		justify-content: center;
		padding: 0.5rem 0;
	}

	/* ===== Main ===== */
	.main {
		padding: 1.3rem 1.5rem 4rem;
		min-width: 0;
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
	}
	.crumb-link:hover {
		color: var(--accent-strong);
	}
	.crumb .crumb-sep {
		color: var(--ink-3);
	}
	.page-head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.2rem;
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

	/* ===== KPI ===== */
	.kpis {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
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
		font-size: 11px;
		color: var(--ink-3);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* ===== Toolbar (cari + filter) ===== */
	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.8rem;
		flex-wrap: wrap;
		margin-bottom: 1rem;
	}
	.search-box {
		position: relative;
		flex: 1;
		min-width: 220px;
		max-width: 380px;
	}
	.search-box input {
		width: 100%;
		border: 1px solid var(--line);
		border-radius: 10px;
		background: var(--card);
		padding: 0.6em 2.2em 0.6em 2.3em;
		font-size: 13px;
		font-family: inherit;
		color: var(--ink);
	}
	.search-box input:focus {
		outline: 2px solid var(--accent);
		outline-offset: -1px;
		border-color: var(--accent);
	}
	:global(.s-ic) {
		position: absolute;
		left: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--ink-3);
		pointer-events: none;
	}
	.s-clear {
		position: absolute;
		right: 0.5rem;
		top: 50%;
		transform: translateY(-50%);
		width: 22px;
		height: 22px;
		border: 0;
		border-radius: 6px;
		background: var(--line-soft);
		color: var(--ink-3);
		cursor: pointer;
		display: grid;
		place-items: center;
	}
	.s-clear:hover {
		color: var(--ink);
	}
	.chips {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
	}
	.chips button {
		border: 1px solid var(--line);
		background: var(--card);
		color: var(--ink-2);
		border-radius: 999px;
		padding: 0.4em 0.85em;
		font-size: 12px;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.13s ease;
	}
	.chips button:hover {
		border-color: #d0d5dd;
		color: var(--ink);
	}
	.chips button.active {
		background: var(--accent);
		color: #fff;
		border-color: transparent;
		box-shadow: 0 1px 2px rgba(37, 99, 235, 0.3);
	}
	.chips b {
		font-weight: 600;
		opacity: 0.85;
	}

	/* ===== Card & table ===== */
	.card {
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
	}
	.card.pad {
		padding: 1.2rem;
	}
	.table-wrap {
		overflow: hidden;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13.5px;
	}
	th,
	td {
		text-align: left;
		padding: 0.8rem 1rem;
		border-bottom: 1px solid var(--line-soft);
		vertical-align: middle;
	}
	th {
		font-size: 10.5px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--ink-3);
		background: #f9fafb;
	}
	tbody tr:last-child td {
		border-bottom: 0;
	}
	tbody tr {
		transition: background 0.1s ease;
	}
	tbody tr:hover {
		background: #fafbff;
	}
	tr.selected {
		background: var(--accent-soft) !important;
	}
	.ta-r {
		text-align: right;
	}
	.inv-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 1rem;
	}
	.inv-card {
		display: grid;
		grid-template-rows: auto 1fr auto;
		text-align: left;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		overflow: hidden;
		background: var(--card);
		box-shadow: var(--shadow);
		cursor: pointer;
		padding: 0;
		font-family: inherit;
		transition: transform 0.14s ease, box-shadow 0.14s ease, border-color 0.14s ease;
	}
	.inv-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
		border-color: #d0d5dd;
	}
	.inv-card.selected {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-soft);
	}
	.inv-cover {
		position: relative;
		aspect-ratio: 4 / 3;
		background: var(--line-soft);
		overflow: hidden;
	}
	.inv-cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.inv-cover-empty {
		width: 100%;
		height: 100%;
		display: grid;
		place-items: center;
		font-size: 28px;
		font-weight: 700;
		color: #fff;
		background: var(--accent);
	}
	.inv-status {
		position: absolute;
		top: 0.6rem;
		left: 0.6rem;
	}
	.inv-body {
		display: grid;
		gap: 0.2rem;
		padding: 0.85rem 0.9rem 0.6rem;
	}
	.inv-name {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.3em;
		font-size: 13px;
		font-weight: 700;
		color: var(--ink);
		text-align: center;
	}
	.inv-name i {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-style: normal;
		font-weight: 400;
		color: var(--ink-3);
		line-height: 1;
	}
	.inv-sub {
		font-size: 12px;
		color: var(--ink-2);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.inv-sub code {
		font-family: ui-monospace, monospace;
		font-size: 11.5px;
		background: var(--line-soft);
		border-radius: 6px;
		padding: 0.1em 0.4em;
	}
	.inv-meta {
		font-size: 11.5px;
		color: var(--ink-3);
	}
	.inv-actions {
		display: flex;
		gap: 0.35rem;
		padding: 0.6rem 0.7rem;
		border-top: 1px solid var(--line-soft);
		background: #fafbff;
	}
	.lnk {
		display: inline-flex;
		align-items: center;
		gap: 0.25em;
		background: transparent;
		border: 0;
		cursor: pointer;
		font-family: inherit;
		font-size: 12.5px;
		color: var(--ink-2);
		padding: 0;
	}
	.lnk strong,
	.lnk.strong {
		font-weight: 600;
		color: var(--accent-strong);
	}
	.lnk:hover {
		color: var(--accent-strong);
		text-decoration: underline;
	}
	.couple span:first-child {
		font-weight: 600;
		color: var(--ink);
	}
	.couple i {
		font-style: normal;
		color: var(--ink-3);
		padding: 0 0.15em;
	}
	.tag {
		display: inline-block;
		margin-top: 0.25rem;
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--accent-strong);
		background: var(--accent-soft);
		border: 1px solid #bfdbfe;
		border-radius: 6px;
		padding: 0.12em 0.55em;
	}
	.pill {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		border-radius: 999px;
		padding: 0.2em 0.7em;
		font-size: 11.5px;
		font-weight: 500;
		background: var(--line-soft);
		color: var(--ink-2);
		border: 1px solid var(--line);
		text-transform: capitalize;
	}
	.pill .dot {
		width: 6px;
		height: 6px;
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
	.pill.warn {
		background: var(--warn-bg);
		color: var(--warn);
		border-color: #fde68a;
	}
	.pill.warn .dot {
		background: var(--warn);
	}
	.pill.muted-pill .dot {
		background: var(--ink-3);
	}
	.pin {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 12px;
		letter-spacing: 0.06em;
		color: var(--ink-2);
		background: var(--line-soft);
		border-radius: 6px;
		padding: 0.15em 0.5em;
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.35rem;
		flex-wrap: wrap;
	}
	.btn-action {
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
		border: 1px solid var(--line);
		background: var(--card);
		color: var(--ink-2);
		border-radius: 8px;
		padding: 0.4em 0.7em;
		font-size: 12px;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		white-space: nowrap;
		text-decoration: none;
		transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
	}
	.btn-action:hover {
		border-color: #cbd5e1;
		background: var(--line-soft);
		color: var(--ink);
	}
	.btn-action.danger {
		color: var(--danger);
	}
	.btn-action.danger:hover {
		background: var(--danger-bg);
		border-color: #fecaca;
	}

	/* ===== Buttons & icons ===== */
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
		letter-spacing: normal;
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
		transition: background 0.12s ease, color 0.12s ease;
	}
	.icon-btn:hover {
		background: var(--line-soft);
		color: var(--ink);
	}
	.icon-btn.danger {
		color: var(--danger);
	}
	.icon-btn.danger:hover {
		background: var(--danger-bg);
		border-color: #fecaca;
	}
	.icon-btn.sm {
		width: 30px;
		height: 30px;
	}
	.icon-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* ===== Detail head ===== */
	.detail-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1.1rem 1.2rem;
		margin-bottom: 1.1rem;
		flex-wrap: wrap;
	}
	.dh-left {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		min-width: 0;
	}
	.dh-mono {
		flex: none;
		width: 46px;
		height: 46px;
		border-radius: 13px;
		display: grid;
		place-items: center;
		font-size: 16px;
		font-weight: 700;
		color: #fff;
		background: var(--accent);
		box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
	}
	.detail-head h1 {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.3em;
		margin: 0;
		font-size: 18px;
		font-weight: 700;
		flex-wrap: wrap;
	}
	.detail-head h1 i {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-style: normal;
		font-weight: 400;
		color: var(--ink-3);
		line-height: 1;
	}
	.dh-sub {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin: 0.3rem 0 0;
	}
	.dh-sub code {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 12px;
		color: var(--ink-2);
		background: var(--line-soft);
		border-radius: 6px;
		padding: 0.15em 0.5em;
	}
	.dh-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		align-items: center;
	}


	/* ===== Overview ===== */
	.ov-cards {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.9rem;
		margin-bottom: 1.1rem;
	}
	.ov-card {
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		padding: 1rem;
		text-align: center;
		box-shadow: var(--shadow);
	}
	.ov-card strong {
		display: block;
		font-size: 24px;
		line-height: 1.2;
		color: var(--ink);
	}
	.ov-card span {
		font-size: 11.5px;
		color: var(--ink-3);
		text-transform: uppercase;
		letter-spacing: 0.05em;
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
	.sec-title.sub {
		margin-top: 1rem;
		font-size: 12.5px;
		color: var(--ink-2);
	}
	.count-pill {
		font-size: 11px;
		font-weight: 600;
		color: var(--accent-strong);
		background: var(--accent-soft);
		border-radius: 999px;
		padding: 0.1em 0.6em;
	}
	.export-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.export-row select {
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 0.5em 0.7em;
		font-size: 13px;
		font-family: inherit;
		background: var(--card);
		color: var(--ink);
	}

	/* ===== Lists (tamu & ucapan) ===== */
	.list {
		display: grid;
		gap: 0.55rem;
	}
	.list-head {
		margin-bottom: 0.2rem;
	}
	.list-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.8rem;
		padding: 0.6rem 0.8rem;
		border: 1px solid var(--line-soft);
		border-radius: 11px;
		background: #fff;
	}
	.list-item:hover {
		border-color: var(--line);
	}
	.li-left {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		min-width: 0;
	}
	.li-avatar {
		flex: none;
		width: 30px;
		height: 30px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		font-size: 13px;
		font-weight: 700;
		color: var(--ink-2);
		background: var(--line-soft);
	}
	.li-avatar.accent {
		background: var(--accent-soft);
		color: var(--accent-strong);
	}
	.li-name {
		font-size: 12.5px;
		color: var(--ink);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.wish-item {
		border: 1px solid var(--line-soft);
		border-radius: 11px;
		padding: 0.75rem 0.85rem;
		background: #fff;
	}
	.wish-item:hover {
		border-color: var(--line);
	}
	.wish-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.8rem;
	}
	.wish-msg {
		margin: 0.5rem 0 0 2.55rem;
		color: var(--ink-2);
		font-size: 13px;
		white-space: pre-wrap;
	}
	.empty-note {
		margin: 0.3rem 0 0;
		font-size: 13px;
	}

	/* ===== Upload ===== */
	.upload {
		display: grid;
		gap: 0.7rem;
	}
	.role-strip {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.6rem;
	}
	.role-card {
		border: 1px solid var(--line);
		border-radius: 10px;
		overflow: hidden;
		background: var(--card);
		text-align: center;
	}
	.role-label {
		display: block;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--ink-2);
		padding: 0.4em 0;
		background: var(--line-soft);
		border-bottom: 1px solid var(--line);
	}
	.role-card img {
		width: 100%;
		aspect-ratio: 1;
		object-fit: cover;
		display: block;
	}
	.role-empty {
		aspect-ratio: 1;
		display: grid;
		place-items: center;
		font-size: 12px;
		color: var(--ink-3);
	}
	.dropzone {
		display: grid;
		place-items: center;
		gap: 0.5rem;
		padding: 1rem;
		border: 1.5px dashed var(--line);
		border-radius: 12px;
		background: var(--line-soft);
	}
	.dropzone.has-pending {
		place-items: stretch;
		background: var(--card);
		border-style: solid;
	}
	.slot-empty {
		display: grid;
		place-items: center;
		width: 100%;
		height: 160px;
		color: var(--ink-3);
		font-size: 13px;
		border: 1px dashed var(--line);
		border-radius: 12px;
		background: var(--card);
	}
	.slot-actions {
		display: flex;
		gap: 0.5rem;
	}
	.pv-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: 0.6rem;
	}
	.pv-cell {
		position: relative;
		border-radius: 10px;
		overflow: hidden;
		border: 1px solid var(--line);
		background: #fff;
	}
	.pv-cell img {
		width: 100%;
		aspect-ratio: 1;
		object-fit: cover;
		display: block;
	}
	.pv-del {
		position: absolute;
		top: 6px;
		right: 6px;
		width: 26px;
		height: 26px;
	}
	.gallery-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: 0.7rem;
		margin-top: 0.3rem;
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
		font-size: 12.5px;
		margin-top: 0.4rem;
	}
	.bulk-check {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		font-weight: 600;
		color: var(--ink-2);
		cursor: pointer;
	}
	.bulk-count {
		color: var(--ink-3);
	}
	.gcell {
		position: relative;
		border: 1px solid var(--line);
		border-radius: 12px;
		overflow: hidden;
		background: #fff;
	}
	.gcell.sel {
		outline: 2px solid var(--accent);
		border-color: var(--accent);
	}
	.gsel {
		position: absolute;
		top: 6px;
		left: 6px;
		z-index: 2;
		background: #fff;
		border-radius: 6px;
		padding: 2px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
		display: grid;
		place-items: center;
		cursor: pointer;
	}
	.gsel input {
		width: 16px;
		height: 16px;
		margin: 0;
		cursor: pointer;
	}
	.gcell img {
		width: 100%;
		aspect-ratio: 1;
		object-fit: cover;
		display: block;
	}
	.badges {
		position: absolute;
		top: 6px;
		right: 6px;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.2rem;
	}
	.role-badge {
		font-size: 10px;
		font-weight: 700;
		color: #fff;
		background: var(--accent);
		border-radius: 999px;
		padding: 0.15em 0.55em;
	}
	.role-badge.plain {
		background: #64748b;
	}
	.role-actions {
		display: flex;
		gap: 0.3rem;
		flex-wrap: wrap;
		padding: 0.4rem;
		justify-content: center;
	}
	.role-btn {
		border: 1px solid var(--line);
		background: var(--card);
		color: var(--ink-2);
		border-radius: 999px;
		padding: 0.2em 0.6em;
		font-size: 11px;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
	}
	.role-btn.active {
		background: var(--accent);
		color: #fff;
		border-color: var(--accent);
	}
	.role-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.gact {
		display: flex;
		gap: 0.3rem;
		padding: 0.4rem;
		justify-content: center;
	}
	.hint {
		margin: 0.2rem 0 0;
		font-size: 12.5px;
		color: var(--ink-3);
	}
	.hint.ok {
		color: var(--ok);
	}
	.hint.err-text {
		color: var(--danger);
	}

	/* ===== Konten ===== */
	.konten {
		display: grid;
		gap: 1rem;
	}
	.k-sec {
		display: grid;
		gap: 0.8rem;
	}
	.konten-savebar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		position: sticky;
		top: 72px;
		z-index: 20;
	}
	.sticky-save {
		position: sticky;
		bottom: 1rem;
		display: flex;
		justify-content: flex-end;
		z-index: 20;
	}
	.sticky-save .btn {
		box-shadow: var(--shadow-lg);
	}
	.konten-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
		align-items: start;
		border: 1px solid var(--line-soft);
		border-radius: 11px;
		padding: 0.6rem;
	}
	@media (min-width: 640px) {
		.konten-row {
			grid-template-columns: 1fr 1fr 1fr 1fr auto;
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
		font-family: inherit;
		color: var(--ink);
		background: #fff;
		box-sizing: border-box;
	}
	.konten-row input:focus,
	.konten-row select:focus,
	.konten-row textarea:focus,
	.konten label input:focus,
	.konten label textarea:focus,
	.konten label select:focus,
	.modal-card input:focus,
	.modal-card select:focus {
		outline: 2px solid var(--accent);
		outline-offset: -1px;
		border-color: var(--accent);
	}
	.konten label span {
		display: block;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--ink-3);
		margin-bottom: 0.3rem;
	}
	.konten label input,
	.konten label textarea,
	.konten label select {
		width: 100%;
		border: 1px solid var(--line);
		border-radius: 9px;
		padding: 0.55em 0.8em;
		font-size: 13px;
		font-family: inherit;
		color: var(--ink);
		background: #fff;
		box-sizing: border-box;
	}
	.chk {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		font-size: 13px;
		color: var(--ink-2);
		cursor: pointer;
	}
	.grid2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.7rem;
	}
	@media (max-width: 640px) {
		.grid2 {
			grid-template-columns: 1fr;
		}
	}

	/* ===== Skeleton ===== */
	.sk {
		border-radius: 10px;
		background: linear-gradient(90deg, #eef0f3 25%, #f7f8fa 50%, #eef0f3 75%);
		background-size: 200% 100%;
		animation: sk 1.3s infinite linear;
	}
	.kpi.sk {
		height: 68px;
	}
	.sk-row {
		display: flex;
		gap: 1.5rem;
		align-items: center;
		padding: 1rem 1.2rem;
		border-bottom: 1px solid var(--line-soft);
	}
	.sk-row:last-child {
		border-bottom: 0;
	}
	.sk-b {
		height: 14px;
	}
	@keyframes sk {
		to {
			background-position: -200% 0;
		}
	}

	/* ===== Modal ===== */
	.modal {
		position: fixed;
		inset: 0;
		z-index: 60;
		display: grid;
		place-items: center;
		padding: 1rem;
		background: rgba(16, 24, 40, 0.55);
		backdrop-filter: blur(3px);
	}
	.modal-x {
		position: absolute;
		top: 1.1rem;
		right: 1.1rem;
		width: 34px;
		height: 34px;
		border-radius: 9px;
		border: 1px solid var(--line);
		background: var(--card);
		color: var(--ink-2);
		cursor: pointer;
		display: grid;
		place-items: center;
		z-index: 1;
	}
	.modal-x:hover {
		color: var(--ink);
	}
	.modal-card {
		position: relative;
		background: var(--card);
		border-radius: 18px;
		padding: 1.5rem;
		width: min(100%, 540px);
		display: grid;
		gap: 0.85rem;
		box-shadow: var(--shadow-lg);
		max-height: calc(100svh - 2rem);
		overflow-y: auto;
	}
	.modal-card h2 {
		margin: 0 0 0.2rem;
		font-size: 18px;
		font-weight: 700;
	}
	.modal-card label span {
		display: block;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--ink-3);
		margin-bottom: 0.3rem;
	}
	.modal-card input,
	.modal-card select {
		width: 100%;
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 0.65em 0.9em;
		font-size: 14px;
		font-family: inherit;
		color: var(--ink);
		background: #fff;
		box-sizing: border-box;
	}
	.modal-card input:disabled {
		background: var(--line-soft);
		color: var(--ink-3);
	}
	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.6rem;
		margin-top: 0.5rem;
	}

	/* ===== Feedback ===== */
	.alert {
		display: flex;
		align-items: center;
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
	.empty {
		background: var(--card);
		border: 1px dashed var(--line);
		border-radius: var(--radius);
		padding: 2.2rem 1.4rem;
		text-align: center;
		color: var(--ink-3);
		display: grid;
		gap: 0.4rem;
		justify-content: center;
	}
	.empty strong {
		display: block;
		font-size: 15px;
		color: var(--ink-2);
	}
	.empty p {
		margin: 0;
		font-size: 13px;
	}
	.empty .btn {
		justify-self: center;
		margin-top: 0.4rem;
	}
	.muted {
		color: var(--ink-3);
	}

	/* ===== Responsive ===== */
	@media (max-width: 1080px) {
		.kpis {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (max-width: 960px) {
		.body,
		.body.rail {
			grid-template-columns: 1fr;
		}
		.collapse-btn {
			display: none;
		}
		.burger {
			display: grid;
		}
		.sidebar,
		.sidebar.rail {
			position: fixed;
			top: 60px;
			bottom: 0;
			left: 0;
			width: 260px;
			min-height: 0;
			z-index: 50;
			transform: translateX(-100%);
			transition: transform 0.2s ease;
			overflow-y: auto;
			padding: 1.1rem 0.9rem;
		}
		.sidebar.open {
			transform: translateX(0);
		}
		.sidebar.rail .side-label,
		.sidebar.rail .nav-txt,
		.sidebar.rail .count,
		.sidebar.rail .side-inv-meta {
			display: revert;
		}
		.sidebar.rail .side-nav button,
		.sidebar.rail .side-nav a {
			justify-content: flex-start;
			padding: 0.55em 0.7em;
		}
		.side-overlay {
			display: block;
			position: fixed;
			inset: 60px 0 0 0;
			z-index: 45;
			background: rgba(16, 24, 40, 0.5);
			border: 0;
		}
		.main {
			padding: 1.1rem 1rem 3rem;
		}
	}
	@media (max-width: 720px) {
		.user-meta,
		.top-create {
			display: none;
		}
		.btn-action span {
			display: none;
		}
		.btn-action {
			padding: 0.4em 0.55em;
		}
		.kpis,
		.ov-cards {
			grid-template-columns: 1fr 1fr;
		}
		.page-head {
			flex-direction: column;
			align-items: flex-start;
		}
		.konten-savebar {
			position: static;
		}
		.toolbar {
			align-items: stretch;
		}
		.search-box {
			max-width: none;
		}
	}

	/* ===== Field gambar (upload / pilih dari galeri) ===== */
	.img-field {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		margin-top: 0.3rem;
	}
	.img-thumb {
		width: 64px;
		height: 64px;
		object-fit: cover;
		border-radius: 10px;
		border: 1px solid var(--line);
		background: var(--line-soft);
		flex-shrink: 0;
	}
	.img-inputs {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-width: 0;
	}
	.img-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;
	}
	.img-pick {
		flex: 1;
		min-width: 140px;
		background: var(--card);
		border: 1px solid var(--line);
		color: var(--ink);
		border-radius: 8px;
		padding: 0.35em 0.6em;
		font-size: 12.5px;
		font-family: inherit;
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
	.shell.dark th {
		background: #16213a;
	}
	.shell.dark tbody tr:hover {
		background: #1c2a44;
	}
	.shell.dark tr.selected {
		background: #1e3a5f !important;
	}
	.shell.dark .chips button:hover,
	.shell.dark .btn-ghost:hover,
	.shell.dark .btn-action:hover,
	.shell.dark .icon-btn:hover {
		border-color: #475569;
		background: #233047;
		color: var(--ink);
	}

	.shell.dark .pill.ok {
		border-color: #1c6b46;
	}
	.shell.dark .pill.warn {
		border-color: #7a5a12;
	}
	.shell.dark .btn-action.danger:hover,
	.shell.dark .icon-btn.danger:hover,
	.shell.dark .alert.err {
		border-color: #7f2d34;
	}
	.shell.dark .sk {
		background: linear-gradient(90deg, #1c2740 25%, #243152 50%, #1c2740 75%);
		background-size: 200% 100%;
	}
	.shell.dark .toast {
		background: #0b1220;
		box-shadow: var(--shadow-lg);
	}
	.shell.dark .modal {
		background: rgba(2, 6, 23, 0.72);
	}
	.shell.dark .side-overlay {
		background: rgba(2, 6, 23, 0.62);
	}
	.shell.dark .list-item,
	.shell.dark .wish-item,
	.shell.dark .gcell,
	.shell.dark .pv-cell,
	.shell.dark .role-card,
	.shell.dark .dropzone.has-pending,
	.shell.dark .bulk-bar,
	.shell.dark .slot-empty {
		background: var(--card);
		border-color: var(--line);
	}
	.shell.dark .list-item:hover,
	.shell.dark .wish-item:hover {
		border-color: #475569;
	}
	.shell.dark .gcell.sel {
		border-color: var(--accent);
	}
	.shell.dark .konten label input,
	.shell.dark .konten label textarea,
	.shell.dark .konten label select,
	.shell.dark .konten-row input,
	.shell.dark .konten-row select,
	.shell.dark .konten-row textarea,
	.shell.dark .modal-card input,
	.shell.dark .modal-card select,
	.shell.dark .modal-card textarea,
	.shell.dark .search-box input,
	.shell.dark .img-pick,
	.shell.dark .export-row select {
		background: #0f1f39;
		color: var(--ink);
		border-color: var(--line);
	}
	.shell.dark .konten label input::placeholder,
	.shell.dark .konten label textarea::placeholder,
	.shell.dark .konten-row input::placeholder,
	.shell.dark .search-box input::placeholder,
	.shell.dark .modal-card input::placeholder {
		color: var(--ink-3);
	}
	.shell.dark .konten-row,
	.shell.dark .konten label span,
	.shell.dark .modal-card label span {
		border-color: var(--line);
	}
	.shell.dark .role-actions .role-btn {
		background: #0f1f39;
		border-color: var(--line);
		color: var(--ink-2);
	}
	.shell.dark .role-actions .role-btn.active {
		background: var(--accent);
		color: #fff;
		border-color: var(--accent);
	}
	.shell.dark .gact,
	.shell.dark .role-strip .role-label {
		border-color: var(--line);
	}
	.shell.dark input[type='date']::-webkit-calendar-picker-indicator {
		filter: invert(0.7);
	}
	.shell.dark .empty {
		background: var(--card);
		border-color: var(--line);
	}
	.shell.dark .topbar,
	.shell.dark .sidebar {
		border-color: var(--line);
	}
	.shell.dark .crumb .crumb-cur,
	.shell.dark .crumb-link {
		color: var(--ink-2);
	}
	.shell.dark .inv-card {
		border-color: var(--line);
	}
	.shell.dark .inv-card:hover {
		border-color: #475569;
	}
	.shell.dark .inv-card.selected {
		border-color: var(--accent);
	}
	.shell.dark .inv-actions {
		background: #16213a;
		border-color: var(--line);
	}
</style>