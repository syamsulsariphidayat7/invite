// Pemutar musik latar gaya "YouTube audio" (mirip plugin referensi):
// iframe YouTube tersembunyi, mulai dari detik ke-N, bisa di-toggle play/pause.
import { writable } from 'svelte/store';
import { wedding } from '$lib/data/wedding';

export const musicState = writable<{ started: boolean; playing: boolean }>({
	started: false,
	playing: false
});

const id = wedding.music.youtubeId;
const startAt = wedding.music.startSeconds || 0;

interface PlayerLike {
	playVideo: () => void;
	pauseVideo: () => void;
	seekTo: (s: number) => void;
}

let player: PlayerLike | null = null;
let bootQueued = false;
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

async function boot() {
	if (bootQueued) return;
	bootQueued = true;
	await loadApi();
	if (!id) return;

	const YT = window.YT as {
		Player: new (
			el: string | HTMLElement,
			opts: Record<string, unknown>
		) => PlayerLike;
	};

	const container = document.createElement('div');
	container.id = 'youtube-audio';
	container.style.cssText = 'position:fixed;width:0;height:0;opacity:0;pointer-events:none;';
	document.body.appendChild(container);

	player = new YT.Player('youtube-audio', {
		width: '0',
		height: '0',
		videoId: id,
		playerVars: {
			autoplay: 0,
			controls: 0,
			disablekb: 1,
			fs: 0,
			playsinline: 1,
			rel: 0,
			loop: 1,
			playlist: id
		},
		events: {
			onReady: (e: { target: PlayerLike }) => {
				e.target.seekTo(startAt);
				e.target.playVideo();
			},
			onStateChange: (e: { data: number }) => {
				// 1 = playing, 2 = paused, 0 = ended (playlist loop menangani ulang)
				if (e.data === 1 || e.data === 2) setPlaying(e.data === 1);
			}
		}
	});
}

/** Dipanggil saat tamu menekan "Buka Undangan". */
export async function startMusic() {
	if (!id || typeof window === 'undefined') return;
	if (!bootQueued) await boot();
	player?.playVideo();
}

export async function toggleMusic() {
	if (!id || typeof window === 'undefined') return;
	if (!bootQueued) {
		await boot();
		player?.playVideo();
		return;
	}
	let playing = false;
	const unsub = musicState.subscribe((s) => (playing = s.playing));
	unsub();
	if (playing) player?.pauseVideo();
	else player?.playVideo();
}
