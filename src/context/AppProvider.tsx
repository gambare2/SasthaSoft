'use client';

import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import {
  Role,
  Employee,
  Product,
  Customer,
  Supplier,
  Warehouse,
  SalesOrder,
  PurchaseOrder,
  StockMovement,
  ActivityLog,
  Permission,
  OperationResult,
  CreateEmployeeParams,
  UpdateEmployeeParams,
  CreateCustomerParams,
  UpdateCustomerParams,
  CreateSupplierParams,
  UpdateSupplierParams,
  CreateWarehouseParams,
  UpdateWarehouseParams,
} from '@/types';
import {
  SEED_EMPLOYEES,
  SEED_PRODUCTS,
  SEED_CUSTOMERS,
  SEED_SUPPLIERS,
  SEED_WAREHOUSES,
  SEED_SALES_ORDERS,
  SEED_PURCHASE_ORDERS,
  SEED_STOCK_MOVEMENTS,
  SEED_ACTIVITY_LOGS,
} from '@/data/seed-data';
import {
  getStorageItem,
  setStorageItem,
  clearStockFlowStorage,
  STORAGE_KEYS,
} from '@/lib/storage';
import { hasPermission } from '@/permissions/access-control';
import { getDefaultEmployeeForRole } from '@/domain/employee-engine';
import {
  createProduct as domainCreateProduct,
  updateProduct as domainUpdateProduct,
  adjustStock as domainAdjustStock,
  CreateProductParams,
  UpdateProductParams,
  AdjustStockParams,
} from '@/domain/inventory-engine';
import {
  createPurchaseOrder as domainCreatePO,
  receivePurchaseOrder as domainReceivePO,
  cancelPurchaseOrder as domainCancelPO,
  CreatePurchaseOrderParams,
} from '@/domain/purchase-engine';
import {
  createSalesOrder as domainCreateSO,
  confirmSalesOrder as domainConfirmSO,
  cancelSalesOrder as domainCancelSO,
  CreateSalesOrderParams,
} from '@/domain/sales-engine';
import {
  createEmployee as domainCreateEmployee,
  updateEmployee as domainUpdateEmployee,
  deactivateEmployee as domainDeactivateEmployee,
  createCustomer as domainCreateCustomer,
  updateCustomer as domainUpdateCustomer,
  createSupplier as domainCreateSupplier,
  updateSupplier as domainUpdateSupplier,
  createWarehouse as domainCreateWarehouse,
  updateWarehouse as domainUpdateWarehouse,
  deactivateWarehouse as domainDeactivateWarehouse,
} from '@/domain/master-data-engine';

