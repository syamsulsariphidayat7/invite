import { wedding } from '$lib/data/wedding';
import type { Wish } from '$lib/data/wedding';

/** Shape data yang sama diterima SEMUA layout (kontrak Fase 6). */
export interface LayoutProps {
	/** hasil resolveWedding(data_json) — typeof wedding + metadata (_theme, _livestream, ...) */
	resolved: typeof wedding;
	/** URL/nama galeri (dari data_json.gallery), fallback default di dalam layout */
	gallery?: string[] | null;
	/** ucapan awal (paginasi client) */
	wishes?: Wish[];
	total?: number;
	/** nama tamu dari ?to= */
	guest?: string;
	slug?: string;
}