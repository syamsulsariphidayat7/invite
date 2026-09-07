import { wedding, calendarUrl as defaultCalendarUrl } from './wedding';

export type ResolvedWedding = typeof wedding & {
	resolved: boolean;
	calendarUrlResolved: string;
};

function pick<T>(v: T | null | undefined, fallback: T): T {
	if (v === null || v === undefined) return fallback;
	if (typeof v === 'string' && !v.trim()) return fallback;
	return v;
}

export function resolveWedding(dataJson: Record<string, unknown> | null | undefined): ResolvedWedding {
	if (!dataJson || Object.keys(dataJson).length === 0) {
		return { ...wedding, resolved: false, calendarUrlResolved: defaultCalendarUrl };
	}
	const dj = dataJson as Record<string, unknown>;
	const couple = (dj.couple as Record<string, Record<string, string>> | undefined) ?? {};
	const brideDj = couple.bride ?? {};
	const groomDj = couple.groom ?? {};
	const verseDj = (dj.verse as Record<string, string> | null | undefined) ?? null;
	const eventsDj = Array.isArray(dj.events) ? (dj.events as { name?: string; date?: string; time?: string; location?: string; map_url?: string }[]) : [];
	const giftsDj = Array.isArray(dj.gifts) ? (dj.gifts as { provider?: string; owner?: string; number?: string }[]) : [];
	const galleryDj = Array.isArray(dj.gallery) ? (dj.gallery as string[]) : null;
	const themeDj = (dj.theme as Record<string, string> | undefined) ?? {};
	const musicUrl = (dj.music_url as string | null | undefined) ?? null;
	const storyIntro = (dj.love_story_intro as string | undefined) ?? null;
	const storyDj = Array.isArray(dj.love_story) ? (dj.love_story as { title?: string; text?: string }[]) : null;
	const livestream = (dj.livestream_url as string | null | undefined) ?? null;

	const bride = {
		...wedding.bride,
		name: pick(brideDj.name, wedding.bride.name),
		fullName: pick(brideDj.full_name, wedding.bride.fullName),
		relation: pick(brideDj.relation, wedding.bride.relation),
		instagram: brideDj.instagram ?? wedding.bride.instagram,
		whatsapp: brideDj.whatsapp ?? wedding.bride.whatsapp
	};
	const groom = {
		...wedding.groom,
		name: pick(groomDj.name, wedding.groom.name),
		fullName: pick(groomDj.full_name, wedding.groom.fullName),
		relation: pick(groomDj.relation, wedding.groom.relation),
		instagram: groomDj.instagram ?? wedding.groom.instagram,
		whatsapp: groomDj.whatsapp ?? wedding.groom.whatsapp
	};

	const verse = verseDj === null ? null : {
		arabic: pick(verseDj.arabic, wedding.verse.arabic),
		translation: pick(verseDj.translation, wedding.verse.translation),
		source: pick(verseDj.source, wedding.verse.source)
	};

	const photos = {
		...wedding.photos,
		gallery: galleryDj && galleryDj.length > 0 ? galleryDj : wedding.photos.gallery
	};

	const story = storyDj && storyDj.length > 0 ? {
		intro: pick(storyIntro, wedding.story.intro),
		chapters: storyDj.map((c) => ({ title: pick(c.title, ''), text: pick(c.text, '') })).filter((c) => c.title || c.text)
	} : storyIntro !== null ? { intro: pick(storyIntro, wedding.story.intro), chapters: wedding.story.chapters } : wedding.story;
	if (story.chapters.length === 0) story.chapters = wedding.story.chapters;

	const gift = giftsDj.length > 0 ? {
		note: wedding.gift.note,
		accounts: giftsDj.filter((g) => g.number?.trim()).map((g) => ({ bank: (g.provider ?? 'DANA').toUpperCase(), number: g.number!.trim(), holder: g.owner ?? '' }))
	} : wedding.gift;

	const namesShort = bride.name && groom.name ? `${bride.name} & ${groom.name}` : wedding.namesShort;

	let akad = wedding.akad;
	let resepsi = wedding.resepsi;
	let venue = wedding.venue;
	let eventCount = 0;
	if (eventsDj.length > 0) {
		const filtered = eventsDj.filter((e) => e.name?.trim() || e.date?.trim());
		eventCount = filtered.length;
		const mapped = filtered.map((e) => ({
			title: e.name ?? '',
			dayLabel: e.date ? new Date(e.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '',
			time: e.time ?? '',
			dateISO: e.date ? new Date(e.date + 'T08:00:00+07:00').toISOString() : wedding.resepsi.dateISO
		}));
		if (mapped.length >= 1) {
			if (mapped.length === 1) {
				resepsi = { ...wedding.resepsi, title: mapped[0].title || wedding.resepsi.title, dayLabel: mapped[0].dayLabel || wedding.resepsi.dayLabel, time: mapped[0].time || wedding.resepsi.time, dateISO: mapped[0].dateISO };
				akad = { ...wedding.akad, dayLabel: '' } as typeof wedding.akad;
			} else {
				akad = { ...wedding.akad, title: mapped[0].title || wedding.akad.title, dayLabel: mapped[0].dayLabel || wedding.akad.dayLabel, time: mapped[0].time || wedding.akad.time, dateISO: mapped[0].dateISO };
				resepsi = { ...wedding.resepsi, title: mapped[1].title || wedding.resepsi.title, dayLabel: mapped[1].dayLabel || wedding.resepsi.dayLabel, time: mapped[1].time || wedding.resepsi.time, dateISO: mapped[1].dateISO };
			}
		}
		const loc = eventsDj.find((e) => e.location?.trim())?.location?.trim();
		const murl = eventsDj.find((e) => e.map_url?.trim())?.map_url?.trim();
		if (loc || murl) venue = { name: loc ? loc.split(',')[0].slice(0, 80) : wedding.venue.name, address: loc ?? wedding.venue.address, mapsUrl: murl ?? wedding.venue.mapsUrl };
	}

	const music = musicUrl !== null ? { src: musicUrl, youtubeId: '', startSeconds: wedding.music.startSeconds } : wedding.music;

	let calendarUrlResolved = defaultCalendarUrl;
	try {
		if (eventsDj.length > 0) {
			const d = eventsDj[0]?.date ? new Date(eventsDj[0].date) : new Date(wedding.resepsi.dateISO);
			const s = new Date(d); s.setHours(10, 0, 0, 0);
			const e = new Date(d); e.setHours(21, 0, 0, 0);
			const fmt = (x: Date) => x.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
			calendarUrlResolved = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Undangan Pernikahan ${namesShort}`)}&dates=${fmt(s)}/${fmt(e)}&details=${encodeURIComponent(`${resepsi.dayLabel}, ${resepsi.time}\n\n${venue.name}\n${venue.address}`)}&location=${encodeURIComponent(`${venue.name}, ${venue.address}`)}`;
		}
	} catch {}

	const accent = themeDj.primary ?? null;
	const paper2 = themeDj.secondary ?? null;

	return {
		...wedding,
		bride, groom, namesShort, verse: verse as typeof wedding.verse, photos, story, gift, akad, resepsi, venue, music: music as typeof wedding.music,
		siteTitle: `The Wedding of ${namesShort}`,
		resolved: true,
		eventCount,
		calendarUrlResolved,
		_livestream: livestream,
		_theme: { primary: accent, secondary: paper2 }
	} as ResolvedWedding;
}
