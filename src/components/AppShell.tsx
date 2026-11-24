'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useRole } from '@/context/AppProvider';
import { isRouteAccessible, getRouteAccessRequirement } from '@/permissions/access-control';
import { ROLES } from '@/permissions/roles';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { currentRole, setDemoRole } = useRole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAllowed = isRouteAccessible(currentRole, pathname);
  const requirementDescription = getRouteAccessRequirement(pathname);

  return (
    <div className="flex flex-col min-h-screen bg-workspace text-text-primary">

      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <Navbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {isAllowed ? (
          children
        ) : (

          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-lg p-8 bg-white border border-border rounded-2xl shadow-panel text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 mb-4 rounded-xl bg-pale-cyan text-teal border border-turquoise/30">
                <ShieldAlert className="w-7 h-7" />
              </div>

              <div className="inline-block px-3 py-1 mb-3 text-xs font-bold uppercase tracking-wider text-danger bg-danger/10 rounded-full border border-danger/20">
                Access Restricted (403)
              </div>

              <h2 className="text-lg font-bold text-navy mb-2">
                Role Permission Required
              </h2>

              <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                Your current demo role (<strong className="text-navy">{ROLES[currentRole].label}</strong>)
                does not possess authorization to view <code className="px-1.5 py-0.5 text-xs bg-mint rounded text-teal font-mono">{pathname}</code>
              </p>

              {requirementDescription && (
                <div className="p-3 mb-6 text-xs text-left bg-mint/40 rounded-xl border border-mint-dark">
                  <span className="font-semibold text-navy block mb-1">Policy Scope Requirement:</span>
                  <span className="text-text-secondary">{requirementDescription}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-text-secondary bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Return to Overview
                </Link>

                {currentRole !== 'ADMIN' && (
                  <button
                    type="button"
                    onClick={() => setDemoRole('ADMIN')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal hover:bg-teal-hover rounded-lg transition-colors shadow-2xs"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Switch to Admin Role
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

