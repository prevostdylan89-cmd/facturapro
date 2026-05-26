-- ============================================================
-- FacturaPro — Mise à jour SQL (idempotent)
-- Devis, Avoirs, numéros configurables
-- ============================================================

-- ── COLONNES invoices ──────────────────────────────────────
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'invoice'
    CHECK (type IN ('invoice', 'quote', 'credit_note'));

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS original_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;

-- ── COLONNES invoice_settings ──────────────────────────────
ALTER TABLE invoice_settings
  ADD COLUMN IF NOT EXISTS next_quote_number INTEGER DEFAULT 1;

ALTER TABLE invoice_settings
  ADD COLUMN IF NOT EXISTS quote_prefix TEXT DEFAULT 'DEV';

ALTER TABLE invoice_settings
  ADD COLUMN IF NOT EXISTS next_credit_note_number INTEGER DEFAULT 1;

ALTER TABLE invoice_settings
  ADD COLUMN IF NOT EXISTS credit_note_prefix TEXT DEFAULT 'AV';

-- ── FONCTION : numéro de devis ─────────────────────────────
CREATE OR REPLACE FUNCTION get_next_quote_number(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_settings invoice_settings%ROWTYPE;
  v_year     INTEGER;
  v_number   TEXT;
BEGIN
  SELECT * INTO v_settings FROM invoice_settings WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO invoice_settings (user_id, quote_prefix, next_quote_number)
    VALUES (p_user_id, 'DEV', 1)
    RETURNING * INTO v_settings;
  END IF;

  v_year   := EXTRACT(YEAR FROM NOW());
  v_number := COALESCE(v_settings.quote_prefix, 'DEV')
           || '-' || v_year::TEXT
           || '-' || LPAD(COALESCE(v_settings.next_quote_number, 1)::TEXT, 3, '0');

  UPDATE invoice_settings
  SET next_quote_number = COALESCE(next_quote_number, 1) + 1
  WHERE user_id = p_user_id;

  RETURN v_number;
END;
$$;

-- ── FONCTION : numéro d'avoir ──────────────────────────────
CREATE OR REPLACE FUNCTION get_next_credit_note_number(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_settings invoice_settings%ROWTYPE;
  v_year     INTEGER;
  v_number   TEXT;
BEGIN
  SELECT * INTO v_settings FROM invoice_settings WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO invoice_settings (user_id, credit_note_prefix, next_credit_note_number)
    VALUES (p_user_id, 'AV', 1)
    RETURNING * INTO v_settings;
  END IF;

  v_year   := EXTRACT(YEAR FROM NOW());
  v_number := COALESCE(v_settings.credit_note_prefix, 'AV')
           || '-' || v_year::TEXT
           || '-' || LPAD(COALESCE(v_settings.next_credit_note_number, 1)::TEXT, 3, '0');

  UPDATE invoice_settings
  SET next_credit_note_number = COALESCE(next_credit_note_number, 1) + 1
  WHERE user_id = p_user_id;

  RETURN v_number;
END;
$$;

-- ── MISE À JOUR TRIGGER : handle_new_user ─────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO invoice_settings (
    user_id, prefix, next_invoice_number,
    quote_prefix, next_quote_number,
    credit_note_prefix, next_credit_note_number
  )
  VALUES (NEW.id, 'FAC', 1, 'DEV', 1, 'AV', 1)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
