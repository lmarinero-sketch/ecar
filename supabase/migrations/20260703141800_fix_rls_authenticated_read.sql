-- ═══════════════════════════════════════════════════════════════
-- FIX: Policies de lectura para usuarios autenticados
-- Problema: get_my_tenant_id() falla cuando GoTrue tiene
-- problemas internos, bloqueando todas las queries con RLS.
-- Solución: Agregar policy de lectura directa por authenticated.
-- Fecha: 2026-07-03
-- ═══════════════════════════════════════════════════════════════

-- 1. purchase_invoices: permitir lectura autenticada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'allow_authenticated_read' 
    AND tablename = 'purchase_invoices'
  ) THEN
    DROP POLICY IF EXISTS "allow_authenticated_read" ON purchase_invoices;
CREATE POLICY "allow_authenticated_read" ON purchase_invoices
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

-- 2. suppliers: necesario para el JOIN supplier:suppliers(*)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'allow_authenticated_read' 
    AND tablename = 'suppliers'
  ) THEN
    DROP POLICY IF EXISTS "allow_authenticated_read" ON suppliers;
CREATE POLICY "allow_authenticated_read" ON suppliers
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

-- 3. gastos_items: necesario para el selector de rubros de gasto
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'allow_authenticated_read' 
    AND tablename = 'gastos_items'
  ) THEN
    DROP POLICY IF EXISTS "allow_authenticated_read" ON gastos_items;
CREATE POLICY "allow_authenticated_read" ON gastos_items
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

-- 4. projects: necesario para múltiples módulos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'allow_authenticated_read' 
    AND tablename = 'projects'
  ) THEN
    DROP POLICY IF EXISTS "allow_authenticated_read" ON projects;
CREATE POLICY "allow_authenticated_read" ON projects
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

-- 5. employees: necesario para RRHH y múltiples joins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'allow_authenticated_read' 
    AND tablename = 'employees'
  ) THEN
    DROP POLICY IF EXISTS "allow_authenticated_read" ON employees;
CREATE POLICY "allow_authenticated_read" ON employees
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

-- 6. profiles: necesario para autenticación
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'allow_authenticated_read' 
    AND tablename = 'profiles'
  ) THEN
    DROP POLICY IF EXISTS "allow_authenticated_read" ON profiles;
CREATE POLICY "allow_authenticated_read" ON profiles
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

-- 7. cheques
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'allow_authenticated_read' 
    AND tablename = 'cheques'
  ) THEN
    DROP POLICY IF EXISTS "allow_authenticated_read" ON cheques;
CREATE POLICY "allow_authenticated_read" ON cheques
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

-- 8. obligations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'allow_authenticated_read' 
    AND tablename = 'obligations'
  ) THEN
    DROP POLICY IF EXISTS "allow_authenticated_read" ON obligations;
CREATE POLICY "allow_authenticated_read" ON obligations
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

-- 9. invoices (facturación emitida)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'allow_authenticated_read' 
    AND tablename = 'invoices'
  ) THEN
    DROP POLICY IF EXISTS "allow_authenticated_read" ON invoices;
CREATE POLICY "allow_authenticated_read" ON invoices
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

-- 10. union_categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'allow_authenticated_read' 
    AND tablename = 'union_categories'
  ) THEN
    DROP POLICY IF EXISTS "allow_authenticated_read" ON union_categories;
CREATE POLICY "allow_authenticated_read" ON union_categories
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

-- 11. attendance_records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'allow_authenticated_read' 
    AND tablename = 'attendance_records'
  ) THEN
    DROP POLICY IF EXISTS "allow_authenticated_read" ON attendance_records;
CREATE POLICY "allow_authenticated_read" ON attendance_records
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

-- 12. cash_movements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'allow_authenticated_read' 
    AND tablename = 'cash_movements'
  ) THEN
    DROP POLICY IF EXISTS "allow_authenticated_read" ON cash_movements;
CREATE POLICY "allow_authenticated_read" ON cash_movements
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

-- 13. bank_accounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'allow_authenticated_read' 
    AND tablename = 'bank_accounts'
  ) THEN
    DROP POLICY IF EXISTS "allow_authenticated_read" ON bank_accounts;
CREATE POLICY "allow_authenticated_read" ON bank_accounts
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

-- 14. payment_records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'allow_authenticated_read' 
    AND tablename = 'payment_records'
  ) THEN
    DROP POLICY IF EXISTS "allow_authenticated_read" ON payment_records;
CREATE POLICY "allow_authenticated_read" ON payment_records
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

-- 15. fixed_expenses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'allow_authenticated_read' 
    AND tablename = 'fixed_expenses'
  ) THEN
    DROP POLICY IF EXISTS "allow_authenticated_read" ON fixed_expenses;
CREATE POLICY "allow_authenticated_read" ON fixed_expenses
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

-- Notificar a PostgREST para que recargue el schema
NOTIFY pgrst, 'reload schema';
