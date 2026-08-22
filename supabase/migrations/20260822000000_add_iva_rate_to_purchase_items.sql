-- ==============================================================================
-- Migration: 20260822000000_add_iva_rate_to_purchase_items.sql
-- Description: Add iva_rate and iva_amount columns to purchase_invoice_items
-- ==============================================================================

ALTER TABLE public.purchase_invoice_items
ADD COLUMN IF NOT EXISTS iva_rate NUMERIC DEFAULT 21,
ADD COLUMN IF NOT EXISTS iva_amount NUMERIC DEFAULT 0;
