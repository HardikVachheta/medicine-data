'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  Upload, 
  Calendar, 
  Tag, 
  Hash, 
  Building, 
  Layers, 
  Percent, 
  Info,
  Loader2,
  AlertCircle,
  Camera
} from 'lucide-react';
import { Product, ProductCategory, ProductMetadata } from '@/lib/types';
import { repository } from '@/lib/supabase';

interface VerifyProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<Product> | null;
  scannedImage?: string | null;
  onSaved: (savedProduct: Product, source: string) => void;
  isAiExtracted?: boolean;
}

const CATEGORIES: ProductCategory[] = [
  'Allopathic',
  'Ayurvedic',
  'Cosmetics',
  'Provisional',
  'Surgical',
];

const COMMON_UNITS = ['Strips', 'Bottle', 'Box', 'Tube', 'Vial', 'Syrup', 'Pcs', 'Packet'];

export const VerifyProductModal: React.FC<VerifyProductModalProps> = ({
  isOpen,
  onClose,
  initialData,
  scannedImage,
  onSaved,
  isAiExtracted = false,
}) => {
  const [name, setName] = useState('');
  const [categoryName, setCategoryName] = useState<ProductCategory>('Allopathic');
  const [mrp, setMrp] = useState<number | string>(100);
  const [sellingPrice, setSellingPrice] = useState<number | string>(90);
  const [discountPercent, setDiscountPercent] = useState<number | string>(10);
  const [unit, setUnit] = useState('Strips');
  const [stockQuantity, setStockQuantity] = useState<number | string>(20);
  const [batchNo, setBatchNo] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [barcode, setBarcode] = useState('');
  const [composition, setComposition] = useState('');
  const [rackLocation, setRackLocation] = useState('Shelf A-1');
  const [imageUrl, setImageUrl] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setCategoryName((initialData.category_name as ProductCategory) || 'Allopathic');
        
        const initialMrp = initialData.mrp !== undefined ? Number(initialData.mrp) : 100;
        const initialSelling = initialData.selling_price !== undefined ? Number(initialData.selling_price) : 90;
        setMrp(initialMrp);
        setSellingPrice(initialSelling);
        
        if (initialData.discount_percentage !== undefined) {
          setDiscountPercent(initialData.discount_percentage);
        } else if (initialMrp > 0) {
          setDiscountPercent(Number((((initialMrp - initialSelling) / initialMrp) * 100).toFixed(1)));
        }

        setUnit(initialData.unit || 'Strips');
        setStockQuantity(initialData.stock_quantity !== undefined ? initialData.stock_quantity : 20);
        setBatchNo(initialData.batch_no || '');
        setExpiryDate(initialData.expiry_date || '');
        setManufacturer(initialData.manufacturer || '');
        setBarcode(initialData.barcode || '');
        
        const meta = (initialData.metadata || {}) as ProductMetadata;
        setComposition(meta.composition || '');
        setRackLocation(meta.rack_location || 'Shelf A-1');
      }

      if (scannedImage) {
        setImageUrl(scannedImage);
      } else if (initialData?.image_url) {
        setImageUrl(initialData.image_url);
      } else {
        setImageUrl('');
      }

      setErrorMsg('');
    }
  }, [isOpen, initialData, scannedImage]);

  // Handle MRP change -> auto update selling price or discount
  const handleMrpChange = (valStr: string) => {
    setMrp(valStr);
    const numMrp = parseFloat(valStr) || 0;
    const numDiscount = parseFloat(String(discountPercent)) || 0;
    if (numMrp > 0) {
      const calculatedSelling = Math.max(0, numMrp * (1 - numDiscount / 100));
      setSellingPrice(Math.round(calculatedSelling * 100) / 100);
    }
  };

  // Handle Selling Price change -> auto update discount percent
  const handleSellingPriceChange = (valStr: string) => {
    setSellingPrice(valStr);
    const numSelling = parseFloat(valStr) || 0;
    const numMrp = parseFloat(String(mrp)) || 0;
    if (numMrp > 0 && numSelling <= numMrp) {
      const calculatedDisc = ((numMrp - numSelling) / numMrp) * 100;
      setDiscountPercent(Math.round(calculatedDisc * 100) / 100);
    }
  };

  // Handle Discount change -> auto update selling price
  const handleDiscountChange = (valStr: string) => {
    setDiscountPercent(valStr);
    const numDiscount = parseFloat(valStr) || 0;
    const numMrp = parseFloat(String(mrp)) || 0;
    if (numMrp > 0) {
      const calculatedSelling = Math.max(0, numMrp * (1 - numDiscount / 100));
      setSellingPrice(Math.round(calculatedSelling * 100) / 100);
    }
  };

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Medicine or product name is required.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      let finalImageUrl = imageUrl;

      // If it's a data URL, upload to Supabase Storage
      if (imageUrl && imageUrl.startsWith('data:')) {
        try {
          finalImageUrl = await repository.uploadImage(imageUrl);
        } catch (uploadErr) {
          console.warn('Image upload failed, preserving data URL:', uploadErr);
        }
      }

      const numMrp = parseFloat(String(mrp)) || 0;
      const numSelling = parseFloat(String(sellingPrice)) || numMrp;
      const numDiscount = parseFloat(String(discountPercent)) || 0;
      const numStock = parseInt(String(stockQuantity), 10) || 0;

      const payload: Omit<Product, 'id' | 'created_at' | 'updated_at'> = {
        name: name.trim(),
        category_name: categoryName,
        mrp: numMrp,
        selling_price: numSelling,
        discount_percentage: numDiscount,
        unit: unit.trim() || 'Strips',
        in_stock: numStock > 0,
        stock_quantity: numStock,
        image_url: finalImageUrl || null,
        batch_no: batchNo.trim() || `B-${Math.floor(1000 + Math.random() * 9000)}`,
        expiry_date: expiryDate.trim() || '2027-12',
        manufacturer: manufacturer.trim() || 'Generic Pharma',
        barcode: barcode.trim() || `${Date.now()}`.slice(-12),
        metadata: {
          composition: composition.trim() || undefined,
          rack_location: rackLocation.trim() || 'General Rack',
        },
      };

      let saved: Product;
      let source: string;

      if (initialData?.id) {
        // Edit existing
        const res = await repository.updateProduct(initialData.id, payload);
        saved = res.product;
        source = res.source;
      } else {
        // Create new
        const res = await repository.createProduct(payload);
        saved = res.product;
        source = res.source;
      }

      onSaved(saved, source);
      onClose();
    } catch (err: any) {
      console.error('Error saving product to database:', err);
      setErrorMsg(err?.message || 'Failed to save product. Please check connection.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/60 via-white to-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600/10 text-teal-600 flex items-center justify-center">
              {isAiExtracted ? (
                <Sparkles className="w-5 h-5 text-teal-600" />
              ) : (
                <Tag className="w-5 h-5 text-teal-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {initialData?.id ? 'Edit Product' : isAiExtracted ? 'Verify AI Extracted Product' : 'Add New Medicine'}
                </h2>
                {isAiExtracted && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    Gemini Vision Auto-filled
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Review and fine-tune fields before saving to Supabase inventory.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="overflow-y-auto p-5 space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Product Image & Basic Info Card */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
            {/* Image Preview / Upload Box */}
            <div className="sm:col-span-1 flex flex-col items-center justify-center">
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-white border border-slate-200 shadow-inner group">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt="Medicine Preview"
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                    <Camera className="w-6 h-6 mb-1 text-slate-300" />
                    <span className="text-[10px]">No photo</span>
                  </div>
                )}
                <label className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[11px] font-medium cursor-pointer transition-opacity backdrop-blur-xs">
                  <Upload className="w-4 h-4 mb-1" />
                  <span>Change</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCustomImageUpload}
                  />
                </label>
              </div>
            </div>

            {/* Medicine Name & Category */}
            <div className="sm:col-span-3 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Medicine / Product Commercial Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Augmentin 625 Duo Tablet"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Category *
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryName(cat)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                        categoryName === cat
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Discounts Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                MRP (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={mrp}
                onChange={(e) => handleMrpChange(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all font-semibold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={sellingPrice}
                onChange={(e) => handleSellingPriceChange(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-teal-400 bg-teal-50/30 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none transition-all font-bold text-teal-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Discount (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  className="w-full pl-3 pr-7 py-2 text-sm rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all font-medium text-slate-900"
                />
                <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Stock Quantity & Unit */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                min="0"
                required
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Packaging Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-800 bg-white"
              >
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Batch No.
              </label>
              <input
                type="text"
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value)}
                placeholder="e.g. B-9821A"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-800 uppercase font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expiry Date
              </label>
              <input
                type="text"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                placeholder="YYYY-MM (e.g. 2027-10)"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-800 font-mono text-xs"
              />
            </div>
          </div>

          {/* Manufacturer & Barcode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Manufacturer
              </label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. Cipla Ltd / Sun Pharma"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Barcode / EAN-13
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="e.g. 8901234567890"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-800 font-mono text-xs"
              />
            </div>
          </div>

          {/* Salt / Composition & Rack Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Active Salt / Chemical Composition
              </label>
              <input
                type="text"
                value={composition}
                onChange={(e) => setComposition(e.target.value)}
                placeholder="e.g. Amoxicillin 500mg + Potassium Clavulanate 125mg"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Store Rack / Shelf
              </label>
              <input
                type="text"
                value={rackLocation}
                onChange={(e) => setRackLocation(e.target.value)}
                placeholder="Shelf B-2"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-800"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-semibold text-sm shadow-md shadow-teal-600/30 flex items-center gap-2 transition-all disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to Supabase...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Save to Inventory</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
