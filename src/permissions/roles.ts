import { Role } from '@/types';

export interface RoleConfig {
  key: Role;
  label: string;
  badgeLabel: string;
  description: string;
  badgeColor: {
    bg: string;
    text: string;
    border: string;
  };
  sampleEmployeeId: string;
  sampleEmployeeName: string;
}

export const ROLES: Record<Role, RoleConfig> = {
  ADMIN: {
    key: 'ADMIN',
    label: 'Head of Operations & Systems',
    badgeLabel: 'Admin',
    description: 'Full system authority, business analytics, user management, and transaction reversals.',
    badgeColor: {
      bg: 'bg-navy',
      text: 'text-white',
      border: 'border-navy',
    },
    sampleEmployeeId: 'emp-001',
    sampleEmployeeName: 'Rajesh Sharma',
  },
  MANAGER: {
    key: 'MANAGER',
    label: 'Operations & Inventory Manager',
    badgeLabel: 'Manager',
    description: 'Operational control over inventory, orders, team workflows, and departmental reports.',
    badgeColor: {
      bg: 'bg-pale-cyan',
      text: 'text-navy',
      border: 'border-turquoise',
    },
    sampleEmployeeId: 'emp-002',
    sampleEmployeeName: 'Priya Sundaram',
  },
  EMPLOYEE: {
    key: 'EMPLOYEE',
    label: 'Warehouse & Sales Associate',
    badgeLabel: 'Employee',
    description: 'Operational task execution: catalog lookup, stock additions, order creation, and receiving.',
    badgeColor: {
      bg: 'bg-mint',
      text: 'text-teal',
      border: 'border-[#D5ECE7]',
    },
    sampleEmployeeId: 'emp-003',
    sampleEmployeeName: 'Amit Patel',
  },
};

export const ALL_ROLES: Role[] = ['ADMIN', 'MANAGER', 'EMPLOYEE'];

