import {
  Product,
  SalesOrder,
  PurchaseOrder,
  StockMovement,
  Employee,
  Warehouse,
} from '@/types';

export type DateFilterPreset =
  | 'ALL'
  | 'TODAY'
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'LAST_90_DAYS'
  | 'CUSTOM';

export interface DateRangeFilter {
  preset: DateFilterPreset;
  startDate?: string;
  endDate?: string;
}

function parseDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

export function isDateInRange(
  targetDateStr: string | undefined,
  filter?: DateRangeFilter,
  referenceDate: Date = new Date()
): boolean {
  if (!targetDateStr) return false;
  if (!filter || filter.preset === 'ALL') return true;

  const target = parseDate(targetDateStr);
  if (!target) return false;

  const targetTime = target.getTime();

  if (filter.preset === 'CUSTOM') {
    if (filter.startDate) {
      const start = new Date(`${filter.startDate}T00:00:00.000Z`).getTime();
      if (targetTime < start) return false;
    }
    if (filter.endDate) {
      const end = new Date(`${filter.endDate}T23:59:59.999Z`).getTime();
      if (targetTime > end) return false;
    }
    return true;
  }

  const endOfRefDay = new Date(referenceDate);
  endOfRefDay.setHours(23, 59, 59, 999);
  const endTime = endOfRefDay.getTime();

  const startOfRefDay = new Date(referenceDate);
  startOfRefDay.setHours(0, 0, 0, 0);

  if (filter.preset === 'TODAY') {
    return targetTime >= startOfRefDay.getTime() && targetTime <= endTime;
  }

  let daysToSubtract = 7;
  if (filter.preset === 'LAST_7_DAYS') daysToSubtract = 7;
  else if (filter.preset === 'LAST_30_DAYS') daysToSubtract = 30;
  else if (filter.preset === 'LAST_90_DAYS') daysToSubtract = 90;

  const windowStart = new Date(startOfRefDay);
  windowStart.setDate(windowStart.getDate() - (daysToSubtract - 1));

  return targetTime >= windowStart.getTime() && targetTime <= endTime;
}

export function calculateInventoryValuation(products: Product[]): number {
  return products.reduce((acc, p) => acc + (p.costPrice || 0) * (p.currentStock || 0), 0);
}

export function calculateRetailInventoryValuation(products: Product[]): number {
  return products.reduce((acc, p) => acc + (p.sellingPrice || 0) * (p.currentStock || 0), 0);
}

export function calculateTotalSales(
  salesOrders: SalesOrder[],
  dateFilter?: DateRangeFilter,
  referenceDate?: Date
): {
  totalRevenue: number;
  totalSubtotal: number;
  totalTax: number;
  orderCount: number;
} {
  const eligibleOrders = salesOrders.filter((order) => {

    const isCompleted =
      order.status === 'CONFIRMED' ||
      order.status === 'SHIPPED' ||
      order.status === 'DELIVERED';
    const notCancelled = order.status !== 'CANCELLED';

    if (!isCompleted || !notCancelled) return false;

    const dateToCheck = order.confirmedDate || order.orderDate || order.createdAt;
    return isDateInRange(dateToCheck, dateFilter, referenceDate);
  });

  const totalRevenue = eligibleOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalSubtotal = eligibleOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
  const totalTax = eligibleOrders.reduce((sum, o) => sum + (o.taxAmount || 0), 0);

  return {
    totalRevenue,
    totalSubtotal,
    totalTax,
    orderCount: eligibleOrders.length,
  };
}

export function calculateTotalPurchases(
  purchaseOrders: PurchaseOrder[],
  dateFilter?: DateRangeFilter,
  referenceDate?: Date
): {
  totalSpend: number;
  totalSubtotal: number;
  totalTax: number;
  orderCount: number;
} {
  const eligibleOrders = purchaseOrders.filter((order) => {
    const isReceived = order.status === 'RECEIVED';
    const notCancelled = order.status !== 'CANCELLED';

    if (!isReceived || !notCancelled) return false;

    const dateToCheck = order.receivedDate || order.orderDate || order.createdAt;
    return isDateInRange(dateToCheck, dateFilter, referenceDate);
  });

  const totalSpend = eligibleOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalSubtotal = eligibleOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
  const totalTax = eligibleOrders.reduce((sum, o) => sum + (o.taxAmount || 0), 0);

  return {
    totalSpend,
    totalSubtotal,
    totalTax,
    orderCount: eligibleOrders.length,
  };
}

