'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/app/components/sidebar';
import Navbar from '@/app/components/navbar';
import { api } from '@/lib/api';
import {
  Building2,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  ShieldCheck,
} from 'lucide-react';

export default function CompanySettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(true);

  const [settings, setSettings] = useState({
    companyName: 'A2V Printing Solutions',
    legalEntityName: '',
    gstin: '',
    pan: '',
    phone: '',
    email: '',
    website: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    },
  });

  const fetchCompanySettings = async () => {
    try {
      setLoading(true);
      const [settingsRes, tenantRes] = await Promise.allSettled([
        api.get('/settings'),
        api.get('/tenants/current'),
      ]);

      let merged = { ...settings };

      if (tenantRes.status === 'fulfilled' && tenantRes.value?.data?.tenant) {
        const t = tenantRes.value.data.tenant;
        if (t.name) merged.companyName = t.name;
        if (t.gstin) merged.gstin = t.gstin;
        if (t.phone) merged.phone = t.phone;
        if (t.email) merged.email = t.email;
      }

      if (settingsRes.status === 'fulfilled' && settingsRes.value?.data) {
        const s = settingsRes.value.data;
        merged = {
          ...merged,
          ...s,
          gstin: s.gstin || merged.gstin,
          address: {
            ...merged.address,
            ...(s.address || {}),
          },
        };
      }

      setSettings(merged);
    } catch (err) {
      if (err?.message?.includes('403')) {
        setIsAuthorized(false);
      }
      console.error('Failed to load company settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const role = (localStorage.getItem('userRole') || '').toLowerCase();
    if (!role.includes('admin') && role !== 'ceo_admin') {
      setIsAuthorized(false);
    }
    fetchCompanySettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessMsg('');
      const cleanGstin = (settings.gstin || '').trim().toUpperCase();
      const cleanEmail = (settings.email || '').trim();

      const payload = {
        companyName: settings.companyName.trim(),
        legalEntityName: (settings.legalEntityName || '').trim(),
        gstin: cleanGstin,
        pan: (settings.pan || '').trim().toUpperCase(),
        phone: (settings.phone || '').trim(),
        email: cleanEmail || '',
        website: (settings.website || '').trim(),
        currency: settings.currency,
        timezone: settings.timezone,
        address: settings.address,
      };

      // 1. Update Settings collection
      await api.patch('/settings', payload);

      // 2. Also directly update Tenant document so /tenants/current and PDFs update immediately
      try {
        const tenantPayload = {
          name: payload.companyName,
          gstin: cleanGstin,
        };
        if (cleanEmail) tenantPayload.email = cleanEmail;
        if (payload.phone) tenantPayload.phone = payload.phone;
        await api.patch('/tenants/current', tenantPayload);
      } catch (tErr) {
        console.warn('Tenant sync notice:', tErr.message);
      }

      // 3. Update localStorage user snapshot
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        if (u.tenant) {
          u.tenant.gstin = cleanGstin;
          u.tenant.name = payload.companyName;
          localStorage.setItem('user', JSON.stringify(u));
        }
      } catch (lsErr) {}

      setSuccessMsg('Company settings & GSTIN successfully updated and synced across all invoices and quotes.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <div className="p-8 max-w-2xl mx-auto w-full text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900">403 — Access Denied</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Company profile configuration is restricted to System Administrators.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Building2 className="w-6 h-6 text-blue-600" />
                Company Profile & Commercial Identity
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Canonical tenant identity, legal registration, GSTIN, and tax invoice branding
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/admin/settings/system"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs hover:bg-slate-50"
              >
                <Sliders className="w-3.5 h-3.5" />
                System Settings →
              </Link>
            </div>
          </div>

          {/* Settings Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
            <Link
              href="/dashboard/admin/settings/company"
              className="px-3 py-1.5 rounded-xl bg-blue-600 text-white shadow-xs"
            >
              Company Identity
            </Link>
            <Link
              href="/dashboard/admin/settings/system"
              className="px-3 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              System Business Rules
            </Link>
          </div>

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {successMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6 text-xs">
            {/* Section 1: Business Name */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                1. Legal Entity & Brand Name
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Company Display Name *</label>
                  <input
                    type="text"
                    required
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Legal Registered Entity Name</label>
                  <input
                    type="text"
                    placeholder="e.g. A2V Print Solutions Pvt Ltd"
                    value={settings.legalEntityName || ''}
                    onChange={(e) => setSettings({ ...settings, legalEntityName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Tax & Compliance */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                2. Tax Compliance & Financial Identifiers
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    placeholder="07AAAAA0000A1Z5"
                    value={settings.gstin || ''}
                    onChange={(e) => setSettings({ ...settings, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">PAN Number</label>
                  <input
                    type="text"
                    placeholder="AAAAA0000A"
                    value={settings.pan || ''}
                    onChange={(e) => setSettings({ ...settings, pan: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Contact & Communication */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                3. Official Contact Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={settings.phone || ''}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Official Email</label>
                  <input
                    type="email"
                    value={settings.email || ''}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Website URL</label>
                  <input
                    type="url"
                    placeholder="https://company.com"
                    value={settings.website || ''}
                    onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Registered Address */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                4. Registered Business Address
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Street Address</label>
                  <input
                    type="text"
                    placeholder="Building / Plot / Street / Industrial Area"
                    value={settings.address.street || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      address: { ...settings.address, street: e.target.value },
                    })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">City</label>
                    <input
                      type="text"
                      value={settings.address.city || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        address: { ...settings.address, city: e.target.value },
                      })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">State</label>
                    <input
                      type="text"
                      value={settings.address.state || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        address: { ...settings.address, state: e.target.value },
                      })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Pincode</label>
                    <input
                      type="text"
                      value={settings.address.pincode || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        address: { ...settings.address, pincode: e.target.value },
                      })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Country</label>
                    <input
                      type="text"
                      value={settings.address.country || 'India'}
                      onChange={(e) => setSettings({
                        ...settings,
                        address: { ...settings.address, country: e.target.value },
                      })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving Settings...' : 'Save Company Settings'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
