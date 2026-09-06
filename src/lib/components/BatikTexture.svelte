<script lang="ts">
	let {
		variant = 'light',
		opacity = 0.16,
		size = 440
	}: { variant?: 'light' | 'dark'; opacity?: number; size?: number } = $props();
</script>

<div
	class="batik"
	class:dark={variant === 'dark'}
	aria-hidden="true"
	style="--o:{opacity};--sz:{size}px"
></div>

<style>
	.batik {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 0;
		opacity: var(--o);
		background-repeat: no-repeat;
		background-size: cover;
		background-position: center;
		background-image: url('/batik/batik-semen.png');
	}

	.batik.dark {
		background-image: url('/batik/batik-semen.png');
		opacity: calc(var(--o) * 0.72);
		filter: invert(1) brightness(1.15) contrast(1.05);
	}
</style>
