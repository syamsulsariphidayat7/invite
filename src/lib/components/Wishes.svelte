<script lang="ts">
	import { Send, CheckCircle2, AlertCircle, PartyPopper } from 'lucide-svelte';
	import { wedding } from '$lib/data/wedding';
	import Ornament from './Ornament.svelte';
	import type { Wish } from '$lib/data/wedding';

	let {
		initialWishes = [],
		initialTotal = 0
	}: { initialWishes?: Wish[]; initialTotal?: number } = $props();

	let wishes = $state<Wish[]>(initialWishes);
	let total = $state(initialTotal);

	let name = $state('');
	let attendance = $state<'' | 'hadir' | 'tidak'>('');
	let message = $state('');
	let busy = $state(false);
	let status = $state<{ kind: 'idle' | 'error' | 'ok'; text: string }>({ kind: 'idle', text: '' });

	const fmt = new Intl.DateTimeFormat('id-ID', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});

	function validate(): string | null {
		if (name.trim().length < wedding.wishes.minName) return `Nama minimal ${wedding.wishes.minName} karakter.`;
		if (attendance !== 'hadir' && attendance !== 'tidak')
			return 'Silakan pilih konfirmasi kehadiran terlebih dahulu.';
		if (message.trim().length < wedding.wishes.minMessage)
			return `Ucapan minimal ${wedding.wishes.minMessage} karakter.`;
		return null;
	}

	async function submit() {
		const problem = validate();
		if (problem) {
			status = { kind: 'error', text: problem };
			return;
		}
		busy = true;
		status = { kind: 'idle', text: '' };
		try {
			const res = await fetch('/api/wishes', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name: name.trim(), attendance, message: message.trim() })
			});
			const data = await res.json();
			if (!res.ok) {
				status = { kind: 'error', text: data?.message ?? 'Terjadi kesalahan. Coba lagi ya.' };
				return;
			}
			wishes = [data.wish, ...wishes];
			total += 1;
			name = '';
			attendance = '';
			message = '';
			status = { kind: 'ok', text: 'Terima kasih atas doa & ucapannya 🙏' };
		} catch {
			status = { kind: 'error', text: 'Gagal mengirim. Periksa koneksi lalu coba lagi.' };
		} finally {
			busy = false;
		}
	}
</script>

