-- =============================================
-- AUDITORÍA DE CHEQUES
-- Registra todas las acciones sobre cheques: creación, edición, eliminación, cambio de estado
-- =============================================

CREATE TABLE IF NOT EXISTS cheque_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  cheque_id UUID, -- no FK para que sobreviva a DELETE
  action TEXT NOT NULL CHECK (action IN ('created','updated','deleted','status_changed')),
  user_id UUID REFERENCES profiles(id),
  user_name TEXT,
  changes JSONB DEFAULT '{}', -- { field: { old: x, new: y } }
  snapshot JSONB DEFAULT '{}', -- copia completa del cheque al momento de la acción
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE cheque_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for cheque_audit_log" ON cheque_audit_log;
CREATE POLICY "Allow all for cheque_audit_log" ON cheque_audit_log FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_cheque_audit_cheque ON cheque_audit_log(cheque_id);
CREATE INDEX IF NOT EXISTS idx_cheque_audit_tenant ON cheque_audit_log(tenant_id, created_at DESC);
