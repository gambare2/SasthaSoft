import { z } from 'zod';

export const RoleSchema = z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']);

export const DemoRoleSwitchSchema = z.object({
  role: RoleSchema,
  employeeId: z.string().min(1, 'Employee ID is required'),
});

export const ProductSchema = z.object({
  sku: z.string().min(3, 'SKU must be at least 3 characters').max(30),
  name: z.string().min(2, 'Product name is required').max(100),
  description: z.string().max(500).default(''),
  category: z.enum([
    'Electronics',
    'Hardware',
    'Packaging',
    'Office Supplies',
    'Industrial Equipment',
    'Raw Materials',
  ]),
  barcode: z.string().min(4, 'Barcode must be at least 4 digits'),
  costPrice: z.number().positive('Cost price must be positive'),
  sellingPrice: z.number().positive('Selling price must be positive'),
  currentStock: z.number().int().nonnegative('Stock cannot be negative'),
  minStockLevel: z.number().int().nonnegative(),
  reorderPoint: z.number().int().nonnegative(),
  maxStockLevel: z.number().int().positive(),
  unit: z.string().min(1, 'Unit is required'),
  warehouseId: z.string().min(1, 'Warehouse assignment is required'),
});

export const OrderItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  sku: z.string().min(1),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
  unitPrice: z.number().positive(),
  discount: z.number().min(0).max(100).default(0),
  tax: z.number().min(0).default(0),
});

export const CustomerSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  company: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  address: z.string().min(5),
  creditLimit: z.number().nonnegative(),
});

export const SupplierSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  company: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  address: z.string().min(5),
  contactPerson: z.string().min(2),
  paymentTerms: z.string().min(2),
});

