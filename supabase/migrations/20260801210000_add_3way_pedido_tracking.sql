-- 3-Way Pedido Tracking: Solicitado vs Enviado vs Recibido
ALTER TABLE purchase_request_items ADD COLUMN IF NOT EXISTS quantity_sent NUMERIC DEFAULT NULL;
ALTER TABLE purchase_request_items ADD COLUMN IF NOT EXISTS quantity_received NUMERIC DEFAULT NULL;
ALTER TABLE purchase_request_items ADD COLUMN IF NOT EXISTS dispatch_notes TEXT DEFAULT NULL;
ALTER TABLE purchase_request_items ADD COLUMN IF NOT EXISTS reception_notes TEXT DEFAULT NULL;

ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS dispatched_by TEXT DEFAULT NULL;
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS received_by TEXT DEFAULT NULL;
