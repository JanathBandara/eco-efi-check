ALTER TABLE public.efi_records
  ADD COLUMN vehicle_brand TEXT,
  ADD COLUMN vehicle_model TEXT,
  ADD COLUMN vehicle_year INTEGER;