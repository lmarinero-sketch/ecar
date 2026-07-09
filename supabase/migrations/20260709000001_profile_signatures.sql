-- Migration: Digital Signatures in Profile
-- Adds DNI and signature_data columns to profiles

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS dni VARCHAR(20),
ADD COLUMN IF NOT EXISTS signature_data TEXT;
