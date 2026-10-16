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
  scannedImages?: string[] | null;
  onSaved: (savedProduct: Product, source: string) => void;
  onError?: (errorMessage: string) => void;
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
  scannedImages,
  onSaved,
  onError,
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
  const [allImages, setAllImages] = useState<string[]>([]);

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

      // Handle multi-images
      const imagesList: string[] = [];
      if (scannedImages && scannedImages.length > 0) {
        imagesList.push(...scannedImages);
      } else if (scannedImage) {
        imagesList.push(scannedImage);
      } else if (initialData?.image_url) {
        imagesList.push(initialData.image_url);
      }

      setAllImages(imagesList);
      setImageUrl(imagesList[0] || '');
      setErrorMsg('');
    }
  }, [isOpen, initialData, scannedImage, scannedImages]);

  // Handle MRP change -> auto update selling price using current discount %
  const handleMrpChange = (valStr: string) => {
    setMrp(valStr);
    const numMrp = parseFloat(valStr);
    const numDiscount = parseFloat(String(discountPercent)) || 0;
    if (!isNaN(numMrp) && numMrp >= 0) {
      const calculatedSelling = Number((numMrp - (numMrp * (numDiscount / 100))).toFixed(2));
      setSellingPrice(calculatedSelling);
    }
  };

  // Handle Selling Price change -> auto recalculate discount %
  const handleSellingPriceChange = (valStr: string) => {
    setSellingPrice(valStr);
    const numSelling = parseFloat(valStr);
    const numMrp = parseFloat(String(mrp)) || 0;
    if (!isNaN(numSelling) && numMrp > 0) {
      const calculatedDisc = Number((((numMrp - numSelling) / numMrp) * 100).toFixed(2));
      setDiscountPercent(calculatedDisc);
    }
  };

  // Handle Discount change -> auto update selling price
  const handleDiscountChange = (valStr: string) => {
    setDiscountPercent(valStr);
    const numDiscount = parseFloat(valStr);
    const numMrp = parseFloat(String(mrp)) || 0;
    if (!isNaN(numDiscount) && numMrp >= 0) {
      const calculatedSelling = Number((numMrp - (numMrp * (numDiscount / 100))).toFixed(2));
      setSellingPrice(calculatedSelling);
    }
  };

  // Quick preset buttons for admin (0%, 5%, 10%, 15%, 20%)
  const applyDiscountPreset = (preset: number) => {
    setDiscountPercent(preset);
    const numMrp = parseFloat(String(mrp)) || 0;
    if (numMrp >= 0) {
      const calculatedSelling = Number((numMrp - (numMrp * (preset / 100))).toFixed(2));
      setSellingPrice(calculatedSelling);
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
        batch_no: batchNo.trim() || null,
        expiry_date: expiryDate.trim() || null,
        manufacturer: manufacturer.trim() || null,
        barcode: barcode.trim() || null,
        metadata: {
          composition: composition.trim() || undefined,
          rack_location: rackLocation.trim() || 'General Rack',
          ...(allImages.length > 1 ? { scanned_angles_count: allImages.length } : {}),
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
      const errMsg = err?.message || 'Failed to save product. Please check Supabase connection and schema.';
      setErrorMsg(errMsg);
      if (onError) {
        onError(errMsg);
      }
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

              {/* Multi-angle packaging thumbnail selector */}
              {allImages.length > 1 && (
                <div className="flex items-center gap-1.5 mt-2 overflow-x-auto w-full py-1">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setImageUrl(img)}
                      className={`relative w-8 h-8 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                        imageUrl === img ? 'border-teal-500 ring-1 ring-teal-300 scale-105' : 'border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                      title={`Select Angle ${idx + 1}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 right-0 bg-slate-900/80 text-[8px] text-white px-0.5 rounded-tl font-mono">
                        {idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              )}
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

          {/* Pricing & Discounts Grid (Admin-Friendly Real-Time Calculation) */}
          <div className="p-3.5 rounded-2xl bg-teal-50/40 border border-teal-100 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. MRP */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>MRP (₹) *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Base Price</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm font-semibold text-slate-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={mrp}
                    onChange={(e) => handleMrpChange(e.target.value)}
                    placeholder="100.00"
                    className="w-full pl-7 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all font-semibold text-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* 2. Admin Discount (%) Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Discount (%)</span>
                  <span className="text-[10px] text-teal-600 font-medium">Auto-calculates</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => handleDiscountChange(e.target.value)}
                    placeholder="10"
                    className="w-full pl-3 pr-7 py-2 text-sm rounded-xl border border-teal-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all font-semibold text-teal-900 bg-white"
                  />
                  <Percent className="w-3.5 h-3.5 text-teal-500 absolute right-2.5 top-3 pointer-events-none" />
                </div>
              </div>

              {/* 3. Live Selling Price (Admin sees final price instantly) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Selling Price (₹) *</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">Final Price</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm font-bold text-teal-600">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={sellingPrice}
                    onChange={(e) => handleSellingPriceChange(e.target.value)}
                    placeholder="90.00"
                    className="w-full pl-7 pr-3 py-2 text-sm rounded-xl border-2 border-teal-500 bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none transition-all font-bold text-teal-900 shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Quick Discount Presets & Live Calculation Summary */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-teal-100/70 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-medium text-slate-500">Quick Presets:</span>
                {[0, 5, 10, 15, 20, 25].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => applyDiscountPreset(preset)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                      Number(discountPercent) === preset
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white text-teal-700 border border-teal-200 hover:bg-teal-50'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>

              <div className="text-[11px] font-medium text-teal-800 bg-white px-2.5 py-1 rounded-lg border border-teal-200 shadow-2xs">
                {Number(mrp) > 0 ? (
                  <span>
                    ₹{Number(mrp).toFixed(2)} - {Number(discountPercent || 0)}% = <strong className="text-teal-900 font-bold">₹{Number(sellingPrice || 0).toFixed(2)}</strong>{' '}
                    <span className="text-emerald-600">
                      (Saves ₹{Math.max(0, Number(mrp) - Number(sellingPrice || 0)).toFixed(2)})
                    </span>
                  </span>
                ) : (
                  <span className="text-slate-400">Enter MRP to preview discount calculation</span>
                )}
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
