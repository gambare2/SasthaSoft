const STORAGE_PREFIX = 'stockflow_v2_';

export const STORAGE_KEYS = {
  DEMO_ROLE: `${STORAGE_PREFIX}demo_role`,
  PRODUCTS: `${STORAGE_PREFIX}products`,
  SALES_ORDERS: `${STORAGE_PREFIX}sales_orders`,
  PURCHASE_ORDERS: `${STORAGE_PREFIX}purchase_orders`,
  STOCK_MOVEMENTS: `${STORAGE_PREFIX}stock_movements`,
  ACTIVITY_LOGS: `${STORAGE_PREFIX}activity_logs`,
  EMPLOYEES: `${STORAGE_PREFIX}employees`,
  CUSTOMERS: `${STORAGE_PREFIX}customers`,
  SUPPLIERS: `${STORAGE_PREFIX}suppliers`,
  WAREHOUSES: `${STORAGE_PREFIX}warehouses`,
  INITIALIZED: `${STORAGE_PREFIX}initialized`,
} as const;

export function isClient(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getStorageItem<T>(key: string, fallback: T): T {
  if (!isClient()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw === undefined) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`[StockFlow Storage] Corrupted or invalid JSON for key "${key}". Falling back to default.`, error);
    return fallback;
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  if (!isClient()) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[StockFlow Storage] Error writing key "${key}":`, error);
  }
}

export function removeStorageItem(key: string): void {
  if (!isClient()) {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn(`[StockFlow Storage] Error removing key "${key}":`, error);
  }
}

export function clearStockFlowStorage(): void {
  if (!isClient()) {
    return;
  }

  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      window.localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn('[StockFlow Storage] Error resetting demo storage:', error);
  }
}

