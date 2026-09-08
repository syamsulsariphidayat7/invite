/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

const worker = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `undangan-${version}`;
const ASSETS = [...build, ...files];

worker.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => worker.skipWaiting())
	);
});

worker.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => worker.clients.claim())
	);
});

worker.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return; // POST/PATCH/DELETE (API) selalu ke jaringan

	const url = new URL(request.url);
	if (url.origin !== location.origin) return; // hanya same-origin

	// API tidak pernah di-cache — data tamu/ucapan harus segar
	if (url.pathname.startsWith('/api/')) return;

	// Navigasi: network-first, fallback ke cache (offline shell)
	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request)
				.then((res) => {
					const copy = res.clone();
					caches.open(CACHE).then((cache) => cache.put(request, copy));
					return res;
				})
				.catch(() => caches.match(request).then((r) => r || caches.match('/')))
		);
		return;
	}

	// Aset statis/build: cache-first dengan pembaruan di latar belakang
	event.respondWith(
		caches.match(request).then((cached) => {
			const network = fetch(request)
				.then((res) => {
					if (res.ok) {
						const copy = res.clone();
						caches.open(CACHE).then((cache) => cache.put(request, copy));
					}
					return res;
				})
				.catch(() => cached);
			return cached || network;
		})
	);
});