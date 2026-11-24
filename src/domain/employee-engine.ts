import { Employee, Role, ActivityLog } from '@/types';

export function isEmployeeActive(employee: Employee): boolean {
  return employee.status === 'ACTIVE';
}

export function getDefaultEmployeeForRole(
  employees: Employee[],
  role: Role
): Employee | undefined {
  return employees.find((e) => e.role === role && e.status === 'ACTIVE') || employees.find((e) => e.role === role);
}

export function filterActivityLogsForRole(
  logs: ActivityLog[],
  role: Role,
  employeeId: string
): ActivityLog[] {
  if (role === 'ADMIN') {
    return logs;
  }
  if (role === 'MANAGER') {

    return logs;
  }

  return logs.filter((log) => log.employeeId === employeeId);
}

