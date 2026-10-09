'use client';

import React from 'react';
import { 
  Building2, 
  Database, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Plus,
  RefreshCw
} from 'lucide-react';
import { StoreSettings } from '@/lib/types';

interface NavbarProps {
  settings: StoreSettings;
  isSupabaseConnected: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenAddModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  isSupabaseConnected,
  onRefresh,
  isRefreshing,
  onOpenAddModal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Store Name */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-700 to-teal-500 flex items-center justify-center text-white shadow-md shadow-teal-700/20 shrink-0">
            <span className="font-bold text-xl tracking-tight">Rx</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 text-base md:text-lg leading-tight truncate">
                {settings.store_name}
              </h1>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate flex items-center gap-1.5">
              <span>{settings.license_no ? `Lic: ${settings.license_no}` : 'Medical Inventory System'}</span>
            </p>
          </div>
        </div>

        {/* Status Indicators & Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Supabase status badge */}
          <div 
            title={isSupabaseConnected ? "Connected to Supabase PostgreSQL" : "Running on Local Storage Cache"}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              isSupabaseConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isSupabaseConnected ? 'Supabase Live' : 'Offline / Local'}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          </div>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Sync & refresh inventory data"
            className="p-2 text-slate-600 hover:text-teal-600 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`} />
          </button>

          {/* Quick Manual Add Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-medium text-xs sm:text-sm shadow-sm shadow-teal-600/30 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden xs:inline">Add Product</span>
          </button>
        </div>
      </div>
    </header>
  );
};
