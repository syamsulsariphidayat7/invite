import type { Component } from 'svelte';
import type { LayoutProps } from './types';
import ClassicLayout from './classic/Layout.svelte';
import RoseLayout from './rose/Layout.svelte';

/**
 * Registry layout: pilih komponen berdasarkan kolom `template` undangan.
 * Semua layout menerima shape data yang sama (LayoutProps) — menambah layout
 * baru = menambah folder + daftarkan di sini, tanpa mengubah cara data diambil.
 */
export const layouts: Record<string, Component<LayoutProps>> = {
	classic: ClassicLayout,
	rose: RoseLayout
};