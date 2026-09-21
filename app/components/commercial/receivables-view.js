"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../../lib/apiConfig";

export default function ReceivablesView({ user }) {
  const [receivables, setReceivables] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [bucketFilter, setBucketFilter] = useState("all");

  const getHeaders = () => {
    const token = localStorage.getItem("token") || "";
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-user-id": user?.email || user?.id || "",
      "x-user-role": user?.role || "",
    };
  };

  const fetchReceivables = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append("search", search);
      if (bucketFilter !== "all") query.append("ageingBucket", bucketFilter);

      const res = await fetch(`${API_BASE_URL}/api/v1/receivables?${query.toString()}`, {
        headers: getHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setReceivables(json.data || []);
        if (json.meta?.summary) {
          setSummary(json.meta.summary);
        }
      }
    } catch (err) {
      console.error("Error fetching receivables:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivables();
  }, [bucketFilter]);

  const getBucketBadge = (bucket) => {
    const map = {
      DUE_TODAY: "bg-amber-100 text-amber-800 border-amber-300 font-bold",
      OVERDUE_1_7: "bg-orange-100 text-orange-800 border-orange-300",
      OVERDUE_8_30: "bg-rose-100 text-rose-800 border-rose-300",
      OVERDUE_30_PLUS: "bg-red-200 text-red-900 border-red-400 font-bold",
      UPCOMING: "bg-slate-100 text-slate-700 border-slate-300",
    };
    const labels = {
      DUE_TODAY: "Due Today",
      OVERDUE_1_7: "1–7 Days Overdue",
      OVERDUE_8_30: "8–30 Days Overdue",
      OVERDUE_30_PLUS: "30+ Days Overdue",
      UPCOMING: "Upcoming",
    };
    return (
      <span className={`px-2.5 py-1 text-xs rounded-full border ${map[bucket] || "bg-gray-100 text-gray-700"}`}>
        {labels[bucket] || bucket}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Receivables & Overdue Ageing</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor outstanding customer balances and track overdue ageing buckets.
        </p>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-medium">Total Outstanding</div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              ₹{((summary.totalOutstandingPaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
            </div>
          </div>
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-sm">
            <div className="text-xs text-amber-700 font-medium">Due Today</div>
            <div className="text-xl font-bold text-amber-900 mt-1">
              ₹{((summary.dueTodayPaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 shadow-sm">
            <div className="text-xs text-orange-700 font-medium">1–7 Days Overdue</div>
            <div className="text-xl font-bold text-orange-900 mt-1">
              ₹{((summary.overdue1To7Paise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
            </div>
          </div>
          <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 shadow-sm">
            <div className="text-xs text-rose-700 font-medium">8–30 Days Overdue</div>
            <div className="text-xl font-bold text-rose-900 mt-1">
              ₹{((summary.overdue8To30Paise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
            </div>
          </div>
          <div className="bg-red-100 p-4 rounded-xl border border-red-300 shadow-sm">
            <div className="text-xs text-red-800 font-bold">30+ Days Critical</div>
            <div className="text-xl font-bold text-red-950 mt-1">
              ₹{((summary.overdue30PlusPaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by customer, order #, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchReceivables()}
            className="w-full px-4 py-2 pl-9 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select
          value={bucketFilter}
          onChange={(e) => setBucketFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white text-slate-700"
        >
          <option value="all">All Ageing Buckets</option>
          <option value="DUE_TODAY">Due Today</option>
          <option value="OVERDUE_1_7">1–7 Days Overdue</option>
          <option value="OVERDUE_8_30">8–30 Days Overdue</option>
          <option value="OVERDUE_30_PLUS">30+ Days Critical</option>
          <option value="UPCOMING">Upcoming</option>
        </select>
      </div>

      {/* Receivables Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Order Ref</th>
                <th className="px-6 py-3.5">Order Total</th>
                <th className="px-6 py-3.5">Balance Due</th>
                <th className="px-6 py-3.5">Due Date</th>
                <th className="px-6 py-3.5">Ageing Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">Loading receivables...</td>
                </tr>
              ) : receivables.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">Zero outstanding balances found.</td>
                </tr>
              ) : (
                receivables.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{o.customerSnapshot?.displayName || o.customerId?.displayName || "N/A"}</div>
                      <div className="text-xs text-slate-400">{o.customerSnapshot?.phone || o.customerId?.phone || ""}</div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-900">{o.orderNumber}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                      ₹{((o.grandTotalPaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 font-bold text-rose-700">
                      ₹{((o.balancePaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {o.paymentDueDate ? new Date(o.paymentDueDate).toLocaleDateString("en-IN") : "N/A"}
                    </td>
                    <td className="px-6 py-4">{getBucketBadge(o.ageingBucket)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
