"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import { DashboardSkeleton } from "@/app/components/ui/skeleton";
import {
  Users,
  User,
  LayoutDashboard,
  ShoppingBag,
  FileText,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Target,
  Palette,
  Eye,
  ArrowRight,
  ChevronDown,
  Calendar,
  DollarSign,
  Activity,
  PhoneCall,
  Mail,
  Sparkles,
  Filter,
  ArrowUpRight,
  Check,
  ChevronRight,
  Phone,
  Layers,
  Award,
  Zap,
  ExternalLink,
  Shield,
  Briefcase,
  Grid,
  List,
  ArrowLeft,
} from "lucide-react";

const ROLE_COLORS = {
  admin: "bg-purple-50 text-purple-700 border-purple-200",
  super_admin: "bg-purple-50 text-purple-700 border-purple-200",
  manager: "bg-blue-50 text-blue-700 border-blue-200",
  sales_manager: "bg-blue-50 text-blue-700 border-blue-200",
  sales: "bg-emerald-50 text-emerald-700 border-emerald-200",
  employee: "bg-emerald-50 text-emerald-700 border-emerald-200",
  executive: "bg-emerald-50 text-emerald-700 border-emerald-200",
  designer: "bg-amber-50 text-amber-700 border-amber-200",
  graphic_designer: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function AdminUserDashboardsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedUserId = searchParams.get("userId");

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overviewData, setOverviewData] = useState({
    summary: {
      totalUsers: 0,
      totalActiveUsers: 0,
      onlineUsersCount: 0,
      totalTeamLeads: 0,
      totalTeamRevenueRupees: 0,
      avgTargetPercent: 0,
      salesRepsCount: 0,
    },
    users: [],
  });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table' | 'inspector'
  const [selectedUserId, setSelectedUserId] = useState(requestedUserId || null);
  const [selectedUserDashboard, setSelectedUserDashboard] = useState(null);
  const [loadingUserDashboard, setLoadingUserDashboard] = useState(false);
  const [activeInspectorTab, setActiveInspectorTab] = useState("overview"); // 'overview' | 'leads' | 'followups' | 'quotations' | 'orders' | 'activity' | 'design'

  // Fetch all users overview
  const loadOverviewData = useCallback(async () => {
    try {
      setRefreshing(true);
      let res = null;
      try {
        res = await api.get("/users/dashboards/overview", { silent: true });
      } catch (err) {
        // Fallback to standard endpoints if custom route is not available
      }

      if (res && res.data && Array.isArray(res.data.users)) {
        setOverviewData(res.data);
      } else {
        // Resilient fallback: assemble users overview from standard endpoints
        const [usersRes, leadsRes, ordersRes, followupsRes] =
          await Promise.allSettled([
            api.get("/users", { silent: true }),
            api.get("/leads?limit=200", { silent: true }),
            api.get("/orders?limit=200", { silent: true }),
            api.get("/followups?limit=200", { silent: true }),
          ]);

        const rawUsers =
          usersRes.status === "fulfilled" && usersRes.value?.data
            ? Array.isArray(usersRes.value.data)
              ? usersRes.value.data
              : usersRes.value.data.users || []
            : [];

        const allLeads =
          leadsRes.status === "fulfilled" && leadsRes.value?.data
            ? Array.isArray(leadsRes.value.data)
              ? leadsRes.value.data
              : leadsRes.value.data.leads || []
            : [];

        const allOrders =
          ordersRes.status === "fulfilled" && ordersRes.value?.data
            ? Array.isArray(ordersRes.value.data)
              ? ordersRes.value.data
              : ordersRes.value.data.items || ordersRes.value.data.records || []
            : [];

        const allFollowups =
          followupsRes.status === "fulfilled" && followupsRes.value?.data
            ? Array.isArray(followupsRes.value.data)
              ? followupsRes.value.data
              : followupsRes.value.data.followups || []
            : [];

        const now = new Date();
        const startOfToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          0,
          0,
          0,
          0,
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

        const synthesizedUsers = rawUsers.map((u) => {
          const uId = u._id || u.id;
          const role = (u.roleSlug || u.role || "").toLowerCase();
          const userLeads = allLeads.filter(
            (l) => l.assignedToId === uId || l.assignedTo?._id === uId,
          );
          const openLeads = userLeads.filter(
            (l) =>
              !["WON", "LOST", "DISQUALIFIED", "CONVERTED"].includes(l.status),
          );
          const wonLeads = userLeads.filter((l) =>
            ["WON", "CONVERTED"].includes(l.status),
          );

          const userFollowups = allFollowups.filter(
            (f) => f.assignedToId === uId || f.assignedTo?._id === uId,
          );
          const todayFollowups = userFollowups.filter((f) => {
            const d = new Date(f.dueAt || f.scheduledAt);
            return d >= startOfToday && d <= endOfToday;
          });
          const overdueFollowups = userFollowups.filter((f) => {
            const d = new Date(f.dueAt || f.scheduledAt);
            return d < now && f.status === "SCHEDULED";
          });

          const userOrders = allOrders.filter(
            (o) => o.assignedSalesId === uId || o.createdById === uId,
          );
          let revenueRupees = 0;
          for (const ord of userOrders) {
            const p =
              ord.grandTotalPaise ||
              ord.totalPaise ||
              (ord.totalAmount ? ord.totalAmount * 100 : 0);
            revenueRupees += Math.round(p / 100);
          }

          return {
            id: uId,
            _id: uId,
            name: u.name,
            email: u.email,
            phone: u.phone || "",
            role: u.role || u.roleSlug || "sales",
            roleSlug: u.roleSlug || u.role || "sales",
            roleName:
              u.roleId?.name || role.charAt(0).toUpperCase() + role.slice(1),
            avatarUrl: u.avatarUrl || u.avatar || null,
            status: u.status || "ACTIVE",
            isOnline: Boolean(u.isOnline),
            lastActiveAt: u.lastActiveAt || null,
            area:
              u.areaIds && u.areaIds.length > 0
                ? typeof u.areaIds[0] === "object"
                  ? u.areaIds[0].name
                  : null
                : null,
            metrics: {
              totalLeads: userLeads.length,
              openLeads: openLeads.length,
              wonLeads: wonLeads.length,
              conversionRate:
                userLeads.length > 0
                  ? Number(
                      ((wonLeads.length / userLeads.length) * 100).toFixed(1),
                    )
                  : 0,
              todayFollowups: todayFollowups.length,
              overdueFollowups: overdueFollowups.length,
              totalPendingFollowups: userFollowups.length,
              ordersCount: userOrders.length,
              revenueRupees,
              target: null,
            },
          };
        });

        const totalTeamLeads = synthesizedUsers.reduce(
          (sum, u) => sum + u.metrics.totalLeads,
          0,
        );
        const totalTeamRevenueRupees = synthesizedUsers.reduce(
          (sum, u) => sum + u.metrics.revenueRupees,
          0,
        );

        setOverviewData({
          summary: {
            totalUsers: synthesizedUsers.length,
            totalActiveUsers: synthesizedUsers.filter(
              (u) => u.status === "ACTIVE",
            ).length,
            onlineUsersCount: synthesizedUsers.filter((u) => u.isOnline).length,
            totalTeamLeads,
            totalTeamRevenueRupees,
            avgTargetPercent: 0,
            salesRepsCount: synthesizedUsers.filter((u) =>
              ["sales", "employee", "executive"].includes(u.roleSlug),
            ).length,
          },
          users: synthesizedUsers,
        });
      }
    } catch (err) {
      console.error("Failed to load user dashboards overview:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch individual user dashboard
  const loadUserDashboard = useCallback(async (userId) => {
    if (!userId) {
      setSelectedUserDashboard(null);
      return;
    }
    try {
      setLoadingUserDashboard(true);
      let res = null;
      try {
        res = await api.get(`/users/${userId}/dashboard`, { silent: true });
      } catch (err) {
        // Fallback to individual requests
      }

      if (res && res.data) {
        setSelectedUserDashboard(res.data);
      } else {
        // Resilient fallback: assemble single user dashboard from standard endpoints
        const [
          userRes,
          leadsRes,
          followupsRes,
          ordersRes,
          quotesRes,
          targetRes,
          actRes,
        ] = await Promise.allSettled([
          api.get(`/users/${userId}`, { silent: true }),
          api.get(`/leads?limit=100&assignedToId=${userId}`, { silent: true }),
          api.get(`/followups?limit=100&assignedToId=${userId}`, {
            silent: true,
          }),
          api.get(`/orders?limit=100&userId=${userId}`, { silent: true }),
          api.get(`/quotations?limit=100&userId=${userId}`, { silent: true }),
          api.get(`/targets/my-achievement?userId=${userId}`, { silent: true }),
          api.get(`/activities?limit=50&actorId=${userId}`, { silent: true }),
        ]);

        const u =
          userRes.status === "fulfilled" && userRes.value?.data
            ? userRes.value.data
            : {};
        const leads =
          leadsRes.status === "fulfilled" && leadsRes.value?.data
            ? Array.isArray(leadsRes.value.data)
              ? leadsRes.value.data
              : leadsRes.value.data.leads || []
            : [];
        const followups =
          followupsRes.status === "fulfilled" && followupsRes.value?.data
            ? Array.isArray(followupsRes.value.data)
              ? followupsRes.value.data
              : followupsRes.value.data.followups || []
            : [];
        const orders =
          ordersRes.status === "fulfilled" && ordersRes.value?.data
            ? Array.isArray(ordersRes.value.data)
              ? ordersRes.value.data
              : ordersRes.value.data.items || ordersRes.value.data.records || []
            : [];
        const quotes =
          quotesRes.status === "fulfilled" && quotesRes.value?.data
            ? Array.isArray(quotesRes.value.data)
              ? quotesRes.value.data
              : quotesRes.value.data.items || []
            : [];
        const target =
          targetRes.status === "fulfilled" && targetRes.value?.data
            ? targetRes.value.data
            : null;
        const activities =
          actRes.status === "fulfilled" && actRes.value?.data
            ? actRes.value.data
            : [];

        const openLeads = leads.filter(
          (l) =>
            !["WON", "LOST", "DISQUALIFIED", "CONVERTED"].includes(l.status),
        ).length;
        const wonLeads = leads.filter((l) =>
          ["WON", "CONVERTED"].includes(l.status),
        ).length;

        // Approved quotation price revenue
        const approvedQuotes = quotes.filter((q) =>
          ["ACCEPTED", "CONVERTED_TO_ORDER"].includes(q.status),
        );
        let revenueRupees = 0;
        for (const q of approvedQuotes) {
          const p =
            q.grandTotalPaise ||
            (q.grandTotal ? Math.round(q.grandTotal * 100) : 0);
          revenueRupees += Math.round(p / 100);
        }

        setSelectedUserDashboard({
          user: {
            id: userId,
            _id: userId,
            name: u.name || "Team Member",
            email: u.email || "",
            phone: u.phone || "",
            role: u.role || u.roleSlug || "sales",
            roleSlug: u.roleSlug || u.role || "sales",
            roleName: u.roleId?.name || u.role || "User",
            avatarUrl: u.avatarUrl || u.avatar || null,
            status: u.status || "ACTIVE",
            isOnline: Boolean(u.isOnline),
            area:
              u.areaIds && u.areaIds.length > 0
                ? typeof u.areaIds[0] === "object"
                  ? u.areaIds[0].name
                  : null
                : null,
          },
          kpi: {
            totalLeads: leads.length,
            openLeads,
            wonLeads,
            conversionRate:
              leads.length > 0
                ? Number(((wonLeads / leads.length) * 100).toFixed(1))
                : 0,
            todayFollowupsCount: followups.length,
            overdueFollowupsCount: 0,
            totalScheduledCount: followups.length,
            totalOrdersCount: orders.length,
            totalRevenueRupees: revenueRupees,
            approvedQuotesRevenueRupees: revenueRupees,
            approvedQuotesCount: approvedQuotes.length,
            totalQuotationsCount: quotes.length,
            target,
          },
          recentLeads: leads,
          upcomingFollowups: followups,
          recentQuotations: quotes,
          recentOrders: orders,
          recentActivities: activities,
        });
      }
    } catch (err) {
      console.error(`Failed to load dashboard for user ${userId}:`, err);
    } finally {
      setLoadingUserDashboard(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadOverviewData();
  }, [loadOverviewData]);

  // Synchronize when query param or selectedUserId changes
  useEffect(() => {
    if (requestedUserId) {
      setSelectedUserId(requestedUserId);
      setViewMode("inspector");
      loadUserDashboard(requestedUserId);
    }
  }, [requestedUserId, loadUserDashboard]);

  const handleSelectUser = (user) => {
    const uId = user.id || user._id;
    setSelectedUserId(uId);
    setViewMode("inspector");
    setActiveInspectorTab("overview");
    loadUserDashboard(uId);
    router.replace(`/dashboard/admin/user-dashboards?userId=${uId}`);
  };

  const handleBackToAllUsers = () => {
    setSelectedUserId(null);
    setSelectedUserDashboard(null);
    setViewMode("grid");
    router.replace("/dashboard/admin/user-dashboards");
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return overviewData.users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q) ||
        (u.role || "").toLowerCase().includes(q);

      const r = (u.roleSlug || u.role || "").toLowerCase();
      let matchesRole = true;
      if (roleFilter === "SALES") {
        matchesRole = ["sales", "employee", "executive"].includes(r);
      } else if (roleFilter === "MANAGER") {
        matchesRole = ["manager", "sales_manager"].includes(r);
      } else if (roleFilter === "DESIGNER") {
        matchesRole = ["designer", "graphic_designer"].includes(r);
      } else if (roleFilter === "ADMIN") {
        matchesRole = ["admin", "super_admin"].includes(r);
      }

      return matchesSearch && matchesRole;
    });
  }, [overviewData.users, searchQuery, roleFilter]);

  if (loading) {
    return (
      <div className="flex h-screen bg-[#F8FAFC]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar />
          <div className="flex-1 p-6 overflow-y-auto">
            <DashboardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            {/* Background ambient decorative circles */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-indigo-400/20">
                  <Shield className="w-3.5 h-3.5" />
                  Administrator Command Center
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                  All Users&apos; Dashboards
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/20 font-bold">
                    Live Sync
                  </span>
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
                  Inspect real-time individual sales pipelines, target quotas,
                  scheduled follow-ups, and daily activities across your entire
                  team.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    loadOverviewData();
                    if (selectedUserId) loadUserDashboard(selectedUserId);
                  }}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold transition border border-white/10 backdrop-blur-sm"
                  title="Refresh metrics"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-indigo-300" : ""}`}
                  />
                  <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
                </button>

                {viewMode === "inspector" && (
                  <button
                    onClick={handleBackToAllUsers}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>All Users Matrix</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  Active Team Members
                </div>
                <div className="mt-1 text-xl sm:text-2xl font-black text-white flex items-baseline gap-2">
                  {overviewData.summary.totalActiveUsers}
                  <span className="text-xs font-normal text-slate-400">
                    / {overviewData.summary.totalUsers} total
                  </span>
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {overviewData.summary.onlineUsersCount} online now
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                  Assigned Leads
                </div>
                <div className="mt-1 text-xl sm:text-2xl font-black text-white">
                  {overviewData.summary.totalTeamLeads}
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                  Active in user pipelines
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Team Booked Revenue
                </div>
                <div className="mt-1 text-xl sm:text-2xl font-black text-emerald-400">
                  ₹{" "}
                  {overviewData.summary.totalTeamRevenueRupees.toLocaleString(
                    "en-IN",
                  )}
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                  Confirmed orders & sales
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  Avg Quota Progress
                </div>
                <div className="mt-1 text-xl sm:text-2xl font-black text-amber-400">
                  {overviewData.summary.avgTargetPercent}%
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                  Across {overviewData.summary.salesRepsCount} sales reps
                </div>
              </div>
            </div>
          </div>

          {/* ===================== VIEW MODE 1: ALL USERS MATRIX ===================== */}
          {viewMode !== "inspector" && (
            <div className="space-y-6">
              {/* Filter and Search Controls */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, phone, or role..."
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Role Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                  {[
                    { id: "ALL", label: "All Members" },
                    { id: "SALES", label: "Sales Executives" },
                    { id: "MANAGER", label: "Managers" },
                    { id: "DESIGNER", label: "Designers" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setRoleFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        roleFilter === tab.id
                          ? "bg-white text-slate-900 shadow-2xs font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* View Switcher: Cards vs Table */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-lg transition ${
                      viewMode === "grid"
                        ? "bg-white text-indigo-600 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                    title="Grid of Cards"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-1.5 rounded-lg transition ${
                      viewMode === "table"
                        ? "bg-white text-indigo-600 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                    title="Comparison Table"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* No results message */}
              {filteredUsers.length === 0 && (
                <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800">
                    No users found
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    No team members matched your search criteria or role filter.
                    Try adjusting your search query.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setRoleFilter("ALL");
                    }}
                    className="mt-4 px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition"
                  >
                    Reset Filters
                  </button>
                </div>
              )}

              {/* VIEW MODE: CARDS GRID */}
              {viewMode === "grid" && filteredUsers.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredUsers.map((user) => {
                    const roleSlug = (
                      user.roleSlug ||
                      user.role ||
                      ""
                    ).toLowerCase();
                    const isDesigner = roleSlug.includes("designer");
                    const roleColorClass =
                      ROLE_COLORS[roleSlug] ||
                      "bg-slate-100 text-slate-700 border-slate-200";

                    return (
                      <div
                        key={user.id}
                        className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between group hover:border-indigo-300"
                      >
                        <div>
                          {/* User Header */}
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative shrink-0">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center border border-slate-200 overflow-hidden shadow-2xs">
                                  {user.avatarUrl ? (
                                    <img
                                      src={user.avatarUrl}
                                      alt={user.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    (user.name || "U")
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .slice(0, 2)
                                      .toUpperCase()
                                  )}
                                </div>
                                <span
                                  className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                    user.isOnline
                                      ? "bg-emerald-500 animate-pulse"
                                      : "bg-slate-300"
                                  }`}
                                  title={
                                    user.isOnline ? "Online now" : "Offline"
                                  }
                                />
                              </div>

                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                                  {user.name}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{user.email}</span>
                                </div>
                                {user.phone && (
                                  <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>{user.phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 uppercase tracking-wider ${roleColorClass}`}
                            >
                              {user.roleName || user.role}
                            </span>
                          </div>

                          {/* Quick Stats Grid */}
                          <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4">
                            {!isDesigner ? (
                              <>
                                <div>
                                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                    Leads Assigned
                                  </div>
                                  <div className="text-base font-black text-slate-900 mt-0.5">
                                    {user.metrics.totalLeads}
                                    <span className="text-[10px] font-semibold text-slate-500 ml-1">
                                      ({user.metrics.openLeads} open)
                                    </span>
                                  </div>
                                </div>

                                <div>
                                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                    Revenue Booked
                                  </div>
                                  <div className="text-base font-black text-emerald-600 mt-0.5">
                                    ₹{" "}
                                    {user.metrics.revenueRupees.toLocaleString(
                                      "en-IN",
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                    Due Follow-ups
                                  </div>
                                  <div className="text-base font-black text-slate-900 mt-0.5 flex items-center gap-1.5">
                                    {user.metrics.todayFollowups}
                                    {user.metrics.overdueFollowups > 0 && (
                                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200">
                                        {user.metrics.overdueFollowups} overdue
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                    Orders Won
                                  </div>
                                  <div className="text-base font-black text-slate-900 mt-0.5">
                                    {user.metrics.ordersCount}
                                    {user.metrics.conversionRate > 0 && (
                                      <span className="text-[10px] font-semibold text-emerald-600 ml-1">
                                        ({user.metrics.conversionRate}%)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                    Design Projects
                                  </div>
                                  <div className="text-base font-black text-slate-900 mt-0.5">
                                    {user.metrics.designStats?.totalProjects ||
                                      0}
                                  </div>
                                </div>

                                <div>
                                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                    In Progress
                                  </div>
                                  <div className="text-base font-black text-amber-600 mt-0.5">
                                    {user.metrics.designStats?.activeProjects ||
                                      0}
                                  </div>
                                </div>

                                <div>
                                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                    Approved
                                  </div>
                                  <div className="text-base font-black text-emerald-600 mt-0.5">
                                    {user.metrics.designStats
                                      ?.approvedProjects || 0}
                                  </div>
                                </div>

                                <div>
                                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                    Role Area
                                  </div>
                                  <div className="text-xs font-bold text-slate-800 mt-1 truncate">
                                    {user.area || "General Studio"}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Target Progress Bar (if target exists) */}
                          {user.metrics.target?.hasTarget && (
                            <div className="mb-4">
                              <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                                <span className="text-slate-500">
                                  Monthly Target Quota
                                </span>
                                <span className="text-indigo-600 font-bold">
                                  {user.metrics.target.achievementPercent}%
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    user.metrics.target.achievementPercent >=
                                    100
                                      ? "bg-emerald-500"
                                      : user.metrics.target
                                            .achievementPercent >= 60
                                        ? "bg-indigo-600"
                                        : "bg-amber-500"
                                  }`}
                                  style={{
                                    width: `${Math.min(100, user.metrics.target.achievementPercent)}%`,
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                                <span>
                                  ₹{" "}
                                  {user.metrics.target.achievedRupees.toLocaleString(
                                    "en-IN",
                                  )}{" "}
                                  achieved
                                </span>
                                <span>
                                  ₹{" "}
                                  {user.metrics.target.targetAmountRupees.toLocaleString(
                                    "en-IN",
                                  )}{" "}
                                  quota
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Card Actions */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleSelectUser(user)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white text-xs font-bold transition shadow-2xs group-hover:bg-indigo-600 group-hover:text-white"
                          >
                            <LayoutDashboard className="w-3.5 h-3.5" />
                            <span>View Full Dashboard</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* VIEW MODE: COMPARISON TABLE */}
              {viewMode === "table" && filteredUsers.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                          <th className="py-3.5 px-4">User / Rep</th>
                          <th className="py-3.5 px-3">Role</th>
                          <th className="py-3.5 px-3 text-center">Status</th>
                          <th className="py-3.5 px-3 text-center">Leads</th>
                          <th className="py-3.5 px-3 text-center">
                            Follow-ups Today
                          </th>
                          <th className="py-3.5 px-3 text-center">
                            Orders Won
                          </th>
                          <th className="py-3.5 px-3 text-right">Revenue</th>
                          <th className="py-3.5 px-3 text-center">
                            Target Progress
                          </th>
                          <th className="py-3.5 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map((user) => {
                          const roleSlug = (
                            user.roleSlug ||
                            user.role ||
                            ""
                          ).toLowerCase();
                          const roleColorClass =
                            ROLE_COLORS[roleSlug] ||
                            "bg-slate-100 text-slate-700 border-slate-200";

                          return (
                            <tr
                              key={user.id}
                              className="hover:bg-slate-50/80 transition-colors"
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="relative shrink-0">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 overflow-hidden">
                                      {user.avatarUrl ? (
                                        <img
                                          src={user.avatarUrl}
                                          alt={user.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        (user.name || "U")[0].toUpperCase()
                                      )}
                                    </div>
                                    <span
                                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${
                                        user.isOnline
                                          ? "bg-emerald-500 animate-pulse"
                                          : "bg-slate-300"
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900">
                                      {user.name}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                      {user.email}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${roleColorClass}`}
                                >
                                  {user.roleName || user.role}
                                </span>
                              </td>

                              <td className="py-3 px-3 text-center">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    user.isOnline
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : "bg-slate-100 text-slate-600 border border-slate-200"
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${user.isOnline ? "bg-emerald-500" : "bg-slate-400"}`}
                                  />
                                  {user.isOnline ? "Online" : "Offline"}
                                </span>
                              </td>

                              <td className="py-3 px-3 text-center font-bold text-slate-800">
                                {user.metrics.totalLeads}
                                <span className="text-[10px] text-slate-400 font-normal ml-1">
                                  ({user.metrics.openLeads})
                                </span>
                              </td>

                              <td className="py-3 px-3 text-center font-bold text-slate-800">
                                {user.metrics.todayFollowups}
                                {user.metrics.overdueFollowups > 0 && (
                                  <span className="ml-1 text-[10px] font-bold text-rose-600">
                                    ({user.metrics.overdueFollowups} overdue)
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-3 text-center font-bold text-slate-800">
                                {user.metrics.ordersCount}
                              </td>

                              <td className="py-3 px-3 text-right font-black text-slate-900">
                                ₹{" "}
                                {user.metrics.revenueRupees.toLocaleString(
                                  "en-IN",
                                )}
                              </td>

                              <td className="py-3 px-3 text-center">
                                {user.metrics.target?.hasTarget ? (
                                  <div className="inline-flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-indigo-600">
                                      {user.metrics.target.achievementPercent}%
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">
                                    No Target
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => handleSelectUser(user)}
                                  className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold text-xs transition"
                                >
                                  View Dashboard
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================== VIEW MODE 2: SINGLE USER DASHBOARD INSPECTOR ===================== */}
          {viewMode === "inspector" && (
            <div className="space-y-6">
              {/* User Switcher & Inspection Bar */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-indigo-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-base flex items-center justify-center border border-indigo-100 overflow-hidden shadow-2xs">
                      {selectedUserDashboard?.user?.avatarUrl ? (
                        <img
                          src={selectedUserDashboard.user.avatarUrl}
                          alt={selectedUserDashboard.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (selectedUserDashboard?.user?.name ||
                          "U")[0].toUpperCase()
                      )}
                    </div>
                    <span
                      className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        selectedUserDashboard?.user?.isOnline
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-slate-300"
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-slate-900">
                        {selectedUserDashboard?.user?.name || "Loading..."}
                      </h2>
                      {selectedUserDashboard?.user?.role && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                            ROLE_COLORS[
                              selectedUserDashboard.user.roleSlug ||
                                selectedUserDashboard.user.role
                            ] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {selectedUserDashboard.user.roleName ||
                            selectedUserDashboard.user.role}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{selectedUserDashboard?.user?.email}</span>
                      {selectedUserDashboard?.user?.phone && (
                        <>
                          <span>•</span>
                          <span>{selectedUserDashboard.user.phone}</span>
                        </>
                      )}
                      {selectedUserDashboard?.user?.area && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-slate-700">
                            Area: {selectedUserDashboard.user.area}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Switcher Dropdown & Back Action */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-500">
                      Switch User:
                    </label>
                    <select
                      value={selectedUserId || ""}
                      onChange={(e) => {
                        const targetU = overviewData.users.find(
                          (u) =>
                            u.id === e.target.value || u._id === e.target.value,
                        );
                        if (targetU) handleSelectUser(targetU);
                      }}
                      className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 outline-none focus:border-indigo-500"
                    >
                      {overviewData.users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.roleName || u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleBackToAllUsers}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Matrix</span>
                  </button>
                </div>
              </div>

              {loadingUserDashboard ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
                  <p className="text-xs text-slate-500 font-semibold">
                    Loading user dashboard metrics...
                  </p>
                </div>
              ) : selectedUserDashboard ? (
                <>
                  {/* Detailed KPI Cards Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. Leads KPI */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                        <span>Leads In Pipeline</span>
                        <Users className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="text-2xl font-black text-slate-900">
                        {selectedUserDashboard.kpi.totalLeads}
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                        <span>
                          Open:{" "}
                          <strong className="text-slate-800">
                            {selectedUserDashboard.kpi.openLeads}
                          </strong>
                        </span>
                        <span>
                          Won:{" "}
                          <strong className="text-emerald-600">
                            {selectedUserDashboard.kpi.wonLeads}
                          </strong>
                        </span>
                        <span>
                          Rate:{" "}
                          <strong className="text-indigo-600">
                            {selectedUserDashboard.kpi.conversionRate}%
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* 2. Follow-ups KPI */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                        <span>Follow-ups Schedule</span>
                        <Clock className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        {selectedUserDashboard.kpi.todayFollowupsCount}
                        <span className="text-xs font-semibold text-slate-400">
                          Due Today
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                        <span>
                          Total:{" "}
                          <strong className="text-slate-800">
                            {selectedUserDashboard.kpi.totalScheduledCount}
                          </strong>
                        </span>
                        {selectedUserDashboard.kpi.overdueFollowupsCount > 0 ? (
                          <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            {selectedUserDashboard.kpi.overdueFollowupsCount}{" "}
                            Overdue
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">
                            0 Overdue
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 3. Orders & Revenue KPI */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                        <span>Total Sales</span>
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="text-2xl font-black text-emerald-600">
                        ₹{" "}
                        {(
                          selectedUserDashboard.kpi.approvedQuotesRevenueRupees ??
                          selectedUserDashboard.kpi.totalRevenueRupees ??
                          0
                        ).toLocaleString("en-IN")}
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                        <span>
                          Approved Quotes:{" "}
                          <strong className="text-emerald-700">
                            {selectedUserDashboard.kpi.approvedQuotesCount ??
                              selectedUserDashboard.kpi.totalQuotationsCount ??
                              0}
                          </strong>
                        </span>
                        <span>
                          Orders Won:{" "}
                          <strong className="text-slate-800">
                            {selectedUserDashboard.kpi.totalOrdersCount ?? 0}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* 4. Target Progress */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                        <span>Target Quota</span>
                        <Target className="w-4 h-4 text-amber-500" />
                      </div>
                      {(selectedUserDashboard.kpi.target?.hasTarget ||
                        (selectedUserDashboard.kpi.target?.targetAmountRupees ?? 0) > 0 ||
                        (selectedUserDashboard.kpi.target?.targetPaise ?? 0) > 0) ? (
                        <>
                          <div className="text-2xl font-black text-amber-600">
                            {
                              selectedUserDashboard.kpi.target
                                .achievementPercent
                            }
                            %
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{
                                width: `${Math.min(100, selectedUserDashboard.kpi.target.achievementPercent || 0)}%`,
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 pt-1 border-t border-slate-100">
                            <span>
                              ₹{" "}
                              {(
                                selectedUserDashboard.kpi.target.achievedRupees ??
                                Math.round(
                                  (selectedUserDashboard.kpi.target.achievedPaise ||
                                    0) / 100,
                                )
                              ).toLocaleString("en-IN")}
                            </span>
                            <span>
                              Quota: ₹{" "}
                              {(
                                selectedUserDashboard.kpi.target
                                  .targetAmountRupees ??
                                Math.round(
                                  (selectedUserDashboard.kpi.target.targetPaise ||
                                    0) / 100,
                                )
                              ).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="py-2 text-center text-slate-400 text-xs">
                          <p className="font-semibold">No Quota Set</p>
                          <Link
                            href="/dashboard/admin/targets"
                            className="text-[11px] text-indigo-600 hover:underline font-bold mt-1 inline-block"
                          >
                            Set Target →
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sub-tabs Navigation */}
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    {[
                      {
                        id: "overview",
                        label: "Overview & Schedule",
                        icon: LayoutDashboard,
                      },
                      {
                        id: "leads",
                        label: `Assigned Leads (${selectedUserDashboard.kpi?.totalLeads ?? selectedUserDashboard.recentLeads?.length ?? 0})`,
                        icon: Users,
                      },
                      {
                        id: "followups",
                        label: `Follow-ups (${selectedUserDashboard.kpi?.totalScheduledCount ?? selectedUserDashboard.upcomingFollowups?.length ?? 0})`,
                        icon: Clock,
                      },
                      {
                        id: "quotations",
                        label: `Quotations (${selectedUserDashboard.kpi?.totalQuotationsCount ?? selectedUserDashboard.recentQuotations?.length ?? 0})`,
                        icon: FileText,
                      },
                      {
                        id: "orders",
                        label: `Orders (${selectedUserDashboard.kpi?.totalOrdersCount ?? selectedUserDashboard.recentOrders?.length ?? 0})`,
                        icon: ShoppingBag,
                      },
                      { id: "activity", label: "Activity Log", icon: Activity },
                      ...(selectedUserDashboard.designProjects?.length > 0
                        ? [
                            {
                              id: "design",
                              label: `Design Studio (${selectedUserDashboard.designProjects.length})`,
                              icon: Palette,
                            },
                          ]
                        : []),
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveInspectorTab(tab.id)}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                            activeInspectorTab === tab.id
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* TAB 1: OVERVIEW & SCHEDULE */}
                  {activeInspectorTab === "overview" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left: Today's / Upcoming Follow-ups */}
                      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            Scheduled Follow-ups for{" "}
                            {selectedUserDashboard.user.name.split(" ")[0]}
                          </h3>
                          <button
                            onClick={() => setActiveInspectorTab("followups")}
                            className="text-xs text-indigo-600 hover:underline font-bold"
                          >
                            View All →
                          </button>
                        </div>

                        {selectedUserDashboard.upcomingFollowups?.length ===
                        0 ? (
                          <div className="py-8 text-center text-slate-400 text-xs">
                            No follow-ups currently scheduled for this user.
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {selectedUserDashboard.upcomingFollowups
                              .slice(0, 5)
                              .map((f) => (
                                <div
                                  key={f._id}
                                  className="py-3 flex items-start justify-between gap-3"
                                >
                                  <div>
                                    <div className="text-xs font-bold text-slate-800">
                                      {f.title || "Follow-up Call"}
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                      {f.customerId?.displayName ||
                                        f.leadId?.contactName ||
                                        "Client"}
                                      {(f.customerId?.phone ||
                                        f.leadId?.phone) && (
                                        <span className="ml-1 text-slate-400">
                                          •{" "}
                                          {f.customerId?.phone ||
                                            f.leadId?.phone}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                        new Date(f.dueAt || f.scheduledAt) <
                                        new Date()
                                          ? "bg-rose-50 text-rose-600 border border-rose-200"
                                          : "bg-blue-50 text-blue-700 border border-blue-200"
                                      }`}
                                    >
                                      {new Date(
                                        f.dueAt || f.scheduledAt,
                                      ).toLocaleDateString("en-IN", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Recent Assigned Leads */}
                      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-indigo-600" />
                            Recent Assigned Leads
                          </h3>
                          <button
                            onClick={() => setActiveInspectorTab("leads")}
                            className="text-xs text-indigo-600 hover:underline font-bold"
                          >
                            View All →
                          </button>
                        </div>

                        {selectedUserDashboard.recentLeads?.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 text-xs">
                            No leads assigned to this user yet.
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {selectedUserDashboard.recentLeads
                              .slice(0, 5)
                              .map((lead) => (
                                <div
                                  key={lead._id}
                                  className="py-3 flex items-start justify-between gap-3"
                                >
                                  <div>
                                    <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                                      <span>
                                        {lead.contactName ||
                                          lead.businessName ||
                                          "Unnamed Lead"}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        #{lead.leadNumber}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                      {lead.businessName &&
                                        `${lead.businessName} • `}
                                      {lead.phone}
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                      {lead.status}
                                    </span>
                                    <div className="text-[11px] font-black text-slate-900 mt-1">
                                      ₹{" "}
                                      {(
                                        lead.expectedValue ||
                                        lead.estimatedBudget ||
                                        0
                                      ).toLocaleString("en-IN")}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: LEADS TABLE */}
                  {activeInspectorTab === "leads" && (
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900">
                          All Leads Assigned to{" "}
                          {selectedUserDashboard.user.name}
                        </h3>
                        <Link
                          href={`/dashboard/leads?assignedToId=${selectedUserDashboard.user._id}`}
                          className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          Open in Leads Workspace{" "}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                              <th className="py-3 px-4">Lead #</th>
                              <th className="py-3 px-3">Contact / Company</th>
                              <th className="py-3 px-3">Status</th>
                              <th className="py-3 px-3">Source</th>
                              <th className="py-3 px-3 text-right">Value</th>
                              <th className="py-3 px-4 text-right">
                                Last Updated
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedUserDashboard.recentLeads?.map((l) => (
                              <tr
                                key={l._id}
                                className="hover:bg-slate-50/80 transition-colors"
                              >
                                <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                                  {l.leadNumber || "N/A"}
                                </td>
                                <td className="py-3 px-3">
                                  <div className="font-bold text-slate-900">
                                    {l.contactName || "Inquiry"}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {l.businessName || l.phone}
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                    {l.status}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-slate-600">
                                  {l.source || "Manual"}
                                </td>
                                <td className="py-3 px-3 text-right font-black text-slate-900">
                                  ₹{" "}
                                  {(
                                    l.expectedValue ||
                                    l.estimatedBudget ||
                                    0
                                  ).toLocaleString("en-IN")}
                                </td>
                                <td className="py-3 px-4 text-right text-slate-400 text-[11px]">
                                  {new Date(
                                    l.updatedAt || l.createdAt,
                                  ).toLocaleDateString("en-IN")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: FOLLOWUPS */}
                  {activeInspectorTab === "followups" && (
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900">
                          Follow-up Schedules for{" "}
                          {selectedUserDashboard.user.name}
                        </h3>
                        <Link
                          href={`/dashboard/followups?assignedToId=${selectedUserDashboard.user._id}`}
                          className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          Open in Follow-ups Hub{" "}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                              <th className="py-3 px-4">Title / Purpose</th>
                              <th className="py-3 px-3">Customer / Lead</th>
                              <th className="py-3 px-3">Scheduled Date</th>
                              <th className="py-3 px-3">Status</th>
                              <th className="py-3 px-4 text-right">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedUserDashboard.upcomingFollowups?.map(
                              (f) => (
                                <tr
                                  key={f._id}
                                  className="hover:bg-slate-50/80 transition-colors"
                                >
                                  <td className="py-3 px-4 font-bold text-slate-900">
                                    {f.title}
                                  </td>
                                  <td className="py-3 px-3 text-slate-600">
                                    {f.customerId?.displayName ||
                                      f.leadId?.contactName ||
                                      "Client"}
                                  </td>
                                  <td className="py-3 px-3">
                                    <span
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                        new Date(f.dueAt || f.scheduledAt) <
                                        new Date()
                                          ? "bg-rose-50 text-rose-600 border border-rose-200"
                                          : "bg-blue-50 text-blue-700 border border-blue-200"
                                      }`}
                                    >
                                      {new Date(
                                        f.dueAt || f.scheduledAt,
                                      ).toLocaleString("en-IN", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                      {f.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right text-slate-400 text-[11px] truncate max-w-xs">
                                    {f.description || "—"}
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: QUOTATIONS */}
                  {activeInspectorTab === "quotations" && (
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900">
                          Quotations Created / Handled by{" "}
                          {selectedUserDashboard.user.name}
                        </h3>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                              <th className="py-3 px-4">Quote #</th>
                              <th className="py-3 px-3">Customer</th>
                              <th className="py-3 px-3">Status</th>
                              <th className="py-3 px-3 text-right">
                                Grand Total
                              </th>
                              <th className="py-3 px-4 text-right">
                                Created Date
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedUserDashboard.recentQuotations?.map(
                              (q) => (
                                <tr
                                  key={q._id}
                                  className="hover:bg-slate-50/80 transition-colors"
                                >
                                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                                    {q.quotationNumber}
                                  </td>
                                  <td className="py-3 px-3 font-semibold text-slate-900">
                                    {q.customerSnapshot?.displayName ||
                                      q.customerId?.displayName ||
                                      "Customer"}
                                  </td>
                                  <td className="py-3 px-3">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                      {q.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-right font-black text-slate-900">
                                    ₹{" "}
                                    {Math.round(
                                      (q.grandTotalPaise ||
                                        (q.grandTotal
                                          ? q.grandTotal * 100
                                          : 0)) / 100,
                                    ).toLocaleString("en-IN")}
                                  </td>
                                  <td className="py-3 px-4 text-right text-slate-400">
                                    {new Date(q.createdAt).toLocaleDateString(
                                      "en-IN",
                                    )}
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: ORDERS */}
                  {activeInspectorTab === "orders" && (
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900">
                          Orders Credited to {selectedUserDashboard.user.name}
                        </h3>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                              <th className="py-3 px-4">Order #</th>
                              <th className="py-3 px-3">Customer</th>
                              <th className="py-3 px-3">Order Status</th>
                              <th className="py-3 px-3">Payment</th>
                              <th className="py-3 px-3 text-right">Amount</th>
                              <th className="py-3 px-4 text-right">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedUserDashboard.recentOrders?.map((ord) => (
                              <tr
                                key={ord._id}
                                className="hover:bg-slate-50/80 transition-colors"
                              >
                                <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                                  {ord.orderNumber}
                                </td>
                                <td className="py-3 px-3 font-semibold text-slate-900">
                                  {ord.customerSnapshot?.displayName ||
                                    ord.customerId?.displayName ||
                                    "Customer"}
                                </td>
                                <td className="py-3 px-3">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                    {ord.orderStatus}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      ord.paymentStatus === "PAID"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-amber-50 text-amber-700"
                                    }`}
                                  >
                                    {ord.paymentStatus || "UNPAID"}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right font-black text-slate-900">
                                  ₹{" "}
                                  {Math.round(
                                    (ord.grandTotalPaise ||
                                      ord.totalPaise ||
                                      (ord.totalAmount
                                        ? ord.totalAmount * 100
                                        : 0)) / 100,
                                  ).toLocaleString("en-IN")}
                                </td>
                                <td className="py-3 px-4 text-right text-slate-400">
                                  {new Date(ord.createdAt).toLocaleDateString(
                                    "en-IN",
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 6: ACTIVITY LOG */}
                  {activeInspectorTab === "activity" && (
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                      <h3 className="text-sm font-bold text-slate-900 mb-4">
                        Recent Activity Timeline for{" "}
                        {selectedUserDashboard.user.name}
                      </h3>

                      {selectedUserDashboard.recentActivities?.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          No recent activity recorded for this user.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {selectedUserDashboard.recentActivities.map((act) => (
                            <div
                              key={act._id}
                              className="flex items-start gap-3 text-xs"
                            >
                              <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                                <Activity className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-slate-800">
                                  {act.summary}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {new Date(
                                    act.occurredAt || act.createdAt,
                                  ).toLocaleString("en-IN")}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 7: DESIGN STUDIO (if designer) */}
                  {activeInspectorTab === "design" &&
                    selectedUserDashboard.designProjects && (
                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-900">
                            Design Studio Projects Assigned to{" "}
                            {selectedUserDashboard.user.name}
                          </h3>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                                <th className="py-3 px-4">Project #</th>
                                <th className="py-3 px-3">Title / Artwork</th>
                                <th className="py-3 px-3">Customer</th>
                                <th className="py-3 px-3">Status</th>
                                <th className="py-3 px-3">Priority</th>
                                <th className="py-3 px-4 text-right">
                                  Due Date
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {selectedUserDashboard.designProjects.map((p) => (
                                <tr
                                  key={p._id}
                                  className="hover:bg-slate-50/80 transition-colors"
                                >
                                  <td className="py-3 px-4 font-mono font-bold text-amber-600">
                                    {p.projectNumber}
                                  </td>
                                  <td className="py-3 px-3 font-semibold text-slate-900">
                                    {p.title}
                                  </td>
                                  <td className="py-3 px-3 text-slate-600">
                                    {p.customerId?.displayName || "Client"}
                                  </td>
                                  <td className="py-3 px-3">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                      {p.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 font-bold text-slate-700">
                                    {p.priority || "NORMAL"}
                                  </td>
                                  <td className="py-3 px-4 text-right text-slate-400">
                                    {p.dueDate
                                      ? new Date(p.dueDate).toLocaleDateString(
                                          "en-IN",
                                        )
                                      : "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                </>
              ) : null}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