export interface AppState {
  currentRole: Role;
  currentEmployee: Employee;
  employees: Employee[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  salesOrders: SalesOrder[];
  purchaseOrders: PurchaseOrder[];
  stockMovements: StockMovement[];
  activityLogs: ActivityLog[];
  searchQuery: string;
}

export type AppAction =
  | { type: 'SET_DEMO_ROLE'; payload: Role }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | {
    type: 'CREATE_PRODUCT';
    payload: { product: Product; movement?: StockMovement; activityLog: ActivityLog };
  }
  | {
    type: 'UPDATE_PRODUCT';
    payload: { product: Product; activityLog: ActivityLog };
  }
  | {
    type: 'ADJUST_STOCK';
    payload: { product: Product; movement: StockMovement; activityLog: ActivityLog };
  }
  | {
    type: 'CREATE_PURCHASE_ORDER';
    payload: { order: PurchaseOrder; activityLog: ActivityLog };
  }
  | {
    type: 'RECEIVE_PURCHASE_ORDER';
    payload: { order: PurchaseOrder; updatedProducts: Product[]; movements: StockMovement[]; activityLog: ActivityLog };
  }
  | {
    type: 'CANCEL_PURCHASE_ORDER';
    payload: { order: PurchaseOrder; updatedProducts: Product[]; movements: StockMovement[]; activityLog: ActivityLog };
  }
  | {
    type: 'CREATE_SALES_ORDER';
    payload: { order: SalesOrder; activityLog: ActivityLog };
  }
  | {
    type: 'CONFIRM_SALES_ORDER';
    payload: { order: SalesOrder; updatedProducts: Product[]; movements: StockMovement[]; activityLog: ActivityLog };
  }
  | {
    type: 'CANCEL_SALES_ORDER';
    payload: { order: SalesOrder; updatedProducts: Product[]; movements: StockMovement[]; activityLog: ActivityLog };
  }
  | {
    type: 'CREATE_EMPLOYEE';
    payload: { employee: Employee; activityLog: ActivityLog };
  }
  | {
    type: 'UPDATE_EMPLOYEE';
    payload: { employee: Employee; activityLog: ActivityLog };
  }
  | {
    type: 'CREATE_CUSTOMER';
    payload: { customer: Customer; activityLog: ActivityLog };
  }
  | {
    type: 'UPDATE_CUSTOMER';
    payload: { customer: Customer; activityLog: ActivityLog };
  }
  | {
    type: 'CREATE_SUPPLIER';
    payload: { supplier: Supplier; activityLog: ActivityLog };
  }
  | {
    type: 'UPDATE_SUPPLIER';
    payload: { supplier: Supplier; activityLog: ActivityLog };
  }
  | {
    type: 'CREATE_WAREHOUSE';
    payload: { warehouse: Warehouse; activityLog: ActivityLog };
  }
  | {
    type: 'UPDATE_WAREHOUSE';
    payload: { warehouse: Warehouse; activityLog: ActivityLog };
  }
  | {
    type: 'RECORD_STOCK_MOVEMENT';
    payload: StockMovement;
  }
  | {
    type: 'ADD_ACTIVITY_LOG';
    payload: ActivityLog;
  }
  | {
    type: 'HYDRATE_SAVED_STATE';
    payload: Partial<AppState>;
  }
  | {
    type: 'RESET_DEMO_DATA';
  };

export const initialAppState: AppState = {
  currentRole: 'ADMIN',
  currentEmployee: SEED_EMPLOYEES[0],
  employees: SEED_EMPLOYEES,
  products: SEED_PRODUCTS,
  customers: SEED_CUSTOMERS,
  suppliers: SEED_SUPPLIERS,
  warehouses: SEED_WAREHOUSES,
  salesOrders: SEED_SALES_ORDERS,
  purchaseOrders: SEED_PURCHASE_ORDERS,
  stockMovements: SEED_STOCK_MOVEMENTS,
  activityLogs: SEED_ACTIVITY_LOGS,
  searchQuery: '',
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_DEMO_ROLE': {
      const newRole = action.payload;
      const matchingEmployee =
        getDefaultEmployeeForRole(state.employees, newRole) || state.employees[0];

      const newLog: ActivityLog = {
        id: `act-${Date.now()}`,
        employeeId: matchingEmployee.id,
        employeeName: matchingEmployee.name,
        employeeRole: newRole,
        action: 'Switched Demo Active Role',
        module: 'SYSTEM',
        details: `Active role switched to ${newRole} (${matchingEmployee.name}).`,
        description: `Switched demo role to ${newRole}`,
        timestamp: new Date().toISOString(),
      };

      const nextState: AppState = {
        ...state,
        currentRole: newRole,
        currentEmployee: matchingEmployee,
        activityLogs: [newLog, ...state.activityLogs],
      };

      setStorageItem(STORAGE_KEYS.DEMO_ROLE, newRole);
      setStorageItem(STORAGE_KEYS.ACTIVITY_LOGS, nextState.activityLogs);
      return nextState;
    }

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
      };

    case 'CREATE_PRODUCT': {
      const { product, movement, activityLog } = action.payload;
      const updatedProducts = [product, ...state.products];
      const updatedMovements = movement ? [movement, ...state.stockMovements] : state.stockMovements;
      const updatedLogs = [activityLog, ...state.activityLogs];

      const nextState: AppState = {
        ...state,
        products: updatedProducts,
        stockMovements: updatedMovements,
        activityLogs: updatedLogs,
      };

      setStorageItem(STORAGE_KEYS.PRODUCTS, updatedProducts);
      if (movement) setStorageItem(STORAGE_KEYS.STOCK_MOVEMENTS, updatedMovements);
      setStorageItem(STORAGE_KEYS.ACTIVITY_LOGS, updatedLogs);
      return nextState;
    }

    case 'UPDATE_PRODUCT': {
      const { product, activityLog } = action.payload;
      const updatedProducts = state.products.map((p) => (p.id === product.id ? product : p));
      const updatedLogs = [activityLog, ...state.activityLogs];

      const nextState: AppState = {
        ...state,
        products: updatedProducts,
        activityLogs: updatedLogs,
      };

      setStorageItem(STORAGE_KEYS.PRODUCTS, updatedProducts);
      setStorageItem(STORAGE_KEYS.ACTIVITY_LOGS, updatedLogs);
      return nextState;
    }

    case 'ADJUST_STOCK': {
      const { product, movement, activityLog } = action.payload;
      const updatedProducts = state.products.map((p) => (p.id === product.id ? product : p));
      const updatedMovements = [movement, ...state.stockMovements];
      const updatedLogs = [activityLog, ...state.activityLogs];

      const nextState: AppState = {
        ...state,
        products: updatedProducts,
        stockMovements: updatedMovements,
        activityLogs: updatedLogs,
      };

      setStorageItem(STORAGE_KEYS.PRODUCTS, updatedProducts);
      setStorageItem(STORAGE_KEYS.STOCK_MOVEMENTS, updatedMovements);
      setStorageItem(STORAGE_KEYS.ACTIVITY_LOGS, updatedLogs);
      return nextState;
    }

    case 'CREATE_PURCHASE_ORDER': {
      const { order, activityLog } = action.payload;
      const updatedOrders = [order, ...state.purchaseOrders];
      const updatedLogs = [activityLog, ...state.activityLogs];

      const nextState: AppState = {
        ...state,
        purchaseOrders: updatedOrders,
        activityLogs: updatedLogs,
      };

      setStorageItem(STORAGE_KEYS.PURCHASE_ORDERS, updatedOrders);
      setStorageItem(STORAGE_KEYS.ACTIVITY_LOGS, updatedLogs);
      return nextState;
    }

    case 'RECEIVE_PURCHASE_ORDER': {
      const { order, updatedProducts, movements, activityLog } = action.payload;
      const updatedOrders = state.purchaseOrders.map((po) => (po.id === order.id ? order : po));
      const updatedMovements = [...movements, ...state.stockMovements];
      const updatedLogs = [activityLog, ...state.activityLogs];

      const nextState: AppState = {
        ...state,
        purchaseOrders: updatedOrders,
        products: updatedProducts,
        stockMovements: updatedMovements,
        activityLogs: updatedLogs,
      };

      setStorageItem(STORAGE_KEYS.PURCHASE_ORDERS, updatedOrders);
      setStorageItem(STORAGE_KEYS.PRODUCTS, updatedProducts);
      setStorageItem(STORAGE_KEYS.STOCK_MOVEMENTS, updatedMovements);
      setStorageItem(STORAGE_KEYS.ACTIVITY_LOGS, updatedLogs);
      return nextState;
    }

    case 'CANCEL_PURCHASE_ORDER': {
      const { order, updatedProducts, movements, activityLog } = action.payload;
      const updatedOrders = state.purchaseOrders.map((po) => (po.id === order.id ? order : po));
      const updatedMovements = [...movements, ...state.stockMovements];
      const updatedLogs = [activityLog, ...state.activityLogs];

      const nextState: AppState = {
        ...state,
        purchaseOrders: updatedOrders,
        products: updatedProducts,
        stockMovements: updatedMovements,
        activityLogs: updatedLogs,
      };

      setStorageItem(STORAGE_KEYS.PURCHASE_ORDERS, updatedOrders);
      setStorageItem(STORAGE_KEYS.PRODUCTS, updatedProducts);
      if (movements.length > 0) setStorageItem(STORAGE_KEYS.STOCK_MOVEMENTS, updatedMovements);
      setStorageItem(STORAGE_KEYS.ACTIVITY_LOGS, updatedLogs);
      return nextState;
    }

    case 'CREATE_SALES_ORDER': {
      const { order, activityLog } = action.payload;
      const updatedOrders = [order, ...state.salesOrders];
      const updatedLogs = [activityLog, ...state.activityLogs];

      const nextState: AppState = {
        ...state,
        salesOrders: updatedOrders,
        activityLogs: updatedLogs,
      };

      setStorageItem(STORAGE_KEYS.SALES_ORDERS, updatedOrders);
      setStorageItem(STORAGE_KEYS.ACTIVITY_LOGS, updatedLogs);
      return nextState;
    }

    case 'CONFIRM_SALES_ORDER': {
      const { order, updatedProducts, movements, activityLog } = action.payload;
      const updatedOrders = state.salesOrders.map((so) => (so.id === order.id ? order : so));
      const updatedMovements = [...movements, ...state.stockMovements];
      const updatedLogs = [activityLog, ...state.activityLogs];

      const nextState: AppState = {
        ...state,
        salesOrders: updatedOrders,
        products: updatedProducts,
        stockMovements: updatedMovements,
        activityLogs: updatedLogs,
      };

      setStorageItem(STORAGE_KEYS.SALES_ORDERS, updatedOrders);
      setStorageItem(STORAGE_KEYS.PRODUCTS, updatedProducts);
      setStorageItem(STORAGE_KEYS.STOCK_MOVEMENTS, updatedMovements);
      setStorageItem(STORAGE_KEYS.ACTIVITY_LOGS, updatedLogs);
      return nextState;
    }

    case 'CANCEL_SALES_ORDER': {
      const { order, updatedProducts, movements, activityLog } = action.payload;
      const updatedOrders = state.salesOrders.map((so) => (so.id === order.id ? order : so));
      const updatedMovements = [...movements, ...state.stockMovements];
      const updatedLogs = [activityLog, ...state.activityLogs];

      const nextState: AppState = {
        ...state,
        salesOrders: updatedOrders,
        products: updatedProducts,
        stockMovements: updatedMovements,
        activityLogs: updatedLogs,
      };

      setStorageItem(STORAGE_KEYS.SALES_ORDERS, updatedOrders);
      setStorageItem(STORAGE_KEYS.PRODUCTS, updatedProducts);
      if (movements.length > 0) setStorageItem(STORAGE_KEYS.STOCK_MOVEMENTS, updatedMovements);
      setStorageItem(STORAGE_KEYS.ACTIVITY_LOGS, updatedLogs);
      return nextState;
    }

    case 'CREATE_EMPLOYEE': {
      const { employee, activityLog } = action.payload;
      const updatedEmployees = [...state.employees, employee];
      const updatedLogs = [activityLog, ...state.activityLogs];

      const nextState: AppState = {
        ...state,
        employees: updatedEmployees,
        activityLogs: updatedLogs,
      };

      setStorageItem(STORAGE_KEYS.EMPLOYEES, updatedEmployees);
      setStorageItem(STORAGE_KEYS.ACTIVITY_LOGS, updatedLogs);
      return nextState;
    }

    case 'UPDATE_EMPLOYEE': {
      const { employee, activityLog } = action.payload;
      const updatedEmployees = state.employees.map((e) => (e.id === employee.id ? employee : e));
      const updatedLogs = [activityLog, ...state.activityLogs];

      const isCurrent = state.currentEmployee.id === employee.id;
      const nextState: AppState = {
        ...state,
        employees: updatedEmployees,
        currentEmployee: isCurrent ? employee : state.currentEmployee,
        currentRole: isCurrent ? employee.role : state.currentRole,
        activityLogs: updatedLogs,
      };

      setStorageItem(STORAGE_KEYS.EMPLOYEES, updatedEmployees);
      setStorageItem(STORAGE_KEYS.ACTIVITY_LOGS, updatedLogs);
      return nextState;
    }

    case 'CREATE_CUSTOMER': {
      const { customer, activityLog } = action.payload;
      const updatedCustomers = [...state.customers, customer];
      const updatedLogs = [activityLog, ...state.activityLogs];

      const nextState: AppState = {
        ...state,
        customers: updatedCustomers,
        activityLogs: updatedLogs,
      };

      setStorageItem(STORAGE_KEYS.CUSTOMERS, updatedCustomers);
      setStorageItem(STORAGE_KEYS.ACTIVITY_LOGS, updatedLogs);
      return nextState;
    }

    case 'UPDATE_CUSTOMER': {
      const { customer, activityLog } = action.payload;
      const updatedCustomers = state.customers.map((c) => (c.id === customer.id ? customer : c));
      const updatedLogs = [activityLog, ...state.activityLogs];

      const nextState: AppState = {
        ...state,
        customers: updatedCustomers,
        activityLogs: updatedLogs,
      };

      setStorageItem(STORAGE_KEYS.CUSTOMERS, updatedCustomers);
      setStorageItem(STORAGE_KEYS.ACTIVITY_LOGS, updatedLogs);
      return nextState;
    }

    case 'CREATE_SUPPLIER': {
      const { supplier, activityLog } = action.payload;
      const updatedSuppliers = [...state.suppliers, supplier];
      const updatedLogs = [activityLog, ...state.activityLogs];

      const nextState: AppState = {
        ...state,
        suppliers: updatedSuppliers,
        activityLogs: updatedLogs,
      };

      setStorageItem(STORAGE_KEYS.SUPPLIERS, updatedSuppliers);
      setStorageItem(STORAGE_KEYS.ACTIVITY_LOGS, updatedLogs);
      return nextState;
    }

    case 'UPDATE_SUPPLIER': {
      const { supplier, activityLog } = action.payload;
      const updatedSuppliers = state.suppliers.map((s) => (s.id === supplier.id ? supplier : s));
      const updatedLogs = [activityLog, ...state.activityLogs];

      const nextState: AppState = {
        ...state,
        suppliers: updatedSuppliers,
        activityLogs: updatedLogs,
      };

      setStorageItem(STORAGE_KEYS.SUPPLIERS, updatedSuppliers);
      setStorageItem(STORAGE_KEYS.ACTIVITY_LOGS, updatedLogs);
      return nextState;
    }

    case 'CREATE_WAREHOUSE': {
      const { warehouse, activityLog } = action.payload;
      const updatedWarehouses = [...state.warehouses, warehouse];
      const updatedLogs = [activityLog, ...state.activityLogs];

      const nextState: AppState = {
        ...state,
        warehouses: updatedWarehouses,
        activityLogs: updatedLogs,
      };

      setStorageItem(STORAGE_KEYS.WAREHOUSES, updatedWarehouses);
      setStorageItem(STORAGE_KEYS.ACTIVITY_LOGS, updatedLogs);
      return nextState;
    }

    case 'UPDATE_WAREHOUSE': {
      const { warehouse, activityLog } = action.payload;
      const updatedWarehouses = state.warehouses.map((w) => (w.id === warehouse.id ? warehouse : w));
      const updatedLogs = [activityLog, ...state.activityLogs];

      const nextState: AppState = {
        ...state,
        warehouses: updatedWarehouses,
        activityLogs: updatedLogs,
      };

      setStorageItem(STORAGE_KEYS.WAREHOUSES, updatedWarehouses);
      setStorageItem(STORAGE_KEYS.ACTIVITY_LOGS, updatedLogs);
      return nextState;
    }

    case 'RECORD_STOCK_MOVEMENT': {
      const updatedMovements = [action.payload, ...state.stockMovements];
      setStorageItem(STORAGE_KEYS.STOCK_MOVEMENTS, updatedMovements);
      return {
        ...state,
        stockMovements: updatedMovements,
      };
    }

    case 'ADD_ACTIVITY_LOG': {
      const updatedLogs = [action.payload, ...state.activityLogs];
      setStorageItem(STORAGE_KEYS.ACTIVITY_LOGS, updatedLogs);
      return {
        ...state,
        activityLogs: updatedLogs,
      };
    }

    case 'HYDRATE_SAVED_STATE':
      return {
        ...state,
        ...action.payload,
      };

    case 'RESET_DEMO_DATA': {
      clearStockFlowStorage();
      return initialAppState;
    }

    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  isHydrated: boolean;
  setDemoRole: (role: Role) => void;
  hasRolePermission: (permission: Permission) => boolean;

  createProduct: (params: CreateProductParams) => OperationResult<{ product: Product }>;
  updateProduct: (existingProduct: Product, updates: UpdateProductParams) => OperationResult<{ product: Product }>;
  adjustStock: (params: AdjustStockParams) => OperationResult<{ product: Product }>;
  createPurchaseOrder: (params: CreatePurchaseOrderParams) => OperationResult<{ order: PurchaseOrder }>;
  receivePurchaseOrder: (orderId: string) => OperationResult<{ order: PurchaseOrder }>;
  cancelPurchaseOrder: (orderId: string) => OperationResult<{ order: PurchaseOrder }>;
  createSalesOrder: (params: CreateSalesOrderParams) => OperationResult<{ order: SalesOrder }>;
  confirmSalesOrder: (orderId: string) => OperationResult<{ order: SalesOrder }>;
  cancelSalesOrder: (orderId: string) => OperationResult<{ order: SalesOrder }>;

  createEmployee: (params: CreateEmployeeParams) => OperationResult<{ employee: Employee }>;
  updateEmployee: (existingEmployee: Employee, updates: UpdateEmployeeParams) => OperationResult<{ employee: Employee }>;
  deactivateEmployee: (employeeId: string) => OperationResult<{ employee: Employee }>;
  createCustomer: (params: CreateCustomerParams) => OperationResult<{ customer: Customer }>;
  updateCustomer: (existingCustomer: Customer, updates: UpdateCustomerParams) => OperationResult<{ customer: Customer }>;
  createSupplier: (params: CreateSupplierParams) => OperationResult<{ supplier: Supplier }>;
  updateSupplier: (existingSupplier: Supplier, updates: UpdateSupplierParams) => OperationResult<{ supplier: Supplier }>;
  createWarehouse: (params: CreateWarehouseParams) => OperationResult<{ warehouse: Warehouse }>;
  updateWarehouse: (existingWarehouse: Warehouse, updates: UpdateWarehouseParams) => OperationResult<{ warehouse: Warehouse }>;
  deactivateWarehouse: (warehouseId: string) => OperationResult<{ warehouse: Warehouse }>;

  resetDemoData: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const savedRole = getStorageItem<Role | null>(STORAGE_KEYS.DEMO_ROLE, null);
    const savedProducts = getStorageItem<Product[] | null>(STORAGE_KEYS.PRODUCTS, null);
    const savedSales = getStorageItem<SalesOrder[] | null>(STORAGE_KEYS.SALES_ORDERS, null);
    const savedPurchases = getStorageItem<PurchaseOrder[] | null>(STORAGE_KEYS.PURCHASE_ORDERS, null);
    const savedMovements = getStorageItem<StockMovement[] | null>(STORAGE_KEYS.STOCK_MOVEMENTS, null);
    const savedLogs = getStorageItem<ActivityLog[] | null>(STORAGE_KEYS.ACTIVITY_LOGS, null);
    const savedEmployees = getStorageItem<Employee[] | null>(STORAGE_KEYS.EMPLOYEES, null);
    const savedCustomers = getStorageItem<Customer[] | null>(STORAGE_KEYS.CUSTOMERS, null);
    const savedSuppliers = getStorageItem<Supplier[] | null>(STORAGE_KEYS.SUPPLIERS, null);
    const savedWarehouses = getStorageItem<Warehouse[] | null>(STORAGE_KEYS.WAREHOUSES, null);

    const hydratedData: Partial<AppState> = {};

    if (savedRole && (savedRole === 'ADMIN' || savedRole === 'MANAGER' || savedRole === 'EMPLOYEE')) {
      hydratedData.currentRole = savedRole;
      hydratedData.currentEmployee =
        getDefaultEmployeeForRole(state.employees, savedRole) || state.employees[0];
    }
    if (savedEmployees && Array.isArray(savedEmployees) && savedEmployees.length > 0) {
      hydratedData.employees = savedEmployees;
    }
    if (savedProducts && Array.isArray(savedProducts) && savedProducts.length > 0) {
      hydratedData.products = savedProducts;
    }
    if (savedCustomers && Array.isArray(savedCustomers) && savedCustomers.length > 0) {
      hydratedData.customers = savedCustomers;
    }
    if (savedSuppliers && Array.isArray(savedSuppliers) && savedSuppliers.length > 0) {
      hydratedData.suppliers = savedSuppliers;
    }
    if (savedWarehouses && Array.isArray(savedWarehouses) && savedWarehouses.length > 0) {
      hydratedData.warehouses = savedWarehouses;
    }
    if (savedSales && Array.isArray(savedSales)) {
      hydratedData.salesOrders = savedSales;
    }
    if (savedPurchases && Array.isArray(savedPurchases)) {
      hydratedData.purchaseOrders = savedPurchases;
    }
    if (savedMovements && Array.isArray(savedMovements)) {
      hydratedData.stockMovements = savedMovements;
    }
    if (savedLogs && Array.isArray(savedLogs)) {
      hydratedData.activityLogs = savedLogs;
    }

    if (Object.keys(hydratedData).length > 0) {
      dispatch({ type: 'HYDRATE_SAVED_STATE', payload: hydratedData });
    }

    setIsHydrated(true);

  }, []);

  const setDemoRole = (role: Role) => {
    dispatch({ type: 'SET_DEMO_ROLE', payload: role });
  };

  const hasRolePermission = (permission: Permission): boolean => {
    return hasPermission(state.currentRole, permission);
  };

  const getUserContext = () => ({
    employee: state.currentEmployee,
    role: state.currentRole,
  });

  const createProduct = (params: CreateProductParams): OperationResult<{ product: Product }> => {
    const result = domainCreateProduct(params, state.products, getUserContext());
    if (result.success) {
      dispatch({
        type: 'CREATE_PRODUCT',
        payload: {
          product: result.data.product,
          movement: result.data.movement,
          activityLog: result.data.activityLog,
        },
      });
      return { success: true, data: { product: result.data.product } };
    }
    return result;
  };

  const updateProduct = (
    existingProduct: Product,
    updates: UpdateProductParams
  ): OperationResult<{ product: Product }> => {
    const result = domainUpdateProduct(existingProduct, updates, getUserContext());
    if (result.success) {
      dispatch({
        type: 'UPDATE_PRODUCT',
        payload: {
          product: result.data.product,
          activityLog: result.data.activityLog,
        },
      });
      return { success: true, data: { product: result.data.product } };
    }
    return result;
  };

  const adjustStock = (params: AdjustStockParams): OperationResult<{ product: Product }> => {
    const product = state.products.find((p) => p.id === params.productId);
    if (!product) {
      return { success: false, error: `Product ID "${params.productId}" not found.` };
    }

    const result = domainAdjustStock(product, params, getUserContext());
    if (result.success) {
      dispatch({
        type: 'ADJUST_STOCK',
        payload: {
          product: result.data.product,
          movement: result.data.movement,
          activityLog: result.data.activityLog,
        },
      });
      return { success: true, data: { product: result.data.product } };
    }
    return result;
  };

  const createPurchaseOrder = (
    params: CreatePurchaseOrderParams
  ): OperationResult<{ order: PurchaseOrder }> => {
    const result = domainCreatePO(
      params,
      state.suppliers,
      state.warehouses,
      state.products,
      getUserContext()
    );
    if (result.success) {
      dispatch({
        type: 'CREATE_PURCHASE_ORDER',
        payload: {
          order: result.data.order,
          activityLog: result.data.activityLog,
        },
      });
      return { success: true, data: { order: result.data.order } };
    }
    return result;
  };

  const receivePurchaseOrder = (orderId: string): OperationResult<{ order: PurchaseOrder }> => {
    const po = state.purchaseOrders.find((p) => p.id === orderId);
    if (!po) {
      return { success: false, error: `Purchase order ID "${orderId}" not found.` };
    }

    const result = domainReceivePO(po, state.products, getUserContext());
    if (result.success) {
      dispatch({
        type: 'RECEIVE_PURCHASE_ORDER',
        payload: {
          order: result.data.order,
          updatedProducts: result.data.updatedProducts,
          movements: result.data.movements,
          activityLog: result.data.activityLog,
        },
      });
      return { success: true, data: { order: result.data.order } };
    }
    return result;
  };

  const cancelPurchaseOrder = (orderId: string): OperationResult<{ order: PurchaseOrder }> => {
    const po = state.purchaseOrders.find((p) => p.id === orderId);
    if (!po) {
      return { success: false, error: `Purchase order ID "${orderId}" not found.` };
    }

    const result = domainCancelPO(po, state.products, getUserContext());
    if (result.success) {
      dispatch({
        type: 'CANCEL_PURCHASE_ORDER',
        payload: {
          order: result.data.order,
          updatedProducts: result.data.updatedProducts,
          movements: result.data.movements,
          activityLog: result.data.activityLog,
        },
      });
      return { success: true, data: { order: result.data.order } };
    }
    return result;
  };

  const createSalesOrder = (
    params: CreateSalesOrderParams
  ): OperationResult<{ order: SalesOrder }> => {
    const result = domainCreateSO(
      params,
      state.customers,
      state.warehouses,
      state.products,
      getUserContext()
    );
    if (result.success) {
      dispatch({
        type: 'CREATE_SALES_ORDER',
        payload: {
          order: result.data.order,
          activityLog: result.data.activityLog,
        },
      });
      return { success: true, data: { order: result.data.order } };
    }
    return result;
  };

  const confirmSalesOrder = (orderId: string): OperationResult<{ order: SalesOrder }> => {
    const so = state.salesOrders.find((s) => s.id === orderId);
    if (!so) {
      return { success: false, error: `Sales order ID "${orderId}" not found.` };
    }

    const result = domainConfirmSO(so, state.products, getUserContext());
    if (result.success) {
      dispatch({
        type: 'CONFIRM_SALES_ORDER',
        payload: {
          order: result.data.order,
          updatedProducts: result.data.updatedProducts,
          movements: result.data.movements,
          activityLog: result.data.activityLog,
        },
      });
      return { success: true, data: { order: result.data.order } };
    }
    return result;
  };

  const cancelSalesOrder = (orderId: string): OperationResult<{ order: SalesOrder }> => {
    const so = state.salesOrders.find((s) => s.id === orderId);
    if (!so) {
      return { success: false, error: `Sales order ID "${orderId}" not found.` };
    }

    const result = domainCancelSO(so, state.products, getUserContext());
    if (result.success) {
      dispatch({
        type: 'CANCEL_SALES_ORDER',
        payload: {
          order: result.data.order,
          updatedProducts: result.data.updatedProducts,
          movements: result.data.movements,
          activityLog: result.data.activityLog,
        },
      });
      return { success: true, data: { order: result.data.order } };
    }
    return result;
  };

  const createEmployee = (params: CreateEmployeeParams): OperationResult<{ employee: Employee }> => {
    const result = domainCreateEmployee(params, state.employees, getUserContext());
    if (result.success) {
      dispatch({
        type: 'CREATE_EMPLOYEE',
        payload: {
          employee: result.data.employee,
          activityLog: result.data.activityLog,
        },
      });
      return { success: true, data: { employee: result.data.employee } };
    }
    return result;
  };

  const updateEmployee = (
    existingEmployee: Employee,
    updates: UpdateEmployeeParams
  ): OperationResult<{ employee: Employee }> => {
    const result = domainUpdateEmployee(existingEmployee, updates, state.employees, getUserContext());
    if (result.success) {
      dispatch({
        type: 'UPDATE_EMPLOYEE',
        payload: {
          employee: result.data.employee,
          activityLog: result.data.activityLog,
        },
      });
      return { success: true, data: { employee: result.data.employee } };
    }
    return result;
  };

  const deactivateEmployee = (employeeId: string): OperationResult<{ employee: Employee }> => {
    const result = domainDeactivateEmployee(employeeId, state.employees, getUserContext());
    if (result.success) {
      dispatch({
        type: 'UPDATE_EMPLOYEE',
        payload: {
          employee: result.data.employee,
          activityLog: result.data.activityLog,
        },
      });
      return { success: true, data: { employee: result.data.employee } };
    }
    return result;
  };

  const createCustomer = (params: CreateCustomerParams): OperationResult<{ customer: Customer }> => {
    const result = domainCreateCustomer(params, state.customers, getUserContext());
    if (result.success) {
      dispatch({
        type: 'CREATE_CUSTOMER',
        payload: {
          customer: result.data.customer,
          activityLog: result.data.activityLog,
        },
      });
      return { success: true, data: { customer: result.data.customer } };
    }
    return result;
  };

  const updateCustomer = (
    existingCustomer: Customer,
    updates: UpdateCustomerParams
  ): OperationResult<{ customer: Customer }> => {
    const result = domainUpdateCustomer(existingCustomer, updates, state.customers, getUserContext());
    if (result.success) {
      dispatch({
        type: 'UPDATE_CUSTOMER',
        payload: {
          customer: result.data.customer,
          activityLog: result.data.activityLog,
        },
      });
      return { success: true, data: { customer: result.data.customer } };
    }
    return result;
  };

  const createSupplier = (params: CreateSupplierParams): OperationResult<{ supplier: Supplier }> => {
    const result = domainCreateSupplier(params, state.suppliers, getUserContext());
    if (result.success) {
      dispatch({
        type: 'CREATE_SUPPLIER',
        payload: {
          supplier: result.data.supplier,
          activityLog: result.data.activityLog,
        },
      });
      return { success: true, data: { supplier: result.data.supplier } };
    }
    return result;
  };

  const updateSupplier = (
    existingSupplier: Supplier,
    updates: UpdateSupplierParams
  ): OperationResult<{ supplier: Supplier }> => {
    const result = domainUpdateSupplier(existingSupplier, updates, state.suppliers, getUserContext());
    if (result.success) {
      dispatch({
        type: 'UPDATE_SUPPLIER',
        payload: {
          supplier: result.data.supplier,
          activityLog: result.data.activityLog,
        },
      });
      return { success: true, data: { supplier: result.data.supplier } };
    }
    return result;
  };

  const createWarehouse = (params: CreateWarehouseParams): OperationResult<{ warehouse: Warehouse }> => {
    const result = domainCreateWarehouse(params, state.warehouses, state.employees, getUserContext());
    if (result.success) {
      dispatch({
        type: 'CREATE_WAREHOUSE',
        payload: {
          warehouse: result.data.warehouse,
          activityLog: result.data.activityLog,
        },
      });
      return { success: true, data: { warehouse: result.data.warehouse } };
    }
    return result;
  };

  const updateWarehouse = (
    existingWarehouse: Warehouse,
    updates: UpdateWarehouseParams
  ): OperationResult<{ warehouse: Warehouse }> => {
    const result = domainUpdateWarehouse(
      existingWarehouse,
      updates,
      state.warehouses,
      state.employees,
      getUserContext()
    );
    if (result.success) {
      dispatch({
        type: 'UPDATE_WAREHOUSE',
        payload: {
          warehouse: result.data.warehouse,
          activityLog: result.data.activityLog,
        },
      });
      return { success: true, data: { warehouse: result.data.warehouse } };
    }
    return result;
  };

  const deactivateWarehouse = (warehouseId: string): OperationResult<{ warehouse: Warehouse }> => {
    const result = domainDeactivateWarehouse(
      warehouseId,
      state.warehouses,
      state.products,
      getUserContext()
    );
    if (result.success) {
      dispatch({
        type: 'UPDATE_WAREHOUSE',
        payload: {
          warehouse: result.data.warehouse,
          activityLog: result.data.activityLog,
        },
      });
      return { success: true, data: { warehouse: result.data.warehouse } };
    }
    return result;
  };

  const resetDemoData = () => {
    dispatch({ type: 'RESET_DEMO_DATA' });
  };

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        isHydrated,
        setDemoRole,
        hasRolePermission,
        createProduct,
        updateProduct,
        adjustStock,
        createPurchaseOrder,
        receivePurchaseOrder,
        cancelPurchaseOrder,
        createSalesOrder,
        confirmSalesOrder,
        cancelSalesOrder,
        createEmployee,
        updateEmployee,
        deactivateEmployee,
        createCustomer,
        updateCustomer,
        createSupplier,
        updateSupplier,
        createWarehouse,
        updateWarehouse,
        deactivateWarehouse,
        resetDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export function useRole() {
  const { state, setDemoRole, hasRolePermission } = useApp();
  return {
    currentRole: state.currentRole,
    currentEmployee: state.currentEmployee,
    setDemoRole,
    hasPermission: hasRolePermission,
  };
}

