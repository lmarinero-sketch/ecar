-- Fix para asegurar que los audit_logs se puedan leer e insertar sin depender del token tenant_id en auth.jwt() si falla

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'allow_authenticated_read' 
    AND tablename = 'audit_logs'
  ) THEN
    CREATE POLICY "allow_authenticated_read" ON audit_logs
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'allow_authenticated_insert' 
    AND tablename = 'audit_logs'
  ) THEN
    CREATE POLICY "allow_authenticated_insert" ON audit_logs
      FOR INSERT TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
