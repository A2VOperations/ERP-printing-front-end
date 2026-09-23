"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import {
  Users,
  UserPlus,
  Clock,
  AlertTriangle,
  FileCheck,
  ShoppingBag,
  IndianRupee,
  DollarSign,
  Palette,
  Eye,
  Target,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Building,
  CheckSquare,
  FileText,
  PhoneCall,
  User,
  Zap,
  Lock,
  Mail,
  Send,
} from "lucide-react";

export default function ManagerDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [managerName, setManagerName] = useState("Manager");

  // Metrics Data States
  const [leads, setLeads] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [orders, setOrders] = useState([]);
  const [receivables, setReceivables] = useState(null);
  const [designProjects, setDesignProjects] = useState([]);
  const [teamTarget, setTeamTarget] = useState(null);
  const [topPerformers, setTopPerformers] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  const loadManagerData = useCallback(async () => {
    try {
      setLoading(true);

      // Sourced verified identity
      try {
        const meRes = await api.get("/auth/me");
        if (meRes && meRes.data) {
          const fetchedName = meRes.data.name || meRes.data.user?.name;
          if (fetchedName) {
            setManagerName(fetchedName.split(" ")[0] || fetchedName);
          }
        }
      } catch (err) {
        const storedName = localStorage.getItem("userName");
        if (storedName) setManagerName(storedName.split(" ")[0] || storedName);
      }

      const [
        leadsRes,
        flwRes,
        quoteRes,
        apprRes,
        ordersRes,
        recvRes,
        designRes,
        targetRes,
        leaderRes,
        usersRes,
      ] = await Promise.allSettled([
        api.get("/leads?limit=100"),
        api.get("/followups?limit=100"),
        api.get("/quotations?limit=100"),
        api.get("/discount-approvals?status=PENDING"),
        api.get("/orders?limit=100"),
        api.get("/receivables/summary"),
        api.get("/design-projects?limit=100"),
        api.get("/targets/my-achievement"),
        api.get("/targets/leaderboard"),
        api.get("/users"),
      ]);

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
      if (quoteRes.status === "fulfilled" && quoteRes.value?.data) {
        const list = Array.isArray(quoteRes.value.data)
          ? quoteRes.value.data
          : quoteRes.value.data?.records || [];
        setQuotations(list);
      }
      if (apprRes.status === "fulfilled" && apprRes.value?.data) {
        const list = Array.isArray(apprRes.value.data)
          ? apprRes.value.data
          : apprRes.value.data?.records || [];
        setApprovals(list);
      }
      if (ordersRes.status === "fulfilled" && ordersRes.value?.data) {
        const list = Array.isArray(ordersRes.value.data)
          ? ordersRes.value.data
          : ordersRes.value.data?.records || [];
        setOrders(list);
      }
      if (recvRes.status === "fulfilled" && recvRes.value?.data) {
        setReceivables(recvRes.value.data);
      }
      if (designRes.status === "fulfilled" && designRes.value?.data) {
        const list = Array.isArray(designRes.value.data)
          ? designRes.value.data
          : designRes.value.data?.records || [];
        setDesignProjects(list);
      }
      if (targetRes.status === "fulfilled" && targetRes.value?.data) {
        setTeamTarget(targetRes.value.data);
      }
      if (leaderRes.status === "fulfilled" && leaderRes.value?.data) {
        const rawLeader = leaderRes.value.data;
        const list = Array.isArray(rawLeader)
          ? rawLeader
          : rawLeader?.rankings || [];
        const nonAdmin = list.filter((p) => {
          const u = p.user || p;
          const role = String(u.role || p.role || "").toLowerCase();
          const name = String(
            u.name || p.userName || p.name || "",
          ).toLowerCase();
          const email = String(u.email || p.email || "").toLowerCase();
          return (
            !role.includes("admin") &&
            !name.includes("admin") &&
            !email.includes("admin")
          );
        });
        setTopPerformers(nonAdmin);
      }
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
    } catch (err) {
      console.error("Failed to load manager dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadManagerData();
  }, [loadManagerData]);

  // Aggregate metric calculations
  const newTeamLeads = useMemo(
    () => leads.filter((l) => l.status === "NEW").length,
    [leads],
  );
  const unassignedLeads = useMemo(
    () => leads.filter((l) => !l.assignedToId).length,
    [leads],
  );

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const followupsToday = useMemo(
    () =>
      followups.filter(
        (f) =>
          f.scheduledAt &&
          f.scheduledAt.startsWith(todayStr) &&
          f.status !== "COMPLETED",
      ).length,
    [followups, todayStr],
  );
  const overdueFollowups = useMemo(
    () =>
      followups.filter(
        (f) =>
          f.scheduledAt &&
          new Date(f.scheduledAt) < now &&
          f.status !== "COMPLETED",
      ).length,
    [followups, now],
  );

  const pendingApprovalsCount = approvals.length;
  const activeOrdersCount = useMemo(
    () =>
      orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status))
        .length,
    [orders],
  );
  const outstandingTotal = receivables?.totalOutstandingPaise
    ? receivables.totalOutstandingPaise / 100
    : orders.reduce(
        (sum, o) => sum + (o.balancePaise ? o.balancePaise / 100 : 0),
        0,
      );
  const invoicesCount =
    receivables?.invoicesCount ||
    orders.filter((o) => o.status === "CONFIRMED" || o.balancePaise > 0).length;

  const designDueCount = useMemo(
    () =>
      designProjects.filter(
        (d) => !["COMPLETED", "LOCKED", "PRODUCTION_LOCKED"].includes(d.status),
      ).length,
    [designProjects],
  );
  const clientReviewPendingCount = useMemo(
    () =>
      designProjects.filter(
        (d) =>
          (d.status === "CLIENT_REVIEW" || d.status === "IN_REVIEW") &&
          d.approvalStatus !== "APPROVED",
      ).length,
    [designProjects],
  );
  const productionLockedProjects = useMemo(
    () =>
      designProjects.filter(
        (d) => d.status === "PRODUCTION_LOCKED" || d.productionLocked,
      ),
    [designProjects],
  );
  const productionLockedCount = productionLockedProjects.length;

  // Pipeline calculations
  const pipelineCounts = useMemo(() => {
    const total = leads.length;
    const newL = leads.filter((l) => l.status === "NEW").length;
    const contacted = leads.filter((l) =>
      [
        "CONTACTED",
        "INTERESTED",
        "QUOTATION_SENT",
        "NEGOTIATION",
        "WON",
      ].includes(l.status),
    ).length;
    const interested = leads.filter((l) =>
      ["INTERESTED", "QUOTATION_SENT", "NEGOTIATION", "WON"].includes(l.status),
    ).length;
    const quotation = leads.filter((l) =>
      ["QUOTATION_SENT", "NEGOTIATION", "WON"].includes(l.status),
    ).length;
    const won = leads.filter((l) => l.status === "WON").length;

    return {
      new: newL,
      contacted,
      interested,
      quotation,
      won,
      total,
      newPct: total > 0 ? ((newL / total) * 100).toFixed(0) : "0",
      contactedPct: total > 0 ? ((contacted / total) * 100).toFixed(0) : "0",
      interestedPct: total > 0 ? ((interested / total) * 100).toFixed(0) : "0",
      quotationPct: total > 0 ? ((quotation / total) * 100).toFixed(0) : "0",
      wonPct: total > 0 ? ((won / total) * 100).toFixed(0) : "0",
      convRate: total > 0 ? ((won / total) * 100).toFixed(1) : "0.0",
    };
  }, [leads]);

  // Target values
  const totalRevenuePaise = useMemo(
    () =>
      orders.reduce(
        (sum, o) =>
          sum + (o.grandTotalPaise || (o.grandTotal ? o.grandTotal * 100 : 0)),
        0,
      ),
    [orders],
  );
  const targetRupees = teamTarget?.targetPaise
    ? teamTarget.targetPaise / 100
    : teamMembers.length * 100000 || 0;
  const achievedRupees = teamTarget?.achievedPaise
    ? teamTarget.achievedPaise / 100
    : totalRevenuePaise / 100;
  const remainingRupees = Math.max(0, targetRupees - achievedRupees);
  const targetPercent =
    targetRupees > 0
      ? Math.min(100, Math.round((achievedRupees / targetRupees) * 100))
      : 0;

  const topPerformer =
    topPerformers[0] ||
    (teamMembers[0]
      ? {
          name: teamMembers[0].name,
          user: { name: teamMembers[0].name },
          achievedPaise: 0,
          achievementPercent: 0,
        }
      : null);

  // Dynamic Recent Activities
  const recentActivities = useMemo(() => {
    const list = [];
    followups.slice(0, 3).forEach((f) => {
      list.push({
        id: `flw-${f._id}`,
        time: f.scheduledAt
          ? new Date(f.scheduledAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Today",
        actor: f.assignedToId?.name || "Sales Rep",
        text: `Follow-up: "${f.title || f.notes || "Client interaction"}"`,
        badge: f.status || "SCHEDULED",
        badgeColor:
          f.status === "COMPLETED"
            ? "bg-emerald-50 text-emerald-700"
            : "bg-purple-50 text-purple-700",
        icon: PhoneCall,
        iconBg: "bg-emerald-50 text-emerald-600",
      });
    });
    quotations.slice(0, 2).forEach((q) => {
      list.push({
        id: `qt-${q._id}`,
        time: q.createdAt
          ? new Date(q.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Today",
        actor: q.customerSnapshot?.displayName || q.customerName || "Customer",
        text: `Quotation ${q.quotationNumber || "Offer"} generated for ₹${(q.grandTotalPaise ? q.grandTotalPaise / 100 : q.total || 0).toLocaleString("en-IN")}`,
        badge: q.status || "DRAFT",
        badgeColor: "bg-blue-50 text-blue-700",
        icon: FileText,
        iconBg: "bg-blue-50 text-blue-600",
      });
    });
    return list;
  }, [followups, quotations]);

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-5 md:p-7 space-y-5 max-w-[1600px] mx-auto w-full">
          {/* Top Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
                  MANAGER WORKSPACE
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Phase 1–4 Operational Oversight
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
                Welcome back, {managerName}! 👋
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Here&apos;s your team&apos;s operational overview, priorities
                and performance.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={loadManagerData}
                disabled={loading}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-slate-700 text-xs font-semibold shadow-xs hover:bg-slate-50 transition-all"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : "text-slate-500"}`}
                />
                Refresh Data
              </button>

              <Link
                href="/dashboard/manager/approvals"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-semibold shadow-sm shadow-purple-600/25 transition-all"
              >
                <FileCheck className="w-3.5 h-3.5" />
                Approvals ({pendingApprovalsCount})
              </Link>
            </div>
          </div>

          {/* ROW 1: 5 Compact KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* 1. New Team Leads */}
            <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    New Team Leads
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {newTeamLeads}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500">
                  {unassignedLeads} unassigned
                </span>
                <Link
                  href="/dashboard/leads?status=NEW"
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  View Leads →
                </Link>
              </div>
            </div>

            {/* 2. Follow-ups Due */}
            <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Follow-ups Due
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {followupsToday}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span
                  className={`text-[10px] font-semibold ${overdueFollowups > 0 ? "text-rose-600" : "text-slate-400"}`}
                >
                  {overdueFollowups} overdue
                </span>
                <Link
                  href="/dashboard/followups"
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  View Follow-ups →
                </Link>
              </div>
            </div>

            {/* 3. Pending Approvals */}
            <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Pending Approvals
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {pendingApprovalsCount}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <FileCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-purple-700">
                  Discount concessions
                </span>
                <Link
                  href="/dashboard/manager/approvals"
                  className="text-[11px] font-bold text-purple-600 hover:underline"
                >
                  Review Approvals →
                </Link>
              </div>
            </div>

            {/* 4. Active Orders */}
            <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Active Orders
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {activeOrdersCount}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500">
                  {orders.length} total orders
                </span>
                <Link
                  href="/dashboard/orders"
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  View Orders →
                </Link>
              </div>
            </div>

            {/* 5. Outstanding Receivables */}
            <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Outstanding Receivables
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    ₹
                    {outstandingTotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 0,
                    })}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 font-bold">
                  ₹
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500">
                  {invoicesCount} pending invoices
                </span>
                <Link
                  href="/dashboard/receivables"
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  View Receivables →
                </Link>
              </div>
            </div>
          </div>

          {/* ROW 2: Team Sales Pipeline | Today's Team Activities | Team Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Card 1: Team Sales Pipeline (4 Cols) */}
            <div className="lg:col-span-4 bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-xs">
                  Team Sales Pipeline
                </h3>
                <Link
                  href="/dashboard/leads"
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  View Pipeline →
                </Link>
              </div>

              {/* Funnel Rows */}
              <div className="space-y-2 py-1">
                {/* New */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-24 bg-blue-500 text-white text-[10px] font-bold py-1 px-2 rounded-md text-center">
                      {pipelineCounts.new}
                    </div>
                    <span className="font-semibold text-slate-700 text-[11px]">
                      New
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 text-xs mr-4">
                    {pipelineCounts.new}
                  </span>
                  <span className="font-bold text-slate-700 text-xs">
                    {pipelineCounts.newPct}%
                  </span>
                </div>

                {/* Contacted */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-20 bg-teal-500 text-white text-[10px] font-bold py-1 px-2 rounded-md text-center">
                      {pipelineCounts.contacted}
                    </div>
                    <span className="font-semibold text-slate-700 text-[11px]">
                      Contacted
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 text-xs mr-4">
                    {pipelineCounts.contacted}
                  </span>
                  <span className="font-bold text-slate-700 text-xs">
                    {pipelineCounts.contactedPct}%
                  </span>
                </div>

                {/* Interested */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-16 bg-amber-400 text-white text-[10px] font-bold py-1 px-2 rounded-md text-center">
                      {pipelineCounts.interested}
                    </div>
                    <span className="font-semibold text-slate-700 text-[11px]">
                      Interested
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 text-xs mr-4">
                    {pipelineCounts.interested}
                  </span>
                  <span className="font-bold text-slate-700 text-xs">
                    {pipelineCounts.interestedPct}%
                  </span>
                </div>

                {/* Quotation */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-12 bg-purple-500 text-white text-[10px] font-bold py-1 px-2 rounded-md text-center">
                      {pipelineCounts.quotation}
                    </div>
                    <span className="font-semibold text-slate-700 text-[11px]">
                      Quotation
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 text-xs mr-4">
                    {pipelineCounts.quotation}
                  </span>
                  <span className="font-bold text-slate-700 text-xs">
                    {pipelineCounts.quotationPct}%
                  </span>
                </div>

                {/* Order */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-8 bg-pink-500 text-white text-[10px] font-bold py-1 px-1 rounded-md text-center">
                      {pipelineCounts.won}
                    </div>
                    <span className="font-semibold text-slate-700 text-[11px]">
                      Order Won
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 text-xs mr-4">
                    {pipelineCounts.won}
                  </span>
                  <span className="font-bold text-slate-700 text-xs">
                    {pipelineCounts.wonPct}%
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">
                  Overall Conversion Rate
                </span>
                <span className="font-black text-emerald-600">
                  {pipelineCounts.convRate}%
                </span>
              </div>
            </div>

            {/* Card 2: Today's Team Activities (4 Cols) */}
            <div className="lg:col-span-4 bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-xs">
                  Team Operational Activities
                </h3>
                <Link
                  href="/dashboard/followups"
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  View All Activities →
                </Link>
              </div>

              <div className="space-y-2.5 text-xs">
                {recentActivities.length > 0 ? (
                  recentActivities.map((act) => {
                    const Icon = act.icon;
                    return (
                      <div
                        key={act.id}
                        className="flex items-start justify-between gap-2"
                      >
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 mt-0.5">
                          {act.time}
                        </span>
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <div
                            className={`w-5 h-5 rounded-full ${act.iconBg} flex items-center justify-center shrink-0`}
                          >
                            <Icon className="w-2.5 h-2.5" />
                          </div>
                          <p className="text-[11px] text-slate-700 truncate">
                            <strong className="text-slate-900">
                              {act.actor}
                            </strong>
                            : {act.text}
                          </p>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${act.badgeColor} shrink-0`}
                        >
                          {act.badge}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No team activities recorded yet today.
                  </div>
                )}
              </div>
            </div>

            {/* Card 3: Team Performance (4 Cols) */}
            <div className="lg:col-span-4 bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-xs">
                  Team Performance
                </h3>
                <Link
                  href="/dashboard/performance"
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  View Performance →
                </Link>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">
                      Team Target
                    </span>
                    <strong className="text-slate-900 text-sm">
                      ₹{targetRupees.toLocaleString("en-IN")}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">
                      Achieved
                    </span>
                    <strong className="text-emerald-600 text-sm">
                      ₹{achievedRupees.toLocaleString("en-IN")}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">
                      Remaining
                    </span>
                    <strong className="text-amber-600 text-sm">
                      ₹{remainingRupees.toLocaleString("en-IN")}
                    </strong>
                  </div>
                </div>

                {/* Circular Achievement Indicator */}
                <div className="relative w-22 h-22 rounded-full border-6 border-emerald-500 border-t-emerald-300 border-r-slate-100 flex items-center justify-center shrink-0">
                  <div className="text-center">
                    <span className="text-base font-black text-slate-900 block leading-tight">
                      {targetPercent}%
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">
                      Achievement
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Performer Snippet */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                {topPerformer ? (
                  <>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        Top Performer
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[9px] flex items-center justify-center">
                          {(
                            topPerformer.name ||
                            topPerformer.user?.name ||
                            "TM"
                          )
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <strong className="text-slate-800 text-[11px] block">
                            {topPerformer.name ||
                              topPerformer.user?.name ||
                              "Sales Representative"}
                          </strong>
                          <span className="text-[9px] text-slate-400 font-mono">
                            ₹
                            {(
                              (topPerformer.achievedPaise || 0) / 100
                            ).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="font-black text-emerald-600 text-sm">
                      {topPerformer.achievementPercent || 0}%
                    </span>
                  </>
                ) : (
                  <span className="text-slate-400 text-xs">
                    No active leaderboard data yet.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ROW 3: Manager Attention Queue | My Sales Team | Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Attention Queue (4 Cols) */}
            <div className="lg:col-span-4 bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-xs">
                  Manager Attention Queue
                </h3>
                <Link
                  href="/dashboard/leads"
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  View All →
                </Link>
              </div>

              <div className="space-y-2 text-xs">
                {/* 1. Unassigned Leads */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50/50 border border-rose-100">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <div>
                      <strong className="text-slate-900 text-[11px] block">
                        {unassignedLeads} Unassigned Leads
                      </strong>
                      <span className="text-[9px] text-slate-500">
                        New leads awaiting team allocation
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center">
                      {unassignedLeads}
                    </span>
                    <Link
                      href="/dashboard/leads"
                      className="px-2 py-0.5 rounded-lg bg-white border border-rose-200 text-rose-700 font-bold text-[10px] hover:bg-rose-50"
                    >
                      Assign Leads
                    </Link>
                  </div>
                </div>

                {/* 2. Overdue Follow-ups */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/50 border border-amber-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <div>
                      <strong className="text-slate-900 text-[11px] block">
                        {overdueFollowups} Overdue Follow-ups
                      </strong>
                      <span className="text-[9px] text-slate-500">
                        Scheduled touchpoints past due date
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-white font-bold text-[9px] flex items-center justify-center">
                      {overdueFollowups}
                    </span>
                    <Link
                      href="/dashboard/followups"
                      className="px-2 py-0.5 rounded-lg bg-white border border-amber-200 text-amber-700 font-bold text-[10px] hover:bg-amber-50"
                    >
                      Review
                    </Link>
                  </div>
                </div>

                {/* 3. Pending Approvals */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-purple-50/50 border border-purple-100">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <div>
                      <strong className="text-slate-900 text-[11px] block">
                        {pendingApprovalsCount} Discount Requests
                      </strong>
                      <span className="text-[9px] text-slate-500">
                        Commercial concessions awaiting decision
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-purple-500 text-white font-bold text-[9px] flex items-center justify-center">
                      {pendingApprovalsCount}
                    </span>
                    <Link
                      href="/dashboard/manager/approvals"
                      className="px-2 py-0.5 rounded-lg bg-white border border-purple-200 text-purple-700 font-bold text-[10px] hover:bg-purple-50"
                    >
                      Review
                    </Link>
                  </div>
                </div>

                {/* 4. Active Design Jobs */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50/50 border border-blue-100">
                  <div className="flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <div>
                      <strong className="text-slate-900 text-[11px] block">
                        {designDueCount} Active Design Projects
                      </strong>
                      <span className="text-[9px] text-slate-500">
                        Preflight & creative workflow
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-blue-500 text-white font-bold text-[9px] flex items-center justify-center">
                      {designDueCount}
                    </span>
                    <Link
                      href="/dashboard/design"
                      className="px-2 py-0.5 rounded-lg bg-white border border-blue-200 text-blue-700 font-bold text-[10px] hover:bg-blue-50"
                    >
                      Queue
                    </Link>
                  </div>
                </div>

                {/* 5. Client Reviews */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-teal-50/50 border border-teal-100">
                  <div className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                    <div>
                      <strong className="text-slate-900 text-[11px] block">
                        {clientReviewPendingCount} Proof Reviews
                      </strong>
                      <span className="text-[9px] text-slate-500">
                        Proof tokens awaiting client action
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-teal-500 text-white font-bold text-[9px] flex items-center justify-center">
                      {clientReviewPendingCount}
                    </span>
                    <Link
                      href="/dashboard/design"
                      className="px-2 py-0.5 rounded-lg bg-white border border-teal-200 text-teal-700 font-bold text-[10px] hover:bg-teal-50"
                    >
                      Proofs
                    </Link>
                  </div>
                </div>

                {/* 6. Production Released Artworks */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-cyan-50/70 border border-cyan-200">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <div>
                      <strong className="text-slate-900 text-[11px] block">
                        {productionLockedCount} Production Locked
                      </strong>
                      <span className="text-[9px] text-slate-500">
                        Ready for preview &amp; mail dispatch
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-cyan-600 text-white font-bold text-[9px] flex items-center justify-center">
                      {productionLockedCount}
                    </span>
                    <Link
                      href="/dashboard/manager/production-release"
                      className="px-2 py-0.5 rounded-lg bg-cyan-600 text-white font-bold text-[10px] hover:bg-cyan-700 shadow-xs flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
                      Dispatch
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* My Sales Team (4 Cols) */}
            <div className="lg:col-span-4 bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-xs">
                  My Sales Team ({teamMembers.length})
                </h3>
                <Link
                  href="/dashboard/manager/team"
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  View Team →
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="pb-1.5">Team Member</th>
                      <th className="pb-1.5 text-center">Leads</th>
                      <th className="pb-1.5 text-center">Overdue</th>
                      <th className="pb-1.5 text-center">Orders</th>
                      <th className="pb-1.5 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {teamMembers.length > 0 ? (
                      teamMembers.slice(0, 5).map((member) => {
                        const mLeads = leads.filter(
                          (l) =>
                            (l.assignedToId?._id || l.assignedToId) ===
                            member._id,
                        );
                        const mOverdue = followups.filter(
                          (f) =>
                            (f.assignedToId?._id || f.assignedToId) ===
                              member._id &&
                            f.scheduledAt &&
                            new Date(f.scheduledAt) < now &&
                            f.status !== "COMPLETED",
                        ).length;
                        const mOrders = orders.filter(
                          (o) =>
                            (o.createdById?._id || o.createdById) ===
                            member._id,
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
                          <tr key={member._id} className="hover:bg-slate-50">
                            <td className="py-2 flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center">
                                {(member.name || "TM")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                              <span className="font-bold text-slate-900 truncate max-w-[100px]">
                                {member.name}
                              </span>
                            </td>
                            <td className="py-2 text-center font-bold text-slate-700">
                              {mLeads.length}
                            </td>
                            <td className="py-2 text-center font-bold text-rose-600">
                              {mOverdue}
                            </td>
                            <td className="py-2 text-center font-bold text-slate-700">
                              {mOrders.length}
                            </td>
                            <td className="py-2 text-right">
                              <span className="font-black text-emerald-600 text-[11px]">
                                ₹
                                {mRevenue.toLocaleString("en-IN", {
                                  maximumFractionDigits: 0,
                                })}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-8 text-center text-slate-400 text-xs"
                        >
                          No sales team members found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions (4 Cols) */}
            <div className="lg:col-span-4 bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
              <div className="pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-xs">
                  Quick Actions
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* 1. Assign Lead */}
                <Link
                  href="/dashboard/leads"
                  className="p-2.5 rounded-xl bg-blue-50/70 hover:bg-blue-100 border border-blue-100 flex items-center gap-2.5 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <UserPlus className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-slate-900 text-[11px] block">
                      Assign Lead
                    </strong>
                    <span className="text-[9px] text-slate-500">
                      Allocate leads
                    </span>
                  </div>
                </Link>

                {/* 2. Review Approvals */}
                <Link
                  href="/dashboard/manager/approvals"
                  className="p-2.5 rounded-xl bg-purple-50/70 hover:bg-purple-100 border border-purple-100 flex items-center gap-2.5 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                    <FileCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-slate-900 text-[11px] block">
                      Approvals
                    </strong>
                    <span className="text-[9px] text-slate-500">
                      Review discounts
                    </span>
                  </div>
                </Link>

                {/* 3. Create Follow-up */}
                <Link
                  href="/dashboard/followups"
                  className="p-2.5 rounded-xl bg-cyan-50/70 hover:bg-cyan-100 border border-cyan-100 flex items-center gap-2.5 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-cyan-600 text-white flex items-center justify-center shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-slate-900 text-[11px] block">
                      Follow-ups
                    </strong>
                    <span className="text-[9px] text-slate-500">
                      Schedule calls
                    </span>
                  </div>
                </Link>

                {/* 4. View My Team */}
                <Link
                  href="/dashboard/manager/team"
                  className="p-2.5 rounded-xl bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-100 flex items-center gap-2.5 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-slate-900 text-[11px] block">
                      View Team
                    </strong>
                    <span className="text-[9px] text-slate-500">
                      Roster & workload
                    </span>
                  </div>
                </Link>

                {/* 5. View Receivables */}
                <Link
                  href="/dashboard/receivables"
                  className="p-2.5 rounded-xl bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-100 flex items-center gap-2.5 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-slate-900 text-[11px] block">
                      Receivables
                    </strong>
                    <span className="text-[9px] text-slate-500">
                      Outstanding ledger
                    </span>
                  </div>
                </Link>

                {/* 6. Open Design Studio */}
                <Link
                  href="/dashboard/design"
                  className="p-2.5 rounded-xl bg-teal-50/70 hover:bg-teal-100 border border-teal-100 flex items-center gap-2.5 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                    <Palette className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-slate-900 text-[11px] block">
                      Design Studio
                    </strong>
                    <span className="text-[9px] text-slate-500">
                      Proof workflow
                    </span>
                  </div>
                </Link>

                {/* 7. Production Releases */}
                <Link
                  href="/dashboard/manager/production-release"
                  className="p-2.5 rounded-xl bg-cyan-50/70 hover:bg-cyan-100 border border-cyan-100 flex items-center gap-2.5 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-cyan-600 text-white flex items-center justify-center shrink-0">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-slate-900 text-[11px] block">
                      Production Releases
                    </strong>
                    <span className="text-[9px] text-slate-500">
                      Send print emails
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* ROW 4: Recent Team Leads & Recent Approvals Side-by-Side */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Recent Team Leads (6 Cols) */}
            <div className="lg:col-span-6 bg-white rounded-md p-4 border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-xs">
                  Recent Team Leads
                </h3>
                <Link
                  href="/dashboard/leads"
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  View All Leads →
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="pb-1.5">Lead / Business</th>
                      <th className="pb-1.5">Contact</th>
                      <th className="pb-1.5">Salesperson</th>
                      <th className="pb-1.5">Source</th>
                      <th className="pb-1.5">Status</th>
                      <th className="pb-1.5 text-right">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {leads.length > 0 ? (
                      leads.slice(0, 5).map((l) => (
                        <tr key={l._id} className="hover:bg-slate-50">
                          <td className="py-2.5 font-bold text-slate-900">
                            {l.businessName || l.contactName || "Lead"}
                          </td>
                          <td className="py-2.5 text-slate-500 font-mono">
                            {l.phone || "N/A"}
                          </td>
                          <td className="py-2.5 text-slate-700 font-medium">
                            {l.assignedToId?.name || "Unassigned"}
                          </td>
                          <td className="py-2.5 text-slate-500">
                            {l.source || "DIRECT"}
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                l.status === "WON"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : l.status === "NEW"
                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                    : "bg-teal-50 text-teal-700 border border-teal-200"
                              }`}
                            >
                              {l.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-right text-slate-400 font-mono text-[10px]">
                            {new Date(
                              l.createdAt || Date.now(),
                            ).toLocaleDateString("en-GB")}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-slate-400 text-xs"
                        >
                          No team leads found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Approvals (6 Cols) */}
            <div className="lg:col-span-6 bg-white rounded-md p-4 border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-xs">
                  Recent Approvals Queue
                </h3>
                <Link
                  href="/dashboard/manager/approvals"
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  View All →
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="pb-1.5">Quotation</th>
                      <th className="pb-1.5">Customer</th>
                      <th className="pb-1.5">Salesperson</th>
                      <th className="pb-1.5">Amount</th>
                      <th className="pb-1.5">Discount</th>
                      <th className="pb-1.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {approvals.length > 0 ? (
                      approvals.slice(0, 5).map((appr) => (
                        <tr key={appr._id} className="hover:bg-slate-50">
                          <td className="py-2.5 font-bold font-mono text-blue-600">
                            {appr.quotationId?.quotationNumber ||
                              appr.quotationNumber ||
                              "QTN"}
                          </td>
                          <td className="py-2.5 text-slate-800 font-medium">
                            {appr.customerId?.name ||
                              appr.customerName ||
                              appr.quotationId?.customerSnapshot?.displayName ||
                              "Customer"}
                          </td>
                          <td className="py-2.5 text-slate-600">
                            {appr.requestedById?.name || "Sales Rep"}
                          </td>
                          <td className="py-2.5 font-bold text-slate-900">
                            ₹
                            {(appr.totalAmountPaise
                              ? appr.totalAmountPaise / 100
                              : appr.totalAmount || 0
                            ).toLocaleString("en-IN")}
                          </td>
                          <td className="py-2.5 text-purple-700 font-bold">
                            {appr.requestedDiscountPercent || 0}%
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                appr.status === "APPROVED"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : appr.status === "REJECTED"
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : "bg-purple-50 text-purple-700 border border-purple-200"
                              }`}
                            >
                              {appr.status || "PENDING"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-slate-400 text-xs"
                        >
                          No pending discount approvals in queue.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ROW 5: Production Released Artworks (Ready for Vendor / Press Dispatch) */}
          <div className="bg-white rounded-md p-5 border border-slate-200/90 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xs">
                    Final Production Released Artworks ({productionLockedCount})
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Locked master files verified by client. Preview designs and
                    dispatch specifications directly to press or vendors.
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/manager/production-release"
                className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                Open Dispatch Center →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="pb-2">Job Number</th>
                    <th className="pb-2">Title &amp; Customer</th>
                    <th className="pb-2">Specifications</th>
                    <th className="pb-2">Preflight Status</th>
                    <th className="pb-2">SHA-256 Checksum</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {productionLockedProjects.length > 0 ? (
                    productionLockedProjects.slice(0, 5).map((p) => {
                      const brief = p.brief || {};
                      const sha =
                        p.currentVersionId?.sha256 || "SHA_LOCKED_PASS";
                      return (
                        <tr
                          key={p._id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-2.5 font-bold font-mono text-cyan-700">
                            {p.projectNumber}
                          </td>
                          <td className="py-2.5">
                            <div className="font-bold text-slate-900">
                              {p.title}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {p.customerId?.businessName ||
                                p.customerId?.displayName ||
                                "Client"}
                            </div>
                          </td>
                          <td className="py-2.5">
                            <span className="font-semibold text-slate-700">
                              {brief.productDimensions?.width &&
                              brief.productDimensions?.height
                                ? `${brief.productDimensions.width}×${brief.productDimensions.height} ${brief.productDimensions.unit || "in"}`
                                : "Custom"}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {brief.material || "Star Flex"}{" "}
                              {brief.gsm ? `(${brief.gsm} GSM)` : ""}
                            </span>
                          </td>
                          <td className="py-2.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                              <ShieldCheck className="w-3 h-3" />
                              PASS (300 DPI)
                            </span>
                          </td>
                          <td className="py-2.5 font-mono text-[10px] text-slate-500 max-w-[140px] truncate">
                            {sha.substring(0, 16)}...
                          </td>
                          <td className="py-2.5 text-right">
                            <Link
                              href="/dashboard/manager/production-release"
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] inline-flex items-center gap-1 shadow-xs"
                            >
                              <Mail className="w-3 h-3 text-cyan-400" />
                              Send Mail
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-slate-400 text-xs"
                      >
                        No production locked designs pending dispatch.
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
