-- Cyber Informática - MAINTENANCE ORDERS TABLE (PHASE 4)
CREATE TABLE IF NOT EXISTS maintenance_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_code TEXT UNIQUE NOT NULL,  -- format BPC-XXXX
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    equipment_type TEXT NOT NULL,
    problem_description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','delivered','cancelled')),
    proof_images TEXT[],                -- URLs do Supabase Storage
    commission_value NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ
);

-- Index for voucher lookups
CREATE INDEX IF NOT EXISTS idx_maintenance_voucher ON maintenance_orders(voucher_code);
