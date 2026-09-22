"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import {
  BarChart3,
  DollarSign,
  Users,
  ShoppingBag,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Layers,
  Palette,
  MapPin,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  Activity,
  Award,
  AlertTriangle,
  FolderX,
  TrendingUp,
  Truck,
  UserCheck,
  Download,
  Bookmark,
  Save,
  Trash2,
  Check,
  Star,
  FileSpreadsheet,
  Edit3,
  Mail,
  Play,
  Pause,
  History,
  CalendarPlus,
  X,
} from "lucide-react";
import apiClient from "../../../lib/apiClient";
import { API_BASE_URL } from "../../../lib/apiConfig";

// Currency formatter for integer paise
function formatPaise(paise = 0) {
  if (typeof paise !== "number" || isNaN(paise)) return "₹0";
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

export default function ReportsDashboard() {
  const [userRole, setUserRole] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("userRole");
      if (stored) return stored.toLowerCase();
      try {
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        if (u.role) return (u.roleSlug || u.role).toLowerCase();
      } catch {}
    }
    return "";
  });
  const [userName, setUserName] = useState("User");

  // Global Period Filter
  const [period, setPeriod] = useState("last_30_days");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  // Active Domain Tab
  const [activeTab, setActiveTab] = useState("kpis");

  // Domain Data States
  const [kpis, setKpis] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [quotations, setQuotations] = useState(null);
  const [orders, setOrders] = useState(null);
  const [financials, setFinancials] = useState(null);
  const [customers, setCustomers] = useState(null);
  const [design, setDesign] = useState(null);
  const [production, setProduction] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [followups, setFollowups] = useState(null);

  // Loading and Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Phase 7B-1: Saved Views & Export States
  const [savedViews, setSavedViews] = useState([]);
  const [selectedViewId, setSelectedViewId] = useState("");
  const [isSaveViewModalOpen, setIsSaveViewModalOpen] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [newViewIsDefault, setNewViewIsDefault] = useState(false);
  const [isEditViewModalOpen, setIsEditViewModalOpen] = useState(false);
  const [editViewName, setEditViewName] = useState("");
  const [editViewIsDefault, setEditViewIsDefault] = useState(false);
  const [editViewUpdateFilters, setEditViewUpdateFilters] = useState(true);
  const [exportLoading, setExportLoading] = useState(null); // 'csv' | 'xlsx' | null
  const [exportNotice, setExportNotice] = useState(null); // { type: 'success' | 'error', message }

  // Phase 7B-2B1: Scheduled Reports States
  const [userEmail, setUserEmail] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isMySchedulesOpen, setIsMySchedulesOpen] = useState(false);
  const [isRunHistoryOpen, setIsRunHistoryOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [scheduleRuns, setScheduleRuns] = useState([]);
  const [scheduleRunsLoading, setScheduleRunsLoading] = useState(false);
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);

  // Phase 7B-2B2: Team Distribution States
  const [eligibleRecipients, setEligibleRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [isDeliveriesModalOpen, setIsDeliveriesModalOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [runDeliveries, setRunDeliveries] = useState([]);
  const [runDeliveriesLoading, setRunDeliveriesLoading] = useState(false);

  // Schedule Form State
  const [scheduleForm, setScheduleForm] = useState({
    id: null,
    name: "",
    format: "csv",
    recurrence: "DAILY",
    timeOfDay: "09:00",
    dayOfWeek: 1,
    dayOfMonth: 1,
    deliveryMode: "SELF",
    includeOwner: true,
    recipientUserIds: [],
  });

  useEffect(() => {
    let role = (localStorage.getItem("userRole") || "").toLowerCase();
    let email = "";
    if (!role) {
      try {
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        role = (u.roleSlug || u.role || "admin").toLowerCase();
        email = u.email || "";
      } catch {
        role = "admin";
      }
    } else {
      try {
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        email = u.email || "";
      } catch {}
    }
    const name = localStorage.getItem("userName") || "User";
    setUserRole(role);
    setUserName(name);
    setUserEmail(email);

    if (role.includes("designer")) {
      setActiveTab("design");
    }
  }, []);

  const buildQueryParams = useCallback(() => {
    let params = `period=${period}`;
    if (period === "custom" && customStart && customEnd) {
      params += `&startDate=${encodeURIComponent(customStart)}&endDate=${encodeURIComponent(customEnd)}`;
    }
    return params;
  }, [period, customStart, customEnd]);

  // Load KPI data & active domain data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const q = buildQueryParams();

    try {
      // 1. Fetch Executive KPIs (role-scoped server-side)
      const kpiRes = await apiClient.get(`/api/v1/reports/kpis?${q}`);
      setKpis(kpiRes?.data || null);

      // 2. Fetch specific domain data only for the active tab (respecting RBAC)
      if (activeTab === "pipeline" && !userRole.includes("designer")) {
        const res = await apiClient.get(`/api/v1/reports/sales-pipeline?${q}`);
        setPipeline(res?.data || null);
      }
      if (activeTab === "quotations" && !userRole.includes("designer")) {
        const res = await apiClient.get(`/api/v1/reports/quotations?${q}`);
        setQuotations(res?.data || null);
      }
      if (activeTab === "orders" && !userRole.includes("designer")) {
        const res = await apiClient.get(`/api/v1/reports/orders?${q}`);
        setOrders(res?.data || null);
      }
      if (activeTab === "financials" && !userRole.includes("designer")) {
        const res = await apiClient.get(`/api/v1/reports/payments-receivables?${q}`);
        setFinancials(res?.data || null);
      }
      if (activeTab === "customers" && !userRole.includes("designer")) {
        const res = await apiClient.get(`/api/v1/reports/customers?${q}`);
        setCustomers(res?.data || null);
      }
      if (activeTab === "design" && !userRole.includes("sales")) {
        const res = await apiClient.get(`/api/v1/reports/design?${q}`);
        setDesign(res?.data || null);
      }
      if (activeTab === "production" && !userRole.includes("sales") && !userRole.includes("designer")) {
        const res = await apiClient.get(`/api/v1/reports/production?${q}`);
        setProduction(res?.data || null);
      }
      if (activeTab === "delivery" && !userRole.includes("designer")) {
        const res = await apiClient.get(`/api/v1/reports/delivery?${q}`);
        setDelivery(res?.data || null);
      }
      if (activeTab === "followups" && !userRole.includes("designer")) {
        const res = await apiClient.get(`/api/v1/reports/followups?${q}`);
        setFollowups(res?.data || null);
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
      setError(err.message || "Could not retrieve report metrics from server.");
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams, activeTab, userRole]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePeriodChange = (newPeriod) => {
    if (newPeriod === "custom") {
      setIsCustomOpen(true);
    } else {
      setIsCustomOpen(false);
      setPeriod(newPeriod);
    }
  };

  const applyCustomRange = () => {
    if (!customStart || !customEnd) {
      alert("Please specify both start date and end date.");
      return;
    }
    setPeriod("custom");
    setIsCustomOpen(false);
  };

  const tabToReportKey = {
    kpis: "kpis",
    pipeline: "sales-pipeline",
    quotations: "quotations",
    orders: "orders",
    financials: "payments-receivables",
    customers: "customers",
    design: "design",
    production: "production",
    delivery: "delivery",
    followups: "followups",
  };

  // Load Saved Views for the current active domain
  const fetchSavedViews = useCallback(async () => {
    const currentKey = tabToReportKey[activeTab] || activeTab;
    try {
      const res = await apiClient.get(`/api/v1/reports/saved-views?reportKey=${currentKey}`);
      const views = res?.data || [];
      setSavedViews(views);

      const defaultView = views.find((v) => v.isDefault);
      if (defaultView && !selectedViewId) {
        setSelectedViewId(defaultView._id);
        if (defaultView.period) setPeriod(defaultView.period);
        if (defaultView.startDate) setCustomStart(defaultView.startDate.split("T")[0]);
        if (defaultView.endDate) setCustomEnd(defaultView.endDate.split("T")[0]);
      }
    } catch (err) {
      console.warn("Failed to load saved views:", err.message);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchSavedViews();
  }, [fetchSavedViews]);

  const handleSelectView = (viewId) => {
    setSelectedViewId(viewId);
    if (!viewId) {
      setPeriod("last_30_days");
      setCustomStart("");
      setCustomEnd("");
      return;
    }
    const view = savedViews.find((v) => v._id === viewId);
    if (view) {
      if (view.period) setPeriod(view.period);
      if (view.startDate) setCustomStart(view.startDate.split("T")[0]);
      if (view.endDate) setCustomEnd(view.endDate.split("T")[0]);
    }
  };

  const handleCreateSavedView = async (e) => {
    e.preventDefault();
    if (!newViewName.trim()) return;

    const currentKey = tabToReportKey[activeTab] || activeTab;
    try {
      const payload = {
        name: newViewName.trim(),
        reportKey: currentKey,
        period,
        startDate: period === "custom" && customStart ? new Date(customStart).toISOString() : null,
        endDate: period === "custom" && customEnd ? new Date(customEnd).toISOString() : null,
        isDefault: newViewIsDefault,
      };
      const res = await apiClient.post("/api/v1/reports/saved-views", payload);
      setIsSaveViewModalOpen(false);
      setNewViewName("");
      setNewViewIsDefault(false);
      await fetchSavedViews();
      if (res?.data?._id) {
        setSelectedViewId(res.data._id);
      }
      setExportNotice({ type: "success", message: "Report view saved successfully!" });
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err) {
      console.error("Failed to save view:", err);
      alert(err.message || "Failed to save view");
    }
  };

  const handleSetDefaultView = async () => {
    if (!selectedViewId) return;
    try {
      await apiClient.post(`/api/v1/reports/saved-views/${selectedViewId}/set-default`, {});
      await fetchSavedViews();
      setExportNotice({ type: "success", message: "Saved view marked as default!" });
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err) {
      alert(err.message || "Failed to set default view");
    }
  };

  const handleOpenEditModal = () => {
    if (!selectedViewId) return;
    const view = savedViews.find((v) => v._id === selectedViewId);
    if (!view) return;
    setEditViewName(view.name || "");
    setEditViewIsDefault(!!view.isDefault);
    setEditViewUpdateFilters(true);
    setIsEditViewModalOpen(true);
  };

  const handleUpdateSavedView = async (e) => {
    e.preventDefault();
    if (!selectedViewId || !editViewName.trim()) return;

    try {
      const payload = {
        name: editViewName.trim(),
        isDefault: editViewIsDefault,
      };
      if (editViewUpdateFilters) {
        payload.period = period;
        payload.startDate = period === "custom" && customStart ? new Date(customStart).toISOString() : null;
        payload.endDate = period === "custom" && customEnd ? new Date(customEnd).toISOString() : null;
      }
      await apiClient.put(`/api/v1/reports/saved-views/${selectedViewId}`, payload);
      setIsEditViewModalOpen(false);
      await fetchSavedViews();
      setExportNotice({ type: "success", message: "Saved view updated successfully!" });
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err) {
      console.error("Failed to update saved view:", err);
      alert(err.message || "Failed to update saved view");
    }
  };

  const handleDeleteView = async () => {
    if (!selectedViewId) return;
    if (!window.confirm("Are you sure you want to delete this saved view?")) return;
    try {
      await apiClient.delete(`/api/v1/reports/saved-views/${selectedViewId}`);
      setSelectedViewId("");
      await fetchSavedViews();
      setExportNotice({ type: "success", message: "Saved view removed." });
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err) {
      alert(err.message || "Failed to delete view");
    }
  };

  // Phase 7B-2B1: Schedule handlers
  const fetchSchedules = useCallback(async () => {
    try {
      const res = await apiClient.get("/api/v1/reports/schedules");
      setSchedules(res?.data || []);
    } catch (err) {
      console.warn("Failed to load schedules:", err.message);
    }
  }, []);

  const fetchEligibleRecipients = useCallback(async () => {
    if (!userRole.includes("admin") && !userRole.includes("manager")) return;
    setLoadingRecipients(true);
    try {
      const res = await apiClient.get("/api/v1/reports/schedule-recipients");
      setEligibleRecipients(res?.data || []);
    } catch (err) {
      console.warn("Failed to load eligible recipients:", err.message);
      setEligibleRecipients([]);
    } finally {
      setLoadingRecipients(false);
    }
  }, [userRole]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleOpenCreateSchedule = () => {
    const currentKey = tabToReportKey[activeTab] || activeTab;
    const defaultName = `${currentKey.replace(/-/g, " ").toUpperCase()} Scheduled Report`;
    setScheduleForm({
      id: null,
      name: defaultName,
      format: "csv",
      recurrence: "DAILY",
      timeOfDay: "09:00",
      dayOfWeek: 1,
      dayOfMonth: 1,
      deliveryMode: "SELF",
      includeOwner: true,
      recipientUserIds: [],
    });
    fetchEligibleRecipients();
    setIsScheduleModalOpen(true);
  };

  const handleOpenEditSchedule = (s) => {
    setScheduleForm({
      id: s._id,
      name: s.name,
      format: s.format || "csv",
      recurrence: s.recurrence,
      timeOfDay: s.timeOfDay || "09:00",
      dayOfWeek: s.dayOfWeek !== null && s.dayOfWeek !== undefined ? s.dayOfWeek : 1,
      dayOfMonth: s.dayOfMonth !== null && s.dayOfMonth !== undefined ? s.dayOfMonth : 1,
      deliveryMode: s.deliveryMode || "SELF",
      includeOwner: s.includeOwner !== false,
      recipientUserIds: (s.recipientUserIds || []).map((id) => (id?._id ? String(id._id) : String(id))),
    });
    fetchEligibleRecipients();
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    setScheduleSubmitting(true);
    const currentKey = tabToReportKey[activeTab] || activeTab;
    const effectivePeriod = period === "custom" ? "last_30_days" : period;

    const payload = {
      name: scheduleForm.name.trim(),
      reportKey: currentKey,
      format: scheduleForm.format,
      period: effectivePeriod,
      recurrence: scheduleForm.recurrence,
      timeOfDay: scheduleForm.timeOfDay,
      deliveryMode: scheduleForm.deliveryMode,
      includeOwner: scheduleForm.includeOwner,
      recipientUserIds: scheduleForm.recipientUserIds,
    };

    if (scheduleForm.recurrence === "WEEKLY") {
      payload.dayOfWeek = Number(scheduleForm.dayOfWeek);
    } else if (scheduleForm.recurrence === "MONTHLY") {
      payload.dayOfMonth = Number(scheduleForm.dayOfMonth);
    }

    try {
      if (scheduleForm.id) {
        await apiClient.put(`/api/v1/reports/schedules/${scheduleForm.id}`, payload);
        setExportNotice({ type: "success", message: "Report schedule updated successfully!" });
      } else {
        await apiClient.post("/api/v1/reports/schedules", payload);
        setExportNotice({ type: "success", message: "Automated report schedule created!" });
      }
      setIsScheduleModalOpen(false);
      await fetchSchedules();
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err) {
      alert(err.message || "Failed to save schedule");
    } finally {
      setScheduleSubmitting(false);
    }
  };

  const handlePauseSchedule = async (id) => {
    try {
      await apiClient.post(`/api/v1/reports/schedules/${id}/pause`);
      await fetchSchedules();
      setExportNotice({ type: "success", message: "Schedule paused." });
      setTimeout(() => setExportNotice(null), 3000);
    } catch (err) {
      alert(err.message || "Failed to pause schedule");
    }
  };

  const handleResumeSchedule = async (id) => {
    try {
      await apiClient.post(`/api/v1/reports/schedules/${id}/resume`);
      await fetchSchedules();
      setExportNotice({ type: "success", message: "Schedule resumed." });
      setTimeout(() => setExportNotice(null), 3000);
    } catch (err) {
      alert(err.message || "Failed to resume schedule");
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm("Are you sure you want to delete this scheduled report? Historical run logs will be preserved.")) return;
    try {
      await apiClient.delete(`/api/v1/reports/schedules/${id}`);
      await fetchSchedules();
      setExportNotice({ type: "success", message: "Schedule deleted." });
      setTimeout(() => setExportNotice(null), 3000);
    } catch (err) {
      alert(err.message || "Failed to delete schedule");
    }
  };

  const handleViewRuns = async (schedule) => {
    setSelectedSchedule(schedule);
    setIsRunHistoryOpen(true);
    setScheduleRunsLoading(true);
    try {
      const res = await apiClient.get(`/api/v1/reports/schedules/${schedule._id}/runs`);
      setScheduleRuns(res?.data || []);
    } catch (err) {
      console.warn("Failed to load schedule runs:", err.message);
      setScheduleRuns([]);
    } finally {
      setScheduleRunsLoading(false);
    }
  };

  const handleViewDeliveries = async (run) => {
    if (!selectedSchedule) return;
    setSelectedRun(run);
    setIsDeliveriesModalOpen(true);
    setRunDeliveriesLoading(true);
    try {
      const res = await apiClient.get(`/api/v1/reports/schedules/${selectedSchedule._id}/runs/${run._id}/deliveries`);
      setRunDeliveries(res?.data || []);
    } catch (err) {
      console.warn("Failed to load run deliveries:", err.message);
      setRunDeliveries([]);
    } finally {
      setRunDeliveriesLoading(false);
    }
  };

  const handleExport = async (format) => {
    setExportLoading(format);
    setExportNotice(null);
    const currentKey = tabToReportKey[activeTab] || activeTab;

    try {
      const token = await apiClient.getAuthToken();
      const payload = {
        reportKey: currentKey,
        format,
        period,
        startDate: period === "custom" && customStart ? new Date(customStart).toISOString() : null,
        endDate: period === "custom" && customEnd ? new Date(customEnd).toISOString() : null,
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/reports/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || errData?.message || `Export failed with HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get("content-disposition");
      let filename = `${currentKey}_${period}.${format}`;
      if (contentDisposition && contentDisposition.includes("filename=")) {
        filename = contentDisposition.split("filename=")[1].replace(/"/g, "").trim();
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setExportNotice({ type: "success", message: `Exported ${filename} successfully!` });
      setTimeout(() => setExportNotice(null), 5000);
    } catch (err) {
      console.error("Export failed:", err);
      setExportNotice({ type: "error", message: err.message || "Export failed" });
    } finally {
      setExportLoading(null);
    }
  };

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* 1. HEADER & PERIOD TOOLBAR */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                <BarChart3 className="w-4 h-4" />
                <span>Executive Analytics & Reporting Foundation</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Enterprise Performance Dashboard
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time, tenant-isolated operational metrics derived directly from CRM and ERP ledgers.
              </p>
            </div>

            {/* Global Period Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "today", label: "Today" },
                { id: "last_7_days", label: "Last 7 Days" },
                { id: "last_30_days", label: "Last 30 Days" },
                { id: "this_month", label: "This Month" },
                { id: "previous_month", label: "Previous Month" },
                { id: "custom", label: "Custom" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handlePeriodChange(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                    period === item.id
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/25 font-bold"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-xs"
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <button
                onClick={fetchData}
                disabled={loading}
                className="p-2 rounded-xl bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition disabled:opacity-50"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
              </button>
            </div>
          </div>

          {/* Custom Date Range Picker Popover */}
          {isCustomOpen && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-lg flex flex-wrap items-center gap-3 text-xs">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-slate-800">Select Date Range:</span>
              <div className="flex items-center gap-2">
                <label className="text-slate-500 font-medium">Start:</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-800 px-2.5 py-1.5 rounded-lg text-xs focus:border-blue-500 outline-none shadow-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-slate-500 font-medium">End:</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-800 px-2.5 py-1.5 rounded-lg text-xs focus:border-blue-500 outline-none shadow-xs"
                />
              </div>
              <button
                onClick={applyCustomRange}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition"
              >
                Apply Range
              </button>
              <button
                onClick={() => setIsCustomOpen(false)}
                className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 font-medium"
              >
                Cancel
              </button>
            </div>
          )}

          {/* ERROR BANNER */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between text-xs shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
              <button
                onClick={fetchData}
                className="px-3 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-semibold shadow-xs transition"
              >
                Retry
              </button>
            </div>
          )}

          {/* 2. EXECUTIVE KPI CARDS (DRILL-DOWN ENABLED) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Sales / Orders Value */}
            <Link
              href="/dashboard/orders"
              className="group p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-500/50 hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Sales Value
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:scale-105 transition">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {loading ? (
                    <div className="h-7 w-28 bg-slate-100 animate-pulse rounded-lg" />
                  ) : (
                    formatPaise(kpis?.orders?.totalSalesValuePaise || 0)
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                  <span>{kpis?.orders?.totalOrders || 0} Confirmed Orders</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 transition" />
                </p>
              </div>
            </Link>

            {/* KPI 2: Received Payments */}
            <Link
              href="/dashboard/payments"
              className="group p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-500/50 hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Received Payments
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-emerald-600 tracking-tight">
                  {loading ? (
                    <div className="h-7 w-28 bg-slate-100 animate-pulse rounded-lg" />
                  ) : (
                    formatPaise(kpis?.financials?.receivedPaymentsPaise || 0)
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                  <span>Verified in Payment Ledger</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 transition" />
                </p>
              </div>
            </Link>

            {/* KPI 3: Outstanding Receivables */}
            <Link
              href="/dashboard/receivables"
              className="group p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-amber-500/50 hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Outstanding Receivables
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:scale-105 transition">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-amber-600 tracking-tight">
                  {loading ? (
                    <div className="h-7 w-28 bg-slate-100 animate-pulse rounded-lg" />
                  ) : (
                    formatPaise(kpis?.financials?.outstandingReceivablesPaise || 0)
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                  <span>Due across Delivered / Active</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-amber-600 transition" />
                </p>
              </div>
            </Link>

            {/* KPI 4: Active Workload / Pipeline */}
            <Link
              href="/dashboard/leads"
              className="group p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-purple-500/50 hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Active Pipeline
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 group-hover:scale-105 transition">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-purple-600 tracking-tight">
                  {loading ? (
                    <div className="h-7 w-28 bg-slate-100 animate-pulse rounded-lg" />
                  ) : (
                    `${kpis?.leads?.conversionRatePercent || 0}%`
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                  <span>{kpis?.leads?.wonLeads || 0} Won of {kpis?.leads?.totalLeads || 0} Leads</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-purple-600 transition" />
                </p>
              </div>
            </Link>
          </div>

          {/* Secondary Operational KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Designs In-Progress */}
            {!userRole.includes("sales") ? (
              <Link
                href="/dashboard/design"
                className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-purple-300 transition flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Palette className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-500 truncate">Designs Active</div>
                  <div className="text-sm font-black text-slate-900">
                    {kpis?.design?.inProgressDesigns || 0} In-Progress
                  </div>
                </div>
              </Link>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 opacity-60">
                <Palette className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500 font-medium">Design Restricted</span>
              </div>
            )}

            {/* Outsourced Production */}
            {!userRole.includes("sales") && !userRole.includes("designer") ? (
              <Link
                href="/dashboard/production"
                className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-cyan-300 transition flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-500 truncate">In Production</div>
                  <div className="text-sm font-black text-slate-900">
                    {kpis?.production?.inProduction || 0} Active Jobs
                  </div>
                </div>
              </Link>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 opacity-60">
                <Layers className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500 font-medium">Production Restricted</span>
              </div>
            )}

            {/* Deliveries Pending */}
            <Link
              href="/dashboard/production/delivery"
              className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-sky-300 transition flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-500 truncate">Deliveries Pending</div>
                <div className="text-sm font-black text-slate-900">
                  {kpis?.deliveries?.pendingDeliveries || 0} Dispatches
                </div>
              </div>
            </Link>

            {/* Overdue Follow-ups */}
            <Link
              href="/dashboard/followups"
              className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-rose-300 transition flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-500 truncate">Overdue Follow-ups</div>
                <div className="text-sm font-black text-rose-600">
                  {kpis?.followups?.overdueFollowups || 0} Action Needed
                </div>
              </div>
            </Link>
          </div>

          {/* 3. NAVIGATION TABS */}
          <div className="flex border-b border-slate-200 overflow-x-auto gap-2 text-xs font-bold">
            {[
              { id: "kpis", label: "Executive Summary", icon: Activity, hidden: userRole.includes("designer") },
              { id: "pipeline", label: "Sales Pipeline", icon: Users, hidden: userRole.includes("designer") },
              { id: "financials", label: "Financials & Ageing", icon: DollarSign, hidden: userRole.includes("designer") },
              { id: "orders", label: "Orders & Fulfillment", icon: ShoppingBag, hidden: userRole.includes("designer") },
              { id: "design", label: "Design Studio", icon: Palette, hidden: userRole.includes("sales") },
              { id: "production", label: "Outsourced Production", icon: Layers, hidden: userRole.includes("sales") || userRole.includes("designer") },
              { id: "delivery", label: "Logistics & Delivery", icon: MapPin, hidden: userRole.includes("designer") },
              { id: "followups", label: "Follow-up Attention", icon: Clock, hidden: userRole.includes("designer") },
            ]
              .filter((t) => !t.hidden)
              .map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-3.5 border-b-2 transition flex items-center gap-2 shrink-0 ${
                      active
                        ? "border-blue-600 text-blue-600 bg-blue-50/50 font-extrabold"
                        : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
          </div>

          {/* Phase 7B-1: Action & View Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            {/* Left: Saved Views Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold pl-1">
                <Bookmark className="w-3.5 h-3.5 text-blue-600" />
                <span>Saved Views:</span>
              </div>

              <select
                value={selectedViewId}
                onChange={(e) => handleSelectView(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-medium rounded-xl px-2.5 py-1.5 focus:border-blue-500 outline-none cursor-pointer"
              >
                <option value="">Default System View</option>
                {savedViews.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.name} {v.isDefault ? "★ (Default)" : ""} ({v.period})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setIsSaveViewModalOpen(true)}
                className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                title="Save current filters as a named view"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save View</span>
              </button>

              {selectedViewId && (
                <>
                  <button
                    type="button"
                    onClick={handleOpenEditModal}
                    className="px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
                    title="Edit name or update filters for this view"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Edit View</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSetDefaultView}
                    className="px-2.5 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
                    title="Set this view as default for this report"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>Set Default</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteView}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-xl transition"
                    title="Delete this saved view"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>

            {/* Right: Export & Schedule Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleOpenCreateSchedule}
                className="flex-1 sm:flex-initial px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                title="Schedule automated recurring email delivery of this report"
              >
                <Mail className="w-3.5 h-3.5 text-indigo-600" />
                <span>Schedule Report</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  fetchSchedules();
                  setIsMySchedulesOpen(true);
                }}
                className="flex-1 sm:flex-initial px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                title="View and manage my automated report schedules"
              >
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>My Schedules{schedules.length > 0 ? ` (${schedules.length})` : ""}</span>
              </button>

              <button
                type="button"
                disabled={exportLoading !== null}
                onClick={() => handleExport("csv")}
                className="flex-1 sm:flex-initial px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Download className={`w-3.5 h-3.5 ${exportLoading === 'csv' ? 'animate-bounce text-blue-600' : 'text-slate-600'}`} />
                <span>{exportLoading === 'csv' ? 'Exporting CSV...' : 'Export CSV'}</span>
              </button>

              <button
                type="button"
                disabled={exportLoading !== null}
                onClick={() => handleExport("xlsx")}
                className="flex-1 sm:flex-initial px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <FileSpreadsheet className={`w-3.5 h-3.5 ${exportLoading === 'xlsx' ? 'animate-bounce text-emerald-600' : 'text-emerald-600'}`} />
                <span>{exportLoading === 'xlsx' ? 'Exporting XLSX...' : 'Export Excel'}</span>
              </button>

              <button
                type="button"
                disabled={exportLoading !== null}
                onClick={() => handleExport("pdf")}
                className="flex-1 sm:flex-initial px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <FileText className={`w-3.5 h-3.5 ${exportLoading === 'pdf' ? 'animate-bounce text-rose-600' : 'text-rose-600'}`} />
                <span>{exportLoading === 'pdf' ? 'Exporting PDF...' : 'Export PDF'}</span>
              </button>
            </div>
          </div>

          {/* Export Toast / Notice */}
          {exportNotice && (
            <div
              className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                exportNotice.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {exportNotice.type === "success" ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                )}
                <span>{exportNotice.message}</span>
              </div>
              <button
                onClick={() => setExportNotice(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Save View Modal Dialog */}
          {isSaveViewModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-blue-600" />
                    Save Report View
                  </h3>
                  <button
                    onClick={() => setIsSaveViewModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateSavedView} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      View Name:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Q3 Pipeline or Monthly Invoiced"
                      value={newViewName}
                      onChange={(e) => setNewViewName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-1">
                    <div><span className="font-semibold text-slate-700">Report:</span> {tabToReportKey[activeTab] || activeTab}</div>
                    <div><span className="font-semibold text-slate-700">Period:</span> {period}</div>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newViewIsDefault}
                      onChange={(e) => setNewViewIsDefault(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Set as my default view for this report</span>
                  </label>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsSaveViewModalOpen(false)}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold shadow-xs transition"
                    >
                      Save View
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit View Modal Dialog */}
          {isEditViewModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-blue-600" />
                    Edit Saved View
                  </h3>
                  <button
                    onClick={() => setIsEditViewModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleUpdateSavedView} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      View Name:
                    </label>
                    <input
                      type="text"
                      required
                      value={editViewName}
                      onChange={(e) => setEditViewName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editViewUpdateFilters}
                      onChange={(e) => setEditViewUpdateFilters(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Update view with current filters & date range ({period})</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editViewIsDefault}
                      onChange={(e) => setEditViewIsDefault(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Set as my default view for this report</span>
                  </label>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsEditViewModalOpen(false)}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold shadow-xs transition"
                    >
                      Update View
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Phase 7B-2B1: Create / Edit Report Schedule Modal */}
          {isScheduleModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full space-y-4 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-600" />
                    <span>{scheduleForm.id ? "Edit Report Schedule" : "Schedule Report Delivery"}</span>
                  </h3>
                  <button
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveSchedule} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Schedule Name:
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={scheduleForm.name}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                      placeholder="e.g. Daily Orders Summary"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Export Format:
                      </label>
                      <select
                        value={scheduleForm.format}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, format: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 outline-none cursor-pointer"
                      >
                        <option value="csv">CSV Spreadsheet</option>
                        <option value="xlsx">Excel Workbook (.xlsx)</option>
                        <option value="pdf">PDF Document</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Frequency:
                      </label>
                      <select
                        value={scheduleForm.recurrence}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, recurrence: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 outline-none cursor-pointer"
                      >
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Execution Time (IST):
                      </label>
                      <input
                        type="time"
                        required
                        value={scheduleForm.timeOfDay}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, timeOfDay: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 outline-none"
                      />
                    </div>

                    {scheduleForm.recurrence === "WEEKLY" && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Day of Week:
                        </label>
                        <select
                          value={scheduleForm.dayOfWeek}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, dayOfWeek: Number(e.target.value) })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 outline-none cursor-pointer"
                        >
                          <option value={0}>Sunday</option>
                          <option value={1}>Monday</option>
                          <option value={2}>Tuesday</option>
                          <option value={3}>Wednesday</option>
                          <option value={4}>Thursday</option>
                          <option value={5}>Friday</option>
                          <option value={6}>Saturday</option>
                        </select>
                      </div>
                    )}

                    {scheduleForm.recurrence === "MONTHLY" && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Day of Month (1–28):
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={28}
                          required
                          value={scheduleForm.dayOfMonth}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, dayOfMonth: Math.min(28, Math.max(1, Number(e.target.value))) })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Delivery Mode & Recipient Selector */}
                  {(userRole.includes("admin") || userRole.includes("manager")) ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Delivery Distribution Mode:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setScheduleForm({ ...scheduleForm, deliveryMode: "SELF" })}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition text-center ${
                              scheduleForm.deliveryMode === "SELF"
                                ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            Just Me (Self)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setScheduleForm({ ...scheduleForm, deliveryMode: "INTERNAL_TEAM" });
                              fetchEligibleRecipients();
                            }}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition text-center ${
                              scheduleForm.deliveryMode === "INTERNAL_TEAM"
                                ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            Internal Team
                          </button>
                        </div>
                      </div>

                      {scheduleForm.deliveryMode === "SELF" ? (
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Deliver To:
                          </label>
                          <input
                            type="text"
                            disabled
                            readOnly
                            value={userEmail ? `${userEmail} (Account Owner)` : "Your verified account email"}
                            className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 cursor-not-allowed select-none font-medium"
                          />
                          <p className="text-[11px] text-slate-400 mt-1">
                            Delivered exclusively to your account email address.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">Team Recipients</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                              Selected: {scheduleForm.recipientUserIds.length}/25
                            </span>
                          </div>

                          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 py-1 border-b border-slate-200/60">
                            <input
                              type="checkbox"
                              checked={scheduleForm.includeOwner}
                              onChange={(e) => setScheduleForm({ ...scheduleForm, includeOwner: e.target.checked })}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>Include me as recipient (Owner copy)</span>
                          </label>

                          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 pt-1">
                            {loadingRecipients ? (
                              <div className="text-center py-4 text-xs text-slate-400">Loading authorized recipients...</div>
                            ) : eligibleRecipients.length === 0 ? (
                              <div className="text-center py-4 text-xs text-slate-400">No other team members found.</div>
                            ) : (
                              eligibleRecipients.map((rec) => {
                                const recId = String(rec.id || rec._id);
                                const isSelected = scheduleForm.recipientUserIds.includes(recId);
                                return (
                                  <label
                                    key={recId}
                                    className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition ${
                                      isSelected
                                        ? "bg-indigo-50/60 border-indigo-300 text-indigo-900"
                                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {
                                          if (isSelected) {
                                            setScheduleForm({
                                              ...scheduleForm,
                                              recipientUserIds: scheduleForm.recipientUserIds.filter((id) => id !== recId),
                                            });
                                          } else {
                                            if (scheduleForm.recipientUserIds.length >= 25) {
                                              alert("Maximum 25 recipients allowed per schedule.");
                                              return;
                                            }
                                            setScheduleForm({
                                              ...scheduleForm,
                                              recipientUserIds: [...scheduleForm.recipientUserIds, recId],
                                            });
                                          }
                                        }}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                      />
                                      <span className="font-semibold">{rec.name}</span>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                      {rec.role || "SALES"}
                                    </span>
                                  </label>
                                );
                              })
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 italic mt-1">
                            Each recipient dynamically receives data strictly scoped to their own role and permissions.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Deliver To (Self-Delivery Only):
                      </label>
                      <input
                        type="text"
                        disabled
                        readOnly
                        value={userEmail ? `${userEmail} (Account Owner)` : "Your verified account email"}
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 cursor-not-allowed select-none font-medium"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Reports are emailed exclusively to your account. External recipients are disabled.
                      </p>
                    </div>
                  )}

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-500">Report Key:</span>
                      <span className="font-bold text-slate-800">{tabToReportKey[activeTab] || activeTab}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-500">Target Period:</span>
                      <span className="font-bold text-slate-800">{period === "custom" ? "last_30_days (rolling)" : period}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-500">Timezone:</span>
                      <span className="font-bold text-slate-800">Asia/Kolkata (IST +05:30)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsScheduleModalOpen(false)}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={scheduleSubmitting}
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold shadow-xs transition disabled:opacity-50"
                    >
                      {scheduleSubmitting ? "Saving..." : scheduleForm.id ? "Update Schedule" : "Create Schedule"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Phase 7B-2B1: My Schedules Drawer / Modal */}
          {isMySchedulesOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-2xl w-full space-y-4 animate-in fade-in zoom-in duration-150 max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <History className="w-4 h-4 text-indigo-600" />
                      <span>My Scheduled Reports</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Automated exports delivered to {userEmail || "your account email"}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsMySchedulesOpen(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {schedules.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600">No scheduled reports active.</p>
                      <p className="mt-1 text-slate-400">Click &ldquo;Schedule Report&rdquo; in the toolbar to set up automated delivery.</p>
                    </div>
                  ) : (
                    schedules.map((s) => (
                      <div
                        key={s._id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900">{s.name}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-200 text-slate-700">
                              {s.reportKey}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700">
                              {s.format}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                s.deliveryMode === "INTERNAL_TEAM"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {s.deliveryMode === "INTERNAL_TEAM"
                                ? `Internal Team (${(s.recipientUserIds?.length || 0) + (s.includeOwner !== false ? 1 : 0)})`
                                : "Just Me"}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                s.status === "ACTIVE"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {s.status}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center gap-3 flex-wrap">
                            <span>
                              <strong>Recurrence:</strong> {s.recurrence} at {s.timeOfDay} IST
                              {s.recurrence === "WEEKLY" && ` (Day ${s.dayOfWeek})`}
                              {s.recurrence === "MONTHLY" && ` (Day ${s.dayOfMonth})`}
                            </span>
                            <span>•</span>
                            <span>
                              <strong>Next:</strong>{" "}
                              {s.nextRunAt
                                ? new Date(s.nextRunAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
                                : "N/A"}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {s.status === "ACTIVE" ? (
                            <button
                              type="button"
                              onClick={() => handlePauseSchedule(s._id)}
                              className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
                              title="Pause this schedule"
                            >
                              <Pause className="w-3 h-3" />
                              <span>Pause</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleResumeSchedule(s._id)}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
                              title="Resume this schedule"
                            >
                              <Play className="w-3 h-3" />
                              <span>Resume</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setIsMySchedulesOpen(false);
                              handleOpenEditSchedule(s);
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white border border-slate-200 rounded-lg transition"
                            title="Edit schedule"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleViewRuns(s)}
                            className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
                            title="View run execution history"
                          >
                            <History className="w-3 h-3" />
                            <span>History</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteSchedule(s._id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition"
                            title="Delete schedule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                  <span>Showing {schedules.length} personal schedule(s)</span>
                  <button
                    onClick={() => {
                      setIsMySchedulesOpen(false);
                      handleOpenCreateSchedule();
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition"
                  >
                    + New Schedule
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Phase 7B-2B1: Run Execution History Modal */}
          {isRunHistoryOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-2xl w-full space-y-4 animate-in fade-in zoom-in duration-150 max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <History className="w-4 h-4 text-indigo-600" />
                      <span>Execution Run History</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedSchedule?.name} ({selectedSchedule?.reportKey})
                    </p>
                  </div>
                  <button
                    onClick={() => setIsRunHistoryOpen(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-1">
                  {scheduleRunsLoading ? (
                    <div className="text-center py-8 text-xs text-slate-400">Loading execution runs...</div>
                  ) : scheduleRuns.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No execution runs recorded yet. Runs appear after the scheduler executes.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase font-bold">
                          <th className="pb-2">Scheduled For (IST)</th>
                          <th className="pb-2">Status</th>
                          <th className="pb-2">Rows</th>
                          <th className="pb-2">Attachment</th>
                          <th className="pb-2">Failure / Note</th>
                          <th className="pb-2 text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {scheduleRuns.map((r) => (
                          <tr key={r._id} className="hover:bg-slate-50">
                            <td className="py-2.5">
                              {r.scheduledFor
                                ? new Date(r.scheduledFor).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
                                : "-"}
                            </td>
                            <td className="py-2.5">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                  r.status === "SUCCESS"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : r.status === "PARTIAL_SUCCESS"
                                    ? "bg-amber-100 text-amber-700"
                                    : r.status === "FAILED"
                                    ? "bg-rose-100 text-rose-700"
                                    : r.status === "SKIPPED"
                                    ? "bg-slate-100 text-slate-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {r.status}
                              </span>
                            </td>
                            <td className="py-2.5">{r.rowCount ?? 0}</td>
                            <td className="py-2.5">
                              {r.attachmentBytes ? `${(r.attachmentBytes / 1024).toFixed(1)} KB` : "-"}
                            </td>
                            <td className="py-2.5 text-slate-500 text-[11px]">
                              {r.failureReason || (r.status === "SUCCESS" ? "Delivered" : "-")}
                            </td>
                            <td className="py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleViewDeliveries(r)}
                                className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-bold rounded-lg text-[10px] transition shadow-2xs"
                              >
                                Deliveries
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsRunHistoryOpen(false)}
                    className="px-4 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Phase 7B-2B2: Run Deliveries Inspection Modal */}
          {isDeliveriesModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-2xl w-full space-y-4 animate-in fade-in zoom-in duration-150 max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span>Per-Recipient Delivery Audit</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Run Scheduled For: {selectedRun?.scheduledFor ? new Date(selectedRun.scheduledFor).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "-"}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsDeliveriesModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-1">
                  {runDeliveriesLoading ? (
                    <div className="text-center py-8 text-xs text-slate-400">Loading delivery logs...</div>
                  ) : runDeliveries.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No delivery audit records logged for this run.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase font-bold">
                          <th className="pb-2">Recipient</th>
                          <th className="pb-2">Role</th>
                          <th className="pb-2">Status</th>
                          <th className="pb-2">Rows</th>
                          <th className="pb-2">Size</th>
                          <th className="pb-2">Failure / Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {runDeliveries.map((d) => (
                          <tr key={d._id} className="hover:bg-slate-50">
                            <td className="py-2.5 font-bold text-slate-900">{d.recipientName}</td>
                            <td className="py-2.5">
                              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                {d.recipientRole}
                              </span>
                            </td>
                            <td className="py-2.5">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                  d.status === "SUCCESS"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : d.status === "FAILED"
                                    ? "bg-rose-100 text-rose-700"
                                    : d.status === "SKIPPED"
                                    ? "bg-slate-100 text-slate-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {d.status}
                              </span>
                            </td>
                            <td className="py-2.5">{d.rowCount ?? 0}</td>
                            <td className="py-2.5">
                              {d.attachmentBytes ? `${(d.attachmentBytes / 1024).toFixed(1)} KB` : "-"}
                            </td>
                            <td className="py-2.5 text-slate-500 text-[11px]">
                              {d.failureReason || (d.status === "SUCCESS" ? "Delivered" : "-")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsDeliveriesModalOpen(false)}
                    className="px-4 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                  >
                    Back to Runs
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. TAB CONTENTS */}
          <div className="space-y-6">
            {/* A. EXECUTIVE OVERVIEW */}
            {activeTab === "kpis" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales vs Received Ledger Card */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Financial Realization Overview</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="text-[10px] uppercase font-bold text-slate-500">Total Invoiced</div>
                      <div className="text-sm font-black text-slate-900 mt-1">
                        {formatPaise(kpis?.financials?.totalSalesValuePaise || 0)}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/60">
                      <div className="text-[10px] uppercase font-bold text-emerald-700">Total Received</div>
                      <div className="text-sm font-black text-emerald-700 mt-1">
                        {formatPaise(kpis?.financials?.receivedPaymentsPaise || 0)}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/60">
                      <div className="text-[10px] uppercase font-bold text-amber-700">Outstanding</div>
                      <div className="text-sm font-black text-amber-700 mt-1">
                        {formatPaise(kpis?.financials?.outstandingReceivablesPaise || 0)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 leading-relaxed font-medium">
                    Calculated strictly in integer paise via append-only payment ledgers. No floating point errors.
                  </div>
                </div>

                {/* Quotations & Orders Funnel */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Commercial Conversion Summary</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="text-xs text-slate-500 font-medium">Quotations Generated</div>
                      <div className="text-lg font-black text-slate-900 mt-1">
                        {kpis?.quotations?.totalQuotations || 0}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {formatPaise(kpis?.quotations?.quotationValuePaise || 0)}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/60">
                      <div className="text-xs text-emerald-700 font-medium">Accepted Quotations</div>
                      <div className="text-lg font-black text-emerald-700 mt-1">
                        {kpis?.quotations?.acceptedQuotations || 0}
                      </div>
                      <div className="text-[10px] text-emerald-600 mt-0.5">
                        {formatPaise(kpis?.quotations?.acceptedValuePaise || 0)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    Average Order Value:{" "}
                    <span className="font-bold text-slate-900">
                      {formatPaise(kpis?.orders?.averageOrderValuePaise || 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* B. SALES PIPELINE REPORT */}
            {activeTab === "pipeline" && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Lead Stages & Conversion</h3>
                  {pipeline?.stages ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {Array.isArray(pipeline.stages)
                        ? pipeline.stages.map((item, idx) => (
                            <div key={item._id || idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                              <div className="text-[10px] font-bold text-slate-500 truncate">{item._id || "Stage"}</div>
                              <div className="text-lg font-black text-slate-900 mt-1">{item.count ?? 0}</div>
                            </div>
                          ))
                        : Object.entries(pipeline.stages).map(([stage, count]) => (
                            <div key={stage} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                              <div className="text-[10px] font-bold text-slate-500 truncate">{stage}</div>
                              <div className="text-lg font-black text-slate-900 mt-1">
                                {typeof count === "object" && count !== null ? count.count ?? 0 : count}
                              </div>
                            </div>
                          ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400">
                      <FolderX className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No leads recorded in this period.
                    </div>
                  )}
                </div>

                {/* Lead Sources Breakdown */}
                {pipeline?.sources && pipeline.sources.length > 0 && (
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">Lead Sources Performance</h3>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-xs text-left">
                        <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-4">Source</th>
                            <th className="py-2.5 px-4 text-center">Total Ingested</th>
                            <th className="py-2.5 px-4 text-center">Won Leads</th>
                            <th className="py-2.5 px-4 text-right">Conversion %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {pipeline.sources.map((src) => (
                            <tr key={src.source} className="hover:bg-slate-50/70 transition">
                              <td className="py-2.5 px-4 font-bold text-slate-900">{src.source}</td>
                              <td className="py-2.5 px-4 text-center text-slate-600">{src.count}</td>
                              <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">{src.wonCount}</td>
                              <td className="py-2.5 px-4 text-right font-mono font-bold text-blue-600">{src.conversionRatePercent}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* C. FINANCIALS & RECEIVABLES AGEING */}
            {activeTab === "financials" && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Receivables Ageing Classification</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/60">
                      <div className="text-[10px] font-bold text-emerald-700 uppercase">0 - 30 Days</div>
                      <div className="text-lg font-black text-emerald-800 mt-1">
                        {formatPaise(financials?.ageingBuckets?.bucket0To30DaysPaise || 0)}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/60">
                      <div className="text-[10px] font-bold text-blue-700 uppercase">31 - 60 Days</div>
                      <div className="text-lg font-black text-blue-800 mt-1">
                        {formatPaise(financials?.ageingBuckets?.bucket31To60DaysPaise || 0)}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60">
                      <div className="text-[10px] font-bold text-amber-700 uppercase">61 - 90 Days</div>
                      <div className="text-lg font-black text-amber-800 mt-1">
                        {formatPaise(financials?.ageingBuckets?.bucket61To90DaysPaise || 0)}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200/60">
                      <div className="text-[10px] font-bold text-rose-700 uppercase">90+ Days Overdue</div>
                      <div className="text-lg font-black text-rose-700 mt-1">
                        {formatPaise(financials?.ageingBuckets?.bucket90PlusDaysPaise || 0)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Debtors Table */}
                {financials?.topDebtors && financials.topDebtors.length > 0 && (
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">Highest Outstanding Customers</h3>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-xs text-left">
                        <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-4">Customer</th>
                            <th className="py-2.5 px-4 text-center">Unpaid Orders</th>
                            <th className="py-2.5 px-4 text-right">Balance Due</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {financials.topDebtors.map((debtor, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/70 transition">
                              <td className="py-2.5 px-4 font-bold text-slate-900">{debtor.customerName}</td>
                              <td className="py-2.5 px-4 text-center text-slate-600">{debtor.ordersCount}</td>
                              <td className="py-2.5 px-4 text-right font-black text-amber-600">
                                {formatPaise(debtor.totalOutstandingPaise)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* D. ORDERS & FULFILLMENT */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Orders Lifecycle & Fulfillment</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <div className="text-[10px] font-bold text-slate-500">TOTAL ORDERS</div>
                      <div className="text-lg font-black text-slate-900 mt-1">{orders?.summary?.totalOrders || 0}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200 text-center">
                      <div className="text-[10px] font-bold text-blue-700">ACTIVE IN PIPELINE</div>
                      <div className="text-lg font-black text-blue-800 mt-1">{orders?.summary?.activeOrders || 0}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 text-center">
                      <div className="text-[10px] font-bold text-emerald-700">COMPLETED</div>
                      <div className="text-lg font-black text-emerald-700 mt-1">{orders?.summary?.completedOrders || 0}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 text-center">
                      <div className="text-[10px] font-bold text-amber-700">DELIVERED UNPAID</div>
                      <div className="text-lg font-black text-amber-700 mt-1">{orders?.summary?.deliveredUnpaidOrders || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Orders by Status */}
                {orders?.statusBreakdown && (
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">Order Status Breakdown</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {Array.isArray(orders.statusBreakdown)
                        ? orders.statusBreakdown.map((item, idx) => (
                            <div key={item._id || idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                              <div className="text-[10px] font-bold text-slate-500 truncate">{item._id || "Status"}</div>
                              <div className="text-base font-black text-slate-900 mt-0.5">{item.count ?? 0}</div>
                              {item.valuePaise !== undefined && (
                                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                  {formatPaise(item.valuePaise)}
                                </div>
                              )}
                            </div>
                          ))
                        : Object.entries(orders.statusBreakdown).map(([status, count]) => (
                            <div key={status} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                              <div className="text-[10px] font-bold text-slate-500 truncate">{status}</div>
                              <div className="text-base font-black text-slate-900 mt-0.5">
                                {typeof count === "object" && count !== null ? count.count ?? 0 : count}
                              </div>
                            </div>
                          ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* E. QUOTATIONS REPORT */}
            {activeTab === "quotations" && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Quotation Funnel & Conversion</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Total Generated</div>
                      <div className="text-lg font-black text-slate-900 mt-1">{quotations?.summary?.totalQuotations || 0}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200">
                      <div className="text-[10px] font-bold text-blue-700 uppercase">Open / Sent</div>
                      <div className="text-lg font-black text-blue-800 mt-1">{quotations?.summary?.openQuotations || 0}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200">
                      <div className="text-[10px] font-bold text-emerald-700 uppercase">Accepted</div>
                      <div className="text-lg font-black text-emerald-700 mt-1">{quotations?.summary?.acceptedQuotations || 0}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200">
                      <div className="text-[10px] font-bold text-purple-700 uppercase">Conversion Rate</div>
                      <div className="text-lg font-black text-purple-700 mt-1">{quotations?.summary?.conversionRatePercent || 0}%</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* F. DESIGN STUDIO OVERVIEW */}
            {activeTab === "design" && !userRole.includes("sales") && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Design Pipeline & Quality Gate</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <div className="text-[10px] font-bold text-slate-500">ASSIGNED</div>
                      <div className="text-lg font-black text-slate-900 mt-1">{design?.summary?.assigned || 0}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200 text-center">
                      <div className="text-[10px] font-bold text-blue-700">IN PROGRESS</div>
                      <div className="text-lg font-black text-blue-800 mt-1">{design?.summary?.inProgress || 0}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200 text-center">
                      <div className="text-[10px] font-bold text-purple-700">CLIENT REVIEW</div>
                      <div className="text-lg font-black text-purple-800 mt-1">{design?.summary?.clientReview || 0}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 text-center">
                      <div className="text-[10px] font-bold text-amber-700">REVISIONS</div>
                      <div className="text-lg font-black text-amber-700 mt-1">{design?.summary?.revisionRequested || 0}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 text-center">
                      <div className="text-[10px] font-bold text-emerald-700">APPROVED</div>
                      <div className="text-lg font-black text-emerald-700 mt-1">{design?.summary?.approved || 0}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-cyan-50/50 border border-cyan-200 text-center">
                      <div className="text-[10px] font-bold text-cyan-700">PROD. LOCKED</div>
                      <div className="text-lg font-black text-cyan-700 mt-1">{design?.summary?.productionLocked || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Designer Performance Breakdown */}
                {design?.designerBreakdown && design.designerBreakdown.length > 0 && (
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">Designer Workload Distribution</h3>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-xs text-left">
                        <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-4">Designer</th>
                            <th className="py-2.5 px-4 text-center">Total Projects</th>
                            <th className="py-2.5 px-4 text-center">Approved</th>
                            <th className="py-2.5 px-4 text-center">In Client Review</th>
                            <th className="py-2.5 px-4 text-center">Revisions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {design.designerBreakdown.map((d) => (
                            <tr key={d._id || "unassigned"} className="hover:bg-slate-50/70 transition">
                              <td className="py-2.5 px-4 font-bold text-slate-900">{d.designerName}</td>
                              <td className="py-2.5 px-4 text-center text-slate-600">{d.totalProjects}</td>
                              <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">{d.approvedProjects}</td>
                              <td className="py-2.5 px-4 text-center text-purple-600 font-semibold">{d.inReviewProjects}</td>
                              <td className="py-2.5 px-4 text-center text-amber-600 font-semibold">{d.revisionProjects}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* G. OUTSOURCED PRODUCTION OVERVIEW */}
            {activeTab === "production" && !userRole.includes("sales") && !userRole.includes("designer") && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Outsourced Print Production Jobs</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <div className="text-[10px] font-bold text-slate-500">READY RELEASE</div>
                      <div className="text-lg font-black text-slate-900 mt-1">{production?.summary?.readyForRelease || 0}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200 text-center">
                      <div className="text-[10px] font-bold text-blue-700">SENT</div>
                      <div className="text-lg font-black text-blue-800 mt-1">{production?.summary?.sentForProduction || 0}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-cyan-50/50 border border-cyan-200 text-center">
                      <div className="text-[10px] font-bold text-cyan-700">IN PRODUCTION</div>
                      <div className="text-lg font-black text-cyan-700 mt-1">{production?.summary?.inProduction || 0}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200 text-center">
                      <div className="text-[10px] font-bold text-purple-700">READY DISPATCH</div>
                      <div className="text-lg font-black text-purple-800 mt-1">{production?.summary?.readyForDispatch || 0}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-sky-50/50 border border-sky-200 text-center">
                      <div className="text-[10px] font-bold text-sky-700">DISPATCHED</div>
                      <div className="text-lg font-black text-sky-700 mt-1">{production?.summary?.dispatched || 0}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 text-center">
                      <div className="text-[10px] font-bold text-emerald-700">DELIVERED</div>
                      <div className="text-lg font-black text-emerald-700 mt-1">{production?.summary?.delivered || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* H. LOGISTICS & DELIVERY */}
            {activeTab === "delivery" && !userRole.includes("designer") && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-sky-600" />
                    <span>Logistics & Delivery Execution</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-200">
                      <div className="text-[10px] font-bold text-sky-700 uppercase">PENDING DISPATCH</div>
                      <div className="text-2xl font-black text-sky-800 mt-1">
                        {delivery?.summary?.pendingDeliveries || kpis?.deliveries?.pendingDeliveries || 0}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
                      <div className="text-[10px] font-bold text-emerald-700 uppercase">DELIVERED</div>
                      <div className="text-2xl font-black text-emerald-700 mt-1">
                        {delivery?.summary?.completedDeliveries || kpis?.deliveries?.completedDeliveries || 0}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200">
                      <div className="text-[10px] font-bold text-rose-700 uppercase">FAILED / RETURNED</div>
                      <div className="text-2xl font-black text-rose-700 mt-1">
                        {delivery?.summary?.failedDeliveries || kpis?.deliveries?.failedDeliveries || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* I. FOLLOW-UP ATTENTION */}
            {activeTab === "followups" && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Pending Follow-up Schedule</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200">
                      <div className="text-[10px] font-bold text-rose-700 uppercase">OVERDUE (Urgent)</div>
                      <div className="text-2xl font-black text-rose-700 mt-1">
                        {followups?.summary?.overdue || 0}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200">
                      <div className="text-[10px] font-bold text-amber-700 uppercase">DUE TODAY</div>
                      <div className="text-2xl font-black text-amber-700 mt-1">
                        {followups?.summary?.dueToday || 0}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200">
                      <div className="text-[10px] font-bold text-blue-700 uppercase">UPCOMING</div>
                      <div className="text-2xl font-black text-blue-700 mt-1">
                        {followups?.summary?.upcoming || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
