/*
  # Ajouter le champ assigned_agent à la table clients

  1. Modifications
    - Ajoute la colonne `assigned_agent_name` (text, nullable) à la table `clients`
    - Ce champ permettra de stocker le nom de l'agent (admin ou seller) assigné au client
    - Les clients pourront voir quel agent s'occupe de leur dossier

  2. Notes importantes
    - Le champ est nullable car tous les clients n'ont pas nécessairement un agent assigné
    - Ce champ sera mis à jour lors de la création du client ou lors de l'assignation d'un agent
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'assigned_agent_name'
  ) THEN
    ALTER TABLE clients ADD COLUMN assigned_agent_name text;
  END IF;
END $$;
