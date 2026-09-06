import { json, error } from '@sveltejs/kit';
import { addWish, countWishes, listWishes } from '$lib/server/wishes';
import { wedding } from '$lib/data/wedding';

export async function GET() {
	const [wishes, total] = await Promise.all([
		listWishes(wedding.slug),
		countWishes(wedding.slug)
	]);
	return json({ wishes, total });
}

export async function POST({ request }) {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Format data tidak valid.');
	}

	const { name, attendance, message, guests } = (body ?? {}) as {
		name?: unknown;
		attendance?: unknown;
		message?: unknown;
		guests?: unknown;
	};

	if (typeof name !== 'string' || name.trim().length < wedding.wishes.minName) {
		error(400, `Nama minimal ${wedding.wishes.minName} karakter.`);
	}
	if (typeof message !== 'string' || message.trim().length < wedding.wishes.minMessage) {
		error(400, `Ucapan minimal ${wedding.wishes.minMessage} karakter.`);
	}
	const attendanceNorm = typeof attendance === 'string' ? attendance.toLowerCase() : '';
	if (attendanceNorm !== 'hadir' && attendanceNorm !== 'tidak') {
		error(400, 'Silakan pilih konfirmasi kehadiran.');
	}
	let guestsNum = 0;
	if (attendanceNorm === 'hadir') {
		guestsNum = typeof guests === 'number' ? guests : Number(guests);
		if (!Number.isFinite(guestsNum) || guestsNum < 1 || guestsNum > 10) {
			error(400, 'Jumlah kehadiran 1-10 orang.');
		}
		guestsNum = Math.floor(guestsNum);
	}

	const wish = await addWish(wedding.slug, {
		name: name.trim().slice(0, 120),
		attendance: attendanceNorm as 'hadir' | 'tidak',
		message: message.trim().slice(0, 1000),
		guests: guestsNum
	});

	return json({ success: true, wish }, { status: 201 });
}
