-- =============================================
-- CONFIGURACIÓN DEL SISTEMA
-- Key-value store para settings globales del tenant
-- =============================================

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, key)
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for system_settings" ON system_settings FOR ALL USING (true) WITH CHECK (true);

-- Seed: número autorizado de WhatsApp para pedidos (vacío = deshabilitado)
INSERT INTO system_settings (tenant_id, key, value, description)
SELECT t.id, 'whatsapp_purchase_phone', '', 'Número de WhatsApp autorizado para pedidos de insumos (ej: 5492641234567)'
FROM tenants t
ON CONFLICT (tenant_id, key) DO NOTHING;
