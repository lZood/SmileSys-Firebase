-- Migration: create invites table for custom invite flow

CREATE TABLE IF NOT EXISTS invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  clinic_id uuid NULL,
  inviter_id uuid NULL,
  role text DEFAULT 'member',
  accepted boolean DEFAULT false,
  accepted_at timestamptz NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invites_token ON invites (token);
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites (email);
