import { writable } from 'svelte/store';
import { wedding } from '$lib/data/wedding';

export const musicState = writable<{ started: boolean; playing: boolean }>({
	started: false,
	playing: false
});

let overrideSrc: string | null = null;
let overrideYtId: string | null = null;
let overrideStartAt: number | null = null;
let overrideSource: 'url' | 'youtube' | null = null;

const defaultSrc = (wedding.music as { src?: string }).src || '';
const defaultYtId = extractYoutubeId(wedding.music.youtubeId);
const defaultStartAt = wedding.music.startSeconds || 0;
const defaultSource: 'url' | 'youtube' = defaultSrc ? 'url' : (defaultYtId ? 'youtube' : 'url');

export function setMusicConfig(config: {
	src?: string | null;
	youtubeId?: string | null;
	startSeconds?: number;
	source?: 'url' | 'youtube';
}) {
	if (config.src !== undefined) overrideSrc = config.src?.trim() || null;
	if (config.youtubeId !== undefined) overrideYtId = config.youtubeId?.trim() || null;
	if (typeof config.startSeconds === 'number') overrideStartAt = config.startSeconds;
	if (config.source) overrideSource = config.source;
	if (audio && overrideSrc !== null) {
		try { audio.src = overrideSrc; audio.load(); } catch {}
	}
}

/** @deprecated Use setMusicConfig instead */
export function setMusicSrc(src: string | null, startSeconds?: number) {
	setMusicConfig({ src, startSeconds });
}

function extractYoutubeId(input: string): string {
	const trimmed = (input || '').trim();
	if (!trimmed) return '';
	if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
	const m = trimmed.match(
		/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/
	);
	return m ? m[1] : '';
}

function currentYtId(): string { return overrideYtId ?? defaultYtId; }
function currentSrc(): string { return overrideSrc ?? defaultSrc; }
function currentStartAt(): number { return overrideStartAt ?? defaultStartAt; }
function currentSource(): 'url' | 'youtube' { return overrideSource ?? defaultSource; }

let audio: HTMLAudioElement | null = null;
let bootQueued = false;

interface PlayerLike {
	playVideo: () => void;
	pauseVideo: () => void;
	seekTo: (s: number) => void;
}

let ytPlayer: PlayerLike | null = null;
let apiReady: Promise<void> | null = null;

declare global {
	interface Window {
		onYouTubeIframeAPIReady?: () => void;
		YT?: unknown;
	}
}

function setPlaying(playing: boolean) {
	musicState.update((s) => ({ ...s, started: true, playing }));
}

function ensureAudio(): HTMLAudioElement | null {
	if (typeof window === 'undefined') return null;
	const s = currentSrc();
	if (!s) return null;
	if (audio) {
		if (audio.src !== s && !audio.src.endsWith(s)) {
			try { audio.src = s; audio.load(); } catch {}
		}
		return audio;
	}
	audio = new Audio(s);
	audio.loop = true;
	audio.preload = 'auto';
	audio.crossOrigin = 'anonymous';
	audio.addEventListener('play', () => setPlaying(true));
	audio.addEventListener('pause', () => setPlaying(false));
	audio.addEventListener('ended', () => setPlaying(false));
	return audio;
}

function loadApi(): Promise<void> {
	if (apiReady) return apiReady;
	apiReady = new Promise((resolve) => {
		const prev = window.onYouTubeIframeAPIReady;
		window.onYouTubeIframeAPIReady = () => {
			prev?.();
			resolve();
		};
		const tag = document.createElement('script');
		tag.src = 'https://www.youtube.com/iframe_api';
		document.head.appendChild(tag);
	});
	return apiReady;
}

async function bootYT() {
	if (bootQueued) return;
	bootQueued = true;
	await loadApi();
	const ytId = currentYtId();
	if (!ytId) return;
	const YT = window.YT as {
		Player: new (el: string | HTMLElement, opts: Record<string, unknown>) => PlayerLike;
	};
	const container = document.createElement('div');
	container.id = 'youtube-audio';
	container.style.cssText = 'position:fixed;width:0;height:0;opacity:0;pointer-events:none;';
	document.body.appendChild(container);
	ytPlayer = new YT.Player('youtube-audio', {
		width: '0',
		height: '0',
		videoId: ytId,
		playerVars: {
			autoplay: 0,
			controls: 0,
			disablekb: 1,
			fs: 0,
			playsinline: 1,
			rel: 0,
			loop: 1,
			playlist: ytId
		},
		events: {
			onReady: (e: { target: PlayerLike }) => {
				e.target.seekTo(currentStartAt());
				e.target.playVideo();
			},
			onStateChange: (e: { data: number }) => {
				if (e.data === 1 || e.data === 2) setPlaying(e.data === 1);
			}
		}
	});
}

export async function startMusic() {
	if (typeof window === 'undefined') return;
	const source = currentSource();
	const st = currentStartAt();
	if (source === 'url') {
		const s = currentSrc();
		if (!s) return;
		const a = ensureAudio();
		if (!a) return;
		try {
			if (a.currentTime < st || a.currentTime === 0) {
				a.currentTime = st;
			}
			await a.play();
		} catch {}
		return;
	}
	const ytId = currentYtId();
	if (!ytId) return;
	if (!bootQueued) await bootYT();
	ytPlayer?.playVideo();
}

export async function toggleMusic() {
	if (typeof window === 'undefined') return;
	const source = currentSource();
	const st = currentStartAt();
	if (source === 'url') {
		const s = currentSrc();
		if (!s) return;
		const a = ensureAudio();
		if (!a) return;
		if (a.paused) {
			try {
				if (a.currentTime === 0 && st) a.currentTime = st;
				await a.play();
			} catch {}
		} else {
			a.pause();
		}
		return;
	}
	const ytId = currentYtId();
	if (!ytId) return;
	if (!bootQueued) {
		await bootYT();
		ytPlayer?.playVideo();
		return;
	}
	let playing = false;
	const unsub = musicState.subscribe((s) => (playing = s.playing));
	unsub();
	if (playing) ytPlayer?.pauseVideo();
	else ytPlayer?.playVideo();
}