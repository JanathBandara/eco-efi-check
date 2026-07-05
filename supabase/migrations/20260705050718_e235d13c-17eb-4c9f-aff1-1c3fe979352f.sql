ALTER TABLE public.efi_records
  ADD COLUMN IF NOT EXISTS co_percentile integer,
  ADD COLUMN IF NOT EXISTS co_average numeric;