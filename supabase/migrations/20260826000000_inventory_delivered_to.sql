-- Migration: Add delivered_to_text to inventory_movements
-- Date: 2026-08-26

ALTER TABLE inventory_movements
ADD COLUMN IF NOT EXISTS delivered_to_text TEXT;
