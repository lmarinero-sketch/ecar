-- Create storage bucket for meeting attachments (all file types)
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

-- Storage policies: authenticated users can upload/read/delete
CREATE POLICY "auth_upload_meeting_files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'meeting-files');

CREATE POLICY "auth_read_meeting_files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'meeting-files');

CREATE POLICY "auth_delete_meeting_files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'meeting-files');
