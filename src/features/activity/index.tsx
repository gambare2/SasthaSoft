'use client';

import React, { useState, useMemo } from 'react';
import {
  Clock,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  User,
  Activity,
  Shield,
} from 'lucide-react';
import { useApp, useRole } from '@/context/AppProvider';
import { filterActivityLogsForRole } from '@/domain/employee-engine';
import { isDateInRange, DateFilterPreset, DateRangeFilter } from '@/domain/analytics-engine';
import { formatDateTime, formatRelativeTime } from '@/lib/formatters';
import { ROLES } from '@/permissions/roles';

export function ActivityStream() {
  const { state } = useApp();
  const { currentRole, currentEmployee } = useRole();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [datePreset, setDatePreset] = useState<DateFilterPreset>('ALL');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const dateFilter: DateRangeFilter = useMemo(
    () => ({
      preset: datePreset,
      startDate: customStart || undefined,
      endDate: customEnd || undefined,
    }),
    [datePreset, customStart, customEnd]
  );

  const roleAccessibleLogs = useMemo(() => {
    return filterActivityLogsForRole(state.activityLogs, currentRole, currentEmployee.id);
  }, [state.activityLogs, currentRole, currentEmployee.id]);

  const availableEmployees = useMemo(() => {
    const map = new Map<string, string>();
    roleAccessibleLogs.forEach((l) => map.set(l.employeeId, l.employeeName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [roleAccessibleLogs]);

  const availableActions = useMemo(() => {
    return Array.from(new Set(roleAccessibleLogs.map((l) => l.action))).sort();
  }, [roleAccessibleLogs]);

  const modules = ['ALL', 'INVENTORY', 'SALES', 'PURCHASES', 'SYSTEM'];

  const filteredLogs = useMemo(() => {
    return roleAccessibleLogs
      .filter((log) => {

        if (selectedModule !== 'ALL' && log.module !== selectedModule) return false;

        if (selectedEmployee !== 'ALL' && log.employeeId !== selectedEmployee) return false;

        if (selectedAction !== 'ALL' && log.action !== selectedAction) return false;

        if (!isDateInRange(log.timestamp, dateFilter)) return false;

        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matches =
            log.action.toLowerCase().includes(term) ||
            log.details.toLowerCase().includes(term) ||
            log.employeeName.toLowerCase().includes(term) ||
            (log.referenceId && log.referenceId.toLowerCase().includes(term));
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [roleAccessibleLogs, selectedModule, selectedEmployee, selectedAction, dateFilter, searchTerm, sortOrder]);

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-xl border border-border shadow-subtle">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-navy tracking-tight">Activity & Audit Log</h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-mint text-teal border border-teal/20">
              {ROLES[currentRole].badgeLabel} Scope
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            {currentRole === 'ADMIN'
              ? 'Complete enterprise audit trail of all transactions, inventory adjustments, and operational events.'
              : currentRole === 'MANAGER'
              ? 'Operations department activity stream covering team inventory adjustments, purchase receipts, and fulfillment.'
              : 'Personal activity journal tracking sales orders, receiving tasks, and records created by you.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-bold text-navy">{filteredLogs.length} Events</span>
            <p className="text-[10px] text-text-secondary">Filtered Audit Events</p>
          </div>
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-text-primary bg-mint/50 hover:bg-mint border border-border rounded-lg transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-text-secondary" />
            {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </button>
        </div>
      </div>

      <div className="p-4 bg-white rounded-xl border border-border shadow-subtle space-y-3">

        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-semibold text-text-secondary mr-1 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-teal" /> Module:
            </span>
            {modules.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedModule(m)}
                className={`px-3 py-1 text-xs rounded-lg font-semibold transition-colors ${
                  selectedModule === m
                    ? 'bg-navy text-white shadow-subtle'
                    : 'bg-mint/40 text-text-secondary hover:bg-mint hover:text-navy'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-border">

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search action, details, ref ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-mint/40 border border-border rounded-lg text-text-primary placeholder:text-text-secondary/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal transition-colors"
            />
          </div>

          {currentRole !== 'EMPLOYEE' ? (
            <div className="relative">
              <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-secondary" />
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-mint/40 border border-border rounded-lg text-text-primary font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal transition-colors"
              >
                <option value="ALL">All Team Members</option>
                {availableEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-mint/40 border border-border rounded-lg text-xs text-navy font-medium">
              <Shield className="w-3.5 h-3.5 text-teal" />
              <span>Personal View: {currentEmployee.name}</span>
            </div>
          )}

          <div className="relative">
            <Filter className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-secondary" />
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-mint/40 border border-border rounded-lg text-text-primary font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal transition-colors"
            >
              <option value="ALL">All Actions</option>
              {availableActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-mint/40 px-2 py-1.5 rounded-lg border border-border">
            <Calendar className="w-3.5 h-3.5 text-text-secondary" />
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as DateFilterPreset)}
              className="w-full text-xs bg-transparent border-0 text-text-primary font-medium focus:ring-0 p-0"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
              <option value="LAST_90_DAYS">Last 90 Days</option>
              <option value="CUSTOM">Custom Date Range</option>
            </select>
          </div>
        </div>

        {datePreset === 'CUSTOM' && (
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border text-xs">
            <span className="text-text-secondary font-medium">Date Range:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2 py-1 text-xs bg-white border border-border rounded-lg text-text-primary"
            />
            <span className="text-text-secondary">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2 py-1 text-xs bg-white border border-border rounded-lg text-text-primary"
            />
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-border shadow-subtle divide-y divide-border overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-text-secondary text-xs">
            <Clock className="w-8 h-8 text-text-secondary/40 mx-auto mb-2" />
            <p className="font-semibold text-navy">No activity events found</p>
            <p className="text-text-secondary mt-1">Try broadening your search query or date range filters.</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const roleConfig = ROLES[log.employeeRole] || ROLES.EMPLOYEE;

            return (
              <div
                key={log.id}
                className="p-4 hover:bg-mint/20 transition-colors flex items-start gap-4"
              >
                <div className="p-2 rounded-lg bg-mint text-teal mt-0.5 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-navy">{log.employeeName}</span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${roleConfig.badgeColor.bg} ${roleConfig.badgeColor.text} ${roleConfig.badgeColor.border}`}
                      >
                        {roleConfig.badgeLabel}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-mint text-teal font-semibold border border-teal/20">
                        {log.module}
                      </span>
                      {log.referenceId && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pale-cyan text-navy border border-pale-cyan-dark/20">
                          Ref: {log.referenceId}
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-text-secondary whitespace-nowrap">
                      {formatDateTime(log.timestamp)} ({formatRelativeTime(log.timestamp)})
                    </span>
                  </div>

                  <p className="text-xs font-bold text-navy mt-1.5">{log.action}</p>
                  <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{log.details}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

