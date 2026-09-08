// ============================================================================
// KONFIGURASI UNDANGAN — ubah semua konten undangan di file ini.
// Untuk tema/undangan lain di masa depan, salin file ini sebagai template
// (lihat README.md bagian "Arsitektur multi-tema").
// ============================================================================

export interface Person {
	name: string;
	fullName: string;
	relation: string; // mis. "Putri Bungsu dari Bapak ... & Ibu ..."
	photo: string; // nama dasar file di /static/photos (tanpa ekstensi)
	instagram: string; // URL / handle, kosongkan untuk disembunyikan
	whatsapp: string; // URL wa.me, kosongkan untuk disembunyikan
}

export interface EventDetail {
	title: string;
	dayLabel: string; // tampilan tanggal
	time: string;
	dateISO: string; // dipakai countdown & calendar
}

export interface BankAccount {
	bank: string;
	number: string;
	holder: string;
}

export interface StoryChapter {
	title: string;
	text: string;
}

export interface Wish {
	id: number;
	name: string;
	attendance: 'hadir' | 'tidak' | '';
	message: string;
	guests: number;
	createdAt: string;
}

export const wedding = {
	slug: 'ruhaeni-roni',
	siteTitle: 'The Wedding of Ruhaeni & Roni',
	metaDescription:
		'Undangan pernikahan Ruhaeni & Roni — Resepsi 21 September 2026.',

	// ---- Mempelai ----
	bride: {
		name: 'Ruhaeni',
		fullName: 'Ruhaeni',
		relation: 'Putri Bungsu dari\nBapak Nuryadin & Ibu Dedeh',
		photo: 'bride',
		instagram: 'https://www.instagram.com/_ruhaeni',
		whatsapp: ''
	} satisfies Person,

	groom: {
		name: 'Asep Roni',
		fullName: 'Asep Roni',
		relation: 'Putra Pertama dari\nBapak Badri & Ibu Suryati',
		photo: 'groom',
		instagram: 'https://www.instagram.com/ronii_wiguna',
		whatsapp: ''
	} satisfies Person,

	namesShort: 'Ruhaeni & Roni',

	// ---- Acara ----
	akad: {
		title: 'Akad Nikah',
		dayLabel: 'Minggu, 20 September 2026',
		time: 'Pukul 08.00 WIB',
		dateISO: '2026-09-20T08:00:00+07:00'
	} satisfies EventDetail,

	resepsi: {
		title: 'Resepsi',
		dayLabel: 'Senin, 21 September 2026',
		time: 'Pukul 10.00 WIB — Selesai',
		// end of resepsi, dipakai "Save the Date" ke Google Calendar
		dateISO: '2026-09-21T21:00:00+07:00'
	} satisfies EventDetail,

	venue: {
		name: 'Kediaman Mempelai Wanita',
		address: 'Kp. Pasanggrahan RT 03 RW 07, Desa Karangsari, Kecamatan Pakenjeng, Kabupaten Garut',
		mapsUrl: 'https://maps.app.goo.gl/TuB4MCeqsRw4Qu3L7'
	},

	// ---- Foto (nama dasar file di /static/photos, ekstensi otomatis dicoba:
	//      .jpg → .jpeg → .png → .webp → placeholder .svg) ----
	photos: {
		hero: 'hero',
		cover: 'hero', // latar sampul "Buka Undangan"
		bride: 'bride',
		groom: 'groom',
		gallery: [
			'gallery-1',
			'gallery-2',
			'gallery-3',
			'gallery-4',
			'gallery-5',
			'gallery-6',
			'gallery-7',
			'gallery-8',
			'gallery-9',
			'gallery-10',
			'gallery-11',
			'gallery-12'
		],
		heroSlides: ['hero', 'gallery-1', 'gallery-2', 'gallery-3', 'gallery-4']
	},

	// ---- Kutipan / Ayat ----
	verse: {
		arabic:
			'سُبْحَانَ الَّذِي خَلَقَ الْأَزْوَاجَ كُلَّهَا مِمَّا تُنبِتُ الْأَرْضُ وَمِنْ أَنفُسِهِمْ وَمِمَّا لَا يَعْلَمُونَ',
		translation:
			'Maha Suci Tuhan yang telah menciptakan pasangan-pasangan semuanya, baik dari apa yang ditumbuhkan oleh bumi dan dari diri mereka maupun dari apa yang tidak mereka ketahui.',
		source: '— QS. Yā-Sīn : 36'
	},

	// ---- Love Story ----
	story: {
		intro:
			'Tidak ada yang istimewa dalam cerita kami, tapi kami sangat istimewa untuk satu sama lain. Kami bersyukur dipertemukan Allah di waktu terbaik, dan kini kami menanti hari istimewa kami.',
		chapters: [
			{
				title: 'Pertemuan',
				text:
					'Berawal dari pesan singkat di sebuah aplikasi sosial media, dari chat tengah malam menjadi call sepanjang hari sampai akhirnya pertemuan pertama itu terjadi. Sungguh manis dan sederhana.'
			},
			{
				title: 'Komitmen',
				text:
					'Seiring berjalannya waktu, kami mulai mengenal satu sama lain lebih dalam. Obrolan kecil berubah menjadi tawa panjang, kami belajar saling memahami, memaafkan, menguatkan dan tumbuh bersama menjadi versi diri kami masing-masing, sampai pada titik yakin "dialah orangnya".'
			},
			{
				title: 'Menikah',
				text:
					'Kini saatnya kami mengikat janji suci. Menikah bukanlah akhir, melainkan awal kisah ibadah terpanjang kami, karena cinta yang Tuhan pertemukan layak kami jaga seumur hidup.'
			}
		]
	},

	// ---- Amplop Digital ----
	gift: {
		note:
			'Doa restu Anda merupakan karunia yang sangat berarti bagi kami. Dan jika memberi adalah ungkapan tanda kasih, Anda dapat memberi kado secara cashless.',
		accounts: [
			{ bank: 'DANA', number: '085724087380', holder: 'Ruhaeni' },
			{ bank: 'DANA', number: '085624398337', holder: 'Asep Roni' }
		] satisfies BankAccount[]
	},

	// ---- Ucapan & Doa ----
	wishes: {
		minName: 2,
		minMessage: 2,
		note: 'Khusus untuk tamu undangan'
	},

	// ---- Musik latar ----
	// Offline: file di /static/audio/wedding.mp3 → diakses sebagai /audio/wedding.mp3
	// youtubeId opsional sebagai fallback bila src kosong.
	// Bisa diisi ID mentah (dQw4w9WgXcQ) ATAU link YouTube lengkap
	// (https://youtu.be/... atau https://www.youtube.com/watch?v=...) — ID diekstrak otomatis.
	music: {
		src: '/audio/wedding.mp3',
		youtubeId: '',
		startSeconds: 5
	},

	// ---- Sosial umum (footer) ----
	social: {
		whatsapp: 'https://wa.me/', // mis. https://wa.me/62812xxxx
		instagram: 'https://www.instagram.com/' // mis. https://instagram.com/username
	},

};

// Alamat lengkap yang dipakai tombol "Save The Date" (Google Calendar)
// Resepsi 21 Sep 2026 10.00 WIB (= 03.00 UTC) s/d selesai 21.00 WIB (14.00 UTC)
export const calendarUrl =
	'https://calendar.google.com/calendar/render?action=TEMPLATE' +
	`&text=${encodeURIComponent('Undangan Pernikahan Ruhaeni & Roni')}` +
	'&dates=20260921T030000Z/20260921T140000Z' +
	`&details=${encodeURIComponent(
		`Resepsi: ${wedding.resepsi.dayLabel}, ${wedding.resepsi.time}\n\n${wedding.venue.name}\n${wedding.venue.address}`
	)}` +
	`&location=${encodeURIComponent(`${wedding.venue.name}, ${wedding.venue.address}`)}`;
