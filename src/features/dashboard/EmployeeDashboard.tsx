'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Package,
  ShoppingCart,
  Truck,
  Search,
  PlusCircle,
  AlertTriangle,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { useApp, useRole } from '@/context/AppProvider';
import { formatCurrency, formatNumber, formatRelativeTime } from '@/lib/formatters';

export function EmployeeDashboard() {
  const { state } = useApp();
  const { currentEmployee } = useRole();

  const [searchTerm, setSearchTerm] = useState('');

  const myConfirmedSales = useMemo(() => {
    return state.salesOrders.filter(
      (order) =>
        order.createdBy === currentEmployee.id &&
        (order.status === 'CONFIRMED' || order.status === 'SHIPPED' || order.status === 'DELIVERED')
    );
  }, [state.salesOrders, currentEmployee.id]);

  const mySalesRevenue = useMemo(() => {
    return myConfirmedSales.reduce((acc, order) => acc + (order.totalAmount || 0), 0);
  }, [myConfirmedSales]);

  const myPurchaseOrders = useMemo(() => {
    return state.purchaseOrders.filter((po) => po.createdBy === currentEmployee.id);
  }, [state.purchaseOrders, currentEmployee.id]);

  const myReceivedPurchases = useMemo(() => {
    return state.purchaseOrders.filter(
      (po) =>
        (po.receivedBy === currentEmployee.id || po.createdBy === currentEmployee.id) &&
        po.status === 'RECEIVED'
    );
  }, [state.purchaseOrders, currentEmployee.id]);

  const myActivities = useMemo(() => {
    return state.activityLogs
      .filter((log) => log.employeeId === currentEmployee.id)
      .slice(0, 6);
  }, [state.activityLogs, currentEmployee.id]);

  const lowStockWarnings = useMemo(() => {
    return state.products.filter((p) => p.currentStock <= p.minStockLevel);
  }, [state.products]);

  const filteredProducts = useMemo(() => {
    return state.products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [state.products, searchTerm]);

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-[#E5E9EB] shadow-subtle">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-mint text-teal border border-[#D5ECE7]">
              Employee Scope
            </span>
            <span className="text-xs text-text-secondary font-medium">Personal Operational Workbench</span>
          </div>
          <h2 className="text-xl font-bold text-navy mt-1">
            Welcome back, {currentEmployee.name}
          </h2>
          <p className="text-xs text-text-secondary">
            Check real-time stock availability, fulfill client sales orders, and record inbound supplier deliveries.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/sales/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal hover:bg-teal-hover rounded-lg transition-colors shadow-2xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            + New Sale
          </Link>
          <Link
            href="/purchases/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-navy bg-mint hover:bg-pale-cyan border border-[#D5ECE7] rounded-lg transition-colors"
          >
            <Truck className="w-3.5 h-3.5 text-teal" />
            + Inbound PO
          </Link>
          <Link
            href="/inventory/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-text-secondary bg-white hover:bg-gray-50 border border-[#E5E9EB] rounded-lg transition-colors"
          >
            <Package className="w-3.5 h-3.5" />
            + Add Product
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="p-5 rounded-2xl bg-turquoise text-navy shadow-subtle border border-turquoise-dark/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-navy/80">
              Personal Sales Volume
            </span>
            <div className="p-1.5 rounded-lg bg-white/40 text-navy">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black tracking-tight text-navy">
              {formatCurrency(mySalesRevenue)}
            </p>
            <p className="text-[11px] text-navy/80 font-medium mt-1">
              {myConfirmedSales.length} confirmed orders fulfilled
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-mint text-navy shadow-subtle border border-[#D5ECE7] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Inbound Tasks Handled
            </span>
            <div className="p-1.5 rounded-lg bg-pale-cyan text-teal">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black tracking-tight text-teal">
              {myReceivedPurchases.length} Received
            </p>
            <p className="text-[11px] text-text-secondary font-medium mt-1">
              {myPurchaseOrders.length} total orders initiated
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-navy text-white shadow-panel flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-300">
              Personal Activity
            </span>
            <div className="p-1.5 rounded-lg bg-navy-light text-turquoise">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black tracking-tight text-turquoise">
              {myActivities.length} Operations
            </p>
            <p className="text-[11px] text-gray-300 font-medium mt-1">
              Recorded in personal audit log
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-mint text-navy shadow-subtle border border-[#D5ECE7] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Catalog Health
            </span>
            <div className="p-1.5 rounded-lg bg-pale-cyan text-warning">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black tracking-tight text-navy">
              {lowStockWarnings.length} Low Stock
            </p>
            <p className="text-[11px] text-text-secondary font-medium mt-1">
              Items at or below reorder threshold
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-[#E5E9EB] shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E9EB]">
            <div>
              <h3 className="text-sm font-bold text-navy">Catalog Stock Lookup</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Verify real-time stock levels across regional facilities before committing orders.
              </p>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-text-secondary" />
              <input
                type="text"
                placeholder="Filter product, SKU, category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-mint/50 border border-[#E5E9EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal text-navy placeholder:text-text-secondary"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-mint/40 text-text-secondary uppercase tracking-wider font-semibold border-b border-[#E5E9EB]">
                <tr>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Selling Price</th>
                  <th className="py-2.5 px-3 text-right">Available</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E9EB]">
                {filteredProducts.slice(0, 7).map((prod) => {
                  const isLow = prod.currentStock <= prod.minStockLevel && prod.currentStock > 0;
                  const isOut = prod.currentStock === 0;

                  return (
                    <tr key={prod.id} className="hover:bg-mint/20 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-navy">
                        <p>{prod.name}</p>
                        <p className="text-[10px] text-text-secondary font-mono">{prod.sku}</p>
                      </td>
                      <td className="py-2.5 px-3 text-text-secondary">{prod.category}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-navy">
                        {formatCurrency(prod.sellingPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-navy">
                        {formatNumber(prod.currentStock)} {prod.unit}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            isOut
                              ? 'bg-danger/10 text-danger'
                              : isLow
                              ? 'bg-warning/10 text-warning'
                              : 'bg-mint text-teal border border-[#D5ECE7]'
                          }`}
                        >
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link
                          href={`/inventory/${prod.id}`}
                          className="text-[10px] font-bold text-teal hover:underline flex items-center justify-end gap-0.5"
                        >
                          Details <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E5E9EB] shadow-subtle space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E9EB]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal" />
                <h3 className="text-sm font-bold text-navy">Personal Activity Log</h3>
              </div>
              <Link href="/activity" className="text-[10px] font-bold text-teal hover:underline">
                View All &rarr;
              </Link>
            </div>

            <div className="divide-y divide-[#E5E9EB] mt-2">
              {myActivities.length === 0 ? (
                <p className="text-xs text-text-secondary py-6 text-center">No recent operations logged.</p>
              ) : (
                myActivities.map((log) => (
                  <div key={log.id} className="py-3 flex items-start gap-2.5 text-xs">
                    <div className="w-2 h-2 rounded-full bg-teal mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-navy text-[11px] truncate">{log.action}</p>
                        <span className="text-[9px] text-text-secondary shrink-0">{formatRelativeTime(log.timestamp)}</span>
                      </div>
                      <p className="text-[11px] text-text-secondary line-clamp-1 mt-0.5">{log.details}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E9EB] flex items-center justify-between text-xs text-text-secondary">
            <span>Signed in: {currentEmployee.name}</span>
            <span className="text-teal font-semibold">Store Associate</span>
          </div>
        </div>
      </div>
    </div>
  );
}

