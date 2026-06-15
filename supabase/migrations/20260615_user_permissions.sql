-- ═══════════════════════════════════════════════════════════════
-- Migración: Permisos granulares por módulo + rol "colaborador"
-- ═══════════════════════════════════════════════════════════════

-- 1) Cambiar constraint de role: operario → colaborador
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'colaborador'));

-- 2) Actualizar registros existentes
UPDATE profiles SET role = 'colaborador' WHERE role = 'operario';

-- 3) Crear tabla de permisos granulares por módulo
CREATE TABLE IF NOT EXISTS user_module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  can_read BOOLEAN DEFAULT true,
  can_write BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, module_id)
);

-- 4) Índices
CREATE INDEX IF NOT EXISTS idx_user_module_permissions_profile 
  ON user_module_permissions(profile_id);

-- 5) RLS
ALTER TABLE user_module_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON user_module_permissions
  FOR ALL USING (
    profile_id IN (
      SELECT id FROM profiles WHERE tenant_id = get_my_tenant_id()
    )
  );

-- 6) Actualizar Enrico a colaborador (si existe)
UPDATE profiles SET role = 'colaborador' 
WHERE email = 'enrico@growlabs.lat' AND role = 'admin';

-- Verificación
SELECT id, full_name, email, role FROM profiles ORDER BY full_name;
