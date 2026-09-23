import React, { useState, useEffect, useMemo } from "react";
import { API_BASE_URL } from "../../lib/apiConfig";
import { createPortal } from "react-dom";
import {
  Calendar,
  Clock,
  Phone,
  User,
  Plus,
  Search,
  Trash2,
  Edit3,
  Check,
  X,
  Sparkles,
  AlertTriangle,
  PhoneCall,
  Copy,
  CheckCheck,
  RefreshCw,
  ArrowUpDown,
  FileText,
  Tag,
  AlertCircle,
} from "lucide-react";

export default function FollowUpsView({ user }) {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, pending, today, overdue, completed
  const [sortBy, setSortBy] = useState("earliest"); // earliest, latest, name

  // Toast notification
  const [toast, setToast] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    leadName: "",
    phoneNumber: "",
    description: "",
    scheduledAt: "",
    status: "Pending",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      const userId = user?.email || user?.id || user?._id || "";
      const userRole = user?.role || "";
      const response = await fetch(`${API_BASE_URL}/api/followups`, {
        headers: {
          "x-user-id": userId,
          "x-user-role": userRole,
        },
      });
      const data = await response.json();
      if (data.success) {
        setFollowUps(data.followUps || []);
      }
    } catch (error) {
      console.error("Error fetching follow-ups:", error);
      showToast("Failed to load follow-ups", "error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (user) {
      fetchFollowUps();
    }
  }, [user?.id, user?._id, user?.email]);

  // Helper to format ISO string for datetime-local input
  const toDateTimeLocalString = (dateObj) => {
    const d = new Date(dateObj);
    if (isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    // Default to today + 1 hour
    const defaultDate = new Date();
    defaultDate.setHours(defaultDate.getHours() + 1);
    defaultDate.setMinutes(0, 0, 0);

    setFormData({
      leadName: "",
      phoneNumber: "",
      description: "",
      scheduledAt: toDateTimeLocalString(defaultDate),
      status: "Pending",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (followUp) => {
    setEditingId(followUp._id);
    setFormData({
      leadName: followUp.leadName || "",
      phoneNumber: followUp.phoneNumber || "",
      description: followUp.description || "",
      scheduledAt: toDateTimeLocalString(followUp.scheduledAt),
      status: followUp.status || "Pending",
    });
    setIsModalOpen(true);
  };

  const handlePresetSelect = (hoursToAdd, targetHour = null) => {
    const now = new Date();
    if (targetHour !== null) {
      const target = new Date();
      target.setDate(target.getDate() + hoursToAdd / 24);
      target.setHours(targetHour, 0, 0, 0);
      setFormData((prev) => ({
        ...prev,
        scheduledAt: toDateTimeLocalString(target),
      }));
    } else {
      now.setHours(now.getHours() + hoursToAdd);
      setFormData((prev) => ({
        ...prev,
        scheduledAt: toDateTimeLocalString(now),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.leadName.trim() || !formData.scheduledAt) {
      showToast("Lead Name and Scheduled Date/Time are required", "error");
      return;
    }

    try {
      if (editingId) {
        // Update
        const response = await fetch(
          `${API_BASE_URL}/api/followups/${editingId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          },
        );
        const data = await response.json();
        if (data.success) {
          setFollowUps((prev) =>
            prev.map((f) => (f._id === editingId ? data.followUp : f)),
          );
          setIsModalOpen(false);
          showToast("Follow-up updated successfully!");
        } else {
          showToast(data.error || "Failed to update follow-up", "error");
        }
      } else {
        // Create
        const currentUser =
          user ||
          (typeof window !== "undefined"
            ? JSON.parse(localStorage.getItem("user"))
            : null);
        const creatorId = currentUser?.id || currentUser?._id || "";
        const userIdHeader =
          currentUser?.id || currentUser?._id || currentUser?.email || "";
        const payload = {
          ...formData,
          createdBy: currentUser?.name || currentUser?.email || "Agent",
          createdById: creatorId,
        };
        const response = await fetch(`${API_BASE_URL}/api/followups`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userIdHeader,
          },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (data.success) {
          setFollowUps((prev) => [data.followUp, ...prev]);
          setIsModalOpen(false);
          showToast("New follow-up scheduled successfully!");
        } else {
          showToast(data.error || "Failed to create follow-up", "error");
        }
      }
    } catch (error) {
      console.error("Error saving follow-up:", error);
      showToast("Server error while saving follow-up", "error");
    }
  };

  const handleDelete = async (id, leadName) => {
    if (
      window.confirm(
        `Are you sure you want to delete the callback for "${leadName}"?`,
      )
    ) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/followups/${id}`, {
          method: "DELETE",
        });
        const data = await response.json();
        if (data.success) {
          setFollowUps((prev) => prev.filter((f) => f._id !== id));
          showToast("Follow-up deleted");
        }
      } catch (error) {
        console.error("Error deleting follow-up:", error);
        showToast("Failed to delete follow-up", "error");
      }
    }
  };

  const handleStatusToggle = async (followUp) => {
    const newStatus = followUp.status === "Pending" ? "Completed" : "Pending";
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/followups/${followUp._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...followUp, status: newStatus }),
        },
      );
      const data = await response.json();
      if (data.success) {
        setFollowUps((prev) =>
          prev.map((f) => (f._id === followUp._id ? data.followUp : f)),
        );
        showToast(
          newStatus === "Completed"
            ? "Marked as completed! 🎉"
            : "Reopened follow-up",
        );
      }
    } catch (error) {
      console.error("Error updating follow-up status:", error);
      showToast("Failed to update status", "error");
    }
  };

  const handleCopyPhone = (phone) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    showToast(`Copied ${phone} to clipboard`);
  };

  // Filter follow-ups so non-admin employees only see follow-ups created by them
  const userVisibleFollowUps = useMemo(() => {
    if (!user || user.role === "admin") return followUps;
    const uId = String(user.id || user._id || "");
    const uEmail = (user.email || "").toLowerCase();
    const uName = (user.name || "").toLowerCase();

    return followUps.filter((f) => {
      const fCreatedBy = (f.createdBy || "").toLowerCase();
      const fCreatedById = String(f.createdById || "");

      return (
        (uId && fCreatedById === uId) ||
        (uEmail && fCreatedBy.includes(uEmail)) ||
        (uName && fCreatedBy.includes(uName))
      );
    });
  }, [followUps, user]);

  // Metric Stats Calculations
  const stats = useMemo(() => {
    const total = userVisibleFollowUps.length;
    const completed = userVisibleFollowUps.filter(
      (f) => f.status === "Completed",
    ).length;
    const pending = userVisibleFollowUps.filter(
      (f) => f.status === "Pending",
    ).length;

    const now = new Date();
    const todayStr = now.toDateString();

    const dueToday = userVisibleFollowUps.filter((f) => {
      if (f.status === "Completed") return false;
      const d = new Date(f.scheduledAt);
      return d.toDateString() === todayStr;
    }).length;

    const overdue = userVisibleFollowUps.filter((f) => {
      if (f.status === "Completed") return false;
      const d = new Date(f.scheduledAt);
      return d < now && d.toDateString() !== todayStr;
    }).length;

    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, dueToday, overdue, rate };
  }, [userVisibleFollowUps]);

  // Search & Filtered Data
  const filteredFollowUps = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();

    return userVisibleFollowUps
      .filter((f) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const nameMatch = f.leadName?.toLowerCase().includes(q);
          const phoneMatch = f.phoneNumber?.toLowerCase().includes(q);
          const descMatch = f.description?.toLowerCase().includes(q);
          if (!nameMatch && !phoneMatch && !descMatch) return false;
        }

        // Status Filter
        if (statusFilter === "pending") return f.status === "Pending";
        if (statusFilter === "completed") return f.status === "Completed";
        if (statusFilter === "today") {
          if (f.status === "Completed") return false;
          return new Date(f.scheduledAt).toDateString() === todayStr;
        }
        if (statusFilter === "overdue") {
          if (f.status === "Completed") return false;
          const d = new Date(f.scheduledAt);
          return d < now && d.toDateString() !== todayStr;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "earliest")
          return new Date(a.scheduledAt) - new Date(b.scheduledAt);
        if (sortBy === "latest")
          return new Date(b.scheduledAt) - new Date(a.scheduledAt);
        if (sortBy === "name") return a.leadName.localeCompare(b.leadName);
        return 0;
      });
  }, [followUps, searchQuery, statusFilter, sortBy]);

  // Formatters for clean 12-hour AM/PM time
  const formatTimeAMPM = (dateObj) => {
    return dateObj.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateTimeAMPM = (dateObj) => {
    return dateObj.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Helper for human-readable relative time badges
  const getScheduleBadge = (scheduledAtStr, isCompleted) => {
    const scheduledDate = new Date(scheduledAtStr);
    const formattedTime = formatTimeAMPM(scheduledDate);
    const formattedFull = formatDateTimeAMPM(scheduledDate);

    if (isCompleted) {
      return {
        label: "Completed",
        fullTime: formattedFull,
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
        dot: "bg-emerald-500",
        icon: CheckCheck,
      };
    }

    const now = new Date();
    const diffMs = scheduledDate.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 3600));
    const diffDays = Math.round(diffMs / (1000 * 3600 * 24));

    const isToday = scheduledDate.toDateString() === now.toDateString();

    if (diffMs < 0 && !isToday) {
      const overdueDays = Math.abs(diffDays) || 1;
      return {
        label: `Overdue by ${overdueDays}d`,
        fullTime: formattedFull,
        bg: "bg-rose-50 text-rose-700 border-rose-200/80 animate-pulse",
        dot: "bg-rose-500",
        icon: AlertTriangle,
      };
    }

    if (diffMs < 0 && isToday) {
      const overdueHrs = Math.abs(diffHours) || 1;
      return {
        label: `Overdue (${formattedTime})`,
        fullTime: formattedFull,
        bg: "bg-blue-50 text-blue-700 border-blue-200/80",
        dot: "bg-blue-500",
        icon: AlertCircle,
      };
    }

    if (isToday) {
      return {
        label: `Today at ${formattedTime}`,
        fullTime: formattedFull,
        bg: "bg-sky-50 text-sky-700 border-sky-200/80 font-bold",
        dot: "bg-sky-500",
        icon: Clock,
      };
    }

    if (diffDays === 1) {
      return {
        label: `Tomorrow at ${formattedTime}`,
        fullTime: formattedFull,
        bg: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
        dot: "bg-indigo-500",
        icon: Calendar,
      };
    }

    return {
      label: formattedFull,
      fullTime: formattedFull,
      bg: "bg-slate-100 text-slate-700 border-slate-200",
      dot: "bg-slate-400",
      icon: Calendar,
    };
  };

  // Lead initials generator
  const getInitials = (name) => {
    if (!name) return "??";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative pb-10">
      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-9999 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 animate-bounce transition-all ${
            toast.type === "error"
              ? "bg-rose-950/90 text-rose-200 border-rose-800"
              : "bg-slate-900 text-emerald-400 border-slate-700"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          ) : (
            <Sparkles className="w-4 h-4 text-emerald-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Modern Header Banner */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-md shadow-sm flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-sky-50 rounded-full blur-2xl pointer-events-none opacity-60" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 border border-sky-100 text-sky-600 rounded-xl shadow-xs">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Follow-up Callbacks
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage scheduled client outreach, callbacks & follow-up
                reminders
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={fetchFollowUps}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-600 rounded-xl transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin text-sky-500" : ""}`}
            />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Follow-up</span>
          </button>
        </div>
      </div>

      {/* Controls Bar: Search, Category Tabs & Sort */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-md shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 min-w-60">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lead name, phone number, or notes..."
            className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-sky-500 outline-none transition-all"
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

        {/* Quick Category Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 overflow-x-auto">
          {[
            { id: "all", label: "All", count: stats.total },
            { id: "pending", label: "Pending", count: stats.pending },
            { id: "today", label: "Today", count: stats.dueToday },
            { id: "overdue", label: "Overdue", count: stats.overdue },
            { id: "completed", label: "Completed", count: stats.completed },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? "bg-white text-sky-600 shadow-xs border border-slate-200/80"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === tab.id
                    ? "bg-sky-100 text-sky-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="earliest">Soonest First</option>
            <option value="latest">Latest First</option>
            <option value="name">Lead Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Main Grid View of Callbacks */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="bg-white border border-slate-200 rounded-md p-5 shadow-xs animate-pulse flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-24 h-4 bg-slate-200 rounded-md" />
                <div className="w-16 h-4 bg-slate-200 rounded-md" />
              </div>
              <div className="w-3/4 h-5 bg-slate-200 rounded-md" />
              <div className="w-1/2 h-4 bg-slate-100 rounded-md" />
              <div className="w-full h-10 bg-slate-100 rounded-lg mt-2" />
            </div>
          ))}
        </div>
      ) : filteredFollowUps.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-slate-200/80 rounded-md p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 bg-sky-50 text-sky-500 rounded-full flex items-center justify-center border border-sky-100">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-800">
              No follow-ups found
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              {searchQuery || statusFilter !== "all"
                ? "No follow-ups match your active filter criteria. Try clearing search or switching tabs."
                : "You have no scheduled follow-up callbacks yet. Click below to add your first client callback."}
            </p>
          </div>
          {searchQuery || statusFilter !== "all" ? (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="mt-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
            >
              Clear Filters
            </button>
          ) : (
            <button
              onClick={handleOpenAddModal}
              className="mt-2 px-4 py-2 bg-sky-500 text-white rounded-xl text-xs font-bold hover:bg-sky-600 transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Follow-up</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredFollowUps.map((f) => {
            const isCompleted = f.status === "Completed";
            const badge = getScheduleBadge(f.scheduledAt, isCompleted);
            const BadgeIcon = badge.icon;
            const initials = getInitials(f.leadName);

            return (
              <div
                key={f._id}
                className={`bg-white border rounded-md p-5 shadow-xs transition-all duration-200 flex flex-col justify-between gap-4 group ${
                  isCompleted
                    ? "border-emerald-200/60 bg-emerald-50/10 opacity-80"
                    : "border-slate-200/90 hover:border-sky-300 hover:shadow-md"
                }`}
              >
                {/* Card Header & Lead Info */}
                <div>
                  <div className="flex flex-col items-center justify-center gap-3">
                    {/* Lead Avatar & Name */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 shadow-xs border ${
                          isCompleted
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : "bg-sky-600 text-white border-transparent"
                        }`}
                      >
                        {initials}
                      </div>

                      <div>
                        <h3
                          className={`font-bold text-sm leading-snug ${isCompleted ? "text-slate-500 line-through" : "text-slate-900 group-hover:text-sky-600 transition-colors"}`}
                        >
                          {f.leadName}
                        </h3>
                        {f.phoneNumber ? (
                          <div className="flex items-center gap-2 mt-0.5">
                            <a
                              href={`tel:${f.phoneNumber}`}
                              className="text-[11px] font-mono font-medium text-slate-500 hover:text-sky-600 flex items-center gap-1 transition-colors"
                              title="Click to dial"
                            >
                              <Phone className="w-3 h-3 text-sky-500" />
                              <span>{f.phoneNumber}</span>
                            </a>
                            <button
                              onClick={() => handleCopyPhone(f.phoneNumber)}
                              className="text-slate-300 hover:text-slate-600 text-[10px] p-0.5 transition-colors"
                              title="Copy Phone Number"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">
                            No phone number
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Schedule Relative Time Badge */}
                    <div
                      className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 shrink-0 ${badge.bg}`}
                    >
                      <BadgeIcon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </div>
                  </div>

                  {/* Notes / Description */}
                  {f.description ? (
                    <div className="mt-3.5 p-3 bg-slate-50/80 border border-slate-100 rounded-xl text-xs text-slate-600 leading-relaxed font-normal">
                      <p className="line-clamp-3">{f.description}</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400 italic pl-1">
                      No call notes provided.
                    </p>
                  )}

                  {/* Scheduled Date & Time AM/PM Badge */}
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100/80 w-fit">
                    <Calendar className="w-3.5 h-3.5 text-sky-500" />
                    <span>
                      Scheduled:{" "}
                      <strong className="text-slate-700 font-bold">
                        {badge.fullTime}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Card Footer Toolbar Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                  {/* Status Toggle Button */}
                  <button
                    onClick={() => handleStatusToggle(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isCompleted
                        ? "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 shadow-2xs"
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reopen</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-3" />
                        <span>Mark Complete</span>
                      </>
                    )}
                  </button>

                  {/* Secondary Actions: Edit & Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(f)}
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Follow-up"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(f._id, f.leadName)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Follow-up"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Follow-up Modal */}
      {isModalOpen &&
        typeof window !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-9999 flex items-center justify-center p-4">
            <div className="bg-white rounded-md shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scale-up my-auto">
              {/* Modal Header */}
              <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-sky-500/20 border border-sky-400/30 rounded-xl text-sky-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      {editingId
                        ? "Edit Follow-up Callback"
                        : "Schedule Follow-up Callback"}
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      Set reminder details and client info
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                {/* Lead Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Lead Name <span className="text-rose-500">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.leadName}
                    onChange={(e) =>
                      setFormData({ ...formData, leadName: e.target.value })
                    }
                    placeholder="e.g. John Smith or Acme Corp"
                    className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all"
                    required
                  />
                </div>

                {/* Phone Number */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    placeholder="Enter Phone Number"
                    className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all font-mono"
                  />
                </div>

                {/* Scheduled Date & Time + Presets */}
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Scheduled Date & Time{" "}
                        <span className="text-rose-500">*</span>
                      </span>
                    </span>
                  </label>

                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduledAt: e.target.value })
                    }
                    className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all cursor-pointer"
                    required
                  />

                  {/* Quick Date Presets */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Quick Select:
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePresetSelect(1)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all"
                    >
                      +1 Hour
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetSelect(24, 10)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all"
                    >
                      Tomorrow 10 AM
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetSelect(48, 10)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all"
                    >
                      In 2 Days
                    </button>
                  </div>
                </div>

                {/* Status Select */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <span>Status</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 focus:border-sky-500 outline-none transition-all cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                {/* Description / Call Notes */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Callback Notes / Reason</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Add details about the call topic, client requirements, or previous conversation notes..."
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all min-h-22.5"
                  />
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-2.5 mt-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition-all uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                  >
                    <span>
                      {editingId ? "Save Changes" : "Schedule Callback"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
