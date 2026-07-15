CREATE TABLE IF NOT EXISTS project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER DEFAULT 0,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_documents_project ON project_documents(project_id);

ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_documents_all" ON project_documents FOR ALL USING (true) WITH CHECK (true);

-- Ensure a bucket exists for project-documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-documents', 'project-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS para storage
CREATE POLICY "project_documents_select" ON storage.objects FOR SELECT USING (bucket_id = 'project-documents');
CREATE POLICY "project_documents_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'project-documents');
CREATE POLICY "project_documents_update" ON storage.objects FOR UPDATE USING (bucket_id = 'project-documents');
CREATE POLICY "project_documents_delete" ON storage.objects FOR DELETE USING (bucket_id = 'project-documents');
