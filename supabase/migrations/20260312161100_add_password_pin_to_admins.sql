/*
  # Ajouter colonne password_pin a la table admins

  1. Nouvelles colonnes
    - `password_pin` (text) - Mot de passe/PIN visible pour l'admin (6 chiffres)
  
  2. Politique de securite
    - Ajout d'une politique permettant l'insertion publique pour la creation d'admin
    - Ajout d'une politique permettant la mise a jour publique
    - Ajout d'une politique permettant la lecture publique

  3. Description
    Cette migration ajoute un champ password_pin pour stocker
    le mot de passe visible des administrateurs.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admins' AND column_name = 'password_pin'
  ) THEN
    ALTER TABLE admins ADD COLUMN password_pin text DEFAULT '';
  END IF;
END $$;

DROP POLICY IF EXISTS "Public can insert admins" ON admins;
CREATE POLICY "Public can insert admins"
  ON admins
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can read admins" ON admins;
CREATE POLICY "Public can read admins"
  ON admins
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can update admins" ON admins;
CREATE POLICY "Public can update admins"
  ON admins
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can delete admins" ON admins;
CREATE POLICY "Public can delete admins"
  ON admins
  FOR DELETE
  TO anon, authenticated
  USING (true);
