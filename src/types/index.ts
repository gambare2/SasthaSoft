export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export type Permission =

  | 'dashboard:view_admin'
  | 'dashboard:view_manager'
  | 'dashboard:view_employee'
  | 'analytics:view_all'
  | 'analytics:view_operational'

  | 'inventory:view_all'
  | 'inventory:view_catalog'
  | 'inventory:create'
  | 'inventory:edit'
  | 'inventory:delete'
  | 'inventory:adjust_stock'

  | 'sales:view_all'
  | 'sales:view_own'
  | 'sales:create'
  | 'sales:confirm'
  | 'sales:edit'
  | 'sales:delete'
  | 'sales:cancel'

  | 'purchases:view_all'
  | 'purchases:view_own'
  | 'purchases:create'
  | 'purchases:receive'
  | 'purchases:edit'
  | 'purchases:delete'
  | 'purchases:cancel'

  | 'reports:view_all'
  | 'reports:view_operational'
  | 'reports:export'

  | 'employees:view'
  | 'employees:manage'
  | 'employees:assign_roles'

  | 'contacts:view'
  | 'contacts:manage'

  | 'warehouses:view'
  | 'warehouses:manage'

  | 'activity:view_all'
  | 'activity:view_team'
  | 'activity:view_own'

  | 'transactions:authorize_reversals';

export interface Employee {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: Role;
  department: string;
  title: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
  joinedDate: string;
  assignedWarehouseId?: string;
}

export type ProductCategory =
  | 'Electronics'
  | 'Hardware'
  | 'Packaging'
  | 'Office Supplies'
  | 'Industrial Equipment'
  | 'Raw Materials';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: ProductCategory;
  barcode: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStockLevel: number;
  reorderPoint: number;
  maxStockLevel: number;
  unit: string;
  warehouseId: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  gstin?: string;
  balance: number;
  creditLimit: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  contactPerson?: string;
  billingAddress?: string;
  shippingAddress?: string;
  paymentTerms?: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  contactPerson: string;
  gstin?: string;
  paymentTerms: string;
  rating?: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  location: string;
  address: string;
  city: string;
  state: string;
  capacity: number;
  currentUtilization: number;
  managerId: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  subtotal: number;
}

export type PurchaseOrderStatus = 'DRAFT' | 'PENDING' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: PurchaseOrderStatus;
  notes?: string;
  createdBy: string;
  createdByName: string;
  receivedBy?: string;
  receivedDate?: string;
  cancelledBy?: string;
  cancelledDate?: string;
  reversalMovementIds?: string[];
  createdAt: string;
}

export type SalesOrderStatus = 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  warehouseId: string;
  warehouseName: string;
  orderDate: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: SalesOrderStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdBy: string;
  createdByName: string;
  confirmedBy?: string;
  confirmedDate?: string;
  cancelledBy?: string;
  cancelledDate?: string;
  reversalMovementIds?: string[];
  createdAt: string;
}

export type StockMovementType =
  | 'OPENING'
  | 'PURCHASE'
  | 'SALE'
  | 'ADJUSTMENT'
  | 'PURCHASE_REVERSAL'
  | 'SALE_REVERSAL';

export type StockReferenceType =
  | 'INITIAL'
  | 'PURCHASE'
  | 'SALE'
  | 'ADJUSTMENT'
  | 'PURCHASE_REVERSAL'
  | 'SALE_REVERSAL';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  warehouseId: string;
  type: StockMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  previousStock?: number;
  newStock?: number;
  referenceType: StockReferenceType;
  referenceId?: string;
  reason: string;
  performedBy: string;
  createdAt: string;
  timestamp?: string;
}

export type ActivityModule =
  | 'INVENTORY'
  | 'SALES'
  | 'PURCHASES'
  | 'EMPLOYEES'
  | 'CONTACTS'
  | 'WAREHOUSES'
  | 'REPORTS'
  | 'SYSTEM';

export interface ActivityLog {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: Role;
  action: string;
  module: ActivityModule;
  details: string;
  description?: string;
  referenceId?: string;
  timestamp: string;
  ipAddress?: string;
}

export interface OperationSuccess<T> {
  success: true;
  data: T;
  movements?: StockMovement[];
  activityLog?: ActivityLog;
  message?: string;
}

export interface OperationFailure {
  success: false;
  error: string;
  code?: string;
}

export type OperationResult<T> = OperationSuccess<T> | OperationFailure;

export interface NavItem {
  name: string;
  href: string;
  iconName: string;
  badge?: string | number;
  badgeVariant?: 'blue' | 'yellow' | 'red';
  requiredPermission: Permission;
  children?: {
    name: string;
    href: string;
    requiredPermission: Permission;
  }[];
}

export interface CreateEmployeeParams {
  name: string;
  email: string;
  phone: string;
  department: string;
  title: string;
  role: Role;
  joinedDate?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  assignedWarehouseId?: string;
  avatar?: string;
}

export interface UpdateEmployeeParams {
  name?: string;
  email?: string;
  phone?: string;
  department?: string;
  title?: string;
  role?: Role;
  status?: 'ACTIVE' | 'INACTIVE';
  assignedWarehouseId?: string;
  avatar?: string;
}

export interface CreateCustomerParams {
  code?: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  gstin?: string;
  creditLimit?: number;
  balance?: number;
  billingAddress?: string;
  shippingAddress?: string;
  paymentTerms?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateCustomerParams {
  code?: string;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  gstin?: string;
  creditLimit?: number;
  balance?: number;
  billingAddress?: string;
  shippingAddress?: string;
  paymentTerms?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface CreateSupplierParams {
  code?: string;
  name?: string;
  company: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  gstin?: string;
  paymentTerms: string;
  rating?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateSupplierParams {
  code?: string;
  name?: string;
  company?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  gstin?: string;
  paymentTerms?: string;
  rating?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface CreateWarehouseParams {
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  location?: string;
  capacity: number;
  managerId: string;
  status?: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
}

export interface UpdateWarehouseParams {
  name?: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  location?: string;
  capacity?: number;
  managerId?: string;
  status?: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
}

