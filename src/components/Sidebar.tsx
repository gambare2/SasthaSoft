'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  BarChart3,
  Users,
  Warehouse as WarehouseIcon,
  UserCheck,
  Clock,
  Layers,
  ChevronRight,
  X,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { useRole, useApp } from '@/context/AppProvider';
import { getNavigationForRole } from '@/permissions/access-control';
import { ROLES, ALL_ROLES } from '@/permissions/roles';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  BarChart3,
  Users,
  Warehouse: WarehouseIcon,
  UserCheck,
  Clock,
};

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { currentRole, currentEmployee, setDemoRole } = useRole();
  const { state, resetDemoData } = useApp();

  const navItems = getNavigationForRole(currentRole);
  const roleConfig = ROLES[currentRole];

  const lowStockCount = state.products.filter((p) => p.currentStock <= p.minStockLevel).length;
  const pendingOrdersCount = state.salesOrders.filter((s) => s.status === 'DRAFT' || s.status === 'PENDING').length;
  const pendingPurchasesCount = state.purchaseOrders.filter((p) => p.status === 'PENDING' || p.status === 'DRAFT').length;
  const totalAlerts = lowStockCount + pendingOrdersCount + pendingPurchasesCount;

  const getBadgeForItem = (name: string) => {
    if (name === 'Inventory' && lowStockCount > 0) {
      return { text: `${lowStockCount} low`, bg: 'bg-mint text-teal border-teal/20' };
    }
    if (name === 'Sales Orders' && pendingOrdersCount > 0) {
      return { text: `${pendingOrdersCount} draft`, bg: 'bg-pale-cyan text-navy border-pale-cyan-dark/20' };
    }
    if (name === 'Purchases' && pendingPurchasesCount > 0) {
      return { text: `${pendingPurchasesCount} inbound`, bg: 'bg-mint text-teal border-teal/20' };
    }
    return null;
  };

  const isLinkActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-80 max-w-[85vw] bg-white border-r border-border text-navy transition-transform duration-300 ease-in-out lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >

        <div className="flex items-center justify-between h-14 sm:h-16 px-5 border-b border-border">
          <Link href="/dashboard" onClick={onCloseMobile} className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-mint border border-teal/20 text-navy shadow-2xs">
              <Layers className="w-4 h-4 text-teal stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-navy">SasthaSoft</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-mint text-teal border border-teal/20">
                  Nexus
                </span>
              </div>
            </div>
          </Link>

          <button
            type="button"
            className="p-1 rounded-md text-text-secondary hover:text-navy hover:bg-mint transition-colors"
            onClick={onCloseMobile}
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">

          <div className="p-3 bg-mint/40 rounded-xl border border-border space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary uppercase tracking-wider text-[10px] font-bold">
                Role Switcher
              </span>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${roleConfig.badgeColor.bg} ${roleConfig.badgeColor.text} ${roleConfig.badgeColor.border}`}
              >
                {roleConfig.badgeLabel} Active
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {ALL_ROLES.map((role) => {
                const isSelected = currentRole === role;
                const cfg = ROLES[role];
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setDemoRole(role)}
                    className={`py-1.5 px-2 rounded-lg text-center text-xs font-bold transition-all ${isSelected
                      ? 'bg-navy text-white shadow-subtle'
                      : 'bg-white border border-border text-text-secondary hover:text-navy hover:bg-mint/60'
                      }`}
                  >
                    {cfg.badgeLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {totalAlerts > 0 && (
            <div className="p-3 bg-pale-cyan/50 rounded-xl border border-pale-cyan-dark/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-navy text-[11px] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                  Actionable Alerts
                </span>
                <span className="text-[10px] bg-white text-teal px-1.5 py-0.2 rounded-full font-bold shadow-2xs border border-teal/20">
                  {totalAlerts}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
                {lowStockCount > 0 && (
                  <Link
                    href="/inventory"
                    onClick={onCloseMobile}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-border text-navy font-semibold hover:bg-mint"
                  >
                    <span>{lowStockCount} Low Stock</span>
                    <ChevronRight className="w-3 h-3 text-teal" />
                  </Link>
                )}
                {pendingPurchasesCount > 0 && (
                  <Link
                    href="/purchases"
                    onClick={onCloseMobile}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-border text-navy font-semibold hover:bg-mint"
                  >
                    <span>{pendingPurchasesCount} Inbound POs</span>
                    <ChevronRight className="w-3 h-3 text-teal" />
                  </Link>
                )}
                {pendingOrdersCount > 0 && (
                  <Link
                    href="/sales"
                    onClick={onCloseMobile}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-border text-navy font-semibold hover:bg-mint"
                  >
                    <span>{pendingOrdersCount} Sales Orders</span>
                    <ChevronRight className="w-3 h-3 text-teal" />
                  </Link>
                )}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
              Navigation Modules
            </div>

            {navItems.map((item) => {
              const Icon = ICON_MAP[item.iconName] || Package;
              const active = isLinkActive(item.href);
              const badge = getBadgeForItem(item.name);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${active
                    ? 'bg-navy text-white shadow-subtle'
                    : 'text-text-secondary hover:bg-mint/40 hover:text-navy'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${active ? 'text-turquoise' : 'text-text-secondary'}`} />
                    <span>{item.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {badge && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${active
                          ? 'bg-turquoise text-navy border-transparent'
                          : badge.bg
                          }`}
                      >
                        {badge.text}
                      </span>
                    )}
                    {active ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-turquoise" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-text-secondary/50" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset all demo data back to factory seed state?')) {
                  resetDemoData();
                  if (onCloseMobile) onCloseMobile();
                }
              }}
              className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-xs font-semibold text-danger bg-danger/5 hover:bg-danger/10 border border-danger/20 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Demo Seed Data
            </button>
          </div>
        </div>

        <div className="p-3 border-t border-border bg-mint/20">
          <Link
            href={`/employees/${currentEmployee.id}`}
            onClick={onCloseMobile}
            className="flex items-center gap-3 p-2 rounded-lg bg-white hover:bg-mint border border-border shadow-2xs transition-colors"
          >
            <img
              src={currentEmployee.avatar}
              alt={currentEmployee.name}
              className="w-9 h-9 rounded-full object-cover ring-1 ring-border"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-navy truncate">{currentEmployee.name}</p>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${roleConfig.badgeColor.bg} ${roleConfig.badgeColor.text} ${roleConfig.badgeColor.border}`}
                >
                  {roleConfig.badgeLabel}
                </span>
              </div>
              <p className="text-[10px] text-text-secondary truncate mt-0.5">{currentEmployee.title}</p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}

