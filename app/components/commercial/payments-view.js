"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../../lib/apiConfig";

export default function PaymentsView({ user }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState("ADVANCE");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [transactionReference, setTransactionReference] = useState("");
  const [notes, setNotes] = useState("");

  const getHeaders = () => {
    const token = localStorage.getItem("token") || "";
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-user-id": user?.email || user?.id || "",
      "x-user-role": user?.role || "",
    };
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append("search", search);
      if (methodFilter !== "all") query.append("paymentMethod", methodFilter);

      const res = await fetch(`${API_BASE_URL}/api/v1/payments?${query.toString()}`, {
        headers: getHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setPayments(json.data || []);
      }
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersForPayment = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/orders?limit=100`, {
        headers: getHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setOrders((json.data || []).filter((o) => (o.balancePaise || 0) > 0));
      }
    } catch (err) {
      console.error("Error fetching active orders:", err);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchOrdersForPayment();
  }, [methodFilter]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedOrderId) {
      alert("Please select an Order.");
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        amount: Number(amount),
        paymentType,
        paymentMethod,
        transactionReference,
        notes,
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/payments/orders/${selectedOrderId}`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        alert(`Payment receipt ${json.data.receiptNumber} recorded successfully!`);
        setShowRecordModal(false);
        fetchPayments();
        fetchOrdersForPayment();
      } else {
        alert(json.error?.message || "Failed to record payment");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadReceipt = async (paymentId, receiptNum) => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE_URL}/api/v1/payments/${paymentId}/receipt`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Receipt-${receiptNum}.pdf`;
      a.click();
    } catch (err) {
      alert("Error downloading receipt: " + err.message);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      CONFIRMED: "bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold",
      PENDING_VERIFICATION: "bg-amber-100 text-amber-800 border-amber-300 animate-pulse",
      BOUNCED: "bg-rose-100 text-rose-800 border-rose-300",
      REVERSED: "bg-gray-100 text-gray-700 border-gray-300 line-through",
      REFUNDED: "bg-purple-100 text-purple-800 border-purple-300",
    };
    return (
      <span className={`px-2.5 py-1 text-xs rounded-full border ${map[status] || "bg-gray-100 text-gray-700"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Ledger</h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable financial audit trail with instant receipt PDF generation.
          </p>
        </div>
        <button
          onClick={() => setShowRecordModal(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition-all shadow-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Record New Payment
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by receipt #, ref, or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchPayments()}
            className="w-full px-4 py-2 pl-9 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white text-slate-700"
        >
          <option value="all">All Payment Methods</option>
          <option value="UPI">UPI</option>
          <option value="BANK_TRANSFER_NEFT_RTGS">Bank Transfer (NEFT/RTGS)</option>
          <option value="CHEQUE">Cheque</option>
          <option value="CASH">Cash</option>
          <option value="CREDIT_CARD">Credit Card</option>
        </select>
      </div>

      {/* Payment Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Receipt #</th>
                <th className="px-6 py-3.5">Order Ref</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Method</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-slate-400">Loading ledger...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-slate-400">No payment records found.</td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-slate-900">{p.receiptNumber}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{p.orderId?.orderNumber || "N/A"}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{p.customerId?.displayName || "N/A"}</div>
                      <div className="text-xs text-slate-400">{p.customerId?.phone || ""}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      ₹{((p.amountPaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                      <div>{p.paymentMethod}</div>
                      {p.transactionReference && <div className="text-[10px] text-slate-400">{p.transactionReference}</div>}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(p.status)}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {p.receivedAt ? new Date(p.receivedAt).toLocaleDateString("en-IN") : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDownloadReceipt(p._id, p.receiptNumber)}
                        className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                        title="Download Receipt PDF"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-xl font-bold text-slate-900">Record Payment</h2>
              <button onClick={() => setShowRecordModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Order with Balance *</label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- Choose Order --</option>
                  {orders.map((o) => (
                    <option key={o._id} value={o._id}>
                      {o.orderNumber} - {o.customerSnapshot?.displayName} (Due: ₹{((o.balancePaise || 0) / 100).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Type</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none"
                  >
                    <option value="ADVANCE">Advance Payment</option>
                    <option value="MILESTONE">Milestone</option>
                    <option value="BALANCE">Balance Settlement</option>
                    <option value="FULL">Full Payment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none"
                  >
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER_NEFT_RTGS">Bank Transfer (NEFT/RTGS)</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CASH">Cash</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Ref / Cheque #</label>
                  <input
                    type="text"
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                    placeholder="e.g. UPI-998822"
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {actionLoading ? "Recording..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
