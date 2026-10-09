'use client';

import React, { useState } from 'react';
import { 
  Receipt, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  CheckCircle2, 
  Printer, 
  CreditCard, 
  Banknote, 
  QrCode, 
  User, 
  Phone, 
  FileText, 
  Layers, 
  Sparkles,
  ArrowRight,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, Sale, SaleItem, StoreSettings } from '@/lib/types';
import { repository } from '@/lib/supabase';

interface SalesTabProps {
  products: Product[];
  sales: Sale[];
  settings: StoreSettings;
  onSaleCompleted: (newSale: Sale) => void;
}

export const SalesTab: React.FC<SalesTabProps> = ({
  products,
  sales,
  settings,
  onSaleCompleted,
}) => {
  const [activeView, setActiveView] = useState<'billing' | 'history'>('billing');
  
  // Billing state
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'Cash' | 'Card'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);

  // Active printed invoice modal
  const [printedSale, setPrintedSale] = useState<Sale | null>(null);

  // Filtered product suggestions
  const productSuggestions = products.filter((p) => {
    if (!searchQuery.trim()) return false;
    const query = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      (p.barcode || '').toLowerCase().includes(query) ||
      (p.metadata?.composition || '').toLowerCase().includes(query)
    );
  }).slice(0, 6);

  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) return prev;
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setSearchQuery('');
  };

  const updateCartQty = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const clamped = Math.min(newQty, item.product.stock_quantity);
          return { ...item, quantity: clamped };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Calculations
  const subtotalMrp = cart.reduce((acc, item) => acc + (item.product.mrp * item.quantity), 0);
  const subtotalSelling = cart.reduce((acc, item) => acc + (item.product.selling_price * item.quantity), 0);
  const discountSavings = Math.max(0, subtotalMrp - subtotalSelling);
  const taxAmount = Math.round((subtotalSelling * 0.05) * 100) / 100; // 5% GST
  const grandTotal = Math.round((subtotalSelling + taxAmount) * 100) / 100;

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setIsProcessing(true);
    try {
      const invoiceNo = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const saleItems: SaleItem[] = cart.map((item) => ({
        id: `item-${Date.now()}-${Math.random()}`,
        product_id: item.product.id,
        product_name: item.product.name,
        batch_no: item.product.batch_no || undefined,
        quantity: item.quantity,
        unit: item.product.unit,
        unit_price: item.product.selling_price,
        mrp: item.product.mrp,
        total_price: item.product.selling_price * item.quantity,
      }));

      const newSaleRecord = await repository.recordSale({
        invoice_no: invoiceNo,
        customer_name: customerName.trim() || 'Walk-in Customer',
        customer_phone: customerPhone.trim() || undefined,
        doctor_name: doctorName.trim() || undefined,
        payment_mode: paymentMode,
        items: saleItems,
        total_amount: subtotalSelling,
        discount_amount: discountSavings,
        tax_amount: taxAmount,
        net_amount: grandTotal,
        notes: 'Dispensed by Pharmacist',
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.7 },
        });
      } catch (e) {
        // ignore if window is restricted
      }

      onSaleCompleted(newSaleRecord);
      setPrintedSale(newSaleRecord);
      setCart([]);
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');
      setDoctorName('');
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Top Navigation Mode Pills */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('billing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeView === 'billing'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>POS Express Billing</span>
          </button>

          <button
            onClick={() => setActiveView('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeView === 'history'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Invoice History ({sales.length})</span>
          </button>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-xs text-slate-400">Total Sales Today:</span>{' '}
          <strong className="text-sm text-slate-800">
            ₹{sales.reduce((acc, s) => acc + s.net_amount, 0).toFixed(2)}
          </strong>
        </div>
      </div>

      {activeView === 'billing' ? (
        /* POS BILLING INTERFACE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Product Search & Quick Items (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Search Input Box */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs relative">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Search className="w-4 h-4 text-teal-600" />
                <span>Search Medicine to Add to Bill</span>
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type medicine name, salt or scan barcode..."
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all placeholder:text-slate-400 font-medium"
              />

              {/* Suggestions Dropdown */}
              {productSuggestions.length > 0 && (
                <div className="absolute left-4 right-4 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 z-30 overflow-hidden divide-y divide-slate-100">
                  {productSuggestions.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="p-3 hover:bg-teal-50/60 cursor-pointer flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                            {product.name}
                          </h4>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {product.category_name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {product.metadata?.composition || product.manufacturer} • Stock: {product.stock_quantity} {product.unit}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-teal-700 text-sm">
                          ₹{product.selling_price.toFixed(2)}
                        </div>
                        <span className="text-[10px] text-slate-400 line-through">
                          ₹{product.mrp.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Catalog Picker for fast counter billing */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Quick OTC & Counter Items
                </span>
                <span className="text-xs text-slate-400">Tap to add</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {products.slice(0, 6).map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => addToCart(prod)}
                    disabled={prod.stock_quantity <= 0}
                    className="p-2.5 rounded-xl border border-slate-200/80 hover:border-teal-400 hover:bg-teal-50/30 text-left transition-all group disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <div className="text-[10px] font-semibold text-teal-600 uppercase">
                      {prod.unit}
                    </div>
                    <div className="font-bold text-slate-800 text-xs truncate group-hover:text-teal-700">
                      {prod.name}
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px]">
                      <span className="font-bold text-slate-900">₹{prod.selling_price}</span>
                      <span className="text-[10px] text-slate-500">{prod.stock_quantity} left</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Customer Details & Cart Receipt (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-teal-600" />
                  <h3 className="font-bold text-slate-900 text-base">Current Invoice</h3>
                </div>
                <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                  {cart.length} item{cart.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Customer Details Form */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Customer / Patient</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Walk-in Customer"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-teal-500 outline-none text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Phone / Mobile</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-teal-500 outline-none text-slate-800"
                  />
                </div>
              </div>

              {/* Cart Items List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs border-2 border-dashed border-slate-100 rounded-xl">
                    Cart is empty. Search or select a medicine above.
                  </div>
                ) : (
                  cart.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 truncate">{product.name}</h4>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          ₹{product.selling_price} × {quantity} ={' '}
                          <strong className="text-slate-800">
                            ₹{(product.selling_price * quantity).toFixed(2)}
                          </strong>
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => updateCartQty(product.id, quantity - 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-xs min-w-[20px] text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(product.id, quantity + 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Payment Mode Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['UPI', 'Cash', 'Card'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        paymentMode === mode
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {mode === 'UPI' && <QrCode className="w-3.5 h-3.5" />}
                      {mode === 'Cash' && <Banknote className="w-3.5 h-3.5" />}
                      {mode === 'Card' && <CreditCard className="w-3.5 h-3.5" />}
                      <span>{mode}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal (Selling Price):</span>
                  <span className="font-medium text-slate-900">₹{subtotalSelling.toFixed(2)}</span>
                </div>
                {discountSavings > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount Saved:</span>
                    <span>-₹{discountSavings.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST / Tax (5%):</span>
                  <span className="font-medium text-slate-900">₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="text-teal-700">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                disabled={cart.length === 0 || isProcessing}
                onClick={handleCheckout}
                className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-teal-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>Processing Sale...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Generate Bill & Complete Sale (₹{grandTotal.toFixed(2)})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* INVOICE HISTORY VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Past Pharmacy Invoices
            </h3>
            <span className="text-xs text-slate-500">{sales.length} transactions</span>
          </div>

          <div className="divide-y divide-slate-100">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {sale.invoice_no}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                      {sale.payment_mode}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-1">
                    Customer: <strong className="text-slate-700">{sale.customer_name}</strong> •{' '}
                    {new Date(sale.created_at).toLocaleDateString()} at{' '}
                    {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Items: {sale.items.map((i) => `${i.product_name} (${i.quantity})`).join(', ')}
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-between sm:justify-end">
                  <div className="text-right">
                    <span className="text-base font-black text-slate-900">
                      ₹{sale.net_amount.toFixed(2)}
                    </span>
                    <span className="block text-[10px] text-emerald-600 font-semibold">Paid</span>
                  </div>

                  <button
                    onClick={() => setPrintedSale(sale)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 border border-slate-200 transition-colors"
                    title="View / Print Receipt"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRINTABLE INVOICE RECEIPT MODAL */}
      {printedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Top Bar for Dialog */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between no-print bg-slate-50">
              <span className="font-bold text-xs uppercase text-slate-600">Tax Invoice Receipt</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setPrintedSale(null)}
                  className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:bg-slate-200 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Receipt Body */}
            <div id="printable-receipt" className="p-6 space-y-4 text-xs font-sans">
              {/* Pharmacy Header */}
              <div className="text-center pb-3 border-b border-slate-200 space-y-1">
                <h2 className="font-black text-base text-slate-900 uppercase">
                  {settings.store_name}
                </h2>
                <p className="text-[11px] text-slate-600">{settings.address}</p>
                <p className="text-[10px] text-slate-500 font-mono">
                  D.L. No: {settings.license_no} • GSTIN: {settings.gstin}
                </p>
                <p className="text-[10px] text-slate-500">Ph: {settings.phone}</p>
              </div>

              {/* Invoice Meta */}
              <div className="flex justify-between text-[11px] text-slate-600">
                <div>
                  <p><strong>Invoice:</strong> {printedSale.invoice_no}</p>
                  <p><strong>Patient:</strong> {printedSale.customer_name}</p>
                </div>
                <div className="text-right">
                  <p><strong>Date:</strong> {new Date(printedSale.created_at).toLocaleDateString()}</p>
                  <p><strong>Mode:</strong> {printedSale.payment_mode}</p>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full text-left text-[11px] border-t border-b border-slate-200 py-2">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-bold">
                    <th className="py-1">Item</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Price</th>
                    <th className="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {printedSale.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1 font-semibold">{item.product_name}</td>
                      <td className="py-1 text-center">{item.quantity}</td>
                      <td className="py-1 text-right">₹{item.unit_price.toFixed(2)}</td>
                      <td className="py-1 text-right font-bold">₹{item.total_price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="space-y-1 text-right text-[11px]">
                <p>Subtotal: ₹{printedSale.total_amount.toFixed(2)}</p>
                {printedSale.discount_amount > 0 && (
                  <p className="text-emerald-700">Discount: -₹{printedSale.discount_amount.toFixed(2)}</p>
                )}
                <p>GST (5%): ₹{printedSale.tax_amount.toFixed(2)}</p>
                <p className="text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                  Net Amount: ₹{printedSale.net_amount.toFixed(2)}
                </p>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500 space-y-1">
                <p>Dispensed by: {settings.pharmacist_name}</p>
                <p className="font-medium italic">Thank you for visiting! Wishing you good health.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
