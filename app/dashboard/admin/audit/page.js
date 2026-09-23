"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import {
  History,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Shield,
  FileText,
} from "lucide-react";

export default function AuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [userEmailSearch, setUserEmailSearch] = useState("");

  // Selected Log Drawer
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchAuditLogs = async (targetPage = page) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: targetPage.toString(),
        limit: "20",
      });
      if (moduleFilter) queryParams.set("collectionName", moduleFilter);
      if (actionFilter) queryParams.set("action", actionFilter);
      if (userEmailSearch) queryParams.set("actorEmail", userEmailSearch);

      const res = await api.get(`/audit-logs?${queryParams.toString()}`);
      if (res && res.data) {
        setLogs(res.data);
        if (res.meta) {
          setPage(res.meta.page || targetPage);
          setTotalPages(res.meta.totalPages || 1);
          setTotalRecords(res.meta.total || res.data.length);
        }
      }
    } catch (err) {
      if (err?.message?.includes("403")) {
        setIsAuthorized(false);
      }
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const role = (localStorage.getItem("userRole") || "").toLowerCase();
    if (!role.includes("admin") && role !== "ceo_admin") {
      setIsAuthorized(false);
    }
    fetchAuditLogs(1);
  }, [moduleFilter, actionFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAuditLogs(1);
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
            <h2 className="text-xl font-black text-slate-900">
              403 — Access Denied
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enterprise audit log inspection is restricted to System
              Administrators.
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
                <History className="w-6 h-6 text-blue-600" />
                System Audit & Security Logs
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Immutable record of administrative modifications, discount
                approvals, status transitions, and user actions
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchAuditLogs(page)}
                disabled={loading}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs"
                title="Refresh"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex-1 md:max-w-md"
            >
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by actor email (e.g. admin@)..."
                value={userEmailSearch}
                onChange={(e) => setUserEmailSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-xs"
              />
            </form>

            <div className="flex items-center gap-2">
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="bg-white border border-slate-200 text-xs font-semibold px-3 py-2 rounded-xl text-slate-700 shadow-xs"
              >
                <option value="">All Modules</option>
                <option value="USERS">Users</option>
                <option value="ROLES">Roles</option>
                <option value="SETTINGS">Settings</option>
                <option value="LEADS">Leads</option>
                <option value="CUSTOMERS">Customers</option>
                <option value="QUOTATIONS">Quotations</option>
                <option value="ORDERS">Orders</option>
                <option value="PAYMENTS">Payments</option>
                <option value="DESIGN_PROJECTS">Design Projects</option>
              </select>

              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-white border border-slate-200 text-xs font-semibold px-3 py-2 rounded-xl text-slate-700 shadow-xs"
              >
                <option value="">All Actions</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="APPROVE">APPROVE</option>
                <option value="ASSIGN">ASSIGN</option>
                <option value="OVERRIDE">OVERRIDE</option>
              </select>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <th className="pb-3">Timestamp</th>
                    <th className="pb-3">Actor / User</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Action</th>
                    <th className="pb-3">Module</th>
                    <th className="pb-3">Entity ID</th>
                    <th className="pb-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {logs.length > 0 ? (
                    logs.map((item) => (
                      <tr
                        key={item._id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-3.5 text-slate-500 font-mono text-[11px]">
                          {new Date(
                            item.timestamp || Date.now(),
                          ).toLocaleString()}
                        </td>
                        <td className="py-3.5 font-bold text-slate-900">
                          {item.actorEmail || "System"}
                        </td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {item.actorRole || "ADMIN"}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              item.action === "CREATE"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : item.action === "DELETE"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : item.action === "OVERRIDE"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {item.action || "UPDATE"}
                          </span>
                        </td>
                        <td className="py-3.5 font-semibold text-slate-800">
                          {item.collectionName || "RESOURCE"}
                        </td>
                        <td className="py-3.5 font-mono text-[11px] text-slate-500">
                          {item.documentId ? item.documentId.slice(-8) : "—"}
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => setSelectedLog(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors"
                            title="View Diff Metadata"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-slate-400 text-xs"
                      >
                        No audit events match the selected criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
              <span className="text-slate-500">
                Showing page <strong className="text-slate-900">{page}</strong>{" "}
                of <strong className="text-slate-900">{totalPages}</strong> (
                {totalRecords} records)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchAuditLogs(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => fetchAuditLogs(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Audit Detail Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-end">
          <div className="bg-white w-full max-w-xl h-full p-6 space-y-6 shadow-2xl overflow-y-auto animate-slide-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Audit Record
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Event #{selectedLog._id.slice(-8)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-md bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-slate-400 block mb-0.5">Actor</span>
                  <span className="font-bold text-slate-900">
                    {selectedLog.actorEmail || "System"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Role</span>
                  <span className="font-bold text-slate-900">
                    {selectedLog.actorRole || "ADMIN"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Action</span>
                  <span className="font-bold text-blue-600">
                    {selectedLog.action}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Module</span>
                  <span className="font-bold text-slate-900">
                    {selectedLog.collectionName}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block mb-0.5">
                    Target Document ID
                  </span>
                  <span className="font-mono text-slate-800">
                    {selectedLog.documentId}
                  </span>
                </div>
              </div>

              {/* State Metadata Diff */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">
                  Modified State Metadata
                </h4>
                <div className="p-4 rounded-md bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-96">
                  <pre>{JSON.stringify(selectedLog.diff || {}, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
