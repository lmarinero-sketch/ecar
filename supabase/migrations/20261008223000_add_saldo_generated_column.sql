ALTER TABLE obra_tramo_items ADD COLUMN IF NOT EXISTS saldo NUMERIC GENERATED ALWAYS AS (cantidad_prevista - cantidad_ejecutada) STORED;
