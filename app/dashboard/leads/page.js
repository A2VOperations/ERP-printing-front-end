"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import {
  Flame,
  CookingPot,
  Star,
  CheckCircle2,
  DollarSign,
  Plus,
  Upload,
  Filter,
  MoreVertical,
  ChevronDown,
  Clock,
  User,
  Sparkles,
  Lock,
  UserCheck,
  MessageCircle,
  Loader2,
} from "lucide-react";

const TABS = [
  { id: "ALL", label: "All Leads", countKey: "total" },
  { id: "NEW", label: "New", countKey: "new" },
  { id: "CONTACTED", label: "Contacted", countKey: "contacted" },
  { id: "QUOTATION_SENT", label: "Proposal Sent", countKey: "proposal" },
  { id: "NEGOTIATION", label: "Negotiation", countKey: "negotiation" },
  { id: "WON", label: "Won", countKey: "won" },
  { id: "LOST", label: "Lost", countKey: "lost" },
];

export default function LeadsDashboardPage() {
  const router = useRouter();

  // Active Tab
  const [activeTab, setActiveTab] = useState("ALL");
  const [timeframe, setTimeframe] = useState("This Month");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6);

  // Live Data
  const [leads, setLeads] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [users, setUsers] = useState([]);

  // Reset pagination on tab/search change
  useEffect(() => {
    setVisibleCount(6);
  }, [activeTab, searchQuery]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [creatingLead, setCreatingLead] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [reassignTargetId, setReassignTargetId] = useState("");
  const [reassignNotes, setReassignNotes] = useState("");

  // Form State
  const [newLead, setNewLead] = useState({
    customerName: "",
    companyName: "",
    phone: "",
    email: "",
    alternatePhone: "",
    source: "WEBSITE",
    requirement: "",
    expectedValue: "",
    priority: "HIGH",
    assignedToId: "",
    nextFollowUp: "",
    notes: "",
  });

  const [followupForm, setFollowupForm] = useState({
    scheduledAt: "",
    title: "Follow-up Call",
    description: "",
  });

  // Fetch all leads and follow-ups
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setCurrentUser(JSON.parse(storedUser));
      } catch (e) {}

      const [leadsRes, flwRes, usersRes, meRes] = await Promise.allSettled([
        api.get("/leads?limit=50"),
        api.get("/followups?limit=50"),
        api.get("/users"),
        api.get("/auth/me"),
      ]);

      if (leadsRes.status === "fulfilled") {
        const raw = leadsRes.value?.data;
        const arr = Array.isArray(raw) ? raw : raw?.leads || raw?.data || [];
        setLeads(arr);
      }
      if (flwRes.status === "fulfilled") {
        const raw = flwRes.value?.data;
        const arr = Array.isArray(raw)
          ? raw
          : raw?.followUps || raw?.followups || raw?.data || [];
        setFollowups(arr);
      }
      if (usersRes.status === "fulfilled") {
        const raw = usersRes.value?.data;
        const arr = Array.isArray(raw) ? raw : raw?.users || raw?.data || [];
        setUsers(arr);
      }
      if (meRes.status === "fulfilled" && meRes.value?.data) {
        const me = meRes.value.data.user || meRes.value.data;
        setCurrentUser(me);
      }
    } catch (err) {
      console.error("Failed to load leads dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const userRole = useMemo(() => {
    return (
      currentUser?.roleSlug ||
      currentUser?.role ||
      (typeof window !== "undefined" ? localStorage.getItem("userRole") : "") ||
      ""
    ).toLowerCase();
  }, [currentUser]);

  const isManagerOrAdmin = useMemo(() => {
    return ["admin", "super_admin", "manager", "sales_manager"].includes(
      userRole,
    );
  }, [userRole]);

  // Lead computation helpers for global pipeline
  const computedMetrics = useMemo(() => {
    const total = leads.length;
    const newCount = leads.filter((l) => l.status === "NEW").length;
    const contactedCount = leads.filter((l) => l.status === "CONTACTED").length;
    const proposalCount = leads.filter(
      (l) => l.status === "QUOTATION_SENT",
    ).length;
    const negotiationCount = leads.filter(
      (l) => l.status === "NEGOTIATION",
    ).length;
    const inCookingCount = leads.filter((l) =>
      ["INTERESTED", "FOLLOW_UP"].includes(l.status),
    ).length;
    const wonCount = leads.filter((l) => l.status === "WON").length;
    const lostCount = leads.filter((l) =>
      ["LOST", "NOT_INTERESTED"].includes(l.status),
    ).length;

    const getLeadVal = (l) =>
      Number(l.expectedValue) ||
      Number(l.estimatedBudget) ||
      Number(l.estimatedValue) ||
      Number(l.legacyFinancials?.totalAmount) ||
      0;

    const hotLeads = leads.filter(
      (l) => l.priority === "URGENT" || l.priority === "HIGH",
    );
    const highTicketLeads = leads.filter((l) => getLeadVal(l) >= 20000);

    const totalExpectedVal = leads.reduce(
      (sum, l) => sum + getLeadVal(l),
      0,
    );
    const highTicketTotalVal = highTicketLeads.reduce(
      (sum, l) => sum + getLeadVal(l),
      0,
    );

    return {
      total,
      new: newCount,
      contacted: contactedCount,
      proposal: proposalCount,
      negotiation: negotiationCount,
      inCooking: inCookingCount,
      won: wonCount,
      lost: lostCount,
      hotCount: hotLeads.length,
      highTicketCount: highTicketLeads.length,
      totalExpectedVal,
      highTicketTotalVal,
      hotLeadsList: hotLeads.slice(0, 5),
    };
  }, [leads]);

  // Dynamic overview metrics based on selected timeframe (for the Donut Chart & Lead Status Breakdown)
  const overviewMetrics = useMemo(() => {
    const now = new Date();
    const sourceLeads = leads.filter((l) => {
      if (timeframe === "All Time") return true;
      const dateStr = l.createdAt || l.updatedAt;
      if (!dateStr) return true;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return true;

      if (timeframe === "Today") {
        return d.toDateString() === now.toDateString();
      }
      if (timeframe === "This Week") {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return d >= oneWeekAgo;
      }
      // 'This Month' (default)
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    });

    const total = sourceLeads.length;
    const newCount = sourceLeads.filter((l) => l.status === "NEW").length;
    const contactedCount = sourceLeads.filter(
      (l) => l.status === "CONTACTED",
    ).length;
    const proposalCount = sourceLeads.filter(
      (l) => l.status === "QUOTATION_SENT",
    ).length;
    const negotiationCount = sourceLeads.filter(
      (l) => l.status === "NEGOTIATION",
    ).length;
    const inCookingCount = sourceLeads.filter((l) =>
      ["INTERESTED", "FOLLOW_UP"].includes(l.status),
    ).length;
    const wonCount = sourceLeads.filter((l) => l.status === "WON").length;
    const lostCount = sourceLeads.filter((l) =>
      ["LOST", "NOT_INTERESTED"].includes(l.status),
    ).length;

    const getPct = (cnt) => (total > 0 ? Math.round((cnt / total) * 100) : 0);

    return {
      total,
      new: newCount,
      contacted: contactedCount,
      proposal: proposalCount,
      negotiation: negotiationCount,
      inCooking: inCookingCount,
      won: wonCount,
      lost: lostCount,
      pct: {
        new: getPct(newCount),
        contacted: getPct(contactedCount),
        proposal: getPct(proposalCount),
        negotiation: getPct(negotiationCount),
        inCooking: getPct(inCookingCount),
        won: getPct(wonCount),
        lost: getPct(lostCount),
      },
    };
  }, [leads, timeframe]);

  // Dynamic conic-gradient for the Donut Chart representation
  const donutGradient = useMemo(() => {
    const total = overviewMetrics.total;
    if (!total || total === 0) {
      return "conic-gradient(#e2e8f0 0deg 360deg)";
    }

    const segments = [
      { count: overviewMetrics.new, color: "#10b981" }, // emerald-500
      { count: overviewMetrics.contacted, color: "#a855f7" }, // purple-500
      { count: overviewMetrics.inCooking, color: "#3b82f6" }, // blue-500
      { count: overviewMetrics.proposal, color: "#f59e0b" }, // amber-500
      { count: overviewMetrics.won, color: "#22c55e" }, // green-500
      { count: overviewMetrics.lost, color: "#f43f5e" }, // rose-500
    ];

    let currentDeg = 0;
    const parts = [];
    segments.forEach((seg) => {
      if (seg.count > 0) {
        const deg = (seg.count / total) * 360;
        parts.push(
          `${seg.color} ${currentDeg.toFixed(1)}deg ${(currentDeg + deg).toFixed(1)}deg`,
        );
        currentDeg += deg;
      }
    });

    if (parts.length === 0) {
      return "conic-gradient(#e2e8f0 0deg 360deg)";
    }

    return `conic-gradient(${parts.join(", ")})`;
  }, [overviewMetrics]);

  // Dynamically filter follow-ups due today
  const todayFollowups = useMemo(() => {
    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDate = now.getDate();

    return followups.filter((flw) => {
      const targetDateStr =
        flw.scheduledAt || flw.dueAt || flw.date || flw.createdAt;
      if (!targetDateStr) return false;
      const d = new Date(targetDateStr);
      if (isNaN(d.getTime())) return false;
      return (
        d.getFullYear() === todayYear &&
        d.getMonth() === todayMonth &&
        d.getDate() === todayDate
      );
    });
  }, [followups]);

  // Helper for human-readable relative time
  const formatFriendlyTime = (dateStr) => {
    if (!dateStr) return "Recently";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Recently";
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return `Today, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      }
      return d.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch (e) {
      return "Recently";
    }
  };

  // Lead scoring helper for visual badge
  const getLeadScore = (lead) => {
    const val =
      Number(lead?.expectedValue) ||
      Number(lead?.estimatedBudget) ||
      Number(lead?.estimatedValue) ||
      Number(lead?.legacyFinancials?.totalAmount) ||
      0;
    if (lead.priority === "URGENT" || val >= 50000)
      return {
        score: 95,
        label: "Very High Score",
        color: "text-rose-600",
        ring: "border-rose-500",
      };
    if (lead.priority === "HIGH" || val >= 25000)
      return {
        score: 90,
        label: "Very High Score",
        color: "text-purple-600",
        ring: "border-purple-500",
      };
    if (val >= 15000)
      return {
        score: 70,
        label: "High Score",
        color: "text-amber-600",
        ring: "border-amber-500",
      };
    if (val >= 8000)
      return {
        score: 55,
        label: "Medium Score",
        color: "text-amber-500",
        ring: "border-amber-400",
      };
    return {
      score: 30,
      label: "Low Score",
      color: "text-blue-500",
      ring: "border-blue-400",
    };
  };

  // Lead tag badge helper
  const getLeadTag = (lead) => {
    const val =
      Number(lead?.expectedValue) ||
      Number(lead?.estimatedBudget) ||
      Number(lead?.estimatedValue) ||
      Number(lead?.legacyFinancials?.totalAmount) ||
      0;
    if (lead.priority === "URGENT")
      return { label: "HOT LEAD", icon: Flame, color: "text-rose-600" };
    if (val >= 30000)
      return { label: "HIGH TICKET", icon: Star, color: "text-purple-600" };
    if (["INTERESTED", "FOLLOW_UP"].includes(lead.status))
      return { label: "IN COOKING", icon: CookingPot, color: "text-amber-600" };
    if (lead.priority === "HIGH")
      return { label: "WARM LEAD", icon: Flame, color: "text-amber-500" };
    return { label: "NEW LEAD", icon: Sparkles, color: "text-blue-600" };
  };

  // Filtered leads by tab and search
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const matchesTab =
        activeTab === "ALL" ||
        (activeTab === "NEW" && l.status === "NEW") ||
        (activeTab === "CONTACTED" && l.status === "CONTACTED") ||
        (activeTab === "QUOTATION_SENT" && l.status === "QUOTATION_SENT") ||
        (activeTab === "NEGOTIATION" && l.status === "NEGOTIATION") ||
        (activeTab === "WON" && l.status === "WON") ||
        (activeTab === "LOST" && ["LOST", "NOT_INTERESTED"].includes(l.status));

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        (l.contactName || l.name || "").toLowerCase().includes(query) ||
        (l.businessName || l.companyName || "").toLowerCase().includes(query) ||
        (l.phone || "").includes(query) ||
        (l.requirement || "").toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [leads, activeTab, searchQuery]);

  // Create Lead Submit
  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (creatingLead) return;
    try {
      setCreatingLead(true);
      const assignedTarget = isManagerOrAdmin
        ? newLead.assignedToId || undefined
        : currentUser?._id || currentUser?.id || undefined;

      await api.post("/leads", {
        contactName: newLead.customerName,
        businessName: newLead.companyName,
        phone: newLead.phone,
        email: newLead.email,
        alternatePhone: newLead.alternatePhone,
        source: newLead.source,
        requirement: newLead.requirement,
        expectedValue: Number(newLead.expectedValue) || 0,
        priority: newLead.priority,
        assignedToId: assignedTarget,
        nextFollowUp: newLead.nextFollowUp || undefined,
        notes: newLead.notes,
      });

      setShowAddModal(false);
      setNewLead({
        customerName: "",
        companyName: "",
        phone: "",
        email: "",
        alternatePhone: "",
        source: "WEBSITE",
        requirement: "",
        expectedValue: "",
        priority: "HIGH",
        assignedToId: "",
        nextFollowUp: "",
        notes: "",
      });
      await loadDashboardData();
    } catch (err) {
      alert(err.message || "Failed to create lead");
    } finally {
      setCreatingLead(false);
    }
  };

  // Reassign Lead (Manager / Admin Only)
  const handleReassignLead = async (e) => {
    e.preventDefault();
    if (!selectedLead || !isManagerOrAdmin) return;
    try {
      await api.patch(`/leads/${selectedLead._id}/assign`, {
        targetUserId: reassignTargetId || null,
        notes: reassignNotes,
      });

      setShowReassignModal(false);
      setReassignTargetId("");
      setReassignNotes("");
      loadDashboardData();
    } catch (err) {
      alert(err.message || "Failed to reassign lead");
    }
  };

  // Schedule Follow-up Submit
  const handleScheduleFollowup = async (e) => {
    e.preventDefault();
    if (!selectedLead) return;
    try {
      await api.post("/followups", {
        leadId: selectedLead._id,
        customerId: selectedLead.customerId?._id || undefined,
        title: followupForm.title,
        scheduledAt: followupForm.scheduledAt,
        description: followupForm.description,
      });

      await api.patch(`/leads/${selectedLead._id}`, {
        nextFollowUp: followupForm.scheduledAt,
      });

      setShowFollowupModal(false);
      setFollowupForm({
        scheduledAt: "",
        title: "Follow-up Call",
        description: "",
      });
      loadDashboardData();
    } catch (err) {
      alert(err.message || "Failed to schedule follow-up");
    }
  };

  // Helper: Dynamically format Next Follow-up timestamp
  const formatNextFollowup = (dateStr) => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return null;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(
      target.getFullYear(),
      target.getMonth(),
      target.getDate(),
    );
    const diffDays = Math.round((targetDate - today) / (1000 * 60 * 60 * 24));

    const timeStr = target.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    if (diffDays === 0)
      return { label: `Today, ${timeStr}`, isOverdue: false, isToday: true };
    if (diffDays === 1)
      return {
        label: `Tomorrow, ${timeStr}`,
        isOverdue: false,
        isToday: false,
      };
    if (diffDays === -1)
      return { label: `Overdue (Yesterday)`, isOverdue: true, isToday: false };
    if (diffDays < -1)
      return {
        label: `Overdue (${Math.abs(diffDays)}d ago)`,
        isOverdue: true,
        isToday: false,
      };

    const monthDay = target.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return {
      label: `${monthDay}, ${timeStr}`,
      isOverdue: false,
      isToday: false,
    };
  };

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
          {/* Header & Main Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Leads Dashboard
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Track, manage &amp; convert your leads effectively
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => alert("Import leads CSV wizard ready.")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs hover:bg-slate-50 transition-all"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                Import Leads
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-semibold shadow-sm shadow-indigo-600/25 transition-all"
              >
                <Plus className="w-4 h-4" />+ Add Lead
              </button>
            </div>
          </div>

          {/* Pipeline Tabs Bar */}
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 overflow-x-auto">
            <div className="flex items-center gap-6 text-xs font-semibold">
              {TABS.map((tab) => {
                const count = computedMetrics[tab.countKey] || 0;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-2 transition-all relative whitespace-nowrap ${
                      isActive
                        ? "text-indigo-600 font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab.label} ({count})
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {}}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
            </button>
          </div>

          {/* 6 Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* Total Leads */}
            <div className="bg-white p-4 rounded-md border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">
                  Total Leads
                </span>
                <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <User className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {computedMetrics.total}
              </div>
              <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600">
                <span>{overviewMetrics.new} new this month</span>
              </div>
            </div>

            {/* Hot Leads */}
            <div className="bg-white p-4 rounded-md border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">
                  Hot Leads
                </span>
                <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Flame className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {computedMetrics.hotCount}
              </div>
              <div className="flex items-center gap-1 text-[10px] font-semibold text-rose-600">
                <span>
                  {computedMetrics.total > 0
                    ? `${Math.round((computedMetrics.hotCount / computedMetrics.total) * 100)}% of pipeline`
                    : "Immediate action"}
                </span>
              </div>
            </div>

            {/* In Cooking */}
            <div className="bg-white p-4 rounded-md border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">
                  In Cooking
                </span>
                <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <CookingPot className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {computedMetrics.inCooking}
              </div>
              <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                <span>Active discussions</span>
              </div>
            </div>

            {/* High Ticket */}
            <div className="bg-white p-4 rounded-md border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">
                  High Ticket
                </span>
                <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Star className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {computedMetrics.highTicketCount}
              </div>
              <div className="flex items-center gap-1 text-[10px] font-semibold text-purple-600">
                <span>
                  ₹{computedMetrics.highTicketTotalVal.toLocaleString("en-IN")}{" "}
                  pipeline
                </span>
              </div>
            </div>

            {/* Won Leads */}
            <div className="bg-white p-4 rounded-md border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">
                  Won Leads
                </span>
                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {computedMetrics.won}
              </div>
              <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                <span>
                  {computedMetrics.total > 0
                    ? `${Math.round((computedMetrics.won / computedMetrics.total) * 100)}% conversion`
                    : "0% conversion"}
                </span>
              </div>
            </div>

            {/* Total Expected Value */}
            <div className="bg-white p-4 rounded-md border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">
                  Total Expected Value
                </span>
                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                ₹{computedMetrics.totalExpectedVal.toLocaleString("en-IN")}
              </div>
              <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                <span>
                  Avg ₹
                  {computedMetrics.total > 0
                    ? Math.round(
                        computedMetrics.totalExpectedVal /
                          computedMetrics.total,
                      ).toLocaleString("en-IN")
                    : 0}
                  /lead
                </span>
              </div>
            </div>
          </div>

          {/* 2-Column Main Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Section: 3-column Lead Cards Grid */}
            <div className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredLeads.length > 0 ? (
                  filteredLeads.slice(0, visibleCount).map((lead) => {
                    const tagInfo = getLeadTag(lead);
                    const TagIcon = tagInfo.icon;
                    const scoreInfo = getLeadScore(lead);
                    const expVal =
                      Number(lead.expectedValue) ||
                      Number(lead.estimatedBudget) ||
                      Number(lead.estimatedValue) ||
                      Number(lead.legacyFinancials?.totalAmount) ||
                      0;

                    const nextFollowupItem = followups.find(
                      (f) =>
                        ((f.leadId?._id || f.leadId) === lead._id ||
                          (f.lead?._id || f.lead) === lead._id) &&
                        f.status === "PENDING",
                    );
                    const followupInfo = formatNextFollowup(
                      lead.nextFollowUp || nextFollowupItem?.scheduledAt,
                    );

                    return (
                      <div
                        key={lead._id}
                        className="bg-white rounded-md border border-slate-200/90 p-4 shadow-xs hover:shadow-md transition-all space-y-3.5 flex flex-col justify-between"
                      >
                        {/* Card Header Tag & Quick Action */}
                        <div>
                          <div className="flex items-center justify-between pb-1">
                            <div className="flex items-center gap-1.5">
                              <TagIcon
                                className={`w-3.5 h-3.5 ${tagInfo.color}`}
                              />
                              <span
                                className={`text-[10px] font-extrabold uppercase tracking-wider ${tagInfo.color}`}
                              >
                                {tagInfo.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              {isManagerOrAdmin && (
                                <button
                                  onClick={() => {
                                    setSelectedLead(lead);
                                    setReassignTargetId(
                                      lead.assignedToId?._id ||
                                        lead.assignedToId ||
                                        "",
                                    );
                                    setShowReassignModal(true);
                                  }}
                                  className="w-6 h-6 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 flex items-center justify-center transition-colors"
                                  title="Reassign Lead (Manager/Admin Only)"
                                >
                                  <UserCheck className="w-3 h-3" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/dashboard/whatsapp?customerId=${lead.customerId || lead._id}&leadId=${lead._id}&phone=${lead.phone || ""}`,
                                  );
                                }}
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-1 rounded-md transition-colors cursor-pointer"
                                title="Open WhatsApp Chat"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setShowFollowupModal(true);
                                }}
                                className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Company & Contact Name */}
                          <div className="pt-1">
                            <Link
                              href={`/dashboard/leads/${lead._id}`}
                              className="hover:text-indigo-600 transition-colors"
                            >
                              <h3 className="font-bold text-slate-900 text-sm leading-snug">
                                {lead.businessName ||
                                  lead.companyName ||
                                  lead.contactName ||
                                  "Direct Ingestion"}
                              </h3>
                            </Link>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                              {lead.contactName || "Primary Contact"}
                            </p>
                          </div>

                          {/* Value & Score Circle */}
                          <div className="flex items-center justify-between pt-3 pb-2 border-b border-slate-100">
                            <div>
                              <span className="text-lg font-black text-slate-900">
                                ₹{expVal.toLocaleString("en-IN")}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium block">
                                Expected Value
                              </span>
                            </div>

                            {/* Score Circle Gauge */}
                            <div className="text-center">
                              <div
                                className={`w-11 h-11 rounded-full border-2 flex items-center justify-center mx-auto ${scoreInfo.ring}`}
                              >
                                <span
                                  className={`text-xs font-black ${scoreInfo.color}`}
                                >
                                  {scoreInfo.score}
                                </span>
                              </div>
                              <span className="text-[9px] font-semibold text-slate-500 block mt-0.5">
                                {scoreInfo.label}
                              </span>
                            </div>
                          </div>

                          {/* Details Metadata */}
                          <div className="space-y-1.5 pt-2 text-[11px]">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-medium">
                                Assigned To:
                              </span>
                              <span className="text-slate-800 font-semibold truncate max-w-[130px]">
                                {lead.assignedToId?.name ||
                                  (typeof lead.assignedToId === "string"
                                    ? "Assigned"
                                    : "Unassigned")}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-medium">
                                Source:
                              </span>
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                                {(lead.source || "MANUAL").replace(/_/g, " ")}
                              </span>
                            </div>

                            <div className="flex items-start justify-between gap-2">
                              <span className="text-slate-400 font-medium shrink-0">
                                Requirement:
                              </span>
                              <span className="text-slate-700 font-medium text-right truncate">
                                {lead.requirement || "Flex Banner, Cards"}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-medium">
                                Last Contact:
                              </span>
                              <span className="text-slate-700 font-medium">
                                {lead.lastContactedAt
                                  ? new Date(
                                      lead.lastContactedAt,
                                    ).toLocaleDateString()
                                  : "No Contact Yet"}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-medium">
                                Next Follow-up:
                              </span>
                              {followupInfo ? (
                                <span
                                  className={`text-[11px] font-bold ${
                                    followupInfo.isOverdue
                                      ? "text-rose-600"
                                      : followupInfo.isToday
                                        ? "text-blue-600"
                                        : "text-amber-700"
                                  }`}
                                  title={new Date(
                                    lead.nextFollowUp ||
                                      nextFollowupItem?.scheduledAt,
                                  ).toLocaleString()}
                                >
                                  {followupInfo.label}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedLead(lead);
                                    setShowFollowupModal(true);
                                  }}
                                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold hover:underline cursor-pointer"
                                >
                                  + Schedule
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Stage Progress Pill */}
                        <div className="pt-2">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                            <span>{lead.status || "Negotiation"}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                lead.status === "WON"
                                  ? "bg-emerald-500 w-full"
                                  : lead.status === "QUOTATION_SENT"
                                    ? "bg-blue-600 w-3/4"
                                    : lead.status === "INTERESTED"
                                      ? "bg-amber-500 w-1/2"
                                      : lead.status === "NEGOTIATION"
                                        ? "bg-purple-600 w-5/6"
                                        : "bg-indigo-500 w-1/4"
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-3 py-16 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200">
                    No leads matching current filters. Click &quot;+ Add
                    Lead&quot; to register an inquiry.
                  </div>
                )}
              </div>

              {/* Load More Button */}
              {visibleCount < filteredLeads.length && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 6)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer py-1.5 px-3 rounded-lg hover:bg-indigo-50"
                  >
                    Load More Leads ({filteredLeads.length - visibleCount}{" "}
                    remaining) <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Right Section: 3 Side Widget Cards */}
            <div className="lg:col-span-4 space-y-4">
              {/* Widget 1: Hot Leads (Act Now!) */}
              <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-xs">
                    Hot Leads (Act Now!)
                  </h3>
                  <button
                    onClick={() => setActiveTab("ALL")}
                    className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-3">
                  {computedMetrics.hotLeadsList.length > 0 ? (
                    computedMetrics.hotLeadsList.map((hl) => {
                      const hlVal = hl.expectedValue || hl.estimatedBudget || 0;
                      const scoreInfo = getLeadScore(hl);
                      const timeDisplay = formatFriendlyTime(
                        hl.createdAt || hl.updatedAt,
                      );

                      return (
                        <div
                          key={hl._id}
                          className="flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                              {(hl.contactName || hl.businessName || "HL")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div className="truncate">
                              <Link
                                href={`/dashboard/leads/${hl._id}`}
                                className="font-bold text-slate-900 block text-[11px] truncate hover:text-indigo-600"
                              >
                                {hl.businessName || hl.contactName}
                              </Link>
                              <span className="text-[10px] text-slate-400">
                                {timeDisplay}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="font-bold text-slate-900 text-[11px]">
                              ₹{hlVal.toLocaleString("en-IN")}
                            </span>
                            <div
                              className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-black ${scoreInfo.ring} ${scoreInfo.color}`}
                              title={`${scoreInfo.label} (${scoreInfo.score})`}
                            >
                              {scoreInfo.score}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-slate-400 text-xs text-center py-4">
                      No active hot leads.
                    </div>
                  )}
                </div>
              </div>

              {/* Widget 2: Lead Status Overview Donut Chart */}
              <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-xs">
                    Lead Status Overview
                  </h3>
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="bg-transparent text-[11px] font-semibold text-slate-500 focus:outline-none cursor-pointer"
                  >
                    <option value="This Month">This Month</option>
                    <option value="This Week">This Week</option>
                    <option value="Today">Today</option>
                    <option value="All Time">All Time</option>
                  </select>
                </div>

                {/* Donut Chart Representation */}
                <div className="flex items-center justify-between gap-4">
                  <div
                    className="relative w-24 h-24 rounded-full p-2.5 flex items-center justify-center shrink-0 shadow-xs transition-all duration-500"
                    style={{ background: donutGradient }}
                  >
                    <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center text-center shadow-xs">
                      <span className="text-base font-black text-slate-900 leading-tight">
                        {overviewMetrics.total}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">
                        Total Leads
                      </span>
                    </div>
                  </div>

                  {/* Legend Breakdown */}
                  <div className="space-y-1 text-[10px] font-medium flex-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />{" "}
                        New
                      </span>
                      <strong className="text-slate-800">
                        {overviewMetrics.new} ({overviewMetrics.pct.new}%)
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />{" "}
                        Contacted
                      </span>
                      <strong className="text-slate-800">
                        {overviewMetrics.contacted} (
                        {overviewMetrics.pct.contacted}%)
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-blue-500" /> In
                        Cooking
                      </span>
                      <strong className="text-slate-800">
                        {overviewMetrics.inCooking} (
                        {overviewMetrics.pct.inCooking}%)
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />{" "}
                        Proposal Sent
                      </span>
                      <strong className="text-slate-800">
                        {overviewMetrics.proposal} (
                        {overviewMetrics.pct.proposal}%)
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-green-500" />{" "}
                        Won
                      </span>
                      <strong className="text-slate-800">
                        {overviewMetrics.won} ({overviewMetrics.pct.won}%)
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />{" "}
                        Lost
                      </span>
                      <strong className="text-slate-800">
                        {overviewMetrics.lost} ({overviewMetrics.pct.lost}%)
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Widget 3: Follow-up Due Today */}
              <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-xs">
                    Follow-up Due Today ({todayFollowups.length})
                  </h3>
                  <Link
                    href="/dashboard/followups"
                    className="text-[11px] font-bold text-indigo-600 hover:underline"
                  >
                    View All
                  </Link>
                </div>

                <div className="space-y-3">
                  {todayFollowups.length > 0 ? (
                    <>
                      {todayFollowups.slice(0, 4).map((flw) => {
                        const timeStr =
                          flw.scheduledAt || flw.dueAt || flw.date;
                        const timeDisplay = timeStr
                          ? `Today, ${new Date(timeStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                          : "Today";
                        const leadObj =
                          flw.leadId && typeof flw.leadId === "object"
                            ? flw.leadId
                            : null;
                        const leadTitle =
                          flw.title ||
                          leadObj?.contactName ||
                          leadObj?.businessName ||
                          "Follow-up Task";
                        const statusLabel = flw.status || "SCHEDULED";

                        return (
                          <div
                            key={flw._id}
                            className="flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                                <CheckCircle2 className="w-3 h-3" />
                              </div>
                              <div className="truncate">
                                <strong className="text-slate-900 block text-[11px] truncate">
                                  {leadTitle}
                                </strong>
                                <span className="text-[10px] text-slate-400">
                                  {timeDisplay}
                                </span>
                              </div>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                                statusLabel === "COMPLETED"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : statusLabel === "OVERDUE"
                                    ? "bg-rose-50 text-rose-700"
                                    : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {statusLabel.replace(/_/g, " ")}
                            </span>
                          </div>
                        );
                      })}

                      {todayFollowups.length > 4 && (
                        <div className="pt-1 text-center">
                          <Link
                            href="/dashboard/followups"
                            className="text-[11px] font-bold text-indigo-600 hover:underline"
                          >
                            +{todayFollowups.length - 4} more follow-ups
                          </Link>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-5 text-slate-400">
                      <Clock className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                      <p className="text-[11px] font-medium text-slate-500">
                        No follow-ups due today
                      </p>
                      <Link
                        href="/dashboard/followups"
                        className="text-[10px] font-bold text-indigo-600 hover:underline mt-1 inline-block"
                      >
                        View all follow-ups ({followups.length})
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* CREATE LEAD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Add New Lead
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Raj Sharma"
                    value={newLead.customerName}
                    onChange={(e) =>
                      setNewLead({ ...newLead, customerName: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Company / Brand Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sharma Constructions"
                    value={newLead.companyName}
                    onChange={(e) =>
                      setNewLead({ ...newLead, companyName: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={newLead.phone}
                    onChange={(e) =>
                      setNewLead({ ...newLead, phone: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Expected Value (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="25000"
                    value={newLead.expectedValue}
                    onChange={(e) =>
                      setNewLead({ ...newLead, expectedValue: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Printing Requirement
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Flex Banner, Visiting Cards with velvet lamination"
                  value={newLead.requirement}
                  onChange={(e) =>
                    setNewLead({ ...newLead, requirement: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Lead Source
                  </label>
                  <select
                    value={newLead.source}
                    onChange={(e) =>
                      setNewLead({ ...newLead, source: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                  >
                    <option value="WALK_IN">Walk-In / Store Visit</option>
                    <option value="PHONE_CALL">Phone Call</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="WEBSITE">Website Inquiry</option>
                    <option value="REFERRAL">Referral</option>
                    <option value="GOOGLE">Google Search / Maps</option>
                    <option value="INDIAMART">IndiaMART</option>
                    <option value="META_ADS">Meta Ads (FB/IG)</option>
                    <option value="FACEBOOK">Facebook</option>
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="MANUAL">Manual Entry</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Priority
                  </label>
                  <select
                    value={newLead.priority}
                    onChange={(e) =>
                      setNewLead({ ...newLead, priority: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High (Warm)</option>
                    <option value="URGENT">Urgent (Hot Lead)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1 flex items-center justify-between">
                  <span>Assign To</span>
                  {!isManagerOrAdmin && (
                    <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Auto-assigned to you
                    </span>
                  )}
                </label>
                {isManagerOrAdmin ? (
                  <select
                    value={newLead.assignedToId}
                    onChange={(e) =>
                      setNewLead({ ...newLead, assignedToId: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.roleSlug || u.role})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                        {(currentUser?.name || "ME").slice(0, 2).toUpperCase()}
                      </div>
                      <span className="truncate">
                        {currentUser?.name || "Current User"} (You)
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                      Locked
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1 flex items-center justify-between">
                  <span>Schedule Next Follow-up</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Optional date &amp; time
                  </span>
                </label>
                <input
                  type="datetime-local"
                  value={newLead.nextFollowUp}
                  onChange={(e) =>
                    setNewLead({ ...newLead, nextFollowUp: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={creatingLead}
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingLead}
                  className={`px-5 py-2 rounded-xl text-white font-semibold shadow-md flex items-center justify-center gap-2 transition-all ${
                    creatingLead
                      ? "bg-indigo-400 cursor-not-allowed opacity-90 shadow-none"
                      : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"
                  }`}
                >
                  {creatingLead ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Creating Lead...</span>
                    </>
                  ) : (
                    <span>Create Lead</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REASSIGN LEAD MODAL (Manager / Admin Only) */}
      {showReassignModal && selectedLead && isManagerOrAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                Reassign Lead
              </h3>
              <button
                onClick={() => setShowReassignModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReassignLead} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                  Selected Lead
                </span>
                <strong className="text-slate-900 text-sm block mt-0.5">
                  {selectedLead.businessName ||
                    selectedLead.contactName ||
                    "Lead"}{" "}
                  ({selectedLead.phone})
                </strong>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Currently Assigned To:{" "}
                  <strong className="text-slate-700">
                    {selectedLead.assignedToId?.name || "Unassigned"}
                  </strong>
                </span>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Assign To Executive *
                </label>
                <select
                  required
                  value={reassignTargetId}
                  onChange={(e) => setReassignTargetId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium"
                >
                  <option value="">Select Sales Person</option>
                  {users
                    .filter((u) => {
                      const r = (u.roleSlug || u.role || "")
                        .toLowerCase()
                        .trim();
                      if (
                        r.includes("admin") ||
                        r === "manager" ||
                        r === "designer" ||
                        r === "customer" ||
                        r === "operator" ||
                        r === "delivery"
                      )
                        return false;
                      return r === "sales" || r === "employee";
                    })
                    .map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.roleSlug || u.role})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Reassignment Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={reassignNotes}
                  onChange={(e) => setReassignNotes(e.target.value)}
                  placeholder="Reason or instructions for the new executive..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReassignModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20"
                >
                  Confirm Reassignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE FOLLOWUP MODAL */}
      {showFollowupModal && selectedLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Schedule Follow-up
              </h3>
              <button
                onClick={() => setShowFollowupModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleScheduleFollowup}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Follow-up Title *
                </label>
                <input
                  type="text"
                  required
                  value={followupForm.title}
                  onChange={(e) =>
                    setFollowupForm({ ...followupForm, title: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={followupForm.scheduledAt}
                  onChange={(e) =>
                    setFollowupForm({
                      ...followupForm,
                      scheduledAt: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Agenda / Description
                </label>
                <textarea
                  rows={2}
                  value={followupForm.description}
                  onChange={(e) =>
                    setFollowupForm({
                      ...followupForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFollowupModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-md"
                >
                  Schedule Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
