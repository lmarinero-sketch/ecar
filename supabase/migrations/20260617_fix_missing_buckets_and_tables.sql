-- ═══════════════════════════════════════════════════════════════════════
-- FIX: Buckets y tablas faltantes que causan errores en producción
-- Fecha: 2026-06-17
-- Problemas detectados:
--   1. Bucket 'payment-receipts' no existe → Error al subir comprobantes de pago
--   2. Bucket 'obligation-docs' no existe → Error al subir comprobantes en obligaciones
--   3. Bucket 'meeting-files' posiblemente no migrado → Error al subir adjuntos de reuniones
--   4. Bucket 'project-certificates' posiblemente no migrado → Error al subir fotos de certificación
--   5. Columna photo_url faltante en project_certificates
--   6. Restricciones de payment_records posiblemente no aplicadas
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
-- 1. BUCKET: payment-receipts (Finanzas → Comprobantes de Pago)
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-receipts',
  'payment-receipts',
  true,
  20971520, -- 20MB max
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Policies for payment-receipts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_upload_receipts' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "auth_upload_receipts" ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'payment-receipts');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_read_receipts' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "auth_read_receipts" ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = 'payment-receipts');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_delete_receipts' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "auth_delete_receipts" ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'payment-receipts');
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 2. BUCKET: obligation-docs (Obligaciones → Comprobantes fiscales)
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'obligation-docs',
  'obligation-docs',
  true,
  20971520, -- 20MB max
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
) ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_upload_obligation_docs' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "auth_upload_obligation_docs" ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'obligation-docs');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_read_obligation_docs' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "auth_read_obligation_docs" ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = 'obligation-docs');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_delete_obligation_docs' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "auth_delete_obligation_docs" ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'obligation-docs');
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 3. BUCKET: meeting-files (Implementación → Adjuntos de reuniones)
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meeting-files',
  'meeting-files',
  true,
  104857600, -- 100MB max
  ARRAY[
    'image/jpeg','image/png','image/webp','image/gif','image/bmp','image/tiff',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-rar-compressed',
    'application/octet-stream'
  ]
) ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_upload_meeting_files' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "auth_upload_meeting_files" ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'meeting-files');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_read_meeting_files' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "auth_read_meeting_files" ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = 'meeting-files');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_delete_meeting_files' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "auth_delete_meeting_files" ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'meeting-files');
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 4. BUCKET: project-certificates (Certificaciones → Fotos de depósito)
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-certificates',
  'project-certificates',
  true,
  20971520, -- 20MB max
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
) ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_upload_certs' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "auth_upload_certs" ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'project-certificates');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_read_certs' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "auth_read_certs" ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = 'project-certificates');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_delete_certs' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "auth_delete_certs" ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'project-certificates');
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 5. TABLA: payment_records → Relajar restricciones para registros generales
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE payment_records ALTER COLUMN entity_type DROP NOT NULL;
ALTER TABLE payment_records ALTER COLUMN entity_id DROP NOT NULL;

ALTER TABLE payment_records DROP CONSTRAINT IF EXISTS payment_records_entity_type_check;
ALTER TABLE payment_records ADD CONSTRAINT payment_records_entity_type_check 
  CHECK (entity_type IS NULL OR entity_type IN ('supplier','employee','obligation','general','other'));

-- ─────────────────────────────────────────────────────────────────────
-- 6. COLUMNA: project_certificates.photo_url → Foto de comprobante de depósito
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE project_certificates ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- ─────────────────────────────────────────────────────────────────────
-- 7. TABLA: system_settings → Asegurar que existe (para anotaciones de implementación)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'a0000000-0000-0000-0000-000000000001',
  key TEXT NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, key)
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Policy idempotente
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for system_settings' AND tablename = 'system_settings') THEN
    CREATE POLICY "Allow all for system_settings" ON system_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 8. Permitir acceso público (anon) para lectura de todos los buckets
--    Necesario para que getPublicUrl funcione sin autenticación
-- ─────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_payment_receipts' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "public_read_payment_receipts" ON storage.objects FOR SELECT TO anon
      USING (bucket_id = 'payment-receipts');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_obligation_docs' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "public_read_obligation_docs" ON storage.objects FOR SELECT TO anon
      USING (bucket_id = 'obligation-docs');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_meeting_files' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "public_read_meeting_files" ON storage.objects FOR SELECT TO anon
      USING (bucket_id = 'meeting-files');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_project_certs' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "public_read_project_certs" ON storage.objects FOR SELECT TO anon
      USING (bucket_id = 'project-certificates');
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- FIN DE LA MIGRACIÓN
-- ═══════════════════════════════════════════════════════════════════════
