"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  DollarSign,
  ShieldCheck,
  User,
  Building,
  Info,
  ChevronDown,
  Filter,
  Search,
  Lock,
} from "lucide-react";

export default function ApprovalCenterPage() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");

  // Modal State
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [actionType, setActionType] = useState(null); // 'APPROVE' | 'REJECT'
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Manager authority threshold (e.g. up to 15% discount; >15% requires CEO/Admin)
  const MANAGER_MAX_DISCOUNT_PERCENT = 15;

  const loadApprovals = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await api.get(`/discount-approvals?status=${statusFilter}`);
      if (res && res.data) {
        const list = Array.isArray(res.data)
          ? res.data
          : res.data.records || [];
        setApprovals(list);
      }
    } catch (err) {
      console.error("Failed to load approvals:", err);
      setErrorMsg(err.message || "Failed to load approvals.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadApprovals();
  }, [loadApprovals]);

  // Handle Approve
  const handleApprove = async () => {
    if (!selectedApproval) return;
    try {
      setActionLoading(true);
      await api.post(`/discount-approvals/${selectedApproval._id}/approve`, {
        notes: "Approved within Manager threshold authority.",
      });
      setSelectedApproval(null);
      setActionType(null);
      loadApprovals();
    } catch (err) {
      alert(err.message || "Failed to approve discount request");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject
  const handleReject = async (e) => {
    e.preventDefault();
    if (!selectedApproval || !rejectionReason.trim()) {
      alert("Rejection reason is mandatory.");
      return;
    }
    try {
      setActionLoading(true);
      await api.post(`/discount-approvals/${selectedApproval._id}/reject`, {
        reason: rejectionReason.trim(),
      });
      setSelectedApproval(null);
      setActionType(null);
      setRejectionReason("");
      loadApprovals();
    } catch (err) {
      alert(err.message || "Failed to reject discount request");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 uppercase tracking-wide">
                  Approval Center
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Commercial Governance
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                Quotation Discount Approvals
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Review and decide on discount concessions requested by your
                sales team.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadApprovals}
                disabled={loading}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs hover:bg-slate-50 transition-all"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-600" : "text-slate-500"}`}
                />
                Refresh
              </button>
            </div>
          </div>

          {/* Policy Guardrails Box */}
          <div className="bg-purple-50/70 border border-purple-200 rounded-md p-4 flex items-start gap-3.5 text-xs text-purple-950">
            <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-bold block text-purple-900">
                Commercial Discount Authority Tiers:
              </strong>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[11px] text-purple-800">
                <span>
                  • <strong>Sales Rep:</strong> Standard pricing up to 5%
                </span>
                <span>
                  • <strong>Manager:</strong> Authorized up to 15%
                </span>
                <span>
                  • <strong>CEO / Admin:</strong> Required for discounts &gt;
                  15%
                </span>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <button
                onClick={() => setStatusFilter("PENDING")}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  statusFilter === "PENDING"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Pending Review
              </button>
              <button
                onClick={() => setStatusFilter("APPROVED")}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  statusFilter === "APPROVED"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setStatusFilter("REJECTED")}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  statusFilter === "REJECTED"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Rejected
              </button>
            </div>

            <span className="text-xs font-bold text-slate-500">
              {approvals.length} Record{approvals.length !== 1 ? "s" : ""} Found
            </span>
          </div>

          {/* Approvals Table */}
          <div className="bg-white rounded-md border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Quotation / Customer</th>
                    <th className="py-3.5 px-4">Salesperson</th>
                    <th className="py-3.5 px-4">Quotation Total</th>
                    <th className="py-3.5 px-4">Requested Discount</th>
                    <th className="py-3.5 px-4">Approval Tier</th>
                    <th className="py-3.5 px-4">Requested At</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-12 text-center text-slate-400 text-xs"
                      >
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1.5 text-purple-600" />
                        Loading pending approval requests...
                      </td>
                    </tr>
                  ) : approvals.length > 0 ? (
                    approvals.map((appr) => {
                      const quoteNum =
                        appr.quotationId?.quotationNumber ||
                        appr.quotationNumber ||
                        "QTN";
                      const customerName =
                        appr.customerId?.name ||
                        appr.customerName ||
                        appr.quotationId?.customerSnapshot?.displayName ||
                        "Direct Client";
                      const repName =
                        appr.requestedById?.name ||
                        appr.requestedByName ||
                        "Sales Rep";
                      const totalRupees = appr.totalAmountPaise
                        ? appr.totalAmountPaise / 100
                        : appr.totalAmount ||
                          (appr.quotationId?.grandTotalPaise
                            ? appr.quotationId.grandTotalPaise / 100
                            : 0);
                      const discountPct =
                        appr.requestedDiscountPercent ||
                        appr.discountPercent ||
                        0;
                      const discountRupees = (totalRupees * discountPct) / 100;

                      const isCeoTier =
                        discountPct > MANAGER_MAX_DISCOUNT_PERCENT;

                      return (
                        <tr
                          key={appr._id}
                          className="hover:bg-slate-50/60 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <strong className="text-slate-900 block font-mono">
                              {quoteNum}
                            </strong>
                            <span className="text-[11px] text-slate-500">
                              {customerName}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-semibold text-slate-700">
                            {repName}
                          </td>

                          <td className="py-3 px-4 font-black text-slate-900">
                            ₹{totalRupees.toLocaleString("en-IN")}
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-black text-purple-700 block">
                              {discountPct}% (₹
                              {discountRupees.toLocaleString("en-IN")})
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Discount Concession
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            {isCeoTier ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                <Lock className="w-3 h-3 text-amber-700" />
                                CEO / Admin Tier
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                                <ShieldCheck className="w-3 h-3 text-blue-700" />
                                Manager Tier
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                            {new Date(
                              appr.createdAt || Date.now(),
                            ).toLocaleString()}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                appr.status === "APPROVED"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : appr.status === "REJECTED"
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {appr.status || "PENDING"}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            {statusFilter === "PENDING" && (
                              <div className="flex items-center justify-end gap-1.5">
                                {isCeoTier ? (
                                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                                    CEO / Admin Approval Required
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedApproval(appr);
                                      setActionType("APPROVE");
                                    }}
                                    className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs"
                                  >
                                    Approve
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    setSelectedApproval(appr);
                                    setActionType("REJECT");
                                    setRejectionReason("");
                                  }}
                                  className="px-3 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-12 text-center text-slate-400 text-xs"
                      >
                        No {statusFilter.toLowerCase()} discount approvals
                        found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* APPROVE CONFIRMATION MODAL */}
      {actionType === "APPROVE" && selectedApproval && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="w-12 h-12 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Confirm Discount Approval
              </h3>
              <p className="text-xs text-slate-500">
                You are approving a{" "}
                {selectedApproval.requestedDiscountPercent ||
                  selectedApproval.discountPercent ||
                  0}
                % discount for quotation{" "}
                <strong className="text-slate-800">
                  {selectedApproval.quotationId?.quotationNumber ||
                    selectedApproval.quotationNumber ||
                    "QTN"}
                </strong>
                .
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  setSelectedApproval(null);
                  setActionType(null);
                }}
                className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleApprove}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md"
              >
                {actionLoading ? "Approving..." : "Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL WITH MANDATORY REASON */}
      {actionType === "REJECT" && selectedApproval && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Reject Discount Request
              </h3>
              <button
                onClick={() => {
                  setSelectedApproval(null);
                  setActionType(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReject} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Mandatory Rejection Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Discount exceeds margin floor. Recommend offering free delivery instead."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => {
                    setSelectedApproval(null);
                    setActionType(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-md"
                >
                  {actionLoading ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
