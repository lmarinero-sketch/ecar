-- Fix: Allow 'logistics' in purchase_requests_request_type_check
ALTER TABLE purchase_requests DROP CONSTRAINT IF EXISTS purchase_requests_request_type_check;
ALTER TABLE purchase_requests ADD CONSTRAINT purchase_requests_request_type_check 
    CHECK (request_type IN ('purchase', 'quote', 'logistics'));
