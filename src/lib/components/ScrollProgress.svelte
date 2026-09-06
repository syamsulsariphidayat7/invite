<script lang="ts">
	import { onMount } from 'svelte';

	let w = $state(0);

	onMount(() => {
		const upd = () => {
			const h = document.documentElement.scrollHeight - window.innerHeight;
			w = h > 0 ? (window.scrollY / h) * 100 : 0;
		};
		window.addEventListener('scroll', upd, { passive: true });
		window.addEventListener('resize', upd);
		upd();
		return () => {
			window.removeEventListener('scroll', upd);
			window.removeEventListener('resize', upd);
		};
	});
</script>

<div class="scroll-progress" style="width:{w}%" aria-hidden="true"></div>

<style>
	.scroll-progress {
		position: fixed;
		top: 0;
		left: 0;
		height: 3px;
		z-index: 110;
		background: linear-gradient(90deg, var(--green-700), var(--green-600));
		border-radius: 0 999px 999px 0;
		pointer-events: none;
		transition: width 0.08s linear;
	}
</style>
