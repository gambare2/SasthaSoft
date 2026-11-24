'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  Search,
  Filter,
  ShoppingCart,
  Truck,
  Package,
  Clock,
  ChevronRight,
  Shield,
  Activity,
  UserPlus,
  Edit3,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '@/context/AppProvider';
import { ROLES } from '@/permissions/roles';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
import { Employee, Role } from '@/types';

export function EmployeesList() {
  const { state } = useApp();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const canManageEmployees = state.currentRole === 'ADMIN';

  const employeeMetrics = useMemo(() => {
    const metrics = new Map<
      string,
      { confirmedSales: number; salesCount: number; purchaseSpend: number; purchaseCount: number }
    >();

    state.employees.forEach((emp) => {
      metrics.set(emp.id, { confirmedSales: 0, salesCount: 0, purchaseSpend: 0, purchaseCount: 0 });
    });

    state.salesOrders.forEach((so) => {
      const cur = metrics.get(so.createdBy);
      if (cur) {
        if (so.status === 'CONFIRMED' || so.status === 'SHIPPED' || so.status === 'DELIVERED') {
          cur.confirmedSales += so.totalAmount;
          cur.salesCount += 1;
        }
      }
    });

    state.purchaseOrders.forEach((po) => {
      const cur = metrics.get(po.createdBy);
      if (cur) {
        if (po.status === 'RECEIVED') {
          cur.purchaseSpend += po.totalAmount;
          cur.purchaseCount += 1;
        }
      }
    });

    return metrics;
  }, [state.employees, state.salesOrders, state.purchaseOrders]);

  const summary = useMemo(() => {
    const totalStaff = state.employees.length;
    let totalSales = 0;
    let totalPurchases = 0;

    employeeMetrics.forEach((m) => {
      totalSales += m.confirmedSales;
      totalPurchases += m.purchaseSpend;
    });

    return { totalStaff, totalSales, totalPurchases };
  }, [state.employees, employeeMetrics]);

  const departments = useMemo(() => {
    return Array.from(new Set(state.employees.map((e) => e.department))).sort();
  }, [state.employees]);

  const filteredEmployees = useMemo(() => {
    return state.employees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase()) ||
        emp.title.toLowerCase().includes(search.toLowerCase()) ||
        emp.id.toLowerCase().includes(search.toLowerCase());

      const matchesRole = roleFilter === 'ALL' || emp.role === roleFilter;
      const matchesDept = deptFilter === 'ALL' || emp.department === deptFilter;

      return matchesSearch && matchesRole && matchesDept;
    });
  }, [state.employees, search, roleFilter, deptFilter]);

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-xl border border-border shadow-subtle">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-navy tracking-tight">Employee Management & Performance</h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-navy text-white border border-navy">
              Admin Authorized
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Configure system identities, departments, assigned warehouses, role authority scopes, and operational throughput.
          </p>
        </div>

        {canManageEmployees && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal hover:bg-teal-dark text-white text-xs font-semibold rounded-lg shadow-subtle transition-all self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            Add Employee
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div className="p-5 bg-turquoise rounded-xl border border-turquoise-dark/20 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-navy/70 uppercase tracking-wider">Total Active Staff</span>
              <Shield className="w-4 h-4 text-navy/60" />
            </div>
            <p className="text-2xl font-bold text-navy mt-2 tracking-tight">{summary.totalStaff} Team Members</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-navy/10 text-xs text-navy/80 font-medium">
            Across {departments.length} functional departments
          </div>
        </div>

        <div className="p-5 bg-mint rounded-xl border border-border shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Staff Generated Revenue</span>
              <ShoppingCart className="w-4 h-4 text-teal" />
            </div>
            <p className="text-2xl font-bold text-teal mt-2 tracking-tight">{formatCurrency(summary.totalSales)}</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-border text-xs text-text-secondary">
            Total confirmed customer orders
          </div>
        </div>

        <div className="p-5 bg-navy text-white rounded-xl border border-navy-light shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">Inbound Spend Executed</span>
              <Truck className="w-4 h-4 text-pale-cyan" />
            </div>
            <p className="text-2xl font-bold text-white mt-2 tracking-tight">{formatCurrency(summary.totalPurchases)}</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/10 text-xs text-pale-cyan/80">
            Received supplier purchase orders
          </div>
        </div>
      </div>

      <div className="p-4 bg-white rounded-xl border border-border shadow-subtle space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by name, email, title, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-mint/40 border border-border rounded-lg text-text-primary placeholder:text-text-secondary/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal transition-colors"
            />
          </div>

          <div className="relative">
            <Filter className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-secondary" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-mint/40 border border-border rounded-lg text-text-primary font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal transition-colors"
            >
              <option value="ALL">All Role Scopes</option>
              <option value="ADMIN">ADMIN</option>
              <option value="MANAGER">MANAGER</option>
              <option value="EMPLOYEE">EMPLOYEE</option>
            </select>
          </div>

          <div className="relative">
            <Filter className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-secondary" />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-mint/40 border border-border rounded-lg text-text-primary font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal transition-colors"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-mint/30 border-b border-border text-text-secondary uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Role Scope</th>
                <th className="py-3 px-4">Department & Title</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4 text-right">Confirmed Sales</th>
                <th className="py-3 px-4 text-right">Received Spend</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEmployees.map((emp) => {
                const roleConfig = ROLES[emp.role];
                const metrics = employeeMetrics.get(emp.id) || {
                  confirmedSales: 0,
                  salesCount: 0,
                  purchaseSpend: 0,
                  purchaseCount: 0,
                };

                return (
                  <tr key={emp.id} className="hover:bg-mint/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.avatar}
                          alt={emp.name}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-border"
                        />
                        <div>
                          <p className="font-bold text-navy">{emp.name}</p>
                          <p className="text-[11px] text-text-secondary font-mono">{emp.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${roleConfig.badgeColor.bg} ${roleConfig.badgeColor.text} ${roleConfig.badgeColor.border}`}
                      >
                        {roleConfig.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-text-primary">{emp.title}</p>
                      <p className="text-[11px] text-text-secondary">{emp.department}</p>
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      <p className="text-text-primary font-medium">{emp.email}</p>
                      <p className="text-[11px] text-text-secondary">{emp.phone}</p>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-teal">
                      {formatCurrency(metrics.confirmedSales)}
                      <span className="block text-[10px] text-text-secondary font-normal">
                        {metrics.salesCount} orders
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-navy">
                      {formatCurrency(metrics.purchaseSpend)}
                      <span className="block text-[10px] text-text-secondary font-normal">
                        {metrics.purchaseCount} POs
                      </span>
                    </td>
                    <td className="py-3 px-4 text-text-secondary">{formatDate(emp.joinedDate)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        emp.status === 'ACTIVE'
                          ? 'bg-mint text-teal border-teal/20'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canManageEmployees && (
                          <button
                            type="button"
                            onClick={() => setEditingEmployee(emp)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-navy bg-mint hover:bg-turquoise/20 rounded-lg border border-border transition-colors"
                          >
                            <Edit3 className="w-3 h-3 text-teal" />
                            Edit
                          </button>
                        )}
                        <Link
                          href={`/employees/${emp.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal hover:bg-mint rounded-lg transition-colors"
                        >
                          Details
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <EmployeeModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
      {editingEmployee && (
        <EmployeeModal
          isOpen={Boolean(editingEmployee)}
          employeeToEdit={editingEmployee}
          onClose={() => setEditingEmployee(null)}
        />
      )}
    </div>
  );
}

export function EmployeeDetailView({ id }: { id: string }) {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<'SALES' | 'PURCHASES' | 'MOVEMENTS' | 'ACTIVITY'>('SALES');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const emp = state.employees.find((e) => e.id === id) || state.employees[0];
  const roleConfig = ROLES[emp.role];
  const canManageEmployees = state.currentRole === 'ADMIN';

  const employeeSales = useMemo(() => {
    return state.salesOrders.filter((s) => s.createdBy === emp.id);
  }, [state.salesOrders, emp.id]);

  const employeePurchases = useMemo(() => {
    return state.purchaseOrders.filter((p) => p.createdBy === emp.id);
  }, [state.purchaseOrders, emp.id]);

  const employeeMovements = useMemo(() => {
    return state.stockMovements.filter((m) => m.performedBy === emp.id);
  }, [state.stockMovements, emp.id]);

  const employeeLogs = useMemo(() => {
    return state.activityLogs.filter((l) => l.employeeId === emp.id);
  }, [state.activityLogs, emp.id]);

  const totalSalesRevenue = useMemo(() => {
    return employeeSales
      .filter((s) => s.status === 'CONFIRMED' || s.status === 'SHIPPED' || s.status === 'DELIVERED')
      .reduce((sum, s) => sum + s.totalAmount, 0);
  }, [employeeSales]);

  const totalPurchaseSpend = useMemo(() => {
    return employeePurchases
      .filter((p) => p.status === 'RECEIVED')
      .reduce((sum, p) => sum + p.totalAmount, 0);
  }, [employeePurchases]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      <div className="flex items-center justify-between p-5 bg-white rounded-xl border border-border shadow-subtle">
        <div className="flex items-center gap-2">
          <Link href="/employees" className="text-xs text-text-secondary hover:text-navy transition-colors">
            Employees
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-text-secondary" />
          <span className="text-xs font-bold text-navy">{emp.name}</span>
        </div>
        <div className="flex items-center gap-3">
          {canManageEmployees && (
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal hover:bg-teal-dark rounded-lg transition-colors shadow-subtle"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile
            </button>
          )}
          <Link
            href="/employees"
            className="text-xs text-teal hover:underline font-semibold"
          >
            &larr; Back to Directory
          </Link>
        </div>
      </div>

      <div className="p-6 bg-white rounded-xl border border-border shadow-subtle space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="flex items-center gap-4">
            <img
              src={emp.avatar}
              alt={emp.name}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-border shadow-subtle"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-navy">{emp.name}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-mint text-teal border border-teal/20">
                  {emp.status}
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                {emp.title} &bull; {emp.department} &bull; ID: <span className="font-mono text-navy">{emp.id}</span>
              </p>
              <div className="mt-2">
                <span
                  className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${roleConfig.badgeColor.bg} ${roleConfig.badgeColor.text} ${roleConfig.badgeColor.border}`}
                >
                  {roleConfig.label} Authority Scope
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-mint/40 rounded-lg border border-border">
            <span className="text-text-secondary block font-semibold text-[10px] uppercase">Email Address</span>
            <strong className="text-navy mt-0.5 block truncate">{emp.email}</strong>
          </div>
          <div className="p-3 bg-mint/40 rounded-lg border border-border">
            <span className="text-text-secondary block font-semibold text-[10px] uppercase">Phone Number</span>
            <strong className="text-navy mt-0.5 block">{emp.phone}</strong>
          </div>
          <div className="p-3 bg-mint/40 rounded-lg border border-border">
            <span className="text-text-secondary block font-semibold text-[10px] uppercase">Date Joined</span>
            <strong className="text-navy mt-0.5 block">{formatDate(emp.joinedDate)}</strong>
          </div>
          <div className="p-3 bg-mint/40 rounded-lg border border-border">
            <span className="text-text-secondary block font-semibold text-[10px] uppercase">Account Security</span>
            <strong className="text-teal mt-0.5 block">Active Enterprise SSO</strong>
          </div>
        </div>

        <div className="p-3.5 bg-mint rounded-lg border border-teal/20 text-xs text-navy">
          <span className="font-bold flex items-center gap-1.5 mb-1 text-teal">
            <Shield className="w-3.5 h-3.5 text-teal" />
            Role Policy Authority:
          </span>
          <p className="text-text-primary text-[11px] leading-relaxed">{roleConfig.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-mint rounded-xl border border-border shadow-subtle flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Confirmed Sales Revenue</span>
            <p className="text-2xl font-bold text-teal mt-2 tracking-tight">{formatCurrency(totalSalesRevenue)}</p>
          </div>
          <p className="text-[11px] text-text-secondary mt-3 pt-2.5 border-t border-border">{employeeSales.length} total orders created</p>
        </div>

        <div className="p-5 bg-navy text-white rounded-xl border border-navy-light shadow-subtle flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">Inbound Spend Executed</span>
            <p className="text-2xl font-bold text-white mt-2 tracking-tight">{formatCurrency(totalPurchaseSpend)}</p>
          </div>
          <p className="text-[11px] text-pale-cyan/80 mt-3 pt-2.5 border-t border-white/10">{employeePurchases.length} total POs issued</p>
        </div>

        <div className="p-5 bg-turquoise rounded-xl border border-turquoise-dark/20 shadow-subtle flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-navy/70 uppercase tracking-wider">Stock Movements Logged</span>
            <p className="text-2xl font-bold text-navy mt-2 tracking-tight">{employeeMovements.length} Movements</p>
          </div>
          <p className="text-[11px] text-navy/80 mt-3 pt-2.5 border-t border-navy/10">{employeeLogs.length} audit trail logs</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-subtle overflow-hidden">
        <div className="flex border-b border-border bg-mint/30 p-2 gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('SALES')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'SALES'
                ? 'bg-navy text-white shadow-subtle'
                : 'text-text-secondary hover:text-navy hover:bg-white/60'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Customer Sales Orders ({employeeSales.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PURCHASES')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'PURCHASES'
                ? 'bg-navy text-white shadow-subtle'
                : 'text-text-secondary hover:text-navy hover:bg-white/60'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Purchase Orders ({employeePurchases.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MOVEMENTS')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'MOVEMENTS'
                ? 'bg-navy text-white shadow-subtle'
                : 'text-text-secondary hover:text-navy hover:bg-white/60'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Stock Movements ({employeeMovements.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ACTIVITY')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'ACTIVITY'
                ? 'bg-navy text-white shadow-subtle'
                : 'text-text-secondary hover:text-navy hover:bg-white/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Audit Log Stream ({employeeLogs.length})
          </button>
        </div>

        <div className="p-4">

          {activeTab === 'SALES' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-mint/30 text-text-secondary font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Order #</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Total Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {employeeSales.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-text-secondary">
                        No sales orders created by this employee yet.
                      </td>
                    </tr>
                  ) : (
                    employeeSales.map((so) => (
                      <tr key={so.id} className="hover:bg-mint/20 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-navy">{so.orderNumber}</td>
                        <td className="py-2.5 px-3 font-semibold text-text-primary">{so.customerName}</td>
                        <td className="py-2.5 px-3 text-text-secondary">{formatDate(so.orderDate)}</td>
                        <td className="py-2.5 px-3 font-bold text-teal">{formatCurrency(so.totalAmount)}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              so.status === 'CONFIRMED' || so.status === 'SHIPPED'
                                ? 'bg-mint text-teal border border-teal/20'
                                : so.status === 'CANCELLED'
                                ? 'bg-rose-50 text-danger border border-danger/20'
                                : 'bg-pale-cyan text-navy border border-pale-cyan-dark/20'
                            }`}
                          >
                            {so.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Link
                            href={`/sales/${so.id}`}
                            className="text-teal hover:underline font-semibold"
                          >
                            Details &rarr;
                          </Link>
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
                  <tr className="border-b border-border bg-mint/30 text-text-secondary font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-3">PO #</th>
                    <th className="py-2.5 px-3">Supplier</th>
                    <th className="py-2.5 px-3">Warehouse</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Total Spend</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {employeePurchases.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-text-secondary">
                        No purchase orders issued by this employee yet.
                      </td>
                    </tr>
                  ) : (
                    employeePurchases.map((po) => (
                      <tr key={po.id} className="hover:bg-mint/20 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-navy">{po.orderNumber}</td>
                        <td className="py-2.5 px-3 font-semibold text-text-primary">{po.supplierName}</td>
                        <td className="py-2.5 px-3 text-text-secondary">{po.warehouseName}</td>
                        <td className="py-2.5 px-3 text-text-secondary">{formatDate(po.orderDate)}</td>
                        <td className="py-2.5 px-3 font-bold text-navy">{formatCurrency(po.totalAmount)}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              po.status === 'RECEIVED'
                                ? 'bg-mint text-teal border border-teal/20'
                                : po.status === 'CANCELLED'
                                ? 'bg-rose-50 text-danger border border-danger/20'
                                : 'bg-pale-cyan text-navy border border-pale-cyan-dark/20'
                            }`}
                          >
                            {po.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Link
                            href={`/purchases/${po.id}`}
                            className="text-teal hover:underline font-semibold"
                          >
                            Details &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'MOVEMENTS' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-mint/30 text-text-secondary font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Movement Type</th>
                    <th className="py-2.5 px-3 text-center">Qty Change</th>
                    <th className="py-2.5 px-3">Stock Progression</th>
                    <th className="py-2.5 px-3">Reason / Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {employeeMovements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-text-secondary">
                        No inventory stock adjustments or movements performed by this employee.
                      </td>
                    </tr>
                  ) : (
                    employeeMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-mint/20 transition-colors">
                        <td className="py-2.5 px-3 text-text-secondary">{formatDateTime(m.createdAt)}</td>
                        <td className="py-2.5 px-3 font-semibold text-navy">{m.productName}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-mint text-teal border border-teal/20">
                            {m.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-navy">
                          {m.newQuantity > m.previousQuantity ? `+${m.quantity}` : `-${m.quantity}`}
                        </td>
                        <td className="py-2.5 px-3 text-text-secondary">
                          {m.previousQuantity} &rarr; {m.newQuantity}
                        </td>
                        <td className="py-2.5 px-3 text-text-secondary">{m.reason}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'ACTIVITY' && (
            <div className="divide-y divide-border">
              {employeeLogs.length === 0 ? (
                <div className="py-8 text-center text-text-secondary">
                  No activity log events recorded for this employee.
                </div>
              ) : (
                employeeLogs.map((log) => (
                  <div key={log.id} className="py-3 flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-mint text-teal mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-navy">{log.action}</span>
                        <span className="text-[10px] text-text-secondary">{formatDateTime(log.timestamp)}</span>
                      </div>
                      <p className="text-text-secondary text-[11px] mt-0.5">{log.details}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {isEditModalOpen && (
        <EmployeeModal
          isOpen={isEditModalOpen}
          employeeToEdit={emp}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </div>
  );
}

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeToEdit?: Employee | null;
}

function EmployeeModal({ isOpen, onClose, employeeToEdit }: EmployeeModalProps) {
  const { state, createEmployee, updateEmployee, deactivateEmployee } = useApp();

  const isEditing = Boolean(employeeToEdit);

  const [name, setName] = useState(employeeToEdit?.name || '');
  const [email, setEmail] = useState(employeeToEdit?.email || '');
  const [phone, setPhone] = useState(employeeToEdit?.phone || '');
  const [department, setDepartment] = useState(employeeToEdit?.department || 'Warehouse & Logistics');
  const [title, setTitle] = useState(employeeToEdit?.title || '');
  const [role, setRole] = useState<Role>(employeeToEdit?.role || 'EMPLOYEE');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(employeeToEdit?.status || 'ACTIVE');
  const [assignedWarehouseId, setAssignedWarehouseId] = useState(employeeToEdit?.assignedWarehouseId || '');
  const [joinedDate, setJoinedDate] = useState(employeeToEdit?.joinedDate || new Date().toISOString().split('T')[0]);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  const commonDepartments = [
    'Executive Operations',
    'Warehouse & Logistics',
    'Order Fulfillment',
    'Sales & Client Desk',
    'Procurement & Inventory',
    'Quality & Compliance',
  ];

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (isEditing && employeeToEdit) {
        const res = updateEmployee(employeeToEdit, {
          name,
          email,
          phone,
          department,
          title,
          role,
          status,
          assignedWarehouseId: assignedWarehouseId || undefined,
        });

        if (!res.success) {
          setError(res.error);
          setIsSubmitting(false);
          return;
        }

        setSuccessMsg(`Employee profile for ${res.data.employee.name} updated successfully.`);
      } else {
        const res = createEmployee({
          name,
          email,
          phone,
          department,
          title,
          role,
          status,
          joinedDate,
          assignedWarehouseId: assignedWarehouseId || undefined,
        });

        if (!res.success) {
          setError(res.error);
          setIsSubmitting(false);
          return;
        }

        setSuccessMsg(`New employee identity ${res.data.employee.name} (${res.data.employee.id}) created successfully.`);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 700);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = () => {
    if (!employeeToEdit) return;
    setError(null);
    setIsSubmitting(true);

    const res = deactivateEmployee(employeeToEdit.id);
    if (!res.success) {
      setError(res.error);
      setIsSubmitting(false);
      return;
    }

    setSuccessMsg(`Employee ${employeeToEdit.name} deactivated. Historical transaction attribution preserved.`);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowDeactivateConfirm(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-border shadow-2xl p-6">

        <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-navy">
              {isEditing ? `Edit Employee — ${employeeToEdit?.name}` : 'Add New Employee Identity'}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              {isEditing
                ? 'Update role scopes, contact info, and system permissions.'
                : 'Register a new enterprise user. Admin authorization required.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-secondary hover:text-navy hover:bg-mint rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold">Validation Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-mint border border-teal/30 rounded-lg flex items-center gap-2 text-xs text-teal font-semibold">
            <Check className="w-4 h-4 text-teal flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {showDeactivateConfirm && employeeToEdit ? (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-2">
              <p className="font-bold text-sm text-amber-950">Confirm Employee Deactivation</p>
              <p>
                Are you sure you want to deactivate <strong>{employeeToEdit.name}</strong> ({employeeToEdit.id})?
              </p>
              <p className="text-amber-800 text-[11px]">
                &bull; Deactivation revokes active login and operational permissions.
                <br />
                &bull; <strong>Historical integrity is preserved:</strong> all existing sales orders, purchase orders, and stock movements attributed to this employee remain intact.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeactivateConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-navy rounded-lg border border-border transition-colors"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-subtle transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Deactivating...' : 'Confirm Deactivation'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@stockflow.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98450 12345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  Designation / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Logistics Supervisor"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  Department <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  list="dept-list"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
                />
                <datalist id="dept-list">
                  {commonDepartments.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  Role Authority Scope <span className="text-rose-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
                >
                  <option value="ADMIN">ADMIN — Full System Authority</option>
                  <option value="MANAGER">MANAGER — Operations & Orders Authority</option>
                  <option value="EMPLOYEE">EMPLOYEE — Execution & Billing Specialist</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">Assigned Warehouse</label>
                <select
                  value={assignedWarehouseId}
                  onChange={(e) => setAssignedWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
                >
                  <option value="">None / Floating Assignment</option>
                  {state.warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                  className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
                >
                  <option value="ACTIVE">ACTIVE (Authorized)</option>
                  <option value="INACTIVE">INACTIVE (Suspended)</option>
                </select>
              </div>
            </div>

            {!isEditing && (
              <div>
                <label className="block text-xs font-bold text-navy mb-1">Joining Date</label>
                <input
                  type="date"
                  value={joinedDate}
                  onChange={(e) => setJoinedDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
                />
              </div>
            )}

            <div className="p-3 bg-mint/50 border border-teal/20 rounded-lg text-[11px] text-text-secondary">
              <span className="font-bold text-teal block mb-0.5">Policy Authority for {role}:</span>
              {ROLES[role].description}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border mt-6">
              <div>
                {isEditing && employeeToEdit && employeeToEdit.status === 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() => setShowDeactivateConfirm(true)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                  >
                    Deactivate Identity
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-navy rounded-lg border border-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal hover:bg-teal-dark rounded-lg shadow-subtle transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Identity'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

