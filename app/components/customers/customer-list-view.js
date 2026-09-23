"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { apiClient } from "../../../lib/apiClient";

export default function CustomerListView({ user }) {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalRecords: 0,
  });

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDuplicateCheckModal, setShowDuplicateCheckModal] = useState(false);
  const [duplicateCheckInput, setDuplicateCheckInput] = useState({
    phone: "",
    email: "",
    companyName: "",
  });
  const [duplicateResult, setDuplicateResult] = useState(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    displayName: "",
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    gstin: "",
    status: "PROSPECT",
    profileNotes: "",
    billingAddress: {
      addressLine1: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 20,
        search: search.trim(),
        status: statusFilter,
      });

      const res = await apiClient.get(`/api/v1/customers?${params.toString()}`);
      if (res.success) {
        setCustomers(res.data || []);
        if (res.meta) {
          setPagination((prev) => ({
            ...prev,
            totalPages: res.meta.totalPages || 1,
            totalRecords: res.meta.totalRecords || 0,
          }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch customers:", err);
      setError(err.message || "Failed to load customers directory");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, statusFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleDuplicateCheck = async (e) => {
    e.preventDefault();
    setIsCheckingDuplicate(true);
    setDuplicateResult(null);
    try {
      const res = await apiClient.post(
        "/api/v1/customers/check-duplicate",
        duplicateCheckInput,
      );
      setDuplicateResult(res.data);
    } catch (err) {
      setDuplicateResult({ error: err.message || "Duplicate check failed" });
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await apiClient.post("/api/v1/customers", formData);
      if (res.success) {
        setShowCreateModal(false);
        setFormData({
          displayName: "",
          companyName: "",
          contactPerson: "",
          phone: "",
          email: "",
          gstin: "",
          status: "PROSPECT",
          profileNotes: "",
          billingAddress: {
            addressLine1: "",
            city: "",
            state: "",
            pincode: "",
          },
        });
        fetchCustomers();
      }
    } catch (err) {
      setFormError(err.message || "Failed to create customer record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "VIP":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "PROSPECT":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "ARCHIVED":
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
      case "CREDIT_BLOCKED":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 p-6 rounded-md border border-zinc-800 backdrop-blur-xl shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 rounded-xl text-blue-400 border border-blue-500/20">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Customer Directory
              </h1>
              <p className="text-sm text-zinc-400">
                Manage permanent customer profiles, deduplication, and complete
                account histories.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowDuplicateCheckModal(true);
              setDuplicateResult(null);
            }}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-250 rounded-xl text-sm font-medium transition flex items-center gap-2 border border-zinc-700 text-zinc-200"
          >
            <svg
              className="w-4 h-4 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Check Duplicate
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Customer
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <svg
            className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, company, phone number (+91), email, or CUS-..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-sm backdrop-blur-md"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Customer Statuses</option>
            <option value="PROSPECT">Prospect</option>
            <option value="ACTIVE">Active Account</option>
            <option value="VIP">VIP Client</option>
            <option value="CREDIT_BLOCKED">Credit Blocked</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-md overflow-hidden backdrop-blur-xl shadow-xl">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-3"></div>
            <p className="text-zinc-400 text-sm">
              Loading customer directory...
            </p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-rose-400 text-sm">
            <p className="font-semibold mb-1">Failed to load customers</p>
            <p className="text-zinc-500 text-xs">{error}</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-20 text-center text-zinc-400">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-600">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <p className="text-base font-medium text-zinc-300 mb-1">
              No customers found
            </p>
            <p className="text-xs text-zinc-500">
              Create a new customer or convert inquiries to begin managing
              customer profiles.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-800/40 text-zinc-400 border-b border-zinc-800 font-medium">
                <tr>
                  <th className="py-3.5 px-4">Customer ID</th>
                  <th className="py-3.5 px-4">Customer / Company</th>
                  <th className="py-3.5 px-4">Phone & Canonical</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Assigned Sales</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {customers.map((c) => (
                  <tr
                    key={c._id}
                    onClick={() => router.push(`/dashboard/customers/${c._id}`)}
                    className="hover:bg-zinc-800/40 transition cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-blue-400 group-hover:text-blue-300">
                      {c.customerNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-white">
                        {c.displayName}
                      </div>
                      {c.companyName && (
                        <div className="text-xs text-zinc-400">
                          {c.companyName}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-zinc-200">{c.phone}</div>
                      {c.phoneNormalized && (
                        <div className="text-xs text-zinc-500 font-mono">
                          {c.phoneNormalized}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400">
                      {c.email || "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(c.status)}`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400">
                      {c.assignedSalesId?.name || "Unassigned"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/dashboard/whatsapp?customerId=${c._id}`,
                            );
                          }}
                          className="px-2.5 py-1.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 hover:border-emerald-600 rounded-lg text-xs font-medium transition inline-flex items-center gap-1 cursor-pointer"
                          title="Open WhatsApp Communication"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/customers/${c._id}`);
                          }}
                          className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 hover:border-blue-600 rounded-lg text-xs font-medium transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>View Profile</span>
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <div>
              Total {pagination.totalRecords} customers (Page {pagination.page}{" "}
              of {pagination.totalPages})
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 rounded-lg transition"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 rounded-lg transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Duplicate Check Modal */}
      {showDuplicateCheckModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-md w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Customer Duplicate Detection
              </h3>
              <button
                onClick={() => setShowDuplicateCheckModal(false)}
                className="text-zinc-500 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDuplicateCheck} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9820012345 or +919820012345"
                  value={duplicateCheckInput.phone}
                  onChange={(e) =>
                    setDuplicateCheckInput({
                      ...duplicateCheckInput,
                      phone: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. purchase@acme.com"
                  value={duplicateCheckInput.email}
                  onChange={(e) =>
                    setDuplicateCheckInput({
                      ...duplicateCheckInput,
                      email: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Company Name (Fuzzy Match)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Prints"
                  value={duplicateCheckInput.companyName}
                  onChange={(e) =>
                    setDuplicateCheckInput({
                      ...duplicateCheckInput,
                      companyName: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isCheckingDuplicate}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-blue-600/20 transition disabled:opacity-50"
              >
                {isCheckingDuplicate
                  ? "Checking Duplicate Database..."
                  : "Run Duplicate Check"}
              </button>
            </form>

            {/* Results Display */}
            {duplicateResult && (
              <div className="mt-4 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700 space-y-3">
                {duplicateResult.hasMatch ? (
                  <div>
                    <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      Matching Existing Customer Found!
                    </div>

                    {duplicateResult.exactPhoneMatch && (
                      <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-700 text-xs text-zinc-300">
                        <div className="font-semibold text-white">
                          {duplicateResult.exactPhoneMatch.customerNumber}:{" "}
                          {duplicateResult.exactPhoneMatch.displayName}
                        </div>
                        <div>
                          Phone: {duplicateResult.exactPhoneMatch.phone} (
                          {duplicateResult.exactPhoneMatch.phoneNormalized})
                        </div>
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/customers/${duplicateResult.exactPhoneMatch._id}`,
                            )
                          }
                          className="mt-2 text-blue-400 hover:underline font-medium inline-block"
                        >
                          Open Customer Profile →
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    No duplicate record found. Ready for new customer creation.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Customer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-md w-full max-w-2xl overflow-hidden shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                Create New Customer Profile
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-500 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Customer / Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData({ ...formData, displayName: e.target.value })
                    }
                    placeholder="e.g. Apex Corporation"
                    className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Company / Trade Name
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    placeholder="e.g. Apex Prints & Packaging Ltd"
                    className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Phone Number (Canonical E.164) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="e.g. 9820012345"
                    className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="e.g. contact@apex.com"
                    className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    GSTIN (Tax ID)
                  </label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gstin: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="e.g. 27AAAAA0000A1Z5"
                    className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Customer Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="PROSPECT">Prospect (Inquiry)</option>
                    <option value="ACTIVE">Active Account</option>
                    <option value="VIP">VIP Client</option>
                  </select>
                </div>
              </div>

              {/* Address section */}
              <div className="pt-2 border-t border-zinc-800">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Billing Address
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      placeholder="Address Line 1"
                      value={formData.billingAddress.addressLine1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          billingAddress: {
                            ...formData.billingAddress,
                            addressLine1: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="City"
                      value={formData.billingAddress.city}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          billingAddress: {
                            ...formData.billingAddress,
                            city: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="State"
                      value={formData.billingAddress.state}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          billingAddress: {
                            ...formData.billingAddress,
                            state: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Profile & Printing Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.profileNotes}
                  onChange={(e) =>
                    setFormData({ ...formData, profileNotes: e.target.value })
                  }
                  placeholder="Printing preferences, typical order volumes, special instructions..."
                  className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition disabled:opacity-50"
                >
                  {isSubmitting ? "Creating Profile..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
