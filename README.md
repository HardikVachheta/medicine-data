# MediStore Pro — Medical Store Inventory & AI Vision Management System

A production-grade, highly polished Pharmacy & Medical Store Inventory & Management mobile-responsive web application designed to senior-level engineering standards (5+ years standard).

The application integrates **Supabase** (PostgreSQL + Supabase Storage for medicine packaging photos) and **Google Gemini Pro Vision API** for automated medicine packaging OCR and metadata extraction.

---

## 🌟 Key Features

### 1. 📷 Quick Scan with Gemini Pro Vision AI
- **Live Camera Viewfinder**: Mobile and desktop camera integration with facing-mode switch (rear / front camera) and alignment reticle.
- **Image Upload & Drag-and-Drop**: Supports JPEG, PNG, WEBP packaging photos.
- **1-Click Preset Samples**: Instant test scan cards (Augmentin 625 Duo, Azithral 500mg, Patanjali Dant Kanti, 3M Micropore Tape) for zero-setup demonstrations.
- **Laser Sweep Scan Effect**: Real-time animated scanning HUD during AI processing.
- **Server-Side Gemini Vision Extraction**:
  - Medicine Commercial Name & Strength
  - Classification Category (`Allopathic`, `Ayurvedic`, `Cosmetics`, `Provisional`, `Surgical`)
  - MRP & Selling Price with automatic discount percentage
  - Packaging Unit (`Strips`, `Bottle`, `Box`, `Tube`, `Vial`, `Syrup`, `Pcs`, `Packet`)
  - Batch Number (`batch_no`)
  - Expiry Date (`expiry_date`)
  - Manufacturer Laboratory Name
  - Barcode / EAN-13 code
  - Active Chemical Composition / Salts
- **Add & Verify Product Modal**: Pre-filled review bottom-sheet allowing instant price/discount adjustments, photo preview, and 1-click database save.
- **Supabase Storage Sync**: Automatically uploads the photo buffer to the Supabase `product-images` storage bucket.

### 2. 📊 Real-Time Operations Dashboard
- **Store KPIs**: Total SKUs, Inventory Valuation (₹), Low Stock Items, Expiring Soon, Today's Sales Revenue.
- **Quick Action Bar**: Shortcuts for AI Quick Scan, New POS Bill, Manual Product Add, and Stock Filter.
- **Critical Stock Watchlist**: Urgent low stock alerts (< 10 units) with 1-click inline "+10 Restock" action.
- **Category Inventory Distribution**: Live counters across Allopathic, Ayurvedic, Cosmetics, Provisional, Surgical categories.
- **Live Sync Badge**: Real-time status indicator showing whether connected to Supabase live database or local storage cache.

### 3. 📦 Comprehensive Inventory Management
- **Universal Search**: Multi-field search across medicine name, salt composition, manufacturer, batch number, or barcode.
- **Category Filter Tabs**: 5 standard categories + 'All Categories' view.
- **Stock Status Pills**: All, Low Stock, Out of Stock, Expiring Soon (< 6 months).
- **View Toggle**: Card Grid view vs High-density Audit Table view.
- **Instant Stock Steppers**: Quick `+` and `-` quantity adjusters that immediately sync with the database.
- **Barcode Modal**: Visual barcode sticker viewer with print capability.
- **CSV Export**: 1-click export of the active filtered inventory to CSV format.

### 4. 🧾 Express POS & Billing Terminal
- **Instant Product Search**: Type medicine name, barcode, or salt to add to bill.
- **Counter Item Quick Picker**: 1-tap OTC additions.
- **Tax & GST Breakdown**: Automatic subtotal, discount savings calculation, and 5% GST computation.
- **Customer & Prescription Tracking**: Customer Name, Phone Number, and Doctor Name.
- **Payment Modes**: UPI (Google Pay / PhonePe / Paytm), Cash, and Card.
- **Stock Auto-Deduction**: Completing a sale automatically reduces the product inventory in the database.
- **Printable Tax Invoice Receipt**: Formatted with Pharmacy Name, Drug License No. (D.L. No.), GSTIN, customer details, itemized breakdown, and signature stamp.

### 5. ⚙️ Settings & Supabase Integration
- **Supabase Credentials**: Enter Supabase Project URL & Anon Key with live "Test Connection" button.
- **Google Gemini API Key**: Configure your API key from Google AI Studio.
- **Store Profile Management**: Medical store name, Pharmacist name, Drug License (D.L.) number, GSTIN, and contact details.
- **SQL Migration Exporter**: 1-click "Copy SQL" and "Download schema.sql" to run directly in the Supabase SQL Editor.

---

## 🗄️ Supabase PostgreSQL Schema

The application is fully aligned with the schema in `supabase/schema.sql`:

```sql
-- products table
CREATE TABLE public.products (
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
    batch_no TEXT,
    expiry_date TEXT,
    manufacturer TEXT,
    barcode TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Add your Supabase and Gemini credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
```
*(Note: You can also enter and update credentials directly in the in-app **Settings** tab at runtime!)*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser or mobile device.
