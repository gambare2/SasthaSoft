import { Role, Permission, NavItem } from '@/types';
import { ROLE_PERMISSIONS } from './permissions';

export function hasPermission(role: Role, permission: Permission): boolean {
  if (!role || !permission) return false;
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

export function requirePermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Unauthorized: Role "${role}" lacks required permission "${permission}"`);
  }
}

export const MASTER_NAVIGATION: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    iconName: 'LayoutDashboard',
    requiredPermission: 'dashboard:view_employee',
  },
  {
    name: 'Inventory',
    href: '/inventory',
    iconName: 'Package',
    requiredPermission: 'inventory:view_catalog',
  },
  {
    name: 'Sales Orders',
    href: '/sales',
    iconName: 'ShoppingCart',
    requiredPermission: 'sales:view_own',
  },
  {
    name: 'Purchases',
    href: '/purchases',
    iconName: 'Truck',
    requiredPermission: 'purchases:view_own',
  },
  {
    name: 'Reports & Analytics',
    href: '/reports',
    iconName: 'BarChart3',
    requiredPermission: 'reports:view_operational',
  },
  {
    name: 'Contacts',
    href: '/contacts',
    iconName: 'Users',
    requiredPermission: 'contacts:view',
  },
  {
    name: 'Warehouses',
    href: '/warehouses',
    iconName: 'Warehouse',
    requiredPermission: 'warehouses:view',
  },
  {
    name: 'Employees',
    href: '/employees',
    iconName: 'UserCheck',
    requiredPermission: 'employees:view',
  },
  {
    name: 'Activity Log',
    href: '/activity',
    iconName: 'Clock',
    requiredPermission: 'activity:view_own',
  },
];

export function getNavigationForRole(role: Role): NavItem[] {
  if (role === 'ADMIN') {
    return [
      { name: 'Overview', href: '/dashboard', iconName: 'LayoutDashboard', requiredPermission: 'dashboard:view_admin' },
      { name: 'Inventory', href: '/inventory', iconName: 'Package', requiredPermission: 'inventory:view_all' },
      { name: 'Sales', href: '/sales', iconName: 'ShoppingCart', requiredPermission: 'sales:view_all' },
      { name: 'Purchases', href: '/purchases', iconName: 'Truck', requiredPermission: 'purchases:view_all' },
      { name: 'Reports', href: '/reports', iconName: 'BarChart3', requiredPermission: 'reports:view_all' },
      { name: 'Employees', href: '/employees', iconName: 'UserCheck', requiredPermission: 'employees:view' },
      { name: 'Contacts', href: '/contacts', iconName: 'Users', requiredPermission: 'contacts:view' },
      { name: 'Warehouses', href: '/warehouses', iconName: 'Warehouse', requiredPermission: 'warehouses:view' },
      { name: 'Activity', href: '/activity', iconName: 'Clock', requiredPermission: 'activity:view_all' },
    ];
  }
  if (role === 'MANAGER') {
    return [
      { name: 'Overview', href: '/dashboard', iconName: 'LayoutDashboard', requiredPermission: 'dashboard:view_manager' },
      { name: 'Inventory', href: '/inventory', iconName: 'Package', requiredPermission: 'inventory:view_all' },
      { name: 'Sales', href: '/sales', iconName: 'ShoppingCart', requiredPermission: 'sales:view_all' },
      { name: 'Purchases', href: '/purchases', iconName: 'Truck', requiredPermission: 'purchases:view_all' },
      { name: 'Reports', href: '/reports', iconName: 'BarChart3', requiredPermission: 'reports:view_operational' },
      { name: 'Contacts', href: '/contacts', iconName: 'Users', requiredPermission: 'contacts:view' },
      { name: 'Warehouses', href: '/warehouses', iconName: 'Warehouse', requiredPermission: 'warehouses:view' },
      { name: 'Activity', href: '/activity', iconName: 'Clock', requiredPermission: 'activity:view_team' },
    ];
  }

  return [
    { name: 'Overview', href: '/dashboard', iconName: 'LayoutDashboard', requiredPermission: 'dashboard:view_employee' },
    { name: 'Inventory', href: '/inventory', iconName: 'Package', requiredPermission: 'inventory:view_catalog' },
    { name: 'Sales Orders', href: '/sales', iconName: 'ShoppingCart', requiredPermission: 'sales:view_own' },
    { name: 'Purchases', href: '/purchases', iconName: 'Truck', requiredPermission: 'purchases:view_own' },
    { name: 'Activity', href: '/activity', iconName: 'Clock', requiredPermission: 'activity:view_own' },
  ];
}

export interface RoutePermissionRule {
  pathPattern: RegExp;
  requiredPermission?: Permission;
  requiredAny?: Permission[];
  description: string;
}

export const ROUTE_PERMISSION_RULES: RoutePermissionRule[] = [
  {
    pathPattern: /^\/dashboard(\/.*)?$/,
    requiredAny: ['dashboard:view_admin', 'dashboard:view_manager', 'dashboard:view_employee'],
    description: 'Dashboard access requires role dashboard permission',
  },
  {
    pathPattern: /^\/inventory\/new$/,
    requiredPermission: 'inventory:create',
    description: 'Creating new inventory records requires inventory:create',
  },
  {
    pathPattern: /^\/inventory(\/.*)?$/,
    requiredAny: ['inventory:view_all', 'inventory:view_catalog'],
    description: 'Viewing inventory requires view catalog or view all',
  },
  {
    pathPattern: /^\/sales\/new$/,
    requiredPermission: 'sales:create',
    description: 'Creating sales order requires sales:create',
  },
  {
    pathPattern: /^\/sales(\/.*)?$/,
    requiredAny: ['sales:view_all', 'sales:view_own'],
    description: 'Viewing sales requires sales:view_all or sales:view_own',
  },
  {
    pathPattern: /^\/purchases\/new$/,
    requiredPermission: 'purchases:create',
    description: 'Creating purchase order requires purchases:create',
  },
  {
    pathPattern: /^\/purchases(\/.*)?$/,
    requiredAny: ['purchases:view_all', 'purchases:view_own'],
    description: 'Viewing purchases requires purchases:view_all or purchases:view_own',
  },
  {
    pathPattern: /^\/reports(\/.*)?$/,
    requiredAny: ['reports:view_all', 'reports:view_operational'],
    description: 'Reports requires reports:view_operational or reports:view_all',
  },
  {
    pathPattern: /^\/employees(\/.*)?$/,
    requiredPermission: 'employees:view',
    description: 'Employee management requires employees:view (ADMIN only)',
  },
  {
    pathPattern: /^\/contacts(\/.*)?$/,
    requiredPermission: 'contacts:view',
    description: 'Contacts requires contacts:view (ADMIN or MANAGER)',
  },
  {
    pathPattern: /^\/warehouses(\/.*)?$/,
    requiredPermission: 'warehouses:view',
    description: 'Warehouses requires warehouses:view (ADMIN or MANAGER)',
  },
  {
    pathPattern: /^\/activity(\/.*)?$/,
    requiredAny: ['activity:view_all', 'activity:view_team', 'activity:view_own'],
    description: 'Activity logs view',
  },
];

export function isRouteAccessible(role: Role, pathname: string): boolean {

  const cleanPath = pathname.split('?')[0].split('#')[0] || '/';

  const matchedRule = ROUTE_PERMISSION_RULES.find((rule) => rule.pathPattern.test(cleanPath));

  if (!matchedRule) {

    return true;
  }

  if (matchedRule.requiredPermission) {
    return hasPermission(role, matchedRule.requiredPermission);
  }

  if (matchedRule.requiredAny) {
    return hasAnyPermission(role, matchedRule.requiredAny);
  }

  return true;
}

export function getRouteAccessRequirement(pathname: string): string | null {
  const cleanPath = pathname.split('?')[0].split('#')[0] || '/';
  const matchedRule = ROUTE_PERMISSION_RULES.find((rule) => rule.pathPattern.test(cleanPath));
  return matchedRule ? matchedRule.description : null;
}

