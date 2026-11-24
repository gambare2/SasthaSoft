'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Truck,
  AlertTriangle,
  Activity,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { useApp } from '@/context/AppProvider';
import {
  calculateInventoryValuation,
  calculateTotalSales,
  calculateTotalPurchases,
  calculateGrossProfit,
  calculateLowStockProducts,
  calculateStockMovementTrends,
  calculateSalesAndPurchaseTrends,
  isDateInRange,
  DateFilterPreset,
  DateRangeFilter,
} from '@/domain/analytics-engine';
import { formatCurrency, formatRelativeTime, formatDate } from '@/lib/formatters';

export function ManagerDashboard() {
  const { state } = useApp();

  const [mounted, setMounted] = useState(false);
  const [datePreset, setDatePreset] = useState<DateFilterPreset>('ALL');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

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
  const salesSummary = calculateTotalSales(state.salesOrders, dateFilter);
  const purchaseSummary = calculateTotalPurchases(state.purchaseOrders, dateFilter);
  const profitSummary = calculateGrossProfit(state.salesOrders, state.products, dateFilter);

  const lowStockProducts = calculateLowStockProducts(state.products);
  const stockThroughputTrend = calculateStockMovementTrends(state.stockMovements, dateFilter);
  const salesPurchaseTrend = calculateSalesAndPurchaseTrends(
    state.salesOrders,
    state.purchaseOrders,
    dateFilter
  );

  const pendingPurchaseOrders = useMemo(() => {
    return state.purchaseOrders.filter((p) => p.status === 'PENDING' || p.status === 'DRAFT');
  }, [state.purchaseOrders]);

  const teamActivities = useMemo(() => {
    return state.activityLogs
      .filter((l) => l.module !== 'SYSTEM' && isDateInRange(l.timestamp, dateFilter))
      .slice(0, 6);
  }, [state.activityLogs, dateFilter]);

  return (
    <div className="space-y-6">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-[#E5E9EB] shadow-subtle">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-pale-cyan text-navy border border-turquoise">
              Manager Scope
            </span>
            <span className="text-xs text-text-secondary font-medium">Departmental Operations Control</span>
          </div>
          <h2 className="text-xl font-bold text-navy mt-1">
            Warehouse Operations & Fulfillment Control
          </h2>
          <p className="text-xs text-text-secondary">
            Real-time stock monitoring, inbound receipts, and fulfillment dispatch coordination.
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
              Active Inventory Asset
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
              {state.products.length} catalog items managed
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-mint text-navy shadow-subtle border border-[#D5ECE7] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Confirmed Sales
            </span>
            <div className="p-1.5 rounded-lg bg-pale-cyan text-teal">
              <ShoppingCart className="w-4 h-4" />
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
              Pending Inbound
            </span>
            <div className="p-1.5 rounded-lg bg-navy-light text-turquoise">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black tracking-tight text-turquoise">
              {pendingPurchaseOrders.length} Inbound POs
            </p>
            <p className="text-[11px] text-gray-300 font-medium mt-1">
              Received spend: {formatCurrency(purchaseSummary.totalSpend)}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-mint text-navy shadow-subtle border border-[#D5ECE7] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Operating Margin
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-turquoise/30 text-teal border border-turquoise/50">
              {profitSummary.marginPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black tracking-tight text-navy">
              {formatCurrency(profitSummary.grossProfit)}
            </p>
            <p className="text-[11px] text-text-secondary font-medium mt-1">
              Gross departmental profit
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="p-6 rounded-2xl bg-white border border-[#E5E9EB] shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E9EB]">
            <div>
              <h3 className="text-sm font-bold text-navy">Inventory Fluctuation & Movement Trends</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Physical inbound additions vs outbound delivery dispatches.
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            {!mounted ? (
              <div className="h-full w-full rounded-xl bg-gray-50/60 border border-[#E5E9EB] flex items-center justify-center animate-pulse">
                <span className="text-xs text-text-secondary font-medium">Loading throughput data...</span>
              </div>
            ) : stockThroughputTrend.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center bg-gray-50/40 rounded-xl border border-dashed border-[#E5E9EB]">
                <div className="p-3 rounded-full bg-mint text-teal mb-2">
                  <Activity className="w-5 h-5 stroke-[1.8]" />
                </div>
                <h4 className="text-xs font-bold text-navy">No Inventory Movements In This Period</h4>
                <p className="text-[11px] text-text-secondary max-w-xs mt-1">
                  No stock intake receipts or outbound dispatches were logged for the selected period.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minHeight={180}>
                <AreaChart data={stockThroughputTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mgrCyanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#55C5D2" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#55C5D2" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="mgrTealGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#11877E" stopOpacity={0.4} />
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
                  <Area type="monotone" dataKey="inbound" name="Inbound Added (+)" stroke="#11877E" strokeWidth={2} fillOpacity={1} fill="url(#mgrTealGrad)" />
                  <Area type="monotone" dataKey="outbound" name="Outbound Dispatched (-)" stroke="#55C5D2" strokeWidth={2} fillOpacity={1} fill="url(#mgrCyanGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E5E9EB] shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E9EB]">
            <div>
              <h3 className="text-sm font-bold text-navy">Sales vs Purchases Revenue Pace</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Financial inflow from orders vs replenishment spend.
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            {!mounted ? (
              <div className="h-full w-full rounded-xl bg-gray-50/60 border border-[#E5E9EB] flex items-center justify-center animate-pulse">
                <span className="text-xs text-text-secondary font-medium">Loading revenue trends...</span>
              </div>
            ) : salesPurchaseTrend.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center bg-gray-50/40 rounded-xl border border-dashed border-[#E5E9EB]">
                <div className="p-3 rounded-full bg-mint text-teal mb-2">
                  <ShoppingCart className="w-5 h-5 stroke-[1.8]" />
                </div>
                <h4 className="text-xs font-bold text-navy">No Financial Activity In This Period</h4>
                <p className="text-[11px] text-text-secondary max-w-xs mt-1">
                  No confirmed sales or received purchase orders exist for the selected filter period.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minHeight={180}>
                <BarChart data={salesPurchaseTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                    }}
                    formatter={(val: unknown) => [formatCurrency(Number(val) || 0), '']}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="sales" name="Sales Revenue" fill="#55C5D2" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="purchases" name="Purchases Spend" fill="#11877E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="p-5 rounded-2xl bg-white border border-[#E5E9EB] shadow-subtle space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E9EB]">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-teal" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy">Pending Deliveries</h3>
            </div>
            <Link href="/purchases" className="text-[10px] font-bold text-teal hover:underline flex items-center gap-0.5">
              Receiving Log &rarr;
            </Link>
          </div>

          <div className="divide-y divide-[#E5E9EB]">
            {pendingPurchaseOrders.length === 0 ? (
              <p className="text-xs text-text-secondary py-4 text-center">No pending purchase orders.</p>
            ) : (
              pendingPurchaseOrders.slice(0, 4).map((po) => (
                <div key={po.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-navy">{po.orderNumber}</p>
                    <p className="text-[10px] text-text-secondary">{po.supplierName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-navy block">{formatCurrency(po.totalAmount)}</span>
                    <span className="text-[9px] font-semibold text-warning">
                      Exp: {formatDate(po.expectedDeliveryDate)}
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
              <AlertTriangle className="w-4 h-4 text-warning" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy">Low Stock Alerts</h3>
            </div>
            <Link href="/inventory" className="text-[10px] font-bold text-teal hover:underline flex items-center gap-0.5">
              Reorder &rarr;
            </Link>
          </div>

          <div className="divide-y divide-[#E5E9EB]">
            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-text-secondary py-4 text-center">All inventory above min levels.</p>
            ) : (
              lowStockProducts.slice(0, 4).map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-navy truncate max-w-[140px]">{p.name}</p>
                    <p className="text-[10px] text-text-secondary font-mono">{p.sku}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-warning text-xs block">
                      {p.currentStock} {p.unit}
                    </span>
                    <span className="text-[9px] text-text-secondary">min: {p.minStockLevel}</span>
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy">Operations Team</h3>
            </div>
            <Link href="/activity" className="text-[10px] font-bold text-teal hover:underline flex items-center gap-0.5">
              Full Stream &rarr;
            </Link>
          </div>

          <div className="divide-y divide-[#E5E9EB]">
            {teamActivities.map((act) => (
              <div key={act.id} className="py-2.5 flex items-start gap-2.5 text-xs">
                <div className="w-2 h-2 rounded-full bg-teal mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-navy text-[11px] truncate">{act.action}</p>
                    <span className="text-[9px] text-text-secondary shrink-0">{formatRelativeTime(act.timestamp)}</span>
                  </div>
                  <p className="text-[11px] text-text-secondary line-clamp-1">{act.details}</p>
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

