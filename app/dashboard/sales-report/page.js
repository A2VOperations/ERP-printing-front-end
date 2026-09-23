"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import {
  BarChart3,
  TrendingUp,
  FileText,
  ShoppingBag,
  CreditCard,
  Users,
  Calendar,
  Filter,
  Download,
  ChevronDown,
  DollarSign,
  PieChart,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Inbox,
  ArrowUpRight,
} from "lucide-react";

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
    return { startCurrent, endCurrent, periodLabel: "previous period" };
  }

  if (timeframe === "Quarter to Date") {
    const quarterIndex = Math.floor(month / 3);
    const startCurrent = new Date(year, quarterIndex * 3, 1, 0, 0, 0, 0);
    const endCurrent = now;
    return { startCurrent, endCurrent, periodLabel: "last quarter" };
  }

  if (timeframe === "Year to Date") {
    const startCurrent = new Date(year, 0, 1, 0, 0, 0, 0);
    const endCurrent = now;
    return { startCurrent, endCurrent, periodLabel: "last year" };
  }

  // Default: 'This Month'
  const startCurrent = new Date(year, month, 1, 0, 0, 0, 0);
  const endCurrent = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { startCurrent, endCurrent, periodLabel: "last month" };
}

export default function SalesReportPage() {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState("This Month");
  const [loading, setLoading] = useState(true);

  // Live Backend Data
  const [quotations, setQuotations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [leads, setLeads] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  const loadReportData = useCallback(async () => {
    try {
      setLoading(true);
      const [quoteRes, orderRes, payRes, leadRes, leaderRes] =
        await Promise.allSettled([
          api.get("/quotations?limit=200"),
          api.get("/orders?limit=200"),
          api.get("/payments?limit=200"),
          api.get("/leads?limit=200"),
          api.get("/targets/leaderboard"),
        ]);

      if (quoteRes.status === "fulfilled" && quoteRes.value?.data) {
        setQuotations(
          Array.isArray(quoteRes.value.data)
            ? quoteRes.value.data
            : quoteRes.value.data.items || [],
        );
      }
      if (orderRes.status === "fulfilled" && orderRes.value?.data) {
        setOrders(
          Array.isArray(orderRes.value.data)
            ? orderRes.value.data
            : orderRes.value.data.items || [],
        );
      }
      if (payRes.status === "fulfilled" && payRes.value?.data) {
        const rawPay = Array.isArray(payRes.value.data)
          ? payRes.value.data
          : payRes.value.data?.records || payRes.value.data?.items || [];
        setPayments(rawPay);
      }
      if (leadRes.status === "fulfilled" && leadRes.value?.data) {
        setLeads(
          Array.isArray(leadRes.value.data)
            ? leadRes.value.data
            : leadRes.value.data.leads || [],
        );
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
        setLeaderboard(nonAdmin);
      }
    } catch (err) {
      console.error("Failed to load sales report data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const { startCurrent, endCurrent } = useMemo(
    () => getPeriodDates(timeframe),
    [timeframe],
  );

  // Date range formatted label
  const dateRangeLabel = useMemo(() => {
    const fmt = (d) =>
      d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    return `${fmt(startCurrent)} - ${fmt(endCurrent)}`;
  }, [startCurrent, endCurrent]);

  // Sliced data within active date bounds
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const d = new Date(q.createdAt);
      return d >= startCurrent && d <= endCurrent;
    });
  }, [quotations, startCurrent, endCurrent]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const d = new Date(o.orderDate || o.createdAt);
      return d >= startCurrent && d <= endCurrent;
    });
  }, [orders, startCurrent, endCurrent]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const d = new Date(p.paymentDate || p.createdAt);
      return d >= startCurrent && d <= endCurrent;
    });
  }, [payments, startCurrent, endCurrent]);

  // Metrics
  const totalQuotationValueRupees = useMemo(() => {
    return (
      filteredQuotations.reduce((sum, q) => sum + (q.grandTotalPaise || 0), 0) /
      100
    );
  }, [filteredQuotations]);

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

  const totalOrderValueRupees = useMemo(() => {
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

  const totalCollectionRupees = useMemo(() => {
    return (
      filteredPayments.reduce(
        (sum, p) =>
          sum + (p.amountPaise || (p.amount ? Math.round(p.amount * 100) : 0)),
        0,
      ) / 100
    );
  }, [filteredPayments]);

  const totalProfitRupees = useMemo(() => {
    // Standard estimated gross margin ~ 28% of total order value
    return Math.round(totalOrderValueRupees * 0.28);
  }, [totalOrderValueRupees]);

  const ordersCount = confirmedOrders.length;

  // Source Distribution from real leads
  const sourceDistribution = useMemo(() => {
    const counts = {};
    leads.forEach((l) => {
      const src = (l.source || "MANUAL").toUpperCase();
      counts[src] = (counts[src] || 0) + 1;
    });
    const total = leads.length || 1;
    const sorted = Object.entries(counts)
      .map(([name, cnt]) => ({
        name,
        count: cnt,
        pct: Math.round((cnt / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return sorted;
  }, [leads]);

  // Product category breakdown from orders
  const categoryBreakdown = useMemo(() => {
    const counts = {};
    orders.forEach((o) => {
      (o.items || []).forEach((it) => {
        const cat = it.category || it.title?.split(" ")[0] || "Printing";
        counts[cat] =
          (counts[cat] || 0) +
          (it.itemTotalPaise ? it.itemTotalPaise / 100 : 1);
      });
    });
    const total = Object.values(counts).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(counts)
      .map(([name, val]) => ({
        name,
        value: Math.round(val),
        pct: Math.round((val / total) * 100),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }, [orders]);

  // Dynamic Summary Rows Bucket by Week or Days
  const summaryBuckets = useMemo(() => {
    if (filteredOrders.length === 0 && filteredQuotations.length === 0) {
      return [];
    }

    // Bucket into 4 weekly chunks across the active period
    const totalMs = endCurrent.getTime() - startCurrent.getTime();
    const chunkMs = totalMs / 4;
    const buckets = [];

    for (let i = 0; i < 4; i++) {
      const chunkStart = new Date(startCurrent.getTime() + i * chunkMs);
      const chunkEnd = new Date(startCurrent.getTime() + (i + 1) * chunkMs);

      const qInChunk = filteredQuotations.filter((q) => {
        const d = new Date(q.createdAt);
        return d >= chunkStart && d <= chunkEnd;
      });
      const oInChunk = confirmedOrders.filter((o) => {
        const d = new Date(o.orderDate || o.createdAt);
        return d >= chunkStart && d <= chunkEnd;
      });
      const pInChunk = filteredPayments.filter((p) => {
        const d = new Date(p.paymentDate || p.createdAt);
        return d >= chunkStart && d <= chunkEnd;
      });

      const qVal =
        qInChunk.reduce((s, q) => s + (q.grandTotalPaise || 0), 0) / 100;
      const oVal =
        oInChunk.reduce(
          (s, o) =>
            s + (o.grandTotalPaise || (o.grandTotal ? o.grandTotal * 100 : 0)),
          0,
        ) / 100;
      const pVal =
        pInChunk.reduce(
          (s, p) => s + (p.amountPaise || (p.amount ? p.amount * 100 : 0)),
          0,
        ) / 100;

      const dateLabel = `${chunkStart.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} - ${chunkEnd.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`;

      buckets.push({
        date: dateLabel,
        quotValue: `₹${Math.round(qVal).toLocaleString("en-IN")}`,
        orderValue: `₹${Math.round(oVal).toLocaleString("en-IN")}`,
        collection: `₹${Math.round(pVal).toLocaleString("en-IN")}`,
        profit: `₹${Math.round(oVal * 0.28).toLocaleString("en-IN")}`,
        orders: oInChunk.length,
      });
    }

    return buckets;
  }, [
    startCurrent,
    endCurrent,
    filteredQuotations,
    confirmedOrders,
    filteredPayments,
  ]);

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                Sales Report
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Detailed live overview of sales performance, revenues, and
                collections
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="relative">
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2 pr-7 rounded-xl focus:outline-none focus:border-blue-500 shadow-xs cursor-pointer"
                >
                  <option value="This Month">This Month</option>
                  <option value="Last Month">Last Month</option>
                  <option value="Quarter to Date">Quarter to Date</option>
                  <option value="Year to Date">Year to Date</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold shadow-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{dateRangeLabel}</span>
              </div>

              <button
                onClick={loadReportData}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 shadow-xs cursor-pointer"
                title="Refresh Report"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`}
                />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Row 1: 5 Top Summary Metric Cards with Real Live Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Total Quotation Value */}
            <div className="bg-white rounded-md p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500">
                  Total Quotation Value
                </span>
                <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">
                  ₹
                  {Math.round(totalQuotationValueRupees).toLocaleString(
                    "en-IN",
                  )}
                </div>
                <div className="text-[10px] font-bold text-blue-600 mt-0.5">
                  {filteredQuotations.length} quotations generated
                </div>
              </div>
            </div>

            {/* 2. Total Order Value */}
            <div className="bg-white rounded-md p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500">
                  Total Order Value
                </span>
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">
                  ₹{Math.round(totalOrderValueRupees).toLocaleString("en-IN")}
                </div>
                <div className="text-[10px] font-bold text-emerald-600 mt-0.5">
                  {ordersCount} confirmed orders
                </div>
              </div>
            </div>

            {/* 3. Total Collection */}
            <div className="bg-white rounded-md p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500">
                  Total Collection
                </span>
                <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">
                  ₹{Math.round(totalCollectionRupees).toLocaleString("en-IN")}
                </div>
                <div className="text-[10px] font-bold text-purple-600 mt-0.5">
                  {filteredPayments.length} recorded payments
                </div>
              </div>
            </div>

            {/* 4. Total Profit (Est.) */}
            <div className="bg-white rounded-md p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500">
                  Total Profit (Est.)
                </span>
                <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">
                  ₹{Math.round(totalProfitRupees).toLocaleString("en-IN")}
                </div>
                <div className="text-[10px] font-bold text-amber-600 mt-0.5">
                  ~28% estimated margin
                </div>
              </div>
            </div>

            {/* 5. Orders Count */}
            <div className="bg-white rounded-md p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500">
                  Orders Count
                </span>
                <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">
                  {ordersCount}
                </div>
                <div className="text-[10px] font-bold text-slate-500 mt-0.5">
                  {filteredOrders.length} total orders placed
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Sales Summary Table (8 Cols) + Top Executives (4 Cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sales Summary Table (8 Cols) */}
            <div className="lg:col-span-8 bg-white rounded-md p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-900">
                    Sales Summary Breakdown
                  </h3>
                  <span className="text-[10px] font-semibold text-slate-400">
                    Live Period Groups
                  </span>
                </div>

                <div className="overflow-x-auto min-h-[160px]">
                  {summaryBuckets.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <Inbox className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                      <span className="text-xs font-medium block">
                        No sales activity in this period
                      </span>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                          <th className="pb-3">Period</th>
                          <th className="pb-3">Quotation Value</th>
                          <th className="pb-3">Order Value</th>
                          <th className="pb-3">Collection</th>
                          <th className="pb-3">Profit (Est.)</th>
                          <th className="pb-3 text-right">Orders</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {summaryBuckets.map((row, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="py-3 font-semibold text-slate-900">
                              {row.date}
                            </td>
                            <td className="py-3 text-slate-700">
                              {row.quotValue}
                            </td>
                            <td className="py-3 font-semibold text-slate-900">
                              {row.orderValue}
                            </td>
                            <td className="py-3 text-slate-700">
                              {row.collection}
                            </td>
                            <td className="py-3 text-emerald-600 font-semibold">
                              {row.profit}
                            </td>
                            <td className="py-3 text-right font-bold text-slate-900">
                              {row.orders}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-200 font-bold text-slate-900 text-xs">
                          <td className="pt-3">Total</td>
                          <td className="pt-3">
                            ₹
                            {Math.round(
                              totalQuotationValueRupees,
                            ).toLocaleString("en-IN")}
                          </td>
                          <td className="pt-3">
                            ₹
                            {Math.round(totalOrderValueRupees).toLocaleString(
                              "en-IN",
                            )}
                          </td>
                          <td className="pt-3">
                            ₹
                            {Math.round(totalCollectionRupees).toLocaleString(
                              "en-IN",
                            )}
                          </td>
                          <td className="pt-3 text-emerald-600">
                            ₹
                            {Math.round(totalProfitRupees).toLocaleString(
                              "en-IN",
                            )}
                          </td>
                          <td className="pt-3 text-right">{ordersCount}</td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  * Profit is estimated based on standard operating cost markup.
                </span>
              </div>
            </div>

            {/* Right Column: Top Performers & Quick Insights (4 Cols) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Top Performing Executives */}
              <div className="bg-white rounded-md p-4 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-900">
                    Leaderboard
                  </h3>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Live
                  </span>
                </div>

                <div className="space-y-3">
                  {leaderboard.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      <Users className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                      <span className="text-xs font-medium block">
                        No rankings recorded
                      </span>
                    </div>
                  ) : (
                    leaderboard.slice(0, 5).map((exec, idx) => {
                      const achieved = (exec.achievedPaise || 0) / 100;
                      return (
                        <div key={exec.userId || idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                                {idx + 1}
                              </div>
                              <p className="font-bold text-slate-900 leading-tight text-[11px] truncate">
                                {exec.userName || exec.name || "Sales Rep"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-bold text-slate-900 text-xs">
                                ₹{Math.round(achieved).toLocaleString("en-IN")}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold">
                                {exec.achievementPercent || 0}%
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{
                                width: `${Math.min(100, exec.achievementPercent || 0)}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Quick Insights */}
              <div className="bg-white rounded-md p-4 border border-slate-200 shadow-xs space-y-2">
                <h3 className="text-xs font-bold text-slate-900 mb-2">
                  Live Insights
                </h3>

                <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-100 flex items-start gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-emerald-800 leading-tight">
                    Total revenue collected is{" "}
                    <span className="font-bold">
                      ₹
                      {Math.round(totalCollectionRupees).toLocaleString(
                        "en-IN",
                      )}
                    </span>{" "}
                    across {filteredPayments.length} recorded payments.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100 flex items-start gap-2 text-xs">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-blue-800 leading-tight">
                    <span className="font-bold">
                      {filteredQuotations.length}
                    </span>{" "}
                    quotations valued at{" "}
                    <span className="font-bold">
                      ₹
                      {Math.round(totalQuotationValueRupees).toLocaleString(
                        "en-IN",
                      )}
                    </span>{" "}
                    active in this timeframe.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
