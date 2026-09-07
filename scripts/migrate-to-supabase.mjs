#!/usr/bin/env node
// ============================================================================
// scripts/migrate-to-supabase.mjs — Migrasi ucapan tamu: Neon → Supabase
//
// Pemakaian (target Supabase via .env lokal atau env langsung):
//   node --env-file=.env scripts/migrate-to-supabase.mjs
//
// Sumber data (pilih salah satu):
//   1. DB langsung:   export NEON_DATABASE_URL='postgresql://...neon...'
//   2. Via API produksi (tanpa kredensial Neon — default):
//        export SOURCE_API_URL='https://invite.boundless.my.id/api/wishes'
//      (atau biarkan default; dipakai otomatis bila NEON_DATABASE_URL kosong)
//
// Target: SUPABASE_DATABASE_URL, atau DATABASE_URL (mis. dari .env) — pooler 6543.
// ============================================================================
import postgres from 'postgres';
import { readFileSync } from 'node:fs';

const SUPA_URL = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
const NEON_URL = process.env.NEON_DATABASE_URL;
const SOURCE_API_URL = process.env.SOURCE_API_URL || 'https://invite.boundless.my.id/api/wishes';

if (!SUPA_URL) {
  console.error('✗ Set SUPABASE_DATABASE_URL (atau DATABASE_URL di .env).');
  process.exit(1);
}
if (!NEON_URL && !SOURCE_API_URL) {
  console.error('✗ Sumber data tidak ada: set NEON_DATABASE_URL atau SOURCE_API_URL.');
  process.exit(1);
}

const slug = 'ruhaeni-roni';

