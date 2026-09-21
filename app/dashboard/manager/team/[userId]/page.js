'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/app/components/sidebar';
import Navbar from '@/app/components/navbar';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  User,
  Users,
  Clock,
  FileText,
  ShoppingBag,
  DollarSign,
  Target,
  TrendingUp,
  RefreshCw,
  Mail,
  Phone,
  Building,
  CheckCircle2,
  AlertTriangle,
  Award,
} from 'lucide-react';

export default function TeamMemberDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.userId;
  const userId = typeof rawId === 'string' ? rawId : (rawId?.userId || '');

  const [member, setMember] = useState(null);
  const [leads, setLeads] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadMemberProfile = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setErrorMsg('');

      const [userRes, leadsRes, flwRes, quotesRes, ordersRes] = await Promise.allSettled([
        api.get(`/users/${userId}`),
        api.get(`/leads?limit=100`),
        api.get(`/followups?limit=100`),
        api.get(`/quotations?limit=100`),
        api.get(`/orders?limit=100`),
      ]);

      if (userRes.status === 'fulfilled' && userRes.value?.data) {
        setMember(userRes.value.data);
      } else {
        setErrorMsg('Team member profile not found.');
      }

      if (leadsRes.status === 'fulfilled' && leadsRes.value?.data) {
        const list = Array.isArray(leadsRes.value.data) ? leadsRes.value.data : (leadsRes.value.data?.records || []);
        setLeads(list.filter((l) => (l.assignedToId?._id || l.assignedToId) === userId));
      }
      if (flwRes.status === 'fulfilled' && flwRes.value?.data) {
        const list = Array.isArray(flwRes.value.data) ? flwRes.value.data : (flwRes.value.data?.records || []);
        setFollowups(list.filter((f) => (f.assignedToId?._id || f.assignedToId) === userId));
      }
      if (quotesRes.status === 'fulfilled' && quotesRes.value?.data) {
        const list = Array.isArray(quotesRes.value.data) ? quotesRes.value.data : (quotesRes.value.data?.records || []);
        setQuotations(list.filter((q) => (q.createdById?._id || q.createdById) === userId));
      }
      if (ordersRes.status === 'fulfilled' && ordersRes.value?.data) {
        const list = Array.isArray(ordersRes.value.data) ? ordersRes.value.data : (ordersRes.value.data?.records || []);
        setOrders(list.filter((o) => (o.createdById?._id || o.createdById) === userId));
      }
    } catch (err) {
      console.error('Failed to load member profile:', err);
      setErrorMsg(err.message || 'Failed to load details.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadMemberProfile();
  }, [loadMemberProfile]);

  if (loading) {
    return (
      <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <div className="p-16 text-center text-slate-400 text-xs my-auto">
            <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-blue-600" />
            Loading representative profile...
          </div>
        </main>
      </div>
    );
  }

  if (errorMsg || !member) {
    return (
      <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <div className="p-8 max-w-lg mx-auto w-full text-center space-y-4 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{errorMsg || 'Member Not Found'}</h3>
            <Link
              href="/dashboard/manager/team"
              className="inline-block px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
            >
              Back to Team Directory
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const activeLeadsCount = leads.filter((l) => !['WON', 'LOST'].includes(l.status)).length;
  const wonLeadsCount = leads.filter((l) => l.status === 'WON').length;
  const overdueFlws = followups.filter((f) => f.scheduledAt && new Date(f.scheduledAt) < new Date() && f.status !== 'COMPLETED').length;
  const totalOrderValuePaise = orders.reduce((sum, o) => sum + (o.grandTotalPaise || (o.grandTotal ? o.grandTotal * 100 : 0)), 0);
  const conversionRate = leads.length > 0 ? ((wonLeadsCount / leads.length) * 100).toFixed(1) : '0.0';

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard/manager/team"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Team Directory
            </Link>

            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Sales Representative
            </span>
          </div>

          {/* Member Hero Card */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-blue-500/20">
                  {(member.name || 'TM').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">{member.name}</h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Role: <strong className="text-slate-700 capitalize">{member.roleSlug || member.role}</strong> · Territory: <strong className="text-slate-700">{member.areaCode || 'Delhi NCR'}</strong> · Email: <strong className="text-slate-700 font-mono">{member.email}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Orders Won</span>
                  <span className="text-lg font-black text-slate-900">{orders.length}</span>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Revenue</span>
                  <span className="text-lg font-black text-emerald-600">
                    ₹{(totalOrderValuePaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Performance KPIs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-1">
                <span className="text-blue-700 font-semibold block">Active Leads</span>
                <span className="font-black text-slate-900 text-xl">{activeLeadsCount}</span>
                <span className="text-[10px] text-slate-500 block">{wonLeadsCount} won to date</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 space-y-1">
                <span className="text-amber-700 font-semibold block">Overdue Follow-ups</span>
                <span className="font-black text-amber-900 text-xl">{overdueFlws}</span>
                <span className="text-[10px] text-slate-500 block">{followups.length} total touchpoints</span>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-1">
                <span className="text-purple-700 font-semibold block">Quotations Created</span>
                <span className="font-black text-purple-900 text-xl">{quotations.length}</span>
                <span className="text-[10px] text-slate-500 block">Commercial proposals</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                <span className="text-emerald-700 font-semibold block">Win Conversion Rate</span>
                <span className="font-black text-emerald-900 text-xl">{conversionRate}%</span>
                <span className="text-[10px] text-slate-500 block">{wonLeadsCount} won out of {leads.length} leads</span>
              </div>
            </div>
          </div>

          {/* Member Assigned Leads Breakdown */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
              Assigned Leads Portfolio ({leads.length})
            </h3>

            {leads.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {leads.slice(0, 10).map((l) => (
                  <div key={l._id} className="py-3 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900 font-bold block">{l.businessName || l.contactName}</strong>
                      <span className="text-slate-500 text-[11px] font-mono">{l.phone || 'No phone'} · {l.requirement || 'General Print'}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-black text-slate-900">
                        ₹{(l.expectedValue || l.estimatedBudget || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {l.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No active leads assigned to this representative.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
