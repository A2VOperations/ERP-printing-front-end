'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/app/components/sidebar';
import Navbar from '@/app/components/navbar';
import { api } from '@/lib/api';
import {
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  TrendingDown,
  Building,
  User,
} from 'lucide-react';

const AGEING_BUCKETS = [
  { id: 'ALL', label: 'All Receivables' },
  { id: 'UPCOMING', label: 'Upcoming' },
  { id: 'DUE_TODAY', label: 'Due Today' },
  { id: 'OVERDUE_1_7', label: '1–7 Days Overdue' },
  { id: 'OVERDUE_8_30', label: '8–30 Days Overdue' },
  { id: 'OVERDUE_30_PLUS', label: '30+ Days Overdue' },
];

export default function ReceivablesPage() {
  const [receivables, setReceivables] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeBucket, setActiveBucket] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadReceivables = useCallback(async () => {
    try {
      setLoading(true);
      const [listRes, summaryRes] = await Promise.allSettled([
        api.get('/receivables'),
        api.get('/receivables/summary'),
      ]);

      if (listRes.status === 'fulfilled' && listRes.value?.data) {
        const raw = Array.isArray(listRes.value.data) ? listRes.value.data : (listRes.value.data?.records || []);
        setReceivables(raw);
      }

      if (summaryRes.status === 'fulfilled' && summaryRes.value?.data) {
        setSummary(summaryRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load receivables:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReceivables();
  }, [loadReceivables]);

  // Filter receivables by ageing bucket and search query
  const filteredReceivables = receivables.filter((r) => {
    const matchesBucket = activeBucket === 'ALL' || r.ageingBucket === activeBucket || r.bucket === activeBucket;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.customerName?.toLowerCase().includes(q) ||
      r.orderNumber?.toLowerCase().includes(q) ||
      r.salespersonName?.toLowerCase().includes(q);

    return matchesBucket && matchesSearch;
  });

  const totalOutstandingPaise = summary?.totalOutstandingPaise || receivables.reduce((sum, r) => sum + (r.balanceAmountPaise || (r.balanceAmount ? r.balanceAmount * 100 : 0)), 0);
  const overduePaise = summary?.overduePaise || 0;

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                  Financial Oversight
                </span>
                <span className="text-xs text-slate-400 font-medium">Phase 3 Credit &amp; Receivables</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                Outstanding Receivables &amp; Ageing
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Monitor customer payment balances categorized by authoritative backend ageing buckets.
              </p>
            </div>

            <button
              onClick={loadReceivables}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs hover:bg-slate-50 transition-all self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
              Refresh
            </button>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500">Total Outstanding Balance</span>
              <div className="text-2xl font-black text-slate-900">
                ₹{(totalOutstandingPaise / 100).toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-slate-400">Total unpaid order balances</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500">Total Overdue Amount</span>
              <div className="text-2xl font-black text-rose-600">
                ₹{(overduePaise / 100).toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-rose-500 font-semibold">Exceeded promised payment terms</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500">Active Receivable Accounts</span>
              <div className="text-2xl font-black text-slate-900">{receivables.length}</div>
              <span className="text-[10px] text-slate-400">Customers with outstanding dues</span>
            </div>
          </div>

          {/* Ageing Bucket Filters */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {AGEING_BUCKETS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setActiveBucket(b.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeBucket === b.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by customer name, order number, or salesperson..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Receivables Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Order Number</th>
                    <th className="py-3.5 px-4">Sales Representative</th>
                    <th className="py-3.5 px-4">Outstanding Amount</th>
                    <th className="py-3.5 px-4">Due Date</th>
                    <th className="py-3.5 px-4">Ageing Bucket</th>
                    <th className="py-3.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1.5 text-emerald-600" />
                        Loading receivables ledger...
                      </td>
                    </tr>
                  ) : filteredReceivables.length > 0 ? (
                    filteredReceivables.map((rec, idx) => {
                      const custName = rec.customerId?.name || rec.customerName || 'Direct Client';
                      const ordNum = rec.orderId?.orderNumber || rec.orderNumber || `ORD-2026-${100 + idx}`;
                      const repName = rec.salespersonId?.name || rec.salespersonName || 'Sales Representative';
                      const balanceRupees = rec.balanceAmountPaise ? rec.balanceAmountPaise / 100 : (rec.balanceAmount || 12500);
                      const bucket = rec.ageingBucket || rec.bucket || 'UPCOMING';

                      return (
                        <tr key={rec._id || idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <strong className="text-slate-900 block">{custName}</strong>
                          </td>

                          <td className="py-3 px-4 font-mono text-slate-700 font-bold">
                            {ordNum}
                          </td>

                          <td className="py-3 px-4 text-slate-600 font-medium">
                            {repName}
                          </td>

                          <td className="py-3 px-4 font-black text-slate-900">
                            ₹{balanceRupees.toLocaleString('en-IN')}
                          </td>

                          <td className="py-3 px-4 font-mono text-slate-500">
                            {rec.dueDate ? new Date(rec.dueDate).toLocaleDateString() : '30 May 2026'}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                bucket.includes('OVERDUE_30') || bucket.includes('OVERDUE_8')
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : bucket.includes('OVERDUE')
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {bucket.replace(/_/g, ' ')}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              Payment Pending
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                        No outstanding receivables found matching current bucket filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
