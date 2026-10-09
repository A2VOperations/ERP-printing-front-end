"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import {
  Layers,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronRight,
  Eye,
  Plus,
  X,
  AlertCircle,
  Truck,
  Send,
  Calendar,
  ExternalLink,
  Package,
} from "lucide-react";

const STATUS_TABS = [
  { key: "ALL", label: "All Jobs" },
  { key: "READY_FOR_RELEASE", label: "Ready for Release" },
  { key: "SENT_FOR_PRODUCTION", label: "Sent to Production" },
  { key: "IN_PRODUCTION", label: "In Production" },
  { key: "READY_FOR_DISPATCH", label: "Ready for Dispatch" },
  { key: "DISPATCHED", label: "Dispatched" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "CANCELLED", label: "Cancelled" },
];

export default function ProductionDashboardPage() {
  const [jobs, setJobs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [userRole, setUserRole] = useState("admin");


  const isViewOnly = userRole === "sales";
  const canManage = userRole === "admin" || userRole === "manager";

  const loadData = async () => {
    try {
      setLoading(true);
      const role = (localStorage.getItem("userRole") || "admin").toLowerCase();
      setUserRole(role);

      const [jobsRes, metricsRes] = await Promise.allSettled([
        api.get("/production-jobs"),
        api.get("/production-jobs/metrics"),
      ]);

      if (jobsRes.status === "fulfilled") {
        const jList =
          jobsRes.value?.data ||
          (Array.isArray(jobsRes.value) ? jobsRes.value : []);
        setJobs(jList);
      }

      if (metricsRes.status === "fulfilled" && metricsRes.value?.data) {
        setMetrics(metricsRes.value.data);
      }
    } catch (err) {
      console.error("Error loading production data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);


  // Filter jobs by active tab and search query
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Tab filter
      if (activeTab !== "ALL") {
        if (activeTab === "DELIVERED") {
          if (!["DELIVERED", "COMPLETED"].includes(job.productionStatus))
            return false;
        } else if (job.productionStatus !== activeTab) {
          return false;
        }
      }

      // Query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const custName = (
        job.customerId?.displayName ||
        job.customerId?.companyName ||
        job.customerId?.name ||
        ""
      ).toLowerCase();
      return (
        (job.productionJobNumber || "").toLowerCase().includes(q) ||
        (job.orderId?.orderNumber || "").toLowerCase().includes(q) ||
        custName.includes(q) ||
        (job.releaseMethod || "").toLowerCase().includes(q)
      );
    });
  }, [jobs, activeTab, searchQuery]);

  // Attention jobs (overdue or urgent)
  const urgentAttentionJobs = useMemo(() => {
    return jobs.filter((j) => {
      const isOverdue =
        j.dueDate &&
        new Date(j.dueDate) < new Date() &&
        !["DELIVERED", "COMPLETED", "CANCELLED"].includes(j.productionStatus);
      const isUrgent = j.priority === "URGENT" || j.priority === "RUSH";
      return isOverdue || isUrgent;
    });
  }, [jobs]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "READY_FOR_RELEASE":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            READY FOR RELEASE
          </span>
        );
      case "SENT_FOR_PRODUCTION":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
            SENT TO PARTNER
          </span>
        );
      case "IN_PRODUCTION":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">
            IN PRODUCTION
          </span>
        );
      case "READY_FOR_DISPATCH":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            READY DISPATCH
          </span>
        );
      case "DISPATCHED":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
            DISPATCHED
          </span>
        );
      case "DELIVERED":
      case "COMPLETED":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            DELIVERED
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "RUSH":
      case "URGENT":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-200">
            URGENT
          </span>
        );
      case "HIGH":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-200">
            HIGH
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
            NORMAL
          </span>
        );
    }
  };

  // Fallback metrics if endpoint response is structured slightly differently
  const mReady =
    metrics?.readyForRelease ??
    jobs.filter((j) => j.productionStatus === "READY_FOR_RELEASE").length;
  const mSent =
    metrics?.sentForProduction ??
    jobs.filter((j) => j.productionStatus === "SENT_FOR_PRODUCTION").length;
  const mInProd =
    metrics?.inProduction ??
    jobs.filter((j) => j.productionStatus === "IN_PRODUCTION").length;
  const mReadyDisp =
    metrics?.readyForDispatch ??
    jobs.filter((j) => j.productionStatus === "READY_FOR_DISPATCH").length;
  const mDispatched =
    metrics?.dispatched ??
    jobs.filter((j) => j.productionStatus === "DISPATCHED").length;
  const mDelivered =
    metrics?.deliveredToday ??
    jobs.filter((j) => ["DELIVERED", "COMPLETED"].includes(j.productionStatus))
      .length;
  const mOverdue =
    metrics?.overdue ??
    jobs.filter(
      (j) =>
        j.dueDate &&
        new Date(j.dueDate) < new Date() &&
        !["DELIVERED", "COMPLETED", "CANCELLED"].includes(j.productionStatus),
    ).length;
  const mFailed = metrics?.deliveryFailed ?? 0;

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Navbar />

        <div className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Outsourced Print Production &amp; Delivery
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Production job history and delivery tracking
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadData}
                className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-2xs transition-colors cursor-pointer"
                title="Refresh"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Role Access Notice */}
          {isViewOnly && (
            <div className="p-3.5 rounded-md bg-orange-50 border border-orange-200 flex items-center justify-between text-xs text-orange-800">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#F95721] shrink-0" />
                <span>
                  <strong>View-Only Access Mode:</strong> Signed in as{" "}
                  <span className="uppercase font-bold text-slate-900">
                    {userRole}
                  </span>
                  . You can inspect jobs, locked artwork, and delivery tracking.
                  Action controls are restricted to Admins &amp; Managers.
                </span>
              </div>
            </div>
          )}

          {/* Metrics Row (8 metrics as specified in Phase 5 spec) */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="p-3.5 rounded-md bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Ready Release
              </span>
              <p className="text-xl font-black text-amber-600 mt-1">{mReady}</p>
              <span className="text-[9px] text-slate-400">Locked proofs</span>
            </div>

            <div className="p-3.5 rounded-md bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Sent to Production
              </span>
              <p className="text-xl font-black text-[#F95721] mt-1">{mSent}</p>
              <span className="text-[9px] text-slate-400">
                Awaiting production start
              </span>
            </div>

            <div className="p-3.5 rounded-md bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                In Production
              </span>
              <p className="text-xl font-black text-indigo-600 mt-1">
                {mInProd}
              </p>
              <span className="text-[9px] text-slate-400">
                In production process
              </span>
            </div>

            <div className="p-3.5 rounded-md bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Ready Dispatch
              </span>
              <p className="text-xl font-black text-emerald-600 mt-1">
                {mReadyDisp}
              </p>
              <span className="text-[9px] text-slate-400">
                Printed &amp; received
              </span>
            </div>

            <div className="p-3.5 rounded-md bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Dispatched
              </span>
              <p className="text-xl font-black text-cyan-600 mt-1">
                {mDispatched}
              </p>
              <span className="text-[9px] text-slate-400">
                In courier transit
              </span>
            </div>

            <div className="p-3.5 rounded-md bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Delivered
              </span>
              <p className="text-xl font-black text-emerald-700 mt-1">
                {mDelivered}
              </p>
              <span className="text-[9px] text-slate-400">POD confirmed</span>
            </div>

            <div className="p-3.5 rounded-md bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
                Overdue
              </span>
              <p className="text-xl font-black text-rose-600 mt-1">
                {mOverdue}
              </p>
              <span className="text-[9px] text-slate-400">
                Past target date
              </span>
            </div>

            <div className="p-3.5 rounded-md bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
                Failed Delivery
              </span>
              <p className="text-xl font-black text-rose-700 mt-1">{mFailed}</p>
              <span className="text-[9px] text-slate-400">Action required</span>
            </div>
          </div>

          {/* Attention Queue Alert Banner (if overdue jobs exist) */}
          {urgentAttentionJobs.length > 0 && (
            <div className="p-4 rounded-md bg-rose-50 border border-rose-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-rose-900">
                  Attention Queue: {urgentAttentionJobs.length} Urgent / Overdue
                  Jobs
                </h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  The following production jobs require immediate manager review
                  or artisan follow-up:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {urgentAttentionJobs.slice(0, 4).map((j) => (
                    <Link
                      key={j._id}
                      href={`/dashboard/production/jobs/${j._id}`}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-100 border border-rose-200 text-[11px] font-bold text-rose-800 flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <span>{j.productionJobNumber}</span>
                      <span className="text-rose-600 font-normal">
                        ({j.productionStatus})
                      </span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  ))}
                  {urgentAttentionJobs.length > 4 && (
                    <span className="text-[11px] text-rose-600 font-semibold self-center">
                      +{urgentAttentionJobs.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Control Bar: Search & Status Tabs */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab.key
                      ? "bg-[#F95721] text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search job #, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#F95721] shadow-2xs transition-colors"
              />
            </div>
          </div>

          {/* Jobs Table */}
          <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Job / Order</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Target Due Date</th>
                    <th className="py-3 px-4">Production Status</th>
                    <th className="py-3 px-4">Release Details</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="py-12 text-center text-slate-500"
                      >
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#F95721]" />
                        <span>Loading production jobs...</span>
                      </td>
                    </tr>
                  ) : filteredJobs.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="py-12 text-center text-slate-500"
                      >
                        <Layers className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <p className="font-semibold text-slate-700">
                          No production jobs found matching this criteria.
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Orders remain records until a separate production process is enabled.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredJobs.map((job) => {
                      const custName =
                        job.customerId?.displayName ||
                        job.customerId?.companyName ||
                        job.customerId?.name ||
                        "Customer";
                      const custSub =
                        job.customerId?.companyName !== custName
                          ? job.customerId?.companyName
                          : job.customerId?.phone || "";

                      const isOverdue =
                        job.dueDate &&
                        new Date(job.dueDate) < new Date() &&
                        !["DELIVERED", "COMPLETED", "CANCELLED"].includes(
                          job.productionStatus,
                        );

                      return (
                        <tr
                          key={job._id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <Link
                              href={`/dashboard/production/jobs/${job._id}`}
                              className="font-bold text-slate-900 hover:text-[#F95721] flex items-center gap-1.5"
                            >
                              <span>{job.productionJobNumber}</span>
                            </Link>
                            <span className="text-[11px] text-slate-500 block">
                              Order: {job.orderId?.orderNumber || "N/A"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-900 block truncate max-w-[150px]">
                              {custName}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate max-w-[150px]">
                              {custSub || job.customerId?.phone || ""}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {getPriorityBadge(job.priority)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-700 font-medium block">
                              {job.dueDate
                                ? new Date(job.dueDate).toLocaleDateString()
                                : "None"}
                            </span>
                            {isOverdue && (
                              <span className="text-[10px] text-rose-600 font-bold">
                                OVERDUE
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(job.productionStatus)}
                          </td>
                          <td className="py-3 px-4">
                            {job.releaseMethod ? (
                              <div className="space-y-0.5">
                                <span className="text-[11px] font-semibold text-slate-800 flex items-center gap-1">
                                  {job.releaseMethod === "EMAIL"
                                    ? "✉️ Email Sent"
                                    : "📋 Manual"}
                                </span>
                                {job.releaseSentAt && (
                                  <span className="text-[10px] text-slate-400 block">
                                    {new Date(
                                      job.releaseSentAt,
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">
                                Pending Release
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              href={`/dashboard/production/jobs/${job._id}`}
                              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px] inline-flex items-center gap-1 transition-colors shadow-2xs"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Job Card</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
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
