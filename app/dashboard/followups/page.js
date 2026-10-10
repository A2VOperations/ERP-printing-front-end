"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import {
  Clock,
  Plus,
  PhoneCall,
  MessageSquare,
  Filter,
  Check,
  ChevronDown,
  RefreshCw,
  X,
  Search,
  Users,
  User,
  Shield,
  Sparkles,
  UserCheck,
  Building2,
  Mail,
  Phone,
} from "lucide-react";

const OUTCOME_OPTIONS = [
  { value: "INTERESTED", label: "Client Interested" },
  { value: "QUOTATION_REQUESTED", label: "Quotation Requested" },
  { value: "CALLBACK_REQUESTED", label: "Callback Requested" },
  { value: "CALL_LATER", label: "Call Later" },
  { value: "ORDER_CONFIRMED", label: "Order Confirmed" },
  { value: "NOT_INTERESTED", label: "Not Interested" },
  { value: "NO_RESPONSE", label: "No Response / Unreachable" },
  { value: "BUSY", label: "Line Busy" },
  { value: "LOST", label: "Lost Deal" },
];

export default function FollowupsPage() {
  const router = useRouter();
  const [followups, setFollowups] = useState([]);
  const [selectedFollowup, setSelectedFollowup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);

  // Admin / Staff Filtration States
  const [searchQuery, setSearchQuery] = useState("");
  const [addedByFilter, setAddedByFilter] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("createdById") || params.get("addedById") || "";
    }
    return "";
  });
  const [assignedRepFilter, setAssignedRepFilter] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("assignedToId") || params.get("repId") || "";
    }
    return "";
  });

  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Complete Modal State
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeTargetId, setCompleteTargetId] = useState(null);
  const [completeForm, setCompleteForm] = useState({
    outcome: "",
    outcomeNotes: "",
    nextAction: "NONE",
    nextFollowupTitle: "",
    nextFollowupDate: "",
  });

  // Create Form State
  const [newFollowup, setNewFollowup] = useState(() => ({
    title: "Customer Requirement Follow-up",
    scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    type: "CALL",
    priority: "HIGH",
    notes: "Discuss quotation and give best commercial offer.",
    assignedToId: "",
  }));

  // Role Scoping
  const userRole = useMemo(() => {
    return String(currentUser?.roleSlug || currentUser?.role || "").toLowerCase();
  }, [currentUser]);

  const isManagerOrAdmin = useMemo(() => {
    return [
      "admin",
      "superadmin",
      "manager",
      "sales_manager",
      "general_manager",
      "operations_manager",
    ].includes(userRole);
  }, [userRole]);

  // Derived user lists for filter options
  const salesUsersList = useMemo(() => {
    return (users || []).filter((u) => {
      const r = String(u.roleSlug || u.role || "").toLowerCase();
      return (
        r.includes("sales") ||
        r.includes("rep") ||
        r === "telecaller" ||
        r === "manager"
      );
    });
  }, [users]);

  const creatorUsersList = useMemo(() => {
    return (users || []).filter((u) => {
      const r = String(u.roleSlug || u.role || "").toLowerCase();
      return (
        r.includes("operator") ||
        r.includes("sales") ||
        r.includes("rep") ||
        r.includes("admin") ||
        r.includes("manager")
      );
    });
  }, [users]);

  // Load User & Me metadata
  useEffect(() => {
    Promise.allSettled([
      api.get("/users"),
      api.get("/auth/me"),
    ]).then(([usersRes, meRes]) => {
      if (usersRes.status === "fulfilled" && usersRes.value?.data) {
        const raw = usersRes.value.data;
        const arr = Array.isArray(raw) ? raw : raw?.users || raw?.data || [];
        setUsers(arr);
      }
      if (meRes.status === "fulfilled" && meRes.value?.data) {
        const me = meRes.value.data.user || meRes.value.data;
        setCurrentUser(me);
      }
    });
  }, []);

  const fetchFollowups = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (addedByFilter && !addedByFilter.startsWith("ROLE_")) {
        params.append("createdById", addedByFilter);
      }
      if (assignedRepFilter && assignedRepFilter !== "UNASSIGNED") {
        params.append("assignedToId", assignedRepFilter);
      }
      if (assignedRepFilter === "UNASSIGNED") {
        params.append("unassignedOnly", "true");
      }
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }
      params.append("limit", "100");

      const res = await api.get(`/followups?${params.toString()}`);
      if (res && res.data) {
        const arr = Array.isArray(res.data) ? res.data : res.data.followups || [];
        setFollowups(arr);
        if (arr.length > 0) {
          setSelectedFollowup((prev) => {
            if (!prev) return arr[0];
            const found = arr.find((item) => item._id === prev._id);
            return found || arr[0];
          });
        } else {
          setSelectedFollowup(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch followups:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, addedByFilter, assignedRepFilter, searchQuery]);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        fetchFollowups();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [fetchFollowups]);

  // Client-Side Filtered Follow-ups Engine
  const filteredFollowups = useMemo(() => {
    return followups.filter((item) => {
      // Added By (Creator) Filter
      if (addedByFilter) {
        if (addedByFilter === "ROLE_DATA_OPERATORS") {
          const r = String(item.createdById?.role || "").toLowerCase();
          if (!r.includes("operator")) return false;
        } else if (addedByFilter === "ROLE_SALES") {
          const r = String(item.createdById?.role || "").toLowerCase();
          if (!r.includes("sales") && !r.includes("rep") && r !== "telecaller") return false;
        } else if (addedByFilter === "ROLE_ADMIN") {
          const r = String(item.createdById?.role || "").toLowerCase();
          if (!r.includes("admin") && !r.includes("manager")) return false;
        } else {
          const cId = String(item.createdById?._id || item.createdById?.id || item.createdById || "");
          if (cId !== addedByFilter) return false;
        }
      }

      // Assigned Sales Rep Filter
      if (assignedRepFilter) {
        if (assignedRepFilter === "UNASSIGNED") {
          if (item.assignedToId) return false;
        } else {
          const aId = String(item.assignedToId?._id || item.assignedToId?.id || item.assignedToId || "");
          if (aId !== assignedRepFilter) return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (item.title || "").toLowerCase().includes(q);
        const matchNotes = (item.notes || item.description || "").toLowerCase().includes(q);
        const matchLead = (item.leadId?.contactName || item.leadId?.businessName || "").toLowerCase().includes(q);
        const matchCust = (item.customerId?.displayName || item.customerId?.companyName || "").toLowerCase().includes(q);
        const matchCreator = (item.createdById?.name || "").toLowerCase().includes(q);
        const matchAssignee = (item.assignedToId?.name || "").toLowerCase().includes(q);
        if (!matchTitle && !matchNotes && !matchLead && !matchCust && !matchCreator && !matchAssignee) {
          return false;
        }
      }

      return true;
    });
  }, [followups, addedByFilter, assignedRepFilter, searchQuery]);

  const handleOpenComplete = (id) => {
    setCompleteTargetId(id);
    setCompleteForm({
      outcome: "",
      outcomeNotes: "",
      nextAction: "NONE",
      nextFollowupTitle: "",
      nextFollowupDate: "",
    });
    setShowCompleteModal(true);
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!completeForm.outcome) {
      alert("Please select a valid follow-up outcome.");
      return;
    }

    try {
      const payload = {
        outcome: completeForm.outcome,
        outcomeNotes: completeForm.outcomeNotes || "",
        nextAction: completeForm.nextAction || "NONE",
      };
      if (
        completeForm.nextAction === "SCHEDULE_FOLLOWUP" &&
        completeForm.nextFollowupTitle &&
        completeForm.nextFollowupDate
      ) {
        payload.nextFollowup = {
          title: completeForm.nextFollowupTitle,
          scheduledAt: completeForm.nextFollowupDate,
        };
      }
      await api.post(`/followups/${completeTargetId}/complete`, payload);
      setShowCompleteModal(false);
      fetchFollowups();
    } catch (err) {
      alert(err.message || "Failed to complete follow-up");
    }
  };

  const handleCreateFollowup = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newFollowup };
      if (!payload.assignedToId) delete payload.assignedToId;
      await api.post("/followups", payload);
      setShowAddModal(false);
      fetchFollowups();
    } catch (err) {
      alert(err.message || "Failed to create follow-up");
    }
  };

  const activeFiltersCount = (addedByFilter ? 1 : 0) + (assignedRepFilter ? 1 : 0) + (searchQuery ? 1 : 0);

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#F95721] shadow-2xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                    Follow-ups Manager
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    Schedule calls, client commitments and monitor employee activity
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchFollowups}
                disabled={loading}
                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs transition"
                title="Refresh follow-ups"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin text-[#F95721]" : ""}`}
                />
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F95721] hover:bg-[#e84915] text-white text-xs font-semibold shadow-sm shadow-orange-500/25 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Follow-up
              </button>
            </div>
          </div>

          {/* Admin Exclusive Filtration Strip */}
          {isManagerOrAdmin && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-100">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Admin Team & Origin Filters</span>
                      {activeFiltersCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-orange-100 text-orange-700 text-[10px] font-extrabold">
                          {activeFiltersCount} active
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Filter follow-ups by the employee who created them or the salesperson handling them.
                    </p>
                  </div>
                </div>

                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => {
                      setAddedByFilter("");
                      setAssignedRepFilter("");
                      setSearchQuery("");
                    }}
                    className="self-start md:self-auto inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reset All Filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {/* 1. Added By (Creator) Filter */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Added By (Creator Employee)</span>
                  </label>
                  <div className="relative">
                    <select
                      value={addedByFilter}
                      onChange={(e) => setAddedByFilter(e.target.value)}
                      className="w-full appearance-none bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition cursor-pointer"
                    >
                      <option value="">All Creators & Origins</option>
                      <optgroup label="Filter by Role Groups">
                        <option value="ROLE_DATA_OPERATORS">All Data Operators</option>
                        <option value="ROLE_SALES">All Sales Reps</option>
                        <option value="ROLE_ADMIN">All Admins & Managers</option>
                      </optgroup>
                      <optgroup label="Specific Team Members">
                        {creatorUsersList.map((u) => (
                          <option key={u._id || u.id} value={u._id || u.id}>
                            {u.name} ({u.role || u.roleSlug || "Staff"})
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* 2. Assigned To (Salesperson) Filter */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Assigned Salesperson</span>
                  </label>
                  <div className="relative">
                    <select
                      value={assignedRepFilter}
                      onChange={(e) => setAssignedRepFilter(e.target.value)}
                      className="w-full appearance-none bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition cursor-pointer"
                    >
                      <option value="">All Assigned Reps</option>
                      <option value="UNASSIGNED">Unassigned Follow-ups</option>
                      <optgroup label="Sales Team">
                        {salesUsersList.map((u) => (
                          <option key={u._id || u.id} value={u._id || u.id}>
                            {u.name} ({u.role || u.roleSlug || "Sales"})
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* 3. Search Query Input */}
                <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <span>Search Follow-ups</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Title, notes, lead, customer or employee..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition placeholder:text-slate-400"
                    />
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Follow-up List (5 Cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Follow-up List ({filteredFollowups.length})
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {followups.length !== filteredFollowups.length
                      ? `Filtered from ${followups.length} items`
                      : "All tracked commitments"}
                  </span>
                </div>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-semibold px-2.5 py-1.5 pr-6 rounded-lg focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Status</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="DUE">Due Today</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* List Items */}
              <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
                {filteredFollowups.map((item) => {
                  const isSelected = selectedFollowup?._id === item._id;
                  const dateObj = new Date(item.scheduledAt || "1970-01-01T00:00:00Z");
                  const day = dateObj.getDate();
                  const month = dateObj.toLocaleString("en-US", { month: "short" });
                  const time = dateObj.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={item._id}
                      onClick={() => setSelectedFollowup(item)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? "bg-amber-50/70 border-amber-300 shadow-xs"
                          : "bg-white hover:bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Date Block */}
                        <div
                          className={`w-12 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                            isSelected
                              ? "bg-amber-100/80 border-amber-300 text-amber-900"
                              : "bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        >
                          <span className="text-base font-extrabold leading-none">
                            {day}
                          </span>
                          <span className="text-[9px] font-bold uppercase mt-0.5">
                            {month}
                          </span>
                          <span className="text-[8px] text-slate-400">
                            {dateObj.getFullYear()}
                          </span>
                        </div>

                        <div className="min-w-0 space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400">
                              {time}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {item.title || "Client Follow-up"}
                            </h4>
                          </div>

                          <p className="text-[11px] text-slate-500 truncate leading-tight">
                            {item.notes || item.description || "Follow-up discussion"}
                          </p>

                          {/* Related Customer / Lead */}
                          {(item.leadId || item.customerId) && (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium truncate">
                              <Building2 className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              <span className="truncate">
                                {item.leadId?.contactName ||
                                  item.leadId?.businessName ||
                                  item.customerId?.displayName ||
                                  item.customerId?.companyName ||
                                  "Linked Contact"}
                              </span>
                            </div>
                          )}

                          {/* Origin & Assignee Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                            {item.createdById ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                                <User className="w-2.5 h-2.5 text-slate-400" />
                                <span>Added by:</span>
                                <strong className="text-slate-800">{item.createdById.name}</strong>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md">
                                Direct
                              </span>
                            )}

                            {item.assignedToId && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100">
                                <UserCheck className="w-2.5 h-2.5 text-indigo-500" />
                                <span>Assigned:</span>
                                <strong className="text-indigo-900">{item.assignedToId.name}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            item.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : item.status === "OVERDUE"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {filteredFollowups.length === 0 && !loading && (
                  <div className="p-8 text-center text-slate-400 text-xs space-y-1">
                    <p className="font-semibold text-slate-600">No follow-ups match criteria.</p>
                    <p className="text-[11px]">Try adjusting your search terms or filter selections.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Follow-up Details Card (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {selectedFollowup ? (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600">
                        Follow-up Details
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">
                        {selectedFollowup.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedFollowup.status !== "COMPLETED" && (
                        <button
                          onClick={() => handleOpenComplete(selectedFollowup._id)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs transition cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Mark as Done
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* Instructions & Notes */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Instructions & Notes
                      </span>
                      <p className="text-slate-800 leading-relaxed">
                        {selectedFollowup.notes || selectedFollowup.description || "No specific notes recorded."}
                      </p>
                    </div>

                    {/* Attribution & Stakeholders Card */}
                    <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-50 to-orange-50/30 border border-slate-200/80 space-y-2">
                      <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">
                        Ownership & Origin
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Creator */}
                        <div className="flex items-start gap-2">
                          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Added By (Employee)</span>
                            <span className="font-bold text-slate-900">
                              {selectedFollowup.createdById?.name || "Direct System"}
                            </span>
                            {selectedFollowup.createdById?.role && (
                              <span className="text-[10px] text-slate-500 block">
                                Role: {selectedFollowup.createdById.role}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Assigned Salesperson */}
                        <div className="flex items-start gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                            <UserCheck className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Assigned Salesperson</span>
                            <span className="font-bold text-indigo-950">
                              {selectedFollowup.assignedToId?.name || "Unassigned"}
                            </span>
                            {selectedFollowup.assignedToId?.email && (
                              <span className="text-[10px] text-slate-500 block truncate">
                                {selectedFollowup.assignedToId.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Linked Lead / Customer */}
                    {(selectedFollowup.leadId || selectedFollowup.customerId) && (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Linked Lead / Customer
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                          {selectedFollowup.leadId && (
                            <div>
                              <span className="text-[10px] text-slate-400 block">Lead Name</span>
                              <span className="font-bold text-slate-800">
                                {selectedFollowup.leadId.contactName || selectedFollowup.leadId.businessName || selectedFollowup.leadId.leadNumber}
                              </span>
                              {selectedFollowup.leadId.phone && (
                                <span className="text-[11px] text-slate-500 block">
                                  {selectedFollowup.leadId.phone}
                                </span>
                              )}
                            </div>
                          )}

                          {selectedFollowup.customerId && (
                            <div>
                              <span className="text-[10px] text-slate-400 block">Customer</span>
                              <span className="font-bold text-slate-800">
                                {selectedFollowup.customerId.displayName || selectedFollowup.customerId.companyName}
                              </span>
                              {selectedFollowup.customerId.phone && (
                                <span className="text-[11px] text-slate-500 block">
                                  {selectedFollowup.customerId.phone}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Outcome Notes if completed */}
                    {selectedFollowup.outcome && (
                      <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                          Completed Outcome
                        </span>
                        <p className="font-bold text-emerald-950">
                          {selectedFollowup.outcome}
                        </p>
                        {selectedFollowup.outcomeNotes && (
                          <p className="text-emerald-800 text-[11px]">
                            {selectedFollowup.outcomeNotes}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Schedule Time and Priority */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 block">Scheduled Time</span>
                        <span className="font-semibold text-slate-800">
                          {new Date(selectedFollowup.scheduledAt).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Priority</span>
                        <span className="font-bold text-rose-600">
                          {selectedFollowup.priority || "HIGH"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs text-slate-400 text-xs space-y-2">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-medium text-slate-500">Select a follow-up to view details and mark completion.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Complete Follow-up Modal with Required Outcome Selection */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Complete Follow-up
              </h3>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCompleteSubmit}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Follow-up Outcome *
                </label>
                <select
                  required
                  value={completeForm.outcome}
                  onChange={(e) =>
                    setCompleteForm({
                      ...completeForm,
                      outcome: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#F95721] font-semibold"
                >
                  <option value="">Select Outcome...</option>
                  {OUTCOME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Outcome Notes / Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="Record summary of discussion with client..."
                  value={completeForm.outcomeNotes}
                  onChange={(e) =>
                    setCompleteForm({
                      ...completeForm,
                      outcomeNotes: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#F95721]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/20"
                >
                  Complete Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Add New Follow-up
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateFollowup}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={newFollowup.title}
                  onChange={(e) =>
                    setNewFollowup({ ...newFollowup, title: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#F95721]"
                />
              </div>

              {isManagerOrAdmin && (
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Assign To Salesperson
                  </label>
                  <select
                    value={newFollowup.assignedToId}
                    onChange={(e) =>
                      setNewFollowup({ ...newFollowup, assignedToId: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#F95721]"
                  >
                    <option value="">Self / Default Salesperson</option>
                    {salesUsersList.map((u) => (
                      <option key={u._id || u.id} value={u._id || u.id}>
                        {u.name} ({u.role || u.roleSlug || "Sales"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newFollowup.scheduledAt}
                    onChange={(e) =>
                      setNewFollowup({
                        ...newFollowup,
                        scheduledAt: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#F95721]"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Mode
                  </label>
                  <select
                    value={newFollowup.type}
                    onChange={(e) =>
                      setNewFollowup({ ...newFollowup, type: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#F95721]"
                  >
                    <option value="CALL">Call</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="VISIT">Store Visit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={newFollowup.notes}
                  onChange={(e) =>
                    setNewFollowup({ ...newFollowup, notes: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#F95721]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#F95721] hover:bg-[#e84915] text-white font-semibold shadow-md shadow-orange-500/20"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
