"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import { getRoleDisplayName, normalizeRole } from "@/lib/rbacGuard";
import {
  Users,
  Clock,
  FileText,
  ShoppingBag,
  CreditCard,
  TrendingUp,
  Calendar,
  Eye,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Phone,
  Target,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Folder,
  CheckCircle2,
  X,
  MapPin,
  Tag,
  Briefcase,
  Store,
  PhoneCall,
  Check,
  Building,
  Code2,
  Database,
  Copy,
  Download,
  AlertCircle,
  Table as TableIcon,
  LayoutGrid,
  Sparkles,
  Inbox,
  IndianRupee,
} from "lucide-react";

export default function SalesDashboardPage() {
  const router = useRouter();

  // User identity
  const [userName, setUserName] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("userName");
      if (stored) return stored.split(" ")[0] || stored;
      try {
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        if (u.name) return u.name.split(" ")[0];
      } catch {}
    }
    return "Sales Executive";
  });
  const [userRoleDisplay, setUserRoleDisplay] = useState("Sales Executive");
  const [currentUserAvatar, setCurrentUserAvatar] = useState(null);

  // Live Backend Data
  const [leads, setLeads] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // UI View Mode: 'standard' | 'raw_data'
  const [viewMode, setViewMode] = useState("standard"); // 'standard' | 'raw_data'

  // UI Table Filters
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, NEW, FOLLOW_UP, QUOTATION, NEGOTIATION, WON, LOST
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState([]);

  // Raw JSON Inspector Modal
  const [inspectingLead, setInspectingLead] = useState(null);
  const [copiedJson, setCopiedJson] = useState(false);

  // Manual Lead Modal
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    businessName: "",
    contactName: "",
    phone: "",
    area: "Burari",
    zone: "Sant Nagar",
    requirement: "Visiting Card",
    quantity: "1000 pcs",
    category: "Retail",
    priority: "HIGH",
    notes: "",
  });

  // Call Modal
  const [callingLead, setCallingLead] = useState(null);

  // Compute greeting dynamically based on hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  // Format today's date
  const formattedToday = useMemo(() => {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleDateString("en-US", { month: "short" });
    const year = now.getFullYear();
    const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
    return `${day} ${month} ${year}, ${weekday}`;
  }, []);

  // Load Sales Data
  const loadDashboardData = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      else setLoading(true);

      // 1. Identity Resolution
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("user");
          if (stored) {
            const u = JSON.parse(stored);
            if (u.name) setUserName(u.name.split(" ")[0]);
            if (u.avatarUrl) setCurrentUserAvatar(u.avatarUrl);
            if (u.role) setUserRoleDisplay(getRoleDisplayName(u.role));
          }
        } catch {}
      }

      try {
        const meRes = await api.get("/auth/me", { silent: true });
        if (meRes?.data?.user) {
          const u = meRes.data.user;
          if (u.name) setUserName(u.name.split(" ")[0]);
          if (u.avatarUrl) setCurrentUserAvatar(u.avatarUrl);
          if (u.role) setUserRoleDisplay(getRoleDisplayName(u.role));
        }
      } catch {}

      // 2. Fetch live leads, follow-ups, quotations, orders
      const [leadsRes, flwRes, quoteRes, ordersRes] = await Promise.allSettled([
        api.get("/leads?limit=100&sortBy=createdAt&sortOrder=desc", { silent: true }),
        api.get("/followups?limit=50&sortBy=scheduledAt&sortOrder=asc", { silent: true }),
        api.get("/quotations?limit=50&sortBy=createdAt&sortOrder=desc", { silent: true }),
        api.get("/orders?limit=50&sortBy=createdAt&sortOrder=desc", { silent: true }),
      ]);

      if (leadsRes.status === "fulfilled" && leadsRes.value?.data) {
        const raw = leadsRes.value.data;
        const list = Array.isArray(raw) ? raw : raw?.leads || raw?.data || [];
        setLeads(list);
      }
      if (flwRes.status === "fulfilled" && flwRes.value?.data) {
        const raw = flwRes.value.data;
        const list = Array.isArray(raw) ? raw : raw?.followups || raw?.followUps || [];
        setFollowups(list);
      }
      if (quoteRes.status === "fulfilled" && quoteRes.value?.data) {
        const raw = quoteRes.value.data;
        const list = Array.isArray(raw) ? raw : raw?.quotations || raw?.items || [];
        setQuotations(list);
      }
      if (ordersRes.status === "fulfilled" && ordersRes.value?.data) {
        const raw = ordersRes.value.data;
        const list = Array.isArray(raw) ? raw : raw?.orders || raw?.items || [];
        setOrders(list);
      }
    } catch (err) {
      console.warn("Notice loading sales data:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Live Dataset: Derived directly from raw backend leads
  const displayLeads = useMemo(() => {
    return leads.map((l, idx) => {
      const d = l.createdAt ? new Date(l.createdAt) : new Date();
      const timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      const dateStr = d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      // Normalize status mapping for sales tabs
      let statusKey = (l.status || "NEW").toUpperCase();
      let statusLabel = l.status || "New";

      if (statusKey.includes("FOLLOW")) {
        statusKey = "FOLLOW_UP";
        statusLabel = "Follow-up";
      } else if (statusKey.includes("QUOTE") || statusKey.includes("PROPOSAL")) {
        statusKey = "QUOTATION";
        statusLabel = "Quotation";
      } else if (statusKey.includes("NEGOTIAT")) {
        statusKey = "NEGOTIATION";
        statusLabel = "Negotiation";
      } else if (statusKey.includes("WON") || statusKey.includes("CONVERT")) {
        statusKey = "WON";
        statusLabel = "Won";
      } else if (statusKey.includes("LOST") || statusKey.includes("REJECT") || statusKey.includes("DROP") || statusKey.includes("CANCEL")) {
        statusKey = "LOST";
        statusLabel = "Lost";
      } else if (statusKey === "CONTACTED" || statusKey === "INTERESTED") {
        statusKey = "FOLLOW_UP";
        statusLabel = l.status;
      }

      const areaName = l.areaId?.name || l.area || l.territory || "—";
      const zoneName = l.zone || "";
      const reqTitle = l.requirement || l.printingRequirement?.productName || "—";
      const reqQty = l.printingRequirement?.quantity ? `${l.printingRequirement.quantity} pcs` : "";
      const expectedVal = l.expectedValue || l.estimatedBudget || 0;

      // Extract real source
      const rawSource = l.source || "MANUAL";
      let srcLabel = rawSource;
      let srcType = "MANUAL";

      if (rawSource === "DATA_OPERATOR") {
        srcLabel = "Market Visit";
        srcType = "VISIT";
      } else if (rawSource === "GOOGLE") {
        srcLabel = "Google Maps";
        srcType = "MAPS";
      } else if (rawSource === "WHATSAPP") {
        srcLabel = "WhatsApp";
        srcType = "WHATSAPP";
      } else if (rawSource === "WALK_IN") {
        srcLabel = "Walk-in";
        srcType = "WALK_IN";
      } else if (rawSource === "REFERRAL") {
        srcLabel = "Referral";
        srcType = "REFERRAL";
      }

      // Check shop/document image
      const photo = l.shopImageUrl || l.documents?.[0]?.fileUrl || null;

      // Real lead number from database
      const realLeadNum = l.leadNumber || (l._id ? `#${l._id.slice(-6).toUpperCase()}` : `LD-${1000 + idx}`);

      // Assigned representative name
      const assignedName =
        typeof l.assignedToId === "object" && l.assignedToId?.name
          ? l.assignedToId.name
          : "Assigned";

      return {
        _id: l._id || `lead-${idx}`,
        raw: l, // Full raw MongoDB object
        leadNumber: realLeadNum,
        businessName: l.businessName || l.contactName || "Direct Inquiry",
        contactName: l.contactName || "Client",
        phone: l.phone || l.alternatePhone || "—",
        email: l.email || "—",
        area: areaName,
        zone: zoneName,
        requirementTitle: reqTitle,
        requirementQty: reqQty,
        expectedValue: expectedVal,
        source: srcLabel,
        rawSource: rawSource,
        sourceType: srcType,
        assignedToName: assignedName,
        createdAtDate: dateStr,
        createdAtTime: timeStr,
        rawCreatedAt: l.createdAt,
        rawUpdatedAt: l.updatedAt,
        status: statusKey,
        rawStatus: l.status || "NEW",
        statusLabel: statusLabel,
        priority: l.priority || "MEDIUM",
        photoUrl: photo,
        docCount: Array.isArray(l.documents) ? l.documents.length : 0,
        notes: l.notes || "",
      };
    });
  }, [leads]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      ALL: displayLeads.length,
      NEW: displayLeads.filter((l) => l.status === "NEW").length,
      FOLLOW_UP: displayLeads.filter((l) => l.status === "FOLLOW_UP").length,
      QUOTATION: displayLeads.filter((l) => l.status === "QUOTATION").length,
      NEGOTIATION: displayLeads.filter((l) => l.status === "NEGOTIATION").length,
      WON: displayLeads.filter((l) => l.status === "WON").length,
      LOST: displayLeads.filter((l) => l.status === "LOST").length,
    };
  }, [displayLeads]);

  // Filtered Leads according to active tab, search text, and priority
  const filteredLeads = useMemo(() => {
    return displayLeads.filter((l) => {
      // Tab filter
      if (activeTab !== "ALL" && l.status !== activeTab) return false;

      // Priority filter
      if (priorityFilter !== "ALL" && l.priority !== priorityFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = l.businessName.toLowerCase().includes(q);
        const matchContact = l.contactName.toLowerCase().includes(q);
        const matchPhone = l.phone.includes(q);
        const matchArea = l.area.toLowerCase().includes(q);
        const matchZone = l.zone.toLowerCase().includes(q);
        const matchReq = l.requirementTitle.toLowerCase().includes(q);
        const matchNum = l.leadNumber.toLowerCase().includes(q);
        const matchId = String(l._id).toLowerCase().includes(q);
        return matchName || matchContact || matchPhone || matchArea || matchZone || matchReq || matchNum || matchId;
      }

      return true;
    });
  }, [displayLeads, activeTab, priorityFilter, searchQuery]);

  // Toggle selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLeads(filteredLeads.map((l) => l._id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleToggleLead = (id) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // KPI Metrics matching live database statistics
  const kpis = useMemo(() => {
    const newLeads = tabCounts.NEW;
    const followupsDue = followups.length || tabCounts.FOLLOW_UP;
    const quotationPending = quotations.length || tabCounts.QUOTATION;
    const ordersConfirmed = orders.length || tabCounts.WON;

    const totalPipelineValue = leads.reduce((acc, curr) => {
      return acc + (Number(curr.expectedValue) || Number(curr.estimatedBudget) || 0);
    }, 0);

    return {
      newLeads,
      followupsDue,
      quotationPending,
      ordersConfirmed,
      totalPipelineValue,
      totalLeads: leads.length,
    };
  }, [tabCounts, followups.length, quotations.length, orders.length, leads]);

  // Dynamic Recent Activity stream from live records
  const recentActivities = useMemo(() => {
    const list = [];
    (leads || []).slice(0, 4).forEach((l) => {
      const d = new Date(l.createdAt || Date.now());
      list.push({
        id: `lead-${l._id}`,
        title: "Lead in Database",
        subtitle: `${l.leadNumber || "Lead"}: ${l.businessName || l.contactName || "Customer"} (${l.phone || ""})`,
        time: d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        type: "lead",
      });
    });
    (followups || []).slice(0, 2).forEach((f) => {
      const d = new Date(f.scheduledAt || f.createdAt || Date.now());
      list.push({
        id: `flw-${f._id}`,
        title: "Follow-up Scheduled",
        subtitle: f.title || f.leadId?.businessName || f.businessName || "Follow-up Call",
        time: d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        type: "followup",
      });
    });
    (quotations || []).slice(0, 2).forEach((q) => {
      const d = new Date(q.createdAt || Date.now());
      list.push({
        id: `quote-${q._id}`,
        title: "Quotation Generated",
        subtitle: `${q.quotationNumber || "Quote"} • ₹${Number(q.totalAmount || 0).toLocaleString("en-IN")}`,
        time: d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        type: "quotation",
      });
    });
    return list.slice(0, 5);
  }, [leads, followups, quotations]);

  // Handle Add Lead Form Submission
  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!newLeadForm.businessName.trim() && !newLeadForm.contactName.trim()) {
      alert("Please provide Business Name or Contact Name.");
      return;
    }
    if (!newLeadForm.phone.trim()) {
      alert("Please provide Phone Number.");
      return;
    }

    try {
      setIsSubmittingLead(true);
      await api.post("/leads", {
        businessName: newLeadForm.businessName.trim(),
        contactName: newLeadForm.contactName.trim() || "Owner",
        phone: newLeadForm.phone.trim().replace(/\D/g, ""),
        area: newLeadForm.area,
        zone: newLeadForm.zone,
        requirement: newLeadForm.requirement,
        category: newLeadForm.category,
        priority: newLeadForm.priority,
        notes: newLeadForm.notes,
        source: "MANUAL",
        acceptanceStatus: "ACCEPTED",
      });

      setShowAddLeadModal(false);
      setNewLeadForm({
        businessName: "",
        contactName: "",
        phone: "",
        area: "Burari",
        zone: "Sant Nagar",
        requirement: "Visiting Card",
        quantity: "1000 pcs",
        category: "Retail",
        priority: "HIGH",
        notes: "",
      });

      await loadDashboardData();
    } catch (err) {
      alert(err.message || "Failed to create lead");
    } finally {
      setIsSubmittingLead(false);
    }
  };

  // Copy raw JSON to clipboard
  const handleCopyJson = (jsonObj) => {
    navigator.clipboard.writeText(JSON.stringify(jsonObj, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Export raw data as JSON
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(leads, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `raw_leads_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      {/* Sidebar with exact navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Navbar />

        <div className="p-4 sm:p-6 lg:p-7 space-y-5 max-w-[1600px] mx-auto w-full">
          {/* ========================================================================= */}
          {/* HEADER ROW (Greeting, Date Card, Raw Data Switcher & + Add Lead)          */}
          {/* ========================================================================= */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left: Greeting & Subtitle */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-[#F95721] border border-orange-200 text-[11px] font-bold">
                  <Database className="w-3 h-3" />
                  Live MongoDB Data
                </span>
                <span>•</span>
                <span>{greeting}, {userName}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Sales Dashboard</span>
                <span className="text-sm font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200">
                  {kpis.totalLeads} Records
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-normal">
                Direct view of live inquiries, database leads, and workflow statuses.
              </p>
            </div>

            {/* Right: View Switcher, Date Card & Primary Actions */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
              {/* View Mode Toggle: Standard vs Raw Data */}
              <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setViewMode("standard")}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === "standard"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Card & Workflow View"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-[#F95721]" />
                  <span>Workflow</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("raw_data")}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === "raw_data"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="View all raw database fields"
                >
                  <Database className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Raw Data ({kpis.totalLeads})</span>
                </button>
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => loadDashboardData(true)}
                disabled={isRefreshing}
                className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 shadow-2xs transition-colors cursor-pointer"
                title="Refresh live data from backend"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#F95721]" : ""}`} />
              </button>

              {/* Date Card */}
              <div className="hidden md:flex bg-white border border-slate-200/90 rounded-2xl px-3.5 py-2 items-center gap-2.5 shadow-xs">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                    Today
                  </span>
                  <span className="text-xs font-bold text-slate-800 block">
                    {formattedToday}
                  </span>
                </div>
              </div>

              {/* Add Manual Lead Button */}
              <button
                type="button"
                onClick={() => setShowAddLeadModal(true)}
                className="bg-[#F95721] hover:bg-[#e84915] active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl px-4 py-2.5 shadow-sm shadow-orange-500/25 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Lead</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* KPI METRIC CARDS ROW (5 Cards with live real database statistics)         */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {/* Card 1: Total Raw Leads */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Database className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {kpis.totalLeads}
                </div>
                <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                  Total Leads
                </div>
                <div className="text-[11px] text-slate-400 font-medium truncate">
                  In MongoDB database
                </div>
              </div>
            </div>

            {/* Card 2: New Leads */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {kpis.newLeads}
                </div>
                <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                  New Leads
                </div>
                <div className="text-[11px] text-slate-400 font-medium truncate">
                  Needs contact
                </div>
              </div>
            </div>

            {/* Card 3: Follow-ups Due */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {kpis.followupsDue}
                </div>
                <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                  Follow-ups
                </div>
                <div className="text-[11px] text-slate-400 font-medium truncate">
                  Scheduled / Due
                </div>
              </div>
            </div>

            {/* Card 4: Quotation Pending */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {kpis.quotationPending}
                </div>
                <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                  Quotations
                </div>
                <div className="text-[11px] text-slate-400 font-medium truncate">
                  In progress
                </div>
              </div>
            </div>

            {/* Card 5: Orders Won */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition-shadow col-span-2 sm:col-span-1">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-500 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {kpis.ordersConfirmed}
                </div>
                <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                  Orders Won
                </div>
                <div className="text-[11px] text-slate-400 font-medium truncate">
                  Confirmed sales
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* VIEW MODE 1: RAW DATA TABLE (Direct full database view)                  */}
          {/* ========================================================================= */}
          {viewMode === "raw_data" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden space-y-3">
              {/* Top Bar for Raw Data View */}
              <div className="p-5 pb-3 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">
                      Raw Database Records
                    </h2>
                    <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
                      Collection: leads
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-normal mt-0.5">
                    Viewing raw MongoDB documents directly as stored in the backend database.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                  {/* Search */}
                  <div className="relative min-w-44 sm:min-w-56">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search ID, name, phone, status..."
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                    />
                  </div>

                  {/* Export Raw Data */}
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    title="Export raw JSON file"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>

              {/* Raw Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-3">LEAD NUMBER</th>
                      <th className="py-3 px-3">MONGO _ID</th>
                      <th className="py-3 px-3 font-sans">CONTACT &amp; BUSINESS</th>
                      <th className="py-3 px-3">PHONE</th>
                      <th className="py-3 px-3 font-sans">SOURCE</th>
                      <th className="py-3 px-3 font-sans">RAW STATUS</th>
                      <th className="py-3 px-3 font-sans">PRIORITY</th>
                      <th className="py-3 px-3 font-sans">EXPECTED VALUE</th>
                      <th className="py-3 px-3 font-sans">ASSIGNED TO</th>
                      <th className="py-3 px-3">CREATED AT</th>
                      <th className="py-3 px-3 text-center font-sans">RAW JSON</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {filteredLeads.length > 0 ? (
                      filteredLeads.map((item) => (
                        <tr key={item._id} className="hover:bg-indigo-50/30 transition-colors">
                          {/* Lead Number */}
                          <td className="py-3 px-3 font-bold text-indigo-700">
                            {item.leadNumber}
                          </td>

                          {/* Mongo ID */}
                          <td className="py-3 px-3 text-slate-400 select-all" title={String(item._id)}>
                            {String(item._id).slice(0, 10)}…
                          </td>

                          {/* Contact & Business */}
                          <td className="py-3 px-3 font-sans">
                            <div className="font-bold text-slate-900">{item.contactName}</div>
                            <div className="text-[10px] text-slate-400">{item.businessName || "—"}</div>
                          </td>

                          {/* Phone */}
                          <td className="py-3 px-3 text-emerald-700 font-semibold select-all">
                            {item.phone}
                          </td>

                          {/* Source */}
                          <td className="py-3 px-3 font-sans">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                              {item.rawSource}
                            </span>
                          </td>

                          {/* Raw Status */}
                          <td className="py-3 px-3 font-sans">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.status === "WON" ? "bg-emerald-100 text-emerald-800" :
                              item.status === "NEW" ? "bg-blue-100 text-blue-800" :
                              item.status === "FOLLOW_UP" ? "bg-amber-100 text-amber-800" :
                              item.status === "QUOTATION" ? "bg-purple-100 text-purple-800" :
                              "bg-slate-100 text-slate-800"
                            }`}>
                              {item.rawStatus}
                            </span>
                          </td>

                          {/* Priority */}
                          <td className="py-3 px-3 font-sans">
                            <span className={`text-[10px] font-bold ${
                              item.priority === "HIGH" ? "text-rose-600" :
                              item.priority === "MEDIUM" ? "text-amber-600" : "text-slate-500"
                            }`}>
                              {item.priority}
                            </span>
                          </td>

                          {/* Expected Value */}
                          <td className="py-3 px-3 font-sans text-slate-800 font-bold">
                            ₹{Number(item.expectedValue).toLocaleString("en-IN")}
                          </td>

                          {/* Assigned To */}
                          <td className="py-3 px-3 font-sans text-slate-600">
                            {item.assignedToName}
                          </td>

                          {/* Created At */}
                          <td className="py-3 px-3 text-slate-500 text-[10px]">
                            {item.createdAtDate}
                          </td>

                          {/* Actions: View JSON / View Details */}
                          <td className="py-3 px-3 text-center font-sans">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setInspectingLead(item.raw)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                                title="Inspect raw MongoDB JSON document"
                              >
                                <Code2 className="w-3 h-3" />
                                <span>JSON</span>
                              </button>
                              <Link
                                href={`/dashboard/leads/${item._id}`}
                                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                                title="Open full Lead Workspace"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-slate-400 font-sans">
                          No raw database records found matching filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW MODE 2: STANDARD WORKFLOW TWO-COLUMN LAYOUT                         */}
          {/* ========================================================================= */}
          {viewMode === "standard" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
              {/* ======================================================================= */}
              {/* LEFT COLUMN: MY LEADS WORKSPACE TABLE (col-span-8)                      */}
              {/* ======================================================================= */}
              <div className="xl:col-span-8 space-y-4">
                <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                  {/* Header: Title + Search & Controls */}
                  <div className="p-5 pb-3 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 leading-tight">
                        My Leads
                      </h2>
                      <p className="text-xs text-slate-400 font-normal mt-0.5">
                        Work on your live customer inquiries and assigned follow-ups
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                      {/* Search Input */}
                      <div className="relative min-w-44 sm:min-w-56 flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search in my leads..."
                          className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white"
                        />
                      </div>

                      {/* Filters Button */}
                      <button
                        type="button"
                        onClick={() => setActiveTab("ALL")}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                        <span>Reset</span>
                      </button>

                      {/* Priority Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowPriorityDropdown((prev) => !prev)}
                          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          <span>
                            {priorityFilter === "ALL" ? "Priority" : priorityFilter}
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        </button>

                        {showPriorityDropdown && (
                          <div className="absolute right-0 mt-1.5 w-32 bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-30 text-xs">
                            {["ALL", "HIGH", "MEDIUM", "LOW"].map((p) => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => {
                                  setPriorityFilter(p);
                                  setShowPriorityDropdown(false);
                                }}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                                  priorityFilter === p
                                    ? "bg-orange-50 text-[#F95721] font-bold"
                                    : "text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                {p === "ALL" ? "All Priorities" : p}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Navigation Tabs with underline */}
                  <div className="px-5 border-b border-slate-200 flex items-center gap-6 overflow-x-auto scrollbar-none text-xs font-semibold text-slate-500">
                    <button
                      type="button"
                      onClick={() => setActiveTab("ALL")}
                      className={`py-3 relative border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                        activeTab === "ALL"
                          ? "border-[#F95721] text-[#F95721] font-bold"
                          : "border-transparent hover:text-slate-900"
                      }`}
                    >
                      All Leads ({tabCounts.ALL})
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("NEW")}
                      className={`py-3 relative border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                        activeTab === "NEW"
                          ? "border-[#F95721] text-[#F95721] font-bold"
                          : "border-transparent hover:text-slate-900"
                      }`}
                    >
                      New ({tabCounts.NEW})
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("FOLLOW_UP")}
                      className={`py-3 relative border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                        activeTab === "FOLLOW_UP"
                          ? "border-[#F95721] text-[#F95721] font-bold"
                          : "border-transparent hover:text-slate-900"
                      }`}
                    >
                      Follow-up ({tabCounts.FOLLOW_UP})
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("QUOTATION")}
                      className={`py-3 relative border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                        activeTab === "QUOTATION"
                          ? "border-[#F95721] text-[#F95721] font-bold"
                          : "border-transparent hover:text-slate-900"
                      }`}
                    >
                      Quotation ({tabCounts.QUOTATION})
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("NEGOTIATION")}
                      className={`py-3 relative border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                        activeTab === "NEGOTIATION"
                          ? "border-[#F95721] text-[#F95721] font-bold"
                          : "border-transparent hover:text-slate-900"
                      }`}
                    >
                      Negotiation ({tabCounts.NEGOTIATION})
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("WON")}
                      className={`py-3 relative border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                        activeTab === "WON"
                          ? "border-[#F95721] text-[#F95721] font-bold"
                          : "border-transparent hover:text-slate-900"
                      }`}
                    >
                      Won ({tabCounts.WON})
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("LOST")}
                      className={`py-3 relative border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                        activeTab === "LOST"
                          ? "border-[#F95721] text-[#F95721] font-bold"
                          : "border-transparent hover:text-slate-900"
                      }`}
                    >
                      Lost ({tabCounts.LOST})
                    </button>
                  </div>

                  {/* Table View */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-3 px-4 w-9 text-center">
                            <input
                              type="checkbox"
                              onChange={handleSelectAll}
                              checked={
                                filteredLeads.length > 0 &&
                                selectedLeads.length === filteredLeads.length
                              }
                              className="rounded text-[#F95721] focus:ring-orange-500 cursor-pointer"
                            />
                          </th>
                          <th className="py-3 px-3">BUSINESS / CONTACT</th>
                          <th className="py-3 px-3">AREA</th>
                          <th className="py-3 px-3">REQUIREMENT</th>
                          <th className="py-3 px-3">SOURCE</th>
                          <th className="py-3 px-3">CREATED AT</th>
                          <th className="py-3 px-3">STATUS</th>
                          <th className="py-3 px-3 text-center">NEXT ACTION</th>
                          <th className="py-3 px-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredLeads.length > 0 ? (
                          filteredLeads.map((item) => {
                            const isSelected = selectedLeads.includes(item._id);

                            return (
                              <tr
                                key={item._id}
                                className={`hover:bg-slate-50/70 transition-colors ${
                                  isSelected ? "bg-orange-50/40" : ""
                                }`}
                              >
                                {/* Checkbox */}
                                <td className="py-3.5 px-4 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleLead(item._id)}
                                    className="rounded text-[#F95721] focus:ring-orange-500 cursor-pointer"
                                  />
                                </td>

                                {/* Business / Contact with Photo Thumbnail */}
                                <td className="py-3.5 px-3">
                                  <div className="flex items-center gap-3">
                                    {/* Shop Photo Thumbnail */}
                                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 shadow-2xs flex items-center justify-center text-slate-400">
                                      {item.photoUrl ? (
                                        <img
                                          src={item.photoUrl}
                                          alt={item.businessName}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.target.style.display = "none";
                                          }}
                                        />
                                      ) : (
                                        <Store className="w-5 h-5 text-slate-400" />
                                      )}
                                    </div>

                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                                          {item.leadNumber}
                                        </span>
                                        <Link
                                          href={`/dashboard/leads/${item._id}`}
                                          className="font-bold text-slate-900 hover:text-[#F95721] text-xs truncate max-w-40 sm:max-w-48 leading-tight"
                                        >
                                          {item.businessName}
                                        </Link>
                                      </div>
                                      <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                        {item.contactName}
                                      </div>
                                      <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                                        <Phone className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                        <span>{item.phone}</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Area */}
                                <td className="py-3.5 px-3 text-slate-700">
                                  <div className="font-bold text-xs text-slate-800 leading-tight">
                                    {item.area}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-medium">
                                    {item.zone}
                                  </div>
                                </td>

                                {/* Requirement */}
                                <td className="py-3.5 px-3">
                                  <div className="font-bold text-xs text-slate-800 leading-tight">
                                    {item.requirementTitle}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-medium">
                                    {item.requirementQty || (item.expectedValue > 0 ? `₹${item.expectedValue}` : "")}
                                  </div>
                                </td>

                                {/* Source */}
                                <td className="py-3.5 px-3">
                                  <div className="flex items-center gap-1.5 text-slate-700 text-xs font-medium">
                                    {item.sourceType === "MAPS" && (
                                      <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    )}
                                    {item.sourceType === "VISIT" && (
                                      <Store className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                    )}
                                    {item.sourceType === "REFERRAL" && (
                                      <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                    )}
                                    {item.sourceType === "MANUAL" && (
                                      <Briefcase className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                    )}
                                    <span>{item.source}</span>
                                  </div>
                                </td>

                                {/* Created At */}
                                <td className="py-3.5 px-3 text-slate-700">
                                  <div className="font-bold text-xs text-slate-800 leading-tight">
                                    {item.createdAtTime}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-medium">
                                    {item.createdAtDate}
                                  </div>
                                </td>

                                {/* Status Badge */}
                                <td className="py-3.5 px-3">
                                  {item.status === "NEW" && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                                      New
                                    </span>
                                  )}
                                  {item.status === "FOLLOW_UP" && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                      Follow-up
                                    </span>
                                  )}
                                  {item.status === "QUOTATION" && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                      Quotation
                                    </span>
                                  )}
                                  {item.status === "NEGOTIATION" && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                                      Negotiation
                                    </span>
                                  )}
                                  {item.status === "WON" && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Won
                                    </span>
                                  )}
                                  {item.status === "LOST" && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                      Lost
                                    </span>
                                  )}
                                </td>

                                {/* Next Action */}
                                <td className="py-3.5 px-3 text-center">
                                  {item.status === "QUOTATION" ? (
                                    <Link
                                      href="/dashboard/quotations"
                                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-[#F95721]" />
                                      <span>View</span>
                                    </Link>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setCallingLead(item)}
                                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#F95721] hover:bg-[#e84915] active:scale-95 text-white font-bold text-xs shadow-xs shadow-orange-500/20 transition-all cursor-pointer"
                                    >
                                      <PhoneCall className="w-3.5 h-3.5" />
                                      <span>Call Now</span>
                                    </button>
                                  )}
                                </td>

                                {/* Row menu: Raw JSON modal & lead detail link */}
                                <td className="py-3.5 px-2 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setInspectingLead(item.raw)}
                                      className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                      title="Inspect Raw DB Document"
                                    >
                                      <Code2 className="w-3.5 h-3.5" />
                                    </button>
                                    <Link
                                      href={`/dashboard/leads/${item._id}`}
                                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                                      title="Lead Details"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={9} className="py-12 text-center text-slate-400">
                              No leads found matching current filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ======================================================================= */}
              {/* RIGHT COLUMN: 3 ACTION & FOCUS CARDS (col-span-4)                      */}
              {/* ======================================================================= */}
              <div className="xl:col-span-4 space-y-4">
                {/* Card 1: Today's Focus (Calculated from real live database) */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
                      <Target className="w-4 h-4 text-rose-500" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      Today&apos;s Focus
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {/* Task 1 */}
                    <div className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full border-2 border-rose-400 flex items-center justify-center shrink-0" />
                        <span className="font-semibold text-slate-700">
                          Call new leads
                        </span>
                      </div>
                      <span className="text-slate-500 font-bold">
                        {kpis.newLeads} pending
                      </span>
                    </div>

                    {/* Task 2 */}
                    <div className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full border-2 border-orange-400 flex items-center justify-center shrink-0" />
                        <span className="font-semibold text-slate-700">
                          Complete follow-ups
                        </span>
                      </div>
                      <span className="text-slate-500 font-bold">
                        {kpis.followupsDue} due
                      </span>
                    </div>

                    {/* Task 3 */}
                    <div className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full border-2 border-purple-400 flex items-center justify-center shrink-0" />
                        <span className="font-semibold text-slate-700">
                          Pending quotations
                        </span>
                      </div>
                      <span className="text-slate-500 font-bold">
                        {kpis.quotationPending} quotes
                      </span>
                    </div>

                    {/* Task 4 */}
                    <div className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full border-2 border-emerald-400 flex items-center justify-center shrink-0" />
                        <span className="font-semibold text-slate-700">
                          Convert to orders
                        </span>
                      </div>
                      <span className="text-emerald-600 font-bold">
                        {kpis.ordersConfirmed} won
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Recent Activity (Live from MongoDB records) */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      Recent Activity
                    </h3>
                    <Link
                      href="/dashboard/leads"
                      className="text-xs font-semibold text-[#F95721] hover:text-[#e84915] hover:underline"
                    >
                      View All
                    </Link>
                  </div>

                  <div className="space-y-3.5">
                    {recentActivities.length > 0 ? (
                      recentActivities.map((act) => (
                        <div key={act.id} className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-full text-white flex items-center justify-center shrink-0 mt-0.5 ${
                                act.type === "lead"
                                  ? "bg-emerald-500"
                                  : act.type === "followup"
                                  ? "bg-amber-500"
                                  : "bg-purple-600"
                              }`}
                            >
                              {act.type === "lead" && <Phone className="w-3.5 h-3.5" />}
                              {act.type === "followup" && <Clock className="w-3.5 h-3.5" />}
                              {act.type === "quotation" && <FileText className="w-3.5 h-3.5" />}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {act.title}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {act.subtitle}
                              </div>
                            </div>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium shrink-0">
                            {act.time}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-400 font-medium">
                        No recent activity recorded yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 3: Quick Actions */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 leading-tight mb-3">
                    Quick Actions
                  </h3>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Action 1: Open Follow-ups */}
                    <Link
                      href="/dashboard/followups"
                      className="p-3 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 transition-all flex items-center gap-2.5 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 group-hover:text-amber-700 leading-tight">
                        Follow-ups
                      </span>
                    </Link>

                    {/* Action 2: My Quotations */}
                    <Link
                      href="/dashboard/quotations"
                      className="p-3 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50/30 transition-all flex items-center gap-2.5 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#F95721] flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 group-hover:text-[#e84915] leading-tight">
                        Quotations
                      </span>
                    </Link>

                    {/* Action 3: WhatsApp Web */}
                    <Link
                      href="/dashboard/whatsapp"
                      className="p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all flex items-center gap-2.5 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-700 leading-tight">
                        WhatsApp
                      </span>
                    </Link>

                    {/* Action 4: Lead Inbox */}
                    <Link
                      href="/dashboard/leads/inbox"
                      className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex items-center gap-2.5 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Inbox className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-700 leading-tight">
                        Lead Inbox
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD MANUAL LEAD DIALOG                                          */}
      {/* ========================================================================= */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#F95721] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Add Manual Lead
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Create and assign a new customer inquiry
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddLeadModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Business / Shop Name *
                </label>
                <input
                  type="text"
                  required
                  value={newLeadForm.businessName}
                  onChange={(e) =>
                    setNewLeadForm((prev) => ({
                      ...prev,
                      businessName: e.target.value,
                    }))
                  }
                  placeholder="e.g. Royal Printers & Stationers"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    value={newLeadForm.contactName}
                    onChange={(e) =>
                      setNewLeadForm((prev) => ({
                        ...prev,
                        contactName: e.target.value,
                      }))
                    }
                    placeholder="e.g. Sunil Verma"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newLeadForm.phone}
                    onChange={(e) =>
                      setNewLeadForm((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="10-digit mobile number"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Area
                  </label>
                  <input
                    type="text"
                    value={newLeadForm.area}
                    onChange={(e) =>
                      setNewLeadForm((prev) => ({ ...prev, area: e.target.value }))
                    }
                    placeholder="e.g. Burari"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Zone / Colony
                  </label>
                  <input
                    type="text"
                    value={newLeadForm.zone}
                    onChange={(e) =>
                      setNewLeadForm((prev) => ({ ...prev, zone: e.target.value }))
                    }
                    placeholder="e.g. Sant Nagar"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Requirement Item
                  </label>
                  <input
                    type="text"
                    value={newLeadForm.requirement}
                    onChange={(e) =>
                      setNewLeadForm((prev) => ({
                        ...prev,
                        requirement: e.target.value,
                      }))
                    }
                    placeholder="e.g. Visiting Cards"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Priority
                  </label>
                  <select
                    value={newLeadForm.priority}
                    onChange={(e) =>
                      setNewLeadForm((prev) => ({
                        ...prev,
                        priority: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:outline-none bg-white"
                  >
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Customer Notes
                </label>
                <textarea
                  rows={2}
                  value={newLeadForm.notes}
                  onChange={(e) =>
                    setNewLeadForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Any customer preferences, urgency, or specifications..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLead}
                  className="px-4 py-2 bg-[#F95721] hover:bg-[#e84915] text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingLead ? "Creating..." : "Save & Add Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CALL NOW CONFIRMATION & DIALER                                  */}
      {/* ========================================================================= */}
      {callingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-orange-50 text-[#F95721] flex items-center justify-center mx-auto shadow-inner">
              <PhoneCall className="w-7 h-7 text-[#F95721] animate-pulse" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Connect with {callingLead.contactName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {callingLead.businessName} • {callingLead.area}
              </p>
              <div className="mt-2 text-lg font-black text-slate-900 font-mono tracking-wider">
                {callingLead.phone}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCallingLead(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <a
                href={`tel:${callingLead.phone}`}
                onClick={() => setCallingLead(null)}
                className="flex-1 py-2.5 bg-[#F95721] hover:bg-[#e84915] text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Device</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RAW MONGODB JSON INSPECTOR MODAL                                */}
      {/* ========================================================================= */}
      {inspectingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 text-slate-100 rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-800 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Raw Database Document</span>
                    <span className="text-[11px] font-mono text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                      {inspectingLead.leadNumber || inspectingLead._id}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Direct MongoDB JSON payload for this lead
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyJson(inspectingLead)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-colors"
                >
                  {copiedJson ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setInspectingLead(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* JSON Code Viewer */}
            <div className="flex-1 overflow-y-auto bg-slate-950 rounded-xl p-4 border border-slate-800 text-xs font-mono text-emerald-400 select-text leading-relaxed">
              <pre>{JSON.stringify(inspectingLead, null, 2)}</pre>
            </div>

            {/* Bottom Bar */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-400 shrink-0 border-t border-slate-800">
              <span>_id: {inspectingLead._id}</span>
              <button
                type="button"
                onClick={() => setInspectingLead(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
