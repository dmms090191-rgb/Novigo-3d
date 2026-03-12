/*
  # Création des tables admins et sellers

  1. Nouvelles Tables
    - `admins`
      - `id` (uuid, clé primaire, référence auth.users)
      - `email` (text, unique, non null)
      - `full_name` (text, non null)
      - `phone` (text)
      - `role` (text, par défaut 'admin')
      - `status` (text, par défaut 'active')
      - `created_at` (timestamptz, par défaut now())
      - `updated_at` (timestamptz, par défaut now())
    
    - `sellers`
      - `id` (uuid, clé primaire, référence auth.users)
      - `email` (text, unique, non null)
      - `full_name` (text, non null)
      - `phone` (text)
      - `commission_rate` (numeric, par défaut 0)
      - `status` (text, par défaut 'active')
      - `created_at` (timestamptz, par défaut now())
      - `updated_at` (timestamptz, par défaut now())

  2. Sécurité
    - Activer RLS sur les deux tables
    - Ajouter des politiques pour les utilisateurs authentifiés
*/

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

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins peuvent tout voir"
  ON admins FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins peuvent tout insérer"
  ON admins FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins peuvent tout mettre à jour"
  ON admins FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins peuvent tout supprimer"
  ON admins FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Sellers peuvent tout voir"
  ON sellers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sellers peuvent tout insérer"
  ON sellers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Sellers peuvent tout mettre à jour"
  ON sellers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Sellers peuvent tout supprimer"
  ON sellers FOR DELETE
  TO authenticated
  USING (true);