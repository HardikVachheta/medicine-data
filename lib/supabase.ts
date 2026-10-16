import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, Sale, StoreSettings } from './types';
import { INITIAL_PRODUCTS, INITIAL_SALES } from './mockData';

const SETTINGS_KEY = 'medistore_settings_v1';
const PRODUCTS_KEY = 'medistore_products_v1';
const SALES_KEY = 'medistore_sales_v1';

export const DEFAULT_SETTINGS: StoreSettings = {
  store_name: 'City Medicos & Healthcare',
  pharmacist_name: 'Dr. Rajesh Mehta (B.Pharm)',
  license_no: 'DL-20B/21B-48929/2021',
  gstin: '07AAAAA0000A1Z5',
  phone: '+91 98100 12345',
  address: 'Shop 14, Central Market, Medical Enclave, New Delhi - 110029',
  currency_symbol: '₹',
  enable_sound: true,
  supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  gemini_api_key: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
  use_mock_data: true,
};

// Helper for localStorage
export const getLocalSettings = (): StoreSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error reading settings from localStorage:', e);
  }
  return DEFAULT_SETTINGS;
};

export const saveLocalSettings = (settings: StoreSettings): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings to localStorage:', e);
  }
};

let cachedClient: SupabaseClient | null = null;
let lastClientConfig = { url: '', key: '' };

export const getSupabaseClient = (customUrl?: string, customKey?: string): SupabaseClient | null => {
  const settings = getLocalSettings();
  const url = customUrl || settings.supabase_url || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = customKey || settings.supabase_anon_key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  if (cachedClient && lastClientConfig.url === url && lastClientConfig.key === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: { persistSession: true },
    });
    lastClientConfig = { url, key };
    return cachedClient;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
};

// ==========================================
// LOCAL STORAGE PRODUCTS & SALES FALLBACK
// ==========================================
export const getLocalProducts = (): Product[] => {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS;
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load local products:', e);
  }
  // Initialize with initial products
  saveLocalProducts(INITIAL_PRODUCTS);
  return INITIAL_PRODUCTS;
};

