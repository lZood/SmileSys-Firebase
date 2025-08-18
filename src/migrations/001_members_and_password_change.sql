-- Migration: Add members table and password change requirements
-- Execute these statements in Supabase SQL Editor

-- 1. Create members table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_title text,
    roles text[] DEFAULT '{}'::text[],
    is_active boolean DEFAULT true,
    must_change_password boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_members_clinic_id ON public.members(clinic_id);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON public.members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_is_active ON public.members(is_active);

-- 3. Add unique constraint to prevent duplicate user_id per clinic
ALTER TABLE public.members 
ADD CONSTRAINT IF NOT EXISTS unique_user_clinic 
UNIQUE (user_id, clinic_id);

-- 4. Add must_change_password column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS must_change_password boolean DEFAULT false;

-- 5. Add roles column to profiles if it doesn't exist (for consistency)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS roles text[] DEFAULT '{}'::text[];

-- 6. Add schedule and google_calendar_reminder_minutes to clinics table
ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS schedule jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS google_calendar_reminder_minutes integer DEFAULT 1440;

-- 7. Add constraint to ensure google_calendar_reminder_minutes is positive
ALTER TABLE public.clinics 
ADD CONSTRAINT IF NOT EXISTS check_reminder_minutes_positive 
CHECK (google_calendar_reminder_minutes >= 0);

-- 8. Create helper functions for RLS (to avoid infinite recursion)
CREATE OR REPLACE FUNCTION public.is_in_clinic(uid uuid, cid uuid)
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER 
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles
    WHERE id = uid AND clinic_id = cid
  );
$$;

CREATE OR REPLACE FUNCTION public.is_clinic_admin(uid uuid, cid uuid)
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER 
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles
    WHERE id = uid AND clinic_id = cid AND roles @> ARRAY['admin']::text[]
  );
$$;

-- 9. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_in_clinic(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_clinic_admin(uuid, uuid) TO authenticated;

-- 10. Enable RLS and create policies for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS profiles_owner_manage ON public.profiles;
DROP POLICY IF EXISTS profiles_clinic_admins_manage ON public.profiles;

-- Owner can manage their own profile
CREATE POLICY profiles_owner_manage ON public.profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Clinic admins can manage profiles in their clinic
CREATE POLICY profiles_clinic_admins_manage ON public.profiles
  FOR ALL
  USING (public.is_clinic_admin(auth.uid(), clinic_id))
  WITH CHECK (public.is_clinic_admin(auth.uid(), COALESCE(clinic_id, (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()))));

-- 11. Enable RLS and create policies for members table
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS members_select_same_clinic ON public.members;
DROP POLICY IF EXISTS members_admins_manage ON public.members;

-- Members of the same clinic can read members
CREATE POLICY members_select_same_clinic ON public.members
  FOR SELECT
  USING (public.is_in_clinic(auth.uid(), clinic_id));

-- Admins of the same clinic can insert/update/delete
CREATE POLICY members_admins_manage ON public.members
  FOR ALL
  USING (public.is_clinic_admin(auth.uid(), clinic_id))
  WITH CHECK (public.is_clinic_admin(auth.uid(), COALESCE(clinic_id, (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()))));

-- 12. Update existing clinics to have default schedule (optional)
UPDATE public.clinics 
SET schedule = '{
  "monday": [],
  "tuesday": [],
  "wednesday": [],
  "thursday": [],
  "friday": [],
  "saturday": [],
  "sunday": []
}'::jsonb
WHERE schedule IS NULL OR schedule = '{}'::jsonb;

-- 13. Create updated_at trigger function for members table
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 14. Create trigger for members table
DROP TRIGGER IF EXISTS update_members_updated_at ON public.members;
CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON public.members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Migration completed successfully!
