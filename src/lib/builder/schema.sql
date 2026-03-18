-- Cyber Informática - COMPONENTS TABLE (PHASE 3)
CREATE TABLE IF NOT EXISTS components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot TEXT NOT NULL,             -- 'cpu' | 'gpu' | 'ram' | 'mobo' | 'psu' | 'case' | 'storage'
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    specs JSONB NOT NULL,
    price_estimate NUMERIC(10,2),
    tdp_watts INTEGER DEFAULT 0,
    compatibility_tags TEXT[],      -- ex: ['am5', 'ddr5', 'atx']
    commission_rate NUMERIC(4,4) DEFAULT 0.05,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for filtering by slot
CREATE INDEX IF NOT EXISTS idx_components_slot ON components(slot);
