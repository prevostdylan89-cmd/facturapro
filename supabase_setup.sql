-- ============================================================
-- FacturaPro — Script SQL Supabase complet
-- À exécuter dans l'éditeur SQL de votre projet Supabase
-- ============================================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE : profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name   TEXT,
  company_name TEXT,
  address     TEXT,
  phone       TEXT,
  email       TEXT,
  logo_url    TEXT,
  siret       TEXT,
  tva_number  TEXT,
  iban        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- TABLE : clients
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  email      TEXT,
  address    TEXT,
  phone      TEXT,
  siret      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_all_own" ON clients
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- TABLE : invoices
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id      UUID REFERENCES clients(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  status         TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  issue_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date       DATE,
  subtotal       DECIMAL(12,2) DEFAULT 0,
  tva_rate       DECIMAL(5,2)  DEFAULT 20,
  tva_amount     DECIMAL(12,2) DEFAULT 0,
  total          DECIMAL(12,2) DEFAULT 0,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Owner policy
CREATE POLICY "invoices_all_own" ON invoices
  FOR ALL USING (auth.uid() = user_id);

-- Public read (partage de factures par URL)
CREATE POLICY "invoices_public_select" ON invoices
  FOR SELECT USING (true);

-- ============================================================
-- TABLE : invoice_items
-- ============================================================
CREATE TABLE IF NOT EXISTS invoice_items (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_id   UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  description  TEXT NOT NULL,
  quantity     DECIMAL(10,2) DEFAULT 1,
  unit_price   DECIMAL(12,2) DEFAULT 0,
  total        DECIMAL(12,2) DEFAULT 0
);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoice_items_own" ON invoice_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.user_id = auth.uid()
    )
  );

-- Public read pour les pages de partage
CREATE POLICY "invoice_items_public_select" ON invoice_items
  FOR SELECT USING (true);

-- ============================================================
-- TABLE : invoice_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS invoice_settings (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  next_invoice_number INTEGER DEFAULT 1,
  prefix              TEXT DEFAULT 'FAC',
  payment_terms       TEXT DEFAULT '30 jours net',
  late_fees           TEXT DEFAULT 'En cas de retard de paiement, des pénalités de retard au taux de 3 fois le taux d''intérêt légal seront appliquées, ainsi qu''une indemnité forfaitaire pour frais de recouvrement de 40 €.',
  bank_details        TEXT,
  footer_text         TEXT DEFAULT 'Merci pour votre confiance.',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invoice_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoice_settings_all_own" ON invoice_settings
  FOR ALL USING (auth.uid() = user_id);

-- Public read pour les pages de partage
CREATE POLICY "invoice_settings_public_select" ON invoice_settings
  FOR SELECT USING (true);

-- Idem pour profiles (nécessaire pour la page publique)
CREATE POLICY "profiles_public_select" ON profiles
  FOR SELECT USING (true);

-- ============================================================
-- TRIGGER : création automatique du profil à l'inscription
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO invoice_settings (user_id, prefix, next_invoice_number)
  VALUES (NEW.id, 'FAC', 1)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FONCTION : numéro de facture auto-incrémenté
-- ============================================================
CREATE OR REPLACE FUNCTION get_next_invoice_number(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_settings invoice_settings%ROWTYPE;
  v_year     INTEGER;
  v_number   TEXT;
BEGIN
  SELECT * INTO v_settings
  FROM invoice_settings
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO invoice_settings (user_id, prefix, next_invoice_number)
    VALUES (p_user_id, 'FAC', 1)
    RETURNING * INTO v_settings;
  END IF;

  v_year   := EXTRACT(YEAR FROM NOW());
  v_number := v_settings.prefix
           || '-' || v_year::TEXT
           || '-' || LPAD(v_settings.next_invoice_number::TEXT, 3, '0');

  UPDATE invoice_settings
  SET next_invoice_number = next_invoice_number + 1
  WHERE user_id = p_user_id;

  RETURN v_number;
END;
$$;

-- ============================================================
-- STORAGE : bucket "logos" (logos d'entreprise)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Politique upload (authentifié seulement)
CREATE POLICY "logos_upload" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- Lecture publique
CREATE POLICY "logos_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'logos');

-- Mise à jour par le propriétaire
CREATE POLICY "logos_update_own" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Suppression par le propriétaire
CREATE POLICY "logos_delete_own" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
