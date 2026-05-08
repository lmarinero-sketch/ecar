-- Fix RLS on whatsapp_conversations to allow Edge Functions (service_role) to write
-- Also add policy for service_role if RLS is enabled

-- Disable RLS since this table is only accessed by Edge Functions with service_role
ALTER TABLE IF EXISTS whatsapp_conversations DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "service_role_all" ON whatsapp_conversations;
DROP POLICY IF EXISTS "Allow service role full access" ON whatsapp_conversations;
