'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Navbar 
} from '@/components/Navbar';
import { 
  BottomNav, 
  TabType 
} from '@/components/BottomNav';
import { DashboardTab } from '@/components/DashboardTab';
import { QuickScanTab } from '@/components/QuickScanTab';
import { InventoryTab } from '@/components/InventoryTab';
import { SalesTab } from '@/components/SalesTab';
import { SettingsTab } from '@/components/SettingsTab';
import { VerifyProductModal } from '@/components/VerifyProductModal';
import { BarcodeModal } from '@/components/BarcodeModal';

import { 
  Product, 
  Sale, 
  StoreSettings, 
  ExtractedProductData 
} from '@/lib/types';
import { 
  repository, 
  getLocalSettings, 
  saveLocalSettings, 
  DEFAULT_SETTINGS,
  saveLocalProducts,
  saveLocalSales
} from '@/lib/supabase';
import { INITIAL_PRODUCTS, INITIAL_SALES } from '@/lib/mockData';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function MediStoreApp() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modals state
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyModalData, setVerifyModalData] = useState<Partial<Product> | null>(null);
  const [verifyModalImage, setVerifyModalImage] = useState<string | null>(null);
  const [isAiExtracted, setIsAiExtracted] = useState(false);

  const [barcodeModalProduct, setBarcodeModalProduct] = useState<Product | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Load initial settings & verify connection
  useEffect(() => {
    const loadedSettings = getLocalSettings();
    setSettings(loadedSettings);

    const checkConnection = async () => {
      if (loadedSettings.supabase_url && loadedSettings.supabase_anon_key) {
        const res = await repository.testConnection(
          loadedSettings.supabase_url,
          loadedSettings.supabase_anon_key
        );
        setIsSupabaseConnected(res.success);
      } else {
        setIsSupabaseConnected(false);
      }
    };
    checkConnection();
  }, []);

  // Fetch products & sales
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [prodRes, salesRes] = await Promise.all([
        repository.getProducts(),
        repository.getSales(),
      ]);

      setProducts(prodRes.products);
      setSales(salesRes);
      if (prodRes.source === 'supabase') {
        setIsSupabaseConnected(true);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleOpenAddModal = () => {
    setVerifyModalData(null);
    setVerifyModalImage(null);
    setIsAiExtracted(false);
    setVerifyModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setVerifyModalData(product);
    setVerifyModalImage(product.image_url || null);
    setIsAiExtracted(false);
    setVerifyModalOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await repository.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      showToast('Medicine removed from inventory.', 'info');
    } catch (e: any) {
      showToast('Failed to delete medicine: ' + e.message, 'error');
    }
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
    try {
      const updated = await repository.updateProduct(productId, {
        stock_quantity: newStock,
        in_stock: newStock > 0,
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? updated.product : p))
      );
    } catch (e: any) {
      showToast('Failed to update stock: ' + e.message, 'error');
    }
  };

  const handleQuickRestock = (productId: string, addQuantity: number) => {
    const current = products.find((p) => p.id === productId);
    if (current) {
      const updatedStock = current.stock_quantity + addQuantity;
      handleUpdateStock(productId, updatedStock);
      showToast(`Restocked +${addQuantity} units for ${current.name}!`, 'success');
    }
  };

  // AI Scan Complete Handler
  const handleScanComplete = (
    extracted: ExtractedProductData,
    scannedImage: string,
    isLiveGemini: boolean
  ) => {
    setVerifyModalData({
      name: extracted.name,
      category_name: extracted.category_name,
      mrp: extracted.mrp,
      selling_price: extracted.selling_price,
      discount_percentage: extracted.discount_percentage,
      unit: extracted.unit,
      stock_quantity: extracted.stock_quantity,
      batch_no: extracted.batch_no,
      expiry_date: extracted.expiry_date,
      manufacturer: extracted.manufacturer,
      barcode: extracted.barcode,
      metadata: {
        composition: extracted.composition,
        dosage: extracted.dosage,
        schedule: 'OTC',
      },
    });
    setVerifyModalImage(scannedImage);
    setIsAiExtracted(true);
    setVerifyModalOpen(true);

    showToast(
      isLiveGemini
        ? 'AI extracted medicine packaging successfully with Gemini Pro Vision!'
        : 'AI extraction completed via smart fallback heuristic.',
      'success'
    );
  };

  // Saved product from modal
  const handleProductSaved = (saved: Product, source: string) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      if (exists) {
        return prev.map((p) => (p.id === saved.id ? saved : p));
      }
      return [saved, ...prev];
    });

    showToast(
      source === 'supabase'
        ? `"${saved.name}" saved directly to Supabase PostgreSQL & Storage!`
        : `"${saved.name}" saved to local inventory!`,
      'success'
    );
  };

  // Sale completed
  const handleSaleCompleted = (newSale: Sale) => {
    setSales((prev) => [newSale, ...prev]);
    // Refresh products to reflect decremented stock
    loadData();
    showToast(`Invoice ${newSale.invoice_no} completed & inventory deducted!`, 'success');
  };

  // Save Settings
  const handleSaveSettings = async (updated: StoreSettings) => {
    setSettings(updated);
    saveLocalSettings(updated);
    if (updated.supabase_url && updated.supabase_anon_key) {
      const res = await repository.testConnection(
        updated.supabase_url,
        updated.supabase_anon_key
      );
      setIsSupabaseConnected(res.success);
    }
    showToast('Store settings saved successfully!', 'success');
  };

  // Reset demo data
  const handleResetData = () => {
    saveLocalProducts(INITIAL_PRODUCTS);
    saveLocalSales(INITIAL_SALES);
    setProducts(INITIAL_PRODUCTS);
    setSales(INITIAL_SALES);
    showToast('Inventory reset to initial pharmaceutical catalog!', 'info');
  };

  // Compute low stock count for bottom badge
  const lowStockCount = products.filter((p) => p.stock_quantity <= 10).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-teal-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        settings={settings}
        isSupabaseConnected={isSupabaseConnected}
        onRefresh={loadData}
        isRefreshing={isRefreshing}
        onOpenAddModal={handleOpenAddModal}
      />

      {/* Main Tab Screen Container */}
      <main className="flex-1 px-4 sm:px-6 pt-5 max-w-7xl mx-auto w-full">
        {currentTab === 'dashboard' && (
          <DashboardTab
            products={products}
            sales={sales}
            onNavigateTab={setCurrentTab}
            onOpenAddModal={handleOpenAddModal}
            onQuickRestock={handleQuickRestock}
          />
        )}

        {currentTab === 'scan' && (
          <QuickScanTab
            onScanComplete={handleScanComplete}
            geminiApiKey={settings.gemini_api_key}
          />
        )}

        {currentTab === 'inventory' && (
          <InventoryTab
            products={products}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
            onUpdateStock={handleUpdateStock}
            onOpenAddModal={handleOpenAddModal}
            onOpenBarcodeModal={setBarcodeModalProduct}
          />
        )}

        {currentTab === 'sales' && (
          <SalesTab
            products={products}
            sales={sales}
            settings={settings}
            onSaleCompleted={handleSaleCompleted}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsTab
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-18 right-4 z-50 max-w-sm animate-in slide-in-from-top-3 fade-in duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : toast.type === 'error'
                ? 'bg-rose-900 text-rose-100 border-rose-700'
                : 'bg-slate-900 text-slate-100 border-slate-700'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-teal-400 shrink-0" />}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="p-1 hover:opacity-70 text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Verify / Add Product Modal */}
      <VerifyProductModal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        initialData={verifyModalData}
        scannedImage={verifyModalImage}
        onSaved={handleProductSaved}
        isAiExtracted={isAiExtracted}
      />

      {/* Barcode Modal */}
      <BarcodeModal
        product={barcodeModalProduct}
        onClose={() => setBarcodeModalProduct(null)}
      />

      {/* Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        lowStockCount={lowStockCount}
      />
    </div>
  );
}
