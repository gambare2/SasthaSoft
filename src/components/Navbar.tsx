'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Menu,
  Search,
  Bell,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Truck,
  ShoppingCart,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { useRole, useApp } from '@/context/AppProvider';
import { ROLES, ALL_ROLES } from '@/permissions/roles';
import { getNavigationForRole } from '@/permissions/access-control';

interface NavbarProps {
  onOpenMobileMenu?: () => void;
}

export function Navbar({ onOpenMobileMenu }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentRole, currentEmployee, setDemoRole } = useRole();
  const { state, dispatch, resetDemoData } = useApp();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const roleMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setRoleMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = getNavigationForRole(currentRole);
  const roleConfig = ROLES[currentRole];

  const lowStockItems = state.products.filter((p) => p.currentStock <= p.minStockLevel);
  const pendingPurchases = state.purchaseOrders.filter((p) => p.status === 'PENDING' || p.status === 'DRAFT');
  const draftSales = state.salesOrders.filter((s) => s.status === 'DRAFT' || s.status === 'PENDING');
  const totalAlertsCount = lowStockItems.length + pendingPurchases.length + draftSales.length;

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && state.searchQuery.trim()) {
      const q = state.searchQuery.trim().toLowerCase();
      if (q.startsWith('so-') || q.includes('sale')) {
        router.push(`/sales?search=${encodeURIComponent(state.searchQuery.trim())}`);
      } else if (q.startsWith('po-') || q.includes('purch')) {
        router.push(`/purchases?search=${encodeURIComponent(state.searchQuery.trim())}`);
      } else if (q.includes('rep') || q.includes('profit') || q.includes('margin')) {
        router.push(`/reports`);
      } else if (q.includes('emp') || q.includes('staff')) {
        router.push(`/employees`);
      } else if (q.includes('ware') || q.includes('hub')) {
        router.push(`/warehouses`);
      } else if (q.includes('act') || q.includes('log') || q.includes('audit')) {
        router.push(`/activity`);
      } else if (q.includes('cust') || q.includes('supp') || q.includes('contact')) {
        router.push(`/contacts`);
      } else {
        router.push(`/inventory?search=${encodeURIComponent(state.searchQuery.trim())}`);
      }
    }
  };

  const isLinkActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-border shadow-subtle">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3 sm:gap-4">

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">

            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="p-2 -ml-1 text-text-secondary rounded-lg hover:text-navy hover:bg-mint lg:hidden transition-colors"
              aria-label="Open mobile navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg text-navy shadow-2xs group-hover:text-white transition-colors">
                <img src="/favicon.ico" alt="S" className="w-5 h-5 rounded-md" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-base tracking-tight text-navy">
                  Sastha <span className="text-yellow-500">Soft</span>
                </span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-border">
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${roleConfig.badgeColor.bg} ${roleConfig.badgeColor.text} ${roleConfig.badgeColor.border}`}
              >
                {roleConfig.badgeLabel} Scope
              </span>
            </div>
          </div>

          <div className="flex-1 max-w-[210px] sm:max-w-xs lg:max-w-md relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search inventory, orders, SKU... (Enter)"
              value={state.searchQuery}
              onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-8 sm:pl-9 pr-3 sm:pr-8 py-1.5 text-xs bg-mint/40 border border-border rounded-lg text-navy placeholder:text-text-secondary/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal transition-all"
            />
            <kbd className="hidden sm:inline-block absolute right-2.5 top-2 text-[9px] font-mono text-text-secondary bg-white border border-border px-1 rounded shadow-2xs">
              ↵
            </kbd>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">

            <div className="relative hidden lg:block" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 text-text-secondary rounded-lg hover:text-navy hover:bg-mint transition-colors"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {totalAlertsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-turquoise opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal" />
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-border z-50 p-3 max-h-[80vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                    <span className="text-xs font-bold text-navy">Operational Alerts</span>
                    <span className="text-[10px] bg-pale-cyan text-teal px-2 py-0.5 rounded-full font-bold border border-pale-cyan-dark/20">
                      {totalAlertsCount} Actionable
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">

                    {lowStockItems.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-mint border border-border space-y-1">
                        <div className="flex items-center justify-between text-teal font-bold text-[11px]">
                          <span className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                            Low Stock Alert ({lowStockItems.length})
                          </span>
                          <Link
                            href="/inventory"
                            onClick={() => setNotifOpen(false)}
                            className="text-teal hover:underline text-[10px] flex items-center gap-0.5"
                          >
                            View <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        </div>
                        {lowStockItems.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-[11px] text-text-secondary">
                            <span className="truncate max-w-[170px]">{item.name}</span>
                            <span className="font-bold text-navy shrink-0">
                              {item.currentStock} / min {item.minStockLevel}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {pendingPurchases.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-pale-cyan/60 border border-pale-cyan-dark/20 space-y-1">
                        <div className="flex items-center justify-between text-navy font-bold text-[11px]">
                          <span className="flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-teal" />
                            Awaiting Inbound Intake ({pendingPurchases.length})
                          </span>
                          <Link
                            href="/purchases"
                            onClick={() => setNotifOpen(false)}
                            className="text-teal hover:underline text-[10px] flex items-center gap-0.5"
                          >
                            View <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        </div>
                        {pendingPurchases.slice(0, 3).map((po) => (
                          <div key={po.id} className="flex items-center justify-between text-[11px] text-text-secondary">
                            <span className="truncate max-w-[170px]">{po.orderNumber} &bull; {po.supplierName}</span>
                            <span className="font-semibold text-navy shrink-0">{po.status}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {draftSales.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-mint/50 border border-border space-y-1">
                        <div className="flex items-center justify-between text-navy font-bold text-[11px]">
                          <span className="flex items-center gap-1.5">
                            <ShoppingCart className="w-3.5 h-3.5 text-teal" />
                            Active Fulfillment ({draftSales.length})
                          </span>
                          <Link
                            href="/sales"
                            onClick={() => setNotifOpen(false)}
                            className="text-teal hover:underline text-[10px] flex items-center gap-0.5"
                          >
                            View <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        </div>
                        {draftSales.slice(0, 3).map((so) => (
                          <div key={so.id} className="flex items-center justify-between text-[11px] text-text-secondary">
                            <span className="truncate max-w-[170px]">{so.orderNumber} &bull; {so.customerName}</span>
                            <span className="font-semibold text-navy shrink-0">{so.status}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {totalAlertsCount === 0 && (
                      <div className="py-4 text-center text-text-secondary text-xs">
                        All inventory and orders are optimal.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative hidden lg:block" ref={roleMenuRef}>
              <button
                type="button"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-mint text-navy border border-border hover:bg-pale-cyan transition-colors"
                title="Switch demo evaluation role"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal" />
                  <span className="font-bold">{roleConfig.badgeLabel}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 p-2 bg-white rounded-xl shadow-xl border border-border z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-navy">Role Switcher</span>

                    </div>
                  </div>

                  <div className="py-1 space-y-1">
                    {ALL_ROLES.map((role) => {
                      const cfg = ROLES[role];
                      const isSelected = currentRole === role;

                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => {
                            setDemoRole(role);
                            setRoleMenuOpen(false);
                          }}
                          className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-all ${isSelected
                            ? 'bg-pale-cyan/60 border border-turquoise text-navy'
                            : 'hover:bg-mint/40 text-text-primary'
                            }`}
                        >
                          <div className="mt-0.5">
                            {isSelected ? (
                              <CheckCircle2 className="w-4 h-4 text-teal" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-border" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-navy">{cfg.label}</span>
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${cfg.badgeColor.bg} ${cfg.badgeColor.text} ${cfg.badgeColor.border}`}
                              >
                                {cfg.badgeLabel}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 mt-1 border-t border-border px-2 flex items-center justify-between text-[11px] text-text-secondary">
                    <span>Active: {currentEmployee.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Reset all demo data back to factory seed state?')) {
                          resetDemoData();
                          setRoleMenuOpen(false);
                        }
                      }}
                      className="text-danger hover:underline font-semibold flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset Seed
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-mint transition-colors"
                aria-label="User profile menu"
              >
                <img
                  src={currentEmployee.avatar}
                  alt={currentEmployee.name}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-border"
                />
                <ChevronDown className="w-3.5 h-3.5 text-text-secondary hidden sm:block" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-border z-50 p-3">
                  <div className="flex items-center gap-3 pb-3 border-b border-border">
                    <img
                      src={currentEmployee.avatar}
                      alt={currentEmployee.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-turquoise/30"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-navy truncate">{currentEmployee.name}</p>
                      <p className="text-[11px] text-text-secondary truncate">{currentEmployee.email}</p>
                      <span
                        className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${roleConfig.badgeColor.bg} ${roleConfig.badgeColor.text} ${roleConfig.badgeColor.border}`}
                      >
                        {roleConfig.badgeLabel} Authority
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 space-y-1.5 text-xs text-text-secondary">
                    <div className="flex justify-between">
                      <span>Department:</span>
                      <span className="font-medium text-navy">{currentEmployee.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Authority Scope:</span>
                      <span className="font-medium text-teal">{currentRole}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-semibold text-teal">{currentEmployee.status}</span>
                    </div>
                  </div>

                  <div className="pt-3 mt-2 border-t border-border">
                    <Link
                      href={`/employees/${currentEmployee.id}`}
                      onClick={() => setProfileOpen(false)}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal hover:bg-teal-hover rounded-lg shadow-subtle transition-colors"
                    >
                      View Operational Profile
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:block border-t border-border bg-mint/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-11">

            <nav className="flex items-center gap-1.5 py-1">
              {navItems.map((item) => {
                const active = isLinkActive(item.href);

                let badgeText = '';
                if (item.name === 'Inventory' && lowStockItems.length > 0) {
                  badgeText = `${lowStockItems.length} low`;
                } else if (item.name === 'Purchases' && pendingPurchases.length > 0) {
                  badgeText = `${pendingPurchases.length} inbound`;
                } else if (item.name === 'Sales Orders' && draftSales.length > 0) {
                  badgeText = `${draftSales.length}`;
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${active
                      ? 'bg-navy text-white shadow-subtle'
                      : 'text-text-secondary hover:text-navy hover:bg-white/80'
                      }`}
                  >
                    <span>{item.name}</span>
                    {badgeText && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${active
                          ? 'bg-turquoise text-navy'
                          : 'bg-mint text-teal border border-teal/20'
                          }`}
                      >
                        {badgeText}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}

