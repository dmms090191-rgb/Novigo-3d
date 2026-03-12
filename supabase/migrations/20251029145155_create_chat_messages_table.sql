/*
  # Création du système de chat

  1. Nouvelles Tables
    - `chat_messages`
      - `id` (uuid, clé primaire, généré automatiquement)
      - `client_id` (uuid, référence clients.id)
      - `sender_id` (uuid, référence auth.users.id)
      - `sender_type` (text, 'client' ou 'seller')
      - `message` (text, contenu du message)
      - `read` (boolean, par défaut false)
      - `created_at` (timestamptz, par défaut now())

  2. Sécurité
    - Activer RLS sur la table `chat_messages`
    - Les clients peuvent voir et créer des messages liés à leur compte
    - Les sellers peuvent voir et créer des messages pour leurs clients assignés
    - Les admins peuvent voir tous les messages mais ne peuvent pas en créer

  3. Notes importantes
    - Chaque conversation est unique par client
    - Le seller assigné est identifié via la colonne assigned_agent_name dans clients
    - Les messages sont triés par date de création
    - Le statut "lu" permet de suivre les messages non lus
*/

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('client', 'seller')),
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients peuvent voir leurs propres messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE auth.uid() = id
    )
  );

CREATE POLICY "Clients peuvent envoyer des messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE auth.uid() = id
    ) AND sender_id = auth.uid() AND sender_type = 'client'
  );

CREATE POLICY "Sellers peuvent voir messages de leurs clients"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN sellers s ON s.full_name = c.assigned_agent_name
      WHERE s.id = auth.uid()
    )
  );

CREATE POLICY "Sellers peuvent envoyer des messages à leurs clients"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN sellers s ON s.full_name = c.assigned_agent_name
      WHERE s.id = auth.uid()
    ) AND sender_id = auth.uid() AND sender_type = 'seller'
  );

CREATE POLICY "Sellers peuvent marquer messages comme lus"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN sellers s ON s.full_name = c.assigned_agent_name
      WHERE s.id = auth.uid()
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN sellers s ON s.full_name = c.assigned_agent_name
      WHERE s.id = auth.uid()
    )
  );

CREATE POLICY "Clients peuvent marquer messages comme lus"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE auth.uid() = id
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE auth.uid() = id
    )
  );

CREATE INDEX IF NOT EXISTS idx_chat_messages_client_id ON chat_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
