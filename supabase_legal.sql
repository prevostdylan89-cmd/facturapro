-- ============================================================
-- FacturaPro — Mise à jour légale/juridique (idempotent)
-- ============================================================

-- ── COLONNES profiles (mentions légales émetteur) ──────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS legal_form TEXT;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS capital_social TEXT;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS rcs_city TEXT;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS rcs_number TEXT;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_auto_entrepreneur BOOLEAN DEFAULT false;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS insurance_mention TEXT;

-- ── COLONNES clients (mentions légales client) ─────────────
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS tva_number TEXT;

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- ── COLONNES invoices ──────────────────────────────────────
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS po_number TEXT;

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'virement';

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS remise_globale DECIMAL(5,2) DEFAULT 0;

-- ── COLONNES invoice_items (remise par ligne) ──────────────
ALTER TABLE invoice_items
  ADD COLUMN IF NOT EXISTS remise DECIMAL(5,2) DEFAULT 0;
