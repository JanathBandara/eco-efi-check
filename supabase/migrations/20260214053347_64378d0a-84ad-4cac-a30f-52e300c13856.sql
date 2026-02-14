
-- Make user_id NOT NULL to prevent anonymous inserts
ALTER TABLE public.efi_records ALTER COLUMN user_id SET NOT NULL;
