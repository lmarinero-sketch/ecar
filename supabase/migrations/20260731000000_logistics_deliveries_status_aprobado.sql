-- ============================================================
-- Update logistics_deliveries status constraint
-- ============================================================

ALTER TABLE logistics_deliveries DROP CONSTRAINT IF EXISTS logistics_deliveries_status_check;
ALTER TABLE logistics_deliveries ADD CONSTRAINT logistics_deliveries_status_check CHECK (status IN ('pendiente', 'aprobado', 'en_transito', 'entregado', 'cancelado'));
