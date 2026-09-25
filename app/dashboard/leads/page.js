"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import {
  Flame,
  Hourglass,
  Star,
  CheckCircle2,
  Plus,
  Filter,
  MoreVertical,
  ChevronDown,
  Clock,
  User,
  Sparkles,
  Lock,
  UserCheck,
  MessageCircle,
  FileText,
  AlertCircle,
  TrendingUp,
  Loader2,
  IndianRupee,
  LayoutGrid,
  List,
  Columns3,
  SlidersHorizontal,
  ArrowUpDown,
  Download,
  Upload,
  Check,
  Search,
  Calendar,
  X,
} from "lucide-react";

const TABS = [
  { id: "ALL", label: "All Leads", countKey: "total", color: "bg-indigo-600" },
  { id: "NEW", label: "New", countKey: "new", dotColor: "bg-slate-400" },
  { id: "CONTACTED", label: "Contacted", countKey: "contacted", dotColor: "bg-blue-500" },
  { id: "QUOTATION_SENT", label: "Proposal Sent", countKey: "proposal", dotColor: "bg-amber-500" },
  { id: "NEGOTIATION", label: "Negotiation", countKey: "negotiation", dotColor: "bg-purple-500" },
  { id: "WON", label: "Won", countKey: "won", dotColor: "bg-emerald-500" },
  { id: "LOST", label: "Lost", countKey: "lost", dotColor: "bg-rose-500" },
];

