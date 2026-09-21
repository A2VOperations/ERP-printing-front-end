"use client";

import React, { useState } from "react";
import { apiClient } from "../../../lib/apiClient";

export default function LeadStatusActions({ lead, currentUser, onActionComplete }) {
  const [loading, setLoading] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [lostReason, setLostReason] = useState("");

  const handleAction = async (endpoint, payload = {}) => {
    setLoading(true);
    try {
      const res = await apiClient.post(`/api/v1/leads/${lead._id}/${endpoint}`, payload);
      if (res.success) {
        if (onActionComplete) onActionComplete(res.data);
      }
    } catch (err) {
      alert(err.message || `Action ${endpoint} failed`);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkLost = async (e) => {
    e.preventDefault();
    if (!lostReason.trim()) return;
    setLoading(true);
    try {
      const res = await apiClient.post(`/api/v1/leads/${lead._id}/mark-not-interested`, { lostReason });
      if (res.success) {
        setShowLostModal(false);
        if (onActionComplete) onActionComplete(res.data);
      }
    } catch (err) {
      alert(err.message || "Failed to mark not interested");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      {lead.status === "NEW" && (
        <button
          disabled={loading}
          onClick={() => handleAction("contact", { notes: "Direct customer contact" })}
          className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white border border-sky-500/20 rounded-lg text-xs font-semibold transition disabled:opacity-50"
        >
          Contact
        </button>
      )}

      {(lead.status === "CONTACTED" || lead.status === "FOLLOW_UP") && (
        <button
          disabled={loading}
          onClick={() => handleAction("mark-interested", { notes: "Customer expressed strong interest" })}
          className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-lg text-xs font-semibold transition disabled:opacity-50"
        >
          Interested
        </button>
      )}

      {lead.status !== "NOT_INTERESTED" && lead.status !== "LOST" && lead.status !== "WON" && (
        <button
          disabled={loading}
          onClick={() => setShowLostModal(true)}
          className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded-lg text-xs font-semibold transition disabled:opacity-50"
        >
          Lost
        </button>
      )}

      {(lead.status === "NOT_INTERESTED" || lead.status === "LOST" || lead.status === "ON_HOLD") && (
        <button
          disabled={loading}
          onClick={() => handleAction("reopen")}
          className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/20 rounded-lg text-xs font-semibold transition disabled:opacity-50"
        >
          Reopen
        </button>
      )}

      {/* Lost Reason Modal */}
      {showLostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl text-left">
            <h4 className="text-base font-bold text-white">Mark Lead as Lost / Not Interested</h4>
            <form onSubmit={handleMarkLost} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Reason for Lost Opportunity *
                </label>
                <textarea
                  required
                  rows={3}
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  placeholder="Price too high, competitor selected, project cancelled..."
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowLostModal(false)}
                  className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow transition"
                >
                  Confirm Lost
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
