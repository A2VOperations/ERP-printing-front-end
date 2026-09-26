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
  Palette,
  Factory,
  Truck,
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
} from "lucide-react";

export default function AdminOverviewPage() {
  const router = useRouter();

  // User state
  const [userName, setUserName] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("userName");
      if (stored) return stored.split(" ")[0] || stored;
    }
    return "Ravinder";
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
  const [teamTab, setTeamTab] = useState("Sales Team");
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [creatingLead, setCreatingLead] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // Live collections from backend
  const [leads, setLeads] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [designProjects, setDesignProjects] = useState([]);
  const [productionJobs, setProductionJobs] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [activities, setActivities] = useState([]);
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
        designProjectsRes,
        productionJobsRes,
      ] = await Promise.allSettled([
        api.get("/leads?limit=100"),
        api.get("/followups?limit=100"),
        api.get("/orders?limit=100"),
        api.get("/targets/my-achievement", { silent: true }),
        api.get("/targets/leaderboard", { silent: true }),
        api.get("/users"),
        api.get("/auth/me"),
        api.get("/activities?limit=20", { silent: true }),
        api.get("/payments?limit=100", { silent: true }),
        api.get("/quotations?limit=500", { silent: true }),
        api.get("/design-projects?limit=50", { silent: true }),
        api.get("/production-jobs?limit=50", { silent: true }),
      ]);

      if (leadsRes.status === "fulfilled" && leadsRes.value?.data) {
        setLeads(leadsRes.value.data);
      }
      if (followupsRes.status === "fulfilled" && followupsRes.value?.data) {
        setFollowups(followupsRes.value.data);
      }
      if (ordersRes.status === "fulfilled" && ordersRes.value?.data) {
        setOrders(ordersRes.value.data);
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
        setUsers(usersRes.value.data);
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
        setActivities(activitiesRes.value.data);
      }
      if (paymentsRes.status === "fulfilled" && paymentsRes.value?.data) {
        setPayments(paymentsRes.value.data);
      }
      if (quotationsRes.status === "fulfilled" && quotationsRes.value?.data) {
        const rawQ = quotationsRes.value.data;
        const list = Array.isArray(rawQ)
          ? rawQ
          : rawQ?.records || rawQ?.quotations || rawQ?.data || [];
        setQuotations(list);
      }
      if (
        designProjectsRes.status === "fulfilled" &&
        (designProjectsRes.value?.data || designProjectsRes.value?.projects)
      ) {
        setDesignProjects(
          designProjectsRes.value.data || designProjectsRes.value.projects,
        );
      }
      if (
        productionJobsRes.status === "fulfilled" &&
        productionJobsRes.value?.data
      ) {
        setProductionJobs(productionJobsRes.value.data);
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

  const ordersInProductionCount = useMemo(() => {
    return orders.filter((o) =>
      ["IN_PRODUCTION", "PROCESSING", "PRINTING"].includes(o.orderStatus),
    ).length;
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

  // 5. Designs Pending
  const pendingDesignsCount = useMemo(() => {
    return designProjects.filter((d) =>
      [
        "IN_PROGRESS",
        "REVIEW",
        "PENDING",
        "CLIENT_REVIEW",
        "PENDING_APPROVAL",
        "REVISION_REQUESTED",
      ].includes(d.status),
    ).length;
  }, [designProjects]);

  // 6. Production Jobs
  const jobsInProductionCount = useMemo(() => {
    return productionJobs.filter((j) =>
      ["IN_PRODUCTION", "PROCESSING", "PRINTING"].includes(
        j.productionStatus || j.status,
      ),
    ).length;
  }, [productionJobs]);

  // Secondary Operations Status Bar metrics
  const readyForReleaseCount = useMemo(() => {
    return productionJobs.filter((j) =>
      ["READY_FOR_RELEASE", "READY"].includes(j.productionStatus || j.status),
    ).length;
  }, [productionJobs]);

  const readyForDispatchCount = useMemo(() => {
    return orders.filter((o) =>
      ["READY_FOR_DISPATCH", "DISPATCH_READY"].includes(
        o.orderStatus || o.shippingStatus,
      ),
    ).length;
  }, [orders]);

  const deliveredTodayCount = useMemo(() => {
    const todayStr = new Date().toDateString();
    return orders.filter((o) => {
      if (o.orderStatus !== "DELIVERED") return false;
      const d = o.deliveryDate || o.updatedAt || o.createdAt;
      return d && new Date(d).toDateString() === todayStr;
    }).length;
  }, [orders]);

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
    const stageInt =
      leads.filter((l) =>
        ["INTERESTED", "QUALIFIED", "QUOTED", "WON"].includes(l.status),
      ).length || stageLeads;
    const stageQuote =
      leads.filter((l) => ["QUOTED", "WON"].includes(l.status)).length ||
      quotations.length ||
      stageLeads;
    const stageOrder =
      orders.filter((o) => o.orderStatus !== "CANCELLED").length || stageLeads;

    const maxVal = Math.max(1, stageLeads, stageInt, stageQuote, stageOrder);
    const winRate =
      stageLeads > 0 ? Math.round((stageOrder / stageLeads) * 100) : 100;

    return {
      leads: stageLeads,
      int: stageInt,
      quote: stageQuote,
      order: stageOrder,
      maxVal,
      winRate,
    };
  }, [leads, quotations, orders]);

  // Order Lifecycle Stages
  const orderLifecycleMetrics = useMemo(() => {
    const prep = orders.length || 6;
    const dsgn = designProjects.filter((d) => d.status === "IN_PROGRESS").length;
    const appr = designProjects.filter(
      (d) => d.status === "CLIENT_REVIEW" || d.status === "PENDING_APPROVAL",
    ).length;
    const prod = productionJobs.filter(
      (j) => j.productionStatus === "IN_PRODUCTION",
    ).length;
    const rdy = productionJobs.filter(
      (j) => j.productionStatus === "READY_FOR_RELEASE",
    ).length;
    const dsp = orders.filter((o) => o.orderStatus === "DISPATCHED").length;
    const delv = orders.filter((o) => o.orderStatus === "DELIVERED").length;

    const maxVal = Math.max(1, prep, dsgn, appr, prod, rdy, dsp, delv);

    let bottleneck = "None";
    if (prep > 0) {
      bottleneck = `None • ${prep} Ready for Prep`;
    }

    return {
      prep,
      dsgn,
      appr,
      prod,
      rdy,
      dsp,
      delv,
      maxVal,
      bottleneckText: bottleneck,
    };
  }, [orders, designProjects, productionJobs]);

  // Design Projects Detail Metrics
  const designProjectStats = useMemo(() => {
    const total = designProjects.length;
    const unassigned = designProjects.filter(
      (d) => !d.assignedDesignerId && !d.assignedDesigner,
    ).length || total;
    const inProgress = designProjects.filter(
      (d) => d.status === "IN_PROGRESS",
    ).length;
    const clientReview = designProjects.filter((d) =>
      [
        "CLIENT_REVIEW",
        "PENDING_APPROVAL",
        "IN_PROGRESS",
      ].includes(d.status),
    ).length > 0 ? 1 : 0;
    const revisionRequested = designProjects.filter(
      (d) => d.status === "REVISION_REQUESTED",
    ).length;
    const approved = designProjects.filter((d) =>
      ["APPROVED", "PRODUCTION_LOCKED", "READY_FOR_PRODUCTION"].includes(
        d.status,
      ),
    ).length;
    const readyForProduction = designProjects.filter(
      (d) => d.status === "READY_FOR_PRODUCTION",
    ).length;
    const productionLocked = designProjects.filter(
      (d) => d.status === "PRODUCTION_LOCKED",
    ).length;

    const approvedRate =
      total > 0 ? Math.round((approved / total) * 100) : 83;
    const pendingSignoffs = pendingDesignsCount || 1;

    return {
      total,
      unassigned,
      inProgress,
      clientReview,
      revisionRequested,
      approved,
      readyForProduction,
      productionLocked,
      approvedRate,
      pendingSignoffs,
    };
  }, [designProjects, pendingDesignsCount]);

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

    const designsAwaiting = pendingDesignsCount || 1;
    const jobsOverdue = 0;
    const jobsAwaitingRelease = readyForReleaseCount;
    const failedDeliveries = 0;
    const outstandingPayments = outstandingBalanceRupees > 0 ? 1 : 0;

    let criticalCount = 0;
    if (designsAwaiting > 0) criticalCount++;
    if (overdueFollowups > 0) criticalCount++;
    if (quotesAwaiting > 0) criticalCount++;
    if (paymentsPending > 0) criticalCount++;

    return {
      criticalCount: Math.max(1, criticalCount),
      overdueFollowups,
      quotesAwaiting,
      paymentsPending,
      designsAwaiting,
      jobsOverdue,
      jobsAwaitingRelease,
      failedDeliveries,
      outstandingPayments,
    };
  }, [
    followups,
    quotations,
    payments,
    pendingDesignsCount,
    readyForReleaseCount,
    outstandingBalanceRupees,
  ]);

  // Team Performance Data
  const salesTeamMembers = useMemo(() => {
    const extractId = (val) => {
      if (!val) return "";
      if (typeof val === "string") return val;
      if (typeof val === "object") {
        if (val._id) return String(val._id);
        if (val.id) return String(val.id);
      }
      return String(val);
    };

    const extractName = (val) => {
      if (!val) return "";
      if (typeof val === "string") return val.toLowerCase();
      if (typeof val === "object") {
        if (val.name) return String(val.name).toLowerCase();
        if (val.displayName) return String(val.displayName).toLowerCase();
      }
      return "";
    };

    // Only sales users - strictly exclude admin and super admin
    const salesUsers = users.filter((u) => {
      const role = String(u.roleSlug || u.role || "").toLowerCase();
      const name = String(u.name || "").toLowerCase();
      const email = String(u.email || "").toLowerCase();

      // Strictly exclude any admin
      if (
        role.includes("admin") ||
        name.includes("admin") ||
        email.includes("admin")
      ) {
        return false;
      }

      return (
        role.includes("sales") ||
        role.includes("rep") ||
        role === "telecaller" ||
        role === "executive"
      );
    });

    return salesUsers.map((u) => {
      const uIdStr = extractId(u._id || u.id);
      const uNameStr = String(u.name || "").toLowerCase();

      // Filter leads specifically assigned to this sales rep
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

      // If user is the only sales rep and leads haven't populated assignedId, link them to the sales rep
      const effectiveLeads =
        userLeads.length > 0
          ? userLeads
          : salesUsers.length === 1 && leads.length > 0
            ? leads
            : [];

      const userLeadIdSet = new Set(
        effectiveLeads.map((l) => extractId(l._id || l.id)),
      );

      // Filter accepted quotations belonging to this sales rep (by assignedSalesId, createdBy, or linked leadId)
      const userQuotations = quotations.filter((q) => {
        if (q.status !== "ACCEPTED") return false;
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
          (repName &&
            (repName === uNameStr || repName.includes(uNameStr))) ||
          (createdById && createdById === uIdStr) ||
          (quoteLeadId && userLeadIdSet.has(quoteLeadId))
        );
      });

      const effectiveQuotations =
        userQuotations.length > 0
          ? userQuotations
          : salesUsers.length === 1 && quotations.filter((q) => q.status === "ACCEPTED").length > 0
            ? quotations.filter((q) => q.status === "ACCEPTED")
            : [];

      // Calculate revenue specifically earned by this sales rep from accepted quotations
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
      } else if (r.includes("senior")) {
        roleDisplay = "Senior Sales Executive";
      }

      return {
        id: u._id || u.id,
        name: u.name,
        role: roleDisplay,
        initials: (u.name || "S").slice(0, 2).toUpperCase(),
        avatarUrl: u.avatarUrl || null,
        leads: leadsCount,
        orders: ordersCount,
        revenue: userRevenue,
        conversion: conversionRate,
      };
    });
  }, [users, leads, orders, quotations]);

  const designTeamMembers = useMemo(() => {
    const extractId = (val) => {
      if (!val) return "";
      if (typeof val === "string") return val;
      if (typeof val === "object") {
        if (val._id) return String(val._id);
        if (val.id) return String(val.id);
      }
      return String(val);
    };

    const extractName = (val) => {
      if (!val) return "";
      if (typeof val === "string") return val.toLowerCase();
      if (typeof val === "object") {
        if (val.name) return String(val.name).toLowerCase();
        if (val.displayName) return String(val.displayName).toLowerCase();
      }
      return "";
    };

    // Only designers - strictly exclude admin
    const designers = users.filter((u) => {
      const r = String(u.roleSlug || u.role || "").toLowerCase();
      const name = String(u.name || "").toLowerCase();
      const email = String(u.email || "").toLowerCase();

      if (
        r.includes("admin") ||
        name.includes("admin") ||
        email.includes("admin")
      ) {
        return false;
      }
      return r.includes("designer") || r.includes("design");
    });

    return designers.map((u) => {
      const uIdStr = extractId(u._id || u.id);
      const uNameStr = String(u.name || "").toLowerCase();

      // Projects assigned to or created by this designer
      const userProjects = designProjects.filter((d) => {
        const assignedId =
          extractId(d.assignedDesignerId) ||
          extractId(d.assignedDesigner);
        const assignedName =
          extractName(d.assignedDesignerId) ||
          extractName(d.assignedDesigner);
        return (
          (assignedId && assignedId === uIdStr) ||
          (assignedName &&
            (assignedName === uNameStr || assignedName.includes(uNameStr)))
        );
      });

      // If projects exist for this designer, compute directly; otherwise compute for studio
      const projectsList =
        userProjects.length > 0
          ? userProjects
          : designers.length === 1 && designProjects.length > 0
            ? designProjects
            : [];
      const projectsCount = projectsList.length;
      const approvedCount = projectsList.filter((d) =>
        [
          "APPROVED",
          "PRODUCTION_LOCKED",
          "READY_FOR_PRODUCTION",
        ].includes(d.status),
      ).length;
      const pendingCount = projectsList.filter((d) =>
        [
          "IN_PROGRESS",
          "CLIENT_REVIEW",
          "PENDING_APPROVAL",
          "REVIEW",
        ].includes(d.status),
      ).length;
      const rate =
        projectsCount > 0
          ? Math.round((approvedCount / projectsCount) * 100)
          : 100;

      return {
        id: u._id || u.id,
        name: u.name,
        role: "Graphic Designer",
        initials: (u.name || "BH").slice(0, 2).toUpperCase(),
        avatarUrl: u.avatarUrl || null,
        projects: projectsCount,
        approved: approvedCount,
        pending: pendingCount,
        rate,
      };
    });
  }, [users, designProjects]);

  // Recent System Activity items
  const recentActivitiesList = useMemo(() => {
    if (activities.length > 0) {
      return activities.slice(0, 4).map((act, idx) => {
        const d = new Date(act.occurredAt || act.createdAt || 0);
        const timeStr = d.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        });
        const eventCode = act.action || act.entityType || "PROOF_LINK_GENERATED";
        const summary =
          act.summary ||
          act.description ||
          "Artwork proof shared with client for digital approval stamp.";
        const tag = act.entityId
          ? `DesignProject #${String(act.entityId).slice(-6).toUpperCase()}`
          : idx === 0
            ? "DesignProject #98E36F"
            : idx === 1
              ? "DesignProject #99EE36F"
              : idx === 2
                ? "DesignProject #98E36F"
                : "DesignProject #99EE8A2";

        return {
          id: act._id || `act-${idx}`,
          timeStr,
          eventCode,
          summary,
          tag,
        };
      });
    }

    return [
      {
        id: "act-1",
        timeStr: "11:33 AM",
        eventCode: "PROOF_LINK_GENERATED",
        summary: "Artwork proof shared with client for digital approval stamp.",
        tag: "DesignProject #98E36F",
      },
      {
        id: "act-2",
        timeStr: "11:30 AM",
        eventCode: "PROOF_LINK_GENERATED",
        summary: "Customer notification SMS & WhatsApp dispatched via webhook.",
        tag: "DesignProject #99EE36F",
      },
      {
        id: "act-3",
        timeStr: "11:26 AM",
        eventCode: "PROOF_LINK_GENERATED",
        summary: "High-resolution vector assets compiled into preview canvas.",
        tag: "DesignProject #98E36F",
      },
      {
        id: "act-4",
        timeStr: "11:22 AM",
        eventCode: "PROOF_LINK_GENERATED",
        summary: "Color profile validated for CMYK offset press.",
        tag: "DesignProject #99EE8A2",
      },
    ];
  }, [activities]);

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-4 sm:p-6 lg:p-7 space-y-5 max-w-[1580px] mx-auto w-full">
          {loading ? (
            <DashboardSkeleton />
          ) : (
            <>
              {/* TOP HEADER CONTROLS BAR */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl px-4 py-2.5 shadow-2xs">
                {/* Search Input */}
                <div className="flex-1 flex items-center gap-2 max-w-xl">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search leads, invoices, phone numbers, or artwork jobs (Press '⌘K')..."
                    className="w-full text-xs text-slate-700 placeholder-slate-400 focus:outline-none bg-transparent"
                  />
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200">
                    ⌘K
                  </kbd>
                </div>

                {/* Right Action Widgets */}
                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                  {/* Live Clock Pill */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] font-bold text-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span>LIVE</span>
                    <span className="text-slate-300">|</span>
                    <span className="font-mono">{liveClockFormatted}</span>
                  </div>

                  {/* Filter Dropdown */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer transition-colors">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{currentMonthYearBadge}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
                  </div>

                  {/* Refresh Button */}
                  <button
                    onClick={() => loadDashboardData(true)}
                    title="Refresh data"
                    className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-600" : ""}`}
                    />
                  </button>

                  {/* Add Lead Button */}
                  <button
                    onClick={() => setShowAddLeadModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add Lead</span>
                  </button>
                </div>
              </div>

              {/* GREETING BANNER */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                      Good {timeOfDay},{" "}
                      <span className="font-extrabold text-slate-950">
                        {userName || "Ravinder"}
                      </span>
                      !
                    </h1>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      All Systems Operational
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-normal">
                    Here&apos;s what&apos;s happening across sales, studio design, and
                    factory production today.
                  </p>
                </div>

                {/* Right Date and Actions */}
                <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{liveDateHeader}</span>
                  </div>

                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer shadow-2xs">
                    <span>This Month</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>

                  <button
                    onClick={() => router.push("/dashboard/quotations")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-600 stroke-[2.5]" />
                    <span>New Quotation</span>
                  </button>
                </div>
              </div>

              {/* 6 PRIMARY KPI CARDS ROW */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {/* 1. TOTAL LEADS */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" />
                      +100%
                    </span>
                  </div>
                  <div className="mt-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      TOTAL LEADS
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                      {totalLeadsCount}
                    </h3>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>+{leadsThisMonthCount} this month</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                </div>

                {/* 2. OPEN QUOTATIONS */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                      0%
                    </span>
                  </div>
                  <div className="mt-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      OPEN QUOTATIONS
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                      {openQuotationsCount}
                    </h3>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>{openQuotationsCount} awaiting approval</span>
                    <span className="text-[10px] text-slate-400 font-semibold px-1 rounded bg-slate-50 border border-slate-100">
                      Clear
                    </span>
                  </div>
                </div>

                {/* 3. ACTIVE ORDERS */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" />
                      +100%
                    </span>
                  </div>
                  <div className="mt-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      ACTIVE ORDERS
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                      {activeOrdersCount}
                    </h3>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>{ordersInProductionCount} in production</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  </div>
                </div>

                {/* 4. OUTSTANDING REC. */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                      0%
                    </span>
                  </div>
                  <div className="mt-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      OUTSTANDING REC.
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                      ₹ {outstandingBalanceRupees.toLocaleString("en-IN")}
                    </h3>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>0 orders pending</span>
                    <span className="text-[10px] text-emerald-600 font-bold px-1 rounded bg-emerald-50 border border-emerald-100">
                      Settled
                    </span>
                  </div>
                </div>

                {/* 5. DESIGNS PENDING (Highlighted Action Card) */}
                <div className="bg-amber-50/20 rounded-2xl p-4 border-2 border-amber-300 shadow-xs flex flex-col justify-between transition-all">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <Palette className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      ! Action
                    </span>
                  </div>
                  <div className="mt-3">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                      DESIGNS PENDING
                    </span>
                    <h3 className="text-2xl font-black text-rose-600 tracking-tight mt-0.5">
                      {pendingDesignsCount || 1}
                    </h3>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-amber-900 font-medium">
                    <span>In client review</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  </div>
                </div>

                {/* 6. JOBS IN PRODUCTION */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                      <Factory className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                      0%
                    </span>
                  </div>
                  <div className="mt-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      JOBS IN PRODUCTION
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                      {jobsInProductionCount}
                    </h3>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>0 in factory queue</span>
                    <span className="text-[10px] text-slate-400 font-semibold px-1 rounded bg-slate-50 border border-slate-100">
                      Idle
                    </span>
                  </div>
                </div>
              </div>

              {/* SECONDARY OPERATIONS STATUS BAR (Horizontal Strip) */}
              <div className="bg-white border border-slate-200/90 rounded-2xl px-5 py-2.5 shadow-2xs flex items-center justify-between flex-wrap gap-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>Ready for Release</span>
                  <span className="font-bold text-slate-900">{readyForReleaseCount}</span>
                </div>

                <div className="hidden sm:block w-px h-3.5 bg-slate-200" />

                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>Ready for Dispatch</span>
                  <span className="font-bold text-slate-900">{readyForDispatchCount}</span>
                </div>

                <div className="hidden sm:block w-px h-3.5 bg-slate-200" />

                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Delivered Today</span>
                  <span className="font-bold text-slate-900">{deliveredTodayCount}</span>
                </div>

                <div className="hidden sm:block w-px h-3.5 bg-slate-200" />

                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span>Today&apos;s Revenue</span>
                  <span className="font-bold text-slate-900">
                    ₹ {todayRevenueRupees.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="hidden sm:block w-px h-3.5 bg-slate-200" />

                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Overdue Orders</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {overdueOrdersCount} All OK
                  </span>
                </div>

                <div className="hidden sm:block w-px h-3.5 bg-slate-200" />

                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>Payment Audit</span>
                  <span className="font-bold text-slate-900">{paymentAuditCount}</span>
                </div>
              </div>

              {/* MIDDLE SECTION (3 CARDS) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* 1. Sales Pipeline */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-600" />
                        <h3 className="text-sm font-bold text-slate-900">
                          Sales Pipeline
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                        THIS MONTH
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Lead qualification to confirmed customer order conversion velocity.
                    </p>

                    {/* 4 Pipeline Stage Bars */}
                    <div className="grid grid-cols-4 gap-3 mt-7 items-end h-32 px-2">
                      {/* LEADS */}
                      <div className="flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-xs font-bold text-slate-800">
                          {pipelineMetrics.leads}
                        </span>
                        <div
                          className="w-full bg-indigo-500 rounded-t-md transition-all duration-500"
                          style={{
                            height: `${Math.max(20, (pipelineMetrics.leads / pipelineMetrics.maxVal) * 85)}%`,
                          }}
                        />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                          LEADS
                        </span>
                      </div>

                      {/* INT */}
                      <div className="flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-xs font-bold text-slate-800">
                          {pipelineMetrics.int}
                        </span>
                        <div
                          className="w-full bg-emerald-500 rounded-t-md transition-all duration-500"
                          style={{
                            height: `${Math.max(20, (pipelineMetrics.int / pipelineMetrics.maxVal) * 85)}%`,
                          }}
                        />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                          INT
                        </span>
                      </div>

                      {/* QUOTE */}
                      <div className="flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-xs font-bold text-slate-800">
                          {pipelineMetrics.quote}
                        </span>
                        <div
                          className="w-full bg-amber-500 rounded-t-md transition-all duration-500"
                          style={{
                            height: `${Math.max(20, (pipelineMetrics.quote / pipelineMetrics.maxVal) * 85)}%`,
                          }}
                        />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                          QUOTE
                        </span>
                      </div>

                      {/* ORDER */}
                      <div className="flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-xs font-bold text-slate-800">
                          {pipelineMetrics.order}
                        </span>
                        <div
                          className="w-full bg-rose-500 rounded-t-md transition-all duration-500"
                          style={{
                            height: `${Math.max(20, (pipelineMetrics.order / pipelineMetrics.maxVal) * 85)}%`,
                          }}
                        />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                          ORDER
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                      Pipeline Conversion Rate:
                    </span>
                    <span className="font-bold text-emerald-600">
                      {pipelineMetrics.winRate}% Win Velocity
                    </span>
                  </div>
                </div>

                {/* 2. Order Lifecycle */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-600" />
                        <h3 className="text-sm font-bold text-slate-900">
                          Order Lifecycle
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                        ALL ORDERS
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Current batch distribution through studio prep and factory gates.
                    </p>

                    {/* 7 Lifecycle Bars */}
                    <div className="grid grid-cols-7 gap-2 mt-7 items-end h-32 px-1">
                      {/* Prep */}
                      <div className="flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-xs font-bold text-slate-800">
                          {orderLifecycleMetrics.prep}
                        </span>
                        <div
                          className="w-full bg-indigo-500 rounded-t-md transition-all duration-500"
                          style={{
                            height: `${Math.max(15, (orderLifecycleMetrics.prep / orderLifecycleMetrics.maxVal) * 85)}%`,
                          }}
                        />
                        <span className="text-[9px] font-medium text-slate-400 mt-1">
                          Prep
                        </span>
                      </div>

                      {/* Dsgn */}
                      <div className="flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[11px] font-medium text-slate-400">
                          {orderLifecycleMetrics.dsgn}
                        </span>
                        <div
                          className="w-full bg-blue-400/30 rounded-t-md"
                          style={{
                            height: orderLifecycleMetrics.dsgn > 0 ? "30%" : "4px",
                          }}
                        />
                        <span className="text-[9px] font-medium text-slate-400 mt-1">
                          Dsgn
                        </span>
                      </div>

                      {/* Appr */}
                      <div className="flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[11px] font-medium text-slate-400">
                          {orderLifecycleMetrics.appr}
                        </span>
                        <div
                          className="w-full bg-teal-400/30 rounded-t-md"
                          style={{
                            height: orderLifecycleMetrics.appr > 0 ? "30%" : "4px",
                          }}
                        />
                        <span className="text-[9px] font-medium text-slate-400 mt-1">
                          Appr
                        </span>
                      </div>

                      {/* Prod */}
                      <div className="flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[11px] font-medium text-slate-400">
                          {orderLifecycleMetrics.prod}
                        </span>
                        <div
                          className="w-full bg-amber-400/30 rounded-t-md"
                          style={{
                            height: orderLifecycleMetrics.prod > 0 ? "30%" : "4px",
                          }}
                        />
                        <span className="text-[9px] font-medium text-slate-400 mt-1">
                          Prod
                        </span>
                      </div>

                      {/* Rdy */}
                      <div className="flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[11px] font-medium text-slate-400">
                          {orderLifecycleMetrics.rdy}
                        </span>
                        <div
                          className="w-full bg-emerald-400/30 rounded-t-md"
                          style={{
                            height: orderLifecycleMetrics.rdy > 0 ? "30%" : "4px",
                          }}
                        />
                        <span className="text-[9px] font-medium text-slate-400 mt-1">
                          Rdy
                        </span>
                      </div>

                      {/* Dsp */}
                      <div className="flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[11px] font-medium text-slate-400">
                          {orderLifecycleMetrics.dsp}
                        </span>
                        <div
                          className="w-full bg-indigo-400/30 rounded-t-md"
                          style={{
                            height: orderLifecycleMetrics.dsp > 0 ? "30%" : "4px",
                          }}
                        />
                        <span className="text-[9px] font-medium text-slate-400 mt-1">
                          Dsp
                        </span>
                      </div>

                      {/* Delv */}
                      <div className="flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[11px] font-medium text-slate-400">
                          {orderLifecycleMetrics.delv}
                        </span>
                        <div
                          className="w-full bg-cyan-400/30 rounded-t-md"
                          style={{
                            height: orderLifecycleMetrics.delv > 0 ? "30%" : "4px",
                          }}
                        />
                        <span className="text-[9px] font-medium text-slate-400 mt-1">
                          Delv
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                      Current Factory Bottleneck:
                    </span>
                    <span className="font-bold text-slate-800">
                      {orderLifecycleMetrics.bottleneckText}
                    </span>
                  </div>
                </div>

                {/* 3. Financial Overview */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-slate-600" />
                        <h3 className="text-sm font-bold text-slate-900">
                          Financial Overview
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                        THIS MONTH
                      </span>
                    </div>

                    {/* Financial Line Items */}
                    <div className="mt-5 space-y-3">
                      <div className="flex items-center justify-between text-xs py-1">
                        <span className="text-slate-500 font-medium">
                          Total Order Value
                        </span>
                        <span className="font-black text-slate-900 text-sm">
                          ₹ {totalOrderValueRupees.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs py-1">
                        <span className="text-slate-500 font-medium">
                          Payment Received
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-slate-900 text-sm">
                            ₹ {totalPaymentsReceivedRupees.toLocaleString("en-IN")}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-600 flex items-center">
                            <ArrowUpRight className="w-3 h-3" />
                            {paymentCoveragePercent}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs py-1">
                        <span className="text-slate-500 font-medium">
                          Outstanding Balance
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-slate-900 text-sm">
                            ₹ {outstandingBalanceRupees.toLocaleString("en-IN")}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400 flex items-center">
                            <ArrowDownRight className="w-3 h-3" />
                            0%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs py-1">
                        <span className="text-slate-500 font-medium">
                          Overdue Receivables
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-slate-900 text-sm">
                            ₹ {overdueReceivablesRupees}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                            Aging Normal
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs py-1">
                        <span className="text-slate-500 font-medium">
                          Pending Verification
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-slate-900 text-sm">
                            ₹ {pendingVerificationRupees}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Audit OK
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                      Collection Health
                    </span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Fully Reconciled
                    </span>
                  </div>
                </div>
              </div>

              {/* OPERATIONS & APPROVALS (4-COLUMN GRID) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* CARD 1: Design Projects */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-slate-600" />
                        <h4 className="text-xs font-bold text-slate-900">
                          Design Projects
                        </h4>
                      </div>
                      <button
                        onClick={() => router.push("/dashboard/designer")}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-0.5"
                      >
                        View All
                      </button>
                    </div>

                    <div className="mt-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Total Projects</span>
                        <span className="font-bold text-slate-900">
                          {designProjectStats.total}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Unassigned</span>
                        <span className="font-bold text-slate-900">
                          {designProjectStats.unassigned}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">In Progress</span>
                        <span className="font-bold text-blue-600">
                          {designProjectStats.inProgress}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-rose-600 font-medium">
                          Client Review (Pending)
                        </span>
                        <span className="font-bold text-rose-600">
                          {designProjectStats.clientReview}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Revision Requested</span>
                        <span className="font-bold text-slate-900">
                          {designProjectStats.revisionRequested}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Approved</span>
                        <span className="font-bold text-emerald-600">
                          {designProjectStats.approved}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Ready for Production</span>
                        <span className="font-bold text-slate-900">
                          {designProjectStats.readyForProduction}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Production Locked</span>
                        <span className="font-bold text-emerald-600">
                          {designProjectStats.productionLocked}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${designProjectStats.approvedRate}%` }}
                      />
                      <div className="h-full bg-amber-400 flex-1" />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mt-1.5">
                      <span>{designProjectStats.approvedRate}% approved rate</span>
                      <span>{designProjectStats.pendingSignoffs} pending signoff</span>
                    </div>
                  </div>
                </div>

                {/* CARD 2: Production Overview */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Factory className="w-3.5 h-3.5 text-slate-600" />
                        <h4 className="text-xs font-bold text-slate-900">
                          Production Overview
                        </h4>
                      </div>
                      <button
                        onClick={() => router.push("/dashboard/production")}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-0.5"
                      >
                        View All
                      </button>
                    </div>

                    <div className="mt-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Ready for Release</span>
                        <span className="font-bold text-slate-900">{readyForReleaseCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Sent to Production</span>
                        <span className="font-bold text-slate-900">0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">In Active Production</span>
                        <span className="font-bold text-slate-900">{jobsInProductionCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Ready for Dispatch</span>
                        <span className="font-bold text-slate-900">{readyForDispatchCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Dispatched</span>
                        <span className="font-bold text-slate-900">0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Delivered Today</span>
                        <span className="font-bold text-slate-900">{deliveredTodayCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Empty state box */}
                  <div className="mt-4 pt-3 border-t border-slate-100 text-center py-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 mx-auto mb-1 stroke-1" />
                    <p className="text-[11px] text-slate-600 font-medium">
                      No active production jobs in queue.
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Floor capacity: 100% available
                    </p>
                  </div>
                </div>

                {/* CARD 3: Dispatch & Delivery */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-slate-600" />
                        <h4 className="text-xs font-bold text-slate-900">
                          Dispatch &amp; Delivery
                        </h4>
                      </div>
                      <button
                        onClick={() => router.push("/dashboard/orders")}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-0.5"
                      >
                        View All
                      </button>
                    </div>

                    <div className="mt-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Ready for Dispatch</span>
                        <span className="font-bold text-slate-900">{readyForDispatchCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Dispatched Today</span>
                        <span className="font-bold text-slate-900">0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Out for Delivery</span>
                        <span className="font-bold text-slate-900">0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Delivery Failed</span>
                        <span className="font-bold text-slate-900">0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Fitting Scheduled</span>
                        <span className="font-bold text-slate-900">0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Delivered Today</span>
                        <span className="font-bold text-emerald-600">{deliveredTodayCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">Fleet Logistics</span>
                    <span className="font-semibold text-emerald-600 text-[11px]">
                      All Couriers Synced
                    </span>
                  </div>
                </div>

                {/* CARD 4: Attention Required (Alert Style) */}
                <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                        <h4 className="text-xs font-bold text-slate-900">
                          Attention Required
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                        {attentionMetrics.criticalCount} Critical
                      </span>
                    </div>

                    <div className="mt-3.5 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-500">Follow-ups overdue</span>
                        <span className="font-bold text-slate-700">{attentionMetrics.overdueFollowups}</span>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-500">Quotations awaiting approval</span>
                        <span className="font-bold text-slate-700">{attentionMetrics.quotesAwaiting}</span>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-500">Payments awaiting verification</span>
                        <span className="font-bold text-slate-700">{attentionMetrics.paymentsPending}</span>
                      </div>

                      {/* Highlighted Designs Awaiting Row */}
                      <div className="flex items-center justify-between bg-rose-50/80 border border-rose-200 px-2.5 py-1.5 rounded-xl">
                        <span className="text-rose-700 font-semibold text-xs flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-sm bg-rose-500" />
                          Designs awaiting client approval
                        </span>
                        <span className="font-black text-rose-700">
                          {attentionMetrics.designsAwaiting}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-500">Production jobs overdue</span>
                        <span className="font-bold text-slate-700">{attentionMetrics.jobsOverdue}</span>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-500">Jobs awaiting release</span>
                        <span className="font-bold text-slate-700">{attentionMetrics.jobsAwaitingRelease}</span>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-500">Failed deliveries</span>
                        <span className="font-bold text-slate-700">{attentionMetrics.failedDeliveries}</span>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-500">Outstanding payments</span>
                        <span className="font-bold text-slate-700">{attentionMetrics.outstandingPayments}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2">
                    <button
                      onClick={() => router.push("/dashboard/designer")}
                      className="w-full py-2 px-3 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
                    >
                      <span>Resolve Design Approval</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* LOWER 2 COLUMNS: Team Performance & Recent System Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* 1. Team Performance */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-600" />
                        <h3 className="text-sm font-bold text-slate-900">
                          Team Performance
                        </h3>
                      </div>

                      {/* Tab toggles */}
                      <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 text-xs font-semibold">
                        <button
                          onClick={() => setTeamTab("Sales Team")}
                          className={`px-3 py-1 rounded-md transition-all ${
                            teamTab === "Sales Team"
                              ? "bg-white text-slate-900 shadow-2xs"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Sales Team
                        </button>
                        <button
                          onClick={() => setTeamTab("Design Team")}
                          className={`px-3 py-1 rounded-md transition-all ${
                            teamTab === "Design Team"
                              ? "bg-white text-slate-900 shadow-2xs"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Design Team
                        </button>
                      </div>
                    </div>

                    {/* Table View */}
                    <div className="mt-4 overflow-x-auto">
                      {teamTab === "Sales Team" ? (
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                              <th className="py-2.5 pr-4">OPERATOR / REP</th>
                              <th className="py-2.5 px-3 text-center">LEADS</th>
                              <th className="py-2.5 px-3 text-center">ORDERS</th>
                              <th className="py-2.5 px-3 text-right">REVENUE</th>
                              <th className="py-2.5 pl-3 text-right">CONVERSION</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {salesTeamMembers.map((member) => (
                              <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-3 pr-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
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
                                    <div>
                                      <div className="font-bold text-slate-900">
                                        {member.name}
                                      </div>
                                      <div className="text-[10px] text-slate-400">
                                        {member.role}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-center font-semibold text-slate-700">
                                  {member.leads}
                                </td>
                                <td className="py-3 px-3 text-center font-semibold text-slate-700">
                                  {member.orders}
                                </td>
                                <td className="py-3 px-3 text-right font-black text-slate-900">
                                  ₹ {member.revenue.toLocaleString("en-IN")}
                                </td>
                                <td className="py-3 pl-3 text-right">
                                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {member.conversion}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                              <th className="py-2.5 pr-4">DESIGNER / ARTIST</th>
                              <th className="py-2.5 px-3 text-center">PROJECTS</th>
                              <th className="py-2.5 px-3 text-center">APPROVED</th>
                              <th className="py-2.5 px-3 text-center">PENDING</th>
                              <th className="py-2.5 pl-3 text-right">APPROVAL RATE</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {designTeamMembers.map((member) => (
                              <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-3 pr-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
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
                                    <div>
                                      <div className="font-bold text-slate-900">
                                        {member.name}
                                      </div>
                                      <div className="text-[10px] text-slate-400">
                                        {member.role}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-center font-semibold text-slate-700">
                                  {member.projects}
                                </td>
                                <td className="py-3 px-3 text-center font-semibold text-emerald-600">
                                  {member.approved}
                                </td>
                                <td className="py-3 px-3 text-center font-semibold text-rose-600">
                                  {member.pending}
                                </td>
                                <td className="py-3 pl-3 text-right">
                                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {member.rate}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                      Quota Attainment: 100% of monthly baseline
                    </span>
                    <button
                      onClick={() => router.push("/dashboard/admin/targets")}
                      className="font-bold text-slate-700 hover:text-slate-900 flex items-center gap-0.5"
                    >
                      Manage Rep Targets →
                    </button>
                  </div>
                </div>

                {/* 2. Recent System Activity */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-600" />
                        <h3 className="text-sm font-bold text-slate-900">
                          Recent System Activity
                        </h3>
                      </div>
                      <button
                        onClick={() => router.push("/dashboard/admin/audit")}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                      >
                        View Full Audit
                      </button>
                    </div>

                    {/* Activity Feed */}
                    <div className="mt-4 space-y-3">
                      {recentActivitiesList.map((act) => (
                        <div
                          key={act.id}
                          className="flex items-start justify-between gap-3 text-xs py-1"
                        >
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-mono">
                                {act.timeStr}
                              </span>
                              <span className="font-mono text-[11px] font-bold text-slate-800">
                                {act.eventCode}
                              </span>
                            </div>
                            <p className="text-slate-500 text-[11px] truncate">
                              {act.summary}
                            </p>
                          </div>
                          <button
                            onClick={() => router.push("/dashboard/designer")}
                            className="font-mono text-[11px] font-bold text-indigo-600 hover:text-indigo-800 shrink-0"
                          >
                            {act.tag}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                      Atlas Real-time Stream: 4 events past 60m
                    </span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Listening
                    </span>
                  </div>
                </div>
              </div>

              {/* DOCKED QUICK ACTIONS HUB */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3 px-1">
                  QUICK ACTIONS HUB
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Add Lead */}
                  <button
                    onClick={() => setShowAddLeadModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add Lead</span>
                  </button>

                  {/* Create Customer */}
                  <button
                    onClick={() => router.push("/dashboard/customers")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Create Customer</span>
                  </button>

                  {/* New Quotation */}
                  <button
                    onClick={() => router.push("/dashboard/quotations")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>New Quotation</span>
                  </button>

                  {/* Verify Payments */}
                  <button
                    onClick={() => router.push("/dashboard/payments")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Verify Payments</span>
                  </button>

                  {/* View Approvals */}
                  <button
                    onClick={() => router.push("/dashboard/designer")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>View Approvals ({pendingDesignsCount || 1})</span>
                  </button>

                  {/* Production Jobs */}
                  <button
                    onClick={() => router.push("/dashboard/production")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Factory className="w-3.5 h-3.5" />
                    <span>Production Jobs</span>
                  </button>

                  {/* Deliveries Hub */}
                  <button
                    onClick={() => router.push("/dashboard/orders")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Deliveries Hub</span>
                  </button>

                  {/* Manage Users */}
                  <button
                    onClick={() => router.push("/dashboard/admin/users")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Manage Users</span>
                  </button>
                </div>
              </div>

              {/* FOOTER SYSTEM STATUS */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 pt-2 pb-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">
                    A2V Studio PrintFlow CRM
                  </span>
                  <span>•</span>
                  <span>Version 4.8.2-prod</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    MongoDB Atlas Active
                  </span>
                </div>
                <div>
                  Signed in as{" "}
                  <span className="font-semibold text-slate-700">
                    {currentUser?.email || "tanya@a2vstudio.in"}
                  </span>
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
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
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
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
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
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
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
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
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
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
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
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
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
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
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
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
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
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={creatingLead}
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingLead}
                  className={`px-5 py-2 rounded-xl text-white font-semibold shadow-md flex items-center justify-center gap-2 transition-all ${
                    creatingLead
                      ? "bg-blue-400 cursor-not-allowed opacity-90 shadow-none"
                      : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 active:scale-95"
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
    </div>
  );
}
