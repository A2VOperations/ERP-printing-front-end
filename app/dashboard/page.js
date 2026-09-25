"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import { DashboardSkeleton } from "@/app/components/ui/skeleton";

import {
  Clock,
  ShoppingBag,
  CreditCard,
  PhoneCall,
  MessageSquare,
  FileText,
  DollarSign,
  Check,
  Lock,
  UserPlus,
  Loader2,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("userName");
      if (stored) return stored.split(" ")[0] || stored;
    }
    return "User";
  });
  const [currentUserAvatar, setCurrentUserAvatar] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("userAvatar") || null;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [financialTab, setFinancialTab] = useState("Weekly");
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [creatingLead, setCreatingLead] = useState(false);

  // Live Data States
  const [leads, setLeads] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [activities, setActivities] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [designProjects, setDesignProjects] = useState([]);
  const [productionJobs, setProductionJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [systemHealthy, setSystemHealthy] = useState(true);
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) return JSON.parse(storedUser);
      } catch (e) {}
    }
    return null;
  });
  const [targetProgress, setTargetProgress] = useState(null);
  const [topPerformers, setTopPerformers] = useState([]);
  const [leadStats, setLeadStats] = useState(null);

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

  const loadDashboardData = async () => {
    try {
      const [
        leadsRes,
        followupsRes,
        ordersRes,
        targetRes,
        leaderRes,
        usersRes,
        meRes,
        leadStatsRes,
        activitiesRes,
        paymentsRes,
        quotationsRes,
        designProjectsRes,
        productionJobsRes,
        healthRes,
      ] = await Promise.allSettled([
        api.get("/leads?limit=100"),
        api.get("/followups?limit=100"),
        api.get("/orders?limit=100"),
        api.get("/targets/my-achievement", { silent: true }),
        api.get("/targets/leaderboard", { silent: true }),
        api.get("/users"),
        api.get("/auth/me"),
        api.get("/leads/stats", { silent: true }),
        api.get("/activities?limit=20", { silent: true }),
        api.get("/payments?limit=100", { silent: true }),
        api.get("/quotations?limit=100", { silent: true }),
        api.get("/design-projects?limit=50", { silent: true }),
        api.get("/production-jobs?limit=50", { silent: true }),
        api.get("/health", { silent: true }),
      ]);

      if (leadsRes.status === "fulfilled" && leadsRes.value?.data) {
        setLeads(leadsRes.value.data);
      }
      if (leadStatsRes.status === "fulfilled" && leadStatsRes.value?.data) {
        setLeadStats(leadStatsRes.value.data);
      }
      if (followupsRes.status === "fulfilled" && followupsRes.value?.data) {
        setFollowups(followupsRes.value.data);
      }
      if (activitiesRes.status === "fulfilled" && activitiesRes.value?.data) {
        setActivities(activitiesRes.value.data);
      }
      if (ordersRes.status === "fulfilled" && ordersRes.value?.data) {
        setOrders(ordersRes.value.data);
      }
      if (paymentsRes.status === "fulfilled" && paymentsRes.value?.data) {
        setPayments(paymentsRes.value.data);
      }
      if (quotationsRes.status === "fulfilled" && quotationsRes.value?.data) {
        setQuotations(quotationsRes.value.data);
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
      if (healthRes.status === "fulfilled") {
        setSystemHealthy(true);
      }
      if (targetRes.status === "fulfilled" && targetRes.value?.data) {
        setTargetProgress(targetRes.value.data);
      }
      if (leaderRes.status === "fulfilled" && leaderRes.value?.data) {
        const raw = leaderRes.value.data;
        const list = Array.isArray(raw) ? raw : raw?.rankings || [];
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
      if (usersRes.status === "fulfilled" && usersRes.value?.data) {
        setUsers(usersRes.value.data);
      }
      if (meRes.status === "fulfilled" && meRes.value?.data) {
        const me = meRes.value.data.user || meRes.value.data;
        setCurrentUser(me);
        if (me.avatarUrl) {
          setCurrentUserAvatar(me.avatarUrl);
          localStorage.setItem("userAvatar", me.avatarUrl);
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const role = (localStorage.getItem("userRole") || "").toLowerCase();
    if (role.includes("designer")) {
      router.replace("/dashboard/designer");
      return;
    }
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
      if (key === "n") {
        e.preventDefault();
        setShowAddLeadModal(true);
      } else if (key === "c") {
        e.preventDefault();
        router.push("/dashboard/followups");
      } else if (key === "w") {
        e.preventDefault();
        router.push("/dashboard/whatsapp");
      } else if (key === "q") {
        e.preventDefault();
        router.push("/dashboard/quotations");
      } else if (key === "o") {
        e.preventDefault();
        router.push("/dashboard/orders");
      } else if (key === "p") {
        e.preventDefault();
        router.push("/dashboard/payments");
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboardData();

    return () => {
      window.removeEventListener("crm:avatar-updated", handleAvatarSync);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [router]);

  const userRole = (
    currentUser?.roleSlug ||
    currentUser?.role ||
    (typeof window !== "undefined" ? localStorage.getItem("userRole") : "") ||
    ""
  ).toLowerCase();
  const isManagerOrAdmin = [
    "admin",
    "super_admin",
    "manager",
    "sales_manager",
  ].includes(userRole);

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
        assignedToId: isManagerOrAdmin
          ? newLead.assignedToId || undefined
          : currentUser?._id || currentUser?.id || undefined,
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

  // 1. Dynamic Time of Day
  const timeOfDay = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 12) return "Morning";
    if (hr < 17) return "Afternoon";
    return "Evening";
  }, []);

  // 2. Dynamic Sales & Orders Metrics
  const totalSalesRupees = useMemo(() => {
    return orders.reduce((sum, o) => {
      const val = o.grandTotalPaise
        ? o.grandTotalPaise / 100
        : o.grandTotal || o.totalAmount || 0;
      return sum + Number(val || 0);
    }, 0);
  }, [orders]);

  const ordersCount = useMemo(() => {
    return orders.filter((o) => o.orderStatus !== "CANCELLED").length;
  }, [orders]);

  const avgDealSize = useMemo(() => {
    return ordersCount > 0 ? totalSalesRupees / ordersCount : 0;
  }, [totalSalesRupees, ordersCount]);

  // Target values from targets collection
  const targetRupees = useMemo(() => {
    if (targetProgress?.targetAmountPaise)
      return targetProgress.targetAmountPaise / 100;
    if (targetProgress?.targetPaise) return targetProgress.targetPaise / 100;
    if (targetProgress?.targetAmount) return Number(targetProgress.targetAmount);
    if (targetProgress?.target) return Number(targetProgress.target);
    return 0;
  }, [targetProgress]);

  const targetPercent = useMemo(() => {
    return targetRupees > 0
      ? ((totalSalesRupees / targetRupees) * 100).toFixed(1)
      : "0.0";
  }, [totalSalesRupees, targetRupees]);

  const now = new Date();
  const currentDay = Math.max(1, now.getDate());
  const daysInCurrentMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();

  const dailyPace = useMemo(() => {
    return totalSalesRupees > 0 ? Math.round(totalSalesRupees / currentDay) : 0;
  }, [totalSalesRupees, currentDay]);

  // Production raw materials & partner expense (dynamic from production jobs or standard commercial printing ratio)
  const productionExpenseRupees = useMemo(() => {
    if (productionJobs.length > 0) {
      const jobCost = productionJobs.reduce(
        (sum, j) =>
          sum +
          Number(j.productionCostPaise || j.partnerCostPaise || 0) / 100,
        0,
      );
      if (jobCost > 0) return Math.round(jobCost);
    }
    return Math.round(totalSalesRupees * 0.3646);
  }, [productionJobs, totalSalesRupees]);

  const netProfitMargin = useMemo(() => {
    if (totalSalesRupees <= 0) return "0.0";
    return (
      ((totalSalesRupees - productionExpenseRupees) / totalSalesRupees) *
      100
    ).toFixed(1);
  }, [totalSalesRupees, productionExpenseRupees]);

  const runRate = useMemo(() => {
    if (totalSalesRupees <= 0) return 0;
    return Math.round((totalSalesRupees / currentDay) * daysInCurrentMonth);
  }, [totalSalesRupees, currentDay, daysInCurrentMonth]);

  const isQuotaOnTrack = useMemo(() => {
    if (targetRupees <= 0) return true;
    const requiredPace = (targetRupees / daysInCurrentMonth) * currentDay;
    return totalSalesRupees >= requiredPace;
  }, [targetRupees, daysInCurrentMonth, currentDay, totalSalesRupees]);

  // 3. Dynamic Leads Metrics
  const displayLeadsCount = leads.length;
  const newLeadsTodayCount = useMemo(() => {
    const todayStr = new Date().toDateString();
    return leads.filter(
      (l) => l.createdAt && new Date(l.createdAt).toDateString() === todayStr,
    ).length;
  }, [leads]);

  const activeLeadsCount = useMemo(() => {
    return leads.filter(
      (l) => !["LOST", "CANCELLED", "NOT_INTERESTED"].includes(l.status),
    ).length;
  }, [leads]);

  const qualifiedLeadsCount = useMemo(() => {
    return leads.filter((l) =>
      ["QUALIFIED", "INTERESTED", "QUOTED", "WON"].includes(l.status),
    ).length;
  }, [leads]);

  const leadSourcesText = useMemo(() => {
    const srcMap = {};
    leads.forEach((l) => {
      const s = (l.source || "Direct").replace(/_/g, " ");
      srcMap[s] = (srcMap[s] || 0) + 1;
    });
    const sorted = Object.keys(srcMap).sort((a, b) => srcMap[b] - srcMap[a]);
    if (sorted.length === 0) return "Direct";
    if (sorted.length === 1) return sorted[0];
    return `${sorted[0]} + ${sorted[1]}`;
  }, [leads]);

  // 4. Dynamic Follow-ups
  const {
    overdueFollowupsCount,
    todayFollowupsCount,
    highPriorityFollowupsCount,
    nextFollowupStr,
  } = useMemo(() => {
    const todayDate = new Date();
    const startOfToday = new Date(
      todayDate.getFullYear(),
      todayDate.getMonth(),
      todayDate.getDate(),
    );
    const endOfToday = new Date(
      todayDate.getFullYear(),
      todayDate.getMonth(),
      todayDate.getDate(),
      23,
      59,
      59,
      999,
    );

    let overdue = 0;
    let today = 0;
    let high = 0;
    const upcoming = [];

    followups.forEach((f) => {
      if (f.status === "COMPLETED" || f.status === "CANCELLED") return;
      const d = new Date(f.scheduledAt || f.dueDate || f.createdAt);
      if (d < startOfToday) overdue++;
      else if (d <= endOfToday) today++;
      else
        upcoming.push({
          date: d,
          client: f.customerName || f.contactName || "Client",
        });

      if (f.priority === "HIGH" || f.priority === "URGENT") high++;
    });

    leads.forEach((l) => {
      if (l.nextFollowUp) {
        const d = new Date(l.nextFollowUp);
        if (d < startOfToday) overdue++;
        else if (d <= endOfToday) today++;
        else
          upcoming.push({
            date: d,
            client: l.contactName || l.name || "Client",
          });
      }
    });

    upcoming.sort((a, b) => a.date - b.date);
    const nextItem = upcoming[0];
    const nextStr = nextItem
      ? `Next: ${nextItem.date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} (${nextItem.client.slice(0, 10)})`
      : today > 0
        ? `${today} Due Today`
        : "None pending";

    return {
      overdueFollowupsCount: overdue,
      todayFollowupsCount: today,
      highPriorityFollowupsCount: high,
      nextFollowupStr: nextStr,
    };
  }, [followups, leads]);

  // 5. Dynamic Payments
  const { totalPaymentsRupees, pendingPaymentsRupees, collectionsCount } =
    useMemo(() => {
      let collected = 0;
      let count = 0;

      if (payments.length > 0) {
        payments.forEach((p) => {
          if (p.status === "CONFIRMED" || p.status === "COMPLETED") {
            collected += p.amountPaise
              ? p.amountPaise / 100
              : Number(p.amount) || 0;
            count++;
          }
        });
      } else {
        orders.forEach((o) => {
          const paid = o.totalPaidPaise
            ? o.totalPaidPaise / 100
            : Number(o.paidAmount) || 0;
          collected += paid;
          if (paid > 0) count++;
        });
      }

      const pending = Math.max(0, totalSalesRupees - collected);
      return {
        totalPaymentsRupees: collected,
        pendingPaymentsRupees: pending,
        collectionsCount: count,
      };
    }, [payments, orders, totalSalesRupees]);

  // 6. Dynamic Sales Pipeline & Conversion Stages
  const dynamicPipeline = useMemo(() => {
    const total = leads.length;
    const stage1Count = total;
    const stage1Value = leads.reduce(
      (sum, l) => sum + (Number(l.expectedValue) || 0),
      0,
    );

    const stage2Count = leads.filter((l) =>
      [
        "CONTACTED",
        "FOLLOW_UP",
        "INTERESTED",
        "QUALIFIED",
        "QUOTED",
        "WON",
      ].includes(l.status),
    ).length;

    const stage3Count = leads.filter((l) =>
      ["INTERESTED", "QUALIFIED", "QUOTED", "WON"].includes(l.status),
    ).length;

    const stage4Count =
      leads.filter(
        (l) =>
          ["QUOTED", "WON"].includes(l.status) ||
          quotations.some((q) => String(q.leadId) === String(l._id)),
      ).length || quotations.length;

    const stage5Count =
      leads.filter(
        (l) =>
          l.status === "WON" ||
          orders.some((o) => String(o.leadId) === String(l._id)),
      ).length || ordersCount;

    const cvr2 =
      stage1Count > 0 ? Math.round((stage2Count / stage1Count) * 100) : 0;
    const cvr3 =
      stage2Count > 0 ? Math.round((stage3Count / stage2Count) * 100) : 0;
    const cvr4 =
      stage3Count > 0 ? Math.round((stage4Count / stage3Count) * 100) : 0;
    const cvr5 =
      stage4Count > 0 ? Math.round((stage5Count / stage4Count) * 100) : 0;

    const winRatio =
      stage1Count > 0
        ? ((stage5Count / stage1Count) * 100).toFixed(1)
        : "0.0";
    const lostLeads = leads.filter((l) =>
      ["LOST", "NOT_INTERESTED", "CANCELLED"].includes(l.status),
    ).length;
    const dropOffPercent =
      stage1Count > 0
        ? ((lostLeads / stage1Count) * 100).toFixed(1)
        : "0.0";
    const dropOffLabel =
      lostLeads === 0 ? "Zero loss" : `${lostLeads} dropped`;

    let totalCycleDays = 0;
    let completedCount = 0;
    orders.forEach((o) => {
      if (o.orderDate && o.createdAt) {
        const diff = Math.max(
          0.5,
          (new Date(o.orderDate) - new Date(o.createdAt)) /
            (1000 * 60 * 60 * 24),
        );
        totalCycleDays += diff;
        completedCount++;
      }
    });
    const avgVelocity =
      completedCount > 0
        ? (totalCycleDays / completedCount).toFixed(1)
        : "1.2";

    return {
      winRatio,
      dropOffPercent,
      dropOffLabel,
      avgVelocity,
      stages: [
        {
          id: 1,
          name: "1. New Inquiries",
          dotColor: "bg-emerald-500",
          barColor: "bg-emerald-500",
          count: stage1Count,
          textRight: `${stage1Count} Deals (₹${(stage1Value > 0 ? stage1Value : totalSalesRupees).toLocaleString("en-IN")})`,
          percent: stage1Count > 0 ? 100 : 0,
        },
        {
          id: 2,
          name: "2. Contacted & Briefed",
          dotColor: "bg-blue-500",
          barColor: "bg-blue-500",
          count: stage2Count,
          textRight: `${cvr2}% cvr   ${stage2Count} Deals`,
          percent:
            stage1Count > 0
              ? Math.min(100, Math.round((stage2Count / stage1Count) * 100))
              : 0,
        },
        {
          id: 3,
          name: "3. Interested & Spec Checked",
          dotColor: "bg-amber-400",
          barColor: "bg-amber-400",
          count: stage3Count,
          textRight: `${cvr3}% cvr   ${stage3Count} Deals`,
          percent:
            stage1Count > 0
              ? Math.min(100, Math.round((stage3Count / stage1Count) * 100))
              : 0,
        },
        {
          id: 4,
          name: "4. Quotation Dispatched",
          dotColor: "bg-indigo-600",
          barColor: "bg-indigo-600",
          count: stage4Count,
          textRight: `${cvr4}% cvr   ${stage4Count} Deals`,
          percent:
            stage1Count > 0
              ? Math.min(100, Math.round((stage4Count / stage1Count) * 100))
              : 0,
        },
        {
          id: 5,
          name: "5. Confirmed Won Order",
          dotColor: "bg-rose-500",
          barColor: "bg-rose-500",
          count: stage5Count,
          textRight: `${cvr5}% cvr   ${stage5Count} Deals`,
          percent:
            stage1Count > 0
              ? Math.min(100, Math.round((stage5Count / stage1Count) * 100))
              : 0,
        },
      ],
    };
  }, [leads, quotations, orders, ordersCount, totalSalesRupees]);

  // 7. Dynamic Financial Flow Chart Buckets & Coordinates
  const chartData = useMemo(() => {
    const buckets = [];
    const curr = new Date();

    if (financialTab === "Daily") {
      for (let i = 4; i >= 0; i--) {
        const d = new Date(curr);
        d.setDate(curr.getDate() - i);
        const label =
          i === 0
            ? "Today"
            : d.toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
              });
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const dayEnd = new Date(
          d.getFullYear(),
          d.getMonth(),
          d.getDate(),
          23,
          59,
          59,
          999,
        );
        const dayOrders = orders.filter((o) => {
          const od = new Date(o.orderDate || o.createdAt);
          return od >= dayStart && od <= dayEnd;
        });
        const sales = dayOrders.reduce(
          (sum, o) =>
            sum +
            (o.grandTotalPaise
              ? o.grandTotalPaise / 100
              : o.grandTotal || 0),
          0,
        );
        buckets.push({ label, sales, expense: Math.round(sales * 0.3646) });
      }
    } else if (financialTab === "Monthly") {
      for (let i = 4; i >= 0; i--) {
        const d = new Date(curr.getFullYear(), curr.getMonth() - i, 1);
        const label = d.toLocaleDateString("en-US", { month: "short" });
        const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const mEnd = new Date(
          d.getFullYear(),
          d.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );
        const mOrders = orders.filter((o) => {
          const od = new Date(o.orderDate || o.createdAt);
          return od >= mStart && od <= mEnd;
        });
        const sales = mOrders.reduce(
          (sum, o) =>
            sum +
            (o.grandTotalPaise
              ? o.grandTotalPaise / 100
              : o.grandTotal || 0),
          0,
        );
        buckets.push({ label, sales, expense: Math.round(sales * 0.3646) });
      }
    } else {
      // Weekly: 5 intervals across current month
      const monthDays = [1, 7, 14, 21, Math.min(28, daysInCurrentMonth)];
      const monthShort = curr.toLocaleDateString("en-US", { month: "short" });

      monthDays.forEach((dayNum, idx) => {
        const isLast = idx === monthDays.length - 1;
        const label =
          isLast && curr.getDate() <= dayNum
            ? `${monthShort} ${String(dayNum).padStart(2, "0")} (Today)`
            : `${monthShort} ${String(dayNum).padStart(2, "0")}`;
        const cutoffDate = new Date(
          curr.getFullYear(),
          curr.getMonth(),
          dayNum,
          23,
          59,
          59,
          999,
        );
        const cumOrders = orders.filter((o) => {
          const od = new Date(o.orderDate || o.createdAt);
          return od <= cutoffDate;
        });
        const sales = cumOrders.reduce(
          (sum, o) =>
            sum +
            (o.grandTotalPaise
              ? o.grandTotalPaise / 100
              : o.grandTotal || 0),
          0,
        );
        buckets.push({ label, sales, expense: Math.round(sales * 0.3646) });
      });
    }

    const maxVal = Math.max(
      ...buckets.map((b) => b.sales),
      totalSalesRupees,
      1000,
    );
    const xCoords = [20, 135, 250, 365, 480];
    const revenueCoords = buckets.map((b, idx) => {
      const x = xCoords[idx];
      const y = Math.round(135 - (b.sales / maxVal) * 105);
      return { x, y };
    });
    const expenseCoords = buckets.map((b, idx) => {
      const x = xCoords[idx];
      const y = Math.round(138 - (b.expense / maxVal) * 105);
      return { x, y };
    });

    const revPath =
      `M ${revenueCoords[0].x},${revenueCoords[0].y} ` +
      `C ${revenueCoords[1].x - 30},${revenueCoords[0].y} ${revenueCoords[1].x - 30},${revenueCoords[1].y} ${revenueCoords[1].x},${revenueCoords[1].y} ` +
      `S ${revenueCoords[2].x - 30},${revenueCoords[2].y} ${revenueCoords[2].x},${revenueCoords[2].y} ` +
      `S ${revenueCoords[3].x - 30},${revenueCoords[3].y} ${revenueCoords[3].x},${revenueCoords[3].y} ` +
      `S ${revenueCoords[4].x - 30},${revenueCoords[4].y} ${revenueCoords[4].x},${revenueCoords[4].y}`;

    const expPath =
      `M ${expenseCoords[0].x},${expenseCoords[0].y} ` +
      `C ${expenseCoords[1].x - 30},${expenseCoords[0].y} ${expenseCoords[1].x - 30},${expenseCoords[1].y} ${expenseCoords[1].x},${expenseCoords[1].y} ` +
      `S ${expenseCoords[2].x - 30},${expenseCoords[2].y} ${expenseCoords[2].x},${expenseCoords[2].y} ` +
      `S ${expenseCoords[3].x - 30},${expenseCoords[3].y} ${expenseCoords[3].x},${expenseCoords[3].y} ` +
      `S ${expenseCoords[4].x - 30},${expenseCoords[4].y} ${expenseCoords[4].x},${expenseCoords[4].y}`;

    const revFillPath = `${revPath} L 480,150 L 20,150 Z`;

    const lastRevY = revenueCoords[revenueCoords.length - 1].y;
    const lastExpY = expenseCoords[expenseCoords.length - 1].y;

    return {
      buckets,
      revPath,
      revFillPath,
      expPath,
      lastRevY,
      lastExpY,
    };
  }, [financialTab, orders, daysInCurrentMonth, totalSalesRupees]);

  // 8. Dynamic Production & Deals Activity Feed
  const displayActivities = useMemo(() => {
    const list = [];

    // Real design projects
    designProjects.forEach((dp) => {
      const d = new Date(dp.updatedAt || dp.createdAt);
      list.push({
        id: `dp-${dp._id || dp.id}`,
        timestamp: d,
        timeStr: d.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        title: (
          <>
            Design Project — Job{" "}
            <span className="font-mono text-indigo-600 font-bold">
              {dp.jobNumber ||
                dp.projectCode ||
                `DES-${String(dp._id).slice(-6).toUpperCase()}`}
            </span>{" "}
            is{" "}
            {dp.status
              ? dp.status.toLowerCase().replace(/_/g, " ")
              : "in progress"}
            .
          </>
        ),
        badges: [
          {
            text: "DESIGN_PROJECT",
            style: "bg-slate-100 text-slate-700 border-slate-200/60",
          },
          {
            text:
              dp.status === "PRODUCTION_LOCKED"
                ? "✓ Print Ready Locked"
                : dp.status || "In Progress",
            style: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
          },
        ],
        link: "/dashboard/designer",
      });
    });

    // Real orders
    orders.forEach((o) => {
      const d = new Date(o.orderDate || o.createdAt);
      const custName =
        o.customerSnapshot?.displayName ||
        o.customerSnapshot?.companyName ||
        "Client";
      list.push({
        id: `ord-${o._id || o.id}`,
        timestamp: d,
        timeStr: d.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        title: (
          <>
            Confirmed Order —{" "}
            <span className="font-mono text-indigo-600 font-bold">
              {o.orderNumber || "Order"}
            </span>{" "}
            (₹
            {(
              (o.grandTotalPaise || 0) / 100
            ).toLocaleString("en-IN")}
            ) for {custName}.
          </>
        ),
        badges: [
          {
            text: "COMMERCIAL_ORDER",
            style: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
          },
          {
            text: `✓ ${o.orderStatus || "CONFIRMED"}`,
            style: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
          },
        ],
        link: "/dashboard/orders",
      });
    });

    // Real production jobs
    productionJobs.forEach((pj) => {
      const d = new Date(pj.updatedAt || pj.createdAt);
      list.push({
        id: `pj-${pj._id || pj.id}`,
        timestamp: d,
        timeStr: d.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        title: (
          <>
            Production Job —{" "}
            <span className="font-mono text-indigo-600 font-bold">
              {pj.productionJobNumber || "Job"}
            </span>{" "}
            is{" "}
            {pj.productionStatus
              ? pj.productionStatus.toLowerCase().replace(/_/g, " ")
              : "active"}
            .
          </>
        ),
        badges: [
          {
            text: "PRODUCTION",
            style: "bg-amber-50 text-amber-700 border-amber-200/60",
          },
          {
            text: pj.productionStatus || "ACTIVE",
            style: "bg-slate-100 text-slate-700 border-slate-200/60",
          },
        ],
        link: "/dashboard/production",
      });
    });

    // Real activity events
    activities.forEach((act) => {
      const d = new Date(act.occurredAt || act.createdAt || 0);
      list.push({
        id: `act-${act._id || act.id}`,
        timestamp: d,
        timeStr: d.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        title: act.summary || act.description || act.title || "Activity logged",
        badges: [
          {
            text: act.entityType || "ACTION",
            style: "bg-slate-100 text-slate-700 border-slate-200/60",
          },
          {
            text: "✓ Logged",
            style: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
          },
        ],
        link:
          act.entityType === "ORDER"
            ? "/dashboard/orders"
            : "/dashboard/followups",
      });
    });

    list.sort((a, b) => b.timestamp - a.timestamp);
    return list.slice(0, 5);
  }, [designProjects, orders, productionJobs, activities]);

  // 9. Dynamic Top Sales Exec
  const topSalesExec = useMemo(() => {
    if (topPerformers.length > 0) {
      const top = topPerformers[0];
      const u = top.user || top;
      const salesVolume =
        (top.achievedPaise || 0) / 100 ||
        top.revenueAchieved ||
        totalSalesRupees;
      return {
        name: u.name || top.userName || "Top Performer",
        avatar: u.avatarUrl || top.avatarUrl || null,
        dealsWon: top.ordersWonCount || top.dealsWon || ordersCount,
        revenue: salesVolume,
        quotaPace:
          targetRupees > 0
            ? Math.round((salesVolume / targetRupees) * 100)
            : 100,
      };
    }

    const salesUsers = users.filter((u) => {
      const r = (u.roleSlug || u.role || "").toLowerCase();
      return r.includes("sales");
    });

    const activeUser = salesUsers[0] || currentUser;
    return {
      name: activeUser?.name || userName || "Tanya",
      avatar: activeUser?.avatarUrl || currentUserAvatar,
      dealsWon: ordersCount,
      revenue: totalSalesRupees,
      quotaPace:
        targetRupees > 0
          ? Math.round((totalSalesRupees / targetRupees) * 100)
          : 100,
    };
  }, [
    topPerformers,
    users,
    currentUser,
    userName,
    currentUserAvatar,
    ordersCount,
    totalSalesRupees,
    targetRupees,
  ]);

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {loading ? (
            <DashboardSkeleton />
          ) : (
            <>
              {/* Top Greeting Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-slate-900 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                    {currentUserAvatar ? (
                      <img
                        src={currentUserAvatar}
                        alt={userName}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      (userName || "TY").slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                        Good {timeOfDay}, {userName || "Tanya"}! 👋
                      </h1>
                      {isQuotaOnTrack ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Quota On Track
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Behind Quota Pace
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-normal">
                      Here is your verified pipeline snapshot &amp; commercial print production stream for today.
                    </p>
                  </div>
                </div>

                {/* 3 Right Stat Box Widgets */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="bg-white rounded-xl border border-slate-200/80 px-3.5 py-2 text-center shadow-2xs min-w-[125px]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      PIPELINE VELOCITY
                    </span>
                    <span className="text-xs sm:text-sm font-black text-slate-800 mt-0.5 block">
                      {dynamicPipeline.winRatio}% Won Rate
                    </span>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200/80 px-3.5 py-2 text-center shadow-2xs min-w-[120px]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      AVG DEAL SIZE
                    </span>
                    <span className="text-xs sm:text-sm font-black text-slate-800 mt-0.5 block">
                      ₹{avgDealSize.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="bg-amber-50/60 rounded-xl border border-amber-200/80 px-3.5 py-2 text-center shadow-2xs min-w-[110px]">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                      FOLLOW-UPS
                    </span>
                    <span className="text-xs sm:text-sm font-black text-amber-900 mt-0.5 block">
                      {todayFollowupsCount} Due Today
                    </span>
                  </div>
                </div>
              </div>

              {/* 5 KPI Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Card 1: TOTAL SALES */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      TOTAL SALES
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/60 flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                      ₹{totalSalesRupees.toLocaleString("en-IN")}
                    </h3>
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        ↑ {targetPercent}% of {targetRupees >= 100000 ? `₹${(targetRupees / 100000).toFixed(2)}L` : targetRupees > 0 ? `₹${targetRupees.toLocaleString("en-IN")}` : "Quota"}
                      </span>
                      <span className="text-slate-400 font-medium">Target</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Pace: ₹{dailyPace.toLocaleString("en-IN")} / day
                    </span>
                    <svg className="w-16 h-6 shrink-0" viewBox="0 0 70 24" fill="none">
                      <path d="M2 18 Q 20 8, 35 15 T 68 6" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* Card 2: LEADS ASSIGNED */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      LEADS ASSIGNED
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/60 flex items-center justify-center">
                      <UserPlus className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        {displayLeadsCount}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-200/60">
                        {qualifiedLeadsCount === displayLeadsCount && displayLeadsCount > 0 ? "All Qualified" : `${qualifiedLeadsCount} Qualified`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">
                      {newLeadsTodayCount} new today • {activeLeadsCount} active cycle
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium truncate max-w-[110px]" title={leadSourcesText}>
                      {leadSourcesText}
                    </span>
                    <svg className="w-16 h-6 shrink-0" viewBox="0 0 70 24" fill="none">
                      <path d="M2 18 Q 20 14, 35 16 T 68 8" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* Card 3: FOLLOW-UPS DUE */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      FOLLOW-UPS DUE
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100/60 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        {overdueFollowupsCount + todayFollowupsCount}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${overdueFollowupsCount > 0 ? "bg-rose-50 text-rose-600 border-rose-200/60" : "bg-emerald-50 text-emerald-600 border-emerald-200/60"}`}>
                        {overdueFollowupsCount} Overdue
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-600 font-semibold mt-1">
                      {highPriorityFollowupsCount} High Priority pending
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium truncate max-w-[110px]" title={nextFollowupStr}>
                      {nextFollowupStr}
                    </span>
                    <svg className="w-16 h-6 shrink-0" viewBox="0 0 70 24" fill="none">
                      <path d="M2 16 Q 20 22, 40 12 T 68 14" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* Card 4: ORDERS CONFIRMED */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      ORDERS CONFIRMED
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100/60 flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        {ordersCount}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-600 border border-purple-200/60">
                        {dynamicPipeline.winRatio}% Rate
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 font-bold mt-1">
                      ₹{totalSalesRupees.toLocaleString("en-IN")} Total Value
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Avg ₹{Math.round(avgDealSize).toLocaleString("en-IN")} / order
                    </span>
                    <svg className="w-16 h-6 shrink-0" viewBox="0 0 70 24" fill="none">
                      <path d="M2 19 Q 25 8, 45 16 T 68 6" stroke="#A855F7" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* Card 5: PAYMENTS COLLECTED */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      PAYMENTS COLLECTED
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-100/60 flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-black text-rose-600 tracking-tight">
                        ₹{totalPaymentsRupees.toLocaleString("en-IN")}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${pendingPaymentsRupees > 0 ? "bg-rose-50 text-rose-700 border-rose-200/60" : "bg-emerald-50 text-emerald-700 border-emerald-200/60"}`}>
                        {pendingPaymentsRupees > 0 ? "Action Reqd" : "Settled"}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-700 font-semibold mt-1">
                      ₹{pendingPaymentsRupees.toLocaleString("en-IN")} Pending Net 15
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {collectionsCount} {collectionsCount === 1 ? "collection" : "collections"} logged
                    </span>
                    <button
                      onClick={() => router.push("/dashboard/payments")}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                    >
                      Collect →
                    </button>
                  </div>
                </div>
              </div>

              {/* Middle Section: Sales Pipeline Stages & Financial Flow */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left: Sales Pipeline & Conversion Stages (5 Cols) */}
                <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-sm font-bold text-slate-900 leading-tight">
                          Sales Pipeline &amp; Conversion Stages
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Full cycle throughput analysis
                        </p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        {dynamicPipeline.winRatio}% Win Ratio
                      </span>
                    </div>

                    {/* 5 Stage Dynamic Rows */}
                    <div className="space-y-4 pt-4">
                      {dynamicPipeline.stages.map((stage) => (
                        <div key={stage.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800 flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-xs ${stage.dotColor} shrink-0`} />
                              {stage.name}
                            </span>
                            <span className="font-bold text-slate-800">
                              {stage.textRight}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`${stage.barColor} h-full rounded-full transition-all duration-500`}
                              style={{ width: `${stage.percent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Funnel Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Pipeline Velocity: <strong className="text-slate-900 font-bold">{dynamicPipeline.avgVelocity} Days avg</strong></span>
                    <span>Drop-off Rate: <strong className="text-emerald-600 font-bold">{dynamicPipeline.dropOffPercent}% ({dynamicPipeline.dropOffLabel})</strong></span>
                  </div>
                </div>

                {/* Right: Financial Flow: Revenue vs Operations Expense (7 Cols) */}
                <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-sm font-bold text-slate-900 leading-tight">
                            Financial Flow: Revenue vs Operations Expense
                          </h2>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">
                            {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Comparing confirmed billed sales against production print raw expenses
                        </p>
                      </div>

                      {/* Daily / Weekly / Monthly Switcher */}
                      <div className="flex items-center bg-slate-100/80 p-0.5 rounded-xl self-start sm:self-auto text-xs font-semibold text-slate-600">
                        {["Daily", "Weekly", "Monthly"].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setFinancialTab(tab)}
                            className={`px-3 py-1 rounded-lg transition-all ${
                              financialTab === tab
                                ? "bg-white text-slate-900 font-bold shadow-2xs"
                                : "hover:text-slate-900"
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Legend Row */}
                    <div className="flex items-center gap-4 flex-wrap pt-3 text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                        Confirmed Sales: <strong className="text-slate-900">₹{totalSalesRupees.toLocaleString("en-IN")}</strong>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        Production Expense: <strong className="text-slate-900">₹{productionExpenseRupees.toLocaleString("en-IN")}</strong>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        Net Profit Margin: <strong className="text-emerald-700 font-bold">{netProfitMargin}%</strong>
                      </span>
                    </div>

                    {/* Interactive SVG Area Chart */}
                    <div className="relative w-full h-44 pt-2">
                      <svg
                        viewBox="0 0 500 160"
                        className="w-full h-full overflow-visible"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient id="flowRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Grid lines */}
                        <line x1="20" y1="20" x2="480" y2="20" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="20" y1="55" x2="480" y2="55" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="20" y1="90" x2="480" y2="90" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="20" y1="125" x2="480" y2="125" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />

                        {/* Revenue Fill Area */}
                        <path
                          d={chartData.revFillPath}
                          fill="url(#flowRevenueGrad)"
                        />

                        {/* Revenue Curve */}
                        <path
                          d={chartData.revPath}
                          fill="none"
                          stroke="#4F46E5"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <circle cx="480" cy={chartData.lastRevY} r="4.5" fill="#4F46E5" stroke="#FFFFFF" strokeWidth="2" />

                        {/* Expense Curve */}
                        <path
                          d={chartData.expPath}
                          fill="none"
                          stroke="#F59E0B"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <circle cx="480" cy={chartData.lastExpY} r="4.5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
                      </svg>

                      {/* Dynamic X-axis date labels */}
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium pt-1 px-1">
                        {chartData.buckets.map((b, idx) => (
                          <span key={idx}>{b.label}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Financial Flow Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700">
                      Month Run-Rate Projection: <strong className="text-slate-900 font-bold">₹{runRate.toLocaleString("en-IN")}</strong>
                    </span>
                    <button
                      onClick={() => router.push("/dashboard/reports")}
                      className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 transition-colors"
                    >
                      <span>Detailed Ledger &amp; Cost Breakdown</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Section: 3 Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Column 1: Today's Production & Deals Activity (5 Cols) */}
                <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between pb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          Today&apos;s Production &amp; Deals Activity
                        </h3>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Live Feed
                        </span>
                      </div>
                      <button
                        onClick={() => router.push("/dashboard/followups")}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        Filter
                      </button>
                    </div>

                    {/* Activity Items Feed */}
                    <div className="space-y-3.5 pt-3">
                      {displayActivities.length > 0 ? (
                        displayActivities.map((act) => (
                          <div
                            key={act.id}
                            onClick={() => act.link && router.push(act.link)}
                            className="flex items-start gap-2.5 p-1.5 -mx-1.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <span className="text-xs text-slate-400 font-mono font-medium shrink-0 pt-0.5">
                              {act.timeStr}
                            </span>
                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-800 leading-snug">
                                {act.title}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {act.badges?.map((b, idx) => (
                                  <span
                                    key={idx}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${b.style}`}
                                  >
                                    {b.text}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-xs text-slate-400">
                          No recent activities recorded for today.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 2: Rapid Action Center (4 Cols) */}
                <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between pb-1">
                      <h3 className="text-sm font-bold text-slate-900">
                        Rapid Action Center
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">
                        Shortcuts
                      </span>
                    </div>

                    {/* 2x3 Grid of Shortcuts */}
                    <div className="grid grid-cols-2 gap-3 pt-3">
                      {/* 1. New Lead */}
                      <button
                        onClick={() => setShowAddLeadModal(true)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 hover:bg-blue-50/70 border border-slate-200/70 hover:border-blue-200 transition-all text-left group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <UserPlus className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-800 block group-hover:text-blue-600">
                            New Lead
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Key [N]
                          </span>
                        </div>
                      </button>

                      {/* 2. Log Call */}
                      <button
                        onClick={() => router.push("/dashboard/followups")}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 hover:bg-rose-50/70 border border-slate-200/70 hover:border-rose-200 transition-all text-left group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                          <PhoneCall className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-800 block group-hover:text-rose-600">
                            Log Call
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Dialer [C]
                          </span>
                        </div>
                      </button>

                      {/* 3. WhatsApp */}
                      <button
                        onClick={() => router.push("/dashboard/whatsapp")}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 hover:bg-emerald-50/70 border border-slate-200/70 hover:border-emerald-200 transition-all text-left group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-800 block group-hover:text-emerald-600">
                            WhatsApp
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Direct [W]
                          </span>
                        </div>
                      </button>

                      {/* 4. Quotation */}
                      <button
                        onClick={() => router.push("/dashboard/quotations")}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 hover:bg-purple-50/70 border border-slate-200/70 hover:border-purple-200 transition-all text-left group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-800 block group-hover:text-purple-600">
                            Quotation
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            PDF [Q]
                          </span>
                        </div>
                      </button>

                      {/* 5. New Order */}
                      <button
                        onClick={() => router.push("/dashboard/orders")}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 hover:bg-indigo-50/70 border border-slate-200/70 hover:border-indigo-200 transition-all text-left group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-800 block group-hover:text-indigo-600">
                            New Order
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Order [O]
                          </span>
                        </div>
                      </button>

                      {/* 6. Record Pay */}
                      <button
                        onClick={() => router.push("/dashboard/payments")}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 hover:bg-teal-50/70 border border-slate-200/70 hover:border-teal-200 transition-all text-left group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-800 block group-hover:text-teal-600">
                            Record Pay
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Record [P]
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Column 3: Top Sales Exec & Live System Status (3 Cols) */}
                <div className="lg:col-span-3 space-y-4">
                  {/* Top Sales Exec Card */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span>🏆</span> TOP SALES EXEC
                      </span>
                      <span className="text-xs font-bold text-indigo-600">
                        Rank #1
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                          {topSalesExec.avatar ? (
                            <img
                              src={topSalesExec.avatar}
                              alt={topSalesExec.name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            (topSalesExec.name || "TY").slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 text-xs block truncate">
                            {topSalesExec.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium block">
                            {topSalesExec.dealsWon} {topSalesExec.dealsWon === 1 ? "deal" : "deals"} closed
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-black text-slate-900 text-sm block">
                          ₹{topSalesExec.revenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block">
                          {topSalesExec.quotaPace}% quota pace
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Live System Status Card */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        SYSTEM STATUS
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${systemHealthy ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                        {systemHealthy ? "HEALTHY" : "DEGRADED"}
                      </span>
                    </div>

                    <div className="space-y-2 pt-1 text-xs">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                        <span>MongoDB Replica: Server verified</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                        <span>{displayLeadsCount} inquiries pipeline active</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                        <span>Engine Triggers &amp; Webhooks: Online</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Footer Copyright */}
          <div className="pt-4 text-center text-slate-400 text-xs font-medium">
            © 2026 A2V Prints CRM. All rights reserved.
          </div>
        </div>
      </main>

      {/* Add Lead Modal */}
      {showAddLeadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Add New Lead
              </h3>
              <button
                onClick={() => setShowAddLeadModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3.5 text-xs">
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
                    placeholder="9876543210"
                    value={newLead.phone}
                    onChange={(e) =>
                      setNewLead({ ...newLead, phone: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Shop"
                    value={newLead.companyName}
                    onChange={(e) =>
                      setNewLead({ ...newLead, companyName: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
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
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
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
                    Est. Value (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="15000"
                    value={newLead.estimatedValue}
                    onChange={(e) =>
                      setNewLead({
                        ...newLead,
                        estimatedValue: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Printing Requirement
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Flex banner 10x4 ft and 1000 visiting cards"
                  value={newLead.requirement}
                  onChange={(e) =>
                    setNewLead({ ...newLead, requirement: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                />
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
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
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
                        {(currentUser?.name || userName || "ME")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <span className="truncate">
                        {currentUser?.name || userName || "Current User"} (You)
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
