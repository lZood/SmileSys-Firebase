-- Add encrypted_password column to pending_signups for Option 1 (store password encrypted until verification)
alter table public.pending_signups add column if not exists encrypted_password text;

-- (Optional) For safety, restrict length
-- alter table public.pending_signups add constraint encrypted_password_len check (char_length(encrypted_password) < 4096);
