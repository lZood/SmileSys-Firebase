-- Migration 008: Secure pending_signups public insert via SECURITY DEFINER function (Option C)
-- Purpose: Allow unauthenticated (anon) users to create a pending signup without granting broad RLS insert.
-- Prereqs: Table public.pending_signups already exists with RLS enabled and only service_role policies.
-- Safety: Function runs as table owner; ensure it only inserts controlled columns.

-- Ensure helpful columns / constraints exist
ALTER TABLE public.pending_signups ADD COLUMN IF NOT EXISTS extra_data jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.pending_signups ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Normalize email uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS uq_pending_signups_email ON public.pending_signups (email);

-- Optional: enable pgcrypto for gen_random_uuid (if not already)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- SECURITY DEFINER function: upsert pending signup
CREATE OR REPLACE FUNCTION public.insert_pending_signup(
  p_email text,
  p_extra_data jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_email IS NULL OR length(trim(p_email)) = 0 THEN
    RAISE EXCEPTION 'email requerido';
  END IF;
  -- Basic format check (very light)
  IF position('@' in p_email) = 0 THEN
    RAISE EXCEPTION 'email inválido';
  END IF;

  INSERT INTO public.pending_signups(id, email, extra_data)
  VALUES (gen_random_uuid(), lower(trim(p_email)), COALESCE(p_extra_data, '{}'::jsonb))
  ON CONFLICT (email) DO UPDATE
    SET extra_data = EXCLUDED.extra_data
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Grant execution to anon & authenticated (no direct table insert granted)
GRANT EXECUTE ON FUNCTION public.insert_pending_signup(text, jsonb) TO anon, authenticated;

-- (Optional) Revoke direct table inserts from authenticated if previously granted (uncomment if needed)
-- REVOKE INSERT ON public.pending_signups FROM authenticated;

COMMENT ON FUNCTION public.insert_pending_signup(text, jsonb) IS 'SECURITY DEFINER: controlled insert/upsert into pending_signups for public signup flow.';
