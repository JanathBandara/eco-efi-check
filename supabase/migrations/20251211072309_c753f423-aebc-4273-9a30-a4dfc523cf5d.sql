-- Create table for storing EFI analysis records
CREATE TABLE public.efi_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  input JSONB NOT NULL,
  efi_score INTEGER NOT NULL CHECK (efi_score >= 0 AND efi_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.efi_records ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (no auth required for this app)
CREATE POLICY "Anyone can view EFI records" 
ON public.efi_records 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert EFI records" 
ON public.efi_records 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries by date
CREATE INDEX idx_efi_records_created_at ON public.efi_records (created_at DESC);