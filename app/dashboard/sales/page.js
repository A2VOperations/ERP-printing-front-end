"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import {
  Users,
  Clock,
  FileText,
  ShoppingBag,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Palette,
  Eye,
  MoreVertical,
  Plus,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  PhoneCall,
  User,
  Zap,
  ExternalLink,
  Inbox,
  Minus,
  Check,
  Trophy,
  Award,
} from "lucide-react";

/**
 * Calculates start and end Date objects for current and previous periods based on timeframe
 */
function getPeriodDates(timeframe) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (timeframe === "This Quarter") {
    const quarterIndex = Math.floor(month / 3);
    const startCurrent = new Date(year, quarterIndex * 3, 1, 0, 0, 0, 0);
    const endCurrent = new Date(year, quarterIndex * 3 + 3, 0, 23, 59, 59, 999);

    const prevQuarterYear = quarterIndex === 0 ? year - 1 : year;
    const prevQuarterIndex = quarterIndex === 0 ? 3 : quarterIndex - 1;
    const startPrev = new Date(
      prevQuarterYear,
      prevQuarterIndex * 3,
      1,
      0,
      0,
      0,
      0,
    );
    const endPrev = new Date(
      prevQuarterYear,
      prevQuarterIndex * 3 + 3,
      0,
      23,
      59,
      59,
      999,
    );

    return {
      startCurrent,
      endCurrent,
      startPrev,
      endPrev,
      periodLabel: "last quarter",
    };
  }

  if (timeframe === "This Year") {
    const startCurrent = new Date(year, 0, 1, 0, 0, 0, 0);
    const endCurrent = new Date(year, 11, 31, 23, 59, 59, 999);

    const startPrev = new Date(year - 1, 0, 1, 0, 0, 0, 0);
    const endPrev = new Date(year - 1, 11, 31, 23, 59, 59, 999);

    return {
      startCurrent,
      endCurrent,
      startPrev,
      endPrev,
      periodLabel: "last year",
    };
  }

  // Default: 'This Month'
  const startCurrent = new Date(year, month, 1, 0, 0, 0, 0);
  const endCurrent = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const prevMonthYear = month === 0 ? year - 1 : year;
  const prevMonth = month === 0 ? 11 : month - 1;
  const startPrev = new Date(prevMonthYear, prevMonth, 1, 0, 0, 0, 0);
  const endPrev = new Date(prevMonthYear, prevMonth + 1, 0, 23, 59, 59, 999);

  return {
    startCurrent,
    endCurrent,
    startPrev,
    endPrev,
    periodLabel: "last month",
  };
}

/**
 * Calculates trend delta between current and previous counts/amounts
 */
function calculateTrend(current, previous, periodLabel) {
  if (previous === 0) {
    if (current > 0)
      return {
        text: `+${current} new vs ${periodLabel}`,
        isUp: true,
        neutral: false,
      };
    return { text: `0 vs ${periodLabel}`, isUp: false, neutral: true };
  }
  const diff = current - previous;
  const pct = Math.round((diff / previous) * 100);
  if (pct > 0)
    return { text: `▲ ${pct}% vs ${periodLabel}`, isUp: true, neutral: false };
  if (pct < 0)
    return {
      text: `▼ ${Math.abs(pct)}% vs ${periodLabel}`,
      isUp: false,
      neutral: false,
    };
  return { text: `0% vs ${periodLabel}`, isUp: false, neutral: true };
}

/**
 * Format relative date/time for activity log
 */
function formatActivityTime(timestamp) {
  if (!timestamp) return "Recently";
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return "Recently";

  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  const timeStr = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) return `Today, ${timeStr}`;
  if (isYesterday) return `Yesterday, ${timeStr}`;
  return `${d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}, ${timeStr}`;
}

