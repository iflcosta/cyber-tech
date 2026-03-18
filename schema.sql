-- CYBER TECH - DATABASE SCHEMA

-- Table: products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'smartphone', 'notebook', 'hardware', 'peripheral', 'kit'
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    specs JSONB,
    image_urls TEXT[], -- Array de URLs das imagens
    views INTEGER DEFAULT 0, -- Contador de visualizações
    sku TEXT UNIQUE, -- Código SKU para estoque/Olist
    olist_product_id TEXT, -- ID do produto na Olist
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: leads
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT UNIQUE,
    client_name TEXT,
    whatsapp TEXT,
    interest_type TEXT, -- 'venda', 'manutencao', 'voucher', 'pc_build'
    intent_type TEXT CHECK (intent_type IN (
        'compra_imediata', 'pesquisando_preco', 'manutencao_urgente', 'duvida_tecnica'
    )),
    voucher_code TEXT UNIQUE, -- Format: BPC-XXXX
    description TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'converted', 'cancelled', 'ready', etc.
    delivery_type TEXT, -- 'store', 'delivery'
    delivery_address TEXT,
    final_value DECIMAL(10, 2),
    commission_value DECIMAL(10, 2), -- 5% of final_value
    marketing_source TEXT, -- 'google', 'facebook', 'instagram', 'direct'
    campaign_name TEXT, -- Nome da campanha de Ads
    utm_parameters JSONB, -- Objeto completo com UTMs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    converted_at TIMESTAMP WITH TIME ZONE
);

-- Table: reviews (Autenticada por Voucher)
CREATE TABLE reviews (
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

-- Table: config
CREATE TABLE config (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL
);

-- Initial Config Data
INSERT INTO config (key, value) VALUES 
('labor_prices', '{"smartphone_screen": 150, "smartphone_battery": 80, "notebook_format": 120, "pc_assembly": 200}'),
('commission_rules', '{"percentage": 0.05}');

-- Initial Products Data
INSERT INTO products (name, category, price, stock_quantity, specs) VALUES 
('Kit Estudante (Notebook + Mouse)', 'kit', 2500.00, 5, '{"notebook": "i5 8GB 256GB SSD", "mouse": "Logitech"}'),
('Kit CS2 (I5-12400F + RTX 3060)', 'kit', 4500.00, 3, '{"cpu": "i5-12400F", "gpu": "RTX 3060", "ram": "16GB"}'),
('iPhone 15 128GB', 'smartphone', 6000.00, 2, '{"color": "Preto", "storage": "128GB"}');

-- RLS (Row Level Security) - Basic setup
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Admin can insert products" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin can update products" ON products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can delete products" ON products FOR DELETE USING (auth.role() = 'authenticated');

ALTER TABLE config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public config is viewable by everyone" ON config FOR SELECT USING (true);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert leads" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can view all leads" ON leads FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can update leads" ON leads FOR UPDATE USING (auth.role() = 'authenticated');

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can insert reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can update reviews" ON reviews FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can delete reviews" ON reviews FOR DELETE USING (auth.role() = 'authenticated');
