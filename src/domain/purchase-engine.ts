import {
  PurchaseOrder,
  OrderItem,
  Product,
  Supplier,
  Warehouse,
  StockMovement,
  ActivityLog,
  OperationResult,
} from '@/types';
import { calculateItemTotal, calculateOrderTotals } from './calculations';
import { calculateStockStatus, createStockMovement } from './inventory-engine';
import { hasPermission } from '@/permissions/access-control';
import { UserContext } from './inventory-engine';

export interface CreatePurchaseOrderParams {
  supplierId: string;
  warehouseId: string;
  expectedDeliveryDate: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    tax?: number;
  }[];
  notes?: string;
}

export function getPurchasesByEmployee(
  orders: PurchaseOrder[],
  employeeId: string
): PurchaseOrder[] {
  return orders.filter((order) => order.createdBy === employeeId);
}

export function calculateTotalPurchaseSpend(
  orders: PurchaseOrder[],
  includePending = true
): number {
  return orders
    .filter((o) => {
      if (o.status === 'CANCELLED') return false;
      if (o.status === 'RECEIVED') return true;
      return includePending && (o.status === 'PENDING' || (o.status as string) === 'ORDERED');
    })
    .reduce((sum, o) => sum + o.totalAmount, 0);
}

export function getPurchaseMetrics(orders: PurchaseOrder[]) {
  const totalOrders = orders.length;
  const receivedOrders = orders.filter((o) => o.status === 'RECEIVED');
  const pendingOrders = orders.filter((o) => o.status === 'PENDING' || (o.status as string) === 'ORDERED');
  const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED');
  const totalSpend = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return {
    totalOrders,
    receivedCount: receivedOrders.length,
    pendingCount: pendingOrders.length,
    cancelledCount: cancelledOrders.length,
    totalSpend,
  };
}

