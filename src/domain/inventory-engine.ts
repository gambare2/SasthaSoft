import {
  Product,
  StockMovement,
  StockMovementType,
  StockReferenceType,
  ProductCategory,
  Employee,
  Role,
  OperationResult,
  ActivityLog,
} from '@/types';
import { hasPermission } from '@/permissions/access-control';

export interface CreateProductParams {
  sku: string;
  name: string;
  description: string;
  category: ProductCategory;
  barcode: string;
  costPrice: number;
  sellingPrice: number;
  initialStock: number;
  minStockLevel: number;
  reorderPoint: number;
  maxStockLevel: number;
  unit: string;
  warehouseId: string;
}

export interface UpdateProductParams {
  name?: string;
  description?: string;
  category?: ProductCategory;
  barcode?: string;
  costPrice?: number;
  sellingPrice?: number;
  minStockLevel?: number;
  reorderPoint?: number;
  maxStockLevel?: number;
  unit?: string;
  warehouseId?: string;
}

export interface AdjustStockParams {
  productId: string;
  newStock: number;
  reason: string;
}

export interface UserContext {
  employee: Employee;
  role: Role;
}

export function calculateStockStatus(
  currentStock: number,
  minStockLevel: number
): 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK' {
  if (currentStock <= 0) return 'OUT_OF_STOCK';
  if (currentStock <= minStockLevel) return 'LOW_STOCK';
  return 'IN_STOCK';
}

export const getProductStockStatus = calculateStockStatus;

export function getLowStockProducts(products: Product[]): Product[] {
  return products.filter((p) => p.currentStock <= p.minStockLevel);
}

export function getInventoryMetrics(products: Product[]) {
  const totalProducts = products.length;
  const totalUnits = products.reduce((acc, p) => acc + p.currentStock, 0);
  const lowStockCount = products.filter((p) => p.currentStock <= p.minStockLevel && p.currentStock > 0).length;
  const outOfStockCount = products.filter((p) => p.currentStock === 0).length;
  const healthyCount = totalProducts - lowStockCount - outOfStockCount;

  return {
    totalProducts,
    totalUnits,
    lowStockCount,
    outOfStockCount,
    healthyCount,
    lowStockRatio: totalProducts > 0 ? (lowStockCount + outOfStockCount) / totalProducts : 0,
  };
}

