"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  CheckSquare,
  Square,
  Search,
  ArrowLeft,
  Calendar,
  Layers,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Table,
  Sliders,
  Check,
  Eye,
} from "lucide-react";

const AVAILABLE_COLUMNS = [
  { id: "leadId", label: "Lead ID / Reference", default: true },
  { id: "businessName", label: "Business / Shop Name", default: true },
  { id: "ownerName", label: "Contact / Owner Name", default: true },
  { id: "phone", label: "Primary Phone Number", default: true },
  { id: "alternatePhone", label: "Alternate Phone", default: false },
  { id: "area", label: "Area / Territory", default: true },
  { id: "zone", label: "Zone / Market Street", default: true },
  { id: "categoryLabel", label: "Business Category", default: true },
  { id: "assignedToName", label: "Assigned Sales Representative", default: true },
  { id: "status", label: "Lead Status", default: true },
  { id: "createdAt", label: "Creation Timestamp", default: true },
  { id: "photoUrl", label: "Market Photo Image URL", default: false },
];

export default function ExportDataView({
  leads: propLeads = null,
  areas: propAreas = null,
  salesReps: propReps = null,
  setCurrentView = null,
}) {
  const router = useRouter();

  // Standalone fallback
  const [internalLeads, setInternalLeads] = useState([]);
  const [internalAreas, setInternalAreas] = useState([]);
  const [internalReps, setInternalReps] = useState([]);
  const [loading, setLoading] = useState(!propLeads);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Filter States
  const [dateRangePreset, setDateRangePreset] = useState("all"); // 'all' | 'today' | 'yesterday' | '7days' | 'month' | 'custom'
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedArea, setSelectedArea] = useState("ALL");
  const [selectedZone, setSelectedZone] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedRep, setSelectedRep] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchFilter, setSearchFilter] = useState("");

  // Export Settings
  const [exportFormat, setExportFormat] = useState("csv"); // 'csv' | 'excel' | 'json'
  const [selectedColumnIds, setSelectedColumnIds] = useState(
    AVAILABLE_COLUMNS.filter((c) => c.default).map((c) => c.id)
  );

  useEffect(() => {
    if (propLeads) return;

    let isSubscribed = true;
    const fetchStandalone = async () => {
      setLoading(true);
      try {
        const [leadsRes, areasRes, repsRes] = await Promise.all([
          api.get("/leads?limit=300").catch(() => null),
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
                ? new Date(l.createdAt).toLocaleString("en-GB")
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
        console.error("Error fetching standalone export data:", err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchStandalone();
    return () => {
      isSubscribed = false;
    };
  }, [propLeads]);

  const leads = propLeads || internalLeads;
  const areas = propAreas || internalAreas;
  const salesReps = propReps || internalReps;

  // Handle Date Preset Selection
  const handleDatePreset = (preset) => {
    setDateRangePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "yesterday") {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split("T")[0];
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === "7days") {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      setStartDate(past.toISOString().split("T")[0]);
      setEndDate(todayStr);
    } else if (preset === "month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      setStartDate(firstDay);
      setEndDate(todayStr);
    }
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      // Date filter
      if (startDate) {
        const leadDate = l.createdDate
          ? new Date(l.createdDate).toISOString().split("T")[0]
          : "";
        if (leadDate && leadDate < startDate) return false;
      }
      if (endDate) {
        const leadDate = l.createdDate
          ? new Date(l.createdDate).toISOString().split("T")[0]
          : "";
        if (leadDate && leadDate > endDate) return false;
      }

      // Area filter
      if (selectedArea !== "ALL" && l.area !== selectedArea) return false;

      // Zone filter
      if (selectedZone !== "ALL" && l.zone !== selectedZone) return false;

      // Category filter
      if (selectedCategory !== "ALL" && l.categoryLabel !== selectedCategory) return false;

      // Sales Rep filter
      if (selectedRep !== "ALL" && l.assignedToName !== selectedRep) return false;

      // Status filter
      if (selectedStatus !== "ALL" && l.status !== selectedStatus) return false;

      // Search query
      if (searchFilter) {
        const q = searchFilter.toLowerCase().trim();
        const match =
          l.businessName?.toLowerCase().includes(q) ||
          l.ownerName?.toLowerCase().includes(q) ||
          l.phone?.includes(q) ||
          l.leadId?.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [
    leads,
    startDate,
    endDate,
    selectedArea,
    selectedZone,
    selectedCategory,
    selectedRep,
    selectedStatus,
    searchFilter,
  ]);

  // Available unique categories from data
  const categoriesList = useMemo(() => {
    const set = new Set();
    leads.forEach((l) => {
      if (l.categoryLabel) set.add(l.categoryLabel);
    });
    return Array.from(set);
  }, [leads]);

  // Available unique zones from areas
  const zonesList = useMemo(() => {
    if (selectedArea === "ALL") return [];
    const areaDoc = areas.find((a) => a.name === selectedArea);
    if (!areaDoc?.zones) return [];
    return areaDoc.zones.map((z) => (typeof z === "string" ? z : z.name || ""));
  }, [areas, selectedArea]);

  // Column toggles
  const handleToggleColumn = (colId) => {
    if (selectedColumnIds.includes(colId)) {
      if (selectedColumnIds.length === 1) {
        alert("At least one column must be selected for export.");
        return;
      }
      setSelectedColumnIds(selectedColumnIds.filter((id) => id !== colId));
    } else {
      setSelectedColumnIds([...selectedColumnIds, colId]);
    }
  };

  const handleSelectAllColumns = () => {
    setSelectedColumnIds(AVAILABLE_COLUMNS.map((c) => c.id));
  };

  const handleResetColumns = () => {
    setSelectedColumnIds(AVAILABLE_COLUMNS.filter((c) => c.default).map((c) => c.id));
  };

  // Perform Download Export
  const handleExecuteExport = () => {
    if (filteredLeads.length === 0) {
      alert("No leads match the current filters. Please broaden your criteria.");
      return;
    }

    const activeCols = AVAILABLE_COLUMNS.filter((c) => selectedColumnIds.includes(c.id));
    const timestampStr = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

    if (exportFormat === "json") {
      const exportJson = filteredLeads.map((lead) => {
        const obj = {};
        activeCols.forEach((col) => {
          obj[col.label] = lead[col.id] || "";
        });
        return obj;
      });

      const blob = new Blob([JSON.stringify(exportJson, null, 2)], {
        type: "application/json;charset=utf-8;",
      });
      triggerBlobDownload(blob, `data-operator-leads-${timestampStr}.json`);
    } else if (exportFormat === "excel") {
      // Formatted HTML Table (Opens cleanly in MS Excel)
      let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
      tableHtml += `<head><meta charset="utf-8" /><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Leads Export</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>`;
      tableHtml += `<table border="1"><thead><tr style="background:#F95721;color:#FFFFFF;font-weight:bold;">`;
      activeCols.forEach((col) => {
        tableHtml += `<th>${col.label}</th>`;
      });
      tableHtml += `</tr></thead><tbody>`;

      filteredLeads.forEach((lead) => {
        tableHtml += `<tr>`;
        activeCols.forEach((col) => {
          const val = lead[col.id] || "";
          tableHtml += `<td>${String(val).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>`;
        });
        tableHtml += `</tr>`;
      });
      tableHtml += `</tbody></table></body></html>`;

      const blob = new Blob([tableHtml], {
        type: "application/vnd.ms-excel;charset=utf-8;",
      });
      triggerBlobDownload(blob, `data-operator-leads-${timestampStr}.xls`);
    } else {
      // Default CSV (UTF-8 with BOM)
      const headers = activeCols.map((c) => `"${c.label}"`).join(",");
      const rows = filteredLeads.map((lead) => {
        return activeCols
          .map((c) => {
            const val = String(lead[c.id] || "").replace(/"/g, '""');
            return `"${val}"`;
          })
          .join(",");
      });

      const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      triggerBlobDownload(blob, `data-operator-leads-${timestampStr}.csv`);
    }

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 4000);
  };

  const triggerBlobDownload = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
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
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                Data Management
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">Export Utilities</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              Export Data Operating Records
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExecuteExport}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#F95721] hover:bg-[#e04512] rounded-xl transition shadow-md shadow-orange-600/20"
          >
            <Download className="w-4 h-4" />
            Download {filteredLeads.length} Leads
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {exportSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-3 text-emerald-800 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            File successfully generated and downloaded! Check your computer's Downloads folder.
          </span>
        </div>
      )}

      {/* Grid: Left Controls (Scope & Filters) + Right Column Selector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Section: Filters & Formats (7 Cols on desktop, stacked on tablet) */}
        <div className="xl:col-span-7 space-y-5">
          {/* Card 1: Data Scope & Date Range */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-bold text-slate-900">1. Date Range & Period</h3>
              </div>
              <span className="text-xs text-slate-400">Creation date window</span>
            </div>

            {/* Quick Date Presets */}
            <div className="flex items-center flex-wrap gap-2">
              {[
                { id: "all", label: "All Time" },
                { id: "today", label: "Today" },
                { id: "yesterday", label: "Yesterday" },
                { id: "7days", label: "Last 7 Days" },
                { id: "month", label: "This Month" },
                { id: "custom", label: "Custom Dates" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleDatePreset(p.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    dateRangePreset === p.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Dates Inputs */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDateRangePreset("custom");
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDateRangePreset("custom");
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Filter Parameters */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-bold text-slate-900">2. Segment & Territory Filters</h3>
              </div>
              <span className="text-xs text-slate-400">Narrow target dataset</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Area */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Area / Territory
                </label>
                <select
                  value={selectedArea}
                  onChange={(e) => {
                    setSelectedArea(e.target.value);
                    setSelectedZone("ALL");
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-orange-500"
                >
                  <option value="ALL">All Areas</option>
                  {areas.map((a, i) => (
                    <option key={a._id || i} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Zone */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Zone / Market
                </label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  disabled={selectedArea === "ALL" || zonesList.length === 0}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-orange-500 disabled:opacity-50"
                >
                  <option value="ALL">All Zones</option>
                  {zonesList.map((z, i) => (
                    <option key={i} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Business Trade / Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-orange-500"
                >
                  <option value="ALL">All Categories</option>
                  {categoriesList.map((c, i) => (
                    <option key={i} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sales Rep */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Assigned Sales Rep
                </label>
                <select
                  value={selectedRep}
                  onChange={(e) => setSelectedRep(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-orange-500"
                >
                  <option value="ALL">All Sales Reps</option>
                  {salesReps.map((r, i) => (
                    <option key={r._id || i} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Keyword Search */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                Filter by Keywords (Shop Name, Owner, Phone)
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Sharma Traders, 9811..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Card 3: File Format Selection */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900">3. Select Output Format</h3>
              </div>
              <span className="text-xs text-slate-400">File format standard</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: "csv",
                  title: "CSV Format",
                  desc: "Excel & Sheets standard with UTF-8 BOM",
                  badge: ".csv",
                },
                {
                  id: "excel",
                  title: "MS Excel",
                  desc: "Pre-styled spreadsheet XML/HTML table",
                  badge: ".xls",
                },
                {
                  id: "json",
                  title: "JSON Dump",
                  desc: "Raw developer objects for CRM APIs",
                  badge: ".json",
                },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setExportFormat(fmt.id)}
                  className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    exportFormat === fmt.id
                      ? "border-orange-500 bg-orange-50/50 shadow-xs ring-1 ring-orange-500"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{fmt.title}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        exportFormat === fmt.id
                          ? "bg-[#F95721] text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {fmt.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">{fmt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section: Column Field Customizer (5 Cols on desktop, stacked on tablet) */}
        <div className="xl:col-span-5 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">4. Select Export Columns</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedColumnIds.length} of {AVAILABLE_COLUMNS.length} fields selected
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAllColumns}
                  className="text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  All
                </button>
                <span className="text-slate-300">•</span>
                <button
                  onClick={handleResetColumns}
                  className="text-[11px] font-semibold text-slate-500 hover:underline"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
              {AVAILABLE_COLUMNS.map((col) => {
                const isChecked = selectedColumnIds.includes(col.id);
                return (
                  <button
                    key={col.id}
                    onClick={() => handleToggleColumn(col.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs text-left transition ${
                      isChecked
                        ? "bg-slate-50 border-slate-300/80 text-slate-900 font-semibold"
                        : "bg-white border-slate-100 text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <span>{col.label}</span>
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-orange-500 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Live Filter Summary Box */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Matching Dataset:</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {filteredLeads.length} Records
                </span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-slate-700/60 pt-2 text-slate-300">
                <span>Selected Fields:</span>
                <span className="font-semibold text-white">{selectedColumnIds.length} Columns</span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-slate-700/60 pt-2 text-slate-300">
                <span>Output Format:</span>
                <span className="font-mono uppercase font-bold text-orange-400">
                  {exportFormat}
                </span>
              </div>

              <button
                onClick={handleExecuteExport}
                className="w-full mt-2 py-3 bg-[#F95721] hover:bg-[#e04512] text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-md shadow-orange-600/30"
              >
                <Download className="w-4 h-4" />
                Generate & Download File
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Data Preview Section (Top 10 Rows) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">Live Export Preview</h3>
            <span className="text-xs text-slate-400">
              (Showing first {Math.min(10, filteredLeads.length)} of {filteredLeads.length} rows)
            </span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
            Format: {exportFormat.toUpperCase()}
          </span>
        </div>

        <div className="overflow-x-auto scrollbar-thin max-h-80">
          <table className="w-full text-left border-collapse text-xs min-w-[650px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                {AVAILABLE_COLUMNS.filter((c) => selectedColumnIds.includes(c.id)).map((col) => (
                  <th key={col.id} className="py-2.5 px-4 whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td
                    colSpan={selectedColumnIds.length || 1}
                    className="py-10 text-center text-slate-400 text-xs"
                  >
                    No matching records found. Adjust your filters above.
                  </td>
                </tr>
              ) : (
                filteredLeads.slice(0, 10).map((lead, idx) => (
                  <tr key={lead.id || idx} className="hover:bg-slate-50/50">
                    {AVAILABLE_COLUMNS.filter((c) => selectedColumnIds.includes(c.id)).map(
                      (col) => (
                        <td key={col.id} className="py-2.5 px-4 whitespace-nowrap text-slate-700">
                          {lead[col.id] || "—"}
                        </td>
                      )
                    )}
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
