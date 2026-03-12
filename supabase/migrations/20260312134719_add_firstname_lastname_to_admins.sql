/*
  # Ajouter nom et prenom a la table admins

  1. Nouvelles colonnes
    - `first_name` (text) - Prenom de l'administrateur
    - `last_name` (text) - Nom de l'administrateur
  
  2. Description
    Permet de stocker le nom et prenom de l'administrateur
    pour un affichage personnalise dans l'interface.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admins' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE admins ADD COLUMN first_name text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admins' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE admins ADD COLUMN last_name text DEFAULT '';
  END IF;
END $$;