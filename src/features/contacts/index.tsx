'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Edit3,
  X,
  Check,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  MapPin,
  Star,
} from 'lucide-react';
import { useApp } from '@/context/AppProvider';
import { formatCurrency } from '@/lib/formatters';
import { Customer, Supplier } from '@/types';

export function ContactsDirectory() {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'SUPPLIERS'>('CUSTOMERS');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const canManageContacts = state.currentRole === 'ADMIN' || state.currentRole === 'MANAGER';

  const filteredCustomers = useMemo(() => {
    return state.customers.filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch =
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [state.customers, search, statusFilter]);

  const filteredSuppliers = useMemo(() => {
    return state.suppliers.filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch =
        s.name.toLowerCase().includes(q) ||
        s.company.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [state.suppliers, search, statusFilter]);

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-xl border border-border shadow-subtle">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-navy tracking-tight">Contacts & Commercial Directory</h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-mint text-teal border border-teal/20">
              Commercial Desk
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Manage wholesale customer credit lines and authorized vendor procurement agreements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">

          <div className="flex items-center p-1 bg-mint/50 rounded-lg border border-border">
            <button
              type="button"
              onClick={() => {
                setActiveTab('CUSTOMERS');
                setSearch('');
              }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'CUSTOMERS' ? 'bg-navy text-white shadow-subtle' : 'text-text-secondary hover:text-navy'
              }`}
            >
              Customers ({state.customers.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('SUPPLIERS');
                setSearch('');
              }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'SUPPLIERS' ? 'bg-navy text-white shadow-subtle' : 'text-text-secondary hover:text-navy'
              }`}
            >
              Suppliers ({state.suppliers.length})
            </button>
          </div>

          {canManageContacts && (
            activeTab === 'CUSTOMERS' ? (
              <button
                type="button"
                onClick={() => {
                  setEditingCustomer(null);
                  setIsCustomerModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal hover:bg-teal-dark text-white text-xs font-semibold rounded-lg shadow-subtle transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Customer
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditingSupplier(null);
                  setIsSupplierModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal hover:bg-teal-dark text-white text-xs font-semibold rounded-lg shadow-subtle transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Supplier
              </button>
            )
          )}
        </div>
      </div>

      <div className="p-4 bg-white rounded-xl border border-border shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-secondary" />
          <input
            type="text"
            placeholder={activeTab === 'CUSTOMERS' ? 'Search customers by name, company, email, code...' : 'Search suppliers by vendor, contact, code...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-mint/40 border border-border rounded-lg text-text-primary placeholder:text-text-secondary/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-text-secondary" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
            className="px-3 py-1.5 text-xs bg-mint/40 border border-border rounded-lg text-text-primary font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {activeTab === 'CUSTOMERS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filteredCustomers.length === 0 ? (
            <div className="col-span-3 py-12 text-center bg-white rounded-xl border border-border text-text-secondary text-xs">
              No customer records matching your search or filters.
            </div>
          ) : (
            filteredCustomers.map((c) => (
              <div
                key={c.id}
                className="p-5 bg-white rounded-xl border border-border shadow-subtle space-y-3.5 hover:border-turquoise/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-navy bg-mint/80 px-2 py-0.5 rounded border border-border">
                      {c.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        c.status === 'ACTIVE'
                          ? 'bg-mint text-teal border-teal/20'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {c.status}
                      </span>
                      {canManageContacts && (
                        <button
                          type="button"
                          onClick={() => setEditingCustomer(c)}
                          className="p-1 text-text-secondary hover:text-navy hover:bg-mint rounded transition-colors"
                          title="Edit Customer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-teal" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-2">
                    <h3 className="text-sm font-bold text-navy flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-teal flex-shrink-0" />
                      {c.company}
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5 font-medium">
                      Contact: <span className="text-navy">{c.name}</span>
                    </p>
                  </div>

                  <div className="pt-2.5 mt-2.5 border-t border-border text-xs space-y-1.5 text-text-secondary">
                    <p className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-text-secondary flex-shrink-0" />
                      <span className="text-text-primary">{c.email}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-text-secondary flex-shrink-0" />
                      <span className="text-text-primary">{c.phone}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-text-secondary flex-shrink-0" />
                      <span>{c.city}, {c.state}</span>
                    </p>
                    {c.gstin && (
                      <p className="text-[11px] font-mono text-text-secondary">
                        GSTIN: <strong className="text-navy">{c.gstin}</strong>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border text-xs space-y-1 bg-mint/20 -mx-5 -mb-5 p-4 rounded-b-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-text-secondary font-medium">Credit Limit:</span>
                    <span className="font-semibold text-text-primary">{formatCurrency(c.creditLimit)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-text-secondary font-medium">Outstanding Balance:</span>
                    <strong className="text-navy font-bold">{formatCurrency(c.balance)}</strong>
                  </div>
                  {c.paymentTerms && (
                    <div className="flex justify-between items-center text-[10px] pt-1 border-t border-border/50 text-text-secondary">
                      <span>Terms:</span>
                      <span className="text-teal font-semibold">{c.paymentTerms}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'SUPPLIERS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filteredSuppliers.length === 0 ? (
            <div className="col-span-3 py-12 text-center bg-white rounded-xl border border-border text-text-secondary text-xs">
              No supplier records matching your search or filters.
            </div>
          ) : (
            filteredSuppliers.map((s) => (
              <div
                key={s.id}
                className="p-5 bg-white rounded-xl border border-border shadow-subtle space-y-3.5 hover:border-turquoise/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-navy bg-mint/80 px-2 py-0.5 rounded border border-border">
                      {s.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pale-cyan text-navy border border-pale-cyan-dark/20 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {s.rating || 4.5}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        s.status === 'ACTIVE'
                          ? 'bg-mint text-teal border-teal/20'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {s.status}
                      </span>
                      {canManageContacts && (
                        <button
                          type="button"
                          onClick={() => setEditingSupplier(s)}
                          className="p-1 text-text-secondary hover:text-navy hover:bg-mint rounded transition-colors"
                          title="Edit Supplier"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-teal" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-2">
                    <h3 className="text-sm font-bold text-navy flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-teal flex-shrink-0" />
                      {s.company}
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5 font-medium">
                      Primary Contact: <span className="text-navy font-semibold">{s.contactPerson}</span>
                    </p>
                  </div>

                  <div className="pt-2.5 mt-2.5 border-t border-border text-xs space-y-1.5 text-text-secondary">
                    <p className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-text-secondary flex-shrink-0" />
                      <span className="text-text-primary">{s.email}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-text-secondary flex-shrink-0" />
                      <span className="text-text-primary">{s.phone}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-text-secondary flex-shrink-0" />
                      <span>{s.city}, {s.state}</span>
                    </p>
                    {s.gstin && (
                      <p className="text-[11px] font-mono text-text-secondary">
                        GSTIN: <strong className="text-navy">{s.gstin}</strong>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border text-xs space-y-1 bg-mint/20 -mx-5 -mb-5 p-4 rounded-b-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-text-secondary font-medium">Payment Terms:</span>
                    <span className="font-semibold text-teal">{s.paymentTerms}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-text-secondary">
                    <span>Vendor Facility:</span>
                    <span>{s.address}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {(isCustomerModalOpen || editingCustomer) && (
        <CustomerModal
          isOpen={isCustomerModalOpen || Boolean(editingCustomer)}
          customerToEdit={editingCustomer}
          onClose={() => {
            setIsCustomerModalOpen(false);
            setEditingCustomer(null);
          }}
        />
      )}

      {(isSupplierModalOpen || editingSupplier) && (
        <SupplierModal
          isOpen={isSupplierModalOpen || Boolean(editingSupplier)}
          supplierToEdit={editingSupplier}
          onClose={() => {
            setIsSupplierModalOpen(false);
            setEditingSupplier(null);
          }}
        />
      )}
    </div>
  );
}

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
}

function CustomerModal({ isOpen, onClose, customerToEdit }: CustomerModalProps) {
  const { createCustomer, updateCustomer } = useApp();
  const isEditing = Boolean(customerToEdit);

  const [company, setCompany] = useState(customerToEdit?.company || '');
  const [name, setName] = useState(customerToEdit?.name || '');
  const [email, setEmail] = useState(customerToEdit?.email || '');
  const [phone, setPhone] = useState(customerToEdit?.phone || '');
  const [code, setCode] = useState(customerToEdit?.code || '');
  const [city, setCity] = useState(customerToEdit?.city || 'Bengaluru');
  const [stateName, setStateName] = useState(customerToEdit?.state || 'Karnataka');
  const [address, setAddress] = useState(customerToEdit?.address || '');
  const [billingAddress, setBillingAddress] = useState(customerToEdit?.billingAddress || '');
  const [shippingAddress, setShippingAddress] = useState(customerToEdit?.shippingAddress || '');
  const [gstin, setGstin] = useState(customerToEdit?.gstin || '');
  const [creditLimit, setCreditLimit] = useState(customerToEdit?.creditLimit?.toString() || '150000');
  const [paymentTerms, setPaymentTerms] = useState(customerToEdit?.paymentTerms || 'Net 30 Days');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(customerToEdit?.status || 'ACTIVE');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (isEditing && customerToEdit) {
        const res = updateCustomer(customerToEdit, {
          company,
          name,
          email,
          phone,
          code: code || undefined,
          city,
          state: stateName,
          address: address || `${city}, ${stateName}`,
          billingAddress: billingAddress || address,
          shippingAddress: shippingAddress || address,
          gstin: gstin || undefined,
          creditLimit: Number(creditLimit) || 0,
          paymentTerms,
          status,
        });

        if (!res.success) {
          setError(res.error);
          setIsSubmitting(false);
          return;
        }

        setSuccessMsg(`Customer ${res.data.customer.company} updated successfully.`);
      } else {
        const res = createCustomer({
          company,
          name,
          email,
          phone,
          code: code || undefined,
          city,
          state: stateName,
          address: address || `${city}, ${stateName}`,
          billingAddress: billingAddress || address,
          shippingAddress: shippingAddress || address,
          gstin: gstin || undefined,
          creditLimit: Number(creditLimit) || 100000,
          paymentTerms,
          status,
        });

        if (!res.success) {
          setError(res.error);
          setIsSubmitting(false);
          return;
        }

        setSuccessMsg(`New client ${res.data.customer.company} (${res.data.customer.code}) registered! Available immediately in Sales.`);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-border shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-navy">
              {isEditing ? `Edit Customer — ${customerToEdit?.company}` : 'Register New Wholesale Customer'}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Available immediately across billing and sales order creation.
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                Business / Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Tech Solutions Ltd"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                Contact Person Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Neha Verma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="client@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="+91 98450 11223"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-navy mb-1">Customer Code</label>
              <input
                type="text"
                placeholder="Auto-generated if blank"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary uppercase font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">City</label>
              <input
                type="text"
                placeholder="Bengaluru"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">State</label>
              <input
                type="text"
                placeholder="Karnataka"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy mb-1">Primary Commercial Address</label>
            <input
              type="text"
              placeholder="Building, Street, Industrial Area"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy mb-1">Billing Address</label>
              <input
                type="text"
                placeholder="Leave blank to use primary address"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy mb-1">Shipping Address</label>
              <input
                type="text"
                placeholder="Leave blank to use primary address"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-navy mb-1">GSTIN (Optional)</label>
              <input
                type="text"
                placeholder="29AABCS1429B1ZB"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">Credit Limit (₹)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
              >
                <option value="Immediate / Advance">Immediate / Advance</option>
                <option value="Net 15 Days">Net 15 Days</option>
                <option value="Net 30 Days">Net 30 Days</option>
                <option value="Net 45 Days">Net 45 Days</option>
                <option value="Net 60 Days">Net 60 Days</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy mb-1">Commercial Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
              className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
            >
              <option value="ACTIVE">ACTIVE (Authorized for new orders)</option>
              <option value="INACTIVE">INACTIVE (Temporarily suspended)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
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
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Register Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierToEdit?: Supplier | null;
}

function SupplierModal({ isOpen, onClose, supplierToEdit }: SupplierModalProps) {
  const { createSupplier, updateSupplier } = useApp();
  const isEditing = Boolean(supplierToEdit);

  const [company, setCompany] = useState(supplierToEdit?.company || '');
  const [contactPerson, setContactPerson] = useState(supplierToEdit?.contactPerson || '');
  const [email, setEmail] = useState(supplierToEdit?.email || '');
  const [phone, setPhone] = useState(supplierToEdit?.phone || '');
  const [code, setCode] = useState(supplierToEdit?.code || '');
  const [city, setCity] = useState(supplierToEdit?.city || 'Mumbai');
  const [stateName, setStateName] = useState(supplierToEdit?.state || 'Maharashtra');
  const [address, setAddress] = useState(supplierToEdit?.address || '');
  const [gstin, setGstin] = useState(supplierToEdit?.gstin || '');
  const [paymentTerms, setPaymentTerms] = useState(supplierToEdit?.paymentTerms || 'Net 30 Days');
  const [rating, setRating] = useState(supplierToEdit?.rating?.toString() || '4.5');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(supplierToEdit?.status || 'ACTIVE');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (isEditing && supplierToEdit) {
        const res = updateSupplier(supplierToEdit, {
          company,
          name: company,
          contactPerson,
          email,
          phone,
          code: code || undefined,
          city,
          state: stateName,
          address: address || `${city}, ${stateName}`,
          gstin: gstin || undefined,
          paymentTerms,
          rating: Number(rating) || 4.5,
          status,
        });

        if (!res.success) {
          setError(res.error);
          setIsSubmitting(false);
          return;
        }

        setSuccessMsg(`Vendor ${res.data.supplier.company} updated successfully.`);
      } else {
        const res = createSupplier({
          company,
          name: company,
          contactPerson,
          email,
          phone,
          code: code || undefined,
          city,
          state: stateName,
          address: address || `${city}, ${stateName}`,
          gstin: gstin || undefined,
          paymentTerms,
          rating: Number(rating) || 4.5,
          status,
        });

        if (!res.success) {
          setError(res.error);
          setIsSubmitting(false);
          return;
        }

        setSuccessMsg(`Vendor ${res.data.supplier.company} (${res.data.supplier.code}) onboarded! Available immediately in Purchase Orders.`);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-border shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-navy">
              {isEditing ? `Edit Supplier — ${supplierToEdit?.company}` : 'Onboard New Procurement Supplier'}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Available immediately across Purchase Orders and inventory intake.
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                Vendor Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Industrial Supplies"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                Primary Contact Person <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Anand Murthy"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="orders@vendor.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="+91 98220 54321"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-navy mb-1">Supplier Code</label>
              <input
                type="text"
                placeholder="Auto-generated if blank"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary uppercase font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">City</label>
              <input
                type="text"
                placeholder="Mumbai"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">State</label>
              <input
                type="text"
                placeholder="Maharashtra"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy mb-1">Warehouse / Facility Address</label>
            <input
              type="text"
              placeholder="Plot No, Industrial Estate, Sector"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-navy mb-1">GSTIN (Optional)</label>
              <input
                type="text"
                placeholder="27AAACH2871G1ZQ"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
              >
                <option value="Immediate / Advance">Immediate / Advance</option>
                <option value="Net 15 Days">Net 15 Days</option>
                <option value="Net 30 Days">Net 30 Days</option>
                <option value="Net 45 Days">Net 45 Days</option>
                <option value="Net 60 Days">Net 60 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">Vendor Rating (1-5)</label>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
              >
                <option value="5">5.0 ★★★★★</option>
                <option value="4.5">4.5 ★★★★½</option>
                <option value="4">4.0 ★★★★☆</option>
                <option value="3.5">3.5 ★★★☆☆</option>
                <option value="3">3.0 ★★★☆☆</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy mb-1">Supplier Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
              className="w-full px-3 py-2 text-xs bg-mint/30 border border-border rounded-lg text-text-primary font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal focus:border-teal"
            >
              <option value="ACTIVE">ACTIVE (Authorized for Purchase Orders)</option>
              <option value="INACTIVE">INACTIVE (Procurement Hold)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
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
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Onboard Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

