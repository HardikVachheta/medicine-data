-- ==============================================================================
-- Medical Store Inventory & Management System (Production Supabase Schema)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Seed Categories
INSERT INTO public.categories (name, description, icon) VALUES
    ('Allopathic', 'Modern pharmaceutical and prescription drugs', 'Pill'),
    ('Ayurvedic', 'Traditional herbal and Ayurvedic remedies', 'Leaf'),
    ('Cosmetics', 'Skincare, derma cosmetics, and personal hygiene', 'Sparkles'),
    ('Provisional', 'Nutritional supplements, OTC drinks, and baby care', 'Package'),
    ('Surgical', 'Surgical disposables, bandages, kits, and devices', 'Stethoscope')
ON CONFLICT (name) DO NOTHING;

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    category_name TEXT NOT NULL DEFAULT 'Allopathic',
    mrp NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_percentage NUMERIC(5, 2) DEFAULT 0.00,
    unit TEXT NOT NULL DEFAULT 'Strips',
    in_stock BOOLEAN NOT NULL DEFAULT TRUE,
    stock_quantity INT4 NOT NULL DEFAULT 0,
    image_url TEXT,
    
    -- Extensible metadata required
    batch_no TEXT,
    expiry_date TEXT,
    manufacturer TEXT,
    barcode TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 4. SALES / ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_no TEXT UNIQUE NOT NULL,
    customer_name TEXT DEFAULT 'Walk-in Customer',
    customer_phone TEXT,
    doctor_name TEXT,
    payment_mode TEXT NOT NULL DEFAULT 'UPI', -- Cash, UPI, Card, Due
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    net_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 5. SALE ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    batch_no TEXT,
    quantity INT4 NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 6. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products (name);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category_name);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products (barcode);
CREATE INDEX IF NOT EXISTS idx_products_batch_no ON public.products (batch_no);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products (stock_quantity, in_stock);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON public.sales (invoice_no);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales (created_at DESC);

-- 7. TRIGGER FOR AUTO UPDATING updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    NEW.in_stock = (NEW.stock_quantity > 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_timestamp ON public.products;
CREATE TRIGGER trigger_set_timestamp
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Allow public/authenticated read and write for standard store operations
CREATE POLICY "Allow public select on categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public select on products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public insert on products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on products" ON public.products FOR DELETE USING (true);

CREATE POLICY "Allow public select on sales" ON public.sales FOR SELECT USING (true);
CREATE POLICY "Allow public insert on sales" ON public.sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on sale_items" ON public.sale_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert on sale_items" ON public.sale_items FOR INSERT WITH CHECK (true);

-- 9. SUPABASE STORAGE BUCKET CONFIGURATION
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access for product-images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Public Upload for product-images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'product-images');
