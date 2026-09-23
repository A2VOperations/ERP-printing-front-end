"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import {
  TrendingUp,
  Users,
  CheckCircle2,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Target,
  Sparkles,
  Check,
  X,
  Search,
} from "lucide-react";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function AdminTargetsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [targetsData, setTargetsData] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL"); // ALL, SET, NOT_SET

  // Active Period
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("CREATE"); // CREATE, EDIT, BATCH
  const [selectedUser, setSelectedUser] = useState(null);
  const [targetForm, setTargetForm] = useState({
    userId: "",
    targetAmount: 100000,
    targetOrdersCount: 10,
    periodType: "MONTHLY",
    notes: "",
  });

  const [notification, setNotification] = useState(null);

  const showNotification = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadTargets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/targets?year=${selectedYear}&month=${selectedMonth}`,
      );
      if (res && res.data) {
        const rawList = res.data.targets || [];
        const salesTargets = rawList.filter((t) => {
          const role = String(
            t.user?.roleSlug || t.user?.role || "",
          ).toLowerCase();
          const name = String(t.user?.name || "").toLowerCase();
          const email = String(t.user?.email || "").toLowerCase();
          if (
            role.includes("admin") ||
            role === "manager" ||
            role === "designer" ||
            role === "customer" ||
            role === "operator" ||
            role === "delivery" ||
            name.includes("admin") ||
            email.includes("admin")
          ) {
            return false;
          }
          return role === "sales" || role === "employee";
        });
        setTargetsData(salesTargets);
      }
    } catch (err) {
      console.error("Failed to load targets:", err);
      showNotification("Failed to load sales targets", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  const loadUsers = useCallback(async () => {
    try {
      const res = await api.get("/users");
      if (res && res.data) {
        const list = Array.isArray(res.data)
          ? res.data
          : res.data.records || [];
        const salesOnly = list.filter((u) => {
          const role = String(u.roleSlug || u.role || "").toLowerCase();
          const name = String(u.name || "").toLowerCase();
          const email = String(u.email || "").toLowerCase();
          if (
            role.includes("admin") ||
            role === "manager" ||
            role === "designer" ||
            role === "customer" ||
            role === "operator" ||
            role === "delivery" ||
            name.includes("admin") ||
            email.includes("admin") ||
            u.isActive === false ||
            u.status === "DISABLED" ||
            u.status === "INACTIVE"
          ) {
            return false;
          }
          return role === "sales" || role === "employee";
        });
        setUsersList(salesOnly);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  }, []);

  useEffect(() => {
    loadTargets();
    loadUsers();
  }, [loadTargets, loadUsers]);

  // Summary Metrics
  const summary = useMemo(() => {
    const totalReps = targetsData.length;
    const repsWithTarget = targetsData.filter((t) => t.hasTarget).length;
    const totalTarget = targetsData.reduce(
      (sum, t) => sum + (t.targetRupees || 0),
      0,
    );
    const totalAchieved = targetsData.reduce(
      (sum, t) => sum + (t.achievedRupees || 0),
      0,
    );
    const totalOrdersWon = targetsData.reduce(
      (sum, t) => sum + (t.ordersWonCount || 0),
      0,
    );
    const totalTargetOrders = targetsData.reduce(
      (sum, t) => sum + (t.targetOrdersCount || 0),
      0,
    );
    const progressPercent =
      totalTarget > 0 ? ((totalAchieved / totalTarget) * 100).toFixed(1) : 0;

    return {
      totalReps,
      repsWithTarget,
      totalTarget,
      totalAchieved,
      totalOrdersWon,
      totalTargetOrders,
      progressPercent,
    };
  }, [targetsData]);

  // Filtered List
  const filteredTargets = useMemo(() => {
    return targetsData.filter((t) => {
      const name = t.user?.name || "";
      const email = t.user?.email || "";
      const matchesSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (filterStatus === "SET") return t.hasTarget;
      if (filterStatus === "NOT_SET") return !t.hasTarget;
      return true;
    });
  }, [targetsData, searchQuery, filterStatus]);

  // Open Edit Modal for Single Rep
  const handleOpenEdit = (item) => {
    setModalMode(item.hasTarget ? "EDIT" : "CREATE");
    setSelectedUser(item.user);
    setTargetForm({
      userId: item.user._id,
      targetAmount: item.targetRupees > 0 ? item.targetRupees : 100000,
      targetOrdersCount:
        item.targetOrdersCount > 0 ? item.targetOrdersCount : 10,
      periodType: item.periodType || "MONTHLY",
      notes: item.notes || "",
    });
    setShowModal(true);
  };

  // Open Create Modal from Top Button
  const handleOpenCreate = () => {
    setModalMode("CREATE");
    setSelectedUser(null);
    const firstRepWithoutTarget =
      targetsData.find((t) => !t.hasTarget)?.user || usersList[0];
    setTargetForm({
      userId: firstRepWithoutTarget?._id || "",
      targetAmount: 100000,
      targetOrdersCount: 10,
      periodType: "MONTHLY",
      notes: "",
    });
    setShowModal(true);
  };

  // Open Batch Modal
  const handleOpenBatch = () => {
    setModalMode("BATCH");
    setTargetForm({
      userId: "ALL",
      targetAmount: 100000,
      targetOrdersCount: 10,
      periodType: "MONTHLY",
      notes: `Standard monthly sales quota for ${MONTHS[selectedMonth]} ${selectedYear}`,
    });
    setShowModal(true);
  };

  // Save Target Form
  const handleSaveTarget = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const pStart = new Date(
        selectedYear,
        selectedMonth,
        1,
        0,
        0,
        0,
        0,
      ).toISOString();
      const pEnd = new Date(
        selectedYear,
        selectedMonth + 1,
        0,
        23,
        59,
        59,
        999,
      ).toISOString();

      if (modalMode === "BATCH") {
        // Apply to all sales reps
        for (const rep of usersList) {
          await api.post("/targets", {
            userId: rep._id,
            targetAmount: Number(targetForm.targetAmount),
            targetOrdersCount: Number(targetForm.targetOrdersCount),
            periodType: targetForm.periodType,
            periodStart: pStart,
            periodEnd: pEnd,
            notes: targetForm.notes,
          });
        }
        showNotification(
          `Applied targets to all ${usersList.length} sales representatives!`,
        );
      } else {
        if (!targetForm.userId) {
          showNotification("Please select a sales representative", "error");
          return;
        }

        await api.post("/targets", {
          userId: targetForm.userId,
          targetAmount: Number(targetForm.targetAmount),
          targetOrdersCount: Number(targetForm.targetOrdersCount),
          periodType: targetForm.periodType,
          periodStart: pStart,
          periodEnd: pEnd,
          notes: targetForm.notes,
        });

        showNotification(
          `Target successfully configured for ${selectedUser?.name || "Representative"}!`,
        );
      }

      setShowModal(false);
      loadTargets();
    } catch (err) {
      console.error("Failed to save target:", err);
      showNotification(err.message || "Failed to save sales target", "error");
    } finally {
      setSaving(false);
    }
  };

  // Delete Target
  const handleDeleteTarget = async (item) => {
    if (!item.targetId) return;
    if (
      !window.confirm(
        `Are you sure you want to remove the target for ${item.user.name}?`,
      )
    )
      return;

    try {
      await api.delete(`/targets/${item.targetId}`);
      showNotification(`Target removed for ${item.user.name}`);
      loadTargets();
    } catch (err) {
      console.error("Failed to delete target:", err);
      showNotification("Failed to remove target", "error");
    }
  };

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Notification Toast */}
          {notification && (
            <div
              className={`p-4 rounded-md flex items-center justify-between text-xs font-bold transition-all shadow-md ${
                notification.type === "error"
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              <span>{notification.msg}</span>
              <button
                onClick={() => setNotification(null)}
                className="p-1 hover:opacity-75"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold shadow-xs">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    Sales Quotas &amp; Targets Management
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    Configure individual and team revenue goals, track closed
                    sales, and govern live sales incentives.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Period Selectors */}
              <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-slate-700 px-2.5 py-1.5 focus:outline-none cursor-pointer"
                >
                  {MONTHS.map((m, idx) => (
                    <option key={m} value={idx}>
                      {m}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-slate-700 px-2 py-1.5 border-l border-slate-200 focus:outline-none cursor-pointer"
                >
                  {[
                    now.getFullYear() - 1,
                    now.getFullYear(),
                    now.getFullYear() + 1,
                  ].map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={loadTargets}
                disabled={loading}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs"
                title="Refresh live targets"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`}
                />
              </button>

              <button
                onClick={handleOpenBatch}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Batch Set All
              </button>

              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Set Representative Target
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Total Team Target */}
            <div className="bg-white p-5 rounded-md border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Team Target
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-slate-900">
                  ₹
                  {summary.totalTarget.toLocaleString("en-IN", {
                    maximumFractionDigits: 0,
                  })}
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <span className="text-[11px] text-slate-500 block">
                Goal for {MONTHS[selectedMonth]} {selectedYear}
              </span>
            </div>

            {/* Total Closed Sales Won */}
            <div className="bg-white p-5 rounded-md border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Closed Won
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-emerald-600">
                  ₹
                  {summary.totalAchieved.toLocaleString("en-IN", {
                    maximumFractionDigits: 0,
                  })}
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <span className="text-[11px] text-slate-500 block">
                {summary.totalOrdersWon} confirmed won orders
              </span>
            </div>

            {/* Overall Team Achievement % */}
            <div className="bg-white p-5 rounded-md border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Quota Progress
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-purple-600">
                  {summary.progressPercent}%
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-purple-600 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, summary.progressPercent)}%`,
                  }}
                />
              </div>
            </div>

            {/* Quota Coverage */}
            <div className="bg-white p-5 rounded-md border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Target Coverage
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-indigo-600">
                  {summary.repsWithTarget} / {summary.totalReps}
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <span className="text-[11px] text-slate-500 block">
                {summary.totalReps - summary.repsWithTarget} reps awaiting
                targets
              </span>
            </div>
          </div>

          {/* Main Targets Table Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            {/* Table Filter Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search sales representative by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs font-bold text-slate-600">
                  <button
                    onClick={() => setFilterStatus("ALL")}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      filterStatus === "ALL"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "hover:text-slate-900"
                    }`}
                  >
                    All Reps ({targetsData.length})
                  </button>
                  <button
                    onClick={() => setFilterStatus("SET")}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      filterStatus === "SET"
                        ? "bg-white text-emerald-700 shadow-2xs"
                        : "hover:text-slate-900"
                    }`}
                  >
                    Target Set ({summary.repsWithTarget})
                  </button>
                  <button
                    onClick={() => setFilterStatus("NOT_SET")}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      filterStatus === "NOT_SET"
                        ? "bg-white text-amber-700 shadow-2xs"
                        : "hover:text-slate-900"
                    }`}
                  >
                    Pending ({summary.totalReps - summary.repsWithTarget})
                  </button>
                </div>
              </div>
            </div>

            {/* Representative Quota Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                  <span>Loading sales quotas and live performance...</span>
                </div>
              ) : filteredTargets.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs space-y-2">
                  <Target className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700">
                    No representatives found
                  </p>
                  <p className="text-slate-400">
                    Try changing your search or filter options.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="pb-3">Sales Representative</th>
                      <th className="pb-3">Target Quota</th>
                      <th className="pb-3">Achieved Won</th>
                      <th className="pb-3">Progress</th>
                      <th className="pb-3">Required / Day</th>
                      <th className="pb-3">Notes</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTargets.map((item) => {
                      const rep = item.user;
                      const hasTarget = item.hasTarget;
                      const pct = Number(item.achievementPercent || 0);

                      return (
                        <tr
                          key={rep._id}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          {/* User Details */}
                          <td className="py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-[11px] shadow-2xs shrink-0">
                                {(rep.name || "SR").slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <strong className="text-slate-900 font-bold block text-[13px]">
                                  {rep.name}
                                </strong>
                                <span className="text-[11px] text-slate-400 block font-medium">
                                  {rep.email} ·{" "}
                                  <span className="capitalize">
                                    {rep.role || "Sales Rep"}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Target Quota */}
                          <td className="py-3.5">
                            {hasTarget ? (
                              <div>
                                <span className="font-black text-slate-900 text-sm block">
                                  ₹
                                  {item.targetRupees.toLocaleString("en-IN", {
                                    maximumFractionDigits: 0,
                                  })}
                                </span>
                                <span className="text-[10px] font-bold text-blue-600">
                                  {item.targetOrdersCount} target orders
                                </span>
                              </div>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-block">
                                No Target Configured
                              </span>
                            )}
                          </td>

                          {/* Achieved Won */}
                          <td className="py-3.5">
                            <span className="font-black text-emerald-600 text-sm block">
                              ₹
                              {item.achievedRupees.toLocaleString("en-IN", {
                                maximumFractionDigits: 0,
                              })}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {item.ordersWonCount} deals closed
                            </span>
                          </td>

                          {/* Progress */}
                          <td className="py-3.5 min-w-[140px]">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span
                                  className={`font-black ${
                                    pct >= 100
                                      ? "text-emerald-600"
                                      : pct >= 50
                                        ? "text-blue-600"
                                        : pct > 0
                                          ? "text-amber-600"
                                          : "text-slate-400"
                                  }`}
                                >
                                  {pct.toFixed(1)}%
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {hasTarget
                                    ? `₹${item.remainingRupees.toLocaleString("en-IN", { maximumFractionDigits: 0 })} left`
                                    : "-"}
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    pct >= 100
                                      ? "bg-emerald-500"
                                      : pct >= 50
                                        ? "bg-blue-600"
                                        : pct > 0
                                          ? "bg-amber-500"
                                          : "bg-slate-200"
                                  }`}
                                  style={{ width: `${Math.min(100, pct)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Required Run Rate */}
                          <td className="py-3.5">
                            {hasTarget && item.remainingRupees > 0 ? (
                              <div>
                                <span className="font-bold text-slate-800 text-xs block">
                                  ₹
                                  {item.requiredPerDayRupees.toLocaleString(
                                    "en-IN",
                                    { maximumFractionDigits: 0 },
                                  )}{" "}
                                  / day
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {item.daysRemaining} days left
                                </span>
                              </div>
                            ) : hasTarget && item.remainingRupees === 0 ? (
                              <span className="text-[10px] font-black text-emerald-600">
                                Target Met! 🎯
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Notes */}
                          <td className="py-3.5 max-w-[180px]">
                            <span
                              className="text-[11px] text-slate-500 block truncate"
                              title={item.notes || "No remarks"}
                            >
                              {item.notes || (
                                <span className="text-slate-300 italic">
                                  No notes
                                </span>
                              )}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-colors flex items-center gap-1 shadow-2xs"
                              >
                                <Edit2 className="w-3 h-3" />
                                {hasTarget ? "Edit Target" : "Set Target"}
                              </button>

                              {hasTarget && (
                                <button
                                  onClick={() => handleDeleteTarget(item)}
                                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Remove target"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Set / Edit Target Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {modalMode === "BATCH"
                      ? "Batch Set Target for All Reps"
                      : modalMode === "EDIT"
                        ? `Edit Target for ${selectedUser?.name}`
                        : `Configure Sales Target`}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Period: {MONTHS[selectedMonth]} {selectedYear}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTarget} className="space-y-4">
              {/* Representative Select (for single mode) */}
              {modalMode !== "BATCH" && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Sales Representative
                  </label>
                  <select
                    value={targetForm.userId}
                    onChange={(e) => {
                      const u = usersList.find(
                        (usr) => usr._id === e.target.value,
                      );
                      setSelectedUser(u);
                      setTargetForm((prev) => ({
                        ...prev,
                        userId: e.target.value,
                      }));
                    }}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="">-- Select Sales Representative --</option>
                    {usersList.map((usr) => (
                      <option key={usr._id} value={usr._id}>
                        {usr.name} ({usr.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Target Revenue in Rupees */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Target Revenue Quota (₹ Rupees)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={targetForm.targetAmount}
                    onChange={(e) =>
                      setTargetForm((prev) => ({
                        ...prev,
                        targetAmount: e.target.value,
                      }))
                    }
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-black text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    placeholder="100000"
                  />
                </div>

                {/* Quick Pre-set Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">
                    Quick:
                  </span>
                  {[50000, 100000, 200000, 500000, 1000000].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() =>
                        setTargetForm((prev) => ({
                          ...prev,
                          targetAmount: amt,
                        }))
                      }
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                        Number(targetForm.targetAmount) === amt
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      ₹{(amt / 1000).toLocaleString("en-IN")}k
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Orders Count */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Target Won Deals / Orders Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={targetForm.targetOrdersCount}
                  onChange={(e) =>
                    setTargetForm((prev) => ({
                      ...prev,
                      targetOrdersCount: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="10"
                />
              </div>

              {/* Notes / Strategy Instructions */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Target Strategy &amp; Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={targetForm.notes}
                  onChange={(e) =>
                    setTargetForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="e.g., Focus on corporate catalog accounts and visiting card renewals..."
                />
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving Target...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Save Target
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