export function createStockMovement(params: {
  productId: string;
  productName: string;
  sku: string;
  warehouseId: string;
  type: StockMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  referenceType: StockReferenceType;
  referenceId?: string;
  reason: string;
  performedBy: string;
  timestamp?: string;
}): StockMovement {
  const now = params.timestamp || new Date().toISOString();
  return {
    id: `sm-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    productId: params.productId,
    productName: params.productName,
    sku: params.sku,
    warehouseId: params.warehouseId,
    type: params.type,
    quantity: Math.abs(params.quantity),
    previousQuantity: params.previousQuantity,
    newQuantity: params.newQuantity,
    previousStock: params.previousQuantity,
    newStock: params.newQuantity,
    referenceType: params.referenceType,
    referenceId: params.referenceId,
    reason: params.reason,
    performedBy: params.performedBy,
    createdAt: now,
    timestamp: now,
  };
}

export function createStockMovementRecord(params: {
  product: Product;
  type: StockMovementType;
  quantity: number;
  referenceType: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'INITIAL';
  referenceId?: string;
  reason: string;
  performedBy: string;
}): StockMovement {
  const previousQuantity = params.product.currentStock;
  const change =
    params.type === 'OPENING' || params.type === 'PURCHASE' || params.type === 'SALE_REVERSAL'
      ? params.quantity
      : -params.quantity;
  const newQuantity = Math.max(0, previousQuantity + change);

  return createStockMovement({
    productId: params.product.id,
    productName: params.product.name,
    sku: params.product.sku,
    warehouseId: params.product.warehouseId,
    type: params.type,
    quantity: params.quantity,
    previousQuantity,
    newQuantity,
    referenceType: params.referenceType,
    referenceId: params.referenceId,
    reason: params.reason,
    performedBy: params.performedBy,
  });
}

export function validateStockAvailability(
  products: Product[],
  requestedItems: { productId: string; quantity: number }[]
): OperationResult<void> {
  if (!requestedItems || requestedItems.length === 0) {
    return { success: false, error: 'Order must contain at least one line item.' };
  }

  for (const item of requestedItems) {
    if (item.quantity <= 0) {
      return { success: false, error: `Invalid quantity ${item.quantity} for product ID ${item.productId}. Must be greater than 0.` };
    }

    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      return { success: false, error: `Product with ID "${item.productId}" not found in catalog.` };
    }

    if (product.currentStock < item.quantity) {
      return {
        success: false,
        error: `Insufficient stock for "${product.name}" (${product.sku}). Available: ${product.currentStock} ${product.unit}, Requested: ${item.quantity} ${product.unit}.`,
        code: 'INSUFFICIENT_STOCK',
      };
    }
  }

  return { success: true, data: undefined };
}

export function createProduct(
  params: CreateProductParams,
  existingProducts: Product[],
  context: UserContext
): OperationResult<{ product: Product; movement?: StockMovement; activityLog: ActivityLog }> {

  if (!hasPermission(context.role, 'inventory:create')) {
    return { success: false, error: `Unauthorized: Role "${context.role}" cannot create inventory products.` };
  }

  if (!params.sku || params.sku.trim().length < 3) {
    return { success: false, error: 'SKU must be at least 3 characters.' };
  }
  if (!params.name || params.name.trim().length < 2) {
    return { success: false, error: 'Product name must be at least 2 characters.' };
  }
  if (params.costPrice < 0 || params.sellingPrice < 0) {
    return { success: false, error: 'Cost price and selling price cannot be negative.' };
  }
  if (params.initialStock < 0) {
    return { success: false, error: 'Initial stock quantity cannot be negative.' };
  }

  const skuExists = existingProducts.some(
    (p) => p.sku.toLowerCase() === params.sku.trim().toLowerCase()
  );
  if (skuExists) {
    return { success: false, error: `Product with SKU "${params.sku}" already exists.` };
  }

  const now = new Date().toISOString();
  const productId = `prod-${Date.now()}`;
  const initialStock = Math.floor(params.initialStock || 0);

  const product: Product = {
    id: productId,
    sku: params.sku.trim().toUpperCase(),
    name: params.name.trim(),
    description: params.description?.trim() || '',
    category: params.category,
    barcode: params.barcode?.trim() || `${Date.now()}`,
    costPrice: params.costPrice,
    sellingPrice: params.sellingPrice,
    currentStock: initialStock,
    minStockLevel: Math.floor(params.minStockLevel || 10),
    reorderPoint: Math.floor(params.reorderPoint || 15),
    maxStockLevel: Math.floor(params.maxStockLevel || 100),
    unit: params.unit || 'units',
    warehouseId: params.warehouseId || 'wh-001',
    status: calculateStockStatus(initialStock, params.minStockLevel || 10),
    createdAt: now,
    updatedAt: now,
  };

  let movement: StockMovement | undefined;
  if (initialStock > 0) {
    movement = createStockMovement({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      warehouseId: product.warehouseId,
      type: 'OPENING',
      quantity: initialStock,
      previousQuantity: 0,
      newQuantity: initialStock,
      referenceType: 'INITIAL',
      referenceId: product.id,
      reason: 'Initial opening stock intake on product creation',
      performedBy: context.employee.name,
      timestamp: now,
    });
  }

  const activityLog: ActivityLog = {
    id: `act-${Date.now()}`,
    employeeId: context.employee.id,
    employeeName: context.employee.name,
    employeeRole: context.role,
    action: 'Product Created',
    module: 'INVENTORY',
    details: `${context.employee.name} created product ${product.name} (${product.sku}) with ${initialStock} ${product.unit} opening stock.`,
    description: `Created product ${product.name} (${product.sku})`,
    referenceId: product.id,
    timestamp: now,
  };

  return {
    success: true,
    data: { product, movement, activityLog },
    movements: movement ? [movement] : [],
    activityLog,
    message: `Product "${product.name}" created successfully.`,
  };
}

export function updateProduct(
  existingProduct: Product,
  updates: UpdateProductParams,
  context: UserContext
): OperationResult<{ product: Product; activityLog: ActivityLog }> {
  if (!hasPermission(context.role, 'inventory:edit')) {
    return { success: false, error: `Unauthorized: Role "${context.role}" cannot edit products.` };
  }

  const now = new Date().toISOString();
  const updated: Product = {
    ...existingProduct,
    name: updates.name !== undefined ? updates.name.trim() : existingProduct.name,
    description: updates.description !== undefined ? updates.description.trim() : existingProduct.description,
    category: updates.category || existingProduct.category,
    barcode: updates.barcode || existingProduct.barcode,
    costPrice: updates.costPrice !== undefined ? updates.costPrice : existingProduct.costPrice,
    sellingPrice: updates.sellingPrice !== undefined ? updates.sellingPrice : existingProduct.sellingPrice,
    minStockLevel: updates.minStockLevel !== undefined ? updates.minStockLevel : existingProduct.minStockLevel,
    reorderPoint: updates.reorderPoint !== undefined ? updates.reorderPoint : existingProduct.reorderPoint,
    maxStockLevel: updates.maxStockLevel !== undefined ? updates.maxStockLevel : existingProduct.maxStockLevel,
    unit: updates.unit || existingProduct.unit,
    warehouseId: updates.warehouseId || existingProduct.warehouseId,
    status: calculateStockStatus(
      existingProduct.currentStock,
      updates.minStockLevel !== undefined ? updates.minStockLevel : existingProduct.minStockLevel
    ),
    updatedAt: now,
  };

  const activityLog: ActivityLog = {
    id: `act-${Date.now()}`,
    employeeId: context.employee.id,
    employeeName: context.employee.name,
    employeeRole: context.role,
    action: 'Product Updated',
    module: 'INVENTORY',
    details: `${context.employee.name} updated product details for ${updated.name} (${updated.sku}).`,
    description: `Updated product ${updated.name} (${updated.sku})`,
    referenceId: updated.id,
    timestamp: now,
  };

  return {
    success: true,
    data: { product: updated, activityLog },
    activityLog,
  };
}

export function adjustStock(
  product: Product,
  params: AdjustStockParams,
  context: UserContext
): OperationResult<{ product: Product; movement: StockMovement; activityLog: ActivityLog }> {

  if (!hasPermission(context.role, 'inventory:adjust_stock')) {
    return {
      success: false,
      error: `Unauthorized: Role "${context.role}" cannot perform manual stock adjustments. Requires Manager or Admin authorization.`,
    };
  }

  if (params.newStock < 0) {
    return { success: false, error: 'Adjusted stock quantity cannot be negative.' };
  }

  if (params.newStock === product.currentStock) {
    return { success: false, error: 'New stock quantity is identical to current stock on hand.' };
  }

  if (!params.reason || params.reason.trim().length < 3) {
    return { success: false, error: 'A valid reason for stock adjustment is required (e.g. physical count reconciliation, damage write-off).' };
  }

  const previousQuantity = product.currentStock;
  const newQuantity = params.newStock;
  const diff = Math.abs(newQuantity - previousQuantity);
  const now = new Date().toISOString();

  const movement = createStockMovement({
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    warehouseId: product.warehouseId,
    type: 'ADJUSTMENT',
    quantity: diff,
    previousQuantity,
    newQuantity,
    referenceType: 'ADJUSTMENT',
    referenceId: `adj-${Date.now()}`,
    reason: params.reason.trim(),
    performedBy: context.employee.name,
    timestamp: now,
  });

  const updatedProduct: Product = {
    ...product,
    currentStock: newQuantity,
    status: calculateStockStatus(newQuantity, product.minStockLevel),
    updatedAt: now,
  };

  const activityLog: ActivityLog = {
    id: `act-${Date.now()}`,
    employeeId: context.employee.id,
    employeeName: context.employee.name,
    employeeRole: context.role,
    action: 'Stock Adjustment Authorized',
    module: 'INVENTORY',
    details: `${context.employee.name} adjusted stock for ${product.sku} from ${previousQuantity} to ${newQuantity} (${params.reason.trim()}).`,
    description: `Adjusted stock for ${product.sku} (${params.reason.trim()})`,
    referenceId: product.id,
    timestamp: now,
  };

  return {
    success: true,
    data: { product: updatedProduct, movement, activityLog },
    movements: [movement],
    activityLog,
    message: `Stock for ${product.sku} adjusted to ${newQuantity} ${product.unit}.`,
  };
}

