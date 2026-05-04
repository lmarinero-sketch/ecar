-- Fix: Allow authenticated users to INSERT their own profile (bootstrapping)
CREATE POLICY "allow_profile_insert" ON profiles
  FOR INSERT
  WITH CHECK (auth_user_id = auth.uid());

-- Fix: Allow users to SELECT their own profile even before tenant resolution
CREATE POLICY "allow_own_profile_select" ON profiles
  FOR SELECT
  USING (auth_user_id = auth.uid());

-- Trigger: Auto-create profile on new auth user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (auth_user_id, tenant_id, full_name, email, role, allowed_modules)
  VALUES (
    NEW.id,
    'a0000000-0000-0000-0000-000000000001', -- Default ECAR tenant
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    CASE
      WHEN (SELECT count(*) FROM public.profiles WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001') = 0
      THEN 'admin'
      ELSE 'operario'
    END,
    CASE
      WHEN (SELECT count(*) FROM public.profiles WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001') = 0
      THEN '[]'::jsonb  -- admin gets all modules
      ELSE '["bi"]'::jsonb  -- operario starts with BI only
    END
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure existing admin user (lucasmmarinero@gmail.com) has a profile
-- This handles the case where signup happened before the trigger existed
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'lucasmmarinero@gmail.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (auth_user_id, tenant_id, full_name, email, role, allowed_modules)
    VALUES (
      v_user_id,
      'a0000000-0000-0000-0000-000000000001',
      'Lucas Marinero',
      'lucasmmarinero@gmail.com',
      'admin',
      '[]'::jsonb
    )
    ON CONFLICT (auth_user_id) DO UPDATE SET role = 'admin';
  END IF;
END $$;
