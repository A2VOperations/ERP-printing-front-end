"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  FileText,
  DollarSign,
  Download,
  Printer,
  X,
  MessageCircle,
} from "lucide-react";

const formatDate = (dateVal) => {
  if (!dateVal) return "-";
  try {
    return new Date(dateVal).toLocaleDateString("en-IN");
  } catch (e) {
    return "-";
  }
};

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [receiptPayment, setReceiptPayment] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored =
        typeof window !== "undefined" ? localStorage.getItem("user") : null;
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });
  const [currentTenant, setCurrentTenant] = useState(() => {
    try {
      if (typeof window === "undefined") return null;
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return u?.tenant || JSON.parse(localStorage.getItem("tenant") || "null");
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => {
        if (res?.data?.user) setCurrentUser(res.data.user);
        else if (res?.data) setCurrentUser(res.data);
        if (res?.data?.tenant) setCurrentTenant(res.data.tenant);
      })
      .catch(() => {});

    api
      .get("/tenants/current", { silent: true })
      .then((res) => {
        if (res?.data?.tenant) setCurrentTenant(res.data.tenant);
        else if (res?.data) setCurrentTenant(res.data);
      })
      .catch(() => {});
  }, []);

  const roleRaw =
    currentUser?.roleSlug ||
    currentUser?.role?.slug ||
    currentUser?.role?.name ||
    currentUser?.role ||
    "";
  const userRole = (
    typeof roleRaw === "string" ? roleRaw : roleRaw?.slug || roleRaw?.name || ""
  ).toUpperCase();
  const isSalesOnly =
    userRole === "SALES" || userRole === "SALES_REP" || userRole === "DESIGNER";
  const canVerifyPayment = !isSalesOnly;

  const [loadError, setLoadError] = useState(null);

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await api.get("/payments?limit=100");
      if (res && res.data) {
        const list = Array.isArray(res.data)
          ? res.data
          : res.data.records || res.data.items || [];
        setPayments(list);
      } else if (Array.isArray(res)) {
        setPayments(res);
      } else if (Array.isArray(res?.items)) {
        setPayments(res.items);
      } else if (Array.isArray(res?.records)) {
        setPayments(res.records);
      }
    } catch (err) {
      console.error("Failed to load payments:", err);
      setLoadError(err.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleVerifyPayment = async (paymentId) => {
    if (
      !confirm(
        "Confirm and verify this payment? The amount will be marked CONFIRMED and credited.",
      )
    )
      return;
    try {
      setActionLoading(true);
      await api.post(`/payments/${paymentId}/verify`);
      await loadPayments();
    } catch (err) {
      alert(err.message || "Failed to verify payment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPayment = async (paymentId) => {
    const reason = prompt("Please enter rejection / bounce reason:");
    if (!reason) return;
    try {
      setActionLoading(true);
      await api.post(`/payments/${paymentId}/bounce`, { reason });
      await loadPayments();
    } catch (err) {
      alert(err.message || "Failed to reject payment");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      p.customerName?.toLowerCase().includes(q) ||
      p.customerId?.displayName?.toLowerCase().includes(q) ||
      p.orderNumber?.toLowerCase().includes(q) ||
      p.orderId?.orderNumber?.toLowerCase().includes(q) ||
      p.receiptNumber?.toLowerCase().includes(q) ||
      p.paymentNumber?.toLowerCase().includes(q)
    );
  });

  const totalCollectedPaise = payments
    .filter((p) => p.status === "CONFIRMED")
    .reduce(
      (sum, p) => sum + (p.amountPaise || (p.amount ? p.amount * 100 : 0)),
      0,
    );

  const totalPendingPaise = payments
    .filter((p) => p.status === "PENDING_VERIFICATION")
    .reduce(
      (sum, p) => sum + (p.amountPaise || (p.amount ? p.amount * 100 : 0)),
      0,
    );

  // Resolved Receipt Values for Preview Modal
  const tenantName = currentTenant?.name || "A2V PRINTING SOLUTIONS";
  const tenantTagline =
    currentTenant?.branding?.tagline ||
    "Commercial Printing & Packaging Solutions";
  const tenantPhone = currentTenant?.phone || "+91 98765 43210";
  const tenantEmail = currentTenant?.email || "contact@a2vprinting.com";
  const tenantGstin = currentTenant?.gstin || "27AAAAA0000A1Z5";

  const rCust =
    receiptPayment?.customerId ||
    receiptPayment?.orderId?.customerSnapshot ||
    {};
  const rClientName =
    rCust.displayName ||
    rCust.name ||
    rCust.companyName ||
    receiptPayment?.customerName ||
    receiptPayment?.leadId?.businessName ||
    receiptPayment?.leadId?.contactName ||
    "Valued Customer";
  const rClientCompany =
    rCust.companyName && rCust.companyName !== rClientName
      ? rCust.companyName
      : "";
  const rClientContact =
    rCust.contactPerson || (!rClientCompany ? rClientName : "");
  const rClientPhone =
    rCust.phone ||
    receiptPayment?.phone ||
    receiptPayment?.leadId?.phone ||
    "N/A";
  const rClientEmail = rCust.email || "N/A";
  const rClientGstin = rCust.gstin || "Unregistered";

  const rAmountRupees =
    receiptPayment?.amountPaise !== undefined
      ? Math.abs(receiptPayment.amountPaise) / 100
      : Number(receiptPayment?.amount || 0);

  const rOrder = receiptPayment?.orderId || {};
  const rOrderTotalRupees =
    rOrder.grandTotalPaise !== undefined
      ? rOrder.grandTotalPaise / 100
      : receiptPayment?.quotationId?.grandTotalPaise
        ? receiptPayment.quotationId.grandTotalPaise / 100
        : rAmountRupees;
  const rTotalPaidRupees =
    rOrder.totalPaidPaise !== undefined
      ? rOrder.totalPaidPaise / 100
      : receiptPayment?.status === "CONFIRMED"
        ? rAmountRupees
        : 0;
  const rBalanceRupees =
    rOrder.balancePaise !== undefined
      ? rOrder.balancePaise / 100
      : Math.max(0, rOrderTotalRupees - rTotalPaidRupees);

  const rCollector =
    receiptPayment?.collectedById?.name || "Authorized Finance Officer";
  const rVerifier =
    receiptPayment?.verifiedById?.name ||
    (receiptPayment?.status === "CONFIRMED" ? "System Accounts Officer" : null);
  const rReceiptNum =
    receiptPayment?.receiptNumber || receiptPayment?.paymentNumber || "N/A";
  const rOrderNum =
    rOrder.orderNumber ||
    receiptPayment?.orderNumber ||
    (receiptPayment?.leadId
      ? `Lead: ${receiptPayment.leadId?.leadNumber || ""}`
      : "Commercial Settlement");

  let rRefStr = receiptPayment?.paymentMethod
    ? receiptPayment.paymentMethod.replace(/_/g, " ")
    : "UPI";
  if (receiptPayment?.transactionReference)
    rRefStr += ` (Ref: ${receiptPayment.transactionReference})`;
  if (receiptPayment?.chequeNumber)
    rRefStr += ` [Cheque: ${receiptPayment.chequeNumber}]`;
  if (receiptPayment?.bankName) rRefStr += ` - ${receiptPayment.bankName}`;

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
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wide">
                  Payments &amp; Collections
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Phase 3 Transactions
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                Payment Transactions
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                View verified customer payments, transaction receipts, and
                collection records.
              </p>
            </div>

            <button
              onClick={loadPayments}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs hover:bg-slate-50 transition-all self-start sm:self-auto"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : "text-slate-500"}`}
              />
              Refresh
            </button>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-md border border-slate-200/90 shadow-xs">
              <span className="text-xs font-semibold text-emerald-700 block">
                Verified &amp; Cleared Total
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                ₹
                {(totalCollectedPaise / 100).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Credited to accounts
              </span>
            </div>

            <div className="bg-white p-5 rounded-md border border-amber-200/90 shadow-xs">
              <span className="text-xs font-semibold text-amber-700 block">
                Pending Verification Total
              </span>
              <div className="text-2xl font-black text-amber-900 mt-1 font-mono">
                ₹
                {(totalPendingPaise / 100).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Awaiting Manager/Admin action
              </span>
            </div>

            <div className="bg-white p-5 rounded-md border border-slate-200/90 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block">
                Total Transactions
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                {payments.length}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Recorded in immutable ledger
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by customer name, order #, or receipt #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-white rounded-md border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Transaction / Receipt</th>
                    <th className="py-3.5 px-4">Customer / Lead</th>
                    <th className="py-3.5 px-4">Order Number</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-12 text-center text-slate-400 text-xs"
                      >
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1.5 text-blue-600" />
                        Loading payments list...
                      </td>
                    </tr>
                  ) : filteredPayments.length > 0 ? (
                    filteredPayments.map((p, idx) => {
                      const amountRupees = p.amountPaise
                        ? p.amountPaise / 100
                        : p.amount || 0;
                      const receiptNum =
                        p.receiptNumber ||
                        p.paymentNumber ||
                        `REC-2026-${100 + idx}`;
                      const isPending = p.status === "PENDING_VERIFICATION";
                      const isConfirmed = p.status === "CONFIRMED";

                      return (
                        <tr
                          key={p._id || idx}
                          onClick={() => setReceiptPayment(p)}
                          className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${isPending ? "bg-amber-50/20" : ""}`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {receiptNum}
                          </td>

                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {p.customerId?.displayName ||
                              p.customerId?.name ||
                              p.customerName ||
                              p.leadId?.businessName ||
                              p.leadId?.contactName ||
                              "Direct Client"}
                          </td>

                          <td className="py-3 px-4 font-mono text-slate-600 font-semibold">
                            {p.orderId?.orderNumber ||
                              p.orderNumber ||
                              (p.leadId
                                ? `Lead: ${p.leadId?.leadNumber || p.leadId?._id?.slice(-6) || ""}`
                                : "-")}
                          </td>

                          <td className="py-3 px-4 font-bold text-slate-700">
                            {p.paymentMethod?.replace(/_/g, " ") || "UPI"}
                          </td>

                          <td className="py-3 px-4 font-black font-mono text-slate-900">
                            ₹
                            {amountRupees.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>

                          <td className="py-3 px-4 font-mono text-slate-500">
                            {formatDate(p.receivedAt || p.createdAt)}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                isConfirmed
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : isPending
                                    ? "bg-amber-100 text-amber-800 border-amber-300"
                                    : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              {isConfirmed
                                ? "Verified"
                                : isPending
                                  ? "Pending"
                                  : "Rejected"}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div
                              className="flex items-center justify-end gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Manager / Admin verification actions */}
                              {isPending && canVerifyPayment && (
                                <>
                                  <button
                                    onClick={() => handleVerifyPayment(p._id)}
                                    disabled={actionLoading}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs flex items-center gap-1 transition-all"
                                    title="Verify & Confirm Payment"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    Verify
                                  </button>
                                  <button
                                    onClick={() => handleRejectPayment(p._id)}
                                    disabled={actionLoading}
                                    className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 transition-all"
                                    title="Reject Payment"
                                  >
                                    ✕
                                  </button>
                                </>
                              )}

                              {isPending && isSalesOnly && (
                                <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  Awaiting Verification
                                </span>
                              )}

                              {/* WhatsApp Contact Action */}
                              <button
                                onClick={() => {
                                  const cId =
                                    p.customerId?._id ||
                                    p.customerId ||
                                    p.leadId?._id ||
                                    "";
                                  const phone =
                                    p.customerId?.phone ||
                                    p.leadId?.phone ||
                                    p.leadId?.contactPhone ||
                                    "";
                                  const amountStr = (
                                    p.amountPaise
                                      ? (p.amountPaise / 100).toFixed(2)
                                      : p.amount || ""
                                  ).toString();
                                  router.push(
                                    `/dashboard/whatsapp?customerId=${cId}&phone=${phone}&amount=${amountStr}&template=payment_reminder`,
                                  );
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] border border-emerald-200 transition-all shadow-2xs cursor-pointer"
                                title="Send WhatsApp Receipt / Follow-up"
                              >
                                <MessageCircle className="w-3 h-3 text-emerald-600" />
                                WhatsApp
                              </button>

                              {/* Preview & Download Buttons */}
                              <button
                                onClick={() => setReceiptPayment(p)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] border border-blue-200 transition-all shadow-2xs"
                                title="Preview Payment Receipt"
                              >
                                <FileText className="w-3 h-3 text-blue-600" />
                                Preview
                              </button>

                              {isConfirmed && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await api.downloadPdf(
                                        `/payments/${p._id}/receipt`,
                                        `Receipt-${receiptNum}.pdf`,
                                      );
                                    } catch (err) {
                                      alert(
                                        err.message ||
                                          "Failed to download Receipt PDF",
                                      );
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] border border-emerald-200 transition-all shadow-2xs"
                                  title="Download Payment Receipt PDF"
                                >
                                  <Download className="w-3 h-3 text-emerald-600" />
                                  PDF
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : loadError ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-12 text-center text-rose-600 text-xs"
                      >
                        <AlertTriangle className="w-5 h-5 mx-auto mb-1.5 text-rose-500" />
                        <span className="font-semibold block">{loadError}</span>
                        <button
                          onClick={loadPayments}
                          className="mt-3 px-3 py-1 bg-white border border-rose-300 text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-50 shadow-2xs"
                        >
                          Retry Loading Payments
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-12 text-center text-slate-400 text-xs"
                      >
                        No payment transactions recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Official Payment Receipt Preview Modal (Mirroring the Downloaded PDF) */}
      {receiptPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden my-8 animate-scale-up">
            {/* Top Action Bar */}
            <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  OFFICIAL RECEIPT
                </span>
                <span className="text-xs font-mono font-bold text-slate-200">
                  {rReceiptNum}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      await api.downloadPdf(
                        `/payments/${receiptPayment._id}/receipt`,
                        `Receipt-${rReceiptNum}.pdf`,
                      );
                    } catch (err) {
                      alert(err.message || "Failed to download receipt PDF");
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </button>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>

                <button
                  onClick={() => setReceiptPayment(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Body (WYSIWYG Mirror of PDF) */}
            <div className="p-6 md:p-8 space-y-6 text-xs text-slate-700 bg-white max-h-[80vh] overflow-y-auto">
              {/* Branded Header Banner */}
              <div className="rounded-md p-5 md:p-6 bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-black tracking-tight">
                    {tenantName}
                  </h2>
                  <p className="text-sky-100 text-xs mt-1 font-medium">
                    {tenantTagline}
                  </p>
                </div>

                <div className="text-left md:text-right bg-white/10 backdrop-blur-xs border border-white/20 px-4 py-2.5 rounded-xl space-y-0.5">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-sky-200 block">
                    OFFICIAL PAYMENT RECEIPT
                  </span>
                  <div className="font-mono font-bold text-white text-xs">
                    Receipt No: {rReceiptNum}
                  </div>
                  <div className="text-[11px] text-sky-100">
                    Date Issued:{" "}
                    {formatDate(
                      receiptPayment.receivedAt || receiptPayment.createdAt,
                    )}
                  </div>
                  <div className="text-[11px]">
                    Status:{" "}
                    <span
                      className={`font-bold ${receiptPayment.status === "CONFIRMED" ? "text-emerald-300" : "text-amber-300"}`}
                    >
                      {receiptPayment.status === "CONFIRMED"
                        ? "VERIFIED & CREDITED"
                        : receiptPayment.status?.replace(/_/g, " ") ||
                          "PENDING VERIFICATION"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Two-Column Seller & Client Particulars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2 border-b border-slate-200">
                {/* Issued By (Left) */}
                <div className="p-4 rounded-md bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                    ISSUED BY:
                  </span>
                  <strong className="text-slate-900 text-sm block font-bold">
                    {tenantName}
                  </strong>
                  <div className="text-slate-600 text-xs">
                    Phone:{" "}
                    <span className="font-medium text-slate-800">
                      {tenantPhone}
                    </span>
                  </div>
                  <div className="text-slate-600 text-xs">
                    Email:{" "}
                    <span className="font-medium text-slate-800">
                      {tenantEmail}
                    </span>
                  </div>
                  <div className="text-slate-600 text-xs">
                    GSTIN:{" "}
                    <span className="font-mono font-semibold text-slate-800">
                      {tenantGstin}
                    </span>
                  </div>
                </div>

                {/* Received From (Right) */}
                <div className="p-4 rounded-md bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                    RECEIVED FROM:
                  </span>
                  <strong className="text-slate-900 text-sm block font-bold">
                    {rClientName}
                  </strong>
                  {(rClientCompany || rClientContact) && (
                    <div className="text-slate-600 text-xs">
                      {rClientCompany
                        ? `Company: ${rClientCompany}`
                        : `Contact: ${rClientContact}`}
                    </div>
                  )}
                  <div className="text-slate-600 text-xs">
                    Phone:{" "}
                    <span className="font-medium text-slate-800">
                      {rClientPhone}
                    </span>
                    {rClientEmail && rClientEmail !== "N/A" && (
                      <span>
                        {" "}
                        | Email:{" "}
                        <span className="font-medium text-slate-800">
                          {rClientEmail}
                        </span>
                      </span>
                    )}
                  </div>
                  <div className="text-slate-600 text-xs">
                    GSTIN:{" "}
                    <span className="font-mono font-semibold text-slate-800">
                      {rClientGstin}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Details Table */}
              <div className="border border-slate-200 rounded-md overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <th className="py-3 px-3 text-center w-10">#</th>
                      <th className="py-3 px-4">PAYMENT DESCRIPTION</th>
                      <th className="py-3 px-4">METHOD &amp; REFERENCE</th>
                      <th className="py-3 px-3 text-center">STATUS</th>
                      <th className="py-3 px-4 text-right">AMOUNT PAID</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-3 text-center text-slate-400 font-mono font-medium">
                        1
                      </td>
                      <td className="py-3.5 px-4">
                        <strong className="text-slate-900 block font-bold text-xs">
                          Payment for Order {rOrderNum}
                        </strong>
                        {receiptPayment.paymentType && (
                          <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-block mt-1 font-medium border border-blue-100">
                            Type: {receiptPayment.paymentType}
                          </span>
                        )}
                        {receiptPayment.notes && (
                          <span className="text-[11px] text-slate-500 block mt-1">
                            {receiptPayment.notes}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {rRefStr}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            receiptPayment.status === "CONFIRMED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-100 text-amber-800 border-amber-300"
                          }`}
                        >
                          {receiptPayment.status === "CONFIRMED"
                            ? "✓ Confirmed"
                            : "⏳ Pending"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                        ₹
                        {rAmountRupees.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Order Balance & Totals Summary Box */}
              <div className="flex justify-end pt-2">
                <div className="w-full sm:w-80 p-4 rounded-md bg-slate-50 border border-slate-200/90 space-y-2 font-mono">
                  <div className="flex justify-between text-slate-600 text-xs">
                    <span>Order Total Value:</span>
                    <span>
                      ₹
                      {rOrderTotalRupees.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-xs">
                    <span>Total Verified Paid:</span>
                    <span className="font-semibold text-emerald-700">
                      ₹
                      {rTotalPaidRupees.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-900 font-extrabold text-xs pt-2 border-t border-slate-200">
                    <span>Remaining Balance:</span>
                    <span
                      className={`text-sm font-black ${rBalanceRupees > 0 ? "text-rose-700" : "text-emerald-700"}`}
                    >
                      ₹
                      {rBalanceRupees.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Audit & Signatory Block */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-1 text-slate-500 text-[11px]">
                  <strong className="text-slate-700 font-semibold block uppercase tracking-wider text-[10px]">
                    Audit Particulars
                  </strong>
                  <div>
                    Recorded By:{" "}
                    <strong className="text-slate-800">{rCollector}</strong>
                  </div>
                  <div>
                    Verification:{" "}
                    <strong className="text-slate-800">
                      {rVerifier
                        ? `${rVerifier} (on ${formatDate(receiptPayment.verifiedAt)})`
                        : "Awaiting Manager / Admin verification"}
                    </strong>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 italic">
                    This is an authentic computer generated electronic receipt.
                    No physical signature required.
                  </p>
                </div>

                <div className="text-right p-3.5 rounded-md bg-slate-50 border border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-800 block">
                    For {tenantName}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-6 uppercase tracking-wider font-semibold">
                    Authorized Commercial Accounts Signatory
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
