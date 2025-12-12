-- Create a private storage bucket for ML models
INSERT INTO storage.buckets (id, name, public)
VALUES ('ml-models', 'ml-models', false);

-- Allow Edge Functions to read model files (using service role)
-- No public access - only server-side access
CREATE POLICY "Service role can read models"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ml-models');