export function calculateGrossProfit(
  salesOrders: SalesOrder[],
  products: Product[],
  dateFilter?: DateRangeFilter,
  referenceDate?: Date
): {
  grossProfit: number;
  revenue: number;
  costOfGoodsSold: number;
  marginPercentage: number;
} {
  const productCostMap = new Map<string, number>();
  for (const p of products) {
    productCostMap.set(p.id, p.costPrice || 0);
  }

  const eligibleOrders = salesOrders.filter((order) => {
    const isConfirmed =
      order.status === 'CONFIRMED' ||
      order.status === 'SHIPPED' ||
      order.status === 'DELIVERED';
    const notCancelled = order.status !== 'CANCELLED';
    if (!isConfirmed || !notCancelled) return false;

    const dateToCheck = order.confirmedDate || order.orderDate || order.createdAt;
    return isDateInRange(dateToCheck, dateFilter, referenceDate);
  });

  let revenue = 0;
  let costOfGoodsSold = 0;

  for (const order of eligibleOrders) {
    revenue += order.totalAmount || 0;

    for (const item of order.items) {
      const unitCost = productCostMap.get(item.productId) || 0;
      costOfGoodsSold += (item.quantity || 0) * unitCost;
    }
  }

  const grossProfit = revenue - costOfGoodsSold;
  const marginPercentage = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  return {
    grossProfit,
    revenue,
    costOfGoodsSold,
    marginPercentage,
  };
}

export function calculateLowStockProducts(products: Product[]): Product[] {
  return products.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStockLevel);
}

export function calculateOutOfStockProducts(products: Product[]): Product[] {
  return products.filter((p) => (p.currentStock || 0) <= 0);
}

export interface SalesAndPurchaseTrendPoint {
  date: string;
  label: string;
  timestamp: number;
  sales: number;
  purchases: number;
  profit: number;
}

export function calculateSalesAndPurchaseTrends(
  salesOrders: SalesOrder[],
  purchaseOrders: PurchaseOrder[],
  dateFilter?: DateRangeFilter,
  referenceDate?: Date
): SalesAndPurchaseTrendPoint[] {
  const buckets = new Map<
    string,
    { label: string; timestamp: number; sales: number; purchases: number; profit: number }
  >();

  let useDaily =
    dateFilter?.preset === 'TODAY' ||
    dateFilter?.preset === 'LAST_7_DAYS' ||
    dateFilter?.preset === 'LAST_30_DAYS';

  if (dateFilter?.preset === 'CUSTOM' && dateFilter.startDate && dateFilter.endDate) {
    const start = new Date(dateFilter.startDate).getTime();
    const end = new Date(dateFilter.endDate).getTime();
    const diffDays = (end - start) / (1000 * 60 * 60 * 24);
    if (diffDays <= 31) {
      useDaily = true;
    }
  }

  for (const order of salesOrders) {
    const isCompleted =
      order.status === 'CONFIRMED' ||
      order.status === 'SHIPPED' ||
      order.status === 'DELIVERED';
    if (!isCompleted || order.status === 'CANCELLED' || order.status === 'DRAFT') continue;

    const dateStr = order.confirmedDate || order.orderDate || order.createdAt;
    if (!isDateInRange(dateStr, dateFilter, referenceDate)) continue;

    const dateObj = parseDate(dateStr);
    if (!dateObj) continue;

    const key = useDaily
      ? dateObj.toISOString().slice(0, 10)
      : dateObj.toISOString().slice(0, 7);

    const label = useDaily
      ? dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      : dateObj.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

    const existing = buckets.get(key) || {
      label,
      timestamp: dateObj.getTime(),
      sales: 0,
      purchases: 0,
      profit: 0,
    };

    existing.sales += order.totalAmount || 0;
    buckets.set(key, existing);
  }

  for (const order of purchaseOrders) {
    if (order.status !== 'RECEIVED') continue;

    const dateStr = order.receivedDate || order.orderDate || order.createdAt;
    if (!isDateInRange(dateStr, dateFilter, referenceDate)) continue;

    const dateObj = parseDate(dateStr);
    if (!dateObj) continue;

    const key = useDaily
      ? dateObj.toISOString().slice(0, 10)
      : dateObj.toISOString().slice(0, 7);

    const label = useDaily
      ? dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      : dateObj.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

    const existing = buckets.get(key) || {
      label,
      timestamp: dateObj.getTime(),
      sales: 0,
      purchases: 0,
      profit: 0,
    };

    existing.purchases += order.totalAmount || 0;
    buckets.set(key, existing);
  }

  const sorted = Array.from(buckets.entries())
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([, val]) => ({
      date: val.label,
      label: val.label,
      timestamp: val.timestamp,
      sales: Math.round(val.sales * 100) / 100,
      purchases: Math.round(val.purchases * 100) / 100,
      profit: Math.round((val.sales - val.purchases) * 100) / 100,
    }));

  return sorted;
}

