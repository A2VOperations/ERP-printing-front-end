import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Sparkles,
  CheckCircle2,
  User,
  Search,
  Grid,
  List,
  Eye,
  X,
  Phone,
  Mail,
  MapPin,
  ArrowUpDown,
  Building,
  CheckSquare,
  Square,
  UserCheck,
  ShieldCheck,
  Image as ImageIcon,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Building2,
  Calendar,
  Send,
  Loader2,
  History,
  Clock,
  Plus,
  RefreshCw,
} from "lucide-react";

export default function IncomingLeadsView({
  leads = [],
  setLeads,
  user,
  handleAcceptLead,
}) {
  const getCurrentMonthKey = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() =>
    getCurrentMonthKey(),
  );
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
  const [sortBy, setSortBy] = useState("newest"); // 'newest' | 'oldest' | 'name'
  const [quickViewLead, setQuickViewLead] = useState(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [toast, setToast] = useState(null);
  const [imageModal, setImageModal] = useState({
    isOpen: false,
    leadName: "",
    images: [],
    currentIndex: 0,
  });

  const getLeadMonthKey = (lead) => {
    const dateStr = lead.leadDate || lead.createdAt;
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      return `${year}-${month}`;
    }
    if (typeof dateStr === "string" && dateStr.length >= 7) {
      const parts = dateStr.split("-");
      if (parts.length >= 2 && parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, "0")}`;
      }
    }
    return "";
  };

  const formatMonthLabel = (yearMonthStr) => {
    if (!yearMonthStr || yearMonthStr === "All") return "All Months";
    const parts = yearMonthStr.split("-");
    if (parts.length < 2) return yearMonthStr;
    const year = parts[0];
    const month = parts[1];
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthIndex = parseInt(month, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${monthNames[monthIndex]} ${year}`;
    }
    return yearMonthStr;
  };

  const uniqueMonths = useMemo(() => {
    const monthsSet = new Set();
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    monthsSet.add(currentMonthKey);

    leads.forEach((l) => {
      const isUnassigned = !l.handledBy || l.status === "Incoming";
      if (isUnassigned) {
        const key = getLeadMonthKey(l);
        if (key) monthsSet.add(key);
      }
    });

    return Array.from(monthsSet).sort().reverse();
  }, [leads]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  // Filter incoming unassigned leads
  const incomingLeads = useMemo(() => {
    return leads
      .filter((l) => {
        const isUnassigned = !l.handledBy || l.status === "Incoming";
        if (!isUnassigned) return false;

        if (selectedMonth !== "All") {
          const leadMonth = getLeadMonthKey(l);
          if (leadMonth !== selectedMonth) return false;
        }

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          (l.name && l.name.toLowerCase().includes(q)) ||
          (l.businessName && l.businessName.toLowerCase().includes(q)) ||
          (l.phone && l.phone.includes(q)) ||
          (l.email && l.email.toLowerCase().includes(q)) ||
          (l.areaZone && l.areaZone.toLowerCase().includes(q)) ||
          (l.createdBy && l.createdBy.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === "newest")
          return (
            new Date(b.createdAt || b.leadDate || 0) -
            new Date(a.createdAt || a.leadDate || 0)
          );
        if (sortBy === "oldest")
          return (
            new Date(a.createdAt || a.leadDate || 0) -
            new Date(b.createdAt || b.leadDate || 0)
          );
        if (sortBy === "name")
          return (a.name || "").localeCompare(b.name || "");
        return 0;
      });
  }, [leads, searchQuery, selectedMonth, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const totalIncoming = incomingLeads.length;
    const totalSystemLeads = leads.length;
    const myHandled = leads.filter(
      (l) =>
        l.handledBy &&
        user &&
        l.handledBy.toLowerCase() ===
          (user.name || user.email || "").toLowerCase(),
    ).length;
    const totalHandled = leads.filter((l) => l.handledBy).length;

    return {
      totalIncoming,
      totalSystemLeads,
      myHandled,
      totalHandled,
    };
  }, [leads, incomingLeads, user]);

  // Handle single lead acceptance
  const onAccept = async (leadId, leadName) => {
    if (handleAcceptLead) {
      await handleAcceptLead(leadId);
    }
    showToast(`🎉 You are now handling ${leadName || "this lead"}!`);
    if (
      quickViewLead &&
      (quickViewLead.id === leadId || quickViewLead._id === leadId)
    ) {
      setQuickViewLead(null);
    }
  };

  // Handle bulk lead acceptance
  const onAcceptSelected = async () => {
    if (selectedLeadIds.length === 0) return;
    const idsToAccept = [...selectedLeadIds];
    for (const id of idsToAccept) {
      if (handleAcceptLead) {
        await handleAcceptLead(id);
      }
    }
    showToast(`🎉 Successfully accepted ${idsToAccept.length} incoming leads!`);
    setSelectedLeadIds([]);
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.length === incomingLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(incomingLeads.map((l) => l.id || l._id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-9999 px-4 py-3 bg-slate-900 text-emerald-400 border border-slate-700 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#013564] text-white p-3 md:p-5 rounded-3xl shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
          <Sparkles className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Incoming Leads & Assignment Hub
          </h1>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-md flex items-center gap-4 text-white">
            <div className="p-3 bg-white/20 rounded-xl">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-200">
                My Handled
              </div>
              <div className="text-2xl font-black">{stats.myHandled} Leads</div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Bulk Accept, View Switcher & Sort */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-md shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-60">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name, phone, zone, or business..."
            className="w-full h-10 pl-10 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Bulk Action & Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Bulk Accept Button */}
          {selectedLeadIds.length > 0 && (
            <button
              onClick={onAcceptSelected}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 animate-pulse"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Accept Selected ({selectedLeadIds.length})</span>
            </button>
          )}

          {/* Select All Checkbox Button */}
          {incomingLeads.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              {selectedLeadIds.length === incomingLeads.length ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {selectedLeadIds.length === incomingLeads.length
                  ? "Deselect All"
                  : "Select All"}
              </span>
            </button>
          )}

          {/* Month Selector Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="All">All Months</option>
              {uniqueMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Select */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Client Name (A-Z)</option>
            </select>
          </div>

          {/* Grid / Table Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "grid" ? "bg-white text-blue-600 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "table" ? "bg-white text-blue-600 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {incomingLeads.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center flex flex-col items-center gap-3 shadow-xs">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-md">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            No Incoming Leads Pending Acceptance!
          </h3>
          <p className="text-xs text-slate-500 max-w-md">
            {searchQuery
              ? "No incoming unassigned leads match your active search terms. Try clearing your search."
              : "All incoming leads have been accepted and assigned to team members. Great job!"}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-2 px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
            >
              Clear Search Filter
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* GRID CARD VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {incomingLeads.map((lead) => {
            const leadId = lead.id || lead._id;
            const isSelected = selectedLeadIds.includes(leadId);

            return (
              <div
                key={leadId}
                className={`border rounded-md p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 relative group overflow-hidden ${
                  isSelected
                    ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40"
                    : lead.handledBy
                      ? "border-emerald-200/90 bg-linear-to-b from-emerald-50/30 via-white to-white hover:border-emerald-300"
                      : "border-blue-200/90 bg-linear-to-b from-blue-50/30 via-white to-white hover:border-blue-300"
                }`}
              >
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${lead.handledBy ? "bg-emerald-500" : "bg-blue-500 animate-pulse"}`}
                />
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleSelectOne(leadId)}
                      className="text-slate-400 hover:text-blue-600 cursor-pointer pt-0.5"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-blue-500" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300" />
                      )}
                    </button>

                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                        <span>{lead.name}</span>
                      </h3>
                      {lead.businessName && (
                        <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{lead.businessName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shrink-0 border border-blue-200">
                    {/* <UserRoundArrowLeft className="w-3 h-3 text-blue-600 animate-pulse" /> */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-user-round-arrow-left-icon lucide-user-round-arrow-left"
                    >
                      <path d="m19 16-3 3" />
                      <path d="M2 21a8 8 0 0 1 12.664-6.5" />
                      <path d="M22 19h-6l3 3" />
                      <circle cx="10" cy="8" r="5" />
                    </svg>
                    Incoming
                  </span>
                </div>

                {/* Details Body */}
                <div className="flex flex-col gap-2.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone:
                    </span>
                    <span className="font-bold text-slate-800 font-mono">
                      {lead.phone || "-"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> Email:
                    </span>
                    <span className="font-semibold text-slate-700 truncate max-w-40">
                      {lead.email || "-"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> Zone:
                    </span>
                    <span className="font-bold text-slate-800">
                      {lead.areaZone || "General Zone"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <User className="w-3 h-3 text-sky-500" /> Added By:
                    </span>
                    <span className="font-bold text-slate-700">
                      {lead.createdBy || "System / Unspecified"}
                    </span>
                  </div>
                </div>

                {/* Action Buttons Footer */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setQuickViewLead(lead)}
                    className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>Quick View</span>
                  </button>

                  <button
                    onClick={() => onAccept(leadId, lead.name)}
                    className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accept Lead</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white border border-slate-200/80 rounded-md shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 w-10">
                    <button
                      onClick={toggleSelectAll}
                      className="cursor-pointer text-slate-400 hover:text-slate-600"
                    >
                      {selectedLeadIds.length === incomingLeads.length &&
                      incomingLeads.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4">Client Name</th>
                  <th className="py-3.5 px-4">Business</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Area Zone</th>
                  <th className="py-3.5 px-4">Added By</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {incomingLeads.map((lead) => {
                  const leadId = lead.id || lead._id;
                  const isSelected = selectedLeadIds.includes(leadId);

                  return (
                    <tr
                      key={leadId}
                      className={`hover:bg-blue-50/30 transition-colors ${isSelected ? "bg-blue-50/40" : ""}`}
                    >
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => toggleSelectOne(leadId)}
                          className="cursor-pointer text-slate-400 hover:text-blue-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {lead.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {lead.businessName || "-"}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <div>{lead.phone || "-"}</div>
                        <div className="text-[10px] text-slate-400 font-sans">
                          {lead.email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold text-[11px]">
                          {lead.areaZone || "General"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {lead.createdBy || "System"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => setQuickViewLead(lead)}
                            className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            title="Quick View"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                          <button
                            onClick={() => onAccept(leadId, lead.name)}
                            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUICK VIEW DRAWER MODAL */}
      {quickViewLead &&
        createPortal(
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-9999 flex justify-end animate-fade-in">
            <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-left border-l border-slate-200">
              {/* Premium Header */}
              <div className="bg-blue-900 text-white p-6 flex items-start justify-between shadow-md">
                <div className="flex items-center gap-3.5">
                  <div className="w-13 h-13 rounded-md bg-white/20 backdrop-blur-md text-white flex items-center justify-center font-black text-lg shadow-lg border border-white/30 shrink-0">
                    {(quickViewLead.name || "L").substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-white leading-snug tracking-tight">
                      {quickViewLead.name || "Unnamed Client"}
                    </h3>
                    {quickViewLead.businessName ? (
                      <p className="text-xs text-blue-100 font-semibold flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                        <span>{quickViewLead.businessName}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-blue-200 font-medium mt-0.5">
                        Incoming Lead Profile
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setQuickViewLead(null)}
                  className="text-blue-200 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-xl border border-white/20 transition-colors cursor-pointer"
                  title="Close Drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5 text-xs text-slate-700">
                {/* Status & Campaign */}
                <div className="bg-blue-50/90 border border-blue-200/80 p-4 rounded-md flex items-center justify-between shadow-2xs">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                      Status
                    </div>
                    <div className="font-black text-blue-900 text-sm mt-0.5 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
                      <span>Incoming / Unassigned</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-blue-500 text-white font-extrabold rounded-full text-xs shadow-xs">
                    Requires Acceptance
                  </span>
                </div>

                {/* Financial Breakdown */}
                <div className="flex flex-col gap-2">
                  <h4 className="font-bold uppercase text-[10px] tracking-wider text-slate-400">
                    Financial Breakdown
                  </h4>
                  <div className="bg-linear-to-br from-slate-900 to-slate-950 text-white p-4 rounded-md border border-slate-800 shadow-xl flex flex-col gap-3.5">
                    <div className="grid grid-cols-3 gap-2.5 text-center">
                      <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                          Total
                        </span>
                        <span className="text-xs font-mono font-black text-white mt-0.5 block">
                          ₹
                          {(
                            Number(quickViewLead.totalAmount) ||
                            (Number(quickViewLead.paidAmount) || 0) +
                              (Number(quickViewLead.balanceAmount) || 0)
                          ).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
                        <span className="text-[9px] uppercase font-bold text-emerald-400 block tracking-wider">
                          Paid
                        </span>
                        <span className="text-xs font-mono font-black text-emerald-300 mt-0.5 block">
                          ₹
                          {(
                            Number(quickViewLead.paidAmount) || 0
                          ).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-xl">
                        <span className="text-[9px] uppercase font-bold text-blue-400 block tracking-wider">
                          Balance
                        </span>
                        <span className="text-xs font-mono font-black text-blue-300 mt-0.5 block">
                          ₹
                          {(
                            Number(quickViewLead.balanceAmount) || 0
                          ).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {(() => {
                      const paid = Number(quickViewLead.paidAmount) || 0;
                      const bal = Number(quickViewLead.balanceAmount) || 0;
                      const tot =
                        Number(quickViewLead.totalAmount) || paid + bal || 1;
                      const pct = Math.min(100, Math.round((paid / tot) * 100));
                      return (
                        <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800">
                          <div className="flex justify-between text-[10px] font-bold text-slate-300">
                            <span>Payment Received</span>
                            <span className="text-emerald-400 font-mono">
                              {pct}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5">
                            <div
                              className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Contact Details */}
                <div className="flex flex-col gap-2">
                  <h4 className="font-bold uppercase text-[10px] tracking-wider text-slate-400">
                    Contact Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50/80 p-4 rounded-md border border-slate-200/80 shadow-2xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">
                        Phone Number
                      </span>
                      {quickViewLead.phone ? (
                        <a
                          href={`tel:${quickViewLead.phone}`}
                          className="font-bold text-slate-800 font-mono text-xs hover:text-blue-600 transition-colors inline-flex items-center gap-1.5 mt-0.5"
                        >
                          <Phone className="w-3 h-3 text-blue-500" />
                          <span>{quickViewLead.phone}</span>
                        </a>
                      ) : (
                        <span className="font-semibold text-slate-400 text-xs mt-0.5 block">
                          -
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">
                        Email Address
                      </span>
                      {quickViewLead.email ? (
                        <a
                          href={`mailto:${quickViewLead.email}`}
                          className="font-bold text-slate-800 text-xs truncate hover:text-blue-600 transition-colors inline-flex items-center gap-1.5 mt-0.5 max-w-full"
                          title={quickViewLead.email}
                        >
                          <Mail className="w-3 h-3 text-blue-500 shrink-0" />
                          <span className="truncate">
                            {quickViewLead.email}
                          </span>
                        </a>
                      ) : (
                        <span className="font-semibold text-slate-400 text-xs mt-0.5 block">
                          -
                        </span>
                      )}
                    </div>
                    <div className="border-t border-slate-200/60 pt-2.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">
                        Area Zone
                      </span>
                      <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                        {quickViewLead.areaZone || "General"}
                      </span>
                    </div>
                    <div className="border-t border-slate-200/60 pt-2.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">
                        Lead Date
                      </span>
                      <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                        {quickViewLead.leadDate || "-"}
                      </span>
                    </div>
                    <div className="border-t border-slate-200/60 pt-2.5 col-span-full">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">
                        Added By User
                      </span>
                      <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5 mt-0.5">
                        <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>
                          {quickViewLead.createdBy || "System / Unspecified"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Initial Remarks */}
                {(quickViewLead.remark || quickViewLead.remark2) && (
                  <div className="flex flex-col gap-2">
                    <h4 className="font-bold uppercase text-[10px] tracking-wider text-slate-400">
                      Initial Remarks
                    </h4>
                    <div className="bg-blue-50/80 border border-blue-200/80 p-4 rounded-md flex flex-col gap-2 shadow-2xs text-slate-800 font-medium">
                      {quickViewLead.remark && <p>{quickViewLead.remark}</p>}
                      {quickViewLead.remark2 && (
                        <p
                          className={
                            quickViewLead.remark
                              ? "border-t border-blue-200/60 pt-2"
                              : ""
                          }
                        >
                          {quickViewLead.remark2}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Attached Images Gallery */}
                {(() => {
                  const images = (quickViewLead.documents || []).filter(
                    (d) =>
                      d.url &&
                      (/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(d.url) ||
                        /\.(jpg|jpeg|png|webp|gif|svg)/i.test(
                          d.fileName || "",
                        )),
                  );
                  return (
                    <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-200/60">
                      <h4 className="font-bold uppercase text-[10px] tracking-wider text-slate-400 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
                        <span>Attached Images ({images.length})</span>
                      </h4>
                      {images.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {images.map((img, idx) => (
                            <div
                              key={img.public_id || idx}
                              onClick={() =>
                                setImageModal({
                                  isOpen: true,
                                  leadName: quickViewLead.name || "Lead",
                                  images,
                                  currentIndex: idx,
                                })
                              }
                              className="relative h-28 rounded-md overflow-hidden bg-slate-100 border border-slate-200 group cursor-pointer shadow-2xs hover:shadow-md transition-all"
                            >
                              <img
                                src={img.url}
                                alt={img.fileName || `Image ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 p-2 text-center">
                                <Eye className="w-5 h-5 drop-shadow-md" />
                                <span className="text-[10px] font-bold truncate max-w-full px-1">
                                  {img.fileName || "View Full Image"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-md text-center text-slate-400 font-medium text-xs flex flex-col items-center gap-1">
                          <ImageIcon className="w-5 h-5 text-slate-300" />
                          <span>No images attached to this incoming lead.</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Section 7: Activity & Audit History Log */}
                <div className="space-y-3 pt-3 border-t border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-100/70 rounded-lg text-indigo-700">
                        <History className="w-4 h-4" />
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                        Activity & Audit History
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                      {(quickViewLead.history?.length || 0) +
                        (quickViewLead.forwardHistory?.length || 0)}{" "}
                      Entry(s)
                    </span>
                  </div>

                  {(() => {
                    const combinedHistory = [];

                    if (Array.isArray(quickViewLead.history)) {
                      quickViewLead.history.forEach((h) => {
                        combinedHistory.push({
                          id: h._id || Math.random().toString(),
                          type: h.action || "ACTIVITY",
                          title:
                            h.action === "CREATED"
                              ? "Lead Created"
                              : h.action === "FORWARDED"
                                ? "Lead Forwarded"
                                : h.action === "ACCEPTED"
                                  ? "Lead Accepted"
                                  : h.action === "UPDATED"
                                    ? "Profile Updated"
                                    : h.action === "DOCUMENT_UPLOADED"
                                      ? "Document Uploaded"
                                      : h.action === "DOCUMENT_DELETED"
                                        ? "Document Deleted"
                                        : h.action === "SOFT_DELETED"
                                          ? "Moved to Recycle Bin"
                                          : h.action === "RESTORED"
                                            ? "Restored from Recycle Bin"
                                            : "Lead Activity",
                          performedBy: h.performedBy || "System",
                          timestamp: h.timestamp || h.createdAt,
                          details: h.details,
                          changes: h.changes,
                        });
                      });
                    }

                    if (Array.isArray(quickViewLead.forwardHistory)) {
                      quickViewLead.forwardHistory.forEach((fh) => {
                        const isDuplicate = combinedHistory.some(
                          (c) =>
                            c.type === "FORWARDED" &&
                            new Date(c.timestamp).getTime() ===
                              new Date(fh.forwardedAt).getTime(),
                        );
                        if (!isDuplicate) {
                          combinedHistory.push({
                            id: fh._id || Math.random().toString(),
                            type: "FORWARDED",
                            title: `Forwarded to ${fh.forwardedTo || "Employee"}`,
                            performedBy: fh.forwardedBy || "System",
                            timestamp: fh.forwardedAt,
                            details: fh.remark
                              ? `Note: ${fh.remark}`
                              : `Lead responsibility assigned to ${fh.forwardedTo}`,
                            changes: {
                              handledBy: {
                                from: "Previous Owner",
                                to: fh.forwardedTo,
                              },
                            },
                          });
                        }
                      });
                    }

                    if (combinedHistory.length === 0) {
                      combinedHistory.push({
                        id: "created-fallback",
                        type: "CREATED",
                        title: "Lead Created",
                        performedBy: quickViewLead.createdBy || "System",
                        timestamp:
                          quickViewLead.createdAt || quickViewLead.leadDate,
                        details: "Lead created in system",
                      });
                    }

                    combinedHistory.sort(
                      (a, b) =>
                        new Date(b.timestamp || 0) - new Date(a.timestamp || 0),
                    );

                    return (
                      <div className="relative pl-5 space-y-3.5 pt-1 before:absolute before:left-2 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-slate-200">
                        {combinedHistory.map((item, idx) => {
                          const formattedTime = item.timestamp
                            ? new Date(item.timestamp).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })
                            : "Recent";

                          let badgeBg =
                            "bg-slate-100 text-slate-700 border-slate-200";
                          let icon = (
                            <Clock className="w-3 h-3 text-slate-500" />
                          );

                          if (item.type === "FORWARDED") {
                            badgeBg =
                              "bg-indigo-50 text-indigo-700 border-indigo-200";
                            icon = <Send className="w-3 h-3 text-indigo-600" />;
                          } else if (item.type === "CREATED") {
                            badgeBg =
                              "bg-emerald-50 text-emerald-700 border-emerald-200";
                            icon = (
                              <Plus className="w-3 h-3 text-emerald-600" />
                            );
                          } else if (item.type === "ACCEPTED") {
                            badgeBg =
                              "bg-blue-50 text-blue-700 border-blue-200";
                            icon = (
                              <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            );
                          } else if (item.type === "UPDATED") {
                            badgeBg =
                              "bg-purple-50 text-purple-700 border-purple-200";
                            icon = (
                              <RefreshCw className="w-3 h-3 text-purple-600" />
                            );
                          } else if (
                            item.type === "DOCUMENT_UPLOADED" ||
                            item.type === "DOCUMENT_DELETED"
                          ) {
                            badgeBg =
                              "bg-amber-50 text-amber-700 border-amber-200";
                            icon = (
                              <ImageIcon className="w-3 h-3 text-amber-600" />
                            );
                          }

                          return (
                            <div
                              key={item.id || idx}
                              className="relative group"
                            >
                              <div className="absolute -left-5.25 top-1.5 w-3 h-3 rounded-full bg-white border-2 border-indigo-500 group-hover:scale-125 transition-transform" />

                              <div className="bg-slate-50/90 hover:bg-slate-50 border border-slate-200/80 rounded-md p-3 text-xs transition-all shadow-2xs">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span
                                    className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border inline-flex items-center gap-1 ${badgeBg}`}
                                  >
                                    {icon}
                                    <span>{item.title}</span>
                                  </span>
                                  <span className="text-[10px] font-semibold text-slate-400">
                                    {formattedTime}
                                  </span>
                                </div>

                                {item.details && (
                                  <p className="text-slate-600 font-medium text-[11px] mt-1 whitespace-pre-wrap">
                                    {item.details}
                                  </p>
                                )}

                                {item.performedBy && (
                                  <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                                    <span>
                                      Action By:{" "}
                                      <strong className="text-slate-700">
                                        {item.performedBy}
                                      </strong>
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Footer Action */}
              <div className="p-4 bg-white/95 backdrop-blur-md border-t border-slate-200/80 flex items-center justify-end gap-3 shrink-0 shadow-lg">
                <button
                  onClick={() =>
                    onAccept(
                      quickViewLead.id || quickViewLead._id,
                      quickViewLead.name,
                    )
                  }
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept Lead Now</span>
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Full-Screen Image Lightbox Preview Modal */}
      {imageModal.isOpen &&
        createPortal(
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-99999 flex flex-col justify-between animate-fade-in p-4 sm:p-6">
            {/* Top Bar */}
            <div className="flex items-center justify-between text-white border-b border-slate-800/80 pb-4">
              <div>
                <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                  <ImageIcon className="w-4.5 h-4.5 text-purple-400" />
                  <span>{imageModal.leadName} - Gallery</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Image {imageModal.currentIndex + 1} of{" "}
                  {imageModal.images.length} -{" "}
                  {imageModal.images[imageModal.currentIndex]?.fileName ||
                    "Attached Image"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {imageModal.images[imageModal.currentIndex]?.url && (
                  <a
                    href={imageModal.images[imageModal.currentIndex].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700"
                    title="Open original image in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">Open Original</span>
                  </a>
                )}
                <button
                  onClick={() =>
                    setImageModal((prev) => ({ ...prev, isOpen: false }))
                  }
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl cursor-pointer transition-colors border border-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Center Image Display */}
            <div className="flex-1 flex items-center justify-center relative my-4 overflow-hidden">
              {imageModal.images.length > 1 && (
                <button
                  onClick={() =>
                    setImageModal((prev) => ({
                      ...prev,
                      currentIndex:
                        (prev.currentIndex - 1 + prev.images.length) %
                        prev.images.length,
                    }))
                  }
                  className="absolute left-2 sm:left-6 z-10 p-3 bg-slate-900/80 hover:bg-purple-600 text-white rounded-full transition-all shadow-xl cursor-pointer border border-slate-700"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              <img
                src={imageModal.images[imageModal.currentIndex]?.url}
                alt="Lead Preview"
                className="max-h-[75vh] max-w-full object-contain rounded-md shadow-2xl border border-slate-800 animate-scale-up"
              />

              {imageModal.images.length > 1 && (
                <button
                  onClick={() =>
                    setImageModal((prev) => ({
                      ...prev,
                      currentIndex:
                        (prev.currentIndex + 1) % prev.images.length,
                    }))
                  }
                  className="absolute right-2 sm:right-6 z-10 p-3 bg-slate-900/80 hover:bg-purple-600 text-white rounded-full transition-all shadow-xl cursor-pointer border border-slate-700"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Bottom Thumbnail Bar */}
            {imageModal.images.length > 1 && (
              <div className="flex items-center justify-center gap-2 overflow-x-auto py-3 border-t border-slate-800/80">
                {imageModal.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() =>
                      setImageModal((prev) => ({ ...prev, currentIndex: idx }))
                    }
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      imageModal.currentIndex === idx
                        ? "border-purple-500 scale-105 shadow-md shadow-purple-500/30"
                        : "border-slate-700 opacity-50 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt="thumb"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
