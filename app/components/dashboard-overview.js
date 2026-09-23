import React from "react";
import {
  Wallet,
  CreditCard,
  DollarSign,
  FileText,
  TrendingUp,
} from "lucide-react";

export default function DashboardOverview({
  todos,
  toggleTodo,
  deleteTodo,
  newTodoText,
  setNewTodoText,
  handleAddTodo,
  leads,
  setActiveTab,
  user,
  users = [],
  handleAcceptLead,
}) {
  // Engagement Trend Report Period state: 'weekly', 'monthly', 'yearly'
  const [trendPeriod, setTrendPeriod] = React.useState("weekly");

  // --- Dynamic Calculations based on leads & users ---
  const isAdmin = user?.role === "admin";
  const isUserHandled = (l) => {
    if (!user) return false;
    const uId = user.id || user._id;
    const uName = user.name;
    const uEmail = user.email;
    return (
      (uId && String(l.handledById) === String(uId)) ||
      (uName && l.handledBy === uName) ||
      (uEmail && l.handledBy === uEmail)
    );
  };
  const isIncoming = (l) => !l.handledBy || l.status === "Incoming";
  const visibleLeads = isAdmin
    ? leads
    : leads.filter((l) => isIncoming(l) || isUserHandled(l));

  const systemUsersCount =
    users && users.length > 0 ? users.length : user ? 1 : 1;
  const contactedLeads = visibleLeads.filter(
    (l) => l.status === "Contacted" || l.status === "Active",
  );

  // Dynamic engagement data aggregator derived directly from real backend lead timestamps (leadDate / createdAt)
  const getTrendData = () => {
    if (trendPeriod === "weekly") {
      // Aggregate by Day of Week (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const counts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

      visibleLeads.forEach((lead) => {
        const dateStr = lead.leadDate || lead.createdAt;
        if (dateStr) {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            const dayName = dayNames[d.getDay()];
            if (counts[dayName] !== undefined) {
              counts[dayName] += 1;
            }
          }
        }
      });

      const maxCount = Math.max(...Object.values(counts), 1);
      return dayOrder.map((day) => ({
        label: day,
        count: counts[day],
        pct:
          counts[day] === 0
            ? "8%"
            : `${Math.max(12, Math.round((counts[day] / maxCount) * 100))}%`,
      }));
    } else if (trendPeriod === "monthly") {
      // Aggregate by Month of Current Year (Jan to Dec - All 12 Months)
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const counts = Array(12).fill(0);

      visibleLeads.forEach((lead) => {
        const dateStr = lead.leadDate || lead.createdAt;
        if (dateStr) {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            counts[d.getMonth()] += 1;
          }
        }
      });

      const maxCount = Math.max(...counts, 1);
      return months.map((month, idx) => ({
        label: month,
        count: counts[idx],
        pct:
          counts[idx] === 0
            ? "8%"
            : `${Math.max(12, Math.round((counts[idx] / maxCount) * 100))}%`,
      }));
    } else {
      // Aggregate by Quarter (Q1, Q2, Q3, Q4)
      const quarters = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };

      visibleLeads.forEach((lead) => {
        const dateStr = lead.leadDate || lead.createdAt;
        if (dateStr) {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            const month = d.getMonth();
            if (month <= 2) quarters.Q1 += 1;
            else if (month <= 5) quarters.Q2 += 1;
            else if (month <= 8) quarters.Q3 += 1;
            else quarters.Q4 += 1;
          }
        }
      });

      const maxCount = Math.max(...Object.values(quarters), 1);
      return Object.keys(quarters).map((q) => ({
        label: q,
        count: quarters[q],
        pct:
          quarters[q] === 0
            ? "8%"
            : `${Math.max(12, Math.round((quarters[q] / maxCount) * 100))}%`,
      }));
    }
  };

  const currentTrendBars = getTrendData();

  // Leads created by or assigned to current user
  const currentUserLeads = visibleLeads.filter(
    (l) =>
      l.createdBy === user?.name ||
      l.createdBy === user?.email ||
      isUserHandled(l),
  );

  // Incoming unassigned leads
  const incomingLeads = visibleLeads.filter(
    (l) => !l.handledBy || l.status === "Incoming",
  );

  // Total Deposits based on leads paid amount data
  const realPaidTotal = visibleLeads.reduce(
    (sum, l) => sum + (Number(l.paidAmount) || 0),
    0,
  );
  const totalDeposits =
    realPaidTotal > 0
      ? realPaidTotal
      : visibleLeads.reduce((sum, l) => sum + (l.deposit || 0), 0) +
        contactedLeads.length * 450 +
        15000;

  // Financial totals across all visible leads
  const totalPaidSum = visibleLeads.reduce(
    (sum, l) => sum + (Number(l.paidAmount) || 0),
    0,
  );
  const totalBalanceSum = visibleLeads.reduce(
    (sum, l) => sum + (Number(l.balanceAmount) || 0),
    0,
  );
  const totalDealSum = leads.reduce(
    (sum, l) =>
      sum +
      (Number(l.totalAmount) ||
        (Number(l.paidAmount) || 0) + (Number(l.balanceAmount) || 0)),
    0,
  );

  // Dynamic Quarterly Revenue & Earnings Growth calculation from backend leads
  const quarterlyRevenue = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
  leads.forEach((lead) => {
    const paid = Number(lead.paidAmount) || 0;
    const dateStr = lead.leadDate || lead.createdAt;
    if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const month = d.getMonth();
        if (month <= 2) quarterlyRevenue.Q1 += paid;
        else if (month <= 5) quarterlyRevenue.Q2 += paid;
        else if (month <= 8) quarterlyRevenue.Q3 += paid;
        else quarterlyRevenue.Q4 += paid;
      }
    } else {
      quarterlyRevenue.Q3 += paid;
    }
  });

  const q1 = quarterlyRevenue.Q1;
  const q2 = quarterlyRevenue.Q2;
  const q3 = quarterlyRevenue.Q3;
  const q4 = quarterlyRevenue.Q4;

  const recentHalf = q3 + q4;
  const prevHalf = q1 + q2;
  let earningsGrowthPct = 0;
  if (prevHalf > 0) {
    earningsGrowthPct = Math.round(((recentHalf - prevHalf) / prevHalf) * 100);
  } else if (recentHalf > 0) {
    earningsGrowthPct = 100;
  } else if (totalPaidSum > 0) {
    earningsGrowthPct = 12.4;
  }

  // Dynamic SVG curve coordinate mapping
  const maxQ = Math.max(q1, q2, q3, q4, 1);
  const y1 = Math.min(85, Math.max(15, 85 - Math.round((q1 / maxQ) * 65)));
  const y2 = Math.min(85, Math.max(15, 85 - Math.round((q2 / maxQ) * 65)));
  const y3 = Math.min(85, Math.max(15, 85 - Math.round((q3 / maxQ) * 65)));
  const y4 = Math.min(85, Math.max(15, 85 - Math.round((q4 / maxQ) * 65)));

  // Daily Outbound Cost mock based on leads
  const dailyCost = 500 + contactedLeads.length * 15;

  // Active Geographies & Zone Breakdown dynamically calculated from backend leads (Case-Insensitive grouping)
  const geoMap = {};
  leads.forEach((l) => {
    const rawGeo = (l.areaZone || "India").trim();
    if (!rawGeo) return;
    const key = rawGeo.toLowerCase();
    if (!geoMap[key]) {
      const name =
        rawGeo === rawGeo.toLowerCase()
          ? rawGeo.replace(/\b\w/g, (c) => c.toUpperCase())
          : rawGeo;
      geoMap[key] = { name, count: 0 };
    }
    geoMap[key].count += 1;
  });

  const geoEntries = Object.values(geoMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const totalLeadsCount = leads.length || 1;
  const flags = {
    "United States": "🇺🇸",
    USA: "🇺🇸",
    US: "🇺🇸",
    "United Kingdom": "🇬🇧",
    UK: "🇬🇧",
    Canada: "🇨🇦",
    Australia: "🇦🇺",
    India: "🇮🇳",
    Delhi: "🇮🇳",
    Mumbai: "🇮🇳",
    Bangalore: "🇮🇳",
    Dubai: "🇦🇪",
    UAE: "🇦🇪",
    Singapore: "🇸🇬",
  };
  const colors = [
    "bg-sky-500",
    "bg-emerald-500",
    "bg-blue-500",
    "bg-purple-500",
    "bg-rose-500",
  ];
  let activeGeographies = geoEntries.map((entry, idx) => ({
    country: entry.name,
    flag: flags[entry.name] || flags[entry.name.toUpperCase()] || "🌍",
    calls: entry.count, // Exact count of leads from backend
    pct: Math.round((entry.count / totalLeadsCount) * 100),
    color: colors[idx % colors.length],
  }));

  if (leads.length === 0) {
    activeGeographies = [
      { country: "India", flag: "🇮🇳", calls: 0, pct: 0, color: "bg-sky-500" },
    ];
  }

  // Pending Callbacks
  const pendingTodosCount = todos.filter((t) => !t.completed).length;
  const totalTodosCount = todos.length || 1;
  const todoCompletionPct = Math.round(
    ((totalTodosCount - pendingTodosCount) / totalTodosCount) * 100,
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Current User Active Session Header Bar */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-md shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-sky-600/20 shrink-0">
            {(user?.name || user?.email || "U").substring(0, 1).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>Welcome back, {user?.name || user?.email || "User"}!</span>
              <span className="text-[10px] font-extrabold bg-sky-50 text-sky-600 border border-sky-200/70 rounded-full px-2.5 py-0.5 uppercase tracking-wider">
                {user?.role || "User"}
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-2">
              <span>{user?.email}</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-emerald-600 font-semibold text-[11px]">
                Active Session
              </span>
            </p>
          </div>
        </div>
      </div>
      {/* Financial Overview Banner Cards (Matching Leads Section) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#013564] p-5 rounded-md shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-white block">
              TOTAL PAID AMOUNT
            </span>
            <span className="text-2xl font-black font-mono mt-0.5 block text-white">
              ₹{totalPaidSum.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] font-medium text-white mt-1 block">
              Revenue Collected across leads
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/50 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#013564] p-5 rounded-md shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-white block">
              TOTAL PENDING BALANCE
            </span>
            <span className="text-2xl font-black font-mono mt-0.5 block text-white">
              ₹{totalBalanceSum.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] font-medium text-white mt-1 block">
              Outstanding receivables
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/50 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#013564] p-5 rounded-md shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-white block">
              TOTAL DEAL PIPELINE
            </span>
            <span className="text-2xl font-black font-mono mt-0.5 block text-white">
              ₹{totalDealSum.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] font-medium text-white mt-1 block">
              Combined Total Contract Value
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/50 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Top KPI Metrics Row (4 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Leads */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-33.75">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                Total Leads
              </span>
              <span className="text-2xl font-extrabold text-slate-800 mt-1 block">
                {leads.length.toLocaleString()}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-500">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          {/* SVG Sparkline */}
          <div className="h-10 w-full">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 30"
              preserveAspectRatio="none"
            >
              <path
                d="M0,25 Q15,10 30,18 T60,5 T90,15 L100,15 L100,30 L0,30 Z"
                fill="#0ea5e9"
                fillOpacity="0.15"
              />
              <path
                d="M0,25 Q15,10 30,18 T60,5 T90,15 L100,15"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: Total Users */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between h-33.75">
          <div className="flex-1">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
              Total Users
            </span>
            <span className="text-2xl font-extrabold text-slate-800 mt-1 block">
              {systemUsersCount.toLocaleString()}
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 mt-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Active System Accounts
            </span>
          </div>
          {/* SVG Donut */}
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="#f1f5f9"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="#0ea5e9"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray="163.3"
                strokeDashoffset={0}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xs font-bold text-slate-700">
              {systemUsersCount}
            </span>
          </div>
        </div>

        {/* Card 3: Total Sales */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-33.75">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                Total Sales
              </span>
              <span className="text-2xl font-extrabold text-slate-800 mt-1 block">
                ₹{totalPaidSum.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          {/* Green Sparkline */}
          <div className="h-8 w-full mt-2">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 30"
              preserveAspectRatio="none"
            >
              <path
                d="M0,25 Q20,10 40,18 T80,5 T100,2 L100,30 L0,30 Z"
                fill="#10b981"
                fillOpacity="0.15"
              />
              <path
                d="M0,25 Q20,10 40,18 T80,5 T100,2"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 4: Pending Tasks */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-33.75">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                Pending Callbacks
              </span>
              <span className="text-2xl font-extrabold text-slate-800 mt-1 block">
                {pendingTodosCount} / {todos.length}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="mt-2 w-full">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
              <span>Task Completion</span>
              <span>{todoCompletionPct}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-500"
                style={{ width: `${todoCompletionPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row (Analytics Chart + Interactive To-Do + Earnings) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics Box: Prospect Engagement Trends (World-Class UI) */}
        <div className="bg-white border border-slate-200/80 rounded-md p-6 shadow-sm flex flex-col justify-between h-90 relative overflow-hidden group">
          {/* Top Header & Report Switcher */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">
                    Prospect Engagement Trends
                  </h3>
                  <span className="text-[10px] font-bold bg-sky-50 text-sky-600 border border-sky-200/60 px-2 py-0.5 rounded-full">
                    {currentTrendBars.reduce((sum, b) => sum + b.count, 0)}{" "}
                    Total
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {trendPeriod === "weekly" &&
                    "Daily prospect engagements (Mon – Sun)"}
                  {trendPeriod === "monthly" &&
                    "Full 12-month engagement report (Jan – Dec)"}
                  {trendPeriod === "yearly" &&
                    "Quarterly engagement distribution (Q1 – Q4)"}
                </p>
              </div>

              {/* World-Class Pill Toggle Tabs */}
              <div className="bg-slate-100/90 p-1 rounded-full border border-slate-200/80 flex items-center shadow-2xs">
                <button
                  onClick={() => setTrendPeriod("weekly")}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    trendPeriod === "weekly"
                      ? "bg-white text-sky-600 shadow-sm ring-1 ring-slate-200/60"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setTrendPeriod("monthly")}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    trendPeriod === "monthly"
                      ? "bg-white text-sky-600 shadow-sm ring-1 ring-slate-200/60"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setTrendPeriod("yearly")}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    trendPeriod === "yearly"
                      ? "bg-white text-sky-600 shadow-sm ring-1 ring-slate-200/60"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>
          </div>

          {/* Chart Canvas with Background Gridlines & Bars */}
          <div className="relative flex-1 flex items-end justify-between gap-1.5 sm:gap-2 px-1 pt-6 pb-1 mt-2">
            {/* Background Gridlines */}
            <div className="absolute inset-x-0 top-6 bottom-7 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="border-b border-dashed border-slate-200 w-full" />
              <div className="border-b border-dashed border-slate-200 w-full" />
              <div className="border-b border-dashed border-slate-200 w-full" />
            </div>

            {/* Dynamic Bars */}
            {currentTrendBars.map((bar) => (
              <div
                key={bar.label}
                className="flex-1 flex flex-col items-center group/bar h-full justify-end relative z-10"
              >
                {/* Count Badge Above Bar */}
                <span className="text-[9px] font-extrabold text-slate-500 group-hover/bar:text-sky-600 group-hover/bar:scale-110 transition-all mb-1">
                  {bar.count}
                </span>

                {/* Bar Track & Fill */}
                <div className="w-full bg-slate-100/80 hover:bg-slate-200/50 rounded-t-lg h-full flex items-end overflow-hidden p-0.5 transition-colors">
                  <div
                    className="w-full bg-sky-600 hover:bg-sky-700 transition-all duration-300 rounded-t-md shadow-xs"
                    style={{ height: bar.pct }}
                  />
                </div>

                {/* X-Axis Label */}
                <span className="text-[10px] font-bold text-slate-500 group-hover/bar:text-slate-900 transition-colors uppercase mt-1.5 truncate max-w-full">
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive To-Do List */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col justify-between h-90">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-bold text-slate-800 text-sm">
                Follow-up Tasks
              </h3>
              <span className="text-[10px] font-bold bg-sky-50 text-sky-600 border border-sky-100 px-2 py-0.5 rounded-full">
                {todos.filter((t) => !t.completed).length} Pending
              </span>
            </div>
            <p className="text-xs text-slate-400 font-semibold mb-4">
              Quick task checklist for team outreach
            </p>

            <form onSubmit={handleAddTodo} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Add a new task..."
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/10 outline-none transition-all"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Add
              </button>
            </form>

            {/* Todo Items Container */}
            <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors group"
                >
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id)}
                      className="rounded border-slate-300 text-sky-500 focus:ring-sky-500 cursor-pointer"
                    />
                    <span
                      className={`truncate ${todo.completed ? "line-through text-slate-400" : ""}`}
                    >
                      {todo.text}
                    </span>
                  </label>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer p-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Todo Input form */}
          <form
            onSubmit={handleAddTodo}
            className="flex gap-2 border-t border-slate-100 pt-3"
          >
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              placeholder="Add follow-up task..."
              className="flex-1 h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all"
            />
            <button
              type="submit"
              className="h-9 px-3 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs uppercase cursor-pointer transition-colors shadow-sm"
            >
              Add
            </button>
          </form>
        </div>

        {/* Total Earnings Trendline Graph (Dynamic Backend Data) */}
        <div className="bg-white border border-slate-200/80 rounded-md p-6 shadow-sm flex flex-col justify-between h-90 relative overflow-hidden group">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-extrabold text-slate-800 text-sm">
                Earnings Growth
              </h3>
              <span
                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs ${
                  earningsGrowthPct >= 0
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : "text-rose-700 bg-rose-50 border-rose-200"
                }`}
              >
                {earningsGrowthPct >= 0
                  ? `+${earningsGrowthPct}%`
                  : `${earningsGrowthPct}%`}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Real-time revenue performance & quarterly growth
            </p>
          </div>

          {/* Dynamic Revenue SVG Smooth Curve */}
          <div className="h-40 w-full flex items-end relative my-2">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 200 100"
              preserveAspectRatio="none"
            >
              <path
                d={`M 10,${y1} Q 50,${(y1 + y2) / 2} 75,${y2} T 140,${y3} T 190,${y4} L 190,100 L 10,100 Z`}
                fill="#10b981"
                fillOpacity="0.15"
              />
              <path
                d={`M 10,${y1} Q 50,${(y1 + y2) / 2} 75,${y2} T 140,${y3} T 190,${y4}`}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Dynamic Data Circles */}
              <circle
                cx="10"
                cy={y1}
                r="4"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <circle
                cx="75"
                cy={y2}
                r="4"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <circle
                cx="140"
                cy={y3}
                r="4"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <circle
                cx="190"
                cy={y4}
                r="4"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </svg>
          </div>

          {/* Quarterly Revenue Figures Footer */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-center pt-2 border-t border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">
                Q1
              </span>
              <span className="text-xs font-extrabold text-slate-800 font-mono">
                ₹{q1.toLocaleString("en-IN")}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">
                Q2
              </span>
              <span className="text-xs font-extrabold text-slate-800 font-mono">
                ₹{q2.toLocaleString("en-IN")}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">
                Q3
              </span>
              <span className="text-xs font-extrabold text-slate-800 font-mono">
                ₹{q3.toLocaleString("en-IN")}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">
                Q4
              </span>
              <span className="text-xs font-extrabold text-slate-800 font-mono">
                ₹{q4.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Incoming Leads (Action Required) Section */}
      {incomingLeads.length > 0 && (
        <div className="bg-linear-to-r from-blue-500/10 via-blue-50/50 to-sky-50/60 border border-blue-200/90 rounded-md p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-900 text-white rounded-xl shadow-md shadow-blue-500/20 shrink-0">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold text-blue-950 text-base flex items-center gap-2">
                  <span>Incoming Leads ({incomingLeads.length})</span>
                </h3>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("incoming-leads")}
              className="px-3.5 py-2 bg-blue-900 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>View All Incoming Leads</span>
              <span>→</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {incomingLeads.slice(0, 3).map((lead) => (
              <div
                key={lead.id || lead._id}
                className="bg-white border border-blue-200/80 p-4 rounded-xl shadow-xs flex flex-col justify-between gap-3 hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 text-sm truncate">
                      {lead.name || "Unnamed Client"}
                    </span>
                    <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60 shrink-0">
                      {lead.areaZone || "New"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 font-medium mt-2 space-y-1">
                    {lead.phone && (
                      <div className="flex items-center gap-1.5">
                        <span>📞</span>{" "}
                        <span className="font-bold font-mono">
                          {lead.phone}
                        </span>
                      </div>
                    )}
                    {lead.email && (
                      <div className="flex items-center gap-1.5 truncate">
                        <span>✉️</span>{" "}
                        <span className="truncate">{lead.email}</span>
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400 font-semibold pt-1">
                      Added By: {lead.createdBy || "System"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleAcceptLead && handleAcceptLead(lead.id || lead._id)
                  }
                  className="w-full py-2 bg-blue-900 hover:bg-blue-600 active:scale-98 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Accept Lead Now</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Row: Active Leads Table + Active Geographies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Leads List */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Leads Overview
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  Status of current inbound calling campaigns
                </p>
              </div>
              <button
                onClick={() => setActiveTab("leads")}
                className="text-xs font-bold text-sky-500 hover:text-sky-600 transition-colors flex items-center gap-1 cursor-pointer"
              >
                Manage Leads
                <span>→</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              {leads.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 pr-2">Lead Name</th>
                      <th className="pb-3 pr-2">Contact Info</th>
                      <th className="pb-3 pr-2">Status</th>
                      <th className="pb-3 pr-2">Zone & Campaign</th>
                      <th className="pb-3 text-right">
                        Financials (Paid / Bal)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.slice(0, 5).map((lead) => (
                      <tr
                        key={lead.id || lead._id}
                        className="border-b border-slate-100/60 last:border-0 hover:bg-slate-50/50 transition-colors font-semibold text-xs text-slate-600"
                      >
                        <td className="py-3 pr-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-sky-50 text-sky-600 border border-sky-200/50 flex items-center justify-center font-black text-[10px] uppercase shrink-0">
                              {(lead.name || "L").substring(0, 2)}
                            </div>
                            <span className="font-bold text-slate-800 truncate max-w-30">
                              {lead.name || "Unnamed"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pr-2">
                          <div className="flex flex-col">
                            <span className="truncate max-w-35 text-slate-700">
                              {lead.email || "No Email"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {lead.phone || "No Phone"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pr-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                              lead.status === "Active"
                                ? "bg-sky-50 text-sky-600 border border-sky-200/60"
                                : lead.status === "Contacted"
                                  ? "bg-blue-50 text-blue-600 border border-blue-200/60"
                                  : lead.status === "New"
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
                                    : lead.status === "Follow-up"
                                      ? "bg-purple-50 text-purple-600 border border-purple-200/60"
                                      : "bg-slate-50 text-slate-500 border border-slate-200/60"
                            }`}
                          >
                            {lead.status || "New"}
                          </span>
                        </td>
                        <td className="py-3 pr-2">
                          <div className="flex flex-col">
                            <span className="text-slate-700 font-bold">
                              {lead.areaZone || "General"}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {lead.campaign || "Direct Outbound"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex flex-col items-end font-mono">
                            <span className="text-emerald-600 font-bold text-xs">
                              ₹
                              {(Number(lead.paidAmount) || 0).toLocaleString(
                                "en-IN",
                              )}
                            </span>
                            {(Number(lead.balanceAmount) || 0) > 0 && (
                              <span className="text-[10px] text-blue-600 font-bold">
                                Bal: ₹
                                {(
                                  Number(lead.balanceAmount) || 0
                                ).toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-10 flex flex-col items-center justify-center">
                  <span className="text-sm font-bold text-slate-700">
                    No Backend Leads Found
                  </span>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Start by adding your first lead to generate dynamic calling
                    analytics.
                  </p>
                  <button
                    onClick={() => setActiveTab("leads")}
                    className="mt-3 px-4 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Add Lead
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Calling Geographies & Area Zones (Backend Data) */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">
              Active Geographies & Zones
            </h3>
            <p className="text-xs text-slate-400 font-semibold mb-6">
              Backend lead distribution by zone
            </p>

            <div className="flex flex-col gap-4">
              {activeGeographies.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{item.flag}</span>
                      <span className="font-bold text-slate-800">
                        {item.country}
                      </span>
                    </div>
                    <span className="text-slate-500 text-[11px] font-mono">
                      {item.calls} {item.calls === 1 ? "lead" : "leads"} (
                      {item.pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`${item.color} h-full transition-all duration-500`}
                      style={{ width: `${Math.max(4, item.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
