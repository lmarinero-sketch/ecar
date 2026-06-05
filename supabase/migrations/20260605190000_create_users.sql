-- ═══════════════════════════════════════════════════════════════
-- Crear 3 usuarios para ECAR con @growlabs.lat
-- Ejecutar en Supabase SQL Editor (Dashboard > SQL Editor)
-- ═══════════════════════════════════════════════════════════════

-- 1) Carlos
SELECT extensions.gen_random_uuid() AS carlos_id;

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'carlos@growlabs.lat',
  crypt('123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Carlos"}',
  '', '', ''
);

-- 2) Enrico
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'enrico@growlabs.lat',
  crypt('123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Enrico"}',
  '', '', ''
);

-- 3) Gustavo
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'gustavo@growlabs.lat',
  crypt('123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Gustavo"}',
  '', '', ''
);

-- Vincular al tenant ECAR
INSERT INTO public.tenant_users (tenant_id, user_id, role)
SELECT 'a0000000-0000-0000-0000-000000000001', id, 'admin'
FROM auth.users
WHERE email IN ('carlos@growlabs.lat', 'enrico@growlabs.lat', 'gustavo@growlabs.lat')
ON CONFLICT DO NOTHING;

-- Verificación
SELECT id, email, raw_user_meta_data->>'full_name' AS nombre, created_at
FROM auth.users
WHERE email IN ('carlos@growlabs.lat', 'enrico@growlabs.lat', 'gustavo@growlabs.lat')
ORDER BY email;
