'use client';

import React, { useState, useMemo } from 'react';
import {
  Download,
  Search,
  Filter,
  ArrowUpDown,
  Package,
  ShoppingCart,
  Truck,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  Building2,
} from 'lucide-react';
import { useApp } from '@/context/AppProvider';
import {
  calculateInventoryValuation,
  calculateRetailInventoryValuation,
  calculateTotalSales,
  calculateTotalPurchases,
  calculateGrossProfit,
  isDateInRange,
  DateFilterPreset,
  DateRangeFilter,
} from '@/domain/analytics-engine';
import { formatCurrency, formatNumber, formatDate } from '@/lib/formatters';
import { downloadCsv } from '@/lib/csv-export';

type ReportTab = 'STOCK' | 'SALES' | 'PURCHASES' | 'PROFIT';

export function ReportsOverview() {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<ReportTab>('STOCK');

  const [searchTerm, setSearchTerm] = useState('');
  const [datePreset, setDatePreset] = useState<DateFilterPreset>('ALL');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [sortField, setSortField] = useState<string>('default');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const dateFilter: DateRangeFilter = useMemo(
    () => ({
      preset: datePreset,
      startDate: customStart || undefined,
      endDate: customEnd || undefined,
    }),
    [datePreset, customStart, customEnd]
  );

  const warehouseMap = useMemo(() => {
    const map = new Map<string, string>();
    state.warehouses.forEach((w) => map.set(w.id, `${w.name} (${w.city})`));
    return map;
  }, [state.warehouses]);

  const totalCostValuation = calculateInventoryValuation(state.products);
  const totalRetailValuation = calculateRetailInventoryValuation(state.products);
  const salesSummary = calculateTotalSales(state.salesOrders, dateFilter);
  const purchaseSummary = calculateTotalPurchases(state.purchaseOrders, dateFilter);
  const profitSummary = calculateGrossProfit(state.salesOrders, state.products, dateFilter);

  const stockRows = useMemo(() => {
    return state.products
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
        const matchesWarehouse = warehouseFilter === 'ALL' || p.warehouseId === warehouseFilter;

        let status = 'IN_STOCK';
        if (p.currentStock === 0) status = 'OUT_OF_STOCK';
        else if (p.currentStock <= p.minStockLevel) status = 'LOW_STOCK';
        const matchesStatus = statusFilter === 'ALL' || status === statusFilter;

        return matchesSearch && matchesCategory && matchesWarehouse && matchesStatus;
      })
      .map((p) => {
        const warehouseName = warehouseMap.get(p.warehouseId) || 'Main Facility';
        const totalValue = p.currentStock * p.costPrice;
        let status = 'IN_STOCK';
        if (p.currentStock === 0) status = 'OUT_OF_STOCK';
        else if (p.currentStock <= p.minStockLevel) status = 'LOW_STOCK';

        return {
          sku: p.sku,
          name: p.name,
          category: p.category,
          warehouse: warehouseName,
          availableQuantity: p.currentStock,
          unit: p.unit,
          minLevel: p.minStockLevel,
          costPrice: p.costPrice,
          sellingPrice: p.sellingPrice,
          inventoryValue: totalValue,
          status,
        };
      })
      .sort((a, b) => {
        if (sortField === 'sku') {
          return sortDirection === 'asc' ? a.sku.localeCompare(b.sku) : b.sku.localeCompare(a.sku);
        }
        if (sortField === 'name') {
          return sortDirection === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        }
        if (sortField === 'quantity') {
          return sortDirection === 'asc' ? a.availableQuantity - b.availableQuantity : b.availableQuantity - a.availableQuantity;
        }
        if (sortField === 'value') {
          return sortDirection === 'asc' ? a.inventoryValue - b.inventoryValue : b.inventoryValue - a.inventoryValue;
        }
        return 0;
      });
  }, [state.products, searchTerm, categoryFilter, warehouseFilter, statusFilter, warehouseMap, sortField, sortDirection]);

  const salesRows = useMemo(() => {
    return state.salesOrders
      .filter((o) => {
        const dateToCheck = o.confirmedDate || o.orderDate || o.createdAt;
        const inDate = isDateInRange(dateToCheck, dateFilter);
        const matchesSearch =
          o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.createdByName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
        return inDate && matchesSearch && matchesStatus;
      })
      .map((o) => {
        const totalUnits = o.items.reduce((sum, item) => sum + item.quantity, 0);
        return {
          orderNumber: o.orderNumber,
          customer: o.customerName,
          employee: o.createdByName,
          date: o.orderDate || o.createdAt,
          totalUnits,
          itemCount: o.items.length,
          subtotal: o.subtotal,
          taxAmount: o.taxAmount,
          totalAmount: o.totalAmount,
          status: o.status,
          paymentStatus: o.paymentStatus,
        };
      })
      .sort((a, b) => {
        if (sortField === 'orderNumber') {
          return sortDirection === 'asc' ? a.orderNumber.localeCompare(b.orderNumber) : b.orderNumber.localeCompare(a.orderNumber);
        }
        if (sortField === 'date') {
          return sortDirection === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
        }
        if (sortField === 'total') {
          return sortDirection === 'asc' ? a.totalAmount - b.totalAmount : b.totalAmount - a.totalAmount;
        }
        return 0;
      });
  }, [state.salesOrders, dateFilter, searchTerm, statusFilter, sortField, sortDirection]);

  const purchaseRows = useMemo(() => {
    return state.purchaseOrders
      .filter((p) => {
        const dateToCheck = p.receivedDate || p.orderDate || p.createdAt;
        const inDate = isDateInRange(dateToCheck, dateFilter);
        const matchesSearch =
          p.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.createdByName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
        return inDate && matchesSearch && matchesStatus;
      })
      .map((p) => {
        const totalUnits = p.items.reduce((sum, item) => sum + item.quantity, 0);
        return {
          orderNumber: p.orderNumber,
          supplier: p.supplierName,
          employee: p.createdByName,
          warehouse: p.warehouseName,
          date: p.orderDate || p.createdAt,
          totalUnits,
          itemCount: p.items.length,
          subtotal: p.subtotal,
          taxAmount: p.taxAmount,
          totalAmount: p.totalAmount,
          status: p.status,
        };
      })
      .sort((a, b) => {
        if (sortField === 'orderNumber') {
          return sortDirection === 'asc' ? a.orderNumber.localeCompare(b.orderNumber) : b.orderNumber.localeCompare(a.orderNumber);
        }
        if (sortField === 'date') {
          return sortDirection === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
        }
        if (sortField === 'total') {
          return sortDirection === 'asc' ? a.totalAmount - b.totalAmount : b.totalAmount - a.totalAmount;
        }
        return 0;
      });
  }, [state.purchaseOrders, dateFilter, searchTerm, statusFilter, sortField, sortDirection]);

  const profitRows = useMemo(() => {

    const prodMap = new Map(state.products.map((p) => [p.id, p]));

    const confirmedOrders = state.salesOrders.filter((o) => {
      const isConfirmed = o.status === 'CONFIRMED' || o.status === 'SHIPPED' || o.status === 'DELIVERED';
      const notCancelled = o.status !== 'CANCELLED';
      if (!isConfirmed || !notCancelled) return false;
      const dateToCheck = o.confirmedDate || o.orderDate || o.createdAt;
      return isDateInRange(dateToCheck, dateFilter);
    });

    const productStats = new Map<
      string,
      { productId: string; name: string; sku: string; category: string; unitsSold: number; revenue: number; cogs: number }
    >();

    confirmedOrders.forEach((o) => {
      o.items.forEach((item) => {
        const prod = prodMap.get(item.productId);
        const costPrice = prod ? prod.costPrice : 0;
        const current = productStats.get(item.productId) || {
          productId: item.productId,
          name: item.productName,
          sku: item.sku,
          category: prod ? prod.category : 'General',
          unitsSold: 0,
          revenue: 0,
          cogs: 0,
        };

        current.unitsSold += item.quantity;
        current.revenue += item.subtotal;
        current.cogs += item.quantity * costPrice;
        productStats.set(item.productId, current);
      });
    });

    return Array.from(productStats.values())
      .filter((item) => {
        const matchesSearch =
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
      })
      .map((item) => {
        const grossProfit = item.revenue - item.cogs;
        const marginPct = item.revenue > 0 ? (grossProfit / item.revenue) * 100 : 0;
        return {
          ...item,
          grossProfit,
          marginPct,
        };
      })
      .sort((a, b) => {
        if (sortField === 'name') {
          return sortDirection === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        }
        if (sortField === 'units') {
          return sortDirection === 'asc' ? a.unitsSold - b.unitsSold : b.unitsSold - a.unitsSold;
        }
        if (sortField === 'revenue') {
          return sortDirection === 'asc' ? a.revenue - b.revenue : b.revenue - a.revenue;
        }
        if (sortField === 'cogs') {
          return sortDirection === 'asc' ? a.cogs - b.cogs : b.cogs - a.cogs;
        }
        if (sortField === 'profit' || sortField === 'default') {
          return sortDirection === 'asc' ? a.grossProfit - b.grossProfit : b.grossProfit - a.grossProfit;
        }
        if (sortField === 'margin') {
          return sortDirection === 'asc' ? a.marginPct - b.marginPct : b.marginPct - a.marginPct;
        }
        return 0;
      });
  }, [state.products, state.salesOrders, dateFilter, searchTerm, categoryFilter, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExportCsv = () => {
    const timestamp = new Date().toISOString().slice(0, 10);

    if (activeTab === 'STOCK') {
      const headers = [
        'SKU',
        'Product Name',
        'Category',
        'Warehouse',
        'Available Stock',
        'Unit',
        'Min Stock Level',
        'Cost Price (INR)',
        'Selling Price (INR)',
        'Inventory Value (INR)',
        'Status',
      ];
      const rows = stockRows.map((r) => [
        r.sku,
        r.name,
        r.category,
        r.warehouse,
        r.availableQuantity,
        r.unit,
        r.minLevel,
        r.costPrice,
        r.sellingPrice,
        r.inventoryValue,
        r.status,
      ]);
      downloadCsv(`stockflow-stock-report-${timestamp}`, headers, rows);
    } else if (activeTab === 'SALES') {
      const headers = [
        'Sales Order #',
        'Customer',
        'Created By',
        'Date',
        'Line Items',
        'Total Quantity',
        'Subtotal (INR)',
        'GST Tax (INR)',
        'Total Amount (INR)',
        'Order Status',
        'Payment Status',
      ];
      const rows = salesRows.map((r) => [
        r.orderNumber,
        r.customer,
        r.employee,
        formatDate(r.date),
        r.itemCount,
        r.totalUnits,
        r.subtotal,
        r.taxAmount,
        r.totalAmount,
        r.status,
        r.paymentStatus,
      ]);
      downloadCsv(`stockflow-sales-report-${timestamp}`, headers, rows);
    } else if (activeTab === 'PURCHASES') {
      const headers = [
        'Purchase Order #',
        'Supplier',
        'Created By',
        'Destination Warehouse',
        'Date',
        'Line Items',
        'Total Quantity',
        'Subtotal (INR)',
        'GST Tax (INR)',
        'Total Spend (INR)',
        'Receiving Status',
      ];
      const rows = purchaseRows.map((r) => [
        r.orderNumber,
        r.supplier,
        r.employee,
        r.warehouse,
        formatDate(r.date),
        r.itemCount,
        r.totalUnits,
        r.subtotal,
        r.taxAmount,
        r.totalAmount,
        r.status,
      ]);
      downloadCsv(`stockflow-purchase-report-${timestamp}`, headers, rows);
    } else if (activeTab === 'PROFIT') {
      const headers = [
        'Product Name',
        'SKU',
        'Category',
        'Units Sold',
        'Revenue (INR)',
        'Cost of Goods Sold (INR)',
        'Gross Profit (INR)',
        'Gross Margin %',
      ];
      const rows = profitRows.map((r) => [
        r.name,
        r.sku,
        r.category,
        r.unitsSold,
        r.revenue,
        r.cogs,
        r.grossProfit,
        r.marginPct.toFixed(2) + '%',
      ]);
      downloadCsv(`stockflow-profit-margins-report-${timestamp}`, headers, rows);
    }
  };

  const categories = Array.from(new Set(state.products.map((p) => p.category)));

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-xl border border-border shadow-subtle">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-navy tracking-tight">Reports & Analytics Engine</h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-mint text-teal border border-teal/20">
              Management Access
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Audit-ready stock valuation, sales order fulfillment, gross margins, and supplier purchasing journals.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal hover:bg-teal-hover rounded-lg shadow-subtle transition-colors"
        >
          <Download className="w-4 h-4" />
          Export to CSV
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="p-5 bg-turquoise rounded-xl border border-turquoise-dark/20 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-navy/70 uppercase tracking-wider">
                Total Asset Valuation
              </span>
              <Package className="w-4 h-4 text-navy/60" />
            </div>
            <p className="text-2xl font-bold text-navy mt-2 tracking-tight">
              {formatCurrency(totalCostValuation)}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-navy/10 flex items-center justify-between text-xs text-navy/80">
            <span>Retail Valuation</span>
            <span className="font-semibold">{formatCurrency(totalRetailValuation)}</span>
          </div>
        </div>

        <div className="p-5 bg-mint rounded-xl border border-border shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                Confirmed Sales Revenue
              </span>
              <ShoppingCart className="w-4 h-4 text-teal" />
            </div>
            <p className="text-2xl font-bold text-teal mt-2 tracking-tight">
              {formatCurrency(salesSummary.totalRevenue)}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs">
            <span className="text-text-secondary">Completed Volume</span>
            <span className="font-semibold text-teal">{salesSummary.orderCount} orders</span>
          </div>
        </div>

        <div className="p-5 bg-navy text-white rounded-xl border border-navy-light shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">
                Procurement Spend
              </span>
              <Truck className="w-4 h-4 text-pale-cyan" />
            </div>
            <p className="text-2xl font-bold text-white mt-2 tracking-tight">
              {formatCurrency(purchaseSummary.totalSpend)}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-pale-cyan/80">
            <span>Inbound Receipts</span>
            <span className="font-semibold text-white">{purchaseSummary.orderCount} POs</span>
          </div>
        </div>

        <div className="p-5 bg-mint rounded-xl border border-border shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                Gross Profit & Margins
              </span>
              <TrendingUp className="w-4 h-4 text-teal" />
            </div>
            <p className="text-2xl font-bold text-teal mt-2 tracking-tight">
              {formatCurrency(profitSummary.grossProfit)}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs">
            <span className="text-text-secondary">Operating Margin</span>
            <span className="font-bold text-teal">
              {profitSummary.marginPercentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-subtle overflow-hidden">

        <div className="flex border-b border-border bg-mint/30 p-2 gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('STOCK');
              setSortField('default');
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'STOCK'
                ? 'bg-navy text-white shadow-subtle'
                : 'text-text-secondary hover:text-navy hover:bg-white/60'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Stock Report ({stockRows.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('SALES');
              setSortField('default');
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'SALES'
                ? 'bg-navy text-white shadow-subtle'
                : 'text-text-secondary hover:text-navy hover:bg-white/60'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Sales Report ({salesRows.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('PURCHASES');
              setSortField('default');
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'PURCHASES'
                ? 'bg-navy text-white shadow-subtle'
                : 'text-text-secondary hover:text-navy hover:bg-white/60'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Purchase Report ({purchaseRows.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('PROFIT');
              setSortField('default');
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'PROFIT'
                ? 'bg-navy text-white shadow-subtle'
                : 'text-text-secondary hover:text-navy hover:bg-white/60'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Gross Margins ({profitRows.length})
          </button>
        </div>

        <div className="p-4 border-b border-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-secondary" />
            <input
              type="text"
              placeholder={`Search ${activeTab.toLowerCase()} by identifier, name, or counterparty...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-mint/40 border border-border rounded-lg text-text-primary placeholder:text-text-secondary/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">

            {activeTab !== 'STOCK' && (
              <div className="flex items-center gap-1.5 bg-mint/40 p-1 rounded-lg border border-border">
                <Calendar className="w-3.5 h-3.5 text-text-secondary ml-1.5" />
                <select
                  value={datePreset}
                  onChange={(e) => setDatePreset(e.target.value as DateFilterPreset)}
                  className="text-xs bg-transparent border-0 text-text-primary font-medium focus:ring-0 py-0.5"
                >
                  <option value="ALL">All Time</option>
                  <option value="TODAY">Today</option>
                  <option value="LAST_7_DAYS">Last 7 Days</option>
                  <option value="LAST_30_DAYS">Last 30 Days</option>
                  <option value="LAST_90_DAYS">Last 90 Days</option>
                  <option value="CUSTOM">Custom Range</option>
                </select>

                {datePreset === 'CUSTOM' && (
                  <div className="flex items-center gap-1 pl-1">
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="text-[10px] px-1 py-0.5 border border-border rounded bg-white text-text-primary"
                    />
                    <span className="text-[10px] text-text-secondary">-</span>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="text-[10px] px-1 py-0.5 border border-border rounded bg-white text-text-primary"
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'STOCK' && (
              <div className="flex items-center gap-1.5 bg-mint/40 p-1 rounded-lg border border-border">
                <Building2 className="w-3.5 h-3.5 text-text-secondary ml-1.5" />
                <select
                  value={warehouseFilter}
                  onChange={(e) => setWarehouseFilter(e.target.value)}
                  className="text-xs bg-transparent border-0 text-text-primary font-medium focus:ring-0 py-0.5"
                >
                  <option value="ALL">All Warehouses</option>
                  {state.warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.city})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(activeTab === 'STOCK' || activeTab === 'PROFIT') && (
              <div className="flex items-center gap-1.5 bg-mint/40 p-1 rounded-lg border border-border">
                <Filter className="w-3.5 h-3.5 text-text-secondary ml-1.5" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="text-xs bg-transparent border-0 text-text-primary font-medium focus:ring-0 py-0.5"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === 'STOCK' ? (
              <div className="flex items-center gap-1.5 bg-mint/40 p-1 rounded-lg border border-border">
                <Filter className="w-3.5 h-3.5 text-text-secondary ml-1.5" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs bg-transparent border-0 text-text-primary font-medium focus:ring-0 py-0.5"
                >
                  <option value="ALL">All Stock Statuses</option>
                  <option value="IN_STOCK">IN STOCK</option>
                  <option value="LOW_STOCK">LOW STOCK</option>
                  <option value="OUT_OF_STOCK">OUT OF STOCK</option>
                </select>
              </div>
            ) : activeTab !== 'PROFIT' ? (
              <div className="flex items-center gap-1.5 bg-mint/40 p-1 rounded-lg border border-border">
                <Filter className="w-3.5 h-3.5 text-text-secondary ml-1.5" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs bg-transparent border-0 text-text-primary font-medium focus:ring-0 py-0.5"
                >
                  <option value="ALL">All Statuses</option>
                  {activeTab === 'SALES' ? (
                    <>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PENDING">PENDING</option>
                      <option value="DRAFT">DRAFT</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </>
                  ) : (
                    <>
                      <option value="RECEIVED">RECEIVED</option>
                      <option value="PENDING">PENDING</option>
                      <option value="DRAFT">DRAFT</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </>
                  )}
                </select>
              </div>
            ) : null}
          </div>
        </div>

        {activeTab === 'STOCK' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-mint/30 text-text-secondary font-semibold">
                  <th className="py-3 px-4 cursor-pointer hover:text-navy" onClick={() => handleSort('sku')}>
                    <span className="flex items-center gap-1">SKU <ArrowUpDown className="w-3 h-3 text-text-secondary" /></span>
                  </th>
                  <th className="py-3 px-4 cursor-pointer hover:text-navy" onClick={() => handleSort('name')}>
                    <span className="flex items-center gap-1">Product Name <ArrowUpDown className="w-3 h-3 text-text-secondary" /></span>
                  </th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Warehouse</th>
                  <th className="py-3 px-4 cursor-pointer hover:text-navy text-right" onClick={() => handleSort('quantity')}>
                    <span className="flex items-center justify-end gap-1">Available Qty <ArrowUpDown className="w-3 h-3 text-text-secondary" /></span>
                  </th>
                  <th className="py-3 px-4 text-right">Min Level</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 cursor-pointer hover:text-navy text-right" onClick={() => handleSort('value')}>
                    <span className="flex items-center justify-end gap-1">Asset Value <ArrowUpDown className="w-3 h-3 text-text-secondary" /></span>
                  </th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stockRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-text-secondary text-xs">
                      No matching products found.
                    </td>
                  </tr>
                ) : (
                  stockRows.map((row) => (
                    <tr key={row.sku} className="hover:bg-mint/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-text-primary">{row.sku}</td>
                      <td className="py-3 px-4 font-semibold text-navy">{row.name}</td>
                      <td className="py-3 px-4 text-text-secondary">{row.category}</td>
                      <td className="py-3 px-4 text-text-secondary">{row.warehouse}</td>
                      <td className="py-3 px-4 text-right font-bold text-navy">
                        {formatNumber(row.availableQuantity)} {row.unit}
                      </td>
                      <td className="py-3 px-4 text-right text-text-secondary">{row.minLevel}</td>
                      <td className="py-3 px-4 text-right font-medium text-text-primary">{formatCurrency(row.costPrice)}</td>
                      <td className="py-3 px-4 text-right font-medium text-text-primary">{formatCurrency(row.sellingPrice)}</td>
                      <td className="py-3 px-4 text-right font-bold text-teal">{formatCurrency(row.inventoryValue)}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            row.status === 'IN_STOCK'
                              ? 'bg-mint text-teal border border-teal/20'
                              : row.status === 'LOW_STOCK'
                              ? 'bg-amber-50 text-warning border border-warning/20'
                              : 'bg-rose-50 text-danger border border-danger/20'
                          }`}
                        >
                          {row.status === 'IN_STOCK' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : row.status === 'LOW_STOCK' ? (
                            <AlertTriangle className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {row.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'SALES' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-mint/30 text-text-secondary font-semibold">
                  <th className="py-3 px-4 cursor-pointer hover:text-navy" onClick={() => handleSort('orderNumber')}>
                    <span className="flex items-center gap-1">Order # <ArrowUpDown className="w-3 h-3 text-text-secondary" /></span>
                  </th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Sales Rep</th>
                  <th className="py-3 px-4 cursor-pointer hover:text-navy" onClick={() => handleSort('date')}>
                    <span className="flex items-center gap-1">Date <ArrowUpDown className="w-3 h-3 text-text-secondary" /></span>
                  </th>
                  <th className="py-3 px-4 text-right">Items / Units</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">GST</th>
                  <th className="py-3 px-4 cursor-pointer hover:text-navy text-right" onClick={() => handleSort('total')}>
                    <span className="flex items-center justify-end gap-1">Total <ArrowUpDown className="w-3 h-3 text-text-secondary" /></span>
                  </th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {salesRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-text-secondary text-xs">
                      No matching sales orders found for selected filters.
                    </td>
                  </tr>
                ) : (
                  salesRows.map((row) => (
                    <tr key={row.orderNumber} className="hover:bg-mint/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-navy">{row.orderNumber}</td>
                      <td className="py-3 px-4 font-semibold text-text-primary">{row.customer}</td>
                      <td className="py-3 px-4 text-text-secondary">{row.employee}</td>
                      <td className="py-3 px-4 text-text-secondary">{formatDate(row.date)}</td>
                      <td className="py-3 px-4 text-right font-medium text-text-primary">
                        {row.itemCount} lines ({row.totalUnits} units)
                      </td>
                      <td className="py-3 px-4 text-right text-text-secondary">{formatCurrency(row.subtotal)}</td>
                      <td className="py-3 px-4 text-right text-text-secondary">{formatCurrency(row.taxAmount)}</td>
                      <td className="py-3 px-4 text-right font-bold text-teal">{formatCurrency(row.totalAmount)}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            row.status === 'CONFIRMED' || row.status === 'SHIPPED'
                              ? 'bg-mint text-teal border border-teal/20'
                              : row.status === 'PENDING'
                              ? 'bg-amber-50 text-warning border border-warning/20'
                              : row.status === 'CANCELLED'
                              ? 'bg-rose-50 text-danger border border-danger/20'
                              : 'bg-pale-cyan text-navy border border-pale-cyan-dark/20'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'PURCHASES' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-mint/30 text-text-secondary font-semibold">
                  <th className="py-3 px-4 cursor-pointer hover:text-navy" onClick={() => handleSort('orderNumber')}>
                    <span className="flex items-center gap-1">PO # <ArrowUpDown className="w-3 h-3 text-text-secondary" /></span>
                  </th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Created By</th>
                  <th className="py-3 px-4">Destination Warehouse</th>
                  <th className="py-3 px-4 cursor-pointer hover:text-navy" onClick={() => handleSort('date')}>
                    <span className="flex items-center gap-1">Date <ArrowUpDown className="w-3 h-3 text-text-secondary" /></span>
                  </th>
                  <th className="py-3 px-4 text-right">Items / Units</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">GST</th>
                  <th className="py-3 px-4 cursor-pointer hover:text-navy text-right" onClick={() => handleSort('total')}>
                    <span className="flex items-center justify-end gap-1">Total Spend <ArrowUpDown className="w-3 h-3 text-text-secondary" /></span>
                  </th>
                  <th className="py-3 px-4 text-center">Receiving Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {purchaseRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-text-secondary text-xs">
                      No matching purchase orders found for selected filters.
                    </td>
                  </tr>
                ) : (
                  purchaseRows.map((row) => (
                    <tr key={row.orderNumber} className="hover:bg-mint/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-navy">{row.orderNumber}</td>
                      <td className="py-3 px-4 font-semibold text-text-primary">{row.supplier}</td>
                      <td className="py-3 px-4 text-text-secondary">{row.employee}</td>
                      <td className="py-3 px-4 text-text-secondary">{row.warehouse}</td>
                      <td className="py-3 px-4 text-text-secondary">{formatDate(row.date)}</td>
                      <td className="py-3 px-4 text-right font-medium text-text-primary">
                        {row.itemCount} lines ({row.totalUnits} units)
                      </td>
                      <td className="py-3 px-4 text-right text-text-secondary">{formatCurrency(row.subtotal)}</td>
                      <td className="py-3 px-4 text-right text-text-secondary">{formatCurrency(row.taxAmount)}</td>
                      <td className="py-3 px-4 text-right font-bold text-navy">{formatCurrency(row.totalAmount)}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            row.status === 'RECEIVED'
                              ? 'bg-mint text-teal border border-teal/20'
                              : row.status === 'PENDING'
                              ? 'bg-amber-50 text-warning border border-warning/20'
                              : row.status === 'CANCELLED'
                              ? 'bg-rose-50 text-danger border border-danger/20'
                              : 'bg-pale-cyan text-navy border border-pale-cyan-dark/20'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'PROFIT' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-mint/30 text-text-secondary font-semibold">
                  <th className="py-3 px-4 cursor-pointer hover:text-navy" onClick={() => handleSort('name')}>
                    <span className="flex items-center gap-1">Product Description <ArrowUpDown className="w-3 h-3 text-text-secondary" /></span>
                  </th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 cursor-pointer hover:text-navy text-center" onClick={() => handleSort('units')}>
                    <span className="flex items-center justify-center gap-1">Units Sold <ArrowUpDown className="w-3 h-3 text-text-secondary" /></span>
                  </th>
                  <th className="py-3 px-4 cursor-pointer hover:text-navy text-right" onClick={() => handleSort('revenue')}>
                    <span className="flex items-center justify-end gap-1">Sales Revenue <ArrowUpDown className="w-3 h-3 text-text-secondary" /></span>
                  </th>
                  <th className="py-3 px-4 cursor-pointer hover:text-navy text-right" onClick={() => handleSort('cogs')}>
                    <span className="flex items-center justify-end gap-1">Cost of Goods (COGS) <ArrowUpDown className="w-3 h-3 text-text-secondary" /></span>
                  </th>
                  <th className="py-3 px-4 cursor-pointer hover:text-navy text-right" onClick={() => handleSort('profit')}>
                    <span className="flex items-center justify-end gap-1">Gross Profit <ArrowUpDown className="w-3 h-3 text-text-secondary" /></span>
                  </th>
                  <th className="py-3 px-4 cursor-pointer hover:text-navy text-center" onClick={() => handleSort('margin')}>
                    <span className="flex items-center justify-center gap-1">Margin % <ArrowUpDown className="w-3 h-3 text-text-secondary" /></span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {profitRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-text-secondary text-xs">
                      No confirmed sales revenue recorded for selected filters.
                    </td>
                  </tr>
                ) : (
                  profitRows.map((row) => (
                    <tr key={row.productId} className="hover:bg-mint/20 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-navy">{row.name}</p>
                        <p className="text-[10px] text-text-secondary font-mono">{row.sku}</p>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">{row.category}</td>
                      <td className="py-3 px-4 text-center font-bold text-navy">{formatNumber(row.unitsSold)}</td>
                      <td className="py-3 px-4 text-right font-medium text-text-primary">{formatCurrency(row.revenue)}</td>
                      <td className="py-3 px-4 text-right text-text-secondary">{formatCurrency(row.cogs)}</td>
                      <td className="py-3 px-4 text-right font-bold text-teal">{formatCurrency(row.grossProfit)}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            row.marginPct >= 30
                              ? 'bg-mint text-teal border border-teal/20'
                              : row.marginPct >= 15
                              ? 'bg-pale-cyan text-navy border border-pale-cyan-dark/20'
                              : 'bg-amber-50 text-warning border border-warning/20'
                          }`}
                        >
                          {row.marginPct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

