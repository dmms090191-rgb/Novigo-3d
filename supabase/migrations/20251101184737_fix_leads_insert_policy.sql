/*
  # Corriger la politique d'insertion pour les leads

  1. Modifications
    - Supprimer l'ancienne politique qui autorise seulement les utilisateurs authentifiés
    - Créer une nouvelle politique qui autorise aussi les utilisateurs anonymes (anon)
    - Permettre l'insertion de leads depuis le formulaire public
  
  2. Sécurité
    - Insertion publique autorisée (anon + authenticated)
    - Les autres opérations restent restreintes aux utilisateurs authentifiés
*/

-- Supprimer l'ancienne politique d'insertion restrictive
DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent créer des leads" ON leads;

-- Créer une nouvelle politique d'insertion publique
CREATE POLICY "Tout le monde peut créer des leads"
  ON leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
