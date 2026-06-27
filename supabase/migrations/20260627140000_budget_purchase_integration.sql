-- Add budget_id and request_type to purchase_requests
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE;
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS request_type TEXT DEFAULT 'purchase' CHECK (request_type IN ('purchase', 'quote'));

-- Add budget_item_id to purchase_request_items for traceability
ALTER TABLE purchase_request_items ADD COLUMN IF NOT EXISTS budget_item_id UUID REFERENCES budget_items(id) ON DELETE CASCADE;

-- Drop existing status check constraint and add the new one that includes 'quoted'
ALTER TABLE purchase_requests DROP CONSTRAINT IF EXISTS purchase_requests_status_check;
ALTER TABLE purchase_requests ADD CONSTRAINT purchase_requests_status_check 
    CHECK (status IN ('pending', 'approved', 'consolidated', 'ordered', 'received', 'rejected', 'quoted'));
