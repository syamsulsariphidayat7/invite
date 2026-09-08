// Manifest PWA dinamis per-undangan: start_url menunjuk langsung ke halaman kelola
// sehingga aplikasi ter-install membuka `/{slug}/kelola` (PIN terbaca dari localStorage).
export function GET({ params }) {
	const slug = params.slug;
	const manifest = {
		name: `Kelola Tamu Undangan ${slug}`,
		short_name: 'Kelola Tamu',
		description: 'Panel kelola daftar tamu undangan pernikahan',
		id: `/${slug}/kelola`,
		start_url: `/${slug}/kelola`,
		scope: `/${slug}/kelola/`,
		display: 'standalone',
		orientation: 'portrait',
		lang: 'id',
		background_color: '#f4f6f8',
		theme_color: '#2563eb',
		icons: [
			{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
			{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
			{ src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
		]
	};
	return new Response(JSON.stringify(manifest), {
		headers: {
			'content-type': 'application/manifest+json; charset=utf-8',
			'cache-control': 'no-cache'
		}
	});
}