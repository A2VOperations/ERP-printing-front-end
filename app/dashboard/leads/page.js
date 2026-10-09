"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import { normalizeRole } from "@/lib/rbacGuard";
import {
  Flame,
  Hourglass,
  Star,
  CheckCircle2,
  Plus,
  MoreVertical,
  ChevronDown,
  Clock,
  User,
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
  Inbox,
  ArrowRight,
  Phone,
  PhoneCall,
  Edit,
  Eye,
  StickyNote,
  Copy,
  Zap,
  ShoppingBag,
  CreditCard,
  Layers,
  Camera,
  Trash2,
} from "lucide-react";

const TABS = [
  { id: "ALL", label: "All Leads", countKey: "total", color: "bg-indigo-600" },
  { id: "NEW", label: "New", countKey: "new", dotColor: "bg-blue-500" },
  {
    id: "CONTACTED",
    label: "Contacted",
    countKey: "contacted",
    dotColor: "bg-yellow-500",
  },
  {
    id: "QUOTATION_SENT",
    label: "Proposal Sent",
    countKey: "proposal",
    dotColor: "bg-purple-500",
  },
  {
    id: "NEGOTIATION",
    label: "Negotiation",
    countKey: "negotiation",
    dotColor: "bg-orange-600",
  },
  { id: "WON", label: "Won", countKey: "won", dotColor: "bg-emerald-500" },
  { id: "LOST", label: "Lost", countKey: "lost", dotColor: "bg-rose-500" },
];

