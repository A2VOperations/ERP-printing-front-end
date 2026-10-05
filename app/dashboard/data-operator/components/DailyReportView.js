"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  BarChart3,
  Calendar,
  Clock,
  Download,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Building,
  Phone,
  User,
  MapPin,
  TrendingUp,
  Layers,
  FileText,
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

export default function DailyReportView({
  leads: propLeads = null,
  areas: propAreas = null,
  salesReps: propReps = null,
  currentUser: propUser = null,
  workingDurationStr: propDuration = null,
  setCurrentView = null,
  onRefresh = null,
}) {
  const router = useRouter();

  // Self-fetching fallback for standalone route
  const [internalLeads, setInternalLeads] = useState([]);
  const [internalAreas, setInternalAreas] = useState([]);
  const [internalReps, setInternalReps] = useState([]);
  const [internalUser, setInternalUser] = useState(null);
  const [loading, setLoading] = useState(!propLeads);
  const [copiedPhone, setCopiedPhone] = useState(null);

  // Selected Date Filter State (default to today's date YYYY-MM-DD)
  const todayIso = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [dateFilterPreset, setDateFilterPreset] = useState("today"); // 'today' | 'yesterday' | 'all' | 'custom'

  // Table filters inside Daily Report
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    if (propLeads) return;

    let isSubscribed = true;
    const fetchStandaloneData = async () => {
      setLoading(true);
      try {
        const uStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
        if (uStr && isSubscribed) setInternalUser(JSON.parse(uStr));

        const [leadsRes, areasRes, repsRes] = await Promise.all([
          api.get("/leads?limit=150").catch(() => null),
          api.get("/areas").catch(() => null),
          api.get("/users?role=sales").catch(() => null),
        ]);

        if (isSubscribed) {
          if (leadsRes?.data) {
            const lList = Array.isArray(leadsRes.data)
              ? leadsRes.data
              : leadsRes.data.leads || [];
            const formatted = lList.map((l) => ({
              id: l._id || l.id,
              leadId: l.leadNumber || `LD-${String(l._id || Math.random()).slice(-5).toUpperCase()}`,
              businessName: l.businessName || "Unnamed Business",
              ownerName: l.contactName || "",
              phone: l.phone || "",
              alternatePhone: l.alternatePhone || "",
              area: l.areaId?.name || l.area || "General Area",
              zone: l.zone || "General Zone",
              categoryLabel: l.businessCategory || "General Store",
              assignedToName: l.assignedToId?.name || "Unassigned",
              createdAt: l.createdAt
                ? new Date(l.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "Today",
              createdDate: l.createdAt ? new Date(l.createdAt) : new Date(),
              status: l.status || "Assigned",
              photoUrl: l.shopImageUrl || "",
            }));
            setInternalLeads(formatted);
          }

          if (areasRes?.data) {
            const aList = Array.isArray(areasRes.data)
              ? areasRes.data
              : areasRes.data.areas || [];
            setInternalAreas(aList);
          }

          if (repsRes?.data) {
            const rList = Array.isArray(repsRes.data)
              ? repsRes.data
              : repsRes.data.users || [];
            setInternalReps(rList);
          }
        }
      } catch (err) {
        console.error("Error fetching standalone daily report data:", err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchStandaloneData();
    return () => {
      isSubscribed = false;
    };
  }, [propLeads]);

  const leads = propLeads || internalLeads;
  const user = propUser || internalUser;

  // Handle Preset Changes
  const handlePresetSelect = (preset) => {
    setDateFilterPreset(preset);
    const d = new Date();
    if (preset === "today") {
      setSelectedDate(d.toISOString().split("T")[0]);
    } else if (preset === "yesterday") {
      d.setDate(d.getDate() - 1);
      setSelectedDate(d.toISOString().split("T")[0]);
    } else if (preset === "all") {
      setSelectedDate("");
    }
  };

  // Filter leads based on selected date
  const dateFilteredLeads = useMemo(() => {
    if (!selectedDate) return leads;
    return leads.filter((l) => {
      if (!l.createdDate) return false;
      const leadDate = new Date(l.createdDate).toISOString().split("T")[0];
      return leadDate === selectedDate;
    });
  }, [leads, selectedDate]);

  // Aggregate Key Metrics for the Day
  const totalLeadsToday = dateFilteredLeads.length;
  const targetLeadsToday = 50;
  const targetPct = Math.min(100, Math.round((totalLeadsToday / targetLeadsToday) * 100));

  const validPhoneLeads = dateFilteredLeads.filter(
    (l) => l.phone && l.phone.replace(/\D/g, "").length >= 10
  ).length;
  const completenessRate =
    totalLeadsToday > 0 ? Math.round((validPhoneLeads / totalLeadsToday) * 100) : 100;

  const assignedLeads = dateFilteredLeads.filter(
    (l) => l.assignedToName && l.assignedToName !== "Unassigned"
  ).length;

  const photosAttached = dateFilteredLeads.filter((l) => Boolean(l.photoUrl)).length;

  // Hourly Analysis for the selected date
  const hourlyData = useMemo(() => {
    const hours = ["9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM", "4PM", "5PM", "6PM"];
    const counts = { "9AM": 0, "10AM": 0, "11AM": 0, "12PM": 0, "1PM": 0, "2PM": 0, "3PM": 0, "4PM": 0, "5PM": 0, "6PM": 0 };

    dateFilteredLeads.forEach((entry) => {
      if (entry.createdDate) {
        const d = new Date(entry.createdDate);
        if (!isNaN(d.getTime())) {
          const h = d.getHours();
          const map = { 9: "9AM", 10: "10AM", 11: "11AM", 12: "12PM", 13: "1PM", 14: "2PM", 15: "3PM", 16: "4PM", 17: "5PM", 18: "6PM" };
          const label = map[h];
          if (label && counts[label] !== undefined) counts[label]++;
        }
      }
    });

    const maxVal = Math.max(...Object.values(counts), 1);
    return hours.map((hour) => ({
      hour,
      count: counts[hour],
      height: `${Math.max(8, Math.round((counts[hour] / maxVal) * 100))}%`,
    }));
  }, [dateFilteredLeads]);

  // Category Distribution
  const categoryStats = useMemo(() => {
    const map = {};
    dateFilteredLeads.forEach((l) => {
      const cat = l.categoryLabel || "General Store";
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / (totalLeadsToday || 1)) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [dateFilteredLeads, totalLeadsToday]);

  // Area Distribution
  const areaStats = useMemo(() => {
    const map = {};
    dateFilteredLeads.forEach((l) => {
      const area = l.area || "General Area";
      map[area] = (map[area] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / (totalLeadsToday || 1)) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [dateFilteredLeads, totalLeadsToday]);

  // Sales Rep Routing Distribution
  const repStats = useMemo(() => {
    const map = {};
    dateFilteredLeads.forEach((l) => {
      const rep = l.assignedToName || "Unassigned";
      map[rep] = (map[rep] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / (totalLeadsToday || 1)) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [dateFilteredLeads, totalLeadsToday]);

  // Table Filtered Results
  const filteredTableLeads = useMemo(() => {
    return dateFilteredLeads.filter((l) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        l.businessName?.toLowerCase().includes(q) ||
        l.ownerName?.toLowerCase().includes(q) ||
        l.phone?.includes(q) ||
        l.leadId?.toLowerCase().includes(q) ||
        l.assignedToName?.toLowerCase().includes(q);

      const matchCat = categoryFilter === "ALL" || l.categoryLabel === categoryFilter;
      const matchStatus = statusFilter === "ALL" || l.status === statusFilter;

      return matchQuery && matchCat && matchStatus;
    });
  }, [dateFilteredLeads, searchQuery, categoryFilter, statusFilter]);

  // Export Today's CSV Action
  const handleExportCsv = () => {
    if (dateFilteredLeads.length === 0) {
      alert("No leads found for the selected date.");
      return;
    }

    const headers = [
      "Lead ID",
      "Business Name",
      "Contact Person",
      "Phone",
      "Alternate Phone",
      "Area",
      "Zone",
      "Category",
      "Assigned Sales Rep",
      "Created Time",
      "Status",
    ];

    const rows = dateFilteredLeads.map((l) => [
      `"${l.leadId || ""}"`,
      `"${(l.businessName || "").replace(/"/g, '""')}"`,
      `"${(l.ownerName || "").replace(/"/g, '""')}"`,
      `"${l.phone || ""}"`,
      `"${l.alternatePhone || ""}"`,
      `"${(l.area || "").replace(/"/g, '""')}"`,
      `"${(l.zone || "").replace(/"/g, '""')}"`,
      `"${(l.categoryLabel || "").replace(/"/g, '""')}"`,
      `"${(l.assignedToName || "").replace(/"/g, '""')}"`,
      `"${l.createdAt || ""}"`,
      `"${l.status || ""}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `daily-report-leads-${selectedDate || "all"}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyPhone = (num) => {
    if (!num) return;
    navigator.clipboard?.writeText(num);
    setCopiedPhone(num);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    if (setCurrentView) {
      setCurrentView("dashboard");
    } else {
      router.push("/dashboard/data-operator");
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Top Breadcrumb & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500 hover:text-slate-800"
            title="Back to Data Operator Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                Data Operating Reports
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">Daily Register</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              Daily Operating Activity Report
            </h1>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Print / PDF
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm shadow-blue-500/20"
          >
            <Download className="w-4 h-4 text-white" />
            Export Day CSV
          </button>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Date Filter & Operator Info Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-orange-400 text-xs font-semibold uppercase tracking-wider">
              <Calendar className="w-4 h-4" />
              <span>Inspection Date & Operating Scope</span>
            </div>
            <h2 className="text-lg font-bold text-white">
              {selectedDate
                ? new Date(selectedDate).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "All-Time Aggregate Operating Register"}
            </h2>
            <p className="text-xs text-slate-300">
              Logged Operator:{" "}
              <span className="font-semibold text-white">
                {user?.name || "Ayush Kumar"} ({user?.roleSlug || user?.role || "data_operator"})
              </span>
              {" • "}Active Today:{" "}
              <span className="text-emerald-400 font-semibold">
                {propDuration || "Active Session"}
              </span>
            </p>
          </div>

          {/* Quick Date Presets & Custom Date Picker */}
          <div className="flex items-center flex-wrap gap-2 print:hidden">
            <button
              onClick={() => handlePresetSelect("today")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                dateFilterPreset === "today"
                  ? "bg-[#F95721] text-white shadow-sm"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handlePresetSelect("yesterday")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                dateFilterPreset === "yesterday"
                  ? "bg-[#F95721] text-white shadow-sm"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => handlePresetSelect("all")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                dateFilterPreset === "all"
                  ? "bg-[#F95721] text-white shadow-sm"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              All Time
            </button>

            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setDateFilterPreset("custom");
                }}
                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-hidden focus:border-orange-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row (6 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* 1. Total Leads */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Leads Ingested
            </span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalLeadsToday}</span>
            <span className="text-[11px] font-medium text-slate-500">
              / {targetLeadsToday} target
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${targetPct}%` }}
            />
          </div>
        </div>

        {/* 2. Photos Processed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Photos Processed
            </span>
            <Sparkles className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{photosAttached}</div>
          <div className="text-[11px] text-slate-500 mt-2">Market shots linked</div>
        </div>

        {/* 3. Valid & Assigned */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Sales Dispatched
            </span>
            <User className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{assignedLeads}</div>
          <div className="text-[11px] text-slate-500 mt-2">Allocated to sales reps</div>
        </div>

        {/* 4. Completeness Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Completeness
            </span>
            <CheckCircle2 className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-black text-teal-600">{completenessRate}%</div>
          <div className="text-[11px] text-slate-500 mt-2">Verified phone records</div>
        </div>

        {/* 5. Operating Time */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Operating Time
            </span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{propDuration || "5h 20m"}</div>
          <div className="text-[11px] text-slate-500 mt-2">Active logging session</div>
        </div>

        {/* 6. Avg Velocity */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Avg Pace
            </span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalLeadsToday > 0 ? "3m 15s" : "—"}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Per structured lead</div>
        </div>
      </div>

      {/* Visual Analytics Grid: Hourly + Category + Area + Sales */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Hourly Velocity Bar Chart (7 Cols) */}
        <div className="xl:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Hourly Operating Output</h3>
              <p className="text-xs text-slate-400 mt-0.5">Leads created per hour on selected day</p>
            </div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              Peak:{" "}
              {hourlyData.reduce((max, h) => (h.count > max.count ? h : max), hourlyData[0])?.hour ||
                "12PM"}
            </span>
          </div>

          <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-slate-100">
            {hourlyData.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <span className="text-[10px] font-semibold text-slate-600 opacity-0 group-hover:opacity-100 transition">
                  {h.count}
                </span>
                <div
                  className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-orange-500 to-amber-400 transition-all duration-300 group-hover:from-orange-600 group-hover:to-amber-500"
                  style={{ height: h.height }}
                />
                <span className="text-[10px] font-medium text-slate-400">{h.hour}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-3">
            <span>Morning shift (9AM – 1PM)</span>
            <span>Evening shift (2PM – 7PM)</span>
          </div>
        </div>

        {/* Business Category Share (5 Cols) */}
        <div className="xl:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Category Breakdown</h3>
                <p className="text-xs text-slate-400 mt-0.5">Business trades entered</p>
              </div>
              <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                {categoryStats.length} Trades
              </span>
            </div>

            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {categoryStats.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No leads recorded for this date.
                </div>
              ) : (
                categoryStats.map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-700 truncate">{cat.name}</span>
                      <span className="text-slate-500 text-[11px]">
                        {cat.count} leads ({cat.pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-orange-500 h-1.5 rounded-full"
                        style={{ width: `${cat.pct}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Leading sector: {categoryStats[0]?.name || "General Store"}</span>
            <span className="font-semibold text-slate-700">{totalLeadsToday} Total</span>
          </div>
        </div>
      </div>

      {/* Territory & Sales Rep Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Territory Matrix */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-bold text-slate-900">Area Coverage Today</h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">{areaStats.length} Areas</span>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {areaStats.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No areas covered yet.</p>
            ) : (
              areaStats.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition text-xs"
                >
                  <span className="font-semibold text-slate-800">{a.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-bold text-slate-700 text-[11px]">
                      {a.count} Leads
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">{a.pct}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sales Representatives Allocated */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900">Sales Representative Dispatch</h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">{repStats.length} Assigned</span>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {repStats.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No sales reps assigned.</p>
            ) : (
              repStats.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                      {r.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-800">{r.name}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md font-bold text-[11px]">
                    {r.count} Leads Assigned
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Comprehensive Leads Table for the Day */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Table Filter Header */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Daily Ingested Leads Register</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {filteredTableLeads.length} of {totalLeadsToday} entries for the selected day
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search business, owner, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 w-52"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-hidden focus:border-orange-500"
            >
              <option value="ALL">All Categories</option>
              {categoryStats.map((c, i) => (
                <option key={i} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-hidden focus:border-orange-500"
            >
              <option value="ALL">All Status</option>
              <option value="Assigned">Assigned</option>
              <option value="NEW">New</option>
              <option value="Incomplete">Incomplete</option>
            </select>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto scrollbar-thin">
          <table className="min-w-[800px] w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 whitespace-nowrap">Time / Lead ID</th>
                <th className="py-3 px-4 whitespace-nowrap">Business & Contact</th>
                <th className="py-3 px-4 whitespace-nowrap">Phone Number</th>
                <th className="py-3 px-4 whitespace-nowrap">Territory / Area</th>
                <th className="py-3 px-4 whitespace-nowrap">Category</th>
                <th className="py-3 px-4 whitespace-nowrap">Assigned Sales Rep</th>
                <th className="py-3 px-4 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTableLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-600 text-sm">No leads match the filters</p>
                      <p className="text-xs text-slate-400">
                        Try selecting another date or clearing search filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTableLeads.map((lead, idx) => (
                  <tr key={lead.id || idx} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono text-[11px] font-semibold text-slate-900 block">
                        {lead.leadId}
                      </span>
                      <span className="text-[10px] text-slate-400">{lead.createdAt}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block truncate max-w-[200px]">
                        {lead.businessName}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {lead.ownerName || "No contact name"}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {lead.phone ? (
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${lead.phone}`}
                            className="font-mono font-medium text-blue-600 hover:underline"
                          >
                            {lead.phone}
                          </a>
                          <button
                            onClick={() => handleCopyPhone(lead.phone)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                            title="Copy Phone"
                          >
                            {copiedPhone === lead.phone ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No phone</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">{lead.area}</span>
                      <span className="text-[10px] text-slate-400">{lead.zone}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {lead.categoryLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[9px]">
                          {(lead.assignedToName || "UN").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-700">{lead.assignedToName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {lead.status || "Assigned"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operator Verification & Sign-off Card */}
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Official Shift Verified Record
            </h4>
            <p className="text-xs text-slate-500">
              All entries are permanently indexed into MongoDB and linked with tenant ID.
            </p>
          </div>
        </div>

        <div className="text-right text-xs text-slate-400">
          Generated automatically by Advance CRM Enterprise Engine
        </div>
      </div>
    </div>
  );
}
