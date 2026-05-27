-- Create function to auto map purchase invoices to gastos_items
CREATE OR REPLACE FUNCTION fn_auto_map_purchase_invoice_gasto()
RETURNS TRIGGER AS $$
DECLARE
  v_supplier_name text;
  v_item_id uuid;
BEGIN
  -- Only attempt auto-mapping if gasto_item_id is not set
  IF NEW.gasto_item_id IS NULL THEN
    -- Get supplier name if supplier_id is set
    IF NEW.supplier_id IS NOT NULL THEN
      SELECT name INTO v_supplier_name FROM suppliers WHERE id = NEW.supplier_id;
    END IF;
    
    -- Fallback to OCR provider name if supplier name is still null
    IF v_supplier_name IS NULL AND NEW.ocr_raw_data IS NOT NULL THEN
      v_supplier_name := NEW.ocr_raw_data->>'proveedor_cliente';
    END IF;

    -- If we have a supplier name, perform keyword matching
    IF v_supplier_name IS NOT NULL THEN
      v_supplier_name := upper(v_supplier_name);
      
      -- Match logic based on common Argentine suppliers and categories
      IF v_supplier_name LIKE '%YPF%' OR v_supplier_name LIKE '%SHELL%' OR v_supplier_name LIKE '%AXION%' OR v_supplier_name LIKE '%PAMP%' OR v_supplier_name LIKE '%COMBUSTIBLE%' THEN
        SELECT id INTO v_item_id FROM gastos_items WHERE categoria = 'combustibles' AND activo = true LIMIT 1;
      ELSIF v_supplier_name LIKE '%LIDERAR%' OR v_supplier_name LIKE '%SANCOR%' OR v_supplier_name LIKE '%SEGURO%' OR v_supplier_name LIKE '%ASOCIACION%' THEN
        SELECT id INTO v_item_id FROM gastos_items WHERE categoria = 'seguros' AND activo = true ORDER BY (descripcion LIKE '%LIDERAR%') DESC LIMIT 1;
      ELSIF v_supplier_name LIKE '%NATURGY%' THEN
        SELECT id INTO v_item_id FROM gastos_items WHERE descripcion LIKE '%NATURGY%' AND activo = true ORDER BY id LIMIT 1;
      ELSIF v_supplier_name LIKE '%GAS%' THEN
        SELECT id INTO v_item_id FROM gastos_items WHERE descripcion LIKE '%GAS%' AND activo = true ORDER BY id LIMIT 1;
      ELSIF v_supplier_name LIKE '%OSSE%' OR v_supplier_name LIKE '%AGUA%' THEN
        SELECT id INTO v_item_id FROM gastos_items WHERE descripcion LIKE '%OSSE%' AND activo = true LIMIT 1;
      ELSIF v_supplier_name LIKE '%UOCRA%' THEN
        SELECT id INTO v_item_id FROM gastos_items WHERE descripcion LIKE '%UOCRA%' AND activo = true LIMIT 1;
      ELSIF v_supplier_name LIKE '%IERIC%' THEN
        SELECT id INTO v_item_id FROM gastos_items WHERE descripcion LIKE '%IERIC%' AND activo = true LIMIT 1;
      ELSIF v_supplier_name LIKE '%TELECOM%' OR v_supplier_name LIKE '%TELEFONICA%' OR v_supplier_name LIKE '%MOVISTAR%' OR v_supplier_name LIKE '%CLARO%' OR v_supplier_name LIKE '%PERSONAL%' THEN
        SELECT id INTO v_item_id FROM gastos_items WHERE descripcion LIKE '%TELEFONIA%' AND activo = true ORDER BY id LIMIT 1;
      ELSIF v_supplier_name LIKE '%VIANDA%' OR v_supplier_name LIKE '%ROTISERIA%' OR v_supplier_name LIKE '%COMIDA%' THEN
        SELECT id INTO v_item_id FROM gastos_items WHERE categoria = 'viandas' AND activo = true LIMIT 1;
      END IF;

      -- Assign matched item
      IF v_item_id IS NOT NULL THEN
        NEW.gasto_item_id := v_item_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_auto_map_purchase_invoice ON purchase_invoices;
CREATE TRIGGER trg_auto_map_purchase_invoice
BEFORE INSERT OR UPDATE OF supplier_id, ocr_raw_data ON purchase_invoices
FOR EACH ROW
EXECUTE FUNCTION fn_auto_map_purchase_invoice_gasto();
