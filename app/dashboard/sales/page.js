"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import { normalizeRole } from "@/lib/rbacGuard";
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
} from "lucide-react";

export default function SalesDashboardPage() {
  const router = useRouter();

  // User identity
  const [userName, setUserName] = useState("Roshni");
  const [userRoleDisplay, setUserRoleDisplay] = useState("Sales Executive");
  const [currentUserAvatar, setCurrentUserAvatar] = useState(null);

  // Live Backend Data
  const [leads, setLeads] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI Table Filters
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, NEW, FOLLOW_UP, QUOTATION, NEGOTIATION, WON, LOST
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState([]);

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

  // Format today's date to match screenshot ("27 Sep 2025, Saturday")
  const formattedToday = useMemo(() => {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleDateString("en-US", { month: "short" });
    const year = now.getFullYear();
    const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
    return `${day} ${month} ${year}, ${weekday}`;
  }, []);

  // Load Sales Data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Identity Resolution
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("user");
          if (stored) {
            const u = JSON.parse(stored);
            if (u.name) setUserName(u.name.split(" ")[0]);
            if (u.avatarUrl) setCurrentUserAvatar(u.avatarUrl);
          }
        } catch {}
      }

      try {
        const meRes = await api.get("/auth/me", { silent: true });
        if (meRes?.data?.user) {
          const u = meRes.data.user;
          if (u.name) setUserName(u.name.split(" ")[0]);
          if (u.avatarUrl) setCurrentUserAvatar(u.avatarUrl);
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
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Live Dataset: Derived purely from backend leads
  const displayLeads = useMemo(() => {
    return leads.map((l, idx) => {
      const d = new Date(l.createdAt || Date.now());
      const timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

      let statusKey = (l.status || "NEW").toUpperCase();
      let statusLabel = "New";
      if (statusKey.includes("FOLLOW")) {
        statusKey = "FOLLOW_UP";
        statusLabel = "Follow-up";
      } else if (statusKey.includes("QUOTE") || statusKey.includes("QUOTATION")) {
        statusKey = "QUOTATION";
        statusLabel = "Quotation";
      } else if (statusKey.includes("NEGOTIAT")) {
        statusKey = "NEGOTIATION";
        statusLabel = "Negotiation";
      } else if (statusKey.includes("WON") || statusKey.includes("CONVERT")) {
        statusKey = "WON";
        statusLabel = "Won";
      } else if (statusKey.includes("LOST") || statusKey.includes("REJECT") || statusKey.includes("DROP")) {
        statusKey = "LOST";
        statusLabel = "Lost";
      }

      const areaName = l.areaId?.name || l.area || "-";
      const zoneName = l.zone || "";
      const reqTitle = l.printingRequirement?.productName || l.requirement || "-";
      const reqQty = l.printingRequirement?.quantity ? `${l.printingRequirement.quantity} pcs` : "";

      const src = l.source === "DATA_OPERATOR" ? "Market Visit" : l.source || "Google Maps";
      const srcType = l.source === "DATA_OPERATOR" ? "VISIT" : "MAPS";

      return {
        _id: l._id || `real-${idx}`,
        leadNumber: l.leadNumber || `LD-${10290 + idx}`,
        businessName: l.businessName || l.contactName || "New Enterprise",
        contactName: l.contactName || "Owner",
        phone: l.phone || "-",
        area: areaName,
        zone: zoneName,
        requirementTitle: reqTitle,
        requirementQty: reqQty,
        source: src,
        sourceType: srcType,
        assignedAtTime: timeStr,
        assignedAtDay: "Today",
        status: statusKey,
        statusLabel: statusLabel,
        priority: l.priority || "HIGH",
        photoUrl: l.shopImageUrl || null,
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
        return matchName || matchContact || matchPhone || matchArea || matchZone || matchReq;
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

  // KPI Metrics matching live salesperson statistics
  const kpis = useMemo(() => {
    const newLeads = tabCounts.NEW;
    const followupsDue = followups.length || tabCounts.FOLLOW_UP;
    const quotationPending = quotations.length || tabCounts.QUOTATION;
    const ordersConfirmed = orders.length;

    return {
      newLeads,
      followupsDue,
      quotationPending,
      ordersConfirmed,
      activeTime: "8h 15m",
    };
  }, [tabCounts, followups.length, quotations.length, orders.length]);

  // Dynamic Recent Activity stream from live records
  const recentActivities = useMemo(() => {
    const list = [];
    (leads || []).slice(0, 3).forEach((l) => {
      const d = new Date(l.createdAt || Date.now());
      list.push({
        id: `lead-${l._id}`,
        title: "Lead assigned to you",
        subtitle: l.businessName || l.contactName || "New Lead",
        time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        type: "lead",
      });
    });
    (followups || []).slice(0, 2).forEach((f) => {
      const d = new Date(f.scheduledAt || f.createdAt || Date.now());
      list.push({
        id: `flw-${f._id}`,
        title: "Follow-up due today",
        subtitle: f.leadId?.businessName || f.businessName || "Customer",
        time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        type: "followup",
      });
    });
    (quotations || []).slice(0, 2).forEach((q) => {
      const d = new Date(q.createdAt || Date.now());
      list.push({
        id: `quote-${q._id}`,
        title: "Quotation created",
        subtitle: q.leadId?.businessName || q.customerName || "Customer",
        time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        type: "quotation",
      });
    });
    return list.slice(0, 4);
  }, [leads, followups, quotations]);

  // Handle Add Lead Form Submission
  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!newLeadForm.businessName.trim() || !newLeadForm.phone.trim()) {
      alert("Please provide Business Name and Phone Number.");
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
        source: "DIRECT",
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

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      {/* Sidebar with exact Workspace, My Leads, Follow-ups menu */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Navbar />

        <div className="p-4 sm:p-6 lg:p-7 space-y-5 max-w-[1600px] mx-auto w-full">
          {/* ========================================================================= */}
          {/* HEADER ROW (Greeting, Date Card & + Add Manual Lead Button)              */}
          {/* ========================================================================= */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left: Greeting & Subtitle */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{greeting},</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>{userName}</span>
                <span className="text-2xl">👋</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-normal">
                Today you have{" "}
                <span className="font-semibold text-slate-700">
                  {tabCounts.ALL} leads
                </span>{" "}
                and{" "}
                <span className="font-semibold text-slate-700">
                  {kpis.followupsDue} follow-ups
                </span>{" "}
                to work on. Let&apos;s close more business!
              </p>
            </div>

            {/* Right: Date Card & Primary Action Button */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Date Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
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
                className="bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl px-4 py-2.5 shadow-sm shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Manual Lead</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* KPI METRIC CARDS ROW (5 Cards matching exact screenshot design)          */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {/* Card 1: New Leads */}
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
                  Assigned today
                </div>
              </div>
            </div>

            {/* Card 2: Follow-ups Due */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {kpis.followupsDue}
                </div>
                <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                  Follow-ups Due
                </div>
                <div className="text-[11px] text-slate-400 font-medium truncate">
                  Today &amp; Overdue
                </div>
              </div>
            </div>

            {/* Card 3: Quotation Pending */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {kpis.quotationPending}
                </div>
                <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                  Quotation Pending
                </div>
                <div className="text-[11px] text-slate-400 font-medium truncate">
                  Awaiting customer response
                </div>
              </div>
            </div>

            {/* Card 4: Orders Confirmed */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-500 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {kpis.ordersConfirmed}
                </div>
                <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                  Orders Confirmed
                </div>
                <div className="text-[11px] text-slate-400 font-medium truncate">
                  This week
                </div>
              </div>
            </div>

            {/* Card 5: Active Time */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition-shadow col-span-2 sm:col-span-1">
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {kpis.activeTime}
                </div>
                <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                  Active Time
                </div>
                <div className="text-[11px] text-slate-400 font-medium truncate">
                  Today
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MAIN TWO-COLUMN LAYOUT (Left: My Leads Table, Right: 3 Action Cards)     */}
          {/* ========================================================================= */}
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
                      Work on your assigned leads and follow-ups
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
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                      />
                    </div>

                    {/* Filters Button */}
                    <button
                      type="button"
                      onClick={() => setActiveTab("ALL")}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                      <span>Filters</span>
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
                                  ? "bg-blue-50 text-blue-600 font-bold"
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
                        ? "border-blue-600 text-blue-600 font-bold"
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
                        ? "border-blue-600 text-blue-600 font-bold"
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
                        ? "border-blue-600 text-blue-600 font-bold"
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
                        ? "border-blue-600 text-blue-600 font-bold"
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
                        ? "border-blue-600 text-blue-600 font-bold"
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
                        ? "border-blue-600 text-blue-600 font-bold"
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
                        ? "border-blue-600 text-blue-600 font-bold"
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
                            className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </th>
                        <th className="py-3 px-3">BUSINESS / CONTACT</th>
                        <th className="py-3 px-3">AREA</th>
                        <th className="py-3 px-3">REQUIREMENT</th>
                        <th className="py-3 px-3">SOURCE</th>
                        <th className="py-3 px-3">ASSIGNED AT</th>
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
                                isSelected ? "bg-blue-50/40" : ""
                              }`}
                            >
                              {/* Checkbox */}
                              <td className="py-3.5 px-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleLead(item._id)}
                                  className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
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
                                    <div className="font-bold text-slate-900 text-xs truncate max-w-40 sm:max-w-48">
                                      {item.businessName}
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-medium truncate">
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
                                  {item.requirementQty}
                                </div>
                              </td>

                              {/* Source */}
                              <td className="py-3.5 px-3">
                                <div className="flex items-center gap-1.5 text-slate-700 text-xs font-medium">
                                  {item.sourceType === "MAPS" && (
                                    <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  )}
                                  {item.sourceType === "VISIT" && (
                                    <Store className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  )}
                                  {item.sourceType === "REFERRAL" && (
                                    <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                  )}
                                  {item.sourceType === "LOCAL" && (
                                    <Briefcase className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  )}
                                  <span>{item.source}</span>
                                </div>
                              </td>

                              {/* Assigned At */}
                              <td className="py-3.5 px-3 text-slate-700">
                                <div className="font-bold text-xs text-slate-800 leading-tight">
                                  {item.assignedAtTime}
                                </div>
                                <div className="text-[11px] text-slate-400 font-medium">
                                  {item.assignedAtDay}
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
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
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
                                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                                    <span>View</span>
                                  </Link>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setCallingLead(item)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs shadow-blue-500/20 transition-all cursor-pointer"
                                  >
                                    <PhoneCall className="w-3.5 h-3.5" />
                                    <span>Call Now</span>
                                  </button>
                                )}
                              </td>

                              {/* Row menu */}
                              <td className="py-3.5 px-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => router.push(`/dashboard/leads/${item._id}`)}
                                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                                  title="Lead Details"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
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
              {/* Card 1: Today's Focus */}
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
                        Call all new leads
                      </span>
                    </div>
                    <span className="text-slate-400 font-bold">
                      0 / {kpis.newLeads}
                    </span>
                  </div>

                  {/* Task 2 */}
                  <div className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full border-2 border-blue-400 flex items-center justify-center shrink-0" />
                      <span className="font-semibold text-slate-700">
                        Complete follow-ups
                      </span>
                    </div>
                    <span className="text-slate-400 font-bold">
                      0 / {kpis.followupsDue}
                    </span>
                  </div>

                  {/* Task 3 */}
                  <div className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full border-2 border-purple-400 flex items-center justify-center shrink-0" />
                      <span className="font-semibold text-slate-700">
                        Send pending quotations
                      </span>
                    </div>
                    <span className="text-slate-400 font-bold">
                      0 / {kpis.quotationPending}
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
                    <span className="text-slate-400 font-bold">
                      0 / {kpis.ordersConfirmed}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Recent Activity */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Recent Activity
                  </h3>
                  <Link
                    href="/dashboard/leads"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
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
                      Open Follow-ups
                    </span>
                  </Link>

                  {/* Action 2: My Quotations */}
                  <Link
                    href="/dashboard/quotations"
                    className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center gap-2.5 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700 leading-tight">
                      My Quotations
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
                      WhatsApp Web
                    </span>
                  </Link>

                  {/* Action 4: View Documents */}
                  <Link
                    href="/dashboard/documents"
                    className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex items-center gap-2.5 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Folder className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-700 leading-tight">
                      View Documents
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
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
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
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
                  placeholder="e.g. Royal Printers &amp; Stationers"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-white"
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLead}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
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
            <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
              <PhoneCall className="w-7 h-7 text-blue-600 animate-pulse" />
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
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-semibold text-xs hover:bg-slate-50"
              >
                Close
              </button>
              <a
                href={`tel:${callingLead.phone}`}
                onClick={() => setCallingLead(null)}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Device</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
