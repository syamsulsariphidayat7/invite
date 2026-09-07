<script lang="ts">
	import { goto } from '$app/navigation';
	import { Lock, LogIn } from 'lucide-svelte';

	let pin = $state('');
	let err = $state('');
	let busy = $state(false);

	async function submit(e: Event) {
		e.preventDefault();
		if (!pin.trim()) {
			err = 'PIN wajib diisi.';
			return;
		}
		busy = true;
		err = '';
		try {
			const res = await fetch('/api/admin/login', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ pin: pin.trim() })
			});
			const j = await res.json().catch(() => null);
			if (!res.ok) {
				err = j?.message ?? 'Login gagal.';
				return;
			}
			await goto('/admin');
		} catch {
			err = 'Gagal terhubung ke server.';
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head><title>Admin Login — Boundless</title></svelte:head>

<div class="login">
	<div class="wrap">
		<div class="card">
			<Lock size={28} />
			<h1>Admin Login</h1>
			<p class="hint">Masukkan ADMIN_PIN dari env untuk mengelola undangan.</p>
			<form onsubmit={submit}>
				<input type="password" placeholder="PIN admin" bind:value={pin} autocomplete="current-password" />
				{#if err}<p class="err">{err}</p>{/if}
				<button type="submit" class="btn btn-green" disabled={busy}>
					<LogIn size={16} />{busy ? 'Memeriksa…' : 'Masuk'}
				</button>
			</form>
		</div>
	</div>
</div>

<style>
	.login {
		min-height: 100svh;
		display: grid;
		place-items: center;
		background: var(--paper);
		padding: 1.5rem;
	}
	.wrap {
		width: min(100%, 420px);
	}
	.card {
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 22px;
		padding: 2rem 1.6rem;
		text-align: center;
		box-shadow: var(--shadow-2);
		display: grid;
		gap: 0.8rem;
		place-items: center;
	}
	h1 {
		margin: 0;
		font-family: var(--font-serif);
		color: var(--ink);
		font-size: 22px;
	}
	.hint {
		margin: 0;
		font-size: 13px;
		color: var(--ink-2);
	}
	form {
		width: 100%;
		display: grid;
		gap: 0.7rem;
		margin-top: 0.4rem;
	}
	input {
		width: 100%;
		border: 1px solid var(--line);
		border-radius: 12px;
		padding: 0.75em 1em;
		font-size: 15px;
		box-sizing: border-box;
	}
	.err {
		margin: 0;
		font-size: 13px;
		color: #b91c1c;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 10px;
		padding: 0.5em 0.8em;
	}
</style>
