"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  Building,
  User,
  Image as ImageIcon,
  Tag,
  AlertTriangle,
  RefreshCw,
  Search,
  ArrowRight,
  ExternalLink,
  Sparkles,
  ChevronRight,
  Filter,
  Check,
  ShieldCheck,
  Eye,
  X,
  Store,
  Calendar,
  Layers,
} from "lucide-react";

export default function LeadInboxPage() {
  const router = useRouter();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, DATA_OPERATOR, TODAY
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Action states
  const [processingId, setProcessingId] = useState(null);
  const [acceptedLead, setAcceptedLead] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [declineModal, setDeclineModal] = useState({ show: false, lead: null, reason: "" });
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  const loadInboxData = useCallback(async () => {
    setLoading(true);
    try {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setCurrentUser(JSON.parse(storedUser));
      } catch (e) {}

      // Fetch pending leads
      const res = await api.get("/leads?acceptanceStatus=PENDING&limit=100&sortBy=createdAt&sortOrder=desc");
      const raw = res?.data;
      const list = Array.isArray(raw) ? raw : raw?.leads || raw?.data || [];
      setLeads(list);

      // Trigger sidebar badge update
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("refresh-inbox-count", { detail: { count: list.length } }));
        }, 0);
      }
    } catch (err) {
      console.error("Failed to load lead inbox:", err);
      showToast("Could not fetch incoming leads", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInboxData();
  }, [loadInboxData]);

  // Handle Accept Lead
  const handleAcceptLead = async (lead) => {
    if (!lead || processingId) return;
    setProcessingId(lead._id);

    try {
      await api.post(`/leads/${lead._id}/accept`, {});
      
      // Update local state
      setLeads((prev) => prev.filter((item) => item._id !== lead._id));
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("refresh-inbox-count", { detail: { count: Math.max(0, leads.length - 1) } }));
          window.dispatchEvent(new CustomEvent("lead-accepted", { detail: { leadId: lead._id } }));
        }, 0);
      }
      setAcceptedLead(lead);

      showToast(`🎉 "${lead.businessName || lead.contactName || "Lead"}" accepted and transferred to My Leads!`, "success");
    } catch (err) {
      console.error("Failed to accept lead:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to accept lead";
      showToast(msg, "error");
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Decline / Reject Lead
  const handleDeclineLead = async () => {
    const lead = declineModal.lead;
    if (!lead) return;
    setProcessingId(lead._id);

    try {
      await api.post(`/leads/${lead._id}/reject`, {
        reason: declineModal.reason.trim() || "Declined from Lead Inbox",
      });

      setLeads((prev) => prev.filter((item) => item._id !== lead._id));
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("refresh-inbox-count", { detail: { count: Math.max(0, leads.length - 1) } }));
          window.dispatchEvent(new CustomEvent("lead-accepted", { detail: { leadId: lead._id } }));
        }, 0);
      }
      setDeclineModal({ show: false, lead: null, reason: "" });

      showToast(`Lead declined.`, "info");
    } catch (err) {
      console.error("Failed to decline lead:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to decline lead";
      showToast(msg, "error");
    } finally {
      setProcessingId(null);
    }
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Source / Tab filter
      if (activeTab === "DATA_OPERATOR" && lead.source !== "DATA_OPERATOR") return false;
      if (activeTab === "TODAY") {
        const leadDate = new Date(lead.createdAt || 0).toDateString();
        const todayDate = new Date().toDateString();
        if (leadDate !== todayDate) return false;
      }

      // Priority filter
      if (priorityFilter !== "ALL" && lead.priority !== priorityFilter) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (lead.businessName || "").toLowerCase().includes(q);
        const matchContact = (lead.contactName || "").toLowerCase().includes(q);
        const matchPhone = (lead.phone || "").includes(q);
        const matchLeadNo = (lead.leadNumber || "").toLowerCase().includes(q);
        const matchZone = (lead.zone || "").toLowerCase().includes(q);
        const matchArea = (lead.areaId?.name || "").toLowerCase().includes(q);
        const matchCat = (lead.businessCategory || "").toLowerCase().includes(q);
        return matchName || matchContact || matchPhone || matchLeadNo || matchZone || matchArea || matchCat;
      }

      return true;
    });
  }, [leads, activeTab, priorityFilter, searchQuery]);

  const dataOperatorCount = useMemo(() => {
    return leads.filter((l) => l.source === "DATA_OPERATOR").length;
  }, [leads]);

  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return leads.filter((l) => new Date(l.createdAt || 0).toDateString() === today).length;
  }, [leads]);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 antialiased overflow-hidden">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border text-sm font-semibold transition-all transform animate-bounce ${
            toast.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : toast.type === "info"
              ? "bg-slate-900 border-slate-700 text-white"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {toast.type === "error" ? (
            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
          ) : toast.type === "info" ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Sidebar */}
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#F95721]/20 via-indigo-500/10 to-transparent pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                      <Inbox className="w-5 h-5" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                        Lead Acceptance Inbox
                        {leads.length > 0 && (
                          <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-xs px-2.5 py-0.5 rounded-full shadow-md shadow-red-500/40 border border-red-400/40 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                            {leads.length} Pending
                          </span>
                        )}
                      </h1>
                      <p className="text-xs text-slate-300 mt-0.5">
                        New leads assigned to you by Data Operators. Review details, photos, and requirements, then accept to transfer them into your active pipeline.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={loadInboxData}
                    disabled={loading}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-all cursor-pointer"
                    title="Refresh Inbox"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-orange-400" : ""}`} />
                    <span>Refresh</span>
                  </button>

                  <Link
                    href="/dashboard/leads"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F95721] hover:bg-[#e84915] text-white text-xs font-semibold shadow-md shadow-orange-600/30 transition-all cursor-pointer"
                  >
                    <span>Go to My Leads</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Success Celebration Alert when a Lead is Accepted */}
            {acceptedLead && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-4 animate-fade-in shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950">
                      Accepted: {acceptedLead.businessName || acceptedLead.contactName || acceptedLead.leadNumber}
                    </h4>
                    <p className="text-xs text-emerald-700">
                      Successfully moved to your active leads source. You can now follow up, call, or create quotations.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/dashboard/leads/${acceptedLead._id}`}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors"
                  >
                    View Lead Details →
                  </Link>
                  <button
                    onClick={() => setAcceptedLead(null)}
                    className="p-1.5 text-emerald-600 hover:text-emerald-900 rounded-lg hover:bg-emerald-100/50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Filter Tabs and Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              {/* Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <button
                  onClick={() => setActiveTab("ALL")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    activeTab === "ALL"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                  }`}
                >
                  All Incoming ({leads.length})
                </button>
                <button
                  onClick={() => setActiveTab("DATA_OPERATOR")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    activeTab === "DATA_OPERATOR"
                      ? "bg-[#F95721] text-white shadow-xs"
                      : "bg-orange-50 text-orange-700 hover:bg-orange-100/80 border border-orange-200"
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  From Data Operator ({dataOperatorCount})
                </button>
                <button
                  onClick={() => setActiveTab("TODAY")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    activeTab === "TODAY"
                      ? "bg-[#F95721] text-white shadow-xs"
                      : "bg-orange-50 text-orange-700 hover:bg-orange-100/80 border border-orange-200"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Assigned Today ({todayCount})
                </button>
              </div>

              {/* Search and Priority Filter */}
              <div className="flex items-center gap-2.5">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search shop, phone, area..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#F95721] transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Priority</option>
                  <option value="URGENT">Urgent</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>

            {/* Leads List / Cards */}
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-[#F95721] animate-spin" />
                <p className="text-sm font-semibold text-slate-500">Checking for incoming assigned leads...</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 bg-orange-50 text-[#F95721] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">Your Inbox is All Caught Up! 🚀</h3>
                  <p className="text-xs text-slate-500">
                    {searchQuery || activeTab !== "ALL" || priorityFilter !== "ALL"
                      ? "No pending leads match your current filter settings."
                      : "No pending leads are waiting for your acceptance right now. When a Data Operator assigns leads to you, they will appear here instantly."}
                  </p>
                </div>
                <div>
                  <Link
                    href="/dashboard/leads"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md"
                  >
                    <span>View Active Leads in My Leads</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredLeads.map((lead) => {
                  const isOperating = processingId === lead._id;
                  const photo =
                    lead.shopImageUrl ||
                    lead.documents?.find((d) => d.category === "PHOTO")?.fileUrl ||
                    "";
                  const contactPerson = lead.contactName || "Owner / Manager";
                  const phoneNum = lead.phone || "";
                  const category = lead.businessCategory || "General Commercial";
                  const areaName = lead.areaId?.name || lead.zone || "Local Market";
                  const leadNo = lead.leadNumber || "NEW-LEAD";

                  return (
                    <div
                      key={lead._id}
                      className="bg-white rounded-2xl border border-slate-200/80 hover:border-orange-400 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                    >
                      {/* Card Header & Photo */}
                      <div>
                        {/* Top Meta Bar */}
                        <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-slate-700">
                            <span className="font-mono text-[#F95721]">{leadNo}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {new Date(lead.createdAt).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              at{" "}
                              {new Date(lead.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {lead.source === "DATA_OPERATOR" ? (
                              <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 font-bold text-[10px] border border-orange-200 flex items-center gap-1">
                                <Store className="w-3 h-3 text-orange-600" />
                                Data Operator
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                                {lead.source || "ASSIGNED"}
                              </span>
                            )}
                            {lead.priority === "URGENT" && (
                              <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px]">
                                Urgent
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Photo Thumbnail if available */}
                        {photo ? (
                          <div className="relative h-44 bg-slate-900 group/img overflow-hidden cursor-pointer" onClick={() => setPreviewPhoto(photo)}>
                            <img
                              src={photo}
                              alt={lead.businessName || "Shop"}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end p-3">
                              <span className="text-[11px] text-white font-semibold flex items-center gap-1 bg-black/40 backdrop-blur-xs px-2 py-1 rounded-md">
                                <Eye className="w-3 h-3" /> Click to enlarge shop photo
                              </span>
                            </div>
                            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" /> Shop Photo
                            </span>
                          </div>
                        ) : null}

                        {/* Business & Contact Details */}
                        <div className="p-4 space-y-3">
                          <div>
                            <h3 className="font-bold text-base text-slate-900 tracking-tight leading-snug group-hover:text-[#F95721] transition-colors">
                              {lead.businessName || "Unnamed Business"}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                              <span className="font-medium text-slate-700 flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400" />
                                {contactPerson}
                              </span>
                              {lead.subCategory && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-slate-500 font-medium truncate max-w-[140px]">
                                    {lead.subCategory}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Quick Info Grid */}
                          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <div className="space-y-0.5">
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                                Category
                              </span>
                              <span className="font-semibold text-slate-800 truncate block">
                                {category}
                              </span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                                Area / Zone
                              </span>
                              <span className="font-semibold text-slate-800 truncate block flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                                {areaName}
                              </span>
                            </div>
                          </div>

                          {/* Operator Remark / Notes if available */}
                          {lead.notes && (
                            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 text-xs text-amber-900 space-y-1">
                              <span className="font-bold text-[10px] uppercase tracking-wider text-amber-700 flex items-center gap-1">
                                <Store className="w-3 h-3" /> Data Operator Note:
                              </span>
                              <p className="line-clamp-2 text-xs text-amber-950 font-medium">
                                {lead.notes}
                              </p>
                            </div>
                          )}

                          {/* Quick Contact Link Pills */}
                          {phoneNum && (
                            <div className="flex items-center gap-2 pt-1">
                              <a
                                href={`tel:${phoneNum}`}
                                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs transition-colors"
                              >
                                <Phone className="w-3.5 h-3.5 text-[#F95721]" />
                                <span>{phoneNum}</span>
                              </a>
                              <a
                                href={`https://wa.me/91${phoneNum.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-colors"
                                title="Chat on WhatsApp"
                              >
                                <MessageSquare className="w-4 h-4 text-emerald-600" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer: ACCEPT & Decline Action Buttons */}
                      <div className="p-4 pt-0 space-y-2">
                        <div className="h-px bg-slate-100 mb-3" />

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAcceptLead(lead)}
                            disabled={isOperating}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer disabled:opacity-50"
                          >
                            {isOperating ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-4 h-4 stroke-[3]" />
                                <span>Accept Lead</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => setDeclineModal({ show: true, lead, reason: "" })}
                            disabled={isOperating}
                            className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-700 font-bold text-xs border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                            title="Decline this lead"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Image Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewPhoto} alt="Shop Full Preview" className="w-full h-auto max-h-[80vh] object-contain rounded-xl" />
          </div>
        </div>
      )}

      {/* Decline Reason Modal */}
      {declineModal.show && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-rose-600 font-bold text-base">
                <AlertTriangle className="w-5 h-5" />
                <span>Decline Lead Assignment</span>
              </div>
              <button
                onClick={() => setDeclineModal({ show: false, lead: null, reason: "" })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to decline{" "}
              <strong className="text-slate-900">
                {declineModal.lead?.businessName || declineModal.lead?.contactName || "this lead"}
              </strong>
              ? It will be removed from your inbox.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Reason for declining (optional):</label>
              <textarea
                value={declineModal.reason}
                onChange={(e) => setDeclineModal((prev) => ({ ...prev, reason: e.target.value }))}
                rows={3}
                placeholder="e.g. Out of my service zone, wrong contact details, etc."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeclineModal({ show: false, lead: null, reason: "" })}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeclineLead}
                disabled={Boolean(processingId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-md shadow-rose-600/30"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
