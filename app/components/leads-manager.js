"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { API_BASE_URL } from "../../lib/apiConfig";
import { createPortal } from "react-dom";
import {
  User,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Search,
  Filter,
  Plus,
  SlidersHorizontal,
  Download,
  Grid,
  List,
  Trash2,
  RotateCcw,
  Edit3,
  Eye,
  X,
  ChevronDown,
  ArrowUpDown,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Calendar,
  Layers,
  Tag,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Paperclip,
  UploadCloud,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
  History,
  FileText,
  CheckSquare,
  Square,
} from "lucide-react";

// Base Standard Columns requested by user
const BASE_COLUMNS = [
  { key: "leadDate", label: "Lead Date", type: "date" },
  { key: "createdBy", label: "Added By", type: "text" },
  { key: "handledBy", label: "Handled By", type: "text" },
  { key: "areaZone", label: "Area Zone", type: "text" },
  { key: "businessName", label: "Business Name", type: "text" },
  { key: "name", label: "Client Name", type: "text", required: true },
  { key: "address", label: "Address", type: "text" },
  { key: "googleMap", label: "Google Map", type: "url" },
  { key: "website", label: "Website", type: "url" },
  { key: "instagram", label: "Instagram", type: "url" },
  { key: "facebook", label: "Facebook", type: "url" },
  { key: "youtube", label: "YouTube", type: "url" },
  { key: "phone", label: "Phone Number", type: "text", required: true },
  { key: "email", label: "Email", type: "email" },
  { key: "totalAmount", label: "Total Amount", type: "currency" },
  { key: "paidAmount", label: "Paid Amount", type: "currency" },
  { key: "balanceAmount", label: "Balance Amount", type: "currency" },
  { key: "remark", label: "Remark", type: "text" },
  { key: "startCallDate", label: "Start Call Date", type: "date" },
  { key: "lastCallDate", label: "Last Call Date", type: "date" },
  { key: "remark2", label: "Remark 2", type: "text" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: ["New", "Active", "Contacted", "Follow-up", "No Answer"],
  },
  { key: "campaign", label: "Source Campaign", type: "text" },
];

const FORM_STEPS = [
  "general",
  "contact",
  "financials",
  "call",
  "documents",
  "custom",
];

