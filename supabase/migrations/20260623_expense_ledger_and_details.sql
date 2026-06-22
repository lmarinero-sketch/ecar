-- ==============================================================================
-- Migration: 20260623_expense_ledger_and_details.sql
-- Description: Adds partial payment (ledger) support for Gastos Operativos
--              and additional detail columns for alias, cbu, etc.
-- ==============================================================================

-- 1. Add fields to gastos_items
ALTER TABLE gastos_items
ADD COLUMN IF NOT EXISTS alias_cbu text,
ADD COLUMN IF NOT EXISTS titular_cuenta text,
ADD COLUMN IF NOT EXISTS aclaraciones text,
ADD COLUMN IF NOT EXISTS importe_mensual_default numeric(15,2);

-- 2. Add field to gastos_registros
ALTER TABLE gastos_registros
ADD COLUMN IF NOT EXISTS monto_pagado numeric(15,2) DEFAULT 0;

-- 3. Create Trigger to automatically sync monto_pagado from weekly_payment_items
CREATE OR REPLACE FUNCTION sync_gasto_ledger()
RETURNS TRIGGER AS $$
BEGIN
  -- Revertir el impacto del old record (solo si estaba pagado)
  IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') THEN
    IF OLD.source_type = 'gastos_operativos' AND OLD.pagado = true THEN
      UPDATE gastos_registros
      SET monto_pagado = monto_pagado - OLD.monto
      WHERE id = OLD.source_id::uuid;
    END IF;
  END IF;

  -- Aplicar el impacto del new record (solo si está pagado)
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF NEW.source_type = 'gastos_operativos' AND NEW.pagado = true THEN
      UPDATE gastos_registros
      SET monto_pagado = monto_pagado + NEW.monto
      WHERE id = NEW.source_id::uuid;
    END IF;
  END IF;

  -- Actualizar el booleano 'pagado' basado en el saldo restante
  IF TG_OP != 'DELETE' THEN
    IF NEW.source_type = 'gastos_operativos' THEN
       UPDATE gastos_registros
       SET pagado = (monto_pagado >= monto)
       WHERE id = NEW.source_id::uuid;
    END IF;
  ELSE
    IF OLD.source_type = 'gastos_operativos' THEN
       UPDATE gastos_registros
       SET pagado = (monto_pagado >= monto)
       WHERE id = OLD.source_id::uuid;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_gasto_ledger ON weekly_payment_items;
CREATE TRIGGER trigger_sync_gasto_ledger
AFTER INSERT OR UPDATE OR DELETE ON weekly_payment_items
FOR EACH ROW EXECUTE FUNCTION sync_gasto_ledger();

-- 4. Actualizar los source_id de los pagos existentes (que apuntaban a gastos_items) 
--    para que apunten al gastos_registros del mes correspondiente a la fecha del pago
UPDATE weekly_payment_items wpi
SET source_id = (
  SELECT r.id
  FROM gastos_registros r
  JOIN weekly_payments wp ON wp.id = wpi.payment_id
  WHERE r.item_id = wpi.source_id
    AND r.periodo = TO_CHAR(wp.payment_date::date, 'YYYY-MM')
  LIMIT 1
)
WHERE wpi.source_type = 'gastos_operativos' 
  AND EXISTS (SELECT 1 FROM gastos_items WHERE id = wpi.source_id::uuid);

-- 5. Recalcular el monto_pagado inicial de los registros basado en los pagos ya existentes marcados como pagados
WITH pagos_agrupados AS (
  SELECT source_id::uuid as reg_id, SUM(monto) as total_pagado
  FROM weekly_payment_items
  WHERE source_type = 'gastos_operativos' AND pagado = true AND source_id IS NOT NULL
  GROUP BY source_id
)
UPDATE gastos_registros gr
SET monto_pagado = COALESCE(pa.total_pagado, 0),
    pagado = (COALESCE(pa.total_pagado, 0) >= gr.monto)
FROM pagos_agrupados pa
WHERE gr.id = pa.reg_id;
