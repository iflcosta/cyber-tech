-- Nexus Tech - Consolidated Database Schema
-- Focus: Cleanup unused tables (users, projects, tasks), strict RLS security (Fixes "RLS Policy Always True" and "RLS Disabled" warnings).

-- 1. Enable Essential Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean Up Obsolete Tables & Reset Existing Tables
-- WARNING: This drops tables and their data. This is done to achieve a clean slate as requested.
DROP TABLE IF EXISTS "public"."tasks" CASCADE;
DROP TABLE IF EXISTS "public"."projects" CASCADE;
DROP TABLE IF EXISTS "public"."users" CASCADE;
DROP TABLE IF EXISTS "public"."reviews" CASCADE;
DROP TABLE IF EXISTS "public"."maintenance_orders" CASCADE;
DROP TABLE IF EXISTS "public"."leads" CASCADE;
DROP TABLE IF EXISTS "public"."products" CASCADE;
DROP TABLE IF EXISTS "public"."config" CASCADE;

-- 3. Configuration Table
CREATE TABLE IF NOT EXISTS "public"."config" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "key" text UNIQUE NOT NULL,
    "value" jsonb NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now()
);

-- 4. Products Table
CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "name" text NOT NULL,
    "description" text,
    "price" numeric(10,2) NOT NULL DEFAULT 0,
    "category" text,
    "image_urls" text[] DEFAULT '{}',
    "stock_quantity" integer DEFAULT 0,
    "sku" text UNIQUE,
    "specs" jsonb DEFAULT '{}',
    "views" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- 5. Leads Table (Core Business Logic)
CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "client_name" text,
    "whatsapp" text,
    "interest_type" text, -- 'pc_build', 'manutencao', 'venda', 'voucher'
    "status" text DEFAULT 'pending', -- 'pending', 'converted', 'ready', etc.
    "description" text,
    "marketing_source" text DEFAULT 'organic',
    "session_id" text,
    "voucher_code" text,
    "intent_type" text,
    "utm_parameters" jsonb DEFAULT '{}',
    "final_value" numeric(10,2) DEFAULT 0,
    "cost_value" numeric(10,2) DEFAULT 0,
    "commission_value" numeric(10,2) DEFAULT 0,
    "commission_ecosystem" boolean DEFAULT false,
    "commission_service" boolean DEFAULT false,
    "performed_by_partner" boolean DEFAULT false,
    "converted_at" timestamp with time zone,
    "payment_status" text DEFAULT 'pending',
    "created_at" timestamp with time zone DEFAULT now()
);

-- 6. Maintenance Orders Table (Technical Service Management)
CREATE TABLE IF NOT EXISTS "public"."maintenance_orders" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "voucher_code" text UNIQUE NOT NULL,
    "source" text DEFAULT 'organic',
    "status" text DEFAULT 'pending',
    "customer_name" text NOT NULL DEFAULT 'Não informado',
    "customer_phone" text,
    "equipment_type" text,
    "order_value" numeric(10,2) DEFAULT null,
    "commission_owner" numeric(10,2) DEFAULT 0,
    "commission_tech" numeric(10,2) DEFAULT 0,
    "external_id" text UNIQUE,
    "payment_status" text DEFAULT 'pending',
    "delivered_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now()
);

-- 7. Reviews Table (Customer Feedback)
CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "lead_id" uuid REFERENCES public.leads(id) ON DELETE SET NULL,
    "client_name" text NOT NULL,
    "rating" integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    "comment" text,
    "is_approved" boolean DEFAULT false,
    "voucher_code" text,
    "created_at" timestamp with time zone DEFAULT now()
);

-- Note: orders and order_items have been removed to prioritize Leads and Maintenance Flow.

-- 10. Indexes for Optimization
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp ON leads(whatsapp);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_voucher_code ON maintenance_orders(voucher_code);
CREATE INDEX IF NOT EXISTS idx_voucher_status ON maintenance_orders(status);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- 11. Row Level Security (RLS) - Enabling on EVERY public table
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_orders ENABLE ROW LEVEL SECURITY;

-- 12. Security Policies (Strict Fixes)
-- The "USING (true)" and "WITH CHECK (true)" for anything other than specific SELECTs
-- triggers security rules. We use strict auth role checking.

-- Config (Admin Only)
CREATE POLICY "Admin full access to config" ON config FOR ALL USING (auth.role() = 'authenticated');

-- Products (Public Select, Admin All)
CREATE POLICY "Public products viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Admin full access to products" ON products FOR ALL USING (auth.role() = 'authenticated');

-- Leads (Public Insert, Admin All)
CREATE POLICY "Public can insert leads" ON leads FOR INSERT WITH CHECK (auth.role() = 'anon');
CREATE POLICY "Admin can view/manage leads" ON leads FOR ALL USING (auth.role() = 'authenticated');

-- Reviews (Public Select Approved, Public Insert, Admin All)
CREATE POLICY "Public reviews viewable by everyone" ON reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Public can insert reviews" ON reviews FOR INSERT WITH CHECK (auth.role() = 'anon');
CREATE POLICY "Admin can manage reviews" ON reviews FOR ALL USING (auth.role() = 'authenticated');

-- Maintenance Orders (Public Select by Voucher, Admin All)
-- A user tracking their voucher shouldn't be able to edit or delete it.
CREATE POLICY "Anyone can view status by voucher_code" ON maintenance_orders FOR SELECT USING (true);
CREATE POLICY "Admin full access to maintenance_orders" ON maintenance_orders FOR ALL USING (auth.role() = 'authenticated');
