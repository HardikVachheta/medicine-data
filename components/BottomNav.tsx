'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ScanLine, 
  ReceiptText, 
  Settings,
  Sparkles
} from 'lucide-react';

export type TabType = 'dashboard' | 'scan' | 'inventory' | 'sales' | 'settings';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  lowStockCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  lowStockCount,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 pb-safe">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 relative">
        {/* Dashboard */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-all ${
            currentTab === 'dashboard'
              ? 'text-teal-600 scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <LayoutDashboard className={`w-5 h-5 ${currentTab === 'dashboard' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          </div>
          <span className="mt-1 text-[11px]">Dashboard</span>
        </button>

        {/* Inventory */}
        <button
          onClick={() => onSelectTab('inventory')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-all ${
            currentTab === 'inventory'
              ? 'text-teal-600 scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <Package className={`w-5 h-5 ${currentTab === 'inventory' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {lowStockCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 min-w-[16px] h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {lowStockCount}
              </span>
            )}
          </div>
          <span className="mt-1 text-[11px]">Inventory</span>
        </button>

        {/* Quick Scan - Central Hero Button */}
        <div className="flex-1 flex justify-center -translate-y-3">
          <button
            onClick={() => onSelectTab('scan')}
            className={`group relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl shadow-lg transition-transform active:scale-95 ${
              currentTab === 'scan'
                ? 'bg-gradient-to-tr from-teal-600 to-teal-500 text-white shadow-teal-500/40 ring-4 ring-teal-100 scale-105'
                : 'bg-gradient-to-tr from-slate-900 to-slate-800 text-white shadow-slate-900/30 hover:scale-105'
            }`}
          >
            <ScanLine className="w-6 h-6 stroke-[2.2] animate-pulse" />
            <span className="absolute -bottom-5 text-[10px] font-bold text-teal-700 tracking-tight whitespace-nowrap">
              Quick Scan
            </span>
          </button>
        </div>

        {/* Orders & Sales */}
        <button
          onClick={() => onSelectTab('sales')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-all ${
            currentTab === 'sales'
              ? 'text-teal-600 scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <ReceiptText className={`w-5 h-5 ${currentTab === 'sales' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          </div>
          <span className="mt-1 text-[11px]">Orders / POS</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-all ${
            currentTab === 'settings'
              ? 'text-teal-600 scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <Settings className={`w-5 h-5 ${currentTab === 'settings' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          </div>
          <span className="mt-1 text-[11px]">Settings</span>
        </button>
      </div>
    </nav>
  );
};