export default function SalesDashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [timeframe, setTimeframe] = useState("This Month");
  const [loading, setLoading] = useState(true);

  // Live Backend Data States
  const [leads, setLeads] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [designProjects, setDesignProjects] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [targetProgress, setTargetProgress] = useState(null);
  const [topPerformers, setTopPerformers] = useState([]);

  // Compute greeting according to hour of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const loadSalesData = useCallback(async () => {
    try {
      setLoading(true);

      // Authenticated User Identity
      let activeName = "";
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed?.name) activeName = parsed.name;
        }
      } catch (e) {}

      if (!activeName) {
        const storedName = localStorage.getItem("userName");
        if (storedName) activeName = storedName;
      }

      try {
        const meRes = await api.get("/auth/me");
        if (meRes && meRes.data) {
          const fetchedName = meRes.data.name || meRes.data.user?.name;
          if (fetchedName) activeName = fetchedName;
        }
      } catch (err) {
        // Fallback to local storage name if offline
      }

      if (activeName) {
        setUserName(activeName.split(" ")[0] || activeName);
      } else {
        setUserName("Sales Executive");
      }

      // Compute timeframe date ranges for target query
      const { startCurrent, endCurrent } = getPeriodDates(timeframe);
      const startIso = startCurrent.toISOString();
      const endIso = endCurrent.toISOString();
      const tfParam =
        timeframe === "This Quarter"
          ? "quarter"
          : timeframe === "This Year"
            ? "all"
            : "month";

      const [
        leadsRes,
        flwRes,
        quoteRes,
        ordersRes,
        payRes,
        designRes,
        targetRes,
        approvalsRes,
        leaderRes,
      ] = await Promise.allSettled([
        api.get("/leads?limit=200"),
        api.get("/followups?limit=200"),
        api.get("/quotations?limit=200"),
        api.get("/orders?limit=200"),
        api.get("/payments?limit=200"),
        api.get("/design-projects?limit=200"),
        api.get(
          `/targets/my-achievement?periodStart=${encodeURIComponent(startIso)}&periodEnd=${encodeURIComponent(endIso)}`,
        ),
        api.get("/discount-approvals?status=PENDING&limit=50"),
        api.get(`/targets/leaderboard?timeframe=${tfParam}`),
      ]);

      if (leadsRes.status === "fulfilled" && leadsRes.value?.data) {
        setLeads(
          Array.isArray(leadsRes.value.data)
            ? leadsRes.value.data
            : leadsRes.value.data.leads || [],
        );
      }
      if (flwRes.status === "fulfilled" && flwRes.value?.data) {
        setFollowups(
          Array.isArray(flwRes.value.data)
            ? flwRes.value.data
            : flwRes.value.data.followups || [],
        );
      }
      if (quoteRes.status === "fulfilled" && quoteRes.value?.data) {
        setQuotations(
          Array.isArray(quoteRes.value.data)
            ? quoteRes.value.data
            : quoteRes.value.data.items || [],
        );
      }
      if (ordersRes.status === "fulfilled" && ordersRes.value?.data) {
        setOrders(
          Array.isArray(ordersRes.value.data)
            ? ordersRes.value.data
            : ordersRes.value.data.items || [],
        );
      }
      if (payRes.status === "fulfilled" && payRes.value?.data) {
        const rawPay = Array.isArray(payRes.value.data)
          ? payRes.value.data
          : payRes.value.data?.records || payRes.value.data?.items || [];
        setPayments(rawPay);
      }
      if (designRes.status === "fulfilled" && designRes.value?.data) {
        const rawProj = Array.isArray(designRes.value.data)
          ? designRes.value.data
          : designRes.value.data?.projects || [];
        setDesignProjects(rawProj);
      }
      if (targetRes.status === "fulfilled" && targetRes.value?.data) {
        setTargetProgress(targetRes.value.data);
      }
      if (approvalsRes.status === "fulfilled" && approvalsRes.value?.data) {
        const rawApprovals = Array.isArray(approvalsRes.value.data)
          ? approvalsRes.value.data
          : approvalsRes.value.data?.items || [];
        setPendingApprovals(rawApprovals);
      }
      if (leaderRes.status === "fulfilled" && leaderRes.value?.data) {
        const rawLeader = leaderRes.value.data;
        const list = Array.isArray(rawLeader)
          ? rawLeader
          : rawLeader?.rankings || [];
        const nonAdmin = list.filter((p) => {
          const u = p.user || p;
          const role = String(u.role || p.role || "").toLowerCase();
          const name = String(
            u.name || p.userName || p.name || "",
          ).toLowerCase();
          const email = String(u.email || p.email || "").toLowerCase();
          return (
            !role.includes("admin") &&
            !name.includes("admin") &&
            !email.includes("admin")
          );
        });
        setTopPerformers(nonAdmin);
      }
    } catch (err) {
      console.error("Failed to load live sales dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    loadSalesData();
  }, [loadSalesData]);

  // Timeframe date bounds
  const { startCurrent, endCurrent, startPrev, endPrev, periodLabel } = useMemo(
    () => getPeriodDates(timeframe),
    [timeframe],
  );

  // Filtered dataset slices according to active timeframe
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const d = new Date(l.createdAt || l.date);
      return d >= startCurrent && d <= endCurrent;
    });
  }, [leads, startCurrent, endCurrent]);

  const prevLeads = useMemo(() => {
    return leads.filter((l) => {
      const d = new Date(l.createdAt || l.date);
      return d >= startPrev && d <= endPrev;
    });
  }, [leads, startPrev, endPrev]);

  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const d = new Date(q.createdAt);
      return d >= startCurrent && d <= endCurrent;
    });
  }, [quotations, startCurrent, endCurrent]);

  const prevQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const d = new Date(q.createdAt);
      return d >= startPrev && d <= endPrev;
    });
  }, [quotations, startPrev, endPrev]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const d = new Date(o.orderDate || o.createdAt);
      return d >= startCurrent && d <= endCurrent;
    });
  }, [orders, startCurrent, endCurrent]);

  const prevOrders = useMemo(() => {
    return orders.filter((o) => {
      const d = new Date(o.orderDate || o.createdAt);
      return d >= startPrev && d <= endPrev;
    });
  }, [orders, startPrev, endPrev]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const d = new Date(p.paymentDate || p.createdAt);
      return d >= startCurrent && d <= endCurrent;
    });
  }, [payments, startCurrent, endCurrent]);

  const prevPayments = useMemo(() => {
    return payments.filter((p) => {
      const d = new Date(p.paymentDate || p.createdAt);
      return d >= startPrev && d <= endPrev;
    });
  }, [payments, startPrev, endPrev]);

  // Aggregate metric calculations (Strictly 100% Real Live Values, No Hardcoded Fallbacks)
  const activeLeadsCount = useMemo(() => {
    return leads.filter(
      (l) => !["WON", "LOST", "REJECTED", "CANCELLED"].includes(l.status),
    ).length;
  }, [leads]);

  const activeLeadsTrend = useMemo(() => {
    return calculateTrend(filteredLeads.length, prevLeads.length, periodLabel);
  }, [filteredLeads, prevLeads, periodLabel]);

  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );
  const todayEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );

  const followupsTodayCount = useMemo(() => {
    return followups.filter((f) => {
      if (
        !f.scheduledAt ||
        f.status === "COMPLETED" ||
        f.status === "CANCELLED"
      )
        return false;
      const d = new Date(f.scheduledAt);
      return d >= todayStart && d <= todayEnd;
    }).length;
  }, [followups, todayStart, todayEnd]);

  const overdueFollowupsCount = useMemo(() => {
    return followups.filter((f) => {
      if (
        !f.scheduledAt ||
        f.status === "COMPLETED" ||
        f.status === "CANCELLED"
      )
        return false;
      const d = new Date(f.scheduledAt);
      return d < now;
    }).length;
  }, [followups, now]);

  const highPriorityFollowupsCount = useMemo(() => {
    return followups.filter(
      (f) =>
        ["HIGH", "URGENT"].includes(f.priority) &&
        f.status !== "COMPLETED" &&
        f.status !== "CANCELLED",
    ).length;
  }, [followups]);

  const pendingApprovalsCount = pendingApprovals.length;

  const quotationsCount = filteredQuotations.length;
  const quotationsTrend = useMemo(() => {
    return calculateTrend(
      filteredQuotations.length,
      prevQuotations.length,
      periodLabel,
    );
  }, [filteredQuotations, prevQuotations, periodLabel]);

  const confirmedOrders = useMemo(() => {
    return filteredOrders.filter((o) =>
      [
        "CONFIRMED",
        "AWAITING_ADVANCE",
        "IN_PRODUCTION",
        "COMPLETED",
        "DELIVERED",
      ].includes(o.orderStatus),
    );
  }, [filteredOrders]);

  const prevConfirmedOrders = useMemo(() => {
    return prevOrders.filter((o) =>
      [
        "CONFIRMED",
        "AWAITING_ADVANCE",
        "IN_PRODUCTION",
        "COMPLETED",
        "DELIVERED",
      ].includes(o.orderStatus),
    );
  }, [prevOrders]);

  const ordersConfirmedCount = confirmedOrders.length;
  const ordersTrend = useMemo(() => {
    return calculateTrend(
      confirmedOrders.length,
      prevConfirmedOrders.length,
      periodLabel,
    );
  }, [confirmedOrders, prevConfirmedOrders, periodLabel]);

  const totalPaymentsCollectedPaise = useMemo(() => {
    return filteredPayments.reduce(
      (sum, p) =>
        sum + (p.amountPaise || (p.amount ? Math.round(p.amount * 100) : 0)),
      0,
    );
  }, [filteredPayments]);

  const prevPaymentsCollectedPaise = useMemo(() => {
    return prevPayments.reduce(
      (sum, p) =>
        sum + (p.amountPaise || (p.amount ? Math.round(p.amount * 100) : 0)),
      0,
    );
  }, [prevPayments]);

  const paymentsTrend = useMemo(() => {
    return calculateTrend(
      totalPaymentsCollectedPaise,
      prevPaymentsCollectedPaise,
      periodLabel,
    );
  }, [totalPaymentsCollectedPaise, prevPaymentsCollectedPaise, periodLabel]);

  // Real Pipeline calculations
  const pipeline = useMemo(() => {
    // If filtered leads is empty, use all available active leads to ensure real pipeline reflection
    const dataset = filteredLeads.length > 0 ? filteredLeads : leads;
    const total = dataset.length;
    const newL = dataset.filter((l) => l.status === "NEW").length;
    const contacted = dataset.filter((l) =>
      [
        "CONTACTED",
        "INTERESTED",
        "QUOTATION_SENT",
        "NEGOTIATION",
        "WON",
      ].includes(l.status),
    ).length;
    const interested = dataset.filter((l) =>
      ["INTERESTED", "QUOTATION_SENT", "NEGOTIATION", "WON"].includes(l.status),
    ).length;
    const quotation = dataset.filter((l) =>
      ["QUOTATION_SENT", "NEGOTIATION", "WON"].includes(l.status),
    ).length;
    const won = dataset.filter((l) => l.status === "WON").length;

    const calcPct = (count) =>
      total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";

    return {
      new: newL,
      newPct: calcPct(newL),
      contacted,
      contactedPct: calcPct(contacted),
      interested,
      interestedPct: calcPct(interested),
      quotation,
      quotationPct: calcPct(quotation),
      won,
      wonPct: calcPct(won),
      total,
      convRate: total > 0 ? ((won / total) * 100).toFixed(1) : "0.0",
    };
  }, [filteredLeads, leads]);

  // Real Target progress calculation
  const totalSalesFromOrdersRupees = useMemo(() => {
    return (
      confirmedOrders.reduce(
        (sum, o) =>
          sum +
          (o.grandTotalPaise ||
            (o.grandTotal ? Math.round(o.grandTotal * 100) : 0)),
        0,
      ) / 100
    );
  }, [confirmedOrders]);

  const targetRupees = useMemo(() => {
    if (targetProgress?.targetPaise) return targetProgress.targetPaise / 100;
    if (targetProgress?.targetAmountPaise)
      return targetProgress.targetAmountPaise / 100;
    if (targetProgress?.target) return targetProgress.target;
    return 0;
  }, [targetProgress]);

  const achievedRupees = useMemo(() => {
    if (
      targetProgress?.achievedPaise !== undefined &&
      targetProgress?.achievedPaise !== null
    ) {
      return targetProgress.achievedPaise / 100;
    }
    if (
      targetProgress?.achieved !== undefined &&
      targetProgress?.achieved !== null
    ) {
      return targetProgress.achieved;
    }
    return totalSalesFromOrdersRupees;
  }, [targetProgress, totalSalesFromOrdersRupees]);

  const targetPercent = useMemo(() => {
    if (targetRupees > 0) {
      return Math.min(100, Math.round((achievedRupees / targetRupees) * 100));
    }
    return achievedRupees > 0 ? 100 : 0;
  }, [targetRupees, achievedRupees]);

  // Real Design status counts
  const designStatusCounts = useMemo(() => {
    return {
      inDesign: designProjects.filter((d) =>
        ["ASSIGNED", "IN_DESIGN"].includes(d.status),
      ).length,
      clientReview: designProjects.filter((d) =>
        ["CLIENT_REVIEW", "IN_REVIEW"].includes(d.status),
      ).length,
      revision: designProjects.filter((d) =>
        ["REVISION_REQUESTED", "REVISION"].includes(d.status),
      ).length,
      approved: designProjects.filter((d) => d.status === "APPROVED").length,
      productionReady: designProjects.filter(
        (d) =>
          ["LOCKED", "PRODUCTION_READY", "PRODUCTION_LOCKED"].includes(
            d.status,
          ) || d.productionLocked,
      ).length,
    };
  }, [designProjects]);

  // Live unified chronological Activity Stream synthesized from real entities
  const activities = useMemo(() => {
    const list = [];

    // Follow-ups
    followups.forEach((f) => {
      const date = f.updatedAt || f.scheduledAt || f.createdAt;
      const statusText =
        f.status === "COMPLETED"
          ? "Follow-up Completed"
          : "Follow-up Scheduled";
      list.push({
        id: `flw-${f._id}`,
        timestamp: new Date(date).getTime(),
        type: "FOLLOW_UP",
        badge: "FOLLOW-UP",
        badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
        icon: Clock,
        iconBg: "bg-amber-50 text-amber-600",
        title: statusText,
        description: f.title || f.description || `Follow-up with client`,
        link: "/dashboard/followups",
      });
    });

    // Leads
    leads.forEach((l) => {
      const date = l.createdAt;
      list.push({
        id: `lead-${l._id}`,
        timestamp: new Date(date).getTime(),
        type: "LEAD",
        badge: "LEAD",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
        icon: Users,
        iconBg: "bg-blue-50 text-blue-600",
        title: `Lead Added (${l.status || "NEW"})`,
        description: `${l.contactName || "Lead"} ${l.businessName ? `• ${l.businessName}` : ""}`,
        link: `/dashboard/leads/${l._id}`,
      });
    });

    // Quotations
    quotations.forEach((q) => {
      const date = q.createdAt;
      const clientName =
        q.customerSnapshot?.companyName ||
        q.customerSnapshot?.displayName ||
        q.customerSnapshot?.contactPerson ||
        "Client";
      list.push({
        id: `quote-${q._id}`,
        timestamp: new Date(date).getTime(),
        type: "QUOTATION",
        badge: "QUOTATION",
        badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
        icon: FileText,
        iconBg: "bg-purple-50 text-purple-600",
        title: `Quotation ${q.quotationNumber || "Created"}`,
        description: `Quotation for ${clientName} • ₹${((q.grandTotalPaise || 0) / 100 || 0).toLocaleString("en-IN")}`,
        link: "/dashboard/quotations",
      });
    });

    // Orders
    orders.forEach((o) => {
      const date = o.orderDate || o.createdAt;
      const clientName =
        o.customerSnapshot?.companyName ||
        o.customerSnapshot?.displayName ||
        o.customerSnapshot?.contactPerson ||
        "Customer";
      list.push({
        id: `order-${o._id}`,
        timestamp: new Date(date).getTime(),
        type: "ORDER",
        badge: "ORDER",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: ShoppingBag,
        iconBg: "bg-emerald-50 text-emerald-600",
        title: `Order ${o.orderNumber || "Confirmed"}`,
        description: `Order confirmed for ${clientName} (${o.orderStatus || "CONFIRMED"})`,
        link: "/dashboard/orders",
      });
    });

    // Payments
    payments.forEach((p) => {
      const date = p.paymentDate || p.createdAt;
      list.push({
        id: `pay-${p._id}`,
        timestamp: new Date(date).getTime(),
        type: "PAYMENT",
        badge: "PAYMENT",
        badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
        icon: CreditCard,
        iconBg: "bg-teal-50 text-teal-600",
        title: `Payment Recorded`,
        description: `Received ₹${(p.amountPaise ? p.amountPaise / 100 : p.amount || 0).toLocaleString("en-IN")} via ${p.paymentMethod || "Online"}`,
        link: "/dashboard/payments",
      });
    });

    // Sort by timestamp desc and slice top 4 activities
    return list.sort((a, b) => b.timestamp - a.timestamp).slice(0, 4);
  }, [followups, leads, quotations, orders, payments]);

  // Recent 5 leads sorted by creation date
  const recentLeads = useMemo(() => {
    return [...leads]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [leads]);

  // Recent 5 quotations sorted by creation date
  const recentQuotations = useMemo(() => {
    return [...quotations]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [quotations]);

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-5 md:p-7 space-y-5 max-w-[1600px] mx-auto w-full">
          {/* Top Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                {greeting}, {userName || "Sales Executive"}! 👋
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Here&apos;s what&apos;s happening with your sales performance in{" "}
                {timeframe.toLowerCase()}.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={loadSalesData}
                disabled={loading}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200/90 text-slate-700 flex items-center justify-center shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
                title="Refresh Live Data"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : "text-slate-500"}`}
                />
              </button>

              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-slate-700 text-xs font-semibold shadow-xs focus:outline-none cursor-pointer"
              >
                <option value="This Month">This Month</option>
                <option value="This Quarter">This Quarter</option>
                <option value="This Year">This Year</option>
              </select>

              <Link
                href="/dashboard/leads"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-600/25 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />+ Add Lead
              </Link>
            </div>
          </div>

          {/* ROW 1: 5 Top Sparkline KPI Cards with Live Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* 1. My Active Leads */}
            <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    My Active Leads
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {loading ? "..." : activeLeadsCount}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold ${
                    activeLeadsTrend.isUp
                      ? "text-emerald-600"
                      : activeLeadsTrend.neutral
                        ? "text-slate-400"
                        : "text-rose-600"
                  }`}
                >
                  {activeLeadsTrend.text}
                </span>
                <svg
                  className="w-20 h-5 text-blue-500 stroke-current fill-none stroke-2"
                  viewBox="0 0 100 25"
                >
                  <path d="M0 20 Q 25 5, 50 15 T 100 5" />
                </svg>
              </div>
            </div>

            {/* 2. Follow-ups Due */}
            <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Follow-ups Due Today
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {loading ? "..." : followupsTodayCount}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-600">
                  {overdueFollowupsCount > 0
                    ? `${overdueFollowupsCount} overdue`
                    : `${highPriorityFollowupsCount} high priority`}
                </span>
                <svg
                  className="w-20 h-5 text-amber-500 stroke-current fill-none stroke-2"
                  viewBox="0 0 100 25"
                >
                  <path d="M0 10 Q 25 22, 50 12 T 100 20" />
                </svg>
              </div>
            </div>

            {/* 3. Quotations */}
            <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Quotations Generated
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {loading ? "..." : quotationsCount}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold ${
                    quotationsTrend.isUp
                      ? "text-emerald-600"
                      : quotationsTrend.neutral
                        ? "text-slate-400"
                        : "text-rose-600"
                  }`}
                >
                  {quotationsTrend.text}
                </span>
                <svg
                  className="w-20 h-5 text-purple-500 stroke-current fill-none stroke-2"
                  viewBox="0 0 100 25"
                >
                  <path d="M0 22 Q 25 10, 50 18 T 100 6" />
                </svg>
              </div>
            </div>

            {/* 4. Orders Confirmed */}
            <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Orders Confirmed
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {loading ? "..." : ordersConfirmedCount}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold ${
                    ordersTrend.isUp
                      ? "text-emerald-600"
                      : ordersTrend.neutral
                        ? "text-slate-400"
                        : "text-rose-600"
                  }`}
                >
                  {ordersTrend.text}
                </span>
                <svg
                  className="w-20 h-5 text-emerald-500 stroke-current fill-none stroke-2"
                  viewBox="0 0 100 25"
                >
                  <path d="M0 20 Q 25 8, 50 14 T 100 5" />
                </svg>
              </div>
            </div>

            {/* 5. Payments Recorded */}
            <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Payments Collected
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {loading
                      ? "..."
                      : `₹${Math.round(totalPaymentsCollectedPaise / 100).toLocaleString("en-IN")}`}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold ${
                    paymentsTrend.isUp
                      ? "text-emerald-600"
                      : paymentsTrend.neutral
                        ? "text-slate-400"
                        : "text-rose-600"
                  }`}
                >
                  {paymentsTrend.text}
                </span>
                <svg
                  className="w-20 h-5 text-rose-500 stroke-current fill-none stroke-2"
                  viewBox="0 0 100 25"
                >
                  <path d="M0 18 Q 25 6, 50 16 T 100 8" />
                </svg>
              </div>
            </div>
          </div>

          {/* ROW 2: My Sales Pipeline | Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* 1. My Sales Pipeline (6 Cols) */}
            <div className="lg:col-span-6 bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
              <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-xs">
                  My Sales Pipeline
                </h3>
                <span className="text-[10px] font-semibold text-slate-400">
                  {pipeline.total} Total Leads
                </span>
              </div>

              {/* Dynamic Funnel Rows */}
              <div className="space-y-2.5 py-1">
                {/* Stage: New */}
                <div className="flex items-center justify-between text-xs gap-2">
                  <div className="flex-1">
                    <div
                      className="bg-blue-500 text-white text-[10px] font-bold py-1 px-2.5 rounded-md text-left transition-all truncate"
                      style={{
                        width: `${Math.max(16, Math.min(100, Math.round((pipeline.new / Math.max(pipeline.total, 1)) * 100)))}%`,
                      }}
                    >
                      New ({pipeline.new})
                    </div>
                  </div>
                  <span className="font-bold text-slate-700 text-xs shrink-0 w-12 text-right">
                    {pipeline.newPct}%
                  </span>
                </div>

                {/* Stage: Contacted */}
                <div className="flex items-center justify-between text-xs gap-2">
                  <div className="flex-1">
                    <div
                      className="bg-teal-500 text-white text-[10px] font-bold py-1 px-2.5 rounded-md text-left transition-all truncate"
                      style={{
                        width: `${Math.max(16, Math.min(100, Math.round((pipeline.contacted / Math.max(pipeline.total, 1)) * 100)))}%`,
                      }}
                    >
                      Contacted ({pipeline.contacted})
                    </div>
                  </div>
                  <span className="font-bold text-slate-700 text-xs shrink-0 w-12 text-right">
                    {pipeline.contactedPct}%
                  </span>
                </div>

                {/* Stage: Interested */}
                <div className="flex items-center justify-between text-xs gap-2">
                  <div className="flex-1">
                    <div
                      className="bg-amber-400 text-white text-[10px] font-bold py-1 px-2.5 rounded-md text-left transition-all truncate"
                      style={{
                        width: `${Math.max(16, Math.min(100, Math.round((pipeline.interested / Math.max(pipeline.total, 1)) * 100)))}%`,
                      }}
                    >
                      Interested ({pipeline.interested})
                    </div>
                  </div>
                  <span className="font-bold text-slate-700 text-xs shrink-0 w-12 text-right">
                    {pipeline.interestedPct}%
                  </span>
                </div>

                {/* Stage: Quotation */}
                <div className="flex items-center justify-between text-xs gap-2">
                  <div className="flex-1">
                    <div
                      className="bg-purple-500 text-white text-[10px] font-bold py-1 px-2.5 rounded-md text-left transition-all truncate"
                      style={{
                        width: `${Math.max(16, Math.min(100, Math.round((pipeline.quotation / Math.max(pipeline.total, 1)) * 100)))}%`,
                      }}
                    >
                      Quotation ({pipeline.quotation})
                    </div>
                  </div>
                  <span className="font-bold text-slate-700 text-xs shrink-0 w-12 text-right">
                    {pipeline.quotationPct}%
                  </span>
                </div>

                {/* Stage: Order / Won */}
                <div className="flex items-center justify-between text-xs gap-2">
                  <div className="flex-1">
                    <div
                      className="bg-emerald-500 text-white text-[10px] font-bold py-1 px-2.5 rounded-md text-left transition-all truncate"
                      style={{
                        width: `${Math.max(16, Math.min(100, Math.round((pipeline.won / Math.max(pipeline.total, 1)) * 100)))}%`,
                      }}
                    >
                      Won ({pipeline.won})
                    </div>
                  </div>
                  <span className="font-bold text-slate-700 text-xs shrink-0 w-12 text-right">
                    {pipeline.wonPct}%
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">
                  Overall Conversion Rate
                </span>
                <span className="font-black text-emerald-600">
                  {pipeline.convRate}%
                </span>
              </div>
            </div>

            {/* 2. Today's & Recent Activities (6 Cols) */}
            <div className="lg:col-span-6 bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
              <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-xs">
                  Recent Activities
                </h3>
                <span className="text-[10px] font-semibold text-slate-400">
                  Live Feed
                </span>
              </div>

              {activities.length === 0 ? (
                <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center gap-1.5">
                  <Inbox className="w-6 h-6 text-slate-300" />
                  <span className="text-xs font-medium">
                    No recent activities recorded
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Schedule follow-ups or add leads to see events
                  </span>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  {activities.map((act) => {
                    const IconComp = act.icon;
                    return (
                      <Link
                        key={act.id}
                        href={act.link}
                        className="flex items-start justify-between gap-2.5 group hover:bg-slate-50 p-1.5 rounded-xl transition-colors"
                      >
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <div
                            className={`w-6 h-6 rounded-full ${act.iconBg} flex items-center justify-center shrink-0 mt-0.5`}
                          >
                            <IconComp className="w-3 h-3" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <strong className="text-slate-900 text-[11px] block truncate group-hover:text-blue-600 transition-colors">
                              {act.title}
                            </strong>
                            <span className="text-[10px] text-slate-500 block truncate">
                              {act.description}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">
                              {formatActivityTime(act.timestamp)}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${act.badgeColor}`}
                        >
                          {act.badge}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 text-center">
                <Link
                  href="/dashboard/followups"
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  View All Activities →
                </Link>
              </div>
            </div>
          </div>

          {/* ROW 3: Follow-up Attention | Top Performers | Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* 1. Follow-up Attention (4 Cols) */}
            <div className="lg:col-span-4 bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
              <div className="pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-xs">
                  Follow-up Attention
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Due Today */}
                <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-100 text-center space-y-1">
                  <Clock className="w-4 h-4 text-orange-600 mx-auto" />
                  <div className="text-xl font-black text-slate-900">
                    {followupsTodayCount}
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 block">
                    Due Today
                  </span>
                  <Link
                    href="/dashboard/followups?filter=today"
                    className="text-[10px] font-bold text-blue-600 hover:underline block pt-0.5"
                  >
                    View List →
                  </Link>
                </div>

                {/* Overdue */}
                <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 text-center space-y-1">
                  <AlertTriangle className="w-4 h-4 text-rose-600 mx-auto" />
                  <div className="text-xl font-black text-rose-600">
                    {overdueFollowupsCount}
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 block">
                    Overdue
                  </span>
                  <Link
                    href="/dashboard/followups?filter=overdue"
                    className="text-[10px] font-bold text-blue-600 hover:underline block pt-0.5"
                  >
                    View List →
                  </Link>
                </div>

                {/* High Priority */}
                <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 text-center space-y-1">
                  <Sparkles className="w-4 h-4 text-purple-600 mx-auto" />
                  <div className="text-xl font-black text-purple-700">
                    {highPriorityFollowupsCount}
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 block">
                    High Priority
                  </span>
                  <Link
                    href="/dashboard/followups?filter=high"
                    className="text-[10px] font-bold text-blue-600 hover:underline block pt-0.5"
                  >
                    View List →
                  </Link>
                </div>

                {/* Pending Approval */}
                <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-100 text-center space-y-1">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 mx-auto" />
                  <div className="text-xl font-black text-teal-700">
                    {pendingApprovalsCount}
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 block">
                    Pending Approval
                  </span>
                  <Link
                    href="/dashboard/quotations"
                    className="text-[10px] font-bold text-blue-600 hover:underline block pt-0.5"
                  >
                    View List →
                  </Link>
                </div>
              </div>
            </div>

            {/* 2. Top Performers Widget (4 Cols) */}
            <div className="lg:col-span-4 bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <h3 className="font-bold text-slate-900 text-xs">
                    Top Performers ({timeframe})
                  </h3>
                </div>
                <Link
                  href="/dashboard/leaderboard"
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  Leaderboard →
                </Link>
              </div>

              <div className="space-y-2">
                {topPerformers.length > 0 ? (
                  topPerformers.slice(0, 4).map((p, idx) => {
                    const userObj = p.user || p;
                    const uName =
                      userObj.name || p.userName || `Executive ${idx + 1}`;
                    const achievedVal =
                      p.achievedPaise !== undefined
                        ? p.achievedPaise / 100
                        : p.revenueAchieved || p.achieved || 0;
                    const dealsCount =
                      p.ordersWonCount !== undefined
                        ? p.ordersWonCount
                        : p.ordersCount || p.dealsWon || 0;
                    const rank = p.rank || idx + 1;

                    return (
                      <div
                        key={userObj._id || idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 hover:bg-slate-100/70 border border-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[9px] shrink-0 ${
                              rank === 1
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : rank === 2
                                  ? "bg-slate-200 text-slate-700 border border-slate-300"
                                  : rank === 3
                                    ? "bg-amber-50 text-amber-900 border border-amber-200"
                                    : "bg-white text-slate-500 border border-slate-200"
                            }`}
                          >
                            {rank === 1
                              ? "🥇"
                              : rank === 2
                                ? "🥈"
                                : rank === 3
                                  ? "🥉"
                                  : `#${rank}`}
                          </span>

                          <div
                            className={`w-6 h-6 rounded-lg text-white font-bold flex items-center justify-center text-[9px] shrink-0 shadow-2xs ${
                              rank === 1
                                ? "bg-gradient-to-br from-amber-500 to-amber-600"
                                : rank === 2
                                  ? "bg-gradient-to-br from-slate-600 to-slate-700"
                                  : "bg-gradient-to-br from-blue-600 to-indigo-600"
                            }`}
                          >
                            {uName.slice(0, 2).toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <strong className="text-slate-900 text-xs block truncate">
                              {uName}
                            </strong>
                            <span className="text-[10px] text-slate-400 block font-medium">
                              {dealsCount} {dealsCount === 1 ? "deal" : "deals"}{" "}
                              won
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-2">
                          <span className="font-bold text-emerald-600 text-xs block">
                            ₹
                            {achievedVal.toLocaleString("en-IN", {
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-slate-400">
                    <Trophy className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                    <span className="text-[11px] font-medium block">
                      No rankings recorded
                    </span>
                    <span className="text-[9px] text-slate-400">
                      Close orders to rank on leaderboard
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-500 font-semibold">
                  Sales Champions
                </span>
                <span className="font-bold text-blue-600 text-[11px]">
                  {topPerformers.length} Executives
                </span>
              </div>
            </div>

            {/* 3. Quick Actions (4 Cols) */}
            <div className="lg:col-span-4 bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
              <div className="pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-xs">
                  Quick Actions
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                {/* 1. Add Lead */}
                <Link
                  href="/dashboard/leads"
                  className="p-2.5 rounded-xl bg-blue-50/70 hover:bg-blue-100 border border-blue-100 flex flex-col items-center gap-1 transition-colors"
                >
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-800 text-[10px]">
                    Add Lead
                  </span>
                </Link>

                {/* 2. Create Follow-up */}
                <Link
                  href="/dashboard/followups"
                  className="p-2.5 rounded-xl bg-amber-50/70 hover:bg-amber-100 border border-amber-100 flex flex-col items-center gap-1 transition-colors"
                >
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-slate-800 text-[10px]">
                    Create Follow-up
                  </span>
                </Link>

                {/* 3. Create Quotation */}
                <Link
                  href="/dashboard/quotations"
                  className="p-2.5 rounded-xl bg-purple-50/70 hover:bg-purple-100 border border-purple-100 flex flex-col items-center gap-1 transition-colors"
                >
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span className="font-bold text-slate-800 text-[10px]">
                    Create Quotation
                  </span>
                </Link>

                {/* 4. Record Payment */}
                <Link
                  href="/dashboard/payments"
                  className="p-2.5 rounded-xl bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-100 flex flex-col items-center gap-1 transition-colors"
                >
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-800 text-[10px]">
                    Record Payment
                  </span>
                </Link>

                {/* 5. View Orders */}
                <Link
                  href="/dashboard/orders"
                  className="p-2.5 rounded-xl bg-teal-50/70 hover:bg-teal-100 border border-teal-100 flex flex-col items-center gap-1 transition-colors"
                >
                  <ShoppingBag className="w-4 h-4 text-teal-600" />
                  <span className="font-bold text-slate-800 text-[10px]">
                    View Orders
                  </span>
                </Link>

                {/* 6. My Receivables */}
                <Link
                  href="/dashboard/receivables"
                  className="p-2.5 rounded-xl bg-rose-50/70 hover:bg-rose-100 border border-rose-100 flex flex-col items-center gap-1 transition-colors"
                >
                  <DollarSign className="w-4 h-4 text-rose-600" />
                  <span className="font-bold text-slate-800 text-[10px]">
                    My Receivables
                  </span>
                </Link>

                {/* 7. View Customers */}
                <Link
                  href="/dashboard/customers"
                  className="p-2.5 rounded-xl bg-blue-50/70 hover:bg-blue-100 border border-blue-100 flex flex-col items-center gap-1 transition-colors"
                >
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-800 text-[10px]">
                    View Customers
                  </span>
                </Link>

                {/* 8. Open Design Status */}
                <Link
                  href="/dashboard/design"
                  className="p-2.5 rounded-xl bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-100 flex flex-col items-center gap-1 transition-colors"
                >
                  <Palette className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-800 text-[10px]">
                    Design Status
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* ROW 4: Recent Leads | Recent Quotations */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Recent Leads (6 Cols) */}
            <div className="lg:col-span-6 bg-white rounded-md p-4 border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-xs">
                  Recent Leads
                </h3>
                <Link
                  href="/dashboard/leads"
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  View All Leads →
                </Link>
              </div>

              <div className="overflow-x-auto min-h-[160px]">
                {recentLeads.length === 0 ? (
                  <div className="py-10 text-center text-slate-400">
                    <Inbox className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                    <span className="text-xs font-medium block">
                      No leads found
                    </span>
                    <Link
                      href="/dashboard/leads"
                      className="text-[10px] text-blue-600 font-semibold hover:underline"
                    >
                      + Create your first lead
                    </Link>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="pb-1.5">Lead / Business</th>
                        <th className="pb-1.5">Contact</th>
                        <th className="pb-1.5">Source</th>
                        <th className="pb-1.5">Status</th>
                        <th className="pb-1.5">Value</th>
                        <th className="pb-1.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {recentLeads.map((lead) => {
                        const val =
                          lead.expectedValue || lead.estimatedBudget || 0;
                        return (
                          <tr
                            key={lead._id}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-2 font-bold text-slate-900 max-w-[120px] truncate">
                              {lead.businessName || lead.contactName || "Lead"}
                            </td>
                            <td className="py-2 text-slate-600 max-w-[100px] truncate">
                              {lead.contactName || lead.phone || "-"}
                            </td>
                            <td className="py-2 text-slate-400 text-[10px] uppercase">
                              {lead.source || "MANUAL"}
                            </td>
                            <td className="py-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                  lead.status === "WON"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : lead.status === "NEW"
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : lead.status === "LOST"
                                        ? "bg-rose-50 text-rose-700 border-rose-200"
                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                              >
                                {lead.status || "NEW"}
                              </span>
                            </td>
                            <td className="py-2 font-bold text-slate-900">
                              {val > 0
                                ? `₹${val.toLocaleString("en-IN")}`
                                : "-"}
                            </td>
                            <td className="py-2 text-right">
                              <Link
                                href={`/dashboard/leads/${lead._id}`}
                                className="text-slate-400 hover:text-blue-600 inline-block p-1"
                                title="View Lead"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Recent Quotations (6 Cols) */}
            <div className="lg:col-span-6 bg-white rounded-md p-4 border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-xs">
                  Recent Quotations
                </h3>
                <Link
                  href="/dashboard/quotations"
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  View All Quotations →
                </Link>
              </div>

              <div className="overflow-x-auto min-h-[160px]">
                {recentQuotations.length === 0 ? (
                  <div className="py-10 text-center text-slate-400">
                    <FileText className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                    <span className="text-xs font-medium block">
                      No quotations created yet
                    </span>
                    <Link
                      href="/dashboard/quotations"
                      className="text-[10px] text-blue-600 font-semibold hover:underline"
                    >
                      + Create a new quotation
                    </Link>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="pb-1.5">Quotation #</th>
                        <th className="pb-1.5">Client</th>
                        <th className="pb-1.5">Date</th>
                        <th className="pb-1.5">Value</th>
                        <th className="pb-1.5">Status</th>
                        <th className="pb-1.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {recentQuotations.map((q) => {
                        const clientName =
                          q.customerSnapshot?.companyName ||
                          q.customerSnapshot?.displayName ||
                          q.customerSnapshot?.contactPerson ||
                          "Customer";
                        const dateFormatted = q.createdAt
                          ? new Date(q.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "-";
                        const val = (q.grandTotalPaise || 0) / 100;
                        return (
                          <tr
                            key={q._id}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-2.5 font-bold font-mono text-blue-600">
                              {q.quotationNumber || "DRAFT"}
                            </td>
                            <td className="py-2.5 text-slate-800 font-medium max-w-[130px] truncate">
                              {clientName}
                            </td>
                            <td className="py-2.5 text-slate-400">
                              {dateFormatted}
                            </td>
                            <td className="py-2.5 font-bold text-slate-900">
                              ₹{Math.round(val).toLocaleString("en-IN")}
                            </td>
                            <td className="py-2.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                  q.status === "ACCEPTED"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : q.status === "SENT"
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : q.status === "REJECTED"
                                        ? "bg-rose-50 text-rose-700 border-rose-200"
                                        : "bg-slate-100 text-slate-700 border-slate-200"
                                }`}
                              >
                                {q.status || "DRAFT"}
                              </span>
                            </td>
                            <td className="py-2.5 text-right">
                              <Link
                                href="/dashboard/quotations"
                                className="text-slate-400 hover:text-blue-600 inline-block p-1"
                                title="View Quotations"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* ROW 5: Design Status Summary (Full Width Banner) */}
          <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-xs">
                Design Status Summary
              </h3>
              <Link
                href="/dashboard/design"
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                View All →
              </Link>
            </div>

            {/* 5 Stage Summary Badges with Real Dynamic Data */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
              {/* 1. In Design */}
              <Link
                href="/dashboard/design?filter=IN_DESIGN"
                className="p-3 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 border border-blue-100 text-center space-y-1 transition-colors"
              >
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                  <Palette className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 block">
                  In Design
                </span>
                <span className="text-lg font-black text-blue-700">
                  {designStatusCounts.inDesign}
                </span>
              </Link>

              {/* 2. Client Review */}
              <Link
                href="/dashboard/design?filter=CLIENT_REVIEW"
                className="p-3 rounded-xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-100 text-center space-y-1 transition-colors"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <Eye className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 block">
                  Client Review
                </span>
                <span className="text-lg font-black text-amber-700">
                  {designStatusCounts.clientReview}
                </span>
              </Link>

              {/* 3. Revision Requested */}
              <Link
                href="/dashboard/design?filter=REVISION"
                className="p-3 rounded-xl bg-rose-50/70 hover:bg-rose-100/70 border border-rose-100 text-center space-y-1 transition-colors"
              >
                <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 block">
                  Revision
                </span>
                <span className="text-lg font-black text-rose-700">
                  {designStatusCounts.revision}
                </span>
              </Link>

              {/* 4. Approved */}
              <Link
                href="/dashboard/design?filter=APPROVED"
                className="p-3 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-100 text-center space-y-1 transition-colors"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 block">
                  Approved
                </span>
                <span className="text-lg font-black text-emerald-700">
                  {designStatusCounts.approved}
                </span>
              </Link>

              {/* 5. Production Ready */}
              <Link
                href="/dashboard/design?filter=PRODUCTION_READY"
                className="p-3 rounded-xl bg-teal-50/70 hover:bg-teal-100/70 border border-teal-100 text-center space-y-1 transition-colors"
              >
                <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
                  <FileCheck className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 block">
                  Production Ready
                </span>
                <span className="text-lg font-black text-teal-700">
                  {designStatusCounts.productionReady}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
