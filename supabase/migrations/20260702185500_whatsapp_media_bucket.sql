-- Create bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('whatsapp_media', 'whatsapp_media', true, 10485760, null)
on conflict (id) do nothing;

-- RLS Policies
create policy "WhatsApp Media public access"
  on storage.objects for select
  using ( bucket_id = 'whatsapp_media' );

create policy "WhatsApp Media insert access"
  on storage.objects for insert
  with check ( bucket_id = 'whatsapp_media' );

create policy "WhatsApp Media update access"
  on storage.objects for update
  using ( bucket_id = 'whatsapp_media' );

create policy "WhatsApp Media delete access"
  on storage.objects for delete
  using ( bucket_id = 'whatsapp_media' );
