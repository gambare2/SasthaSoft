'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  Sliders,
  X,
  History,
  ArrowUpDown,
  Filter,
  ShoppingCart,
  Truck,
  Warehouse as WarehouseIcon,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { useApp, useRole } from '@/context/AppProvider';
import { formatCurrency, formatDateTime, formatDate, formatNumber } from '@/lib/formatters';
import { Product, ProductCategory } from '@/types';
import { calculateInventoryValuation } from '@/domain/analytics-engine';

export function InventoryList() {
  const { state, adjustStock } = useApp();
  const { hasPermission } = useRole();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [newStockInput, setNewStockInput] = useState<string>('');
  const [reasonInput, setReasonInput] = useState<string>('');
  const [isConfirmedCheck, setIsConfirmedCheck] = useState<boolean>(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const canCreate = hasPermission('inventory:create');
  const canAdjust = hasPermission('inventory:adjust_stock');

  const categories = ['ALL', 'Electronics', 'Hardware', 'Packaging', 'Office Supplies', 'Industrial Equipment', 'Raw Materials'];

  const warehouseMap = useMemo(() => {
    const map = new Map<string, string>();
    state.warehouses.forEach((w) => map.set(w.id, w.name));
    return map;
  }, [state.warehouses]);

  const totalValuation = useMemo(() => calculateInventoryValuation(state.products), [state.products]);
  const totalUnits = useMemo(() => state.products.reduce((acc, p) => acc + (p.currentStock || 0), 0), [state.products]);
  const lowStockCount = useMemo(() => state.products.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStockLevel).length, [state.products]);
  const outOfStockCount = useMemo(() => state.products.filter((p) => p.currentStock === 0).length, [state.products]);

  const filteredProducts = useMemo(() => {
    return state.products
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase()) ||
          p.barcode.includes(search);

        const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
        const matchesWarehouse = selectedWarehouse === 'ALL' || p.warehouseId === selectedWarehouse;

        let status = 'IN_STOCK';
        if (p.currentStock === 0) status = 'OUT_OF_STOCK';
        else if (p.currentStock <= p.minStockLevel) status = 'LOW_STOCK';

        const matchesStatus = selectedStatus === 'ALL' || status === selectedStatus;

        return matchesSearch && matchesCategory && matchesWarehouse && matchesStatus;
      })
      .sort((a, b) => {
        if (sortField === 'sku') {
          return sortDirection === 'asc' ? a.sku.localeCompare(b.sku) : b.sku.localeCompare(a.sku);
        }
        if (sortField === 'name') {
          return sortDirection === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        }
        if (sortField === 'stock') {
          return sortDirection === 'asc' ? a.currentStock - b.currentStock : b.currentStock - a.currentStock;
        }
        if (sortField === 'cost') {
          return sortDirection === 'asc' ? a.costPrice - b.costPrice : b.costPrice - a.costPrice;
        }
        if (sortField === 'selling') {
          return sortDirection === 'asc' ? a.sellingPrice - b.sellingPrice : b.sellingPrice - a.sellingPrice;
        }
        if (sortField === 'value') {
          const valA = a.currentStock * a.costPrice;
          const valB = b.currentStock * b.costPrice;
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return 0;
      });
  }, [state.products, search, selectedCategory, selectedWarehouse, selectedStatus, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleOpenAdjust = (product: Product) => {
    setAdjustingProduct(product);
    setNewStockInput(product.currentStock.toString());
    setReasonInput('Physical inventory count audit reconciliation');
    setIsConfirmedCheck(false);
    setAdjustError(null);
  };

  const handleSaveAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;

    if (!isConfirmedCheck) {
      setAdjustError('Please check the confirmation box to authorize this balance update.');
      return;
    }

    const parsed = parseInt(newStockInput, 10);
    if (isNaN(parsed) || parsed < 0) {
      setAdjustError('Please enter a valid non-negative number for adjusted stock.');
      return;
    }

    const res = adjustStock({
      productId: adjustingProduct.id,
      newStock: parsed,
      reason: reasonInput,
    });

    if (res.success) {
      setAdjustingProduct(null);
    } else {
      setAdjustError(res.error);
    }
  };

  const delta = adjustingProduct ? (parseInt(newStockInput, 10) || 0) - adjustingProduct.currentStock : 0;

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-[#E5E9EB] shadow-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-navy">Inventory Master Catalog</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-mint text-teal border border-[#D5ECE7]">
              {filteredProducts.length} Items Listed
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Real-time multi-warehouse stock levels, reorder parameters, valuation assets, and audit adjustments.
          </p>
        </div>

        {canCreate && (
          <Link
            href="/inventory/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal hover:bg-teal-hover rounded-lg transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="p-5 rounded-2xl bg-turquoise text-navy shadow-subtle border border-turquoise-dark/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-navy/80">
              Total Stock Valuation
            </span>
            <div className="p-1.5 rounded-lg bg-white/40 text-navy">
              <Layers className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black tracking-tight text-navy">
              {formatCurrency(totalValuation)}
            </p>
            <p className="text-[11px] text-navy/80 font-medium mt-1">
              At wholesale landed cost basis
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-mint text-navy shadow-subtle border border-[#D5ECE7] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Total Physical Units
            </span>
            <div className="p-1.5 rounded-lg bg-pale-cyan text-teal">
              <WarehouseIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black tracking-tight text-teal">
              {formatNumber(totalUnits)} Units
            </p>
            <p className="text-[11px] text-text-secondary font-medium mt-1">
              Across {state.warehouses.length} regional warehouse hubs
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-navy text-white shadow-panel flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-300">
              SKU Depth
            </span>
            <div className="p-1.5 rounded-lg bg-navy-light text-turquoise">
              <Filter className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black tracking-tight text-turquoise">
              {state.products.length} Products
            </p>
            <p className="text-[11px] text-gray-300 font-medium mt-1">
              In {categories.length - 1} active classifications
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-mint text-navy shadow-subtle border border-[#D5ECE7] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Replenishment Attention
            </span>
            <div className="p-1.5 rounded-lg bg-pale-cyan text-warning">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black tracking-tight text-navy">
              {lowStockCount + outOfStockCount} Alerts
            </p>
            <p className="text-[11px] text-text-secondary font-medium mt-1">
              {lowStockCount} low &bull; {outOfStockCount} out-of-stock
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white rounded-2xl border border-[#E5E9EB] shadow-subtle space-y-3">

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-text-secondary mr-2 shrink-0">Category:</span>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-turquoise text-navy shadow-2xs font-bold'
                    : 'bg-mint text-text-secondary hover:text-navy hover:bg-pale-cyan/50'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E5E9EB]">

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search product name, SKU, or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-mint/40 border border-[#E5E9EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal text-navy placeholder:text-text-secondary"
            />
          </div>

          <div className="relative">
            <WarehouseIcon className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-secondary" />
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-mint/40 border border-[#E5E9EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal text-navy font-medium"
            >
              <option value="ALL">All Regional Hubs</option>
              {state.warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.city})
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-secondary" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-mint/40 border border-[#E5E9EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal text-navy font-medium"
            >
              <option value="ALL">All Stock Statuses</option>
              <option value="IN_STOCK">In Stock (Normal)</option>
              <option value="LOW_STOCK">Low Stock (Needs Reorder)</option>
              <option value="OUT_OF_STOCK">Out of Stock (Zero Balance)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E9EB] shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-mint/40 border-b border-[#E5E9EB] text-text-secondary uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 cursor-pointer hover:text-navy" onClick={() => handleSort('sku')}>
                  <div className="flex items-center gap-1.5">
                    <span>SKU Code</span>
                    <ArrowUpDown className="w-3 h-3 text-text-secondary" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-navy" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1.5">
                    <span>Product Name</span>
                    <ArrowUpDown className="w-3 h-3 text-text-secondary" />
                  </div>
                </th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Warehouse</th>
                <th className="py-3 px-4 cursor-pointer hover:text-navy text-right" onClick={() => handleSort('stock')}>
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Stock</span>
                    <ArrowUpDown className="w-3 h-3 text-text-secondary" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-navy text-right" onClick={() => handleSort('cost')}>
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Cost (₹)</span>
                    <ArrowUpDown className="w-3 h-3 text-text-secondary" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-navy text-right" onClick={() => handleSort('selling')}>
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Selling (₹)</span>
                    <ArrowUpDown className="w-3 h-3 text-text-secondary" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-navy text-right" onClick={() => handleSort('value')}>
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Asset Value</span>
                    <ArrowUpDown className="w-3 h-3 text-text-secondary" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E9EB]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-text-secondary">
                    <p className="font-semibold text-navy">No products found</p>
                    <p className="text-[11px] text-text-secondary mt-1">Try relaxing your search terms or filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.currentStock <= p.minStockLevel && p.currentStock > 0;
                  const isOut = p.currentStock === 0;
                  const warehouseName = warehouseMap.get(p.warehouseId) || 'Main Hub';
                  const assetValue = p.currentStock * p.costPrice;

                  return (
                    <tr key={p.id} className="hover:bg-mint/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-navy">
                        <Link href={`/inventory/${p.id}`} className="hover:text-teal hover:underline">
                          {p.sku}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-navy">{p.name}</p>
                        <p className="text-[10px] text-text-secondary font-mono">{p.barcode}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-mint text-teal border border-[#D5ECE7]">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">{warehouseName}</td>
                      <td className="py-3 px-4 text-right font-bold text-navy">
                        {formatNumber(p.currentStock)} {p.unit}
                      </td>
                      <td className="py-3 px-4 text-right text-text-secondary font-medium">
                        {formatCurrency(p.costPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-navy">
                        {formatCurrency(p.sellingPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-navy">{formatCurrency(assetValue)}</td>
                      <td className="py-3 px-4 text-center">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-danger/10 text-danger border border-danger/20">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-warning/10 text-warning border border-warning/20">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-pale-cyan text-teal border border-turquoise/30">
                            <CheckCircle className="w-3 h-3" />
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canAdjust && (
                            <button
                              type="button"
                              onClick={() => handleOpenAdjust(p)}
                              title="Adjust inventory balance"
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-teal bg-mint hover:bg-pale-cyan rounded-lg border border-[#D5ECE7] transition-colors"
                            >
                              <Sliders className="w-3 h-3" />
                              Adjust
                            </button>
                          )}
                          <Link
                            href={`/inventory/${p.id}`}
                            className="inline-flex items-center gap-0.5 px-2 py-1 text-xs font-semibold text-teal hover:underline"
                          >
                            Details
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-xl border border-[#E5E9EB] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E9EB]">
              <div>
                <h3 className="text-base font-bold text-navy">Execute Stock Adjustment</h3>
                <p className="text-xs text-text-secondary font-mono mt-0.5">
                  {adjustingProduct.name} ({adjustingProduct.sku})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                className="p-1 text-text-secondary hover:text-navy rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjust} className="space-y-4 mt-4">
              {adjustError && (
                <div className="p-3 text-xs text-danger bg-danger/10 border border-danger/20 rounded-xl">
                  {adjustError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 p-3 bg-mint/50 rounded-xl border border-[#D5ECE7]">
                <div>
                  <span className="text-[10px] text-text-secondary uppercase font-semibold">Current Count</span>
                  <p className="text-lg font-bold text-navy mt-0.5">
                    {adjustingProduct.currentStock} {adjustingProduct.unit}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-text-secondary uppercase font-semibold">Net Difference</span>
                  <p
                    className={`text-lg font-bold mt-0.5 ${
                      delta > 0 ? 'text-teal' : delta < 0 ? 'text-danger' : 'text-text-secondary'
                    }`}
                  >
                    {delta > 0 ? `+${delta}` : delta} {adjustingProduct.unit}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy mb-1">
                  New Verified Stock Count ({adjustingProduct.unit}) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={newStockInput}
                  onChange={(e) => setNewStockInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-mint/30 border border-[#E5E9EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal text-navy font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy mb-1">
                  Adjustment Reason & Audit Reference *
                </label>
                <input
                  type="text"
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="e.g. Physical count reconciliation, damaged write-off"
                  className="w-full px-3 py-2 text-xs bg-mint/30 border border-[#E5E9EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal text-navy"
                  required
                />
              </div>

              <div className="p-3 bg-pale-cyan/50 rounded-xl border border-[#D7F1F2]">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isConfirmedCheck}
                    onChange={(e) => setIsConfirmedCheck(e.target.checked)}
                    className="mt-0.5 rounded text-teal focus:ring-teal"
                  />
                  <span className="text-xs text-navy leading-tight">
                    I confirm this adjustment reflects physically verified balance and will record an immutable movement in the ledger.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E9EB]">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-text-secondary bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isConfirmedCheck}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal hover:bg-teal-hover rounded-lg transition-colors disabled:opacity-50 shadow-2xs"
                >
                  Confirm & Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function InventoryCreateForm() {
  const router = useRouter();
  const { state, createProduct } = useApp();
  const { hasPermission } = useRole();
  const canCreate = hasPermission('inventory:create');

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Electronics');
  const [barcode, setBarcode] = useState('');
  const [costPrice, setCostPrice] = useState('5000');
  const [sellingPrice, setSellingPrice] = useState('8500');
  const [initialStock, setInitialStock] = useState('20');
  const [minStockLevel, setMinStockLevel] = useState('5');
  const [unit, setUnit] = useState('units');
  const [warehouseId, setWarehouseId] = useState('wh-001');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const res = createProduct({
      sku: sku.trim(),
      name: name.trim(),
      description: description.trim(),
      category,
      barcode: barcode.trim() || `${Date.now()}`,
      costPrice: parseFloat(costPrice) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      initialStock: parseInt(initialStock, 10) || 0,
      minStockLevel: parseInt(minStockLevel, 10) || 5,
      reorderPoint: (parseInt(minStockLevel, 10) || 5) + 5,
      maxStockLevel: 200,
      unit: unit.trim() || 'units',
      warehouseId,
    });

    if (res.success) {
      router.push('/inventory');
    } else {
      setErrorMsg(res.error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl border border-[#E5E9EB] shadow-subtle space-y-6">
      <div className="pb-4 border-b border-[#E5E9EB]">
        <h2 className="text-lg font-bold text-navy">Add New Catalog Item</h2>
        <p className="text-xs text-text-secondary mt-1">
          Define product specifications. Opening stock creates an initial Stock Movement record in history.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs text-danger bg-danger/10 border border-danger/20 rounded-xl">
          {errorMsg}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-navy mb-1">SKU Code *</label>
            <input
              type="text"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. ELC-SCN-09"
              className="w-full px-3 py-2 text-xs bg-mint/30 border border-[#E5E9EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal text-navy"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy mb-1">Barcode / EAN</label>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="e.g. 890102030999"
              className="w-full px-3 py-2 text-xs bg-mint/30 border border-[#E5E9EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal text-navy"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-navy mb-1">Product Title *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Industrial Barcode Scanner Stand with Auto-Sensor"
            className="w-full px-3 py-2 text-xs bg-mint/30 border border-[#E5E9EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal text-navy font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-navy mb-1">Description</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Technical specifications, dimensions, packaging details..."
            className="w-full px-3 py-2 text-xs bg-mint/30 border border-[#E5E9EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal text-navy"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-navy mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductCategory)}
              className="w-full px-3 py-2 text-xs bg-mint/30 border border-[#E5E9EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal text-navy font-medium"
            >
              <option value="Electronics">Electronics</option>
              <option value="Hardware">Hardware</option>
              <option value="Packaging">Packaging</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Industrial Equipment">Industrial Equipment</option>
              <option value="Raw Materials">Raw Materials</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy mb-1">Cost Price (₹)</label>
            <input
              type="number"
              step="any"
              min="0"
              required
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-mint/30 border border-[#E5E9EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal text-navy"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy mb-1">Selling Price (₹)</label>
            <input
              type="number"
              step="any"
              min="0"
              required
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-mint/30 border border-[#E5E9EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal text-navy"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-navy mb-1">Opening Stock *</label>
            <input
              type="number"
              min="0"
              required
              value={initialStock}
              onChange={(e) => setInitialStock(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-mint/30 border border-[#E5E9EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal text-navy font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy mb-1">Min Reorder Level</label>
            <input
              type="number"
              min="0"
              required
              value={minStockLevel}
              onChange={(e) => setMinStockLevel(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-mint/30 border border-[#E5E9EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal text-navy"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy mb-1">Unit of Measure</label>
            <input
              type="text"
              required
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. units, boxes, kg"
              className="w-full px-3 py-2 text-xs bg-mint/30 border border-[#E5E9EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal text-navy"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy mb-1">Assigned Warehouse</label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-mint/30 border border-[#E5E9EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal text-navy font-medium"
            >
              {state.warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>{wh.name} ({wh.city})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E5E9EB]">
          <Link
            href="/inventory"
            className="px-4 py-2 text-xs font-semibold text-text-secondary bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!canCreate}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal hover:bg-teal-hover disabled:opacity-50 rounded-lg transition-colors shadow-2xs"
          >
            Create Product Record
          </button>
        </div>
      </form>
    </div>
  );
}

export function InventoryDetailView({ id }: { id: string }) {
  const { state } = useApp();
  const product = state.products.find((p) => p.id === id) || state.products[0];

  const movements = useMemo(() => {
    return state.stockMovements.filter((m) => m.productId === product.id);
  }, [state.stockMovements, product.id]);

  const relatedSales = useMemo(() => {
    return state.salesOrders.filter((so) => so.items.some((item) => item.productId === product.id));
  }, [state.salesOrders, product.id]);

  const relatedPurchases = useMemo(() => {
    return state.purchaseOrders.filter((po) => po.items.some((item) => item.productId === product.id));
  }, [state.purchaseOrders, product.id]);

  const marginPct = product.sellingPrice > 0 ? (((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100).toFixed(1) : '0';
  const isLow = product.currentStock <= product.minStockLevel && product.currentStock > 0;
  const isOut = product.currentStock === 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      <div className="p-6 bg-white rounded-2xl border border-[#E5E9EB] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-navy bg-mint px-2 py-0.5 rounded border border-[#D5ECE7]">
              {product.sku}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-pale-cyan text-teal font-bold">
              {product.category}
            </span>
            {isOut ? (
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-danger/10 text-danger font-bold border border-danger/20">
                Out of Stock
              </span>
            ) : isLow ? (
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-warning/10 text-warning font-bold border border-warning/20">
                Low Stock Alert
              </span>
            ) : (
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-mint text-teal font-bold border border-[#D5ECE7]">
                Healthy Stock Level
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-navy mt-1.5">{product.name}</h1>
          <p className="text-xs text-text-secondary mt-0.5">{product.description}</p>
        </div>

        <Link
          href="/inventory"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-text-secondary bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors shrink-0"
        >
          &larr; Return to Inventory
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-turquoise text-navy rounded-2xl shadow-subtle border border-turquoise-dark/20">
          <span className="text-[11px] font-bold uppercase tracking-wider text-navy/80">Current Stock</span>
          <p className="text-2xl font-black tracking-tight text-navy mt-1">{product.currentStock} {product.unit}</p>
          <p className="text-[11px] text-navy/80 font-medium mt-0.5">Reorder Threshold: {product.minStockLevel}</p>
        </div>

        <div className="p-5 bg-mint text-navy rounded-2xl shadow-subtle border border-[#D5ECE7]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Landed Cost Price</span>
          <p className="text-2xl font-black tracking-tight text-navy mt-1">{formatCurrency(product.costPrice)}</p>
          <p className="text-[11px] text-text-secondary mt-0.5">Asset Invested: {formatCurrency(product.costPrice * product.currentStock)}</p>
        </div>

        <div className="p-5 bg-mint text-navy rounded-2xl shadow-subtle border border-[#D5ECE7]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Selling Price</span>
          <p className="text-2xl font-black tracking-tight text-teal mt-1">{formatCurrency(product.sellingPrice)}</p>
          <p className="text-[11px] text-teal font-semibold mt-0.5">Margin: {marginPct}%</p>
        </div>

        <div className="p-5 bg-navy text-white rounded-2xl shadow-panel">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-300">Barcode Identifier</span>
          <p className="text-xl font-mono font-bold text-turquoise mt-1">{product.barcode}</p>
          <p className="text-[11px] text-gray-300 mt-0.5">EAN / POS Scanner</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="p-5 bg-white rounded-2xl border border-[#E5E9EB] shadow-subtle space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E9EB]">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-teal" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy">Related Purchase Orders ({relatedPurchases.length})</h3>
            </div>
            <Link href="/purchases" className="text-[10px] font-bold text-teal hover:underline flex items-center gap-0.5">
              Purchases &rarr;
            </Link>
          </div>

          {relatedPurchases.length === 0 ? (
            <p className="text-xs text-text-secondary py-4 text-center">No purchase orders found for this product.</p>
          ) : (
            <div className="space-y-2">
              {relatedPurchases.map((po) => {
                const item = po.items.find((i) => i.productId === product.id);
                return (
                  <div key={po.id} className="p-3 bg-mint/50 rounded-xl border border-[#D5ECE7] flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-navy">{po.orderNumber}</span>
                        <span className="font-semibold text-text-primary">{po.supplierName}</span>
                      </div>
                      <p className="text-[11px] text-text-secondary mt-0.5">
                        Qty: <strong>{item?.quantity} {product.unit}</strong> @ {formatCurrency(item?.unitPrice || 0)} &bull; {formatDate(po.orderDate)}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${po.status === 'RECEIVED' ? 'bg-pale-cyan text-teal' : 'bg-mint text-navy'}`}>
                      {po.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#E5E9EB] shadow-subtle space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E9EB]">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-teal" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy">Related Sales Orders ({relatedSales.length})</h3>
            </div>
            <Link href="/sales" className="text-[10px] font-bold text-teal hover:underline flex items-center gap-0.5">
              Sales &rarr;
            </Link>
          </div>

          {relatedSales.length === 0 ? (
            <p className="text-xs text-text-secondary py-4 text-center">No sales orders found for this product.</p>
          ) : (
            <div className="space-y-2">
              {relatedSales.map((so) => {
                const item = so.items.find((i) => i.productId === product.id);
                return (
                  <div key={so.id} className="p-3 bg-mint/50 rounded-xl border border-[#D5ECE7] flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-navy">{so.orderNumber}</span>
                        <span className="font-semibold text-text-primary">{so.customerName}</span>
                      </div>
                      <p className="text-[11px] text-text-secondary mt-0.5">
                        Qty: <strong>{item?.quantity} {product.unit}</strong> @ {formatCurrency(item?.unitPrice || 0)} &bull; {formatDate(so.orderDate)}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${so.status === 'CONFIRMED' || so.status === 'SHIPPED' ? 'bg-pale-cyan text-teal' : 'bg-mint text-navy'}`}>
                      {so.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="p-5 bg-white rounded-2xl border border-[#E5E9EB] shadow-subtle space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E5E9EB]">
          <History className="w-4 h-4 text-teal" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-navy">Stock Movement Audit Trail for {product.sku}</h3>
        </div>

        {movements.length === 0 ? (
          <p className="text-xs text-text-secondary py-4 text-center">No movements recorded yet for this SKU.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-mint/40 border-b border-[#E5E9EB] text-text-secondary font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-center">Balance (Prev &rarr; New)</th>
                  <th className="py-2.5 px-3">Reason / Ref</th>
                  <th className="py-2.5 px-3">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E9EB]">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-mint/20">
                    <td className="py-2.5 px-3 text-text-secondary">{formatDateTime(m.createdAt || '')}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[9px] bg-pale-cyan text-teal font-mono font-bold">
                        {m.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-navy text-right">{m.quantity}</td>
                    <td className="py-2.5 px-3 text-text-secondary text-center font-mono">
                      {m.previousQuantity} &rarr; <strong className="text-navy">{m.newQuantity}</strong>
                    </td>
                    <td className="py-2.5 px-3 text-text-secondary">{m.reason}</td>
                    <td className="py-2.5 px-3 text-text-secondary">{m.performedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

