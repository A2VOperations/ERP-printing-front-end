"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import {
  Users,
  UserCheck,
  Target,
  Clock,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Mail,
  Phone,
  Building,
  MapPin,
} from "lucide-react";

export default function MyTeamPage() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadTeamData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, leadsRes, flwRes, quotesRes, ordersRes] =
        await Promise.allSettled([
          api.get("/users"),
          api.get("/leads?limit=100"),
          api.get("/followups?limit=100"),
          api.get("/quotations?limit=100"),
          api.get("/orders?limit=100"),
        ]);

      if (usersRes.status === "fulfilled" && usersRes.value?.data) {
        const usersList = Array.isArray(usersRes.value.data)
          ? usersRes.value.data
          : usersRes.value.data?.records || [];
        setTeamMembers(
          usersList.filter(
            (u) =>
              u.roleSlug === "sales" ||
              u.role === "sales" ||
              u.role?.name?.toLowerCase().includes("sales"),
          ),
        );
      }
      if (leadsRes.status === "fulfilled" && leadsRes.value?.data) {
        const list = Array.isArray(leadsRes.value.data)
          ? leadsRes.value.data
          : leadsRes.value.data?.records || [];
        setLeads(list);
      }
      if (flwRes.status === "fulfilled" && flwRes.value?.data) {
        const list = Array.isArray(flwRes.value.data)
          ? flwRes.value.data
          : flwRes.value.data?.records || [];
        setFollowups(list);
      }
      if (quotesRes.status === "fulfilled" && quotesRes.value?.data) {
        const list = Array.isArray(quotesRes.value.data)
          ? quotesRes.value.data
          : quotesRes.value.data?.records || [];
        setQuotations(list);
      }
      if (ordersRes.status === "fulfilled" && ordersRes.value?.data) {
        const list = Array.isArray(ordersRes.value.data)
          ? ordersRes.value.data
          : ordersRes.value.data?.records || [];
        setOrders(list);
      }
    } catch (err) {
      console.error("Failed to load team data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  const filteredMembers = teamMembers.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q)
    );
  });

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
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wide">
                  Team Operations
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Sales Representatives
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                My Team Directory
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Monitor workload distribution, active pipelines, and performance
                across your sales team.
              </p>
            </div>

            <button
              onClick={loadTeamData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs hover:bg-slate-50 transition-all self-start sm:self-auto"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : "text-slate-500"}`}
              />
              Refresh
            </button>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search team member by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <span className="text-xs font-bold text-slate-500">
              {filteredMembers.length} Representative
              {filteredMembers.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Team Table */}
          <div className="bg-white rounded-md border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Sales Representative</th>
                    <th className="py-3.5 px-4">Role / Area</th>
                    <th className="py-3.5 px-4">Active Leads</th>
                    <th className="py-3.5 px-4">Overdue Follow-ups</th>
                    <th className="py-3.5 px-4">Quotations</th>
                    <th className="py-3.5 px-4">Orders Won</th>
                    <th className="py-3.5 px-4">Revenue Generated</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-12 text-center text-slate-400 text-xs"
                      >
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1.5 text-blue-600" />
                        Loading team roster...
                      </td>
                    </tr>
                  ) : filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => {
                      const mLeads = leads.filter(
                        (l) =>
                          (l.assignedToId?._id || l.assignedToId) ===
                          member._id,
                      );
                      const now = new Date();
                      const mOverdue = followups.filter(
                        (f) =>
                          (f.assignedToId?._id || f.assignedToId) ===
                            member._id &&
                          f.scheduledAt &&
                          new Date(f.scheduledAt) < now &&
                          f.status !== "COMPLETED",
                      ).length;
                      const mQuotes = quotations.filter(
                        (q) =>
                          (q.createdById?._id || q.createdById) === member._id,
                      ).length;
                      const mOrders = orders.filter(
                        (o) =>
                          (o.createdById?._id || o.createdById) === member._id,
                      );
                      const mRevenue = mOrders.reduce(
                        (sum, o) =>
                          sum +
                          (o.grandTotalPaise
                            ? o.grandTotalPaise / 100
                            : o.grandTotal || 0),
                        0,
                      );

                      return (
                        <tr
                          key={member._id}
                          className="hover:bg-slate-50/60 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                                {(member.name || "TM")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                              <div>
                                <strong className="text-slate-900 block">
                                  {member.name}
                                </strong>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {member.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-slate-600">
                            <span className="font-semibold block capitalize">
                              {member.roleSlug || member.role || "Sales"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {member.areaCode || "Delhi NCR"}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-bold text-slate-900">
                            {mLeads.length} Leads
                          </td>

                          <td className="py-3 px-4">
                            {mOverdue > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                {mOverdue} Overdue
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">
                                0
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 font-bold text-slate-700">
                            {mQuotes}
                          </td>

                          <td className="py-3 px-4 font-bold text-slate-900">
                            {mOrders.length}
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-emerald-600">
                              ₹
                              {mRevenue.toLocaleString("en-IN", {
                                maximumFractionDigits: 0,
                              })}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Active
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <Link
                              href={`/dashboard/manager/team/${member._id}`}
                              className="px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200"
                            >
                              Inspect Member →
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-12 text-center text-slate-400 text-xs"
                      >
                        No sales team members found.
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
