-- Desacoplar ODTs y Partes Diarios de la topología exclusiva de tramos para permitir programación directa desde WBS (obra_items)
ALTER TABLE obra_ordenes_trabajo ALTER COLUMN tramo_item_id DROP NOT NULL;
ALTER TABLE obra_ordenes_trabajo ALTER COLUMN tramo_id DROP NOT NULL;

ALTER TABLE obra_parte_diario_items ALTER COLUMN tramo_item_id DROP NOT NULL;
ALTER TABLE obra_parte_diario_items ADD COLUMN IF NOT EXISTS item_id UUID REFERENCES obra_items(id) ON DELETE CASCADE;
ALTER TABLE obra_parte_diario_items ADD COLUMN IF NOT EXISTS tramo_id UUID REFERENCES obra_tramos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_obra_odt_item ON obra_ordenes_trabajo(item_id);
CREATE INDEX IF NOT EXISTS idx_obra_pdi_item ON obra_parte_diario_items(item_id);

NOTIFY pgrst, 'reload schema';
