/*
  # Ajouter une politique de lecture publique pour les sellers

  1. Modifications
    - Ajouter une politique permettant à tout le monde de lire les sellers (pour le dropdown de transfert)
    - Les sellers doivent être visibles pour permettre l'assignation des leads
  
  2. Sécurité
    - Lecture publique autorisée (anon + authenticated)
    - Les autres opérations (INSERT, UPDATE, DELETE) restent restreintes aux utilisateurs authentifiés
*/

-- Supprimer l'ancienne politique de lecture restreinte
DROP POLICY IF EXISTS "Sellers peuvent tout voir" ON sellers;

-- Créer une nouvelle politique de lecture publique
CREATE POLICY "Tout le monde peut voir les sellers"
  ON sellers
  FOR SELECT
  TO anon, authenticated
  USING (true);
