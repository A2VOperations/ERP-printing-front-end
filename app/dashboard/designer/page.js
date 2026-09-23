"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import {
  AlertTriangle,
  Eye,
  RefreshCw,
  ShieldCheck,
  Lock,
  Folder,
  Upload,
  FileCheck,
  Calendar,
  Edit,
} from "lucide-react";

export default function DesignerDashboardPage() {
  const router = useRouter();
  const [designerName, setDesignerName] = useState("Deepak");
  const [loading, setLoading] = useState(true);

  // Live Data States
  const [designProjects, setDesignProjects] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [orders, setOrders] = useState([]);

  const loadDesignerData = useCallback(async () => {
    try {
      setLoading(true);

      // Verified identity source
      try {
        const meRes = await api.get("/auth/me");
        if (meRes && meRes.data) {
          const fetchedName = meRes.data.name || meRes.data.user?.name;
          if (fetchedName) {
            setDesignerName(fetchedName.split(" ")[0] || fetchedName);
          }
        }
      } catch (err) {
        const storedName = localStorage.getItem("userName");
        if (storedName) setDesignerName(storedName.split(" ")[0] || storedName);
      }

      const [designRes, ordersRes] = await Promise.allSettled([
        api.get("/design-projects?limit=100"),
        api.get("/orders?limit=50"),
      ]);

      if (designRes.status === "fulfilled" && designRes.value) {
        const d = designRes.value;
        const rawProjects = Array.isArray(d)
          ? d
          : Array.isArray(d.data)
            ? d.data
            : Array.isArray(d.projects)
              ? d.projects
              : d.data?.projects || d.records || [];
        setDesignProjects(rawProjects);
      }
      if (ordersRes.status === "fulfilled" && ordersRes.value) {
        const o = ordersRes.value;
        const rawOrders = Array.isArray(o)
          ? o
          : Array.isArray(o.data)
            ? o.data
            : Array.isArray(o.data?.items)
              ? o.data.items
              : o.orders || [];
        setOrders(rawOrders);
      }
    } catch (err) {
      console.error("Failed to load designer dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDesignerData();
  }, [loadDesignerData]);

  // Live Aggregate metric calculations
  const totalProjects = designProjects.length;
  const newAssignmentsCount = useMemo(
    () =>
      designProjects.filter(
        (d) => d.status === "ASSIGNED" || d.status === "BRIEFING",
      ).length,
    [designProjects],
  );
  const inDesignCount = useMemo(
    () =>
      designProjects.filter(
        (d) => d.status === "IN_PROGRESS" || d.status === "IN_DESIGN",
      ).length,
    [designProjects],
  );
  const clientReviewCount = useMemo(
    () =>
      designProjects.filter(
        (d) =>
          (d.status === "CLIENT_REVIEW" || d.status === "IN_REVIEW") &&
          d.approvalStatus !== "APPROVED" &&
          d.status !== "APPROVED" &&
          d.status !== "PRODUCTION_LOCKED",
      ).length,
    [designProjects],
  );
  const revisionCount = useMemo(
    () =>
      designProjects.filter((d) => d.status === "REVISION_REQUESTED").length,
    [designProjects],
  );
  const approvedCount = useMemo(
    () =>
      designProjects.filter(
        (d) => d.status === "APPROVED" || d.approvalStatus === "APPROVED",
      ).length,
    [designProjects],
  );
  const productionLockedCount = useMemo(
    () =>
      designProjects.filter(
        (d) =>
          d.status === "PRODUCTION_LOCKED" ||
          d.status === "LOCKED" ||
          d.productionLocked,
      ).length,
    [designProjects],
  );

  const {
    overdueCount,
    dueTodayCount,
    dueThisWeekCount,
    dueNextWeekCount,
    overdueHighPriority,
    todayHighPriority,
  } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );
    const dayOfWeek = startOfToday.getDay();
    const daysUntilEndOfWeek = 7 - (dayOfWeek === 0 ? 7 : dayOfWeek);
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(startOfToday.getDate() + daysUntilEndOfWeek);
    endOfWeek.setHours(23, 59, 59, 999);

    const endOfNextWeek = new Date(endOfWeek);
    endOfNextWeek.setDate(endOfWeek.getDate() + 7);

    let overdue = 0;
    let todayCount = 0;
    let thisWeek = 0;
    let nextWeek = 0;
    let odHigh = 0;
    let tdHigh = 0;

    designProjects.forEach((p) => {
      if (
        p.status === "PRODUCTION_LOCKED" ||
        p.status === "APPROVED" ||
        p.approvalStatus === "APPROVED"
      )
        return;
      const isHigh = p.priority === "HIGH" || p.priority === "URGENT";

      if (p.dueDate) {
        const d = new Date(p.dueDate);
        if (d < startOfToday) {
          overdue++;
          if (isHigh) odHigh++;
        } else if (d >= startOfToday && d <= endOfToday) {
          todayCount++;
          if (isHigh) tdHigh++;
        } else if (d > endOfToday && d <= endOfWeek) {
          thisWeek++;
        } else if (d > endOfWeek && d <= endOfNextWeek) {
          nextWeek++;
        }
      }
    });

    return {
      overdueCount: overdue,
      dueTodayCount: todayCount,
      dueThisWeekCount: thisWeek,
      dueNextWeekCount: nextWeek,
      overdueHighPriority: odHigh,
      todayHighPriority: tdHigh,
    };
  }, [designProjects]);

  const completedCount = useMemo(
    () =>
      designProjects.filter(
        (d) =>
          d.status === "APPROVED" ||
          d.approvalStatus === "APPROVED" ||
          d.status === "PRODUCTION_LOCKED",
      ).length,
    [designProjects],
  );

  const onTimePercent = useMemo(
    () =>
      totalProjects > 0
        ? Math.round((completedCount / totalProjects) * 100)
        : 100,
    [totalProjects, completedCount],
  );

  const clientReviewList = useMemo(
    () =>
      designProjects
        .filter(
          (d) =>
            (d.status === "CLIENT_REVIEW" || d.status === "IN_REVIEW") &&
            d.approvalStatus !== "APPROVED" &&
            d.status !== "APPROVED" &&
            d.status !== "PRODUCTION_LOCKED",
        )
        .slice(0, 6),
    [designProjects],
  );

  const recentRevisionsList = useMemo(
    () =>
      designProjects
        .filter((d) => d.status === "REVISION_REQUESTED")
        .slice(0, 6),
    [designProjects],
  );

  const recentlyUpdatedList = useMemo(
    () =>
      [...designProjects]
        .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
        .slice(0, 6),
    [designProjects],
  );

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "Just now";
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getCustName = (p) => {
    if (p.customerId) {
      return (
        p.customerId.businessName ||
        p.customerId.contactPersonName ||
        p.customerId.displayName ||
        "Client"
      );
    }
    return p.title?.split("-")[0]?.trim() || "Client";
  };

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-5 md:p-7 space-y-5 max-w-[1600px] mx-auto w-full">
          {/* Top Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100 uppercase tracking-wider">
                DESIGNER WORKSPACE
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
                Welcome back, {designerName}! 👋
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Here&apos;s your design overview. Stay on top of your projects
                and deadlines.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={loadDesignerData}
                disabled={loading}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-slate-700 text-xs font-semibold shadow-xs hover:bg-slate-50 transition-all"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : "text-slate-500"}`}
                />
                Refresh Data
              </button>

              <Link
                href="/dashboard/design?filter=NEW"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-semibold shadow-sm shadow-purple-600/25 transition-all"
              >
                <FileCheck className="w-3.5 h-3.5" />
                New Assignments ({newAssignmentsCount})
              </Link>
            </div>
          </div>

          {/* ROW 1: 7 Compact KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* 1. New Assignments */}
            <div className="bg-white rounded-md p-3.5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block">
                    New Assignments
                  </span>
                  <div className="text-xl font-black text-slate-900 mt-0.5">
                    {newAssignmentsCount}
                  </div>
                </div>
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FileCheck className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-100">
                <span className="text-[9px] font-semibold text-emerald-600 block">
                  {newAssignmentsCount > 0
                    ? `${newAssignmentsCount} awaiting work`
                    : "Up to date"}
                </span>
                <Link
                  href="/dashboard/design?filter=NEW"
                  className="text-[10px] font-bold text-blue-600 hover:underline block mt-0.5"
                >
                  View Assignments →
                </Link>
              </div>
            </div>

            {/* 2. Due Today */}
            <div className="bg-white rounded-md p-3.5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block">
                    Due Today
                  </span>
                  <div className="text-xl font-black text-slate-900 mt-0.5">
                    {dueTodayCount}
                  </div>
                </div>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-100">
                <span className="text-[9px] font-semibold text-slate-500 block">
                  {todayHighPriority} high priority
                </span>
                <Link
                  href="/dashboard/design?filter=DUE"
                  className="text-[10px] font-bold text-blue-600 hover:underline block mt-0.5"
                >
                  View Today&apos;s List →
                </Link>
              </div>
            </div>

            {/* 3. Overdue */}
            <div className="bg-white rounded-md p-3.5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block">
                    Overdue
                  </span>
                  <div className="text-xl font-black text-rose-600 mt-0.5">
                    {overdueCount}
                  </div>
                </div>
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-100">
                <span className="text-[9px] font-semibold text-rose-600 block">
                  {overdueHighPriority} high priority
                </span>
                <Link
                  href="/dashboard/design?filter=DUE"
                  className="text-[10px] font-bold text-blue-600 hover:underline block mt-0.5"
                >
                  View Overdue →
                </Link>
              </div>
            </div>

            {/* 4. Client Review */}
            <div className="bg-white rounded-md p-3.5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block">
                    Client Review
                  </span>
                  <div className="text-xl font-black text-purple-700 mt-0.5">
                    {clientReviewCount}
                  </div>
                </div>
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Eye className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-100">
                <span className="text-[9px] font-semibold text-slate-500 block">
                  Waiting for client
                </span>
                <Link
                  href="/dashboard/design?filter=CLIENT_REVIEW"
                  className="text-[10px] font-bold text-purple-600 hover:underline block mt-0.5"
                >
                  View Client Review →
                </Link>
              </div>
            </div>

            {/* 5. Revision Requested */}
            <div className="bg-white rounded-md p-3.5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block">
                    Revision Requested
                  </span>
                  <div className="text-xl font-black text-amber-600 mt-0.5">
                    {revisionCount}
                  </div>
                </div>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Edit className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-100">
                <span className="text-[9px] font-semibold text-slate-500 block">
                  {revisionCount > 0
                    ? `${revisionCount} pending changes`
                    : "No revisions"}
                </span>
                <Link
                  href="/dashboard/design?filter=REVISION"
                  className="text-[10px] font-bold text-blue-600 hover:underline block mt-0.5"
                >
                  View Revisions →
                </Link>
              </div>
            </div>

            {/* 7. Production Locked */}
            <div className="bg-white rounded-md p-3.5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block">
                    Production Locked
                  </span>
                  <div className="text-xl font-black text-emerald-600 mt-0.5">
                    {productionLockedCount}
                  </div>
                </div>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-100">
                <span className="text-[9px] font-semibold text-emerald-600 block">
                  Ready for print
                </span>
                <Link
                  href="/dashboard/design?filter=PRODUCTION_READY"
                  className="text-[10px] font-bold text-blue-600 hover:underline block mt-0.5"
                >
                  View Production Ready →
                </Link>
              </div>
            </div>
          </div>

          {/* ROW 2: My Design Queue | Today's Activities | Deadline Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* 1. My Design Queue (4 Cols) */}
            <div className="lg:col-span-4 bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-xs">
                  My Design Queue
                </h3>
                <Link
                  href="/dashboard/design"
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  View All Projects →
                </Link>
              </div>

              <div className="flex items-center gap-4 py-2">
                {/* Donut Simulation */}
                <div className="relative w-24 h-24 rounded-full border-8 border-blue-500 border-t-purple-500 border-r-amber-400 border-b-emerald-500 flex items-center justify-center shrink-0">
                  <div className="text-center">
                    <span className="text-base font-black text-slate-900 block leading-tight">
                      {totalProjects}
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">
                      Total Projects
                    </span>
                  </div>
                </div>

                {/* Queue Breakdown Legend */}
                <div className="space-y-1 text-[11px] flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-slate-600">In Design</span>
                    </div>
                    <strong className="text-slate-900">{inDesignCount}</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="text-slate-600">Client Review</span>
                    </div>
                    <strong className="text-slate-900">
                      {clientReviewCount}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-slate-600">Revision</span>
                    </div>
                    <strong className="text-slate-900">{revisionCount}</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-slate-600">Approved</span>
                    </div>
                    <strong className="text-slate-900">{approvedCount}</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                      <span className="text-slate-600">Production Locked</span>
                    </div>
                    <strong className="text-slate-900">
                      {productionLockedCount}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Today's Activities (4 Cols) */}
            <div className="lg:col-span-4 bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-xs">
                  Today&apos;s Activities &amp; Updates
                </h3>
                <Link
                  href="/dashboard/design"
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  View All Projects →
                </Link>
              </div>

              <div className="space-y-2.5 text-xs flex-1">
                {recentlyUpdatedList.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-[11px]">
                    No project activities recorded yet.
                  </div>
                ) : (
                  recentlyUpdatedList.slice(0, 5).map((p) => (
                    <div
                      key={p._id}
                      className="flex items-start justify-between gap-2"
                    >
                      <span className="text-[10px] text-slate-400 font-mono shrink-0 mt-0.5">
                        {formatTimeAgo(p.updatedAt)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link
                          href="/dashboard/design"
                          className="text-slate-900 text-[11px] font-bold block truncate hover:text-blue-600"
                        >
                          {p.projectNumber || "DSN"}: {p.title}
                        </Link>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {getCustName(p)} •{" "}
                          {p.currentVersionNumber
                            ? `V${p.currentVersionNumber}`
                            : "Initial"}
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 shrink-0">
                        {p.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 3. Deadline Overview (4 Cols) */}
            <div className="lg:col-span-4 bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-xs">
                  Deadline Overview
                </h3>
                <Link
                  href="/dashboard/design"
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  View Calendar →
                </Link>
              </div>

              <div className="flex items-center justify-between gap-4 py-1">
                <div className="space-y-2 text-xs flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-rose-600 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Overdue</span>
                    </div>
                    <strong className="text-rose-600">{overdueCount}</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-600 font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Due Today</span>
                    </div>
                    <strong className="text-amber-600">{dueTodayCount}</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-blue-600 font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Due This Week</span>
                    </div>
                    <strong className="text-blue-600">
                      {dueThisWeekCount}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-cyan-600 font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Due Next Week</span>
                    </div>
                    <strong className="text-cyan-600">
                      {dueNextWeekCount}
                    </strong>
                  </div>
                </div>

                {/* Progress Gauge */}
                <div className="relative w-22 h-22 rounded-full border-6 border-teal-500 border-t-teal-300 border-r-slate-100 flex items-center justify-center shrink-0">
                  <div className="text-center">
                    <span className="text-base font-black text-slate-900 block leading-tight">
                      {onTimePercent}%
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">
                      Completed
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-center text-[10px] text-slate-500 font-semibold">
                {completedCount} / {totalProjects} projects completed or
                production locked
              </div>
            </div>
          </div>

          {/* ROW 3: Attention Queue | Client Reviews | Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* 1. Attention Queue (4 Cols) */}
            <div className="lg:col-span-4 bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
              <div className="pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-xs">
                  Attention Queue
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                {/* 1. Overdue */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50/50 border border-rose-100">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <div>
                      <strong className="text-slate-900 text-[11px] block">
                        {overdueCount} Overdue Projects
                      </strong>
                      <span className="text-[9px] text-slate-500">
                        Projects past deadline
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center">
                      {overdueCount}
                    </span>
                    <Link
                      href="/dashboard/design?filter=DUE"
                      className="px-2 py-0.5 rounded-lg bg-white border border-rose-200 text-rose-700 font-bold text-[10px] hover:bg-rose-50"
                    >
                      View Overdue
                    </Link>
                  </div>
                </div>

                {/* 2. Client Review */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-purple-50/50 border border-purple-100">
                  <div className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <div>
                      <strong className="text-slate-900 text-[11px] block">
                        {clientReviewCount} Projects in Client Review
                      </strong>
                      <span className="text-[9px] text-slate-500">
                        Waiting for client feedback
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-purple-500 text-white font-bold text-[9px] flex items-center justify-center">
                      {clientReviewCount}
                    </span>
                    <Link
                      href="/dashboard/design?filter=CLIENT_REVIEW"
                      className="px-2 py-0.5 rounded-lg bg-white border border-purple-200 text-purple-700 font-bold text-[10px] hover:bg-purple-50"
                    >
                      View Client Review
                    </Link>
                  </div>
                </div>

                {/* 3. Revision */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/50 border border-amber-100">
                  <div className="flex items-center gap-2">
                    <Edit className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <div>
                      <strong className="text-slate-900 text-[11px] block">
                        {revisionCount} Revision Requested
                      </strong>
                      <span className="text-[9px] text-slate-500">
                        Client revisions pending
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-white font-bold text-[9px] flex items-center justify-center">
                      {revisionCount}
                    </span>
                    <Link
                      href="/dashboard/design?filter=REVISION"
                      className="px-2 py-0.5 rounded-lg bg-white border border-amber-200 text-amber-700 font-bold text-[10px] hover:bg-amber-50"
                    >
                      View Revisions
                    </Link>
                  </div>
                </div>

                {/* 5. Production Ready */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <div>
                      <strong className="text-slate-900 text-[11px] block">
                        {productionLockedCount} Ready for Production Lock
                      </strong>
                      <span className="text-[9px] text-slate-500">
                        Client approved & ready to release
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-white font-bold text-[9px] flex items-center justify-center">
                      {productionLockedCount}
                    </span>
                    <Link
                      href="/dashboard/design?filter=PRODUCTION_READY"
                      className="px-2 py-0.5 rounded-lg bg-white border border-emerald-200 text-emerald-700 font-bold text-[10px] hover:bg-emerald-50"
                    >
                      View Production Ready
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Client Reviews (5 Cols) */}
            <div className="lg:col-span-5 bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-xs">
                  Client Reviews
                </h3>
                <Link
                  href="/dashboard/design?filter=CLIENT_REVIEW"
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  View All →
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="pb-1.5">Design ID</th>
                      <th className="pb-1.5">Customer</th>
                      <th className="pb-1.5">Current Version</th>
                      <th className="pb-1.5">Status</th>
                      <th className="pb-1.5 text-right">Waiting Since</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {clientReviewList.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-6 text-center text-slate-400 text-xs"
                        >
                          No projects currently in client review.
                        </td>
                      </tr>
                    ) : (
                      clientReviewList.map((p) => (
                        <tr key={p._id} className="hover:bg-slate-50">
                          <td className="py-2 font-bold font-mono text-blue-600">
                            <Link href="/dashboard/design">
                              {p.projectNumber || "DSN"}
                            </Link>
                          </td>
                          <td className="py-2 text-slate-900 font-medium truncate max-w-[120px]">
                            {getCustName(p)}
                          </td>
                          <td className="py-2 text-slate-600 font-mono">
                            {p.currentVersionNumber
                              ? `V${p.currentVersionNumber}`
                              : "V1"}
                          </td>
                          <td className="py-2">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              {p.status}
                            </span>
                          </td>
                          <td className="py-2 text-right text-slate-500 font-medium">
                            {formatTimeAgo(p.updatedAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Quick Actions (3 Cols) */}
            <div className="lg:col-span-3 bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
              <div className="pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-xs">
                  Quick Actions
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                {/* 1. My Projects */}
                <Link
                  href="/dashboard/design"
                  className="p-3 rounded-xl bg-blue-50/70 hover:bg-blue-100 border border-blue-100 flex flex-col items-center gap-1 transition-colors"
                >
                  <Folder className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-800 text-[10px]">
                    My Projects
                  </span>
                </Link>

                {/* 2. Upload New Version */}
                <Link
                  href="/dashboard/design"
                  className="p-3 rounded-xl bg-teal-50/70 hover:bg-teal-100 border border-teal-100 flex flex-col items-center gap-1 transition-colors"
                >
                  <Upload className="w-4 h-4 text-teal-600" />
                  <span className="font-bold text-slate-800 text-[10px]">
                    Upload New Version
                  </span>
                </Link>

                {/* 3. Client Review Queue */}
                <Link
                  href="/dashboard/design?filter=CLIENT_REVIEW"
                  className="p-3 rounded-xl bg-purple-50/70 hover:bg-purple-100 border border-purple-100 flex flex-col items-center gap-1 transition-colors"
                >
                  <Eye className="w-4 h-4 text-purple-600" />
                  <span className="font-bold text-slate-800 text-[10px]">
                    Client Review Queue
                  </span>
                </Link>

                {/* 4. Revision Queue */}
                <Link
                  href="/dashboard/design?filter=REVISION"
                  className="p-3 rounded-xl bg-amber-50/70 hover:bg-amber-100 border border-amber-100 flex flex-col items-center gap-1 transition-colors"
                >
                  <Edit className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-slate-800 text-[10px]">
                    Revision Queue
                  </span>
                </Link>

                {/* 6. Production Ready */}
                <Link
                  href="/dashboard/design?filter=PRODUCTION_READY"
                  className="p-3 rounded-xl bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-100 flex flex-col items-center gap-1 transition-colors"
                >
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-800 text-[10px]">
                    Production Ready
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* ROW 4: Recently Updated Projects | Recent Revisions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Recently Updated Projects (6 Cols) */}
            <div className="lg:col-span-6 bg-white rounded-md p-4 border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-xs">
                  Recently Updated Projects
                </h3>
                <Link
                  href="/dashboard/design"
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  View All →
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="pb-1.5">Design ID</th>
                      <th className="pb-1.5">Customer</th>
                      <th className="pb-1.5">Order</th>
                      <th className="pb-1.5">Current Version</th>
                      <th className="pb-1.5">Status</th>
                      <th className="pb-1.5 text-right">Updated At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {recentlyUpdatedList.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-6 text-center text-slate-400 text-xs"
                        >
                          No design projects found.
                        </td>
                      </tr>
                    ) : (
                      recentlyUpdatedList.map((p) => (
                        <tr key={p._id} className="hover:bg-slate-50">
                          <td className="py-2.5 font-bold font-mono text-blue-600">
                            <Link href="/dashboard/design">
                              {p.projectNumber || "DSN"}
                            </Link>
                          </td>
                          <td className="py-2.5 text-slate-800 font-medium truncate max-w-[120px]">
                            {getCustName(p)}
                          </td>
                          <td className="py-2.5 text-slate-500 font-mono">
                            {p.orderId?.orderNumber || "—"}
                          </td>
                          <td className="py-2.5 text-slate-600 font-mono">
                            {p.currentVersionNumber
                              ? `V${p.currentVersionNumber}`
                              : "V1"}
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                p.status === "PRODUCTION_LOCKED"
                                  ? "bg-teal-50 text-teal-700 border border-teal-200"
                                  : p.status === "APPROVED"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : p.status === "CLIENT_REVIEW"
                                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                                      : p.status === "REVISION_REQUESTED"
                                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                                        : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-right text-slate-500 font-mono">
                            {formatTimeAgo(p.updatedAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Revisions (6 Cols) */}
            <div className="lg:col-span-6 bg-white rounded-md p-4 border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-xs">
                  Recent Revisions
                </h3>
                <Link
                  href="/dashboard/design?filter=REVISION"
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  View All →
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="pb-1.5">Design ID</th>
                      <th className="pb-1.5">Customer</th>
                      <th className="pb-1.5">Version</th>
                      <th className="pb-1.5">Current Status</th>
                      <th className="pb-1.5">Item Title</th>
                      <th className="pb-1.5 text-right">Requested At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {recentRevisionsList.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-6 text-center text-slate-400 text-xs"
                        >
                          No revisions currently requested.
                        </td>
                      </tr>
                    ) : (
                      recentRevisionsList.map((p) => (
                        <tr key={p._id} className="hover:bg-slate-50">
                          <td className="py-2.5 font-bold font-mono text-blue-600">
                            <Link href="/dashboard/design">
                              {p.projectNumber || "DSN"}
                            </Link>
                          </td>
                          <td className="py-2.5 text-slate-800 font-medium truncate max-w-[120px]">
                            {getCustName(p)}
                          </td>
                          <td className="py-2.5 text-slate-600 font-mono">
                            {p.currentVersionNumber
                              ? `V${p.currentVersionNumber}`
                              : "V1"}
                          </td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              REVISION
                            </span>
                          </td>
                          <td className="py-2.5 text-slate-800 font-medium truncate max-w-[140px]">
                            {p.title}
                          </td>
                          <td className="py-2.5 text-right text-slate-500 font-mono">
                            {formatTimeAgo(p.updatedAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
