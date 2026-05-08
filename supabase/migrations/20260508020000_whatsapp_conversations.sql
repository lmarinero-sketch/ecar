-- ========== WHATSAPP CONVERSATIONS ==========
-- Persists multi-turn conversation history per WhatsApp number
-- so Rombo can ask follow-up questions and remember context

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,            -- normalized phone e.g. '5492641234567'
  messages JSONB NOT NULL DEFAULT '[]',  -- array of {role, content, timestamp}
  last_intent TEXT,               -- last detected intent (create_cheque, query_attendance, etc.)
  pending_data JSONB DEFAULT '{}', -- partial data collected so far for the current intent
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- One conversation per phone number
CREATE UNIQUE INDEX IF NOT EXISTS idx_wa_conv_phone ON whatsapp_conversations(phone);
CREATE INDEX IF NOT EXISTS idx_wa_conv_updated ON whatsapp_conversations(updated_at DESC);

-- RLS: service-role only (edge function uses service key)
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (edge functions use service_role key which bypasses RLS)
-- No user-facing RLS policy needed since this is backend-only
