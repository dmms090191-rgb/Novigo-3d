-- ============================================
-- SCRIPT D'INSTALLATION COMPLET - SJRenovPro
-- Copiez-collez ce script dans Supabase SQL Editor
-- ============================================

-- Table: clients
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  company_name text,
  phone text,
  address text,
  project_description text,
  status text DEFAULT 'active' NOT NULL,
  assigned_agent_name text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own data"
  ON clients FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Clients can update own data"
  ON clients FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

-- Table: admins
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'admin',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins peuvent tout voir"
  ON admins FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins peuvent tout insérer"
  ON admins FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins peuvent tout mettre à jour"
  ON admins FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins peuvent tout supprimer"
  ON admins FOR DELETE TO authenticated USING (true);

-- Table: sellers
CREATE TABLE IF NOT EXISTS sellers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  commission_rate numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers peuvent tout voir"
  ON sellers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Sellers peuvent tout insérer"
  ON sellers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Sellers peuvent tout mettre à jour"
  ON sellers FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Sellers peuvent tout supprimer"
  ON sellers FOR DELETE TO authenticated USING (true);

-- Table: chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('client', 'seller')),
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients peuvent voir leurs propres messages"
  ON chat_messages FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE auth.uid() = id));

CREATE POLICY "Clients peuvent envoyer des messages"
  ON chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE auth.uid() = id)
    AND sender_id = auth.uid()
    AND sender_type = 'client'
  );

CREATE POLICY "Sellers peuvent voir messages de leurs clients"
  ON chat_messages FOR SELECT TO authenticated
  USING (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN sellers s ON s.full_name = c.assigned_agent_name
      WHERE s.id = auth.uid()
    )
  );

CREATE POLICY "Sellers peuvent envoyer des messages à leurs clients"
  ON chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN sellers s ON s.full_name = c.assigned_agent_name
      WHERE s.id = auth.uid()
    )
    AND sender_id = auth.uid()
    AND sender_type = 'seller'
  );

CREATE POLICY "Sellers peuvent marquer messages comme lus"
  ON chat_messages FOR UPDATE TO authenticated
  USING (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN sellers s ON s.full_name = c.assigned_agent_name
      WHERE s.id = auth.uid()
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN sellers s ON s.full_name = c.assigned_agent_name
      WHERE s.id = auth.uid()
    )
  );

CREATE POLICY "Clients peuvent marquer messages comme lus"
  ON chat_messages FOR UPDATE TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE auth.uid() = id))
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE auth.uid() = id));

CREATE INDEX IF NOT EXISTS idx_chat_messages_client_id ON chat_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Table: products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  stock integer DEFAULT 0 CHECK (stock >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut voir les produits"
  ON products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Seuls les admins peuvent créer des produits"
  ON products FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));

CREATE POLICY "Seuls les admins peuvent modifier des produits"
  ON products FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));

CREATE POLICY "Seuls les admins peuvent supprimer des produits"
  ON products FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));
