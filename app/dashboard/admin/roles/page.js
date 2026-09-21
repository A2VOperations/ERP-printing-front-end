'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/sidebar';
import Navbar from '@/app/components/navbar';
import { api } from '@/lib/api';
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Lock,
  CheckCircle2,
} from 'lucide-react';

const MODULE_RESOURCES = [
  { id: 'LEADS', name: 'Leads & Inquiries' },
  { id: 'CUSTOMERS', name: 'Clients / Customers' },
  { id: 'FOLLOWUPS', name: 'Follow-ups' },
  { id: 'QUOTATIONS', name: 'Quotations & Pricing' },
  { id: 'ORDERS', name: 'Orders & Commercials' },
  { id: 'PAYMENTS', name: 'Payments & Ledgers' },
  { id: 'DESIGN_PROJECTS', name: 'Design Studio & Proofs' },
  { id: 'PRODUCTION', name: 'Outsourced Production' },
  { id: 'DELIVERIES', name: 'Logistics & Deliveries' },
  { id: 'REPORTS', name: 'Reporting & Analytics' },
  { id: 'DOCUMENTS', name: 'Documents & Artwork' },
  { id: 'AREAS', name: 'Areas & Territories' },
  { id: 'USERS', name: 'User Accounts' },
  { id: 'SETTINGS', name: 'System / Company Settings' },
];

const ACTIONS = ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'ASSIGN', 'OVERRIDE'];

