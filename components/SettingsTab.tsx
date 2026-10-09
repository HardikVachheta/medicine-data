'use client';

import React, { useState } from 'react';
import { 
  Database, 
  Sparkles, 
  Building2, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  FileCode, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  Key, 
  Eye, 
  EyeOff,
  Server,
  Layers,
  HelpCircle
} from 'lucide-react';
import { StoreSettings } from '@/lib/types';
import { repository } from '@/lib/supabase';

interface SettingsTabProps {
  settings: StoreSettings;
  onSaveSettings: (updated: StoreSettings) => void;
  onResetData: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onSaveSettings,
  onResetData,
}) => {
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [showKey, setShowKey] = useState(false);
  const [showAnonKey, setShowAnonKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; rowCount?: number } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await repository.testConnection(formData.supabase_url, formData.supabase_anon_key);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Connection test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const sqlSchemaCode = `-- Run this in Supabase SQL Editor:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category_id UUID,
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

CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_no TEXT UNIQUE NOT NULL,
    customer_name TEXT DEFAULT 'Walk-in Customer',
    customer_phone TEXT,
    doctor_name TEXT,
    payment_mode TEXT NOT NULL DEFAULT 'UPI',
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    net_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

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

-- RLS Policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.products FOR DELETE USING (true);
CREATE POLICY "Allow public select on sales" ON public.sales FOR SELECT USING (true);
CREATE POLICY "Allow public insert on sales" ON public.sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on sale_items" ON public.sale_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert on sale_items" ON public.sale_items FOR INSERT WITH CHECK (true);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Public Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchemaCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([sqlSchemaCode], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medistore_supabase_schema.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28">
      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Supabase Integration Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Supabase Backend Configuration
                </h3>
                <p className="text-xs text-slate-500">
                  Connect PostgreSQL database and product image storage bucket.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !formData.supabase_url}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Server className="w-3.5 h-3.5" />
                  <span>Test Connection</span>
                </>
              )}
            </button>
          </div>

          {testResult && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <strong className="block font-bold">
                  {testResult.success ? 'Supabase Live Connection Successful!' : 'Connection Warning'}
                </strong>
                <p className="mt-0.5">{testResult.message}</p>
                {testResult.rowCount !== undefined && (
                  <p className="mt-0.5 font-medium">Found {testResult.rowCount} products in database table.</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supabase Project URL
              </label>
              <input
                type="url"
                value={formData.supabase_url || ''}
                onChange={(e) => setFormData({ ...formData, supabase_url: e.target.value })}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supabase Anon / Public Key
              </label>
              <div className="relative">
                <input
                  type={showAnonKey ? 'text' : 'password'}
                  value={formData.supabase_anon_key || ''}
                  onChange={(e) => setFormData({ ...formData, supabase_anon_key: e.target.value })}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full pl-3 pr-9 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none font-mono text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowAnonKey(!showAnonKey)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showAnonKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Gemini Vision API Key Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Google Gemini Pro Vision AI Key
              </h3>
              <p className="text-xs text-slate-500">
                Powers automatic medicine OCR, packaging parsing, and batch number extraction.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Gemini API Key (Google AI Studio)
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={formData.gemini_api_key || ''}
                onChange={(e) => setFormData({ ...formData, gemini_api_key: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full pl-3 pr-9 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none font-mono text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>You can get a free API key from aistudio.google.com. If blank, high-accuracy realistic fallback mode runs out of the box.</span>
            </p>
          </div>
        </div>

        {/* Pharmacy Store Profile Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Pharmacy Store Profile
              </h3>
              <p className="text-xs text-slate-500">
                Printed on bills, customer tax receipts, and stock audit sheets.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Store / Pharmacy Name *
              </label>
              <input
                type="text"
                required
                value={formData.store_name}
                onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-teal-500 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pharmacist / Chemist Name
              </label>
              <input
                type="text"
                value={formData.pharmacist_name}
                onChange={(e) => setFormData({ ...formData, pharmacist_name: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Drug License No. (D.L. No.)
              </label>
              <input
                type="text"
                value={formData.license_no}
                onChange={(e) => setFormData({ ...formData, license_no: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-teal-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GSTIN Number
              </label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-teal-500 outline-none font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Store Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-teal-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between">
          <div>
            {saveSuccess && (
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Settings updated successfully!
              </span>
            )}
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-teal-600/30 flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      {/* Supabase SQL Migration Script Viewer */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-teal-600" />
            <h4 className="font-bold text-slate-900 text-sm">
              Supabase SQL Schema (1-Click Run)
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySql}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL'}</span>
            </button>

            <button
              onClick={handleDownloadSql}
              className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-teal-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download schema.sql</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Paste this script inside your Supabase project&apos;s SQL Editor to create tables, storage buckets, and security policies.
        </p>

        <div className="max-h-48 overflow-y-auto bg-slate-950 text-slate-200 p-3 rounded-xl font-mono text-[11px] leading-relaxed select-all">
          <pre>{sqlSchemaCode}</pre>
        </div>
      </div>

      {/* Reset Data Danger Zone */}
      <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-between gap-3 text-xs">
        <div>
          <h4 className="font-bold text-slate-800">Reset Local Demo Data</h4>
          <p className="text-slate-500 text-[11px]">
            Re-populate initial inventory items (Allopathic, Ayurvedic, Cosmetics, Provisional, Surgical).
          </p>
        </div>
        <button
          onClick={onResetData}
          className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-700 font-bold border border-slate-300 transition-colors shrink-0"
        >
          Reset Data
        </button>
      </div>
    </div>
  );
};
