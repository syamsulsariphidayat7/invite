import { json, error } from '@sveltejs/kit';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';

function db() {
	const opts = { prepare: false, max: 5, idle_timeout: 20, connect_timeout: 10 };
	const m = env.DATABASE_URL.match(/postgresql:\/\/([^:]+):(.+)@([^:/]+):(\d+)\/([^?\s]+)/);
	let cfg: Record<string, unknown> | null = null;
	if (m) {
		let pw = m[2];
		try {
			if (pw.includes('%')) pw = decodeURIComponent(pw);
		} catch {}
		cfg = { user: m[1], password: pw, host: m[3], port: Number(m[4]), database: m[5] };
	}
	return cfg ? postgres({ ...(cfg as Record<string, string>), ...opts } as never) : postgres(env.DATABASE_URL, opts as never);
}

export async function GET({ locals, url }) {
	if (!locals.adminAuthed) error(401, 'Unauthorized');
	const slug = url.searchParams.get('slug')?.trim();
	if (!slug) error(400, 'slug required');
	const fmt = url.searchParams.get('format');
	if (fmt === 'xlsx' || fmt === 'pdf') {
		const type = url.searchParams.get('type') === 'ucapan' ? 'ucapan' : 'tamu';
		const slugSafe = slug.replace(/[^a-z0-9-]/g, '_');
		if (type === 'tamu') {
			const sql2 = db();
			const rows = (await sql2`SELECT name, sent, sent_at, created_at FROM invitation_guests WHERE wedding = ${slug} ORDER BY created_at ASC`) as unknown as { name: string; sent: boolean }[];
			if (fmt === 'xlsx') {
				const ExcelJS = await import('exceljs');
				const wb = new ExcelJS.Workbook();
				const ws = wb.addWorksheet('Tamu');
				ws.columns = [{ header: 'Nama', key: 'name', width: 32 }, { header: 'Terkirim', key: 'sent', width: 12 }];
				for (const r of rows) ws.addRow({ name: r.name, sent: r.sent ? 'Ya' : 'Belum' });
				ws.getRow(1).font = { bold: true };
				const buf = await wb.xlsx.writeBuffer();
				return new Response(buf as ArrayBuffer, { headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'content-disposition': `attachment; filename="${slugSafe}-tamu.xlsx"` } });
			} else {
				const { jsPDF } = await import('jspdf');
				const doc = new jsPDF();
				doc.setFontSize(14); doc.text(`Daftar Tamu — ${slug}`, 14, 16);
				doc.setFontSize(9); let y = 26;
				doc.text('Nama', 14, y); doc.text('Terkirim', 150, y); y += 6;
				for (const r of rows) { if (y > 280) { doc.addPage(); y = 16; } doc.text(r.name.slice(0, 60), 14, y); doc.text(r.sent ? 'Ya' : 'Belum', 150, y); y += 6; }
				const out = doc.output('arraybuffer');
				return new Response(out as ArrayBuffer, { headers: { 'content-type': 'application/pdf', 'content-disposition': `attachment; filename="${slugSafe}-tamu.pdf"` } });
			}
		} else {
			const sql2 = db();
			const rows = (await sql2`SELECT name, attendance, message, guests, created_at FROM guest_wishes WHERE wedding = ${slug} ORDER BY created_at DESC`) as unknown as { name: string; attendance: string; message: string }[];
			if (fmt === 'xlsx') {
				const ExcelJS = await import('exceljs');
				const wb = new ExcelJS.Workbook();
				const ws = wb.addWorksheet('Ucapan');
				ws.columns = [{ header: 'Nama', key: 'name', width: 24 }, { header: 'Kehadiran', key: 'attendance', width: 12 }, { header: 'Pesan', key: 'message', width: 60 }];
				for (const r of rows) ws.addRow({ name: r.name, attendance: r.attendance, message: r.message });
				ws.getRow(1).font = { bold: true };
				const buf = await wb.xlsx.writeBuffer();
				return new Response(buf as ArrayBuffer, { headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'content-disposition': `attachment; filename="${slugSafe}-ucapan.xlsx"` } });
			} else {
				const { jsPDF } = await import('jspdf');
				const doc = new jsPDF();
				doc.setFontSize(14); doc.text(`Ucapan — ${slug}`, 14, 16);
				let y = 26; doc.setFontSize(8);
				for (const r of rows) { if (y > 270) { doc.addPage(); y = 16; } doc.setFont('helvetica', 'bold'); doc.text(`${r.name} (${r.attendance})`, 14, y); y += 5; doc.setFont('helvetica', 'normal'); const lines = doc.splitTextToSize(r.message, 180); doc.text(lines, 14, y); y += lines.length * 5 + 4; }
				const out = doc.output('arraybuffer');
				return new Response(out as ArrayBuffer, { headers: { 'content-type': 'application/pdf', 'content-disposition': `attachment; filename="${slugSafe}-ucapan.pdf"` } });
			}
		}
	}
	const sql = db();
	const rows = (await sql`SELECT id, name, attendance, message, guests, created_at FROM guest_wishes WHERE wedding = ${slug} ORDER BY created_at DESC LIMIT 500`) as unknown as unknown[];
	return json({ wishes: rows });
}

export async function DELETE({ locals, url }) {
	if (!locals.adminAuthed) error(401, 'Unauthorized');
	const slug = url.searchParams.get('slug')?.trim();
	if (!slug) error(400, 'slug required');
	const id = url.searchParams.get('id');
	if (!id) error(400, 'id required');
	const sql = db();
	const res = await sql`DELETE FROM guest_wishes WHERE id = ${id} AND wedding = ${slug}`;
	if (res.count === 0) error(404, 'Ucapan tidak ditemukan.');
	return json({ ok: true });
}
