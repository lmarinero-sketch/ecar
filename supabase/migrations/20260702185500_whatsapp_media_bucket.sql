-- Create bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('whatsapp_media', 'whatsapp_media', true, 10485760, null)
on conflict (id) do nothing;

-- RLS Policies
DROP POLICY IF EXISTS "WhatsApp Media public access" ON storage.objects;
CREATE POLICY "WhatsApp Media public access" ON storage.objects for select
  using ( bucket_id = 'whatsapp_media' );

DROP POLICY IF EXISTS "WhatsApp Media insert access" ON storage.objects;
CREATE POLICY "WhatsApp Media insert access" ON storage.objects for insert
  with check ( bucket_id = 'whatsapp_media' );

DROP POLICY IF EXISTS "WhatsApp Media update access" ON storage.objects;
CREATE POLICY "WhatsApp Media update access" ON storage.objects for update
  using ( bucket_id = 'whatsapp_media' );

DROP POLICY IF EXISTS "WhatsApp Media delete access" ON storage.objects;
CREATE POLICY "WhatsApp Media delete access" ON storage.objects for delete
  using ( bucket_id = 'whatsapp_media' );
