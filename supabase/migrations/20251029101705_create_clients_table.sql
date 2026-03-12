/*
  # Création de la table clients et configuration de sécurité

  ## Contenu de la migration
  
  1. Nouvelles Tables
    - `clients`
      - `id` (uuid, clé primaire, lié à auth.users)
      - `email` (text, unique, non null)
      - `full_name` (text, non null)
      - `company_name` (text, nullable)
      - `phone` (text, nullable)
      - `address` (text, nullable)
      - `project_description` (text, nullable)
      - `status` (text, défaut 'active')
      - `created_at` (timestamptz, défaut now())
      - `updated_at` (timestamptz, défaut now())

  2. Sécurité
    - Active RLS sur la table `clients`
    - Politique permettant aux clients de lire uniquement leurs propres données
    - Politique permettant aux clients de mettre à jour uniquement leurs propres données
    - Les admins (via service role) peuvent tout faire

  ## Notes importantes
  - L'ID du client correspond à l'ID de l'utilisateur dans auth.users
  - Chaque lead converti en client aura un compte d'authentification Supabase
  - Les clients ne peuvent voir que leurs propres informations
*/

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  company_name text,
  phone text,
  address text,
  project_description text,
  status text DEFAULT 'active' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own data"
  ON clients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Clients can update own data"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
