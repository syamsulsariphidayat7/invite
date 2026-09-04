<script lang="ts">
	let { size = 17 }: { size?: number } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	<rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
	<circle cx="12" cy="12" r="4.2" />
	<circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" />
</svg>

<style>
	svg {
		display: block;
	}
</style>
