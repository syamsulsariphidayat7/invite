// Metadata template layout — dipakai admin (dropdown) & validasi nama layout.
// Komponen layout terpisah di registry.ts supaya admin tidak memuat komponen berat.
export interface TemplateMeta {
	id: string;
	label: string;
	description: string;
	/** warna preview (swatch) di dropdown admin */
	swatch: string[];
}

export const templateMeta: TemplateMeta[] = [
	{
		id: 'classic',
		label: 'Classic',
		description: 'Elegan abu-botani, tekstur batik',
		swatch: ['#3a3a3a', '#f5f5f5', '#6b6b6b']
	},
	{
		id: 'rose',
		label: 'Rose',
		description: 'Romantis burgundy-emas, hangat',
		swatch: ['#5e1224', '#fdf7f2', '#c9a24b']
	}
	// noir & botanical menyusul (Fase 6 lanjutan)
];

export const DEFAULT_TEMPLATE = 'classic';

export const templateById = new Map(templateMeta.map((t) => [t.id, t]));

export function isKnownTemplate(id: string | null | undefined): id is string {
	return !!id && templateById.has(id);
}