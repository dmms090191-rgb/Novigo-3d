/*
  # Création de la table leads
  
  1. Nouvelle Table
    - `leads`
      - `id` (uuid, clé primaire, auto-généré)
      - `email` (text, unique, non null)
      - `full_name` (text, non null)
      - `company_name` (text, nullable)
      - `phone` (text, nullable)
      - `address` (text, nullable)
      - `project_description` (text, nullable)
      - `status` (text, par défaut 'new') - new, contacted, qualified, converted, lost
      - `assigned_to` (text, nullable) - Nom de l'agent assigné
      - `source` (text, nullable) - D'où vient le lead (site web, référence, etc.)
      - `notes` (text, nullable) - Notes internes sur le lead
      - `created_at` (timestamptz, par défaut now())
      - `updated_at` (timestamptz, par défaut now())
  
  2. Sécurité
    - Activer RLS sur la table leads
    - Permettre aux admins et sellers de voir tous les leads
    - Permettre aux admins et sellers de créer/modifier/supprimer des leads
  
  3. Notes importantes
    - Les leads sont des prospects qui ne sont pas encore des clients
    - Quand un lead est converti, on crée un client dans la table clients
    - Les leads peuvent être assignés à des sellers pour suivi
*/

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  company_name text,
  phone text,
  address text,
  project_description text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  assigned_to text,
  source text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs authentifiés (admins et sellers) peuvent voir tous les leads
CREATE POLICY "Utilisateurs authentifiés peuvent voir les leads"
  ON leads FOR SELECT
  TO authenticated
  USING (true);

-- Les utilisateurs authentifiés peuvent créer des leads
CREATE POLICY "Utilisateurs authentifiés peuvent créer des leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Les utilisateurs authentifiés peuvent modifier des leads
CREATE POLICY "Utilisateurs authentifiés peuvent modifier des leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Les utilisateurs authentifiés peuvent supprimer des leads
CREATE POLICY "Utilisateurs authentifiés peuvent supprimer des leads"
  ON leads FOR DELETE
  TO authenticated
  USING (true);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);