'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Truck,
  AlertTriangle,
  Calendar,
  PieChart as PieIcon,
  Warehouse as WarehouseIcon,
  Users,
  Layers,
  ArrowUpRight,
  Activity,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useApp } from '@/context/AppProvider';
import {
  calculateInventoryValuation,
  calculateRetailInventoryValuation,
  calculateTotalSales,
  calculateTotalPurchases,
  calculateGrossProfit,
  calculateLowStockProducts,
  calculateOutOfStockProducts,
  calculateSalesAndPurchaseTrends,
  calculateCategoryDistribution,
  calculateEmployeePerformance,
  calculateWarehouseDistribution,
  calculateStockMovementTrends,
  isDateInRange,
  DateFilterPreset,
  DateRangeFilter,
} from '@/domain/analytics-engine';
import { formatCurrency, formatNumber, formatRelativeTime, formatDate } from '@/lib/formatters';

const NEXUS_PALETTE = ['#55C5D2', '#11877E', '#D7F1F2', '#202F3F', '#9CD9D4', '#79D2DC'];

export function AdminDashboard() {
  const { state } = useApp();

  const [mounted, setMounted] = useState(false);
  const [datePreset, setDatePreset] = useState<DateFilterPreset>('ALL');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [trxTab, setTrxTab] = useState<'sales' | 'purchases'>('sales');
  const [chartView, setChartView] = useState<'financial' | 'movements'>('financial');

  useEffect(() => {
    setMounted(true);
  }, []);

  const dateFilter: DateRangeFilter = useMemo(
    () => ({
      preset: datePreset,
      startDate: customStart || undefined,
      endDate: customEnd || undefined,
    }),
    [datePreset, customStart, customEnd]
  );

  const inventoryCostValuation = calculateInventoryValuation(state.products);
  const inventoryRetailValuation = calculateRetailInventoryValuation(state.products);
  const salesSummary = calculateTotalSales(state.salesOrders, dateFilter);
  const purchaseSummary = calculateTotalPurchases(state.purchaseOrders, dateFilter);
  const profitSummary = calculateGrossProfit(state.salesOrders, state.products, dateFilter);

  const lowStockProducts = calculateLowStockProducts(state.products);
  const outOfStockProducts = calculateOutOfStockProducts(state.products);

  const salesVsPurchasesTrend = calculateSalesAndPurchaseTrends(
    state.salesOrders,
    state.purchaseOrders,
    dateFilter
  );

  const stockThroughputTrend = calculateStockMovementTrends(state.stockMovements, dateFilter);

  const categoryDistribution = calculateCategoryDistribution(state.products);
  const warehouseDistribution = calculateWarehouseDistribution(state.products, state.warehouses);
  const employeePerformance = calculateEmployeePerformance(
    state.salesOrders,
    state.purchaseOrders,
    state.employees,
    dateFilter
  );

  const recentSales = useMemo(() => {
    return state.salesOrders
      .filter((o) => isDateInRange(o.confirmedDate || o.orderDate || o.createdAt, dateFilter))
      .slice(0, 5);
  }, [state.salesOrders, dateFilter]);

  const recentPurchases = useMemo(() => {
    return state.purchaseOrders
      .filter((p) => isDateInRange(p.receivedDate || p.orderDate || p.createdAt, dateFilter))
      .slice(0, 5);
  }, [state.purchaseOrders, dateFilter]);

  const recentActivities = useMemo(() => {
    return state.activityLogs
      .filter((l) => isDateInRange(l.timestamp, dateFilter))
      .slice(0, 5);
  }, [state.activityLogs, dateFilter]);

  return (
    <div className="space-y-6">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-[#E5E9EB] shadow-subtle">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary font-medium">Enterprise Visibility & Control</span>
          </div>
          <h2 className="text-xl font-bold text-navy mt-1">
            Executive Operations & Analytics
          </h2>
          <p className="text-xs text-text-secondary">
            Real-time business performance across all regional hubs, transactions, and employee operations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-mint/50 p-1.5 rounded-xl border border-[#D5ECE7]">
          <Calendar className="w-3.5 h-3.5 text-teal ml-1" />
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value as DateFilterPreset)}
            className="text-xs bg-transparent border-0 text-navy font-bold focus:ring-0 py-1 cursor-pointer"
          >
            <option value="ALL">All Time</option>
            <option value="TODAY">Today</option>
            <option value="LAST_7_DAYS">Last 7 Days</option>
            <option value="LAST_30_DAYS">Last 30 Days</option>
            <option value="LAST_90_DAYS">Last 90 Days</option>
            <option value="CUSTOM">Custom Range</option>
          </select>

          {datePreset === 'CUSTOM' && (
            <div className="flex items-center gap-1 pl-1 text-xs">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="text-[11px] px-1.5 py-0.5 border border-[#E5E9EB] rounded-lg bg-white"
              />
              <span className="text-text-secondary">-</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="text-[11px] px-1.5 py-0.5 border border-[#E5E9EB] rounded-lg bg-white"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="p-5 rounded-2xl bg-turquoise text-navy shadow-subtle border border-turquoise-dark/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-navy/80">
              Total Asset Valuation
            </span>
            <div className="p-1.5 rounded-lg bg-white/40 text-navy">
              <Layers className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black tracking-tight text-navy">
              {formatCurrency(inventoryCostValuation)}
            </p>
            <p className="text-[11px] text-navy/80 font-medium mt-1">
              Retail: {formatCurrency(inventoryRetailValuation)} &bull; {state.products.length} SKUs
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-mint text-navy shadow-subtle border border-[#D5ECE7] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Confirmed Sales
            </span>
            <div className="p-1.5 rounded-lg bg-pale-cyan text-teal">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black tracking-tight text-teal">
              {formatCurrency(salesSummary.totalRevenue)}
            </p>
            <p className="text-[11px] text-text-secondary font-medium mt-1">
              {salesSummary.orderCount} fulfilled customer orders
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-navy text-white shadow-panel flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-300">
              Purchases Spend
            </span>
            <div className="p-1.5 rounded-lg bg-navy-light text-turquoise">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black tracking-tight text-turquoise">
              {formatCurrency(purchaseSummary.totalSpend)}
            </p>
            <p className="text-[11px] text-gray-300 font-medium mt-1">
              {purchaseSummary.orderCount} inbound orders received
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-mint text-navy shadow-subtle border border-[#D5ECE7] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Gross Profit & Margin
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-turquoise/30 text-teal border border-turquoise/50">
              {profitSummary.marginPercentage.toFixed(1)}% Margin
            </span>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black tracking-tight text-navy">
              {formatCurrency(profitSummary.grossProfit)}
            </p>
            <p className="text-[11px] text-text-secondary font-medium mt-1">
              Confirmed Sales minus COGS
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-[#E5E9EB] shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E9EB]">
            <div>
              <h3 className="text-sm font-bold text-navy">
                {chartView === 'financial' ? 'Financial Performance Trends' : 'Inventory Throughput Volume'}
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                {chartView === 'financial'
                  ? 'Confirmed customer sales revenue versus received supplier purchase orders.'
                  : 'Inbound intake stock vs outbound sales deliveries over time.'}
              </p>
            </div>

            <div className="flex items-center p-1 bg-mint rounded-lg border border-[#D5ECE7] text-xs">
              <button
                type="button"
                onClick={() => setChartView('financial')}
                className={`px-3 py-1 font-semibold rounded-md transition-all ${chartView === 'financial'
                  ? 'bg-white text-teal shadow-2xs'
                  : 'text-text-secondary hover:text-navy'
                  }`}
              >
                Financial
              </button>
              <button
                type="button"
                onClick={() => setChartView('movements')}
                className={`px-3 py-1 font-semibold rounded-md transition-all ${chartView === 'movements'
                  ? 'bg-white text-teal shadow-2xs'
                  : 'text-text-secondary hover:text-navy'
                  }`}
              >
                Throughput
              </button>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            {!mounted ? (
              <div className="h-full w-full rounded-xl bg-gray-50/60 border border-[#E5E9EB] flex items-center justify-center animate-pulse">
                <span className="text-xs text-text-secondary font-medium">Loading visualization...</span>
              </div>
            ) : chartView === 'financial' ? (
              salesVsPurchasesTrend.length === 0 ? (
                <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center bg-gray-50/40 rounded-xl border border-dashed border-[#E5E9EB]">
                  <div className="p-3 rounded-full bg-mint text-teal mb-2">
                    <TrendingUp className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <h4 className="text-xs font-bold text-navy">No Financial Activity In This Period</h4>
                  <p className="text-[11px] text-text-secondary max-w-xs mt-1">
                    No confirmed sales or received purchase orders exist for the selected time filter.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                  <BarChart data={salesVsPurchasesTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F3F4" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#737B83' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#737B83' }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#202F3F',
                        borderRadius: '10px',
                        border: 'none',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      }}
                      formatter={(val: unknown) => [formatCurrency(Number(val) || 0), '']}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                    <Bar dataKey="sales" name="Sales Revenue" fill="#55C5D2" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="purchases" name="Purchases Spend" fill="#11877E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )
            ) : (
              stockThroughputTrend.length === 0 ? (
                <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center bg-gray-50/40 rounded-xl border border-dashed border-[#E5E9EB]">
                  <div className="p-3 rounded-full bg-mint text-teal mb-2">
                    <Activity className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <h4 className="text-xs font-bold text-navy">No Inventory Movements In This Period</h4>
                  <p className="text-[11px] text-text-secondary max-w-xs mt-1">
                    No physical inbound receipts or outbound sales dispatches occurred in this range.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                  <AreaChart data={stockThroughputTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="adminThroughputCyanGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#55C5D2" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#55C5D2" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="adminThroughputTealGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#11877E" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#11877E" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F3F4" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#737B83' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#737B83' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#202F3F',
                        borderRadius: '10px',
                        border: 'none',
                        color: '#FFFFFF',
                        fontSize: '11px',
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="inbound" name="Inbound Intake (+)" stroke="#11877E" strokeWidth={2} fillOpacity={1} fill="url(#adminThroughputTealGrad)" />
                    <Area type="monotone" dataKey="outbound" name="Outbound Dispatch (-)" stroke="#55C5D2" strokeWidth={2} fillOpacity={1} fill="url(#adminThroughputCyanGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )
            )}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E5E9EB] shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E9EB]">
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-teal" />
                <h3 className="text-sm font-bold text-navy">Category Distribution</h3>
              </div>
              <span className="text-[10px] font-bold text-text-secondary bg-mint px-2 py-0.5 rounded-full">
                {categoryDistribution.length} Categories
              </span>
            </div>

            <div className="h-44 w-full mt-2">
              {!mounted ? (
                <div className="h-full w-full rounded-xl bg-gray-50/60 border border-[#E5E9EB] flex items-center justify-center animate-pulse">
                  <span className="text-xs text-text-secondary font-medium">Loading categories...</span>
                </div>
              ) : categoryDistribution.length === 0 ? (
                <div className="h-full w-full flex flex-col items-center justify-center p-4 text-center bg-gray-50/40 rounded-xl border border-dashed border-[#E5E9EB]">
                  <div className="p-2 rounded-full bg-mint text-teal mb-1.5">
                    <PieIcon className="w-4 h-4 stroke-[1.8]" />
                  </div>
                  <h4 className="text-xs font-bold text-navy">No Stock In Catalog</h4>
                  <p className="text-[11px] text-text-secondary mt-0.5 max-w-[200px]">
                    No categories have positive inventory valuation currently.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minHeight={140}>
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      dataKey="totalCostValue"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={NEXUS_PALETTE[index % NEXUS_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#202F3F',
                        borderRadius: '8px',
                        border: 'none',
                        color: '#FFFFFF',
                        fontSize: '11px',
                      }}
                      formatter={(val: unknown) => [formatCurrency(Number(val) || 0), 'Valuation']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-[#E5E9EB] text-xs">
            {categoryDistribution.length === 0 ? (
              <p className="text-[11px] text-text-secondary text-center py-2">No category valuation available</p>
            ) : (
              categoryDistribution.slice(0, 4).map((cat, idx) => (
                <div key={cat.category} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: NEXUS_PALETTE[idx % NEXUS_PALETTE.length] }}
                    />
                    <span className="font-medium text-navy truncate max-w-[120px]">{cat.category}</span>
                  </div>
                  <span className="font-bold text-text-primary">{formatCurrency(cat.totalCostValue)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="p-5 rounded-2xl bg-white border border-[#E5E9EB] shadow-subtle space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E9EB]">
            <div className="flex items-center gap-2">
              <WarehouseIcon className="w-4 h-4 text-teal" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy">Warehouse Capacity</h3>
            </div>
            <Link href="/warehouses" className="text-[10px] font-bold text-teal hover:underline">
              Manage &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {warehouseDistribution.map((wh) => (
              <div key={wh.warehouseId} className="space-y-1 text-xs">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-semibold text-navy">{wh.name}</span>
                  <span className="text-text-secondary font-medium">
                    {formatNumber(wh.productCount)} SKUs &bull; {wh.utilization}%
                  </span>
                </div>
                <div className="w-full bg-mint rounded-full h-2 overflow-hidden border border-[#D5ECE7]">
                  <div
                    className="bg-turquoise h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(wh.utilization, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E9EB] shadow-subtle space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E9EB]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy">Inventory Alerts</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-danger/10 text-danger">
              {lowStockProducts.length + outOfStockProducts.length} Attention
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {outOfStockProducts.length > 0 && (
              <div className="p-2.5 rounded-xl bg-danger/10 border border-danger/20 text-danger flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs">{outOfStockProducts.length} Out-of-Stock SKUs</p>
                  <p className="text-[10px] text-danger/80 mt-0.5">Critical zero stock inventory levels</p>
                </div>
                <Link href="/inventory" className="text-[10px] font-bold underline">
                  View
                </Link>
              </div>
            )}

            {lowStockProducts.slice(0, 3).map((p) => (
              <div key={p.id} className="p-2 rounded-xl bg-mint border border-[#D5ECE7] flex items-center justify-between">
                <div>
                  <p className="font-bold text-navy text-[11px] truncate max-w-[140px]">{p.name}</p>
                  <p className="text-[10px] text-text-secondary">SKU: {p.sku}</p>
                </div>
                <span className="text-[11px] font-bold text-warning">
                  {p.currentStock} / min {p.minStockLevel}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E9EB] shadow-subtle space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E9EB]">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy">Staff Throughput</h3>
            </div>
            <Link href="/employees" className="text-[10px] font-bold text-teal hover:underline">
              Directory &rarr;
            </Link>
          </div>

          <div className="space-y-2.5 text-xs">
            {employeePerformance.slice(0, 3).map((emp, index) => (
              <div key={emp.employeeId} className="flex items-center justify-between p-2 rounded-xl bg-mint/50 border border-[#E5E9EB]">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white text-navy flex items-center justify-center font-bold text-[10px] shadow-2xs border border-[#E5E9EB]">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-bold text-navy text-[11px] truncate max-w-[110px]">{emp.name}</p>
                    <p className="text-[10px] text-text-secondary">{emp.salesCount} orders</p>
                  </div>
                </div>
                <span className="font-bold text-teal text-[11px]">
                  {formatCurrency(emp.salesRevenue)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="p-5 rounded-2xl bg-white border border-[#E5E9EB] shadow-subtle space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E9EB]">
            <div className="flex items-center gap-1.5 p-1 bg-mint rounded-lg border border-[#D5ECE7] text-xs">
              <button
                type="button"
                onClick={() => setTrxTab('sales')}
                className={`px-3 py-1 font-semibold rounded-md transition-all ${trxTab === 'sales'
                  ? 'bg-white text-teal shadow-2xs'
                  : 'text-text-secondary hover:text-navy'
                  }`}
              >
                Recent Sales ({recentSales.length})
              </button>
              <button
                type="button"
                onClick={() => setTrxTab('purchases')}
                className={`px-3 py-1 font-semibold rounded-md transition-all ${trxTab === 'purchases'
                  ? 'bg-white text-teal shadow-2xs'
                  : 'text-text-secondary hover:text-navy'
                  }`}
              >
                Recent Purchases ({recentPurchases.length})
              </button>
            </div>

            <Link
              href={trxTab === 'sales' ? '/sales' : '/purchases'}
              className="text-[10px] font-bold text-teal hover:underline flex items-center gap-0.5"
            >
              Full Ledger <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-[#E5E9EB]">
            {trxTab === 'sales' ? (
              recentSales.length === 0 ? (
                <p className="text-xs text-text-secondary py-4 text-center">No sales orders found.</p>
              ) : (
                recentSales.map((so) => (
                  <div key={so.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-mint/30 rounded px-1.5 transition-colors">
                    <div>
                      <p className="font-bold text-navy">{so.orderNumber}</p>
                      <p className="text-[11px] text-text-secondary">{so.customerName} &bull; {formatDate(so.orderDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-navy">{formatCurrency(so.totalAmount)}</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-mint text-teal border border-[#D5ECE7]">
                        {so.status}
                      </span>
                    </div>
                  </div>
                ))
              )
            ) : recentPurchases.length === 0 ? (
              <p className="text-xs text-text-secondary py-4 text-center">No purchase orders found.</p>
            ) : (
              recentPurchases.map((po) => (
                <div key={po.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-mint/30 rounded px-1.5 transition-colors">
                  <div>
                    <p className="font-bold text-navy">{po.orderNumber}</p>
                    <p className="text-[11px] text-text-secondary">{po.supplierName} &bull; {formatDate(po.orderDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-teal">{formatCurrency(po.totalAmount)}</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-pale-cyan text-navy border border-turquoise/40">
                      {po.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E9EB] shadow-subtle space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E9EB]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy">Audit Trail Stream</h3>
            </div>
            <Link href="/activity" className="text-[10px] font-bold text-teal hover:underline flex items-center gap-0.5">
              All Activity <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-[#E5E9EB]">
            {recentActivities.map((act) => (
              <div key={act.id} className="py-2.5 flex items-start gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-turquoise mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-navy text-[11px] truncate">{act.action}</p>
                    <span className="text-[10px] text-text-secondary shrink-0">{formatRelativeTime(act.timestamp)}</span>
                  </div>
                  <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-1">{act.details}</p>
                  <span className="text-[10px] text-teal font-medium mt-0.5 block">{act.employeeName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

