"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import {
  Award,
  Trophy,
  Medal,
  Flame,
  Zap,
  TrendingUp,
  Users,
  Target,
  Crown,
  ChevronDown,
  Filter,
  Download,
  PhoneCall,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  Search,
  RefreshCw,
  DollarSign,
  ShoppingBag,
  CheckCircle2,
} from "lucide-react";

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState("This Month");
  const [searchQuery, setSearchQuery] = useState("");
  const [performers, setPerformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(true);
  const [disabledMessage, setDisabledMessage] = useState("");

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const tfParam =
        timeframe === "All Time"
          ? "all"
          : timeframe === "This Quarter"
            ? "quarter"
            : "month";
      const res = await api.get(`/targets/leaderboard?timeframe=${tfParam}`);

      if (res) {
        const payload = res.data || res;
        if (payload.enabled === false) {
          setLeaderboardEnabled(false);
          setDisabledMessage(
            payload.message ||
              "Leaderboard is currently disabled by organization administrator.",
          );
          setPerformers([]);
          return;
        }

        setLeaderboardEnabled(true);
        const rawList = Array.isArray(payload)
          ? payload
          : payload.rankings || [];
        const nonAdmin = rawList.filter((p) => {
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

        setPerformers(
          nonAdmin.map((p, idx) => {
            const userObj = p.user || p;
            const uName = userObj.name || p.userName || `Executive ${idx + 1}`;
            const achievedVal =
              p.achievedPaise !== undefined
                ? p.achievedPaise / 100
                : p.revenueAchieved || p.achieved || 0;

            return {
              ...p,
              rank: p.rank || idx + 1,
              name: uName,
              role: userObj.role || p.role || "Sales Representative",
              initials: uName.slice(0, 2).toUpperCase(),
              avatarBg:
                idx === 0
                  ? "bg-indigo-600"
                  : idx === 1
                    ? "bg-teal-600"
                    : "bg-rose-600",
              achievedAmountNum: achievedVal,
              achieved: `₹${achievedVal.toLocaleString("en-IN")}`,
              achievedPercent: Number(
                p.achievementPercent || p.achievedPercent || 0,
              ).toFixed(1),
              dealsWon:
                p.ordersWonCount !== undefined
                  ? p.ordersWonCount
                  : p.ordersCount || p.dealsWon || 0,
              totalLeads: p.totalLeads || 0,
              conversionRate:
                p.totalLeads > 0
                  ? `${(((p.ordersWonCount || p.ordersCount || 0) / p.totalLeads) * 100).toFixed(1)}%`
                  : p.ordersWonCount > 0
                    ? "100%"
                    : "0%",
              trend: "+1",
              trendDirection: "up",
              badge:
                idx === 0
                  ? "🏆 Top Closer"
                  : idx === 1
                    ? "💎 Key Performer"
                    : "🎯 Target Crusher",
              podiumBorder:
                idx === 0
                  ? "border-amber-400 bg-gradient-to-b from-amber-50/70 to-white"
                  : "border-slate-200 bg-white",
            };
          }),
        );
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);

  const top3 = performers.slice(0, 3);
  const filtered = performers.filter(
    (p) =>
      !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Aggregate Team Summary Metrics
  const totalRevenueWon = performers.reduce(
    (sum, p) => sum + (p.achievedAmountNum || 0),
    0,
  );
  const totalOrdersWon = performers.reduce(
    (sum, p) => sum + (p.dealsWon || 0),
    0,
  );
  const totalLeadsCount = performers.reduce(
    (sum, p) => sum + (p.totalLeads || 0),
    0,
  );
  const topPerformer = performers[0];

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
                <span className="p-1.5 rounded-xl bg-amber-100 text-amber-600">
                  <Award className="w-5 h-5" />
                </span>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Sales &amp; Team Leaderboard
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Live rankings, won revenue, deals closed, and conversion
                performance
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={fetchLeaderboard}
                disabled={loading}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs cursor-pointer transition-all"
                title="Refresh Leaderboard"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`}
                />
              </button>

              <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
                {["This Month", "This Quarter", "All Time"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      timeframe === t
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <Link
                href="/dashboard/admin/targets"
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Target className="w-3.5 h-3.5" />
                Set Targets
              </Link>
            </div>
          </div>

          {!leaderboardEnabled && (
            <div className="p-4 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600 shrink-0" />
              <span>{disabledMessage}</span>
            </div>
          )}

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-md bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Total Sales Won
                </span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl font-extrabold text-slate-900">
                ₹{totalRevenueWon.toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold">
                {timeframe} Revenue
              </span>
            </div>

            <div className="p-4 rounded-md bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Orders Closed
                </span>
                <ShoppingBag className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-xl font-extrabold text-slate-900">
                {totalOrdersWon}
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                Won Commercial Jobs
              </span>
            </div>

            <div className="p-4 rounded-md bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Top Closer
                </span>
                <Crown className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-base font-extrabold text-slate-900 truncate">
                {topPerformer ? topPerformer.name : "N/A"}
              </div>
              <span className="text-[10px] text-amber-600 font-semibold">
                {topPerformer ? topPerformer.achieved : "₹0"}
              </span>
            </div>

            <div className="p-4 rounded-md bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Active Executives
                </span>
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-xl font-extrabold text-slate-900">
                {performers.length}
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                Ranked Representatives
              </span>
            </div>
          </div>

          {/* Podium Visual Cards (Renders 1, 2, or 3 cards based on available performers) */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {/* 2nd Place (if available) */}
              {top3.length >= 2 ? (
                <div
                  className={`p-6 rounded-3xl border ${top3[1].podiumBorder} shadow-sm space-y-4 relative order-2 md:order-1`}
                >
                  <div className="flex justify-between items-start">
                    <span className="w-7 h-7 rounded-xl bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center border border-slate-300">
                      #2
                    </span>
                    <Medal className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="text-center space-y-1.5">
                    <div
                      className={`w-16 h-16 rounded-md ${top3[1].avatarBg} text-white font-bold text-xl flex items-center justify-center mx-auto shadow-md`}
                    >
                      {top3[1].initials}
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {top3[1].name}
                    </h3>
                    <p className="text-[11px] text-slate-500">{top3[1].role}</p>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-slate-200/60 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Achieved:</span>
                      <span className="font-bold text-slate-900">
                        {top3[1].achieved} ({top3[1].achievedPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-400 rounded-full"
                        style={{
                          width: `${Math.min(top3[1].achievedPercent, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="hidden md:block order-2 md:order-1" />
              )}

              {/* 1st Place Champion */}
              {top3[0] && (
                <div
                  className={`p-6 rounded-3xl border-2 ${top3[0].podiumBorder} shadow-lg space-y-4 relative md:-translate-y-2 order-1 md:order-2`}
                >
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                    <Crown className="w-3 h-3 fill-white" /> Rank #1 Champion
                  </div>
                  <div className="flex justify-between items-start pt-1">
                    <span className="w-8 h-8 rounded-xl bg-amber-400 text-amber-950 font-black text-sm flex items-center justify-center shadow-xs">
                      #1
                    </span>
                    <Trophy className="w-7 h-7 text-amber-500" />
                  </div>
                  <div className="text-center space-y-1.5">
                    <div
                      className={`w-20 h-20 rounded-md ${top3[0].avatarBg} text-white font-black text-2xl flex items-center justify-center mx-auto shadow-lg ring-4 ring-amber-300`}
                    >
                      {top3[0].initials}
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-lg">
                      {top3[0].name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {top3[0].role}
                    </p>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-amber-200 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-medium">
                        Achieved:
                      </span>
                      <span className="font-black text-emerald-600 text-sm">
                        {top3[0].achieved} ({top3[0].achievedPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-amber-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${Math.min(top3[0].achievedPercent, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place (if available) */}
              {top3.length >= 3 ? (
                <div
                  className={`p-6 rounded-3xl border ${top3[2].podiumBorder} shadow-sm space-y-4 relative order-3`}
                >
                  <div className="flex justify-between items-start">
                    <span className="w-7 h-7 rounded-xl bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center border border-amber-300">
                      #3
                    </span>
                    <Medal className="w-6 h-6 text-amber-700" />
                  </div>
                  <div className="text-center space-y-1.5">
                    <div
                      className={`w-16 h-16 rounded-md ${top3[2].avatarBg} text-white font-bold text-xl flex items-center justify-center mx-auto shadow-md`}
                    >
                      {top3[2].initials}
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {top3[2].name}
                    </h3>
                    <p className="text-[11px] text-slate-500">{top3[2].role}</p>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-slate-200/60 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Achieved:</span>
                      <span className="font-bold text-slate-900">
                        {top3[2].achieved} ({top3[2].achievedPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-600 rounded-full"
                        style={{
                          width: `${Math.min(top3[2].achievedPercent, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="hidden md:block order-3" />
              )}
            </div>
          )}

          {/* Full Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Executive Performance Table
                </h2>
                <p className="text-[11px] text-slate-400">
                  Ranked by verified commercial revenue generated
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search executive..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <th className="pb-3 text-center">Rank</th>
                    <th className="pb-3">Executive</th>
                    <th className="pb-3">Achieved</th>
                    <th className="pb-3">Orders Won</th>
                    <th className="pb-3">Inquiries</th>
                    <th className="pb-3">Win Rate</th>
                    <th className="pb-3 text-right">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filtered.length > 0 ? (
                    filtered.map((exec) => (
                      <tr
                        key={exec.rank}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-4 text-center font-bold text-slate-700">
                          {exec.rank === 1
                            ? "🥇 #1"
                            : exec.rank === 2
                              ? "🥈 #2"
                              : exec.rank === 3
                                ? "🥉 #3"
                                : `#${exec.rank}`}
                        </td>
                        <td className="py-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                              {exec.initials}
                            </div>
                            <div>
                              <span>{exec.name}</span>
                              <span className="text-[10px] text-slate-400 block font-normal">
                                {exec.role}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 font-black text-emerald-600">
                          {exec.achieved} ({exec.achievedPercent}%)
                        </td>
                        <td className="py-4 text-slate-700 font-semibold">
                          {exec.dealsWon}
                        </td>
                        <td className="py-4 text-slate-500">
                          {exec.totalLeads}
                        </td>
                        <td className="py-4 font-bold text-slate-900">
                          {exec.conversionRate}
                        </td>
                        <td className="py-4 text-right text-emerald-600 font-bold">
                          ▲ +1
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-slate-400 text-xs"
                      >
                        {loading
                          ? "Loading team performance records..."
                          : "No team sales targets or achievements recorded yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
