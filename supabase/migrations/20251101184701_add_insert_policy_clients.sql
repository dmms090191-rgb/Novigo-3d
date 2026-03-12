/*
  # Ajouter une politique d'insertion pour les clients/leads

  1. Modifications
    - Ajouter une politique permettant à tout le monde (anon + authenticated) de créer des leads
    - Les leads peuvent être créés depuis le formulaire d'inscription public
  
  2. Sécurité
    - Insertion publique autorisée (anon + authenticated) pour permettre l'inscription
    - Les autres opérations (SELECT, UPDATE) restent restreintes aux propriétaires
*/

-- Créer une politique d'insertion publique pour les clients/leads
CREATE POLICY "Tout le monde peut créer des leads"
  ON clients
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