export function createPurchaseOrder(
  params: CreatePurchaseOrderParams,
  suppliers: Supplier[],
  warehouses: Warehouse[],
  products: Product[],
  context: UserContext
): OperationResult<{ order: PurchaseOrder; activityLog: ActivityLog }> {

  if (!hasPermission(context.role, 'purchases:create')) {
    return { success: false, error: `Unauthorized: Role "${context.role}" cannot create purchase orders.` };
  }

  const supplier = suppliers.find((s) => s.id === params.supplierId);
  if (!supplier) {
    return { success: false, error: `Supplier with ID "${params.supplierId}" not found.` };
  }

  const warehouse = warehouses.find((w) => w.id === params.warehouseId);
  if (!warehouse) {
    return { success: false, error: `Warehouse with ID "${params.warehouseId}" not found.` };
  }

  if (!params.items || params.items.length === 0) {
    return { success: false, error: 'Purchase order must contain at least one line item.' };
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
      id: `poi-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
  const orderNumber = `PO-2026-${1000 + Math.floor(Math.random() * 9000)}`;

  const order: PurchaseOrder = {
    id: `po-${Date.now()}`,
    orderNumber,
    supplierId: supplier.id,
    supplierName: supplier.name,
    warehouseId: warehouse.id,
    warehouseName: warehouse.name,
    orderDate: now,
    expectedDeliveryDate: params.expectedDeliveryDate || now,
    items: orderItems,
    subtotal: totals.subtotal,
    taxAmount: totals.taxAmount,
    totalAmount: totals.totalAmount,
    status: 'PENDING',
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
    action: 'Purchase Order Created',
    module: 'PURCHASES',
    details: `${context.employee.name} created purchase order ${order.orderNumber} for ${supplier.name}.`,
    description: `Created purchase order ${order.orderNumber}`,
    referenceId: order.id,
    timestamp: now,
  };

  return {
    success: true,
    data: { order, activityLog },
    movements: [],
    activityLog,
    message: `Purchase order ${order.orderNumber} created successfully.`,
  };
}

export function receivePurchaseOrder(
  po: PurchaseOrder,
  products: Product[],
  context: UserContext
): OperationResult<{ order: PurchaseOrder; updatedProducts: Product[]; movements: StockMovement[]; activityLog: ActivityLog }> {

  if (!hasPermission(context.role, 'purchases:receive')) {
    return { success: false, error: `Unauthorized: Role "${context.role}" cannot receive purchase orders.` };
  }

  if (po.status === 'RECEIVED') {
    return {
      success: false,
      error: `Purchase order ${po.orderNumber} has already been received on ${po.receivedDate || 'record'}. Duplicate receiving is rejected.`,
      code: 'DUPLICATE_RECEIVING',
    };
  }

  if (po.status === 'CANCELLED') {
    return {
      success: false,
      error: `Cannot receive cancelled purchase order ${po.orderNumber}.`,
      code: 'ORDER_CANCELLED',
    };
  }

  for (const item of po.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      return { success: false, error: `Product "${item.productName}" (ID: ${item.productId}) does not exist in inventory.` };
    }
  }

  const now = new Date().toISOString();
  const movements: StockMovement[] = [];
  const updatedProductsMap = new Map<string, Product>();

  for (const p of products) {
    updatedProductsMap.set(p.id, { ...p });
  }

  for (const item of po.items) {
    const product = updatedProductsMap.get(item.productId)!;
    const previousQuantity = product.currentStock;
    const newQuantity = previousQuantity + item.quantity;

    product.currentStock = newQuantity;
    product.status = calculateStockStatus(newQuantity, product.minStockLevel);
    product.updatedAt = now;

    const movement = createStockMovement({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      warehouseId: po.warehouseId,
      type: 'PURCHASE',
      quantity: item.quantity,
      previousQuantity,
      newQuantity,
      referenceType: 'PURCHASE',
      referenceId: po.id,
      reason: `Received purchase order ${po.orderNumber} from ${po.supplierName}`,
      performedBy: context.employee.name,
      timestamp: now,
    });

    movements.push(movement);
  }

  const updatedOrder: PurchaseOrder = {
    ...po,
    status: 'RECEIVED',
    receivedBy: context.employee.id,
    receivedDate: now,
  };

  const activityLog: ActivityLog = {
    id: `act-${Date.now()}`,
    employeeId: context.employee.id,
    employeeName: context.employee.name,
    employeeRole: context.role,
    action: 'Purchase Order Received',
    module: 'PURCHASES',
    details: `${context.employee.name} received purchase order ${po.orderNumber} into ${po.warehouseName}. Stock updated for ${po.items.length} items.`,
    description: `Received purchase order ${po.orderNumber}`,
    referenceId: po.id,
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
    message: `Purchase order ${po.orderNumber} received successfully. Stock added for ${po.items.length} items.`,
  };
}

export function cancelPurchaseOrder(
  po: PurchaseOrder,
  products: Product[],
  context: UserContext
): OperationResult<{ order: PurchaseOrder; updatedProducts: Product[]; movements: StockMovement[]; activityLog: ActivityLog }> {

  if (po.status === 'CANCELLED') {
    return {
      success: false,
      error: `Purchase order ${po.orderNumber} is already cancelled. Duplicate cancellation is rejected.`,
      code: 'DUPLICATE_CANCELLATION',
    };
  }

  const wasReceived = po.status === 'RECEIVED';

  if (wasReceived) {
    if (!hasPermission(context.role, 'transactions:authorize_reversals')) {
      return {
        success: false,
        error: `Unauthorized: Role "${context.role}" cannot reverse completed purchase receipts. Administrator authorization required.`,
      };
    }

    for (const item of po.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return { success: false, error: `Product "${item.productName}" not found during reversal.` };
      }
      if (product.currentStock < item.quantity) {
        return {
          success: false,
          error: `Cannot reverse PO ${po.orderNumber}: Stock for "${product.name}" is ${product.currentStock} ${product.unit}, which is less than received quantity ${item.quantity} ${product.unit} (items have already been fulfilled/sold).`,
          code: 'REVERSAL_WOULD_CAUSE_NEGATIVE_STOCK',
        };
      }
    }
  }

  const now = new Date().toISOString();
  const movements: StockMovement[] = [];
  const updatedProductsMap = new Map<string, Product>();

  for (const p of products) {
    updatedProductsMap.set(p.id, { ...p });
  }

  if (wasReceived) {
    for (const item of po.items) {
      const product = updatedProductsMap.get(item.productId)!;
      const previousQuantity = product.currentStock;
      const newQuantity = Math.max(0, previousQuantity - item.quantity);

      product.currentStock = newQuantity;
      product.status = calculateStockStatus(newQuantity, product.minStockLevel);
      product.updatedAt = now;

      const movement = createStockMovement({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        warehouseId: po.warehouseId,
        type: 'PURCHASE_REVERSAL',
        quantity: item.quantity,
        previousQuantity,
        newQuantity,
        referenceType: 'PURCHASE_REVERSAL',
        referenceId: po.id,
        reason: `Cancelled received purchase order ${po.orderNumber} (reversal)`,
        performedBy: context.employee.name,
        timestamp: now,
      });

      movements.push(movement);
    }
  }

  const updatedOrder: PurchaseOrder = {
    ...po,
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
    action: wasReceived ? 'Purchase Receipt Reversed & Cancelled' : 'Purchase Order Cancelled',
    module: 'PURCHASES',
    details: wasReceived
      ? `${context.employee.name} authorized reversal and cancelled received purchase order ${po.orderNumber}. Stock reversed for ${po.items.length} items.`
      : `${context.employee.name} cancelled pending purchase order ${po.orderNumber}.`,
    description: `Cancelled purchase order ${po.orderNumber}`,
    referenceId: po.id,
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
    message: wasReceived
      ? `Purchase order ${po.orderNumber} cancelled and stock intake reversed.`
      : `Purchase order ${po.orderNumber} cancelled.`,
  };
}

