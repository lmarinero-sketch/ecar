-- Entregas: Agregar nuevos estados si no existen, y agregar `rejection_reason`
ALTER TABLE logistics_deliveries
ADD COLUMN IF NOT EXISTS rejection_reason text;

ALTER TABLE inventory_movements
ADD COLUMN IF NOT EXISTS unit_cost numeric(14, 2);

-- Vehículos: Agregar estado (puede ser un CHECK constraint o text)
ALTER TABLE fuel_vehicles
ADD COLUMN IF NOT EXISTS status text DEFAULT 'activo' CHECK (status IN ('activo', 'con_observaciones', 'fuera_de_servicio'));

-- Triggers para Logística
-- Al pasar una entrega a estado "entregado", restar el stock
CREATE OR REPLACE FUNCTION handle_delivery_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'entregado' AND (OLD.status IS NULL OR OLD.status != 'entregado') THEN
    UPDATE inventory_items 
    SET current_stock = current_stock - 1
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS delivery_completed_trigger ON logistics_deliveries;
CREATE TRIGGER delivery_completed_trigger
AFTER UPDATE ON logistics_deliveries
FOR EACH ROW
EXECUTE FUNCTION handle_delivery_completed();
