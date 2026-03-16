CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id),
    voucher_code TEXT NOT NULL,
    user_name TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_voucher_review UNIQUE(voucher_code)
);

-- Ativar RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews são visíveis se aprovadas" ON reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Qualquer um pode inserir review" ON reviews FOR INSERT WITH CHECK (true);
