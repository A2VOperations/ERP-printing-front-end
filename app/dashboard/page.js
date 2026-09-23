"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";

import {
  TrendingUp,
  Users,
  Clock,
  ShoppingBag,
  CreditCard,
  Plus,
  PhoneCall,
  MessageSquare,
  Eye,
  MapPin,
  Award,
  Bell,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ArrowRight,
  FileText,
  Upload,
  Trophy,
  DollarSign,
  Activity,
  Check,
  RefreshCw,
  Lock,
  UserCheck,
  Loader2,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [timeframe, setTimeframe] = useState("This Month");
  const [loading, setLoading] = useState(true);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [creatingLead, setCreatingLead] = useState(false);

  // Live Data States
  const [leads, setLeads] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [activities, setActivities] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
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
      setLoading(true);

      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setCurrentUser(JSON.parse(storedUser));
      } catch (e) {}

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
      ] = await Promise.allSettled([
        api.get("/leads?limit=10"),
        api.get("/followups?limit=10"),
        api.get("/orders?limit=10"),
        api.get("/targets/my-achievement"),
        api.get("/targets/leaderboard"),
        api.get("/users"),
        api.get("/auth/me"),
        api.get("/leads/stats"),
        api.get("/activities?limit=10"),
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
    const storedName = localStorage.getItem("userName");
    if (storedName) setUserName(storedName.split(" ")[0] || storedName);
    loadDashboardData();
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

  // Authoritative dynamic computations from backend data
  const stageCounts = leadStats?.stageCounts || {};
  const totalLeadsCount = leadStats?.totalLeads ?? leads.length;
  const newLeadsCount =
    leadStats?.newLeads ??
    (stageCounts["NEW"] ?? leads.filter((l) => l.status === "NEW").length);

  const contactedCount =
    leadStats?.stageCounts && Object.keys(leadStats.stageCounts).length > 0
      ? (stageCounts["CONTACTED"] || 0) +
        (stageCounts["INTERESTED"] || 0) +
        (stageCounts["QUOTATION_SENT"] || 0) +
        (stageCounts["NEGOTIATION"] || 0) +
        (stageCounts["WON"] || 0)
      : leads.filter((l) =>
          [
            "CONTACTED",
            "INTERESTED",
            "QUOTATION_SENT",
            "NEGOTIATION",
            "WON",
          ].includes(l.status),
        ).length;

  const interestedCount =
    leadStats?.stageCounts && Object.keys(leadStats.stageCounts).length > 0
      ? (stageCounts["INTERESTED"] || 0) +
        (stageCounts["QUOTATION_SENT"] || 0) +
        (stageCounts["NEGOTIATION"] || 0) +
        (stageCounts["WON"] || 0)
      : leads.filter((l) =>
          ["INTERESTED", "QUOTATION_SENT", "NEGOTIATION", "WON"].includes(
            l.status,
          ),
        ).length;

  const quotationSentCount =
    leadStats?.stageCounts && Object.keys(leadStats.stageCounts).length > 0
      ? (stageCounts["QUOTATION_SENT"] || 0) +
        (stageCounts["NEGOTIATION"] || 0) +
        (stageCounts["WON"] || 0)
      : leads.filter((l) =>
          ["QUOTATION_SENT", "NEGOTIATION", "WON"].includes(l.status),
        ).length;

  const wonCount =
    leadStats?.wonLeads ??
    (stageCounts["WON"] ?? leads.filter((l) => l.status === "WON").length);

  const funnelStages = [
    {
      id: "new",
      label: "New Lead",
      shortLabel: "New",
      count: totalLeadsCount,
      color: "#34D399",
      bgClass: "bg-[#34D399]",
      widthClass: "w-full",
    },
    {
      id: "contacted",
      label: "Contacted",
      shortLabel: "Contacted",
      count: contactedCount,
      color: "#60A5FA",
      bgClass: "bg-[#60A5FA]",
      widthClass: "w-[85%]",
    },
    {
      id: "interested",
      label: "Interested",
      shortLabel: "Interested",
      count: interestedCount,
      color: "#FBBF24",
      bgClass: "bg-[#FBBF24]",
      widthClass: "w-[70%]",
    },
    {
      id: "quotation",
      label: "Quotation",
      shortLabel: "Quotes",
      count: quotationSentCount,
      color: "#C084FC",
      bgClass: "bg-[#C084FC]",
      widthClass: "w-[55%]",
    },
    {
      id: "order",
      label: "Order",
      shortLabel: "Orders",
      count: wonCount,
      color: "#F472B6",
      bgClass: "bg-[#F472B6]",
      widthClass: "w-[40%]",
    },
  ];

  const totalSalesPaise = orders.reduce(
    (sum, o) =>
      sum + (o.grandTotalPaise || (o.grandTotal ? o.grandTotal * 100 : 0)),
    0,
  );
  const totalSalesRupees = totalSalesPaise / 100;

  const totalPaymentsPaise = orders.reduce(
    (sum, o) => sum + (o.paidPaise || (o.paidAmount ? o.paidAmount * 100 : 0)),
    0,
  );
  const totalPaymentsRupees = totalPaymentsPaise / 100;

  const targetRupees = targetProgress?.targetPaise
    ? targetProgress.targetPaise / 100
    : targetProgress?.target || 0;
  const achievedRupees = targetProgress?.achievedPaise
    ? targetProgress.achievedPaise / 100
    : targetProgress?.achieved || totalSalesRupees;
  const targetPercent =
    targetRupees > 0 ? ((achievedRupees / targetRupees) * 100).toFixed(0) : 0;

  const pendingFollowupsCount = followups.filter(
    (f) => f.status === "PENDING",
  ).length;

  const displayActivities = useMemo(() => {
    const list = [];

    // 1. Live activity events from database
    if (activities && activities.length > 0) {
      activities.forEach((act) => {
        const time = act.occurredAt || act.createdAt;
        let icon = Activity;
        let iconBg = "bg-blue-50 text-blue-600";
        let badgeColor = "bg-blue-50 text-blue-700 border-blue-200";
        let link = "/dashboard/followups";

        if (act.entityType === "PAYMENT" || act.eventType?.includes("PAYMENT")) {
          icon = CreditCard;
          iconBg = "bg-teal-50 text-teal-600";
          badgeColor = "bg-teal-50 text-teal-700 border-teal-200";
          link = "/dashboard/payments";
        } else if (act.entityType === "ORDER" || act.eventType?.includes("ORDER")) {
          icon = ShoppingBag;
          iconBg = "bg-indigo-50 text-indigo-600";
          badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200";
          link = "/dashboard/orders";
        } else if (act.entityType === "QUOTATION" || act.eventType?.includes("QUOTATION")) {
          icon = FileText;
          iconBg = "bg-purple-50 text-purple-600";
          badgeColor = "bg-purple-50 text-purple-700 border-purple-200";
          link = "/dashboard/quotations";
        } else if (act.entityType === "LEAD" || act.eventType?.includes("LEAD")) {
          icon = Users;
          iconBg = "bg-blue-50 text-blue-600";
          badgeColor = "bg-blue-50 text-blue-700 border-blue-200";
          link = act.entityId ? `/dashboard/leads/${act.entityId}` : "/dashboard/leads";
        }

        let title = act.eventType
          ? act.eventType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
          : "Activity Logged";

        if (act.eventType === "LEAD_CREATED") title = "New Lead Created";
        else if (act.eventType === "STATUS_CHANGED") title = "Status Updated";
        else if (act.eventType === "QUOTATION_CREATED") title = "Quotation Drafted";
        else if (act.eventType === "QUOTATION_SENT") title = "Quotation Dispatched";
        else if (act.eventType === "QUOTATION_ACCEPTED") title = "Quotation Accepted";
        else if (act.eventType === "ORDER_CREATED_FROM_QUOTATION" || act.eventType === "ORDER_CREATED") title = "Order Confirmed";
        else if (act.eventType === "PAYMENT_RECORDED") title = "Payment Received";

        list.push({
          id: act._id || Math.random().toString(),
          timestamp: new Date(time).getTime(),
          timeStr: time
            ? new Date(time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
            : "Today",
          icon,
          iconBg,
          title,
          description: act.summary || act.description || "Activity recorded in system",
          badge: act.entityType || "SYSTEM",
          badgeColor,
          link,
        });
      });
    }

    // 2. Also incorporate any scheduled follow-ups
    if (followups && followups.length > 0) {
      followups.forEach((f) => {
        const time = f.scheduledAt || f.updatedAt || f.createdAt;
        const isDone = f.status === "COMPLETED";
        list.push({
          id: `flw-${f._id}`,
          timestamp: new Date(time).getTime(),
          timeStr: time
            ? new Date(time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
            : "Today",
          icon: f.type === "WHATSAPP" ? MessageSquare : PhoneCall,
          iconBg: isDone ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600",
          title: f.title || (isDone ? "Follow-up Done" : "Call Follow-up"),
          description: f.notes || "Client follow-up scheduled",
          badge: f.status || "PENDING",
          badgeColor: isDone ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200",
          link: "/dashboard/followups",
        });
      });
    }

    // 3. Fallback: synthesize from orders and leads if no ActivityEvents or followups
    if (list.length === 0) {
      orders.forEach((o) => {
        const time = o.orderDate || o.createdAt;
        list.push({
          id: `ord-${o._id}`,
          timestamp: new Date(time).getTime(),
          timeStr: time
            ? new Date(time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
            : "Today",
          icon: ShoppingBag,
          iconBg: "bg-indigo-50 text-indigo-600",
          title: `Order ${o.orderNumber || "Confirmed"}`,
          description: `${o.customerSnapshot?.companyName || o.customerSnapshot?.displayName || "Customer"} • ₹${((o.grandTotalPaise || 0) / 100).toLocaleString("en-IN")}`,
          badge: "ORDER",
          badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
          link: "/dashboard/orders",
        });
      });

      leads.forEach((l) => {
        const time = l.createdAt;
        list.push({
          id: `ld-${l._id}`,
          timestamp: new Date(time).getTime(),
          timeStr: time
            ? new Date(time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
            : "Today",
          icon: Users,
          iconBg: "bg-blue-50 text-blue-600",
          title: `Lead Added (${l.status || "NEW"})`,
          description: `${l.contactName || "Lead"} ${l.businessName ? `• ${l.businessName}` : ""}`,
          badge: "LEAD",
          badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
          link: `/dashboard/leads/${l._id}`,
        });
      });
    }

    return list.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  }, [activities, followups, orders, leads]);

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Greeting Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                Good Morning, {userName}! 👋
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Here&apos;s what&apos;s happening with your sales today.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadDashboardData}
                disabled={loading}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs"
                title="Refresh live data"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`}
                />
              </button>

              <div className="relative">
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 pr-8 rounded-xl focus:outline-none shadow-xs cursor-pointer"
                >
                  <option>This Month</option>
                  <option>This Quarter</option>
                  <option>This Year</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              <button
                onClick={() => setShowAddLeadModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-600/25 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Lead
              </button>
            </div>
          </div>

          {/* 5 KPI Metric Cards with Live Values */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Card 1: Total Sales */}
            <div className="bg-white rounded-md p-4 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium">
                    Total Sales
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                    ₹{totalSalesRupees.toLocaleString("en-IN")}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    <strong className="text-emerald-600 font-bold">
                      {targetPercent}%
                    </strong>{" "}
                    of ₹{targetRupees.toLocaleString("en-IN")} Target
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="h-9 w-full">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 100 30"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,25 Q25,5 50,20 T100,5 L100,30 L0,30 Z"
                    fill="rgba(16, 185, 129, 0.08)"
                  />
                  <path
                    d="M0,25 Q25,5 50,20 T100,5"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Card 2: Leads Assigned */}
            <div className="bg-white rounded-md p-4 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium">
                    Leads Assigned
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                    {totalLeadsCount}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    <strong className="text-emerald-600 font-bold">
                      {newLeadsCount}
                    </strong>{" "}
                    New this month
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="h-9 w-full">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 100 30"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,25 Q20,15 45,22 T100,8 L100,30 L0,30 Z"
                    fill="rgba(59, 130, 246, 0.08)"
                  />
                  <path
                    d="M0,25 Q20,15 45,22 T100,8"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Card 3: Follow-ups Due */}
            <div className="bg-white rounded-md p-4 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium">
                    Follow-ups Due
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                    {pendingFollowupsCount}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    <strong className="text-amber-600 font-bold">
                      {
                        followups.filter(
                          (f) =>
                            f.priority === "HIGH" && f.status === "PENDING",
                        ).length
                      }
                    </strong>{" "}
                    High Priority
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="h-9 w-full">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 100 30"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,20 Q30,28 60,10 T100,12 L100,30 L0,30 Z"
                    fill="rgba(245, 158, 11, 0.08)"
                  />
                  <path
                    d="M0,20 Q30,28 60,10 T100,12"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Card 4: Orders Confirmed */}
            <div className="bg-white rounded-md p-4 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium">
                    Orders Confirmed
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                    {orders.length}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    <strong className="text-purple-600 font-bold">
                      ₹{totalSalesRupees.toLocaleString("en-IN")}
                    </strong>{" "}
                    Value
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="h-9 w-full">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 100 30"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,24 Q35,8 65,22 T100,6 L100,30 L0,30 Z"
                    fill="rgba(147, 51, 234, 0.08)"
                  />
                  <path
                    d="M0,24 Q35,8 65,22 T100,6"
                    fill="none"
                    stroke="#9333EA"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Card 5: Payments Received */}
            <div className="bg-white rounded-md p-4 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium">
                    Payments Received
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                    ₹{totalPaymentsRupees.toLocaleString("en-IN")}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    This month
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div className="h-9 w-full">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 100 30"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,22 Q30,12 55,20 T100,4 L100,30 L0,30 Z"
                    fill="rgba(244, 63, 94, 0.08)"
                  />
                  <path
                    d="M0,22 Q30,12 55,20 T100,4"
                    fill="none"
                    stroke="#F43F5E"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Middle 3 Columns Section: Funnel (4 Cols) + Today's Activities (4 Cols) + Quick Actions (4 Cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Column 1: Sales Pipeline Funnel (4 Cols) */}
            <div className="lg:col-span-4 bg-white rounded-md p-5 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <h2 className="text-xs font-bold text-slate-900">
                  Sales Pipeline
                </h2>

                {/* Funnel Layout */}
                <div className="flex items-center gap-4 pt-3">
                  {/* Visual Trapezoids */}
                  <div className="flex flex-col items-center w-44 space-y-1.5">
                    {funnelStages.map((stage) => (
                      <div
                        key={stage.id}
                        className={`${stage.widthClass} ${stage.bgClass} text-white text-[11px] font-bold py-2 px-3 rounded-md flex justify-between items-center shadow-xs transition-all hover:brightness-105`}
                        title={`${stage.label}: ${stage.count}`}
                      >
                        <span>{stage.label}</span>
                        <span>{stage.count}</span>
                      </div>
                    ))}
                  </div>

                  {/* Funnel Stats Table */}
                  <div className="flex-1 space-y-2.5 text-xs">
                    <div className="grid grid-cols-2 text-[10px] text-slate-400 font-bold uppercase pb-1 border-b border-slate-100">
                      <span>Stage</span>
                      <span className="text-right">Conversion</span>
                    </div>
                    {funnelStages.map((stage) => {
                      const conversionPct =
                        totalLeadsCount > 0
                          ? (
                              (stage.count / totalLeadsCount) *
                              100
                            ).toFixed(0)
                          : 0;

                      return (
                        <div
                          key={stage.id}
                          className="grid grid-cols-2 font-semibold text-slate-800"
                        >
                          <span className="truncate">
                            {stage.shortLabel} ({stage.count})
                          </span>
                          <span className="text-right font-bold text-slate-900">
                            {conversionPct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Overall Conversion Rate</span>
                <span className="text-emerald-600 text-sm font-extrabold">
                  {totalLeadsCount > 0
                    ? ((wonCount / totalLeadsCount) * 100).toFixed(1)
                    : "0.0"}
                  %
                </span>
              </div>
            </div>

            {/* Column 2: Today's Activities (4 Cols) */}
            <div className="lg:col-span-4 bg-white rounded-md p-5 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1">
                  <h3 className="text-xs font-bold text-slate-900">
                    Today&apos;s Activities
                  </h3>
                  <span className="text-[10px] font-semibold text-slate-400">
                    Live Feed
                  </span>
                </div>

                <div className="space-y-3 pt-2 text-xs">
                  {displayActivities.length > 0 ? (
                    displayActivities.map((act) => {
                      const IconComp = act.icon;
                      return (
                        <div
                          key={act.id}
                          onClick={() => act.link && router.push(act.link)}
                          className="flex items-center justify-between gap-2 p-1.5 -mx-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="text-[10px] text-slate-400 w-14 shrink-0 font-medium font-mono">
                              {act.timeStr}
                            </span>
                            <div
                              className={`w-6 h-6 rounded-full ${act.iconBg} flex items-center justify-center shrink-0`}
                            >
                              <IconComp className="w-3 h-3" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-900 text-xs truncate">
                                {act.title}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {act.description}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${act.badgeColor}`}
                          >
                            {act.badge}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-blue-400 border-2 border-blue-200">
                        <Calendar className="w-6 h-6 stroke-[1.5]" />
                      </div>
                      <p className="text-slate-400 text-xs font-medium">
                        No activities recorded yet today.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => router.push("/dashboard/followups")}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                >
                  View All Activities →
                </button>
              </div>
            </div>

            {/* Column 3: Quick Actions (4 Cols) */}
            <div className="lg:col-span-4 bg-white rounded-md p-5 border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 pb-1">
                  Quick Actions
                </h3>

                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  {/* 1. Lead */}
                  <button
                    onClick={() => setShowAddLeadModal(true)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-blue-50/60 hover:bg-blue-100/70 text-blue-600 border border-blue-100 transition-colors text-left"
                  >
                    <Users className="w-4 h-4 shrink-0 text-blue-600" />
                    <span className="text-xs font-bold">Lead</span>
                  </button>

                  {/* 2. Log a Call */}
                  <button
                    onClick={() => router.push("/dashboard/followups")}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-rose-50/60 hover:bg-rose-100/70 text-rose-600 border border-rose-100 transition-colors text-left"
                  >
                    <PhoneCall className="w-4 h-4 shrink-0 text-rose-600" />
                    <span className="text-xs font-bold">Log a Call</span>
                  </button>

                  {/* 3. Send WhatsApp */}
                  <button
                    onClick={() => router.push("/dashboard/whatsapp")}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-600 border border-emerald-100 transition-colors text-left"
                  >
                    <MessageSquare className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span className="text-xs font-bold">Send WhatsApp</span>
                  </button>

                  {/* 4. Create Quotation */}
                  <button
                    onClick={() => router.push("/dashboard/quotations")}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-purple-50/60 hover:bg-purple-100/70 text-purple-600 border border-purple-100 transition-colors text-left"
                  >
                    <FileText className="w-4 h-4 shrink-0 text-purple-600" />
                    <span className="text-xs font-bold">Create Quotation</span>
                  </button>

                  {/* 5. Add New Order */}
                  <button
                    onClick={() => router.push("/dashboard/orders")}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-indigo-50/60 hover:bg-indigo-100/70 text-indigo-600 border border-indigo-100 transition-colors text-left"
                  >
                    <ShoppingBag className="w-4 h-4 shrink-0 text-indigo-600" />
                    <span className="text-xs font-bold">Add New Order</span>
                  </button>

                  {/* 6. Record Payment */}
                  <button
                    onClick={() => router.push("/dashboard/payments")}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-teal-50/60 hover:bg-teal-100/70 text-teal-600 border border-teal-100 transition-colors text-left"
                  >
                    <CreditCard className="w-4 h-4 shrink-0 text-teal-600" />
                    <span className="text-xs font-bold">Record Payment</span>
                  </button>

                  {/* 7. Upload Design */}
                  <button
                    onClick={() => router.push("/dashboard/design")}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-amber-50/60 hover:bg-amber-100/70 text-amber-600 border border-amber-100 transition-colors text-left"
                  >
                    <Upload className="w-4 h-4 shrink-0 text-amber-600" />
                    <span className="text-xs font-bold">Upload Design</span>
                  </button>

                  {/* 8. Schedule Follow-up */}
                  <button
                    onClick={() => router.push("/dashboard/followups")}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-red-50/60 hover:bg-red-100/70 text-red-600 border border-red-100 transition-colors text-left"
                  >
                    <Clock className="w-4 h-4 shrink-0 text-red-600" />
                    <span className="text-xs font-bold">Schedule Follow-up</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Recent Leads (8 Cols) + Top Performers & Status (4 Cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Recent Leads Table (8 Cols) */}
            <div className="lg:col-span-8 bg-white rounded-md p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">
                  Recent Leads
                </h3>
                <button
                  onClick={() => router.push("/dashboard/leads")}
                  className="text-[10px] font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  View All Leads →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold">
                      <th className="pb-2">Lead / Business</th>
                      <th className="pb-2">Contact</th>
                      <th className="pb-2">Source</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Value</th>
                      <th className="pb-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {leads.length > 0 ? (
                      leads.slice(0, 5).map((lead) => (
                        <tr
                          key={lead._id}
                          onClick={() =>
                            router.push(`/dashboard/leads/${lead._id}`)
                          }
                          className="hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <td className="py-3 font-bold text-slate-900">
                            {lead.companyName || lead.businessName || lead.name}
                          </td>
                          <td className="py-3 text-slate-600">{lead.phone}</td>
                          <td className="py-3 text-slate-500 uppercase">{lead.source || "MANUAL"}</td>
                          <td className="py-3">
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 uppercase">
                              {lead.status}
                            </span>
                          </td>
                          <td className="py-3 font-bold text-slate-900">
                            ₹
                            {(
                              Number(lead.expectedValue) ||
                              Number(lead.estimatedBudget) ||
                              Number(lead.estimatedValue) ||
                              ((orders.find(
                                (o) =>
                                  (o.leadId?._id || o.leadId) === lead._id,
                              )?.grandTotalPaise || 0) / 100) ||
                              Number(lead.legacyFinancials?.totalAmount) ||
                              0
                            ).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/dashboard/leads/${lead._id}`);
                                }}
                                className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-slate-400 text-xs"
                        >
                          No leads in database. Click &quot;Add Lead&quot; to
                          create your first inquiry.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Side: Top Performers & Live System Status (4 Cols) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Top Performers Widget */}
              <div className="bg-white rounded-md p-4 border border-slate-200 shadow-xs space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" /> Top
                    Performers
                  </h3>
                  <button
                    onClick={() => router.push("/dashboard/leaderboard")}
                    className="text-[10px] font-bold text-blue-600 hover:underline"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-1.5">
                  {topPerformers.length > 0 ? (
                    topPerformers.slice(0, 5).map((perf, idx) => {
                      const userObj = perf.user || perf;
                      const name =
                        userObj.name ||
                        perf.userName ||
                        perf.name ||
                        `Executive ${idx + 1}`;
                      const achievedPaise =
                        perf.achievedPaise !== undefined
                          ? perf.achievedPaise
                          : (perf.revenueAchieved || perf.achieved || 0) * 100;
                      const achievedRupees = achievedPaise / 100;
                      const dealsCount =
                        perf.ordersWonCount !== undefined
                          ? perf.ordersWonCount
                          : perf.ordersCount || perf.dealsWon || 0;
                      const rank = perf.rank || idx + 1;

                      return (
                        <div
                          key={userObj._id || perf._id || idx}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                rank === 1
                                  ? "bg-amber-100 text-amber-800"
                                  : rank === 2
                                    ? "bg-slate-200 text-slate-700"
                                    : rank === 3
                                      ? "bg-amber-50 text-amber-900"
                                      : "bg-slate-100 text-slate-500"
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
                            <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {(name || "EX").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-800 text-xs block truncate">
                                {name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium block">
                                {dealsCount}{" "}
                                {dealsCount === 1 ? "deal" : "deals"} won
                              </span>
                            </div>
                          </div>
                          <span className="font-bold text-emerald-600 text-xs shrink-0 ml-2">
                            ₹
                            {achievedRupees.toLocaleString("en-IN", {
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-[11px]">
                      No performance rankings recorded yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Live System Status */}
              <div className="bg-white rounded-md p-4 border border-slate-200 shadow-xs space-y-2.5 text-xs">
                <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-indigo-500" /> Live System
                  Status
                </h3>

                <div className="space-y-2 pt-1 text-[11px]">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-slate-800 font-semibold leading-snug">
                        Multi-tenant CRM connected to MongoDB.
                      </p>
                      <span className="text-[9px] text-slate-400">
                        Server verified
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-slate-800 font-semibold leading-snug">
                        {totalLeadsCount} total inquiries in pipeline.
                      </p>
                      <span className="text-[9px] text-slate-400">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
