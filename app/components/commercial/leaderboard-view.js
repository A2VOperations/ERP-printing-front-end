"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../../lib/apiConfig";

export default function LeaderboardView({ user }) {
  const [achievement, setAchievement] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const getHeaders = () => {
    const token = localStorage.getItem("token") || "";
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-user-id": user?.email || user?.id || "",
      "x-user-role": user?.role || "",
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [achRes, leadRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/targets/my-achievement`, { headers: getHeaders() }),
        fetch(`${API_BASE_URL}/api/v1/targets/leaderboard`, { headers: getHeaders() }),
      ]);

      const achJson = await achRes.json();
      const leadJson = await leadRes.json();

      if (achJson.success) setAchievement(achJson.data);
      if (leadJson.success && leadJson.data) {
        const rankings = (leadJson.data.rankings || []).filter((r) => {
          const role = String(r.user?.role || '').toLowerCase();
          const name = String(r.user?.name || '').toLowerCase();
          const email = String(r.user?.email || '').toLowerCase();
          return !role.includes('admin') && !name.includes('admin') && !email.includes('admin');
        });
        setLeaderboard({ ...leadJson.data, rankings });
      }
    } catch (err) {
      console.error("Error fetching leaderboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Targets & Leaderboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Performance metrics derived strictly from confirmed won orders.
        </p>
      </div>

      {/* Rep Target Achievement Card */}
      {achievement && (
        <div className="bg-gradient-to-br from-sky-600 to-indigo-700 p-6 rounded-2xl text-white shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-sky-200">Current Month Target</div>
              <div className="text-3xl font-extrabold mt-1">
                ₹{((achievement.achievedPaise || 0) / 100).toLocaleString("en-IN")} / ₹{((achievement.targetPaise || 0) / 100).toLocaleString("en-IN")}
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-amber-300">{achievement.achievementPercent}%</div>
              <div className="text-xs text-sky-200">Achieved</div>
            </div>
          </div>

          <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden">
            <div
              className="bg-amber-400 h-full transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, achievement.achievementPercent || 0)}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-white/10 text-xs">
            <div>
              <div className="text-sky-200">Orders Won</div>
              <div className="text-lg font-bold">{achievement.ordersWonCount || 0}</div>
            </div>
            <div>
              <div className="text-sky-200">Remaining to Goal</div>
              <div className="text-lg font-bold">₹{((achievement.remainingPaise || 0) / 100).toLocaleString("en-IN")}</div>
            </div>
            <div>
              <div className="text-sky-200">Daily Run-Rate Required</div>
              <div className="text-lg font-bold">₹{((achievement.requiredPerDayPaise || 0) / 100).toLocaleString("en-IN")}/day</div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 font-bold text-slate-800 flex justify-between items-center">
          <span>Organization Sales Leaderboard</span>
          <span className="text-xs font-normal text-slate-400">Ranked by Confirmed Sales</span>
        </div>

        {leaderboard && !leaderboard.enabled ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            {leaderboard.message || "Leaderboard is disabled for this organization."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-6 py-3.5 w-16">Rank</th>
                  <th className="px-6 py-3.5">Sales Executive</th>
                  <th className="px-6 py-3.5">Target</th>
                  <th className="px-6 py-3.5">Achieved Sales</th>
                  <th className="px-6 py-3.5">Progress</th>
                  <th className="px-6 py-3.5">Orders Won</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-400">Loading rankings...</td>
                  </tr>
                ) : leaderboard?.rankings?.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-400">No sales data recorded for current cycle.</td>
                  </tr>
                ) : (
                  leaderboard?.rankings?.map((r) => {
                    const isTop3 = r.rank <= 3;
                    const rankBadge =
                      r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `#${r.rank}`;

                    return (
                      <tr key={r.user?._id || r.rank} className={`hover:bg-slate-50 ${isTop3 ? "bg-amber-50/20" : ""}`}>
                        <td className="px-6 py-4 font-bold text-base">{rankBadge}</td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{r.user?.name || "Representative"}</div>
                          <div className="text-xs text-slate-400">{r.user?.email || ""}</div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600">
                          ₹{((r.targetPaise || 0) / 100).toLocaleString("en-IN")}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">
                          ₹{((r.achievedPaise || 0) / 100).toLocaleString("en-IN")}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-indigo-600 h-full rounded-full"
                                style={{ width: `${Math.min(100, r.achievementPercent || 0)}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-indigo-700">{r.achievementPercent}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800">{r.ordersWonCount || 0}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
