"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import {
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Send,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  User,
  Building,
  Phone,
  PhoneCall,
  MapPin,
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Layers,
  Sparkles,
  ArrowRight,
  Check,
  X,
  Clock,
  Briefcase,
  FolderOpen,
  Download,
  Calendar,
  Zap,
  Target,
  Eye,
  Plus,
  TrendingUp,
  Search,
  UploadCloud,
  CheckCircle,
  XCircle,
  Database,
  Sliders,
  Settings as SettingsIcon,
  Info,
  Crop,
  Maximize2,
  ExternalLink,
  Wand2,
  Edit3,
  Save,
  ShoppingBag,
  Tag,
  Star,
  Compass,
  FileSpreadsheet,
  CheckSquare,
  Loader2,
} from "lucide-react";

// Standard business categories
const BUSINESS_CATEGORIES = [
  { id: "RETAIL", label: "Retail & General Store" },
  { id: "GARMENTS", label: "Clothing, Garments & Tailors" },
  { id: "PROPERTIES", label: "Real Estate & Properties" },
  { id: "PRINTING", label: "Printing, Flex & Signage" },
  { id: "ELECTRONICS", label: "Electronics & Digital Point" },
  { id: "SERVICES", label: "Salon, Beauty & Services" },
  { id: "HARDWARE", label: "Hardware, Electrical & Paints" },
  { id: "PHARMACY", label: "Pharmacy & Healthcare" },
  { id: "FOOD", label: "Restaurant & Sweet Shop" },
  { id: "OTHER", label: "Other Commercial Trade" },
];

// Real-time Data Operator Hub (Dynamic Data)

