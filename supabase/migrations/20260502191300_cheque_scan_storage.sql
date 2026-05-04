-- Add scan_url column to cheques for storing the uploaded image/PDF
ALTER TABLE cheques ADD COLUMN IF NOT EXISTS scan_url TEXT;

-- Create storage bucket for cheque scans
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cheque-scans',
  'cheque-scans',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users can upload and read their own files
CREATE POLICY "tenant_upload_cheque_scans"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'cheque-scans' AND auth.role() = 'authenticated');

CREATE POLICY "tenant_read_cheque_scans"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cheque-scans' AND auth.role() = 'authenticated');

CREATE POLICY "tenant_delete_cheque_scans"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'cheque-scans' AND auth.role() = 'authenticated');
