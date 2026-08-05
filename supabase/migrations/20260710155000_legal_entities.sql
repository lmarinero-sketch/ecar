
CREATE TABLE IF NOT EXISTS legal_entities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001',
    name TEXT NOT NULL,
    cuit TEXT,
    iibb_number TEXT,
    constancia_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE legal_entities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "legal_entities_all" ON legal_entities;
CREATE POLICY "legal_entities_all" ON legal_entities
    FOR ALL
    USING (true)
    WITH CHECK (true);

ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS legal_entity_id UUID REFERENCES legal_entities(id);

