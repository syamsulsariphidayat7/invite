-- ============================================================================
-- db/schema.sql — Skema Supabase (Fase 1d, DIAPPROVE 2026-09-06)
-- Jalankan di Supabase Dashboard → SQL Editor (sekali), atau via psql.
-- Urutan: guest_wishes (dulu, untuk impor data) → invitations → FK + index.
-- ============================================================================

-- ---------------------------------------------------------------- guest_wishes
CREATE TABLE IF NOT EXISTS guest_wishes (
  id          BIGSERIAL PRIMARY KEY,
  wedding     TEXT NOT NULL DEFAULT 'ruhaeni-roni',
  name        TEXT NOT NULL,
  attendance  TEXT NOT NULL DEFAULT '',
  message     TEXT NOT NULL,
  guests      INT  NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE guest_wishes ADD COLUMN IF NOT EXISTS guests INT NOT NULL DEFAULT 0;

-- ----------------------------------------------------------------- invitations
CREATE TABLE IF NOT EXISTS invitations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain     TEXT NOT NULL UNIQUE
                CHECK (subdomain ~ '^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$'),
  nama_pihak_1  TEXT NOT NULL DEFAULT '',
  nama_pihak_2  TEXT NOT NULL DEFAULT '',
  tanggal_acara DATE,            -- denormalisasi utk list admin (sumber: data_json.events)
  template      TEXT NOT NULL DEFAULT 'classic',
  data_json     JSONB NOT NULL DEFAULT '{}'::jsonb
                CHECK (jsonb_typeof(data_json) = 'object'),
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','active','expired')),
  owner_email   TEXT,           -- null dulu (single admin); diisi saat multi-admin
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitations_status   ON invitations (status);
CREATE INDEX IF NOT EXISTS idx_invitations_created  ON invitations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invitations_data_gin ON invitations USING GIN (data_json);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invitations_updated_at ON invitations;
CREATE TRIGGER trg_invitations_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------- relasi & index pencarian
CREATE INDEX IF NOT EXISTS idx_guest_wishes_wedding_created
  ON guest_wishes (wedding, created_at DESC);

-- Jalankan SETELAH invitations terisi row 'ruhaeni-roni' (lihat scripts/migrate):
-- ALTER TABLE guest_wishes
--   ADD CONSTRAINT fk_guest_wishes_invitation
--   FOREIGN KEY (wedding) REFERENCES invitations(subdomain) ON DELETE CASCADE;
