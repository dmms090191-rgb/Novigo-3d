/*
  # Création de la table products

  1. Nouvelle Table
    - `products`
      - `id` (uuid, clé primaire, auto-généré)
      - `name` (text, non null) - Nom du produit
      - `description` (text) - Description du produit
      - `price` (numeric, non null) - Prix du produit
      - `stock` (integer, par défaut 0) - Quantité en stock
      - `created_at` (timestamptz, par défaut now()) - Date de création
      - `updated_at` (timestamptz, par défaut now()) - Date de modification

  2. Sécurité
    - Activer RLS sur la table products
    - Politique pour permettre la lecture à tous les utilisateurs authentifiés
    - Politique pour permettre l'insertion/mise à jour/suppression aux admins seulement
*/

-- Créer la table products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  stock integer DEFAULT 0 CHECK (stock >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Politique : tout le monde peut lire
CREATE POLICY "Tout le monde peut voir les produits"
  ON products FOR SELECT
  TO authenticated
  USING (true);

-- Politique : seulement les admins peuvent insérer
CREATE POLICY "Seuls les admins peuvent créer des produits"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid()
    )
  );

-- Politique : seulement les admins peuvent mettre à jour
CREATE POLICY "Seuls les admins peuvent modifier des produits"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid()
    )
  );

-- Politique : seulement les admins peuvent supprimer
CREATE POLICY "Seuls les admins peuvent supprimer des produits"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid()
    )
  );