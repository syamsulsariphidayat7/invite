<script lang="ts">
	let { tone = 'gold' }: { tone?: 'gold' | 'light' | 'green' } = $props();
	const stroke = $derived(
		tone === 'light' ? 'rgba(255,255,255,.75)' : tone === 'green' ? 'var(--green-600)' : 'var(--gold-2)'
	);
</script>

<svg
	class="orn"
	width="260"
	height="34"
	viewBox="0 0 260 34"
	fill="none"
	aria-hidden="true"
	{...{ 'data-ornament': true }}
>
	<!-- garis kiri -->
	<path d="M8 17 H96" stroke={stroke} stroke-width="1" stroke-linecap="round" opacity=".8" />
	<path d="M14 9 C 22 9 22 25 14 25 M22 9 C 30 9 30 25 22 25" stroke={stroke} stroke-width="1" opacity=".6" />
	<!-- daun kiri -->
	<path
		d="M98 17 C 104 6 120 4 128 17 C 120 30 104 28 98 17 Z"
		stroke={stroke}
		stroke-width="1"
		transform="translate(2 0)"
		opacity=".85"
	/>
	<path d="M118 9 C 124 13 124 21 118 24" stroke={stroke} stroke-width="1" opacity=".6" />
	<!-- inti -->
	<circle cx="130" cy="17" r="3" fill={stroke} />
	<circle cx="130" cy="17" r="7.5" stroke={stroke} stroke-width="1" opacity=".55" />
	<!-- daun kanan -->
	<path
		d="M162 17 C 156 6 140 4 132 17 C 140 30 156 28 162 17 Z"
		stroke={stroke}
		stroke-width="1"
		opacity=".85"
	/>
	<path d="M142 9 C 136 13 136 21 142 24" stroke={stroke} stroke-width="1" opacity=".6" />
	<!-- garis kanan -->
	<path d="M164 17 H252" stroke={stroke} stroke-width="1" stroke-linecap="round" opacity=".8" />
	<path d="M238 9 C 230 9 230 25 238 25 M246 9 C 238 9 238 25 246 25" stroke={stroke} stroke-width="1" opacity=".6" />
</svg>

<style>
	.orn {
		display: block;
		margin: 0 auto;
		max-width: 100%;
	}
</style>