export interface StockMovementTrendPoint {
  date: string;
  period: string;
  inbound: number;
  outbound: number;
  net: number;
}

export function calculateStockMovementTrends(
  movements: StockMovement[],
  dateFilter?: DateRangeFilter,
  referenceDate?: Date
): StockMovementTrendPoint[] {
  const buckets = new Map<
    string,
    { period: string; timestamp: number; inbound: number; outbound: number }
  >();

  let useDaily =
    dateFilter?.preset === 'TODAY' ||
    dateFilter?.preset === 'LAST_7_DAYS' ||
    dateFilter?.preset === 'LAST_30_DAYS';

  if (dateFilter?.preset === 'CUSTOM' && dateFilter.startDate && dateFilter.endDate) {
    const start = new Date(dateFilter.startDate).getTime();
    const end = new Date(dateFilter.endDate).getTime();
    const diffDays = (end - start) / (1000 * 60 * 60 * 24);
    if (diffDays <= 31) {
      useDaily = true;
    }
  }

  for (const mov of movements) {
    if (!isDateInRange(mov.createdAt, dateFilter, referenceDate)) continue;

    const d = parseDate(mov.createdAt);
    if (!d) continue;

    const key = useDaily ? d.toISOString().slice(0, 10) : d.toISOString().slice(0, 7);
    const period = useDaily
      ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      : d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

    const existing = buckets.get(key) || {
      period,
      timestamp: d.getTime(),
      inbound: 0,
      outbound: 0,
    };

    const qty = Math.abs(mov.quantity || 0);

    if (
      mov.type === 'PURCHASE' ||
      mov.type === 'OPENING' ||
      mov.type === 'SALE_REVERSAL'
    ) {
      existing.inbound += qty;
    } else if (mov.type === 'PURCHASE_REVERSAL') {
      existing.inbound -= qty;
    } else if (mov.type === 'SALE') {
      existing.outbound += qty;
    } else if (mov.type === 'ADJUSTMENT') {
      const delta =
        mov.newQuantity !== undefined && mov.previousQuantity !== undefined
          ? mov.newQuantity - mov.previousQuantity
          : mov.quantity || 0;
      if (delta > 0) {
        existing.inbound += delta;
      } else if (delta < 0) {
        existing.outbound += Math.abs(delta);
      }
    }

    buckets.set(key, existing);
  }

  return Array.from(buckets.entries())
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([, val]) => ({
      date: val.period,
      period: val.period,
      inbound: Math.round(val.inbound * 100) / 100,
      outbound: Math.round(val.outbound * 100) / 100,
      net: Math.round((val.inbound - val.outbound) * 100) / 100,
    }));
}

export interface CategoryDistributionPoint {
  category: string;
  name: string;
  value: number;
  count: number;
  totalStock: number;
  totalCostValue: number;
  totalRetailValue: number;
  percentage: number;
}

export function calculateCategoryDistribution(products: Product[]): CategoryDistributionPoint[] {
  const categoryMap = new Map<
    string,
    { count: number; totalStock: number; totalCostValue: number; totalRetailValue: number }
  >();

  for (const p of products) {
    const rawCat = p.category ? p.category.trim() : '';
    const cat = rawCat || 'Uncategorized';
    const existing = categoryMap.get(cat) || {
      count: 0,
      totalStock: 0,
      totalCostValue: 0,
      totalRetailValue: 0,
    };

    const stock = Number(p.currentStock) || 0;
    const cost = Number(p.costPrice) || 0;
    const selling = Number(p.sellingPrice) || 0;

    existing.count += 1;
    existing.totalStock += stock;
    existing.totalCostValue += cost * stock;
    existing.totalRetailValue += selling * stock;

    categoryMap.set(cat, existing);
  }

  const positiveCategories = Array.from(categoryMap.entries()).filter(
    ([, stats]) => stats.totalCostValue > 0
  );

  const totalPositiveValuation = positiveCategories.reduce(
    (acc, [, stats]) => acc + stats.totalCostValue,
    0
  );

  const result: CategoryDistributionPoint[] = positiveCategories.map(([category, stats]) => {
    const totalCostValue = Math.round(stats.totalCostValue * 100) / 100;
    const percentage =
      totalPositiveValuation > 0
        ? Math.round((totalCostValue / totalPositiveValuation) * 100 * 10) / 10
        : 0;

    return {
      category,
      name: category,
      value: totalCostValue,
      count: stats.count,
      totalStock: stats.totalStock,
      totalCostValue,
      totalRetailValue: Math.round(stats.totalRetailValue * 100) / 100,
      percentage,
    };
  });

  return result.sort((a, b) => b.totalCostValue - a.totalCostValue);
}