<section id="wishes" class="wishes" aria-label="Ucapan dan doa">
	<div class="wrap">
		<p class="kicker" data-reveal>~ Best Wishes ~</p>
		<h2 class="section-title" data-reveal style="--d:.06s">Kirim Ucapan & Doa</h2>
		<Ornament tone="green" />

		<div class="counter" data-reveal style="--d:.1s">
			<PartyPopper size={14} />
			{total} Ucapan
		</div>

		<div class="cols">
			<!-- ============ FORM ============ -->
			<form class="form" data-reveal onsubmit={(e) => { e.preventDefault(); submit(); }}>
				<p class="note">* {wedding.wishes.note} *<br />Minimal {wedding.wishes.minMessage} karakter.</p>

				<label>
					<span>Nama</span>
					<input
						type="text"
						bind:value={name}
						maxlength="120"
						placeholder="Nama kamu"
						autocomplete="name"
					/>
				</label>

				<fieldset>
					<legend>Konfirmasi Kehadiran</legend>
					<div class="attend">
						<button
							type="button"
							class:on={attendance === 'hadir'}
							class="attend-btn hadir"
							aria-pressed={attendance === 'hadir'}
							onclick={() => (attendance = 'hadir')}
						>
							Hadir
						</button>
						<button
							type="button"
							class:on={attendance === 'tidak'}
							class="attend-btn tidak"
							aria-pressed={attendance === 'tidak'}
							onclick={() => (attendance = 'tidak')}
						>
							Tidak Hadir
						</button>
					</div>
				</fieldset>

				<label>
					<span>Ucapan & Doa</span>
					<textarea
						bind:value={message}
						rows="4"
						maxlength="1000"
						placeholder="Tulis ucapan dan doa restu untuk kami…"
					></textarea>
				</label>

				{#if status.kind === 'error'}
					<p class="msg error"><AlertCircle size={14} /> {status.text}</p>
				{:else if status.kind === 'ok'}
					<p class="msg ok"><CheckCircle2 size={14} /> {status.text}</p>
				{/if}

				<button class="btn btn-green submit" type="submit" disabled={busy}>
					<Send size={15} />
					{busy ? 'Mengirim…' : 'Kirim Ucapan'}
				</button>
			</form>

			<!-- ============ DAFTAR ============ -->
			<div class="list" data-reveal style="--d:.12s">
				{#if wishes.length === 0}
					<p class="empty">Belum ada ucapan. Jadilah yang pertama memberikan doa terbaik 🕊️</p>
				{:else}
					{#each wishes as w}
						<article class="wish">
							<span class="avatar" style="--hue:{(w.name.charCodeAt(0) * 47) % 360}">
								{w.name.trim().charAt(0).toUpperCase()}
							</span>
							<div class="body">
								<header>
									<strong>{w.name}</strong>
									<span class="chip" class:hadir={w.attendance === 'hadir'}>
										{w.attendance === 'hadir' ? 'Hadir' : 'Tidak Hadir'}
									</span>
									<time datetime={w.createdAt}>{fmt.format(new Date(w.createdAt))}</time>
								</header>
								<p class="text">{w.message}</p>
							</div>
						</article>
					{/each}
				{/if}
			</div>
		</div>
	</div>
</section>

<style>
	.wishes {
		padding: 5.5rem 0;
		background: var(--paper);
	}

	.counter {
		display: flex;
		align-items: center;
		gap: 0.45em;
		margin: 0 auto 2.4rem;
		background: var(--green-100);
		color: var(--green-700);
		font-size: 13px;
		font-weight: 500;
		border-radius: 999px;
		padding: 0.45em 1.2em;
		width: fit-content;
	}

	.cols {
		display: grid;
		gap: 2.6rem;
	}

	@media (min-width: 900px) {
		.cols {
			grid-template-columns: 380px 1fr;
			gap: 3rem;
			align-items: start;
		}
	}

	/* form */
	.form {
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 24px;
		box-shadow: var(--shadow-1);
		padding: 1.8rem 1.6rem;
		display: grid;
		gap: 1.1rem;
	}

	.form .note {
		margin: 0;
		font-size: 12px;
		text-align: center;
		color: var(--ink-3);
		line-height: 1.7;
	}

	.form label span,
	.form legend {
		display: block;
		font-size: 12.5px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-2);
		margin-bottom: 0.45rem;
	}

	.form input,
	.form textarea {
		width: 100%;
		border: 1px solid var(--line);
		border-radius: 12px;
		background: #fffdf9;
		padding: 0.75em 1em;
		font-family: var(--font-body);
		font-size: 14.5px;
		color: var(--ink);
		resize: vertical;
		box-sizing: border-box;
	}

	.form input:focus,
	.form textarea:focus {
		outline: none;
		border-color: var(--gold-2);
		box-shadow: 0 0 0 3px rgba(197, 178, 151, 0.22);
	}

	.form fieldset {
		border: 0;
		padding: 0;
		margin: 0;
	}

	.attend {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.6rem;
	}

	.attend-btn {
		border: 1px solid var(--line);
		background: #fffdf9;
		color: var(--ink-2);
		border-radius: 999px;
		padding: 0.65em 0.5em;
		font-size: 13.5px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.attend-btn.hadir.on {
		background: var(--green-100);
		border-color: var(--green-600);
		color: var(--green-700);
		font-weight: 600;
	}

	.attend-btn.tidak.on {
		background: var(--rose-100);
		border-color: var(--rose);
		color: #a56a76;
		font-weight: 600;
	}

	.msg {
		display: flex;
		align-items: center;
		gap: 0.5em;
		margin: 0;
		font-size: 13px;
		border-radius: 10px;
		padding: 0.6em 0.9em;
	}

	.msg.error {
		background: var(--rose-100);
		color: #a04352;
	}

	.msg.ok {
		background: var(--green-100);
		color: var(--green-700);
	}

	.submit {
		width: 100%;
	}

	.submit:disabled {
		opacity: 0.6;
		cursor: default;
	}

	/* daftar ucapan */
	.list {
		display: grid;
		gap: 1rem;
		max-height: 640px;
		overflow-y: auto;
		padding-right: 0.3rem;
	}

	.empty {
		text-align: center;
		color: var(--ink-3);
		font-family: var(--font-serif);
		font-style: italic;
		padding: 2rem 1rem;
		border: 1px dashed var(--line);
		border-radius: 18px;
	}

	.wish {
		display: flex;
		gap: 0.9rem;
		background: var(--card);
		border: 1px solid var(--line-soft);
		border-radius: 16px;
		padding: 1rem 1.1rem;
		box-shadow: var(--shadow-1);
	}

	.avatar {
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		font-family: var(--font-serif);
		font-weight: 600;
		color: #fff;
		background: hsl(var(--hue) 38% 55%);
	}

	.body {
		min-width: 0;
		flex: 1;
	}

	.body header {
		display: flex;
		align-items: center;
		gap: 0.55em;
		flex-wrap: wrap;
	}

	.body header strong {
		color: var(--ink);
		font-size: 14.5px;
	}

	.body time {
		margin-left: auto;
		font-size: 11px;
		color: var(--ink-3);
	}

	.chip {
		font-size: 10.5px;
		border-radius: 999px;
		padding: 0.15em 0.7em;
		background: var(--rose-100);
		color: #a56a76;
	}

	.chip.hadir {
		background: var(--green-100);
		color: var(--green-700);
	}

	.text {
		margin: 0.5rem 0 0;
		font-size: 14px;
		line-height: 1.75;
		color: var(--ink-2);
		white-space: pre-line;
		word-break: break-word;
	}
</style>
