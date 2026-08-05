-- Migration: Fuel Requests Workflow
-- Adds workflow columns to fuel_loads and creates storage bucket for fuel tickets

-- 1. Add columns to fuel_loads
ALTER TABLE fuel_loads
ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'completed' CHECK (workflow_status IN ('requested', 'authorized', 'completed', 'rejected')),
ADD COLUMN IF NOT EXISTS requested_liters NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS requested_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS authorized_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS authorized_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS supervisor_signature TEXT,
ADD COLUMN IF NOT EXISTS ticket_photo_url TEXT;

-- 2. Create Storage Bucket for fuel_tickets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('fuel_tickets', 'fuel_tickets', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for fuel_tickets
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access fuel_tickets') THEN
    DROP POLICY IF EXISTS "Public Access fuel_tickets" ON storage.objects;
CREATE POLICY "Public Access fuel_tickets" ON storage.objects FOR SELECT USING (bucket_id = 'fuel_tickets');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth Insert fuel_tickets') THEN
    DROP POLICY IF EXISTS "Auth Insert fuel_tickets" ON storage.objects;
CREATE POLICY "Auth Insert fuel_tickets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'fuel_tickets' AND auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth Update fuel_tickets') THEN
    DROP POLICY IF EXISTS "Auth Update fuel_tickets" ON storage.objects;
CREATE POLICY "Auth Update fuel_tickets" ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'fuel_tickets' AND auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth Delete fuel_tickets') THEN
    DROP POLICY IF EXISTS "Auth Delete fuel_tickets" ON storage.objects;
CREATE POLICY "Auth Delete fuel_tickets" ON storage.objects FOR DELETE USING (bucket_id = 'fuel_tickets' AND auth.role() = 'authenticated');
  END IF;
END
$$;
