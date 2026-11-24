import {
  Employee,
  Customer,
  Supplier,
  Warehouse,
  Product,
  Role,
  ActivityLog,
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

export interface UserContext {
  employee: Employee;
  role: Role;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidPhone(phone: string): boolean {

  const cleaned = phone.replace(/[\s\-\+\(\)]/g, '');
  return cleaned.length >= 7 && /^\d+$/.test(cleaned);
}

export function createEmployee(
  params: CreateEmployeeParams,
  existingEmployees: Employee[],
  userContext: UserContext
): OperationResult<{ employee: Employee; activityLog: ActivityLog }> {

  if (userContext.role !== 'ADMIN') {
    return {
      success: false,
      error: 'Permission denied: Only Admin accounts can create new employee identities.',
    };
  }

  if (!params.name || params.name.trim().length < 2) {
    return { success: false, error: 'Employee full name must be at least 2 characters.' };
  }

  if (!params.email || !isValidEmail(params.email)) {
    return { success: false, error: `Invalid email address format: "${params.email}".` };
  }

  if (!params.phone || !isValidPhone(params.phone)) {
    return { success: false, error: `Invalid phone number format: "${params.phone}".` };
  }

  if (!params.department || params.department.trim().length === 0) {
    return { success: false, error: 'Employee department is required.' };
  }

  if (!params.title || params.title.trim().length === 0) {
    return { success: false, error: 'Employee designation / title is required.' };
  }

  if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(params.role)) {
    return { success: false, error: `Invalid role specified: "${params.role}".` };
  }

  const normalizedEmail = params.email.trim().toLowerCase();
  const emailExists = existingEmployees.some(
    (e) => e.email.trim().toLowerCase() === normalizedEmail
  );
  if (emailExists) {
    return {
      success: false,
      error: `An employee with email "${params.email}" is already registered.`,
    };
  }

  let nextId = `emp-${String(existingEmployees.length + 1).padStart(3, '0')}`;
  let counter = 1;
  while (existingEmployees.some((e) => e.id === nextId)) {
    nextId = `emp-${String(existingEmployees.length + 1 + counter).padStart(3, '0')}`;
    counter++;
  }

  const newEmployee: Employee = {
    id: nextId,
    name: params.name.trim(),
    email: params.email.trim().toLowerCase(),
    phone: params.phone.trim(),
    department: params.department.trim(),
    title: params.title.trim(),
    role: params.role,
    status: params.status || 'ACTIVE',
    joinedDate: params.joinedDate || new Date().toISOString().split('T')[0],
    assignedWarehouseId: params.assignedWarehouseId,
    avatar:
      params.avatar ||
      `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
  };

  const activityLog: ActivityLog = {
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    employeeId: userContext.employee.id,
    employeeName: userContext.employee.name,
    employeeRole: userContext.role,
    action: 'Created Employee Record',
    module: 'EMPLOYEES',
    details: `Created employee profile for ${newEmployee.name} (${newEmployee.id}) as ${newEmployee.role}.`,
    referenceId: newEmployee.id,
    timestamp: new Date().toISOString(),
  };

  return {
    success: true,
    data: { employee: newEmployee, activityLog },
  };
}

export function updateEmployee(
  existingEmployee: Employee,
  updates: UpdateEmployeeParams,
  existingEmployees: Employee[],
  userContext: UserContext
): OperationResult<{ employee: Employee; activityLog: ActivityLog }> {

  if (userContext.role !== 'ADMIN') {
    return {
      success: false,
      error: 'Permission denied: Only Admin accounts can modify employee profiles and role scopes.',
    };
  }

  if (updates.email !== undefined) {
    if (!isValidEmail(updates.email)) {
      return { success: false, error: `Invalid email address format: "${updates.email}".` };
    }
    const normalized = updates.email.trim().toLowerCase();
    const duplicate = existingEmployees.some(
      (e) => e.id !== existingEmployee.id && e.email.trim().toLowerCase() === normalized
    );
    if (duplicate) {
      return { success: false, error: `Email "${updates.email}" is already used by another employee.` };
    }
  }

  if (updates.phone !== undefined && !isValidPhone(updates.phone)) {
    return { success: false, error: `Invalid phone number format: "${updates.phone}".` };
  }

  if (updates.role !== undefined && !['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(updates.role)) {
    return { success: false, error: `Invalid role specified: "${updates.role}".` };
  }

  const updatedEmployee: Employee = {
    ...existingEmployee,
    name: updates.name !== undefined ? updates.name.trim() : existingEmployee.name,
    email: updates.email !== undefined ? updates.email.trim().toLowerCase() : existingEmployee.email,
    phone: updates.phone !== undefined ? updates.phone.trim() : existingEmployee.phone,
    department: updates.department !== undefined ? updates.department.trim() : existingEmployee.department,
    title: updates.title !== undefined ? updates.title.trim() : existingEmployee.title,
    role: updates.role !== undefined ? updates.role : existingEmployee.role,
    status: updates.status !== undefined ? updates.status : existingEmployee.status,
    assignedWarehouseId:
      updates.assignedWarehouseId !== undefined ? updates.assignedWarehouseId : existingEmployee.assignedWarehouseId,
    avatar: updates.avatar !== undefined ? updates.avatar : existingEmployee.avatar,
  };

  const activityLog: ActivityLog = {
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    employeeId: userContext.employee.id,
    employeeName: userContext.employee.name,
    employeeRole: userContext.role,
    action: 'Updated Employee Record',
    module: 'EMPLOYEES',
    details: `Updated employee profile for ${updatedEmployee.name} (${updatedEmployee.id}). Role: ${updatedEmployee.role}, Status: ${updatedEmployee.status}.`,
    referenceId: updatedEmployee.id,
    timestamp: new Date().toISOString(),
  };

  return {
    success: true,
    data: { employee: updatedEmployee, activityLog },
  };
}

export function deactivateEmployee(
  employeeId: string,
  existingEmployees: Employee[],
  userContext: UserContext
): OperationResult<{ employee: Employee; activityLog: ActivityLog }> {
  if (userContext.role !== 'ADMIN') {
    return {
      success: false,
      error: 'Permission denied: Only Admin accounts can change employee active status.',
    };
  }

  const employee = existingEmployees.find((e) => e.id === employeeId);
  if (!employee) {
    return { success: false, error: `Employee ID "${employeeId}" not found.` };
  }

  const deactivatedEmployee: Employee = {
    ...employee,
    status: 'INACTIVE',
  };

  const activityLog: ActivityLog = {
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    employeeId: userContext.employee.id,
    employeeName: userContext.employee.name,
    employeeRole: userContext.role,
    action: 'Deactivated Employee Record',
    module: 'EMPLOYEES',
    details: `Deactivated employee ${employee.name} (${employee.id}). Historical transaction attribution is preserved.`,
    referenceId: employee.id,
    timestamp: new Date().toISOString(),
  };

  return {
    success: true,
    data: { employee: deactivatedEmployee, activityLog },
  };
}

export function createCustomer(
  params: CreateCustomerParams,
  existingCustomers: Customer[],
  userContext: UserContext
): OperationResult<{ customer: Customer; activityLog: ActivityLog }> {

  if (userContext.role !== 'ADMIN' && userContext.role !== 'MANAGER') {
    return {
      success: false,
      error: 'Permission denied: Only Admin and Manager roles can register new customer records.',
    };
  }

  if (!params.name || params.name.trim().length < 2) {
    return { success: false, error: 'Customer contact person name is required.' };
  }

  if (!params.company || params.company.trim().length < 2) {
    return { success: false, error: 'Customer business / company name is required.' };
  }

  if (!params.email || !isValidEmail(params.email)) {
    return { success: false, error: `Invalid customer email format: "${params.email}".` };
  }

  if (!params.phone || !isValidPhone(params.phone)) {
    return { success: false, error: `Invalid customer phone format: "${params.phone}".` };
  }

  let code = params.code ? params.code.trim().toUpperCase() : '';
  if (!code) {
    code = `CUST-${String(existingCustomers.length + 1).padStart(3, '0')}`;
    let counter = 1;
    while (existingCustomers.some((c) => c.code === code)) {
      code = `CUST-${String(existingCustomers.length + 1 + counter).padStart(3, '0')}`;
      counter++;
    }
  } else {
    if (existingCustomers.some((c) => c.code.toLowerCase() === code.toLowerCase())) {
      return { success: false, error: `Customer code "${code}" already exists.` };
    }
  }

  const normalizedEmail = params.email.trim().toLowerCase();
  if (existingCustomers.some((c) => c.email.trim().toLowerCase() === normalizedEmail)) {
    return { success: false, error: `Customer with email "${params.email}" already exists.` };
  }

  let nextId = `cust-${String(existingCustomers.length + 1).padStart(3, '0')}`;
  let counter = 1;
  while (existingCustomers.some((c) => c.id === nextId)) {
    nextId = `cust-${String(existingCustomers.length + 1 + counter).padStart(3, '0')}`;
    counter++;
  }

  const newCustomer: Customer = {
    id: nextId,
    code,
    name: params.name.trim(),
    company: params.company.trim(),
    email: params.email.trim().toLowerCase(),
    phone: params.phone.trim(),
    address: params.address?.trim() || `${params.city || 'Bengaluru'}, ${params.state || 'Karnataka'}`,
    city: params.city?.trim() || 'Bengaluru',
    state: params.state?.trim() || 'Karnataka',
    gstin: params.gstin?.trim() || undefined,
    balance: params.balance !== undefined ? params.balance : 0,
    creditLimit: params.creditLimit !== undefined ? params.creditLimit : 100000,
    status: params.status || 'ACTIVE',
    createdAt: new Date().toISOString(),
    contactPerson: params.name.trim(),
    billingAddress: params.billingAddress?.trim() || params.address?.trim(),
    shippingAddress: params.shippingAddress?.trim() || params.address?.trim(),
    paymentTerms: params.paymentTerms?.trim() || 'Net 30 Days',
  };

  const activityLog: ActivityLog = {
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    employeeId: userContext.employee.id,
    employeeName: userContext.employee.name,
    employeeRole: userContext.role,
    action: 'Registered Customer Record',
    module: 'CONTACTS',
    details: `Added new wholesale client ${newCustomer.company} (${newCustomer.code}).`,
    referenceId: newCustomer.id,
    timestamp: new Date().toISOString(),
  };

  return {
    success: true,
    data: { customer: newCustomer, activityLog },
  };
}

export function updateCustomer(
  existingCustomer: Customer,
  updates: UpdateCustomerParams,
  existingCustomers: Customer[],
  userContext: UserContext
): OperationResult<{ customer: Customer; activityLog: ActivityLog }> {
  if (userContext.role !== 'ADMIN' && userContext.role !== 'MANAGER') {
    return {
      success: false,
      error: 'Permission denied: Only Admin and Manager roles can modify customer records.',
    };
  }

  if (updates.email !== undefined) {
    if (!isValidEmail(updates.email)) {
      return { success: false, error: `Invalid customer email format: "${updates.email}".` };
    }
    const normalized = updates.email.trim().toLowerCase();
    if (
      existingCustomers.some(
        (c) => c.id !== existingCustomer.id && c.email.trim().toLowerCase() === normalized
      )
    ) {
      return { success: false, error: `Customer email "${updates.email}" is already in use.` };
    }
  }

  if (updates.phone !== undefined && !isValidPhone(updates.phone)) {
    return { success: false, error: `Invalid customer phone format: "${updates.phone}".` };
  }

  if (updates.code !== undefined) {
    const code = updates.code.trim().toUpperCase();
    if (
      existingCustomers.some(
        (c) => c.id !== existingCustomer.id && c.code.toLowerCase() === code.toLowerCase()
      )
    ) {
      return { success: false, error: `Customer code "${code}" is already in use.` };
    }
  }

  const updatedCustomer: Customer = {
    ...existingCustomer,
    code: updates.code !== undefined ? updates.code.trim().toUpperCase() : existingCustomer.code,
    name: updates.name !== undefined ? updates.name.trim() : existingCustomer.name,
    company: updates.company !== undefined ? updates.company.trim() : existingCustomer.company,
    email: updates.email !== undefined ? updates.email.trim().toLowerCase() : existingCustomer.email,
    phone: updates.phone !== undefined ? updates.phone.trim() : existingCustomer.phone,
    address: updates.address !== undefined ? updates.address.trim() : existingCustomer.address,
    city: updates.city !== undefined ? updates.city.trim() : existingCustomer.city,
    state: updates.state !== undefined ? updates.state.trim() : existingCustomer.state,
    gstin: updates.gstin !== undefined ? updates.gstin.trim() : existingCustomer.gstin,
    creditLimit: updates.creditLimit !== undefined ? updates.creditLimit : existingCustomer.creditLimit,
    balance: updates.balance !== undefined ? updates.balance : existingCustomer.balance,
    status: updates.status !== undefined ? updates.status : existingCustomer.status,
    contactPerson: updates.name !== undefined ? updates.name.trim() : existingCustomer.contactPerson,
    billingAddress:
      updates.billingAddress !== undefined ? updates.billingAddress.trim() : existingCustomer.billingAddress,
    shippingAddress:
      updates.shippingAddress !== undefined ? updates.shippingAddress.trim() : existingCustomer.shippingAddress,
    paymentTerms:
      updates.paymentTerms !== undefined ? updates.paymentTerms.trim() : existingCustomer.paymentTerms,
  };

  const activityLog: ActivityLog = {
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    employeeId: userContext.employee.id,
    employeeName: userContext.employee.name,
    employeeRole: userContext.role,
    action: 'Updated Customer Record',
    module: 'CONTACTS',
    details: `Updated details for customer ${updatedCustomer.company} (${updatedCustomer.code}).`,
    referenceId: updatedCustomer.id,
    timestamp: new Date().toISOString(),
  };

  return {
    success: true,
    data: { customer: updatedCustomer, activityLog },
  };
}

export function createSupplier(
  params: CreateSupplierParams,
  existingSuppliers: Supplier[],
  userContext: UserContext
): OperationResult<{ supplier: Supplier; activityLog: ActivityLog }> {

  if (userContext.role !== 'ADMIN' && userContext.role !== 'MANAGER') {
    return {
      success: false,
      error: 'Permission denied: Only Admin and Manager roles can register new supplier records.',
    };
  }

  if (!params.company || params.company.trim().length < 2) {
    return { success: false, error: 'Supplier business / company name is required.' };
  }

  if (!params.contactPerson || params.contactPerson.trim().length < 2) {
    return { success: false, error: 'Supplier primary contact person is required.' };
  }

  if (!params.email || !isValidEmail(params.email)) {
    return { success: false, error: `Invalid supplier email format: "${params.email}".` };
  }

  if (!params.phone || !isValidPhone(params.phone)) {
    return { success: false, error: `Invalid supplier phone format: "${params.phone}".` };
  }

  let code = params.code ? params.code.trim().toUpperCase() : '';
  if (!code) {
    code = `SUP-${String(existingSuppliers.length + 1).padStart(3, '0')}`;
    let counter = 1;
    while (existingSuppliers.some((s) => s.code === code)) {
      code = `SUP-${String(existingSuppliers.length + 1 + counter).padStart(3, '0')}`;
      counter++;
    }
  } else {
    if (existingSuppliers.some((s) => s.code.toLowerCase() === code.toLowerCase())) {
      return { success: false, error: `Supplier code "${code}" already exists.` };
    }
  }

  const normalizedEmail = params.email.trim().toLowerCase();
  if (existingSuppliers.some((s) => s.email.trim().toLowerCase() === normalizedEmail)) {
    return { success: false, error: `Supplier with email "${params.email}" already exists.` };
  }

  let nextId = `sup-${String(existingSuppliers.length + 1).padStart(3, '0')}`;
  let counter = 1;
  while (existingSuppliers.some((s) => s.id === nextId)) {
    nextId = `sup-${String(existingSuppliers.length + 1 + counter).padStart(3, '0')}`;
    counter++;
  }

  const newSupplier: Supplier = {
    id: nextId,
    code,
    name: params.name?.trim() || params.company.trim(),
    company: params.company.trim(),
    contactPerson: params.contactPerson.trim(),
    email: params.email.trim().toLowerCase(),
    phone: params.phone.trim(),
    address: params.address?.trim() || `${params.city || 'Mumbai'}, ${params.state || 'Maharashtra'}`,
    city: params.city?.trim() || 'Mumbai',
    state: params.state?.trim() || 'Maharashtra',
    gstin: params.gstin?.trim() || undefined,
    paymentTerms: params.paymentTerms?.trim() || 'Net 30 Days',
    rating: params.rating !== undefined ? params.rating : 4.5,
    status: params.status || 'ACTIVE',
    createdAt: new Date().toISOString(),
  };

  const activityLog: ActivityLog = {
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    employeeId: userContext.employee.id,
    employeeName: userContext.employee.name,
    employeeRole: userContext.role,
    action: 'Registered Supplier Record',
    module: 'CONTACTS',
    details: `Onboarded vendor ${newSupplier.company} (${newSupplier.code}).`,
    referenceId: newSupplier.id,
    timestamp: new Date().toISOString(),
  };

  return {
    success: true,
    data: { supplier: newSupplier, activityLog },
  };
}

export function updateSupplier(
  existingSupplier: Supplier,
  updates: UpdateSupplierParams,
  existingSuppliers: Supplier[],
  userContext: UserContext
): OperationResult<{ supplier: Supplier; activityLog: ActivityLog }> {
  if (userContext.role !== 'ADMIN' && userContext.role !== 'MANAGER') {
    return {
      success: false,
      error: 'Permission denied: Only Admin and Manager roles can modify supplier records.',
    };
  }

  if (updates.email !== undefined) {
    if (!isValidEmail(updates.email)) {
      return { success: false, error: `Invalid supplier email format: "${updates.email}".` };
    }
    const normalized = updates.email.trim().toLowerCase();
    if (
      existingSuppliers.some(
        (s) => s.id !== existingSupplier.id && s.email.trim().toLowerCase() === normalized
      )
    ) {
      return { success: false, error: `Supplier email "${updates.email}" is already in use.` };
    }
  }

  if (updates.phone !== undefined && !isValidPhone(updates.phone)) {
    return { success: false, error: `Invalid supplier phone format: "${updates.phone}".` };
  }

  if (updates.code !== undefined) {
    const code = updates.code.trim().toUpperCase();
    if (
      existingSuppliers.some(
        (s) => s.id !== existingSupplier.id && s.code.toLowerCase() === code.toLowerCase()
      )
    ) {
      return { success: false, error: `Supplier code "${code}" is already in use.` };
    }
  }

  const updatedSupplier: Supplier = {
    ...existingSupplier,
    code: updates.code !== undefined ? updates.code.trim().toUpperCase() : existingSupplier.code,
    name: updates.name !== undefined ? updates.name.trim() : existingSupplier.name,
    company: updates.company !== undefined ? updates.company.trim() : existingSupplier.company,
    contactPerson:
      updates.contactPerson !== undefined ? updates.contactPerson.trim() : existingSupplier.contactPerson,
    email: updates.email !== undefined ? updates.email.trim().toLowerCase() : existingSupplier.email,
    phone: updates.phone !== undefined ? updates.phone.trim() : existingSupplier.phone,
    address: updates.address !== undefined ? updates.address.trim() : existingSupplier.address,
    city: updates.city !== undefined ? updates.city.trim() : existingSupplier.city,
    state: updates.state !== undefined ? updates.state.trim() : existingSupplier.state,
    gstin: updates.gstin !== undefined ? updates.gstin.trim() : existingSupplier.gstin,
    paymentTerms:
      updates.paymentTerms !== undefined ? updates.paymentTerms.trim() : existingSupplier.paymentTerms,
    rating: updates.rating !== undefined ? updates.rating : existingSupplier.rating,
    status: updates.status !== undefined ? updates.status : existingSupplier.status,
  };

  const activityLog: ActivityLog = {
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    employeeId: userContext.employee.id,
    employeeName: userContext.employee.name,
    employeeRole: userContext.role,
    action: 'Updated Supplier Record',
    module: 'CONTACTS',
    details: `Updated vendor details for ${updatedSupplier.company} (${updatedSupplier.code}).`,
    referenceId: updatedSupplier.id,
    timestamp: new Date().toISOString(),
  };

  return {
    success: true,
    data: { supplier: updatedSupplier, activityLog },
  };
}

export function createWarehouse(
  params: CreateWarehouseParams,
  existingWarehouses: Warehouse[],
  existingEmployees: Employee[],
  userContext: UserContext
): OperationResult<{ warehouse: Warehouse; activityLog: ActivityLog }> {

  if (userContext.role !== 'ADMIN') {
    return {
      success: false,
      error: 'Permission denied: Only Admin accounts can create new warehouse facilities.',
    };
  }

  if (!params.name || params.name.trim().length < 3) {
    return { success: false, error: 'Warehouse facility name must be at least 3 characters.' };
  }

  if (!params.code || params.code.trim().length < 2) {
    return { success: false, error: 'Warehouse code must be at least 2 characters.' };
  }

  const code = params.code.trim().toUpperCase();
  if (existingWarehouses.some((w) => w.code.toUpperCase() === code)) {
    return { success: false, error: `Warehouse code "${code}" already exists.` };
  }

  if (!params.capacity || params.capacity <= 0) {
    return { success: false, error: 'Warehouse maximum capacity must be a positive number greater than 0.' };
  }

  if (!params.managerId || !existingEmployees.some((e) => e.id === params.managerId)) {
    return { success: false, error: 'A valid supervisor / operations manager must be assigned.' };
  }

  let nextId = `wh-${String(existingWarehouses.length + 1).padStart(3, '0')}`;
  let counter = 1;
  while (existingWarehouses.some((w) => w.id === nextId)) {
    nextId = `wh-${String(existingWarehouses.length + 1 + counter).padStart(3, '0')}`;
    counter++;
  }

  const newWarehouse: Warehouse = {
    id: nextId,
    code,
    name: params.name.trim(),
    location: params.location?.trim() || `${params.city.trim()}, ${params.state.trim()}`,
    address: params.address.trim(),
    city: params.city.trim(),
    state: params.state.trim(),
    capacity: Number(params.capacity),
    currentUtilization: 0,
    managerId: params.managerId,
    status: params.status || 'ACTIVE',
    createdAt: new Date().toISOString(),
  };

  const activityLog: ActivityLog = {
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    employeeId: userContext.employee.id,
    employeeName: userContext.employee.name,
    employeeRole: userContext.role,
    action: 'Registered Warehouse Facility',
    module: 'WAREHOUSES',
    details: `Commissioned distribution facility ${newWarehouse.name} (${newWarehouse.code}) with capacity of ${newWarehouse.capacity.toLocaleString()} units.`,
    referenceId: newWarehouse.id,
    timestamp: new Date().toISOString(),
  };

  return {
    success: true,
    data: { warehouse: newWarehouse, activityLog },
  };
}

export function updateWarehouse(
  existingWarehouse: Warehouse,
  updates: UpdateWarehouseParams,
  existingWarehouses: Warehouse[],
  existingEmployees: Employee[],
  userContext: UserContext
): OperationResult<{ warehouse: Warehouse; activityLog: ActivityLog }> {
  if (userContext.role !== 'ADMIN') {
    return {
      success: false,
      error: 'Permission denied: Only Admin accounts can modify warehouse facilities.',
    };
  }

  if (updates.code !== undefined) {
    const code = updates.code.trim().toUpperCase();
    if (
      existingWarehouses.some(
        (w) => w.id !== existingWarehouse.id && w.code.toUpperCase() === code
      )
    ) {
      return { success: false, error: `Warehouse code "${code}" already exists.` };
    }
  }

  if (updates.capacity !== undefined && updates.capacity <= 0) {
    return { success: false, error: 'Warehouse capacity must be a positive number greater than 0.' };
  }

  if (
    updates.managerId !== undefined &&
    !existingEmployees.some((e) => e.id === updates.managerId)
  ) {
    return { success: false, error: 'A valid supervisor / operations manager must be assigned.' };
  }

  const updatedWarehouse: Warehouse = {
    ...existingWarehouse,
    name: updates.name !== undefined ? updates.name.trim() : existingWarehouse.name,
    code: updates.code !== undefined ? updates.code.trim().toUpperCase() : existingWarehouse.code,
    address: updates.address !== undefined ? updates.address.trim() : existingWarehouse.address,
    city: updates.city !== undefined ? updates.city.trim() : existingWarehouse.city,
    state: updates.state !== undefined ? updates.state.trim() : existingWarehouse.state,
    location:
      updates.location !== undefined
        ? updates.location.trim()
        : updates.city && updates.state
        ? `${updates.city.trim()}, ${updates.state.trim()}`
        : existingWarehouse.location,
    capacity: updates.capacity !== undefined ? Number(updates.capacity) : existingWarehouse.capacity,
    managerId: updates.managerId !== undefined ? updates.managerId : existingWarehouse.managerId,
    status: updates.status !== undefined ? updates.status : existingWarehouse.status,
  };

  const activityLog: ActivityLog = {
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    employeeId: userContext.employee.id,
    employeeName: userContext.employee.name,
    employeeRole: userContext.role,
    action: 'Updated Warehouse Facility',
    module: 'WAREHOUSES',
    details: `Updated facility details for ${updatedWarehouse.name} (${updatedWarehouse.code}). Status: ${updatedWarehouse.status}.`,
    referenceId: updatedWarehouse.id,
    timestamp: new Date().toISOString(),
  };

  return {
    success: true,
    data: { warehouse: updatedWarehouse, activityLog },
  };
}

export function deactivateWarehouse(
  warehouseId: string,
  existingWarehouses: Warehouse[],
  existingProducts: Product[],
  userContext: UserContext
): OperationResult<{ warehouse: Warehouse; activityLog: ActivityLog }> {
  if (userContext.role !== 'ADMIN') {
    return {
      success: false,
      error: 'Permission denied: Only Admin accounts can change warehouse status.',
    };
  }

  const warehouse = existingWarehouses.find((w) => w.id === warehouseId);
  if (!warehouse) {
    return { success: false, error: `Warehouse ID "${warehouseId}" not found.` };
  }

  const activeStockItems = existingProducts.filter(
    (p) => p.warehouseId === warehouseId && p.currentStock > 0
  );
  if (activeStockItems.length > 0) {
    const totalRemaining = activeStockItems.reduce((sum, p) => sum + p.currentStock, 0);
    return {
      success: false,
      error: `Cannot deactivate warehouse "${warehouse.name}": ${activeStockItems.length} product(s) with ${totalRemaining} total active units remain stored here. Relocate or deplete stock before deactivating this facility.`,
    };
  }

  const deactivatedWarehouse: Warehouse = {
    ...warehouse,
    status: 'INACTIVE',
  };

  const activityLog: ActivityLog = {
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    employeeId: userContext.employee.id,
    employeeName: userContext.employee.name,
    employeeRole: userContext.role,
    action: 'Deactivated Warehouse Facility',
    module: 'WAREHOUSES',
    details: `Deactivated distribution hub ${warehouse.name} (${warehouse.code}). Stock constraints verified.`,
    referenceId: warehouse.id,
    timestamp: new Date().toISOString(),
  };

  return {
    success: true,
    data: { warehouse: deactivatedWarehouse, activityLog },
  };
}

