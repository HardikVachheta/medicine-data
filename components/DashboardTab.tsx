'use client';

import React from 'react';
import { 
  ScanLine, 
  Search, 
  Plus, 
  AlertTriangle, 
  TrendingUp, 
  Package, 
  CheckCircle2, 
  Clock, 
  Layers, 
  ArrowUpRight, 
  ChevronRight,
  Sparkles,
  ReceiptText,
  BadgeAlert
} from 'lucide-react';
import { Product, Sale, ProductCategory } from '@/lib/types';

interface DashboardTabProps {
  products: Product[];
  sales: Sale[];
  onNavigateTab: (tab: 'dashboard' | 'scan' | 'inventory' | 'sales' | 'settings') => void;
  onOpenAddModal: () => void;
  onQuickRestock: (productId: string, addQuantity: number) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  products,
  sales,
  onNavigateTab,
  onOpenAddModal,
  onQuickRestock,
}) => {
  // Compute analytics
  const totalItems = products.length;
  const inStockItems = products.filter(p => p.in_stock && p.stock_quantity > 0).length;
  const lowStockItems = products.filter(p => p.stock_quantity <= 10);
  const outOfStockItems = products.filter(p => p.stock_quantity === 0);

  // Total valuation
  const totalInventoryValue = products.reduce((acc, p) => acc + (p.selling_price * p.stock_quantity), 0);

  // Sales totals (all recorded)
  const totalSalesRevenue = sales.reduce((acc, s) => acc + s.net_amount, 0);

  // Expiring soon (less than 6 months or 2026)
  const expiringSoonItems = products.filter(p => {
    if (!p.expiry_date) return false;
    // Check if 2026 or 2027-01
    return p.expiry_date.startsWith('2026') || p.expiry_date.startsWith('2027-01');
  });

  // Category counts
  const categoryCounts: Record<string, number> = {
    Allopathic: 0,
    Ayurvedic: 0,
    Cosmetics: 0,
    Provisional: 0,
    Surgical: 0,
  };

  products.forEach(p => {
    if (categoryCounts[p.category_name] !== undefined) {
      categoryCounts[p.category_name]++;
    }
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Welcome & Quick Action Hero */}
      <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold backdrop-blur-md border border-teal-500/30 mb-2">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span>Pharmacy Dashboard & Real-Time Sync</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Medical Store Operations
              </h1>
              <p className="text-xs sm:text-sm text-teal-100/80 mt-1 max-w-xl">
                Real-time stock ledger, automated AI vision scanning, and express point-of-sale checkout.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => onNavigateTab('scan')}
                className="px-4 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-teal-950 font-bold text-xs sm:text-sm shadow-lg shadow-teal-500/30 flex items-center gap-2 transition-all active:scale-95"
              >
                <ScanLine className="w-4 h-4 stroke-[2.5]" />
                <span>AI Quick Scan</span>
              </button>

              <button
                onClick={() => onNavigateTab('sales')}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm border border-white/20 flex items-center gap-2 backdrop-blur-md transition-all active:scale-95"
              >
                <ReceiptText className="w-4 h-4" />
                <span>New POS Bill</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total SKUs */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Products</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{totalItems}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Valuation: <span className="font-semibold text-slate-700">₹{totalInventoryValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </p>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div 
          onClick={() => onNavigateTab('inventory')}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-rose-200/90 shadow-xs flex flex-col justify-between cursor-pointer hover:border-rose-400 transition-colors"
        >
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-semibold uppercase tracking-wider">Low Stock</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl sm:text-3xl font-black text-rose-600">{lowStockItems.length}</h3>
              {outOfStockItems.length > 0 && (
                <span className="text-xs font-bold text-rose-500">({outOfStockItems.length} out)</span>
              )}
            </div>
            <p className="text-[11px] text-rose-600 font-medium mt-0.5 flex items-center gap-1">
              <span>Items need restock</span>
              <ChevronRight className="w-3 h-3" />
            </p>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-amber-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-semibold uppercase tracking-wider">Expiring Soon</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl sm:text-3xl font-black text-amber-700">{expiringSoonItems.length}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Batch within 6 months
            </p>
          </div>
        </div>

        {/* Sales Revenue */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-semibold uppercase tracking-wider">Sales Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              ₹{totalSalesRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
              {sales.length} transactions recorded
            </p>
          </div>
        </div>
      </div>

      {/* Critical Low Stock Alert Banner (If Any) */}
      {lowStockItems.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-800">
              <BadgeAlert className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-sm sm:text-base">
                Critical Stock Watchlist ({lowStockItems.length} items low)
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-xs font-semibold text-rose-700 hover:text-rose-900 flex items-center gap-1"
            >
              <span>View in Inventory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {lowStockItems.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="p-3 bg-white rounded-xl border border-rose-100 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 text-xs truncate">{item.name}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span className="font-bold text-rose-600">{item.stock_quantity} {item.unit} left</span>
                    <span>•</span>
                    <span>{item.category_name}</span>
                  </div>
                </div>
                <button
                  onClick={() => onQuickRestock(item.id, 10)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white border border-teal-200 transition-colors shrink-0"
                >
                  +10 Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories Distribution */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600" />
            <span>Category Inventory Breakdown</span>
          </h3>
          <span className="text-xs text-slate-500">5 Registered Categories</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(categoryCounts).map(([cat, count]) => (
            <div
              key={cat}
              onClick={() => onNavigateTab('inventory')}
              className="p-3 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-200/70 hover:border-teal-300 transition-all cursor-pointer group"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 group-hover:text-teal-600 block">
                {cat}
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-black text-slate-800 group-hover:text-teal-800">
                  {count}
                </span>
                <span className="text-[11px] text-slate-500">items</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sales Activity */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Recent Sales & Billing Activity
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('sales')}
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            <span>All Orders</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {sales.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No sales recorded yet. Click &apos;New POS Bill&apos; to process customer sales.
          </div>
        ) : (
          <div className="space-y-2.5">
            {sales.slice(0, 4).map((sale) => (
              <div
                key={sale.id}
                className="p-3 sm:p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 flex items-center justify-between gap-3 transition-colors text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{sale.invoice_no}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-100 text-teal-800">
                      {sale.payment_mode}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] truncate mt-0.5">
                    {sale.customer_name} • {sale.items.length} item(s) •{' '}
                    {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-slate-900">
                    ₹{sale.net_amount.toFixed(2)}
                  </span>
                  <span className="block text-[10px] text-emerald-600 font-semibold">Completed</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
