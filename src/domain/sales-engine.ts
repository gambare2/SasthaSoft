import {
  SalesOrder,
  OrderItem,
  Product,
  Customer,
  Warehouse,
  StockMovement,
  ActivityLog,
  OperationResult,
} from '@/types';
import { calculateItemTotal, calculateOrderTotals } from './calculations';
import { calculateStockStatus, createStockMovement, validateStockAvailability } from './inventory-engine';
import { hasPermission } from '@/permissions/access-control';
import { UserContext } from './inventory-engine';

export interface CreateSalesOrderParams {
  customerId: string;
  warehouseId: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    tax?: number;
  }[];
  notes?: string;
}

export function getSalesByEmployee(orders: SalesOrder[], employeeId: string): SalesOrder[] {
  return orders.filter((order) => order.createdBy === employeeId);
}

export function calculateTotalSalesRevenue(
  orders: SalesOrder[],
  includePending = false
): number {
  return orders
    .filter((o) => {
      if (o.status === 'CANCELLED') return false;
      if (o.status === 'CONFIRMED' || (o.status as string) === 'SHIPPED' || (o.status as string) === 'DELIVERED') return true;
      return includePending && (o.status === 'PENDING' || o.status === 'DRAFT');
    })
    .reduce((sum, o) => sum + o.totalAmount, 0);
}

export function getSalesMetrics(orders: SalesOrder[]) {
  const totalOrders = orders.length;
  const confirmedOrders = orders.filter(
    (o) => o.status === 'CONFIRMED' || (o.status as string) === 'SHIPPED' || (o.status as string) === 'DELIVERED'
  );
  const pendingOrders = orders.filter((o) => o.status === 'PENDING' || o.status === 'DRAFT');
  const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED');
  const totalRevenue = confirmedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  return {
    totalOrders,
    confirmedCount: confirmedOrders.length,
    pendingCount: pendingOrders.length,
    cancelledCount: cancelledOrders.length,
    totalRevenue,
    averageOrderValue: confirmedOrders.length > 0 ? totalRevenue / confirmedOrders.length : 0,
  };
}

