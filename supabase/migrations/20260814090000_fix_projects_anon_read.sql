-- ═══════════════════════════════════════════════════════════════
-- FIX: Permitir lectura pública de proyectos para escaneo QR y solicitudes
-- Problema: Usuarios no autenticados en el cel al escanear QR de máquinas
-- no podían ver el listado de obras activas para asignarlo.
-- Fecha: 2026-08-14
-- ═══════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'allow_anon_read' 
    AND tablename = 'projects'
  ) THEN
    DROP POLICY IF EXISTS "allow_anon_read" ON projects;
    CREATE POLICY "allow_anon_read" ON projects
      FOR SELECT TO anon
      USING (true);
  END IF;
END $$;
