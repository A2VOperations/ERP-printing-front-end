'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/app/components/sidebar';
import Navbar from '@/app/components/navbar';
import { api } from '@/lib/api';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  Edit2,
  Building2,
  Filter,
  X,
  ExternalLink,
  Layers,
  ArrowRight,
} from 'lucide-react';

const PARTNER_TYPES = [
  { key: 'ALL', label: 'All Partners' },
  { key: 'PRINT_VENDOR', label: 'Print Vendors' },
  { key: 'ARTISAN', label: 'Artisans' },
  { key: 'OUTSIDE_PRINTER', label: 'Outside Printers' },
  { key: 'OTHER', label: 'Other' },
];

export default function ProductionPartnersPage() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'PRINT_VENDOR',
    contactPerson: '',
    phone: '',
    email: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    notes: '',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/production-partners');
      const data = res?.data?.data || res?.data || [];
      setPartners(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch production partners:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const openAddModal = () => {
    setEditingPartner(null);
    setFormData({
      name: '',
      type: 'PRINT_VENDOR',
      contactPerson: '',
      phone: '',
      email: '',
      street: '',
      city: '',
      state: '',
      pincode: '',
      notes: '',
      isActive: true,
    });
    setErrorMsg('');
    setShowAddModal(true);
  };

  const openEditModal = (partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name || '',
      type: partner.type || 'PRINT_VENDOR',
      contactPerson: partner.contactPerson || '',
      phone: partner.phone || '',
      email: partner.email || '',
      street: partner.address?.street || '',
      city: partner.address?.city || '',
      state: partner.address?.state || '',
      pincode: partner.address?.pincode || '',
      notes: partner.notes || '',
      isActive: partner.isActive !== false,
    });
    setErrorMsg('');
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Partner name is required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        contactPerson: formData.contactPerson.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
        },
        notes: formData.notes.trim(),
        isActive: formData.isActive,
      };

      if (editingPartner) {
        await api.patch(`/production-partners/${editingPartner._id}`, payload);
        setSuccessToast(`Partner ${payload.name} updated successfully!`);
      } else {
        await api.post('/production-partners', payload);
        setSuccessToast(`Partner ${payload.name} added successfully!`);
      }

      setShowAddModal(false);
      fetchPartners();
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to save partner.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (partner) => {
    try {
      await api.patch(`/production-partners/${partner._id}`, {
        isActive: !partner.isActive,
      });
      fetchPartners();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const matchesType = selectedType === 'ALL' || p.type === selectedType;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.partnerCode && p.partnerCode.toLowerCase().includes(q)) ||
        (p.contactPerson && p.contactPerson.toLowerCase().includes(q)) ||
        (p.phone && p.phone.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q));
      return matchesType && matchesSearch;
    });
  }, [partners, selectedType, searchQuery]);

  const countsByType = useMemo(() => {
    const counts = { ALL: partners.length, PRINT_VENDOR: 0, ARTISAN: 0, OUTSIDE_PRINTER: 0, OTHER: 0 };
    partners.forEach((p) => {
      if (counts[p.type] !== undefined) counts[p.type]++;
      else counts.OTHER++;
    });
    return counts;
  }, [partners]);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 antialiased overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Production Partners & Artisans</h1>
                    <p className="text-sm text-slate-400">
                      External printing partners, artisans, and outside production vendors
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchPartners}
                  disabled={loading}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Refresh Partners"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
                </button>

                <button
                  onClick={openAddModal}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/20"
                >
                  <Plus className="w-4 h-4" />
                  Add Partner / Artisan
                </button>
              </div>
            </div>

            {/* Success Toast */}
            {successToast && (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 flex items-center justify-between text-sm animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{successToast}</span>
                </div>
                <button onClick={() => setSuccessToast('')} className="text-emerald-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {PARTNER_TYPES.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedType(tab.key)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                      selectedType === tab.key
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-slate-900/80 border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                        selectedType === tab.key ? 'bg-indigo-700/80 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {countsByType[tab.key] || 0}
                    </span>
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search partner, code, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {/* Partner Cards Grid */}
            {loading ? (
              <div className="py-20 text-center text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-400" />
                <p className="text-sm">Loading printing partners...</p>
              </div>
            ) : filteredPartners.length === 0 ? (
              <div className="py-20 text-center bg-slate-900/40 border border-slate-800/60 rounded-2xl p-8">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <h3 className="text-base font-semibold text-slate-300 mb-1">No Partners Found</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto mb-5">
                  {searchQuery
                    ? `No partners match your search "${searchQuery}".`
                    : 'Get started by registering an outsourced print vendor or external artisan.'}
                </p>
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition"
                >
                  <Plus className="w-4 h-4" />
                  Add First Partner
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredPartners.map((partner) => (
                  <div
                    key={partner._id}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between group shadow-sm hover:shadow-md"
                  >
                    <div>
                      {/* Top Meta */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                              {partner.partnerCode || 'VENDOR'}
                            </span>
                            <span
                              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                partner.type === 'ARTISAN'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : partner.type === 'OUTSIDE_PRINTER'
                                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              }`}
                            >
                              {partner.type.replace('_', ' ')}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-white mt-1.5 group-hover:text-indigo-400 transition">
                            {partner.name}
                          </h3>
                        </div>

                        <button
                          onClick={() => toggleStatus(partner)}
                          className={`p-1.5 rounded-lg transition ${
                            partner.isActive
                              ? 'text-emerald-400 hover:bg-emerald-500/10'
                              : 'text-slate-600 hover:bg-slate-800'
                          }`}
                          title={partner.isActive ? 'Active (click to deactivate)' : 'Inactive (click to activate)'}
                        >
                          {partner.isActive ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        </button>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2 text-xs text-slate-400 py-3 border-y border-slate-800/80">
                        {partner.contactPerson && (
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            <span className="text-slate-300 font-medium">{partner.contactPerson}</span>
                          </div>
                        )}
                        {partner.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            <a href={`tel:${partner.phone}`} className="hover:text-indigo-400 transition">
                              {partner.phone}
                            </a>
                          </div>
                        )}
                        {partner.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            <a href={`mailto:${partner.email}`} className="hover:text-indigo-400 transition truncate">
                              {partner.email}
                            </a>
                          </div>
                        )}
                        {(partner.address?.city || partner.address?.state) && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            <span>
                              {[partner.address?.city, partner.address?.state].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      {partner.notes && (
                        <p className="mt-3 text-xs text-slate-500 italic line-clamp-2">
                          "{partner.notes}"
                        </p>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-4 pt-3 flex items-center justify-between gap-2">
                      <Link
                        href={`/dashboard/production?partnerId=${partner._id}`}
                        className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition font-medium"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        View Jobs
                        <ArrowRight className="w-3 h-3" />
                      </Link>

                      <button
                        onClick={() => openEditModal(partner)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add / Edit Partner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">
                {editingPartner ? `Edit Partner: ${editingPartner.name}` : 'Add Printing Partner / Artisan'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Partner / Artisan Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Apex Offset Printers, Radhe Screen Works"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Partner Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="PRINT_VENDOR">Print Vendor</option>
                    <option value="ARTISAN">Artisan</option>
                    <option value="OUTSIDE_PRINTER">Outside Printer</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Primary contact name"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Phone / Mobile
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jobs@printpartner.com"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Mumbai"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Maharashtra"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Specializations & Notes
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. Specialists in wide-format banners, UV printing, foil stamping..."
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition resize-none"
                  />
                </div>

                <div className="col-span-2 flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-800 focus:ring-indigo-500"
                  />
                  <label htmlFor="isActiveCheck" className="text-xs text-slate-300 select-none">
                    Active (Available for new production releases)
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition text-xs font-medium shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingPartner ? 'Update Partner' : 'Create Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
