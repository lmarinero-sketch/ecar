-- ========== AUTOMATED REMINDER SCHEDULER ==========
-- Uses pg_cron + pg_net to call the process-reminders Edge Function every 5 minutes.
-- This runs entirely in Supabase cloud — no local process needed.

-- 1. Enable required extensions (pg_cron is pre-installed on Supabase hosted)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Store the service role key in Vault for secure access
-- NOTE: You must set this secret via Supabase Dashboard > Settings > Vault
-- or via SQL after linking. The key below is the anon key for initial setup.
-- For production, replace with service_role_key via Dashboard Vault.

-- 3. Create the cron job that calls our Edge Function every 5 minutes
-- Uses the anon key for auth (the Edge Function uses SUPABASE_SERVICE_ROLE_KEY internally)
SELECT cron.schedule(
  'process-reminders-every-5min',  -- unique job name
  '*/5 * * * *',                    -- every 5 minutes
  $$
  SELECT net.http_post(
    url := 'https://pxvhovctyewwppwkldaq.supabase.co/functions/v1/process-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer sb_publishable_g69DX3OvYEfAudoOH2fsMw_ndQc6EGl"}'::jsonb,
    body := '{"source": "pg_cron"}'::jsonb
  ) AS request_id;
  $$
);

-- 4. Daily job at 8:00 AM Argentina (11:00 UTC) to auto-trigger due-based reminders
-- Detects cheques/obligations about to expire and sets their next_run_at = NOW()
SELECT cron.schedule(
  'auto-trigger-due-reminders',
  '0 11 * * *',  -- 8:00 AM Argentina (UTC-3)
  $$
  -- Auto-set next_run_at for cheque_due reminders when a cheque is N days from due
  UPDATE notification_reminders nr
  SET next_run_at = NOW()
  WHERE nr.is_active = TRUE
    AND nr.trigger_type = 'cheque_due'
    AND (nr.next_run_at IS NULL OR nr.next_run_at < NOW() - INTERVAL '1 day')
    AND EXISTS (
      SELECT 1 FROM cheques c
      WHERE c.status = 'pending'
        AND c.due_date IS NOT NULL
        AND c.due_date - CURRENT_DATE = nr.trigger_days_before
    );

  -- Auto-set next_run_at for obligation_due reminders
  UPDATE notification_reminders nr
  SET next_run_at = NOW()
  WHERE nr.is_active = TRUE
    AND nr.trigger_type = 'obligation_due'
    AND (nr.next_run_at IS NULL OR nr.next_run_at < NOW() - INTERVAL '1 day')
    AND EXISTS (
      SELECT 1 FROM obligations o
      WHERE o.status = 'pending'
        AND o.due_day_of_month IS NOT NULL
        AND o.due_day_of_month - EXTRACT(DAY FROM CURRENT_DATE)::int = nr.trigger_days_before
    );
  $$
);
