-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION: Opportunity Files and Storage Bucket
-- Fecha: 2026-06-20
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Create table opportunity_files
CREATE TABLE IF NOT EXISTS opportunity_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'a0000000-0000-0000-0000-000000000001',
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  observations TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE opportunity_files ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for opportunity_files' AND tablename = 'opportunity_files') THEN
    CREATE POLICY "Allow all for opportunity_files" ON opportunity_files FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 2. Create bucket opportunity-files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'opportunity-files',
  'opportunity-files',
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
    'application/octet-stream',
    'application/x-step',
    'model/vnd.dwg',
    'image/vnd.dwg',
    'application/acad'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Policies for opportunity-files
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_upload_opportunity_files' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "auth_upload_opportunity_files" ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'opportunity-files');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_read_opportunity_files' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "auth_read_opportunity_files" ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = 'opportunity-files');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_delete_opportunity_files' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "auth_delete_opportunity_files" ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'opportunity-files');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_opportunity_files' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "public_read_opportunity_files" ON storage.objects FOR SELECT TO anon
      USING (bucket_id = 'opportunity-files');
  END IF;
END $$;
