-- Add gasto_item_id to purchase_invoices to link invoices with operational expenses
ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS gasto_item_id uuid REFERENCES gastos_items(id) ON DELETE SET NULL;
