-- Migration for AI token usage

CREATE TABLE IF NOT EXISTS ai_token_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001',
    module TEXT NOT NULL,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE ai_token_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_token_usage_all" ON ai_token_usage
    FOR ALL
    USING (true)
    WITH CHECK (true);
