import { writable } from 'svelte/store';
import { wedding } from '$lib/data/wedding';

export const musicState = writable<{ started: boolean; playing: boolean }>({
	started: false,
	playing: false
});

const src = (wedding.music as { src?: string }).src || '';
const ytId = wedding.music.youtubeId;
const startAt = wedding.music.startSeconds || 0;

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
	if (audio) return audio;
	if (!src) return null;
	audio = new Audio(src);
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
				e.target.seekTo(startAt);
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
	if (src) {
		const a = ensureAudio();
		if (!a) return;
		try {
			if (a.currentTime < startAt || a.currentTime === 0) {
				a.currentTime = startAt;
			}
			await a.play();
		} catch {}
		return;
	}
	if (!ytId) return;
	if (!bootQueued) await bootYT();
	ytPlayer?.playVideo();
}

export async function toggleMusic() {
	if (typeof window === 'undefined') return;
	if (src) {
		const a = ensureAudio();
		if (!a) return;
		if (a.paused) {
			try {
				if (a.currentTime === 0 && startAt) a.currentTime = startAt;
				await a.play();
			} catch {}
		} else {
			a.pause();
		}
		return;
	}
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
