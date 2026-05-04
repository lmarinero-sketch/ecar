-- Make cheque-scans bucket public so images can be viewed via public URL
UPDATE storage.buckets SET public = true WHERE id = 'cheque-scans';