// Canonical fallback standard roles guarantee matrix is never blank
const DEFAULT_STANDARD_ROLES = [
  {
    slug: 'admin',
    name: 'CEO / Super Admin',
    description: 'Unrestricted enterprise control and strategic oversight across all company resources.',
    isSystemDefault: true,
    permissions: [{ resource: '*', action: '*', dataScope: 'ALL' }],
  },
  {
    slug: 'manager',
    name: 'Branch / Sales Manager',
    description: 'Team management, lead distribution, quotation approvals, and performance oversight.',
    isSystemDefault: true,
    permissions: [
      { resource: 'CUSTOMERS', action: 'VIEW', dataScope: 'TEAM' },
      { resource: 'CUSTOMERS', action: 'CREATE', dataScope: 'TEAM' },
      { resource: 'CUSTOMERS', action: 'UPDATE', dataScope: 'TEAM' },
      { resource: 'LEADS', action: 'VIEW', dataScope: 'TEAM' },
      { resource: 'LEADS', action: 'CREATE', dataScope: 'TEAM' },
      { resource: 'LEADS', action: 'UPDATE', dataScope: 'TEAM' },
      { resource: 'LEADS', action: 'ASSIGN', dataScope: 'TEAM' },
      { resource: 'FOLLOWUPS', action: 'VIEW', dataScope: 'TEAM' },
      { resource: 'FOLLOWUPS', action: 'CREATE', dataScope: 'TEAM' },
      { resource: 'FOLLOWUPS', action: 'UPDATE', dataScope: 'TEAM' },
      { resource: 'QUOTATIONS', action: 'VIEW', dataScope: 'TEAM' },
      { resource: 'QUOTATIONS', action: 'CREATE', dataScope: 'TEAM' },
      { resource: 'QUOTATIONS', action: 'APPROVE', dataScope: 'TEAM' },
      { resource: 'ORDERS', action: 'VIEW', dataScope: 'TEAM' },
      { resource: 'ORDERS', action: 'CREATE', dataScope: 'TEAM' },
      { resource: 'PAYMENTS', action: 'VIEW', dataScope: 'TEAM' },
      { resource: 'PAYMENTS', action: 'CREATE', dataScope: 'TEAM' },
      { resource: 'DESIGN_PROJECTS', action: 'VIEW', dataScope: 'TEAM' },
      { resource: 'PRODUCTION', action: 'VIEW', dataScope: 'ALL' },
      { resource: 'DELIVERIES', action: 'VIEW', dataScope: 'ALL' },
      { resource: 'DOCUMENTS', action: 'VIEW', dataScope: 'TEAM' },
      { resource: 'DOCUMENTS', action: 'CREATE', dataScope: 'TEAM' },
      { resource: 'REPORTS', action: 'VIEW', dataScope: 'TEAM' },
      { resource: 'USERS', action: 'VIEW', dataScope: 'TEAM' },
      { resource: 'AREAS', action: 'VIEW', dataScope: 'ALL' },
      { resource: 'SETTINGS', action: 'VIEW', dataScope: 'ALL' },
    ],
  },
  {
    slug: 'sales',
    name: 'Sales Representative',
    description: 'Client communication, quotation preparation, order intake, and follow-up management.',
    isSystemDefault: true,
    permissions: [
      { resource: 'CUSTOMERS', action: 'VIEW', dataScope: 'OWN' },
      { resource: 'CUSTOMERS', action: 'CREATE', dataScope: 'OWN' },
      { resource: 'CUSTOMERS', action: 'UPDATE', dataScope: 'OWN' },
      { resource: 'LEADS', action: 'VIEW', dataScope: 'OWN' },
      { resource: 'LEADS', action: 'CREATE', dataScope: 'OWN' },
      { resource: 'LEADS', action: 'UPDATE', dataScope: 'OWN' },
      { resource: 'FOLLOWUPS', action: 'VIEW', dataScope: 'OWN' },
      { resource: 'FOLLOWUPS', action: 'CREATE', dataScope: 'OWN' },
      { resource: 'FOLLOWUPS', action: 'UPDATE', dataScope: 'OWN' },
      { resource: 'QUOTATIONS', action: 'VIEW', dataScope: 'OWN' },
      { resource: 'QUOTATIONS', action: 'CREATE', dataScope: 'OWN' },
      { resource: 'ORDERS', action: 'VIEW', dataScope: 'OWN' },
      { resource: 'ORDERS', action: 'CREATE', dataScope: 'OWN' },
      { resource: 'PAYMENTS', action: 'VIEW', dataScope: 'OWN' },
      { resource: 'PAYMENTS', action: 'CREATE', dataScope: 'OWN' },
      { resource: 'DOCUMENTS', action: 'VIEW', dataScope: 'OWN' },
      { resource: 'DOCUMENTS', action: 'CREATE', dataScope: 'OWN' },
      { resource: 'REPORTS', action: 'VIEW', dataScope: 'OWN' },
      { resource: 'AREAS', action: 'VIEW', dataScope: 'ALL' },
    ],
  },
  {
    slug: 'designer',
    name: 'Graphic Designer',
    description: 'Pre-press artwork creation, client proof generation, and revision handling.',
    isSystemDefault: true,
    permissions: [
      { resource: 'DESIGN_PROJECTS', action: 'VIEW', dataScope: 'OWN' },
      { resource: 'DESIGN_PROJECTS', action: 'CREATE', dataScope: 'OWN' },
      { resource: 'DESIGN_PROJECTS', action: 'UPDATE', dataScope: 'OWN' },
      { resource: 'DOCUMENTS', action: 'VIEW', dataScope: 'OWN' },
      { resource: 'DOCUMENTS', action: 'CREATE', dataScope: 'OWN' },
      { resource: 'CUSTOMERS', action: 'VIEW', dataScope: 'ALL' },
      { resource: 'ORDERS', action: 'VIEW', dataScope: 'ALL' },
      { resource: 'REPORTS', action: 'VIEW', dataScope: 'OWN' },
    ],
  },
];

