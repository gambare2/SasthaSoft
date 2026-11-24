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
  Truck,
  Search,
  ArrowUpDown,
  Filter,
  Printer,
  Calendar,
  Building2,
  ShieldCheck,
  Package,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { useApp, useRole } from '@/context/AppProvider';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
import { calculateItemTotal } from '@/domain/calculations';
import { isDateInRange, DateFilterPreset, DateRangeFilter } from '@/domain/analytics-engine';

export function PurchasesList() {
  const { state, receivePurchaseOrder, cancelPurchaseOrder } = useApp();
  const { currentRole, currentEmployee, hasPermission } = useRole();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [datePreset, setDatePreset] = useState<DateFilterPreset>('ALL');

  const [sortField, setSortField] = useState<'orderNumber' | 'supplier' | 'date' | 'total'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [actionMessage, setActionMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    type: 'RECEIVE' | 'CANCEL';
    orderId: string;
    orderNumber: string;
    isReceived: boolean;
  } | null>(null);

  const canCreate = hasPermission('purchases:create');
  const canReceive = hasPermission('purchases:receive');
  const canAuthorizeReversals = hasPermission('transactions:authorize_reversals');

  const dateFilter: DateRangeFilter = useMemo(() => ({ preset: datePreset }), [datePreset]);

  const scopedOrders = useMemo(() => {
    return currentRole === 'EMPLOYEE'
      ? state.purchaseOrders.filter((o) => o.createdBy === currentEmployee.id)
      : state.purchaseOrders;
  }, [state.purchaseOrders, currentRole, currentEmployee.id]);

  const displayedOrders = useMemo(() => {
    return scopedOrders
      .filter((po) => {
        const matchesSearch =
          po.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
          po.supplierName.toLowerCase().includes(search.toLowerCase()) ||
          po.createdByName.toLowerCase().includes(search.toLowerCase()) ||
          (po.notes && po.notes.toLowerCase().includes(search.toLowerCase()));

        const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;
        const matchesWarehouse = warehouseFilter === 'ALL' || po.warehouseId === warehouseFilter;
        const inDate = isDateInRange(po.receivedDate || po.orderDate || po.createdAt, dateFilter);

        return matchesSearch && matchesStatus && matchesWarehouse && inDate;
      })
      .sort((a, b) => {
        if (sortField === 'orderNumber') {
          return sortDirection === 'asc' ? a.orderNumber.localeCompare(b.orderNumber) : b.orderNumber.localeCompare(a.orderNumber);
        }
        if (sortField === 'supplier') {
          return sortDirection === 'asc' ? a.supplierName.localeCompare(b.supplierName) : b.supplierName.localeCompare(a.supplierName);
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
  }, [scopedOrders, search, statusFilter, warehouseFilter, dateFilter, sortField, sortDirection]);

  const handleSort = (field: 'orderNumber' | 'supplier' | 'date' | 'total') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleConfirmAction = () => {
    if (!confirmModal) return;
    setActionMessage(null);

    if (confirmModal.type === 'RECEIVE') {
      const res = receivePurchaseOrder(confirmModal.orderId);
      if (res.success) {
        setActionMessage({
          text: res.message || `Purchase order ${confirmModal.orderNumber} received. Stock added to inventory.`,
          isError: false,
        });
      } else {
        setActionMessage({ text: res.error, isError: true });
      }
    } else if (confirmModal.type === 'CANCEL') {
      const res = cancelPurchaseOrder(confirmModal.orderId);
      if (res.success) {
        setActionMessage({
          text: res.message || `Purchase order ${confirmModal.orderNumber} cancelled and stock reversed.`,
          isError: false,
        });
      } else {
        setActionMessage({ text: res.error, isError: true });
      }
    }

    setConfirmModal(null);
  };

  const stats = useMemo(() => {
    const totalCount = displayedOrders.length;
    const received = displayedOrders.filter((o) => o.status === 'RECEIVED');
    const receivedValue = received.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const pending = displayedOrders.filter((o) => o.status === 'PENDING' || o.status === 'DRAFT');
    const pendingValue = pending.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const cancelledCount = displayedOrders.filter((o) => o.status === 'CANCELLED').length;

    return { totalCount, receivedCount: received.length, receivedValue, pendingCount: pending.length, pendingValue, cancelledCount };
  }, [displayedOrders]);

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-[#E5E9EB] shadow-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-navy">Purchase Orders & Inbound Intake</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-mint text-teal border border-[#D5ECE7]">
              {displayedOrders.length} Orders
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            {currentRole === 'EMPLOYEE'
              ? 'Showing personal inbound procurement tasks initiated by your account.'
              : 'Enterprise vendor purchase orders, expected delivery dates, receiving intake logs, and stock adjustments.'}
          </p>
        </div>

        {canCreate && (
          <Link
            href="/purchases/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal hover:bg-teal-hover rounded-lg transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            Create Purchase Order
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="p-5 rounded-2xl bg-turquoise text-navy shadow-subtle border border-turquoise-dark/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-navy/80">
              Inbound Received Value
            </span>
            <div className="p-1.5 rounded-lg bg-white/40 text-navy">
              <Truck className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black tracking-tight text-navy">
              {formatCurrency(stats.receivedValue)}
            </p>
            <p className="text-[11px] text-navy/80 font-medium mt-1">
              {stats.receivedCount} received deliveries in warehouse
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-mint text-navy shadow-subtle border border-[#D5ECE7] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Total Purchase Orders
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
              In current ledger view
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-navy text-white shadow-panel flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-300">
              Awaiting Delivery
            </span>
            <div className="p-1.5 rounded-lg bg-navy-light text-turquoise">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black tracking-tight text-turquoise">
              {stats.pendingCount} Pending POs
            </p>
            <p className="text-[11px] text-gray-300 font-medium mt-1">
              Expected value: {formatCurrency(stats.pendingValue)}
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
              Inbound stock reversed
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
            className="text-xs font-bold hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="p-4 bg-white rounded-2xl border border-[#E5E9EB] shadow-subtle space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search PO #, supplier, employee..."
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
              <option value="PENDING">Pending Delivery</option>
              <option value="RECEIVED">Received & In Stock</option>
              <option value="CANCELLED">Cancelled / Reversed</option>
            </select>
          </div>

          <div className="relative">
            <Building2 className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-secondary" />
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-mint/40 border border-[#E5E9EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal text-navy font-medium"
            >
              <option value="ALL">All Destination Hubs</option>
              {state.warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.city})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-mint/40 px-2.5 py-1.5 rounded-lg border border-[#E5E9EB]">
            <Calendar className="w-3.5 h-3.5 text-teal shrink-0" />
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
                    <span>PO #</span>
                    <ArrowUpDown className="w-3 h-3 text-text-secondary" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-navy" onClick={() => handleSort('supplier')}>
                  <div className="flex items-center gap-1.5">
                    <span>Supplier</span>
                    <ArrowUpDown className="w-3 h-3 text-text-secondary" />
                  </div>
                </th>
                <th className="py-3 px-4">Destination Warehouse</th>
                <th className="py-3 px-4 cursor-pointer hover:text-navy" onClick={() => handleSort('date')}>
                  <div className="flex items-center gap-1.5">
                    <span>Order Date</span>
                    <ArrowUpDown className="w-3 h-3 text-text-secondary" />
                  </div>
                </th>
                <th className="py-3 px-4">Expected Delivery</th>
                <th className="py-3 px-4 cursor-pointer hover:text-navy text-right" onClick={() => handleSort('total')}>
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Total Amount</span>
                    <ArrowUpDown className="w-3 h-3 text-text-secondary" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Receiving Status</th>
                <th className="py-3 px-4">Issued By</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E9EB]">
              {displayedOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-text-secondary">
                    <p className="font-semibold text-navy">No purchase orders found</p>
                    <p className="text-[11px] text-text-secondary mt-1">Try relaxing your search terms or filters.</p>
                  </td>
                </tr>
              ) : (
                displayedOrders.map((po) => {
                  const isPending = po.status === 'PENDING' || (po.status as string) === 'ORDERED' || po.status === 'DRAFT';
                  const isReceived = po.status === 'RECEIVED';
                  const isCancelled = po.status === 'CANCELLED';
                  const isOverdue = isPending && po.expectedDeliveryDate && new Date(po.expectedDeliveryDate) < new Date();

                  return (
                    <tr key={po.id} className="hover:bg-mint/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-navy">
                        <Link href={`/purchases/${po.id}`} className="hover:text-teal hover:underline">
                          {po.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-semibold text-navy">{po.supplierName}</td>
                      <td className="py-3 px-4 text-text-secondary">{po.warehouseName}</td>
                      <td className="py-3 px-4 text-text-secondary">{formatDate(po.orderDate)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={isOverdue ? 'text-warning font-semibold' : 'text-text-secondary'}>
                            {formatDate(po.expectedDeliveryDate)}
                          </span>
                          {isOverdue && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-warning/10 text-warning border border-warning/20">
                              Overdue
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-navy text-right">{formatCurrency(po.totalAmount)}</td>
                      <td className="py-3 px-4 text-center">

                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${isReceived
                            ? 'bg-mint text-teal border border-[#D5ECE7]'
                            : isCancelled
                              ? 'bg-danger/10 text-danger border border-danger/20'
                              : 'bg-pale-cyan text-navy border border-turquoise/30'
                            }`}
                        >
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">{po.createdByName}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && canReceive && (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmModal({
                                  type: 'RECEIVE',
                                  orderId: po.id,
                                  orderNumber: po.orderNumber,
                                  isReceived: false,
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-teal hover:bg-teal-hover rounded-lg transition-colors shadow-2xs font-bold"
                              title="Receive stock intake into destination warehouse"
                            >
                              <Truck className="w-3 h-3" />
                              Receive
                            </button>
                          )}

                          {!isCancelled && (canAuthorizeReversals || (isPending && currentRole !== 'EMPLOYEE')) && (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmModal({
                                  type: 'CANCEL',
                                  orderId: po.id,
                                  orderNumber: po.orderNumber,
                                  isReceived,
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-danger bg-danger/10 hover:bg-danger/20 rounded-lg border border-danger/20 transition-colors"
                              title={isReceived ? 'Cancel received PO and reverse stock intake' : 'Cancel purchase order'}
                            >
                              <Ban className="w-3 h-3" />
                              Cancel
                            </button>
                          )}

                          <Link
                            href={`/purchases/${po.id}`}
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

      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E5E9EB] p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl shrink-0 ${confirmModal.type === 'RECEIVE' ? 'bg-mint text-teal border border-[#D5ECE7]' : 'bg-danger/10 text-danger border border-danger/20'
                  }`}
              >
                {confirmModal.type === 'RECEIVE' ? <Truck className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-navy">
                  {confirmModal.type === 'RECEIVE'
                    ? `Receive Inbound Stock for ${confirmModal.orderNumber}`
                    : `Cancel Purchase Order ${confirmModal.orderNumber}`}
                </h3>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  {confirmModal.type === 'RECEIVE'
                    ? 'Receiving this order will immediately increment product stock quantities in the destination warehouse and record stock intake movement logs.'
                    : confirmModal.isReceived
                      ? 'WARNING: This purchase order has already been received. Cancelling will trigger an authorized reverse stock deduction to restore prior inventory balances.'
                      : 'Are you sure you want to cancel this pending purchase order?'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E9EB]">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-text-secondary hover:bg-gray-100 rounded-lg"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg shadow-2xs ${confirmModal.type === 'RECEIVE'
                  ? 'bg-teal hover:bg-teal-hover'
                  : 'bg-danger hover:bg-danger/90'
                  }`}
              >
                {confirmModal.type === 'RECEIVE' ? 'Confirm Inbound Intake' : 'Authorize Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PurchasesCreateForm() {
  const router = useRouter();
  const { state, createPurchaseOrder } = useApp();
  const { hasPermission } = useRole();
  const canCreate = hasPermission('purchases:create');

  const [supplierId, setSupplierId] = useState(state.suppliers[0]?.id || '');
  const [warehouseId, setWarehouseId] = useState(state.warehouses[0]?.id || '');
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<
    { productId: string; quantity: number; unitPrice: number; discount: number; tax: number }[]
  >([
    {
      productId: state.products[0]?.id || '',
      quantity: 10,
      unitPrice: state.products[0]?.costPrice || 5000,
      discount: 0,
      tax: 18,
    },
  ]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedSupplier = state.suppliers.find((s) => s.id === supplierId);
  const selectedWarehouse = state.warehouses.find((w) => w.id === warehouseId);

  const handleAddItem = () => {
    const defaultProd = state.products[0];
    setSelectedItems([
      ...selectedItems,
      {
        productId: defaultProd?.id || '',
        quantity: 5,
        unitPrice: defaultProd?.costPrice || 5000,
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
    const prod = state.products.find((p) => p.id === pId);
    const updated = [...selectedItems];
    updated[index].productId = pId;
    if (prod) {
      updated[index].unitPrice = prod.costPrice;
    }
    setSelectedItems(updated);
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    let taxAmount = 0;
    let totalUnits = 0;

    selectedItems.forEach((item) => {
      const calc = calculateItemTotal(item.quantity, item.unitPrice, 0, item.tax);
      subtotal += calc.taxableAmount;
      taxAmount += calc.taxAmount;
      totalUnits += item.quantity;
    });

    const grandTotal = subtotal + taxAmount;
    return { subtotal, taxAmount, grandTotal, totalUnits };
  }, [selectedItems]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const res = createPurchaseOrder({
      supplierId,
      warehouseId,
      expectedDeliveryDate: expectedDate,
      items: selectedItems,
      notes,
    });

    if (res.success) {
      router.push('/purchases');
    } else {
      setErrorMsg(res.error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      <div className="flex items-center justify-between p-5 bg-white rounded-2xl border border-[#E5E9EB] shadow-subtle">
        <div>
          <h1 className="text-lg font-bold text-navy">Issue Inbound Purchase Order</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Procure stock from an authorized vendor. Inventory updates upon receiving intake.
          </p>
        </div>
        <Link href="/purchases" className="text-xs text-teal hover:underline font-semibold">
          &larr; Back to Purchases
        </Link>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs text-danger bg-danger/10 border border-danger/20 rounded-xl">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        <div className="p-6 bg-white rounded-2xl border border-[#E5E9EB] shadow-subtle space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-navy">1. Procurement Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Select Supplier *</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-mint/40 border border-[#E5E9EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal text-navy font-medium"
                required
              >
                {state.suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.city})
                  </option>
                ))}
              </select>
              {selectedSupplier && (
                <div className="mt-2 p-2.5 rounded-xl bg-mint/50 border border-[#D5ECE7] text-[11px] text-text-secondary space-y-0.5">
                  <p className="font-semibold text-navy">{selectedSupplier.name}</p>
                  <p>Contact: {selectedSupplier.contactPerson} ({selectedSupplier.phone})</p>
                  <p>GSTIN: <span className="font-mono">{selectedSupplier.gstin}</span></p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Destination Warehouse *</label>
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
                <div className="mt-2 p-2.5 rounded-xl bg-mint/50 border border-[#D5ECE7] text-[11px] text-text-secondary space-y-0.5">
                  <p className="font-semibold text-navy">{selectedWarehouse.name} [{selectedWarehouse.code}]</p>
                  <p>{selectedWarehouse.address}, {selectedWarehouse.city}</p>
                  <p>Capacity Utilization: {selectedWarehouse.currentUtilization}%</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Expected Delivery Date *</label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-mint/40 border border-[#E5E9EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal text-navy font-semibold"
                required
              />
              <p className="text-[10px] text-text-secondary mt-1">Vendor estimated delivery date for receiving logs</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-[#E5E9EB] shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E9EB]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-navy">2. Purchase Order Items</h2>
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
              const lineCalc = calculateItemTotal(item.quantity, item.unitPrice, 0, item.tax);

              return (
                <div
                  key={index}
                  className="p-3.5 bg-mint/40 rounded-xl border border-[#E5E9EB] flex flex-col sm:flex-row items-center gap-3"
                >
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] text-text-secondary font-semibold mb-1">Product</label>
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductChange(index, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E5E9EB] rounded-lg font-medium text-navy"
                    >
                      {state.products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) &bull; Cost: ₹{p.costPrice}
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

                  <div className="w-full sm:w-28">
                    <label className="block text-[10px] text-text-secondary font-semibold mb-1">Cost (₹)</label>
                    <input
                      type="number"
                      min="1"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const updated = [...selectedItems];
                        updated[index].unitPrice = parseFloat(e.target.value) || 0;
                        setSelectedItems(updated);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E5E9EB] rounded-lg text-navy"
                    />
                  </div>

                  <div className="w-full sm:w-24">
                    <label className="block text-[10px] text-text-secondary font-semibold mb-1">GST %</label>
                    <select
                      value={item.tax}
                      onChange={(e) => {
                        const updated = [...selectedItems];
                        updated[index].tax = parseFloat(e.target.value) || 0;
                        setSelectedItems(updated);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E5E9EB] rounded-lg text-navy font-medium"
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </div>

                  <div className="w-full sm:w-28 text-right">
                    <label className="block text-[10px] text-text-secondary font-semibold mb-1">Line Total</label>
                    <div className="text-xs font-bold text-navy py-1.5">
                      {formatCurrency(lineCalc.total)}
                    </div>
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
              Procurement Spend Summary
            </span>
            <p>
              Product Lines: <strong className="text-white">{selectedItems.length}</strong> &bull; Total Units: <strong className="text-white">{totals.totalUnits}</strong>
            </p>
            <p>
              Net Subtotal: <strong className="text-white">{formatCurrency(totals.subtotal)}</strong> &bull; GST Tax: <strong className="text-white">{formatCurrency(totals.taxAmount)}</strong>
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-gray-400 uppercase font-semibold">Total PO Valuation</span>
            <p className="text-2xl font-black text-turquoise">{formatCurrency(totals.grandTotal)}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-navy mb-1">Procurement Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special freight terms, vendor instructions, receiving bay requirements..."
            className="w-full px-3 py-2 text-xs bg-mint/40 border border-[#E5E9EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal text-navy"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E9EB]">
          <Link
            href="/purchases"
            className="px-4 py-2 text-xs font-semibold text-text-secondary bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!canCreate}
            className="px-5 py-2 text-xs font-semibold text-white bg-teal hover:bg-teal-hover font-bold rounded-lg transition-colors shadow-2xs disabled:opacity-50"
          >
            Issue Purchase Order
          </button>
        </div>
      </form>
    </div>
  );
}

export function PurchasesDetailView({ id }: { id: string }) {
  const { state, receivePurchaseOrder, cancelPurchaseOrder } = useApp();
  const { currentRole, hasPermission } = useRole();
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  const po = state.purchaseOrders.find((p) => p.id === id) || state.purchaseOrders[0];

  const canReceive = hasPermission('purchases:receive');
  const canAuthorizeReversals = hasPermission('transactions:authorize_reversals');

  const isPending = po.status === 'PENDING' || (po.status as string) === 'ORDERED' || po.status === 'DRAFT';
  const isReceived = po.status === 'RECEIVED';
  const isCancelled = po.status === 'CANCELLED';

  const supplier = state.suppliers.find((s) => s.id === po.supplierId);
  const warehouse = state.warehouses.find((w) => w.id === po.warehouseId);

  const movements = useMemo(() => {
    return state.stockMovements.filter(
      (m) => m.referenceId === po.id || m.referenceId === po.orderNumber
    );
  }, [state.stockMovements, po.id, po.orderNumber]);

  const handleReceive = () => {
    setFeedback(null);
    const res = receivePurchaseOrder(po.id);
    if (res.success) {
      setFeedback({ text: res.message || 'Purchase order received! Stock added to inventory.', isError: false });
    } else {
      setFeedback({ text: res.error, isError: true });
    }
  };

  const handleCancel = () => {
    setFeedback(null);
    const res = cancelPurchaseOrder(po.id);
    if (res.success) {
      setFeedback({ text: res.message || 'Purchase order cancelled and stock reversed.', isError: false });
    } else {
      setFeedback({ text: res.error, isError: true });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-[#E5E9EB] shadow-subtle print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-navy">{po.orderNumber}</h1>

            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isReceived
                ? 'bg-mint text-teal border border-[#D5ECE7]'
                : isCancelled
                  ? 'bg-danger/10 text-danger border border-danger/20'
                  : 'bg-pale-cyan text-navy border border-turquoise/30'
                }`}
            >
              {po.status}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Order Date: {formatDate(po.orderDate)} &bull; Issued By: {po.createdByName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-text-secondary bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print PO
          </button>

          {isPending && canReceive && (
            <button
              type="button"
              onClick={handleReceive}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal hover:bg-teal-hover rounded-lg transition-colors shadow-2xs"
            >
              <Truck className="w-4 h-4" />
              Receive Stock Intake
            </button>
          )}

          {!isCancelled && (canAuthorizeReversals || (isPending && currentRole !== 'EMPLOYEE')) && (
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-danger bg-danger/10 hover:bg-danger/20 border border-danger/20 rounded-lg transition-colors"
            >
              <Ban className="w-4 h-4" />
              {isReceived ? 'Authorize Reversal' : 'Cancel PO'}
            </button>
          )}

          <Link
            href="/purchases"
            className="px-3 py-2 text-xs font-semibold text-text-secondary hover:underline"
          >
            &larr; Back
          </Link>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 text-xs rounded-xl flex items-center justify-between print:hidden ${feedback.isError
            ? 'bg-danger/10 text-danger border border-danger/20'
            : 'bg-mint text-teal border border-[#D5ECE7]'
            }`}
        >
          <div className="flex items-center gap-2">
            {feedback.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
            <span className="font-semibold">{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="p-8 bg-white rounded-2xl border border-[#E5E9EB] shadow-subtle space-y-6 print:shadow-none print:border-none print:p-0">

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#E5E9EB]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight text-navy">SasthaSoft</span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-mint text-teal border border-[#D5ECE7]">
                Procurement
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-1">StockFlow Supply Chain & Inventory Operations</p>
            <p className="text-xs text-text-secondary">Corporate HQ &bull; Bangalore, KA, India</p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Official Purchase Order</span>
            <h2 className="text-xl font-black text-navy mt-0.5">{po.orderNumber}</h2>
            <div className="inline-block mt-1">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isReceived
                  ? 'bg-mint text-teal border border-[#D5ECE7]'
                  : isCancelled
                    ? 'bg-danger/10 text-danger border border-danger/20'
                    : 'bg-pale-cyan text-navy border border-turquoise/30'
                  }`}
              >
                {po.status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-mint/30 rounded-xl border border-[#E5E9EB] text-xs">
          <div>
            <span className="text-text-secondary block font-semibold text-[10px] uppercase">Order Date</span>
            <strong className="text-navy mt-0.5 block">{formatDate(po.orderDate)}</strong>
          </div>
          <div>
            <span className="text-text-secondary block font-semibold text-[10px] uppercase">Expected Delivery</span>
            <strong className="text-navy mt-0.5 block">{formatDate(po.expectedDeliveryDate)}</strong>
          </div>
          <div>
            <span className="text-text-secondary block font-semibold text-[10px] uppercase">Issued By</span>
            <strong className="text-navy mt-0.5 block">{po.createdByName}</strong>
          </div>
          <div>
            <span className="text-text-secondary block font-semibold text-[10px] uppercase">Delivery Warehouse</span>
            <strong className="text-navy mt-0.5 block">{po.warehouseName}</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="p-4 rounded-xl border border-[#E5E9EB] bg-mint/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block mb-1.5">
              Supplier / Vendor
            </span>
            <p className="font-bold text-navy text-sm">{po.supplierName}</p>
            {supplier && (
              <div className="mt-2 space-y-0.5 text-text-secondary">
                <p>Contact: {supplier.contactPerson}</p>
                <p>Phone: {supplier.phone}</p>
                <p>Email: {supplier.email}</p>
                <p>Address: {supplier.address}, {supplier.city}</p>
                <p>GSTIN: <span className="font-mono">{supplier.gstin}</span></p>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-[#E5E9EB] bg-mint/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block mb-1.5">
              Delivery Destination
            </span>
            <p className="font-bold text-navy text-sm">{po.warehouseName}</p>
            {warehouse && (
              <div className="mt-2 space-y-0.5 text-text-secondary">
                <p>Code: <span className="font-mono">{warehouse.code}</span></p>
                <p>Location: {warehouse.location}</p>
                <p>Address: {warehouse.address}, {warehouse.city}</p>
                <p>Storage Status: {warehouse.currentUtilization}% utilized</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-bold text-navy uppercase tracking-wider">Inbound Line Items</h3>
          <div className="overflow-x-auto border border-[#E5E9EB] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-mint/40 border-b border-[#E5E9EB] text-text-secondary font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-right">Cost Price</th>
                  <th className="py-2.5 px-3 text-center">Ordered Qty</th>
                  <th className="py-2.5 px-3 text-right">GST %</th>
                  <th className="py-2.5 px-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E9EB]">
                {po.items.map((item) => (
                  <tr key={item.id} className="hover:bg-mint/10">
                    <td className="py-3 px-3">
                      <p className="font-semibold text-navy">{item.productName}</p>
                      <p className="text-[10px] text-text-secondary font-mono">SKU: {item.sku}</p>
                    </td>
                    <td className="py-3 px-3 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3 px-3 text-center font-bold text-navy">{item.quantity}</td>
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
              <span>Subtotal:</span>
              <span className="font-semibold text-white">{formatCurrency(po.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>GST Tax Amount:</span>
              <span className="font-semibold text-white">{formatCurrency(po.taxAmount)}</span>
            </div>
            <div className="pt-2 border-t border-navy-light flex justify-between text-sm font-black text-white">
              <span>Grand Total:</span>
              <span className="text-turquoise">{formatCurrency(po.totalAmount)}</span>
            </div>
          </div>
        </div>

        {po.notes && (
          <div className="p-3 bg-mint/50 rounded-xl border border-[#D5ECE7] text-xs">
            <span className="font-semibold text-navy block mb-0.5">Procurement Notes:</span>
            <p className="text-text-secondary">{po.notes}</p>
          </div>
        )}

        {movements.length > 0 && (
          <div className="pt-6 border-t border-[#E5E9EB] space-y-3 print:hidden">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
                Inventory Movement Audit Trail
              </h3>
            </div>
            <div className="overflow-x-auto border border-[#E5E9EB] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-mint/40 text-text-secondary font-semibold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Qty Change</th>
                    <th className="py-2.5 px-3 text-center">Stock Before &rarr; After</th>
                    <th className="py-2.5 px-3">Performed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E9EB]">
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-mint/10">
                      <td className="py-2.5 px-3 text-text-secondary">{formatDateTime(m.createdAt)}</td>
                      <td className="py-2.5 px-3 font-semibold text-navy">{m.productName}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${m.type === 'PURCHASE'
                            ? 'bg-mint text-teal border border-[#D5ECE7]'
                            : 'bg-danger/10 text-danger border border-danger/20'
                            }`}
                        >
                          {m.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-teal text-right">+{m.quantity}</td>
                      <td className="py-2.5 px-3 text-text-secondary text-center font-mono">
                        {m.previousQuantity} &rarr; <strong className="text-navy">{m.newQuantity}</strong>
                      </td>
                      <td className="py-2.5 px-3 text-text-secondary">
                        {state.employees.find((e) => e.id === m.performedBy)?.name || m.performedBy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

