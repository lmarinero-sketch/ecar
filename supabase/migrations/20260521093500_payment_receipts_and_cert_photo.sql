-- 1. Modificar la tabla payment_records para permitir registros generales
ALTER TABLE payment_records ALTER COLUMN entity_type DROP NOT NULL;
ALTER TABLE payment_records ALTER COLUMN entity_id DROP NOT NULL;

-- Relajar la restricción CHECK de entity_type si existe
ALTER TABLE payment_records DROP CONSTRAINT IF EXISTS payment_records_entity_type_check;
ALTER TABLE payment_records ADD CONSTRAINT payment_records_entity_type_check 
  CHECK (entity_type IS NULL OR entity_type IN ('supplier','employee','obligation','general','other'));

-- 2. Modificar la tabla project_certificates para añadir la columna de foto
ALTER TABLE project_certificates ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 3. Crear el bucket para comprobantes de pago
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-receipts',
  'payment-receipts',
  true,
  20971520, -- 20MB max
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Policies for payment-receipts
DROP POLICY IF EXISTS "auth_upload_receipts" ON storage.objects;
DROP POLICY IF EXISTS "auth_read_receipts" ON storage.objects;
DROP POLICY IF EXISTS "auth_delete_receipts" ON storage.objects;
CREATE POLICY "auth_upload_receipts" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'payment-receipts');
CREATE POLICY "auth_read_receipts" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'payment-receipts');
CREATE POLICY "auth_delete_receipts" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'payment-receipts');

-- 4. Crear el bucket para certificaciones de obra
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-certificates',
  'project-certificates',
  true,
  20971520, -- 20MB max
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Policies for project-certificates
DROP POLICY IF EXISTS "auth_upload_certs" ON storage.objects;
DROP POLICY IF EXISTS "auth_read_certs" ON storage.objects;
DROP POLICY IF EXISTS "auth_delete_certs" ON storage.objects;
CREATE POLICY "auth_upload_certs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'project-certificates');
CREATE POLICY "auth_read_certs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'project-certificates');
CREATE POLICY "auth_delete_certs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'project-certificates');

-- 5. Asegurar la integridad de perfiles huérfanos o con tenant_id nulo
UPDATE public.profiles
SET tenant_id = 'a0000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL OR tenant_id = '';
