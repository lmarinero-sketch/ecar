-- Create storage bucket for purchase invoice scans (facturas de compra)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'purchase-scans',
  'purchase-scans',
  true,
  52428800, -- 50MB max
  ARRAY[
    'image/jpeg','image/png','image/webp','image/gif',
    'application/pdf'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users can upload/read/delete
DROP POLICY IF EXISTS "auth_upload_purchase_scans" ON storage.objects;
CREATE POLICY "auth_upload_purchase_scans" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'purchase-scans');

DROP POLICY IF EXISTS "auth_read_purchase_scans" ON storage.objects;
CREATE POLICY "auth_read_purchase_scans" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'purchase-scans');

DROP POLICY IF EXISTS "auth_delete_purchase_scans" ON storage.objects;
CREATE POLICY "auth_delete_purchase_scans" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'purchase-scans');