export const saveLocalProducts = (products: Product[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch (e) {
    console.error('Failed to save local products:', e);
  }
};

export const getLocalSales = (): Sale[] => {
  if (typeof window === 'undefined') return INITIAL_SALES;
  try {
    const raw = localStorage.getItem(SALES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load local sales:', e);
  }
  saveLocalSales(INITIAL_SALES);
  return INITIAL_SALES;
};

export const saveLocalSales = (sales: Sale[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SALES_KEY, JSON.stringify(sales));
  } catch (e) {
    console.error('Failed to save local sales:', e);
  }
};

// ==========================================
// UNIFIED DATA REPOSITORY (SUPABASE + LOCAL)
// ==========================================
export const repository = {
  // Test Connection
  async testConnection(url?: string, key?: string): Promise<{ success: boolean; message: string; rowCount?: number }> {
    const client = getSupabaseClient(url, key);
    if (!client) {
      return { success: false, message: 'Missing Supabase URL or Anon API Key.' };
    }
    try {
      const { data, error, count } = await client
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.code === '42P01') {
          return {
            success: false,
            message: 'Connected to Supabase, but the `products` table does not exist yet. Please run the schema.sql in Supabase SQL Editor.'
          };
        }
        return { success: false, message: `Supabase error: ${error.message} (${error.code || 'unknown'})` };
      }

      return {
        success: true,
        message: 'Successfully connected to Supabase!',
        rowCount: count ?? 0
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Connection failed.' };
    }
  },

  // Fetch all products
  async getProducts(): Promise<{ products: Product[]; source: 'supabase' | 'local' }> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('products')
          .select('*')
          .order('updated_at', { ascending: false });

        if (!error && data && data.length > 0) {
          // Sync with local cache
          saveLocalProducts(data as Product[]);
          return { products: data as Product[], source: 'supabase' };
        } else if (!error && data && data.length === 0) {
          // If Supabase table is empty, seed it with initial products!
          await this.seedInitialToSupabase(client);
          const { data: refreshed } = await client
            .from('products')
            .select('*')
            .order('updated_at', { ascending: false });
          if (refreshed && refreshed.length > 0) {
            saveLocalProducts(refreshed as Product[]);
            return { products: refreshed as Product[], source: 'supabase' };
          }
        }
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local storage:', err);
      }
    }
    return { products: getLocalProducts(), source: 'local' };
  },

  // Add / Create Product
  async createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<{ product: Product; source: 'supabase' | 'local' }> {
    const client = getSupabaseClient();
    const now = new Date().toISOString();

    const numMrp = Number(productData.mrp) || 0;
    const numSelling = Number(productData.selling_price) || 0;
    const computedDiscount = numMrp > 0 && numMrp >= numSelling 
      ? Number((((numMrp - numSelling) / numMrp) * 100).toFixed(2))
      : 0;

    if (client) {
      // 1. Explicitly omit discount_percentage from Supabase payload
      // because in PostgreSQL it is defined as: GENERATED ALWAYS AS (...) STORED
      const { discount_percentage: _stripped, ...productFields } = productData;

      const insertRow: Record<string, any> = {
        name: productFields.name.trim(),
        category_name: productFields.category_name || 'Allopathic',
        mrp: numMrp,
        selling_price: numSelling,
        unit: productFields.unit || 'Strips',
        in_stock: (Number(productFields.stock_quantity) || 0) > 0,
        stock_quantity: Number(productFields.stock_quantity) || 0,
        image_url: productFields.image_url || null,
        batch_no: productFields.batch_no || null,
        expiry_date: productFields.expiry_date || null,
        manufacturer: productFields.manufacturer || null,
        barcode: productFields.barcode || null,
        metadata: productFields.metadata || {},
        created_at: now,
        updated_at: now,
      };

      if (productFields.category_id) {
        insertRow.category_id = productFields.category_id;
      }

      // Generate a compliant UUID v4
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        try {
          insertRow.id = crypto.randomUUID();
        } catch (e) {}
      }

      const { data, error } = await client
        .from('products')
        .insert([insertRow])
        .select()
        .single();

      if (error) {
        console.error('Supabase direct insert error:', error);
        throw error;
      }

      if (data) {
        const savedProd = {
          ...data,
          discount_percentage: data.discount_percentage !== undefined && data.discount_percentage !== null
            ? Number(data.discount_percentage)
            : computedDiscount
        } as Product;
        const currentLocal = getLocalProducts();
        saveLocalProducts([savedProd, ...currentLocal]);
        return { product: savedProd, source: 'supabase' };
      }
    }

    // Only fallback to local if Supabase is not configured
    const newId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `prod-${Date.now()}`;
    const newProduct: Product = {
      ...productData,
      id: newId,
      discount_percentage: computedDiscount,
      in_stock: (Number(productData.stock_quantity) || 0) > 0,
      created_at: now,
      updated_at: now,
    };

    const currentLocal = getLocalProducts();
    const updated = [newProduct, ...currentLocal];
    saveLocalProducts(updated);
    return { product: newProduct, source: 'local' };
  },

  // Update Product
  async updateProduct(id: string, updates: Partial<Product>): Promise<{ product: Product; source: 'supabase' | 'local' }> {
    const client = getSupabaseClient();
    const now = new Date().toISOString();

    // Explicitly omit discount_percentage so generated column error is avoided
    const { discount_percentage: _stripped, ...safeUpdates } = updates;

    const formattedUpdates: Record<string, any> = {
      ...safeUpdates,
      updated_at: now,
      ...(updates.stock_quantity !== undefined ? { in_stock: Number(updates.stock_quantity) > 0 } : {})
    };

    if (client) {
      const { data, error } = await client
        .from('products')
        .update(formattedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase direct update error:', error);
        throw error;
      }

      if (data) {
        const savedProd = data as Product;
        const currentLocal = getLocalProducts().map(p => p.id === id ? { ...p, ...savedProd } : p);
        saveLocalProducts(currentLocal);
        return { product: savedProd, source: 'supabase' };
      }
    }

    // Local fallback if Supabase not configured
    const currentLocal = getLocalProducts();
    let updatedProduct: Product | undefined;
    const updatedList = currentLocal.map(p => {
      if (p.id === id) {
        updatedProduct = { ...p, ...formattedUpdates } as Product;
        return updatedProduct;
      }
      return p;
    });

    if (updatedProduct) {
      saveLocalProducts(updatedList);
      return { product: updatedProduct, source: 'local' };
    }
    throw new Error('Product not found to update');
  },

  // Delete Product
  async deleteProduct(id: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (client) {
      const { error } = await client.from('products').delete().eq('id', id);
      if (error) {
        console.error('Supabase direct delete error:', error);
        throw new Error(error.message);
      }
    }
    const currentLocal = getLocalProducts().filter(p => p.id !== id);
    saveLocalProducts(currentLocal);
    return true;
  },

  // Upload Image to Supabase Storage
  async uploadImage(base64OrFile: string | File): Promise<string> {
    const client = getSupabaseClient();
    if (client) {
      try {
        let fileBlob: Blob;
        let ext = 'jpg';

        if (typeof base64OrFile === 'string') {
          if (base64OrFile.startsWith('data:')) {
            const parts = base64OrFile.split(',');
            const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
            ext = mime.split('/')[1] || 'jpg';
            const bstr = atob(parts[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            fileBlob = new Blob([u8arr], { type: mime });
          } else {
            // Already a plain URL
            return base64OrFile;
          }
        } else {
          fileBlob = base64OrFile;
          ext = base64OrFile.name.split('.').pop() || 'jpg';
        }

        const fileName = `medicine-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
        const { data, error } = await client.storage
          .from('product-images')
          .upload(fileName, fileBlob, {
            contentType: fileBlob.type || 'image/jpeg',
            upsert: true
          });

        if (error) {
          console.error('Supabase storage upload error:', error);
          if (error.message?.toLowerCase().includes('bucket not found') || (error as any).statusCode === '404') {
            throw new Error("Supabase Storage Error: Bucket 'product-images' was not found. Please run the schema.sql in Supabase SQL Editor or create a public bucket named 'product-images'.");
          }
          throw new Error(`Supabase Storage Upload Error: ${error.message}`);
        }

        if (data) {
          const { data: publicUrlData } = client.storage
            .from('product-images')
            .getPublicUrl(fileName);
          return publicUrlData.publicUrl;
        }
      } catch (err: any) {
        console.error('Supabase storage upload exception:', err);
        throw err;
      }
    }

    // If string base64 or URL, return it
    if (typeof base64OrFile === 'string') {
      return base64OrFile;
    }
    // Return empty or object URL
    return URL.createObjectURL(base64OrFile);
  },

  // Sales
  async getSales(): Promise<Sale[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('sales')
          .select(`
            *,
            items:sale_items(*)
          `)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          saveLocalSales(data as Sale[]);
          return data as Sale[];
        }
      } catch (err) {
        console.warn('Supabase fetch sales failed:', err);
      }
    }
    return getLocalSales();
  },

  async recordSale(sale: Omit<Sale, 'id' | 'created_at'>): Promise<Sale> {
    const client = getSupabaseClient();
    const saleId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `sale-${Date.now()}`;
    const now = new Date().toISOString();

    const fullSale: Sale = {
      ...sale,
      id: saleId,
      created_at: now
    };

    if (client) {
      try {
        const { data: saleData, error: saleError } = await client
          .from('sales')
          .insert([
            {
              id: fullSale.id,
              invoice_no: fullSale.invoice_no,
              customer_name: fullSale.customer_name,
              customer_phone: fullSale.customer_phone,
              doctor_name: fullSale.doctor_name,
              payment_mode: fullSale.payment_mode,
              total_amount: fullSale.total_amount,
              discount_amount: fullSale.discount_amount,
              tax_amount: fullSale.tax_amount,
              net_amount: fullSale.net_amount,
              notes: fullSale.notes,
              created_at: now,
            }
          ])
          .select()
          .single();

        if (!saleError && saleData) {
          if (fullSale.items.length > 0) {
            await client.from('sale_items').insert(
              fullSale.items.map(item => ({
                id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `item-${Date.now()}-${Math.random()}`,
                sale_id: fullSale.id,
                product_id: item.product_id,
                product_name: item.product_name,
                batch_no: item.batch_no,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price,
                created_at: now
              }))
            );
          }
        }
      } catch (err) {
        console.warn('Supabase record sale error:', err);
      }
    }

    // Decrement stock in products
    for (const item of fullSale.items) {
      try {
        const currentProducts = getLocalProducts();
        const target = currentProducts.find(p => p.id === item.product_id);
        if (target) {
          const updatedQty = Math.max(0, target.stock_quantity - item.quantity);
          await this.updateProduct(target.id, {
            stock_quantity: updatedQty,
            in_stock: updatedQty > 0
          });
        }
      } catch (e) {
        console.error('Failed to decrement stock for item:', item, e);
      }
    }

    const currentSales = getLocalSales();
    saveLocalSales([fullSale, ...currentSales]);
    return fullSale;
  },

  async seedInitialToSupabase(client: SupabaseClient): Promise<void> {
    try {
      const formatted = INITIAL_PRODUCTS.map(p => {
        const { discount_percentage: _ignored, ...productData } = p;
        return {
          ...productData,
          mrp: Number(p.mrp),
          selling_price: Number(p.selling_price),
          stock_quantity: Number(p.stock_quantity),
          metadata: p.metadata || {},
        };
      });

      await client.from('products').upsert(formatted);
      console.log('Successfully seeded initial products to Supabase!');
    } catch (e) {
      console.warn('Seed initial to Supabase warning:', e);
    }
  }
};
