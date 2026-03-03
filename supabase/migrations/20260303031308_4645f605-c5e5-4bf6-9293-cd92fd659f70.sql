
-- Add soft-delete column
ALTER TABLE public.efi_records ADD COLUMN is_deleted boolean NOT NULL DEFAULT false;

-- Recreate SELECT policy filtering soft-deleted records
DROP POLICY IF EXISTS "Users can view own EFI records" ON public.efi_records;
CREATE POLICY "Users can view own EFI records"
ON public.efi_records
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id AND is_deleted = false);

-- Allow users to update their own records (for soft delete)
CREATE POLICY "Users can soft delete own EFI records"
ON public.efi_records
FOR UPDATE
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
