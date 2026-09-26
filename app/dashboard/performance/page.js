"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import {
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  DollarSign,
  BarChart3,
  Calendar,
  Download,
  ChevronDown,
  PhoneCall,
  MessageSquare,
  Check,
  AlertTriangle,
  FileText,
  ShoppingBag,
  RefreshCw,
  Search,
  Clock,
  ExternalLink,
  Target,
  Inbox,
  Activity,
  ArrowRight,
} from "lucide-react";

const TABS = [
  "Overview",
  "Executive Performance",
  "Team Performance",
  "Activity Performance",
  "Targets vs Achievement",
];

const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-indigo-600",
  "bg-purple-600",
  "bg-teal-600",
  "bg-emerald-600",
  "bg-rose-600",
  "bg-amber-600",
  "bg-cyan-600",
];

function getAvatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function getInitials(name = "Sales User") {
  if (!name) return "SU";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatINR(amount = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(amount || 0));
}

function getPeriodDates(timeframe) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (timeframe === "Last Month") {
    const prevMonthYear = month === 0 ? year - 1 : year;
    const prevMonth = month === 0 ? 11 : month - 1;
    const startCurrent = new Date(prevMonthYear, prevMonth, 1, 0, 0, 0, 0);
    const endCurrent = new Date(
      prevMonthYear,
      prevMonth + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const prev2Year = prevMonth === 0 ? prevMonthYear - 1 : prevMonthYear;
    const prev2Month = prevMonth === 0 ? 11 : prevMonth - 1;
    const startPrev = new Date(prev2Year, prev2Month, 1, 0, 0, 0, 0);
    const endPrev = new Date(prev2Year, prev2Month + 1, 0, 23, 59, 59, 999);

    return {
      startCurrent,
      endCurrent,
      startPrev,
      endPrev,
      periodLabel: "prior month",
    };
  }

  if (timeframe === "Quarter to Date" || timeframe === "This Quarter") {
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

  if (timeframe === "Year to Date" || timeframe === "This Year") {
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

  if (timeframe === "All Time") {
    const startCurrent = new Date(2020, 0, 1, 0, 0, 0, 0);
    const endCurrent = new Date(year + 5, 11, 31, 23, 59, 59, 999);
    return {
      startCurrent,
      endCurrent,
      startPrev: startCurrent,
      endPrev: endCurrent,
      periodLabel: "all time",
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

function calculateTrend(current, previous, periodLabel) {
  if (previous === 0) {
    if (current > 0)
      return {
        text: `▲ +${current} vs ${periodLabel}`,
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

function calculateRating(achievementPct, convRate) {
  let score = 3.0;
  if (achievementPct >= 120) score += 1.5;
  else if (achievementPct >= 100) score += 1.2;
  else if (achievementPct >= 80) score += 0.8;
  else if (achievementPct >= 50) score += 0.3;
  else score -= 0.5;

  if (convRate >= 25) score += 0.5;
  else if (convRate >= 15) score += 0.3;
  else if (convRate <= 5) score -= 0.3;

  score = Math.max(1.0, Math.min(5.0, score));
  return score.toFixed(1);
}

export default function PerformancePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Overview");
  const [timeframe, setTimeframe] = useState("This Month");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Current user identity & role
  const [userRole, setUserRole] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserName, setCurrentUserName] = useState("My Performance");
  const isSalesRole =
    userRole.includes("sales") &&
    !userRole.includes("manager") &&
    !userRole.includes("admin");

  // Raw fetched datasets
  const [leads, setLeads] = useState([]);
  const [orders, setOrders] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [targetsData, setTargetsData] = useState(null);
  const [myAchievement, setMyAchievement] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [usersList, setUsersList] = useState([]);

  // Read user identity from localStorage
  useEffect(() => {
    try {
      const role = (localStorage.getItem("userRole") || "").toLowerCase();
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const resolvedRole =
        role || (storedUser.roleSlug || storedUser.role || "").toLowerCase();
      setUserRole(resolvedRole);
      setCurrentUserId(String(storedUser._id || storedUser.id || ""));
      setCurrentUserName(
        storedUser.name || localStorage.getItem("userName") || "My Performance",
      );
    } catch {}
  }, []);

  // Timeframe calculation
  const { startCurrent, endCurrent, startPrev, endPrev, periodLabel } =
    useMemo(() => {
      return getPeriodDates(timeframe);
    }, [timeframe]);

  const dateRangeDisplay = useMemo(() => {
    const opts = { day: "2-digit", month: "short", year: "numeric" };
    return `${startCurrent.toLocaleDateString("en-IN", opts)} - ${endCurrent.toLocaleDateString("en-IN", opts)}`;
  }, [startCurrent, endCurrent]);

  // Load real data — scoped by role
  const loadPerformanceData = useCallback(
    async (isSilent = false) => {
      // Wait until role is resolved
      if (!userRole) return;
      try {
        if (!isSilent) setLoading(true);
        else setRefreshing(true);
        setError(null);

        const startIso = startCurrent.toISOString();
        const endIso = endCurrent.toISOString();
        const tfParam =
          timeframe === "Quarter to Date"
            ? "quarter"
            : timeframe === "Year to Date"
              ? "all"
              : "month";

        if (isSalesRole) {
          // SALESPERSON — only own data. Backend already scopes /leads, /orders, /quotations, /payments, /followups to OWN.
          const [leadsRes, ordersRes, quotesRes, paymentsRes, followupsRes, myAchRes] =
            await Promise.allSettled([
              api.get("/leads?limit=250"),
              api.get("/orders?limit=100"),
              api.get("/quotations?limit=500"),
              api.get("/payments?limit=100"),
              api.get("/followups?limit=250"),
              api.get(
                `/targets/my-achievement?periodStart=${encodeURIComponent(startIso)}&periodEnd=${encodeURIComponent(endIso)}`,
              ),
            ]);

          if (leadsRes.status === "fulfilled" && leadsRes.value?.data) {
            setLeads(
              Array.isArray(leadsRes.value.data)
                ? leadsRes.value.data
                : leadsRes.value.data.leads || [],
            );
          }
          if (ordersRes.status === "fulfilled" && ordersRes.value?.data) {
            setOrders(
              Array.isArray(ordersRes.value.data)
                ? ordersRes.value.data
                : ordersRes.value.data.orders || [],
            );
          }
          if (quotesRes.status === "fulfilled" && quotesRes.value?.data) {
            const rawQ = quotesRes.value.data;
            setQuotations(
              Array.isArray(rawQ)
                ? rawQ
                : rawQ?.records || rawQ?.quotations || rawQ?.data || [],
            );
          }
          if (paymentsRes.status === "fulfilled" && paymentsRes.value?.data) {
            setPayments(
              Array.isArray(paymentsRes.value.data)
                ? paymentsRes.value.data
                : paymentsRes.value.data.payments || [],
            );
          }
          if (followupsRes.status === "fulfilled" && followupsRes.value?.data) {
            setFollowups(
              Array.isArray(followupsRes.value.data)
                ? followupsRes.value.data
                : followupsRes.value.data.followups || [],
            );
          }
          if (myAchRes.status === "fulfilled" && myAchRes.value?.data) {
            setMyAchievement(myAchRes.value.data);
          }
        } else {
          // ADMIN / MANAGER — full team view
          const [
            leadsRes,
            ordersRes,
            quotesRes,
            paymentsRes,
            followupsRes,
            targetsRes,
            leaderboardRes,
            usersRes,
          ] = await Promise.allSettled([
            api.get("/leads?limit=250"),
            api.get("/orders?limit=100"),
            api.get("/quotations?limit=500"),
            api.get("/payments?limit=100"),
            api.get("/followups?limit=250"),
            api.get(
              `/targets?periodStart=${encodeURIComponent(startIso)}&periodEnd=${encodeURIComponent(endIso)}`,
            ),
            api.get(`/targets/leaderboard?timeframe=${tfParam}`),
            api.get("/users?limit=100"),
          ]);

          if (leadsRes.status === "fulfilled" && leadsRes.value?.data) {
            setLeads(
              Array.isArray(leadsRes.value.data)
                ? leadsRes.value.data
                : leadsRes.value.data.leads || [],
            );
          }
          if (ordersRes.status === "fulfilled" && ordersRes.value?.data) {
            setOrders(
              Array.isArray(ordersRes.value.data)
                ? ordersRes.value.data
                : ordersRes.value.data.orders || [],
            );
          }
          if (quotesRes.status === "fulfilled" && quotesRes.value?.data) {
            const rawQ = quotesRes.value.data;
            setQuotations(
              Array.isArray(rawQ)
                ? rawQ
                : rawQ?.records || rawQ?.quotations || rawQ?.data || [],
            );
          }
          if (paymentsRes.status === "fulfilled" && paymentsRes.value?.data) {
            setPayments(
              Array.isArray(paymentsRes.value.data)
                ? paymentsRes.value.data
                : paymentsRes.value.data.payments || [],
            );
          }
          if (followupsRes.status === "fulfilled" && followupsRes.value?.data) {
            setFollowups(
              Array.isArray(followupsRes.value.data)
                ? followupsRes.value.data
                : followupsRes.value.data.followups || [],
            );
          }
          if (targetsRes.status === "fulfilled" && targetsRes.value?.data) {
            setTargetsData(targetsRes.value.data);
          }
          if (
            leaderboardRes.status === "fulfilled" &&
            leaderboardRes.value?.data
          ) {
            setLeaderboardData(leaderboardRes.value.data);
          }
          if (usersRes.status === "fulfilled" && usersRes.value?.data) {
            setUsersList(
              Array.isArray(usersRes.value.data)
                ? usersRes.value.data
                : usersRes.value.data.users || [],
            );
          }
        }
      } catch (err) {
        console.error("Error loading performance data:", err);
        setError("Unable to load performance metrics from server.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [startCurrent, endCurrent, timeframe, userRole, isSalesRole],
  );

  // Reload whenever role resolves or timeframe changes
  useEffect(() => {
    if (userRole) loadPerformanceData();
  }, [loadPerformanceData, userRole]);

  // Salespeople: personal target from my-achievement endpoint
  const myTargetRupees = myAchievement?.targetPaise
    ? myAchievement.targetPaise / 100
    : 0;
  const myAchievedRupees = myAchievement?.achievedPaise
    ? myAchievement.achievedPaise / 100
    : 0;
  const myAchievementPct = myAchievement?.achievementPercent || 0;
  const myRemainingRupees = myAchievement?.remainingPaise
    ? myAchievement.remainingPaise / 100
    : 0;
  const myRequiredPerDay = myAchievement?.requiredPerDayPaise
    ? myAchievement.requiredPerDayPaise / 100
    : 0;
  const myOrdersWon = myAchievement?.ordersWonCount || 0;
  const myDaysRemaining = myAchievement?.daysRemaining || 0;

  // Filter current period datasets
  const currentLeads = useMemo(() => {
    return leads.filter((l) => {
      const d = new Date(l.createdAt || l.updatedAt);
      return d >= startCurrent && d <= endCurrent;
    });
  }, [leads, startCurrent, endCurrent]);

  const prevLeads = useMemo(() => {
    return leads.filter((l) => {
      const d = new Date(l.createdAt || l.updatedAt);
      return d >= startPrev && d <= endPrev;
    });
  }, [leads, startPrev, endPrev]);

  const currentOrders = useMemo(() => {
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

  const currentPayments = useMemo(() => {
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

  const currentFollowups = useMemo(() => {
    return followups.filter((f) => {
      const d = new Date(f.scheduledAt || f.createdAt);
      return d >= startCurrent && d <= endCurrent;
    });
  }, [followups, startCurrent, endCurrent]);

  // Overall metric aggregations
  const totalLeadsCount = currentLeads.length;
  const leadsTrend = useMemo(
    () => calculateTrend(totalLeadsCount, prevLeads.length, periodLabel),
    [totalLeadsCount, prevLeads.length, periodLabel],
  );

  const convertedLeadsCount = useMemo(() => {
    return currentLeads.filter((l) =>
      ["WON", "ORDER_CREATED", "CLOSED_WON"].includes(l.status),
    ).length;
  }, [currentLeads]);
  const prevConvertedCount = useMemo(() => {
    return prevLeads.filter((l) =>
      ["WON", "ORDER_CREATED", "CLOSED_WON"].includes(l.status),
    ).length;
  }, [prevLeads]);
  const conversionsTrend = useMemo(
    () => calculateTrend(convertedLeadsCount, prevConvertedCount, periodLabel),
    [convertedLeadsCount, prevConvertedCount, periodLabel],
  );

  const currentAcceptedQuotations = useMemo(() => {
    return quotations.filter((q) => {
      if (q.status !== "ACCEPTED") return false;
      const d = new Date(q.acceptedAt || q.updatedAt || q.createdAt);
      return d >= startCurrent && d <= endCurrent;
    });
  }, [quotations, startCurrent, endCurrent]);

  const prevAcceptedQuotations = useMemo(() => {
    return quotations.filter((q) => {
      if (q.status !== "ACCEPTED") return false;
      const d = new Date(q.acceptedAt || q.updatedAt || q.createdAt);
      return d >= startPrev && d <= endPrev;
    });
  }, [quotations, startPrev, endPrev]);

  const totalOrdersCount = currentAcceptedQuotations.length;
  const ordersTrend = useMemo(
    () => calculateTrend(totalOrdersCount, prevAcceptedQuotations.length, periodLabel),
    [totalOrdersCount, prevAcceptedQuotations.length, periodLabel],
  );

  const totalOrderValueRupees = useMemo(() => {
    return currentAcceptedQuotations.reduce((sum, q) => {
      const val = q.grandTotalPaise
        ? q.grandTotalPaise / 100
        : q.grandTotal || q.totalAmount || 0;
      return sum + val;
    }, 0);
  }, [currentAcceptedQuotations]);

  const prevOrderValueRupees = useMemo(() => {
    return prevAcceptedQuotations.reduce((sum, q) => {
      const val = q.grandTotalPaise
        ? q.grandTotalPaise / 100
        : q.grandTotal || q.totalAmount || 0;
      return sum + val;
    }, 0);
  }, [prevAcceptedQuotations]);
  const orderValueTrend = useMemo(
    () =>
      calculateTrend(totalOrderValueRupees, prevOrderValueRupees, periodLabel),
    [totalOrderValueRupees, prevOrderValueRupees, periodLabel],
  );

  const totalCollectionRupees = useMemo(() => {
    return currentPayments.reduce((sum, p) => {
      const val = p.amountPaise ? p.amountPaise / 100 : p.amount || 0;
      return sum + val;
    }, 0);
  }, [currentPayments]);

  const prevCollectionRupees = useMemo(() => {
    return prevPayments.reduce((sum, p) => {
      const val = p.amountPaise ? p.amountPaise / 100 : p.amount || 0;
      return sum + val;
    }, 0);
  }, [prevPayments]);
  const collectionTrend = useMemo(
    () =>
      calculateTrend(totalCollectionRupees, prevCollectionRupees, periodLabel),
    [totalCollectionRupees, prevCollectionRupees, periodLabel],
  );

  // Executives synthesis (merging users, targets, and sales stats)
  const executives = useMemo(() => {
    // 1. Base list of sales users
    const userMap = new Map();

    // From targets endpoint
    if (targetsData?.targets && Array.isArray(targetsData.targets)) {
      targetsData.targets.forEach((t) => {
        if (t.user?._id) {
          userMap.set(String(t.user._id), {
            id: String(t.user._id),
            name: t.user.name || "Sales Rep",
            email: t.user.email || "",
            role: t.user.roleSlug || t.user.role || "Sales Executive",
            targetRupees:
              t.targetRupees || (t.targetPaise ? t.targetPaise / 100 : 0),
            hasTarget: t.hasTarget || false,
            targetOrdersCount: t.targetOrdersCount || 0,
            remainingRupees: t.remainingRupees || 0,
            daysRemaining: t.daysRemaining || 0,
            requiredPerDayRupees: t.requiredPerDayRupees || 0,
          });
        }
      });
    }

    // From leaderboard
    if (leaderboardData?.rankings && Array.isArray(leaderboardData.rankings)) {
      leaderboardData.rankings.forEach((r) => {
        if (r.user?._id) {
          const id = String(r.user._id);
          if (!userMap.has(id)) {
            userMap.set(id, {
              id,
              name: r.user.name || "Sales Rep",
              email: r.user.email || "",
              role: r.user.roleSlug || r.user.role || "Sales Executive",
              targetRupees: r.targetPaise ? r.targetPaise / 100 : 0,
              hasTarget: Boolean(r.targetPaise > 0),
              targetOrdersCount: 0,
              remainingRupees: 0,
              daysRemaining: 0,
              requiredPerDayRupees: 0,
            });
          }
        }
      });
    }

    // From user directory (ensure all sales users are included)
    if (usersList && Array.isArray(usersList)) {
      usersList.forEach((u) => {
        const role = String(u.roleSlug || u.role || "").toLowerCase();
        if (
          role.includes("sales") ||
          role.includes("rep") ||
          role.includes("executive")
        ) {
          const id = String(u._id || u.id);
          if (!userMap.has(id)) {
            userMap.set(id, {
              id,
              name: u.name || "Sales Rep",
              email: u.email || "",
              role: u.roleSlug || u.role || "Sales Executive",
              targetRupees: 0,
              hasTarget: false,
              targetOrdersCount: 0,
              remainingRupees: 0,
              daysRemaining: 0,
              requiredPerDayRupees: 0,
            });
          }
        }
      });
    }

    // If still empty (e.g. initial setup without user records), build from lead/order assigned users
    if (userMap.size === 0) {
      currentLeads.forEach((l) => {
        if (l.assignedTo?._id || l.assignedTo?.name) {
          const id = String(l.assignedTo._id || l.assignedTo.name);
          if (!userMap.has(id)) {
            userMap.set(id, {
              id,
              name: l.assignedTo.name || "Sales Rep",
              email: l.assignedTo.email || "",
              role: "Sales Executive",
              targetRupees: 0,
              hasTarget: false,
              targetOrdersCount: 0,
              remainingRupees: 0,
              daysRemaining: 0,
              requiredPerDayRupees: 0,
            });
          }
        }
      });
    }

    // Calculate dynamic stats for each executive
    const repList = Array.from(userMap.values()).map((rep) => {
      // Leads assigned to this rep
      const repLeads = currentLeads.filter((l) => {
        const assignedId = String(l.assignedTo?._id || l.assignedTo || "");
        const createdId = String(l.createdById?._id || l.createdById || "");
        return assignedId === rep.id || createdId === rep.id;
      });

      const repPrevLeads = prevLeads.filter((l) => {
        const assignedId = String(l.assignedTo?._id || l.assignedTo || "");
        const createdId = String(l.createdById?._id || l.createdById || "");
        return assignedId === rep.id || createdId === rep.id;
      });

      // Conversions
      const repConversions = repLeads.filter((l) =>
        ["WON", "ORDER_CREATED", "CLOSED_WON"].includes(l.status),
      ).length;
      const repPrevConversions = repPrevLeads.filter((l) =>
        ["WON", "ORDER_CREATED", "CLOSED_WON"].includes(l.status),
      ).length;

      // Client-accepted quotations for this rep
      const repLeadIdSet = new Set(repLeads.map((l) => String(l._id || l.id || "")));
      const repPrevLeadIdSet = new Set(repPrevLeads.map((l) => String(l._id || l.id || "")));

      const repAcceptedQuotes = currentAcceptedQuotations.filter((q) => {
        const assignedId = String(
          q.assignedSalesId?._id ||
          q.assignedSalesId ||
          q.salesRepId ||
          q.createdById?._id ||
          q.createdById ||
          "",
        );
        const quoteLeadId = String(q.leadId?._id || q.leadId || "");
        return assignedId === rep.id || (quoteLeadId && repLeadIdSet.has(quoteLeadId));
      });

      const repPrevAcceptedQuotes = prevAcceptedQuotations.filter((q) => {
        const assignedId = String(
          q.assignedSalesId?._id ||
          q.assignedSalesId ||
          q.salesRepId ||
          q.createdById?._id ||
          q.createdById ||
          "",
        );
        const quoteLeadId = String(q.leadId?._id || q.leadId || "");
        return assignedId === rep.id || (quoteLeadId && repPrevLeadIdSet.has(quoteLeadId));
      });

      // Total sales value from client accepted quotations
      const repOrderValue = repAcceptedQuotes.reduce((sum, q) => {
        const val = q.grandTotalPaise
          ? q.grandTotalPaise / 100
          : q.grandTotal || q.totalAmount || 0;
        return sum + val;
      }, 0);

      const repPrevOrderValue = repPrevAcceptedQuotes.reduce((sum, q) => {
        const val = q.grandTotalPaise
          ? q.grandTotalPaise / 100
          : q.grandTotal || q.totalAmount || 0;
        return sum + val;
      }, 0);

      // Collections
      const repPayments = currentPayments.filter((p) => {
        const recordedBy = String(
          p.recordedBy?._id || p.recordedBy || p.userId?._id || p.userId || "",
        );
        return recordedBy === rep.id;
      });

      const repCollection = repPayments.reduce((sum, p) => {
        const val = p.amountPaise ? p.amountPaise / 100 : p.amount || 0;
        return sum + val;
      }, 0);

      // Conversion rate
      const convRateNum =
        repLeads.length > 0 ? (repConversions / repLeads.length) * 100 : 0;
      const convRateStr = `${convRateNum.toFixed(1)}%`;

      // Achievement %
      let achievementNum = 0;
      if (rep.targetRupees > 0) {
        achievementNum = Math.round((repOrderValue / rep.targetRupees) * 100);
      } else {
        achievementNum = repOrderValue > 0 ? 100 : 0;
      }

      // Progress bar color
      let barColor = "bg-emerald-500";
      if (achievementNum < 70) barColor = "bg-rose-500";
      else if (achievementNum < 100) barColor = "bg-amber-500";

      const rating = calculateRating(achievementNum, convRateNum);

      return {
        ...rep,
        avatar: getInitials(rep.name),
        avatarColor: getAvatarColor(rep.name),
        leads: repLeads.length,
        leadsDelta: calculateTrend(
          repLeads.length,
          repPrevLeads.length,
          periodLabel,
        ).text,
        conversions: repConversions,
        conversionsDelta: calculateTrend(
          repConversions,
          repPrevConversions,
          periodLabel,
        ).text,
        convRate: convRateStr,
        convRateNum,
        orders: repAcceptedQuotes.length,
        ordersDelta: calculateTrend(
          repAcceptedQuotes.length,
          repPrevAcceptedQuotes.length,
          periodLabel,
        ).text,
        orderValue: repOrderValue,
        orderValueFormatted: formatINR(repOrderValue),
        orderValueDelta: calculateTrend(
          repOrderValue,
          repPrevOrderValue,
          periodLabel,
        ).text,
        collection: repCollection,
        collectionFormatted: formatINR(repCollection),
        achievement: `${achievementNum}%`,
        achievementNum,
        barColor,
        rating,
      };
    });

    // Sort: descending by achieved order value
    repList.sort((a, b) => b.orderValue - a.orderValue);

    return repList.map((r, idx) => ({
      ...r,
      rank: idx + 1,
    }));
  }, [
    targetsData,
    leaderboardData,
    usersList,
    currentLeads,
    prevLeads,
    currentAcceptedQuotations,
    prevAcceptedQuotations,
    currentPayments,
    periodLabel,
  ]);

  // Overall Target & Achievement calculation (team view)
  const { totalTargetRupees, overallAchievementPct, teamTargetProgress } =
    useMemo(() => {
      if (isSalesRole) {
        // For sales users use their personal achievement
        return {
          totalTargetRupees: myTargetRupees,
          overallAchievementPct: myAchievementPct,
          teamTargetProgress: Math.min(100, myAchievementPct),
        };
      }
      const sumTargets = executives.reduce(
        (sum, e) => sum + (e.targetRupees || 0),
        0,
      );
      const sumAchieved = totalOrderValueRupees;
      let pct = 0;
      if (sumTargets > 0) {
        pct = Math.round((sumAchieved / sumTargets) * 100);
      } else {
        pct = sumAchieved > 0 ? 100 : 0;
      }
      return {
        totalTargetRupees: sumTargets,
        overallAchievementPct: pct,
        teamTargetProgress: Math.min(100, pct),
      };
    }, [
      executives,
      totalOrderValueRupees,
      isSalesRole,
      myTargetRupees,
      myAchievementPct,
    ]);

  // Filtered executives by search query
  const filteredExecutives = useMemo(() => {
    if (!searchQuery.trim()) return executives;
    const q = searchQuery.toLowerCase();
    return executives.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q),
    );
  }, [executives, searchQuery]);

  // Activity breakdown (Donut widget)
  const activityMetrics = useMemo(() => {
    const total = currentFollowups.length;
    const calls = currentFollowups.filter(
      (f) => f.type === "CALL" || f.channel === "CALL",
    ).length;
    const whatsapp = currentFollowups.filter(
      (f) => f.type === "WHATSAPP" || f.channel === "WHATSAPP",
    ).length;
    const meetings = currentFollowups.filter(
      (f) => f.type === "MEETING" || f.channel === "MEETING",
    ).length;
    const followupsCount = currentFollowups.filter(
      (f) => f.type === "FOLLOW_UP" || f.type === "TASK",
    ).length;
    const others = Math.max(
      0,
      total - (calls + whatsapp + meetings + followupsCount),
    );

    const calcPct = (cnt) => (total > 0 ? Math.round((cnt / total) * 100) : 0);

    return {
      total,
      calls,
      callsPct: calcPct(calls),
      whatsapp,
      whatsappPct: calcPct(whatsapp),
      meetings,
      meetingsPct: calcPct(meetings),
      followupsCount,
      followupsPct: calcPct(followupsCount),
      others,
      othersPct: calcPct(others),
    };
  }, [currentFollowups]);

  // Conversion Funnel Metrics
  const funnelMetrics = useMemo(() => {
    const total = currentLeads.length;
    const qualified = currentLeads.filter((l) =>
      [
        "CONTACTED",
        "INTERESTED",
        "QUOTATION_SENT",
        "NEGOTIATION",
        "WON",
        "ORDER_CREATED",
      ].includes(l.status),
    ).length;
    const quotationsCount = currentLeads.filter((l) =>
      ["QUOTATION_SENT", "NEGOTIATION", "WON", "ORDER_CREATED"].includes(
        l.status,
      ),
    ).length;
    const wonCount = convertedLeadsCount;

    const qualifiedPct =
      total > 0 ? ((qualified / total) * 100).toFixed(1) : "0.0";
    const quotationsPct =
      total > 0 ? ((quotationsCount / total) * 100).toFixed(1) : "0.0";
    const wonPct = total > 0 ? ((wonCount / total) * 100).toFixed(1) : "0.0";

    return {
      total,
      qualified,
      qualifiedPct,
      quotationsCount,
      quotationsPct,
      wonCount,
      wonPct,
      throughput: wonPct,
    };
  }, [currentLeads, convertedLeadsCount]);

  // Top performers
  const topPerformers = useMemo(() => {
    return executives.slice(0, 3);
  }, [executives]);

  // Dynamic Performance Insights generated from real data
  const insights = useMemo(() => {
    const topRep = executives[0];
    const underperformingCount = executives.filter(
      (e) => e.achievementNum < 80 && e.targetRupees > 0,
    ).length;
    const overallConvRate =
      totalLeadsCount > 0
        ? ((convertedLeadsCount / totalLeadsCount) * 100).toFixed(1)
        : "0.0";

    const list = [];

    // Insight 1: Team Target Milestone
    if (totalTargetRupees > 0) {
      if (overallAchievementPct >= 100) {
        list.push({
          type: "success",
          icon: Check,
          title: "Target Achieved!",
          text: `The team has surpassed the target by ${overallAchievementPct - 100}% this cycle.`,
          bg: "bg-emerald-50/80",
          border: "border-emerald-100",
          textColor: "text-emerald-900",
          descColor: "text-emerald-700",
          iconColor: "text-emerald-600",
        });
      } else {
        list.push({
          type: "info",
          icon: TrendingUp,
          title: "Target in Progress",
          text: `Team is currently at ${overallAchievementPct}% of the ${formatINR(totalTargetRupees)} goal.`,
          bg: "bg-blue-50/80",
          border: "border-blue-100",
          textColor: "text-blue-900",
          descColor: "text-blue-700",
          iconColor: "text-blue-600",
        });
      }
    } else {
      list.push({
        type: "info",
        icon: Target,
        title: "Commercial Active",
        text: `Logged ${formatINR(totalOrderValueRupees)} in orders across ${totalOrdersCount} deals.`,
        bg: "bg-indigo-50/80",
        border: "border-indigo-100",
        textColor: "text-indigo-900",
        descColor: "text-indigo-700",
        iconColor: "text-indigo-600",
      });
    }

    // Insight 2: Top Performer
    if (topRep && topRep.orderValue > 0) {
      list.push({
        type: "performer",
        icon: Award,
        title: "Top Performer",
        text: `${topRep.name} leads with ${topRep.orderValueFormatted} (${topRep.orders} won orders).`,
        bg: "bg-purple-50/80",
        border: "border-purple-100",
        textColor: "text-purple-900",
        descColor: "text-purple-700",
        iconColor: "text-purple-600",
      });
    } else {
      list.push({
        type: "neutral",
        icon: Users,
        title: "Team Overview",
        text: `${executives.length} sales representatives active in this cycle.`,
        bg: "bg-slate-50/80",
        border: "border-slate-200",
        textColor: "text-slate-900",
        descColor: "text-slate-600",
        iconColor: "text-slate-500",
      });
    }

    // Insight 3: Conversion Rate
    list.push({
      type: "conversion",
      icon: BarChart3,
      title: "Lead Conversion",
      text: `Team conversion rate is ${overallConvRate}% (${convertedLeadsCount} won of ${totalLeadsCount} leads).`,
      bg: "bg-teal-50/80",
      border: "border-teal-100",
      textColor: "text-teal-900",
      descColor: "text-teal-700",
      iconColor: "text-teal-600",
    });

    // Insight 4: Attention Required
    if (underperformingCount > 0) {
      list.push({
        type: "warning",
        icon: AlertTriangle,
        title: "Attention Required",
        text: `${underperformingCount} representative${underperformingCount > 1 ? "s are" : " is"} below 80% quota.`,
        bg: "bg-amber-50/80",
        border: "border-amber-100",
        textColor: "text-amber-900",
        descColor: "text-amber-700",
        iconColor: "text-amber-600",
      });
    } else {
      list.push({
        type: "success",
        icon: CheckCircle2,
        title: "Smooth Execution",
        text: `All sales executives have met their pacing milestones for this timeframe.`,
        bg: "bg-emerald-50/80",
        border: "border-emerald-100",
        textColor: "text-emerald-900",
        descColor: "text-emerald-700",
        iconColor: "text-emerald-600",
      });
    }

    return list;
  }, [
    executives,
    totalTargetRupees,
    overallAchievementPct,
    totalOrderValueRupees,
    totalOrdersCount,
    totalLeadsCount,
    convertedLeadsCount,
  ]);

  // Export CSV Report
  const handleExportCSV = () => {
    if (executives.length === 0) return;

    const headers = [
      "Rank",
      "Executive Name",
      "Role",
      "Leads Assigned",
      "Conversions",
      "Conversion Rate",
      "Orders",
      "Order Value (INR)",
      "Collection (INR)",
      "Target (INR)",
      "Achievement %",
      "Rating",
    ];

    const rows = executives.map((e) => [
      e.rank,
      `"${e.name}"`,
      `"${e.role}"`,
      e.leads,
      e.conversions,
      `"${e.convRate}"`,
      e.orders,
      e.orderValue,
      e.collection,
      e.targetRupees,
      `"${e.achievement}"`,
      e.rating,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `performance-report-${timeframe.toLowerCase().replace(/\s+/g, "-")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {isSalesRole ? `My Performance` : "Performance"}
                </h1>
                {refreshing && (
                  <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Refreshing...
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {isSalesRole
                  ? `Your personal sales performance — leads, orders, targets & activities`
                  : "Live performance tracking, targets, quotas, and conversion throughput"}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Timeframe selector */}
              <div className="relative">
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2 pr-7 rounded-xl focus:outline-none focus:border-blue-500 shadow-xs cursor-pointer hover:border-slate-300 transition-colors"
                >
                  <option value="This Month">This Month</option>
                  <option value="Last Month">Last Month</option>
                  <option value="Quarter to Date">Quarter to Date</option>
                  <option value="Year to Date">Year to Date</option>
                  <option value="All Time">All Time</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Live date range */}
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold shadow-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{dateRangeDisplay}</span>
              </div>

              {/* Refresh button */}
              <button
                onClick={() => loadPerformanceData(true)}
                disabled={loading || refreshing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 shadow-xs transition-colors disabled:opacity-50"
                title="Refresh Metrics"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-600" : ""}`}
                />
                <span>Sync</span>
              </button>

              {/* Export Report */}
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-600/25 transition-all active:scale-[0.98]"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Navigation Tabs — sales users only see their own scoped tabs */}
          <div className="border-b border-slate-200 flex gap-6 overflow-x-auto text-xs font-bold scrollbar-none">
            {TABS.filter((tab) => {
              if (
                isSalesRole &&
                (tab === "Executive Performance" || tab === "Team Performance")
              )
                return false;
              return true;
            }).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 relative transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? "text-blue-600"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Error notice if API fails */}
          {error && (
            <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" /> {error}
              </span>
              <button
                onClick={() => loadPerformanceData()}
                className="text-xs font-bold underline hover:text-rose-900"
              >
                Retry
              </button>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === "Overview" && (
            <div className="space-y-6">
              {/* Personal Target Banner — only shown to sales users */}
              {isSalesRole && (
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-md p-5 text-white shadow-md shadow-blue-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 opacity-[0.06]">
                    <Target className="w-full h-full" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-blue-200 mb-0.5">
                        My Target · {timeframe}
                      </p>
                      <div className="text-2xl font-black">
                        {loading ? "..." : formatINR(myTargetRupees)}
                      </div>
                      <p className="text-xs text-blue-200 mt-0.5">
                        Achieved:{" "}
                        <span className="text-white font-bold">
                          {loading ? "..." : formatINR(myAchievedRupees)}
                        </span>
                        &nbsp;&middot;&nbsp;Remaining:{" "}
                        <span className="text-white font-bold">
                          {loading ? "..." : formatINR(myRemainingRupees)}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black">
                        {loading ? "..." : `${myAchievementPct}%`}
                      </div>
                      <p className="text-[11px] text-blue-200 mt-0.5">
                        {myDaysRemaining} days left &middot; Need{" "}
                        {loading ? "..." : formatINR(myRequiredPerDay)}/day
                      </p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-4 relative">
                    <div className="h-2 bg-white/20 rounded-full">
                      <div
                        className="h-2 bg-white rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, myAchievementPct)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-blue-200 mt-1 font-semibold">
                      <span>₹0</span>
                      <span className="font-bold text-white">
                        {myAchievementPct}% achieved
                      </span>
                      <span>{loading ? "..." : formatINR(myTargetRupees)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Row 1: 6 KPI Metric Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {/* 1. Total Leads Assigned */}
                <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Total Leads Assigned
                    </span>
                    <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-900">
                      {loading ? "..." : totalLeadsCount}
                    </div>
                    <div
                      className={`text-[10px] font-bold mt-0.5 ${leadsTrend.isUp ? "text-emerald-600" : leadsTrend.neutral ? "text-slate-400" : "text-rose-600"}`}
                    >
                      {leadsTrend.text}
                    </div>
                  </div>
                </div>

                {/* 2. Total Conversions */}
                <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Total Conversions
                    </span>
                    <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-900">
                      {loading ? "..." : convertedLeadsCount}
                    </div>
                    <div
                      className={`text-[10px] font-bold mt-0.5 ${conversionsTrend.isUp ? "text-emerald-600" : conversionsTrend.neutral ? "text-slate-400" : "text-rose-600"}`}
                    >
                      {conversionsTrend.text}
                    </div>
                  </div>
                </div>

                {/* 3. Total Orders */}
                <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Total Orders
                    </span>
                    <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-900">
                      {loading ? "..." : totalOrdersCount}
                    </div>
                    <div
                      className={`text-[10px] font-bold mt-0.5 ${ordersTrend.isUp ? "text-emerald-600" : ordersTrend.neutral ? "text-slate-400" : "text-rose-600"}`}
                    >
                      {ordersTrend.text}
                    </div>
                  </div>
                </div>

                {/* 4. Total Order Value */}
                <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Total Order Value
                    </span>
                    <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <DollarSign className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-black text-slate-900 truncate">
                      {loading ? "..." : formatINR(totalOrderValueRupees)}
                    </div>
                    <div
                      className={`text-[10px] font-bold mt-0.5 ${orderValueTrend.isUp ? "text-emerald-600" : orderValueTrend.neutral ? "text-slate-400" : "text-rose-600"}`}
                    >
                      {orderValueTrend.text}
                    </div>
                  </div>
                </div>

                {/* 5. Collection (Received) */}
                <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Collection (Received)
                    </span>
                    <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-black text-slate-900 truncate">
                      {loading ? "..." : formatINR(totalCollectionRupees)}
                    </div>
                    <div
                      className={`text-[10px] font-bold mt-0.5 ${collectionTrend.isUp ? "text-emerald-600" : collectionTrend.neutral ? "text-slate-400" : "text-rose-600"}`}
                    >
                      {collectionTrend.text}
                    </div>
                  </div>
                </div>

                {/* 6. Overall Achievement */}
                <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Overall Achievement
                    </span>
                    <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                      <Award className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-900">
                      {loading ? "..." : `${overallAchievementPct}%`}
                    </div>
                    <div className="text-[10px] font-bold text-teal-600 mt-0.5">
                      {totalTargetRupees > 0
                        ? `Target: ${formatINR(totalTargetRupees)}`
                        : "No Target Configured"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Individual Performance Table (8 Cols) + Right Cards (4 Cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Table Container */}
                <div className="lg:col-span-8 bg-white rounded-md p-5 border border-slate-200/90 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Individual Performance
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Performance of team members for{" "}
                        {timeframe.toLowerCase()}
                      </p>
                    </div>

                    {/* Search filter input */}
                    <div className="relative w-full sm:w-48">
                      <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search executive..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                          <th className="pb-3 w-6">#</th>
                          <th className="pb-3">Executive</th>
                          <th className="pb-3 text-center">Leads Assigned</th>
                          <th className="pb-3 text-center">Conversions</th>
                          <th className="pb-3 text-center">Conversion %</th>
                          <th className="pb-3 text-center">Orders</th>
                          <th className="pb-3">Order Value</th>
                          <th className="pb-3">Collection</th>
                          <th className="pb-3">Achievement</th>
                          <th className="pb-3 text-right">Rating</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loading ? (
                          <tr>
                            <td
                              colSpan={10}
                              className="py-8 text-center text-slate-400 text-xs"
                            >
                              Loading performance metrics...
                            </td>
                          </tr>
                        ) : filteredExecutives.length === 0 ? (
                          <tr>
                            <td
                              colSpan={10}
                              className="py-8 text-center text-slate-400 text-xs"
                            >
                              No sales executive records found for this period.
                            </td>
                          </tr>
                        ) : (
                          filteredExecutives.map((exec) => (
                            <tr
                              key={exec.id || exec.rank}
                              className="hover:bg-slate-50/80 transition-colors"
                            >
                              <td className="py-3.5 font-bold text-slate-400">
                                {exec.rank}
                              </td>
                              <td className="py-3.5">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-7 h-7 rounded-full ${exec.avatarColor} text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-xs`}
                                  >
                                    {exec.avatar}
                                  </div>
                                  <div className="min-w-0 max-w-[140px]">
                                    <p className="font-bold text-slate-900 leading-tight truncate">
                                      {exec.name}
                                    </p>
                                    <p className="text-[10px] text-slate-400 truncate">
                                      {exec.role}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 text-center">
                                <span className="font-bold text-slate-800">
                                  {exec.leads}
                                </span>
                                <span className="block text-[9px] font-bold text-slate-400">
                                  {exec.leadsDelta}
                                </span>
                              </td>
                              <td className="py-3.5 text-center">
                                <span className="font-bold text-slate-800">
                                  {exec.conversions}
                                </span>
                                <span className="block text-[9px] font-bold text-slate-400">
                                  {exec.conversionsDelta}
                                </span>
                              </td>
                              <td className="py-3.5 text-center font-bold text-slate-800">
                                {exec.convRate}
                              </td>
                              <td className="py-3.5 text-center">
                                <span className="font-bold text-slate-800">
                                  {exec.orders}
                                </span>
                                <span className="block text-[9px] font-bold text-slate-400">
                                  {exec.ordersDelta}
                                </span>
                              </td>
                              <td className="py-3.5 font-bold text-slate-800">
                                {exec.orderValueFormatted}
                              </td>
                              <td className="py-3.5 font-bold text-slate-800">
                                {exec.collectionFormatted}
                              </td>
                              <td className="py-3.5">
                                <span className="font-bold text-slate-800 text-xs">
                                  {exec.achievement}
                                </span>
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                  <div
                                    className={`h-full ${exec.barColor} rounded-full transition-all duration-500`}
                                    style={{
                                      width: `${Math.min(exec.achievementNum, 100)}%`,
                                    }}
                                  />
                                </div>
                              </td>
                              <td className="py-3.5 text-right">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                                  ★ {exec.rating}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-200 font-bold text-slate-900 text-xs">
                          <td colSpan={2} className="pt-3">
                            Total / Average
                          </td>
                          <td className="pt-3 text-center">
                            {totalLeadsCount}
                          </td>
                          <td className="pt-3 text-center">
                            {convertedLeadsCount}
                          </td>
                          <td className="pt-3 text-center">
                            {totalLeadsCount > 0
                              ? `${((convertedLeadsCount / totalLeadsCount) * 100).toFixed(1)}%`
                              : "0%"}
                          </td>
                          <td className="pt-3 text-center">
                            {totalOrdersCount}
                          </td>
                          <td className="pt-3">
                            {formatINR(totalOrderValueRupees)}
                          </td>
                          <td className="pt-3">
                            {formatINR(totalCollectionRupees)}
                          </td>
                          <td className="pt-3">{overallAchievementPct}%</td>
                          <td className="pt-3 text-right" />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Right Cards Column */}
                <div className="lg:col-span-4 space-y-4">
                  {/* 1. Target vs Achievement */}
                  <div className="bg-white rounded-md p-5 border border-slate-200/90 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900">
                        Target vs Achievement
                      </h3>
                      <Link
                        href="/dashboard/sales-target"
                        className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                      >
                        Set Targets <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    </div>

                    <div className="flex items-center gap-5">
                      {/* Gauge SVG */}
                      <div className="w-24 h-24 relative flex items-center justify-center shrink-0">
                        <svg
                          className="w-full h-full -rotate-90"
                          viewBox="0 0 36 36"
                        >
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#E2E8F0"
                            strokeWidth="3.5"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#06B6D4"
                            strokeWidth="3.5"
                            strokeDasharray={`${teamTargetProgress}, 100`}
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-base font-extrabold text-slate-900 leading-none">
                            {overallAchievementPct}%
                          </span>
                          <span className="text-[8px] text-slate-400 font-medium mt-0.5">
                            Overall Ach.
                          </span>
                        </div>
                      </div>

                      {/* Target values */}
                      <div className="space-y-1.5 text-xs flex-1">
                        <div className="flex justify-between text-slate-500">
                          <span>Target:</span>
                          <span className="font-bold text-slate-900 truncate max-w-[110px]">
                            {totalTargetRupees > 0
                              ? formatINR(totalTargetRupees)
                              : "Not Set"}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Achieved:</span>
                          <span className="font-bold text-slate-900 truncate max-w-[110px]">
                            {formatINR(totalOrderValueRupees)}
                          </span>
                        </div>
                        <div className="flex justify-between text-emerald-600 font-bold pt-1 border-t border-slate-100">
                          <span>Achievement:</span>
                          <span>{overallAchievementPct}%</span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl text-center text-xs font-bold ${
                        overallAchievementPct >= 100
                          ? "bg-emerald-50 border border-emerald-100 text-emerald-800"
                          : "bg-blue-50 border border-blue-100 text-blue-800"
                      }`}
                    >
                      {totalTargetRupees > 0
                        ? overallAchievementPct >= 100
                          ? `Exceeded team target by ${overallAchievementPct - 100}% this period!`
                          : `Remaining to goal: ${formatINR(Math.max(0, totalTargetRupees - totalOrderValueRupees))}`
                        : `Total confirmed orders: ${formatINR(totalOrderValueRupees)}`}
                    </div>
                  </div>

                  {/* 2. Performance by Activity */}
                  <div className="bg-white rounded-md p-5 border border-slate-200/90 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900">
                        Performance by Activity
                      </h3>
                      <Link
                        href="/dashboard/followups"
                        className="text-[10px] font-bold text-blue-600 hover:underline"
                      >
                        View Activities
                      </Link>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Activity Donut SVG */}
                      <div className="w-24 h-24 relative flex items-center justify-center shrink-0">
                        <svg
                          className="w-full h-full -rotate-90"
                          viewBox="0 0 36 36"
                        >
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#E2E8F0"
                            strokeWidth="4"
                          />
                          {activityMetrics.total > 0 && (
                            <>
                              <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#3B82F6"
                                strokeWidth="4"
                                strokeDasharray={`${activityMetrics.callsPct}, 100`}
                              />
                              <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#10B981"
                                strokeWidth="4"
                                strokeDasharray={`${activityMetrics.whatsappPct}, 100`}
                                strokeDashoffset={`-${activityMetrics.callsPct}`}
                              />
                              <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#8B5CF6"
                                strokeWidth="4"
                                strokeDasharray={`${activityMetrics.meetingsPct}, 100`}
                                strokeDashoffset={`-${activityMetrics.callsPct + activityMetrics.whatsappPct}`}
                              />
                            </>
                          )}
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-base font-extrabold text-slate-900 leading-none">
                            {activityMetrics.total}
                          </span>
                          <span className="text-[7px] text-slate-400 font-medium mt-0.5">
                            Total Acts
                          </span>
                        </div>
                      </div>

                      {/* Legend list */}
                      <div className="space-y-1 text-[11px] flex-1">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-600">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />{" "}
                            Calls
                          </span>
                          <span className="font-bold text-slate-800">
                            {activityMetrics.callsPct}% ({activityMetrics.calls}
                            )
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-600">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />{" "}
                            WhatsApp
                          </span>
                          <span className="font-bold text-slate-800">
                            {activityMetrics.whatsappPct}% (
                            {activityMetrics.whatsapp})
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-600">
                            <span className="w-2 h-2 rounded-full bg-purple-500" />{" "}
                            Meetings
                          </span>
                          <span className="font-bold text-slate-800">
                            {activityMetrics.meetingsPct}% (
                            {activityMetrics.meetings})
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-600">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />{" "}
                            Follow-ups
                          </span>
                          <span className="font-bold text-slate-800">
                            {activityMetrics.followupsPct}% (
                            {activityMetrics.followupsCount})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Performance Trend + Conversion Funnel + Top Performers */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Performance Trend (6 Cols) */}
                <div className="lg:col-span-6 bg-white rounded-md p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold text-slate-900">
                        Performance Trend
                      </h3>
                      <div className="flex items-center gap-4 text-[10px] font-bold">
                        <span className="flex items-center gap-1 text-blue-600">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />{" "}
                          Leads ({totalLeadsCount})
                        </span>
                        <span className="flex items-center gap-1 text-emerald-600">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />{" "}
                          Orders ({totalOrdersCount})
                        </span>
                        <span className="flex items-center gap-1 text-purple-600">
                          <span className="w-2 h-2 rounded-full bg-purple-500" />{" "}
                          Collections ({formatINR(totalCollectionRupees)})
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Responsive SVG Line Chart */}
                    <div className="h-44 w-full pt-4">
                      <svg
                        className="w-full h-full overflow-visible"
                        viewBox="0 0 400 120"
                        preserveAspectRatio="none"
                      >
                        <line
                          x1="0"
                          y1="20"
                          x2="400"
                          y2="20"
                          stroke="#F1F5F9"
                          strokeWidth="1"
                          strokeDasharray="3,3"
                        />
                        <line
                          x1="0"
                          y1="50"
                          x2="400"
                          y2="50"
                          stroke="#F1F5F9"
                          strokeWidth="1"
                          strokeDasharray="3,3"
                        />
                        <line
                          x1="0"
                          y1="80"
                          x2="400"
                          y2="80"
                          stroke="#F1F5F9"
                          strokeWidth="1"
                          strokeDasharray="3,3"
                        />
                        <line
                          x1="0"
                          y1="110"
                          x2="400"
                          y2="110"
                          stroke="#E2E8F0"
                          strokeWidth="1"
                        />

                        {/* Visual Curves calculated from data */}
                        <path
                          d={
                            totalLeadsCount > 0
                              ? "M0,85 Q60,50 120,65 T240,35 T320,45 T400,25"
                              : "M0,110 L400,110"
                          }
                          fill="none"
                          stroke="#3B82F6"
                          strokeWidth="2.5"
                        />
                        <path
                          d={
                            totalCollectionRupees > 0
                              ? "M0,105 Q60,90 120,80 T240,60 T320,50 T400,38"
                              : "M0,110 L400,110"
                          }
                          fill="none"
                          stroke="#8B5CF6"
                          strokeWidth="2.5"
                        />
                        <path
                          d={
                            totalOrdersCount > 0
                              ? "M0,110 Q60,95 120,90 T240,75 T320,65 T400,50"
                              : "M0,110 L400,110"
                          }
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="2.5"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold pt-2 border-t border-slate-100">
                    <span>Start</span>
                    <span>W1</span>
                    <span>W2</span>
                    <span>W3</span>
                    <span>W4</span>
                    <span>Current</span>
                  </div>
                </div>

                {/* Conversion Funnel (3 Cols) */}
                <div className="lg:col-span-3 bg-white rounded-md p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <h3 className="text-xs font-bold text-slate-900 mb-2">
                    Conversion Funnel
                  </h3>

                  <div className="space-y-1.5 text-xs font-semibold py-2">
                    <div className="p-2 rounded-xl bg-blue-500 text-white text-center shadow-xs">
                      <div className="text-xs font-black">
                        {funnelMetrics.total}
                      </div>
                      <div className="text-[9px] opacity-80">Total Leads</div>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-500 text-white text-center shadow-xs mx-2">
                      <div className="text-xs font-black">
                        {funnelMetrics.qualified} ({funnelMetrics.qualifiedPct}
                        %)
                      </div>
                      <div className="text-[9px] opacity-80">
                        Qualified / In Progress
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-purple-500 text-white text-center shadow-xs mx-4">
                      <div className="text-xs font-black">
                        {funnelMetrics.quotationsCount} (
                        {funnelMetrics.quotationsPct}%)
                      </div>
                      <div className="text-[9px] opacity-80">
                        Quotations / Negotiations
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-amber-500 text-slate-900 text-center shadow-xs mx-6">
                      <div className="text-xs font-black">
                        {funnelMetrics.wonCount} ({funnelMetrics.wonPct}%)
                      </div>
                      <div className="text-[9px] opacity-80">Orders Won</div>
                    </div>
                  </div>

                  <div className="text-center text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                    Overall Conversion Rate:{" "}
                    <span className="text-emerald-600 font-bold">
                      {funnelMetrics.throughput}%
                    </span>
                  </div>
                </div>

                {/* Top Performers Card (3 Cols) */}
                <div className="lg:col-span-3 bg-white rounded-md p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 mb-3">
                      Top Performers ({timeframe})
                    </h3>

                    <div className="space-y-3">
                      {topPerformers.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          No performance rankings available yet.
                        </div>
                      ) : (
                        topPerformers.map((p) => (
                          <div
                            key={p.rank}
                            className="flex items-center justify-between text-xs py-1"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-7 h-7 rounded-full ${p.avatarColor} text-white flex items-center justify-center text-[10px] font-bold shadow-xs`}
                              >
                                {p.avatar}
                              </div>
                              <div className="min-w-0 max-w-[90px]">
                                <p className="font-bold text-slate-900 leading-tight truncate">
                                  {p.name}
                                </p>
                                <p className="text-[9px] text-slate-400 truncate">
                                  {p.role}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-emerald-600 block leading-tight">
                                {p.achievement}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {p.orderValueFormatted}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-center">
                    <Link
                      href="/dashboard/leaderboard"
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1"
                    >
                      View Full Leaderboard <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Row 4: Performance Insights (4 Grid Tiles) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {insights.map((item, idx) => {
                  const IconComp = item.icon;
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-md ${item.bg} border ${item.border} flex items-center gap-3 transition-all`}
                    >
                      <IconComp
                        className={`w-5 h-5 ${item.iconColor} shrink-0`}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-xs font-bold ${item.textColor} truncate`}
                        >
                          {item.title}
                        </p>
                        <p
                          className={`text-[11px] ${item.descColor} line-clamp-2`}
                        >
                          {item.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: EXECUTIVE PERFORMANCE */}
          {activeTab === "Executive Performance" && (
            <div className="space-y-6">
              <div className="bg-white rounded-md p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Executive Directory & Metric Cards
                  </h2>
                  <p className="text-xs text-slate-500">
                    Comprehensive quota attainment and sales activities per
                    representative
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter by representative..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {filteredExecutives.length === 0 ? (
                <div className="bg-white rounded-md p-12 border border-slate-200/90 text-center text-slate-400">
                  <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">
                    No representatives match your search query
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Try searching for a different name or role
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredExecutives.map((exec) => (
                    <div
                      key={exec.id || exec.rank}
                      className="bg-white rounded-md p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-full ${exec.avatarColor} text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs`}
                          >
                            {exec.avatar}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 text-sm truncate">
                              {exec.name}
                            </h3>
                            <p className="text-[11px] text-slate-400 truncate">
                              {exec.email || exec.role}
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          #{exec.rank}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">
                            Leads
                          </span>
                          <strong className="text-slate-900 text-sm">
                            {exec.leads}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">
                            Orders
                          </span>
                          <strong className="text-slate-900 text-sm">
                            {exec.orders}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">
                            Win Rate
                          </span>
                          <strong className="text-emerald-600 text-sm">
                            {exec.convRate}
                          </strong>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-semibold">
                            Revenue Achieved:
                          </span>
                          <strong className="text-slate-900">
                            {exec.orderValueFormatted}
                          </strong>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-semibold">
                            Target Quota:
                          </span>
                          <strong className="text-slate-700">
                            {exec.targetRupees > 0
                              ? formatINR(exec.targetRupees)
                              : "Not Configured"}
                          </strong>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                          <div
                            className={`h-full ${exec.barColor} rounded-full transition-all duration-500`}
                            style={{
                              width: `${Math.min(exec.achievementNum, 100)}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 pt-1">
                          <span>{exec.achievement} Achieved</span>
                          <span className="text-emerald-700">
                            ★ {exec.rating} Rating
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500 text-[11px]">
                          Collections: {exec.collectionFormatted}
                        </span>
                        <Link
                          href={`/dashboard/leads?search=${encodeURIComponent(exec.name)}`}
                          className="font-bold text-blue-600 hover:underline text-[11px] flex items-center gap-0.5"
                        >
                          View Leads <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TEAM PERFORMANCE */}
          {activeTab === "Team Performance" && (
            <div className="space-y-6">
              {/* Team Highlights Card */}
              <div className="bg-gradient-to-br from-slate-900 to-blue-950 p-6 rounded-md text-white shadow-md space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                      Team Quota & Pacing
                    </span>
                    <h2 className="text-2xl font-black mt-1">
                      {formatINR(totalOrderValueRupees)}{" "}
                      <span className="text-sm font-normal text-slate-300">
                        /{" "}
                        {totalTargetRupees > 0
                          ? formatINR(totalTargetRupees)
                          : "No team cap set"}
                      </span>
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-3xl font-black text-amber-300">
                        {overallAchievementPct}%
                      </div>
                      <div className="text-[10px] text-blue-200">
                        Team Target Attainment
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full bg-white/15 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${teamTargetProgress}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-blue-300 block text-[11px]">
                      Active Executives
                    </span>
                    <strong className="text-base font-bold">
                      {executives.length}
                    </strong>
                  </div>
                  <div>
                    <span className="text-blue-300 block text-[11px]">
                      Total Won Orders
                    </span>
                    <strong className="text-base font-bold">
                      {totalOrdersCount}
                    </strong>
                  </div>
                  <div>
                    <span className="text-blue-300 block text-[11px]">
                      Total Pipeline Leads
                    </span>
                    <strong className="text-base font-bold">
                      {totalLeadsCount}
                    </strong>
                  </div>
                  <div>
                    <span className="text-blue-300 block text-[11px]">
                      Team Win Rate
                    </span>
                    <strong className="text-base font-bold">
                      {totalLeadsCount > 0
                        ? `${((convertedLeadsCount / totalLeadsCount) * 100).toFixed(1)}%`
                        : "0.0%"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Comparative Bar Chart across reps */}
              <div className="bg-white rounded-md p-6 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Comparative Revenue by Representative
                  </h3>
                  <span className="text-xs font-semibold text-slate-400">
                    {timeframe}
                  </span>
                </div>

                <div className="space-y-3 pt-2">
                  {executives.map((exec) => {
                    const maxVal = Math.max(
                      ...executives.map((e) => e.orderValue),
                      1,
                    );
                    const widthPct = Math.max(
                      5,
                      Math.round((exec.orderValue / maxVal) * 100),
                    );

                    return (
                      <div key={exec.id || exec.rank} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-slate-800">
                            {exec.name}
                          </span>
                          <span className="font-bold text-slate-900">
                            {exec.orderValueFormatted}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ACTIVITY PERFORMANCE */}
          {activeTab === "Activity Performance" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500">
                      Total Activities
                    </span>
                    <Activity className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {activityMetrics.total}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Logged interactions
                  </span>
                </div>

                <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500">
                      Phone Calls
                    </span>
                    <PhoneCall className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {activityMetrics.calls}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    {activityMetrics.callsPct}% of volume
                  </span>
                </div>

                <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500">
                      WhatsApp Chats
                    </span>
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {activityMetrics.whatsapp}
                  </div>
                  <span className="text-[10px] text-purple-600 font-bold">
                    {activityMetrics.whatsappPct}% of volume
                  </span>
                </div>

                <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500">
                      Meetings
                    </span>
                    <Users className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {activityMetrics.meetings}
                  </div>
                  <span className="text-[10px] text-amber-600 font-bold">
                    {activityMetrics.meetingsPct}% of volume
                  </span>
                </div>
              </div>

              {/* Activity breakdown table */}
              <div className="bg-white rounded-md p-5 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Activity Log Pacing
                    </h3>
                    <p className="text-xs text-slate-500">
                      Recent follow-up actions recorded in this timeframe
                    </p>
                  </div>
                  <Link
                    href="/dashboard/followups"
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Open Follow-ups View <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="divide-y divide-slate-100">
                  {currentFollowups.slice(0, 10).map((act, idx) => (
                    <div
                      key={act._id || idx}
                      className="py-3 flex items-center justify-between text-xs gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          {act.type === "CALL" ? (
                            <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                          ) : act.type === "WHATSAPP" ? (
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <strong className="text-slate-900 block truncate">
                            {act.notes ||
                              act.title ||
                              `Follow-up on ${act.channel || act.type || "Lead"}`}
                          </strong>
                          <span className="text-[10px] text-slate-400">
                            {act.scheduledAt
                              ? new Date(act.scheduledAt).toLocaleDateString(
                                  "en-IN",
                                )
                              : "Scheduled"}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          act.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : act.status === "CANCELLED"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {act.status || "PENDING"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TARGETS VS ACHIEVEMENT */}
          {activeTab === "Targets vs Achievement" && (
            <div className="space-y-6">
              <div className="bg-white rounded-md p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Commercial Target Matrix
                  </h2>
                  <p className="text-xs text-slate-500">
                    Real-time sales target tracking derived strictly from
                    confirmed won orders
                  </p>
                </div>
                <Link
                  href="/dashboard/sales-target"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-600/25 transition-all flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Target className="w-3.5 h-3.5" />
                  Manage Sales Targets
                </Link>
              </div>

              <div className="bg-white rounded-md p-5 border border-slate-200/90 shadow-xs overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                      <th className="pb-3">Executive</th>
                      <th className="pb-3">Target (INR)</th>
                      <th className="pb-3">Achieved (INR)</th>
                      <th className="pb-3">Remaining (INR)</th>
                      <th className="pb-3">Target Orders</th>
                      <th className="pb-3">Orders Won</th>
                      <th className="pb-3">Achievement %</th>
                      <th className="pb-3 text-right">Run Rate Req.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {executives.map((exec) => (
                      <tr
                        key={exec.id || exec.rank}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-3.5 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-full ${exec.avatarColor} text-white flex items-center justify-center text-[10px] font-bold`}
                            >
                              {exec.avatar}
                            </div>
                            <span>{exec.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 font-bold text-slate-700">
                          {exec.targetRupees > 0
                            ? formatINR(exec.targetRupees)
                            : "Not Set"}
                        </td>
                        <td className="py-3.5 font-bold text-emerald-600">
                          {exec.orderValueFormatted}
                        </td>
                        <td className="py-3.5 text-slate-600">
                          {exec.targetRupees > 0
                            ? formatINR(
                                Math.max(
                                  0,
                                  exec.targetRupees - exec.orderValue,
                                ),
                              )
                            : "₹0"}
                        </td>
                        <td className="py-3.5 text-slate-700">
                          {exec.targetOrdersCount || "-"}
                        </td>
                        <td className="py-3.5 font-bold text-slate-900">
                          {exec.orders}
                        </td>
                        <td className="py-3.5">
                          <span className="font-bold text-slate-900 block">
                            {exec.achievement}
                          </span>
                          <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full ${exec.barColor} rounded-full`}
                              style={{
                                width: `${Math.min(exec.achievementNum, 100)}%`,
                              }}
                            />
                          </div>
                        </td>
                        <td className="py-3.5 text-right font-mono font-bold text-slate-700">
                          {exec.requiredPerDayRupees > 0
                            ? `${formatINR(exec.requiredPerDayRupees)}/day`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