export default function LeadsManager({
  leads = [],
  setLeads,
  user,
  users = [],
  handleAcceptLead,
  handleForwardLead,
  handleForwardBulkLeads,
  initialFilter = "all",
}) {
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [imageModal, setImageModal] = useState({
    isOpen: false,
    leadName: "",
    images: [],
    currentIndex: 0,
  });
  // View mode: 'table' vs 'grid'
  const [viewMode, setViewMode] = useState("grid");

  // Local state for dynamic custom columns
  const [customColumns, setCustomColumns] = useState([]);
  const [isClient, setIsClient] = useState(false);

  const getCurrentMonthKey = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  // Search and filter states
  const [quickFilterTab] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Toast Notification state
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };
  const [selectedMonth, setSelectedMonth] = useState(() =>
    getCurrentMonthKey(),
  );
  const [filters, setFilters] = useState({
    areaZone: "All",
    campaign: "All",
    paymentStatus: "All",
    createdBy: "All",
    handledBy: "All",
    dateFrom: "",
    dateTo: "",
  });
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Recycle Bin (Soft Delete) state & effect
  const [recycledLeads, setRecycledLeads] = useState([]);
  const [loadingRecycled, setLoadingRecycled] = useState(false);

  const fetchRecycledLeads = async () => {
    if (user?.role !== "admin") return;
    setLoadingRecycled(true);
    try {
      const currentUser =
        user ||
        (typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("user"))
          : null);
      const userId =
        currentUser?.id || currentUser?._id || currentUser?.email || "";
      const userRole = currentUser?.role || "";
      const res = await fetch(`${API_BASE_URL}/api/leads/recycled`, {
        headers: {
          "x-user-id": userId,
          "x-user-role": userRole,
        },
      });
      const contentType = res.headers.get("content-type");
      if (
        !res.ok ||
        !contentType ||
        !contentType.includes("application/json")
      ) {
        console.warn(
          "Recycle Bin API returned non-JSON or status:",
          res.status,
        );
        return;
      }
      const data = await res.json();
      if (data.success) {
        setRecycledLeads(data.leads.map((l) => ({ ...l, id: l._id })));
      }
    } catch (err) {
      console.error("Error fetching recycled leads:", err);
    } finally {
      setLoadingRecycled(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchRecycledLeads();
    }
  }, [user]);

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

  // Modal control states
  const [leadModal, setLeadModal] = useState({
    isOpen: false,
    type: "add",
    leadId: null,
  });
  const [columnModal, setColumnModal] = useState({
    isOpen: false,
    mode: "add",
    editingKey: null,
  });
  const [quickViewLead, setQuickViewLead] = useState(null); // Drawer / Quick View state

  // Forward Lead Modal & Multi-Selection state
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [forwardModal, setForwardModal] = useState({
    isOpen: false,
    leadsToForward: [],
    targetUserId: "",
    remark: "",
    isSubmitting: false,
  });

  const handleOpenForwardModal = (leadOrLeads) => {
    const list = Array.isArray(leadOrLeads) ? leadOrLeads : [leadOrLeads];
    if (list.length === 0) return;
    setForwardModal({
      isOpen: true,
      leadsToForward: list,
      targetUserId: "",
      remark: "",
      isSubmitting: false,
    });
  };

  const handleCloseForwardModal = () => {
    setForwardModal({
      isOpen: false,
      leadsToForward: [],
      targetUserId: "",
      remark: "",
      isSubmitting: false,
    });
  };

  const handleConfirmForward = async () => {
    if (!forwardModal.targetUserId) {
      showToast("Please select an employee to forward to.");
      return;
    }
    const targetUser = (users || []).find(
      (u) =>
        String(u._id || u.id || u.email) ===
          String(forwardModal.targetUserId) ||
        (u.email &&
          u.email.toLowerCase() ===
            String(forwardModal.targetUserId).toLowerCase()),
    );
    if (!targetUser) {
      showToast("Selected employee not found.");
      return;
    }

    setForwardModal((prev) => ({ ...prev, isSubmitting: true }));

    if (forwardModal.leadsToForward.length === 1) {
      const targetLead = forwardModal.leadsToForward[0];
      const leadId = targetLead.id || targetLead._id;
      if (handleForwardLead) {
        const res = await handleForwardLead(
          leadId,
          targetUser,
          forwardModal.remark,
        );
        if (res?.success) {
          showToast(
            `🎉 Lead forwarded to ${targetUser.name || targetUser.email}!`,
          );
          setSelectedLeadIds((prev) => prev.filter((id) => id !== leadId));
          if (
            quickViewLead &&
            (quickViewLead.id === leadId || quickViewLead._id === leadId)
          ) {
            setQuickViewLead(
              res.lead || {
                ...quickViewLead,
                handledBy: targetUser.name || targetUser.email,
                handledById: targetUser._id || targetUser.id,
              },
            );
          }
        }
      }
    } else if (forwardModal.leadsToForward.length > 1) {
      const leadIds = forwardModal.leadsToForward.map((l) => l.id || l._id);
      if (handleForwardBulkLeads) {
        const res = await handleForwardBulkLeads(
          leadIds,
          targetUser,
          forwardModal.remark,
        );
        if (res?.success) {
          showToast(
            `🎉 ${leadIds.length} leads forwarded to ${targetUser.name || targetUser.email}!`,
          );
          setSelectedLeadIds([]);
        }
      }
    }

    handleCloseForwardModal();
  };

  const handleToggleSelectLead = (leadId) => {
    setSelectedLeadIds((prev) =>
      prev.includes(leadId)
        ? prev.filter((id) => id !== leadId)
        : [...prev, leadId],
    );
  };

  const handleSelectAllLeads = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.id || l._id));
    }
  };

  // Schedule Follow-Up State & Handlers
  const [scheduleFollowUpModal, setScheduleFollowUpModal] = useState({
    isOpen: false,
    lead: null,
    scheduledAt: "",
    description: "",
    isSubmitting: false,
  });

  const handleOpenScheduleFollowUp = (lead) => {
    const defaultDate = new Date();
    defaultDate.setHours(defaultDate.getHours() + 1);
    defaultDate.setMinutes(0, 0, 0);
    const pad = (n) => String(n).padStart(2, "0");
    const formattedDefault = `${defaultDate.getFullYear()}-${pad(defaultDate.getMonth() + 1)}-${pad(defaultDate.getDate())}T${pad(defaultDate.getHours())}:${pad(defaultDate.getMinutes())}`;

    setScheduleFollowUpModal({
      isOpen: true,
      lead,
      scheduledAt: formattedDefault,
      description: `Follow-up call with ${lead.name || "Client"}`,
      isSubmitting: false,
    });
  };

  const handleCloseScheduleFollowUp = () => {
    setScheduleFollowUpModal({
      isOpen: false,
      lead: null,
      scheduledAt: "",
      description: "",
      isSubmitting: false,
    });
  };

  const handleConfirmScheduleFollowUp = async () => {
    const { lead, scheduledAt, description } = scheduleFollowUpModal;
    if (!lead || !scheduledAt) {
      showToast("Please select a valid date & time.");
      return;
    }

    setScheduleFollowUpModal((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const creatorName = user?.name || user?.email || "Agent";
      const creatorId = user?.id || user?._id || "";
      const payload = {
        leadId: lead.id || lead._id,
        leadName: lead.name,
        phoneNumber: lead.phone || "",
        description: description || `Follow-up call with ${lead.name}`,
        scheduledAt: new Date(scheduledAt).toISOString(),
        status: "Pending",
        createdBy: creatorName,
        createdById: creatorId,
      };

      const response = await fetch(`${API_BASE_URL}/api/followups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || user?._id || user?.email || "",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        showToast(`📅 Follow-up scheduled for ${lead.name}!`);

        const leadId = lead.id || lead._id;
        const formattedDate = new Date(scheduledAt).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

        const historyDetail = `Scheduled follow-up for ${formattedDate}: ${description || "Call client"}`;

        await fetch(`${API_BASE_URL}/api/leads/${leadId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id || user?._id || user?.email || "",
          },
          body: JSON.stringify({
            updatedBy: creatorName,
            user,
            remark: lead.remark
              ? `${lead.remark}\n[Scheduled Follow-up for ${formattedDate}]: ${description}`
              : `[Scheduled Follow-up for ${formattedDate}]: ${description}`,
          }),
        });

        setLeads((prevLeads) =>
          prevLeads.map((l) => {
            if ((l.id || l._id) === leadId) {
              const updatedHistory = l.history ? [...l.history] : [];
              updatedHistory.push({
                action: "FOLLOWUP_SCHEDULED",
                performedBy: creatorName,
                timestamp: new Date(),
                details: historyDetail,
              });
              return { ...l, history: updatedHistory };
            }
            return l;
          }),
        );

        if (
          quickViewLead &&
          (quickViewLead.id === leadId || quickViewLead._id === leadId)
        ) {
          setQuickViewLead((prev) => ({
            ...prev,
            history: [
              ...(prev.history || []),
              {
                action: "FOLLOWUP_SCHEDULED",
                performedBy: creatorName,
                timestamp: new Date(),
                details: historyDetail,
              },
            ],
          }));
        }

        handleCloseScheduleFollowUp();
      } else {
        showToast(data.error || "Failed to schedule follow-up", "error");
        setScheduleFollowUpModal((prev) => ({ ...prev, isSubmitting: false }));
      }
    } catch (err) {
      console.error("Error scheduling follow-up:", err);
      showToast("Could not connect to server", "error");
      setScheduleFollowUpModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Column Visibility state
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState([]);
  const dropdownRef = useRef(null);
  const isSubmitButtonClickedRef = useRef(false);

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Form states
  const [formValues, setFormValues] = useState({});
  const [activeFormTab, setActiveFormTab] = useState("general");

  const currentStepIndex = FORM_STEPS.indexOf(activeFormTab);

  const handleNextStep = () => {
    if (activeFormTab === "general" && !formValues.name?.trim()) {
      alert("Please enter the Client Name before moving to the next step.");
      return;
    }
    if (activeFormTab === "contact" && !formValues.phone?.trim()) {
      alert("Please enter the Phone Number before moving to the next step.");
      return;
    }
    if (currentStepIndex < FORM_STEPS.length - 1) {
      setActiveFormTab(FORM_STEPS[currentStepIndex + 1]);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setActiveFormTab(FORM_STEPS[currentStepIndex - 1]);
    }
  };

  // New/Edit column form states
  const [newColLabel, setNewColLabel] = useState("");
  const [newColType, setNewColType] = useState("text");

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (leadModal.type === "add") {
      const newPending = files.map((file) => ({
        file,
        previewUrl: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
        fileName: file.name,
        uploadedAt: new Date(),
      }));
      setPendingFiles((prev) => [...prev, ...newPending]);
      e.target.value = "";
    } else {
      const targetLeadId =
        leadModal.leadId ||
        formValues.id ||
        formValues._id ||
        quickViewLead?.id ||
        quickViewLead?._id;

      if (!targetLeadId) {
        alert("Cannot determine lead ID for file upload.");
        return;
      }

      for (const file of files) {
        const data = new FormData();
        data.append("document", file);

        setUploadingDoc(true);
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/leads/${targetLeadId}/documents`,
            {
              method: "POST",
              body: data,
            },
          );
          const result = await response.json();
          if (result.success) {
            setFormValues((prev) => ({
              ...prev,
              documents: result.documents,
              leadImage: result.leadImage || prev.leadImage,
            }));
            setLeads((prev) =>
              prev.map((l) => {
                const lId = l.id || l._id;
                return String(lId) === String(targetLeadId)
                  ? {
                      ...l,
                      documents: result.documents,
                      leadImage: result.leadImage || l.leadImage,
                    }
                  : l;
              }),
            );
            if (
              quickViewLead &&
              String(quickViewLead.id || quickViewLead._id) ===
                String(targetLeadId)
            ) {
              setQuickViewLead((prev) =>
                prev
                  ? {
                      ...prev,
                      documents: result.documents,
                      leadImage: result.leadImage || prev.leadImage,
                    }
                  : null,
              );
            }
          } else {
            alert("Upload failed: " + (result.message || "Unknown error"));
          }
        } catch (err) {
          console.error("Error uploading document:", err);
          alert("Error uploading document");
        } finally {
          setUploadingDoc(false);
          e.target.value = "";
        }
      }
    }
  };

  const removePendingFile = (index) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteDocument = async (leadIdOrObj, docObj) => {
    const targetLeadId =
      typeof leadIdOrObj === "string"
        ? leadIdOrObj
        : leadIdOrObj?.id ||
          leadIdOrObj?._id ||
          quickViewLead?.id ||
          quickViewLead?._id;

    if (!targetLeadId) return;
    const identifier = docObj._id || docObj.public_id;
    if (!identifier) return;

    if (
      !window.confirm(
        `Are you sure you want to delete image "${docObj.fileName || "document"}" from Cloudinary?`,
      )
    ) {
      return;
    }

    setUploadingDoc(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/leads/${targetLeadId}/documents/${encodeURIComponent(identifier)}`,
        { method: "DELETE" },
      );
      const data = await response.json();
      if (data.success) {
        if (String(leadModal.leadId) === String(targetLeadId)) {
          setFormValues((prev) => ({
            ...prev,
            documents: data.documents,
            leadImage: data.leadImage,
          }));
        }
        setLeads((prev) =>
          prev.map((l) => {
            const lId = l.id || l._id;
            return String(lId) === String(targetLeadId)
              ? { ...l, documents: data.documents, leadImage: data.leadImage }
              : l;
          }),
        );
        if (
          quickViewLead &&
          String(quickViewLead.id || quickViewLead._id) === String(targetLeadId)
        ) {
          setQuickViewLead((prev) =>
            prev
              ? {
                  ...prev,
                  documents: data.documents,
                  leadImage: data.leadImage,
                }
              : null,
          );
        }
      } else {
        alert("Failed to delete image: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Error deleting image:", err);
      alert("Error deleting image");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleOpenImageModal = (lead) => {
    const docs = lead.documents || [];
    const images = docs.filter(
      (d) =>
        d.url &&
        (/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(d.url) ||
          /\.(jpg|jpeg|png|webp|gif|svg)/i.test(d.fileName || "")),
    );
    if (images.length > 0) {
      setImageModal({
        isOpen: true,
        leadName: lead.name || "Lead",
        images,
        currentIndex: 0,
      });
    } else {
      handleOpenEditLead(lead);
      setActiveFormTab("documents");
    }
  };

  // Load custom columns on client mount
  useEffect(() => {
    setIsClient(true);
    const stored = localStorage.getItem("crm_custom_columns");
    if (stored) {
      try {
        setCustomColumns(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load custom columns", e);
      }
    }
  }, []);

  // Save custom columns when updated
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("crm_custom_columns", JSON.stringify(customColumns));
    }
  }, [customColumns, isClient]);

  // Handle outside click for column visibility dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsColumnDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Combine standard and custom columns
  const allColumns = [...BASE_COLUMNS, ...customColumns];
  const visibleColumns = allColumns.filter(
    (c) => !hiddenColumnKeys.includes(c.key),
  );

  // Role-based visibility helpers
  const isAdmin = user?.role === "admin";
  const isUserHandled = (lead) => {
    if (!user) return false;
    const uId = user.id || user._id;
    const uName = user.name;
    const uEmail = user.email;
    return (
      (uId && String(lead.handledById) === String(uId)) ||
      (uName && lead.handledBy === uName) ||
      (uEmail && lead.handledBy === uEmail)
    );
  };
  const isIncomingLead = (lead) => {
    if (!lead) return false;
    const hasHandler = Boolean(
      (lead.handledBy && lead.handledBy.trim()) ||
      (lead.handledById && String(lead.handledById).trim()),
    );
    const isIncomingStatus =
      String(lead.status || "")
        .trim()
        .toLowerCase() === "incoming";
    return !hasHandler || isIncomingStatus;
  };
  const isVisibleToUser = (lead) => {
    if (isAdmin) return true;
    return isUserHandled(lead);
  };

  const visibleLeads = leads.filter(
    (l) => isVisibleToUser(l) && !isIncomingLead(l),
  );

  // Toggle column visibility
  const toggleColumnVisibility = (key) => {
    setHiddenColumnKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  // Select all or reset column visibility
  const showAllColumns = () => setHiddenColumnKeys([]);

  // Handle Sorting
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (user?.role !== "admin") {
      alert("Only administrators can export leads to CSV.");
      return;
    }
    if (filteredLeads.length === 0) {
      alert("No leads available to export.");
      return;
    }
    const headers = allColumns.map((c) => c.label);
    const rows = filteredLeads.map((lead) => {
      return allColumns
        .map((col) => {
          let val = lead[col.key];
          if (val === undefined || val === null) val = "";
          val = val.toString().replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(",");
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `leads_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Rendering URL Badges cleanly
  const renderUrlBadge = (key, value) => {
    if (!value) return <span className="text-slate-300 font-normal">-</span>;

    const href =
      value.startsWith("http://") || value.startsWith("https://")
        ? value
        : `https://${value}`;

    let styles =
      "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300";
    let Icon = Globe;
    let label = "Link";

    if (key === "googleMap") {
      styles =
        "bg-emerald-50 text-emerald-700 border-emerald-200/70 hover:bg-emerald-100/80";
      Icon = MapPin;
      label = "Map";
    } else if (key === "website") {
      styles = "bg-sky-50 text-sky-700 border-sky-200/70 hover:bg-sky-100/80";
      Icon = Globe;
      label = "Web";
    } else if (key === "instagram") {
      styles =
        "bg-pink-50 text-pink-700 border-pink-200/70 hover:bg-pink-100/80";
      Icon = ExternalLink;
      label = "Insta";
    } else if (key === "facebook") {
      styles =
        "bg-indigo-50 text-indigo-700 border-indigo-200/70 hover:bg-indigo-100/80";
      Icon = ExternalLink;
      label = "FB";
    } else if (key === "youtube") {
      styles =
        "bg-rose-50 text-rose-700 border-rose-200/70 hover:bg-rose-100/80";
      Icon = ExternalLink;
      label = "YT";
    }

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`px-2.5 py-1 rounded-md text-[10px] font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer border shadow-2xs ${styles}`}
      >
        <Icon className="w-3 h-3 shrink-0" />
        <span>{label}</span>
      </a>
    );
  };

  const getStatusDotColor = (status) => {
    switch (status) {
      case "Incoming":
        return "bg-blue-500";
      case "Active":
      case "Accepted":
        return "bg-sky-500";
      case "New":
        return "bg-emerald-500";
      case "Contacted":
      case "In Progress":
        return "bg-indigo-500";
      case "Follow-up":
      case "Follow-up Required":
        return "bg-purple-500";
      case "Interested":
      case "Converted":
        return "bg-green-500";
      case "No Answer":
        return "bg-rose-500";
      case "Recycled":
        return "bg-amber-500";
      default:
        return "bg-slate-400";
    }
  };

  const getLeadCardStyles = (status) => {
    const s = (status || "Incoming").trim();
    switch (s) {
      case "Incoming":
        return {
          topBar: "bg-blue-500",
          border: "border-blue-200/90",
          cardBg: "bg-gradient-to-b from-blue-50/40 via-white to-white",
          glow: "hover:border-blue-400 hover:shadow-blue-500/10",
        };
      case "Active":
      case "Accepted":
        return {
          topBar: "bg-sky-500",
          border: "border-sky-200/90",
          cardBg: "bg-gradient-to-b from-sky-50/40 via-white to-white",
          glow: "hover:border-sky-400 hover:shadow-sky-500/10",
        };
      case "New":
        return {
          topBar: "bg-emerald-500",
          border: "border-emerald-200/90",
          cardBg: "bg-gradient-to-b from-emerald-50/40 via-white to-white",
          glow: "hover:border-emerald-400 hover:shadow-emerald-500/10",
        };
      case "Contacted":
        return {
          topBar: "bg-indigo-500",
          border: "border-indigo-200/90",
          cardBg: "bg-gradient-to-b from-indigo-50/40 via-white to-white",
          glow: "hover:border-indigo-400 hover:shadow-indigo-500/10",
        };
      case "In Progress":
        return {
          topBar: "bg-cyan-500",
          border: "border-cyan-200/90",
          cardBg: "bg-gradient-to-b from-cyan-50/40 via-white to-white",
          glow: "hover:border-cyan-400 hover:shadow-cyan-500/10",
        };
      case "Follow-up":
      case "Follow-up Required":
        return {
          topBar: "bg-purple-500",
          border: "border-purple-200/90",
          cardBg: "bg-gradient-to-b from-purple-50/40 via-white to-white",
          glow: "hover:border-purple-400 hover:shadow-purple-500/10",
        };
      case "Interested":
      case "Converted":
        return {
          topBar: "bg-green-500",
          border: "border-green-200/90",
          cardBg: "bg-gradient-to-b from-green-50/40 via-white to-white",
          glow: "hover:border-green-400 hover:shadow-green-500/10",
        };
      case "No Answer":
        return {
          topBar: "bg-rose-500",
          border: "border-rose-200/90",
          cardBg: "bg-gradient-to-b from-rose-50/40 via-white to-white",
          glow: "hover:border-rose-400 hover:shadow-rose-500/10",
        };
      case "Recycled":
        return {
          topBar: "bg-amber-500",
          border: "border-amber-200/90",
          cardBg: "bg-gradient-to-b from-amber-50/40 via-white to-white",
          glow: "hover:border-amber-400 hover:shadow-amber-500/10",
        };
      default:
        return {
          topBar: "bg-slate-400",
          border: "border-slate-200",
          cardBg: "bg-white",
          glow: "hover:border-slate-300",
        };
    }
  };

  // Rendering Status Badges with visual status lead indication
  const renderStatusBadge = (status) => {
    let styles = "bg-slate-100 text-slate-700 border-slate-200/80";
    let dotColor = "bg-slate-400";
    let Icon = Sparkles;

    const normalized = (status || "Incoming").trim();

    if (normalized === "Incoming") {
      styles =
        "bg-blue-50 text-blue-700 border-blue-200/80 ring-1 ring-blue-500/10";
      dotColor = "bg-blue-500 animate-pulse";
      Icon = Sparkles;
    } else if (normalized === "Active" || normalized === "Accepted") {
      styles =
        "bg-sky-50 text-sky-700 border-sky-200/70 ring-1 ring-sky-500/10";
      dotColor = "bg-sky-500";
      Icon = CheckCircle2;
    } else if (normalized === "Contacted") {
      styles =
        "bg-indigo-50 text-indigo-700 border-indigo-200/70 ring-1 ring-indigo-500/10";
      dotColor = "bg-indigo-500";
      Icon = Clock;
    } else if (normalized === "In Progress") {
      styles =
        "bg-cyan-50 text-cyan-700 border-cyan-200/70 ring-1 ring-cyan-500/10";
      dotColor = "bg-cyan-500";
      Icon = Clock;
    } else if (normalized === "New") {
      styles =
        "bg-emerald-50 text-emerald-700 border-emerald-200/70 ring-1 ring-emerald-500/10";
      dotColor = "bg-emerald-500";
      Icon = Sparkles;
    } else if (
      normalized === "Follow-up Required" ||
      normalized === "Follow-up"
    ) {
      styles =
        "bg-purple-50 text-purple-700 border-purple-200/70 ring-1 ring-purple-500/10";
      dotColor = "bg-purple-500";
      Icon = AlertCircle;
    } else if (normalized === "Interested" || normalized === "Converted") {
      styles =
        "bg-green-50 text-green-700 border-green-200/70 ring-1 ring-green-500/10";
      dotColor = "bg-green-500";
      Icon = CheckCircle2;
    } else if (normalized === "Not Interested" || normalized === "Closed") {
      styles =
        "bg-slate-100 text-slate-600 border-slate-200/70 ring-1 ring-slate-500/10";
      dotColor = "bg-slate-400";
      Icon = XCircle;
    } else if (normalized === "No Answer") {
      styles =
        "bg-rose-50 text-rose-700 border-rose-200/70 ring-1 ring-rose-500/10";
      dotColor = "bg-rose-500";
      Icon = XCircle;
    } else if (normalized === "Recycled") {
      styles =
        "bg-amber-50 text-amber-700 border-amber-200/70 ring-1 ring-amber-500/10";
      dotColor = "bg-amber-500";
      Icon = AlertCircle;
    }

    const displayStatus =
      normalized === "Follow-up Required" ? "Follow-up" : normalized;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${styles}`}
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
        <Icon className="w-3 h-3 shrink-0" />
        <span>{displayStatus}</span>
      </span>
    );
  };

  // Cell rendering router based on key/type
  const renderCellContent = (col, lead) => {
    const val = lead[col.key];

    if (col.key === "name") {
      return (
        <div className="flex items-center gap-3 min-w-42.5">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
              {(val || "L").substring(0, 2).toUpperCase()}
            </div>
            <span
              className={`w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5 border-2 border-white ${getStatusDotColor(lead.status)}`}
              title={`Lead Status: ${lead.status || "Incoming"}`}
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span
              className="font-bold text-slate-800 text-xs truncate hover:text-sky-600 transition-colors cursor-pointer"
              onClick={() => setQuickViewLead(lead)}
            >
              {val || "Unnamed Client"}
            </span>
            {lead.businessName && (
              <span className="text-[10px] text-slate-400 font-semibold truncate flex items-center gap-1">
                <Building2 className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                {lead.businessName}
              </span>
            )}
          </div>
        </div>
      );
    }

    if (col.type === "url") {
      return renderUrlBadge(col.key, val);
    }

    if (col.key === "status") {
      return renderStatusBadge(val);
    }

    if (col.key === "email") {
      return val ? (
        <a
          href={`mailto:${val}`}
          className="inline-flex items-center gap-1.5 text-slate-700 hover:text-sky-600 font-medium text-xs transition-colors"
        >
          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{val}</span>
        </a>
      ) : (
        <span className="text-slate-300 font-normal">-</span>
      );
    }

    if (col.key === "phone") {
      return val ? (
        <a
          href={`tel:${val}`}
          className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-700 font-semibold"
        >
          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{val}</span>
        </a>
      ) : (
        <span className="text-slate-300 font-normal">-</span>
      );
    }

    if (col.key === "createdBy") {
      return val ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/70">
          <User className="w-3 h-3 text-sky-500 shrink-0" />
          <span>{val}</span>
        </span>
      ) : (
        <span className="text-slate-400 font-normal italic text-[11px]">
          System / Unspecified
        </span>
      );
    }

    if (col.key === "handledBy") {
      return val ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
          <span>{val}</span>
        </span>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (handleAcceptLead) handleAcceptLead(lead.id || lead._id);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Accept Lead</span>
        </button>
      );
    }

    if (col.type === "date") {
      return val ? (
        <span className="inline-flex items-center gap-1 text-slate-600 text-xs font-medium">
          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
          {val}
        </span>
      ) : (
        <span className="text-slate-300 font-normal">-</span>
      );
    }

    if (
      col.type === "currency" ||
      col.key === "paidAmount" ||
      col.key === "balanceAmount" ||
      col.key === "totalAmount"
    ) {
      const num =
        val !== undefined && val !== null && val !== "" ? Number(val) : null;
      if (num === null || isNaN(num))
        return <span className="text-slate-300 font-normal">-</span>;

      if (col.key === "paidAmount") {
        return (
          <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
            ₹{num.toLocaleString("en-IN")}
          </span>
        );
      }

      if (col.key === "balanceAmount") {
        const isPending = num > 0;
        return (
          <span
            className={`inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded-md border ${
              isPending
                ? "text-blue-700 bg-blue-50 border-blue-200/70"
                : "text-slate-600 bg-slate-100 border-slate-200"
            }`}
          >
            ₹{num.toLocaleString("en-IN")}
          </span>
        );
      }

      return (
        <span className="font-mono text-xs font-bold text-slate-800">
          ₹{num.toLocaleString("en-IN")}
        </span>
      );
    }

    return val !== undefined && val !== "" ? (
      <span
        className="text-slate-700 font-medium text-xs block max-w-55 truncate"
        title={val.toString()}
      >
        {val.toString()}
      </span>
    ) : (
      <span className="text-slate-300 font-normal">-</span>
    );
  };

  // Modal open handlers
  const handleOpenAddLead = () => {
    const currentUser =
      user ||
      (typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("user"))
        : null);
    setFormValues({
      status: "Incoming",
      campaign: "Direct Outreach",
      progress: 10,
      leadDate: new Date().toISOString().split("T")[0],
      createdBy: currentUser?.name || currentUser?.email || "",
      handledBy: "",
      handledById: "",
      totalAmount: "",
      paidAmount: "",
      balanceAmount: "",
    });
    setPendingFiles([]);
    setLeadModal({ isOpen: true, type: "add", leadId: null });
    setActiveFormTab("general");
  };

  const handleOpenEditLead = (lead) => {
    const targetId = lead.id || lead._id;
    setFormValues({ ...lead, id: targetId });
    setLeadModal({ isOpen: true, type: "edit", leadId: targetId });
    setActiveFormTab("general");
  };

  // Soft Delete lead handler (moves to Recycle Bin)
  const handleDeleteLead = async (id, name) => {
    if (
      window.confirm(
        `Are you sure you want to delete lead: "${name}"? It will be moved to the Recycle Bin.`,
      )
    ) {
      try {
        const currentUser =
          user ||
          (typeof window !== "undefined"
            ? JSON.parse(localStorage.getItem("user"))
            : null);
        const userId =
          currentUser?.id || currentUser?._id || currentUser?.email || "";
        const response = await fetch(`${API_BASE_URL}/api/leads/${id}`, {
          method: "DELETE",
          headers: { "x-user-id": userId },
        });
        const data = await response.json();
        if (data.success) {
          setLeads((prev) => prev.filter((l) => (l.id || l._id) !== id));
          if (quickViewLead?.id === id || quickViewLead?._id === id)
            setQuickViewLead(null);
          if (user?.role === "admin") fetchRecycledLeads();
        } else {
          alert("Failed to delete lead: " + (data.error || "Unknown error"));
        }
      } catch (err) {
        console.error("Error deleting lead:", err);
        alert("Error deleting lead");
      }
    }
  };

  // Restore lead handler (Admin only)
  const handleRestoreLead = async (id, name) => {
    try {
      const currentUser =
        user ||
        (typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("user"))
          : null);
      const userId =
        currentUser?.id || currentUser?._id || currentUser?.email || "";
      const res = await fetch(`${API_BASE_URL}/api/leads/${id}/restore`, {
        method: "PUT",
        headers: { "x-user-id": userId },
      });
      const contentType = res.headers.get("content-type");
      if (
        !res.ok ||
        !contentType ||
        !contentType.includes("application/json")
      ) {
        alert(
          "Server returned error or invalid response. Status: " + res.status,
        );
        return;
      }
      const data = await res.json();
      if (data.success) {
        setRecycledLeads((prev) => prev.filter((l) => (l.id || l._id) !== id));
        if (data.lead) {
          const restored = { ...data.lead, id: data.lead._id };
          setLeads((prev) => [
            restored,
            ...prev.filter((l) => (l.id || l._id) !== id),
          ]);
        }
      } else {
        alert("Failed to restore lead: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error restoring lead:", err);
      alert("Error restoring lead");
    }
  };

  // Permanent Delete lead handler (Admin only)
  const handlePermanentDeleteLead = async (id, name) => {
    if (
      window.confirm(
        `PERMANENT DELETE WARNING: Are you sure you want to permanently delete lead "${name}"? This action CANNOT be undone and attached files will be deleted from Cloudinary.`,
      )
    ) {
      try {
        const currentUser =
          user ||
          (typeof window !== "undefined"
            ? JSON.parse(localStorage.getItem("user"))
            : null);
        const userId =
          currentUser?.id || currentUser?._id || currentUser?.email || "";
        const res = await fetch(`${API_BASE_URL}/api/leads/${id}/permanent`, {
          method: "DELETE",
          headers: { "x-user-id": userId },
        });
        const contentType = res.headers.get("content-type");
        if (
          !res.ok ||
          !contentType ||
          !contentType.includes("application/json")
        ) {
          alert(
            "Server returned error or invalid response. Status: " + res.status,
          );
          return;
        }
        const data = await res.json();
        if (data.success) {
          setRecycledLeads((prev) =>
            prev.filter((l) => (l.id || l._id) !== id),
          );
        } else {
          alert(
            "Failed to permanently delete lead: " +
              (data.error || "Unknown error"),
          );
        }
      } catch (err) {
        console.error("Error permanently deleting lead:", err);
        alert("Error permanently deleting lead");
      }
    }
  };

  // Form Submission
  const handleLeadFormSubmit = async (e) => {
    e.preventDefault();

    // Strict guard: Lead will ONLY submit if user explicitly clicks the submit button
    if (!isSubmitButtonClickedRef.current) {
      return;
    }
    // Reset flag immediately
    isSubmitButtonClickedRef.current = false;

    // Guard: If form submission is triggered while not on the final step, advance to next step instead
    if (currentStepIndex < FORM_STEPS.length - 1) {
      handleNextStep();
      return;
    }

    if (isSubmitting) return;

    if (!formValues.name?.trim() || !formValues.phone?.trim()) {
      alert("Client Name and Phone Number are required fields.");
      return;
    }

    setIsSubmitting(true);

    const currentUser =
      user ||
      (typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("user"))
        : null);

    const progressVal =
      formValues.status === "Active"
        ? 80
        : formValues.status === "Contacted"
          ? 45
          : formValues.status === "Follow-up Required" ||
              formValues.status === "Follow-up"
            ? 60
            : formValues.status === "No Answer"
              ? 0
              : 10;

    const payload = {
      ...formValues,
      email: formValues.email || "",
      totalAmount:
        formValues.totalAmount !== "" ? Number(formValues.totalAmount) : 0,
      paidAmount:
        formValues.paidAmount !== "" ? Number(formValues.paidAmount) : 0,
      balanceAmount:
        formValues.balanceAmount !== "" ? Number(formValues.balanceAmount) : 0,
      progress: progressVal,
    };

    if (leadModal.type === "add") {
      payload.createdBy = currentUser?.name || currentUser?.email || "Admin";
    }

    try {
      if (leadModal.type === "add") {
        const response = await fetch(`${API_BASE_URL}/api/leads`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (data.success) {
          let createdLead = { ...data.lead, id: data.lead._id };

          // Upload pending files if any were attached during creation
          if (pendingFiles.length > 0) {
            setUploadingDoc(true);
            let updatedDocs = createdLead.documents || [];
            let uploadFailed = false;

            const targetId =
              createdLead.id ||
              createdLead._id ||
              data.lead?._id ||
              data.lead?.id;
            for (const item of pendingFiles) {
              const fileData = new FormData();
              fileData.append("document", item.file);
              try {
                const docRes = await fetch(
                  `${API_BASE_URL}/api/leads/${targetId}/documents`,
                  {
                    method: "POST",
                    body: fileData,
                  },
                );
                const docData = await docRes.json();
                if (docData.success) {
                  updatedDocs = docData.documents || updatedDocs;
                  if (docData.leadImage) {
                    createdLead.leadImage = docData.leadImage;
                  } else if (docData.lead?.leadImage) {
                    createdLead.leadImage = docData.lead.leadImage;
                  }
                } else {
                  uploadFailed = true;
                  console.error(
                    "Error uploading pending file:",
                    docData.message,
                  );
                }
              } catch (err) {
                uploadFailed = true;
                console.error("Error uploading pending file:", err);
              }
            }
            createdLead = { ...createdLead, documents: updatedDocs };
            setUploadingDoc(false);

            if (uploadFailed) {
              alert(
                "Lead created, but one or more attached images failed to upload. You can re-upload them from Documents tab.",
              );
            }
          }

          setLeads((prev) => [createdLead, ...prev]);
          setPendingFiles([]);
        } else {
          alert("Failed to add lead: " + (data.error || "Unknown error"));
          setIsSubmitting(false);
          return;
        }
      } else {
        const response = await fetch(
          `${API_BASE_URL}/api/leads/${leadModal.leadId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        const data = await response.json();
        if (data.success) {
          const updatedLead = { ...data.lead, id: data.lead._id };
          setLeads((prev) =>
            prev.map((l) => (l.id === leadModal.leadId ? updatedLead : l)),
          );
          if (quickViewLead?.id === leadModal.leadId)
            setQuickViewLead(updatedLead);
        } else {
          alert("Failed to update lead: " + (data.error || "Unknown error"));
          setIsSubmitting(false);
          return;
        }
      }

      setLeadModal({ isOpen: false, type: "add", leadId: null });
      setFormValues({});
      setActiveFormTab("general");
    } catch (err) {
      console.error("Error saving lead:", err);
      alert("Error saving lead. Is the backend running?");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Custom Column Management Handlers (Add / Edit / Delete)
  const handleOpenAddColumn = () => {
    setNewColLabel("");
    setNewColType("text");
    setColumnModal({ isOpen: true, mode: "add", editingKey: null });
  };

  const handleOpenEditColumn = (col) => {
    setNewColLabel(col.label);
    setNewColType(col.type);
    setColumnModal({ isOpen: true, mode: "edit", editingKey: col.key });
  };

  const handleSaveColumnSubmit = (e) => {
    e.preventDefault();
    if (!newColLabel.trim()) return;

    if (columnModal.mode === "edit" && columnModal.editingKey) {
      setCustomColumns((prev) =>
        prev.map((c) =>
          c.key === columnModal.editingKey
            ? { ...c, label: newColLabel.trim(), type: newColType }
            : c,
        ),
      );
    } else {
      const key = "custom_" + Date.now();
      const newCol = {
        key,
        label: newColLabel.trim(),
        type: newColType,
        isCustom: true,
      };
      setCustomColumns((prev) => [...prev, newCol]);
    }

    setNewColLabel("");
    setNewColType("text");
    setColumnModal({ isOpen: false, mode: "add", editingKey: null });
  };

  const handleDeleteColumn = (key, label) => {
    if (
      window.confirm(
        `Delete custom column "${label}"? This will hide the column data.`,
      )
    ) {
      setCustomColumns((prev) => prev.filter((c) => c.key !== key));
      setHiddenColumnKeys((prev) => prev.filter((k) => k !== key));
    }
  };

  // Dynamic filter options derived from leads dataset (Case-Insensitive Normalization)
  const getNormalizedUniqueList = (arr) => {
    const map = {};
    arr.filter(Boolean).forEach((item) => {
      const trimmed = String(item).trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      if (!map[key]) {
        const formatted =
          trimmed === trimmed.toLowerCase()
            ? trimmed.replace(/\b\w/g, (c) => c.toUpperCase())
            : trimmed;
        map[key] = formatted;
      }
    });
    return Object.values(map).sort((a, b) => a.localeCompare(b));
  };

  const uniqueAreaZones = getNormalizedUniqueList(
    visibleLeads.map((l) => l.areaZone),
  );
  const uniqueCampaigns = getNormalizedUniqueList(
    visibleLeads.map((l) => l.campaign),
  );
  const uniqueHandlers = getNormalizedUniqueList(
    visibleLeads.map((l) => l.handledBy),
  );

  const uniqueMonths = useMemo(() => {
    const monthsSet = new Set();
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    monthsSet.add(currentMonthKey);

    visibleLeads.forEach((l) => {
      const key = getLeadMonthKey(l);
      if (key) monthsSet.add(key);
    });

    return Array.from(monthsSet).sort().reverse();
  }, [visibleLeads]);

  const activeFiltersCount =
    (statusFilter !== "All" ? 1 : 0) +
    (filters.areaZone !== "All" ? 1 : 0) +
    (filters.campaign !== "All" ? 1 : 0) +
    (filters.paymentStatus !== "All" ? 1 : 0) +
    (filters.createdBy !== "All" ? 1 : 0) +
    (filters.handledBy !== "All" ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);

  const resetAllFilters = () => {
    setStatusFilter("All");
    setSelectedMonth("All");
    setFilters({
      areaZone: "All",
      campaign: "All",
      paymentStatus: "All",
      createdBy: "All",
      handledBy: "All",
      dateFrom: "",
      dateTo: "",
    });
  };

  // Filter and search logic
  let filteredLeads = leads.filter((lead) => {
    // Exclude incoming leads from main Leads Management section
    if (isIncomingLead(lead)) {
      return false;
    }

    // Role-based security check: employees can only see own handled leads
    if (!isVisibleToUser(lead)) {
      return false;
    }

    // Quick filter tab criteria
    if (quickFilterTab === "incoming" && lead.handledBy) {
      return false;
    }
    if (quickFilterTab === "my-handled" && !isUserHandled(lead)) {
      return false;
    }

    const query = searchQuery.toLowerCase();
    const nameMatch = lead.name?.toLowerCase().includes(query);
    const emailMatch = lead.email?.toLowerCase().includes(query);
    const phoneMatch = lead.phone?.toLowerCase().includes(query);
    const bizMatch = lead.businessName?.toLowerCase().includes(query);
    const zoneMatch = lead.areaZone?.toLowerCase().includes(query);
    const campaignMatch = lead.campaign?.toLowerCase().includes(query);
    const createdByMatch = lead.createdBy?.toLowerCase().includes(query);
    const handledByMatch = lead.handledBy?.toLowerCase().includes(query);

    const matchesSearch =
      !query ||
      nameMatch ||
      emailMatch ||
      phoneMatch ||
      bizMatch ||
      zoneMatch ||
      campaignMatch ||
      createdByMatch ||
      handledByMatch;
    const matchesStatus =
      statusFilter === "All" ||
      lead.status === statusFilter ||
      (statusFilter === "Follow-up" && lead.status === "Follow-up Required");
    const matchesMonth =
      selectedMonth === "All" || getLeadMonthKey(lead) === selectedMonth;
    const matchesZone =
      filters.areaZone === "All" ||
      lead.areaZone?.trim().toLowerCase() ===
        filters.areaZone.trim().toLowerCase();
    const matchesCampaign =
      filters.campaign === "All" ||
      lead.campaign?.trim().toLowerCase() ===
        filters.campaign.trim().toLowerCase();
    const matchesCreator =
      filters.createdBy === "All" ||
      lead.createdBy?.trim().toLowerCase() ===
        filters.createdBy.trim().toLowerCase();
    const matchesHandler =
      filters.handledBy === "All" ||
      (filters.handledBy === "Unassigned"
        ? !lead.handledBy
        : lead.handledBy?.trim().toLowerCase() ===
          filters.handledBy.trim().toLowerCase());

    // Payment Status matching
    let matchesPayment = true;
    const paid = Number(lead.paidAmount) || 0;
    const bal = Number(lead.balanceAmount) || 0;
    if (filters.paymentStatus === "Paid") {
      matchesPayment = paid > 0 && bal === 0;
    } else if (filters.paymentStatus === "Pending Balance") {
      matchesPayment = bal > 0;
    } else if (filters.paymentStatus === "Unpaid") {
      matchesPayment = paid === 0;
    }

    // Date Range matching
    let matchesDate = true;
    if (filters.dateFrom) {
      matchesDate = matchesDate && (lead.leadDate || "") >= filters.dateFrom;
    }
    if (filters.dateTo) {
      matchesDate = matchesDate && (lead.leadDate || "") <= filters.dateTo;
    }

    return (
      matchesSearch &&
      matchesStatus &&
      matchesMonth &&
      matchesZone &&
      matchesCampaign &&
      matchesCreator &&
      matchesHandler &&
      matchesPayment &&
      matchesDate
    );
  });

  // Apply sorting if configured
  if (sortConfig.key) {
    filteredLeads = [...filteredLeads].sort((a, b) => {
      let valA = a[sortConfig.key] || "";
      let valB = b[sortConfig.key] || "";
      valA = valA.toString().toLowerCase();
      valB = valB.toString().toLowerCase();

      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative">
      {/* Top Header & Overview Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200/80 p-4 sm:p-5 rounded-md shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-600 text-white rounded-full shadow-md shadow-sky-600/20 shrink-0">
            <User className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2 flex-wrap">
              <span>Leads Management</span>
              <span className="text-xs font-extrabold bg-sky-50 text-sky-600 border border-sky-100 rounded-full px-2.5 py-0.5">
                {filteredLeads.length}{" "}
                {filteredLeads.length === 1 ? "Lead" : "Leads"}
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Organize, filter, track financials, and manage custom fields for
              your prospect directory
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap w-full sm:w-auto">
          {user?.role === "admin" && (
            <button
              onClick={handleExportCSV}
              className="flex-1 sm:flex-initial justify-center px-3.5 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
              title="Export lead list to CSV file"
            >
              <Download className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Export CSV</span>
            </button>
          )}
          <button
            onClick={handleOpenAddColumn}
            className="flex-1 sm:flex-initial justify-center px-3.5 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
            title="Add a custom column to leads"
          >
            <Plus className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Add Column</span>
          </button>
          <button
            onClick={handleOpenAddLead}
            className="flex-1 sm:flex-initial justify-center px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Add New Lead</span>
          </button>
        </div>
      </div>

      {/* Filter, Search & View Controls Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 sm:p-4 bg-white border border-slate-200/80 rounded-md shadow-sm">
        {/* Left Search Bar */}
        <div className="relative flex-1 min-w-0 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads by name, email, phone, business or zone..."
            className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/10 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto justify-between sm:justify-start lg:justify-end">
          {/* Month Selector Dropdown */}
          <div className="flex items-center justify-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs shrink-0 flex-1 sm:flex-initial">
            <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
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

          {/* Advanced Filter Toggle Button */}
          <button
            onClick={() => setIsFilterPanelOpen((prev) => !prev)}
            className={`h-10 px-3 sm:px-3.5 border rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 shadow-2xs shrink-0 flex-1 sm:flex-initial ${
              isFilterPanelOpen || activeFiltersCount > 0
                ? "bg-sky-50 text-sky-700 border-sky-300 ring-2 ring-sky-500/10"
                : "bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100"
            }`}
          >
            <Filter className="w-4 h-4 text-sky-600" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-sky-600 text-white text-[10px] font-extrabold rounded-full px-1.5 py-0.2">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${isFilterPanelOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Customize Columns Dropdown Toggle (Table View Only) */}
          {viewMode === "table" && (
            <div className="relative flex-1 sm:flex-initial" ref={dropdownRef}>
              <button
                onClick={() => setIsColumnDropdownOpen((prev) => !prev)}
                className="w-full sm:w-auto h-10 px-3 sm:px-3.5 bg-slate-50 border border-slate-200/80 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 shadow-2xs"
              >
                <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                <span>Columns</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isColumnDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-3 animate-fade-in max-h-80 overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                    <span className="text-xs font-bold text-slate-800">
                      Customize Columns
                    </span>
                    <button
                      onClick={showAllColumns}
                      className="text-[10px] font-bold text-sky-600 hover:underline cursor-pointer"
                    >
                      Show All
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {allColumns.map((col) => {
                      const isVisible = !hiddenColumnKeys.includes(col.key);
                      return (
                        <div
                          key={col.key}
                          className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 text-xs font-semibold text-slate-700 group"
                        >
                          <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={isVisible}
                              onChange={() => toggleColumnVisibility(col.key)}
                              className="rounded border-slate-300 text-sky-500 focus:ring-sky-500 cursor-pointer"
                            />
                            <span className="truncate">{col.label}</span>
                          </label>
                          {col.isCustom && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenEditColumn(col)}
                                className="p-1 hover:bg-sky-50 text-slate-400 hover:text-sky-600 rounded transition-colors cursor-pointer"
                                title="Edit Column"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteColumn(col.key, col.label)
                                }
                                className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                title="Delete Column"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* View Mode Toggle Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60 shrink-0 w-full sm:w-auto justify-center">
            <button
              onClick={() => setViewMode("table")}
              className={`flex-1 sm:flex-initial justify-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "table"
                  ? "bg-white text-sky-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex-1 sm:flex-initial justify-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "grid"
                  ? "bg-white text-sky-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Advanced Filter Panel */}
      {isFilterPanelOpen && (
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-md p-5 shadow-xs flex flex-col gap-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-sky-600" />
              <span className="font-bold text-slate-800 text-xs">
                Filter Leads Directory
              </span>
              {activeFiltersCount > 0 && (
                <span className="bg-sky-100 text-sky-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {activeFiltersCount}{" "}
                  {activeFiltersCount === 1
                    ? "Active Filter"
                    : "Active Filters"}
                </span>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={resetAllFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {/* 1. Status Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Lead Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Contacted">Contacted</option>
                <option value="Follow-up">Follow-up</option>
                <option value="No Answer">No Answer</option>
              </select>
            </div>

            {/* 2. Area Zone Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Area Zone
              </label>
              <select
                value={filters.areaZone}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, areaZone: e.target.value }))
                }
                className="h-9 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="All">All Zones</option>
                {uniqueAreaZones.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Campaign Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Source Campaign
              </label>
              <select
                value={filters.campaign}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, campaign: e.target.value }))
                }
                className="h-9 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="All">All Campaigns</option>
                {uniqueCampaigns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Payment Status Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Payment Status
              </label>
              <select
                value={filters.paymentStatus}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    paymentStatus: e.target.value,
                  }))
                }
                className="h-9 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="All">All Payments</option>
                <option value="Paid">Fully Paid</option>
                <option value="Pending Balance">Pending Balance</option>
                <option value="Unpaid">Unpaid / Zero Paid</option>
              </select>
            </div>

            {/* 5. Handled By Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Handled By
              </label>
              <select
                value={filters.handledBy}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, handledBy: e.target.value }))
                }
                className="h-9 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="All">All Handlers</option>
                {uniqueHandlers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. Date From */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Lead Date From
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                }
                className="h-9 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-sky-500"
              />
            </div>

            {/* 7. Date To */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Lead Date To
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                }
                className="h-9 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area: Recycle Bin View vs Normal Table/Grid Views */}
      {quickFilterTab === "recycled" && isAdmin ? (
        <div className="bg-white border border-rose-200 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
          <div className="bg-linear-to-r from-slate-900 to-rose-950 text-white p-5 rounded-md flex flex-wrap items-center justify-between gap-4 shadow-md border border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-rose-500/20 text-rose-300 rounded-xl border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-white tracking-tight flex items-center gap-2">
                  <span>Lead Recycle Bin</span>
                  <span className="text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full px-2.5 py-0.5">
                    Admin Access Only
                  </span>
                </h3>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  View soft-deleted leads, see who deleted them, and restore
                  leads or permanently purge them.
                </p>
              </div>
            </div>

            <button
              onClick={fetchRecycledLeads}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingRecycled ? "animate-spin" : ""}`}
              />
              <span>Refresh Bin</span>
            </button>
          </div>

          {recycledLeads.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200/80 rounded-md p-12 text-center flex flex-col items-center gap-3 shadow-2xs">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                Recycle Bin is Empty
              </h4>
              <p className="text-xs text-slate-500 max-w-md">
                No leads currently in the Recycle Bin. Any deleted leads will be
                safely stored here for administrator recovery.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-md shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Client Name</th>
                      <th className="py-3.5 px-4">Business</th>
                      <th className="py-3.5 px-4">Contact Info</th>
                      <th className="py-3.5 px-4">Deleted By</th>
                      <th className="py-3.5 px-4">Deleted Date</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {recycledLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="hover:bg-rose-50/20 transition-colors"
                      >
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
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <User className="w-3 h-3 text-rose-500" />
                            <span>{lead.deletedBy || "System User"}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {lead.deletedAt
                            ? new Date(lead.deletedAt).toLocaleString()
                            : "-"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleRestoreLead(lead.id, lead.name)
                              }
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                              title="Restore lead back to active leads"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore</span>
                            </button>
                            <button
                              onClick={() =>
                                handlePermanentDeleteLead(lead.id, lead.name)
                              }
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                              title="Permanently wipe lead and attached files"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Purge</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : viewMode === "table" ? (
        <div className="bg-white border border-slate-200/80 rounded-md shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-w-full">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/70 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider select-none">
                  <th className="p-4 border-r border-slate-200/50 text-center w-20 sticky left-0 bg-slate-50 shadow-[1px_0_0_0_rgba(241,245,249,1)]">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={handleSelectAllLeads}
                        className="p-0.5 text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors"
                        title={
                          selectedLeadIds.length === filteredLeads.length &&
                          filteredLeads.length > 0
                            ? "Deselect All"
                            : "Select All"
                        }
                      >
                        {filteredLeads.length > 0 &&
                        selectedLeadIds.length === filteredLeads.length ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <span>S.No</span>
                    </div>
                  </th>
                  {visibleColumns.map((col) => (
                    <th
                      key={col.key}
                      className="p-4 border-r border-slate-200/50 whitespace-nowrap min-w-35"
                    >
                      <div className="flex items-center justify-between gap-1 group">
                        <button
                          onClick={() => handleSort(col.key)}
                          className="inline-flex items-center gap-1.5 hover:text-slate-700 transition-colors cursor-pointer"
                        >
                          <span>{col.label}</span>
                          <ArrowUpDown
                            className={`w-3 h-3 ${sortConfig.key === col.key ? "text-sky-600" : "text-slate-300 opacity-0 group-hover:opacity-100"}`}
                          />
                        </button>
                        {col.isCustom && (
                          <div className="inline-flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditColumn(col);
                              }}
                              className="text-slate-400 hover:text-sky-600 p-0.5 rounded cursor-pointer transition-colors"
                              title="Edit Custom Column"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteColumn(col.key, col.label);
                              }}
                              className="text-slate-400 hover:text-rose-500 p-0.5 rounded cursor-pointer transition-colors"
                              title="Delete Custom Column"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="p-4 text-center sticky right-0 bg-slate-50 shadow-[-1px_0_0_0_rgba(241,245,249,1)] w-36">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead, idx) => (
                    <tr
                      key={lead.id}
                      className="border-b border-slate-100/80 last:border-0 hover:bg-slate-50/60 font-semibold text-xs text-slate-700 transition-colors"
                    >
                      <td className="p-4 border-r border-slate-200/50 text-center text-slate-400 font-mono text-[11px] sticky left-0 bg-white group-hover:bg-slate-50/60 shadow-[1px_0_0_0_rgba(241,245,249,1)]">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() =>
                              handleToggleSelectLead(lead.id || lead._id)
                            }
                            className="p-0.5 text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors"
                            title={
                              selectedLeadIds.includes(lead.id || lead._id)
                                ? "Deselect Lead"
                                : "Select Lead"
                            }
                          >
                            {selectedLeadIds.includes(lead.id || lead._id) ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </button>
                          <span>{idx + 1}</span>
                        </div>
                      </td>
                      {visibleColumns.map((col) => (
                        <td
                          key={col.key}
                          className="p-4 border-r border-slate-200/50 max-w-65"
                        >
                          {renderCellContent(col, lead)}
                        </td>
                      ))}
                      <td className="p-4 text-center sticky right-0 bg-white group-hover:bg-slate-50/60 shadow-[-1px_0_0_0_rgba(241,245,249,1)]">
                        <div className="inline-flex items-center gap-1.5 justify-center">
                          {/* View Images Button */}
                          {(() => {
                            const imgCount = (lead.documents || []).filter(
                              (d) =>
                                d.url &&
                                (/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(
                                  d.url,
                                ) ||
                                  /\.(jpg|jpeg|png|webp|gif|svg)/i.test(
                                    d.fileName || "",
                                  )),
                            ).length;
                            return (
                              <button
                                onClick={() => handleOpenImageModal(lead)}
                                className={`p-1.5 rounded-lg border transition-all cursor-pointer shadow-2xs flex items-center gap-1 ${
                                  imgCount > 0
                                    ? "bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-600 border-purple-200/70"
                                    : "bg-slate-50 text-slate-400 hover:bg-slate-200 border-slate-200"
                                }`}
                                title={
                                  imgCount > 0
                                    ? `View ${imgCount} Attached Image(s)`
                                    : "Upload / Attach Images"
                                }
                              >
                                <ImageIcon className="w-3.5 h-3.5" />
                                {imgCount > 0 && (
                                  <span className="text-[10px] font-extrabold">
                                    {imgCount}
                                  </span>
                                )}
                              </button>
                            );
                          })()}

                          {/* Quick View Button */}
                          <button
                            onClick={() => setQuickViewLead(lead)}
                            className="p-1.5 bg-slate-50 text-slate-600 hover:bg-slate-600 hover:text-white rounded-lg border border-slate-200 transition-all cursor-pointer shadow-2xs"
                            title="Quick View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Schedule Follow-Up Button */}
                          <button
                            onClick={() => handleOpenScheduleFollowUp(lead)}
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg border border-blue-200/70 transition-all cursor-pointer shadow-2xs"
                            title="Schedule Follow-Up Task"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>

                          {/* Forward Lead Button */}
                          <button
                            onClick={() => handleOpenForwardModal(lead)}
                            className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg border border-indigo-200/70 transition-all cursor-pointer shadow-2xs"
                            title="Forward Lead to another employee"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Lead Button */}
                          <button
                            onClick={() => handleOpenEditLead(lead)}
                            className="p-1.5 bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white rounded-lg border border-sky-200/70 transition-all cursor-pointer shadow-2xs"
                            title="Edit Lead Profile"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Lead Button */}
                          <button
                            onClick={() => handleDeleteLead(lead.id, lead.name)}
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg border border-rose-200/70 transition-all cursor-pointer shadow-2xs"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={visibleColumns.length + 2}
                      className="p-12 text-center text-slate-400 font-semibold text-xs"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Search className="w-8 h-8 text-slate-300 stroke-1" />
                        <span className="font-bold text-slate-600">
                          No matching leads found
                        </span>
                        <p className="text-[11px] text-slate-400">
                          Try adjusting your search query or status filter
                          criteria.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Visual Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredLeads.length > 0 ? (
            filteredLeads.map((lead) => {
              const cardStyle = getLeadCardStyles(lead.status);

              return (
                <div
                  key={lead.id}
                  className={`border ${cardStyle.border} ${cardStyle.cardBg} ${cardStyle.glow} rounded-md p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 group relative overflow-hidden`}
                >
                  <div
                    className={`absolute top-0 left-0 right-0 h-1.5 ${cardStyle.topBar}`}
                  />

                  <div className="flex flex-col gap-3">
                    {/* Card Top Row: Avatar & Status */}
                    <div className="flex items-start justify-between gap-3 pt-1">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-sky-600/20">
                            {(lead.name || "L").substring(0, 2).toUpperCase()}
                          </div>
                          <span
                            className={`w-3 h-3 rounded-full absolute -bottom-0.5 -right-0.5 border-2 border-white ${getStatusDotColor(lead.status)}`}
                            title={`Lead Status: ${lead.status || "Incoming"}`}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3
                            onClick={() => setQuickViewLead(lead)}
                            className="font-bold text-slate-900 text-sm hover:text-sky-600 cursor-pointer transition-colors truncate"
                          >
                            {lead.name || "Unnamed Client"}
                          </h3>
                          {lead.businessName && (
                            <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5 truncate">
                              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">
                                {lead.businessName}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                      {renderStatusBadge(lead.status)}
                    </div>

                    {/* Lead Handler Status / Accept Lead Bar */}
                    {lead.handledBy ? (
                      <div className="flex items-center justify-between bg-emerald-50/80 border border-emerald-200/70 p-2 rounded-xl text-xs">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                          Handled By:
                        </span>
                        <span className="font-extrabold text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {lead.handledBy}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-blue-50/80 border border-blue-200/80 p-2 rounded-xl text-xs">
                        <div className="flex items-center gap-1 text-blue-800 font-bold">
                          <Sparkles className="w-3 h-3 text-blue-600 animate-pulse" />
                          <span>Incoming</span>
                        </div>
                        <button
                          onClick={() =>
                            handleAcceptLead &&
                            handleAcceptLead(lead.id || lead._id)
                          }
                          className="px-2.5 py-1 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold text-[11px] rounded-lg shadow-xs cursor-pointer transition-all flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Accept Lead</span>
                        </button>
                      </div>
                    )}

                    {/* Financial Summary Pill Bar inside Lead Card */}
                    {(lead.paidAmount !== undefined ||
                      lead.balanceAmount !== undefined ||
                      lead.totalAmount !== undefined) && (
                      <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs font-mono">
                        <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded-lg border border-emerald-200/60">
                          <span className="text-[10px] font-sans font-bold text-emerald-600 uppercase">
                            Paid:
                          </span>
                          <span className="font-bold">
                            ₹
                            {(Number(lead.paidAmount) || 0).toLocaleString(
                              "en-IN",
                            )}
                          </span>
                        </div>
                        <div
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${
                            (Number(lead.balanceAmount) || 0) > 0
                              ? "text-blue-700 bg-blue-50/80 border-blue-200/60"
                              : "text-slate-600 bg-slate-100 border-slate-200"
                          }`}
                        >
                          <span className="text-[10px] font-sans font-bold uppercase">
                            Balance:
                          </span>
                          <span className="font-bold">
                            ₹
                            {(Number(lead.balanceAmount) || 0).toLocaleString(
                              "en-IN",
                            )}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Contact Info Pills */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 text-xs">
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="flex items-center gap-2 text-slate-600 font-bold"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{lead.phone}</span>
                        </a>
                      )}
                      {lead.email && (
                        <div className="flex items-center gap-2 text-slate-600 font-medium truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                      )}
                      {lead.areaZone && (
                        <div className="flex items-center gap-2 text-slate-500 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Zone: {lead.areaZone}</span>
                        </div>
                      )}
                      {lead.campaign && (
                        <div className="flex items-center gap-2 text-slate-500 font-medium">
                          <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Campaign: {lead.campaign}</span>
                        </div>
                      )}
                    </div>

                    {/* Social Links Row */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {lead.googleMap &&
                        renderUrlBadge("googleMap", lead.googleMap)}
                      {lead.website && renderUrlBadge("website", lead.website)}
                      {lead.instagram &&
                        renderUrlBadge("instagram", lead.instagram)}
                      {lead.facebook &&
                        renderUrlBadge("facebook", lead.facebook)}
                      {lead.twitterX &&
                        renderUrlBadge("twitterX", lead.twitterX)}
                      {lead.youtube && renderUrlBadge("youtube", lead.youtube)}
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
                    {/* View Images Button */}
                    {(() => {
                      const imgCount =
                        (quickViewLead?.id === lead.id
                          ? quickViewLead
                          : lead
                        ).documents?.filter(
                          (d) =>
                            d.url &&
                            (/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(
                              d.url,
                            ) ||
                              /\.(jpg|jpeg|png|webp|gif|svg)/i.test(
                                d.fileName || "",
                              )),
                        ).length || 0;
                      return (
                        <button
                          onClick={() => handleOpenImageModal(lead)}
                          className={`px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                            imgCount > 0
                              ? "bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-600 border-purple-200/70"
                              : "bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200"
                          }`}
                          title={
                            imgCount > 0
                              ? `View ${imgCount} Attached Image(s)`
                              : "Upload / Attach Images"
                          }
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          {imgCount > 0 && (
                            <span className="bg-purple-200 text-purple-800 text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ml-0.5">
                              {imgCount}
                            </span>
                          )}
                        </button>
                      );
                    })()}

                    <button
                      onClick={() => setQuickViewLead(lead)}
                      className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-all cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenScheduleFollowUp(lead)}
                      className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl border border-blue-200/70 transition-all cursor-pointer"
                      title="Schedule Follow-Up Task"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenForwardModal(lead)}
                      className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200/70 transition-all cursor-pointer"
                      title="Forward Lead to another employee"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEditLead(lead)}
                      className="p-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl border border-sky-200/70 transition-all cursor-pointer"
                      title="Edit Profile"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteLead(lead.id, lead.name)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200/70 transition-all cursor-pointer"
                      title="Delete Lead"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center bg-white border border-slate-200/80 rounded-md flex flex-col items-center justify-center gap-2">
              <Search className="w-8 h-8 text-slate-300 stroke-1" />
              <span className="font-bold text-slate-600">
                No matching leads found
              </span>
              <p className="text-[11px] text-slate-400">
                Try adjusting your search query or status filter criteria.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quick View Drawer Modal Sheet */}
      {quickViewLead &&
        isClient &&
        createPortal(
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-9999 flex justify-end animate-fade-in">
            <div className="bg-white w-full max-w-full sm:max-w-md md:max-w-lg h-full shadow-2xl flex flex-col justify-between animate-slide-left border-l border-slate-200">
              {/* Premium Gradient Header */}
              <div className="bg-linear-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-4 sm:p-6 flex items-start justify-between border-b border-slate-800 shadow-md">
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                  <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-md bg-linear-to-tr from-sky-600 to-blue-500 text-white flex items-center justify-center font-black text-base sm:text-lg shadow-lg shadow-sky-500/25 border border-sky-400/30 shrink-0">
                    {(quickViewLead.name || "L").substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base sm:text-lg text-white leading-snug tracking-tight truncate">
                      {quickViewLead.name || "Unnamed Client"}
                    </h3>
                    {quickViewLead.businessName ? (
                      <p className="text-xs text-sky-300/90 font-semibold flex items-center gap-1.5 mt-0.5 truncate">
                        <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span className="truncate">
                          {quickViewLead.businessName}
                        </span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        Individual Lead
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setQuickViewLead(null)}
                  className="text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 p-2 rounded-xl border border-slate-700/60 transition-colors cursor-pointer shrink-0 ml-2"
                  title="Close Drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Body Scroll Content */}
              <div className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-4 sm:gap-5 text-xs text-slate-700 flex-1">
                {/* Status & Campaign Pill Card */}
                <div className="flex items-center justify-between bg-slate-50/90 p-3.5 rounded-md border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                      Status:
                    </span>
                    {renderStatusBadge(quickViewLead.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                      Campaign:
                    </span>
                    <span className="bg-white border border-slate-200 px-3 py-1 rounded-xl font-bold text-slate-700 text-[11px] shadow-2xs truncate max-w-35 sm:max-w-none">
                      {quickViewLead.campaign || "Direct Outreach"}
                    </span>
                  </div>
                </div>

                {/* Financial Breakdown Card */}
                <div className="flex flex-col gap-2">
                  <h4 className="font-bold uppercase text-[10px] tracking-wider text-slate-400">
                    Financial Breakdown
                  </h4>
                  <div className="bg-linear-to-br from-slate-900 to-slate-950 text-white p-4 rounded-md border border-slate-800 shadow-xl flex flex-col gap-3.5">
                    <div className="grid grid-cols-3 gap-2 sm:gap-2.5 text-center">
                      <div className="bg-white/5 border border-white/10 p-2 sm:p-2.5 rounded-xl">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                          Total
                        </span>
                        <span className="text-xs font-mono font-black text-white mt-0.5 block truncate">
                          ₹
                          {(
                            Number(quickViewLead.totalAmount) ||
                            (Number(quickViewLead.paidAmount) || 0) +
                              (Number(quickViewLead.balanceAmount) || 0)
                          ).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 sm:p-2.5 rounded-xl">
                        <span className="text-[9px] uppercase font-bold text-emerald-400 block tracking-wider">
                          Paid
                        </span>
                        <span className="text-xs font-mono font-black text-emerald-300 mt-0.5 block truncate">
                          ₹
                          {(
                            Number(quickViewLead.paidAmount) || 0
                          ).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/20 p-2 sm:p-2.5 rounded-xl">
                        <span className="text-[9px] uppercase font-bold text-blue-400 block tracking-wider">
                          Balance
                        </span>
                        <span className="text-xs font-mono font-black text-blue-300 mt-0.5 block truncate">
                          ₹
                          {(
                            Number(quickViewLead.balanceAmount) || 0
                          ).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    {/* Payment Progress Bar */}
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

                {/* Main Contact Section */}
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
                          className="font-bold text-slate-800 font-mono text-xs hover:text-sky-600 transition-colors inline-flex items-center gap-1.5 mt-0.5"
                        >
                          <Phone className="w-3 h-3 text-sky-500" />
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
                          className="font-bold text-slate-800 text-xs truncate hover:text-sky-600 transition-colors inline-flex items-center gap-1.5 mt-0.5 max-w-full"
                          title={quickViewLead.email}
                        >
                          <Mail className="w-3 h-3 text-sky-500 shrink-0" />
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
                        {quickViewLead.areaZone || "-"}
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
                    <div className="border-t border-slate-200/60 pt-2.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">
                        Added By User
                      </span>
                      <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5 mt-0.5">
                        <User className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span>
                          {quickViewLead.createdBy || "System / Unspecified"}
                        </span>
                      </span>
                    </div>
                    <div className="border-t border-slate-200/60 pt-2.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">
                        Handled By Agent
                      </span>
                      {quickViewLead.handledBy ? (
                        <span className="font-black text-emerald-700 text-xs flex items-center gap-1.5 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{quickViewLead.handledBy}</span>
                        </span>
                      ) : (
                        <span className="font-black text-blue-600 text-xs flex items-center gap-1.5 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse shrink-0" />
                          <span>Unassigned / Incoming</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Call Remarks */}
                {(quickViewLead.remark || quickViewLead.remark2) && (
                  <div className="flex flex-col gap-2">
                    <h4 className="font-bold uppercase text-[10px] tracking-wider text-slate-400">
                      Call Remarks
                    </h4>
                    <div className="bg-blue-50/80 border border-blue-200/80 p-4 rounded-md flex flex-col gap-2.5 shadow-2xs">
                      {quickViewLead.remark && (
                        <div>
                          <span className="text-[10px] text-blue-800 font-bold uppercase block tracking-wider">
                            Primary Remark
                          </span>
                          <p className="font-semibold text-slate-800 text-xs mt-0.5">
                            {quickViewLead.remark}
                          </p>
                        </div>
                      )}
                      {quickViewLead.remark2 && (
                        <div
                          className={
                            quickViewLead.remark
                              ? "border-t border-blue-200/60 pt-2"
                              : ""
                          }
                        >
                          <span className="text-[10px] text-blue-800 font-bold uppercase block tracking-wider">
                            Follow-up Remark
                          </span>
                          <p className="font-semibold text-slate-800 text-xs mt-0.5">
                            {quickViewLead.remark2}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Web & Social Links (Clean empty state) */}
                <div className="flex flex-col gap-2">
                  <h4 className="font-bold uppercase text-[10px] tracking-wider text-slate-400">
                    Links & Profiles
                  </h4>
                  {(() => {
                    const hasLinks =
                      quickViewLead.googleMap ||
                      quickViewLead.website ||
                      quickViewLead.instagram ||
                      quickViewLead.facebook ||
                      quickViewLead.twitterX ||
                      quickViewLead.youtube;
                    return hasLinks ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        {renderUrlBadge("googleMap", quickViewLead.googleMap)}
                        {renderUrlBadge("website", quickViewLead.website)}
                        {renderUrlBadge("instagram", quickViewLead.instagram)}
                        {renderUrlBadge("facebook", quickViewLead.facebook)}
                        {renderUrlBadge("twitterX", quickViewLead.twitterX)}
                        {renderUrlBadge("youtube", quickViewLead.youtube)}
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-slate-400 font-medium text-xs text-center">
                        No web or social links added.
                      </div>
                    );
                  })()}
                </div>

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
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold uppercase text-[10px] tracking-wider text-slate-400 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
                          <span>Attached Images ({images.length})</span>
                        </h4>
                        <button
                          onClick={() => {
                            handleOpenEditLead(quickViewLead);
                            setActiveFormTab("documents");
                          }}
                          className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-600 font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-sky-200/70"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Images</span>
                        </button>
                      </div>
                      {images.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {images.map((img, idx) => (
                            <div
                              key={img._id || img.public_id || idx}
                              className="relative h-24 sm:h-28 rounded-md overflow-hidden bg-slate-100 border border-slate-200 group cursor-pointer shadow-2xs hover:shadow-md transition-all"
                            >
                              <img
                                src={img.url}
                                alt={img.fileName || `Image ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div
                                onClick={() =>
                                  setImageModal({
                                    isOpen: true,
                                    leadName: quickViewLead.name || "Lead",
                                    images,
                                    currentIndex: idx,
                                  })
                                }
                                className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 p-2 text-center"
                              >
                                <Eye className="w-5 h-5 drop-shadow-md" />
                                <span className="text-[10px] font-bold truncate max-w-full px-1">
                                  {img.fileName || "View Full Image"}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDocument(
                                    quickViewLead.id || quickViewLead._id,
                                    img,
                                  );
                                }}
                                className="absolute top-1.5 right-1.5 bg-rose-600/90 hover:bg-rose-600 text-white p-1.5 rounded-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                                title="Delete image from Cloudinary"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-md text-center text-slate-400 font-medium text-xs flex flex-col items-center gap-1">
                          <ImageIcon className="w-5 h-5 text-slate-300" />
                          <span>No images attached yet.</span>
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
                                  : h.action === "STATUS_CHANGE"
                                    ? "Status Updated"
                                    : "Lead Updated",
                          description:
                            h.details ||
                            (h.action === "CREATED"
                              ? "Lead added to the directory"
                              : "Changes made to lead information"),
                          timestamp: h.timestamp || h.createdAt || new Date(),
                          performedBy: h.performedBy || "System User",
                          color:
                            h.action === "CREATED"
                              ? "emerald"
                              : h.action === "FORWARDED"
                                ? "indigo"
                                : h.action === "ACCEPTED"
                                  ? "blue"
                                  : "slate",
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
                                <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
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

              {/* Bottom Actions Footer */}
              <div className="bg-white/95 backdrop-blur-md border-t border-slate-200/80 p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0 shadow-lg">
                <button
                  onClick={() => handleOpenScheduleFollowUp(quickViewLead)}
                  className="px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs rounded-xl border border-blue-200/80 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs flex-1 sm:flex-initial"
                >
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Schedule Follow-Up</span>
                </button>
                {!quickViewLead.handledBy ? (
                  <button
                    onClick={() => {
                      if (handleAcceptLead)
                        handleAcceptLead(quickViewLead.id || quickViewLead._id);
                      setQuickViewLead((prev) => ({
                        ...prev,
                        handledBy: user?.name || user?.email || "Current User",
                        status: "Active",
                      }));
                    }}
                    className="px-4 py-2.5 bg-linear-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-500/25 transition-all cursor-pointer flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accept Lead Now</span>
                  </button>
                ) : (
                  <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200/80 flex items-center justify-center gap-1.5 flex-1 sm:flex-initial">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Assigned to {quickViewLead.handledBy}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleOpenForwardModal(quickViewLead)}
                    className="flex-1 sm:flex-initial justify-center px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4 text-indigo-600" />
                    <span>Forward</span>
                  </button>
                  <button
                    onClick={() => handleOpenEditLead(quickViewLead)}
                    className="flex-1 sm:flex-initial justify-center px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit3 className="w-4 h-4 text-slate-500" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Dynamic Add / Edit Lead Modal */}
      {leadModal.isOpen &&
        isClient &&
        createPortal(
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-9999 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
            <form
              onSubmit={handleLeadFormSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.target.tagName === "INPUT") {
                  e.preventDefault();
                }
              }}
              className="bg-white rounded-md shadow-2xl border border-slate-200/80 w-full max-w-3xl overflow-hidden animate-slide-up flex flex-col max-h-[94vh] sm:max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="bg-slate-50 border-b border-slate-100 px-4 sm:px-6 py-3.5 sm:py-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 flex-wrap">
                    <User className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>
                      {leadModal.type === "add"
                        ? "Create Lead Profile"
                        : "Edit Lead Profile"}
                    </span>
                    <span className="text-slate-300 font-normal hidden sm:inline">
                      •
                    </span>
                    <span className="text-sky-700 font-extrabold text-[11px] sm:text-xs bg-sky-100/80 px-2 sm:px-2.5 py-0.5 rounded-lg border border-sky-200 inline-flex items-center gap-1 shadow-2xs">
                      {[
                        { id: "general", label: "General Info" },
                        { id: "contact", label: "Contact & Social" },
                        { id: "financials", label: "Financials" },
                        { id: "call", label: "Call Activity" },
                        { id: "documents", label: "Documents / Images" },
                        { id: "custom", label: "Custom Fields" },
                      ].find((t) => t.id === activeFormTab)?.label ||
                        "General Info"}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {leadModal.type === "add"
                      ? "Configure settings for your new client prospect"
                      : "Modify settings for the selected client"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setLeadModal({ isOpen: false, type: "add", leadId: null })
                  }
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Interactive Step Wizard Navigation Tabs */}
              <div className="bg-slate-100/80 border-b border-slate-200 px-3 sm:px-4 py-2 flex items-center gap-1 sm:gap-1.5 overflow-x-auto">
                {[
                  { id: "general", label: "General" },
                  { id: "contact", label: "Contact" },
                  { id: "financials", label: "Financials" },
                  { id: "call", label: "Call" },
                  {
                    id: "documents",
                    label: `Documents${leadModal.type === "add" && pendingFiles.length > 0 ? ` (${pendingFiles.length})` : ""}`,
                  },
                  { id: "custom", label: "Custom Fields" },
                ].map((stepTab, idx) => {
                  const isActive = activeFormTab === stepTab.id;
                  const isPast =
                    FORM_STEPS.indexOf(stepTab.id) < currentStepIndex;
                  return (
                    <button
                      key={stepTab.id}
                      type="button"
                      onClick={() => {
                        if (
                          activeFormTab === "general" &&
                          !formValues.name?.trim()
                        ) {
                          alert(
                            "Please enter the Client Name before switching tabs.",
                          );
                          return;
                        }
                        if (
                          activeFormTab === "contact" &&
                          !formValues.phone?.trim()
                        ) {
                          alert(
                            "Please enter the Phone Number before switching tabs.",
                          );
                          return;
                        }
                        setActiveFormTab(stepTab.id);
                      }}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        isActive
                          ? "bg-sky-600 text-white shadow-xs"
                          : isPast
                            ? "bg-slate-200/70 text-slate-700 hover:bg-slate-200"
                            : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-700"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                          isActive
                            ? "bg-white text-sky-700 font-extrabold"
                            : "bg-slate-300 text-slate-700"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span>{stepTab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full bg-slate-100 h-1">
                <div
                  className="bg-sky-500 h-1 transition-all duration-300 ease-in-out"
                  style={{
                    width: `${((currentStepIndex + 1) / FORM_STEPS.length) * 100}%`,
                  }}
                />
              </div>

              {/* Scrollable Form Content */}
              <div className="overflow-y-auto p-4 sm:p-6 flex-1 max-h-[calc(94vh-180px)] sm:max-h-[60vh]">
                {/* Tab 1: General Info */}
                {activeFormTab === "general" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                        Client Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formValues.name || ""}
                        onChange={(e) =>
                          setFormValues((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Full Name of the contact"
                        className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                        Business Name
                      </label>
                      <input
                        type="text"
                        value={formValues.businessName || ""}
                        onChange={(e) =>
                          setFormValues((prev) => ({
                            ...prev,
                            businessName: e.target.value,
                          }))
                        }
                        placeholder="e.g. Acme Corp"
                        className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                        Area Zone
                      </label>
                      <input
                        type="text"
                        value={formValues.areaZone || ""}
                        onChange={(e) =>
                          setFormValues((prev) => ({
                            ...prev,
                            areaZone: e.target.value,
                          }))
                        }
                        placeholder="e.g. North Zone"
                        className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                        Address
                      </label>
                      <input
                        type="text"
                        value={formValues.address || ""}
                        onChange={(e) =>
                          setFormValues((prev) => ({
                            ...prev,
                            address: e.target.value,
                          }))
                        }
                        placeholder="Full company or client address"
                        className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                        Lead Date
                      </label>
                      <input
                        type="date"
                        value={formValues.leadDate || ""}
                        onChange={(e) =>
                          setFormValues((prev) => ({
                            ...prev,
                            leadDate: e.target.value,
                          }))
                        }
                        className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5 flex items-center justify-between">
                        <span>Added By User</span>
                        <span className="text-[9px] text-slate-400 font-normal italic font-mono">
                          Read Only
                        </span>
                      </label>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={
                          formValues.createdBy ||
                          (leadModal.type === "add"
                            ? user?.name || user?.email || "Current User"
                            : "System / Unspecified")
                        }
                        className="w-full h-10 rounded-xl border border-slate-200/80 px-3.5 text-xs font-semibold text-slate-500 bg-slate-100/90 cursor-not-allowed outline-none select-none"
                      />
                    </div>
                  </div>
                )}

                {/* Tab 2: Contact & Social */}
                {activeFormTab === "contact" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                        Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formValues.phone || ""}
                        onChange={(e) =>
                          setFormValues((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        placeholder="e.g. +91 99999-99999"
                        className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formValues.email || ""}
                        onChange={(e) =>
                          setFormValues((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder="e.g. client@company.com"
                        className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                        Google Map Link
                      </label>
                      <input
                        type="text"
                        value={formValues.googleMap || ""}
                        onChange={(e) =>
                          setFormValues((prev) => ({
                            ...prev,
                            googleMap: e.target.value,
                          }))
                        }
                        placeholder="https://google.com/maps/place/..."
                        className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                        Website Link
                      </label>
                      <input
                        type="text"
                        value={formValues.website || ""}
                        onChange={(e) =>
                          setFormValues((prev) => ({
                            ...prev,
                            website: e.target.value,
                          }))
                        }
                        placeholder="https://example.com"
                        className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                        Instagram Link
                      </label>
                      <input
                        type="text"
                        value={formValues.instagram || ""}
                        onChange={(e) =>
                          setFormValues((prev) => ({
                            ...prev,
                            instagram: e.target.value,
                          }))
                        }
                        placeholder="https://instagram.com/profile"
                        className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                        Facebook Link
                      </label>
                      <input
                        type="text"
                        value={formValues.facebook || ""}
                        onChange={(e) =>
                          setFormValues((prev) => ({
                            ...prev,
                            facebook: e.target.value,
                          }))
                        }
                        placeholder="https://facebook.com/profile"
                        className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                        Twitter X Link
                      </label>
                      <input
                        type="text"
                        value={formValues.twitterX || ""}
                        onChange={(e) =>
                          setFormValues((prev) => ({
                            ...prev,
                            twitterX: e.target.value,
                          }))
                        }
                        placeholder="https://x.com/profile"
                        className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                        YouTube Link
                      </label>
                      <input
                        type="text"
                        value={formValues.youtube || ""}
                        onChange={(e) =>
                          setFormValues((prev) => ({
                            ...prev,
                            youtube: e.target.value,
                          }))
                        }
                        placeholder="https://youtube.com/channel"
                        className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Tab 3: Financials */}
                {activeFormTab === "financials" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                        Total Deal / Project Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formValues.totalAmount ?? ""}
                        onChange={(e) => {
                          const tot = e.target.value;
                          const paid = Number(formValues.paidAmount) || 0;
                          const bal =
                            tot !== "" ? Math.max(0, Number(tot) - paid) : "";
                          setFormValues((prev) => ({
                            ...prev,
                            totalAmount: tot,
                            balanceAmount: bal,
                          }));
                        }}
                        placeholder="e.g. 50000"
                        className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                        Paid Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formValues.paidAmount ?? ""}
                        onChange={(e) => {
                          const paid = e.target.value;
                          const tot =
                            formValues.totalAmount !== undefined &&
                            formValues.totalAmount !== null &&
                            formValues.totalAmount !== ""
                              ? Number(formValues.totalAmount)
                              : null;
                          const bal =
                            tot !== null
                              ? Math.max(0, tot - (Number(paid) || 0))
                              : (formValues.balanceAmount ?? "");
                          setFormValues((prev) => ({
                            ...prev,
                            paidAmount: paid,
                            balanceAmount: bal,
                          }));
                        }}
                        placeholder="e.g. 25000"
                        className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all bg-white font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                        Balance Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formValues.balanceAmount ?? ""}
                        onChange={(e) =>
                          setFormValues((prev) => ({
                            ...prev,
                            balanceAmount: e.target.value,
                          }))
                        }
                        placeholder="e.g. 25000"
                        className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all bg-white font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Tab 4: Call Details */}
                {activeFormTab === "call" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                        Status
                      </label>
                      <select
                        value={formValues.status || "Incoming"}
                        onChange={(e) =>
                          setFormValues((prev) => ({
                            ...prev,
                            status: e.target.value,
                          }))
                        }
                        className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white cursor-pointer"
                      >
                        <option value="Incoming">Incoming</option>
                        <option value="New">New</option>
                        <option value="Active">Active</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Follow-up">Follow-up</option>
                        <option value="No Answer">No Answer</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                        Handled By / Handler
                      </label>
                      <select
                        value={formValues.handledBy || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const targetU = users.find(
                            (u) => u.name === val || u.email === val,
                          );
                          setFormValues((prev) => ({
                            ...prev,
                            handledBy: val,
                            handledById: targetU
                              ? targetU.id || targetU._id
                              : val && val === (user?.name || user?.email)
                                ? user?.id || user?._id
                                : "",
                          }));
                        }}
                        className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white cursor-pointer"
                      >
                        <option value="">Unassigned (Incoming Lead)</option>
                        {user && (
                          <option value={user.name || user.email}>
                            {user.name || user.email} (Me)
                          </option>
                        )}
                        {users
                          .filter(
                            (u) =>
                              (u.name || u.email) !==
                              (user?.name || user?.email),
                          )
                          .map((u) => (
                            <option
                              key={u.id || u._id || u.email}
                              value={u.name || u.email}
                            >
                              {u.name || u.email}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                        Source Campaign
                      </label>
                      <input
                        type="text"
                        value={formValues.campaign || "Direct Outreach"}
                        onChange={(e) =>
                          setFormValues((prev) => ({
                            ...prev,
                            campaign: e.target.value,
                          }))
                        }
                        placeholder="e.g. Inbound Campaign"
                        className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                        Start Call Date
                      </label>
                      <input
                        type="date"
                        value={formValues.startCallDate || ""}
                        onChange={(e) =>
                          setFormValues((prev) => ({
                            ...prev,
                            startCallDate: e.target.value,
                          }))
                        }
                        className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                        Last Call Date
                      </label>
                      <input
                        type="date"
                        value={formValues.lastCallDate || ""}
                        onChange={(e) =>
                          setFormValues((prev) => ({
                            ...prev,
                            lastCallDate: e.target.value,
                          }))
                        }
                        className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                        Remark
                      </label>
                      <input
                        type="text"
                        value={formValues.remark || ""}
                        onChange={(e) =>
                          setFormValues((prev) => ({
                            ...prev,
                            remark: e.target.value,
                          }))
                        }
                        placeholder="Initial comments or calling observations"
                        className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                        Remark 2
                      </label>
                      <input
                        type="text"
                        value={formValues.remark2 || ""}
                        onChange={(e) =>
                          setFormValues((prev) => ({
                            ...prev,
                            remark2: e.target.value,
                          }))
                        }
                        placeholder="Follow-up notes or secondary call details"
                        className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Tab: Documents & Images */}
                {activeFormTab === "documents" && (
                  <div className="flex flex-col gap-4 animate-fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <span className="text-xs font-bold text-slate-700">
                          {leadModal.type === "add"
                            ? `Selected Images / Documents (${pendingFiles.length})`
                            : `Attached Documents (${(formValues.documents || []).length})`}
                        </span>
                        {leadModal.type === "add" &&
                          pendingFiles.length > 0 && (
                            <p className="text-[10px] text-sky-600 font-medium mt-0.5">
                              Will be uploaded automatically when you click
                              Create Lead
                            </p>
                          )}
                      </div>
                      <label
                        className={`px-3 py-1.5 font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 border ${
                          uploadingDoc
                            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                            : "bg-sky-50 hover:bg-sky-100 text-sky-600 border-sky-200/70 shadow-2xs"
                        }`}
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>
                          {uploadingDoc
                            ? "Uploading..."
                            : "Upload / Select Images"}
                        </span>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileSelect}
                          disabled={uploadingDoc}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Mode: Add Lead - Pending Files Preview */}
                    {leadModal.type === "add" ? (
                      pendingFiles.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {pendingFiles.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex flex-col bg-slate-50 border border-slate-200 p-3 rounded-md relative group"
                            >
                              {item.previewUrl ? (
                                <div className="w-full h-28 rounded-xl bg-slate-200 overflow-hidden mb-2 relative">
                                  <img
                                    src={item.previewUrl}
                                    alt={item.fileName}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute top-1.5 right-1.5 bg-slate-900/70 backdrop-blur-xs text-white p-1 rounded-md">
                                    <ImageIcon className="w-3 h-3" />
                                  </div>
                                </div>
                              ) : null}
                              <div className="flex items-center justify-between gap-2 min-w-0">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="text-xs font-semibold text-slate-700 truncate">
                                    {item.fileName}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removePendingFile(idx)}
                                  className="p-1 text-slate-400 hover:text-rose-500 rounded-md hover:bg-rose-50 transition-colors"
                                  title="Remove image"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-10 text-center bg-slate-50 border border-dashed border-slate-200 rounded-md flex flex-col items-center justify-center gap-2">
                          <UploadCloud className="w-8 h-8 text-slate-300 stroke-1" />
                          <span className="text-xs font-bold text-slate-600">
                            No Images or Files Selected
                          </span>
                          <p className="text-[11px] text-slate-400 font-medium px-6 max-w-sm">
                            Click &quot;Upload / Select Images&quot; above to
                            select photos or documents to attach while creating
                            this lead.
                          </p>
                        </div>
                      )
                    ) : /* Mode: Edit Lead - Uploaded Documents View */
                    (formValues.documents || []).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {formValues.documents.map((doc, idx) => {
                          const isImg =
                            doc.url &&
                            (/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(
                              doc.url,
                            ) ||
                              /\.(jpg|jpeg|png|webp|gif|svg)/i.test(
                                doc.fileName || "",
                              ));
                          return (
                            <div
                              key={doc._id || doc.public_id || idx}
                              className="flex flex-col bg-slate-50 border border-slate-200 p-3 rounded-md transition-all group overflow-hidden relative"
                            >
                              {isImg ? (
                                <div className="w-full h-28 rounded-xl bg-slate-200 overflow-hidden mb-2 relative group/img">
                                  <img
                                    src={doc.url}
                                    alt={doc.fileName || `Image ${idx + 1}`}
                                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                                    <a
                                      href={doc.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="bg-slate-900/70 hover:bg-slate-900 backdrop-blur-xs text-white p-1.5 rounded-lg transition-colors cursor-pointer"
                                      title="Open full image"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteDocument(
                                          leadModal.leadId,
                                          doc,
                                        )
                                      }
                                      className="bg-rose-600/90 hover:bg-rose-600 backdrop-blur-xs text-white p-1.5 rounded-lg transition-colors cursor-pointer"
                                      title="Delete image from Cloudinary"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ) : null}
                              <div className="flex items-center justify-between gap-2 min-w-0">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-semibold text-slate-700 truncate hover:text-sky-600"
                                  >
                                    {doc.fileName || `Document ${idx + 1}`}
                                  </a>
                                </div>
                                {!isImg && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteDocument(
                                        leadModal.leadId,
                                        doc,
                                      )
                                    }
                                    className="p-1 text-slate-400 hover:text-rose-500 rounded-md hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                                    title="Delete document"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium mt-1">
                                {doc.uploadedAt
                                  ? new Date(doc.uploadedAt).toLocaleDateString(
                                      "en-IN",
                                    )
                                  : ""}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-10 text-center bg-slate-50 border border-dashed border-slate-200 rounded-md flex flex-col items-center justify-center gap-2">
                        <Paperclip className="w-8 h-8 text-slate-300 stroke-1" />
                        <span className="text-xs font-bold text-slate-600">
                          No Documents or Images Attached
                        </span>
                        <p className="text-[11px] text-slate-400 font-medium px-6 max-w-sm">
                          Upload photos, contracts, or other files related to
                          this lead.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 5: Custom Details */}
                {activeFormTab === "custom" && (
                  <div className="flex flex-col gap-4 animate-fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-700">
                        Custom Lead Columns ({customColumns.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleOpenAddColumn}
                        className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-600 font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-sky-200/70"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Custom Field</span>
                      </button>
                    </div>
                    {customColumns.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {customColumns.map((col) => (
                          <div key={col.key} className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                                {col.label} ({col.type})
                              </label>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditColumn(col)}
                                  className="p-0.5 text-slate-400 hover:text-sky-600 rounded transition-colors cursor-pointer"
                                  title="Edit Field Definition"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteColumn(col.key, col.label)
                                  }
                                  className="p-0.5 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                  title="Delete Custom Field"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            {col.type === "select" ? (
                              <select
                                value={formValues[col.key] ?? ""}
                                onChange={(e) =>
                                  setFormValues((prev) => ({
                                    ...prev,
                                    [col.key]: e.target.value,
                                  }))
                                }
                                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-800 focus:border-sky-500 outline-none transition-all bg-white"
                              >
                                <option value="">Select option...</option>
                                {col.options?.map((o) => (
                                  <option key={o} value={o}>
                                    {o}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={col.type === "url" ? "text" : col.type}
                                value={formValues[col.key] ?? ""}
                                onChange={(e) =>
                                  setFormValues((prev) => ({
                                    ...prev,
                                    [col.key]: e.target.value,
                                  }))
                                }
                                placeholder={`Enter ${col.label}...`}
                                className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-md flex flex-col items-center justify-center gap-2">
                        <Layers className="w-6 h-6 text-slate-400 stroke-1" />
                        <span className="text-xs font-bold text-slate-600">
                          No Custom Fields Configured
                        </span>
                        <p className="text-[11px] text-slate-400 font-medium px-6 max-w-sm">
                          Extend your lead forms with fields like GSTIN,
                          Industry, or Alternate Email by clicking &quot;Add
                          Custom Field&quot;.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Actions Footer */}
              <div className="bg-slate-50 border-t border-slate-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setLeadModal({ isOpen: false, type: "add", leadId: null })
                    }
                    className="px-3 sm:px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <span className="text-[11px] font-bold text-slate-400 ml-1 sm:ml-2 hidden sm:inline-block">
                    Step {currentStepIndex + 1} of {FORM_STEPS.length}
                  </span>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  {currentStepIndex > 0 && (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                  )}

                  {currentStepIndex < FORM_STEPS.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs uppercase rounded-xl shadow-md shadow-sky-600/20 transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      onClick={() => {
                        isSubmitButtonClickedRef.current = true;
                      }}
                      disabled={isSubmitting || uploadingDoc}
                      className={`px-3.5 sm:px-5 py-2 sm:py-2.5 text-white font-bold text-xs uppercase rounded-xl shadow-md transition-all flex items-center gap-1.5 ${
                        isSubmitting || uploadingDoc
                          ? "bg-slate-400 cursor-not-allowed shadow-none"
                          : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 cursor-pointer"
                      }`}
                    >
                      {isSubmitting || uploadingDoc ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>
                            {pendingFiles.length > 0
                              ? "Saving & Uploading..."
                              : "Saving..."}
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {leadModal.type === "add"
                              ? "Create Lead"
                              : "Save Changes"}
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>,
          document.body,
        )}

      {/* Add / Edit Custom Column Modal */}
      {columnModal.isOpen &&
        isClient &&
        createPortal(
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-9999 flex items-center justify-center p-4 animate-fade-in">
            <form
              onSubmit={handleSaveColumnSubmit}
              className="bg-white rounded-md shadow-2xl border border-slate-200/80 w-full max-w-md overflow-hidden animate-scale-up"
            >
              <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-500" />
                  <span>
                    {columnModal.mode === "add"
                      ? "Add Dynamic Column"
                      : "Edit Column Label"}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setColumnModal({
                      isOpen: false,
                      mode: "add",
                      editingKey: null,
                    })
                  }
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                    Column Header Label <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newColLabel}
                    onChange={(e) => setNewColLabel(e.target.value)}
                    placeholder="e.g. Preferred Time, Service Interested"
                    className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all"
                  />
                </div>
                {columnModal.mode === "add" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                      Data Format Type
                    </label>
                    <select
                      value={newColType}
                      onChange={(e) => setNewColType(e.target.value)}
                      className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-800 focus:border-sky-500 outline-none transition-all bg-white cursor-pointer"
                    >
                      <option value="text">Single Line Text</option>
                      <option value="number">Number</option>
                      <option value="currency">Currency (₹)</option>
                      <option value="date">Date picker</option>
                      <option value="url">Web link / URL</option>
                      <option value="email">Email address</option>
                    </select>
                  </div>
                )}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() =>
                      setColumnModal({
                        isOpen: false,
                        mode: "add",
                        editingKey: null,
                      })
                    }
                    className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs uppercase rounded-xl shadow-md shadow-sky-600/20 transition-colors cursor-pointer"
                  >
                    {columnModal.mode === "edit"
                      ? "Update Column"
                      : "Add Column"}
                  </button>
                </div>
              </div>
            </form>
          </div>,
          document.body,
        )}

      {/* Full-Screen Image Lightbox Preview Modal */}
      {imageModal.isOpen &&
        isClient &&
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

      {/* Floating Bulk Actions Bar */}
      {selectedLeadIds.length > 0 && (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] sm:w-auto max-w-lg bg-slate-900/95 backdrop-blur-md text-white px-4 sm:px-5 py-3 rounded-md shadow-2xl border border-slate-700/80 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 sm:gap-4 animate-in slide-in-from-bottom-5 duration-200">
          <div className="text-xs font-extrabold flex items-center gap-2">
            <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-[11px] shrink-0">
              {selectedLeadIds.length}
            </span>
            <span className="truncate">lead(s) selected</span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                const selectedLeads = leads.filter((l) =>
                  selectedLeadIds.includes(l.id || l._id),
                );
                handleOpenForwardModal(selectedLeads);
              }}
              className="flex-1 sm:flex-initial justify-center px-3.5 sm:px-4 py-2 sm:py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Forward Selected</span>
            </button>
            <button
              onClick={() => setSelectedLeadIds([])}
              className="px-2.5 sm:px-3 py-1.5 text-slate-400 hover:text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Forward Lead Modal */}
      {forwardModal.isOpen &&
        isClient &&
        createPortal(
          <div className="fixed inset-0 z-99999 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="p-4 sm:p-6 bg-linear-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 sm:p-2.5 bg-white/20 backdrop-blur-md rounded-md shrink-0">
                    <Send className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-sm sm:text-base leading-snug truncate">
                      {forwardModal.leadsToForward.length > 1
                        ? `Forward ${forwardModal.leadsToForward.length} Leads`
                        : "Forward Lead"}
                    </h3>
                    <p className="text-xs text-indigo-100 font-medium truncate">
                      Assign lead responsibility to another employee
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseForwardModal}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer shrink-0 ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 space-y-4 text-xs font-semibold text-slate-700">
                {/* Selected Lead Summary */}
                {forwardModal.leadsToForward.length === 1 && (
                  <div className="bg-indigo-50/60 border border-indigo-100 rounded-md p-3.5 flex items-center justify-between flex-wrap gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-indigo-950 text-sm truncate">
                        {forwardModal.leadsToForward[0].name}
                      </div>
                      <div className="text-[11px] text-indigo-700 font-medium truncate">
                        {forwardModal.leadsToForward[0].businessName ||
                          "Individual Client"}{" "}
                        • {forwardModal.leadsToForward[0].phone}
                      </div>
                    </div>
                    {forwardModal.leadsToForward[0].handledBy ? (
                      <span className="px-2.5 py-1 bg-white text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded-lg shrink-0">
                        Currently: {forwardModal.leadsToForward[0].handledBy}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-lg shrink-0">
                        Unassigned
                      </span>
                    )}
                  </div>
                )}

                {/* Select Recipient Employee */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Select Employee <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={forwardModal.targetUserId}
                    onChange={(e) =>
                      setForwardModal((prev) => ({
                        ...prev,
                        targetUserId: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="">-- Choose Employee --</option>
                    {(users || [])
                      .filter((u) => {
                        const uId = String(u._id || u.id || "");
                        const currentUserId = String(
                          user?._id || user?.id || "",
                        );
                        const currentUserEmail = (
                          user?.email || ""
                        ).toLowerCase();
                        const uEmail = (u.email || "").toLowerCase();

                        // Exclude current user themselves
                        if (uId && currentUserId && uId === currentUserId)
                          return false;
                        if (
                          uEmail &&
                          currentUserEmail &&
                          uEmail === currentUserEmail
                        )
                          return false;

                        // Only hide admin users if current logged-in user is NOT an admin
                        if (user?.role !== "admin" && u.role === "admin")
                          return false;

                        return true;
                      })
                      .map((u) => (
                        <option
                          key={u._id || u.id || u.email}
                          value={u._id || u.id || u.email}
                        >
                          {u.name || u.email} ({u.email})
                        </option>
                      ))}
                  </select>
                  {(!users || users.length === 0) && (
                    <p className="text-[11px] text-amber-600 font-medium mt-1">
                      No registered employees found.
                    </p>
                  )}
                </div>

                {/* Optional Remark / Note */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Forwarding Note / Reason{" "}
                    <span className="text-slate-400 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    value={forwardModal.remark}
                    onChange={(e) =>
                      setForwardModal((prev) => ({
                        ...prev,
                        remark: e.target.value,
                      }))
                    }
                    placeholder="Add a message or context for the recipient employee..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseForwardModal}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-200/70 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={
                    !forwardModal.targetUserId || forwardModal.isSubmitting
                  }
                  onClick={handleConfirmForward}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {forwardModal.isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Forwarding...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Confirm Forward</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Schedule Follow-Up Modal */}
      {scheduleFollowUpModal.isOpen &&
        createPortal(
          <div className="fixed inset-0 z-99999 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="p-4 sm:p-6 bg-linear-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 sm:p-2.5 bg-white/20 backdrop-blur-md rounded-md shrink-0">
                    <Calendar className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-sm sm:text-base leading-snug truncate">
                      Schedule Follow-Up
                    </h3>
                    <p className="text-xs text-blue-100 font-medium truncate">
                      Add a follow-up task for{" "}
                      {scheduleFollowUpModal.lead?.name || "Client"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseScheduleFollowUp}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer shrink-0 ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 space-y-4 text-xs font-semibold text-slate-700">
                {/* Client Info Banner */}
                <div className="bg-blue-50/60 border border-blue-100 rounded-md p-3.5 flex items-center justify-between flex-wrap gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 text-sm truncate">
                      {scheduleFollowUpModal.lead?.name}
                    </div>
                    <div className="text-[11px] text-blue-700 font-medium font-mono truncate">
                      {scheduleFollowUpModal.lead?.phone} •{" "}
                      {scheduleFollowUpModal.lead?.businessName || "Client"}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-lg shrink-0">
                    {scheduleFollowUpModal.lead?.status || "Active"}
                  </span>
                </div>

                {/* Follow-Up Date & Time Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Follow-Up Date & Time</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleFollowUpModal.scheduledAt}
                    onChange={(e) =>
                      setScheduleFollowUpModal((prev) => ({
                        ...prev,
                        scheduledAt: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  />
                </div>

                {/* Follow-Up Description / Note */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Follow-Up Task / Note</span>
                  </label>
                  <textarea
                    rows={3}
                    value={scheduleFollowUpModal.description}
                    onChange={(e) =>
                      setScheduleFollowUpModal((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Enter discussion topics, call agenda, or reminders..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseScheduleFollowUp}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-200/70 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={
                    !scheduleFollowUpModal.scheduledAt ||
                    scheduleFollowUpModal.isSubmitting
                  }
                  onClick={handleConfirmScheduleFollowUp}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {scheduleFollowUpModal.isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Scheduling...</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Confirm Schedule</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-99999 px-4 py-3 rounded-md shadow-2xl border text-xs font-bold flex items-center gap-2.5 animate-bounce-in max-w-sm sm:max-w-md ${
            toast.type === "error"
              ? "bg-rose-900 text-white border-rose-700"
              : "bg-slate-900 text-white border-slate-700"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