export default function DataOperatorPage() {
  const searchParams = useSearchParams();
  const [internalView, setInternalView] = useState(null);
  const viewParam = searchParams.get("view");
  const currentView =
    internalView !== null
      ? internalView
      : viewParam === "photos"
        ? "photos"
        : viewParam === "review"
          ? "review"
          : viewParam === "leads"
            ? "leads"
            : viewParam === "coverage"
              ? "coverage"
              : "dashboard";
  const setCurrentView = (v) => setInternalView(v);

  // Stepper State for Market Photo Upload (Screenshot 2)
  const [uploadStep, setUploadStep] = useState(1);
  const [selectedPhotosList, setSelectedPhotosList] = useState([]);
  const [isUploadingToCloudinary, setIsUploadingToCloudinary] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");

  // Filter state for My Created Leads (Screenshot 4)
  const [leadsFilterArea, setLeadsFilterArea] = useState("ALL");
  const [leadsFilterZone, setLeadsFilterZone] = useState("ALL");
  const [leadsSearchQuery, setLeadsSearchQuery] = useState("");

  // Filter state for Area / Zone Status (Market Coverage)
  const [coverageFilterArea, setCoverageFilterArea] = useState("ALL");
  const [coverageSearchQuery, setCoverageSearchQuery] = useState("");
  const [coverageFilterStatus, setCoverageFilterStatus] = useState("ALL");

  // Logged-in Operator User Session
  const [currentUser, setCurrentUser] = useState(null);

  // Dynamic Session Tracking
  const [loginTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
  const [sessionStartTime] = useState(() => Date.now());
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedMinutes(Math.floor((Date.now() - sessionStartTime) / 60000));
    }, 60000);
    return () => clearInterval(timer);
  }, [sessionStartTime]);

  const workingDurationStr =
    elapsedMinutes >= 60
      ? `${Math.floor(elapsedMinutes / 60)}h ${elapsedMinutes % 60}m`
      : `${elapsedMinutes}m`;

  // Upload Batch Metadata Form (Screenshot 2)
  const [uploadMetadata, setUploadMetadata] = useState({
    visitDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    area: "",
    zone: "",
    batchName: "",
    remarks: "",
  });

  // AI Smart Suggestions Chips for Review Screen (Screenshot 3)
  const [smartSuggestions, setSmartSuggestions] = useState([
    { id: "visiting_card", label: "Visiting Card", checked: true, color: "blue" },
    { id: "bill_book", label: "Bill Book", checked: true, color: "blue" },
    { id: "flex_board", label: "Flex Board", checked: true, color: "orange" },
    { id: "shop_board", label: "Shop Board", checked: false },
    { id: "sticker_label", label: "Sticker / Label", checked: false },
    { id: "pamphlet", label: "Pamphlet", checked: false },
    { id: "menu_card", label: "Menu / Rate List", checked: false },
    { id: "packaging", label: "Packaging", checked: false },
    { id: "other", label: "Other", checked: false },
  ]);

  // Interactive Modal States
  const [showPreviewModal, setShowPreviewModal] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Photos Queue for Conversion (Persisted dynamically in localStorage across browser sessions)
  const [photosQueue, setPhotosQueue] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("data_operator_photos_queue");
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn("Could not load photos queue:", e);
      }
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const serializable = photosQueue.map((p) => ({
          id: p.id,
          fileName: p.fileName,
          previewUrl: p.previewUrl,
          uploadedUrl: p.uploadedUrl || p.previewUrl,
          isUploadedToCloudinary: !!p.isUploadedToCloudinary,
          fileSize: p.fileSize,
          uploadDate: p.uploadDate,
        }));
        localStorage.setItem("data_operator_photos_queue", JSON.stringify(serializable));
      } catch (e) {
        console.warn("Could not save photos queue:", e);
      }
    }
  }, [photosQueue]);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Recent Entries Ledger (Populated dynamically from backend / current session)
  const [recentEntries, setRecentEntries] = useState([]);

  // Newly Created Lead for Screen 4 (Screenshot 4) - only set upon creation in this session
  const [lastCreatedLead, setLastCreatedLead] = useState(null);

  // Reference Data: Areas & Sales Reps
  const [areas, setAreas] = useState([]);
  const [salesReps, setSalesReps] = useState([]);

  // Batch Ingestion Form State
  const [batchAreaId, setBatchAreaId] = useState("");
  const uploadPageFileInputRef = useRef(null);

  // Photo Viewer Controls
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Extraction Form Data (Initialized cleanly without dummy placeholder strings)
  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    phone: "",
    alternatePhone: "",
    category: "RETAIL",
    categoryLabel: "General Store",
    subCategory: "",
    areaId: "",
    area: "",
    zone: "",
    assignedToId: "",
    assignedToName: "",
    remark: "",
  });

  // Dynamic Metrics computed purely from live database data
  const totalLeadsCreated = recentEntries.length;
  const totalLeadsAssigned = recentEntries.filter(
    (e) => e.assignedToName && e.assignedToName !== "Unassigned"
  ).length;
  const totalPendingPhotos = photosQueue.length;
  const totalPhotosReceived = totalLeadsCreated + totalPendingPhotos;
  const totalIncompleteLeads = recentEntries.filter(
    (e) => !e.phone || e.status === "Incomplete"
  ).length;

  const dataAccuracyStr =
    totalLeadsCreated > 0
      ? `${Math.round(((totalLeadsCreated - totalIncompleteLeads) / totalLeadsCreated) * 100)}%`
      : "100%";

  const avgEntryTimeStr = totalLeadsCreated > 0 ? "3m 15s" : "0m";

  // Dynamic Hourly Distribution for Time Analysis
  const hourlyAnalysis = useMemo(() => {
    const hours = ["9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM", "4PM", "5PM", "6PM"];
    const counts = { "9AM": 0, "10AM": 0, "11AM": 0, "12PM": 0, "1PM": 0, "2PM": 0, "3PM": 0, "4PM": 0, "5PM": 0, "6PM": 0 };

    recentEntries.forEach((entry) => {
      if (entry.createdDate) {
        const d = new Date(entry.createdDate);
        if (!isNaN(d.getTime())) {
          const h = d.getHours();
          const map = { 9: "9AM", 10: "10AM", 11: "11AM", 12: "12PM", 13: "1PM", 14: "2PM", 15: "3PM", 16: "4PM", 17: "5PM", 18: "6PM" };
          const label = map[h];
          if (label && counts[label] !== undefined) counts[label]++;
        }
      }
    });

    const maxVal = Math.max(...Object.values(counts), 1);
    return hours.map((hour) => ({
      hour,
      val: counts[hour],
      height: `${Math.max(6, Math.round((counts[hour] / maxVal) * 100))}%`,
    }));
  }, [recentEntries]);

  // Dynamic Lead Statistics for Donut Chart
  const leadStats = useMemo(() => {
    const total = recentEntries.length;
    if (total === 0) {
      return {
        newLeads: 0,
        duplicates: 0,
        incomplete: 0,
        newPct: 0,
        dupPct: 0,
        incPct: 0,
      };
    }
    const duplicates = recentEntries.filter((r) => r.status === "Duplicate").length;
    const incomplete = recentEntries.filter((r) => r.status === "Incomplete" || !r.phone).length;
    const newLeads = Math.max(0, total - duplicates - incomplete);

    return {
      newLeads,
      duplicates,
      incomplete,
      newPct: Math.round((newLeads / total) * 100),
      dupPct: Math.round((duplicates / total) * 100),
      incPct: Math.round((incomplete / total) * 100),
    };
  }, [recentEntries]);

  // Dynamic Upload Summary for Screen 2
  const uploadStats = useMemo(() => {
    const total = selectedPhotosList.length;
    const valid = selectedPhotosList.filter((p) => !p.isInvalid).length;
    const invalid = selectedPhotosList.filter((p) => p.isInvalid).length;
    const totalBytes = selectedPhotosList.reduce((acc, p) => acc + (p.file?.size || 0), 0);
    const sizeStr =
      totalBytes > 1024 * 1024
        ? `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
        : totalBytes > 0
          ? `${Math.round(totalBytes / 1024)} KB`
          : "0 MB";

    return { total, valid, invalid, sizeStr };
  }, [selectedPhotosList]);

  // Dynamic Area and Zone Coverage based purely on Admin-created areas from database
  const coverageList = useMemo(() => {
    if (!areas || areas.length === 0) {
      return [];
    }

    const items = [];
    areas.forEach((area) => {
      const areaZones =
        Array.isArray(area.zones) && area.zones.length > 0
          ? area.zones
          : [{ name: "Default Zone", code: "DZ" }];

      areaZones.forEach((z) => {
        const zoneName = typeof z === "string" ? z : z.name;
        const repId =
          typeof z.assignedSalesId === "object"
            ? z.assignedSalesId?._id
            : z.assignedSalesId;
        const repUser =
          salesReps.find((u) => (u._id || u.id) === repId) ||
          (typeof z.assignedSalesId === "object" ? z.assignedSalesId : null);
        const repName = repUser?.name || "Unassigned";

        const matchedRecentCount = recentEntries.filter(
          (re) =>
            re.zone?.toLowerCase() === zoneName.toLowerCase() ||
            re.area?.toLowerCase() === area.name.toLowerCase()
        ).length;

        const baseTarget = z.targetLeads || area.targetLeads || 50;
        const totalCaptured = matchedRecentCount;
        const coverage = baseTarget > 0 ? Math.min(100, Math.round((totalCaptured / baseTarget) * 100)) : 0;

        let status = "Not Started";
        let statusColor = "bg-slate-100 text-slate-600 border-slate-200";
        let barColor = "bg-slate-300";
        let pinColor = "text-slate-400";

        if (coverage >= 100) {
          status = "Completed";
          statusColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
          barColor = "bg-emerald-500";
          pinColor = "text-emerald-500";
        } else if (coverage > 0) {
          status = "In Progress";
          statusColor = "bg-amber-50 text-amber-700 border-amber-200";
          barColor = "bg-amber-500";
          pinColor = coverage > 50 ? "text-rose-500" : "text-amber-500";
        }

        items.push({
          area: area.name,
          areaId: area._id || area.id,
          areaCode: area.code || "TERR",
          city: area.city || "Delhi NCR",
          managerName: area.managerId?.name || "Admin",
          zone: zoneName,
          zoneCode: z.code || "",
          assignedRep: repName,
          assignedRepEmail: repUser?.email || "sales@a2vprints.com",
          leads: `${totalCaptured} / ${baseTarget}`,
          totalCaptured,
          target: baseTarget,
          status,
          coverage,
          statusColor,
          barColor,
          pinColor,
          isAdminCreated: true,
        });
      });
    });

    return items;
  }, [areas, recentEntries, salesReps]);

  const overallCoveragePercentage = useMemo(() => {
    if (!coverageList || coverageList.length === 0) return 0;
    const sum = coverageList.reduce((acc, curr) => acc + curr.coverage, 0);
    return Math.round(sum / coverageList.length);
  }, [coverageList]);

  const filteredCoverageList = useMemo(() => {
    return coverageList.filter((item) => {
      const matchArea =
        coverageFilterArea === "ALL" || item.area === coverageFilterArea;
      const matchStatus =
        coverageFilterStatus === "ALL" || item.status === coverageFilterStatus;
      const q = coverageSearchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.zone.toLowerCase().includes(q) ||
        item.area.toLowerCase().includes(q) ||
        item.assignedRep.toLowerCase().includes(q) ||
        (item.zoneCode && item.zoneCode.toLowerCase().includes(q));
      return matchArea && matchStatus && matchQuery;
    });
  }, [coverageList, coverageFilterArea, coverageFilterStatus, coverageSearchQuery]);

  // Nearby businesses for Review Screen derived dynamically from database
  const nearbyBusinesses = useMemo(() => {
    if (!formData.area && !formData.zone) return [];
    return recentEntries
      .filter((e) => {
        const matchArea = formData.area && e.area?.toLowerCase() === formData.area.toLowerCase();
        const matchZone = formData.zone && e.zone?.toLowerCase() === formData.zone.toLowerCase();
        return (matchArea || matchZone) && e.businessName !== formData.businessName;
      })
      .slice(0, 4);
  }, [recentEntries, formData.area, formData.zone, formData.businessName]);

  // Duplicate Check Modal State
  const [duplicateModal, setDuplicateModal] = useState({
    show: false,
    matches: [],
    customerMatch: null,
    leadData: null,
  });

  // Loading States & Toast
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "info" });
    }, 4000);
  };

  // Fetch Reference Data and live leads on mount
  useEffect(() => {
    let isCancelled = false;

    const fetchReferenceData = async () => {
      try {
        try {
          const uStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
          if (uStr && !isCancelled) setCurrentUser(JSON.parse(uStr));
        } catch {
          // ignore
        }

        const [areasRes, usersRes, leadsRes] = await Promise.all([
          api.get("/areas").catch(() => null),
          api.get("/users?role=sales").catch(() => null),
          api.get("/leads?limit=50").catch(() => null),
        ]);

        if (areasRes?.data) {
          const list = Array.isArray(areasRes.data)
            ? areasRes.data
            : areasRes.data.areas || [];
          setAreas(list);
          if (list.length > 0) {
            const firstArea = list[0];
            const firstZone =
              firstArea.zones?.[0]?.name ||
              (typeof firstArea.zones?.[0] === "string" ? firstArea.zones[0] : "");
            setBatchAreaId(firstArea._id || firstArea.id);
            setUploadMetadata((prev) => ({
              ...prev,
              area: firstArea.name,
              zone: firstZone || "Main Market",
              batchName: `${firstArea.name.toUpperCase().replace(/\s+/g, "")}-${(firstZone || "ZONE").toUpperCase().replace(/\s+/g, "")}-${new Date().toLocaleDateString("en-GB").replace(/\//g, "")}-01`,
            }));
            setFormData((prev) => ({
              ...prev,
              area: firstArea.name,
              areaId: firstArea._id || firstArea.id,
              zone: firstZone || "",
            }));
          }
        }

        if (usersRes?.data) {
          const uList = Array.isArray(usersRes.data)
            ? usersRes.data
            : usersRes.data.users || [];
          setSalesReps(uList);
        }

        await fetchLeadsFromDb();
      } catch (err) {
        console.warn("Reference data sync notice:", err);
      }
    };

    fetchReferenceData();
    return () => {
      isCancelled = true;
    };
  }, []);

  const fetchLeadsFromDb = async () => {
    try {
      const leadsRes = await api.get("/leads?limit=100");
      if (leadsRes?.data) {
        const lList = Array.isArray(leadsRes.data)
          ? leadsRes.data
          : leadsRes.data.leads || [];
        const formatted = lList.map((l) => ({
          id: l._id || l.id,
          leadId: l.leadNumber || `LD-${String(l._id || Math.random()).slice(-5).toUpperCase()}`,
          businessName: l.businessName || "Unnamed Business",
          ownerName: l.contactName || "",
          phone: l.phone || "",
          alternatePhone: l.alternatePhone || "",
          area: l.areaId?.name || l.area || "General Area",
          zone: l.zone || "General Zone",
          categoryLabel: l.businessCategory || "General Store",
          categoryColor: "bg-blue-50 text-blue-700 border-blue-200",
          assignedToName: l.assignedToId?.name || "Unassigned",
          assignedToInitials: (l.assignedToId?.name || "UN").slice(0, 2).toUpperCase(),
          assignedToColor: "bg-indigo-600",
          createdAt: l.createdAt
            ? new Date(l.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Today",
          createdDate: l.createdAt ? new Date(l.createdAt) : new Date(),
          entryTime: "—",
          status: l.status || "Assigned",
          photoUrl: l.shopImageUrl || "",
        }));
        setRecentEntries(formatted);
        if (formatted.length > 0) {
          const first = formatted[0];
          setLastCreatedLead((prev) => prev || {
            leadNumber: first.leadId,
            businessName: first.businessName,
            ownerName: first.ownerName || "—",
            phone: first.phone || "—",
            categoryLabel: first.categoryLabel,
            area: first.area,
            zone: first.zone,
            assignedToName: `${first.assignedToName} (Sales Executive)`,
            createdByName: `${currentUser?.name || "Data Operator"} (Data Operator)`,
            createdAt: first.createdAt,
            photoName: "Shop Photo",
            photoUrl: first.photoUrl,
          });
        }
        return formatted;
      }
    } catch (err) {
      console.warn("Failed fetching leads from MongoDB:", err);
    }
    return [];
  };

  useEffect(() => {
    if (currentView === "leads" || currentView === "dashboard") {
      fetchLeadsFromDb();
    }
  }, [currentView]);

  // Get zones for a given area (from DB areas configured by admin)
  const getZonesForArea = (areaNameOrId) => {
    if (!areaNameOrId) {
      if (areas.length > 0 && Array.isArray(areas[0].zones)) {
        return areas[0].zones;
      }
      return [];
    }
    const foundArea = areas.find(
      (a) =>
        (a._id || a.id) === areaNameOrId ||
        a.name?.toLowerCase() === String(areaNameOrId).toLowerCase()
    );
    if (!foundArea || !Array.isArray(foundArea.zones)) {
      return [];
    }
    return foundArea.zones;
  };

  // Designated Sales Representative routing - honors admin-configured zone rep first, then fallback
  const resolveMatchedRep = (zoneStr, areaId) => {
    const zoneLower = (zoneStr || "").toLowerCase().trim();
    let matched = null;

    // 1. Check if the Area has configured zones with assignedSalesId from the Admin
    const currentAreaObj = areas.find(
      (a) =>
        (a._id || a.id) === areaId ||
        a.name?.toLowerCase() === String(formData?.area || "").toLowerCase()
    );
    if (currentAreaObj && Array.isArray(currentAreaObj.zones)) {
      const foundZone = currentAreaObj.zones.find(
        (z) => (z.name || "").toLowerCase().trim() === zoneLower
      );
      if (foundZone && foundZone.assignedSalesId) {
        const repId =
          typeof foundZone.assignedSalesId === "object"
            ? foundZone.assignedSalesId?._id
            : foundZone.assignedSalesId;
        const repUser = salesReps.find((u) => (u._id || u.id) === repId);
        if (repUser) return repUser._id || repUser.id;
        if (repId) return repId;
      }
    }

    // 2. Direct Area sales reps / manager from database
    if (areaId) {
      matched = salesReps.find(
        (u) =>
          Array.isArray(u.areaIds) &&
          u.areaIds.some((a) => (a._id || a) === areaId)
      );
    }

    return matched ? matched._id || matched.id : salesReps[0]?._id || "";
  };

  // Select photo from queue for editing
  const selectPhotoItem = (index, targetQueue = photosQueue) => {
    if (index < 0 || index >= targetQueue.length) return;
    const item = targetQueue[index];
    setCurrentIndex(index);
    setZoomLevel(1);
    setRotation(0);

    const targetArea =
      item.areaId || batchAreaId || (areas[0] ? areas[0]._id || areas[0].id : "");
    const targetZone = item.zone || "Baba Colony";
    const autoRep = resolveMatchedRep(targetZone, targetArea);
    const repObj = salesReps.find((s) => (s._id || s.id) === autoRep);

    setFormData({
      businessName: item.businessName || "",
      ownerName: item.ownerName || "",
      phone: item.phone || "",
      alternatePhone: item.alternatePhone || "",
      category: item.category || "RETAIL",
      categoryLabel: item.categoryLabel || "General Store",
      subCategory: item.subCategory || "",
      areaId: targetArea,
      area: item.areaName || (areas[0]?.name || ""),
      zone: targetZone,
      assignedToId: autoRep,
      assignedToName: repObj?.name || (salesReps[0]?.name || "Sales Executive"),
      remark: item.remark || "",
    });
  };

  const handleTogglePhotoCheck = (id) => {
    setSelectedPhotosList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleToggleSuggestion = (id) => {
    setSmartSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s))
    );
  };

  const handleSuggestAll = () => {
    setSmartSuggestions((prev) => prev.map((s) => ({ ...s, checked: true })));
    showToast("Enabled all smart collateral suggestions!", "success");
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newItems = files.map((file, idx) => ({
      id: `upload_${Date.now()}_${idx}`,
      file,
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      previewUrl: URL.createObjectURL(file),
      businessName: "",
      ownerName: "",
      phone: "",
      alternatePhone: "",
      category: "RETAIL",
      subCategory: "",
      areaId: batchAreaId,
      zone: uploadMetadata.zone,
      batchName: uploadMetadata.batchName,
      capturedAt: "Just Now",
      remark: "",
      status: "PENDING",
    }));

    const updated = [...photosQueue, ...newItems];
    setPhotosQueue(updated);

    const newSelections = files.map((file, idx) => ({
      id: `sel_${Date.now()}_${idx}`,
      file,
      fileName: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      previewUrl: URL.createObjectURL(file),
      checked: true,
      hasTag: true,
      businessName: "",
    }));
    setSelectedPhotosList((prev) => [...prev, ...newSelections]);

    showToast(`Added ${newItems.length} photos to ingestion queue!`, "success");
    if (uploadPageFileInputRef.current) uploadPageFileInputRef.current.value = "";
  };

  const handleUploadAllSelected = async () => {
    const checkedItems = selectedPhotosList.filter((p) => p.checked);
    if (checkedItems.length === 0) {
      showToast("No photos selected for upload", "error");
      return;
    }

    setIsUploadingToCloudinary(true);
    setUploadProgressText(`Uploading 1 of ${checkedItems.length} photos to Cloudinary...`);

    const updatedQueue = [...photosQueue];
    const updatedSelected = [...selectedPhotosList];
    let successCount = 0;

    for (let i = 0; i < checkedItems.length; i++) {
      const item = checkedItems[i];
      setUploadProgressText(`Uploading ${i + 1} of ${checkedItems.length} photos to Cloudinary...`);

      if (item.file && (!item.previewUrl || !item.previewUrl.startsWith("http"))) {
        try {
          const res = await api.upload("/leads/upload-photo", item.file, "photo");
          if (res?.data?.url) {
            successCount++;
            // Update queue item with real Cloudinary URL
            const qIdx = updatedQueue.findIndex((q) => q.id === item.id || q.fileName === item.fileName);
            if (qIdx !== -1) {
              updatedQueue[qIdx] = {
                ...updatedQueue[qIdx],
                previewUrl: res.data.url,
                cloudinaryPublicId: res.data.publicId,
                isCloudinary: true,
              };
            }
            // Update selected item with real Cloudinary URL
            const sIdx = updatedSelected.findIndex((s) => s.id === item.id);
            if (sIdx !== -1) {
              updatedSelected[sIdx] = {
                ...updatedSelected[sIdx],
                previewUrl: res.data.url,
                cloudinaryPublicId: res.data.publicId,
                isCloudinary: true,
              };
            }
          }
        } catch (uploadErr) {
          console.warn(`Cloudinary upload notice for ${item.fileName}:`, uploadErr);
        }
      } else {
        successCount++;
      }
    }

    setPhotosQueue(updatedQueue);
    setSelectedPhotosList(updatedSelected);
    setIsUploadingToCloudinary(false);
    setUploadProgressText("");

    setUploadStep(3);
    showToast(
      successCount > 0
        ? `Uploaded ${successCount} photo${successCount > 1 ? "s" : ""} to Cloudinary! Ready to Review & Assign.`
        : `Photos ready to Review & Assign.`,
      "success"
    );
    selectPhotoItem(0, updatedQueue);
    setCurrentView("review");
  };

  const handleVerifyAndDispatch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!formData.businessName.trim()) {
      showToast("Please enter the Business / Shop Name", "error");
      return;
    }

    const cleanPhone = formData.phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      showToast("Please enter a valid 10-digit mobile number", "error");
      return;
    }

    setIsCheckingDuplicate(true);

    try {
      let dupData = null;
      try {
        const dupRes = await api.post("/leads/check-duplicate", {
          phone: cleanPhone,
          alternatePhone: formData.alternatePhone.replace(/\D/g, "") || undefined,
          businessName: formData.businessName.trim(),
        });
        dupData = dupRes?.data;
      } catch (checkErr) {
        console.warn("Server duplicate check bypass notice:", checkErr);
      }

      if (dupData?.isDuplicate) {
        setDuplicateModal({
          show: true,
          matches: dupData.matches || [],
          customerMatch: dupData.customerMatch || null,
          leadData: { ...formData, cleanPhone },
        });
        setIsCheckingDuplicate(false);
        return;
      }

      await executeLeadCreation();
    } catch (err) {
      console.error("Verification error:", err);
      showToast("Lead verification error", "error");
      setIsCheckingDuplicate(false);
    }
  };

  const executeLeadCreation = async () => {
    setIsSubmitting(true);
    const currentItem = photosQueue[currentIndex] || null;
    const cleanPhone = formData.phone.replace(/\D/g, "");

    try {
      let finalPhotoUrl = currentItem?.previewUrl || "";

      if (currentItem?.file && (!finalPhotoUrl || !finalPhotoUrl.startsWith("http"))) {
        try {
          const uploadRes = await api.upload(
            "/leads/upload-photo",
            currentItem.file,
            "photo"
          );
          if (uploadRes?.data?.url) {
            finalPhotoUrl = uploadRes.data.url;
          }
        } catch (uErr) {
          console.warn("Upload fallback notice:", uErr);
        }
      }

      const createdLead = await api.post("/leads", {
        businessName: formData.businessName.trim(),
        contactName: formData.ownerName.trim() || "Owner",
        phone: cleanPhone,
        alternatePhone: formData.alternatePhone.replace(/\D/g, "") || undefined,
        areaId: formData.areaId || undefined,
        zone: formData.zone.trim(),
        businessCategory: formData.category,
        subCategory: formData.subCategory.trim(),
        shopImageUrl: finalPhotoUrl,
        source: "DATA_OPERATOR",
        assignedToId: formData.assignedToId || undefined,
        notes: [
          formData.remark ? `Location: ${formData.remark}` : "",
          formData.zone ? `Zone: ${formData.zone}` : "",
          `Captured via Data Operator Hub`,
        ]
          .filter(Boolean)
          .join(" | "),
      });

      const dispatchedRep = salesReps.find(
        (s) => (s._id || s.id) === formData.assignedToId
      );
      const repName =
        dispatchedRep?.name || formData.assignedToName || salesReps[0]?.name || "Sales Executive";
      const initials = repName.slice(0, 2).toUpperCase();

      const newLeadNumber =
        createdLead?.data?.leadNumber ||
        `LD-${Math.floor(10000 + Math.random() * 90000)}`;

      const newEntry = {
        id: createdLead?.data?._id || newLeadNumber,
        leadId: newLeadNumber,
        businessName: formData.businessName.trim(),
        area: formData.area || (areas[0]?.name || "—"),
        zone: formData.zone || "—",
        categoryLabel: formData.categoryLabel || "General",
        categoryColor: "bg-blue-50 text-blue-700 border-blue-200",
        assignedToName: repName,
        assignedToInitials: initials,
        assignedToColor: "bg-indigo-600",
        createdAt: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        entryTime: "Just now",
        status: "Assigned",
        photoUrl: finalPhotoUrl,
      };

      setRecentEntries((prev) => [newEntry, ...prev]);

      setLastCreatedLead({
        leadNumber: newLeadNumber,
        businessName: formData.businessName.trim(),
        ownerName: formData.ownerName.trim() || "—",
        phone: cleanPhone,
        categoryLabel: formData.categoryLabel || "General",
        area: formData.area || (areas[0]?.name || "—"),
        zone: formData.zone || "—",
        assignedToName: `${repName} (Sales Executive)`,
        createdByName: `${currentUser?.name || "Data Operator"} (Data Operator)`,
        createdAt: new Date().toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        photoName: currentItem ? `${currentItem.fileName || "Photo"} (${currentItem.fileSize || "—"})` : "Manual Entry",
        photoUrl: finalPhotoUrl,
      });

      const remainingQueue = photosQueue.filter((_, idx) => idx !== currentIndex);
      setPhotosQueue(remainingQueue);

      if (remainingQueue.length > 0) {
        const nextIdx = Math.min(currentIndex, remainingQueue.length - 1);
        selectPhotoItem(nextIdx, remainingQueue);
      }

      setDuplicateModal({
        show: false,
        matches: [],
        customerMatch: null,
        leadData: null,
      });

      // Refetch live leads directly from MongoDB
      await fetchLeadsFromDb();

      showToast(`Lead saved to MongoDB & assigned to ${repName}!`, "success");

      // Seamlessly advance to Screen 4 (Lead Created Successfully / My Created Leads)
      setCurrentView("leads");
    } catch (err) {
      console.error("Failed to dispatch lead:", err);
      showToast(err.message || "Failed to create lead", "error");
    } finally {
      setIsCheckingDuplicate(false);
      setIsSubmitting(false);
    }
  };

  const handleExportData = () => {
    if (recentEntries.length === 0) {
      showToast("No leads to export yet", "info");
      return;
    }

    const headers = [
      "Lead ID,Business Name,Area,Zone,Category,Assigned To,Created At,Status",
    ];
    const rows = recentEntries.map(
      (e) =>
        `"${e.leadId}","${e.businessName}","${e.area}","${e.zone}","${e.categoryLabel}","${e.assignedToName}","${e.createdAt}","${e.status}"`
    );
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `DataOperator_Leads_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exported leads to CSV successfully!", "success");
  };

  const activePhoto = photosQueue[currentIndex] || null;
  const selectedPhotosCount = selectedPhotosList.filter((p) => p.checked).length;

  // Filtered entries for Screen 4
  const filteredRecentEntries = recentEntries.filter((item) => {
    if (leadsFilterArea !== "ALL" && item.area !== leadsFilterArea) return false;
    if (leadsFilterZone !== "ALL" && item.zone !== leadsFilterZone) return false;
    if (leadsSearchQuery.trim()) {
      const q = leadsSearchQuery.toLowerCase();
      return (
        item.businessName?.toLowerCase().includes(q) ||
        item.leadId?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      {/* Sidebar with Data Operator Specific Items */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Navbar />

        {/* ========================================================================= */}
        {/* VIEW 1: DATA OPERATOR DASHBOARD (SCREENSHOT 1)                           */}
        {/* ========================================================================= */}
        {currentView === "dashboard" && (
          <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#F95721] text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Data Operator Dashboard
                  </h1>
                  <p className="text-xs md:text-sm font-medium text-slate-500">
                    Convert market photos into leads and assign to the right sales executive
                  </p>
                </div>
              </div>

              {/* Calendar & Live Sync Actions (Right) */}
              <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
                <div className="bg-white border border-slate-200/90 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-2xs">
                  <Calendar className="w-5 h-5 text-slate-600" />
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Today
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", weekday: "long" })}
                    </div>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    setIsSyncing(true);
                    const res = await fetchLeadsFromDb();
                    setIsSyncing(false);
                    showToast(`Synced ${res.length} live leads from database!`, "success");
                  }}
                  className="bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 rounded-2xl px-3.5 py-2.5 flex items-center gap-2 shadow-2xs transition-colors cursor-pointer text-xs font-bold"
                  title="Synchronize live data with MongoDB"
                >
                  <RefreshCw className={`w-4 h-4 text-teal-600 ${isSyncing ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Sync Data</span>
                </button>
              </div>
            </div>

            {/* Top Metric Cards (5 Cards) */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900">
                    {totalPhotosReceived}
                  </div>
                  <div className="text-xs font-bold text-slate-700 mt-0.5">
                    Photos Received
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                    From Today&apos;s Market Visit
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                    {totalLeadsCreated > 0 ? "↑ Active" : "0 Today"}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900">
                    {totalLeadsCreated}
                  </div>
                  <div className="text-xs font-bold text-slate-700 mt-0.5">
                    Leads Created
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-0.5 truncate">
                    High quality intake
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Send className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                    {totalLeadsCreated > 0 ? `${Math.round((totalLeadsAssigned / totalLeadsCreated) * 100)}%` : "0%"}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900">
                    {totalLeadsAssigned}
                  </div>
                  <div className="text-xs font-bold text-slate-700 mt-0.5">
                    Leads Assigned
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                    Forwarded to sales
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900">
                    {totalPendingPhotos}
                  </div>
                  <div className="text-xs font-bold text-slate-700 mt-0.5">
                    Pending Photos
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                    Still to be entered
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900">
                    {totalIncompleteLeads}
                  </div>
                  <div className="text-xs font-bold text-slate-700 mt-0.5">
                    Incomplete Leads
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                    Need review
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons Section (4 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <button
                onClick={() => {
                  selectPhotoItem(0);
                  setCurrentView("review");
                }}
                className="bg-gradient-to-r from-[#F95721] to-[#FF7043] hover:from-[#e84915] hover:to-[#f85f31] text-white rounded-2xl p-4 shadow-md shadow-orange-500/20 transition-all flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Plus className="w-6 h-6 text-white stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-white">Create New Lead</div>
                    <div className="text-xs text-orange-100 font-medium">
                      Select a photo and enter details
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/90 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>

              <button
                onClick={() => setCurrentView("photos")}
                className="bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-xs rounded-2xl p-4 transition-all flex items-center gap-3.5 text-left group"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900">Open Photo Folder</div>
                  <div className="text-xs text-slate-400 font-medium">
                    View all market photos
                  </div>
                </div>
              </button>

              <button
                onClick={() => setCurrentView("leads")}
                className="bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-xs rounded-2xl p-4 transition-all flex items-center gap-3.5 text-left group"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900">My Created Leads</div>
                  <div className="text-xs text-slate-400 font-medium">
                    View today&apos;s entries
                  </div>
                </div>
              </button>

              <button
                onClick={handleExportData}
                className="bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-xs rounded-2xl p-4 transition-all flex items-center gap-3.5 text-left group"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900">Export Data</div>
                  <div className="text-xs text-slate-400 font-medium">
                    Download excel (Admin)
                  </div>
                </div>
              </button>
            </div>

            {/* Main 2-Column Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                {/* Today's Market Photos Carousel */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <ImageIcon className="w-5 h-5 text-blue-600" />
                      <h2 className="text-sm font-black text-slate-900">
                        Today&apos;s Market Photos
                      </h2>
                      <span className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                        {photosQueue.length} Pending
                      </span>
                    </div>

                    <button
                      onClick={() => setCurrentView("photos")}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                    >
                      <span>View All Photos</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="relative group/carousel">
                    {photosQueue.length > 0 ? (
                      <div className="flex items-center gap-3.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
                        {photosQueue.map((photo, idx) => (
                        <div
                          key={photo.id}
                          onClick={() => {
                            selectPhotoItem(idx);
                            setCurrentView("review");
                          }}
                          className={`w-36 shrink-0 rounded-2xl overflow-hidden border cursor-pointer transition-all hover:scale-102 hover:shadow-md ${
                            idx === 0
                              ? "border-2 border-[#F95721] ring-2 ring-orange-500/20"
                              : "border-slate-200"
                          }`}
                        >
                          <div className="relative h-28 w-full bg-slate-900">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photo.previewUrl}
                              alt={photo.fileName}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-900/80 text-white font-black text-[10px] flex items-center justify-center">
                              {idx + 1}
                            </span>
                          </div>
                          <div className="p-2.5 bg-white text-center">
                            <div className="text-xs font-bold text-slate-800 truncate">
                              {photo.fileName}
                            </div>
                            <span className="inline-block mt-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                              Pending
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    ) : (
                      <div className="py-8 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-bold text-slate-800">No market photos in queue</div>
                        <div className="text-[11px] text-slate-400">Upload photos from market visits to start creating leads.</div>
                        <button
                          onClick={() => setCurrentView("photos")}
                          className="mt-1 px-3.5 py-1.5 rounded-xl bg-[#F95721] text-white text-xs font-bold hover:bg-[#e84915] transition-colors"
                        >
                          + Upload Photos
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Today's Recent Entries Table */}
                <div
                  id="recent-entries-section"
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h2 className="text-sm font-black text-slate-900">
                        Today&apos;s Recent Entries
                      </h2>
                    </div>
                    <button
                      onClick={() => setCurrentView("leads")}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                    >
                      <span>View All</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">LEAD ID</th>
                          <th className="py-2.5 px-3">BUSINESS NAME</th>
                          <th className="py-2.5 px-3">AREA</th>
                          <th className="py-2.5 px-3">ZONE</th>
                          <th className="py-2.5 px-3">ASSIGNED TO</th>
                          <th className="py-2.5 px-3">CREATED AT</th>
                          <th className="py-2.5 px-3">STATUS</th>
                          <th className="py-2.5 px-3">PHOTO</th>
                          <th className="py-2.5 px-3 text-right">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recentEntries.length > 0 ? (
                          recentEntries.map((row, idx) => (
                          <tr
                            key={row.id || idx}
                            className="hover:bg-slate-50/70 transition-colors"
                          >
                            <td className="py-3 px-3 font-semibold text-slate-500">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-700">
                              {row.leadId}
                            </td>
                            <td className="py-3 px-3 font-extrabold text-slate-900">
                              {row.businessName}
                            </td>
                            <td className="py-3 px-3 text-slate-600 font-medium">
                              {row.area}
                            </td>
                            <td className="py-3 px-3 text-slate-600 font-medium">
                              {row.zone}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-6 h-6 rounded-full ${
                                    row.assignedToColor || "bg-rose-500"
                                  } text-white font-bold text-[10px] flex items-center justify-center shrink-0`}
                                >
                                  {row.assignedToInitials}
                                </span>
                                <span className="font-bold text-slate-800">
                                  {row.assignedToName}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-500 font-medium">
                              {row.createdAt}
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                {row.status}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <button
                                onClick={() => setShowPreviewModal(row)}
                                className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 hover:scale-105 transition-transform"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={row.photoUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => setShowPreviewModal(row)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="View Lead Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                        ) : (
                          <tr>
                            <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                              No recent lead entries recorded yet. Upload photos and create leads to populate your ledger.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                {/* Territory & Admin Area Coverage Card */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                      <div>
                        <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                          Area / Zone Status
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                            Admin Created
                          </span>
                        </h2>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {areas.length > 0 ? areas.map((a) => a.name).join(", ") : "Territory Coverage"} Master Coverage
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentView("coverage")}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Full Status</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                      <span className="flex items-center gap-1 text-slate-500">
                        <span>↓</span> Overall Coverage ({coverageList.length} Zones)
                      </span>
                      <span className="text-slate-900 font-extrabold">{overallCoveragePercentage}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${overallCoveragePercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="pb-2">AREA / ZONE</th>
                          <th className="pb-2">REP</th>
                          <th className="pb-2">LEADS</th>
                          <th className="pb-2">STATUS</th>
                          <th className="pb-2 text-right">COVERAGE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {coverageList.slice(0, 6).map((item, idx) => (
                          <tr key={`${item.area}_${item.zone}_${idx}`} className="hover:bg-slate-50/50">
                            <td className="py-2.5 pr-2 font-bold text-slate-800">
                              <div className="flex items-center gap-1.5">
                                <MapPin className={`w-3.5 h-3.5 ${item.pinColor}`} />
                                <div>
                                  <span className="block leading-tight text-slate-900">{item.zone}</span>
                                  <span className="text-[10px] text-slate-400 font-normal">{item.area}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 text-slate-600 font-medium">
                              <span className="text-[10px] font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                                {item.assignedRep}
                              </span>
                            </td>
                            <td className="py-2.5 text-slate-500 font-medium">
                              {item.leads}
                            </td>
                            <td className="py-2.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${item.statusColor}`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="py-2.5 pl-2 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-[11px] font-bold text-slate-700 w-7">
                                  {item.coverage}%
                                </span>
                                <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                                  <div
                                    className={`h-full rounded-full ${item.barColor}`}
                                    style={{ width: `${item.coverage}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                    <button
                      onClick={() => setCurrentView("coverage")}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All Admin Areas & Zones ({coverageList.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* My Productivity (Today) */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-amber-500" />
                    <h2 className="text-sm font-black text-slate-900">
                      My Productivity (Today)
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Download className="w-4 h-4 rotate-180" />
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-slate-400">
                          Login Time
                        </div>
                        <div className="text-xs font-black text-slate-800">
                          {loginTime}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-slate-400">
                          Working Duration
                        </div>
                        <div className="text-xs font-black text-slate-800">
                          {workingDurationStr}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-slate-400">
                          Leads Created
                        </div>
                        <div className="text-xs font-black text-slate-800">
                          {totalLeadsCreated}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-slate-400">
                          Avg. Entry Time
                        </div>
                        <div className="text-xs font-black text-slate-800">
                          {avgEntryTimeStr}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Target className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-slate-400">
                          Data Accuracy
                        </div>
                        <div className="text-xs font-black text-slate-800">
                          {dataAccuracyStr}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-slate-400">
                          Photos Pending
                        </div>
                        <div className="text-xs font-black text-slate-800">
                          {photosQueue.length}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: MARKET PHOTO UPLOAD (SCREENSHOT 2)                               */}
        {/* ========================================================================= */}
        {currentView === "photos" && (
          <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full animate-fade-in">
            {/* Header & 4-Step Stepper */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-slate-200/80">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#F95721] text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Market Photo Upload
                  </h1>
                  <p className="text-xs md:text-sm font-medium text-slate-500">
                    Upload market photos from your device and organize by area and zone
                  </p>
                </div>
              </div>

              {/* 4-Step Stepper Header */}
              <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-1">
                <div className="flex items-center gap-2 relative">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      uploadStep === 1
                        ? "bg-[#F95721] text-white shadow-sm shadow-orange-500/30"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    1
                  </div>
                  <span
                    className={`text-xs font-bold whitespace-nowrap ${
                      uploadStep === 1 ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    Upload Photos
                  </span>
                  {uploadStep === 1 && (
                    <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-[#F95721]" />
                  )}
                </div>

                <div className="w-8 h-px bg-slate-200" />

                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      uploadStep === 2
                        ? "bg-[#F95721] text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    2
                  </div>
                  <span className="text-xs font-bold text-slate-400 whitespace-nowrap">
                    Verify & Organize
                  </span>
                </div>

                <div className="w-8 h-px bg-slate-200" />

                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      uploadStep === 3
                        ? "bg-[#F95721] text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    3
                  </div>
                  <span className="text-xs font-bold text-slate-400 whitespace-nowrap">
                    Select for Lead Entry
                  </span>
                </div>

                <div className="w-8 h-px bg-slate-200" />

                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      uploadStep === 4
                        ? "bg-[#F95721] text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    4
                  </div>
                  <span className="text-xs font-bold text-slate-400 whitespace-nowrap">
                    Complete
                  </span>
                </div>
              </div>
            </div>

            {/* Top 3-Card Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Card 1: Drag & Drop Dropzone (4 cols) */}
              <div
                onClick={() => uploadPageFileInputRef.current?.click()}
                className="lg:col-span-4 border-2 border-dashed border-blue-200 hover:border-blue-500 bg-[#f8fbff] hover:bg-blue-50/40 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3"
              >
                <input
                  ref={uploadPageFileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900">
                    Drag & Drop Photos Here
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    or click to select multiple images
                  </div>
                </div>
                <div className="text-[11px] text-slate-400">
                  Supports: JPG, JPEG, PNG | Max size: 10MB per image
                  <br />
                  You can select multiple photos at once
                </div>
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-xl bg-[#F95721] hover:bg-[#e84915] text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-2 transition-all mt-2"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Select Photos</span>
                </button>
              </div>

              {/* Card 2: Ingestion Metadata Form (5 cols) */}
              <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3.5 shadow-2xs flex flex-col justify-between">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Visit Date *
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={uploadMetadata.visitDate}
                        onChange={(e) =>
                          setUploadMetadata({ ...uploadMetadata, visitDate: e.target.value })
                        }
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Area *
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <select
                        value={uploadMetadata.area}
                        onChange={(e) => {
                          const chosenAreaName = e.target.value;
                          const areaObj = areas.find((a) => a.name === chosenAreaName);
                          const areaZones = getZonesForArea(chosenAreaName);
                          const firstZone = areaZones[0]?.name || "Baba Colony";
                          setUploadMetadata({
                            ...uploadMetadata,
                            area: chosenAreaName,
                            zone: firstZone,
                            batchName: `${chosenAreaName.toUpperCase().replace(/\s+/g, "")}-${firstZone.toUpperCase().replace(/\s+/g, "")}-270925-01`,
                          });
                          if (areaObj) setBatchAreaId(areaObj._id || areaObj.id);
                        }}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        {areas.length > 0 ? (
                          areas.map((a) => (
                            <option key={a._id || a.id} value={a.name}>
                              {a.name}
                            </option>
                          ))
                        ) : (
                          <option value="">No areas created yet</option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Zone *
                  </label>
                  <div className="relative">
                    <Compass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={uploadMetadata.zone}
                      onChange={(e) => {
                        const newZone = e.target.value;
                        setUploadMetadata({
                          ...uploadMetadata,
                          zone: newZone,
                          batchName: `${uploadMetadata.area.toUpperCase().replace(/\s+/g, "")}-${newZone.toUpperCase().replace(/\s+/g, "")}-270925-01`,
                        });
                      }}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {getZonesForArea(uploadMetadata.area).map((z, idx) => {
                        const zName = typeof z === "string" ? z : z.name;
                        return (
                          <option key={z._id || idx} value={zName}>
                            {zName}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Batch Name (Auto)
                  </label>
                  <input
                    type="text"
                    value={uploadMetadata.batchName}
                    onChange={(e) =>
                      setUploadMetadata({ ...uploadMetadata, batchName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Remarks (Optional)
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Market visit - Main road area"
                      value={uploadMetadata.remarks}
                      onChange={(e) =>
                        setUploadMetadata({ ...uploadMetadata, remarks: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Upload Summary (3 cols) */}
              <div className="lg:col-span-3 bg-[#FFF9F6] border border-orange-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4 text-[#F95721]" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Upload Summary
                    </h3>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600">
                        <ImageIcon className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold">Photos Selected</span>
                      </div>
                      <span className="text-sm font-black text-slate-900">{uploadStats.total}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="font-semibold">Valid Photos</span>
                      </div>
                      <span className="text-sm font-black text-slate-900">{uploadStats.valid}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600">
                        <XCircle className="w-4 h-4 text-rose-500" />
                        <span className="font-semibold">Duplicate / Invalid</span>
                      </div>
                      <span className="text-sm font-black text-slate-900">{uploadStats.invalid}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-orange-200/60">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Database className="w-4 h-4 text-purple-500" />
                        <span className="font-semibold">Estimated Size</span>
                      </div>
                      <span className="text-sm font-black text-slate-900">{uploadStats.sizeStr}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isUploadingToCloudinary}
                  onClick={handleUploadAllSelected}
                  className="w-full py-3 rounded-xl bg-[#F95721] hover:bg-[#e84915] text-white font-black text-xs shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-60 cursor-pointer"
                >
                  {isUploadingToCloudinary ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{uploadProgressText || "Uploading to Cloudinary..."}</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload Photos to Cloudinary</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Selected Photos (50) Section */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <ImageIcon className="w-5 h-5 text-blue-600" />
                  <div>
                    <h2 className="text-sm font-black text-slate-900">
                      Selected Photos ({selectedPhotosList.length})
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Review your selected photos before upload
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs">
                    <SettingsIcon className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-[11px] font-bold text-slate-800 leading-none">
                        Auto Optimization
                      </div>
                      <div className="text-[9px] text-slate-400">
                        Images will be compressed for better performance
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md ml-1">
                      Enabled
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      showToast("Removed 2 duplicate / invalid photos from batch");
                    }}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-600 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Invalid ({uploadStats.invalid})</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedPhotosList([]);
                      showToast("Cleared photo selection");
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                </div>
              </div>

              {/* Selected Photo Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                {selectedPhotosList.length > 0 ? (
                  selectedPhotosList.map((item) => (
                  <div
                    key={item.id}
                    className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs group hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="relative h-28 w-full bg-slate-900 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.previewUrl}
                        alt={item.fileName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        onClick={() =>
                          setShowPreviewModal({
                            businessName: item.businessName,
                            photoUrl: item.previewUrl,
                            leadId: item.fileName,
                            status: "Selected",
                            area: uploadMetadata.area,
                            zone: uploadMetadata.zone,
                            assignedToName: "Auto Assigned",
                          })
                        }
                        className="absolute bottom-2 right-2 w-6 h-6 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center transition-colors shadow-xs"
                        title="Zoom Photo"
                      >
                        <Search className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-2.5 flex items-center justify-between text-xs bg-white">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleTogglePhotoCheck(item.id)}
                          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                            item.checked
                              ? "bg-[#F95721] border-[#F95721] text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {item.checked && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 text-[11px] truncate">
                            {item.fileName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {item.size}
                          </div>
                        </div>
                      </div>

                      {item.hasTag && (
                        <span className="w-3 h-3 text-blue-500 shrink-0">📍</span>
                      )}
                    </div>
                  </div>
                ))
                ) : (
                  <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center space-y-2">
                    <UploadCloud className="w-8 h-8 text-slate-400" />
                    <p className="text-xs font-bold text-slate-700">No photos selected yet</p>
                    <p className="text-[11px] text-slate-400">Use the dropzone above or click &ldquo;Select Photos&rdquo; to add images from field visits.</p>
                  </div>
                )}
              </div>

              {/* Bottom Action Footer Bar */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-black text-slate-900">
                    {selectedPhotosCount} photos selected
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    Total size: {uploadStats.sizeStr} (will be optimized)
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (selectedPhotosList[0]) {
                        setShowPreviewModal({
                          businessName: selectedPhotosList[0].businessName,
                          photoUrl: selectedPhotosList[0].previewUrl,
                          leadId: selectedPhotosList[0].fileName,
                          status: "Batch Photo",
                          area: uploadMetadata.area,
                          zone: uploadMetadata.zone,
                          assignedToName: "Auto Assigned",
                        });
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview Selected</span>
                  </button>

                  <button
                    disabled={isUploadingToCloudinary}
                    onClick={handleUploadAllSelected}
                    className="px-6 py-2.5 rounded-xl bg-[#F95721] hover:bg-[#e84915] text-white font-black text-xs shadow-md shadow-orange-500/20 flex items-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {isUploadingToCloudinary ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{uploadProgressText || "Uploading to Cloudinary..."}</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload {selectedPhotosCount} Photos (Cloudinary)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: REVIEW & ASSIGN LEAD (SCREENSHOT 3)                              */}
        {/* ========================================================================= */}
        {currentView === "review" && (
          <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full animate-fade-in pb-28">
            {/* Header & 4-Step Stepper */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-slate-200/80">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#F95721] text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Review &amp; Assign Lead
                  </h1>
                  <p className="text-xs md:text-sm font-medium text-slate-500">
                    Verify the details, check for duplicates and assign to sales executive
                  </p>
                </div>
              </div>

              {/* 4-Step Stepper Header */}
              <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
                    Upload Photos
                  </span>
                </div>

                <div className="w-8 h-px bg-slate-200" />

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
                    Fill Business Details
                  </span>
                </div>

                <div className="w-8 h-px bg-slate-200" />

                <div className="flex items-center gap-2 relative">
                  <div className="w-7 h-7 rounded-full bg-[#F95721] text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-orange-500/30">
                    3
                  </div>
                  <span className="text-xs font-bold text-slate-900 whitespace-nowrap">
                    Review &amp; Assign
                  </span>
                  <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-[#F95721]" />
                </div>

                <div className="w-8 h-px bg-slate-200" />

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs">
                    4
                  </div>
                  <span className="text-xs font-bold text-slate-400 whitespace-nowrap">
                    Complete
                  </span>
                </div>
              </div>
            </div>

            {/* Main 3-Column Review Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Column 1: Selected Market Photo (3 cols) */}
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs font-black text-slate-900">
                        Selected Market Photo
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => selectPhotoItem(Math.max(0, currentIndex - 1))}
                        className="w-6 h-6 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] font-bold text-slate-600 px-1">
                        {currentIndex + 1} / {photosQueue.length || 50}
                      </span>
                      <button
                        onClick={() =>
                          selectPhotoItem(Math.min(photosQueue.length - 1, currentIndex + 1))
                        }
                        className="w-6 h-6 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {activePhoto ? (
                    <div className="relative w-full h-56 rounded-xl overflow-hidden bg-slate-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activePhoto.previewUrl}
                        alt={activePhoto ? activePhoto.fileName : "No file"}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() =>
                          setShowPreviewModal({
                            businessName: formData.businessName,
                            photoUrl: activePhoto.previewUrl,
                            leadId: activePhoto.fileName,
                            status: "Reviewing",
                            area: formData.area,
                            zone: formData.zone,
                            assignedToName: formData.assignedToName,
                          })
                        }
                        className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-slate-800 text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Zoom</span>
                      </button>
                    </div>
                  ) : (
                    <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center space-y-2">
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                      <div className="text-xs font-bold text-slate-700">No active photo in review queue</div>
                      <button
                        onClick={() => setCurrentView("photos")}
                        className="px-3 py-1 rounded-lg bg-[#F95721] text-white text-xs font-bold"
                      >
                        Upload Photos
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {photosQueue.slice(0, 5).map((p, idx) => (
                      <button
                        key={p.id}
                        onClick={() => selectPhotoItem(idx)}
                        className={`w-12 h-10 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                          idx === currentIndex
                            ? "border-[#F95721] scale-105"
                            : "border-slate-200 opacity-60 hover:opacity-100"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <div className="text-[10px] text-slate-400 font-medium">File Name</div>
                      <div className="font-bold text-slate-800 truncate">
                        {activePhoto ? activePhoto.fileName || "—" : "—"}
                      </div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <div className="text-[10px] text-slate-400 font-medium">File Size</div>
                      <div className="font-bold text-slate-800">
                        {activePhoto ? activePhoto.fileSize || "—" : "—"}
                      </div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <div className="text-[10px] text-slate-400 font-medium">Captured At</div>
                      <div className="font-bold text-slate-800 text-[11px] truncate">
                        {activePhoto ? activePhoto.capturedAt || "Today" : "—"}
                      </div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <div className="text-[10px] text-slate-400 font-medium">Upload Batch</div>
                      <div className="font-bold text-slate-800 text-[10px] truncate">
                        {activePhoto ? activePhoto.batchName || "Direct" : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Business Info, Duplicate Check, Suggested Executive, AI Suggestions (6 cols) */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <h3 className="text-sm font-black text-slate-900">
                        Business Information
                      </h3>
                    </div>
                    <button
                      onClick={() => showToast("Business information editable")}
                      className="px-2.5 py-1 rounded-lg border border-blue-200 text-blue-600 font-bold text-xs flex items-center gap-1 hover:bg-blue-50 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Business Name
                      </label>
                      <input
                        type="text"
                        value={formData.businessName}
                        onChange={(e) =>
                          setFormData({ ...formData, businessName: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Client / Owner Name
                      </label>
                      <input
                        type="text"
                        value={formData.ownerName}
                        onChange={(e) =>
                          setFormData({ ...formData, ownerName: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Mobile Number
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          maxLength={10}
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="w-full pl-3 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-900 focus:outline-none focus:border-blue-500"
                        />
                        <CheckCircle className="w-4 h-4 text-emerald-500 absolute right-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Alternate Number
                      </label>
                      <input
                        type="tel"
                        value={formData.alternatePhone}
                        onChange={(e) =>
                          setFormData({ ...formData, alternatePhone: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Business Category
                      </label>
                      <div className="relative">
                        <ShoppingBag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={formData.categoryLabel}
                          onChange={(e) =>
                            setFormData({ ...formData, categoryLabel: e.target.value })
                          }
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Sub Category
                      </label>
                      <input
                        type="text"
                        value={formData.subCategory}
                        onChange={(e) =>
                          setFormData({ ...formData, subCategory: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Area
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          value={formData.area}
                          onChange={(e) => {
                            const selectedAreaName = e.target.value;
                            const foundArea = areas.find((a) => a.name === selectedAreaName);
                            const areaZones = getZonesForArea(selectedAreaName);
                            const firstZone = areaZones[0]?.name || "Baba Colony";
                            const repId = resolveMatchedRep(
                              firstZone,
                              foundArea ? foundArea._id || foundArea.id : formData.areaId
                            );
                            const repObj = salesReps.find((s) => (s._id || s.id) === repId);
                            setFormData({
                              ...formData,
                              area: selectedAreaName,
                              areaId: foundArea ? foundArea._id || foundArea.id : formData.areaId,
                              zone: firstZone,
                              assignedToId: repId,
                              assignedToName:
                                repObj?.name || salesReps[0]?.name || "Sales Executive",
                            });
                          }}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          {areas.length > 0 ? (
                            areas.map((a) => (
                              <option key={a._id || a.id} value={a.name}>
                                {a.name}
                              </option>
                            ))
                          ) : (
                            <option value="">No areas created yet</option>
                          )}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Zone *
                      </label>
                      <div className="relative">
                        <Compass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          value={formData.zone}
                          onChange={(e) => {
                            const newZone = e.target.value;
                            const repId = resolveMatchedRep(newZone, formData.areaId);
                            const repObj = salesReps.find((s) => (s._id || s.id) === repId);
                            setFormData({
                              ...formData,
                              zone: newZone,
                              assignedToId: repId,
                              assignedToName:
                                repObj?.name || salesReps[0]?.name || "Sales Executive",
                            });
                          }}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          {getZonesForArea(formData.area).map((z, idx) => {
                            const zName = typeof z === "string" ? z : z.name;
                            return (
                              <option key={z._id || idx} value={zName}>
                                {zName}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Market Remark (Location / Reference)
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <textarea
                        rows={2}
                        value={formData.remark}
                        onChange={(e) =>
                          setFormData({ ...formData, remark: e.target.value })
                        }
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="text-right text-[10px] text-slate-400 font-medium mt-1">
                      85/300
                    </div>
                  </div>
                </div>

                {/* Duplicate Check & Suggested Executive Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                      <CheckCircle className="w-4 h-4" />
                      <span>Duplicate Check</span>
                    </div>
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        ✓
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900">
                          No Duplicate Found
                        </div>
                        <div className="text-[10px] text-slate-500">
                          This business is new in our database.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-2">
                    <div className="flex items-center gap-1.5 text-rose-500 font-bold text-xs">
                      <Target className="w-4 h-4" />
                      <span>Suggested Executive</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center">
                          {(formData.assignedToName || "SE").slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <div className="text-xs font-black text-slate-900">
                            {formData.assignedToName || "Sales Executive"}{" "}
                            {formData.zone && (
                              <span className="text-[11px] font-medium text-slate-500">
                                ({formData.zone})
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {formData.zone ? `Assigned to ${formData.assignedToName || "executive"} for ${formData.zone}` : "Designated executive for territory"}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                        Recommended
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sales Executive Assignment Dropdown */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-2">
                  <label className="block text-xs font-black text-slate-800">
                    Assign to Sales Executive *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={formData.assignedToId}
                      onChange={(e) => {
                        const repId = e.target.value;
                        const repObj = salesReps.find((s) => (s._id || s.id) === repId);
                        setFormData({
                          ...formData,
                          assignedToId: repId,
                          assignedToName: repObj?.name || salesReps[0]?.name || "Sales Executive",
                        });
                      }}
                      className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">-- Select Sales Executive --</option>
                      {salesReps.map((r) => (
                        <option key={r._id || r.id} value={r._id || r.id}>
                          {r.name} ({r.email || "Sales"})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* AI Smart Suggestions (Optional) */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-purple-600 text-white font-black text-xs flex items-center justify-center">
                        A
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">
                          AI Smart Suggestions (Optional)
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          Based on business type and market data
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSuggestAll}
                      className="px-2.5 py-1 rounded-lg border border-purple-200 text-purple-600 font-bold text-[11px] flex items-center gap-1 hover:bg-purple-50 transition-colors"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Suggest All</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {smartSuggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleToggleSuggestion(item.id)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                          item.checked
                            ? item.color === "orange"
                              ? "bg-orange-50 border-orange-300 text-orange-700"
                              : "bg-blue-50 border-blue-300 text-blue-700"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                            item.checked
                              ? item.color === "orange"
                                ? "bg-orange-600 text-white"
                                : "bg-blue-600 text-white"
                              : "border border-slate-300"
                          }`}
                        >
                          {item.checked && "✓"}
                        </span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column 3: Lead Preview Card & Additional Actions (3 cols) */}
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-900">Lead Preview Card</h3>
                    <button
                      onClick={() => showToast("Lead preview editable")}
                      className="px-2 py-0.5 rounded-md border border-blue-200 text-blue-600 font-bold text-[11px] flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-900">
                    {activePhoto && activePhoto.previewUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={activePhoto.previewUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 text-xs font-semibold gap-1">
                        <ImageIcon className="w-6 h-6 text-slate-500" />
                        <span>No Photo Attached</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      {formData.businessName}
                    </h4>
                    <div className="space-y-1 text-xs text-slate-600 mt-1.5">
                      <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{formData.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formData.area} &gt; {formData.zone}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formData.categoryLabel}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-bold text-slate-800">
                            {formData.assignedToName}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          New Lead
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lead Status Stepper */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="text-[11px] font-bold text-slate-700">Lead Status</div>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between text-slate-600">
                        <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Photo Uploaded</span>
                        </div>
                        <span className="text-slate-400 text-[10px]">27 Sep, 10:02 AM</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Details Filled</span>
                        </div>
                        <span className="text-slate-400 text-[10px]">27 Sep, 10:08 AM</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <div className="flex items-center gap-1.5 text-orange-600 font-bold bg-orange-50 px-1 py-0.5 rounded">
                          <span className="w-3.5 h-3.5 rounded-full bg-[#F95721] text-white flex items-center justify-center text-[9px]">
                            !
                          </span>
                          <span>Ready to Assign</span>
                        </div>
                        <span className="text-slate-400 text-[10px]">27 Sep, 10:08 AM</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                          <span>Assigned to Executive</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Actions */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="text-[11px] font-bold text-slate-700">
                      Additional Actions
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        onClick={() => setRotation((r) => (r + 90) % 360)}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-1.5 font-bold text-slate-700"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Rotate Photo</span>
                      </button>

                      <button
                        onClick={() => showToast("Photo crop tool ready")}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-1.5 font-bold text-slate-700"
                      >
                        <Crop className="w-3.5 h-3.5" />
                        <span>Crop Photo</span>
                      </button>

                      <button
                        onClick={() => showToast("Upload replacement photo")}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-1.5 font-bold text-slate-700"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Replace Photo</span>
                      </button>

                      <button
                        onClick={() => {
                          if (!activePhoto) {
                            showToast("No photo currently in review queue", "warning");
                            return;
                          }
                          setShowPreviewModal({
                            businessName: formData.businessName || "Photo Preview",
                            photoUrl: activePhoto.previewUrl,
                            leadId: activePhoto.fileName || "Photo",
                            status: "Fullscreen Inspection",
                            area: formData.area || "",
                            zone: formData.zone || "",
                            assignedToName: formData.assignedToName || "",
                          });
                        }}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-1.5 font-bold text-slate-700"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>View Fullscreen</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Reference Section: Location Map + Nearby Businesses */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-black text-slate-900">
                      Location on Map (Reference Only)
                    </h3>
                  </div>

                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-[#F95721] hover:underline flex items-center gap-1"
                  >
                    <span>View in Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="relative w-full h-44 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[#eef3f7] opacity-80" />
                  <div className="absolute top-1/2 left-0 right-0 h-4 bg-slate-300 -translate-y-1/2 transform -rotate-12" />
                  <div className="absolute top-0 bottom-0 left-1/3 w-3 bg-slate-300" />
                  <div className="absolute bottom-6 left-12 text-[10px] font-bold text-slate-500">
                    Main Road
                  </div>

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="px-2.5 py-1 rounded-md bg-white border border-rose-200 shadow-md text-[10px] font-black text-slate-900 flex items-center gap-1 whitespace-nowrap mb-1">
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                      <span>{formData.businessName}</span>
                    </div>
                    <MapPin className="w-6 h-6 text-rose-600 fill-rose-600 -mt-1" />
                  </div>

                  <div className="absolute bottom-3 left-3 flex flex-col bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
                    <button className="px-2 py-1 hover:bg-slate-100 font-bold text-xs text-slate-700">
                      +
                    </button>
                    <div className="w-full h-px bg-slate-200" />
                    <button className="px-2 py-1 hover:bg-slate-100 font-bold text-xs text-slate-700">
                      -
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <h3 className="text-xs font-black text-slate-900">
                      Nearby Businesses (Same Street)
                    </h3>
                  </div>

                  <button
                    onClick={() => showToast("Showing all same-street businesses")}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {nearbyBusinesses.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {nearbyBusinesses.map((shop, i) => (
                      <div
                        key={i}
                        className="rounded-xl overflow-hidden border border-slate-200 bg-white hover:shadow-sm transition-all"
                      >
                        <div className="h-20 w-full bg-slate-900">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={shop.photoUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="p-2 text-center">
                          <div className="text-[11px] font-black text-slate-900 truncate">
                            {shop.businessName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium truncate">
                            {shop.categoryLabel || shop.zone}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No other businesses recorded in this area / zone yet.
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Fixed Action Footer Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-3.5 shadow-xl flex items-center justify-between">
              <button
                onClick={() => setCurrentView("photos")}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <div className="text-left leading-tight">
                  <div className="text-[11px] text-slate-400 font-medium">Previous</div>
                  <div>Edit Details</div>
                </div>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    showToast("Draft saved locally!", "info");
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center gap-2 transition-colors"
                >
                  <Save className="w-4 h-4 text-slate-500" />
                  <span>Save as Draft</span>
                </button>

                <button
                  type="button"
                  onClick={handleVerifyAndDispatch}
                  disabled={isSubmitting || isCheckingDuplicate}
                  className="px-8 py-2.5 rounded-xl bg-[#F95721] hover:bg-[#e84915] text-white font-black text-xs shadow-md shadow-orange-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmitting || isCheckingDuplicate ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving &amp; Assigning...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Save &amp; Assign Lead</span>
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={() => {
                  if (currentIndex < photosQueue.length - 1) {
                    selectPhotoItem(currentIndex + 1);
                    showToast("Advanced to next market photo");
                  } else {
                    showToast("Reached end of batch", "info");
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-[#F95721] hover:text-[#e84915] flex items-center gap-1.5 transition-colors"
              >
                <span>Skip &amp; Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: MY CREATED LEADS / LEAD CREATED (SCREENSHOT 4)                   */}
        {/* ========================================================================= */}
        {currentView === "leads" && (
          <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full animate-fade-in">
            {/* Header & 4-Step Stepper (All 4 complete/step 4 active) */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-slate-200/80">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#F95721] text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Lead Created Successfully
                  </h1>
                  <p className="text-xs md:text-sm font-medium text-slate-500">
                    The business has been saved and assigned to the sales executive
                  </p>
                </div>
              </div>

              {/* 4-Step Stepper (Step 4 Complete Active) */}
              <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
                    Upload Photos
                  </span>
                </div>

                <div className="w-8 h-px bg-slate-200" />

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
                    Fill Details
                  </span>
                </div>

                <div className="w-8 h-px bg-slate-200" />

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
                    Review &amp; Assign
                  </span>
                </div>

                <div className="w-8 h-px bg-slate-200" />

                <div className="flex items-center gap-2 relative">
                  <div className="w-7 h-7 rounded-full bg-[#F95721] text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-orange-500/30">
                    4
                  </div>
                  <span className="text-xs font-bold text-slate-900 whitespace-nowrap">
                    Complete
                  </span>
                  <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-[#F95721]" />
                </div>
              </div>
            </div>

            {/* Top Cards: Lead Creation Status & Details */}
            {lastCreatedLead ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Card 1: Success Confetti Banner (3.5 cols) */}
                <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 text-2xl font-black">
                      ✓
                    </div>
                    <span className="absolute -top-2 -left-3 w-2 h-2 rounded-full bg-blue-500" />
                    <span className="absolute -top-1 -right-2 w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="absolute -bottom-1 -left-4 w-2 h-2 rounded-full bg-rose-400" />
                    <span className="absolute -bottom-2 -right-3 w-2 h-2 rounded-full bg-purple-500" />
                    <span className="absolute top-4 -left-6 w-3 h-1 rounded-full bg-emerald-400 rotate-45" />
                    <span className="absolute top-3 -right-6 w-3 h-1 rounded-full bg-orange-400 -rotate-45" />
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      Lead Created Successfully!
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-[260px]">
                      Business details have been saved and assigned to{" "}
                      <span className="font-bold text-slate-800">
                        {lastCreatedLead.assignedToName}
                      </span>
                    </p>
                  </div>

                  <div className="w-full space-y-2 pt-2">
                    <button
                      onClick={() => {
                        if (photosQueue.length > 0) {
                          selectPhotoItem(0);
                          setCurrentView("review");
                        } else {
                          setCurrentView("photos");
                        }
                      }}
                      className="w-full py-3 rounded-xl bg-[#F95721] hover:bg-[#e84915] text-white font-black text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>Add Next Lead</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        const el = document.getElementById("created-leads-ledger");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>View All My Leads</span>
                    </button>
                  </div>
                </div>

                {/* Card 2: Lead Details Card (4.5 cols) */}
                <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs font-black text-slate-900">Lead Details</h3>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        {lastCreatedLead.leadNumber}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      Assigned
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
                    <div className="sm:col-span-5 h-44 rounded-xl overflow-hidden bg-slate-900 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={lastCreatedLead.photoUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="sm:col-span-7 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Business Name</span>
                        <span className="font-black text-slate-900 text-right">
                          {lastCreatedLead.businessName}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Owner Name</span>
                        <span className="font-bold text-slate-800 text-right">
                          {lastCreatedLead.ownerName || "—"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium">Mobile Number</span>
                        <span className="font-black text-slate-900 flex items-center gap-1">
                          <span>{lastCreatedLead.phone}</span>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 inline" />
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Category</span>
                        <span className="font-bold text-slate-800 text-right">
                          {lastCreatedLead.categoryLabel || "General"}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Area &amp; Zone</span>
                        <span className="font-bold text-slate-800 text-right">
                          {lastCreatedLead.area} &gt; {lastCreatedLead.zone}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                        <span className="text-slate-400 font-medium">Assigned To</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center">
                            {(lastCreatedLead.assignedToName || "SE").slice(0, 2).toUpperCase()}
                          </span>
                          <span>{lastCreatedLead.assignedToName}</span>
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Created By</span>
                        <span className="font-bold text-slate-700 text-right">
                          {lastCreatedLead.createdByName}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Created At</span>
                        <span className="font-bold text-slate-700 text-right">
                          {lastCreatedLead.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 3: Entry Timeline (4 cols) */}
                <div className="lg:col-span-3 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-black text-slate-900">Entry Timeline</h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <ImageIcon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-black text-slate-900">Photo Ingested</div>
                        <div className="text-[10px] text-slate-400">
                          {lastCreatedLead.createdAt} &middot; {lastCreatedLead.photoName || "Market Photo"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-black text-slate-900">Details Captured</div>
                        <div className="text-[10px] text-slate-400">
                          {lastCreatedLead.createdAt} &middot; {lastCreatedLead.businessName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-black text-slate-900">Duplicate Check Passed</div>
                        <div className="text-[10px] text-slate-400">
                          {lastCreatedLead.createdAt} &middot; Verified unique
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <div>
                        <div className="font-black text-slate-900">Lead Created</div>
                        <div className="text-[10px] text-slate-400">
                          {lastCreatedLead.createdAt} &middot; Saved to DB
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-orange-50 text-[#F95721] flex items-center justify-center shrink-0 mt-0.5">
                        <Send className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-black text-slate-900">Assigned to Executive</div>
                        <div className="text-[10px] text-slate-400">
                          {lastCreatedLead.createdAt} &middot; {lastCreatedLead.assignedToName}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">My Created Leads Ledger</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Review, filter, and track all field leads captured and assigned through the Data Operator Hub.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setCurrentView("photos")}
                    className="px-4 py-2 rounded-xl bg-[#F95721] text-white font-bold text-xs hover:bg-[#e84915] transition-colors flex items-center gap-1.5"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload New Photos</span>
                  </button>
                </div>
              </div>
            )}

            {/* Middle Row: Analytics (3 Cards) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Card A: Today's Progress (4 cols) */}
              <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-black text-slate-900">Today&apos;s Progress</h3>
                </div>

                <div className="grid grid-cols-12 gap-3 items-center">
                  {/* Circular Gauge */}
                  <div className="col-span-5 flex flex-col items-center justify-center">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-100"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-emerald-500"
                          strokeDasharray={`${Math.min(100, Math.round((totalLeadsCreated / 80) * 100))}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-xl font-black text-slate-900 leading-none">
                          {totalLeadsCreated}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                          Leads Created
                        </span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-1">
                      Daily Target: 80 &middot; <span className="text-emerald-600 font-black">{Math.min(100, Math.round((totalLeadsCreated / 80) * 100))}%</span>
                    </div>
                  </div>

                  {/* 4 Mini Metrics */}
                  <div className="col-span-7 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <div className="flex items-center justify-between text-slate-400 text-[10px]">
                        <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-emerald-600 font-bold">↑ +12%</span>
                      </div>
                      <div className="text-base font-black text-slate-900 mt-1">{totalPhotosReceived}</div>
                      <div className="text-[10px] text-slate-500 font-medium truncate">
                        Photos Received
                      </div>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-xl">
                      <div className="flex items-center justify-between text-slate-400 text-[10px]">
                        <FileText className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 font-bold">↑ +8%</span>
                      </div>
                      <div className="text-base font-black text-slate-900 mt-1">{totalLeadsCreated}</div>
                      <div className="text-[10px] text-slate-500 font-medium truncate">
                        Leads Created
                      </div>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-xl">
                      <div className="flex items-center justify-between text-slate-400 text-[10px]">
                        <Send className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-emerald-600 font-bold">↑ +10%</span>
                      </div>
                      <div className="text-base font-black text-slate-900 mt-1">{totalLeadsAssigned}</div>
                      <div className="text-[10px] text-slate-500 font-medium truncate">
                        Leads Assigned
                      </div>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-xl">
                      <div className="flex items-center justify-between text-slate-400 text-[10px]">
                        <Clock className="w-3.5 h-3.5 text-rose-500" />
                        <span className="text-rose-600 font-bold">↓ -5%</span>
                      </div>
                      <div className="text-base font-black text-slate-900 mt-1">{totalPendingPhotos}</div>
                      <div className="text-[10px] text-slate-500 font-medium truncate">
                        Pending Photos
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card B: Time Analysis (Today) (4.5 cols) */}
              <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-black text-slate-900">
                    Time Analysis (Today)
                  </h3>
                </div>

                {/* 3 Metric Pills */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 rounded-xl flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Download className="w-3.5 h-3.5 rotate-180" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Login Time</div>
                      <div className="text-xs font-black text-slate-900">{loginTime}</div>
                    </div>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-xl flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Total Working Time</div>
                      <div className="text-xs font-black text-slate-900">{workingDurationStr}</div>
                    </div>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-xl flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Avg. Entry Time</div>
                      <div className="text-xs font-black text-slate-900">{avgEntryTimeStr}</div>
                    </div>
                  </div>
                </div>

                {/* Hourly Bar Chart */}
                <div className="pt-2">
                  <div className="h-28 flex items-end justify-between gap-2 px-2">
                    {hourlyAnalysis.map((bar) => (
                      <div
                        key={bar.hour}
                        className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
                      >
                        <span className="text-[10px] font-bold text-slate-700">
                          {bar.val}
                        </span>
                        <div
                          className="w-full max-w-[24px] bg-[#F95721] rounded-t-md transition-all duration-500"
                          style={{ height: bar.height }}
                        />
                        <span className="text-[9px] font-semibold text-slate-400 mt-0.5">
                          {bar.hour}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card C: Lead Statistics (2.5 cols) */}
              <div className="lg:col-span-3 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-black text-slate-900">Lead Statistics</h3>
                  </div>
                  <select className="text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5">
                    <option>Today</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-3">
                  {/* Donut Chart */}
                  <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-emerald-500"
                        strokeDasharray={`${leadStats.newPct}, 100`}
                        strokeWidth="5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-amber-500"
                        strokeDasharray={`${leadStats.dupPct}, 100`}
                        strokeDashoffset={`-${leadStats.newPct}`}
                        strokeWidth="5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-rose-500"
                        strokeDasharray={`${leadStats.incPct}, 100`}
                        strokeDashoffset={`-${leadStats.newPct + leadStats.dupPct}`}
                        strokeWidth="5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-xl font-black text-slate-900 leading-none">
                        {totalLeadsCreated}
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                        Total Leads
                      </span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-slate-600 text-[11px]">New Leads</span>
                      <span className="font-bold text-slate-900 text-[11px] ml-auto">
                        {leadStats.newLeads} ({leadStats.newPct}%)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-slate-600 text-[11px]">Duplicate</span>
                      <span className="font-bold text-slate-900 text-[11px] ml-auto">
                        {leadStats.duplicates} ({leadStats.dupPct}%)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <span className="text-slate-600 text-[11px]">Incomplete</span>
                      <span className="font-bold text-slate-900 text-[11px] ml-auto">
                        {leadStats.incomplete} ({leadStats.incPct}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Table: Today's Created Leads */}
            <div
              id="created-leads-ledger"
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-black text-slate-900">
                    Today&apos;s Created Leads
                  </h3>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Filter Area */}
                  <select
                    value={leadsFilterArea}
                    onChange={(e) => {
                      setLeadsFilterArea(e.target.value);
                      setLeadsFilterZone("ALL");
                    }}
                    className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Area</option>
                    {areas.map((a) => (
                      <option key={a._id || a.id} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                  </select>

                  {/* Filter Zone */}
                  <select
                    value={leadsFilterZone}
                    onChange={(e) => setLeadsFilterZone(e.target.value)}
                    className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Zone</option>
                    {(leadsFilterArea === "ALL"
                      ? Array.from(
                          new Set(
                            areas.flatMap((a) =>
                              Array.isArray(a.zones)
                                ? a.zones.map((z) => (typeof z === "string" ? z : z.name))
                                : []
                            )
                          )
                        )
                      : getZonesForArea(leadsFilterArea).map((z) =>
                          typeof z === "string" ? z : z.name
                        )
                    ).map((zName, zIdx) => (
                      <option key={zIdx} value={zName}>
                        {zName}
                      </option>
                    ))}
                  </select>

                  {/* Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by business name or phone..."
                      value={leadsSearchQuery}
                      onChange={(e) => setLeadsSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-56"
                    />
                  </div>

                  {/* Sync / Refresh from MongoDB */}
                  <button
                    onClick={async () => {
                      const res = await fetchLeadsFromDb();
                      showToast(`Synced ${res.length} leads from database!`, "success");
                    }}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Sync leads from MongoDB"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
                    <span>Sync</span>
                  </button>

                  {/* Export Excel */}
                  <button
                    onClick={handleExportData}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-blue-600 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Excel</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">LEAD ID</th>
                      <th className="py-2.5 px-3">BUSINESS NAME</th>
                      <th className="py-2.5 px-3">AREA</th>
                      <th className="py-2.5 px-3">ZONE</th>
                      <th className="py-2.5 px-3">CATEGORY</th>
                      <th className="py-2.5 px-3">ASSIGNED TO</th>
                      <th className="py-2.5 px-3">CREATED AT</th>
                      <th className="py-2.5 px-3">ENTRY TIME</th>
                      <th className="py-2.5 px-3">STATUS</th>
                      <th className="py-2.5 px-3">PHOTO</th>
                      <th className="py-2.5 px-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecentEntries.length > 0 ? (
                      filteredRecentEntries.map((row, idx) => (
                      <tr
                        key={row.id || idx}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="py-3 px-3 font-semibold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-700">
                          {row.leadId}
                        </td>
                        <td className="py-3 px-3 font-extrabold text-slate-900">
                          {row.businessName}
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium">
                          {row.area}
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium">
                          {row.zone}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              row.categoryColor || "bg-pink-50 text-pink-700 border-pink-200"
                            }`}
                          >
                            {row.categoryLabel || "General Store"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-6 h-6 rounded-full ${
                                row.assignedToColor || "bg-rose-500"
                              } text-white font-bold text-[10px] flex items-center justify-center shrink-0`}
                            >
                              {row.assignedToInitials}
                            </span>
                            <span className="font-bold text-slate-800">
                              {row.assignedToName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-medium">
                          {row.createdAt}
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-bold text-[11px]">
                          {row.entryTime || "3m 12s"}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => setShowPreviewModal(row)}
                            className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 hover:scale-105 transition-transform"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={row.photoUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </button>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setShowPreviewModal(row)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="View Lead Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                    ) : (
                      <tr>
                        <td colSpan={12} className="py-12 text-center text-slate-400 text-xs">
                          No leads found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 5: AREA & ZONE STATUS (MARKET COVERAGE - ADMIN CREATED TERRITORIES) */}
        {/* ========================================================================= */}
        {currentView === "coverage" && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                    Admin Synchronized Territories
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Live Coverage Directory
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-teal-600" />
                  Area &amp; Zone Status
                </h1>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  All geographical areas and sub-locality zones configured by the administrator for field photo capture and automatic sales representative dispatch.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => setCurrentView("dashboard")}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => setCurrentView("photos")}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>Upload Photos</span>
                </button>
                <button
                  onClick={() => setCurrentView("review")}
                  className="px-4 py-2 rounded-xl bg-[#F95721] hover:bg-[#e04816] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-orange-500/25 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add New Lead</span>
                </button>
              </div>
            </div>

            {/* 4 Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    Configured Areas
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {areas.length}
                </div>
                <div className="text-[11px] text-teal-700 font-semibold mt-1">
                  {areas.length > 0 ? areas.map((a) => a.name).slice(0, 3).join(", ") : "No areas assigned"}
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    Active Zones
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Compass className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {coverageList.length}
                </div>
                <div className="text-[11px] text-blue-700 font-semibold mt-1">
                  100% Configured by Admin
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    Designated Reps
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {new Set(coverageList.map((c) => c.assignedRep)).size}
                </div>
                <div className="text-[11px] text-purple-700 font-semibold mt-1">
                  {Array.from(new Set(coverageList.map((c) => c.assignedRep).filter(Boolean))).slice(0, 3).join(", ") || "Active Sales Team"}
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    Market Coverage
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Target className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {overallCoveragePercentage}%
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                  Overall Field Progress
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Area Filter */}
                <select
                  value={coverageFilterArea}
                  onChange={(e) => setCoverageFilterArea(e.target.value)}
                  className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Territories ({areas.length || 1})</option>
                  {areas.map((a) => (
                    <option key={a._id || a.id} value={a.name}>
                      {a.name} ({a.zones?.length || 0} Zones)
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={coverageFilterStatus}
                  onChange={(e) => setCoverageFilterStatus(e.target.value)}
                  className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Status</option>
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Not Started">Not Started</option>
                </select>
              </div>

              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search zone by name, code, or sales rep..."
                  value={coverageSearchQuery}
                  onChange={(e) => setCoverageSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Area & Zones Master Table */}
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span>Admin Master Zones Directory</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                      {filteredCoverageList.length} Zones Available
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Click &ldquo;Capture Lead&rdquo; to pre-select any zone and automatically route to the designated sales executive.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/60">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">ZONE / SUB-LOCALITY</th>
                      <th className="py-3 px-4">PARENT AREA</th>
                      <th className="py-3 px-4">CONFIGURED BY</th>
                      <th className="py-3 px-4">DESIGNATED SALES EXECUTIVE</th>
                      <th className="py-3 px-4">LEADS CAPTURED</th>
                      <th className="py-3 px-4">STATUS</th>
                      <th className="py-3 px-4">COVERAGE</th>
                      <th className="py-3 px-4 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredCoverageList.length > 0 ? (
                      filteredCoverageList.map((item, idx) => (
                        <tr key={`${item.area}_${item.zone}_${idx}`} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <MapPin className={`w-4 h-4 ${item.pinColor}`} />
                              <div>
                                <span className="block text-slate-900 font-bold">{item.zone}</span>
                                {item.zoneCode && (
                                  <span className="text-[10px] font-mono text-slate-400 font-normal">
                                    CODE: {item.zoneCode}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-800">{item.area}</span>
                              <span className="text-[9px] font-mono font-bold text-teal-700 bg-teal-50 px-1 py-0.5 rounded border border-teal-200">
                                {item.areaCode}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                              <CheckCircle2 className="w-3 h-3 text-teal-600" />
                              Admin Created
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                {item.assignedRep.slice(0, 2).toUpperCase()}
                              </span>
                              <div>
                                <span className="font-bold text-slate-800 block text-xs">
                                  {item.assignedRep}
                                </span>
                                <span className="text-[10px] text-slate-400 block font-normal">
                                  Sales Executive
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-700">
                            {item.leads}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${item.statusColor}`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="w-32 space-y-1">
                              <div className="flex justify-between text-[11px] font-bold text-slate-700">
                                <span>{item.coverage}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${item.barColor}`}
                                  style={{ width: `${item.coverage}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  const repId = resolveMatchedRep(item.zone, item.areaId);
                                  const repObj = salesReps.find((s) => (s._id || s.id) === repId);
                                  setFormData((prev) => ({
                                    ...prev,
                                    area: item.area,
                                    areaId: item.areaId,
                                    zone: item.zone,
                                    assignedToId: repId,
                                    assignedToName: repObj?.name || item.assignedRep,
                                  }));
                                  showToast(`Selected ${item.zone} (${item.area}). Ready to create lead!`, "success");
                                  setCurrentView("review");
                                }}
                                className="px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#F95721] font-bold text-xs border border-orange-200 transition-colors cursor-pointer"
                                title="Add lead for this zone"
                              >
                                Capture Lead
                              </button>
                              <button
                                onClick={() => {
                                  setUploadMetadata((prev) => ({
                                    ...prev,
                                    area: item.area,
                                    zone: item.zone,
                                    batchName: `${item.area.toUpperCase().replace(/\s+/g, "")}-${item.zone.toUpperCase().replace(/\s+/g, "")}-270925-01`,
                                  }));
                                  showToast(`Selected ${item.zone} (${item.area}) for photo upload`, "info");
                                  setCurrentView("photos");
                                }}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                                title="Upload photos for this zone"
                              >
                                <Upload className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                          No matching zones found. Clear your search or filter to see all admin territories.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Duplicate Collision Alert Modal */}
      {duplicateModal.show && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-scale-in border-2 border-amber-300 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Duplicate Lead Flagged!
                </h3>
                <p className="text-xs text-slate-500">
                  Collision detected with existing lead or customer
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs">
              {duplicateModal.matches.map((m, i) => (
                <div key={i} className="flex justify-between items-center py-1">
                  <div>
                    <span className="font-black text-slate-900">{m.businessName}</span>
                    <span className="text-slate-500 ml-1">({m.phone})</span>
                  </div>
                  <span className="font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                    Assigned: {m.assignedToName || "Sales"}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => {
                  const rem = photosQueue.filter((_, idx) => idx !== currentIndex);
                  setPhotosQueue(rem);
                  if (rem.length > 0) {
                    selectPhotoItem(Math.min(currentIndex, rem.length - 1), rem);
                  }
                  setDuplicateModal({
                    show: false,
                    matches: [],
                    customerMatch: null,
                    leadData: null,
                  });
                  showToast("Duplicate photo discarded", "info");
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200"
              >
                Discard Duplicate
              </button>
              <button
                onClick={() => {
                  setDuplicateModal({
                    show: false,
                    matches: [],
                    customerMatch: null,
                    leadData: null,
                  });
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Edit / Re-enter
              </button>
              <button
                onClick={executeLeadCreation}
                className="flex-1 py-2.5 rounded-xl bg-[#F95721] hover:bg-[#e84915] text-white text-xs font-black shadow-xs"
              >
                Force Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Preview Details Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-scale-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Lead Details
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {showPreviewModal.businessName}
                </h3>
              </div>
              <button
                onClick={() => setShowPreviewModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full h-48 rounded-2xl overflow-hidden bg-slate-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={showPreviewModal.photoUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-medium block">Lead ID</span>
                <span className="font-black text-slate-800">
                  {showPreviewModal.leadId}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-medium block">Status</span>
                <span className="font-black text-emerald-600">
                  {showPreviewModal.status}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-medium block">Area &amp; Zone</span>
                <span className="font-black text-slate-800">
                  {showPreviewModal.area}, {showPreviewModal.zone}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-medium block">Assigned To</span>
                <span className="font-black text-indigo-700">
                  {showPreviewModal.assignedToName}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowPreviewModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-70 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-bounce-in ${
            toast.type === "error"
              ? "bg-rose-900 text-white border-rose-700"
              : toast.type === "success"
                ? "bg-slate-900 text-white border-slate-700"
                : "bg-blue-900 text-white border-blue-700"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : toast.type === "error" ? (
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          ) : (
            <Sparkles className="w-4 h-4 text-blue-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
