import { OrderItem, Product } from '@/types';

export function calculateInventoryValuation(products: Product[]): number {
  return products.reduce((total, p) => total + p.costPrice * p.currentStock, 0);
}

export function calculateRetailInventoryValuation(products: Product[]): number {
  return products.reduce((total, p) => total + p.sellingPrice * p.currentStock, 0);
}

export function calculateItemTotal(
  quantity: number,
  unitPrice: number,
  discountPercentage = 0,
  taxPercentage = 0
): {
  baseAmount: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;
} {
  const baseAmount = quantity * unitPrice;
  const discountAmount = (baseAmount * (discountPercentage || 0)) / 100;
  const taxableAmount = Math.max(0, baseAmount - discountAmount);
  const taxAmount = (taxableAmount * (taxPercentage || 0)) / 100;
  const total = taxableAmount + taxAmount;

  return {
    baseAmount,
    discountAmount,
    taxableAmount,
    taxAmount,
    total,
  };
}

export function calculateOrderTotals(items: OrderItem[]): {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
} {
  let subtotal = 0;
  let taxAmount = 0;

  for (const item of items) {
    const itemCalc = calculateItemTotal(
      item.quantity,
      item.unitPrice,
      item.discount,
      item.tax
    );
    subtotal += itemCalc.taxableAmount;
    taxAmount += itemCalc.taxAmount;
  }

  return {
    subtotal,
    taxAmount,
    totalAmount: subtotal + taxAmount,
  };
}

export function calculateMarginPercentage(revenue: number, cost: number): number {
  if (revenue <= 0) return 0;
  return ((revenue - cost) / revenue) * 100;
}

