"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../../lib/apiConfig";

export default function OrdersView({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const getHeaders = () => {
    const token = localStorage.getItem("token") || "";
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-user-id": user?.email || user?.id || "",
      "x-user-role": user?.role || "",
    };
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append("search", search);
      if (statusFilter !== "all") query.append("orderStatus", statusFilter);

      const res = await fetch(`${API_BASE_URL}/api/v1/orders?${query.toString()}`, {
        headers: getHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setOrders(json.data || []);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleDownloadInvoice = async (orderId, orderNum) => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE_URL}/api/v1/orders/${orderId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Tax-Invoice-${orderNum}.pdf`;
      a.click();
    } catch (err) {
      alert("Error downloading Invoice: " + err.message);
    }
  };

  const getOrderStatusBadge = (status) => {
    const map = {
      CONFIRMED: "bg-blue-100 text-blue-800 border-blue-300",
      AWAITING_ADVANCE: "bg-amber-100 text-amber-800 border-amber-300 animate-pulse",
      COMMERCIALLY_CLEARED: "bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold",
      CANCELLED: "bg-rose-100 text-rose-800 border-rose-300",
    };
    return (
      <span className={`px-2.5 py-1 text-xs rounded-full border ${map[status] || "bg-gray-100 text-gray-700"}`}>
        {status}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const map = {
      PENDING: "bg-rose-50 text-rose-700 border-rose-200",
      PARTIALLY_PAID: "bg-amber-50 text-amber-700 border-amber-200",
      PAID: "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold",
    };
    return (
      <span className={`px-2 py-0.5 text-[11px] rounded border ${map[status] || "bg-gray-100 text-gray-700"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Order Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Confirmed jobs with advance gate clearance, payment reconciliation, and tax invoices.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by order #, invoice #, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchOrders()}
            className="w-full px-4 py-2 pl-9 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white text-slate-700"
        >
          <option value="all">All Order Statuses</option>
          <option value="AWAITING_ADVANCE">Awaiting Advance</option>
          <option value="COMMERCIALLY_CLEARED">Commercially Cleared</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Order / Invoice #</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Grand Total</th>
                <th className="px-6 py-3.5">Advance Gate</th>
                <th className="px-6 py-3.5">Balance Due</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400">No orders found.</td>
                </tr>
              ) : (
                orders.map((o) => {
                  const advancePct = o.grandTotalPaise > 0 ? Math.min(100, Math.round((o.advanceReceivedPaise / (o.advanceRequiredPaise || 1)) * 100)) : 100;
                  return (
                    <tr key={o._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-slate-900">
                        <div>{o.orderNumber}</div>
                        <div className="text-xs text-slate-400 font-sans">{o.invoiceNumber || "No Inv"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{o.customerSnapshot?.displayName || "N/A"}</div>
                        <div className="text-xs text-slate-400">{o.customerSnapshot?.phone || "No phone"}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        ₹{((o.grandTotalPaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        {o.creditBypassApplied ? (
                          <span className="px-2 py-0.5 text-[11px] bg-emerald-50 text-emerald-700 rounded font-semibold">
                            Credit Approved
                          </span>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] text-slate-500">
                              <span>Req: ₹{((o.advanceRequiredPaise || 0) / 100).toLocaleString("en-IN")}</span>
                              <span>Rec: ₹{((o.advanceReceivedPaise || 0) / 100).toLocaleString("en-IN")}</span>
                            </div>
                            <div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${advancePct >= 100 ? "bg-emerald-500" : "bg-amber-500"}`}
                                style={{ width: `${advancePct}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-rose-700">
                        ₹{((o.balancePaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        <div className="mt-0.5">{getPaymentStatusBadge(o.paymentStatus)}</div>
                      </td>
                      <td className="px-6 py-4">{getOrderStatusBadge(o.orderStatus)}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleDownloadInvoice(o._id, o.orderNumber)}
                          className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"
                          title="Download Tax Invoice"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedOrder.orderNumber}</h2>
                <p className="text-xs text-slate-500">Invoice: {selectedOrder.invoiceNumber || "N/A"}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="border rounded-xl p-3 bg-slate-50">
                <h3 className="font-bold text-slate-700 uppercase mb-2">Order Line Items Snapshot</h3>
                <div className="space-y-2">
                  {selectedOrder.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between border-b pb-1 text-slate-700">
                      <div>
                        <div className="font-medium">{it.title}</div>
                        <div className="text-[11px] text-slate-400">{it.quantity} units @ ₹{((it.unitRatePaise || 0) / 100).toFixed(2)}</div>
                      </div>
                      <div className="font-semibold">₹{((it.itemTotalPaise || 0) / 100).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-100 p-3 rounded-xl space-y-1">
                <div className="flex justify-between"><span>Grand Total:</span><span className="font-bold">₹{((selectedOrder.grandTotalPaise || 0) / 100).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Total Paid:</span><span className="text-emerald-700 font-semibold">₹{((selectedOrder.totalPaidPaise || 0) / 100).toFixed(2)}</span></div>
                <div className="flex justify-between border-t pt-1 font-bold text-rose-700"><span>Outstanding Balance:</span><span>₹{((selectedOrder.balancePaise || 0) / 100).toFixed(2)}</span></div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
