'use client';

import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Plus,
  Edit3,
  X,
  Check,
  AlertCircle,
  Building,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '@/context/AppProvider';
import { formatNumber } from '@/lib/formatters';
import { Warehouse } from '@/types';

export function WarehousesOverview() {
  const { state } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  const canManageWarehouses = state.currentRole === 'ADMIN';

  const warehouseStats = useMemo(() => {
    const stats = new Map<string, { totalUnits: number; productCount: number }>();
    state.warehouses.forEach((w) => {
      stats.set(w.id, { totalUnits: 0, productCount: 0 });
    });

    state.products.forEach((p) => {
      const cur = stats.get(p.warehouseId);
      if (cur) {
        cur.totalUnits += p.currentStock;
        cur.productCount += 1;
      }
    });

    return stats;
  }, [state.warehouses, state.products]);

  const summary = useMemo(() => {
    const totalFacilities = state.warehouses.length;
    let totalCapacity = 0;
    let totalUnitsStored = 0;

    state.warehouses.forEach((w) => {
      totalCapacity += w.capacity;
      const cur = warehouseStats.get(w.id);
      if (cur) {
        totalUnitsStored += cur.totalUnits;
      }
    });

    const averageUtilization =
      totalCapacity > 0 ? Math.round((totalUnitsStored / totalCapacity) * 100) : 0;

    return { totalFacilities, totalCapacity, totalUnitsStored, averageUtilization };
  }, [state.warehouses, warehouseStats]);

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-xl border border-border shadow-subtle">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-navy tracking-tight">Warehouses & Regional Hubs</h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-mint text-teal border border-teal/20">
              Distribution Network
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Physical distribution centers, unit capacities, supervisor assignments, and active storage utilization.
          </p>
        </div>

        {canManageWarehouses && (
          <button
            type="button"
            onClick={() => {
              setEditingWarehouse(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal hover:bg-teal-dark text-white text-xs font-semibold rounded-lg shadow-subtle transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Warehouse Facility
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-mint rounded-xl border border-border shadow-subtle flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Active Regional Hubs</span>
            <p className="text-2xl font-bold text-teal mt-2 tracking-tight">{summary.totalFacilities} Distribution Hubs</p>
          </div>
          <p className="text-[11px] text-text-secondary mt-3 pt-2.5 border-t border-border">
            Supporting pan-India supply chain operations
          </p>
        </div>

        <div className="p-5 bg-turquoise rounded-xl border border-turquoise-dark/20 shadow-subtle flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-navy/70 uppercase tracking-wider">Total Network Capacity</span>
            <p className="text-2xl font-bold text-navy mt-2 tracking-tight">{formatNumber(summary.totalCapacity)} Units</p>
          </div>
          <p className="text-[11px] text-navy/80 mt-3 pt-2.5 border-t border-navy/10">
            {formatNumber(summary.totalUnitsStored)} units currently stored in inventory
          </p>
        </div>

        <div className="p-5 bg-navy text-white rounded-xl border border-navy-light shadow-subtle flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">Overall Storage Utilization</span>
            <p className="text-2xl font-bold text-white mt-2 tracking-tight">{summary.averageUtilization}% Utilized</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/10 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-turquoise h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, summary.averageUtilization)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {state.warehouses.map((wh) => {
          const supervisor = state.employees.find((e) => e.id === wh.managerId);
          const stats = warehouseStats.get(wh.id) || { totalUnits: 0, productCount: 0 };
          const liveUtilization =
            wh.capacity > 0 ? Math.round((stats.totalUnits / wh.capacity) * 100) : 0;

          return (
            <div
              key={wh.id}
              className="p-6 bg-white rounded-xl border border-border shadow-subtle space-y-4 hover:border-turquoise/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-navy bg-pale-cyan px-2.5 py-0.5 rounded-full border border-pale-cyan-dark/20">
                    {wh.code}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      wh.status === 'ACTIVE'
                        ? 'bg-mint text-teal border-teal/20'
                        : wh.status === 'MAINTENANCE'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {wh.status}
                    </span>
                    {canManageWarehouses && (
                      <button
                        type="button"
                        onClick={() => setEditingWarehouse(wh)}
                        className="p-1 text-text-secondary hover:text-navy hover:bg-mint rounded transition-colors"
                        title="Edit Warehouse Facility"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-teal" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="text-base font-bold text-navy flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-teal flex-shrink-0" />
                    {wh.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-1">
                    <MapPin className="w-3.5 h-3.5 text-text-secondary flex-shrink-0" />
                    <span>{wh.address}, {wh.city}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-mint/40 rounded-lg border border-border text-xs flex items-center gap-2.5">
                  <div className="p-1.5 bg-mint text-teal rounded-md">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-text-secondary uppercase font-semibold block">Facility Supervisor</span>
                    <strong className="text-navy">{supervisor ? supervisor.name : 'Unassigned'}</strong>
                    {supervisor && <span className="text-[11px] text-text-secondary block">{supervisor.title}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                  <div className="p-2.5 bg-white border border-border rounded-lg text-center">
                    <span className="text-[10px] text-text-secondary block">Active SKUs</span>
                    <strong className="text-navy font-bold text-sm">{stats.productCount} Items</strong>
                  </div>
                  <div className="p-2.5 bg-white border border-border rounded-lg text-center">
                    <span className="text-[10px] text-text-secondary block">Units Stored</span>
                    <strong className="text-teal font-bold text-sm">{formatNumber(stats.totalUnits)} Units</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-border">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-text-secondary">Storage Capacity Load</span>
                  <span className="text-navy font-bold">{liveUtilization}% ({formatNumber(stats.totalUnits)} / {formatNumber(wh.capacity)})</span>
                </div>
                <div className="w-full bg-mint rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      liveUtilization > 90
                        ? 'bg-rose-500'
                        : liveUtilization > 75
                        ? 'bg-amber-400'
                        : 'bg-turquoise'
                    }`}
                    style={{ width: `${Math.min(100, liveUtilization)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-text-secondary">
                  <span>Max Limit: {formatNumber(wh.capacity)} units</span>
                  <span className="text-teal font-semibold">{wh.city} Hub</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(isAddModalOpen || editingWarehouse) && (
        <WarehouseModal
          isOpen={isAddModalOpen || Boolean(editingWarehouse)}
          warehouseToEdit={editingWarehouse}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingWarehouse(null);
          }}
        />
      )}
    </div>
  );
}

interface WarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseToEdit?: Warehouse | null;
}

function WarehouseModal({ isOpen, onClose, warehouseToEdit }: WarehouseModalProps) {
  const { state, createWarehouse, updateWarehouse, deactivateWarehouse } = useApp();
  const isEditing = Boolean(warehouseToEdit);

  const [name, setName] = useState(warehouseToEdit?.name || '');
  const [code, setCode] = useState(warehouseToEdit?.code || '');
  const [address, setAddress] = useState(warehouseToEdit?.address || '');
  const [city, setCity] = useState(warehouseToEdit?.city || 'Bengaluru');
  const [stateName, setStateName] = useState(warehouseToEdit?.state || 'Karnataka');
  const [capacity, setCapacity] = useState(warehouseToEdit?.capacity?.toString() || '50000');
  const [managerId, setManagerId] = useState(warehouseToEdit?.managerId || state.employees[0]?.id || '');
  const [status, setStatus] = useState<'ACTIVE' | 'MAINTENANCE' | 'INACTIVE'>(
    warehouseToEdit?.status || 'ACTIVE'
  );

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  const stockInFacility = useMemo(() => {
    if (!warehouseToEdit) return { count: 0, units: 0 };
    const items = state.products.filter(
      (p) => p.warehouseId === warehouseToEdit.id && p.currentStock > 0
    );
    const units = items.reduce((sum, p) => sum + p.currentStock, 0);
    return { count: items.length, units };
  }, [warehouseToEdit, state.products]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (isEditing && warehouseToEdit) {

        if (status === 'INACTIVE' && stockInFacility.units > 0) {
          setError(
            `Cannot set status to INACTIVE: ${stockInFacility.count} product(s) with ${stockInFacility.units} total units remain stored here. Relocate or deplete inventory first.`
          );
          setIsSubmitting(false);
          return;
        }

        const res = updateWarehouse(warehouseToEdit, {
          name,
          code: code || undefined,
          address,
          city,
          state: stateName,
          capacity: Number(capacity) || 0,
          managerId,
          status,
        });

        if (!res.success) {
          setError(res.error);
          setIsSubmitting(false);
          return;
        }

        setSuccessMsg(`Facility ${res.data.warehouse.name} updated successfully.`);
      } else {
        const res = createWarehouse({
          name,
          code,
          address,
          city,
          state: stateName,
          capacity: Number(capacity) || 50000,
          managerId,
          status,
        });

        if (!res.success) {
          setError(res.error);
          setIsSubmitting(false);
          return;
        }

        setSuccessMsg(
          `Warehouse ${res.data.warehouse.name} (${res.data.warehouse.code}) registered! Available immediately across Inventory and Purchases.`
        );
      }

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(msg);
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = () => {
    if (!warehouseToEdit) return;
    setError(null);
    setIsSubmitting(true);

    const res = deactivateWarehouse(warehouseToEdit.id);
    if (!res.success) {
      setError(res.error);
      setIsSubmitting(false);
      return;
    }

    setSuccessMsg(`Warehouse ${warehouseToEdit.name} deactivated.`);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowDeactivateConfirm(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-border shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-navy">
              {isEditing ? `Edit Facility — ${warehouseToEdit?.name}` : 'Commission New Warehouse Hub'}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Configures capacity limits, city hubs, and operational supervisor mapping.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-secondary hover:text-navy hover:bg-mint rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold">Validation Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-mint border border-teal/30 rounded-lg flex items-center gap-2 text-xs text-teal font-semibold">
            <Check className="w-4 h-4 text-teal flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {showDeactivateConfirm && warehouseToEdit ? (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-2">
              <p className="font-bold text-sm text-amber-950 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                Deactivation Constraint Check
              </p>
              {stockInFacility.units > 0 ? (
                <div>
                  <p className="text-rose-700 font-bold mb-1">
                    Cannot Deactivate: Facility contains active inventory!
                  </p>
                  <p className="text-[11px] text-amber-900">
                    This warehouse currently holds <strong>{stockInFacility.count}</strong> catalog products with a total of <strong>{stockInFacility.units}</strong> physical units in stock.
                    To deactivate this facility, you must first deplete or adjust stock to zero.
                  </p>
                </div>
              ) : (
                <div>
                  <p>
                    Are you sure you want to deactivate <strong>{warehouseToEdit.name}</strong> ({warehouseToEdit.code})?
                  </p>
                  <p className="text-[11px] text-amber-800 mt-1">
                    Zero stock items are currently stored here. No active inventory will be disrupted.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeactivateConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-navy rounded-lg border border-border transition-colors"
              >
                Back to Edit
              </button>
              {stockInFacility.units === 0 && (
                <button
                  type="button"
                  onClick={handleDeactivate}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-subtle transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Deactivating...' : 'Confirm Deactivation'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  Warehouse Facility Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hyderabad Central Fulfilment Hub"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  Warehouse Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HYD-HUB"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary uppercase font-mono font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                Facility Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Plot 15, Hitec City Logistics Park"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Hyderabad"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  State <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Telangana"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  Maximum Unit Capacity <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="500"
                  placeholder="e.g. 50000"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  Assigned Supervisor <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
                >
                  {state.employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role} &bull; {emp.title})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">Operational Status</label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE')
                }
                className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
              >
                <option value="ACTIVE">ACTIVE (Authorized for stock additions and fulfillment)</option>
                <option value="MAINTENANCE">MAINTENANCE (Temporary intake pause)</option>
                <option value="INACTIVE">INACTIVE (Decommissioned facility)</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border mt-6">
              <div>
                {isEditing && warehouseToEdit && warehouseToEdit.status !== 'INACTIVE' && (
                  <button
                    type="button"
                    onClick={() => setShowDeactivateConfirm(true)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                  >
                    Deactivate Facility
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-navy rounded-lg border border-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal hover:bg-teal-dark rounded-lg shadow-subtle transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Commission Hub'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

