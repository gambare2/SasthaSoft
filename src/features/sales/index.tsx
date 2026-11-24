'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  CheckCircle,
  Ban,
  AlertCircle,
  Trash2,
  Search,
  ArrowUpDown,
  Filter,
  Printer,
  Calendar,
  AlertTriangle,
  ShoppingCart,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { useApp, useRole } from '@/context/AppProvider';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { calculateItemTotal } from '@/domain/calculations';
import { isDateInRange, DateFilterPreset, DateRangeFilter } from '@/domain/analytics-engine';

export function SalesList() {
  const { state, confirmSalesOrder, cancelSalesOrder } = useApp();
  const { currentRole, currentEmployee, hasPermission } = useRole();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [datePreset, setDatePreset] = useState<DateFilterPreset>('ALL');

  const [sortField, setSortField] = useState<'orderNumber' | 'date' | 'total'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [actionMessage, setActionMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const canCreate = hasPermission('sales:create');
  const canConfirm = hasPermission('sales:confirm');
  const canAuthorizeReversals = hasPermission('transactions:authorize_reversals');

  const dateFilter: DateRangeFilter = useMemo(() => ({ preset: datePreset }), [datePreset]);

  const scopedOrders = useMemo(() => {
    return currentRole === 'EMPLOYEE'
      ? state.salesOrders.filter((o) => o.createdBy === currentEmployee.id)
      : state.salesOrders;
  }, [state.salesOrders, currentRole, currentEmployee.id]);

  const displayedOrders = useMemo(() => {
    return scopedOrders
      .filter((o) => {
        const matchesSearch =
          o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
          o.customerName.toLowerCase().includes(search.toLowerCase()) ||
          o.createdByName.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
        const inDate = isDateInRange(o.confirmedDate || o.orderDate || o.createdAt, dateFilter);

        return matchesSearch && matchesStatus && inDate;
      })
      .sort((a, b) => {
        if (sortField === 'orderNumber') {
          return sortDirection === 'asc' ? a.orderNumber.localeCompare(b.orderNumber) : b.orderNumber.localeCompare(a.orderNumber);
        }
        if (sortField === 'date') {
          const timeA = new Date(a.orderDate).getTime();
          const timeB = new Date(b.orderDate).getTime();
          return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
        }
        if (sortField === 'total') {
          return sortDirection === 'asc' ? a.totalAmount - b.totalAmount : b.totalAmount - a.totalAmount;
        }
        return 0;
      });
  }, [scopedOrders, search, statusFilter, dateFilter, sortField, sortDirection]);

  const handleSort = (field: 'orderNumber' | 'date' | 'total') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleConfirm = (orderId: string) => {
    setActionMessage(null);
    const res = confirmSalesOrder(orderId);
    if (res.success) {
      setActionMessage({ text: res.message || 'Sales order confirmed and stock deducted successfully.', isError: false });
    } else {
      setActionMessage({ text: res.error, isError: true });
    }
  };

  const handleCancel = (orderId: string) => {
    setActionMessage(null);
    const res = cancelSalesOrder(orderId);
    if (res.success) {
      setActionMessage({ text: res.message || 'Sales order cancelled and stock reversed.', isError: false });
    } else {
      setActionMessage({ text: res.error, isError: true });
    }
  };

  const stats = useMemo(() => {
    const totalCount = displayedOrders.length;
    const confirmed = displayedOrders.filter((o) => o.status === 'CONFIRMED' || o.status === 'SHIPPED');
    const confirmedRevenue = confirmed.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const pendingCount = displayedOrders.filter((o) => o.status === 'DRAFT' || o.status === 'PENDING').length;
    const cancelledCount = displayedOrders.filter((o) => o.status === 'CANCELLED').length;
    return { totalCount, confirmedCount: confirmed.length, confirmedRevenue, pendingCount, cancelledCount };
  }, [displayedOrders]);

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-[#E5E9EB] shadow-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-navy">Sales Orders & Fulfillment</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-mint text-teal border border-[#D5ECE7]">
              {displayedOrders.length} Orders
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            {currentRole === 'EMPLOYEE'
              ? 'Showing personal customer sales orders initiated by your account.'
              : 'Enterprise-wide customer purchase orders, confirmation status, and warehouse dispatch journal.'}
          </p>
        </div>

        {canCreate && (
          <Link
            href="/sales/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal hover:bg-teal-hover rounded-lg transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            Create Sales Order
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="p-5 rounded-2xl bg-turquoise text-navy shadow-subtle border border-turquoise-dark/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-navy/80">
              Confirmed Sales Revenue
            </span>
            <div className="p-1.5 rounded-lg bg-white/40 text-navy">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black tracking-tight text-navy">
              {formatCurrency(stats.confirmedRevenue)}
            </p>
            <p className="text-[11px] text-navy/80 font-medium mt-1">
              {stats.confirmedCount} fulfilled orders in view
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-mint text-navy shadow-subtle border border-[#D5ECE7] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Total Order Entries
            </span>
            <div className="p-1.5 rounded-lg bg-pale-cyan text-teal">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black tracking-tight text-teal">
              {stats.totalCount} Orders
            </p>
            <p className="text-[11px] text-text-secondary font-medium mt-1">
              Active ledger entries
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-navy text-white shadow-panel flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-300">
              Awaiting Dispatch
            </span>
            <div className="p-1.5 rounded-lg bg-navy-light text-turquoise">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black tracking-tight text-turquoise">
              {stats.pendingCount} Draft Orders
            </p>
            <p className="text-[11px] text-gray-300 font-medium mt-1">
              Pending inventory allocation
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-mint text-navy shadow-subtle border border-[#D5ECE7] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Cancelled / Reversed
            </span>
            <div className="p-1.5 rounded-lg bg-pale-cyan text-danger">
              <Ban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black tracking-tight text-navy">
              {stats.cancelledCount} Cancelled
            </p>
            <p className="text-[11px] text-text-secondary font-medium mt-1">
              Inventory reversed to balance
            </p>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-3 text-xs rounded-xl flex items-center justify-between animate-in fade-in duration-150 ${actionMessage.isError
            ? 'bg-danger/10 text-danger border border-danger/20'
            : 'bg-mint text-teal border border-[#D5ECE7]'
            }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
            <span className="font-semibold">{actionMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-xs font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="p-4 bg-white rounded-2xl border border-[#E5E9EB] shadow-subtle space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search order #, customer, sales rep..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-mint/40 border border-[#E5E9EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal text-navy placeholder:text-text-secondary"
            />
          </div>

          <div className="relative">
            <Filter className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-secondary" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-mint/40 border border-[#E5E9EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal text-navy font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">DRAFT (Unconfirmed)</option>
              <option value="CONFIRMED">CONFIRMED (Stock Deducted)</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="CANCELLED">CANCELLED (Stock Restored)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-mint/40 px-2.5 py-1.5 rounded-lg border border-[#E5E9EB]">
            <Calendar className="w-3.5 h-3.5 text-teal" />
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as DateFilterPreset)}
              className="w-full text-xs bg-transparent border-0 text-navy font-semibold focus:ring-0 p-0 cursor-pointer"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Today</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
              <option value="LAST_90_DAYS">Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E9EB] shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-mint/40 border-b border-[#E5E9EB] text-text-secondary uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 cursor-pointer hover:text-navy" onClick={() => handleSort('orderNumber')}>
                  <div className="flex items-center gap-1.5">
                    <span>Order #</span>
                    <ArrowUpDown className="w-3 h-3 text-text-secondary" />
                  </div>
                </th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Warehouse</th>
                <th className="py-3 px-4 cursor-pointer hover:text-navy" onClick={() => handleSort('date')}>
                  <div className="flex items-center gap-1.5">
                    <span>Order Date</span>
                    <ArrowUpDown className="w-3 h-3 text-text-secondary" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-navy text-right" onClick={() => handleSort('total')}>
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Total Amount</span>
                    <ArrowUpDown className="w-3 h-3 text-text-secondary" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Initiated By</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E9EB]">
              {displayedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-secondary">
                    <p className="font-semibold text-navy">No sales orders found</p>
                    <p className="text-[11px] text-text-secondary mt-1">Try adjusting your search criteria or date filter.</p>
                  </td>
                </tr>
              ) : (
                displayedOrders.map((so) => {
                  const isDraft = so.status === 'DRAFT' || so.status === 'PENDING';
                  const isConfirmed = so.status === 'CONFIRMED' || so.status === 'SHIPPED';
                  const isCancelled = so.status === 'CANCELLED';

                  return (
                    <tr key={so.id} className="hover:bg-mint/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-navy">
                        <Link href={`/sales/${so.id}`} className="hover:text-teal hover:underline">
                          {so.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-semibold text-navy">{so.customerName}</td>
                      <td className="py-3 px-4 text-text-secondary">{so.warehouseName}</td>
                      <td className="py-3 px-4 text-text-secondary">{formatDate(so.orderDate)}</td>
                      <td className="py-3 px-4 font-bold text-navy text-right">{formatCurrency(so.totalAmount)}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${isConfirmed
                            ? 'bg-pale-cyan text-teal border border-turquoise/30'
                            : isCancelled
                              ? 'bg-danger/10 text-danger border border-danger/20'
                              : 'bg-mint text-navy border border-[#D5ECE7]'
                            }`}
                        >
                          {so.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">{so.createdByName}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">

                          {isDraft && canConfirm && (
                            <button
                              type="button"
                              onClick={() => handleConfirm(so.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-navy bg-turquoise hover:bg-turquoise-dark rounded-lg transition-colors shadow-2xs font-bold"
                              title="Confirm order & deduct stock"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Confirm
                            </button>
                          )}

                          {!isCancelled && (canAuthorizeReversals || (isDraft && currentRole !== 'EMPLOYEE')) && (
                            <button
                              type="button"
                              onClick={() => handleCancel(so.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-danger bg-danger/10 hover:bg-danger/20 rounded-lg border border-danger/20 transition-colors"
                              title={isConfirmed ? 'Cancel and reverse stock back to warehouse' : 'Cancel order'}
                            >
                              <Ban className="w-3 h-3" />
                              Cancel
                            </button>
                          )}

                          <Link
                            href={`/sales/${so.id}`}
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
    </div>
  );
}

export function SalesCreateForm() {
  const router = useRouter();
  const { state, createSalesOrder } = useApp();
  const { hasPermission } = useRole();
  const canCreate = hasPermission('sales:create');

  const [customerId, setCustomerId] = useState(state.customers[0]?.id || '');
  const [warehouseId, setWarehouseId] = useState(state.warehouses[0]?.id || '');
  const [notes, setNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<
    { productId: string; quantity: number; unitPrice: number; discount: number; tax: number }[]
  >([
    {
      productId: state.products[0]?.id || '',
      quantity: 1,
      unitPrice: state.products[0]?.sellingPrice || 1000,
      discount: 0,
      tax: 18,
    },
  ]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const productMap = useMemo(() => {
    const map = new Map<string, (typeof state.products)[0]>();
    state.products.forEach((p) => map.set(p.id, p));
    return map;
  }, [state]);

  const liveTotals = useMemo(() => {
    let subtotal = 0;
    let taxAmount = 0;
    let totalDiscount = 0;
    let totalUnits = 0;

    for (const item of selectedItems) {
      const calc = calculateItemTotal(item.quantity, item.unitPrice, item.discount, item.tax);
      subtotal += calc.taxableAmount;
      taxAmount += calc.taxAmount;
      totalDiscount += calc.discountAmount;
      totalUnits += item.quantity;
    }

    const grandTotal = subtotal + taxAmount;
    return { subtotal, taxAmount, totalDiscount, grandTotal, totalUnits };
  }, [selectedItems]);

  const insufficientStockItems = useMemo(() => {
    return selectedItems.filter((item) => {
      const prod = productMap.get(item.productId);
      return prod && item.quantity > prod.currentStock;
    });
  }, [selectedItems, productMap]);

  const selectedCustomer = state.customers.find((c) => c.id === customerId);
  const selectedWarehouse = state.warehouses.find((w) => w.id === warehouseId);

  const handleAddItem = () => {
    const defaultProd = state.products[0];
    setSelectedItems([
      ...selectedItems,
      {
        productId: defaultProd?.id || '',
        quantity: 1,
        unitPrice: defaultProd?.sellingPrice || 1000,
        discount: 0,
        tax: 18,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (selectedItems.length <= 1) return;
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, pId: string) => {
    const prod = productMap.get(pId);
    const updated = [...selectedItems];
    updated[index].productId = pId;
    if (prod) {
      updated[index].unitPrice = prod.sellingPrice;
    }
    setSelectedItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const res = createSalesOrder({
      customerId,
      warehouseId,
      items: selectedItems,
      notes,
    });

    if (res.success) {
      router.push('/sales');
    } else {
      setErrorMsg(res.error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      <div className="p-5 bg-white rounded-2xl border border-[#E5E9EB] shadow-subtle flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-navy">Generate Client Sales Order</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Create an outbound customer order. Available stock is validated in real-time.
          </p>
        </div>
        <Link href="/sales" className="text-xs text-teal hover:underline font-semibold">
          &larr; Back to Orders
        </Link>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs text-danger bg-danger/10 border border-danger/20 rounded-xl">
          {errorMsg}
        </div>
      )}

      {insufficientStockItems.length > 0 && (
        <div className="p-3.5 text-xs text-warning bg-warning/10 border border-warning/20 rounded-xl flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-warning" />
          <span>
            <strong>Attention:</strong> One or more selected item quantities exceed physically available stock on hand.
            Stock confirmation will fail unless inventory is replenished or quantity is adjusted.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        <div className="p-6 bg-white rounded-2xl border border-[#E5E9EB] shadow-subtle space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
            1. Client & Fulfillment Location
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Select Client / Customer *</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-mint/40 border border-[#E5E9EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal text-navy font-medium"
                required
              >
                {state.customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company})
                  </option>
                ))}
              </select>
              {selectedCustomer && (
                <div className="mt-2 p-2.5 bg-mint/50 rounded-xl border border-[#D5ECE7] text-[11px] text-text-secondary space-y-0.5">
                  <p className="font-semibold text-navy">{selectedCustomer.name} &bull; {selectedCustomer.company}</p>
                  <p>GSTIN: <span className="font-mono">{selectedCustomer.gstin}</span></p>
                  <p>Delivery: {selectedCustomer.address}, {selectedCustomer.city}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Dispatching Warehouse *</label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-mint/40 border border-[#E5E9EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal text-navy font-medium"
                required
              >
                {state.warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.city})
                  </option>
                ))}
              </select>
              {selectedWarehouse && (
                <div className="mt-2 p-2.5 bg-mint/50 rounded-xl border border-[#D5ECE7] text-[11px] text-text-secondary space-y-0.5">
                  <p className="font-semibold text-navy">{selectedWarehouse.name} [{selectedWarehouse.code}]</p>
                  <p>Facility: {selectedWarehouse.address}, {selectedWarehouse.city}</p>
                  <p>Storage Capacity: {selectedWarehouse.currentUtilization}% utilized</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-[#E5E9EB] shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E9EB]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
              2. Product Selection & Order Items
            </h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 text-xs font-bold text-teal hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Product Line
            </button>
          </div>

          <div className="space-y-3">
            {selectedItems.map((item, index) => {
              const prod = productMap.get(item.productId);
              const available = prod ? prod.currentStock : 0;
              const hasInsufficient = prod && item.quantity > available;

              return (
                <div
                  key={index}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-center gap-3 transition-colors ${hasInsufficient ? 'bg-danger/5 border-danger/30' : 'bg-mint/40 border-[#E5E9EB]'
                    }`}
                >
                  <div className="flex-1 w-full">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-text-secondary font-semibold">Product SKU</label>
                      <span className={`text-[10px] font-bold ${hasInsufficient ? 'text-danger' : 'text-teal'}`}>
                        In Stock: {available} {prod?.unit || 'units'}
                      </span>
                    </div>
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductChange(index, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E5E9EB] rounded-lg text-navy font-medium"
                    >
                      {state.products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) &bull; ₹{p.sellingPrice}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full sm:w-20">
                    <label className="block text-[10px] text-text-secondary font-semibold mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...selectedItems];
                        updated[index].quantity = parseInt(e.target.value, 10) || 1;
                        setSelectedItems(updated);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E5E9EB] rounded-lg text-navy font-bold"
                    />
                  </div>

                  <div className="w-full sm:w-24">
                    <label className="block text-[10px] text-text-secondary font-semibold mb-1">Rate (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const updated = [...selectedItems];
                        updated[index].unitPrice = parseFloat(e.target.value) || 0;
                        setSelectedItems(updated);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E5E9EB] rounded-lg text-navy"
                    />
                  </div>

                  <div className="w-full sm:w-20">
                    <label className="block text-[10px] text-text-secondary font-semibold mb-1">Disc %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discount}
                      onChange={(e) => {
                        const updated = [...selectedItems];
                        updated[index].discount = parseFloat(e.target.value) || 0;
                        setSelectedItems(updated);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E5E9EB] rounded-lg text-navy"
                    />
                  </div>

                  <div className="w-full sm:w-20">
                    <label className="block text-[10px] text-text-secondary font-semibold mb-1">GST %</label>
                    <input
                      type="number"
                      min="0"
                      value={item.tax}
                      onChange={(e) => {
                        const updated = [...selectedItems];
                        updated[index].tax = parseFloat(e.target.value) || 0;
                        setSelectedItems(updated);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E5E9EB] rounded-lg text-navy"
                    />
                  </div>

                  <div className="sm:self-end mb-1">
                    <button
                      type="button"
                      disabled={selectedItems.length <= 1}
                      onClick={() => handleRemoveItem(index)}
                      className="p-1.5 text-text-secondary hover:text-danger disabled:opacity-30 rounded-lg hover:bg-mint"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 bg-navy text-white rounded-2xl shadow-panel flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-300 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-turquoise">
              Invoice Calculation Breakdown
            </span>
            <p>
              Total Line Items: <strong className="text-white">{selectedItems.length}</strong> &bull; Total Units: <strong className="text-white">{liveTotals.totalUnits}</strong>
            </p>
            <p>
              Taxable Subtotal: <strong className="text-white">{formatCurrency(liveTotals.subtotal)}</strong> &bull; Discounts: <strong className="text-white">{formatCurrency(liveTotals.totalDiscount)}</strong> &bull; GST (18%): <strong className="text-white">{formatCurrency(liveTotals.taxAmount)}</strong>
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-gray-400 uppercase font-semibold">Total Order Valuation</span>
            <p className="text-2xl font-black text-turquoise">{formatCurrency(liveTotals.grandTotal)}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-navy mb-1">Procurement & Delivery Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Client PO reference, special freight terms, dispatch contact..."
            className="w-full px-3 py-2 text-xs bg-mint/40 border border-[#E5E9EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal text-navy"
          />
        </div>

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E5E9EB]">
          <Link
            href="/sales"
            className="px-4 py-2 text-xs font-semibold text-text-secondary bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={!canCreate}
            className="px-5 py-2 text-xs font-semibold text-navy bg-turquoise hover:bg-turquoise-dark font-bold rounded-lg transition-colors shadow-2xs disabled:opacity-50"
          >
            Create Sales Order
          </button>
        </div>
      </form>
    </div>
  );
}

export function SalesDetailView({ id }: { id: string }) {
  const { state, confirmSalesOrder, cancelSalesOrder } = useApp();
  const { currentRole, hasPermission } = useRole();
  const [feedback, setFeedback] = useState<string | null>(null);

  const order = state.salesOrders.find((s) => s.id === id) || state.salesOrders[0];
  const customer = state.customers.find((c) => c.id === order.customerId);
  const warehouse = state.warehouses.find((w) => w.id === order.warehouseId);

  const canConfirm = hasPermission('sales:confirm');
  const canAuthorizeReversals = hasPermission('transactions:authorize_reversals');

  const isPending = order.status === 'PENDING' || order.status === 'DRAFT';
  const isConfirmed = order.status === 'CONFIRMED' || (order.status as string) === 'SHIPPED';
  const isCancelled = order.status === 'CANCELLED';

  const handleConfirm = () => {
    setFeedback(null);
    const res = confirmSalesOrder(order.id);
    if (res.success) {
      setFeedback('Order confirmed! Stock successfully deducted from warehouse.');
    } else {
      setFeedback(res.error);
    }
  };

  const handleCancel = () => {
    setFeedback(null);
    const res = cancelSalesOrder(order.id);
    if (res.success) {
      setFeedback(res.message || 'Order cancelled.');
    } else {
      setFeedback(res.error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-[#E5E9EB] shadow-subtle print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-navy">{order.orderNumber}</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isConfirmed
                ? 'bg-pale-cyan text-teal border border-turquoise/30'
                : isCancelled
                  ? 'bg-danger/10 text-danger border border-danger/20'
                  : 'bg-mint text-navy border border-[#D5ECE7]'
                }`}
            >
              {order.status}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Order Date: {formatDate(order.orderDate)} &bull; Created By: {order.createdByName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-text-secondary bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Tax Invoice
          </button>

          {isPending && canConfirm && (
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-navy bg-turquoise hover:bg-turquoise-dark rounded-lg transition-colors shadow-2xs"
            >
              <CheckCircle className="w-4 h-4" />
              Confirm & Deduct Stock
            </button>
          )}

          {!isCancelled && (canAuthorizeReversals || (isPending && currentRole !== 'EMPLOYEE')) && (
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-danger bg-danger/10 hover:bg-danger/20 border border-danger/20 rounded-lg transition-colors"
            >
              <Ban className="w-4 h-4" />
              {isConfirmed ? 'Authorize Stock Reversal' : 'Cancel Order'}
            </button>
          )}

          <Link
            href="/sales"
            className="px-3 py-2 text-xs font-semibold text-text-secondary hover:underline"
          >
            &larr; Back
          </Link>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 text-xs bg-pale-cyan/60 text-navy border border-turquoise/30 rounded-xl print:hidden">
          {feedback}
        </div>
      )}

      <div className="p-8 bg-white rounded-2xl border border-[#E5E9EB] shadow-subtle space-y-6 print:border-none print:shadow-none print:p-0">

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#E5E9EB]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight text-navy">SasthaSoft</span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-mint text-teal border border-[#D5ECE7]">
                Tax Invoice
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-1">StockFlow Enterprise Inventory Pvt Ltd</p>
            <p className="text-xs text-text-secondary">GSTIN: 29AABCU9603R1ZM &bull; Bangalore, KA, India</p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Invoice Number</span>
            <h2 className="text-xl font-black text-navy mt-0.5">{order.orderNumber}</h2>
            <p className="text-xs text-text-secondary mt-1">Invoice Date: {formatDate(order.orderDate)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="p-4 rounded-xl border border-[#E5E9EB] bg-mint/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block mb-1.5">
              Billed To (Customer)
            </span>
            <p className="font-bold text-navy text-sm">{order.customerName}</p>
            {customer && (
              <div className="mt-2 space-y-0.5 text-text-secondary">
                <p>Company: {customer.company}</p>
                <p>Address: {customer.address}, {customer.city}</p>
                <p>GSTIN: <span className="font-mono">{customer.gstin}</span></p>
                <p>Phone: {customer.phone}</p>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-[#E5E9EB] bg-mint/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block mb-1.5">
              Dispatched From Facility
            </span>
            <p className="font-bold text-navy text-sm">{order.warehouseName}</p>
            {warehouse && (
              <div className="mt-2 space-y-0.5 text-text-secondary">
                <p>Facility Code: <span className="font-mono">{warehouse.code}</span></p>
                <p>Location: {warehouse.location}</p>
                <p>Address: {warehouse.address}, {warehouse.city}</p>
                <p>Status: {warehouse.status}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-navy">Fulfillment Line Items</h3>
          <div className="overflow-x-auto border border-[#E5E9EB] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-mint/40 border-b border-[#E5E9EB] text-text-secondary font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Discount</th>
                  <th className="py-2.5 px-3 text-right">GST %</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E9EB]">
                {order.items.map((item) => (
                  <tr key={item.id} className="hover:bg-mint/10">
                    <td className="py-3 px-3">
                      <p className="font-semibold text-navy">{item.productName}</p>
                      <p className="text-[10px] text-text-secondary font-mono">SKU: {item.sku}</p>
                    </td>
                    <td className="py-3 px-3 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3 px-3 text-center font-bold text-navy">{item.quantity}</td>
                    <td className="py-3 px-3 text-right text-text-secondary">{item.discount}%</td>
                    <td className="py-3 px-3 text-right text-text-secondary">{item.tax}%</td>
                    <td className="py-3 px-3 text-right font-bold text-navy">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <div className="w-full sm:w-72 p-5 bg-navy text-white rounded-2xl shadow-panel space-y-2 text-xs">
            <div className="flex justify-between text-gray-300">
              <span>Taxable Subtotal:</span>
              <span className="font-semibold text-white">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Applicable GST:</span>
              <span className="font-semibold text-white">{formatCurrency(order.taxAmount)}</span>
            </div>
            <div className="pt-2 border-t border-navy-light flex justify-between text-sm font-black text-white">
              <span>Grand Total:</span>
              <span className="text-turquoise">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="p-3 bg-mint/50 rounded-xl border border-[#D5ECE7] text-xs">
            <span className="font-semibold text-navy block mb-0.5">Order Notes:</span>
            <p className="text-text-secondary">{order.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