export default function RolesPermissionsPage() {
  const router = useRouter();
  const [roles, setRoles] = useState(DEFAULT_STANDARD_ROLES);
  const [selectedRoleSlug, setSelectedRoleSlug] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(true);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/roles');
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setRoles(res.data);
      }
    } catch (err) {
      if (err?.message?.includes('403')) {
        setIsAuthorized(false);
      }
      console.error('Failed to fetch roles from server, preserving canonical roles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const role = (localStorage.getItem('userRole') || '').toLowerCase();
    if (!role.includes('admin') && role !== 'ceo_admin' && role !== 'super_admin') {
      setIsAuthorized(false);
    }
    fetchRoles();
  }, []);

  const activeRole =
    roles.find((r) => r.slug === selectedRoleSlug) ||
    DEFAULT_STANDARD_ROLES.find((r) => r.slug === selectedRoleSlug) ||
    roles[0] ||
    DEFAULT_STANDARD_ROLES[0];

  // Helper to resolve permission for a specific module and action
  const getPermissionFor = (resourceId, action) => {
    if (!activeRole || !activeRole.permissions) return 'NONE';

    // Check wildcard match
    const hasWildcard = activeRole.permissions.some(
      (p) => (p.resource === '*' || p.resource === 'ALL') && (p.action === '*' || p.action === 'ALL')
    );
    if (hasWildcard) return 'ALL';

    const directMatch = activeRole.permissions.find(
      (p) =>
        (p.resource?.toUpperCase() === resourceId.toUpperCase() || p.resource === '*') &&
        (p.action?.toUpperCase() === action.toUpperCase() || p.action === '*')
    );

    if (directMatch) {
      return directMatch.dataScope || 'ALL';
    }

    return 'NONE';
  };

  const getScopeBadgeColor = (scope) => {
    switch (scope) {
      case 'ALL':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
      case 'TEAM':
        return 'bg-purple-50 text-purple-700 border-purple-200 font-bold';
      case 'AREA':
        return 'bg-blue-50 text-blue-700 border-blue-200 font-bold';
      case 'OWN':
        return 'bg-amber-50 text-amber-700 border-amber-200 font-bold';
      default:
        return 'text-slate-300 font-normal';
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
              Roles and permissions policy governance is restricted to System Administrators.
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

        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
                Roles & Permissions Policy Matrix
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Live role governance and data scope enforcement (ALL · AREA · TEAM · OWN · NONE)
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchRoles}
                disabled={loading}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs transition"
                title="Refresh from server"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* 4 Role Selector Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['admin', 'manager', 'sales', 'designer'].map((slug) => {
              const isSelected = selectedRoleSlug === slug;
              const roleInfo =
                roles.find((r) => r.slug === slug) ||
                DEFAULT_STANDARD_ROLES.find((r) => r.slug === slug);

              return (
                <button
                  key={slug}
                  onClick={() => setSelectedRoleSlug(slug)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-blue-50/90 border-blue-400 text-blue-900 shadow-sm ring-1 ring-blue-400/30'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold uppercase tracking-wider block text-slate-500">
                      {slug.toUpperCase()}
                    </span>
                    {slug === 'admin' && <Lock className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <h4 className="font-extrabold text-sm mt-0.5 text-slate-900">{roleInfo?.name || slug}</h4>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{roleInfo?.description || 'System Role'}</p>
                </button>
              );
            })}
          </div>

          {/* Policy Safety Warning Banner */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs shadow-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">Role Governance & Safety Rails Active</span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                System default roles are enforced by server-side middleware (`tenantContext` & `authorize`).
                Granting `OVERRIDE` or changing dataScopes to `ALL` requires elevated administrative authorization.
              </p>
            </div>
          </div>

          {/* Permissions Matrix Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Permission Matrix for</span>
                <span className="text-blue-600 font-extrabold">
                  {activeRole?.name || selectedRoleSlug.toUpperCase()}
                </span>
              </h3>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">ALL</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-bold">TEAM</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">AREA</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold">OWN</span>
                <span className="text-slate-400 font-medium ml-1">· Dashes (—) indicate no access</span>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-3 px-4">Module / Resource</th>
                    {ACTIONS.map((action) => (
                      <th key={action} className="py-3 px-3 text-center">{action}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {MODULE_RESOURCES.map((mod) => (
                    <tr key={mod.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{mod.name}</td>
                      {ACTIONS.map((action) => {
                        const scope = getPermissionFor(mod.id, action);
                        const isGranted = scope !== 'NONE';

                        return (
                          <td key={action} className="py-3.5 px-3 text-center">
                            {isGranted ? (
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] border shadow-2xs ${getScopeBadgeColor(scope)}`}>
                                {scope}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-bold select-none">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
