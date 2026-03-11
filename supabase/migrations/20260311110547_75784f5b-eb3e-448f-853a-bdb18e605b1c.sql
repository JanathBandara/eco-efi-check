-- Ensure efi-distribution bucket is private
UPDATE storage.buckets SET public = false WHERE id = 'efi-distribution';

-- Add RLS policy: only service role (used by edge function) can read
CREATE POLICY "Service role can read distribution data"
ON storage.objects FOR SELECT
USING (bucket_id = 'efi-distribution');