export function calculateEmployeePerformance(
  salesOrders: SalesOrder[],
  purchaseOrders: PurchaseOrder[],
  employees: Employee[],
  dateFilter?: DateRangeFilter,
  referenceDate?: Date
): {
  employeeId: string;
  name: string;
  role: string;
  department: string;
  salesCount: number;
  salesRevenue: number;
  purchasesCount: number;
  purchasesSpend: number;
  totalProcessedValue: number;
}[] {
  const performanceMap = new Map<
    string,
    {
      salesCount: number;
      salesRevenue: number;
      purchasesCount: number;
      purchasesSpend: number;
    }
  >();

  for (const emp of employees) {
    performanceMap.set(emp.id, {
      salesCount: 0,
      salesRevenue: 0,
      purchasesCount: 0,
      purchasesSpend: 0,
    });
  }

  for (const order of salesOrders) {
    const isCompleted =
      order.status === 'CONFIRMED' ||
      order.status === 'SHIPPED' ||
      order.status === 'DELIVERED';
    if (!isCompleted || order.status === 'CANCELLED') continue;

    const dateToCheck = order.confirmedDate || order.orderDate || order.createdAt;
    if (!isDateInRange(dateToCheck, dateFilter, referenceDate)) continue;

    const empId = order.createdBy;
    const stats = performanceMap.get(empId) || {
      salesCount: 0,
      salesRevenue: 0,
      purchasesCount: 0,
      purchasesSpend: 0,
    };

    stats.salesCount += 1;
    stats.salesRevenue += order.totalAmount || 0;
    performanceMap.set(empId, stats);
  }

  for (const order of purchaseOrders) {
    if (order.status !== 'RECEIVED') continue;

    const dateToCheck = order.receivedDate || order.orderDate || order.createdAt;
    if (!isDateInRange(dateToCheck, dateFilter, referenceDate)) continue;

    const empId = order.receivedBy || order.createdBy;
    const stats = performanceMap.get(empId) || {
      salesCount: 0,
      salesRevenue: 0,
      purchasesCount: 0,
      purchasesSpend: 0,
    };

    stats.purchasesCount += 1;
    stats.purchasesSpend += order.totalAmount || 0;
    performanceMap.set(empId, stats);
  }

  return employees.map((emp) => {
    const stats = performanceMap.get(emp.id) || {
      salesCount: 0,
      salesRevenue: 0,
      purchasesCount: 0,
      purchasesSpend: 0,
    };

    return {
      employeeId: emp.id,
      name: emp.name,
      role: emp.role,
      department: emp.department,
      salesCount: stats.salesCount,
      salesRevenue: stats.salesRevenue,
      purchasesCount: stats.purchasesCount,
      purchasesSpend: stats.purchasesSpend,
      totalProcessedValue: stats.salesRevenue + stats.purchasesSpend,
    };
  }).sort((a, b) => b.totalProcessedValue - a.totalProcessedValue);
}

export function calculateWarehouseDistribution(
  products: Product[],
  warehouses: Warehouse[]
): {
  warehouseId: string;
  name: string;
  code: string;
  city: string;
  productCount: number;
  totalUnits: number;
  totalCostValue: number;
  totalRetailValue: number;
  capacity: number;
  utilization: number;
}[] {
  const warehouseMap = new Map<
    string,
    { productCount: number; totalUnits: number; totalCostValue: number; totalRetailValue: number }
  >();

  for (const wh of warehouses) {
    warehouseMap.set(wh.id, {
      productCount: 0,
      totalUnits: 0,
      totalCostValue: 0,
      totalRetailValue: 0,
    });
  }

  for (const p of products) {
    const whId = p.warehouseId;
    const existing = warehouseMap.get(whId) || {
      productCount: 0,
      totalUnits: 0,
      totalCostValue: 0,
      totalRetailValue: 0,
    };

    existing.productCount += 1;
    existing.totalUnits += p.currentStock || 0;
    existing.totalCostValue += (p.costPrice || 0) * (p.currentStock || 0);
    existing.totalRetailValue += (p.sellingPrice || 0) * (p.currentStock || 0);

    warehouseMap.set(whId, existing);
  }

  return warehouses.map((wh) => {
    const stats = warehouseMap.get(wh.id) || {
      productCount: 0,
      totalUnits: 0,
      totalCostValue: 0,
      totalRetailValue: 0,
    };

    return {
      warehouseId: wh.id,
      name: wh.name,
      code: wh.code,
      city: wh.city,
      capacity: wh.capacity,
      utilization: wh.currentUtilization,
      ...stats,
    };
  });
}

