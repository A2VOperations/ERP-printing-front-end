"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import { DashboardSkeleton } from "@/app/components/ui/skeleton";

import {
  Users,
  FileText,
  Package,
  CreditCard,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Search,
  Plus,
  ChevronDown,
  Calendar,
  CheckCircle2,
  Clock,
  Check,
  Loader2,
  Phone,
  Mail,
  UserCheck,
  Shield,
  ExternalLink,
  Filter,
  Eye,
  X,
  ArrowRight,
  Database,
  Sparkles,
  Activity,
  PhoneCall,
} from "lucide-react";

export default function AdminOverviewPage() {
  const router = useRouter();

  // User state
  const [userName, setUserName] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("userName");
      if (stored) return stored.split(" ")[0] || stored;
    }
    return "Admin";
  });

  const [currentUserAvatar, setCurrentUserAvatar] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("userAvatar") || null;
    }
    return null;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) return JSON.parse(storedUser);
      } catch (e) {}
    }
    return null;
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeView, setActiveView] = useState("team");
  const [teamTab, setTeamTab] = useState("Sales Team");
  const [teamSearch, setTeamSearch] = useState("");
  const [selectedStaffMember, setSelectedStaffMember] = useState(null);
  const [inspectionTab, setInspectionTab] = useState("leads");
  const [activityCategoryFilter, setActivityCategoryFilter] = useState("all");
  const [activitySearch, setActivitySearch] = useState("");
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [creatingLead, setCreatingLead] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // Live collections from backend
  const [leads, setLeads] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [activities, setActivities] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [targetProgress, setTargetProgress] = useState(null);
  const [topPerformers, setTopPerformers] = useState([]);

  // New Lead Form State
  const [newLead, setNewLead] = useState({
    name: "",
    phone: "",
    email: "",
    companyName: "",
    requirement: "",
    source: "WALK_IN",
    estimatedValue: 15000,
    assignedToId: "",
    nextFollowUp: "",
  });

  // Real-time ticking clock
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const [
        leadsRes,
        followupsRes,
        ordersRes,
        targetRes,
        leaderRes,
        usersRes,
        meRes,
        activitiesRes,
        paymentsRes,
        quotationsRes,
        auditRes,
      ] = await Promise.allSettled([
        api.get("/leads?limit=250"),
        api.get("/followups?limit=200"),
        api.get("/orders?limit=200"),
        api.get("/targets/my-achievement", { silent: true }),
        api.get("/targets/leaderboard", { silent: true }),
        api.get("/users"),
        api.get("/auth/me"),
        api.get("/activities?limit=100", { silent: true }),
        api.get("/payments?limit=200", { silent: true }),
        api.get("/quotations?limit=500", { silent: true }),
        api.get("/audit-logs?limit=50", { silent: true }),
      ]);

      if (leadsRes.status === "fulfilled" && leadsRes.value?.data) {
        const raw = leadsRes.value.data;
        const list = Array.isArray(raw) ? raw : raw?.leads || raw?.records || raw?.data || [];
        setLeads(list);
      }
      if (followupsRes.status === "fulfilled" && followupsRes.value?.data) {
        const raw = followupsRes.value.data;
        const list = Array.isArray(raw) ? raw : raw?.followups || raw?.records || raw?.data || [];
        setFollowups(list);
      }
      if (ordersRes.status === "fulfilled" && ordersRes.value?.data) {
        const raw = ordersRes.value.data;
        const list = Array.isArray(raw) ? raw : raw?.orders || raw?.records || raw?.data || [];
        setOrders(list);
      }
      if (targetRes.status === "fulfilled" && targetRes.value?.data) {
        setTargetProgress(targetRes.value.data);
      }
      if (leaderRes.status === "fulfilled" && leaderRes.value?.data) {
        const raw = leaderRes.value.data;
        const list = Array.isArray(raw) ? raw : raw?.rankings || [];
        setTopPerformers(list);
      }
      if (usersRes.status === "fulfilled" && usersRes.value?.data) {
        const rawUsers = usersRes.value.data;
        const usersList = Array.isArray(rawUsers)
          ? rawUsers
          : rawUsers?.users || rawUsers?.records || [];
        setUsers(usersList);
      }
      if (meRes.status === "fulfilled" && meRes.value?.data) {
        const me = meRes.value.data.user || meRes.value.data;
        setCurrentUser(me);
        if (me.name) {
          setUserName(me.name.split(" ")[0]);
        }
        if (me.avatarUrl) {
          setCurrentUserAvatar(me.avatarUrl);
          localStorage.setItem("userAvatar", me.avatarUrl);
        }
      }
      if (activitiesRes.status === "fulfilled" && activitiesRes.value?.data) {
        const raw = activitiesRes.value.data;
        const list = Array.isArray(raw) ? raw : raw?.activities || raw?.records || raw?.data || [];
        setActivities(list);
      }
      if (paymentsRes.status === "fulfilled" && paymentsRes.value?.data) {
        const raw = paymentsRes.value.data;
        const list = Array.isArray(raw) ? raw : raw?.payments || raw?.records || raw?.data || [];
        setPayments(list);
      }
      if (quotationsRes.status === "fulfilled" && quotationsRes.value?.data) {
        const rawQ = quotationsRes.value.data;
        const list = Array.isArray(rawQ)
          ? rawQ
          : rawQ?.records || rawQ?.quotations || rawQ?.data || [];
        setQuotations(list);
      }
      if (auditRes.status === "fulfilled" && auditRes.value?.data) {
        const rawA = auditRes.value.data;
        const list = Array.isArray(rawA)
          ? rawA
          : rawA?.logs || rawA?.records || rawA?.data || [];
        setAuditLogs(list);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const handleAvatarSync = (e) => {
      const av =
        e.detail?.avatarUrl || localStorage.getItem("userAvatar") || null;
      setCurrentUserAvatar(av);
    };
    window.addEventListener("crm:avatar-updated", handleAvatarSync);

    const handleKeyDown = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      if (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        e.target?.isContentEditable
      ) {
        return;
      }
      const key = e.key.toLowerCase();
      if (key === "n" || (e.metaKey && key === "k") || (e.ctrlKey && key === "k")) {
        e.preventDefault();
        setShowAddLeadModal(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboardData();

    return () => {
      window.removeEventListener("crm:avatar-updated", handleAvatarSync);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [loadDashboardData]);

  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (creatingLead) return;
    try {
      setCreatingLead(true);
      const payload = {
        ...newLead,
        contactName: newLead.name,
        businessName: newLead.companyName,
        expectedValue: Number(newLead.estimatedValue) || 0,
        estimatedBudget: Number(newLead.estimatedValue) || 0,
        assignedToId: newLead.assignedToId || undefined,
      };
      await api.post("/leads", payload);
      setShowAddLeadModal(false);
      setNewLead({
        name: "",
        phone: "",
        email: "",
        companyName: "",
        requirement: "",
        source: "WALK_IN",
        estimatedValue: 15000,
        assignedToId: "",
        nextFollowUp: "",
      });
      await loadDashboardData();
    } catch (err) {
      alert(err.message || "Failed to create lead");
    } finally {
      setCreatingLead(false);
    }
  };

  // Time formatting
  const timeOfDay = useMemo(() => {
    const hr = currentTime.getHours();
    if (hr < 12) return "Morning";
    if (hr < 17) return "Afternoon";
    return "Evening";
  }, [currentTime]);

  const liveClockFormatted = useMemo(() => {
    return (
      currentTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }) + " IST"
    );
  }, [currentTime]);

  const liveDateHeader = useMemo(() => {
    const d = currentTime;
    const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
    const monthName = d.toLocaleDateString("en-US", { month: "long" });
    const dayNum = d.getDate();
    const year = d.getFullYear();
    const timeStr = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${dayName}, ${monthName} ${dayNum}, ${year} | ${timeStr}`;
  }, [currentTime]);

  const currentMonthYearBadge = useMemo(() => {
    const d = currentTime;
    const monthName = d.toLocaleDateString("en-US", { month: "long" });
    const year = d.getFullYear();
    return `This Month (${monthName} ${year})`;
  }, [currentTime]);

  // Dynamic Metrics & Aggregations
  // 1. Leads
  const totalLeadsCount = leads.length;
  const leadsThisMonthCount = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return leads.filter((l) => {
      if (!l.createdAt) return true;
      const d = new Date(l.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
  }, [leads]);

  // 2. Open Quotations
  const openQuotationsCount = useMemo(() => {
    return quotations.filter((q) =>
      ["DRAFT", "PENDING", "SENT", "AWAITING_APPROVAL"].includes(q.status),
    ).length;
  }, [quotations]);

  // 3. Active Orders
  const activeOrdersCount = useMemo(() => {
    return orders.filter(
      (o) => o.orderStatus !== "CANCELLED" && o.orderStatus !== "DELIVERED",
    ).length || orders.length;
  }, [orders]);



  // 4. Financial Calculations
  const totalOrderValueRupees = useMemo(() => {
    return orders.reduce((sum, o) => {
      const val = o.grandTotalPaise
        ? o.grandTotalPaise / 100
        : o.grandTotal || o.totalAmount || 0;
      return sum + Number(val || 0);
    }, 0);
  }, [orders]);

  const totalPaymentsReceivedRupees = useMemo(() => {
    if (payments.length > 0) {
      return payments.reduce((sum, p) => {
        if (p.status === "CONFIRMED" || p.status === "COMPLETED") {
          const val = p.amountPaise
            ? p.amountPaise / 100
            : Number(p.amount) || 0;
          return sum + val;
        }
        return sum;
      }, 0);
    }
    return orders.reduce((sum, o) => {
      const val = o.totalPaidPaise
        ? o.totalPaidPaise / 100
        : Number(o.paidAmount) || 0;
      return sum + val;
    }, 0);
  }, [payments, orders]);

  const outstandingBalanceRupees = useMemo(() => {
    return Math.max(0, totalOrderValueRupees - totalPaymentsReceivedRupees);
  }, [totalOrderValueRupees, totalPaymentsReceivedRupees]);

  const paymentCoveragePercent = useMemo(() => {
    if (totalOrderValueRupees <= 0) return 100;
    return Math.round(
      (totalPaymentsReceivedRupees / totalOrderValueRupees) * 100,
    );
  }, [totalOrderValueRupees, totalPaymentsReceivedRupees]);

  const overdueReceivablesRupees = 0;
  const pendingVerificationRupees = useMemo(() => {
    return payments
      .filter((p) => p.status === "PENDING" || p.status === "VERIFICATION_PENDING")
      .reduce((sum, p) => {
        const val = p.amountPaise ? p.amountPaise / 100 : Number(p.amount) || 0;
        return sum + val;
      }, 0);
  }, [payments]);



  const todayRevenueRupees = useMemo(() => {
    const todayStr = new Date().toDateString();
    return payments
      .filter((p) => {
        if (p.status !== "CONFIRMED" && p.status !== "COMPLETED") return false;
        const d = p.paymentDate || p.createdAt;
        return d && new Date(d).toDateString() === todayStr;
      })
      .reduce((sum, p) => {
        const val = p.amountPaise ? p.amountPaise / 100 : Number(p.amount) || 0;
        return sum + val;
      }, 0);
  }, [payments]);

  const overdueOrdersCount = useMemo(() => {
    const now = new Date();
    return orders.filter((o) => {
      if (o.orderStatus === "DELIVERED" || o.orderStatus === "CANCELLED")
        return false;
      if (!o.deliveryDate) return false;
      return new Date(o.deliveryDate) < now;
    }).length;
  }, [orders]);

  const paymentAuditCount = useMemo(() => {
    return payments.filter(
      (p) => p.status === "PENDING" || p.status === "VERIFICATION_PENDING",
    ).length;
  }, [payments]);

  // Sales Pipeline Stages
  const pipelineMetrics = useMemo(() => {
    const stageLeads = leads.length;
    const stageInt = leads.filter((l) =>
      ["INTERESTED", "QUALIFIED", "QUOTED", "WON"].includes(l.status),
    ).length;
    const stageQuote = leads.filter((l) => ["QUOTED", "WON"].includes(l.status)).length;
    const stageOrder = orders.filter((o) => o.orderStatus !== "CANCELLED").length;

    const maxVal = Math.max(1, stageLeads, stageInt, stageQuote, stageOrder);
    const winRate =
      stageLeads > 0 ? Math.round((stageOrder / stageLeads) * 100) : 0;

    return {
      leads: stageLeads,
      int: stageInt,
      quote: stageQuote,
      order: stageOrder,
      maxVal,
      winRate,
    };
  }, [leads, orders]);

  // Attention Required Metrics
  const attentionMetrics = useMemo(() => {
    const overdueFollowups = followups.filter((f) => {
      if (f.status === "COMPLETED" || f.status === "CANCELLED") return false;
      const d = f.scheduledAt || f.dueDate || f.createdAt;
      return d && new Date(d) < new Date();
    }).length;

    const quotesAwaiting = quotations.filter((q) =>
      ["SENT", "PENDING", "AWAITING_APPROVAL"].includes(q.status),
    ).length;

    const paymentsPending = payments.filter((p) =>
      ["PENDING", "VERIFICATION_PENDING"].includes(p.status),
    ).length;

    const outstandingPayments = outstandingBalanceRupees > 0 ? 1 : 0;

    let criticalCount = 0;
    if (overdueFollowups > 0) criticalCount++;
    if (quotesAwaiting > 0) criticalCount++;
    if (paymentsPending > 0) criticalCount++;

    return {
      criticalCount,
      overdueFollowups,
      quotesAwaiting,
      paymentsPending,
      outstandingPayments,
    };
  }, [
    followups,
    quotations,
    payments,
    outstandingBalanceRupees,
  ]);

  // Extract ID and Name helpers
  const extractId = useCallback((val) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object") {
      if (val._id) return String(val._id);
      if (val.id) return String(val.id);
    }
    return String(val);
  }, []);

  const extractName = useCallback((val) => {
    if (!val) return "";
    if (typeof val === "string") return val.toLowerCase();
    if (typeof val === "object") {
      if (val.name) return String(val.name).toLowerCase();
      if (val.displayName) return String(val.displayName).toLowerCase();
    }
    return "";
  }, []);

  // 1. Sales Team Performance Data
  const salesTeamMembers = useMemo(() => {
    const salesUsers = users.filter((u) => {
      const role = String(u.roleSlug || u.role || "").toLowerCase();
      const name = String(u.name || "").toLowerCase();
      const email = String(u.email || "").toLowerCase();

      if (
        role.includes("admin") ||
        name.includes("admin") ||
        email.includes("admin") ||
        role.includes("operator")
      ) {
        return false;
      }

      return (
        role.includes("sales") ||
        role.includes("rep") ||
        role === "telecaller" ||
        role === "executive" ||
        role === "manager"
      );
    });

    return salesUsers.map((u) => {
      const uIdStr = extractId(u._id || u.id);
      const uNameStr = String(u.name || "").toLowerCase();

      const userLeads = leads.filter((l) => {
        const assignedId =
          extractId(l.assignedToId) ||
          extractId(l.assignedTo) ||
          extractId(l.salesRepId);
        const assignedName =
          extractName(l.assignedToId) ||
          extractName(l.assignedTo);
        return (
          (assignedId && assignedId === uIdStr) ||
          (assignedName &&
            (assignedName === uNameStr || assignedName.includes(uNameStr)))
        );
      });

      const effectiveLeads =
        userLeads.length > 0
          ? userLeads
          : salesUsers.length === 1 && leads.length > 0
            ? leads
            : [];

      const userLeadIdSet = new Set(
        effectiveLeads.map((l) => extractId(l._id || l.id)),
      );

      // Follow-ups for this sales user
      const userFollowups = followups.filter((f) => {
        const fRepId = extractId(f.assignedToId || f.salesRepId || f.createdById || f.userId);
        const fRepName = extractName(f.assignedToName || f.createdByName);
        const leadMatch = f.leadId && userLeadIdSet.has(extractId(f.leadId));
        return (
          (fRepId && fRepId === uIdStr) ||
          (fRepName && fRepName === uNameStr) ||
          leadMatch
        );
      });

      const activeFollowups = userFollowups.filter((f) => f.status !== "COMPLETED" && f.status !== "CANCELLED").length;
      const overdueFollowups = userFollowups.filter((f) => {
        if (f.status === "COMPLETED" || f.status === "CANCELLED") return false;
        const d = f.scheduledAt || f.dueDate || f.createdAt;
        return d && new Date(d) < new Date();
      }).length;

      // Accepted quotations belonging to this sales rep
      const userQuotations = quotations.filter((q) => {
        const repId =
          extractId(q.assignedSalesId) ||
          extractId(q.salesRepId) ||
          extractId(q.salesExecutiveId);
        const repName =
          extractName(q.assignedSalesId) ||
          extractName(q.salesRep);
        const createdById = extractId(q.createdById) || extractId(q.createdBy);
        const quoteLeadId = extractId(q.leadId);

        return (
          (repId && repId === uIdStr) ||
          (repName && (repName === uNameStr || repName.includes(uNameStr))) ||
          (createdById && createdById === uIdStr) ||
          (quoteLeadId && userLeadIdSet.has(quoteLeadId))
        );
      });

      const acceptedQuotes = userQuotations.filter((q) => q.status === "ACCEPTED");
      const effectiveQuotations =
        acceptedQuotes.length > 0
          ? acceptedQuotes
          : salesUsers.length === 1 && quotations.filter((q) => q.status === "ACCEPTED").length > 0
            ? quotations.filter((q) => q.status === "ACCEPTED")
            : [];

      const userRevenue = effectiveQuotations.reduce((sum, q) => {
        const val = q.grandTotalPaise
          ? q.grandTotalPaise / 100
          : q.grandTotal || q.totalAmount || 0;
        return sum + Number(val || 0);
      }, 0);

      const leadsCount = effectiveLeads.length;
      const ordersCount = effectiveQuotations.length;
      const conversionRate =
        leadsCount > 0 ? Math.round((ordersCount / leadsCount) * 100) : 0;

      let roleDisplay = "Sales Executive";
      const r = String(u.roleSlug || u.role || "").toLowerCase();
      if (
        r.includes("director") ||
        r.includes("lead") ||
        String(u.name || "").toLowerCase().includes("tanya")
      ) {
        roleDisplay = "Lead Sales Director";
      } else if (r.includes("manager")) {
        roleDisplay = "Sales Manager";
      } else if (r.includes("senior")) {
        roleDisplay = "Senior Sales Executive";
      }

      return {
        id: u._id || u.id,
        name: u.name,
        email: u.email || "—",
        phone: u.phone || "—",
        role: roleDisplay,
        canonicalRole: "sales",
        initials: (u.name || "S").slice(0, 2).toUpperCase(),
        avatarUrl: u.avatarUrl || null,
        status: u.status || "ACTIVE",
        isOnline: Boolean(u.isOnline),
        lastActiveAt: u.lastActiveAt,
        leads: leadsCount,
        orders: ordersCount,
        quotationsCount: userQuotations.length,
        activeFollowups,
        overdueFollowups,
        revenue: userRevenue,
        conversion: conversionRate,
        assignedLeadsList: effectiveLeads,
        userType: "sales",
      };
    });
  }, [users, leads, quotations, followups, extractId, extractName]);

  // 2. Data Operators Performance Data
  const dataOperatorsList = useMemo(() => {
    const operatorUsers = users.filter((u) => {
      const role = String(u.roleSlug || u.role || "").toLowerCase();
      return role.includes("operator") || role === "data_operator";
    });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const todayStr = now.toDateString();

    return operatorUsers.map((u) => {
      const uIdStr = extractId(u._id || u.id);
      const uNameStr = String(u.name || "").toLowerCase();

      const sourcedLeads = leads.filter((l) => {
        const cId = extractId(l.createdById || l.createdBy || l.userId);
        const cName = extractName(l.uploadedByName || l.createdByName);
        const isOperatorSource = l.source === "DATA_OPERATOR";

        if (cId && cId === uIdStr) return true;
        if (cName && (cName === uNameStr || cName.includes(uNameStr))) return true;
        if (operatorUsers.length === 1 && isOperatorSource) return true;
        return false;
      });

      const totalSourced = sourcedLeads.length;
      const todaySourced = sourcedLeads.filter((l) => {
        const d = l.createdAt ? new Date(l.createdAt) : null;
        return d && d.toDateString() === todayStr;
      }).length;

      const monthSourced = sourcedLeads.filter((l) => {
        const d = l.createdAt ? new Date(l.createdAt) : null;
        return d && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }).length;

      const withPhotosCount = sourcedLeads.filter((l) => Boolean(l.shopImageUrl || (l.attachments && l.attachments.length > 0))).length;

      const convertedBySalesCount = sourcedLeads.filter((l) =>
        ["QUALIFIED", "QUOTED", "WON"].includes(l.status) ||
        quotations.some((q) => extractId(q.leadId) === extractId(l._id || l.id) && q.status === "ACCEPTED")
      ).length;

      const conversionRate = totalSourced > 0 ? Math.round((convertedBySalesCount / totalSourced) * 100) : 0;

      const areasCovered = Array.from(
        new Set(sourcedLeads.map((l) => l.areaName || l.zoneName || l.areaId).filter(Boolean))
      );

      return {
        id: u._id || u.id,
        name: u.name,
        email: u.email || "—",
        phone: u.phone || "—",
        role: "Data Operator",
        canonicalRole: "data_operator",
        initials: (u.name || "DO").slice(0, 2).toUpperCase(),
        avatarUrl: u.avatarUrl || null,
        status: u.status || "ACTIVE",
        isOnline: Boolean(u.isOnline),
        lastActiveAt: u.lastActiveAt,
        totalSourced,
        todaySourced,
        monthSourced,
        withPhotosCount,
        convertedBySalesCount,
        conversion: conversionRate,
        areasCovered,
        assignedLeadsList: sourcedLeads,
        userType: "operator",
      };
    });
  }, [users, leads, quotations, extractId, extractName]);

  // 3. Consolidated All Team Members
  const allStaffMembers = useMemo(() => {
    return [...salesTeamMembers, ...dataOperatorsList];
  }, [salesTeamMembers, dataOperatorsList]);

  // 4. Filtered Staff Members by Tab & Search
  const filteredStaffMembers = useMemo(() => {
    let list = [];
    if (teamTab === "Sales Team") list = salesTeamMembers;
    else if (teamTab === "Data Operators") list = dataOperatorsList;
    else list = allStaffMembers;

    if (!teamSearch.trim()) return list;
    const query = teamSearch.toLowerCase().trim();
    return list.filter(
      (m) =>
        m.name?.toLowerCase().includes(query) ||
        m.email?.toLowerCase().includes(query) ||
        m.phone?.toLowerCase().includes(query) ||
        m.role?.toLowerCase().includes(query)
    );
  }, [teamTab, salesTeamMembers, dataOperatorsList, allStaffMembers, teamSearch]);

  // 5. Consolidated System Live Activity Stream
  const combinedSystemEvents = useMemo(() => {
    const rawEvents = (activities || []).map((act, idx) => {
      const d = new Date(act.occurredAt || act.createdAt || 0);
      const isOperator =
        act.actorRole?.toLowerCase().includes("operator") ||
        act.summary?.toLowerCase().includes("operator") ||
        act.description?.toLowerCase().includes("operator");

      let category = "sales";
      if (act.entityType === "PAYMENT" || act.action?.includes("PAYMENT")) category = "payments";
      else if (["QUOTATION", "ORDER"].includes(act.entityType) || act.action?.includes("ORDER") || act.action?.includes("QUOTE")) category = "orders";
      else if (isOperator || act.action?.includes("FIELD") || act.action?.includes("UPLOAD")) category = "operators";

      return {
        id: act._id || `act-${idx}`,
        timeStr: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        timestamp: d,
        eventCode: act.action || act.entityType || "ACTIVITY_LOGGED",
        actorName: act.actorName || act.createdByName || (isOperator ? "Data Operator" : "Sales Team"),
        actorRole: act.actorRole || (isOperator ? "Data Operator" : "Sales Executive"),
        summary: act.summary || act.description || "Activity logged in system.",
        tag: act.entityId ? `${act.entityType || "Entity"} #${String(act.entityId).slice(-6).toUpperCase()}` : `Event #${idx + 1}`,
        category,
        entityType: act.entityType,
        entityId: act.entityId,
      };
    });

    const leadEvents = (leads || []).slice(0, 25).map((l, idx) => {
      const isOperator = l.source === "DATA_OPERATOR" || l.uploadedByName?.toLowerCase().includes("operator");
      const d = new Date(l.createdAt || 0);
      return {
        id: `lead-evt-${l._id || idx}`,
        timeStr: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        timestamp: d,
        eventCode: isOperator ? "FIELD_LEAD_CAPTURED" : "LEAD_CREATED",
        actorName: l.uploadedByName || l.createdByName || (isOperator ? "Field Operator" : "Sales Rep"),
        actorRole: isOperator ? "Data Operator" : "Sales Executive",
        summary: `${isOperator ? "Captured field inquiry" : "Created lead"} for "${l.businessName || l.contactName || l.name || "New Client"}"${l.areaName ? ` (${l.areaName})` : ""}${l.estimatedBudget ? ` • ₹${Number(l.estimatedBudget).toLocaleString("en-IN")}` : ""}`,
        tag: `Lead #${String(l._id || idx).slice(-6).toUpperCase()}`,
        category: isOperator ? "operators" : "sales",
        entityType: "LEAD",
        entityId: l._id || l.id,
      };
    });

    const quoteEvents = (quotations || []).slice(0, 15).map((q, idx) => {
      const d = new Date(q.updatedAt || q.createdAt || 0);
      const isAccepted = q.status === "ACCEPTED";
      return {
        id: `quote-evt-${q._id || idx}`,
        timeStr: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        timestamp: d,
        eventCode: isAccepted ? "QUOTE_ACCEPTED" : "QUOTATION_ISSUED",
        actorName: q.salesRep || q.assignedSalesName || "Sales Executive",
        actorRole: "Sales Executive",
        summary: `Quotation ${q.quotationNumber || `#${String(q._id || idx).slice(-4)}`} ${isAccepted ? "WON & ACCEPTED" : "generated"} for ₹${(q.grandTotalPaise ? q.grandTotalPaise / 100 : q.grandTotal || 0).toLocaleString("en-IN")}`,
        tag: `Quote #${String(q._id || idx).slice(-6).toUpperCase()}`,
        category: "orders",
        entityType: "QUOTATION",
        entityId: q._id || q.id,
      };
    });

    const payEvents = (payments || []).slice(0, 15).map((p, idx) => {
      const d = new Date(p.paymentDate || p.createdAt || 0);
      const isConfirmed = p.status === "CONFIRMED" || p.status === "COMPLETED";
      return {
        id: `pay-evt-${p._id || idx}`,
        timeStr: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        timestamp: d,
        eventCode: isConfirmed ? "PAYMENT_CONFIRMED" : "PAYMENT_RECORDED",
        actorName: p.verifiedByName || p.receivedByName || "Accounts / Cashier",
        actorRole: "Finance & Sales",
        summary: `Received ₹${(p.amountPaise ? p.amountPaise / 100 : p.amount || 0).toLocaleString("en-IN")} via ${p.paymentMode || "Bank"} (${isConfirmed ? "Verified" : "Pending Audit"})`,
        tag: `Payment #${String(p._id || idx).slice(-6).toUpperCase()}`,
        category: "payments",
        entityType: "PAYMENT",
        entityId: p._id || p.id,
      };
    });

    const merged = [...rawEvents, ...leadEvents, ...quoteEvents, ...payEvents];
    const seen = new Set();
    const unique = [];
    for (const item of merged) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        unique.push(item);
      }
    }
    unique.sort((a, b) => b.timestamp - a.timestamp);
    return unique;
  }, [activities, leads, quotations, payments]);

  // 6. Filtered System Events by Category & Search
  const filteredSystemEvents = useMemo(() => {
    return combinedSystemEvents.filter((ev) => {
      if (activityCategoryFilter !== "all" && ev.category !== activityCategoryFilter) {
        return false;
      }
      if (activitySearch.trim()) {
        const q = activitySearch.toLowerCase();
        return (
          ev.actorName?.toLowerCase().includes(q) ||
          ev.summary?.toLowerCase().includes(q) ||
          ev.eventCode?.toLowerCase().includes(q) ||
          ev.tag?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [combinedSystemEvents, activityCategoryFilter, activitySearch]);

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1580px] mx-auto w-full">
          {loading ? (
            <DashboardSkeleton />
          ) : (
            <>
              {/* HEADER / EXECUTIVE GREETING BAR */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200/80">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      Admin Executive Overview
                    </h1>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Ops
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Good {timeOfDay}, <span className="font-semibold text-slate-700">{userName}</span>. Complete oversight of sales executives, field data operators, and live company operations.
                  </p>
                </div>

                {/* Right Quick Actions & Date */}
                <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{liveDateHeader}</span>
                  </div>

                  <button
                    onClick={() => loadDashboardData(true)}
                    disabled={refreshing}
                    title="Refresh data"
                    className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-orange-600" : ""}`} />
                  </button>

                  <button
                    onClick={() => router.push("/dashboard/quotations")}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold shadow-2xs transition hover:border-slate-400"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>New Quote</span>
                  </button>

                  <button
                    onClick={() => setShowAddLeadModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F95721] hover:bg-[#e44d1c] text-white text-xs font-semibold shadow-xs transition active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add Lead</span>
                  </button>
                </div>
              </div>

              {/* 4 CLEAN HERO KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Collections */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs transition flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Total Collections
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="my-3">
                    <div className="text-2xl font-black text-slate-900 tracking-tight">
                      ₹ {totalPaymentsReceivedRupees.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Today&apos;s collections</span>
                    <span className="font-bold text-emerald-600">
                      ₹ {todayRevenueRupees.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* 2. Total Leads Pipeline */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs transition flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Active Leads Pipeline
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="my-3">
                    <div className="text-2xl font-black text-slate-900 tracking-tight">
                      {totalLeadsCount} <span className="text-sm font-semibold text-slate-400">Leads</span>
                    </div>
                  </div>
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>+{leadsThisMonthCount} this month</span>
                    <span className="font-semibold text-indigo-600">
                      {pipelineMetrics.winRate}% win rate
                    </span>
                  </div>
                </div>

                {/* 3. Orders Booked */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs transition flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Orders Booked
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="my-3">
                    <div className="text-2xl font-black text-slate-900 tracking-tight">
                      {activeOrdersCount} <span className="text-sm font-semibold text-slate-400">Orders</span>
                    </div>
                  </div>
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Total booking value</span>
                    <span className="font-bold text-slate-900">
                      ₹ {totalOrderValueRupees.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* 4. Outstanding Receivables */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs transition flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Outstanding Balance
                    </span>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      attentionMetrics.paymentsPending > 0 ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-600"
                    }`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="my-3">
                    <div className="text-2xl font-black text-slate-900 tracking-tight">
                      ₹ {outstandingBalanceRupees.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Pending verification</span>
                    <span className={`font-semibold ${attentionMetrics.paymentsPending > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {attentionMetrics.paymentsPending} audits pending
                    </span>
                  </div>
                </div>
              </div>

              {/* PRIMARY VIEW NAVIGATION TABS */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <button
                    onClick={() => setActiveView("team")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeView === "team"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Team &amp; Staff Performance</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      activeView === "team" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700"
                    }`}>
                      {allStaffMembers.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveView("operations")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeView === "operations"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>Operations &amp; Attention Items</span>
                    {attentionMetrics.criticalCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-black animate-pulse">
                        {attentionMetrics.criticalCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveView("activity")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeView === "activity"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <span>Live Activity &amp; Audit Stream</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      activeView === "activity" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700"
                    }`}>
                      {filteredSystemEvents.length}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push("/dashboard/admin/user-dashboards")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition"
                  >
                    <span>User Dashboards Hub</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* TAB 1: TEAM & STAFF DIRECTORY */}
              {activeView === "team" && (
                <div className="space-y-4">
                  {/* Sub-Filters and Search */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                    {/* Role Filter Pills */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-semibold">
                      <button
                        onClick={() => setTeamTab("Sales Team")}
                        className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
                          teamTab === "Sales Team"
                            ? "bg-white text-slate-900 shadow-2xs font-bold"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <span>Sales Executives</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                          teamTab === "Sales Team" ? "bg-indigo-50 text-indigo-700 font-bold" : "bg-slate-200/70 text-slate-600"
                        }`}>
                          {salesTeamMembers.length}
                        </span>
                      </button>

                      <button
                        onClick={() => setTeamTab("Data Operators")}
                        className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
                          teamTab === "Data Operators"
                            ? "bg-white text-slate-900 shadow-2xs font-bold"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <span>Field Data Operators</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                          teamTab === "Data Operators" ? "bg-teal-50 text-teal-700 font-bold" : "bg-slate-200/70 text-slate-600"
                        }`}>
                          {dataOperatorsList.length}
                        </span>
                      </button>

                      <button
                        onClick={() => setTeamTab("All Team")}
                        className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
                          teamTab === "All Team"
                            ? "bg-white text-slate-900 shadow-2xs font-bold"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <span>All Staff</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/70 text-slate-600">
                          {allStaffMembers.length}
                        </span>
                      </button>
                    </div>

                    {/* Staff Search Input */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex-1 max-w-sm">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={teamSearch}
                        onChange={(e) => setTeamSearch(e.target.value)}
                        placeholder="Search staff by name, email, or phone..."
                        className="w-full text-xs text-slate-700 bg-transparent focus:outline-none placeholder-slate-400"
                      />
                      {teamSearch && (
                        <button
                          onClick={() => setTeamSearch("")}
                          className="text-slate-400 hover:text-slate-600 text-xs px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Context Metrics Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {teamTab === "Sales Team" ? (
                      <>
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Reps</span>
                          <span className="font-extrabold text-slate-900 text-base mt-0.5 block">{salesTeamMembers.length} Executives</span>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Leads</span>
                          <span className="font-extrabold text-indigo-600 text-base mt-0.5 block">{leads.length} Leads</span>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Won Deals</span>
                          <span className="font-extrabold text-emerald-600 text-base mt-0.5 block">{orders.length} Closed</span>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Revenue Won</span>
                          <span className="font-extrabold text-slate-900 text-base mt-0.5 block">₹ {totalOrderValueRupees.toLocaleString("en-IN")}</span>
                        </div>
                      </>
                    ) : teamTab === "Data Operators" ? (
                      <>
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Field Operators</span>
                          <span className="font-extrabold text-slate-900 text-base mt-0.5 block">{dataOperatorsList.length} Active</span>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Leads Sourced</span>
                          <span className="font-extrabold text-indigo-600 text-base mt-0.5 block">{dataOperatorsList.reduce((acc, o) => acc + o.totalSourced, 0)}</span>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sourced Today</span>
                          <span className="font-extrabold text-emerald-600 text-base mt-0.5 block">{dataOperatorsList.reduce((acc, o) => acc + o.todaySourced, 0)} today</span>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Photos Captured</span>
                          <span className="font-extrabold text-teal-600 text-base mt-0.5 block">{dataOperatorsList.reduce((acc, o) => acc + o.withPhotosCount, 0)} Photos</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Staff</span>
                          <span className="font-extrabold text-slate-900 text-base mt-0.5 block">{allStaffMembers.length} Members</span>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Online Now</span>
                          <span className="font-extrabold text-emerald-600 text-base mt-0.5 block">{allStaffMembers.filter((m) => m.isOnline).length} Active</span>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pipeline Leads</span>
                          <span className="font-extrabold text-indigo-600 text-base mt-0.5 block">{leads.length}</span>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Confirmed Orders</span>
                          <span className="font-extrabold text-slate-900 text-base mt-0.5 block">{orders.length}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Clean Staff Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                            <th className="py-3 px-4">Staff Member</th>
                            <th className="py-3 px-3">Role</th>
                            {teamTab === "Sales Team" ? (
                              <>
                                <th className="py-3 px-3 text-center">Leads Handled</th>
                                <th className="py-3 px-3 text-center">Follow-ups</th>
                                <th className="py-3 px-3 text-center">Orders Closed</th>
                                <th className="py-3 px-3 text-right">Revenue Generated</th>
                                <th className="py-3 px-3 text-right">Conversion Rate</th>
                              </>
                            ) : teamTab === "Data Operators" ? (
                              <>
                                <th className="py-3 px-3 text-center">Total Sourced</th>
                                <th className="py-3 px-3 text-center">Today</th>
                                <th className="py-3 px-3 text-center">Photos Attached</th>
                                <th className="py-3 px-3 text-center">Converted to Won</th>
                                <th className="py-3 px-3 text-right">Quality Rate</th>
                              </>
                            ) : (
                              <>
                                <th className="py-3 px-3 text-center">Leads / Sourced</th>
                                <th className="py-3 px-3 text-center">Status</th>
                                <th className="py-3 px-3 text-right">Conversion %</th>
                              </>
                            )}
                            <th className="py-3 px-4 text-center">Actions</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {filteredStaffMembers.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-12 text-center text-slate-400">
                                <Users className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                                <p className="text-xs font-semibold text-slate-600">No staff members match your filter.</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Try clearing your search query.</p>
                              </td>
                            </tr>
                          ) : (
                            filteredStaffMembers.map((member) => (
                              <tr
                                key={member.id}
                                className="hover:bg-slate-50/80 transition-colors group"
                              >
                                {/* Member Profile */}
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="relative shrink-0">
                                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 overflow-hidden">
                                        {member.avatarUrl ? (
                                          <img
                                            src={member.avatarUrl}
                                            alt={member.name}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          member.initials
                                        )}
                                      </div>
                                      <span
                                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                          member.isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                                        }`}
                                        title={member.isOnline ? "Online" : "Offline"}
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-bold text-slate-900 truncate">
                                        {member.name}
                                      </div>
                                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                                        {member.email && member.email !== "—" && (
                                          <span className="truncate">{member.email}</span>
                                        )}
                                        {member.phone && member.phone !== "—" && (
                                          <span className="font-mono text-slate-400">• {member.phone}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Role Badge */}
                                <td className="py-3 px-3">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                    member.userType === "operator"
                                      ? "bg-teal-50 text-teal-700 border-teal-200"
                                      : "bg-indigo-50 text-indigo-700 border-indigo-200"
                                  }`}>
                                    {member.role}
                                  </span>
                                </td>

                                {/* Tab Specific Columns */}
                                {teamTab === "Sales Team" ? (
                                  <>
                                    <td className="py-3 px-3 text-center font-bold text-slate-900">
                                      {member.leads}
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                        member.overdueFollowups > 0
                                          ? "bg-rose-50 text-rose-600 border border-rose-200"
                                          : "bg-slate-100 text-slate-700"
                                      }`}>
                                        {member.activeFollowups} {member.overdueFollowups > 0 ? `(${member.overdueFollowups} overdue)` : ""}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3 text-center font-bold text-slate-900">
                                      {member.orders}
                                    </td>
                                    <td className="py-3 px-3 text-right font-black text-slate-900">
                                      ₹ {member.revenue.toLocaleString("en-IN")}
                                    </td>
                                    <td className="py-3 px-3 text-right">
                                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        {member.conversion}%
                                      </span>
                                    </td>
                                  </>
                                ) : teamTab === "Data Operators" ? (
                                  <>
                                    <td className="py-3 px-3 text-center font-bold text-slate-900">
                                      {member.totalSourced}
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        +{member.todaySourced} today
                                      </span>
                                    </td>
                                    <td className="py-3 px-3 text-center font-semibold text-slate-700">
                                      {member.withPhotosCount}
                                    </td>
                                    <td className="py-3 px-3 text-center font-bold text-indigo-700">
                                      {member.convertedBySalesCount}
                                    </td>
                                    <td className="py-3 px-3 text-right">
                                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                                        {member.conversion}%
                                      </span>
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="py-3 px-3 text-center font-bold text-slate-900">
                                      {member.userType === "operator" ? member.totalSourced : member.leads}
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        member.isOnline ? "text-emerald-700 bg-emerald-50 border border-emerald-200" : "text-slate-500 bg-slate-100"
                                      }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${member.isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                                        {member.isOnline ? "Online" : "Offline"}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3 text-right">
                                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        {member.conversion}%
                                      </span>
                                    </td>
                                  </>
                                )}

                                {/* Actions Column */}
                                <td className="py-3 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => setSelectedStaffMember(member)}
                                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 text-[11px] font-bold transition flex items-center gap-1"
                                      title="Inspect User Details"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Details</span>
                                    </button>

                                    {member.phone && member.phone !== "—" && (
                                      <a
                                        href={`tel:${member.phone}`}
                                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition"
                                        title={`Call ${member.name}`}
                                      >
                                        <Phone className="w-3.5 h-3.5" />
                                      </a>
                                    )}

                                    {member.email && member.email !== "—" && (
                                      <a
                                        href={`mailto:${member.email}`}
                                        className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition"
                                        title={`Email ${member.name}`}
                                      >
                                        <Mail className="w-3.5 h-3.5" />
                                      </a>
                                    )}

                                    <button
                                      onClick={() => router.push(`/dashboard/admin/user-dashboards?userId=${member.id}`)}
                                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                                      title="Open Full Dashboard"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: OPERATIONS & ATTENTION ITEMS */}
              {activeView === "operations" && (
                <div className="space-y-6">
                  {/* Action Items Pending Review */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                      Action Items Requiring Attention
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Overdue Follow-ups */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500">Overdue Follow-ups</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              attentionMetrics.overdueFollowups > 0 ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-emerald-50 text-emerald-700"
                            }`}>
                              {attentionMetrics.overdueFollowups > 0 ? "Action Required" : "All Clear"}
                            </span>
                          </div>
                          <div className="text-3xl font-black text-slate-900 mt-2">
                            {attentionMetrics.overdueFollowups}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">Pending client calls or scheduled meetings past due date.</p>
                        </div>
                        <button
                          onClick={() => router.push("/dashboard/followups")}
                          className="mt-4 w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition"
                        >
                          Review Follow-ups →
                        </button>
                      </div>

                      {/* Quotations Awaiting Approval */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500">Quotes In Approval</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              attentionMetrics.quotesAwaiting > 0 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700"
                            }`}>
                              {attentionMetrics.quotesAwaiting > 0 ? "Pending" : "Cleared"}
                            </span>
                          </div>
                          <div className="text-3xl font-black text-slate-900 mt-2">
                            {attentionMetrics.quotesAwaiting}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">Price estimates or discounts awaiting customer signoff.</p>
                        </div>
                        <button
                          onClick={() => router.push("/dashboard/quotations")}
                          className="mt-4 w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition"
                        >
                          Review Quotations →
                        </button>
                      </div>

                      {/* Payments Pending Verification */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500">Payments to Audit</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              attentionMetrics.paymentsPending > 0 ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-emerald-50 text-emerald-700"
                            }`}>
                              {attentionMetrics.paymentsPending > 0 ? "Needs Audit" : "Reconciled"}
                            </span>
                          </div>
                          <div className="text-3xl font-black text-slate-900 mt-2">
                            {attentionMetrics.paymentsPending}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">Cash, UPI, or Bank transfers awaiting accounts verification.</p>
                        </div>
                        <button
                          onClick={() => router.push("/dashboard/payments")}
                          className="mt-4 w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition"
                        >
                          Verify Payments →
                        </button>
                      </div>

                      {/* Active In-Progress Orders */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500">Active Orders</span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                              Active Ops
                            </span>
                          </div>
                          <div className="text-3xl font-black text-slate-900 mt-2">
                            {activeOrdersCount}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">Confirmed client print jobs currently in progress.</p>
                        </div>
                        <button
                          onClick={() => router.push("/dashboard/orders")}
                          className="mt-4 w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition"
                        >
                          Manage Orders →
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2-Column: Pipeline Funnel + Financial Overview */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Pipeline Funnel */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Sales Conversion Funnel</h4>
                          <p className="text-xs text-slate-500">End-to-end pipeline progression from inquiry to won order.</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {pipelineMetrics.winRate}% Win Velocity
                        </span>
                      </div>

                      <div className="space-y-4 pt-2">
                        {/* Step 1: Leads */}
                        <div>
                          <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                            <span>1. Inquiries &amp; Sourced Leads</span>
                            <span>{pipelineMetrics.leads} Leads</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: "100%" }} />
                          </div>
                        </div>

                        {/* Step 2: Qualified */}
                        <div>
                          <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                            <span>2. Qualified / Interested</span>
                            <span>{pipelineMetrics.int} Leads</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${pipelineMetrics.leads > 0 ? (pipelineMetrics.int / pipelineMetrics.leads) * 100 : 0}%` }}
                            />
                          </div>
                        </div>

                        {/* Step 3: Quoted */}
                        <div>
                          <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                            <span>3. Quotations Generated</span>
                            <span>{pipelineMetrics.quote} Quotes</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-amber-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${pipelineMetrics.leads > 0 ? (pipelineMetrics.quote / pipelineMetrics.leads) * 100 : 0}%` }}
                            />
                          </div>
                        </div>

                        {/* Step 4: Closed Won */}
                        <div>
                          <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                            <span>4. Closed Won Orders</span>
                            <span>{pipelineMetrics.order} Orders</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-rose-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${pipelineMetrics.leads > 0 ? (pipelineMetrics.order / pipelineMetrics.leads) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Financial Overview */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">Financial Balance Sheet</h4>
                            <p className="text-xs text-slate-500">Order revenue, verified collections, and balance.</p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                            {paymentCoveragePercent}% Collected
                          </span>
                        </div>

                        <div className="space-y-3 pt-1">
                          <div className="flex items-center justify-between py-2 border-b border-slate-100 text-xs">
                            <span className="text-slate-500 font-medium">Total Booked Value</span>
                            <span className="font-black text-slate-900 text-sm">₹ {totalOrderValueRupees.toLocaleString("en-IN")}</span>
                          </div>

                          <div className="flex items-center justify-between py-2 border-b border-slate-100 text-xs">
                            <span className="text-slate-500 font-medium">Collections Verified</span>
                            <span className="font-black text-emerald-600 text-sm">₹ {totalPaymentsReceivedRupees.toLocaleString("en-IN")}</span>
                          </div>

                          <div className="flex items-center justify-between py-2 border-b border-slate-100 text-xs">
                            <span className="text-slate-500 font-medium">Outstanding Balance</span>
                            <span className="font-black text-slate-900 text-sm">₹ {outstandingBalanceRupees.toLocaleString("en-IN")}</span>
                          </div>

                          <div className="flex items-center justify-between py-2 text-xs">
                            <span className="text-slate-500 font-medium">Collections Pending Verification</span>
                            <span className="font-black text-purple-600 text-sm">₹ {pendingVerificationRupees.toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Settlement Status:</span>
                        <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Ledgers Synchronized
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: LIVE ACTIVITY & AUDIT STREAM */}
              {activeView === "activity" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
                  {/* Category filters & Search */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
                      <button
                        onClick={() => setActivityCategoryFilter("all")}
                        className={`px-3 py-1.5 rounded-xl transition ${
                          activityCategoryFilter === "all"
                            ? "bg-slate-900 text-white font-bold"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        All ({combinedSystemEvents.length})
                      </button>

                      <button
                        onClick={() => setActivityCategoryFilter("sales")}
                        className={`px-3 py-1.5 rounded-xl transition ${
                          activityCategoryFilter === "sales"
                            ? "bg-indigo-600 text-white font-bold"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        Sales Team
                      </button>

                      <button
                        onClick={() => setActivityCategoryFilter("operators")}
                        className={`px-3 py-1.5 rounded-xl transition ${
                          activityCategoryFilter === "operators"
                            ? "bg-teal-600 text-white font-bold"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        Data Operators
                      </button>

                      <button
                        onClick={() => setActivityCategoryFilter("orders")}
                        className={`px-3 py-1.5 rounded-xl transition ${
                          activityCategoryFilter === "orders"
                            ? "bg-amber-600 text-white font-bold"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        Quotes &amp; Orders
                      </button>

                      <button
                        onClick={() => setActivityCategoryFilter("payments")}
                        className={`px-3 py-1.5 rounded-xl transition ${
                          activityCategoryFilter === "payments"
                            ? "bg-purple-600 text-white font-bold"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        Payments
                      </button>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs max-w-xs w-full">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={activitySearch}
                        onChange={(e) => setActivitySearch(e.target.value)}
                        placeholder="Search audit events..."
                        className="w-full text-xs text-slate-700 bg-transparent focus:outline-none placeholder-slate-400"
                      />
                      {activitySearch && (
                        <button
                          onClick={() => setActivitySearch("")}
                          className="text-slate-400 hover:text-slate-600 text-xs px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Activity Timeline List */}
                  <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                    {filteredSystemEvents.length === 0 ? (
                      <div className="py-16 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                        <p className="text-xs font-semibold text-slate-600">No events found in this category.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Real-time interactions will appear here automatically.</p>
                      </div>
                    ) : (
                      filteredSystemEvents.map((act) => (
                        <div
                          key={act.id}
                          className="p-3 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200/70 transition flex items-start gap-3 text-xs"
                        >
                          <div className="pt-0.5 shrink-0">
                            <span
                              className={`w-2 h-2 rounded-full block ${
                                act.category === "operators"
                                  ? "bg-teal-500"
                                  : act.category === "orders"
                                  ? "bg-amber-500"
                                  : act.category === "payments"
                                  ? "bg-purple-500"
                                  : "bg-indigo-500"
                              }`}
                            />
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900">{act.actorName}</span>
                                <span className={`px-2 py-0.2 rounded text-[10px] font-bold border ${
                                  act.category === "operators"
                                    ? "bg-teal-50 text-teal-700 border-teal-200"
                                    : act.category === "payments"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : "bg-slate-100 text-slate-700 border-slate-200"
                                }`}>
                                  {act.actorRole}
                                </span>
                                <span className="font-mono text-[10px] font-semibold text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                                  {act.eventCode}
                                </span>
                              </div>

                              <span className="text-[11px] text-slate-400 font-mono">
                                {act.timeStr}
                              </span>
                            </div>

                            <p className="text-slate-600 text-xs leading-relaxed">
                              {act.summary}
                            </p>

                            {act.tag && (
                              <div className="pt-0.5">
                                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 inline-block">
                                  {act.tag}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Showing {filteredSystemEvents.length} live records</span>
                    <button
                      onClick={() => router.push("/dashboard/admin/audit")}
                      className="font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      Open Full Audit Log Hub →
                    </button>
                  </div>
                </div>
              )}

              {/* FOOTER SYSTEM STATUS */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 pt-2 pb-4 border-t border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">A2V CRM Platform</span>
                  <span>•</span>
                  <span>Version 4.8.2</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Database Active
                  </span>
                </div>
                <div>
                  Signed in as <span className="font-semibold text-slate-700">{currentUser?.email || "admin@a2vstudio.in"}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ADD LEAD MODAL */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-black text-slate-900">Add New Lead</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Capture a walk-in, inbound call, or portal inquiry.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddLeadModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Contact Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Kumar"
                  value={newLead.name}
                  onChange={(e) =>
                    setNewLead({ ...newLead, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#F95721]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={newLead.phone}
                    onChange={(e) =>
                      setNewLead({ ...newLead, phone: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#F95721]"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="client@company.com"
                    value={newLead.email}
                    onChange={(e) =>
                      setNewLead({ ...newLead, email: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#F95721]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Business / Brand
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Prints"
                    value={newLead.companyName}
                    onChange={(e) =>
                      setNewLead({ ...newLead, companyName: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#F95721]"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Estimated Value (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newLead.estimatedValue}
                    onChange={(e) =>
                      setNewLead({ ...newLead, estimatedValue: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#F95721]"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Lead Source
                </label>
                <select
                  value={newLead.source}
                  onChange={(e) =>
                    setNewLead({ ...newLead, source: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#F95721]"
                >
                  <option value="WALK_IN">Walk In</option>
                  <option value="PHONE_CALL">Phone Call</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="INDIAMART">IndiaMART</option>
                  <option value="JUSTDIAL">JustDial</option>
                  <option value="WEBSITE">Website</option>
                  <option value="REFERRAL">Referral</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Printing Requirement Details
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 5000 Business Cards 400gsm Velvet Laminated"
                  value={newLead.requirement}
                  onChange={(e) =>
                    setNewLead({ ...newLead, requirement: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#F95721]"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Assigned Sales Rep
                </label>
                <select
                  value={newLead.assignedToId}
                  onChange={(e) =>
                    setNewLead({ ...newLead, assignedToId: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#F95721]"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.roleSlug || u.role})
                    </option>
                  ))}
                </select>
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
                  value={newLead.nextFollowUp || ""}
                  onChange={(e) =>
                    setNewLead({ ...newLead, nextFollowUp: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#F95721]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={creatingLead}
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingLead}
                  className={`px-5 py-2 rounded-xl text-white font-semibold shadow-md flex items-center justify-center gap-2 transition-all ${
                    creatingLead
                      ? "bg-orange-400 cursor-not-allowed opacity-90 shadow-none"
                      : "bg-[#F95721] hover:bg-[#e84915] shadow-orange-500/20 active:scale-95"
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

      {/* STAFF MEMBER DEEP INSPECTION MODAL */}
      {selectedStaffMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-700 font-extrabold text-base flex items-center justify-center border-2 border-white shadow-xs overflow-hidden">
                    {selectedStaffMember.avatarUrl ? (
                      <img
                        src={selectedStaffMember.avatarUrl}
                        alt={selectedStaffMember.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      selectedStaffMember.initials
                    )}
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                      selectedStaffMember.isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                    }`}
                    title={selectedStaffMember.isOnline ? "Online" : "Offline"}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      {selectedStaffMember.name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      selectedStaffMember.userType === "operator"
                        ? "bg-teal-50 text-teal-700 border-teal-200"
                        : "bg-indigo-50 text-indigo-700 border-indigo-200"
                    }`}>
                      {selectedStaffMember.role}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedStaffMember.isOnline
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {selectedStaffMember.isOnline ? "Online" : "Offline"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    {selectedStaffMember.email && selectedStaffMember.email !== "—" && (
                      <a
                        href={`mailto:${selectedStaffMember.email}`}
                        className="flex items-center gap-1 hover:text-indigo-600 transition"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedStaffMember.email}</span>
                      </a>
                    )}
                    {selectedStaffMember.phone && selectedStaffMember.phone !== "—" && (
                      <a
                        href={`tel:${selectedStaffMember.phone}`}
                        className="flex items-center gap-1 hover:text-indigo-600 font-mono transition"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedStaffMember.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStaffMember(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>
            </div>

            {/* Quick KPI Stat Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50/70 border-b border-slate-100 text-xs">
              {selectedStaffMember.userType === "sales" ? (
                <>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Leads</span>
                    <span className="text-lg font-black text-slate-900">{selectedStaffMember.leads}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Follow-ups</span>
                    <span className="text-lg font-black text-amber-600">{selectedStaffMember.activeFollowups} Active</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Orders Won</span>
                    <span className="text-lg font-black text-emerald-600">{selectedStaffMember.orders}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Revenue</span>
                    <span className="text-lg font-black text-slate-900">₹ {selectedStaffMember.revenue.toLocaleString("en-IN")}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Sourced</span>
                    <span className="text-lg font-black text-slate-900">{selectedStaffMember.totalSourced}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today Sourced</span>
                    <span className="text-lg font-black text-emerald-600">+{selectedStaffMember.todaySourced}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Photos Attached</span>
                    <span className="text-lg font-black text-indigo-600">{selectedStaffMember.withPhotosCount}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Converted by Sales</span>
                    <span className="text-lg font-black text-emerald-600">{selectedStaffMember.convertedBySalesCount} ({selectedStaffMember.conversion}%)</span>
                  </div>
                </>
              )}
            </div>

            {/* Sub-Tabs: Associated Leads vs User Activity */}
            <div className="px-5 pt-3 border-b border-slate-100 flex items-center gap-3 text-xs font-bold">
              <button
                onClick={() => setInspectionTab("leads")}
                className={`pb-2.5 transition border-b-2 ${
                  inspectionTab === "leads"
                    ? "border-indigo-600 text-indigo-700 font-black"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                {selectedStaffMember.userType === "operator" ? "Sourced Field Leads" : "Assigned Pipeline Leads"} ({selectedStaffMember.assignedLeadsList?.length || 0})
              </button>

              <button
                onClick={() => setInspectionTab("activity")}
                className={`pb-2.5 transition border-b-2 ${
                  inspectionTab === "activity"
                    ? "border-indigo-600 text-indigo-700 font-black"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                User Activity Stream
              </button>
            </div>

            {/* Sub-Tab Content */}
            <div className="p-5 flex-1 overflow-y-auto max-h-[350px]">
              {inspectionTab === "leads" ? (
                selectedStaffMember.assignedLeadsList?.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 stroke-1 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">No leads associated with this user yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedStaffMember.assignedLeadsList.map((lead, idx) => (
                      <div
                        key={lead._id || idx}
                        onClick={() => router.push(`/dashboard/leads?id=${lead._id || lead.id}`)}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 transition flex items-center justify-between gap-3 text-xs cursor-pointer group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition">
                              {lead.businessName || lead.companyName || lead.contactName || lead.name || "Inquiry"}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-white border border-slate-200 text-slate-600">
                              {lead.status || "NEW"}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>Contact: {lead.contactName || lead.phone || "—"}</span>
                            {lead.phone && <span className="font-mono">{lead.phone}</span>}
                            {lead.areaName && <span>• {lead.areaName}</span>}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-slate-800 text-xs block">
                            ₹ {Number(lead.expectedValuePaise ? lead.expectedValuePaise / 100 : lead.estimatedBudget || lead.expectedValue || 0).toLocaleString("en-IN")}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Recent"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* Activity Tab */
                <div className="space-y-2">
                  {combinedSystemEvents
                    .filter(
                      (act) =>
                        act.actorName?.toLowerCase().includes(selectedStaffMember.name.toLowerCase()) ||
                        extractId(act.actorId) === selectedStaffMember.id
                    )
                    .map((act) => (
                      <div
                        key={act.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-2.5 text-xs"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{act.eventCode}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{act.timeStr}</span>
                          </div>
                          <p className="text-slate-600 text-[11px] mt-0.5">{act.summary}</p>
                        </div>
                      </div>
                    ))}
                  {combinedSystemEvents.filter(
                    (act) =>
                      act.actorName?.toLowerCase().includes(selectedStaffMember.name.toLowerCase()) ||
                      extractId(act.actorId) === selectedStaffMember.id
                  ).length === 0 && (
                    <div className="py-8 text-center text-slate-400">
                      <Clock className="w-6 h-6 mx-auto mb-1 stroke-1 text-slate-300" />
                      <p className="text-xs font-semibold text-slate-600">No recent activity logged for this user.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {selectedStaffMember.phone && selectedStaffMember.phone !== "—" && (
                  <a
                    href={`tel:${selectedStaffMember.phone}`}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Staff</span>
                  </a>
                )}
                {selectedStaffMember.email && selectedStaffMember.email !== "—" && (
                  <a
                    href={`mailto:${selectedStaffMember.email}`}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const param = selectedStaffMember.userType === "operator" ? `createdById=${selectedStaffMember.id}` : `assignedToId=${selectedStaffMember.id}`;
                    router.push(`/dashboard/leads?${param}`);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition flex items-center gap-1.5 shadow-2xs"
                  title="Open Leads filtered to this user"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Filtered Leads</span>
                </button>
                <button
                  onClick={() => {
                    const param = selectedStaffMember.userType === "operator" ? `createdById=${selectedStaffMember.id}` : `assignedToId=${selectedStaffMember.id}`;
                    router.push(`/dashboard/followups?${param}`);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition flex items-center gap-1.5 shadow-2xs"
                  title="Open Follow-ups filtered to this user"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Filtered Follow-ups</span>
                </button>
                <button
                  onClick={() => router.push(`/dashboard/admin/user-dashboards?userId=${selectedStaffMember.id}`)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <span>Open Full Dashboard</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStaffMember(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

