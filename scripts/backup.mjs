#!/usr/bin/env node
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import postgres from 'postgres';

const args = process.argv.slice(2);
const restoreIdx = args.indexOf('--restore');
const restoreFile = restoreIdx !== -1 ? args[restoreIdx + 1] : null;

function loadEnv() {
	try {
		const raw = readFileSync(resolve('.env'), 'utf8');
		for (const line of raw.split('\n')) {
			const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
			if (!m || process.env[m[1]]) continue;
			let v = m[2].trim();
			if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
			process.env[m[1]] = v;
		}
	} catch {}
}

loadEnv();
const url = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
if (!url) {
	console.error('✗ DATABASE_URL belum diset (.env).');
	process.exit(1);
}

function connect(u) {
	const m = u.match(/postgresql:\/\/([^:]+):(.+)@([^:/]+):(\d+)\/([^?\s]+)/);
	if (!m) return postgres(u, { prepare: false, max: 1 });
	let pw = m[2];
	try { if (pw.includes('%')) pw = decodeURIComponent(pw); } catch {}
	return postgres({ user: m[1], password: pw, host: m[3], port: Number(m[4]), database: m[5] }, { prepare: false, max: 1 });
}

const sql = connect(url);

if (restoreFile) {
	const p = resolve(restoreFile);
	let payload;
	try { payload = JSON.parse(readFileSync(p, 'utf8')); } catch (e) { console.error(`✗ Gagal baca ${p}:`, e.message); process.exit(1); }
	if (payload.version !== 1 || !payload.tables) { console.error('✗ Format backup tidak valid (version/tables).'); process.exit(1); }
	const invitations = payload.tables.invitations ?? [];
	const wishes = payload.tables.guest_wishes ?? [];
	const guests = payload.tables.invitation_guests ?? [];
	const idMap = new Map();
	let insInv = 0, skipInv = 0, insW = 0, skipW = 0, insG = 0, skipG = 0;
	try {
		await sql.begin(async (tx) => {
			for (const row of invitations) {
				const sd = typeof row.subdomain === 'string' ? row.subdomain.trim().toLowerCase() : '';
				if (!sd || typeof row.data_json !== 'object' || row.data_json === null || Array.isArray(row.data_json)) { skipInv++; continue; }
				const ex = await tx`SELECT id FROM invitations WHERE subdomain = ${sd} LIMIT 1`;
				if (ex.length) { if (typeof row.id === 'string') idMap.set(row.id, ex[0].id); skipInv++; continue; }
				if (typeof row.id === 'string') {
					const byId = await tx`SELECT id FROM invitations WHERE id = ${row.id} LIMIT 1`;
					if (byId.length) { idMap.set(row.id, byId[0].id); skipInv++; continue; }
				}
				try {
					const ins = await tx`INSERT INTO invitations (id, subdomain, nama_pihak_1, nama_pihak_2, tanggal_acara, template, data_json, status, owner_email, access_pin, wa_template, created_at, updated_at) VALUES (${row.id}, ${sd}, ${row.nama_pihak_1 ?? ''}, ${row.nama_pihak_2 ?? ''}, ${row.tanggal_acara ?? null}, ${row.template ?? 'classic'}, ${tx.json(row.data_json)}, ${row.status ?? 'draft'}, ${row.owner_email ?? null}, ${row.access_pin ?? null}, ${row.wa_template ?? null}, ${row.created_at ?? new Date().toISOString()}, ${row.updated_at ?? new Date().toISOString()}) ON CONFLICT (subdomain) DO NOTHING RETURNING id`;
					if (ins.length) { if (typeof row.id === 'string') idMap.set(row.id, ins[0].id); insInv++; } else { const e2 = await tx`SELECT id FROM invitations WHERE subdomain = ${sd} LIMIT 1`; if (e2.length && typeof row.id === 'string') idMap.set(row.id, e2[0].id); skipInv++; }
				} catch { skipInv++; }
			}
			for (const w of wishes) {
				if (typeof w.wedding !== 'string' || typeof w.name !== 'string' || typeof w.message !== 'string') { skipW++; continue; }
				try { const r = await tx`INSERT INTO guest_wishes (id, wedding, name, attendance, message, guests, created_at) VALUES (${w.id}, ${w.wedding}, ${w.name}, ${w.attendance ?? ''}, ${w.message}, ${w.guests ?? 0}, ${w.created_at ?? new Date().toISOString()}) ON CONFLICT (id) DO NOTHING RETURNING id`; if (r.length) insW++; else skipW++; } catch { skipW++; }
			}
			for (const g of guests) {
				const rawId = typeof g.invitation_id === 'string' ? g.invitation_id : '';
				const mapped = (rawId && idMap.get(rawId)) || rawId;
				if (!mapped || typeof g.wedding !== 'string' || typeof g.name !== 'string' || typeof g.normalized_name !== 'string') { skipG++; continue; }
				const ex = await tx`SELECT id FROM invitations WHERE id = ${mapped} LIMIT 1`;
				if (!ex.length) { skipG++; continue; }
				try { const r = await tx`INSERT INTO invitation_guests (invitation_id, wedding, name, normalized_name, sent, sent_at, created_at) VALUES (${mapped}, ${g.wedding}, ${g.name}, ${g.normalized_name}, ${g.sent ?? false}, ${g.sent_at ?? null}, ${g.created_at ?? new Date().toISOString()}) ON CONFLICT (invitation_id, normalized_name) DO NOTHING RETURNING id`; if (r.length) insG++; else skipG++; } catch { skipG++; }
			}
		});
		console.log(`✓ Restore merge selesai: invitations ${insInv} baru / ${skipInv} skip, wishes ${insW}/${skipW}, guests ${insG}/${skipG}`);
	} catch (e) { console.error('✗ Restore gagal:', e); process.exitCode = 1; }
	finally { await sql.end(); }
} else {
	try {
		const [invitations, wishes, guests] = await Promise.all([
			sql`SELECT id, subdomain, nama_pihak_1, nama_pihak_2, tanggal_acara, template, data_json, status, owner_email, access_pin, wa_template, created_at, updated_at FROM invitations ORDER BY created_at ASC`,
			sql`SELECT id, wedding, name, attendance, message, guests, created_at FROM guest_wishes ORDER BY created_at ASC`,
			sql`SELECT id, invitation_id, wedding, name, normalized_name, sent, sent_at, created_at FROM invitation_guests ORDER BY created_at ASC`
		]);
		const payload = { version: 1, created_at: new Date().toISOString(), tables: { invitations, guest_wishes: wishes, invitation_guests: guests }, counts: { invitations: invitations.length, guest_wishes: wishes.length, invitation_guests: guests.length } };
		const dir = resolve('backups');
		mkdirSync(dir, { recursive: true });
		const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
		const file = resolve(dir, `backup-${stamp}.json`);
		writeFileSync(file, JSON.stringify(payload, null, 2));
		console.log(`✓ Backup tersimpan: ${file}`);
		console.log(`  invitations=${payload.counts.invitations} wishes=${payload.counts.guest_wishes} guests=${payload.counts.invitation_guests}`);
	} catch (e) { console.error('✗ Backup gagal:', e); process.exitCode = 1; }
	finally { await sql.end(); }
}