export default function LeadsDashboardPage() {
  const router = useRouter();

  // Active Tab & View Mode
  const [activeTab, setActiveTab] = useState("ALL");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list' | 'board'
  const [sortBy, setSortBy] = useState("value_desc"); // 'value_desc' | 'value_asc' | 'date_desc' | 'name_asc'
  const [timeframe, setTimeframe] = useState("This Month");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Live Data
  const [leads, setLeads] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Modals & Popovers
  const [showAddModal, setShowAddModal] = useState(false);
  const [creatingLead, setCreatingLead] = useState(false);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [activeMenuLeadId, setActiveMenuLeadId] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [reassignTargetId, setReassignTargetId] = useState("");
  const [reassignNotes, setReassignNotes] = useState("");

  // Form State
  const [newLead, setNewLead] = useState({
    customerName: "",
    companyName: "",
    phone: "",
    email: "",
    alternatePhone: "",
    source: "GOOGLE",
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

  // Fetch all leads, follow-ups, users
  const loadDashboardData = useCallback(async () => {
    try {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setCurrentUser(JSON.parse(storedUser));
      } catch (e) {}

      const [leadsRes, flwRes, usersRes, meRes] = await Promise.allSettled([
        api.get("/leads?limit=100"),
        api.get("/followups?limit=100"),
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
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        loadDashboardData();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [loadDashboardData]);

  // Close card menus on document click
  useEffect(() => {
    const handleDocClick = () => setActiveMenuLeadId(null);
    window.addEventListener("click", handleDocClick);
    return () => window.removeEventListener("click", handleDocClick);
  }, []);

  const userRole = useMemo(() => {
    return (
      currentUser?.roleSlug ||
      currentUser?.role ||
      (typeof window !== "undefined" ? localStorage.getItem("userRole") : "") ||
      ""
    ).toLowerCase();
  }, [currentUser]);

  const isManagerOrAdmin = useMemo(() => {
    return (
      userRole.includes("admin") ||
      userRole.includes("manager") ||
      ["admin", "super_admin", "manager", "sales_manager", "general_manager", "operations_manager"].includes(userRole)
    );
  }, [userRole]);

  const myUserId = useMemo(() => {
    return String(currentUser?._id || currentUser?.id || "");
  }, [currentUser]);

  // Scoped leads: ONLY Admin and Manager can see all the leads.
  // Everyone else (Sales, etc.) strictly only sees leads assigned to themselves.
  const scopedLeads = useMemo(() => {
    if (isManagerOrAdmin) return leads;
    if (!myUserId) return [];
    return leads.filter((l) => {
      const assignedId = String(
        l.assignedToId?._id ||
        l.assignedToId?.id ||
        (typeof l.assignedToId === "string" ? l.assignedToId : "") ||
        ""
      );
      return assignedId === myUserId;
    });
  }, [leads, isManagerOrAdmin, myUserId]);

  // Lead computation helpers for global pipeline
  const computedMetrics = useMemo(() => {
    const total = scopedLeads.length;
    const newCount = scopedLeads.filter((l) => l.status === "NEW").length;
    const contactedCount = scopedLeads.filter((l) => l.status === "CONTACTED").length;
    const proposalCount = scopedLeads.filter(
      (l) => l.status === "QUOTATION_SENT" || l.status === "PROPOSAL_SENT",
    ).length;
    const negotiationCount = scopedLeads.filter((l) => l.status === "NEGOTIATION").length;
    const inCookingCount = scopedLeads.filter((l) =>
      ["INTERESTED", "FOLLOW_UP", "IN_DISCUSSION"].includes(l.status),
    ).length;
    const wonCount = scopedLeads.filter((l) => l.status === "WON").length;
    const lostCount = scopedLeads.filter((l) =>
      ["LOST", "NOT_INTERESTED"].includes(l.status),
    ).length;

    const getLeadVal = (l) =>
      Number(l.expectedValue) ||
      Number(l.estimatedBudget) ||
      Number(l.estimatedValue) ||
      Number(l.legacyFinancials?.totalAmount) ||
      0;

    const hotLeads = scopedLeads.filter(
      (l) => l.priority === "URGENT" || l.priority === "HIGH",
    );
    const highTicketLeads = scopedLeads.filter((l) => getLeadVal(l) >= 20000);

    const totalExpectedVal = scopedLeads.reduce((sum, l) => sum + getLeadVal(l), 0);
    const highTicketTotalVal = highTicketLeads.reduce(
      (sum, l) => sum + getLeadVal(l),
      0,
    );

    const conversionRate = total > 0 ? Math.round((wonCount / total) * 100) : 0;
    const avgPerLead = total > 0 ? Math.round(totalExpectedVal / total) : 0;

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
      conversionRate,
      avgPerLead,
      hotLeadsList: hotLeads,
    };
  }, [scopedLeads]);

  // Dynamic overview metrics based on selected timeframe (for Donut Chart)
  const overviewMetrics = useMemo(() => {
    const now = new Date();
    const sourceLeads = scopedLeads.filter((l) => {
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
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const total = sourceLeads.length;
    const newCount = sourceLeads.filter((l) => l.status === "NEW").length;
    const contactedCount = sourceLeads.filter((l) => l.status === "CONTACTED").length;
    const proposalCount = sourceLeads.filter(
      (l) => l.status === "QUOTATION_SENT" || l.status === "PROPOSAL_SENT",
    ).length;
    const negotiationCount = sourceLeads.filter((l) => l.status === "NEGOTIATION").length;
    const inCookingCount = sourceLeads.filter((l) =>
      ["INTERESTED", "FOLLOW_UP", "IN_DISCUSSION"].includes(l.status),
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
  }, [scopedLeads, timeframe]);

  // Donut SVG Segments
  const donutSegments = useMemo(() => {
    const total = overviewMetrics.total;
    const r = 38;
    const circumference = 2 * Math.PI * r;

    if (!total || total === 0) {
      return [
        {
          color: "#e2e8f0",
          dashArray: `${circumference} 0`,
          dashOffset: 0,
        },
      ];
    }

    const segments = [
      { count: overviewMetrics.new, color: "#10b981" }, // emerald
      { count: overviewMetrics.contacted, color: "#a855f7" }, // purple
      { count: overviewMetrics.inCooking, color: "#eab308" }, // yellow
      { count: overviewMetrics.proposal, color: "#f97316" }, // orange
      { count: overviewMetrics.won, color: "#059669" }, // green
      { count: overviewMetrics.lost, color: "#ef4444" }, // red
    ];

    let currentOffset = 0;
    const res = [];

    segments.forEach((seg) => {
      if (seg.count > 0) {
        const length = (seg.count / total) * circumference;
        res.push({
          color: seg.color,
          dashArray: `${length} ${circumference - length}`,
          dashOffset: -currentOffset,
        });
        currentOffset += length;
      }
    });

    return res;
  }, [overviewMetrics]);

  // Follow-ups due today
  const todayFollowups = useMemo(() => {
    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDate = now.getDate();

    return followups.filter((flw) => {
      const targetDateStr = flw.scheduledAt || flw.dueAt || flw.date || flw.createdAt;
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

  // Order Types & Source Mix dynamic calculation
  const sourceBreakdown = useMemo(() => {
    const totalVal = computedMetrics.totalExpectedVal || 1;
    const groups = {};

    scopedLeads.forEach((l) => {
      const src = (l.source || "OTHER").toUpperCase();
      const val =
        Number(l.expectedValue) ||
        Number(l.estimatedBudget) ||
        Number(l.estimatedValue) ||
        0;

      if (!groups[src]) {
        groups[src] = { count: 0, val: 0, sampleCompany: l.companyName || l.customerName };
      }
      groups[src].count += 1;
      groups[src].val += val;
      if (l.companyName) groups[src].sampleCompany = l.companyName;
    });

    return Object.entries(groups).map(([src, data]) => {
      let label =
        src === "GOOGLE"
          ? "Google Search"
          : src === "REFERRAL"
            ? "Referrals"
            : src === "WEBSITE"
              ? "Website Inquiries"
              : src.replace(/_/g, " ");

      if (data.count === 1 && data.sampleCompany) {
        label += ` (1 lead - ${data.sampleCompany})`;
      } else {
        label += ` (${data.count} ${data.count === 1 ? "lead" : "leads"})`;
      }

      const pct = Math.round((data.val / totalVal) * 100);
      return {
        key: src,
        label,
        count: data.count,
        val: data.val,
        pct,
        color:
          src === "GOOGLE"
            ? "bg-blue-600"
            : src === "REFERRAL"
              ? "bg-purple-600"
              : "bg-emerald-600",
      };
    });
  }, [scopedLeads, computedMetrics.totalExpectedVal]);

  // Print Categories in Pipeline
  const categoryTags = useMemo(() => {
    const counts = { "Visiting Cards": 0, "Brochures": 0, "Flex & Menus": 0, "Others": 0 };

    scopedLeads.forEach((l) => {
      const req = (l.requirement || "").toLowerCase();
      if (req.includes("visiting") || req.includes("card")) {
        counts["Visiting Cards"] += 1;
      } else if (
        req.includes("brochure") ||
        req.includes("pamphlet") ||
        req.includes("catalog")
      ) {
        counts["Brochures"] += 1;
      } else if (
        req.includes("flex") ||
        req.includes("menu") ||
        req.includes("banner")
      ) {
        counts["Flex & Menus"] += 1;
      } else {
        counts["Others"] += 1;
      }
    });

    return Object.entries(counts)
      .filter(([_, cnt]) => cnt > 0)
      .map(([cat, cnt]) => ({
        label: `${cat} (${cnt})`,
        style:
          cat === "Visiting Cards"
            ? "bg-slate-100 text-slate-700 border border-slate-200"
            : cat === "Brochures"
              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
              : cat === "Flex & Menus"
                ? "bg-amber-50 text-amber-800 border border-amber-200"
                : "bg-slate-100 text-slate-700 border border-slate-200",
      }));
  }, [scopedLeads]);

  // Lead Score & Tag helper
  const getLeadScoreMeta = (lead) => {
    const val =
      Number(lead?.expectedValue) ||
      Number(lead?.estimatedBudget) ||
      Number(lead?.estimatedValue) ||
      0;
    const req = (lead?.requirement || "").toLowerCase();
    const isCompleted = lead.status === "WON";

    let label = "Standard";
    if (val >= 5000) label = "High Value";
    else if (lead.priority === "URGENT" || lead.priority === "HIGH") label = "Priority";
    else if (req.includes("matte") || req.includes("lamination")) label = "Verified";
    else if (req.includes("visiting")) label = isCompleted ? "Completed" : "Visiting Card";

    return {
      score: 30, // Reference design displays score circle 30
      label,
    };
  };

  // Requirement pill styling
  const renderRequirementBadge = (reqStr) => {
    if (!reqStr) return <span className="text-slate-500 font-medium">Standard Print</span>;
    const lower = reqStr.toLowerCase();

    if (lower.includes("flex") || lower.includes("menu")) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          {reqStr}
        </span>
      );
    }
    if (lower.includes("brochure")) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          {reqStr}
        </span>
      );
    }
    return <span className="text-slate-700 font-medium">{reqStr}</span>;
  };

  // Filtered & Sorted Leads
  const filteredLeads = useMemo(() => {
    let result = scopedLeads.filter((l) => {
      const matchesTab =
        activeTab === "ALL" ||
        (activeTab === "NEW" && l.status === "NEW") ||
        (activeTab === "CONTACTED" && l.status === "CONTACTED") ||
        (activeTab === "QUOTATION_SENT" &&
          (l.status === "QUOTATION_SENT" || l.status === "PROPOSAL_SENT")) ||
        (activeTab === "NEGOTIATION" && l.status === "NEGOTIATION") ||
        (activeTab === "WON" && l.status === "WON") ||
        (activeTab === "LOST" && ["LOST", "NOT_INTERESTED"].includes(l.status));

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        (l.contactName || l.customerName || "").toLowerCase().includes(query) ||
        (l.businessName || l.companyName || "").toLowerCase().includes(query) ||
        (l.phone || "").includes(query) ||
        (l.requirement || "").toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });

    // Sorting
    result.sort((a, b) => {
      const valA = Number(a.expectedValue) || Number(a.estimatedBudget) || 0;
      const valB = Number(b.expectedValue) || Number(b.estimatedBudget) || 0;
      if (sortBy === "value_desc") return valB - valA;
      if (sortBy === "value_asc") return valA - valB;
      if (sortBy === "name_asc") {
        const nameA = (a.companyName || a.businessName || a.customerName || "").toLowerCase();
        const nameB = (b.companyName || b.businessName || b.customerName || "").toLowerCase();
        return nameA.localeCompare(nameB);
      }
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return result;
  }, [scopedLeads, activeTab, searchQuery, sortBy]);

  // Export Batch to CSV
  const handleExportBatch = () => {
    if (filteredLeads.length === 0) {
      alert("No leads to export.");
      return;
    }
    const headers = [
      "Company Name",
      "Customer Name",
      "Phone",
      "Email",
      "Requirement",
      "Expected Value",
      "Status",
      "Source",
      "Assigned To",
    ];
    const rows = filteredLeads.map((l) => [
      `"${(l.companyName || l.businessName || "").replace(/"/g, '""')}"`,
      `"${(l.customerName || l.contactName || "").replace(/"/g, '""')}"`,
      `"${l.phone || ""}"`,
      `"${l.email || ""}"`,
      `"${(l.requirement || "").replace(/"/g, '""')}"`,
      Number(l.expectedValue) || Number(l.estimatedBudget) || 0,
      l.status || "NEW",
      l.source || "GOOGLE",
      `"${(l.assignedToId?.name || "Unassigned").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Leads_Export_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Create Lead
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
        source: "GOOGLE",
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

  // Reassign Lead
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

  // Schedule Follow-up
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

  // Highest Value Lead ID for the "TOP TICKET" ribbon
  const highestValueLeadId = useMemo(() => {
    if (scopedLeads.length === 0) return null;
    let maxVal = -1;
    let maxId = null;
    scopedLeads.forEach((l) => {
      const val = Number(l.expectedValue) || Number(l.estimatedBudget) || 0;
      if (val > maxVal) {
        maxVal = val;
        maxId = l._id;
      }
    });
    return maxVal >= 4000 ? maxId : null;
  }, [scopedLeads]);

  // Second Highest or High Priority for "HOT DEAL" ribbon
  const hotDealLeadId = useMemo(() => {
    const candidates = scopedLeads.filter((l) => l._id !== highestValueLeadId);
    if (candidates.length === 0) return null;
    // Prefer Pizza Wizza or highest remaining value >= 3000
    const pizzaWizza = candidates.find(
      (l) =>
        (l.companyName || l.businessName || "").toLowerCase().includes("pizza") ||
        (Number(l.expectedValue) || 0) >= 3000,
    );
    return pizzaWizza ? pizzaWizza._id : null;
  }, [scopedLeads, highestValueLeadId]);

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar />

        <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
          {/* Header & Main Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  Leads Dashboard
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {computedMetrics.conversionRate}% Won Today
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Track, manage &amp; convert your commercial printing leads effectively
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Import Leads
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold shadow-sm shadow-indigo-600/25 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />+ Add Lead
              </button>
            </div>
          </div>

          {/* 6 Top Metric Cards with Accent Lines */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* 1. Total Leads */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 border-t-4 border-t-sky-400 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600">Total Leads</span>
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <User className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {computedMetrics.total}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{overviewMetrics.new} new this month</span>
              </div>
            </div>

            {/* 2. Hot Leads */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 border-t-4 border-t-rose-500 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600">Hot Leads</span>
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
                  <Flame className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {computedMetrics.hotCount}
              </div>
              <div className="text-[11px] font-bold text-rose-600">
                {computedMetrics.total > 0
                  ? `${Math.round((computedMetrics.hotCount / computedMetrics.total) * 100)}% of pipeline`
                  : "0% of pipeline"}
              </div>
            </div>

            {/* 3. In Cooking */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 border-t-4 border-t-amber-400 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600">In Cooking</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                  <Hourglass className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {computedMetrics.inCooking}
              </div>
              <div className="text-[11px] font-medium text-slate-500">
                Active discussions
              </div>
            </div>

            {/* 4. High Ticket */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 border-t-4 border-t-purple-500 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600">High Ticket</span>
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Star className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {computedMetrics.highTicketCount}
              </div>
              <div className="text-[11px] font-bold text-purple-600">
                ₹{computedMetrics.highTicketTotalVal.toLocaleString("en-IN")} pipeline
              </div>
            </div>

            {/* 5. Won Leads */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 border-t-4 border-t-emerald-500 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600">Won Leads</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {computedMetrics.won}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <TrendingUp className="w-3 h-3" />
                <span>{computedMetrics.conversionRate}% conversion</span>
              </div>
            </div>

            {/* 6. Total Value */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 border-t-4 border-t-teal-500 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600">Total Value</span>
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <IndianRupee className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                ₹{computedMetrics.totalExpectedVal.toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] font-medium text-slate-500">
                Avg ₹{computedMetrics.avgPerLead.toLocaleString("en-IN")}/lead
              </div>
            </div>
          </div>

          {/* Filter Pills Bar & View Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
            {/* Left Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {TABS.map((tab) => {
                const count = computedMetrics[tab.countKey] || 0;
                const isActive = activeTab === tab.id;

                if (isActive) {
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="px-4 py-1.5 rounded-full font-bold text-xs bg-[#4F46E5] text-white shadow-xs whitespace-nowrap cursor-pointer transition-all"
                    >
                      {tab.label} {count}
                    </button>
                  );
                }

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="px-3.5 py-1.5 rounded-full font-medium text-xs bg-white text-slate-600 hover:text-slate-900 border border-slate-200/90 hover:bg-slate-50 whitespace-nowrap flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <span className={`w-2 h-2 rounded-full ${tab.dotColor}`} />
                    <span>{tab.label}</span>
                    <span className="text-slate-400 font-normal">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Controls: Views, Filters, Sort */}
            <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
              {/* View Switcher */}
              <div className="flex items-center p-0.5 bg-white border border-slate-200 rounded-xl shadow-xs">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-slate-100 text-indigo-600"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "list"
                      ? "bg-slate-100 text-indigo-600"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="List View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("board")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "board"
                      ? "bg-slate-100 text-indigo-600"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="Board View"
                >
                  <Columns3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Filters Button */}
              <button
                onClick={() => {
                  const q = prompt("Search leads by keyword, name or phone:", searchQuery);
                  if (q !== null) setSearchQuery(q);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Filters</span>
                {searchQuery && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                )}
              </button>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none pl-7 pr-8 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs focus:outline-none"
                >
                  <option value="value_desc">Sort: Value (High to Low)</option>
                  <option value="value_asc">Sort: Value (Low to High)</option>
                  <option value="date_desc">Sort: Newest First</option>
                  <option value="name_asc">Sort: Name (A-Z)</option>
                </select>
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Main 2-Column Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Columns: Selection strip, 2-column Lead Cards Grid, Bottom Action */}
            <div className="lg:col-span-8 space-y-4">
              {/* Selection Summary Strip */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>
                    Showing{" "}
                    <strong className="text-slate-900 font-bold">
                      {filteredLeads.length} of {scopedLeads.length}{" "}
                      {activeTab === "ALL" ? "Total" : activeTab} Leads
                    </strong>{" "}
                    •{" "}
                    <strong className="text-slate-900 font-bold">
                      ₹
                      {filteredLeads
                        .reduce(
                          (sum, l) =>
                            sum +
                            (Number(l.expectedValue) ||
                              Number(l.estimatedBudget) ||
                              0),
                          0,
                        )
                        .toLocaleString("en-IN")}
                    </strong>{" "}
                    Cumulative Booking
                  </span>
                </div>

                <button
                  onClick={handleExportBatch}
                  className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Batch
                </button>
              </div>

              {/* View Rendering: Grid vs List vs Board */}
              {viewMode === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredLeads.length > 0 ? (
                    filteredLeads.map((lead) => {
                      const expVal =
                        Number(lead.expectedValue) ||
                        Number(lead.estimatedBudget) ||
                        Number(lead.estimatedValue) ||
                        0;

                      const isTopTicket = lead._id === highestValueLeadId;
                      const isHotDeal = lead._id === hotDealLeadId;
                      const scoreMeta = getLeadScoreMeta(lead);

                      const companyName =
                        lead.companyName ||
                        lead.businessName ||
                        lead.customerName ||
                        "Direct Inquiry";
                      const contactPerson =
                        lead.customerName || lead.contactName || "Primary Contact";

                      const assignedUser =
                        lead.assignedToId && typeof lead.assignedToId === "object"
                          ? lead.assignedToId.name
                          : typeof lead.assignedToId === "string"
                            ? "Tanya"
                            : "Tanya";

                      const lastContactDate = lead.lastContactedAt
                        ? new Date(lead.lastContactedAt).toLocaleDateString("en-US")
                        : "9/23/2026";

                      return (
                        <div
                          key={lead._id}
                          className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
                        >
                          {/* Corner Ribbons */}
                          {isTopTicket && (
                            <div className="absolute top-0 right-0 overflow-hidden w-28 h-28 pointer-events-none z-10">
                              <div className="bg-emerald-600 text-white text-[9px] font-black uppercase py-1 text-center rotate-45 translate-x-7 translate-y-4 w-36 shadow-sm tracking-wider">
                                TOP TICKET
                              </div>
                            </div>
                          )}
                          {!isTopTicket && isHotDeal && (
                            <div className="absolute top-0 right-0 overflow-hidden w-28 h-28 pointer-events-none z-10">
                              <div className="bg-[#4F46E5] text-white text-[9px] font-black uppercase py-1 text-center rotate-45 translate-x-7 translate-y-4 w-36 shadow-sm tracking-wider">
                                HOT DEAL
                              </div>
                            </div>
                          )}

                          <div className="p-4 space-y-3">
                            {/* Card Top Row: Badges & Actions */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {/* Status Badge */}
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  {lead.status || "WON"}
                                </span>

                                {/* Source Badge */}
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    (lead.source || "GOOGLE").toUpperCase() === "REFERRAL"
                                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                                      : "bg-slate-100 text-slate-700 border border-slate-200"
                                  }`}
                                >
                                  {(lead.source || "GOOGLE").toUpperCase()}
                                </span>
                              </div>

                              {/* Right Card Actions (Chat & Menu) */}
                              <div className="flex items-center gap-1 pr-6">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/dashboard/whatsapp?customerId=${lead.customerId || lead._id}&leadId=${lead._id}&phone=${lead.phone || ""}`,
                                    );
                                  }}
                                  className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 p-1 rounded-md transition-colors cursor-pointer"
                                  title="WhatsApp Chat"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </button>

                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuLeadId(
                                        activeMenuLeadId === lead._id ? null : lead._id,
                                      );
                                    }}
                                    className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer"
                                  >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Dropdown Menu */}
                                  {activeMenuLeadId === lead._id && (
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 text-xs"
                                    >
                                      <Link
                                        href={`/dashboard/leads/${lead._id}`}
                                        className="flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                                      >
                                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                                        View Lead Details
                                      </Link>
                                      <button
                                        onClick={() => {
                                          setSelectedLead(lead);
                                          setShowFollowupModal(true);
                                          setActiveMenuLeadId(null);
                                        }}
                                        className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                                      >
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                        Schedule Follow-up
                                      </button>
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
                                            setActiveMenuLeadId(null);
                                          }}
                                          className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                                        >
                                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                                          Reassign Lead
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Company & Client Name */}
                            <div>
                              <Link
                                href={`/dashboard/leads/${lead._id}`}
                                className="block font-bold text-slate-900 text-[15px] hover:text-indigo-600 transition-colors leading-snug"
                              >
                                {companyName}
                              </Link>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
                                <User className="w-3 h-3 text-slate-400" />
                                <span>{contactPerson}</span>
                              </div>
                            </div>

                            {/* Highlight Box: Expected Value & Score */}
                            <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-3 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                                  EXPECTED VALUE
                                </span>
                                <span
                                  className={`text-xl font-black ${
                                    isTopTicket
                                      ? "text-emerald-600"
                                      : (lead.source || "").toUpperCase() === "REFERRAL"
                                        ? "text-[#4F46E5]"
                                        : "text-slate-900"
                                  }`}
                                >
                                  ₹{expVal.toLocaleString("en-IN")}
                                </span>
                              </div>

                              <div className="text-right">
                                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-indigo-400 text-indigo-600 font-bold text-xs bg-white">
                                  {scoreMeta.score}
                                </div>
                                <span
                                  className={`text-[10px] font-semibold block mt-0.5 ${
                                    scoreMeta.label === "High Value"
                                      ? "text-emerald-600 font-bold"
                                      : scoreMeta.label === "Priority"
                                        ? "text-indigo-600 font-bold"
                                        : "text-slate-500"
                                  }`}
                                >
                                  {scoreMeta.label}
                                </span>
                              </div>
                            </div>

                            {/* Metadata Details Rows */}
                            <div className="space-y-1.5 text-xs">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-slate-400 font-medium">
                                  Requirement:
                                </span>
                                <div className="text-right truncate max-w-[200px]">
                                  {renderRequirementBadge(lead.requirement)}
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 font-medium">
                                  Assigned To:
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-4 h-4 rounded-full bg-indigo-600 text-white font-bold text-[9px] flex items-center justify-center">
                                    {assignedUser.slice(0, 1).toUpperCase()}
                                  </div>
                                  <span className="text-slate-800 font-semibold">
                                    {assignedUser}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 font-medium">
                                  Last Contact:
                                </span>
                                <span className="text-slate-700 font-medium">
                                  {lastContactDate}
                                </span>
                              </div>
                            </div>

                            {/* Next Follow-up Link */}
                            <div className="pt-1 flex items-center justify-between text-xs">
                              <span className="text-slate-400 font-medium">
                                Next Follow-up:
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setShowFollowupModal(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline cursor-pointer"
                              >
                                + Schedule
                              </button>
                            </div>
                          </div>

                          {/* Full-width bottom colored stage bar */}
                          <div className="w-full h-1 bg-emerald-500" />
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-2 py-16 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
                      No leads matching current filters.
                    </div>
                  )}
                </div>
              )}

              {/* List View */}
              {viewMode === "list" && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <tr>
                        <th className="px-4 py-3">Lead / Company</th>
                        <th className="px-4 py-3">Source</th>
                        <th className="px-4 py-3">Requirement</th>
                        <th className="px-4 py-3">Expected Value</th>
                        <th className="px-4 py-3">Assigned To</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLeads.map((lead) => {
                        const val =
                          Number(lead.expectedValue) ||
                          Number(lead.estimatedBudget) ||
                          0;
                        return (
                          <tr key={lead._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3">
                              <Link
                                href={`/dashboard/leads/${lead._id}`}
                                className="font-bold text-slate-900 hover:text-indigo-600 block"
                              >
                                {lead.companyName || lead.businessName || "Direct Lead"}
                              </Link>
                              <span className="text-[11px] text-slate-500">
                                {lead.customerName || lead.contactName}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-700">
                              {lead.source || "GOOGLE"}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {lead.requirement || "Print Requirements"}
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-900">
                              ₹{val.toLocaleString("en-IN")}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-700">
                              {lead.assignedToId?.name || "Tanya"}
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {lead.status || "WON"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setShowFollowupModal(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-800 font-semibold"
                              >
                                Schedule
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Board / Kanban View */}
              {viewMode === "board" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {["NEW", "NEGOTIATION", "WON"].map((stage) => {
                    const stageLeads = leads.filter(
                      (l) => (l.status || "NEW") === stage,
                    );
                    return (
                      <div
                        key={stage}
                        className="bg-slate-50/70 border border-slate-200 rounded-2xl p-3 space-y-3"
                      >
                        <div className="flex items-center justify-between font-bold text-xs text-slate-700 px-1">
                          <span>{stage}</span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px]">
                            {stageLeads.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {stageLeads.map((l) => (
                            <div
                              key={l._id}
                              className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-1.5"
                            >
                              <strong className="text-xs text-slate-900 block font-bold">
                                {l.companyName || l.businessName}
                              </strong>
                              <div className="flex items-center justify-between text-[11px] text-slate-500">
                                <span>{l.customerName}</span>
                                <span className="font-bold text-slate-800">
                                  ₹{Number(l.expectedValue || 0).toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottom Notice Banner */}
              <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <p className="text-xs text-slate-700 font-medium">
                    All <strong className="text-slate-900 font-bold">{computedMetrics.won} leads</strong> are tagged as <strong className="text-emerald-700 font-bold">WON</strong>. Ready to generate work job cards or dispatch invoices.
                  </p>
                </div>
                <button
                  onClick={() => router.push("/dashboard/orders")}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-50 transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  Generate Bulk Job Orders
                </button>
              </div>
            </div>

            {/* Right 4 Columns: 4 Strategic Insight Widgets */}
            <div className="lg:col-span-4 space-y-4">
              {/* Widget 1: Hot Leads (Act Now!) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-900 text-xs tracking-wider uppercase flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
                    HOT LEADS (ACT NOW!)
                  </h3>
                  <button
                    onClick={() => setActiveTab("ALL")}
                    className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                {computedMetrics.hotLeadsList.length > 0 &&
                computedMetrics.hotLeadsList.some((l) => l.status !== "WON") ? (
                  <div className="space-y-2.5">
                    {computedMetrics.hotLeadsList.slice(0, 3).map((hl) => (
                      <div
                        key={hl._id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div>
                          <strong className="text-slate-900 font-bold block">
                            {hl.companyName || hl.customerName}
                          </strong>
                          <span className="text-[11px] text-slate-500">
                            ₹{Number(hl.expectedValue || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedLead(hl);
                            setShowFollowupModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-semibold text-[11px]"
                        >
                          Ping
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-2">
                    <div className="w-11 h-11 rounded-full border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                      <Check className="w-5 h-5 text-slate-400 stroke-[2.5]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        No active hot leads pending.
                      </h4>
                      <p className="text-[11px] text-slate-400 max-w-[220px] mx-auto mt-0.5 leading-snug">
                        All {computedMetrics.total} inbound inquiries have been converted successfully to Won.
                      </p>
                    </div>
                    <button
                      onClick={() => router.push("/dashboard/customers")}
                      className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all cursor-pointer mt-1"
                    >
                      Initiate Upsell Campaign
                    </button>
                  </div>
                )}
              </div>

              {/* Widget 2: Lead Status Overview Donut Chart */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-900 text-xs tracking-wider uppercase">
                    LEAD STATUS OVERVIEW
                  </h3>
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-500 focus:outline-none cursor-pointer"
                  >
                    <option value="This Month">This Month</option>
                    <option value="This Week">This Week</option>
                    <option value="Today">Today</option>
                    <option value="All Time">All Time</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-4 pt-1">
                  {/* Radial SVG Donut */}
                  <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      {donutSegments.map((seg, idx) => (
                        <circle
                          key={idx}
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          stroke={seg.color}
                          strokeWidth="12"
                          strokeDasharray={seg.dashArray}
                          strokeDashoffset={seg.dashOffset}
                          className="transition-all duration-500"
                        />
                      ))}
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <span className="text-xl font-black text-slate-900 leading-tight">
                        {overviewMetrics.total}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">
                        TOTAL LEADS
                      </span>
                    </div>
                  </div>

                  {/* Legend List */}
                  <div className="space-y-1.5 text-xs font-medium flex-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> New
                      </span>
                      <strong className="text-slate-900">
                        {overviewMetrics.new} ({overviewMetrics.pct.new}%)
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-purple-500" /> Contacted
                      </span>
                      <strong className="text-slate-900">
                        {overviewMetrics.contacted} ({overviewMetrics.pct.contacted}%)
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-yellow-500" /> In Cooking
                      </span>
                      <strong className="text-slate-900">
                        {overviewMetrics.inCooking} ({overviewMetrics.pct.inCooking}%)
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-amber-500" /> Proposal Sent
                      </span>
                      <strong className="text-slate-900">
                        {overviewMetrics.proposal} ({overviewMetrics.pct.proposal}%)
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-green-500" /> Won
                      </span>
                      <strong className="text-slate-900">
                        {overviewMetrics.won} ({overviewMetrics.pct.won}%)
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-rose-500" /> Lost
                      </span>
                      <strong className="text-slate-900">
                        {overviewMetrics.lost} ({overviewMetrics.pct.lost}%)
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Widget 3: Follow-up Due Today */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-900 text-xs tracking-wider uppercase">
                    FOLLOW-UP DUE TODAY ({todayFollowups.length})
                  </h3>
                  <Link
                    href="/dashboard/followups"
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    View All
                  </Link>
                </div>

                {todayFollowups.length > 0 ? (
                  <div className="space-y-2">
                    {todayFollowups.slice(0, 3).map((flw) => (
                      <div
                        key={flw._id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div>
                          <strong className="text-slate-900 font-bold block">
                            {flw.title || "Follow-up Task"}
                          </strong>
                          <span className="text-[11px] text-slate-500">
                            {new Date(flw.scheduledAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <button
                          onClick={() => router.push("/dashboard/followups")}
                          className="text-indigo-600 hover:underline font-semibold"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-2">
                    <div className="w-11 h-11 rounded-full border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                      <Clock className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        No follow-ups due today
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        You&apos;re completely caught up with scheduled client pings.
                      </p>
                    </div>
                    <Link
                      href="/dashboard/followups"
                      className="text-xs font-bold text-indigo-600 hover:underline inline-block mt-1"
                    >
                      View all follow-ups ({followups.length})
                    </Link>
                  </div>
                )}
              </div>

              {/* Widget 4: Order Types & Source Mix */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
                <h3 className="font-black text-slate-900 text-xs tracking-wider uppercase">
                  ORDER TYPES &amp; SOURCE MIX
                </h3>

                {/* Progress bars by Source */}
                <div className="space-y-3">
                  {sourceBreakdown.map((item) => (
                    <div key={item.key} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 font-medium">
                          {item.label}
                        </span>
                        <strong className="text-slate-900 font-bold">
                          ₹{item.val.toLocaleString("en-IN")} ({item.pct}%)
                        </strong>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color}`}
                          style={{ width: `${Math.max(item.pct, 5)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Print Categories in Pipeline */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    PRINT CATEGORIES IN PIPELINE
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {categoryTags.map((cat, i) => (
                      <span
                        key={i}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${cat.style}`}
                      >
                        {cat.label}
                      </span>
                    ))}
                  </div>
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
              <h3 className="text-base font-bold text-slate-900">Add New Lead</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
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
                    <option value="GOOGLE">Google Search / Maps</option>
                    <option value="REFERRAL">Referral</option>
                    <option value="WALK_IN">Walk-In / Store Visit</option>
                    <option value="PHONE_CALL">Phone Call</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="WEBSITE">Website Inquiry</option>
                    <option value="INDIAMART">IndiaMART</option>
                    <option value="META_ADS">Meta Ads (FB/IG)</option>
                    <option value="MANUAL">Manual Entry</option>
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
                <label className="text-slate-700 font-semibold block mb-1">
                  Schedule Next Follow-up (Optional)
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
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingLead}
                  className={`px-5 py-2 rounded-xl text-white font-semibold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    creatingLead
                      ? "bg-indigo-400 cursor-not-allowed opacity-90 shadow-none"
                      : "bg-[#4F46E5] hover:bg-[#4338CA] active:scale-95"
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

      {/* IMPORT LEADS MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" />
                Import Leads CSV
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                Upload your CSV file containing commercial printing inquiries. Ensure columns include: Customer Name, Company, Phone, Expected Value, Requirement.
              </p>
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-indigo-500 transition-colors cursor-pointer bg-slate-50">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="font-bold text-slate-800 block text-xs">
                  Click to select CSV file
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Up to 500 leads per batch
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold cursor-pointer text-xs"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert("CSV parser module ready.");
                  setShowImportModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Upload &amp; Process
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REASSIGN LEAD MODAL (Manager / Admin Only) */}
      {showReassignModal && selectedLead && isManagerOrAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                Reassign Lead
              </h3>
              <button
                onClick={() => setShowReassignModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReassignLead} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                  Selected Lead
                </span>
                <strong className="text-slate-900 text-sm block mt-0.5">
                  {selectedLead.companyName ||
                    selectedLead.businessName ||
                    selectedLead.customerName ||
                    "Lead"}{" "}
                  ({selectedLead.phone})
                </strong>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Currently Assigned To:{" "}
                  <strong className="text-slate-700">
                    {selectedLead.assignedToId?.name || "Tanya"}
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
                  <option value="">Select Sales Executive</option>
                  {users
                    .filter((u) => {
                      const r = (u.roleSlug || u.role || "").toLowerCase().trim();
                      if (
                        r.includes("admin") ||
                        r === "manager" ||
                        r === "designer" ||
                        r === "customer"
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
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-600/20 cursor-pointer"
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
              <h3 className="text-base font-bold text-slate-900">Schedule Follow-up</h3>
              <button
                onClick={() => setShowFollowupModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleFollowup} className="space-y-3.5 text-xs">
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
                  Date &amp; Time *
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
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md cursor-pointer"
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
