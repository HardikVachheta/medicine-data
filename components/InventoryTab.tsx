'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Barcode, 
  Layers, 
  LayoutGrid, 
  List, 
  PlusCircle, 
  MinusCircle, 
  MoreVertical,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { Product, ProductCategory } from '@/lib/types';

interface InventoryTabProps {
  products: Product[];
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateStock: (productId: string, newStock: number) => void;
  onOpenAddModal: () => void;
  onOpenBarcodeModal: (product: Product) => void;
}

const CATEGORIES: ('All' | ProductCategory)[] = [
  'All',
  'Allopathic',
  'Ayurvedic',
  'Cosmetics',
  'Provisional',
  'Surgical',
];

export const InventoryTab: React.FC<InventoryTabProps> = ({
  products,
  onEditProduct,
  onDeleteProduct,
  onUpdateStock,
  onOpenAddModal,
  onOpenBarcodeModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ProductCategory>('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'expiring'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filtered products calculation
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category filter
      if (selectedCategory !== 'All' && product.category_name !== selectedCategory) {
        return false;
      }

      // Stock status filter
      if (stockFilter === 'low' && (product.stock_quantity > 10 || product.stock_quantity === 0)) {
        return false;
      }
      if (stockFilter === 'out' && product.stock_quantity > 0) {
        return false;
      }
      if (stockFilter === 'expiring') {
        const exp = product.expiry_date || '';
        if (!exp.startsWith('2026') && !exp.startsWith('2027-01')) {
          return false;
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const nameMatch = product.name.toLowerCase().includes(query);
        const batchMatch = (product.batch_no || '').toLowerCase().includes(query);
        const mfgMatch = (product.manufacturer || '').toLowerCase().includes(query);
        const barcodeMatch = (product.barcode || '').toLowerCase().includes(query);
        const saltMatch = (product.metadata?.composition || '').toLowerCase().includes(query);
        return nameMatch || batchMatch || mfgMatch || barcodeMatch || saltMatch;
      }

      return true;
    });
  }, [products, selectedCategory, stockFilter, searchTerm]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Name',
      'Category',
      'MRP',
      'Selling Price',
      'Discount %',
      'Stock Quantity',
      'Unit',
      'Batch No',
      'Expiry Date',
      'Manufacturer',
      'Barcode',
      'Composition',
    ];

    const rows = filteredProducts.map((p) => [
      `"${p.id}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category_name}"`,
      p.mrp,
      p.selling_price,
      p.discount_percentage,
      p.stock_quantity,
      `"${p.unit}"`,
      `"${p.batch_no || ''}"`,
      `"${p.expiry_date || ''}"`,
      `"${(p.manufacturer || '').replace(/"/g, '""')}"`,
      `"${p.barcode || ''}"`,
      `"${(p.metadata?.composition || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pharmacy_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Allopathic':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Ayurvedic':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cosmetics':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Provisional':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Surgical':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-24">
      {/* Top Search & Actions Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search medicine name, salt/composition, batch no, barcode..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* View Mode & Export Buttons */}
        <div className="flex items-center gap-2 justify-between sm:justify-end">
          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-slate-600">
            <button
              onClick={() => setViewMode('grid')}
              title="Card Grid View"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-white text-teal-600 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Audit Table View"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-white text-teal-600 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            title="Export filtered inventory to CSV"
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm shadow-teal-600/30 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* Category Tabs Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            {cat === 'All' ? 'All Categories' : cat}
          </button>
        ))}
      </div>

      {/* Stock Status Pills */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium">Status:</span>
        <button
          onClick={() => setStockFilter('all')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
            stockFilter === 'all'
              ? 'bg-teal-100 text-teal-800'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All ({products.length})
        </button>
        <button
          onClick={() => setStockFilter('low')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
            stockFilter === 'low'
              ? 'bg-amber-100 text-amber-800'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Low Stock ({products.filter(p => p.stock_quantity <= 10 && p.stock_quantity > 0).length})
        </button>
        <button
          onClick={() => setStockFilter('out')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
            stockFilter === 'out'
              ? 'bg-rose-100 text-rose-800'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Out of Stock ({products.filter(p => p.stock_quantity === 0).length})
        </button>
        <button
          onClick={() => setStockFilter('expiring')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
            stockFilter === 'expiring'
              ? 'bg-purple-100 text-purple-800'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Expiring Soon ({products.filter(p => (p.expiry_date || '').startsWith('2026')).length})
        </button>
      </div>

      {/* Product List Content */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">No medicines found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, clearing filters, or scan a new product with the AI camera.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('All');
              setStockFilter('all');
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const isLow = product.stock_quantity <= 10 && product.stock_quantity > 0;
            const isOut = product.stock_quantity === 0;

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Stock Level Top Indicator bar */}
                <div
                  className={`h-1 absolute top-0 left-0 right-0 ${
                    isOut
                      ? 'bg-rose-500'
                      : isLow
                      ? 'bg-amber-400'
                      : 'bg-emerald-500'
                  }`}
                />

                <div className="space-y-3">
                  {/* Top Image + Badges */}
                  <div className="flex gap-3 items-start">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative">
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-xs bg-slate-50">
                          Rx
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getCategoryBadgeClass(
                            product.category_name
                          )}`}
                        >
                          {product.category_name}
                        </span>

                        {isOut ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Low Stock
                          </span>
                        ) : null}
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm mt-1 line-clamp-1" title={product.name}>
                        {product.name}
                      </h3>

                      <p className="text-[11px] text-slate-500 truncate" title={product.metadata?.composition || product.manufacturer || ''}>
                        {product.metadata?.composition || product.manufacturer || 'Standard Pharmaceutical'}
                      </p>
                    </div>
                  </div>

                  {/* Batch & Expiry Tag */}
                  <div className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 font-mono">
                      B.No: <strong className="text-slate-700">{product.batch_no || 'N/A'}</strong>
                    </span>
                    <span className="text-slate-500">
                      Exp: <strong className="text-slate-800">{product.expiry_date || 'N/A'}</strong>
                    </span>
                  </div>

                  {/* Price & Discount */}
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-base font-black text-slate-900">
                        ₹{Number(product.selling_price).toFixed(2)}
                      </span>
                      {Number(product.mrp) > Number(product.selling_price) && (
                        <span className="ml-1.5 text-xs text-slate-400 line-through">
                          ₹{Number(product.mrp).toFixed(2)}
                        </span>
                      )}
                    </div>
                    {Number(product.discount_percentage) > 0 && (
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {product.discount_percentage}% OFF
                      </span>
                    )}
                  </div>
                </div>

                {/* Stock Stepper & Card Actions */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Stock Stepper */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onUpdateStock(product.id, Math.max(0, product.stock_quantity - 1))}
                      title="Decrease Stock"
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <MinusCircle className="w-5 h-5" />
                    </button>
                    <span className="font-bold text-xs min-w-[32px] text-center text-slate-800">
                      {product.stock_quantity} <span className="text-[10px] text-slate-400 font-normal">{product.unit}</span>
                    </span>
                    <button
                      onClick={() => onUpdateStock(product.id, product.stock_quantity + 1)}
                      title="Increase Stock"
                      className="text-slate-400 hover:text-teal-600 transition-colors"
                    >
                      <PlusCircle className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Actions: Barcode, Edit, Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenBarcodeModal(product)}
                      title="View / Print Barcode"
                      className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100"
                    >
                      <Barcode className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onEditProduct(product)}
                      title="Edit Product"
                      className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {deleteConfirmId === product.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200 animate-in fade-in">
                        <span className="text-[10px] text-rose-700 font-semibold">Delete?</span>
                        <button
                          onClick={() => {
                            onDeleteProduct(product.id);
                            setDeleteConfirmId(null);
                          }}
                          className="text-[10px] font-bold text-rose-600 hover:underline"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-[10px] text-slate-400 hover:underline ml-1"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(product.id)}
                        title="Delete Product"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Audit Table View */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Medicine & Salt</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Batch / Expiry</th>
                  <th className="px-3 py-3 text-right">MRP</th>
                  <th className="px-3 py-3 text-right">Selling Price</th>
                  <th className="px-3 py-3 text-center">Stock</th>
                  <th className="px-3 py-3">Barcode</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {p.metadata?.composition || p.manufacturer || 'Pharma Product'}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getCategoryBadgeClass(p.category_name)}`}>
                        {p.category_name}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px]">
                      <div>{p.batch_no || '—'}</div>
                      <div className="text-slate-400">{p.expiry_date || '—'}</div>
                    </td>
                    <td className="px-3 py-3 text-right font-medium">₹{Number(p.mrp).toFixed(2)}</td>
                    <td className="px-3 py-3 text-right font-bold text-teal-700">₹{Number(p.selling_price).toFixed(2)}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.stock_quantity === 0
                          ? 'bg-rose-100 text-rose-700'
                          : p.stock_quantity <= 10
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {p.stock_quantity} {p.unit}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] text-slate-500">
                      {p.barcode || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => onOpenBarcodeModal(p)}
                          className="p-1 text-slate-400 hover:text-teal-600 rounded"
                          title="Barcode"
                        >
                          <Barcode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditProduct(p)}
                          className="p-1 text-slate-400 hover:text-teal-600 rounded"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteProduct(p.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
