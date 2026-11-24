'use client';

import React from 'react';
import { useRole } from '@/context/AppProvider';
import { AdminDashboard, ManagerDashboard, EmployeeDashboard } from '@/features/dashboard';

export default function DashboardPage() {
  const { currentRole } = useRole();

  if (currentRole === 'MANAGER') {
    return <ManagerDashboard />;
  }

  if (currentRole === 'EMPLOYEE') {
    return <EmployeeDashboard />;
  }

  return <AdminDashboard />;
}

