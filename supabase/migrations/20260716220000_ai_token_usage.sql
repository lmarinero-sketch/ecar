-- Tabla para registrar el uso de tokens de la API de OpenAI (Rombo AI)
-- Se usa para monitorear el costo de las llamadas a la IA desde el dashboard

CREATE TABLE IF NOT EXISTS public.ai_token_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  model text NOT NULL DEFAULT 'gpt-4o',
  prompt_tokens integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL DEFAULT 0,
  total_tokens integer NOT NULL DEFAULT 0,
  cost_usd numeric(10, 6) GENERATED ALWAYS AS (
    (prompt_tokens::numeric / 1000000 * 0.15) + (completion_tokens::numeric / 1000000 * 0.60)
  ) STORED,
  source text, -- 'rombo_chat', 'process_invoice', etc.
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índice para consultas por tenant y fecha
CREATE INDEX IF NOT EXISTS ai_token_usage_tenant_idx ON public.ai_token_usage (tenant_id, created_at DESC);

-- RLS: solo el tenant puede ver sus propios datos
ALTER TABLE public.ai_token_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_token_usage_select" ON public.ai_token_usage
  FOR SELECT USING (true);

CREATE POLICY "ai_token_usage_insert" ON public.ai_token_usage
  FOR INSERT WITH CHECK (true);

COMMENT ON TABLE public.ai_token_usage IS 'Registro de uso de tokens de OpenAI para monitoreo de costos de la IA Rombo.';
