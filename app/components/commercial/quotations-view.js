"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../../lib/apiConfig";

export default function QuotationsView({ user }) {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Form state
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [validityDays, setValidityDays] = useState(15);
  const [items, setItems] = useState([
    {
      title: "Brochure Printing (A4, 300 GSM)",
      quantity: 1000,
      unitRate: 5.0,
      discountPercent: 0,
      taxRatePercent: 18,
    },
  ]);

  const getHeaders = () => {
    const token = localStorage.getItem("token") || "";
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-user-id": user?.email || user?.id || "",
      "x-user-role": user?.role || "",
    };
  };

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append("search", search);
      if (statusFilter !== "all") query.append("status", statusFilter);

      const res = await fetch(
        `${API_BASE_URL}/api/v1/quotations?${query.toString()}`,
        {
          headers: getHeaders(),
        },
      );
      const json = await res.json();
      if (json.success) {
        setQuotations(json.data || []);
      }
    } catch (err) {
      console.error("Error fetching quotations:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/customers?limit=100`, {
        headers: getHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data?.customers || json.data || []);
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
    }
  };

  useEffect(() => {
    fetchQuotations();
    fetchCustomers();
  }, [statusFilter]);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        title: "",
        quantity: 1,
        unitRate: 0,
        discountPercent: 0,
        taxRatePercent: 18,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    const next = [...items];
    next[index][field] = value;
    setItems(next);
  };

  // Preview Calculations in Frontend
  const previewGross = items.reduce(
    (acc, it) => acc + Number(it.quantity || 0) * Number(it.unitRate || 0),
    0,
  );
  const previewDiscount = items.reduce((acc, it) => {
    const g = Number(it.quantity || 0) * Number(it.unitRate || 0);
    return acc + g * (Number(it.discountPercent || 0) / 100);
  }, 0);
  const previewTaxable = previewGross - previewDiscount;
  const previewTax = items.reduce((acc, it) => {
    const g = Number(it.quantity || 0) * Number(it.unitRate || 0);
    const d = g * (Number(it.discountPercent || 0) / 100);
    return acc + (g - d) * (Number(it.taxRatePercent || 18) / 100);
  }, 0);
  const previewGrand = previewTaxable + previewTax;

  const handleCreateQuotation = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert("Please select a customer.");
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        customerId: selectedCustomerId,
        validityDays: Number(validityDays),
        items: items.map((it) => ({
          title: it.title,
          quantity: Number(it.quantity),
          unitRate: Number(it.unitRate),
          discountPercent: Number(it.discountPercent || 0),
          taxRatePercent: Number(it.taxRatePercent || 18),
        })),
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/quotations`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({
          type: "success",
          text: `Quotation ${json.data.quotationNumber} created successfully!`,
        });
        setShowCreateModal(false);
        fetchQuotations();
      } else {
        alert(json.error?.message || "Failed to create quotation");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSend = async (quoteId) => {
    try {
      setActionLoading(true);
      const res = await fetch(
        `${API_BASE_URL}/api/v1/quotations/${quoteId}/send`,
        {
          method: "POST",
          headers: getHeaders(),
        },
      );
      const json = await res.json();
      if (json.success) {
        alert(`Quotation sent! Client acceptance token link generated.`);
        fetchQuotations();
      } else {
        alert(json.error?.message || "Failed to send quotation");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async (quoteId) => {
    if (
      !confirm(
        "Are you sure you want to mark this quotation ACCEPTED and convert it into a confirmed Order?",
      )
    )
      return;
    try {
      setActionLoading(true);
      const res = await fetch(
        `${API_BASE_URL}/api/v1/quotations/${quoteId}/accept`,
        {
          method: "POST",
          headers: getHeaders(),
        },
      );
      const json = await res.json();
      if (json.success) {
        alert(
          `Quotation accepted! Order ${json.data?.order?.orderNumber} created successfully.`,
        );
        fetchQuotations();
      } else {
        alert(json.error?.message || "Failed to accept quotation");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = async (quoteId, quoteNum) => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(
        `${API_BASE_URL}/api/v1/quotations/${quoteId}/pdf`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Quotation-${quoteNum}.pdf`;
      a.click();
    } catch (err) {
      alert("Error downloading PDF: " + err.message);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      DRAFT: "bg-slate-100 text-slate-700 border-slate-300",
      PENDING_DISCOUNT_APPROVAL:
        "bg-amber-100 text-amber-800 border-amber-300 animate-pulse",
      SENT: "bg-blue-100 text-blue-800 border-blue-300",
      ACCEPTED:
        "bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold",
      REJECTED: "bg-rose-100 text-rose-800 border-rose-300",
      EXPIRED: "bg-gray-200 text-gray-600 border-gray-400",
    };
    return (
      <span
        className={`px-2.5 py-1 text-xs rounded-full border ${map[status] || "bg-gray-100 text-gray-700"}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Quotation Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create, version, and manage commercial proposals with
            server-authoritative GST calculations.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg text-sm transition-all shadow-sm flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create New Quotation
        </button>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex justify-between">
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold">
            ×
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by quote #, customer, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchQuotations()}
            className="w-full px-4 py-2 pl-9 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white text-slate-700"
        >
          <option value="all">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING_DISCOUNT_APPROVAL">Pending Approval</option>
          <option value="SENT">Sent to Client</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="REJECTED">Rejected</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      {/* Quotation Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Quotation #</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Items</th>
                <th className="px-6 py-3.5">Grand Total</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Valid Until</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-8 text-center text-slate-400"
                  >
                    Loading quotations...
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-8 text-center text-slate-400"
                  >
                    No quotations found.
                  </td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr
                    key={q._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{q.quotationNumber}</span>
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-700 rounded">
                          V{q.version}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">
                        {q.customerSnapshot?.displayName || "N/A"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {q.customerSnapshot?.phone || "No phone"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {q.items?.length || 0} line{" "}
                      {q.items?.length === 1 ? "item" : "items"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      ₹
                      {((q.grandTotalPaise || 0) / 100).toLocaleString(
                        "en-IN",
                        { minimumFractionDigits: 2 },
                      )}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(q.status)}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {q.validUntil
                        ? new Date(q.validUntil).toLocaleDateString("en-IN")
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() =>
                          handleDownloadPdf(q._id, q.quotationNumber)
                        }
                        className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"
                        title="Download PDF"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </button>

                      {q.status === "DRAFT" && (
                        <button
                          onClick={() => handleSend(q._id)}
                          className="px-2.5 py-1 bg-sky-50 text-sky-600 hover:bg-sky-100 rounded text-xs font-medium"
                        >
                          Send
                        </button>
                      )}

                      {q.status === "SENT" && (
                        <button
                          onClick={() => handleAccept(q._id)}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-medium"
                        >
                          Accept & Convert
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-xl font-bold text-slate-900">
                Create New Quotation
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Customer *
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.displayName} ({c.phone || c.email || "No contact"})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Validity Period (Days)
                  </label>
                  <input
                    type="number"
                    value={validityDays}
                    onChange={(e) => setValidityDays(e.target.value)}
                    min="1"
                    max="90"
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="border rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Line Items Specification
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs bg-sky-100 text-sky-700 px-2.5 py-1 rounded font-medium hover:bg-sky-200"
                  >
                    + Add Item
                  </button>
                </div>

                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white p-3 rounded-lg border border-slate-200 items-end"
                  >
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-medium text-slate-600">
                        Item Title / Spec
                      </label>
                      <input
                        type="text"
                        required
                        value={it.title}
                        onChange={(e) =>
                          handleItemChange(idx, "title", e.target.value)
                        }
                        className="w-full px-2 py-1 text-xs border rounded focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-600">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={it.quantity}
                        onChange={(e) =>
                          handleItemChange(idx, "quantity", e.target.value)
                        }
                        className="w-full px-2 py-1 text-xs border rounded focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-600">
                        Rate (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={it.unitRate}
                        onChange={(e) =>
                          handleItemChange(idx, "unitRate", e.target.value)
                        }
                        className="w-full px-2 py-1 text-xs border rounded focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-600">
                        Disc %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={it.discountPercent}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            "discountPercent",
                            e.target.value,
                          )
                        }
                        className="w-full px-2 py-1 text-xs border rounded focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-medium text-slate-600">
                        Tax %
                      </label>
                      <input
                        type="number"
                        value={it.taxRatePercent}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            "taxRatePercent",
                            e.target.value,
                          )
                        }
                        className="w-full px-2 py-1 text-xs border rounded focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-1 text-right">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-rose-500 hover:text-rose-700 text-sm font-bold p-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals Preview */}
              <div className="bg-slate-100 p-4 rounded-xl space-y-1 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>Gross Subtotal:</span>
                  <span>₹{previewGross.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-amber-700">
                  <span>Discount Concession:</span>
                  <span>- ₹{previewDiscount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Taxable Value:</span>
                  <span>₹{previewTaxable.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated GST:</span>
                  <span>₹{previewTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 border-t border-slate-300 pt-2 mt-2">
                  <span>Estimated Grand Total:</span>
                  <span>₹{previewGrand.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {actionLoading
                    ? "Calculating & Saving..."
                    : "Create Quotation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
