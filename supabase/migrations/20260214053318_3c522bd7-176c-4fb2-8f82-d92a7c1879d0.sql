
-- Drop and recreate policies with explicit auth check
DROP POLICY IF EXISTS "Users can insert own EFI records" ON public.efi_records;
DROP POLICY IF EXISTS "Users can view own EFI records" ON public.efi_records;

CREATE POLICY "Users can insert own EFI records"
ON public.efi_records
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can view own EFI records"
ON public.efi_records
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
