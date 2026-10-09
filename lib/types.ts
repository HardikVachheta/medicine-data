export type ProductCategory = 
  | 'Allopathic' 
  | 'Ayurvedic' 
  | 'Cosmetics' 
  | 'Provisional' 
  | 'Surgical';

export interface ProductMetadata {
  composition?: string;
  dosage?: string;
  schedule?: string; // e.g. "Schedule H", "Schedule H1", "OTC"
  rack_location?: string; // e.g. "Shelf A-3"
  side_effects?: string;
  storage_temp?: string;
  hsn_code?: string;
  [key: string]: any;
}

export interface Product {
  id: string;
  name: string;
  category_id?: string | null;
  category_name: ProductCategory | string;
  mrp: number;
  selling_price: number;
  discount_percentage: number;
  unit: string;
  in_stock: boolean;
  stock_quantity: number;
  image_url?: string | null;
  batch_no?: string | null;
  expiry_date?: string | null;
  manufacturer?: string | null;
  barcode?: string | null;
  metadata?: ProductMetadata;
  created_at?: string;
  updated_at?: string;
}

export interface ExtractedProductData {
  name: string;
  category_name: ProductCategory | string;
  mrp: number;
  selling_price: number;
  discount_percentage: number;
  unit: string;
  stock_quantity: number;
  batch_no: string;
  expiry_date: string;
  manufacturer: string;
  barcode?: string;
  composition?: string;
  dosage?: string;
  confidence_score?: number;
  raw_notes?: string;
}

export interface SaleItem {
  id: string;
  product_id: string;
  product_name: string;
  batch_no?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  mrp: number;
  total_price: number;
}

export interface Sale {
  id: string;
  invoice_no: string;
  customer_name: string;
  customer_phone?: string;
  doctor_name?: string;
  payment_mode: 'Cash' | 'UPI' | 'Card' | 'Credit';
  items: SaleItem[];
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  net_amount: number;
  notes?: string;
  created_at: string;
}

export interface StoreSettings {
  store_name: string;
  pharmacist_name: string;
  license_no: string; // Drug License No (D.L. No.)
  gstin: string;
  phone: string;
  address: string;
  currency_symbol: string;
  enable_sound: boolean;
  supabase_url?: string;
  supabase_anon_key?: string;
  gemini_api_key?: string;
  use_mock_data: boolean;
}
