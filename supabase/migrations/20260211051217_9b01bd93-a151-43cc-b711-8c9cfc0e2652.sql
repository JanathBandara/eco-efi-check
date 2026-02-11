
-- Add user_id column to efi_records (nullable for existing records)
ALTER TABLE public.efi_records 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old permissive policies
DROP POLICY IF EXISTS "Anyone can insert EFI records" ON public.efi_records;
DROP POLICY IF EXISTS "Anyone can view EFI records" ON public.efi_records;

-- New RLS: users can only insert their own records
CREATE POLICY "Users can insert own EFI records"
ON public.efi_records
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- New RLS: users can only view their own records
CREATE POLICY "Users can view own EFI records"
ON public.efi_records
FOR SELECT
USING (auth.uid() = user_id);
