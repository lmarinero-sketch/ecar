-- Add 'liquidity' module to admin profiles
-- allowed_modules is jsonb array
UPDATE profiles
SET allowed_modules = allowed_modules || '["liquidity"]'::jsonb
WHERE role = 'admin'
  AND NOT (allowed_modules ? 'liquidity');
