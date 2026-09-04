<script lang="ts">
	import { MapPin, Clock, CalendarDays } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { wedding } from '$lib/data/wedding';
	import Ornament from './Ornament.svelte';

	const target = new Date(wedding.akad.dateISO).getTime();

	let left = $state({ d: 0, h: 0, m: 0, s: 0 });

	onMount(() => {
		const tick = () => {
			const diff = Math.max(0, target - Date.now());
			left = {
				d: Math.floor(diff / 86_400_000),
				h: Math.floor((diff / 3_600_000) % 24),
				m: Math.floor((diff / 60_000) % 60),
				s: Math.floor((diff / 1000) % 60)
			};
		};
		tick();
		const t = setInterval(tick, 1000);
		return () => clearInterval(t);
	});

	const units = $derived([
		{ label: 'Hari', value: left.d },
		{ label: 'Jam', value: left.h },
		{ label: 'Menit', value: left.m },
		{ label: 'Detik', value: left.s }
	]);

	const pad = (n: number) => String(n).padStart(2, '0');

	const events = [
		{
			...wedding.akad,
			icon: 'akad'
		},
		{
			...wedding.resepsi,
			icon: 'resepsi'
		}
	];
</script>

<section id="event" class="events" aria-label="Jadwal acara">
	<!-- ============ COUNTDOWN ============ -->
	<div class="countdown-block wrap">
		<p class="kicker" data-reveal>Wedding Event</p>
		<h2 class="section-title" data-reveal style="--d:.06s">Our Special Wedding Event</h2>
		<p class="lead" data-reveal style="--d:.12s">
			Mohon doa & restunya untuk acara yang akan diselenggarakan pada:
		</p>
		<p class="big-date" data-reveal style="--d:.18s">{wedding.akad.dayLabel}</p>

		<div class="countdown" data-reveal style="--d:.24s">
			{#each units as u}
				<div class="unit">
					<span class="digits">{pad(u.value)}</span>
					<span class="label">{u.label}</span>
				</div>
				{#if u !== units[units.length - 1]}<span class="sep" aria-hidden="true">:</span>{/if}
			{/each}
		</div>
	</div>

	<!-- ============ KARTU ACARA ============ -->
	<div class="cards wrap">
		{#each events as ev, i}
			<article class="card" data-reveal style="--d:{i * 0.1}s">
				<Ornament tone="green" />
				<div class="badge">
					{#if ev.icon === 'akad'}
						<CalendarDays size={20} />
					{:else}
						<Clock size={20} />
					{/if}
				</div>
				<h3 class="title">{ev.title}</h3>
				<p class="day">{ev.dayLabel}</p>
				<p class="time"><Clock size={14} /> {ev.time}</p>

				<div class="venue">
					<p class="venue-name"><MapPin size={15} /> {wedding.venue.name}</p>
					<p class="address">{wedding.venue.address}</p>
				</div>

				<a class="btn-map" href={wedding.venue.mapsUrl} target="_blank" rel="noopener">
					<MapPin size={15} />
					Lihat Map
				</a>
			</article>
		{/each}
	</div>
</section>

<style>
	.events {
		padding: 5rem 0 4.5rem;
		background:
			linear-gradient(180deg, var(--paper) 0%, var(--paper-2) 30%);
	}

	.countdown-block {
		text-align: center;
	}

	.lead {
		margin: 1rem auto 0;
		max-width: 30em;
		font-size: 15px;
		color: var(--ink-2);
	}

	.big-date {
		margin: 1.6rem 0 2rem;
		font-family: var(--font-script);
		font-size: clamp(30px, 8vw, 46px);
		color: var(--green-700);
		line-height: 1.2;
	}

	.countdown {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
	}

	.unit {
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 16px;
		box-shadow: var(--shadow-1);
		padding: 0.7rem 0.4rem;
		width: clamp(62px, 19vw, 88px);
	}

	.digits {
		display: block;
		font-family: var(--font-display);
		font-weight: 400;
		font-size: clamp(26px, 7.5vw, 38px);
		color: var(--ink);
		line-height: 1.1;
		font-variant-numeric: tabular-nums;
	}

	.label {
		display: block;
		margin-top: 0.35rem;
		font-size: 10.5px;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--ink-3);
	}

	.sep {
		font-family: var(--font-display);
		color: var(--gold-3);
		font-size: 24px;
		padding-bottom: 22px;
	}

	.cards {
		display: grid;
		gap: 2.4rem;
		margin-top: 3.5rem;
	}

	@media (min-width: 820px) {
		.cards {
			grid-template-columns: 1fr 1fr;
			gap: 2rem;
			width: min(100% - 3rem, 860px);
		}
	}

	.card {
		position: relative;
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 26px;
		padding: 2.6rem 2.2rem 2.4rem;
		text-align: center;
		box-shadow: var(--shadow-1);
	}

	.badge {
		width: 46px;
		height: 46px;
		margin: 0 auto 0.9rem;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: var(--green-100);
		color: var(--green-700);
	}

	.title {
		margin: 0.2rem 0 0.4rem;
		font-family: var(--font-serif);
		font-weight: 600;
		font-size: clamp(22px, 5.5vw, 27px);
		color: var(--ink);
	}

	.day {
		margin: 0;
		font-family: var(--font-serif);
		font-style: italic;
		font-size: 16px;
		color: var(--gold-3);
	}

	.time {
		display: inline-flex;
		align-items: center;
		gap: 0.45em;
		margin: 0.6rem 0 1.2rem;
		font-size: 13.5px;
		letter-spacing: 0.04em;
		color: var(--ink-2);
	}

	.venue {
		border-top: 1px dashed var(--line);
		border-bottom: 1px dashed var(--line);
		padding: 1rem 0;
	}

	.venue-name {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		margin: 0;
		font-weight: 600;
		font-size: 14.5px;
		color: var(--ink);
	}

	.address {
		margin: 0.5rem auto 0;
		max-width: 26em;
		font-size: 13px;
		line-height: 1.8;
		color: var(--ink-2);
	}

	.btn-map {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		margin-top: 1.4rem;
		text-decoration: none;
		border: 1px solid var(--green-600);
		color: var(--green-700);
		border-radius: 999px;
		padding: 0.6em 1.5em;
		font-size: 13.5px;
		font-weight: 500;
		letter-spacing: 0.06em;
		transition: background 0.25s ease, color 0.25s ease;
	}

	.btn-map:hover {
		background: var(--green-700);
		color: #fff;
	}

	.card :global(.orn) {
		margin-bottom: 1rem;
		transform: scale(0.8);
	}
</style>
