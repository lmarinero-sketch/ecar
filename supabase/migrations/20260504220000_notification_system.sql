-- ========== NOTIFICATION SYSTEM ==========
-- Contacts: people who receive WhatsApp notifications
CREATE TABLE IF NOT EXISTS notification_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'General',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reminders: configurable alert rules
CREATE TABLE IF NOT EXISTS notification_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  title TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL DEFAULT 'manual', -- 'manual' | 'cheque_due' | 'obligation_due' | 'custom_date'
  trigger_days_before INTEGER DEFAULT 3,
  trigger_date DATE,
  recurrence TEXT NOT NULL DEFAULT 'once', -- 'once' | 'daily' | 'weekly' | 'monthly'
  contact_ids UUID[] DEFAULT '{}',
  message_template TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Log: history of sent notifications
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  reminder_id UUID REFERENCES notification_reminders(id) ON DELETE SET NULL,
  contact_id UUID NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  message_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'sent' | 'failed' | 'pending'
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE notification_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON notification_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON notification_reminders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON notification_log FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notification_contacts_tenant ON notification_contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_reminders_tenant ON notification_reminders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_sent_at ON notification_log(sent_at DESC);