// --- Pemetaan konten wedding.ts → data_json (Fase 1b/2) ---------------------
function buildDataJson() {
  const file = new URL('../src/lib/data/wedding.ts', import.meta.url);
  const src = readFileSync(file, 'utf8');
  const pick = (re) => {
    const m = src.match(re);
    return m ? m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : '';
  };
  return {
    theme: { primary: '#3c5c2b', secondary: '#f6f0e1' },
    personalize_greeting: true,
    couple: {
      bride: {
        name: pick(/bride:\s*{[\s\S]*?name: '([^']+)'/),
        full_name: pick(/bride:\s*{[\s\S]*?fullName: '([^']+)'/),
        relation: pick(/bride:\s*{[\s\S]*?relation: '([^']+)'/),
        instagram: pick(/bride:\s*{[\s\S]*?instagram: '([^']*)'/),
        whatsapp: ''
      },
      groom: {
        name: pick(/groom:\s*{[\s\S]*?name: '([^']+)'/),
        full_name: pick(/groom:\s*{[\s\S]*?fullName: '([^']+)'/),
        relation: pick(/groom:\s*{[\s\S]*?relation: '([^']+)'/),
        instagram: pick(/groom:\s*{[\s\S]*?instagram: '([^']*)'/),
        whatsapp: ''
      }
    },
    verse: {
      arabic: pick(/arabic:\s*\n?\s*'([^']+)'/),
      translation: pick(/translation:\s*\n?\s*'([^']+)'/),
      source: pick(/source: '([^']+)'/)
    },
    events: [
      {
        name: pick(/akad:\s*{[\s\S]*?title: '([^']+)'/),
        date: (src.match(/akad:\s*{[\s\S]*?dateISO: '([^T]+)T/) || [])[1] || '2026-09-20',
        time: pick(/akad:\s*{[\s\S]*?time: '([^']+)'/),
        location: pick(/address: '([^']+)'/),
        map_url: pick(/mapsUrl: '([^']+)'/)
      },
      {
        name: pick(/resepsi:\s*{[\s\S]*?title: '([^']+)'/),
        date: (src.match(/resepsi:\s*{[\s\S]*?dateISO: '([^T]+)T/) || [])[1] || '2026-09-21',
        time: pick(/resepsi:\s*{[\s\S]*?time: '([^']+)'/),
        location: pick(/address: '([^']+)'/),
        map_url: pick(/mapsUrl: '([^']+)'/)
      }
    ],
    gifts: [...src.matchAll(/\{\s*bank:\s*'([^']+)',\s*number:\s*'([^']+)',\s*holder:\s*'([^']+)'\s*\}/g)]
      .map((m) => ({ type: 'ewallet', provider: m[1], owner: m[3], number: m[2] })),
    gallery: ['hero','gallery-1','gallery-2','gallery-3','gallery-4','gallery-5','gallery-6','gallery-7','gallery-8','gallery-9','gallery-10','gallery-11','gallery-12'],
    love_story: [...src.matchAll(/\{\s*title:\s*'([^']+)',\s*text:\s*\n?\s*'([\s\S]*?)'\s*\}/g)]
      .map((m) => ({ title: m[1], text: m[2] })),
    music_url: '/audio/wedding.mp3',
    livestream_url: null
  };
}

// A. Ekspor sumber -----------------------------------------------------------
// Sumber 1: API produksi (JSON) — tanpa kredensial Neon.
// Sumber 2: langsung DB Neon bila NEON_DATABASE_URL diset.
let rows = [];
if (!NEON_URL) {
  console.log(`↻ Ekspor via API produksi: ${SOURCE_API_URL}`);
  const res = await fetch(SOURCE_API_URL, { headers: { accept: 'application/json' } });
  if (!res.ok) {
    console.error(`✗ API sumber gagal: HTTP ${res.status}`);
    process.exit(1);
  }
  const json = await res.json();
  rows = (json.wishes || []).map((w, i) => ({
    id: Number(w.id) || i + 1,
    wedding: slug,
    name: String(w.name ?? ''),
    attendance: w.attendance === 'hadir' || w.attendance === 'tidak' ? w.attendance : '',
    message: String(w.message ?? ''),
    guests: Number(w.guests) || (w.attendance === 'hadir' ? 1 : 0),
    created_at: w.createdAt ? new Date(w.createdAt) : new Date()
  }));
} else {
  const neon = connect(NEON_URL, { prepare: false, max: 1 });
  try {
    rows = await neon`
      SELECT id, wedding, name, attendance, message,
             COALESCE(guests, CASE WHEN attendance = 'hadir' THEN 1 ELSE 0 END) AS guests,
             created_at
      FROM guest_wishes ORDER BY id
    `;
  } finally {
    await neon.end();
  }
}
console.log(`✓ Sumber: ${rows.length} ucapan diekspor`);

// Koneksi tahan password dengan karakter spesial: parse URL → config object
// (driver memakai `new URL()` yang gagal bila password mengandung `?` dll.)
function connect(url, opts) {
  const m = url.match(/postgresql:\/\/([^:]+):(.+)@([^:/]+):(\d+)\/([^?\s]+)/);
  if (!m) return postgres(url, opts);
  let password = m[2];
  try {
    if (password.includes('%')) password = decodeURIComponent(password);
  } catch {}
  return postgres(
    { user: m[1], password, host: m[3], port: Number(m[4]), database: m[5] },
    opts
  );
}

const supa = connect(SUPA_URL, { prepare: false, max: 3 });

try {
  // B. Tabel di Supabase ------------------------------------------------------
  await supa`
    CREATE TABLE IF NOT EXISTS guest_wishes (
      id          BIGSERIAL PRIMARY KEY,
      wedding     TEXT NOT NULL DEFAULT 'ruhaeni-roni',
      name        TEXT NOT NULL,
      attendance  TEXT NOT NULL DEFAULT '',
      message     TEXT NOT NULL,
      guests      INT  NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  // C. Impor (id lama dipertahankan) -----------------------------------------
  for (const r of rows) {
    await supa`
      INSERT INTO guest_wishes (id, wedding, name, attendance, message, guests, created_at)
      VALUES (${r.id}, ${r.wedding}, ${r.name}, ${r.attendance}, ${r.message}, ${r.guests}, ${r.created_at})
      ON CONFLICT (id) DO NOTHING
    `;
  }
  await supa`
    SELECT setval(pg_get_serial_sequence('guest_wishes','id'),
                  GREATEST((SELECT COALESCE(MAX(id),1) FROM guest_wishes), 1))
  `;
  console.log(`✓ Supabase: ${rows.length} ucapan diimpor (id lama dipertahankan)`);

  // D. invitations + row pertama (Fase 2) -------------------------------------
  await supa`
    CREATE TABLE IF NOT EXISTS invitations (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      subdomain     TEXT NOT NULL UNIQUE
                    CHECK (subdomain ~ '^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$'),
      nama_pihak_1  TEXT NOT NULL DEFAULT '',
      nama_pihak_2  TEXT NOT NULL DEFAULT '',
      tanggal_acara DATE,
      template      TEXT NOT NULL DEFAULT 'classic',
      data_json     JSONB NOT NULL DEFAULT '{}'::jsonb
                    CHECK (jsonb_typeof(data_json) = 'object'),
      status        TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','active','expired')),
      owner_email   TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  const data = buildDataJson();
  await supa`
    INSERT INTO invitations (subdomain, nama_pihak_1, nama_pihak_2, tanggal_acara, template, data_json, status)
    VALUES (${slug}, ${data.couple.bride.name}, ${data.couple.groom.name}, '2026-09-21', 'classic', ${supa.json(data)}, 'active')
    ON CONFLICT (subdomain) DO NOTHING
  `;
  console.log(`✓ Supabase: invitations siap, row '${slug}' aktif`);

  // E. FK + index -------------------------------------------------------------
  await supa`
    CREATE INDEX IF NOT EXISTS idx_guest_wishes_wedding_created
      ON guest_wishes (wedding, created_at DESC)
  `;
  await supa`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_guest_wishes_invitation') THEN
        ALTER TABLE guest_wishes
          ADD CONSTRAINT fk_guest_wishes_invitation
          FOREIGN KEY (wedding) REFERENCES invitations(subdomain) ON DELETE CASCADE;
      END IF;
    END $$;
  `;
  console.log('✓ Supabase: index + FK guest_wishes → invitations(subdomain) terpasang');
  const verif = await supa`SELECT COUNT(*)::int AS n FROM guest_wishes`;
  const verifInv = await supa`SELECT subdomain, status FROM invitations`;
  console.log(`✓ Verifikasi: guest_wishes = ${verif[0].n} baris; invitations = ${verifInv.map((r) => `${r.subdomain}(${r.status})`).join(', ')}`);
  console.log('\n🎉 Selesai. Langkah cutover: update DATABASE_URL di Vercel ke Supabase pooler, deploy, cek /api/wishes.');
} catch (e) {
  console.error('✗ Migrasi gagal:', e);
  process.exitCode = 1;
} finally {
  await supa.end();
}
