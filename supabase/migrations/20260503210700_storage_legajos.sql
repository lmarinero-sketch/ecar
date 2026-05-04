-- Create storage bucket for employee documents (legajos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'legajos',
  'legajos',
  false,
  52428800, -- 50MB max
  ARRAY[
    'image/jpeg','image/png','image/webp','image/gif',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', -- .docx
    'application/msword', -- .doc
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', -- .xlsx
    'application/vnd.ms-excel', -- .xls
    'text/csv'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users can upload/read/delete
CREATE POLICY "auth_upload_legajos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'legajos');

CREATE POLICY "auth_read_legajos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'legajos');

CREATE POLICY "auth_delete_legajos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'legajos');
