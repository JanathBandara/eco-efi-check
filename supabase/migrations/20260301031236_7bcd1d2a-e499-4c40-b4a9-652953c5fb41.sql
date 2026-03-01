ALTER TABLE public.efi_records
  ADD COLUMN IF NOT EXISTS percentile integer,
  ADD COLUMN IF NOT EXISTS condition text,
  ADD COLUMN IF NOT EXISTS ai_insight jsonb;