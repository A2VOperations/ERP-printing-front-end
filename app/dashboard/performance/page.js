"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import {
  TrendingUp,
  Calendar,
  ChevronDown,
  PhoneCall,
  PhoneIncoming,
  FileText,
  ShoppingBag,
  IndianRupee,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  MoreVertical,
  Filter,
  MapPin,
  Target,
  Eye,
  Check,
  RefreshCw,
  MessageSquare,
  Sparkles,
  Store,
  Layers,
  Award,
  BarChart2,
  X,
  ExternalLink,
} from "lucide-react";

export default function PerformancePage() {
  const router = useRouter();

  // Active Tab: Today, Weekly, Monthly, Custom Range
  const [activeTab, setActiveTab] = useState("Today");

  // Dropdown filter
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedPeriodView, setSelectedPeriodView] = useState("Today");

  // Selected date badge
  const [selectedDateObj, setSelectedDateObj] = useState(() => new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Lead detail modal state
  const [selectedLeadModal, setSelectedLeadModal] = useState(null);
  const [leadActionMenu, setLeadActionMenu] = useState(null);

  // Live Backend Data States
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [realLeads, setRealLeads] = useState([]);
  const [realOrders, setRealOrders] = useState([]);
  const [realQuotations, setRealQuotations] = useState([]);
  const [realFollowups, setRealFollowups] = useState([]);
  const [realActivities, setRealActivities] = useState([]);
  const [myTarget, setMyTarget] = useState(null);

  // Formatted date string
  const formattedSelectedDate = useMemo(() => {
    const d = selectedDateObj;
    const day = d.toLocaleDateString("en-GB", { day: "2-digit" });
    const month = d.toLocaleDateString("en-GB", { month: "short" });
    const year = d.getFullYear();
    const weekday = d.toLocaleDateString("en-GB", { weekday: "long" });
    return `${day} ${month} ${year}, ${weekday}`;
  }, [selectedDateObj]);

  // Fetch real data from live backend with dynamic target parameters
  const fetchPerformanceData = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      else setLoading(true);

      const dateStr = selectedDateObj.toISOString().split("T")[0];
      const periodTypeParam =
        activeTab === "Today"
          ? "DAILY"
          : activeTab === "Weekly"
          ? "WEEKLY"
          : activeTab === "Monthly"
          ? "MONTHLY"
          : "ALL";

      const [leadsRes, ordersRes, quotesRes, followupsRes, targetRes, activitiesRes] =
        await Promise.allSettled([
          api.get("/leads?limit=250&sortBy=createdAt&sortOrder=desc", { silent: true }),
          api.get("/orders?limit=150&sortBy=createdAt&sortOrder=desc", { silent: true }),
          api.get("/quotations?limit=150&sortBy=createdAt&sortOrder=desc", { silent: true }),
          api.get("/followups?limit=150&sortBy=scheduledAt&sortOrder=desc", { silent: true }),
          api.get(`/targets/my-achievement?periodType=${periodTypeParam}&date=${dateStr}`, { silent: true }),
          api.get("/activities?limit=150", { silent: true }),
        ]);

      if (leadsRes.status === "fulfilled" && leadsRes.value?.data) {
        const raw = leadsRes.value.data;
        const list = Array.isArray(raw) ? raw : raw.leads || raw.data || [];
        setRealLeads(list);
      }
      if (ordersRes.status === "fulfilled" && ordersRes.value?.data) {
        const raw = ordersRes.value.data;
        const list = Array.isArray(raw) ? raw : raw.orders || raw.items || raw.data || [];
        setRealOrders(list);
      }
      if (quotesRes.status === "fulfilled" && quotesRes.value?.data) {
        const raw = quotesRes.value.data;
        const list = Array.isArray(raw) ? raw : raw.records || raw.quotations || raw.items || raw.data || [];
        setRealQuotations(list);
      }
      if (followupsRes.status === "fulfilled" && followupsRes.value?.data) {
        const raw = followupsRes.value.data;
        const list = Array.isArray(raw) ? raw : raw.followups || raw.followUps || raw.items || raw.data || [];
        setRealFollowups(list);
      }
      if (targetRes.status === "fulfilled" && targetRes.value?.data) {
        setMyTarget(targetRes.value.data);
      }
      if (activitiesRes.status === "fulfilled" && activitiesRes.value?.data) {
        const raw = activitiesRes.value.data;
        const list = Array.isArray(raw) ? raw : raw.activities || raw.data || [];
        setRealActivities(list);
      }
    } catch (err) {
      console.warn("Performance data fetch notice:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab, selectedDateObj]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  // Check if a date string/timestamp falls within current active timeframe
  const isDateInActivePeriod = useCallback(
    (dateInput) => {
      if (!dateInput) return false;
      const targetDate = new Date(dateInput);
      if (isNaN(targetDate.getTime())) return false;

      const refDate = new Date(selectedDateObj);

      if (activeTab === "Today") {
        return (
          targetDate.getDate() === refDate.getDate() &&
          targetDate.getMonth() === refDate.getMonth() &&
          targetDate.getFullYear() === refDate.getFullYear()
        );
      }

      if (activeTab === "Weekly") {
        // Last 7 days ending on selected date
        const weekEnd = new Date(refDate);
        weekEnd.setHours(23, 59, 59, 999);
        const weekStart = new Date(refDate);
        weekStart.setDate(refDate.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);
        return targetDate >= weekStart && targetDate <= weekEnd;
      }

      if (activeTab === "Monthly") {
        // Same month and year
        return (
          targetDate.getMonth() === refDate.getMonth() &&
          targetDate.getFullYear() === refDate.getFullYear()
        );
      }

      // Default fallback
      return true;
    },
    [activeTab, selectedDateObj]
  );

  // Dynamic filtered datasets based on active timeframe (truthful, accurate counts)
  const filteredData = useMemo(() => {
    const leads = realLeads.filter(
      (l) =>
        isDateInActivePeriod(l.createdAt) ||
        isDateInActivePeriod(l.updatedAt) ||
        isDateInActivePeriod(l.assignedAt)
    );
    const orders = realOrders.filter((o) =>
      isDateInActivePeriod(o.orderDate || o.createdAt)
    );
    const quotations = realQuotations.filter((q) =>
      isDateInActivePeriod(q.createdAt)
    );
    const followups = realFollowups.filter((f) =>
      isDateInActivePeriod(f.scheduledAt || f.createdAt)
    );
    const activities = realActivities.filter((a) =>
      isDateInActivePeriod(a.occurredAt || a.createdAt)
    );

    return { leads, orders, quotations, followups, activities };
  }, [
    realLeads,
    realOrders,
    realQuotations,
    realFollowups,
    realActivities,
    isDateInActivePeriod,
  ]);

  // Compute 6 KPI metrics dynamically from real data
  const metrics = useMemo(() => {
    const leadsAssigned = filteredData.leads.length;

    // Calls made: activities with call/followup or followups marked completed or scheduled in period
    const callActivities = filteredData.activities.filter(
      (a) =>
        a.eventType?.includes("CALL") ||
        a.eventType?.includes("FOLLOWUP") ||
        a.entityType === "FOLLOWUP"
    ).length;
    const completedFollowups = filteredData.followups.filter((f) => f.status === "COMPLETED").length;
    const callsMade = Math.max(callActivities, completedFollowups, filteredData.followups.length);

    // Connected: calls resulting in connected/scheduled or leads moved forward from NEW
    const connected = filteredData.leads.filter(
      (l) => l.status && !["NEW", "LOST"].includes(l.status)
    ).length;

    const connectedRate =
      callsMade > 0 ? `${Math.round((connected / callsMade) * 100)}%` : "0%";
    const connectedOutOf = `Out of ${callsMade} calls`;

    const quotationsSent = filteredData.quotations.length;
    const ordersReceived =
      filteredData.orders.length +
      filteredData.quotations.filter((q) => q.status === "ACCEPTED").length;

    // Sales Amount calculation from accepted quotations + orders
    const totalOrderRupees = filteredData.orders.reduce((sum, o) => {
      const amt =
        Number(o.grandTotalPaise ? o.grandTotalPaise / 100 : o.totalAmount || 0) || 0;
      return sum + amt;
    }, 0);

    const totalQuotationRupees = filteredData.quotations
      .filter((q) => q.status === "ACCEPTED")
      .reduce((sum, q) => {
        const amt =
          Number(q.grandTotalPaise ? q.grandTotalPaise / 100 : q.totalAmount || 0) || 0;
        return sum + amt;
      }, 0);

    const salesAmountNum = totalOrderRupees + totalQuotationRupees;
    const salesAmount = `₹ ${salesAmountNum.toLocaleString("en-IN")}`;

    const periodSubtext =
      activeTab === "Today"
        ? "Today"
        : activeTab === "Weekly"
        ? "This Week"
        : activeTab === "Monthly"
        ? "This Month"
        : "Selected Period";

    return {
      leadsAssigned,
      leadsTrend: "Live",
      callsMade,
      callsTrend: "Live",
      connected,
      connectedRate,
      connectedOutOf,
      quotationsSent,
      quotationsTrend: "Live",
      ordersReceived,
      ordersTrend: "Live",
      salesAmount,
      salesTrend: "Live",
      periodSubtext,
    };
  }, [filteredData, activeTab]);

  // Compute Activity Timeline based on real timestamps and activities
  const timelineData = useMemo(() => {
    if (activeTab === "Weekly") {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const counts = days.map((d) => ({ time: d, calls: 0, connected: 0, followups: 0 }));

      filteredData.activities.forEach((a) => {
        const d = new Date(a.occurredAt || a.createdAt);
        const dayIdx = (d.getDay() + 6) % 7; // Monday = 0
        if (counts[dayIdx]) {
          counts[dayIdx].calls += 1;
          counts[dayIdx].connected += 1;
        }
      });

      filteredData.followups.forEach((f) => {
        const d = new Date(f.scheduledAt || f.createdAt);
        const dayIdx = (d.getDay() + 6) % 7;
        if (counts[dayIdx]) {
          counts[dayIdx].followups += 1;
          counts[dayIdx].calls += 1;
        }
      });

      // Provide baseline values if dataset has few entries
      return counts.map((c) => ({
        ...c,
        calls: Math.max(c.calls, c.connected + c.followups),
      }));
    }

    if (activeTab === "Monthly") {
      const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
      const counts = weeks.map((w) => ({ time: w, calls: 0, connected: 0, followups: 0 }));

      filteredData.leads.forEach((l) => {
        const d = new Date(l.createdAt);
        const weekIdx = Math.min(3, Math.floor(d.getDate() / 7));
        if (counts[weekIdx]) {
          counts[weekIdx].calls += 1;
          counts[weekIdx].connected += l.status === "WON" ? 1 : 0;
        }
      });

      filteredData.followups.forEach((f) => {
        const d = new Date(f.scheduledAt || f.createdAt);
        const weekIdx = Math.min(3, Math.floor(d.getDate() / 7));
        if (counts[weekIdx]) {
          counts[weekIdx].followups += 1;
          counts[weekIdx].calls += 1;
        }
      });

      return counts;
    }

    // Default: Today's Hourly Breakdown (9 AM to 6 PM)
    const hours = [
      { label: "9 AM", h: 9 },
      { label: "10 AM", h: 10 },
      { label: "11 AM", h: 11 },
      { label: "12 PM", h: 12 },
      { label: "1 PM", h: 13 },
      { label: "2 PM", h: 14 },
      { label: "3 PM", h: 15 },
      { label: "4 PM", h: 16 },
      { label: "5 PM", h: 17 },
      { label: "6 PM", h: 18 },
    ];

    const hourlyCounts = hours.map((slot) => ({
      time: slot.label,
      calls: 0,
      connected: 0,
      followups: 0,
    }));

    filteredData.activities.forEach((act) => {
      const d = new Date(act.occurredAt || act.createdAt);
      const h = d.getHours();
      const match = hours.findIndex((slot) => slot.h === h);
      if (match !== -1) {
        hourlyCounts[match].calls += 1;
        hourlyCounts[match].connected += 1;
      }
    });

    filteredData.followups.forEach((flw) => {
      const d = new Date(flw.scheduledAt || flw.createdAt);
      const h = d.getHours();
      const match = hours.findIndex((slot) => slot.h === h);
      if (match !== -1) {
        hourlyCounts[match].followups += 1;
        hourlyCounts[match].calls += 1;
      }
    });

    filteredData.leads.forEach((ld) => {
      const d = new Date(ld.createdAt);
      const h = d.getHours();
      const match = hours.findIndex((slot) => slot.h === h);
      if (match !== -1) {
        hourlyCounts[match].calls += 1;
      }
    });

    return hourlyCounts;
  }, [activeTab, filteredData]);

  const maxTimelineVal = useMemo(() => {
    let max = 0;
    timelineData.forEach((d) => {
      if (d.calls > max) max = d.calls;
      if (d.connected > max) max = d.connected;
      if (d.followups > max) max = d.followups;
    });
    return Math.max(max, 5);
  }, [timelineData]);

  // Target Progress parameters dynamically computed from live targets and orders
  const targetData = useMemo(() => {
    // 1. Determine target label and target amount based on activeTab
    let targetLabel = "Monthly Target";
    let targetRupees = 0;
    let dailyQuotaRupees = 0;
    let monthlyQuotaRupees = 0;

    const dailyPaise =
      myTarget?.dailyTargetPaise ||
      (myTarget?.periodType === "DAILY" ? myTarget?.targetPaise : 0) ||
      0;
    const monthlyPaise =
      myTarget?.monthlyTargetPaise ||
      (myTarget?.periodType === "MONTHLY" ? myTarget?.targetPaise : 0) ||
      0;

    dailyQuotaRupees = Math.round(dailyPaise / 100);
    monthlyQuotaRupees = Math.round(monthlyPaise / 100);

    // Days in current selected month
    const now = new Date(selectedDateObj);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const todayDateNum = new Date().getDate();
    const daysLeftInMonth = Math.max(1, lastDayOfMonth - todayDateNum);

    if (activeTab === "Today") {
      targetLabel = "Daily Target";
      targetRupees =
        dailyQuotaRupees > 0
          ? dailyQuotaRupees
          : myTarget?.targetPaise
          ? Math.round(myTarget.targetPaise / 100)
          : 0;
    } else if (activeTab === "Weekly") {
      targetLabel = "Weekly Target";
      targetRupees =
        dailyQuotaRupees > 0
          ? dailyQuotaRupees * 7
          : myTarget?.targetPaise
          ? Math.round(myTarget.targetPaise / 100)
          : 0;
    } else if (activeTab === "Monthly") {
      targetLabel = "Monthly Target";
      targetRupees =
        monthlyQuotaRupees > 0
          ? monthlyQuotaRupees
          : dailyQuotaRupees > 0
          ? dailyQuotaRupees * lastDayOfMonth
          : myTarget?.targetPaise
          ? Math.round(myTarget.targetPaise / 100)
          : 0;
    } else {
      targetLabel = "Overall Target";
      targetRupees =
        monthlyQuotaRupees > 0 ? monthlyQuotaRupees : dailyQuotaRupees * lastDayOfMonth;
    }

    // 2. Achieved revenue for this active period
    const periodWonQuotations = filteredData.quotations
      .filter((q) => q.status === "ACCEPTED")
      .reduce(
        (sum, q) =>
          sum + (Number(q.grandTotalPaise ? q.grandTotalPaise / 100 : q.totalAmount || 0) || 0),
        0
      );

    const periodWonOrders = filteredData.orders.reduce((sum, o) => {
      const amt = Number(o.grandTotalPaise ? o.grandTotalPaise / 100 : o.totalAmount || 0) || 0;
      return sum + amt;
    }, 0);

    const achievedFromPeriod = periodWonQuotations + periodWonOrders;

    const achieved =
      myTarget?.achievedPaise !== undefined && myTarget.achievedPaise > 0
        ? Math.round(myTarget.achievedPaise / 100)
        : achievedFromPeriod;

    const remaining = Math.max(0, targetRupees - achieved);
    const pct =
      targetRupees > 0
        ? Math.min(100, Math.round((achieved / targetRupees) * 100))
        : achieved > 0
        ? 100
        : 0;

    let statusFooter = "";
    if (activeTab === "Today") {
      statusFooter =
        targetRupees > 0
          ? achieved >= targetRupees
            ? "Target Met! 🎯"
            : achieved > 0
            ? "In Progress"
            : "Pending"
          : "No Quota Set";
    } else if (activeTab === "Weekly") {
      statusFooter = "7-Day Goal";
    } else {
      statusFooter = `${daysLeftInMonth} Days Left`;
    }

    return {
      targetLabel,
      targetAmount:
        targetRupees > 0 ? `₹ ${targetRupees.toLocaleString("en-IN")}` : "Not Set",
      dailyQuotaDisplay:
        dailyQuotaRupees > 0 ? `₹ ${dailyQuotaRupees.toLocaleString("en-IN")}/day` : null,
      achieved: `₹ ${achieved.toLocaleString("en-IN")}`,
      percentage: pct,
      remaining: `₹ ${remaining.toLocaleString("en-IN")}`,
      statusFooter,
      daysLeft: `${daysLeftInMonth} Days Left`,
      rawTarget: targetRupees,
      rawAchieved: achieved,
    };
  }, [activeTab, myTarget, filteredData, selectedDateObj]);

  // Lead status distribution breakdown computed from live leads
  const statusDistribution = useMemo(() => {
    const total = filteredData.leads.length;
    if (total === 0) {
      return [
        { label: "New", count: 0, percentage: "0%", color: "#3B82F6" },
        { label: "Contacted", count: 0, percentage: "0%", color: "#10B981" },
        { label: "Follow-up", count: 0, percentage: "0%", color: "#F97316" },
        { label: "Quotation", count: 0, percentage: "0%", color: "#8B5CF6" },
        { label: "Order Won", count: 0, percentage: "0%", color: "#059669" },
        { label: "Lost", count: 0, percentage: "0%", color: "#EF4444" },
      ];
    }

    const counts = {
      NEW: filteredData.leads.filter((l) => l.status === "NEW").length,
      CONTACTED: filteredData.leads.filter(
        (l) => l.status === "CONTACTED" || l.status === "INTERESTED"
      ).length,
      FOLLOW_UP: filteredData.leads.filter((l) => l.status === "FOLLOW_UP").length,
      QUOTATION: filteredData.leads.filter(
        (l) => l.status === "QUOTATION" || l.status === "PROPOSAL"
      ).length,
      WON: filteredData.leads.filter((l) => l.status === "WON").length,
      LOST: filteredData.leads.filter((l) => l.status === "LOST" || l.status === "DROPPED").length,
    };

    const calcPct = (num) => `${Math.round((num / total) * 100)}%`;

    return [
      { label: "New", count: counts.NEW, percentage: calcPct(counts.NEW), color: "#3B82F6" },
      { label: "Contacted", count: counts.CONTACTED, percentage: calcPct(counts.CONTACTED), color: "#10B981" },
      { label: "Follow-up", count: counts.FOLLOW_UP, percentage: calcPct(counts.FOLLOW_UP), color: "#F97316" },
      { label: "Quotation", count: counts.QUOTATION, percentage: calcPct(counts.QUOTATION), color: "#8B5CF6" },
      { label: "Order Won", count: counts.WON, percentage: calcPct(counts.WON), color: "#059669" },
      { label: "Lost", count: counts.LOST, percentage: calcPct(counts.LOST), color: "#EF4444" },
    ];
  }, [filteredData.leads]);

  // Lead status progress bars computed from live status counts
  const leadsStatusBars = useMemo(() => {
    const total = filteredData.leads.length || 1;
    return statusDistribution.map((s) => ({
      label: s.label,
      count: s.count,
      pct: Math.round((s.count / total) * 100),
      barColor: s.color,
    }));
  }, [statusDistribution, filteredData.leads.length]);

  // Conversion funnel computed dynamically from pipeline
  const funnelSteps = useMemo(() => {
    const total = filteredData.leads.length || 1;
    const contacted =
      filteredData.leads.filter((l) => l.status !== "NEW").length ||
      filteredData.activities.length ||
      1;
    const interested =
      filteredData.leads.filter((l) =>
        ["INTERESTED", "FOLLOW_UP", "QUOTATION", "WON"].includes(l.status)
      ).length || 1;
    const quotes = filteredData.quotations.length || 1;
    const orders =
      filteredData.orders.length ||
      filteredData.leads.filter((l) => l.status === "WON").length ||
      0;

    return [
      {
        count: total,
        label: "Leads Assigned",
        pct: "100%",
        width: "100%",
        bg: "bg-[#2563EB]",
      },
      {
        count: contacted,
        label: "Contacted",
        pct: `${Math.round((contacted / total) * 100)}%`,
        width: "88%",
        bg: "bg-[#10B981]",
      },
      {
        count: interested,
        label: "Interested",
        pct: `${Math.round((interested / total) * 100)}%`,
        width: "76%",
        bg: "bg-[#FBBF24]",
      },
      {
        count: quotes,
        label: "Quotation Sent",
        pct: `${Math.round((quotes / total) * 100)}%`,
        width: "64%",
        bg: "bg-[#8B5CF6]",
      },
      {
        count: orders,
        label: "Orders Won",
        pct: `${Math.round((orders / total) * 100)}%`,
        width: "52%",
        bg: "bg-[#059669]",
      },
    ];
  }, [filteredData]);

  // Top Performing Areas computed from real lead locations
  const topAreas = useMemo(() => {
    const areaMap = {};
    filteredData.leads.forEach((l) => {
      const area = l.areaId?.name || l.area || l.territory || l.zone || "Main Market";
      areaMap[area] = (areaMap[area] || 0) + 1;
    });

    const totalLeads = filteredData.leads.length || 1;
    const sorted = Object.entries(areaMap)
      .map(([name, count]) => ({
        name,
        leads: count,
        percentage: Math.round((count / totalLeads) * 100),
      }))
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 5);

    if (sorted.length === 0) {
      return [{ rank: 1, name: "Market Area", leads: 0, percentage: 0, badgeColor: "bg-blue-600 text-white" }];
    }

    const badgeColors = [
      "bg-[#F59E0B] text-white",
      "bg-[#2563EB] text-white",
      "bg-[#10B981] text-white",
      "bg-[#6366F1] text-white",
      "bg-[#475569] text-white",
    ];

    return sorted.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      badgeColor: badgeColors[idx % badgeColors.length],
    }));
  }, [filteredData.leads]);

  // Handled leads list from real database leads
  const handledLeads = useMemo(() => {
    const list = filteredData.leads.length > 0 ? filteredData.leads : realLeads;
    return list.slice(0, 10).map((l, idx) => {
      const createdD = l.createdAt ? new Date(l.createdAt) : new Date();
      const timeStr = createdD.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      let statusBadge = "Follow-up";
      if (l.status === "WON") statusBadge = "Order";
      else if (l.status === "QUOTATION") statusBadge = "Quotation";
      else if (l.status === "NEW") statusBadge = "New";
      else if (l.status === "LOST") statusBadge = "Lost";

      const matchedQuote = realQuotations.find(
        (q) => String(q.leadId?._id || q.leadId) === String(l._id)
      );
      const matchedOrder = realOrders.find(
        (o) => String(o.leadId?._id || o.leadId) === String(l._id)
      );

      const quoteVal = matchedQuote?.grandTotalPaise
        ? Math.round(matchedQuote.grandTotalPaise / 100)
        : l.expectedValue || null;

      const orderVal = matchedOrder?.grandTotalPaise
        ? Math.round(matchedOrder.grandTotalPaise / 100)
        : l.status === "WON"
        ? quoteVal
        : null;

      return {
        id: l.leadNumber || (l._id ? `#${l._id.slice(-6).toUpperCase()}` : `LD-${idx + 1}`),
        rawId: l._id,
        name: l.businessName || l.contactName || "Direct Inquiry",
        contactName: l.contactName || "Client",
        phone: l.phone || l.alternatePhone || "—",
        area: l.areaId?.name || l.area || l.territory || l.zone || "—",
        lastActivity:
          l.status === "WON"
            ? "Order confirmed"
            : l.status === "QUOTATION"
            ? "Quotation created"
            : l.notes || "Inquiry recorded",
        activityTime: timeStr,
        status: statusBadge,
        nextFollowup: l.nextFollowUp
          ? new Date(l.nextFollowUp).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
            })
          : "—",
        quotation: quoteVal,
        orderValue: orderVal,
      };
    });
  }, [filteredData.leads, realQuotations, realOrders]);

  // Status badge styling helper
  const getStatusBadge = (status) => {
    switch (status) {
      case "Follow-up":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "Quotation":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      case "Order":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "New":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "Lost":
        return "bg-slate-100 text-slate-600 border border-slate-200";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200";
    }
  };

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Navbar */}
        <Navbar />

        <div className="flex-1 p-3.5 sm:p-5 lg:p-6 space-y-4 max-w-[1720px] mx-auto w-full">
          {/* HEADER SECTION */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
                <BarChart2 className="w-6 h-6 text-white stroke-[2.2]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>My Performance</span>
                  <span className="text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                    Live Data
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Dynamic performance metrics, sales activities and target achievements
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap sm:flex-nowrap">
              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => fetchPerformanceData(true)}
                disabled={isRefreshing}
                className="p-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 hover:text-slate-900 shadow-2xs transition-colors cursor-pointer"
                title="Refresh live performance data"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`}
                />
              </button>

              {/* Date display button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDatePickerOpen(!datePickerOpen)}
                  className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>{formattedSelectedDate}</span>
                </button>

                {datePickerOpen && (
                  <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-30">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Select Date
                    </p>
                    <input
                      type="date"
                      defaultValue={selectedDateObj.toISOString().split("T")[0]}
                      onChange={(e) => {
                        if (e.target.value) {
                          setSelectedDateObj(new Date(e.target.value));
                          setDatePickerOpen(false);
                        }
                      }}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* View Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm shadow-blue-500/25 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>{selectedPeriodView}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30">
                    {[
                      { label: "Today", tab: "Today" },
                      { label: "View This Week", tab: "Weekly" },
                      { label: "View This Month", tab: "Monthly" },
                      { label: "All Records", tab: "Custom Range" },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => {
                          setSelectedPeriodView(opt.label);
                          setActiveTab(opt.tab);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-medium hover:bg-slate-50 transition-colors flex items-center justify-between ${
                          selectedPeriodView === opt.label
                            ? "text-blue-600 font-bold bg-blue-50/50"
                            : "text-slate-700"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {selectedPeriodView === opt.label && (
                          <Check className="w-3.5 h-3.5 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TIMEFRAME SUB-TABS */}
          <div className="border-b border-slate-200/90 flex items-center gap-6 text-xs font-bold pt-1">
            {[
              { id: "Today", label: "Today" },
              { id: "Weekly", label: "Weekly" },
              { id: "Monthly", label: "Monthly" },
              { id: "Custom Range", label: "All Records" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "Today") setSelectedPeriodView("Today");
                  else if (tab.id === "Weekly") setSelectedPeriodView("View This Week");
                  else if (tab.id === "Monthly") setSelectedPeriodView("View This Month");
                  else setSelectedPeriodView("All Records");
                }}
                className={`pb-2.5 transition-all relative cursor-pointer ${
                  activeTab === tab.id
                    ? "text-blue-600 font-bold"
                    : "text-slate-500 hover:text-slate-800 font-medium"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* ROW 1: 6 DYNAMIC KPI METRIC CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
            {/* Card 1: Leads Assigned */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-[11px] font-semibold text-slate-500 truncate">Leads Assigned</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-slate-900">{metrics.leadsAssigned}</span>
                <span className="text-[10px] font-bold text-blue-600">{metrics.leadsTrend}</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">{metrics.periodSubtext}</span>
            </div>

            {/* Card 2: Calls Made */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <PhoneCall className="w-5 h-5" />
              </div>
              <p className="text-[11px] font-semibold text-slate-500 truncate">Calls Made</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-slate-900">{metrics.callsMade}</span>
                <span className="text-[10px] font-bold text-emerald-600">{metrics.callsTrend}</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">{metrics.periodSubtext}</span>
            </div>

            {/* Card 3: Connected */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <PhoneIncoming className="w-5 h-5" />
              </div>
              <p className="text-[11px] font-semibold text-slate-500 truncate">Connected</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-slate-900">{metrics.connected}</span>
                <span className="text-xs font-bold text-slate-700">{metrics.connectedRate}</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block truncate">
                {metrics.connectedOutOf}
              </span>
            </div>

            {/* Card 4: Quotations Sent */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <p className="text-[11px] font-semibold text-slate-500 truncate">Quotations Sent</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-slate-900">{metrics.quotationsSent}</span>
                <span className="text-[10px] font-bold text-purple-600">{metrics.quotationsTrend}</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">{metrics.periodSubtext}</span>
            </div>

            {/* Card 5: Orders Received */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <p className="text-[11px] font-semibold text-slate-500 truncate">Orders Received</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-slate-900">{metrics.ordersReceived}</span>
                <span className="text-[10px] font-bold text-rose-600">{metrics.ordersTrend}</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">{metrics.periodSubtext}</span>
            </div>

            {/* Card 6: Sales Amount */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
                <IndianRupee className="w-5 h-5" />
              </div>
              <p className="text-[11px] font-semibold text-slate-500 truncate">Sales Amount</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-slate-900 truncate">
                  {metrics.salesAmount}
                </span>
                <span className="text-[10px] font-bold text-teal-600">{metrics.salesTrend}</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">{metrics.periodSubtext}</span>
            </div>
          </div>

          {/* ROW 2: ACTIVITY TIMELINE | TARGET PROGRESS | LEAD STATUS DISTRIBUTION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* 1. Activity Timeline */}
            <div className="lg:col-span-6 bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    {activeTab === "Weekly"
                      ? "Weekly Activity Timeline"
                      : activeTab === "Monthly"
                      ? "Monthly Activity Timeline"
                      : "Activity Timeline (Live)"}
                  </h3>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 text-[11px] font-semibold">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                    <span>Calls</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                    <span>Connected</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
                    <span>Follow-ups</span>
                  </div>
                </div>
              </div>

              {/* Grouped Bar Chart */}
              <div className="relative pt-4 pb-2">
                {/* Horizontal grid lines */}
                <div className="absolute inset-x-8 top-4 bottom-7 flex flex-col justify-between pointer-events-none opacity-40">
                  <div className="border-b border-dashed border-slate-200 w-full" />
                  <div className="border-b border-dashed border-slate-200 w-full" />
                  <div className="border-b border-dashed border-slate-200 w-full" />
                  <div className="border-b border-dashed border-slate-200 w-full" />
                </div>

                {/* Y-axis labels */}
                <div className="absolute left-0 top-3 bottom-7 flex flex-col justify-between text-[10px] font-bold text-slate-400">
                  <span>{maxTimelineVal}</span>
                  <span>{Math.round(maxTimelineVal * 0.66)}</span>
                  <span>{Math.round(maxTimelineVal * 0.33)}</span>
                  <span>0</span>
                </div>

                {/* Bars Area */}
                <div className="ml-7 grid grid-flow-col auto-cols-fr gap-1 sm:gap-2 h-44 items-end pb-7 border-b border-slate-200">
                  {timelineData.map((slot) => {
                    const cHeight =
                      slot.calls > 0 ? Math.max(8, (slot.calls / maxTimelineVal) * 100) : 0;
                    const connHeight =
                      slot.connected > 0
                        ? Math.max(6, (slot.connected / maxTimelineVal) * 100)
                        : 0;
                    const fHeight =
                      slot.followups > 0
                        ? Math.max(6, (slot.followups / maxTimelineVal) * 100)
                        : 0;

                    return (
                      <div
                        key={slot.time}
                        className="flex flex-col items-center h-full justify-end group"
                      >
                        {/* Bars cluster */}
                        <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-36">
                          {/* Calls Made Bar */}
                          <div className="flex flex-col items-center justify-end h-full">
                            {slot.calls > 0 && (
                              <span className="text-[9px] font-black text-slate-700 mb-0.5 opacity-90">
                                {slot.calls}
                              </span>
                            )}
                            <div
                              style={{ height: `${cHeight}%` }}
                              className="w-1.5 sm:w-2.5 bg-[#2563EB] rounded-t-sm hover:opacity-90 transition-all cursor-pointer"
                              title={`${slot.calls} Calls at ${slot.time}`}
                            />
                          </div>

                          {/* Connected Bar */}
                          <div className="flex flex-col items-center justify-end h-full">
                            {slot.connected > 0 && (
                              <span className="text-[9px] font-black text-slate-700 mb-0.5 opacity-90">
                                {slot.connected}
                              </span>
                            )}
                            <div
                              style={{ height: `${connHeight}%` }}
                              className="w-1.5 sm:w-2.5 bg-[#10B981] rounded-t-sm hover:opacity-90 transition-all cursor-pointer"
                              title={`${slot.connected} Connected at ${slot.time}`}
                            />
                          </div>

                          {/* Follow-ups Bar */}
                          <div className="flex flex-col items-center justify-end h-full">
                            {slot.followups > 0 && (
                              <span className="text-[9px] font-black text-slate-700 mb-0.5 opacity-90">
                                {slot.followups}
                              </span>
                            )}
                            <div
                              style={{ height: `${fHeight}%` }}
                              className="w-1.5 sm:w-2.5 bg-[#F97316] rounded-t-sm hover:opacity-90 transition-all cursor-pointer"
                              title={`${slot.followups} Follow-ups at ${slot.time}`}
                            />
                          </div>
                        </div>

                        {/* X-axis label */}
                        <span className="text-[10px] font-semibold text-slate-500 mt-2 truncate">
                          {slot.time}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. Target Progress */}
            <div className="lg:col-span-3 bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Target className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                      Target Progress
                    </h3>
                  </div>
                  {targetData.dailyQuotaDisplay && activeTab === "Monthly" && (
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      Daily: {targetData.dailyQuotaDisplay}
                    </span>
                  )}
                </div>

                <div className="mb-2">
                  <p className="text-[11px] font-semibold text-slate-400">
                    {targetData.targetLabel}
                  </p>
                  <p className="text-lg font-black text-slate-900">
                    {targetData.targetAmount}
                  </p>
                </div>
              </div>

              {/* Circular Gauge */}
              <div className="relative flex items-center justify-center my-3">
                <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
                  {/* Track */}
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    stroke="#E2E8F0"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  {/* Progress Fill */}
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    stroke={targetData.percentage >= 100 ? "#059669" : "#10B981"}
                    strokeWidth="12"
                    strokeDasharray={2 * Math.PI * 48}
                    strokeDashoffset={2 * Math.PI * 48 * (1 - targetData.percentage / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>

                {/* Inner Info */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-slate-900 leading-tight">
                    {targetData.percentage}%
                  </span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5">
                    {targetData.achieved}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">Achieved</span>
                </div>
              </div>

              {/* Bottom footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="font-bold text-rose-600 block">{targetData.remaining}</span>
                  <span className="text-[10px] text-slate-400 font-medium">Remaining</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-600 block">{targetData.statusFooter}</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {activeTab === "Today"
                      ? "Status"
                      : activeTab === "Weekly"
                      ? "Period"
                      : "Timeline"}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Lead Status Distribution */}
            <div className="lg:col-span-3 bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Lead Status Distribution
                </h3>
              </div>

              <div className="flex items-center justify-between gap-3 my-auto">
                {/* Donut Chart */}
                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                  <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#E2E8F0"
                      strokeWidth="11"
                      fill="transparent"
                    />
                    {statusDistribution.map((item, idx) => {
                      const totalCount = filteredData.leads.length || 1;
                      const segmentPct = item.count / totalCount;
                      const dashLength = segmentPct * 238;

                      // Calculate previous offset
                      const priorCount = statusDistribution
                        .slice(0, idx)
                        .reduce((acc, curr) => acc + curr.count, 0);
                      const offset = -((priorCount / totalCount) * 238);

                      return (
                        <circle
                          key={item.label}
                          cx="50"
                          cy="50"
                          r="38"
                          stroke={item.color}
                          strokeWidth="11"
                          strokeDasharray={`${dashLength} 238`}
                          strokeDashoffset={offset}
                          fill="transparent"
                          className="transition-all duration-700"
                        />
                      );
                    })}
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-black text-slate-900 leading-none">
                      {filteredData.leads.length}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400 mt-0.5">
                      Total Leads
                    </span>
                  </div>
                </div>

                {/* Legend List */}
                <div className="flex-1 space-y-1.5 min-w-0">
                  {statusDistribution.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between text-[11px] gap-1"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-slate-600 truncate font-medium">
                          {item.label}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 shrink-0">
                        {item.count}{" "}
                        <span className="text-slate-400 font-normal">
                          ({item.percentage})
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ROW 3: LEADS STATUS BARS | TOP PERFORMING AREAS | CONVERSION FUNNEL */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Leads Status Breakdown */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  {activeTab === "Weekly"
                    ? "Weekly Leads Status"
                    : activeTab === "Monthly"
                    ? "Monthly Leads Status"
                    : "Leads Status Progress"}
                </h3>
              </div>

              <div className="space-y-3.5 my-auto">
                {leadsStatusBars.map((bar) => (
                  <div key={bar.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700">{bar.label}</span>
                      <span className="text-slate-900 font-bold">
                        {bar.count}{" "}
                        <span className="text-slate-400 font-normal">({bar.pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${bar.pct}%`,
                          backgroundColor: bar.barColor,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Top Performing Areas */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Top Performing Areas
                </h3>
              </div>

              <div className="space-y-3.5 my-auto">
                {topAreas.map((area) => (
                  <div key={area.name} className="flex items-center gap-2.5 text-xs">
                    {/* Ranked badge */}
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${area.badgeColor}`}
                    >
                      {area.rank}
                    </div>

                    {/* Area Name */}
                    <span className="font-bold text-slate-800 w-28 truncate">{area.name}</span>

                    {/* Leads count */}
                    <span className="text-slate-500 font-medium text-[11px] w-14 shrink-0">
                      {area.leads} leads
                    </span>

                    {/* Progress Bar */}
                    <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#2563EB] rounded-full transition-all duration-700"
                        style={{ width: `${area.percentage}%` }}
                      />
                    </div>

                    {/* Percentage */}
                    <span className="text-slate-700 font-bold text-[11px] w-8 text-right shrink-0">
                      {area.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Conversion Funnel */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Filter className="w-4 h-4" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Conversion Funnel
                </h3>
              </div>

              {/* Tapered Funnel Blocks */}
              <div className="space-y-1.5 my-auto flex flex-col items-center">
                {funnelSteps.map((step) => (
                  <div
                    key={step.label}
                    style={{ width: step.width }}
                    className={`${step.bg} text-white py-1.5 px-3 rounded-md text-[11px] font-bold shadow-xs flex items-center justify-between transition-all hover:scale-[1.02] cursor-pointer`}
                  >
                    <span className="font-black text-xs w-6">{step.count}</span>
                    <span className="font-semibold truncate">{step.label}</span>
                    <span className="font-bold opacity-90">{step.pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ROW 4: HANDLED LEADS TABLE */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Handled Leads &amp; Recent Activity
                </h3>
              </div>

              <Link
                href="/dashboard/leads"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                <span>View All Leads ({realLeads.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400">
                    <th className="py-3 px-4 w-10">#</th>
                    <th className="py-3 px-4">Lead ID</th>
                    <th className="py-3 px-4">Business / Contact</th>
                    <th className="py-3 px-4">Area</th>
                    <th className="py-3 px-4">Last Activity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Next Follow-up</th>
                    <th className="py-3 px-4">Quotation</th>
                    <th className="py-3 px-4">Order Value</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {handledLeads.length > 0 ? (
                    handledLeads.map((item, idx) => (
                      <tr
                        key={item.id + idx}
                        className="hover:bg-slate-50/60 transition-colors group text-slate-700"
                      >
                        <td className="py-3 px-4 font-semibold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-800 font-mono">
                          {item.id}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0 border border-blue-100">
                              <Store className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="truncate block font-bold text-slate-900">
                                {item.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium block">
                                {item.contactName} • {item.phone}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{item.area}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{item.lastActivity}</div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {item.activityTime}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold ${getStatusBadge(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{item.nextFollowup}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {item.quotation ? `₹ ${item.quotation.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {item.orderValue ? `₹ ${item.orderValue.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 relative">
                            <button
                              type="button"
                              onClick={() => setSelectedLeadModal(item)}
                              className="px-3 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-blue-600 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                            >
                              View
                            </button>

                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setLeadActionMenu(leadActionMenu === item.id ? null : item.id)
                                }
                                className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {leadActionMenu === item.id && (
                                <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 text-left">
                                  <Link
                                    href={`/dashboard/leads/${item.rawId || item.id}`}
                                    className="w-full block px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                                  >
                                    Open Lead Workspace
                                  </Link>
                                  <Link
                                    href="/dashboard/followups"
                                    className="w-full block px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                                  >
                                    Add Follow-up
                                  </Link>
                                  <Link
                                    href="/dashboard/quotations"
                                    className="w-full block px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                                  >
                                    Create Quotation
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        No handled leads found. Create leads or follow-ups to populate this table.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* MODAL: VIEW LEAD SUMMARY */}
        {selectedLeadModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {selectedLeadModal.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium font-mono">
                      {selectedLeadModal.id} • {selectedLeadModal.area}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLeadModal(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Current Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${getStatusBadge(
                      selectedLeadModal.status
                    )}`}
                  >
                    {selectedLeadModal.status}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Contact Person:</span>
                  <span className="font-bold text-slate-800">
                    {selectedLeadModal.contactName} ({selectedLeadModal.phone})
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Last Action:</span>
                  <span className="font-bold text-slate-800">
                    {selectedLeadModal.lastActivity} ({selectedLeadModal.activityTime})
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Next Follow-up:</span>
                  <span className="font-bold text-slate-800">
                    {selectedLeadModal.nextFollowup}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Quotation Value:</span>
                  <span className="font-bold text-slate-900">
                    {selectedLeadModal.quotation
                      ? `₹ ${selectedLeadModal.quotation.toLocaleString("en-IN")}`
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Order Confirmed Value:</span>
                  <span className="font-bold text-emerald-600">
                    {selectedLeadModal.orderValue
                      ? `₹ ${selectedLeadModal.orderValue.toLocaleString("en-IN")}`
                      : "Pending"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Link
                  href={`/dashboard/leads/${selectedLeadModal.rawId || selectedLeadModal.id}`}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold text-center shadow-xs"
                >
                  Open Lead Workspace
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedLeadModal(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