export function createSalesOrder(
  params: CreateSalesOrderParams,
  customers: Customer[],
  warehouses: Warehouse[],
  products: Product[],
  context: UserContext
): OperationResult<{ order: SalesOrder; activityLog: ActivityLog }> {

  if (!hasPermission(context.role, 'sales:create')) {
    return { success: false, error: `Unauthorized: Role "${context.role}" cannot create sales orders.` };
  }

  const customer = customers.find((c) => c.id === params.customerId);
  if (!customer) {
    return { success: false, error: `Customer with ID "${params.customerId}" not found.` };
  }

  const warehouse = warehouses.find((w) => w.id === params.warehouseId);
  if (!warehouse) {
    return { success: false, error: `Warehouse with ID "${params.warehouseId}" not found.` };
  }

  if (!params.items || params.items.length === 0) {
    return { success: false, error: 'Sales order must contain at least one line item.' };
  }

  const orderItems: OrderItem[] = [];

  for (const item of params.items) {
    if (item.quantity <= 0) {
      return { success: false, error: `Invalid order quantity ${item.quantity}. Must be greater than 0.` };
    }
    if (item.unitPrice <= 0) {
      return { success: false, error: `Invalid unit price ${item.unitPrice}. Must be greater than 0.` };
    }

    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      return { success: false, error: `Product with ID "${item.productId}" not found in catalog.` };
    }

    const itemTotal = calculateItemTotal(
      item.quantity,
      item.unitPrice,
      item.discount || 0,
      item.tax !== undefined ? item.tax : 18
    );

    orderItems.push({
      id: `soi-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: Math.floor(item.quantity),
      unitPrice: item.unitPrice,
      discount: item.discount || 0,
      tax: item.tax !== undefined ? item.tax : 18,
      subtotal: itemTotal.total,
    });
  }

  const totals = calculateOrderTotals(orderItems);
  const now = new Date().toISOString();
  const orderNumber = `SO-2026-${1000 + Math.floor(Math.random() * 9000)}`;

  const order: SalesOrder = {
    id: `so-${Date.now()}`,
    orderNumber,
    customerId: customer.id,
    customerName: customer.name,
    warehouseId: warehouse.id,
    warehouseName: warehouse.name,
    orderDate: now,
    items: orderItems,
    subtotal: totals.subtotal,
    taxAmount: totals.taxAmount,
    totalAmount: totals.totalAmount,
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    notes: params.notes?.trim() || '',
    createdBy: context.employee.id,
    createdByName: context.employee.name,
    createdAt: now,
  };

  const activityLog: ActivityLog = {
    id: `act-${Date.now()}`,
    employeeId: context.employee.id,
    employeeName: context.employee.name,
    employeeRole: context.role,
    action: 'Sales Order Created',
    module: 'SALES',
    details: `${context.employee.name} created sales order ${order.orderNumber} for ${customer.name}.`,
    description: `Created sales order ${order.orderNumber}`,
    referenceId: order.id,
    timestamp: now,
  };

  return {
    success: true,
    data: { order, activityLog },
    movements: [],
    activityLog,
    message: `Sales order ${order.orderNumber} created successfully.`,
  };
}

export function confirmSalesOrder(
  so: SalesOrder,
  products: Product[],
  context: UserContext
): OperationResult<{ order: SalesOrder; updatedProducts: Product[]; movements: StockMovement[]; activityLog: ActivityLog }> {

  if (!hasPermission(context.role, 'sales:confirm')) {
    return { success: false, error: `Unauthorized: Role "${context.role}" cannot confirm sales orders.` };
  }

  if (so.status === 'CONFIRMED' || (so.status as string) === 'SHIPPED' || (so.status as string) === 'DELIVERED') {
    return {
      success: false,
      error: `Sales order ${so.orderNumber} has already been confirmed on ${so.confirmedDate || 'record'}. Duplicate confirmation is rejected.`,
      code: 'DUPLICATE_CONFIRMATION',
    };
  }

  if (so.status === 'CANCELLED') {
    return {
      success: false,
      error: `Cannot confirm cancelled sales order ${so.orderNumber}.`,
      code: 'ORDER_CANCELLED',
    };
  }

  const stockCheck = validateStockAvailability(products, so.items);
  if (!stockCheck.success) {
    return {
      success: false,
      error: stockCheck.error,
      code: stockCheck.code || 'INSUFFICIENT_STOCK',
    };
  }

  const now = new Date().toISOString();
  const movements: StockMovement[] = [];
  const updatedProductsMap = new Map<string, Product>();

  for (const p of products) {
    updatedProductsMap.set(p.id, { ...p });
  }

  for (const item of so.items) {
    const product = updatedProductsMap.get(item.productId)!;
    const previousQuantity = product.currentStock;
    const newQuantity = previousQuantity - item.quantity;

    if (newQuantity < 0) {
      return {
        success: false,
        error: `Transaction safety violation: Stock for "${product.name}" would become negative (${newQuantity}). Confirmation aborted.`,
        code: 'NEGATIVE_STOCK_PREVENTED',
      };
    }

    product.currentStock = newQuantity;
    product.status = calculateStockStatus(newQuantity, product.minStockLevel);
    product.updatedAt = now;

    const movement = createStockMovement({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      warehouseId: so.warehouseId,
      type: 'SALE',
      quantity: item.quantity,
      previousQuantity,
      newQuantity,
      referenceType: 'SALE',
      referenceId: so.id,
      reason: `Confirmed sales order ${so.orderNumber} for ${so.customerName}`,
      performedBy: context.employee.name,
      timestamp: now,
    });

    movements.push(movement);
  }

  const updatedOrder: SalesOrder = {
    ...so,
    status: 'CONFIRMED',
    confirmedBy: context.employee.id,
    confirmedDate: now,
  };

  const activityLog: ActivityLog = {
    id: `act-${Date.now()}`,
    employeeId: context.employee.id,
    employeeName: context.employee.name,
    employeeRole: context.role,
    action: 'Sales Order Confirmed',
    module: 'SALES',
    details: `${context.employee.name} confirmed sales order ${so.orderNumber}. Inventory deducted for ${so.items.length} items.`,
    description: `Confirmed sales order ${so.orderNumber}`,
    referenceId: so.id,
    timestamp: now,
  };

  const updatedProducts = Array.from(updatedProductsMap.values());

  return {
    success: true,
    data: {
      order: updatedOrder,
      updatedProducts,
      movements,
      activityLog,
    },
    movements,
    activityLog,
    message: `Sales order ${so.orderNumber} confirmed. Stock deducted for ${so.items.length} items.`,
  };
}

export function cancelSalesOrder(
  so: SalesOrder,
  products: Product[],
  context: UserContext
): OperationResult<{ order: SalesOrder; updatedProducts: Product[]; movements: StockMovement[]; activityLog: ActivityLog }> {

  if (so.status === 'CANCELLED') {
    return {
      success: false,
      error: `Sales order ${so.orderNumber} is already cancelled. Duplicate cancellation is rejected.`,
      code: 'DUPLICATE_CANCELLATION',
    };
  }

  const wasConfirmed =
    so.status === 'CONFIRMED' ||
    (so.status as string) === 'SHIPPED' ||
    (so.status as string) === 'DELIVERED';

  if (wasConfirmed) {
    if (!hasPermission(context.role, 'transactions:authorize_reversals')) {
      return {
        success: false,
        error: `Unauthorized: Role "${context.role}" cannot reverse confirmed sales transactions. Administrator authorization required.`,
      };
    }
  }

  const now = new Date().toISOString();
  const movements: StockMovement[] = [];
  const updatedProductsMap = new Map<string, Product>();

  for (const p of products) {
    updatedProductsMap.set(p.id, { ...p });
  }

  if (wasConfirmed) {
    for (const item of so.items) {
      const product = updatedProductsMap.get(item.productId);
      if (!product) {
        return { success: false, error: `Product "${item.productName}" not found during cancellation reversal.` };
      }

      const previousQuantity = product.currentStock;
      const newQuantity = previousQuantity + item.quantity;

      product.currentStock = newQuantity;
      product.status = calculateStockStatus(newQuantity, product.minStockLevel);
      product.updatedAt = now;

      const movement = createStockMovement({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        warehouseId: so.warehouseId,
        type: 'SALE_REVERSAL',
        quantity: item.quantity,
        previousQuantity,
        newQuantity,
        referenceType: 'SALE_REVERSAL',
        referenceId: so.id,
        reason: `Cancelled confirmed sales order ${so.orderNumber} (reversal)`,
        performedBy: context.employee.name,
        timestamp: now,
      });

      movements.push(movement);
    }
  }

  const updatedOrder: SalesOrder = {
    ...so,
    status: 'CANCELLED',
    cancelledBy: context.employee.id,
    cancelledDate: now,
    reversalMovementIds: movements.map((m) => m.id),
  };

  const activityLog: ActivityLog = {
    id: `act-${Date.now()}`,
    employeeId: context.employee.id,
    employeeName: context.employee.name,
    employeeRole: context.role,
    action: wasConfirmed ? 'Sales Order Reversed & Cancelled' : 'Sales Order Cancelled',
    module: 'SALES',
    details: wasConfirmed
      ? `${context.employee.name} authorized reversal and cancelled confirmed sales order ${so.orderNumber}. Stock restored for ${so.items.length} items.`
      : `${context.employee.name} cancelled pending sales order ${so.orderNumber}.`,
    description: `Cancelled sales order ${so.orderNumber}`,
    referenceId: so.id,
    timestamp: now,
  };

  const updatedProducts = Array.from(updatedProductsMap.values());

  return {
    success: true,
    data: {
      order: updatedOrder,
      updatedProducts,
      movements,
      activityLog,
    },
    movements,
    activityLog,
    message: wasConfirmed
      ? `Sales order ${so.orderNumber} cancelled and stock restored.`
      : `Sales order ${so.orderNumber} cancelled.`,
  };
}