const STATUS_OPTIONS = [
  {
    id: "NEW",
    label: "New Lead",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  {
    id: "CONTACTED",
    label: "Contacted",
    bg: "bg-yellow-50",
    text: "text-yellow-800",
    border: "border-yellow-200",
    dot: "bg-yellow-500",
  },
  {
    id: "INTERESTED",
    label: "Interested",
    bg: "bg-[#f5ede4]",
    text: "text-[#6d4c33]",
    border: "border-[#d7c4b0]",
    dot: "bg-[#8d6748]",
  },
  {
    id: "QUOTATION_SENT",
    label: "Proposal Sent",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    dot: "bg-purple-500",
  },
  {
    id: "NEGOTIATION",
    label: "Negotiation",
    bg: "bg-orange-100",
    text: "text-orange-900",
    border: "border-orange-300",
    dot: "bg-orange-600",
  },
  {
    id: "WON",
    label: "Order Won",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  {
    id: "LOST",
    label: "Deal Lost",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
];

/**
 * Returns customized background, border, and badge styles matching status specifications:
 * - New leads: blue
 * - Contacted: yellow
 * - Interested: brown
 * - Proposal sent: purple
 * - Negotiation: dark orange
 * - Order won: green
 * - Deal lost / order lost: red
 */
export function getLeadStatusStyle(rawStatus) {
  const s = String(rawStatus || "NEW")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  // 1. New leads: Blue
  if (s === "NEW" || s === "NEW_LEAD" || s === "PENDING") {
    return {
      rowBg: "bg-blue-100/90 hover:bg-blue-200/85",
      expandedBg: "bg-blue-200/60",
      gridBg: "bg-blue-100/90 border-blue-300 hover:border-blue-400",
      accentBar: "bg-blue-600",
      borderL: "border-l-4 border-l-blue-600",
      badgeBg: "bg-blue-200 text-blue-900 border-blue-300",
      label: "New Lead",
    };
  }

  // 2. Contacted: Yellow
  if (s === "CONTACTED" || s === "CALL_ANSWERED" || s === "IN_COMMUNICATION") {
    return {
      rowBg: "bg-yellow-100/90 hover:bg-yellow-200/85",
      expandedBg: "bg-yellow-200/60",
      gridBg: "bg-yellow-100/90 border-yellow-300 hover:border-yellow-400",
      accentBar: "bg-yellow-500",
      borderL: "border-l-4 border-l-yellow-500",
      badgeBg: "bg-yellow-200 text-yellow-950 border-yellow-300",
      label: "Contacted",
    };
  }

  // 3. Interested: Brown
  if (s === "INTERESTED") {
    return {
      rowBg: "bg-[#f4ebe1] hover:bg-[#eae0d2]",
      expandedBg: "bg-[#ebdcc9]/70",
      gridBg: "bg-[#f4ebe1] border-[#cbb59d] hover:border-[#b09678]",
      accentBar: "bg-[#8d6748]",
      borderL: "border-l-4 border-l-[#8d6748]",
      badgeBg: "bg-[#ebdcc9] text-[#5c3a21] border-[#cbb59d]",
      label: "Interested",
    };
  }

  // 4. Proposal sent: Purple
  if (
    s === "QUOTATION_SENT" ||
    s === "PROPOSAL_SENT" ||
    s === "QUOTATION" ||
    s === "PROPOSAL"
  ) {
    return {
      rowBg: "bg-purple-100/90 hover:bg-purple-200/80",
      expandedBg: "bg-purple-200/60",
      gridBg: "bg-purple-100/90 border-purple-300 hover:border-purple-400",
      accentBar: "bg-purple-600",
      borderL: "border-l-4 border-l-purple-600",
      badgeBg: "bg-purple-200 text-purple-900 border-purple-300",
      label: "Proposal Sent",
    };
  }

  // 5. Negotiation: Dark Orange
  if (s === "NEGOTIATION" || s === "NEGOTIATING") {
    return {
      rowBg: "bg-orange-200/90 hover:bg-orange-300/85",
      expandedBg: "bg-orange-200",
      gridBg: "bg-orange-200/90 border-orange-400 hover:border-orange-500",
      accentBar: "bg-orange-700",
      borderL: "border-l-4 border-l-orange-700",
      badgeBg: "bg-orange-300 text-orange-950 border-orange-500",
      label: "Negotiation",
    };
  }

  // 6. Order won: Green
  if (s === "WON" || s === "ORDER_WON" || s === "CONVERTED") {
    return {
      rowBg: "bg-emerald-100/90 hover:bg-emerald-200/85",
      expandedBg: "bg-emerald-200/60",
      gridBg: "bg-emerald-100/90 border-emerald-300 hover:border-emerald-400",
      accentBar: "bg-emerald-600",
      borderL: "border-l-4 border-l-emerald-600",
      badgeBg: "bg-emerald-200 text-emerald-900 border-emerald-300",
      label: "Order Won",
    };
  }

  // 7. Deal lost / order lost: Red
  if (
    s === "LOST" ||
    s === "DEAL_LOST" ||
    s === "ORDER_LOST" ||
    s === "CANCELLED" ||
    s === "DROPPED"
  ) {
    return {
      rowBg: "bg-rose-100/90 hover:bg-rose-200/85",
      expandedBg: "bg-rose-200/60",
      gridBg: "bg-rose-100/90 border-rose-300 hover:border-rose-400",
      accentBar: "bg-rose-600",
      borderL: "border-l-4 border-l-rose-600",
      badgeBg: "bg-rose-200 text-rose-900 border-rose-300",
      label: "Deal Lost",
    };
  }

  // Fallback -> Blue
  return {
    rowBg: "bg-blue-100/90 hover:bg-blue-200/85",
    expandedBg: "bg-blue-200/60",
    gridBg: "bg-blue-100/90 border-blue-300 hover:border-blue-400",
    accentBar: "bg-blue-600",
    borderL: "border-l-4 border-l-blue-600",
    badgeBg: "bg-blue-200 text-blue-900 border-blue-300",
    label: "Lead",
  };
}

export default function LeadsDashboardPage() {
  const router = useRouter();

  // Active Tab & View Mode
  const [activeTab, setActiveTab] = useState("ALL");
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return "grid";
    return "list";
  }); // 'grid' | 'list'
  const [sortBy, setSortBy] = useState("value_desc"); // 'value_desc' | 'value_asc' | 'date_desc' | 'name_asc'
  const [timeframe, setTimeframe] = useState("This Month");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState(""); // 'YYYY-MM-DD'
  const [datePreset, setDatePreset] = useState(""); // '' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH'
  const [loading, setLoading] = useState(true);

  // Live Data
  const [leads, setLeads] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingInboxCount, setPendingInboxCount] = useState(0);

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

  // Direct Inline Actions & Detail Drawer States
  const [callingLead, setCallingLead] = useState(null);
  const [quickNoteLead, setQuickNoteLead] = useState(null);
  const [quickNoteContent, setQuickNoteContent] = useState("");
  const [quickNoteCategory, setQuickNoteCategory] = useState("GENERAL");
  const [savingQuickNote, setSavingQuickNote] = useState(false);

  const [quickEditLead, setQuickEditLead] = useState(null);
  const [quickEditForm, setQuickEditForm] = useState({
    contactName: "",
    businessName: "",
    phone: "",
    expectedValue: "",
    requirement: "",
    priority: "HIGH",
  });
  const [savingQuickEdit, setSavingQuickEdit] = useState(false);

  const [expandedLeadId, setExpandedLeadId] = useState(null);
  const [activeStatusDropdownId, setActiveStatusDropdownId] = useState(null);
  const [updatingStatusLeadId, setUpdatingStatusLeadId] = useState(null);
  const [inlineNoteText, setInlineNoteText] = useState({});
  const [savingInlineNoteId, setSavingInlineNoteId] = useState(null);
  const [toast, setToast] = useState(null);

  // Form State
  const [newLead, setNewLead] = useState({
    businessName: "",
    companyName: "",
    customerName: "",
    contactName: "",
    phone: "",
    email: "",
    alternatePhone: "",
    source: "GOOGLE",
    requirement: "",
    expectedValue: "",
    priority: "HIGH",
    assignedToId: "",
    territory: "burari/baba colony",
    nextFollowUp: "",
    notes: "",
  });
  const [leadPhotoFile, setLeadPhotoFile] = useState(null);
  const [leadPhotoPreview, setLeadPhotoPreview] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, WEBP, etc.)");
      return;
    }
    setLeadPhotoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setLeadPhotoPreview(objectUrl);
  };

  const handleRemovePhoto = () => {
    if (leadPhotoPreview) {
      URL.revokeObjectURL(leadPhotoPreview);
    }
    setLeadPhotoFile(null);
    setLeadPhotoPreview(null);
  };

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

      const currentStoredRole = (
        typeof window !== "undefined"
          ? localStorage.getItem("userRole") || ""
          : ""
      ).toLowerCase();
      const isSales =
        normalizeRole(currentStoredRole) === "sales" &&
        !currentStoredRole.includes("admin") &&
        !currentStoredRole.includes("operator");

      const [leadsRes, flwRes, usersRes, meRes, inboxRes] =
        await Promise.allSettled([
          api.get("/leads?limit=100"),
          api.get("/followups?limit=100"),
          api.get("/users"),
          api.get("/auth/me"),
          isSales
            ? api.get("/leads?acceptanceStatus=PENDING&assignedToId=my&limit=1")
            : Promise.resolve({ data: null }),
        ]);

      if (leadsRes.status === "fulfilled") {
        const raw = leadsRes.value?.data;
        const arr = Array.isArray(raw) ? raw : raw?.leads || raw?.data || [];
        setLeads(arr);
      }
      if (
        isSales &&
        inboxRes.status === "fulfilled" &&
        inboxRes.value?.data?.pagination
      ) {
        setPendingInboxCount(inboxRes.value.data.pagination.totalRecords || 0);
      } else {
        setPendingInboxCount(0);
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

  // Close card menus & dropdowns on document click
  useEffect(() => {
    const handleDocClick = () => {
      setActiveMenuLeadId(null);
      setActiveStatusDropdownId(null);
    };
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
      [
        "admin",
        "super_admin",
        "manager",
        "sales_manager",
        "general_manager",
        "operations_manager",
      ].includes(userRole)
    );
  }, [userRole]);

  const myUserId = useMemo(() => {
    return String(currentUser?._id || currentUser?.id || "");
  }, [currentUser]);

  // Scoped leads: ONLY Admin and Manager can see all the leads.
  // Everyone else (Sales, etc.) strictly only sees leads assigned to themselves.
  // Pending leads in inbox are excluded until accepted by the salesperson.
  const scopedLeads = useMemo(() => {
    const acceptedOnly = leads.filter((l) => l.acceptanceStatus !== "PENDING");
    if (isManagerOrAdmin) return acceptedOnly;
    if (!myUserId) return [];
    return acceptedOnly.filter((l) => {
      const assignedId = String(
        l.assignedToId?._id ||
          l.assignedToId?.id ||
          (typeof l.assignedToId === "string" ? l.assignedToId : "") ||
          "",
      );
      return assignedId === myUserId;
    });
  }, [leads, isManagerOrAdmin, myUserId]);

  // Lead computation helpers for global pipeline
  const computedMetrics = useMemo(() => {
    const total = scopedLeads.length;
    const newCount = scopedLeads.filter((l) => l.status === "NEW").length;
    const contactedCount = scopedLeads.filter(
      (l) => l.status === "CONTACTED",
    ).length;
    const proposalCount = scopedLeads.filter(
      (l) => l.status === "QUOTATION_SENT" || l.status === "PROPOSAL_SENT",
    ).length;
    const negotiationCount = scopedLeads.filter(
      (l) => l.status === "NEGOTIATION",
    ).length;
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

    const totalExpectedVal = scopedLeads.reduce(
      (sum, l) => sum + getLeadVal(l),
      0,
    );
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
      (l) => l.status === "QUOTATION_SENT" || l.status === "PROPOSAL_SENT",
    ).length;
    const negotiationCount = sourceLeads.filter(
      (l) => l.status === "NEGOTIATION",
    ).length;
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
        groups[src] = {
          count: 0,
          val: 0,
          sampleCompany: l.companyName || l.customerName,
        };
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
            ? "bg-[#F95721]"
            : src === "REFERRAL"
              ? "bg-purple-600"
              : "bg-emerald-600",
      };
    });
  }, [scopedLeads, computedMetrics.totalExpectedVal]);

  // Print Categories in Pipeline
  const categoryTags = useMemo(() => {
    const counts = {
      "Visiting Cards": 0,
      Brochures: 0,
      "Flex & Menus": 0,
      Others: 0,
    };

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
    else if (lead.priority === "URGENT" || lead.priority === "HIGH")
      label = "Priority";
    else if (req.includes("matte") || req.includes("lamination"))
      label = "Verified";
    else if (req.includes("visiting"))
      label = isCompleted ? "Completed" : "Visiting Card";

    return {
      score: 30, // Reference design displays score circle 30
      label,
    };
  };

  // Requirement pill styling
  const renderRequirementBadge = (reqStr) => {
    if (!reqStr)
      return (
        <span className="text-slate-500 font-medium whitespace-nowrap">
          Standard Print
        </span>
      );
    const lower = reqStr.toLowerCase();

    if (lower.includes("flex") || lower.includes("menu")) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
          {reqStr}
        </span>
      );
    }
    if (lower.includes("brochure")) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
          {reqStr}
        </span>
      );
    }
    return (
      <span className="text-slate-700 font-medium whitespace-nowrap">
        {reqStr}
      </span>
    );
  };

  // Filtered & Sorted Leads
  const filteredLeads = useMemo(() => {
    let result = scopedLeads.filter((l) => {
      // 1. Stage tab filter
      const matchesTab =
        activeTab === "ALL" ||
        (activeTab === "NEW" && l.status === "NEW") ||
        (activeTab === "CONTACTED" && l.status === "CONTACTED") ||
        (activeTab === "QUOTATION_SENT" &&
          (l.status === "QUOTATION_SENT" || l.status === "PROPOSAL_SENT")) ||
        (activeTab === "NEGOTIATION" && l.status === "NEGOTIATION") ||
        (activeTab === "WON" && l.status === "WON") ||
        (activeTab === "LOST" && ["LOST", "NOT_INTERESTED"].includes(l.status));

      if (!matchesTab) return false;

      // 2. Search Query (Lead Number, Customer, Company, Phone, Requirement)
      if (searchQuery) {
        const query = searchQuery.toLowerCase().trim();
        const leadNo = (l.leadNumber || "").toLowerCase();
        const leadId = (l._id || "").toLowerCase();
        const shortId = leadId ? `ld-${leadId.slice(-6)}` : "";
        const hashId = leadId ? `#${leadId.slice(-6)}` : "";
        const idSuffix = leadId ? leadId.slice(-6) : "";
        const contactName = (
          l.contactName ||
          l.customerName ||
          ""
        ).toLowerCase();
        const businessName = (
          l.businessName ||
          l.companyName ||
          ""
        ).toLowerCase();
        const phone = (l.phone || "").toLowerCase();
        const requirement = (l.requirement || "").toLowerCase();
        const email = (l.email || "").toLowerCase();

        const matchesSearch =
          leadNo.includes(query) ||
          leadId.includes(query) ||
          shortId.includes(query) ||
          hashId.includes(query) ||
          idSuffix.includes(query) ||
          contactName.includes(query) ||
          businessName.includes(query) ||
          phone.includes(query) ||
          requirement.includes(query) ||
          email.includes(query);

        if (!matchesSearch) return false;
      }

      // 3. Specific Date Filter (YYYY-MM-DD)
      if (dateFilter) {
        const leadCreatedStr = l.createdAt
          ? new Date(l.createdAt).toLocaleDateString("en-CA")
          : "";
        const leadUpdatedStr = l.updatedAt
          ? new Date(l.updatedAt).toLocaleDateString("en-CA")
          : "";
        if (leadCreatedStr !== dateFilter && leadUpdatedStr !== dateFilter) {
          return false;
        }
      }

      // 4. Date Preset Filter (Today, Yesterday, 7 Days, This Month)
      if (datePreset && datePreset !== "ALL") {
        const now = new Date();
        const leadDate = l.createdAt ? new Date(l.createdAt) : null;
        if (!leadDate || isNaN(leadDate.getTime())) return false;

        const leadDateStr = leadDate.toLocaleDateString("en-CA");
        const todayStr = now.toLocaleDateString("en-CA");

        if (datePreset === "TODAY") {
          if (leadDateStr !== todayStr) return false;
        } else if (datePreset === "YESTERDAY") {
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          if (leadDateStr !== yesterday.toLocaleDateString("en-CA"))
            return false;
        } else if (datePreset === "THIS_WEEK") {
          const sevenDaysAgo = new Date(
            now.getTime() - 7 * 24 * 60 * 60 * 1000,
          );
          if (leadDate < sevenDaysAgo) return false;
        } else if (datePreset === "THIS_MONTH") {
          if (
            leadDate.getMonth() !== now.getMonth() ||
            leadDate.getFullYear() !== now.getFullYear()
          ) {
            return false;
          }
        }
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      const valA = Number(a.expectedValue) || Number(a.estimatedBudget) || 0;
      const valB = Number(b.expectedValue) || Number(b.estimatedBudget) || 0;
      if (sortBy === "value_desc") return valB - valA;
      if (sortBy === "value_asc") return valA - valB;
      if (sortBy === "name_asc") {
        const nameA = (
          a.companyName ||
          a.businessName ||
          a.customerName ||
          ""
        ).toLowerCase();
        const nameB = (
          b.companyName ||
          b.businessName ||
          b.customerName ||
          ""
        ).toLowerCase();
        return nameA.localeCompare(nameB);
      }
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return result;
  }, [scopedLeads, activeTab, searchQuery, dateFilter, datePreset, sortBy]);

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

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
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

      const terrStr = (newLead.territory || "burari/baba colony")
        .toLowerCase()
        .trim();
      const parts = terrStr.split("/");
      const areaVal = parts[0]
        ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
        : "Burari";
      const zoneVal = parts[1] || parts[0] || "Baba colony";

      // Upload shop photo if selected
      let uploadedPhotoUrl = "";
      if (leadPhotoFile) {
        setIsUploadingPhoto(true);
        try {
          const uploadRes = await api.upload(
            "/leads/upload-photo",
            leadPhotoFile,
            "photo",
          );
          if (uploadRes?.data?.url) {
            uploadedPhotoUrl = uploadRes.data.url;
          } else if (uploadRes?.url) {
            uploadedPhotoUrl = uploadRes.url;
          }
        } catch (uErr) {
          console.warn("Shop photo upload notice:", uErr);
        } finally {
          setIsUploadingPhoto(false);
        }
      }

      const bName = (
        newLead.businessName?.trim() ||
        newLead.companyName?.trim() ||
        ""
      );
      const cName = (
        newLead.customerName?.trim() ||
        newLead.contactName?.trim() ||
        ""
      );

      await api.post("/leads", {
        businessName: bName,
        companyName: bName,
        contactName: cName || (bName ? "Contact Person" : "Lead Contact"),
        customerName: cName || (bName ? "Contact Person" : "Lead Contact"),
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
        area: areaVal,
        zone: zoneVal,
        shopImageUrl: uploadedPhotoUrl || undefined,
        documents:
          uploadedPhotoUrl
            ? [
                {
                  title: `Shop Photo - ${bName || cName || "Lead"}`,
                  category: "PHOTO",
                  fileUrl: uploadedPhotoUrl,
                  uploadedByName: currentUser?.name || "Sales Executive",
                  uploadedAt: new Date(),
                },
              ]
            : [],
      });

      setShowAddModal(false);
      handleRemovePhoto();
      setNewLead({
        businessName: "",
        companyName: "",
        customerName: "",
        contactName: "",
        phone: "",
        email: "",
        alternatePhone: "",
        source: "GOOGLE",
        requirement: "",
        expectedValue: "",
        priority: "HIGH",
        assignedToId: "",
        territory: "burari/baba colony",
        nextFollowUp: "",
        notes: "",
      });
      await loadDashboardData();
    } catch (err) {
      alert(err.message || "Failed to create lead");
    } finally {
      setCreatingLead(false);
      setIsUploadingPhoto(false);
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

  // Toast Notification Trigger
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3200);
  }, []);

  // Quick Direct Status Change (No page navigation needed)
  const handleQuickStatusChange = async (leadId, newStatus) => {
    try {
      setUpdatingStatusLeadId(leadId);
      setActiveStatusDropdownId(null);

      // Optimistic Update
      setLeads((prev) =>
        prev.map((l) => (l._id === leadId ? { ...l, status: newStatus } : l)),
      );

      try {
        await api.patch(`/leads/${leadId}/status`, { status: newStatus });
      } catch (err) {
        await api.put(`/leads/${leadId}`, { status: newStatus });
      }

      showToast(`Status updated to ${newStatus.replace(/_/g, " ")}`);
    } catch (err) {
      console.error("Status update error:", err);
      showToast(err.message || "Failed to update status", "error");
      loadDashboardData();
    } finally {
      setUpdatingStatusLeadId(null);
    }
  };

  // Quick Direct Note Save
  const handleSaveQuickNote = async (e) => {
    e.preventDefault();
    if (!quickNoteLead || !quickNoteContent.trim()) return;
    try {
      setSavingQuickNote(true);
      try {
        await api.post(`/leads/${quickNoteLead._id}/notes`, {
          content: quickNoteContent.trim(),
          category: quickNoteCategory,
        });
      } catch (err) {
        const oldNotes = quickNoteLead.notes || "";
        const updated = oldNotes
          ? `${oldNotes}\n[${new Date().toLocaleDateString()}]: ${quickNoteContent.trim()}`
          : quickNoteContent.trim();
        await api.put(`/leads/${quickNoteLead._id}`, { notes: updated });
      }
      showToast("Note added successfully!");
      setQuickNoteLead(null);
      setQuickNoteContent("");
      loadDashboardData();
    } catch (err) {
      showToast(err.message || "Failed to save note", "error");
    } finally {
      setSavingQuickNote(false);
    }
  };

  // Direct Inline Note inside Expanded Row
  const handleSaveInlineNote = async (leadId) => {
    const text = (inlineNoteText[leadId] || "").trim();
    if (!text) return;
    try {
      setSavingInlineNoteId(leadId);
      const lead = leads.find((l) => l._id === leadId);
      try {
        await api.post(`/leads/${leadId}/notes`, {
          content: text,
          category: "GENERAL",
        });
      } catch (err) {
        const oldNotes = lead?.notes || "";
        const updated = oldNotes
          ? `${oldNotes}\n[${new Date().toLocaleDateString()}]: ${text}`
          : text;
        await api.put(`/leads/${leadId}`, { notes: updated });
      }
      showToast("Remark recorded!");
      setInlineNoteText((prev) => ({ ...prev, [leadId]: "" }));
      loadDashboardData();
    } catch (err) {
      showToast(err.message || "Failed to record remark", "error");
    } finally {
      setSavingInlineNoteId(null);
    }
  };

  // Quick Edit Modal Trigger
  const handleOpenQuickEdit = (lead) => {
    setSelectedLead(lead);
    setQuickEditLead(lead);
    const initialTerritory = formatLeadTerritory(lead) || "burari/baba colony";
    setQuickEditForm({
      contactName: lead.customerName || lead.contactName || "",
      businessName: lead.companyName || lead.businessName || "",
      phone: lead.phone || "",
      expectedValue: String(lead.expectedValue ?? lead.estimatedBudget ?? ""),
      requirement: lead.requirement || "",
      priority: lead.priority || "HIGH",
      territory: initialTerritory,
    });
  };

  // Quick Edit Submit
  const handleSaveQuickEdit = async (e) => {
    e.preventDefault();
    if (!quickEditLead) return;
    try {
      setSavingQuickEdit(true);
      const terrStr = (quickEditForm.territory || "burari/baba colony")
        .toLowerCase()
        .trim();
      const parts = terrStr.split("/");
      const areaVal = parts[0]
        ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
        : "Burari";
      const zoneVal = parts[1] || parts[0] || "Baba colony";

      const bName = (quickEditForm.businessName || "").trim();
      const cName = (quickEditForm.contactName || "").trim();

      await api.put(`/leads/${quickEditLead._id}`, {
        businessName: bName,
        companyName: bName,
        contactName: cName || (bName ? "Contact Person" : "Lead Contact"),
        customerName: cName || (bName ? "Contact Person" : "Lead Contact"),
        phone: quickEditForm.phone.trim(),
        expectedValue: Number(quickEditForm.expectedValue) || 0,
        requirement: quickEditForm.requirement.trim(),
        priority: quickEditForm.priority,
        area: areaVal,
        zone: zoneVal,
      });

      // Optimistic update
      setLeads((prev) =>
        prev.map((l) =>
          l._id === quickEditLead._id
            ? {
                ...l,
                customerName: cName || (bName ? "Contact Person" : "Lead Contact"),
                contactName: cName || (bName ? "Contact Person" : "Lead Contact"),
                companyName: bName,
                businessName: bName,
                phone: quickEditForm.phone,
                expectedValue: Number(quickEditForm.expectedValue) || 0,
                requirement: quickEditForm.requirement,
                priority: quickEditForm.priority,
                area: areaVal,
                zone: zoneVal,
              }
            : l,
        ),
      );

      showToast("Lead updated successfully!");
      setQuickEditLead(null);
    } catch (err) {
      showToast(err.message || "Failed to update lead", "error");
    } finally {
      setSavingQuickEdit(false);
    }
  };

  // Quick Call Outcome Logger
  const handleCallOutcome = async (lead, outcome) => {
    try {
      const timestamp = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      const noteContent = `Call Result (${timestamp}): ${outcome}`;

      try {
        await api.post(`/leads/${lead._id}/notes`, {
          content: noteContent,
          category: "GENERAL",
        });
      } catch (e) {
        const oldNotes = lead.notes || "";
        await api.put(`/leads/${lead._id}`, {
          notes: oldNotes ? `${oldNotes}\n${noteContent}` : noteContent,
        });
      }

      if (outcome.includes("Interested")) {
        await handleQuickStatusChange(lead._id, "INTERESTED");
      } else if (outcome.includes("Not Interested")) {
        await handleQuickStatusChange(lead._id, "LOST");
      } else {
        await handleQuickStatusChange(lead._id, "CONTACTED");
      }

      showToast(`Call logged: ${outcome}`);
      setCallingLead(null);
      loadDashboardData();
    } catch (err) {
      showToast(err.message || "Failed to log call outcome", "error");
    }
  };

  // Copy Phone Number Helper
  const handleCopyPhone = (phone) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    showToast("Phone number copied to clipboard!");
  };



  // Format Next Follow-up Helper
  const formatFollowupDisplay = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const isTomorrow =
      new Date(now.getTime() + 86400000).toDateString() === d.toDateString();
    const timeStr = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    if (isToday) {
      return {
        label: `Today, ${timeStr}`,
        isOverdue: d < now,
        isToday: true,
      };
    }
    if (isTomorrow) {
      return {
        label: `Tomorrow, ${timeStr}`,
        isOverdue: false,
        isToday: false,
      };
    }
    return {
      label: `${d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}, ${timeStr}`,
      isOverdue: d < now,
      isToday: false,
    };
  };

  // Format Lead Area / Zone (e.g. burari/baba colony)
  const formatLeadTerritory = (lead) => {
    if (!lead) return "";
    const areaName = String(
      (lead.areaId && typeof lead.areaId === "object"
        ? lead.areaId?.name
        : lead.area) || ""
    ).trim();
    const zoneName = String(lead.zone || "").trim();

    let assignedRaw = "";
    if (lead.assignedToId && typeof lead.assignedToId === "object") {
      assignedRaw = lead.assignedToId.name || "";
    } else if (lead.assignedTo && typeof lead.assignedTo === "object") {
      assignedRaw = lead.assignedTo.name || "";
    } else if (typeof lead.assignedTo === "string") {
      assignedRaw = lead.assignedTo;
    } else if (typeof lead.assignedToId === "string") {
      assignedRaw = lead.assignedToId;
    }
    const assigned = String(assignedRaw || "").toLowerCase();

    // If both area and zone are present
    if (areaName && zoneName) {
      if (zoneName.toLowerCase().startsWith(areaName.toLowerCase() + "/")) {
        return zoneName.toLowerCase();
      }
      return `${areaName.toLowerCase()}/${zoneName.toLowerCase()}`;
    }

    // Tanya assignment or Baba colony
    if (assigned.includes("tanya") || zoneName.toLowerCase().includes("baba")) {
      return "burari/baba colony";
    }

    if (zoneName) {
      if (zoneName.toLowerCase().includes("sant")) return "burari/sant nagar";
      return zoneName.toLowerCase();
    }

    if (areaName) {
      return areaName.toLowerCase();
    }

    return "";
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
        (l.companyName || l.businessName || "")
          .toLowerCase()
          .includes("pizza") || (Number(l.expectedValue) || 0) >= 3000,
    );
    return pizzaWizza ? pizzaWizza._id : null;
  }, [scopedLeads, highestValueLeadId]);

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar />

        <div className="p-3.5 sm:p-5 md:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto w-full">
          {/* Header & Main Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  Leads Dashboard
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {computedMetrics.conversionRate}% Won Today
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Track, manage &amp; convert your commercial printing leads
                effectively
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap w-full sm:w-auto">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex-1 sm:flex-initial justify-center flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Import Leads</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex-1 sm:flex-initial justify-center flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold shadow-sm shadow-indigo-600/25 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Lead</span>
              </button>
            </div>
          </div>

          {/* Inbox Alert Banner when pending leads exist (Sales Only) */}
          {normalizeRole(
            currentUser?.role ||
              (typeof window !== "undefined"
                ? localStorage.getItem("userRole")
                : ""),
          ) === "sales" &&
            pendingInboxCount > 0 && (
              <div className="bg-gradient-to-r from-red-600/10 via-rose-600/5 to-white border border-red-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white flex items-center justify-center shrink-0 font-bold shadow-md shadow-red-500/30">
                    <Inbox className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-red-950 flex items-center gap-2">
                      <span>
                        You have {pendingInboxCount} incoming lead
                        {pendingInboxCount > 1 ? "s" : ""} in your Lead Inbox!
                      </span>
                      <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                        ACTION REQUIRED
                      </span>
                    </h4>
                    <p className="text-xs text-red-800 font-medium">
                      Assigned to you. Review details and accept them to
                      transfer into your active pipeline.
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard/leads/inbox"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/25 transition-all shrink-0 cursor-pointer"
                >
                  <span>Review &amp; Accept in Inbox</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

          {/* 6 Top Metric Cards with Accent Lines */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
            {/* 1. Total Leads */}
            <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/90 border-t-4 border-t-sky-400 shadow-xs space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 truncate">
                  Total Leads
                </span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <User className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {computedMetrics.total}
              </div>
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-slate-500 truncate">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">
                  {overviewMetrics.new} new this month
                </span>
              </div>
            </div>

            {/* 2. Hot Leads */}
            <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/90 border-t-4 border-t-rose-500 shadow-xs space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 truncate">
                  Hot Leads
                </span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                  <Flame className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {computedMetrics.hotCount}
              </div>
              <div className="text-[10px] sm:text-[11px] font-bold text-rose-600 truncate">
                {computedMetrics.total > 0
                  ? `${Math.round((computedMetrics.hotCount / computedMetrics.total) * 100)}% pipeline`
                  : "0% pipeline"}
              </div>
            </div>

            {/* 3. In Cooking */}
            <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/90 border-t-4 border-t-amber-400 shadow-xs space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 truncate">
                  In Cooking
                </span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                  <Hourglass className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {computedMetrics.inCooking}
              </div>
              <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 truncate">
                Active discussions
              </div>
            </div>

            {/* 4. High Ticket */}
            <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/90 border-t-4 border-t-purple-500 shadow-xs space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 truncate">
                  High Ticket
                </span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Star className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {computedMetrics.highTicketCount}
              </div>
              <div className="text-[10px] sm:text-[11px] font-bold text-purple-600 truncate">
                ₹{computedMetrics.highTicketTotalVal.toLocaleString("en-IN")}
              </div>
            </div>

            {/* 5. Won Leads */}
            <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/90 border-t-4 border-t-emerald-500 shadow-xs space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 truncate">
                  Won Leads
                </span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {computedMetrics.won}
              </div>
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-600 truncate">
                <TrendingUp className="w-3 h-3 shrink-0" />
                <span>{computedMetrics.conversionRate}% won</span>
              </div>
            </div>

            {/* 6. Total Value */}
            <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/90 border-t-4 border-t-teal-500 shadow-xs space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 truncate">
                  Total Value
                </span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <IndianRupee className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">
                ₹{computedMetrics.totalExpectedVal.toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 truncate">
                Avg ₹{computedMetrics.avgPerLead.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {/* Filter Pills Bar & View Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
            {/* Left Filter Pills */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 text-xs scrollbar-none -mx-1 px-1">
              {TABS.map((tab) => {
                const count = computedMetrics[tab.countKey] || 0;
                const isActive = activeTab === tab.id;

                if (isActive) {
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="px-3.5 sm:px-4 py-1.5 rounded-full font-bold text-xs bg-[#4F46E5] text-white shadow-xs whitespace-nowrap cursor-pointer transition-all shrink-0"
                    >
                      {tab.label} {count}
                    </button>
                  );
                }

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="px-3 sm:px-3.5 py-1.5 rounded-full font-medium text-xs bg-white text-slate-600 hover:text-slate-900 border border-slate-200/90 hover:bg-slate-50 whitespace-nowrap flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                  >
                    <span className={`w-2 h-2 rounded-full ${tab.dotColor}`} />
                    <span>{tab.label}</span>
                    <span className="text-slate-400 font-normal">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Controls: Views, Filters, Sort */}
            <div className="flex items-center gap-2 justify-between sm:justify-end w-full lg:w-auto flex-wrap sm:flex-nowrap shrink-0">
              {/* View Switcher */}
              <div className="flex items-center p-0.5 bg-white border border-slate-200 rounded-xl shadow-xs">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                    viewMode === "grid"
                      ? "bg-slate-100 text-indigo-600"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="Grid / Card View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">Cards</span>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                    viewMode === "list"
                      ? "bg-slate-100 text-indigo-600"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="List / Table View"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">Table</span>
                </button>
              </div>

              {/* Filters Button */}
              <button
                onClick={() => {
                  const q = prompt(
                    "Search leads by keyword, name or phone:",
                    searchQuery,
                  );
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
          <div className="">
            {/* Left 8 Columns: Selection strip, 2-column Lead Cards Grid, Bottom Action */}
            <div className=" space-y-4">
              {/* Lead Number & Date Filtration Bar */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search / Lead Number Input */}
                <div className="relative flex-1 min-w-0 sm:min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by Lead # (e.g. LD-10290), Customer, Company, Phone..."
                    className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Date Filtering: Specific Date & Quick Presets */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Specific Date Picker */}
                  <div className="relative flex items-center">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => {
                        setDateFilter(e.target.value);
                        if (e.target.value) setDatePreset("");
                      }}
                      className="pl-8.5 pr-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                      title="Filter by Specific Lead Date"
                    />
                    {dateFilter && (
                      <button
                        type="button"
                        onClick={() => setDateFilter("")}
                        className="ml-1 text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                        title="Clear date filter"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Quick Date Presets */}
                  <div className="flex items-center p-0.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 overflow-x-auto max-w-full scrollbar-none">
                    {[
                      { id: "ALL", label: "All Dates" },
                      { id: "TODAY", label: "Today" },
                      { id: "YESTERDAY", label: "Yesterday" },
                      { id: "THIS_WEEK", label: "7 Days" },
                      { id: "THIS_MONTH", label: "This Month" },
                    ].map((p) => {
                      const isSelected =
                        !dateFilter &&
                        (datePreset === p.id ||
                          (!datePreset && p.id === "ALL"));
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setDateFilter("");
                            setDatePreset(p.id === "ALL" ? "" : p.id);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer text-xs shrink-0 ${
                            isSelected
                              ? "bg-white text-indigo-700 shadow-2xs font-bold"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Reset All Active Filters */}
                  {(searchQuery ||
                    dateFilter ||
                    (datePreset && datePreset !== "ALL")) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setDateFilter("");
                        setDatePreset("");
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Reset all filters"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Selection Summary Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium flex-wrap">
                  <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>
                    Showing{" "}
                    <strong className="text-slate-900 font-bold">
                      {filteredLeads.length} of {scopedLeads.length}{" "}
                      {activeTab === "ALL" ? "Total" : activeTab} Leads
                    </strong>
                  </span>
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-200">
                      Lead/Search: &quot;{searchQuery}&quot;
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="hover:text-indigo-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {dateFilter && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[11px] border border-purple-200">
                      Date: {dateFilter}
                      <button
                        type="button"
                        onClick={() => setDateFilter("")}
                        className="hover:text-purple-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {datePreset && datePreset !== "ALL" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[11px] border border-purple-200">
                      Date: {datePreset.replace(/_/g, " ")}
                      <button
                        type="button"
                        onClick={() => setDatePreset("")}
                        className="hover:text-purple-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>

                <button
                  onClick={handleExportBatch}
                  className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer self-end sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Batch
                </button>
              </div>

              {/* View Rendering: Grid vs List vs Board */}
              {viewMode === "grid" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
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
                      const statusStyle = getLeadStatusStyle(lead.status);

                      const leadTitle =
                        (lead.businessName && lead.businessName !== "Direct Lead" && lead.businessName !== "—" ? lead.businessName : null) ||
                        (lead.companyName && lead.companyName !== "Direct Lead" && lead.companyName !== "—" ? lead.companyName : null) ||
                        (lead.contactName && lead.contactName !== "Direct Lead" && lead.contactName !== "—" ? lead.contactName : null) ||
                        (lead.customerName && lead.customerName !== "Direct Lead" && lead.customerName !== "—" ? lead.customerName : null) ||
                        "Lead";
                      const companyName = leadTitle;
                      const contactPerson = lead.contactName && lead.contactName !== leadTitle ? lead.contactName : leadTitle;

                      const assignedUser =
                        lead.assignedToId &&
                        typeof lead.assignedToId === "object"
                          ? lead.assignedToId.name
                          : typeof lead.assignedToId === "string"
                            ? "Tanya"
                            : "Tanya";

                      const lastContactDate = lead.lastContactedAt
                        ? new Date(lead.lastContactedAt).toLocaleDateString(
                            "en-US",
                          )
                        : "9/23/2026";

                      return (
                        <div
                          key={lead._id}
                          className={`rounded-2xl border shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between ${statusStyle.gridBg}`}
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
                                {/* Status Selector Dropdown */}
                                <div
                                  className="relative inline-block"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    disabled={updatingStatusLeadId === lead._id}
                                    onClick={() =>
                                      setActiveStatusDropdownId(
                                        activeStatusDropdownId === lead._id
                                          ? null
                                          : lead._id,
                                      )
                                    }
                                    className={`group inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                                      (
                                        STATUS_OPTIONS.find(
                                          (s) =>
                                            s.id === (lead.status || "NEW"),
                                        ) || STATUS_OPTIONS[0]
                                      ).bg
                                    } ${
                                      (
                                        STATUS_OPTIONS.find(
                                          (s) =>
                                            s.id === (lead.status || "NEW"),
                                        ) || STATUS_OPTIONS[0]
                                      ).text
                                    } ${
                                      (
                                        STATUS_OPTIONS.find(
                                          (s) =>
                                            s.id === (lead.status || "NEW"),
                                        ) || STATUS_OPTIONS[0]
                                      ).border
                                    }`}
                                    title="Click to update status"
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        (
                                          STATUS_OPTIONS.find(
                                            (s) =>
                                              s.id === (lead.status || "NEW"),
                                          ) || STATUS_OPTIONS[0]
                                        ).dot
                                      }`}
                                    />
                                    <span>
                                      {
                                        (
                                          STATUS_OPTIONS.find(
                                            (s) =>
                                              s.id === (lead.status || "NEW"),
                                          ) || STATUS_OPTIONS[0]
                                        ).label
                                      }
                                    </span>
                                    <ChevronDown className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                                  </button>

                                  {activeStatusDropdownId === lead._id && (
                                    <div className="absolute left-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1 space-y-0.5 text-xs font-semibold">
                                      {STATUS_OPTIONS.map((st) => (
                                        <button
                                          key={st.id}
                                          type="button"
                                          onClick={() =>
                                            handleQuickStatusChange(
                                              lead._id,
                                              st.id,
                                            )
                                          }
                                          className={`w-full flex items-center justify-between px-2 py-1 rounded-lg text-left text-[11px] ${
                                            (lead.status || "NEW") === st.id
                                              ? "bg-indigo-50 text-indigo-700 font-bold"
                                              : "text-slate-700 hover:bg-slate-50"
                                          }`}
                                        >
                                          <span className="flex items-center gap-1.5">
                                            <span
                                              className={`w-1.5 h-1.5 rounded-full ${st.dot}`}
                                            />
                                            {st.label}
                                          </span>
                                          {(lead.status || "NEW") === st.id && (
                                            <Check className="w-3 h-3 text-indigo-600" />
                                          )}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Lead Number & Source Badge */}
                                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  {lead.leadNumber ||
                                    `#${lead._id?.slice(-6).toUpperCase()}`}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    (lead.source || "GOOGLE").toUpperCase() ===
                                    "REFERRAL"
                                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                                      : "bg-slate-100 text-slate-700 border border-slate-200"
                                  }`}
                                >
                                  {(lead.source || "GOOGLE").toUpperCase()}
                                </span>
                              </div>

                              {/* Right Card Actions (Call, WhatsApp, Menu) */}
                              <div className="flex items-center gap-1 pr-6">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCallingLead(lead);
                                  }}
                                  className="text-slate-400 hover:text-[#F95721] hover:bg-orange-50 p-1 rounded-md transition-colors cursor-pointer"
                                  title="Call Phone"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </button>



                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuLeadId(
                                        activeMenuLeadId === lead._id
                                          ? null
                                          : lead._id,
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
                                        View Full Profile
                                      </Link>
                                      <button
                                        onClick={() => {
                                          handleOpenQuickEdit(lead);
                                          setActiveMenuLeadId(null);
                                        }}
                                        className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                                      >
                                        <Edit className="w-3.5 h-3.5 text-slate-400" />
                                        Quick Edit
                                      </button>
                                      <button
                                        onClick={() => {
                                          setQuickNoteLead(lead);
                                          setQuickNoteContent("");
                                          setActiveMenuLeadId(null);
                                        }}
                                        className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                                      >
                                        <StickyNote className="w-3.5 h-3.5 text-slate-400" />
                                        Add Remark
                                      </button>
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

                            {/* Company & Client Name + Shop Photo */}
                            <div className="flex items-start gap-3">
                              {(() => {
                                const photoUrl =
                                  lead.shopImageUrl ||
                                  lead.shopPhoto ||
                                  (Array.isArray(lead.documents)
                                    ? lead.documents.find(
                                        (d) =>
                                          d?.category === "PHOTO" ||
                                          (d?.fileUrl &&
                                            /\.(jpe?g|png|webp|gif)/i.test(
                                              d.fileUrl,
                                            )),
                                      )?.fileUrl
                                    : null);
                                return photoUrl ? (
                                  <img
                                    src={photoUrl}
                                    alt="Shop Front"
                                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 shadow-2xs bg-slate-100 cursor-pointer hover:opacity-90 hover:scale-105 transition-all"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(photoUrl, "_blank");
                                    }}
                                  />
                                ) : null;
                              })()}
                              <div className="min-w-0 flex-1">
                                <Link
                                  href={`/dashboard/leads/${lead._id}`}
                                  className="block font-bold text-slate-900 text-[15px] hover:text-indigo-600 transition-colors leading-snug truncate"
                                >
                                  {companyName}
                                </Link>
                                <div className="flex items-center justify-between text-xs text-slate-500 font-medium mt-0.5">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <User className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate">
                                      {contactPerson}
                                    </span>
                                  </div>
                                  {lead.createdAt && (
                                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                                      {new Date(
                                        lead.createdAt,
                                      ).toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                      })}
                                    </span>
                                  )}
                                </div>
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
                                      : (lead.source || "").toUpperCase() ===
                                          "REFERRAL"
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
                                <div className="text-right truncate max-w-50">
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
                          <div
                            className={`w-full h-1.5 ${statusStyle.accentBar}`}
                          />
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-16 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
                      No leads matching current filters.
                    </div>
                  )}
                </div>
              )}

              {/* List View */}
              {viewMode === "list" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full text-left text-xs min-w-[1100px]">
                      <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold whitespace-nowrap">
                        <tr>
                          <th className="px-3 py-3.5 w-9 text-center shrink-0"></th>
                          <th className="px-4 py-3.5 min-w-[220px] whitespace-nowrap">
                            Lead / Company
                          </th>
                          <th className="px-3 py-3.5 min-w-[130px] whitespace-nowrap">
                            Contact
                          </th>
                          <th className="px-3 py-3.5 min-w-[110px] whitespace-nowrap">
                            Source
                          </th>
                          <th className="px-3 py-3.5 min-w-[150px] whitespace-nowrap">
                            Requirement
                          </th>
                          <th className="px-3 py-3.5 min-w-[120px] whitespace-nowrap">
                            Expected Value
                          </th>
                          <th className="px-3 py-3.5 min-w-[140px] whitespace-nowrap">
                            Next Follow-up
                          </th>
                          <th className="px-3 py-3.5 min-w-[110px] whitespace-nowrap">
                            Assigned To
                          </th>
                          <th className="px-3 py-3.5 min-w-[140px] whitespace-nowrap">
                            Status
                          </th>
                          <th className="px-4 py-3.5 text-right min-w-[170px] whitespace-nowrap">
                            Quick Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredLeads.map((lead) => {
                          const val =
                            Number(lead.expectedValue) ||
                            Number(lead.estimatedBudget) ||
                            0;
                          const isExpanded = expandedLeadId === lead._id;
                          const statusStyle = getLeadStatusStyle(lead.status);
                          const statusCfg =
                            STATUS_OPTIONS.find(
                              (s) => s.id === (lead.status || "NEW"),
                            ) || STATUS_OPTIONS[0];
                          const flwInfo = formatFollowupDisplay(
                            lead.nextFollowUp,
                          );
                          const priorityCfg = {
                            URGENT: {
                              label: "Urgent",
                              badge: "bg-rose-50 text-rose-700 border-rose-200",
                              icon: Flame,
                            },
                            HIGH: {
                              label: "High",
                              badge:
                                "bg-amber-50 text-amber-800 border-amber-200",
                              icon: Star,
                            },
                            MEDIUM: {
                              label: "Medium",
                              badge:
                                "bg-orange-50 text-orange-700 border-orange-200",
                            },
                            LOW: {
                              label: "Low",
                              badge:
                                "bg-slate-100 text-slate-600 border-slate-200",
                            },
                          }[lead.priority || "MEDIUM"] || {
                            label: "Medium",
                            badge:
                              "bg-orange-50 text-orange-700 border-orange-200",
                          };
                          const areaText = formatLeadTerritory(lead);

                          return (
                            <React.Fragment key={lead._id}>
                              <tr
                                className={`transition-colors ${
                                  isExpanded
                                    ? statusStyle.expandedBg
                                    : statusStyle.rowBg
                                }`}
                              >
                                {/* Expand chevron */}
                                <td
                                  className={`p-2.5  w-10 text-center ${statusStyle.borderL}`}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedLeadId(
                                        isExpanded ? null : lead._id,
                                      )
                                    }
                                    className={`w-6 h-6 bg-indigo-50 rounded-md flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer ${
                                      isExpanded
                                        ? "rotate-180 text-indigo-600 bg-indigo-50"
                                        : ""
                                    }`}
                                    title={
                                      isExpanded
                                        ? "Collapse inline details"
                                        : "Expand inline details"
                                    }
                                  >
                                    <ChevronDown className="w-5 h-5 transition-transform" />
                                  </button>
                                </td>

                                {/* Lead / Company */}
                                <td className="px-4 py-3.5">
                                  <div className="flex items-start gap-2.5">
                                    {(() => {
                                      const photoUrl =
                                        lead.shopImageUrl ||
                                        lead.shopPhoto ||
                                        (Array.isArray(lead.documents)
                                          ? lead.documents.find(
                                              (d) =>
                                                d?.category === "PHOTO" ||
                                                (d?.fileUrl &&
                                                  /\.(jpe?g|png|webp|gif)/i.test(
                                                    d.fileUrl,
                                                  )),
                                            )?.fileUrl
                                          : null);
                                      return photoUrl ? (
                                        <img
                                          src={photoUrl}
                                          alt="Shop"
                                          className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0 cursor-pointer hover:scale-105 transition-all shadow-2xs mt-0.5"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(photoUrl, "_blank");
                                          }}
                                          title="Click to view shop photo"
                                        />
                                      ) : null;
                                    })()}
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <Link
                                          href={`/dashboard/leads/${lead._id}`}
                                          className="font-bold text-slate-900 hover:text-indigo-600 truncate text-[13px] leading-tight"
                                        >
                                          {(lead.businessName && lead.businessName !== "Direct Lead" && lead.businessName !== "—" ? lead.businessName : null) ||
                                            (lead.companyName && lead.companyName !== "Direct Lead" && lead.companyName !== "—" ? lead.companyName : null) ||
                                            (lead.contactName && lead.contactName !== "Direct Lead" && lead.contactName !== "—" ? lead.contactName : null) ||
                                            (lead.customerName && lead.customerName !== "Direct Lead" && lead.customerName !== "—" ? lead.customerName : null) ||
                                            "Lead"}
                                        </Link>
                                        <span
                                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[12px] font-bold border ${priorityCfg.badge}`}
                                        >
                                          {priorityCfg.icon && (
                                            <priorityCfg.icon className="w-3 h-3 shrink-0" />
                                          )}
                                          {priorityCfg.label}
                                        </span>
                                      </div>
                                      <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        <span>
                                          {(() => {
                                            const b = (lead.businessName && lead.businessName !== "Direct Lead" && lead.businessName !== "—" ? lead.businessName : null) || (lead.companyName && lead.companyName !== "Direct Lead" && lead.companyName !== "—" ? lead.companyName : null);
                                            const c = (lead.contactName && lead.contactName !== "Direct Lead" && lead.contactName !== "—" ? lead.contactName : null) || (lead.customerName && lead.customerName !== "Direct Lead" && lead.customerName !== "—" ? lead.customerName : null);
                                            if (b && c && b.toLowerCase() !== c.toLowerCase()) {
                                              return `👤 Contact: ${c}`;
                                            }
                                            return lead.businessCategory || lead.requirement || (lead.source ? `${lead.source} Lead` : "Lead");
                                          })()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Contact info & Direct Call */}
                                <td className="px-3 py-3.5 whitespace-nowrap">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                                      <span className="font-mono font-semibold text-slate-800 text-sm">
                                        {lead.phone || "-"}
                                      </span>
                                      {lead.phone && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleCopyPhone(lead.phone)
                                          }
                                          className="text-slate-300 hover:text-slate-600 p-0.5 rounded cursor-pointer transition-colors"
                                          title="Copy Phone Number"
                                        >
                                          <Copy className="w-2.5 h-2.5" />
                                        </button>
                                      )}
                                    </div>
                                    {lead.email && (
                                      <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                                        {lead.email}
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* Source */}
                                <td className="px-3 py-3.5 whitespace-nowrap">
                                  <span
                                    className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap ${
                                      (
                                        lead.source || "GOOGLE"
                                      ).toUpperCase() === "REFERRAL"
                                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                                        : (
                                              lead.source || "GOOGLE"
                                            ).toUpperCase() === "DATA_OPERATOR"
                                          ? "bg-sky-50 text-sky-700 border border-sky-200"
                                          : (
                                                lead.source || "GOOGLE"
                                              ).toUpperCase() === "WALK_IN"
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                            : "bg-slate-100 text-slate-700 border border-slate-200"
                                    }`}
                                  >
                                    {(lead.source || "GOOGLE").replace(
                                      /_/g,
                                      " ",
                                    )}
                                  </span>
                                </td>

                                {/* Requirement */}
                                <td className="px-3 py-3.5 whitespace-nowrap">
                                  <div>
                                    {renderRequirementBadge(lead.requirement)}
                                    {Number(
                                      lead.printingRequirement?.quantity,
                                    ) > 0 && (
                                      <span className="text-[10px] text-slate-400 block mt-0.5 font-medium whitespace-nowrap">
                                        Qty: {lead.printingRequirement.quantity}{" "}
                                        {lead.printingRequirement.unit || "PCS"}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Expected Value */}
                                <td className="px-3 py-3.5 whitespace-nowrap">
                                  <div className="font-black text-slate-900 text-base sm:text-lg whitespace-nowrap">
                                    ₹{val.toLocaleString("en-IN")}
                                  </div>
                                </td>

                                {/* Next Follow-up */}
                                <td className="px-3 py-3.5 whitespace-nowrap">
                                  {flwInfo ? (
                                    <div
                                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border whitespace-nowrap ${
                                        flwInfo.isOverdue
                                          ? "bg-rose-50 text-rose-700 border-rose-200"
                                          : flwInfo.isToday
                                            ? "bg-amber-50 text-amber-800 border-amber-200"
                                            : "bg-slate-50 text-slate-700 border-slate-200"
                                      }`}
                                    >
                                      <Clock className="w-3 h-3 shrink-0" />
                                      <span className="truncate">
                                        {flwInfo.label}
                                      </span>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedLead(lead);
                                        setShowFollowupModal(true);
                                      }}
                                      className="text-indigo-600 hover:text-indigo-800 text-[11px] font-semibold hover:underline cursor-pointer flex items-center gap-1 whitespace-nowrap"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>Schedule</span>
                                    </button>
                                  )}
                                </td>

                                {/* Assigned To */}
                                <td className="px-3 py-3.5 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[9px] flex items-center justify-center shrink-0">
                                      {(lead.assignedToId?.name || "Tanya")
                                        .slice(0, 1)
                                        .toUpperCase()}
                                    </div>
                                    <span className="font-semibold text-slate-700 truncate max-w-[90px]">
                                      {lead.assignedToId?.name || "Tanya"}
                                    </span>
                                  </div>
                                </td>

                                {/* Interactive Status Selector Pill */}
                                <td className="px-3 py-3.5 whitespace-nowrap">
                                  <div
                                    className="relative inline-block"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      disabled={
                                        updatingStatusLeadId === lead._id
                                      }
                                      onClick={() =>
                                        setActiveStatusDropdownId(
                                          activeStatusDropdownId === lead._id
                                            ? null
                                            : lead._id,
                                        )
                                      }
                                      className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 ${
                                        statusCfg.bg
                                      } ${statusCfg.text} ${statusCfg.border} ${
                                        updatingStatusLeadId === lead._id
                                          ? "opacity-60 cursor-wait"
                                          : ""
                                      }`}
                                      title="Click to change status immediately"
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}
                                      />
                                      <span>{statusCfg.label}</span>
                                      {updatingStatusLeadId === lead._id ? (
                                        <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                                      ) : (
                                        <ChevronDown className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-transform group-hover:translate-y-0.5" />
                                      )}
                                    </button>

                                    {/* Status Popup Menu */}
                                    {activeStatusDropdownId === lead._id && (
                                      <div className="absolute left-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-0.5 space-y-0.5 animate-scale-up text-xs font-semibold">
                                        <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100 mb-1">
                                          Change Status
                                        </div>
                                        {STATUS_OPTIONS.map((st) => (
                                          <button
                                            key={st.id}
                                            type="button"
                                            onClick={() =>
                                              handleQuickStatusChange(
                                                lead._id,
                                                st.id,
                                              )
                                            }
                                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer ${
                                              (lead.status || "NEW") === st.id
                                                ? "bg-indigo-50 text-indigo-700 font-bold"
                                                : "text-slate-700 hover:bg-slate-50"
                                            }`}
                                          >
                                            <div className="flex items-center gap-2">
                                              <span
                                                className={`w-2 h-2 rounded-full ${st.dot}`}
                                              />
                                              <span>{st.label}</span>
                                            </div>
                                            {(lead.status || "NEW") ===
                                              st.id && (
                                              <Check className="w-3.5 h-3.5 text-indigo-600" />
                                            )}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* Quick Actions Toolbar */}
                                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                                    {/* Call Button */}
                                    <button
                                      type="button"
                                      onClick={() => setCallingLead(lead)}
                                      className="p-1.5 rounded-lg bg-orange-50 text-[#F95721] hover:bg-[#e84915] hover:text-white transition-all cursor-pointer shadow-2xs"
                                      title="Call customer now"
                                    >
                                      <Phone className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Quick Note Button */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setQuickNoteLead(lead);
                                        setQuickNoteContent("");
                                      }}
                                      className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white transition-all cursor-pointer shadow-2xs"
                                      title="Add quick remark / note"
                                    >
                                      <StickyNote className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Quick Edit */}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenQuickEdit(lead)}
                                      className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-700 hover:text-white transition-all cursor-pointer shadow-2xs"
                                      title="Quick edit lead"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>

                                    {/* More Menu Dropdown */}
                                    <div className="relative">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveMenuLeadId(
                                            activeMenuLeadId === lead._id
                                              ? null
                                              : lead._id,
                                          );
                                        }}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                        title="More actions"
                                      >
                                        <MoreVertical className="w-3.5 h-3.5" />
                                      </button>

                                      {activeMenuLeadId === lead._id && (
                                        <div
                                          onClick={(e) => e.stopPropagation()}
                                          className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 text-xs"
                                        >
                                          <Link
                                            href={`/dashboard/leads/${lead._id}`}
                                            className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                                          >
                                            <FileText className="w-3.5 h-3.5 text-indigo-500" />
                                            Open Full 360° Profile
                                          </Link>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleOpenQuickEdit(lead);
                                              setActiveMenuLeadId(null);
                                            }}
                                            className="w-full text-left flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                                          >
                                            <Edit className="w-3.5 h-3.5 text-slate-400" />
                                            Quick Edit Details
                                          </button>
                                          {isManagerOrAdmin && (
                                            <button
                                              type="button"
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
                                              className="w-full text-left flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                                            >
                                              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                                              Reassign Lead
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>

                              {/* INLINE EXPANDED DETAILS DRAWER */}
                              {isExpanded && (
                                <tr
                                  className={`border-b-2 border-slate-300 ${statusStyle.expandedBg}`}
                                >
                                  <td
                                    colSpan={10}
                                    className={`p-4 md:p-5 ${statusStyle.borderL}`}
                                  >
                                    <div className="space-y-4">
                                      {/* Top Bar of Drawer: Identity & Pipeline fast switcher */}
                                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-indigo-100">
                                        <div className="flex items-center gap-3">
                                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <h4 className="font-bold text-slate-900 text-sm">
                                                {lead.companyName ||
                                                  lead.businessName ||
                                                  "Customer Overview"}
                                              </h4>
                                              <span className="text-[11px] font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                                                {lead.leadNumber ||
                                                  `#${lead._id?.slice(-6)}`}
                                              </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                              Contact:{" "}
                                              <strong className="text-slate-700">
                                                {lead.customerName ||
                                                  lead.contactName ||
                                                  "Owner"}
                                              </strong>{" "}
                                              • Phone:{" "}
                                              <strong className="font-mono text-slate-700">
                                                {lead.phone || "-"}
                                              </strong>
                                            </p>
                                          </div>
                                        </div>

                                        {/* Fast Pipeline Switcher Bar */}
                                        <div className="flex items-center gap-3 flex-wrap">
                                          <span className="text-[12px] uppercase font-bold text-slate-400 mr-1">
                                            Stage:
                                          </span>
                                          {STATUS_OPTIONS.map((st) => {
                                            const isCurrent =
                                              (lead.status || "NEW") === st.id;
                                            return (
                                              <button
                                                key={st.id}
                                                type="button"
                                                onClick={() =>
                                                  handleQuickStatusChange(
                                                    lead._id,
                                                    st.id,
                                                  )
                                                }
                                                className={`px-2.5 py-1 rounded-lg text-[12px] font-bold transition-all cursor-pointer border ${
                                                  isCurrent
                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                                }`}
                                              >
                                                {st.label}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      {/* 3-Column Bento Cards */}
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                        {/* 1. Contact & Location Info */}
                                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5">
                                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                                              <Phone className="w-3.5 h-3.5 text-[#F95721]" />
                                              Contact Details
                                            </span>
                                          </div>

                                          <div className="space-y-1.5 text-[11px]">
                                            <div className="flex justify-between">
                                              <span className="text-slate-400 text-sm">
                                                Primary Phone:
                                              </span>
                                              <span className="font-mono font-bold text-slate-800 text-lg">
                                                {lead.phone || "-"}
                                              </span>
                                            </div>
                                            {lead.alternatePhone && (
                                              <div className="flex justify-between">
                                                <span className="text-slate-400 text-md">
                                                  Alt Phone:
                                                </span>
                                                <span className="font-mono text-slate-700 text-md">
                                                  {lead.alternatePhone}
                                                </span>
                                              </div>
                                            )}
                                            {lead.email && (
                                              <div className="flex justify-between">
                                                <span className="text-slate-400 text-lg">
                                                  Email:
                                                </span>
                                                <span className="text-slate-700 truncate max-w-[150px] text-lg">
                                                  {lead.email}
                                                </span>
                                              </div>
                                            )}
                                            <div className="flex justify-between items-center">
                                              <span className="text-slate-400 text-sm">
                                                Area / Zone:
                                              </span>
                                              <span className="font-bold font-mono inline-flex items-center gap-1 px-2 py-0.5 text-sm">
                                                {formatLeadTerritory(lead) ||
                                                  "Not specified"}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-slate-400 text-sm">
                                                Source:
                                              </span>
                                              <span className="font-bold text-slate-700 text-sm">
                                                {lead.source || "GOOGLE"}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* 2. Quick Actions: Quotation, Order, Payment, Build Documents */}
                                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5">
                                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                                            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                                              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                              Quick Actions
                                            </span>
                                            <span className="font-black text-indigo-600 text-xs">
                                              ₹{val.toLocaleString("en-IN")}
                                            </span>
                                          </div>

                                          {/* The 4 Core Quick Actions */}
                                          <div className="grid grid-cols-2 gap-2">
                                            {/* 1. Quotation */}
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const bName =
                                                  lead.businessName ||
                                                  lead.companyName ||
                                                  "";
                                                const cName =
                                                  lead.contactName ||
                                                  lead.customerName ||
                                                  "";
                                                router.push(
                                                  `/dashboard/quotations?leadId=${lead._id}&businessName=${encodeURIComponent(
                                                    bName,
                                                  )}&companyName=${encodeURIComponent(
                                                    bName,
                                                  )}&contactPerson=${encodeURIComponent(
                                                    cName,
                                                  )}&customerName=${encodeURIComponent(
                                                    cName || bName,
                                                  )}&phone=${encodeURIComponent(
                                                    lead.phone || "",
                                                  )}`,
                                                );
                                              }}
                                              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200/90 text-left transition-all cursor-pointer group hover:shadow-xs"
                                              title="Create or send quotation for this lead"
                                            >
                                              <span className="p-1 rounded-md bg-emerald-600 text-white shadow-2xs group-hover:scale-105 transition-transform">
                                                <FileText className="w-3.5 h-3.5" />
                                              </span>

                                              <span className="font-bold text-[15px] text-slate-800 group-hover:text-emerald-900 leading-tight">
                                                Quotation
                                              </span>
                                            </button>

                                            {/* 2. Order */}
                                            <button
                                              type="button"
                                              onClick={() =>
                                                router.push(
                                                  `/dashboard/leads/${lead._id}?tab=Orders&openOrder=true`,
                                                )
                                              }
                                              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200/90 text-left transition-all cursor-pointer group hover:shadow-xs"
                                              title="Convert lead to confirmed order"
                                            >
                                              <span className="p-1 rounded-md bg-indigo-600 text-white shadow-2xs group-hover:scale-105 transition-transform">
                                                <ShoppingBag className="w-3.5 h-3.5" />
                                              </span>

                                              <span className="font-bold text-[15px] text-slate-800 group-hover:text-indigo-900 leading-tight">
                                                Order
                                              </span>
                                            </button>

                                            {/* 3. Payment */}
                                            <button
                                              type="button"
                                              onClick={() =>
                                                router.push(
                                                  `/dashboard/leads/${lead._id}?tab=Payments&openPayment=true`,
                                                )
                                              }
                                              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-orange-50/70 hover:bg-orange-100/80 border border-orange-200/90 text-left transition-all cursor-pointer group hover:shadow-xs"
                                              title="Record advance or settlement payment"
                                            >
                                              <span className="p-1 rounded-md bg-[#F95721] text-white shadow-2xs group-hover:scale-105 transition-transform">
                                                <CreditCard className="w-3.5 h-3.5" />
                                              </span>

                                              <span className="font-bold text-[15px] text-slate-800 group-hover:text-orange-950 leading-tight">
                                                Payment
                                              </span>
                                            </button>

                                            {/* 4. Build Documents */}
                                            <button
                                              type="button"
                                              onClick={() =>
                                                router.push(
                                                  `/dashboard/leads/${lead._id}?tab=Documents&openDoc=true`,
                                                )
                                              }
                                              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-purple-50/70 hover:bg-purple-100/80 border border-purple-200/90 text-left transition-all cursor-pointer group hover:shadow-xs"
                                              title="Build documents, technical specs & artwork dossier"
                                            >
                                              <span className="p-1 rounded-md bg-purple-600 text-white shadow-2xs group-hover:scale-105 transition-transform">
                                                <Layers className="w-3.5 h-3.5" />
                                              </span>
                                              <span className="font-bold text-[15px] text-slate-800 group-hover:text-purple-900 leading-tight">
                                                Documents
                                              </span>
                                            </button>
                                          </div>
                                        </div>

                                        {/* 3. Remarks & Quick Inline Note Adder */}
                                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5">
                                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                                              <StickyNote className="w-3.5 h-3.5 text-amber-600" />
                                              Notes &amp; Activity
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                              Add inline remark
                                            </span>
                                          </div>

                                          {/* Existing Notes snippet */}
                                          <div className="text-[11px] text-slate-600 max-h-16 overflow-y-auto bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-1">
                                            {lead.notesTimeline &&
                                            lead.notesTimeline.length > 0 ? (
                                              lead.notesTimeline
                                                .slice(0, 2)
                                                .map((nt, idx) => (
                                                  <div
                                                    key={idx}
                                                    className="border-b border-slate-200/50 pb-1 last:border-none last:pb-0"
                                                  >
                                                    <span className="font-semibold text-slate-800">
                                                      {nt.authorName || "Sales"}
                                                      :
                                                    </span>{" "}
                                                    {nt.content}
                                                  </div>
                                                ))
                                            ) : lead.notes ? (
                                              <div>{lead.notes}</div>
                                            ) : (
                                              <span className="text-slate-400 italic">
                                                No remarks logged yet.
                                              </span>
                                            )}
                                          </div>

                                          {/* Quick Inline Note Input */}
                                          <div className="flex items-center gap-2 pt-1">
                                            <input
                                              type="text"
                                              placeholder="Quick note or call takeaway..."
                                              value={
                                                inlineNoteText[lead._id] || ""
                                              }
                                              onChange={(e) =>
                                                setInlineNoteText({
                                                  ...inlineNoteText,
                                                  [lead._id]: e.target.value,
                                                })
                                              }
                                              onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                  handleSaveInlineNote(
                                                    lead._id,
                                                  );
                                                }
                                              }}
                                              className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                                            />
                                            <button
                                              type="button"
                                              disabled={
                                                savingInlineNoteId ===
                                                  lead._id ||
                                                !(
                                                  inlineNoteText[lead._id] || ""
                                                ).trim()
                                              }
                                              onClick={() =>
                                                handleSaveInlineNote(lead._id)
                                              }
                                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg text-[11px] cursor-pointer shrink-0 transition-colors"
                                            >
                                              {savingInlineNoteId === lead._id
                                                ? "Saving..."
                                                : "Save"}
                                            </button>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Bottom Actions Row in Expanded Drawer */}
                                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => setCallingLead(lead)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F95721] hover:bg-[#e84915] text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                                          >
                                            <Phone className="w-3.5 h-3.5" />
                                            <span>Call Customer</span>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedLead(lead);
                                              setShowFollowupModal(true);
                                            }}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-colors cursor-pointer"
                                          >
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>Schedule Follow-up</span>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleOpenQuickEdit(lead)
                                            }
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer"
                                          >
                                            <Edit className="w-3.5 h-3.5" />
                                            <span>Quick Edit</span>
                                          </button>
                                        </div>

                                        <Link
                                          href={`/dashboard/leads/${lead._id}`}
                                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 group"
                                        >
                                          <span>Open Complete 360° Lead</span>
                                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* CREATE LEAD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl w-full max-w-lg p-4 sm:p-6 space-y-4 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Add New Lead
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  handleRemovePhoto();
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sharma Constructions"
                    value={newLead.businessName || newLead.companyName || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewLead({
                        ...newLead,
                        businessName: val,
                        companyName: val,
                      });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Sharma"
                    value={newLead.customerName || newLead.contactName || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewLead({
                        ...newLead,
                        customerName: val,
                        contactName: val,
                      });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              {/* Shop / Lead Photo Upload */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-semibold block flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-indigo-600" />
                    Shop / Lead Photo (Optional)
                  </span>
                  {leadPhotoFile && (
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Photo Selected
                    </span>
                  )}
                </label>

                {leadPhotoPreview ? (
                  <div className="relative p-2.5 bg-slate-50 border-2 border-dashed border-indigo-200 rounded-2xl flex items-center gap-3">
                    <img
                      src={leadPhotoPreview}
                      alt="Shop Preview"
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {leadPhotoFile?.name || "Shop Image"}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {leadPhotoFile?.size
                          ? `${(leadPhotoFile.size / 1024).toFixed(1)} KB`
                          : "Ready to upload"}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <label
                          htmlFor="leads-page-photo-input"
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer hover:underline"
                        >
                          Change
                        </label>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="text-[11px] font-bold text-red-500 hover:text-red-700 cursor-pointer hover:underline flex items-center gap-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="leads-page-photo-input"
                    className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl bg-slate-50/80 hover:bg-indigo-50/30 transition-all cursor-pointer group text-center"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 group-hover:scale-110 flex items-center justify-center transition-transform mb-1 shadow-2xs">
                      <Camera className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600">
                      Click to take photo or upload shop image
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      JPG, PNG, WEBP • Max 10MB
                    </span>
                  </label>
                )}

                <input
                  id="leads-page-photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <label className="text-slate-700 font-semibold block mb-1">
                  Territory (Area / Zone) *
                </label>
                <select
                  value={newLead.territory || "burari/baba colony"}
                  onChange={(e) => {
                    const val = e.target.value;
                    let targetAssignee = newLead.assignedToId;
                    if (val.includes("baba colony")) {
                      const tanya = users.find(
                        (u) =>
                          (u.name || "").toLowerCase().includes("tanya") ||
                          (u.email || "").toLowerCase().includes("tanya"),
                      );
                      if (tanya) targetAssignee = tanya._id;
                    }
                    setNewLead({
                      ...newLead,
                      territory: val,
                      assignedToId: targetAssignee,
                    });
                  }}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="burari/baba colony">
                    burari/baba colony (Assigned to Tanya)
                  </option>
                  <option value="burari/sant nagar">burari/sant nagar</option>
                  <option value="burari">burari (General)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1 flex items-center justify-between">
                  <span>Assign To</span>
                  {!isManagerOrAdmin && (
                    <span className="text-[10px] text-[#F95721] font-semibold flex items-center gap-1">
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
                      <div className="w-5 h-5 rounded-full bg-[#F95721] text-white text-[9px] font-bold flex items-center justify-center shrink-0">
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
                  onClick={() => {
                    setShowAddModal(false);
                    handleRemovePhoto();
                  }}
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
                      <span>{isUploadingPhoto ? "Uploading Photo..." : "Creating Lead..."}</span>
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
                Upload your CSV file containing commercial printing inquiries.
                Ensure columns include: Customer Name, Company, Phone, Expected
                Value, Requirement.
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
                      const r = (u.roleSlug || u.role || "")
                        .toLowerCase()
                        .trim();
                      if (
                        r.includes("admin") ||
                        r === "manager" ||
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
              <h3 className="text-base font-bold text-slate-900">
                Schedule Follow-up
              </h3>
              <button
                onClick={() => setShowFollowupModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
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

      {/* QUICK CALL & LOG OUTCOME MODAL */}
      {callingLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-orange-50 text-[#F95721] flex items-center justify-center mx-auto shadow-inner">
              <PhoneCall className="w-7 h-7 text-[#F95721] animate-pulse" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Connect with{" "}
                {callingLead.customerName ||
                  callingLead.contactName ||
                  "Customer"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {callingLead.companyName ||
                  callingLead.businessName ||
                  "Commercial Lead"}
              </p>
              <div className="mt-2 text-xl font-black text-slate-900 font-mono tracking-wider">
                {callingLead.phone}
              </div>
            </div>

            <div className="pt-1">
              <a
                href={`tel:${callingLead.phone}`}
                className="w-full py-2.5 bg-[#F95721] hover:bg-[#e84915] text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Device</span>
              </a>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setCallingLead(null)}
                className="w-full py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK NOTE MODAL */}
      {quickNoteLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-amber-500" />
                Add Remark:{" "}
                {quickNoteLead.companyName || quickNoteLead.customerName}
              </h3>
              <button
                onClick={() => setQuickNoteLead(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSaveQuickNote}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Category
                </label>
                <select
                  value={quickNoteCategory}
                  onChange={(e) => setQuickNoteCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium"
                >
                  <option value="GENERAL">General Discussion</option>
                  <option value="CLIENT_PREFERENCE">Client Preference</option>
                  <option value="NEGOTIATION">
                    Negotiation / Rate Discussion
                  </option>
                  <option value="TECHNICAL_PRINTING">
                    Technical / Printing Specs
                  </option>
                  <option value="URGENT_REMARK">Urgent Remark</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Note Content *
                </label>
                <textarea
                  required
                  rows={3}
                  value={quickNoteContent}
                  onChange={(e) => setQuickNoteContent(e.target.value)}
                  placeholder="Record customer preferences, urgent instructions, or next commitments..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickNoteLead(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuickNote}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {savingQuickNote ? "Saving Note..." : "Save Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK EDIT LEAD MODAL */}
      {quickEditLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl w-full max-w-lg p-4 sm:p-6 space-y-4 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit className="w-4 h-4 text-indigo-600" />
                Quick Edit Lead
              </h3>
              <button
                onClick={() => setQuickEditLead(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSaveQuickEdit}
              className="space-y-3.5 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={quickEditForm.contactName}
                    onChange={(e) =>
                      setQuickEditForm({
                        ...quickEditForm,
                        contactName: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Business / Brand
                  </label>
                  <input
                    type="text"
                    value={quickEditForm.businessName}
                    onChange={(e) =>
                      setQuickEditForm({
                        ...quickEditForm,
                        businessName: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={quickEditForm.phone}
                    onChange={(e) =>
                      setQuickEditForm({
                        ...quickEditForm,
                        phone: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Expected Value (₹)
                  </label>
                  <input
                    type="number"
                    value={quickEditForm.expectedValue}
                    onChange={(e) =>
                      setQuickEditForm({
                        ...quickEditForm,
                        expectedValue: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Printing Requirement
                </label>
                <input
                  type="text"
                  value={quickEditForm.requirement}
                  onChange={(e) =>
                    setQuickEditForm({
                      ...quickEditForm,
                      requirement: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Territory (Area / Zone)
                </label>
                <select
                  value={quickEditForm.territory || "burari/baba colony"}
                  onChange={(e) =>
                    setQuickEditForm({
                      ...quickEditForm,
                      territory: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono font-medium"
                >
                  <option value="burari/baba colony">
                    burari/baba colony (Tanya)
                  </option>
                  <option value="burari/sant nagar">burari/sant nagar</option>
                  <option value="burari">burari (General)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Priority
                </label>
                <select
                  value={quickEditForm.priority}
                  onChange={(e) =>
                    setQuickEditForm({
                      ...quickEditForm,
                      priority: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High (Warm)</option>
                  <option value="URGENT">Urgent (Hot Lead)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickEditLead(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuickEdit}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {savingQuickEdit ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border ${
              toast.type === "error"
                ? "bg-rose-900 text-white border-rose-700"
                : "bg-slate-900 text-white border-slate-800"
            }`}
          >
            {toast.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
