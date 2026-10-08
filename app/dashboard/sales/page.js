"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import {
  Users,
  Clock,
  FileText,
  ShoppingBag,
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
  List,
  Sparkles,
  Inbox,
  IndianRupee,
  Lock,
  Loader2,
  Camera,
  Upload,
  Trash2,
} from "lucide-react";

export default function SalesDashboardPage() {
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
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        if (u && Object.keys(u).length > 0) return u;
      } catch {}
    }
    return null;
  });
  const [users, setUsers] = useState([]);
  const [currentUserAvatar, setCurrentUserAvatar] = useState(null);

  const isManagerOrAdmin = useMemo(() => {
    if (typeof window === "undefined") return false;
    const r = (localStorage.getItem("userRole") || "").toLowerCase();
    return r.includes("admin") || r.includes("manager") || r.includes("owner");
  }, []);

  // Live Backend Data
  const [leads, setLeads] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Automatic Responsive Viewport Tracking based on actual device width
  const [windowWidth, setWindowWidth] = useState(() => {
    if (typeof window !== "undefined") return window.innerWidth;
    return 1200;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;

  // Responsive Lead Presentation: 'cards' | 'table'
  const [mobileLeadLayout, setMobileLeadLayout] = useState(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768)
      return "cards";
    return "table";
  });

  // Mobile Section Tab: 'leads' | 'focus' | 'activity' | 'actions'
  const [mobileActiveSection, setMobileActiveSection] = useState("leads");

  // Raw data view presentation on mobile: 'cards' | 'table'
  const [mobileRawLayout, setMobileRawLayout] = useState("cards");

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
            setCurrentUser(u);
            if (u.name) setUserName(u.name.split(" ")[0]);
            if (u.avatarUrl) setCurrentUserAvatar(u.avatarUrl);
          }
        } catch {}
      }

      try {
        const meRes = await api.get("/auth/me", { silent: true });
        if (meRes?.data?.user) {
          const u = meRes.data.user;
          setCurrentUser(u);
          if (u.name) setUserName(u.name.split(" ")[0]);
          if (u.avatarUrl) setCurrentUserAvatar(u.avatarUrl);
        }
      } catch {}

      // 2. Fetch live leads, follow-ups, quotations, orders, users
      const [leadsRes, flwRes, quoteRes, ordersRes, usersRes] = await Promise.allSettled([
        api.get("/leads?limit=100&sortBy=createdAt&sortOrder=desc", {
          silent: true,
        }),
        api.get("/followups?limit=50&sortBy=scheduledAt&sortOrder=asc", {
          silent: true,
        }),
        api.get("/quotations?limit=50&sortBy=createdAt&sortOrder=desc", {
          silent: true,
        }),
        api.get("/orders?limit=50&sortBy=createdAt&sortOrder=desc", {
          silent: true,
        }),
        api.get("/users", { silent: true }),
      ]);

      if (usersRes.status === "fulfilled" && usersRes.value?.data) {
        const raw = usersRes.value.data;
        const list = Array.isArray(raw) ? raw : raw.users || raw.records || [];
        setUsers(list);
      }

      if (leadsRes.status === "fulfilled" && leadsRes.value?.data) {
        const raw = leadsRes.value.data;
        const list = Array.isArray(raw) ? raw : raw.records || raw.leads || [];
        setLeads(list);
      }
      if (flwRes.status === "fulfilled" && flwRes.value?.data) {
        const raw = flwRes.value.data;
        const list = Array.isArray(raw)
          ? raw
          : raw.records || raw.followups || [];
        setFollowups(list);
      }
      if (quoteRes.status === "fulfilled" && quoteRes.value?.data) {
        const raw = quoteRes.value.data;
        const list = Array.isArray(raw)
          ? raw
          : raw.records || raw.quotations || [];
        setQuotations(list);
      }
      if (ordersRes.status === "fulfilled" && ordersRes.value?.data) {
        const raw = ordersRes.value.data;
        const list = Array.isArray(raw) ? raw : raw.records || raw.orders || [];
        setOrders(list);
      }
    } catch (err) {
      console.error("Sales dashboard load error:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Normalise backend leads for UI display
  const displayLeads = useMemo(() => {
    return (leads || []).map((l) => {
      const unifiedName = (
        (l.businessName && l.businessName.trim() !== "Direct Lead" && l.businessName.trim() !== "—" ? l.businessName.trim() : null) ||
        (l.companyName && l.companyName.trim() !== "Direct Lead" && l.companyName.trim() !== "—" ? l.companyName.trim() : null) ||
        (l.contactName && l.contactName.trim() !== "Direct Lead" && l.contactName.trim() !== "—" ? l.contactName.trim() : null) ||
        (l.customerName && l.customerName.trim() !== "Direct Lead" && l.customerName.trim() !== "—" ? l.customerName.trim() : null) ||
        "Inquiry"
      );
      const bName = unifiedName;
      const cName = l.contactName && l.contactName !== unifiedName ? l.contactName : (l.customerName && l.customerName !== unifiedName ? l.customerName : unifiedName);
      const phone = l.phone || l.mobileNumber || "—";
      const areaName = l.area || l.address?.city || l.location || "Burari";
      const zoneName = l.zone || l.address?.state || "Sant Nagar";

      // Requirements extraction
      let reqTitle = "General Inquiry";
      let reqQty = "";
      if (l.requirement) {
        reqTitle =
          typeof l.requirement === "string"
            ? l.requirement
            : l.requirement.title || "Print Job";
      } else if (l.specifications) {
        reqTitle = l.specifications;
      } else if (l.expectedValue) {
        reqTitle = `₹${Number(l.expectedValue).toLocaleString("en-IN")}`;
      }

      // Source extraction
      let src = l.source || "Direct Call";
      let srcType = "CALL";
      const srcUpper = String(src).toUpperCase();
      if (srcUpper.includes("MAP") || srcUpper.includes("GOOGLE")) {
        src = "Google Maps";
        srcType = "MAPS";
      } else if (srcUpper.includes("WALK") || srcUpper.includes("VISIT")) {
        src = "Shop Visit";
        srcType = "VISIT";
      } else if (srcUpper.includes("REF") || srcUpper.includes("RECOMMEND")) {
        src = "Referral";
        srcType = "REFERRAL";
      } else if (srcUpper.includes("MANUAL")) {
        src = "Manual Lead";
        srcType = "MANUAL";
      }

      // Time formatting
      const createdDate = l.createdAt ? new Date(l.createdAt) : new Date();
      const timeStr = createdDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      const dateStr = createdDate.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      });

      // Status mapping
      let statusKey = "NEW";
      let statusLabel = "New";
      const st = (l.status || "").toUpperCase();
      if (
        st.includes("WON") ||
        st.includes("ORDER") ||
        st.includes("CONVERTED")
      ) {
        statusKey = "WON";
        statusLabel = "Won";
      } else if (st.includes("QUOTATION") || st.includes("QUOTE")) {
        statusKey = "QUOTATION";
        statusLabel = "Quotation";
      } else if (st.includes("FOLLOW") || st.includes("CALL_LATER")) {
        statusKey = "FOLLOW_UP";
        statusLabel = "Follow-up";
      } else if (st.includes("NEGOTIAT")) {
        statusKey = "NEGOTIATION";
        statusLabel = "Negotiation";
      } else if (
        st.includes("LOST") ||
        st.includes("REJECT") ||
        st.includes("DROPPED")
      ) {
        statusKey = "LOST";
        statusLabel = "Lost";
      } else {
        statusKey = "NEW";
        statusLabel = "New";
      }

      return {
        _id: l._id,
        raw: l,
        leadNumber:
          l.leadNumber ||
          `LEAD-${String(l._id || "")
            .slice(-5)
            .toUpperCase()}`,
        businessName: bName,
        contactName: cName,
        phone: phone,
        area: areaName,
        zone: zoneName,
        requirementTitle: reqTitle,
        requirementQty: reqQty,
        source: src,
        sourceType: srcType,
        createdAtTime: timeStr,
        createdAtDate: dateStr,
        status: statusKey,
        statusLabel: statusLabel,
        priority: l.priority || "HIGH",
        expectedValue: l.expectedValue || l.estimatedValue || 0,
        assignedToName:
          l.assignedToId?.name || l.assignedTo?.name || "Assigned Executive",
        photoUrl:
          l.shopImageUrl ||
          l.shopPhoto ||
          (Array.isArray(l.documents)
            ? l.documents.find(
                (d) =>
                  d?.category === "PHOTO" ||
                  (d?.fileUrl && /\.(jpe?g|png|webp|gif)/i.test(d.fileUrl)),
              )?.fileUrl
            : null) ||
          l.imageUrls?.[0] ||
          null,
        rawSource: l.source || "UNKNOWN",
        rawStatus: l.status || "NEW",
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
      NEGOTIATION: displayLeads.filter((l) => l.status === "NEGOTIATION")
        .length,
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
      if (priorityFilter !== "ALL" && l.priority !== priorityFilter)
        return false;

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
        return (
          matchName ||
          matchContact ||
          matchPhone ||
          matchArea ||
          matchZone ||
          matchReq ||
          matchNum ||
          matchId
        );
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
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // KPI Metrics matching live database statistics
  const kpis = useMemo(() => {
    const newLeads = tabCounts.NEW;
    const followupsDue = followups.length || tabCounts.FOLLOW_UP;
    const quotationPending = quotations.length || tabCounts.QUOTATION;
    const ordersConfirmed = orders.length || tabCounts.WON;
    const totalLeads = leads.length;

    return {
      totalLeads,
      newLeads,
      followupsDue,
      quotationPending,
      ordersConfirmed,
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
        subtitle:
          f.title ||
          f.leadId?.businessName ||
          f.businessName ||
          "Follow-up Call",
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
    if (isSubmittingLead) return;
    if (!newLeadForm.customerName?.trim() && !newLeadForm.companyName?.trim()) {
      alert("Please provide Customer Name or Company Name.");
      return;
    }
    if (!newLeadForm.phone?.trim()) {
      alert("Please provide Phone Number.");
      return;
    }

    try {
      setIsSubmittingLead(true);
      const assignedTarget = isManagerOrAdmin
        ? newLeadForm.assignedToId || undefined
        : currentUser?._id || currentUser?.id || undefined;

      const terrStr = (newLeadForm.territory || "burari/baba colony")
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

      const unifiedName = (
        newLeadForm.companyName?.trim() ||
        newLeadForm.customerName?.trim() ||
        "Customer"
      );

      await api.post("/leads", {
        contactName: unifiedName,
        customerName: unifiedName,
        businessName: unifiedName,
        companyName: unifiedName,
        phone: newLeadForm.phone.trim().replace(/\D/g, ""),
        email: newLeadForm.email?.trim() || undefined,
        alternatePhone: newLeadForm.alternatePhone?.trim() || undefined,
        source: newLeadForm.source || "GOOGLE",
        requirement: newLeadForm.requirement?.trim() || "Print Job",
        expectedValue: Number(newLeadForm.expectedValue) || 0,
        priority: newLeadForm.priority || "HIGH",
        assignedToId: assignedTarget,
        nextFollowUp: newLeadForm.nextFollowUp || undefined,
        notes: newLeadForm.notes?.trim() || undefined,
        area: areaVal,
        zone: zoneVal,
        acceptanceStatus: "ACCEPTED",
        shopImageUrl: uploadedPhotoUrl || undefined,
        documents:
          uploadedPhotoUrl
            ? [
                {
                  title: `Shop Photo - ${unifiedName}`,
                  category: "PHOTO",
                  fileUrl: uploadedPhotoUrl,
                  uploadedByName: currentUser?.name || userName || "Sales Executive",
                  uploadedAt: new Date(),
                },
              ]
            : [],
      });

      setShowAddLeadModal(false);
      handleRemovePhoto();
      setNewLeadForm({
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
        territory: "burari/baba colony",
        nextFollowUp: "",
        notes: "",
      });

      await loadDashboardData(true);
    } catch (err) {
      alert(err.message || "Failed to create lead");
    } finally {
      setIsSubmittingLead(false);
      setIsUploadingPhoto(false);
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
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(leads, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `raw_leads_export_${new Date().toISOString().slice(0, 10)}.json`,
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // WhatsApp Launcher
  const handleOpenWhatsApp = (lead) => {
    if (!lead) return;
    const rawPhone = lead.phone || lead.mobileNumber || "";
    const cleanPhone = String(rawPhone).replace(/\D/g, "");
    const formattedPhone =
      cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const name = lead.contactName || lead.customerName || "Customer";
    const text = encodeURIComponent(
      `Hello ${name}, this is regarding your printing requirement with us.`,
    );
    window.open(`https://wa.me/${formattedPhone}?text=${text}`, "_blank");
  };

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      {/* Sidebar - hides automatically on mobile / tablet */}
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
                <span>
                  {greeting}, {userName}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Sales Dashboard</span>
                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200">
                  {kpis.totalLeads} Records
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-normal">
                Direct view of live inquiries, database leads, and workflow
                statuses.
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
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#F95721]" : ""}`}
                />
              </button>

              {/* Date Card (Hidden on mobile for cleaner density) */}
              {!isMobile && (
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
              )}

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
          {/* KPI METRIC CARDS ROW - Tailored for Mobile, Tablet, and Desktop           */}
          {/* ========================================================================= */}
          <div
            className={`grid gap-3 sm:gap-4 ${
              isMobile
                ? "grid-cols-2"
                : isTablet
                  ? "grid-cols-2 md:grid-cols-3"
                  : "grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
            }`}
          >
            {/* Card 1: Total Raw Leads */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-center gap-3 hover:shadow-sm transition-shadow">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {kpis.totalLeads}
                </div>
                <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                  Total Leads
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                  In database
                </div>
              </div>
            </div>

            {/* Card 2: New Leads */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-center gap-3 hover:shadow-sm transition-shadow">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {kpis.newLeads}
                </div>
                <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                  New Leads
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                  Needs contact
                </div>
              </div>
            </div>

            {/* Card 3: Follow-ups Due */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-center gap-3 hover:shadow-sm transition-shadow">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {kpis.followupsDue}
                </div>
                <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                  Follow-ups
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                  Scheduled / Due
                </div>
              </div>
            </div>

            {/* Card 4: Quotation Pending */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-center gap-3 hover:shadow-sm transition-shadow">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {kpis.quotationPending}
                </div>
                <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                  Quotations
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                  In progress
                </div>
              </div>
            </div>

            {/* Card 5: Orders Won */}
            <div
              className={`bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-center gap-3 hover:shadow-sm transition-shadow ${
                isMobile
                  ? "col-span-2"
                  : isTablet
                    ? "col-span-2 md:col-span-1"
                    : ""
              }`}
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-500 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {kpis.ordersConfirmed}
                </div>
                <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                  Orders Won
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                  Confirmed sales
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* VIEW MODE 1: RAW DATA VIEW (With Mobile Cards or Full DB Table)           */}
          {/* ========================================================================= */}
          {viewMode === "raw_data" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden space-y-3">
              {/* Top Bar for Raw Data View */}
              <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                      Raw Database Records
                    </h2>
                    <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                      leads collection
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-normal mt-0.5">
                    Viewing raw MongoDB documents directly as stored in the
                    backend database.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Search */}
                  <div className="relative min-w-40 sm:min-w-56 flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search ID, name, phone, status..."
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                    />
                  </div>

                  {/* Mobile Raw Layout Switcher */}
                  {(isMobile || isTablet) && (
                    <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex items-center text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setMobileRawLayout("cards")}
                        className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                          mobileRawLayout === "cards"
                            ? "bg-white text-slate-900 shadow-2xs"
                            : "text-slate-500"
                        }`}
                      >
                        Cards
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileRawLayout("table")}
                        className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                          mobileRawLayout === "table"
                            ? "bg-white text-slate-900 shadow-2xs"
                            : "text-slate-500"
                        }`}
                      >
                        Table
                      </button>
                    </div>
                  )}

                  {/* Export Raw Data */}
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    title="Export raw JSON file"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                </div>
              </div>

              {/* Sub-view: Mobile Raw Cards (when mobile OR layout is cards on tablet) */}
              {(isMobile || isTablet) && mobileRawLayout === "cards" ? (
                <div className="p-3 sm:p-4 space-y-3">
                  {filteredLeads.length > 0 ? (
                    filteredLeads.map((item) => (
                      <div
                        key={item._id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-indigo-50/20 transition-all space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded text-[11px] border border-indigo-200">
                            {item.leadNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.status === "WON"
                                ? "bg-emerald-100 text-emerald-800"
                                : item.status === "NEW"
                                  ? "bg-blue-100 text-blue-800"
                                  : item.status === "FOLLOW_UP"
                                    ? "bg-amber-100 text-amber-800"
                                    : item.status === "QUOTATION"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {item.rawStatus}
                          </span>
                        </div>

                        <div className="font-sans">
                          <div className="font-bold text-slate-900 text-sm">
                            {item.contactName}
                          </div>
                          <div className="text-slate-500 text-xs">
                            {item.businessName || "No business specified"}
                          </div>
                          <div className="text-emerald-700 font-mono font-semibold mt-1">
                            📞 {item.phone}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                          <span className="font-mono text-[10px] text-slate-400 truncate max-w-36 select-all">
                            ID: {String(item._id).slice(0, 10)}…
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopyJson(item.raw)}
                              className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold text-[10px] flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3 text-slate-500" />
                              <span>Copy</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setInspectingLead(item.raw)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1"
                            >
                              <Code2 className="w-3 h-3" />
                              <span>JSON</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No raw database records found matching filter.
                    </div>
                  )}
                </div>
              ) : (
                /* Standard Raw Data Table with horizontal scroll */
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono min-w-[900px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-3">LEAD NUMBER</th>
                        <th className="py-3 px-3">MONGO _ID</th>
                        <th className="py-3 px-3 font-sans">
                          CONTACT &amp; BUSINESS
                        </th>
                        <th className="py-3 px-3">PHONE</th>
                        <th className="py-3 px-3 font-sans">SOURCE</th>
                        <th className="py-3 px-3 font-sans">RAW STATUS</th>
                        <th className="py-3 px-3 font-sans">PRIORITY</th>
                        <th className="py-3 px-3 font-sans">EXPECTED VALUE</th>
                        <th className="py-3 px-3 font-sans">ASSIGNED TO</th>
                        <th className="py-3 px-3">CREATED AT</th>
                        <th className="py-3 px-3 text-center font-sans">
                          RAW JSON
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {filteredLeads.length > 0 ? (
                        filteredLeads.map((item) => (
                          <tr
                            key={item._id}
                            className="hover:bg-indigo-50/30 transition-colors"
                          >
                            <td className="py-3 px-3 font-bold text-indigo-700">
                              {item.leadNumber}
                            </td>
                            <td
                              className="py-3 px-3 text-slate-400 select-all"
                              title={String(item._id)}
                            >
                              {String(item._id).slice(0, 10)}…
                            </td>
                            <td className="py-3 px-3 font-sans">
                              <div className="font-bold text-slate-900">
                                {item.contactName}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {item.businessName || "—"}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-emerald-700 font-semibold select-all">
                              {item.phone}
                            </td>
                            <td className="py-3 px-3 font-sans">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                                {item.rawSource}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-sans">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.status === "WON"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : item.status === "NEW"
                                      ? "bg-blue-100 text-blue-800"
                                      : item.status === "FOLLOW_UP"
                                        ? "bg-amber-100 text-amber-800"
                                        : item.status === "QUOTATION"
                                          ? "bg-purple-100 text-purple-800"
                                          : "bg-slate-100 text-slate-800"
                                }`}
                              >
                                {item.rawStatus}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-sans">
                              <span
                                className={`text-[10px] font-bold ${
                                  item.priority === "HIGH"
                                    ? "text-rose-600"
                                    : item.priority === "MEDIUM"
                                      ? "text-amber-600"
                                      : "text-slate-500"
                                }`}
                              >
                                {item.priority}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-sans text-slate-800 font-bold">
                              ₹
                              {Number(item.expectedValue).toLocaleString(
                                "en-IN",
                              )}
                            </td>
                            <td className="py-3 px-3 font-sans text-slate-600">
                              {item.assignedToName}
                            </td>
                            <td className="py-3 px-3 text-slate-500 text-[10px]">
                              {item.createdAtDate}
                            </td>
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
                          <td
                            colSpan={11}
                            className="py-12 text-center text-slate-400 font-sans"
                          >
                            No raw database records found matching filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW MODE 2: STANDARD WORKFLOW VIEW (Adaptive for Mobile, Tablet, Desktop) */}
          {/* ========================================================================= */}
          {viewMode === "standard" && (
            <>
              {/* Mobile Section Tabs (Fast switching between Leads, Focus, Actions on mobile) */}
              {isMobile && (
                <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 text-xs font-bold shadow-inner">
                  <button
                    type="button"
                    onClick={() => setMobileActiveSection("leads")}
                    className={`flex-1 py-2 rounded-xl text-center transition-all cursor-pointer ${
                      mobileActiveSection === "leads"
                        ? "bg-white text-slate-900 shadow-xs font-black text-[#F95721]"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Leads ({filteredLeads.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileActiveSection("focus")}
                    className={`flex-1 py-2 rounded-xl text-center transition-all cursor-pointer ${
                      mobileActiveSection === "focus"
                        ? "bg-white text-slate-900 shadow-xs font-black text-rose-600"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Focus ({kpis.newLeads + kpis.followupsDue})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileActiveSection("activity")}
                    className={`flex-1 py-2 rounded-xl text-center transition-all cursor-pointer ${
                      mobileActiveSection === "activity"
                        ? "bg-white text-slate-900 shadow-xs font-black text-indigo-600"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Activity
                  </button>
                </div>
              )}

              <div
                className={`grid gap-5 ${
                  !isMobile && !isTablet
                    ? "grid-cols-1 xl:grid-cols-12"
                    : "grid-cols-1"
                }`}
              >
                {/* ===================================================================== */}
                {/* LEFT COLUMN: MY LEADS WORKSPACE (col-span-8 on desktop)              */}
                {/* ===================================================================== */}
                {(!isMobile || mobileActiveSection === "leads") && (
                  <div
                    className={`${!isMobile && !isTablet ? "xl:col-span-8" : "w-full"} space-y-4`}
                  >
                    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                      {/* Header: Title + Search & Controls */}
                      <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                            My Leads Workspace
                          </h2>
                          <p className="text-xs text-slate-400 font-normal mt-0.5">
                            Live customer inquiries and assigned follow-ups
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                          {/* Search Input */}
                          <div className="relative min-w-36 sm:min-w-52 flex-1">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search leads, phone..."
                              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white"
                            />
                          </div>

                          {/* Reset Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab("ALL");
                              setPriorityFilter("ALL");
                              setSearchQuery("");
                            }}
                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                            title="Reset all filters"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                            <span className="hidden sm:inline">Reset</span>
                          </button>

                          {/* Priority Dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setShowPriorityDropdown((prev) => !prev)
                              }
                              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                            >
                              <span>
                                {priorityFilter === "ALL"
                                  ? "Priority"
                                  : priorityFilter}
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
                                    className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
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

                      {/* Status Navigation Tabs with underline & horizontal scrolling */}
                      <div className="px-4 sm:px-5 border-b border-slate-200 flex items-center gap-4 sm:gap-6 overflow-x-auto scrollbar-none text-xs font-semibold text-slate-500">
                        {[
                          {
                            key: "ALL",
                            label: "All Leads",
                            count: tabCounts.ALL,
                          },
                          { key: "NEW", label: "New", count: tabCounts.NEW },
                          {
                            key: "FOLLOW_UP",
                            label: "Follow-up",
                            count: tabCounts.FOLLOW_UP,
                          },
                          {
                            key: "QUOTATION",
                            label: "Quotation",
                            count: tabCounts.QUOTATION,
                          },
                          {
                            key: "NEGOTIATION",
                            label: "Negotiation",
                            count: tabCounts.NEGOTIATION,
                          },
                          { key: "WON", label: "Won", count: tabCounts.WON },
                          { key: "LOST", label: "Lost", count: tabCounts.LOST },
                        ].map((tab) => (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`py-3 relative border-b-2 whitespace-nowrap transition-colors cursor-pointer text-xs ${
                              activeTab === tab.key
                                ? "border-[#F95721] text-[#F95721] font-extrabold"
                                : "border-transparent hover:text-slate-900"
                            }`}
                          >
                            {tab.label} ({tab.count})
                          </button>
                        ))}
                      </div>

                      {/* =================================================================== */}
                      {/* VIEW VARIANT A: RESPONSIVE CARDS VIEW (Mobile & Card Viewports)   */}
                      {/* =================================================================== */}
                      {mobileLeadLayout === "cards" ? (
                        <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {filteredLeads.length > 0 ? (
                            filteredLeads.map((item) => {
                              const isSelected = selectedLeads.includes(
                                item._id,
                              );
                              const cleanPhone = String(
                                item.phone || "",
                              ).replace(/\D/g, "");

                              return (
                                <div
                                  key={item._id}
                                  className={`bg-white border rounded-2xl p-3.5 transition-all shadow-xs space-y-3 ${
                                    isSelected
                                      ? "border-orange-300 ring-2 ring-orange-400/20 bg-orange-50/20"
                                      : "border-slate-200/90 hover:border-slate-300"
                                  }`}
                                >
                                  {/* Card Header: Shop photo + Business Name + Badges */}
                                  <div className="flex items-start justify-between gap-2.5">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      {/* Shop Photo Thumbnail */}
                                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 flex items-center justify-center text-slate-400 shadow-2xs">
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
                                          <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                            {item.leadNumber}
                                          </span>
                                          <Link
                                            href={`/dashboard/leads/${item._id}`}
                                            className="font-bold text-slate-900 hover:text-[#F95721] text-xs sm:text-sm truncate leading-tight"
                                          >
                                            {item.businessName}
                                          </Link>
                                        </div>
                                        <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                          {item.contactName}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Status & Priority Badges */}
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                      <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                          item.status === "NEW"
                                            ? "bg-rose-50 text-rose-600 border border-rose-200"
                                            : item.status === "FOLLOW_UP"
                                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                                              : item.status === "QUOTATION"
                                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                                : item.status === "NEGOTIATION"
                                                  ? "bg-orange-50 text-orange-700 border border-orange-200"
                                                  : item.status === "WON"
                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                                        }`}
                                      >
                                        {item.statusLabel}
                                      </span>
                                      <span
                                        className={`text-[9px] font-bold uppercase ${
                                          item.priority === "HIGH"
                                            ? "text-rose-600"
                                            : item.priority === "MEDIUM"
                                              ? "text-amber-600"
                                              : "text-slate-400"
                                        }`}
                                      >
                                        {item.priority} Priority
                                      </span>
                                    </div>
                                  </div>

                                  {/* Card Details: Requirement, Area, Phone */}
                                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                                    <div>
                                      <span className="text-[10px] font-semibold text-slate-400 block">
                                        Requirement:
                                      </span>
                                      <span className="font-bold text-slate-800 truncate block">
                                        {item.requirementTitle}
                                      </span>
                                      {item.requirementQty && (
                                        <span className="text-[10px] text-slate-500">
                                          {item.requirementQty}
                                        </span>
                                      )}
                                    </div>
                                    <div>
                                      <span className="text-[10px] font-semibold text-slate-400 block">
                                        Location:
                                      </span>
                                      <span className="font-bold text-slate-800 truncate block">
                                        {item.area}
                                      </span>
                                      <span className="text-[10px] text-slate-400 truncate block">
                                        {item.zone}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Quick Actions Row for Mobile Cards */}
                                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                                    <a
                                      href={`tel:${item.phone}`}
                                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                    >
                                      <Phone className="w-3 h-3 text-emerald-600" />
                                      <span>{item.phone}</span>
                                    </a>

                                    <div className="flex items-center gap-1.5">
                                      {/* Direct WhatsApp Action */}
                                      {cleanPhone && (
                                        <a
                                          href={`https://wa.me/91${cleanPhone}?text=Hello%20${encodeURIComponent(item.contactName)},%20reaching%20out%20from%20A2V%20Prints%20regarding%20your%20inquiry%20for%20${encodeURIComponent(item.requirementTitle)}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 transition-colors cursor-pointer"
                                          title="Chat on WhatsApp"
                                        >
                                          <MessageCircle className="w-3.5 h-3.5" />
                                        </a>
                                      )}

                                      {/* Raw JSON modal trigger */}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setInspectingLead(item.raw)
                                        }
                                        className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors cursor-pointer"
                                        title="Inspect Raw Document"
                                      >
                                        <Code2 className="w-3.5 h-3.5" />
                                      </button>

                                      {/* Call Now Button */}
                                      <button
                                        type="button"
                                        onClick={() => setCallingLead(item)}
                                        className="px-3 py-1.5 rounded-xl bg-[#F95721] hover:bg-[#e84915] text-white font-bold text-xs shadow-xs flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                                      >
                                        <PhoneCall className="w-3.5 h-3.5" />
                                        <span>Call</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="col-span-full py-12 text-center text-slate-400 text-xs font-medium">
                              No leads found matching current filter.
                            </div>
                          )}
                        </div>
                      ) : (
                        /* =================================================================== */
                        /* VIEW VARIANT B: FULL TABLE VIEW (Desktop & Horizontal Scroll View)  */
                        /* =================================================================== */
                        <div className="overflow-x-auto scrollbar-thin">
                          <table className="w-full text-left text-xs min-w-[860px]">
                            <thead>
                              <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                <th className="py-3 px-4 w-9 text-center">
                                  <input
                                    type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={
                                      filteredLeads.length > 0 &&
                                      selectedLeads.length ===
                                        filteredLeads.length
                                    }
                                    className="rounded text-[#F95721] focus:ring-orange-500 cursor-pointer"
                                  />
                                </th>
                                <th className="py-3 px-3 whitespace-nowrap">
                                  BUSINESS / CONTACT
                                </th>
                                <th className="py-3 px-3 whitespace-nowrap">
                                  AREA
                                </th>
                                <th className="py-3 px-3 whitespace-nowrap">
                                  REQUIREMENT
                                </th>
                                <th className="py-3 px-3 whitespace-nowrap">
                                  SOURCE
                                </th>
                                <th className="py-3 px-3 whitespace-nowrap">
                                  CREATED AT
                                </th>
                                <th className="py-3 px-3 whitespace-nowrap">
                                  STATUS
                                </th>
                                <th className="py-3 px-3 text-center whitespace-nowrap">
                                  NEXT ACTION
                                </th>
                                <th className="py-3 px-2 w-8"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {filteredLeads.length > 0 ? (
                                filteredLeads.map((item) => {
                                  const isSelected = selectedLeads.includes(
                                    item._id,
                                  );

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
                                          onChange={() =>
                                            handleToggleLead(item._id)
                                          }
                                          className="rounded text-[#F95721] focus:ring-orange-500 cursor-pointer"
                                        />
                                      </td>

                                      {/* Business / Contact with Photo Thumbnail */}
                                      <td className="py-3.5 px-3">
                                        <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 shadow-2xs flex items-center justify-center text-slate-400">
                                            {item.photoUrl ? (
                                              <img
                                                src={item.photoUrl}
                                                alt={item.businessName}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  e.target.style.display =
                                                    "none";
                                                }}
                                              />
                                            ) : (
                                              <Store className="w-5 h-5 text-slate-400" />
                                            )}
                                          </div>

                                          <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
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
                                          {item.requirementQty ||
                                            (item.expectedValue > 0
                                              ? `₹${item.expectedValue}`
                                              : "")}
                                        </div>
                                      </td>

                                      {/* Source */}
                                      <td className="py-3.5 px-3 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5 text-slate-700 text-xs font-medium whitespace-nowrap">
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
                                      <td className="py-3.5 px-3 text-slate-700 whitespace-nowrap">
                                        <div className="font-bold text-xs text-slate-800 leading-tight">
                                          {item.createdAtTime}
                                        </div>
                                        <div className="text-[11px] text-slate-400 font-medium">
                                          {item.createdAtDate}
                                        </div>
                                      </td>

                                      {/* Status Badge */}
                                      <td className="py-3.5 px-3 whitespace-nowrap">
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
                                            onClick={() =>
                                              setInspectingLead(item.raw)
                                            }
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
                                  <td
                                    colSpan={9}
                                    className="py-12 text-center text-slate-400"
                                  >
                                    No leads found matching current filter.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ===================================================================== */}
                {/* RIGHT COLUMN: ACTION & FOCUS CARDS (col-span-4 on desktop)           */}
                {/* ===================================================================== */}
                {(!isMobile ||
                  mobileActiveSection === "focus" ||
                  mobileActiveSection === "activity") && (
                  <div
                    className={`${
                      !isMobile && !isTablet
                        ? "xl:col-span-4 space-y-4"
                        : isTablet
                          ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                          : "space-y-4"
                    }`}
                  >
                    {/* Card 1: Today's Focus (Calculated from real live database) */}
                    {(!isMobile || mobileActiveSection === "focus") && (
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
                    )}

                    {/* Card 2: Recent Activity (Live from MongoDB records) */}
                    {(!isMobile || mobileActiveSection === "activity") && (
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
                              <div
                                key={act.id}
                                className="flex items-start justify-between gap-3"
                              >
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
                                    {act.type === "lead" && (
                                      <Phone className="w-3.5 h-3.5" />
                                    )}
                                    {act.type === "followup" && (
                                      <Clock className="w-3.5 h-3.5" />
                                    )}
                                    {act.type === "quotation" && (
                                      <FileText className="w-3.5 h-3.5" />
                                    )}
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
                    )}

                    {/* Card 3: Quick Actions */}
                    <div
                      className={`bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs ${isTablet ? "md:col-span-2" : ""}`}
                    >
                      <h3 className="text-sm font-bold text-slate-900 leading-tight mb-3">
                        Quick Actions
                      </h3>

                      <div className="grid grid-cols-2 gap-2.5">
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
                )}
              </div>
            </>
          )}
        </div>

        {/* Floating Quick Action Bar on Mobile Screen */}
        {isMobile && (
          <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 flex items-center justify-around z-40 shadow-lg">
            <button
              type="button"
              onClick={() => setShowAddLeadModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F95721] text-white rounded-xl font-bold text-xs shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Lead</span>
            </button>
            <Link
              href="/dashboard/whatsapp"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </Link>
            <button
              type="button"
              onClick={() => loadDashboardData(true)}
              className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#F95721]" : ""}`}
              />
              <span>Sync</span>
            </button>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEW LEAD DIALOG (Same as Leads page design)                   */}
      {/* ========================================================================= */}
      {showAddLeadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl w-full max-w-lg p-4 sm:p-6 space-y-4 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Add New Lead
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddLeadModal(false);
                  handleRemovePhoto();
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Business Name / Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sharma Constructions"
                    value={newLeadForm.customerName || newLeadForm.companyName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewLeadForm({
                        ...newLeadForm,
                        customerName: val,
                        companyName: val,
                      });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Company / Brand Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sharma Constructions"
                    value={newLeadForm.companyName || newLeadForm.customerName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewLeadForm({
                        ...newLeadForm,
                        companyName: val,
                        customerName: val,
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
                    value={newLeadForm.phone}
                    onChange={(e) =>
                      setNewLeadForm({ ...newLeadForm, phone: e.target.value })
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
                    value={newLeadForm.expectedValue}
                    onChange={(e) =>
                      setNewLeadForm({ ...newLeadForm, expectedValue: e.target.value })
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
                  value={newLeadForm.requirement}
                  onChange={(e) =>
                    setNewLeadForm({ ...newLeadForm, requirement: e.target.value })
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
                          htmlFor="sales-lead-photo-input"
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
                    htmlFor="sales-lead-photo-input"
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
                  id="sales-lead-photo-input"
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
                    value={newLeadForm.source}
                    onChange={(e) =>
                      setNewLeadForm({ ...newLeadForm, source: e.target.value })
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
                    value={newLeadForm.priority}
                    onChange={(e) =>
                      setNewLeadForm({ ...newLeadForm, priority: e.target.value })
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
                  value={newLeadForm.territory || "burari/baba colony"}
                  onChange={(e) => {
                    const val = e.target.value;
                    let targetAssignee = newLeadForm.assignedToId;
                    if (val.includes("baba colony")) {
                      const tanya = users.find(
                        (u) =>
                          (u.name || "").toLowerCase().includes("tanya") ||
                          (u.email || "").toLowerCase().includes("tanya"),
                      );
                      if (tanya) targetAssignee = tanya._id;
                    }
                    setNewLeadForm({
                      ...newLeadForm,
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
                    value={newLeadForm.assignedToId}
                    onChange={(e) =>
                      setNewLeadForm({ ...newLeadForm, assignedToId: e.target.value })
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
                        {(currentUser?.name || userName || "ME").slice(0, 2).toUpperCase()}
                      </div>
                      <span className="truncate">
                        {currentUser?.name || userName || "tanya"} (You)
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
                  value={newLeadForm.nextFollowUp}
                  onChange={(e) =>
                    setNewLeadForm({ ...newLeadForm, nextFollowUp: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmittingLead}
                  onClick={() => {
                    setShowAddLeadModal(false);
                    handleRemovePhoto();
                  }}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLead}
                  className={`px-5 py-2 rounded-xl text-white font-semibold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isSubmittingLead
                      ? "bg-indigo-400 cursor-not-allowed opacity-90 shadow-none"
                      : "bg-[#4F46E5] hover:bg-[#4338CA] active:scale-95"
                  }`}
                >
                  {isSubmittingLead ? (
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

            <div className="flex items-center gap-2 pt-1">
              <a
                href={`tel:${callingLead.phone}`}
                onClick={() => setCallingLead(null)}
                className="flex-1 py-2.5 bg-[#F95721] hover:bg-[#e84915] text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Device</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  handleOpenWhatsApp(callingLead);
                  setCallingLead(null);
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>

            <div className="pt-1">
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

      {/* ========================================================================= */}
      {/* MODAL 3: RAW MONGODB JSON INSPECTOR MODAL                                */}
      {/* ========================================================================= */}
      {inspectingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 text-slate-100 rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-800 space-y-4 max-h-[85vh] flex flex-col">
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
                      <span className="text-emerald-400 font-bold">
                        Copied!
                      </span>
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
              <span className="font-mono text-[11px]">
                _id: {inspectingLead._id}
              </span>
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
