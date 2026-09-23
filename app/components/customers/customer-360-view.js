"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { apiClient } from "../../../lib/apiClient";

export default function Customer360View({ customerId, user }) {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // overview, leads, followups, activity

  // Modals
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [showNewFollowupModal, setShowNewFollowupModal] = useState(false);
  const [showCompleteFollowupModal, setShowCompleteFollowupModal] = useState(false);
  const [selectedFollowup, setSelectedFollowup] = useState(null);

  // Forms
  const [newLeadForm, setNewLeadForm] = useState({
    requirement: "",
    estimatedBudget: 0,
    source: "MANUAL",
    printingRequirement: {
      productName: "",
      size: "",
      quantity: 1000,
      material: "",
      notes: "",
    },
  });

  const [newFollowupForm, setNewFollowupForm] = useState({
    title: "",
    scheduledAt: "",
    description: "",
  });

  const [completeForm, setCompleteForm] = useState({
    outcome: "INTERESTED",
    outcomeNotes: "",
    nextAction: "NONE",
    nextFollowup: {
      title: "",
      scheduledAt: "",
      description: "",
    },
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchCustomer360 = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/api/v1/customers/${customerId}/360`);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Failed to load Customer 360:", err);
      setError(err.message || "Failed to load Customer 360 data");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) {
      fetchCustomer360();
    }
  }, [customerId, fetchCustomer360]);

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const customer = data.customer;
      const res = await apiClient.post("/api/v1/leads", {
        customerId: customer._id,
        contactName: customer.contactPerson || customer.displayName,
        businessName: customer.companyName || customer.displayName,
        phone: customer.phone,
        ...newLeadForm,
      });
      setShowNewLeadModal(false);
      setNewLeadForm({
        requirement: "",
        estimatedBudget: 0,
        source: "MANUAL",
        printingRequirement: { productName: "", size: "", quantity: 1000, material: "", notes: "" },
      });
      fetchCustomer360();
    } catch (err) {
      alert(err.message || "Failed to create lead");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateFollowup = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post("/api/v1/followups", {
        ...newFollowupForm,
        customerId,
      });
      setShowNewFollowupModal(false);
      setNewFollowupForm({ title: "", scheduledAt: "", description: "" });
      fetchCustomer360();
    } catch (err) {
      alert(err.message || "Failed to schedule follow-up");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteFollowup = async (e) => {
    e.preventDefault();
    if (!selectedFollowup) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/api/v1/followups/${selectedFollowup._id}/complete`, completeForm);
      setShowCompleteFollowupModal(false);
      setSelectedFollowup(null);
      fetchCustomer360();
    } catch (err) {
      alert(err.message || "Failed to complete follow-up");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-zinc-400 text-sm">Loading customer profile & history...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl text-center space-y-4">
        <div className="text-rose-400 font-semibold">Customer Profile Not Found</div>
        <p className="text-zinc-500 text-sm">{error || "Customer profile could not be loaded."}</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm rounded-xl"
        >
          ← Back to Directory
        </button>
      </div>
    );
  }

  const { customer, leadSummary, followupSummary, recentLeads, recentFollowups, activityTimeline } = data;

  return (
    <div className="space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1.5 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Directory
        </button>
        <div className="text-xs text-zinc-500 font-mono">
          Tenant: {customer.tenantId?.name || "A2V Printing"}
        </div>
      </div>

      {/* Customer 360 Header Profile Card */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20 shrink-0">
              {customer.displayName?.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-white tracking-tight">{customer.displayName}</h1>
                <span className="px-2.5 py-0.5 text-xs font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                  {customer.customerNumber}
                </span>
                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                  customer.status === "ACTIVE"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : customer.status === "VIP"
                    ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                    : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                }`}>
                  {customer.status}
                </span>
              </div>
              {customer.companyName && (
                <p className="text-sm font-medium text-zinc-400">{customer.companyName}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {customer.phone} {customer.phoneNormalized && <span className="font-mono text-zinc-500">({customer.phoneNormalized})</span>}
                </span>
                {customer.email && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {customer.email}
                  </span>
                )}
                {customer.gstin && (
                  <span className="font-mono text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                    GSTIN: {customer.gstin}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/dashboard/whatsapp?customerId=${customer._id}`)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
              title="Open WhatsApp Communication"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => router.push(`/dashboard/communication`)}
              className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-sm font-medium rounded-xl border border-indigo-500/30 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Communication Hub
            </button>
            <button
              onClick={() => setShowNewFollowupModal(true)}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-xl border border-zinc-700 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Schedule Follow-up
            </button>
            <button
              onClick={() => setShowNewLeadModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Opportunity
            </button>
          </div>
        </div>

        {/* 360 Metric Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-zinc-800/80">
          <div className="p-4 bg-zinc-800/40 rounded-2xl border border-zinc-800">
            <div className="text-xs text-zinc-400 font-medium">Total Inquiries / Leads</div>
            <div className="text-2xl font-bold text-white mt-1">{leadSummary.totalLeads}</div>
          </div>
          <div className="p-4 bg-zinc-800/40 rounded-2xl border border-zinc-800">
            <div className="text-xs text-zinc-400 font-medium">Active Opportunities</div>
            <div className="text-2xl font-bold text-blue-400 mt-1">{leadSummary.activeLeads}</div>
          </div>
          <div className="p-4 bg-zinc-800/40 rounded-2xl border border-zinc-800">
            <div className="text-xs text-zinc-400 font-medium">Completed Engagements</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{followupSummary.completedFollowups}</div>
          </div>
          <div className="p-4 bg-zinc-800/40 rounded-2xl border border-zinc-800">
            <div className="text-xs text-zinc-400 font-medium">Pending Follow-ups</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{followupSummary.pendingFollowups}</div>
          </div>
        </div>
      </div>

      {/* 4 Interactive Customer 360 Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-1">
          {[
            { id: "overview", label: "Overview & Profile" },
            { id: "leads", label: `Sales Opportunities (${recentLeads.length})` },
            { id: "followups", label: `Follow-ups (${recentFollowups.length})` },
            { id: "communications", label: `Communications (${(data?.communications?.threads || []).length})` },
            { id: "activity", label: `Timeline & Audit (${activityTimeline.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition border-b-2 -mb-1 ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-400 bg-zinc-900/60"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4 backdrop-blur-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Address & Logistics
              </h3>
              <div className="space-y-3 text-sm text-zinc-300">
                <div>
                  <span className="text-zinc-500 text-xs block">Billing Address</span>
                  <p className="font-medium text-white">
                    {customer.billingAddress?.addressLine1 || "No street address recorded"}
                  </p>
                  <p className="text-zinc-400 text-xs">
                    {[
                      customer.billingAddress?.city,
                      customer.billingAddress?.state,
                      customer.billingAddress?.pincode,
                    ]
                      .filter(Boolean)
                      .join(", ") || "City / State not specified"}
                  </p>
                </div>

                <div>
                  <span className="text-zinc-500 text-xs block">Assigned Sales Representative</span>
                  <p className="font-medium text-zinc-200">
                    {customer.assignedSalesId?.name || "Unassigned"} ({customer.assignedSalesId?.email || "—"})
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4 backdrop-blur-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Customer Preferences & Notes
              </h3>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                {customer.profileNotes || "No specific customer profile notes recorded yet."}
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Opportunities / Leads */}
        {activeTab === "leads" && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
            {recentLeads.length === 0 ? (
              <div className="p-12 text-center text-zinc-400">
                <p className="text-sm">No sales leads associated with this customer yet.</p>
                <button
                  onClick={() => setShowNewLeadModal(true)}
                  className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition"
                >
                  Create First Opportunity
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-800/40 text-zinc-400 border-b border-zinc-800 font-medium">
                    <tr>
                      <th className="py-3 px-4">Lead ID</th>
                      <th className="py-3 px-4">Requirement Details</th>
                      <th className="py-3 px-4">Source</th>
                      <th className="py-3 px-4">Est. Value</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Assigned To</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {recentLeads.map((lead) => (
                      <tr key={lead._id} className="hover:bg-zinc-800/40 transition">
                        <td className="py-3 px-4 font-mono text-xs font-bold text-blue-400">
                          {lead.leadNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-white">{lead.requirement || "General Printing Inquiry"}</div>
                          {lead.printingRequirement?.productName && (
                            <div className="text-xs text-zinc-400">
                              {lead.printingRequirement.productName} ({lead.printingRequirement.quantity} {lead.printingRequirement.unit})
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-zinc-400">{lead.source}</td>
                        <td className="py-3 px-4 font-semibold text-white">
                          ₹{Number(lead.estimatedBudget || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {lead.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-400">
                          {lead.assignedToId?.name || "Unassigned"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Follow-ups */}
        {activeTab === "followups" && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
            {recentFollowups.length === 0 ? (
              <div className="p-12 text-center text-zinc-400">
                <p className="text-sm">No follow-ups scheduled for this account.</p>
                <button
                  onClick={() => setShowNewFollowupModal(true)}
                  className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition"
                >
                  Schedule Follow-up
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-800/40 text-zinc-400 border-b border-zinc-800 font-medium">
                    <tr>
                      <th className="py-3 px-4">Title & Details</th>
                      <th className="py-3 px-4">Scheduled Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Outcome</th>
                      <th className="py-3 px-4">Assigned Rep</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {recentFollowups.map((f) => (
                      <tr key={f._id} className="hover:bg-zinc-800/40 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{f.title}</div>
                          {f.description && <div className="text-xs text-zinc-400">{f.description}</div>}
                        </td>
                        <td className="py-3 px-4 text-xs text-zinc-300">
                          {new Date(f.scheduledAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                              f.status === "COMPLETED"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : f.status === "OVERDUE"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                : f.status === "DUE"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            }`}
                          >
                            {f.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {f.outcome ? (
                            <span className="font-medium text-emerald-400">{f.outcome}</span>
                          ) : (
                            <span className="text-zinc-500">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-zinc-400">{f.assignedToId?.name || "Unassigned"}</td>
                        <td className="py-3 px-4 text-right">
                          {f.status !== "COMPLETED" && f.status !== "CANCELLED" && (
                            <button
                              onClick={() => {
                                setSelectedFollowup(f);
                                setShowCompleteFollowupModal(true);
                              }}
                              className="px-3 py-1 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 rounded-lg text-xs font-semibold transition"
                            >
                              Complete Task
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab: Communications */}
        {activeTab === "communications" && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Omnichannel Communication Threads</h3>
                <p className="text-xs text-zinc-400">Emails, WhatsApp messages, and logged calls for this customer</p>
              </div>
              <button
                onClick={() => router.push(`/dashboard/communication`)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
              >
                Open Communication Hub
              </button>
            </div>

            {(!data?.communications?.threads || data.communications.threads.length === 0) ? (
              <div className="p-12 text-center text-zinc-400">
                <p className="text-sm">No communication threads recorded yet.</p>
                <button
                  onClick={() => router.push(`/dashboard/communication`)}
                  className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition"
                >
                  Start Conversation
                </button>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60">
                {data.communications.threads.map((thr) => (
                  <div key={thr._id} className="py-3 flex items-center justify-between hover:bg-zinc-800/30 px-3 rounded-xl transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{thr.subject || 'Conversation Thread'}</span>
                        <span className="text-[10px] font-mono text-zinc-500">{thr.threadNumber}</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                          {thr.primaryChannel}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400">
                        Status: <span className="text-zinc-300 font-medium">{thr.status}</span> • Last Active: {new Date(thr.lastMessageAt || thr.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => router.push(`/dashboard/communication`)}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 transition"
                    >
                      View Thread
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Activity Timeline */}
        {activeTab === "activity" && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
            {activityTimeline.length === 0 ? (
              <p className="text-center text-zinc-500 text-sm py-8">No historical activity events recorded.</p>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-zinc-800">
                {activityTimeline.map((ev) => (
                  <div key={ev._id} className="relative flex items-start gap-4 pl-8">
                    <div className="absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-blue-500 border-4 border-zinc-900 shadow"></div>
                    <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl p-3.5 w-full">
                      <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                        <span className="font-semibold text-blue-400">{ev.actorName || "System User"}</span>
                        <span>{new Date(ev.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm font-medium text-white">{ev.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Opportunity / Lead Modal */}
      {showNewLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white">Create New Lead for {customer.displayName}</h3>
              <button onClick={() => setShowNewLeadModal(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Requirement Overview *</label>
                <input
                  type="text"
                  required
                  value={newLeadForm.requirement}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, requirement: e.target.value })}
                  placeholder="e.g. 5,000 Custom Packaging Boxes"
                  className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Estimated Budget (₹)</label>
                  <input
                    type="number"
                    value={newLeadForm.estimatedBudget}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, estimatedBudget: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Source</label>
                  <select
                    value={newLeadForm.source}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, source: e.target.value })}
                    className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm"
                  >
                    <option value="MANUAL">Manual Inquiry</option>
                    <option value="PHONE_CALL">Phone Call</option>
                    <option value="WEBSITE">Website</option>
                    <option value="REFERRAL">Referral</option>
                    <option value="WALK_IN">Walk In</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowNewLeadModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 text-sm rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl shadow transition"
                >
                  {submitting ? "Saving..." : "Create Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Follow-up Modal */}
      {showCompleteFollowupModal && selectedFollowup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white">Complete Follow-up: {selectedFollowup.title}</h3>
              <button onClick={() => setShowCompleteFollowupModal(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCompleteFollowup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Mandatory Outcome *</label>
                <select
                  value={completeForm.outcome}
                  onChange={(e) => setCompleteForm({ ...completeForm, outcome: e.target.value })}
                  className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm"
                >
                  <option value="INTERESTED">Interested in Solution</option>
                  <option value="QUOTATION_REQUESTED">Quotation Requested</option>
                  <option value="CALLBACK_REQUESTED">Callback Requested</option>
                  <option value="CALL_LATER">Call Later</option>
                  <option value="NO_RESPONSE">No Response / Busy</option>
                  <option value="NOT_INTERESTED">Not Interested</option>
                  <option value="LOST">Lost to Competitor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Outcome Notes</label>
                <textarea
                  rows={3}
                  value={completeForm.outcomeNotes}
                  onChange={(e) => setCompleteForm({ ...completeForm, outcomeNotes: e.target.value })}
                  placeholder="Summary of client discussion..."
                  className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Next Action</label>
                <select
                  value={completeForm.nextAction}
                  onChange={(e) => setCompleteForm({ ...completeForm, nextAction: e.target.value })}
                  className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm"
                >
                  <option value="NONE">None / Closed</option>
                  <option value="SCHEDULE_FOLLOWUP">Schedule Next Follow-up</option>
                </select>
              </div>

              {completeForm.nextAction === "SCHEDULE_FOLLOWUP" && (
                <div className="p-3 bg-zinc-800/60 rounded-xl border border-zinc-700 space-y-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Next Follow-up Title *</label>
                    <input
                      type="text"
                      required
                      value={completeForm.nextFollowup.title}
                      onChange={(e) =>
                        setCompleteForm({
                          ...completeForm,
                          nextFollowup: { ...completeForm.nextFollowup, title: e.target.value },
                        })
                      }
                      placeholder="e.g. Share Paper Sample Booklet"
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Next Scheduled Date *</label>
                    <input
                      type="datetime-local"
                      required
                      value={completeForm.nextFollowup.scheduledAt}
                      onChange={(e) =>
                        setCompleteForm({
                          ...completeForm,
                          nextFollowup: { ...completeForm.nextFollowup, scheduledAt: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCompleteFollowupModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 text-sm rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow transition"
                >
                  {submitting ? "Completing..." : "Save Outcome"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Follow-up Modal */}
      {showNewFollowupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white">Schedule Follow-up</h3>
              <button onClick={() => setShowNewFollowupModal(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateFollowup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newFollowupForm.title}
                  onChange={(e) => setNewFollowupForm({ ...newFollowupForm, title: e.target.value })}
                  placeholder="e.g. Call to finalize paper finish specs"
                  className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Scheduled Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={newFollowupForm.scheduledAt}
                  onChange={(e) => setNewFollowupForm({ ...newFollowupForm, scheduledAt: e.target.value })}
                  className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={newFollowupForm.description}
                  onChange={(e) => setNewFollowupForm({ ...newFollowupForm, description: e.target.value })}
                  placeholder="Specific points to discuss..."
                  className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowNewFollowupModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 text-sm rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow transition"
                >
                  {submitting ? "Scheduling..." : "Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
