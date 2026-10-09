'use client';

import React from 'react';
import { X, Printer, Barcode, Copy, Check } from 'lucide-react';
import { Product } from '@/lib/types';

interface BarcodeModalProps {
  product: Product | null;
  onClose: () => void;
}

export const BarcodeModal: React.FC<BarcodeModalProps> = ({ product, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!product) return null;

  const barcodeValue = product.barcode || `890${product.id.replace(/\D/g, '').padEnd(10, '0').slice(0, 10)}`;

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(barcodeValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintBarcode = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Barcode className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-900 text-sm">Product Barcode Label</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barcode Body / Sticker Preview */}
        <div className="p-6 flex flex-col items-center justify-center space-y-4">
          <div
            id="printable-receipt"
            className="w-64 p-4 rounded-xl border-2 border-dashed border-slate-300 bg-white text-center space-y-2 shadow-xs"
          >
            <div className="text-[11px] font-bold text-slate-900 uppercase truncate">
              {product.name}
            </div>
            
            <div className="text-[10px] text-slate-500 font-mono">
              B.No: {product.batch_no || 'NA'} • Exp: {product.expiry_date || 'NA'}
            </div>

            {/* Simulated Clean Barcode Lines */}
            <div className="py-2 flex justify-center items-center gap-[2px] h-14 bg-slate-50/50 rounded-lg px-2 border border-slate-100">
              {Array.from({ length: 48 }).map((_, i) => {
                const isThick = (i % 3 === 0) || (i % 7 === 0);
                const isSpace = (i % 5 === 0) && !isThick;
                if (isSpace) return <div key={i} className="w-[2px]" />;
                return (
                  <div
                    key={i}
                    className={`h-full bg-slate-900 ${isThick ? 'w-[3px]' : 'w-[1.5px]'}`}
                  />
                );
              })}
            </div>

            <div className="font-mono text-xs font-bold text-slate-800 tracking-widest">
              {barcodeValue}
            </div>

            <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-100">
              <span className="font-semibold text-slate-500">MRP: ₹{product.mrp}</span>
              <span className="font-bold text-teal-700">Our Price: ₹{product.selling_price}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs w-full">
            <button
              onClick={handleCopyBarcode}
              className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handlePrintBarcode}
              className="flex-1 py-2 rounded-xl bg-teal-600 text-white font-semibold flex items-center justify-center gap-1.5 hover:bg-teal-700 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sticker</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
