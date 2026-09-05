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
	createdAt: string;
}

export const wedding = {
	slug: 'ruhaeni-roni',
	siteTitle: 'The Wedding of Ruhaeni & Roni',
	metaDescription:
		'Undangan pernikahan Ruhaeni & Roni — Akad 20 September 2026, Resepsi 21 September 2026.',

	// ---- Mempelai ----
	bride: {
		name: 'Ruhaeni',
		fullName: 'Ruhaeni',
		relation: 'Putri Bungsu dari\nBapak Nuryadin & Ibu Dedeh',
		photo: 'bride',
		instagram: '',
		whatsapp: ''
	} satisfies Person,

	groom: {
		name: 'Roni',
		fullName: 'Roni',
		relation: 'Putra Pertama dari\nBapak Badri & Ibu Suryati',
		photo: 'groom',
		instagram: '',
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
		mapsUrl: 'https://maps.google.com/?q=' +
			encodeURIComponent('Kp Pasanggrahan RT 03 RW 07 Desa Karangsari Kecamatan Pakenjeng Kabupaten Garut')
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
		]
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
		// TODO: ganti nomor rekening dengan nomor asli
		accounts: [
			{ bank: 'BCA', number: '1234567890', holder: 'Ruhaeni' },
			{ bank: 'BNI', number: '0987654321', holder: 'Roni' }
		] satisfies BankAccount[]
	},

	// ---- Ucapan & Doa ----
	wishes: {
		minName: 2,
		minMessage: 2,
		note: 'Khusus untuk tamu undangan'
	},

	// ---- Musik latar ----
	// Isi youtubeId dengan ID lagu YouTube (bisa privat/unlisted), atau kosongkan.
	// Saat ini: Christina Perri — A Thousand Years (video resmi).
	// Audio mengikuti pola "mulai dari detik ke-5".
	music: {
		youtubeId: 'rtOvBOTyX00',
		startSeconds: 5
	},

	// ---- Sosial umum (footer) ----
	social: {
		whatsapp: 'https://wa.me/', // mis. https://wa.me/62812xxxx
		instagram: 'https://www.instagram.com/' // mis. https://instagram.com/username
	},

	// ---- Filter Instagram (kosongkan untuk menyembunyikan blok) ----
	instagramFilterUrl: ''
};

// Alamat lengkap yang dipakai tombol "Save The Date" (Google Calendar)
// Mulai: Akad 20 Sep 2026 08.00 WIB (= 01.00 UTC) s/d akhir Resepsi 21 Sep 2026 (14.00 UTC)
export const calendarUrl =
	'https://calendar.google.com/calendar/render?action=TEMPLATE' +
	`&text=${encodeURIComponent('Undangan Pernikahan Ruhaeni & Roni')}` +
	'&dates=20260920T010000Z/20260921T140000Z' +
	`&details=${encodeURIComponent(
		`Akad Nikah: ${wedding.akad.dayLabel}, ${wedding.akad.time}\nResepsi: ${wedding.resepsi.dayLabel}, ${wedding.resepsi.time}\n\n${wedding.venue.name}\n${wedding.venue.address}`
	)}` +
	`&location=${encodeURIComponent(`${wedding.venue.name}, ${wedding.venue.address}`)}`;
