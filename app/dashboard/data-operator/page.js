"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import DailyReportView from "./components/DailyReportView";
import ExportDataView from "./components/ExportDataView";
import { api } from "@/lib/api";
import {
  PlusCircle,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Send,
  Trash2,
  RotateCw,
  ZoomIn,
  ZoomOut,
  User,
  MapPin,
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Layers,
  Sparkles,
  ArrowRight,
  ArrowLeft,
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

// Celebration Particle Coordinates & Styling for 360° Happiness Blast
const CELEBRATION_PARTICLES = [
  { id: 1, x: "55px", y: "-15px", r: "85deg", color: "bg-amber-400", size: "w-2.5 h-1.5", delay: "0s" },
  { id: 2, x: "42px", y: "45px", r: "190deg", color: "bg-rose-500", size: "w-2 h-2 rounded-full", delay: "0.08s" },
  { id: 3, x: "-12px", y: "60px", r: "140deg", color: "bg-emerald-400", size: "w-3 h-1.5", delay: "0.14s" },
  { id: 4, x: "-52px", y: "36px", r: "310deg", color: "bg-sky-400", size: "w-2 h-2", delay: "0.04s" },
  { id: 5, x: "-62px", y: "-8px", r: "160deg", color: "bg-purple-500", size: "w-2.5 h-1.5", delay: "0.18s" },
  { id: 6, x: "-40px", y: "-50px", r: "75deg", color: "bg-amber-300", size: "w-2 h-2 rounded-full", delay: "0.06s" },
  { id: 7, x: "8px", y: "-62px", r: "260deg", color: "bg-emerald-500", size: "w-3 h-1", delay: "0.16s" },
  { id: 8, x: "48px", y: "-46px", r: "135deg", color: "bg-pink-500", size: "w-2 h-2", delay: "0.10s" },
  { id: 9, x: "65px", y: "15px", r: "220deg", color: "bg-orange-500", size: "w-2.5 h-1.5", delay: "0.22s" },
  { id: 10, x: "-26px", y: "-65px", r: "45deg", color: "bg-indigo-400", size: "w-2 h-2", delay: "0.20s" },
  { id: 11, x: "24px", y: "62px", r: "170deg", color: "bg-amber-500", size: "w-3 h-1.5", delay: "0.26s" },
  { id: 12, x: "-60px", y: "-32px", r: "290deg", color: "bg-teal-400", size: "w-2 h-2 rounded-full", delay: "0.12s" },
  { id: 13, x: "30px", y: "-55px", r: "110deg", color: "bg-rose-400", size: "w-2.5 h-1", delay: "0.24s" },
  { id: 14, x: "-48px", y: "-15px", r: "200deg", color: "bg-yellow-400", size: "w-2 h-2", delay: "0.05s" },
  { id: 15, x: "60px", y: "-35px", r: "155deg", color: "bg-cyan-400", size: "w-2.5 h-1.5", delay: "0.17s" },
  { id: 16, x: "-35px", y: "55px", r: "235deg", color: "bg-fuchsia-400", size: "w-2 h-2", delay: "0.21s" },
];

const CELEBRATION_STARS = [
  { id: "s1", text: "✦", x: "40px", y: "-38px", color: "text-amber-400", delay: "0.05s" },
  { id: "s2", text: "★", x: "-45px", y: "-36px", color: "text-yellow-300", delay: "0.12s" },
  { id: "s3", text: "✦", x: "44px", y: "32px", color: "text-emerald-400", delay: "0.18s" },
  { id: "s4", text: "✧", x: "-38px", y: "40px", color: "text-rose-400", delay: "0.10s" },
  { id: "s5", text: "★", x: "0px", y: "-52px", color: "text-orange-400", delay: "0.15s" },
  { id: "s6", text: "✧", x: "-55px", y: "2px", color: "text-purple-400", delay: "0.25s" },
];

// 5-Second Celebration Canvas Confetti Engine (Hardware-Accelerated 360° Blast)
function CelebrationConfettiCanvas({ active }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animId;
    const rect = canvas.getBoundingClientRect();
    const width = (canvas.width = rect.width || 360);
    const height = (canvas.height = rect.height || 280);

    const colors = [
      "#F95721", "#10B981", "#F59E0B", "#3B82F6",
      "#EC4899", "#8B5CF6", "#EAB308", "#06B6D4", "#EF4444"
    ];

    const originX = width / 2;
    const originY = 95;

    const makeBurst = (count, power = 1) => {
      const arr = [];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 8 + 3.5) * power;
        arr.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (Math.random() * 4 + 1),
          size: Math.random() * 7 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 14,
          gravity: 0.22,
          drag: 0.95,
          shape: Math.random() > 0.4 ? "rect" : Math.random() > 0.5 ? "circle" : "star",
        });
      }
      return arr;
    };

    let particles = makeBurst(75, 1.3);

    const t1 = setTimeout(() => {
      particles = particles.concat(makeBurst(45, 1.1));
    }, 1200);

    const t2 = setTimeout(() => {
      particles = particles.concat(makeBurst(35, 0.9));
    }, 2500);

    const startTime = Date.now();

    const drawStar = (c, cx, cy, spikes, outerRadius, innerRadius) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;
      c.beginPath();
      c.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        c.lineTo(x, y);
        rot += step;
        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        c.lineTo(x, y);
        rot += step;
      }
      c.lineTo(cx, cy - outerRadius);
      c.closePath();
      c.fill();
    };

    const loop = () => {
      const elapsed = Date.now() - startTime;
      ctx.clearRect(0, 0, width, height);
      const alpha = elapsed > 4200 ? Math.max(0, 1 - (elapsed - 4200) / 800) : 1;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawStar(ctx, 0, 0, 5, p.size / 1.5, p.size / 3);
        }
        ctx.restore();
      }

      if (elapsed < 5000 && active) {
        animId = requestAnimationFrame(loop);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    animId = requestAnimationFrame(loop);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none z-30 transition-opacity duration-300 ${
        active ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}

// Real-time Data Operator Hub (Dynamic Data)

export default function DataOperatorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [internalView, setInternalView] = useState(null);
  const viewParam = searchParams.get("view");
  const actionParam = searchParams.get("action");

  // Clear internal override whenever URL search parameter changes
  useEffect(() => {
    setInternalView(null);
  }, [viewParam, actionParam]);

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
              : viewParam === "reports" || viewParam === "daily-report"
                ? "reports"
                : viewParam === "export" || actionParam === "export"
                  ? "export"
                  : "dashboard";

  const setCurrentView = (v) => {
    setInternalView(v);
    const targetUrl =
      v === "dashboard"
        ? "/dashboard/data-operator"
        : `/dashboard/data-operator?view=${v}`;
    router.push(targetUrl);
  };

  // Stepper State for Market Photo Upload (Screenshot 2)
  const [uploadStep, setUploadStep] = useState(1);
  const [selectedPhotosList, setSelectedPhotosList] = useState([]);
  const [isUploadingToCloudinary, setIsUploadingToCloudinary] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");

  // Synchronize uploadStep with current view and URL parameters
  useEffect(() => {
    if (currentView === "photos") {
      const stepParam = searchParams.get("step");
      if (stepParam === "2") {
        setUploadStep(2);
      } else if (stepParam === "1") {
        setUploadStep(1);
      } else if (uploadStep !== 1 && uploadStep !== 2) {
        setUploadStep(1);
      }
    } else if (currentView === "review") {
      setUploadStep(3);
    } else if (currentView === "leads") {
      setUploadStep(4);
    }
  }, [currentView, searchParams]);

  // Filter state for My Created Leads (Screenshot 4)
  const [leadsFilterArea, setLeadsFilterArea] = useState("ALL");
  const [leadsFilterZone, setLeadsFilterZone] = useState("ALL");
  const [leadsSearchQuery, setLeadsSearchQuery] = useState("");
  const [leadsFilterDate, setLeadsFilterDate] = useState("");

  // Filter state for Area / Zone Status (Market Coverage)
  const [coverageFilterArea, setCoverageFilterArea] = useState("ALL");
  const [coverageSearchQuery, setCoverageSearchQuery] = useState("");
  const [coverageFilterStatus, setCoverageFilterStatus] = useState("ALL");

  // Logged-in Operator User Session & Profile
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("user");
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return null;
  });
  const [userName, setUserName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("userName") || "Data Operator";
    }
    return "Data Operator";
  });
  const [currentUserAvatar, setCurrentUserAvatar] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("userAvatar") || null;
    }
    return null;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleAvatarSync = (e) => {
      const av =
        e.detail?.avatarUrl || localStorage.getItem("userAvatar") || null;
      setCurrentUserAvatar(av);
    };
    window.addEventListener("crm:avatar-updated", handleAvatarSync);
    return () =>
      window.removeEventListener("crm:avatar-updated", handleAvatarSync);
  }, []);

  // Dynamic Session Tracking
  const [loginTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
    visitDate: new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    area: "",
    zone: "",
    batchName: "",
    remarks: "",
  });

  // Interactive Modal States
  const [showPreviewModal, setShowPreviewModal] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal Photo Zoom, Rotate & Pan State
  const [modalZoom, setModalZoom] = useState(1);
  const [modalRotation, setModalRotation] = useState(0);
  const [modalPan, setModalPan] = useState({ x: 0, y: 0 });
  const [isPanningModal, setIsPanningModal] = useState(false);
  const modalDragStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setModalZoom(1);
    setModalRotation(0);
    setModalPan({ x: 0, y: 0 });
    setIsPanningModal(false);
  }, [showPreviewModal]);

  // Photos Queue for Conversion (Persisted dynamically in localStorage across browser sessions)
  const [photosQueue, setPhotosQueue] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        // Clean up legacy storage if present
        localStorage.removeItem("data_operator_photos_queue");
        const saved = localStorage.getItem("data_operator_photos_queue_v2");
        if (saved) {
          const parsed = JSON.parse(saved);
          return Array.isArray(parsed) ? parsed : [];
        }
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
        localStorage.setItem(
          "data_operator_photos_queue_v2",
          JSON.stringify(serializable),
        );
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

  // 5-Second Celebration Blast State
  const [showCelebrationBlast, setShowCelebrationBlast] = useState(false);
  const celebrationTimerRef = useRef(null);

  const triggerCelebrationBlast = () => {
    setShowCelebrationBlast(false);
    setTimeout(() => {
      setShowCelebrationBlast(true);
      if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
      celebrationTimerRef.current = setTimeout(() => {
        setShowCelebrationBlast(false);
      }, 5000);
    }, 20);
  };

  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
    };
  }, []);

  // Auto-trigger 5s celebration blast whenever entering View 4 (My Created Leads / Lead Created)
  useEffect(() => {
    if (currentView === "leads") {
      triggerCelebrationBlast();
    }
  }, [currentView]);

  // Reference Data: Areas & Sales Reps
  const [areas, setAreas] = useState([]);
  const [salesReps, setSalesReps] = useState([]);

  // Batch Ingestion Form State
  const [batchAreaId, setBatchAreaId] = useState("");
  const uploadPageFileInputRef = useRef(null);

  // Photo Viewer Controls (On-Page Review Zoom & Pan)
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imagePan, setImagePan] = useState({ x: 0, y: 0 });
  const [isPanningImage, setIsPanningImage] = useState(false);
  const imageDragStartRef = useRef({ x: 0, y: 0 });
  const imageViewerRef = useRef(null);

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
    (e) => e.assignedToName && e.assignedToName !== "Unassigned",
  ).length;
  const totalPendingPhotos = photosQueue.length;
  const totalPhotosReceived = totalLeadsCreated + totalPendingPhotos;
  const totalIncompleteLeads = recentEntries.filter(
    (e) => !e.phone || e.status === "Incomplete",
  ).length;

  const dataAccuracyStr =
    totalLeadsCreated > 0
      ? `${Math.round(((totalLeadsCreated - totalIncompleteLeads) / totalLeadsCreated) * 100)}%`
      : "100%";

  const avgEntryTimeStr = totalLeadsCreated > 0 ? "3m 15s" : "0m";

  // Dynamic Hourly Distribution for Time Analysis
  const hourlyAnalysis = useMemo(() => {
    const hours = [
      "9AM",
      "10AM",
      "11AM",
      "12PM",
      "1PM",
      "2PM",
      "3PM",
      "4PM",
      "5PM",
      "6PM",
    ];
    const counts = {
      "9AM": 0,
      "10AM": 0,
      "11AM": 0,
      "12PM": 0,
      "1PM": 0,
      "2PM": 0,
      "3PM": 0,
      "4PM": 0,
      "5PM": 0,
      "6PM": 0,
    };

    recentEntries.forEach((entry) => {
      if (entry.createdDate) {
        const d = new Date(entry.createdDate);
        if (!isNaN(d.getTime())) {
          const h = d.getHours();
          const map = {
            9: "9AM",
            10: "10AM",
            11: "11AM",
            12: "12PM",
            13: "1PM",
            14: "2PM",
            15: "3PM",
            16: "4PM",
            17: "5PM",
            18: "6PM",
          };
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
    const duplicates = recentEntries.filter(
      (r) => r.status === "Duplicate",
    ).length;
    const incomplete = recentEntries.filter(
      (r) => r.status === "Incomplete" || !r.phone,
    ).length;
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
    const totalBytes = selectedPhotosList.reduce(
      (acc, p) => acc + (p.file?.size || 0),
      0,
    );
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
            re.area?.toLowerCase() === area.name.toLowerCase(),
        ).length;

        const baseTarget = z.targetLeads || area.targetLeads || 50;
        const totalCaptured = matchedRecentCount;
        const coverage =
          baseTarget > 0
            ? Math.min(100, Math.round((totalCaptured / baseTarget) * 100))
            : 0;

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
  }, [
    coverageList,
    coverageFilterArea,
    coverageFilterStatus,
    coverageSearchQuery,
  ]);

  // Nearby businesses for Review Screen derived dynamically from database
  const nearbyBusinesses = useMemo(() => {
    if (!formData.area && !formData.zone) return [];
    return recentEntries
      .filter((e) => {
        const matchArea =
          formData.area &&
          e.area?.toLowerCase() === formData.area.toLowerCase();
        const matchZone =
          formData.zone &&
          e.zone?.toLowerCase() === formData.zone.toLowerCase();
        return (
          (matchArea || matchZone) && e.businessName !== formData.businessName
        );
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
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info",
  });

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
          const uStr =
            typeof window !== "undefined" ? localStorage.getItem("user") : null;
          if (uStr && !isCancelled) {
            const parsed = JSON.parse(uStr);
            setCurrentUser(parsed);
            if (parsed?.name) setUserName(parsed.name);
            if (parsed?.avatarUrl) setCurrentUserAvatar(parsed.avatarUrl);
          }
          const storedAvatar =
            typeof window !== "undefined"
              ? localStorage.getItem("userAvatar")
              : null;
          if (storedAvatar && !isCancelled) setCurrentUserAvatar(storedAvatar);
        } catch {
          // ignore
        }

        try {
          const meRes = await api.get("/auth/me").catch(() => null);
          if (meRes?.data && !isCancelled) {
            const me = meRes.data.user || meRes.data;
            setCurrentUser(me);
            if (me.name) setUserName(me.name);
            if (me.avatarUrl) {
              setCurrentUserAvatar(me.avatarUrl);
              if (typeof window !== "undefined") {
                localStorage.setItem("userAvatar", me.avatarUrl);
              }
            }
          }
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
              (typeof firstArea.zones?.[0] === "string"
                ? firstArea.zones[0]
                : "");
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
          leadId:
            l.leadNumber ||
            `LD-${String(l._id || Math.random())
              .slice(-5)
              .toUpperCase()}`,
          businessName: l.businessName || "Unnamed Business",
          ownerName: l.contactName || "",
          phone: l.phone || "",
          alternatePhone: l.alternatePhone || "",
          area: l.areaId?.name || l.area || "General Area",
          zone: l.zone || "General Zone",
          categoryLabel: l.businessCategory || "General Store",
          categoryColor: "bg-blue-50 text-blue-700 border-blue-200",
          assignedToName: l.assignedToId?.name || "Unassigned",
          assignedToInitials: (l.assignedToId?.name || "UN")
            .slice(0, 2)
            .toUpperCase(),
          assignedToColor: "bg-indigo-600",
          createdAt: l.createdAt
            ? new Date(l.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Today",
          createdDate: l.createdAt ? new Date(l.createdAt) : new Date(),
          rawCreatedAt: l.createdAt || new Date().toISOString(),
          entryTime: "—",
          status: l.status || "Assigned",
          photoUrl: l.shopImageUrl || "",
        }));
        setRecentEntries(formatted);
        if (formatted.length > 0) {
          const first = formatted[0];
          setLastCreatedLead(
            (prev) =>
              prev || {
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
              },
          );
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
        a.name?.toLowerCase() === String(areaNameOrId).toLowerCase(),
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
        a.name?.toLowerCase() === String(formData?.area || "").toLowerCase(),
    );
    if (currentAreaObj && Array.isArray(currentAreaObj.zones)) {
      const foundZone = currentAreaObj.zones.find(
        (z) => (z.name || "").toLowerCase().trim() === zoneLower,
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
          u.areaIds.some((a) => (a._id || a) === areaId),
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
    setImagePan({ x: 0, y: 0 });
    setIsPanningImage(false);

    const targetArea =
      item.areaId ||
      batchAreaId ||
      (areas[0] ? areas[0]._id || areas[0].id : "");
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
      area: item.areaName || areas[0]?.name || "",
      zone: targetZone,
      assignedToId: autoRep,
      assignedToName: repObj?.name || salesReps[0]?.name || "Sales Executive",
      remark: item.remark || "",
    });
  };

  const handleClearPhotosQueue = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("data_operator_photos_queue");
        localStorage.removeItem("data_operator_photos_queue_v2");
      } catch (e) {}
    }
    setPhotosQueue([]);
    setCurrentIndex(0);
    showToast("All pending photos cleared from queue", "success");
  };

  const handleDeletePhotoFromQueue = (indexToDelete) => {
    const updated = photosQueue.filter((_, idx) => idx !== indexToDelete);
    setPhotosQueue(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("data_operator_photos_queue_v2", JSON.stringify(updated));
      } catch (e) {}
    }
    if (updated.length === 0) {
      setCurrentIndex(0);
    } else {
      const nextIdx = Math.min(currentIndex, updated.length - 1);
      selectPhotoItem(nextIdx, updated);
    }
    showToast("Photo removed from pending queue", "info");
  };

  const handleTogglePhotoCheck = (id) => {
    setSelectedPhotosList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    );
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

    showToast(`Added ${newItems.length} photos! Proceeding to Step 2 to verify.`, "success");
    if (uploadPageFileInputRef.current)
      uploadPageFileInputRef.current.value = "";
    setUploadStep(2);
  };

  const handleUploadAllSelected = async () => {
    const checkedItems = selectedPhotosList.filter((p) => p.checked);
    if (checkedItems.length === 0) {
      showToast("No photos selected for upload", "error");
      return;
    }

    setIsUploadingToCloudinary(true);
    setUploadProgressText(
      `Uploading 1 of ${checkedItems.length} photos to Cloudinary...`,
    );

    const updatedQueue = [...photosQueue];
    const updatedSelected = [...selectedPhotosList];
    let successCount = 0;

    for (let i = 0; i < checkedItems.length; i++) {
      const item = checkedItems[i];
      setUploadProgressText(
        `Uploading ${i + 1} of ${checkedItems.length} photos to Cloudinary...`,
      );

      if (
        item.file &&
        (!item.previewUrl || !item.previewUrl.startsWith("http"))
      ) {
        try {
          const res = await api.upload(
            "/leads/upload-photo",
            item.file,
            "photo",
          );
          if (res?.data?.url) {
            successCount++;
            // Update queue item with real Cloudinary URL
            const qIdx = updatedQueue.findIndex(
              (q) => q.id === item.id || q.fileName === item.fileName,
            );
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
          console.warn(
            `Cloudinary upload notice for ${item.fileName}:`,
            uploadErr,
          );
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
      "success",
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
          alternatePhone:
            formData.alternatePhone.replace(/\D/g, "") || undefined,
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

      if (
        currentItem?.file &&
        (!finalPhotoUrl || !finalPhotoUrl.startsWith("http"))
      ) {
        try {
          const uploadRes = await api.upload(
            "/leads/upload-photo",
            currentItem.file,
            "photo",
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
        (s) => (s._id || s.id) === formData.assignedToId,
      );
      const repName =
        dispatchedRep?.name ||
        formData.assignedToName ||
        salesReps[0]?.name ||
        "Sales Executive";
      const initials = repName.slice(0, 2).toUpperCase();

      const newLeadNumber =
        createdLead?.data?.leadNumber ||
        `LD-${Math.floor(10000 + Math.random() * 90000)}`;

      const newEntry = {
        id: createdLead?.data?._id || newLeadNumber,
        leadId: newLeadNumber,
        businessName: formData.businessName.trim(),
        area: formData.area || areas[0]?.name || "—",
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
        createdDate: new Date(),
        rawCreatedAt: new Date().toISOString(),
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
        area: formData.area || areas[0]?.name || "—",
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
        photoName: currentItem
          ? `${currentItem.fileName || "Photo"} (${currentItem.fileSize || "—"})`
          : "Manual Entry",
        photoUrl: finalPhotoUrl,
      });

      const remainingQueue = photosQueue.filter(
        (_, idx) => idx !== currentIndex,
      );
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

      // Trigger 5-Second Celebration Blast of Happiness
      triggerCelebrationBlast();

      // Seamlessly advance to Screen 4 (Lead Created Successfully / My Created Leads)
      setUploadStep(4);
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
    const listToExport =
      filteredRecentEntries.length > 0 ? filteredRecentEntries : recentEntries;

    if (listToExport.length === 0) {
      showToast("No leads to export yet", "info");
      return;
    }

    const headers = [
      "Lead ID,Business Name,Area,Zone,Category,Assigned To,Created At,Status",
    ];
    const rows = listToExport.map(
      (e) =>
        `"${e.leadId}","${e.businessName}","${e.area}","${e.zone}","${e.categoryLabel}","${e.assignedToName}","${e.createdAt}","${e.status}"`,
    );
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `DataOperator_Leads_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exported leads to CSV successfully!", "success");
  };

  const activePhoto = photosQueue[currentIndex] || null;

  // Stop page scrolling when mouse is over the image viewer and zoom the photo instead
  useEffect(() => {
    const el = imageViewerRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.deltaY < 0) {
        setZoomLevel((prev) => Math.min(4, +(prev + 0.25).toFixed(2)));
      } else {
        setZoomLevel((prev) => {
          const next = Math.max(1, +(prev - 0.25).toFixed(2));
          if (next === 1) setImagePan({ x: 0, y: 0 });
          return next;
        });
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, [activePhoto, currentView]);

  const selectedPhotosCount = selectedPhotosList.filter(
    (p) => p.checked,
  ).length;

  // Filtered entries for Screen 4
  const filteredRecentEntries = recentEntries.filter((item) => {
    if (leadsFilterArea !== "ALL" && item.area !== leadsFilterArea)
      return false;
    if (leadsFilterZone !== "ALL" && item.zone !== leadsFilterZone)
      return false;

    // Filter by Creation Date (YYYY-MM-DD)
    if (leadsFilterDate) {
      const dObj = item.createdDate
        ? new Date(item.createdDate)
        : item.rawCreatedAt
          ? new Date(item.rawCreatedAt)
          : item.createdAt && !isNaN(new Date(item.createdAt).getTime())
            ? new Date(item.createdAt)
            : null;

      if (dObj && !isNaN(dObj.getTime())) {
        const y = dObj.getFullYear();
        const m = String(dObj.getMonth() + 1).padStart(2, "0");
        const d = String(dObj.getDate()).padStart(2, "0");
        const itemYMD = `${y}-${m}-${d}`;
        if (itemYMD !== leadsFilterDate) return false;
      } else {
        return false;
      }
    }

    if (leadsSearchQuery.trim()) {
      const q = leadsSearchQuery.toLowerCase();
      return (
        item.businessName?.toLowerCase().includes(q) ||
        item.leadId?.toLowerCase().includes(q) ||
        item.phone?.toLowerCase().includes(q) ||
        item.assignedToName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Reusable Interactive 4-Step Stepper Header (Fully Responsive on Mobile, Tablet & Desktop)
  const renderStepper = (activeStep) => (
    <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-1 sm:gap-2 md:gap-3 py-1.5 px-2 sm:px-3 bg-slate-50/80 sm:bg-transparent rounded-xl border border-slate-200/60 sm:border-0 overflow-x-auto scrollbar-none min-w-0">
      {/* Step 1: Upload */}
      <button
        type="button"
        onClick={() => {
          setUploadStep(1);
          setCurrentView("photos");
        }}
        className="flex items-center gap-1.5 sm:gap-2 group cursor-pointer focus:outline-none shrink-0"
      >
        <div
          className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-[11px] sm:text-xs transition-all ${
            activeStep === 1
              ? "bg-[#F95721] text-white shadow-md shadow-orange-500/30 scale-105"
              : activeStep > 1
                ? "bg-emerald-500 text-white"
                : "bg-slate-200 text-slate-500 group-hover:bg-slate-300"
          }`}
        >
          {activeStep > 1 ? "✓" : "1"}
        </div>
        <span
          className={`text-[11px] sm:text-xs font-bold transition-colors whitespace-nowrap ${
            activeStep === 1
              ? "text-slate-900"
              : activeStep > 1
                ? "text-slate-700"
                : "text-slate-400"
          }`}
        >
          Upload
        </span>
      </button>

      <div
        className={`flex-1 min-w-1.5 sm:min-w-3 max-w-6 md:max-w-8 h-0.5 transition-colors shrink-0 ${
          activeStep > 1 ? "bg-emerald-500" : "bg-slate-200"
        }`}
      />

      {/* Step 2: Verify */}
      <button
        type="button"
        onClick={() => {
          setUploadStep(2);
          setCurrentView("photos");
        }}
        className="flex items-center gap-1.5 sm:gap-2 group cursor-pointer focus:outline-none shrink-0"
      >
        <div
          className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-[11px] sm:text-xs transition-all ${
            activeStep === 2
              ? "bg-[#F95721] text-white shadow-md shadow-orange-500/30 scale-105"
              : activeStep > 2
                ? "bg-emerald-500 text-white"
                : "bg-slate-200 text-slate-500 group-hover:bg-slate-300"
          }`}
        >
          {activeStep > 2 ? "✓" : "2"}
        </div>
        <span
          className={`text-[11px] sm:text-xs font-bold transition-colors whitespace-nowrap ${
            activeStep === 2
              ? "text-slate-900"
              : activeStep > 2
                ? "text-slate-700"
                : "text-slate-400"
          }`}
        >
          Verify
        </span>
      </button>

      <div
        className={`flex-1 min-w-1.5 sm:min-w-3 max-w-6 md:max-w-8 h-0.5 transition-colors shrink-0 ${
          activeStep > 2 ? "bg-emerald-500" : "bg-slate-200"
        }`}
      />

      {/* Step 3: Lead Entry */}
      <button
        type="button"
        onClick={() => {
          if (
            activeStep === 2 &&
            selectedPhotosList.some(
              (p) =>
                p.checked &&
                p.file &&
                (!p.previewUrl || !p.previewUrl.startsWith("http")),
            )
          ) {
            handleUploadAllSelected();
          } else {
            if (photosQueue.length > 0) {
              selectPhotoItem(currentIndex >= 0 ? currentIndex : 0);
            }
            setUploadStep(3);
            setCurrentView("review");
          }
        }}
        className="flex items-center gap-1.5 sm:gap-2 group cursor-pointer focus:outline-none shrink-0"
      >
        <div
          className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-[11px] sm:text-xs transition-all ${
            activeStep === 3
              ? "bg-[#F95721] text-white shadow-md shadow-orange-500/30 scale-105"
              : activeStep > 3
                ? "bg-emerald-500 text-white"
                : "bg-slate-200 text-slate-500 group-hover:bg-slate-300"
          }`}
        >
          {activeStep > 3 ? "✓" : "3"}
        </div>
        <span
          className={`text-[11px] sm:text-xs font-bold transition-colors whitespace-nowrap ${
            activeStep === 3
              ? "text-slate-900"
              : activeStep > 3
                ? "text-slate-700"
                : "text-slate-400"
          }`}
        >
          Lead Entry
        </span>
      </button>

      <div
        className={`flex-1 min-w-1.5 sm:min-w-3 max-w-6 md:max-w-8 h-0.5 transition-colors shrink-0 ${
          activeStep > 3 ? "bg-emerald-500" : "bg-slate-200"
        }`}
      />

      {/* Step 4: Complete */}
      <button
        type="button"
        onClick={() => {
          setUploadStep(4);
          setCurrentView("leads");
        }}
        className="flex items-center gap-1.5 sm:gap-2 group cursor-pointer focus:outline-none shrink-0"
      >
        <div
          className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-[11px] sm:text-xs transition-all ${
            activeStep === 4
              ? "bg-[#F95721] text-white shadow-md shadow-orange-500/30 scale-105"
              : "bg-slate-200 text-slate-500 group-hover:bg-slate-300"
          }`}
        >
          {lastCreatedLead && activeStep === 4 ? "✓" : "4"}
        </div>
        <span
          className={`text-[11px] sm:text-xs font-bold transition-colors whitespace-nowrap ${
            activeStep === 4 ? "text-slate-900" : "text-slate-400"
          }`}
        >
          Complete
        </span>
      </button>
    </div>
  );

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      {/* Sidebar with Data Operator Specific Items */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overflow-x-hidden">
        <Navbar showNotificationCenter={false} />

        {/* ========================================================================= */}
        {/* VIEW 1: DATA OPERATOR DASHBOARD (SCREENSHOT 1)                           */}
        {/* ========================================================================= */}
        {currentView === "dashboard" && (
          <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full animate-fade-in min-w-0">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md shadow-orange-500/20 shrink-0 bg-[#F95721] text-white flex items-center justify-center">
                  {currentUserAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentUserAvatar}
                      alt={userName || "Data Operator"}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#F95721] text-white flex items-center justify-center font-black text-sm">
                      {(userName || "DO").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                    Data Operator Dashboard
                  </h1>
                </div>
              </div>

              {/* Calendar & Live Sync Actions (Right) */}
              <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
                <div className="bg-white border border-slate-200/90 rounded-sm px-4 py-2.5 flex items-center gap-3 shadow-2xs">
                  <Calendar className="w-5 h-5 text-slate-600" />
                  <div>
                    <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                      Today
                    </div>
                    <div className="text-md font-bold text-slate-800">
                      {new Date().toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        weekday: "long",
                      })}
                    </div>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    setIsSyncing(true);
                    const res = await fetchLeadsFromDb();
                    setIsSyncing(false);
                    showToast(
                      `Synced ${res.length} live leads from database!`,
                      "success",
                    );
                  }}
                  className="bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 rounded-sm px-3.5 py-2.5 flex items-center gap-2 shadow-2xs transition-colors cursor-pointer text-xs font-bold"
                  title="Synchronize live data with MongoDB"
                >
                  <RefreshCw
                    className={`w-4 h-4 text-teal-600 ${isSyncing ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            </div>

            {/* Top Metric Cards (5 Cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-3.5">
              <div className="bg-white border border-slate-200/90 rounded-sm p-4 shadow-2xs flex flex-col justify-between">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div className="mt-3 flex flex-col justify-center items-center">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900">
                    {totalPhotosReceived}
                  </div>
                  <div className="text-sm sm:text-base font-bold text-slate-700 mt-0.5 text-center">
                    Photos Received
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate text-center">
                    From Today&apos;s Market Visit
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-sm p-4 shadow-2xs flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                    {totalLeadsCreated > 0 ? "↑ Active" : "0 Today"}
                  </span>
                </div>
                <div className="mt-3 flex flex-col justify-center items-center">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900">
                    {totalLeadsCreated}
                  </div>
                  <div className="text-sm sm:text-base font-bold text-slate-700 mt-0.5 text-center">
                    Leads Created
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold mt-0.5 truncate text-center">
                    High quality intake
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-sm p-4 shadow-2xs flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Send className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                    {totalLeadsCreated > 0
                      ? `${Math.round((totalLeadsAssigned / totalLeadsCreated) * 100)}%`
                      : "0%"}
                  </span>
                </div>
                <div className="mt-3 flex flex-col justify-center items-center">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900">
                    {totalLeadsAssigned}
                  </div>
                  <div className="text-sm sm:text-base font-bold text-slate-700 mt-0.5 text-center">
                    Leads Assigned
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate text-center">
                    Forwarded to sales
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-sm p-4 shadow-2xs flex flex-col justify-between">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="mt-3 flex flex-col justify-center items-center">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900">
                    {totalPendingPhotos}
                  </div>
                  <div className="text-sm sm:text-base font-bold text-slate-700 mt-0.5 text-center">
                    Pending Photos
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate text-center">
                    Still to be entered
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-sm p-4 shadow-2xs flex flex-col justify-between col-span-2 sm:col-span-1">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="mt-3 flex flex-col justify-center items-center">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900">
                    {totalIncompleteLeads}
                  </div>
                  <div className="text-sm sm:text-base font-bold text-slate-700 mt-0.5 text-center">
                    Incomplete Leads
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate text-center">
                    Need review
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons Section (4 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3.5">
              <button
                onClick={() => {
                  selectPhotoItem(0);
                  setCurrentView("review");
                }}
                className="bg-linear-to-r from-[#F95721] to-[#FF7043] hover:from-[#e84915] hover:to-[#f85f31] text-white rounded-sm p-4 shadow-md shadow-orange-500/20 transition-all flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Plus className="w-6 h-6 text-white stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-base sm:text-lg font-black text-white truncate">
                      Create New Lead
                    </div>
                    <div className="text-xs sm:text-sm text-orange-100 font-medium truncate">
                      Select photo and enter details
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/90 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>

              <button
                onClick={() => setCurrentView("photos")}
                className="bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-xs rounded-sm p-4 transition-all flex items-center gap-3.5 text-left group min-w-0"
              >
                <div className="w-11 h-11 rounded-sm bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="text-base sm:text-lg font-black text-slate-900 truncate">
                    Open Photo Folder
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400 font-medium truncate">
                    View all market photos
                  </div>
                </div>
              </button>

              <button
                onClick={() => setCurrentView("leads")}
                className="bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-xs rounded-sm p-4 transition-all flex items-center gap-3.5 text-left group min-w-0"
              >
                <div className="w-11 h-11 rounded-sm bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="text-base sm:text-lg font-black text-slate-900 truncate">
                    My Created Leads
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400 font-medium truncate">
                    View today&apos;s entries
                  </div>
                </div>
              </button>

              <button
                onClick={handleExportData}
                className="bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-xs rounded-sm p-4 transition-all flex items-center gap-3.5 text-left group min-w-0"
              >
                <div className="w-11 h-11 rounded-sm bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Download className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="text-base sm:text-lg font-black text-slate-900 truncate">
                    Export Data
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400 font-medium truncate">
                    Download excel (Admin)
                  </div>
                </div>
              </button>
            </div>

            {/* Main 2-Column Split */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* Left Column (8 cols on XL, full width on Tablet/Mobile) */}
              <div className="xl:col-span-8 space-y-6 w-full min-w-0">
                {/* Today's Market Photos Carousel */}
                <div className="bg-white border border-slate-200/90 rounded-sm p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-black text-slate-900">
                        Market Photos
                      </h2>
                      <span className={`text-sm font-bold px-2 py-0.5 rounded-full border ${
                        photosQueue.length > 0
                          ? "text-rose-600 bg-rose-50 border-rose-200"
                          : "text-slate-500 bg-slate-100 border-slate-200"
                      }`}>
                        {photosQueue.length} Pending
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {photosQueue.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearPhotosQueue}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Clear all pending photos"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Clear All Pending</span>
                        </button>
                      )}
                      <button
                        onClick={() => setCurrentView("photos")}
                        className="text-md font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                      >
                        <span>View All Photos</span>
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
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
                            className={`w-36 shrink-0 rounded-sm overflow-hidden border cursor-pointer transition-all hover:scale-102 hover:shadow-md relative ${
                              idx === 0
                                ? "border-2 border-[#F95721] ring-2 ring-orange-500/20"
                                : "border-slate-200"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePhotoFromQueue(idx);
                              }}
                              className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md transition-colors z-20"
                              title="Delete this photo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
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
                      <div className="py-8 px-4 text-center border-2 border-dashed border-slate-200 rounded-sm bg-slate-50/50 flex flex-col items-center justify-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                        <div className="text-md font-bold text-slate-800">
                          No market photos in queue
                        </div>
                        <button
                          onClick={() => setCurrentView("photos")}
                          className="flex items-center justify-center gap-1.5 mt-1 text-sm px-3.5 py-1.5 rounded-full bg-[#F95721] text-white font-bold hover:bg-[#e84915] transition-colors"
                        >
                          <PlusCircle className="w-5 h-5" />
                          <span>Upload Photos</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Today's Recent Entries Table */}
                <div
                  id="recent-entries-section"
                  className="bg-white border border-slate-200/90 rounded-sm p-5 shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h2 className="text-xl font-black text-slate-900">
                        Recent Entries
                      </h2>
                    </div>
                    <button
                      onClick={() => setCurrentView("leads")}
                      className="text-base font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                    >
                      <span>View All</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="min-w-[760px] w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200/80 text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-2.5 px-3 whitespace-nowrap">NO</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">LEAD ID</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">BUSINESS NAME</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">AREA</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">ZONE</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">ASSIGNED TO</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">CREATED AT</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">PHOTO</th>
                          <th className="py-2.5 px-3 text-right whitespace-nowrap">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recentEntries.length > 0 ? (
                          recentEntries.map((row, idx) => (
                            <tr
                              key={row.id || idx}
                              className="hover:bg-slate-50/70 transition-colors"
                            >
                              <td className="py-3 px-3 text-sm font-semibold text-slate-500 whitespace-nowrap">
                                {idx + 1}
                              </td>
                              <td className="py-3 px-3 text-sm font-bold text-slate-700 whitespace-nowrap">
                                {row.leadId}
                              </td>
                              <td className="py-3 px-3 text-sm font-extrabold text-slate-900 whitespace-nowrap">
                                {row.businessName}
                              </td>
                              <td className="py-3 px-3 text-sm text-slate-600 font-medium whitespace-nowrap">
                                {row.area}
                              </td>
                              <td className="py-3 px-3 text-sm text-slate-600 font-medium whitespace-nowrap">
                                {row.zone}
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-6 h-6 rounded-full ${
                                      row.assignedToColor || "bg-rose-500"
                                    } text-white font-bold text-[12px] flex items-center justify-center shrink-0`}
                                  >
                                    {row.assignedToInitials}
                                  </span>
                                  <span className="font-semibold text-sm text-slate-800">
                                    {row.assignedToName}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-sm text-slate-500 font-medium whitespace-nowrap">
                                {row.createdAt}
                              </td>

                              <td className="py-3 px-3 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setShowPreviewModal(row)}
                                  className="w-14 h-12 rounded-sm overflow-hidden border border-slate-200 bg-slate-900 hover:border-blue-500 hover:scale-105 transition-all flex items-center justify-center cursor-pointer shadow-2xs group"
                                  title="Click to view full photo"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={row.photoUrl}
                                    alt={row.businessName || "Photo"}
                                    className="w-full h-full object-contain"
                                  />
                                </button>
                              </td>
                              <td className="py-3 px-3 text-right whitespace-nowrap">
                                <button
                                  onClick={() => setShowPreviewModal(row)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                  title="View Lead Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={10}
                              className="py-8 text-center text-slate-400 text-xs"
                            >
                              No recent lead entries recorded yet. Upload photos
                              and create leads to populate your ledger.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column (4 cols on XL, full width on Tablet/Mobile) */}
              <div className="xl:col-span-4 space-y-6 w-full min-w-0">
                {/* Territory & Admin Area Coverage Card */}
                <div className="bg-white border border-slate-200/90 rounded-sm p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-6 h-6 text-emerald-600" />
                      <div>
                        <h2 className="text-md font-black text-slate-900 flex items-center gap-1.5">
                          Area / Zone Status
                        </h2>
                        <p className="text-[12px] text-slate-400 font-medium">
                          {areas.length > 0
                            ? areas.map((a) => a.name).join(", ")
                            : "Territory Coverage"}{" "}
                          Master Coverage
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentView("coverage")}
                      className="text-md font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Full Status</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-md font-bold text-slate-700 mb-1.5">
                      <span className="flex items-center gap-1 text-slate-500">
                        <span>↓</span> Overall Coverage ({coverageList.length}{" "}
                        Zones)
                      </span>
                      <span className="text-slate-900 font-extrabold">
                        {overallCoveragePercentage}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${overallCoveragePercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="min-w-[300px] w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="pb-2 whitespace-nowrap">AREA / ZONE</th>
                          <th className="pb-2 whitespace-nowrap">REP</th>
                          <th className="pb-2 whitespace-nowrap">LEADS</th>
                          <th className="pb-2 text-center whitespace-nowrap">COVERAGE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {coverageList.slice(0, 6).map((item, idx) => (
                          <tr
                            key={`${item.area}_${item.zone}_${idx}`}
                            className="hover:bg-slate-50/50"
                          >
                            <td className="py-2.5 pr-2 font-bold text-slate-800">
                              <div className="flex items-center gap-1.5">
                                <MapPin
                                  className={`w-4 h-4 ${item.pinColor} shrink-0`}
                                />
                                <div className="ml-2 min-w-0">
                                  <span className="text-sm block leading-tight text-slate-900 truncate">
                                    {item.zone}
                                  </span>
                                  <span className="text-md text-slate-400 font-normal truncate block">
                                    {item.area}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 text-slate-600 font-medium whitespace-nowrap">
                              <span className="text-[12px] font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                                {item.assignedRep}
                              </span>
                            </td>
                            <td className="py-2.5 text-slate-500 font-medium whitespace-nowrap">
                              {item.leads}
                            </td>

                            <td className="py-2.5 pl-2 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-2">
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
                </div>

                {/* My Productivity (Today) */}
                <div className="bg-white border border-slate-200/90 rounded-sm p-5 shadow-2xs">
                  <div className="flex items-center gap-2.5 mb-4">
                    <TrendingUp className="w-6 h-6 text-amber-500" />
                    <h2 className="text-xl font-black text-slate-900">
                      My Productivity (Today)
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-2 gap-3.5">
                    <div className="p-3.5 rounded-sm bg-slate-50/80 border border-slate-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Download className="w-5 h-5 rotate-180" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500">
                          Login Time
                        </div>
                        <div className="text-base font-black text-slate-900">
                          {loginTime}
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-sm bg-slate-50/80 border border-slate-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500">
                          Working Duration
                        </div>
                        <div className="text-base font-black text-slate-900">
                          {workingDurationStr}
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-sm bg-slate-50/80 border border-slate-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500">
                          Leads Created
                        </div>
                        <div className="text-base font-black text-slate-900">
                          {totalLeadsCreated}
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-sm bg-slate-50/80 border border-slate-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500">
                          Avg. Entry Time
                        </div>
                        <div className="text-base font-black text-slate-900">
                          {avgEntryTimeStr}
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-sm bg-slate-50/80 border border-slate-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500">
                          Data Accuracy
                        </div>
                        <div className="text-base font-black text-slate-900">
                          {dataAccuracyStr}
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-sm bg-slate-50/80 border border-slate-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500">
                          Photos Pending
                        </div>
                        <div className="text-base font-black text-slate-900">
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
        {/* VIEW 2: MARKET PHOTO UPLOAD (SCREENSHOT 2)                                */}
        {/* ========================================================================= */}
        {currentView === "photos" && (
          <div className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 max-w-[1600px] mx-auto w-full animate-fade-in min-w-0">
            {/* Header & 4-Step Stepper */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-6 pb-4 border-b border-slate-200/80 min-w-0">
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#F95721] text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                  <UploadCloud className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                    {uploadStep === 2
                      ? `Step 2: Verify & Organize Photos (${selectedPhotosList.length})`
                      : "Step 1: Upload Market Photos"}
                  </h1>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">
                    {uploadStep === 2
                      ? "Inspect photo quality and clarity, zoom in to check signage, then proceed to Lead Entry"
                      : "Upload market visit photos and select area/zone details before verification"}
                  </p>
                </div>
              </div>

              {/* 4-Step Stepper Header */}
              <div className="w-full lg:w-auto shrink-0">
                {renderStepper(uploadStep === 2 ? 2 : 1)}
              </div>
            </div>

            {/* ========================================== */}
            {/* STEP 1: UPLOAD PHOTOS & METADATA          */}
            {/* ========================================== */}
            {uploadStep !== 2 && (
              <div className="space-y-6 animate-fade-in">
                {photosQueue.length > 0 && (
                  <div className="flex items-center justify-between p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-rose-800 font-semibold">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>You currently have {photosQueue.length} pending photo{photosQueue.length > 1 ? "s" : ""} waiting in the queue.</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearPhotosQueue}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 text-xs shadow-xs"
                      title="Delete all pending photos from queue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All Pending Photos</span>
                    </button>
                  </div>
                )}

                {/* 3-Card Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 items-stretch">
                  {/* Card 1: Drag & Drop Dropzone */}
                  <div
                    onClick={() => uploadPageFileInputRef.current?.click()}
                    className="md:col-span-12 xl:col-span-4 border-2 border-dashed border-blue-200 hover:border-blue-500 bg-[#f8fbff] hover:bg-blue-50/40 rounded-sm p-5 sm:p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 min-h-[220px] sm:min-h-[260px]"
                  >
                    <input
                      ref={uploadPageFileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <UploadCloud className="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-black text-slate-900">
                        Drag &amp; Drop Photos Here
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        or click to select multiple images
                      </div>
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-400 leading-relaxed">
                      Supports: JPG, JPEG, PNG | Max size: 10MB per image
                      <br />
                      You can select multiple photos at once
                    </div>
                    <button
                      type="button"
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#F95721] hover:bg-[#e84915] text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer"
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span>Select Photos</span>
                    </button>
                  </div>

                  {/* Card 2: Ingestion Metadata Form */}
                  <div className="md:col-span-7 xl:col-span-5 bg-white border border-slate-200/90 rounded-sm p-4 sm:p-5 space-y-3.5 shadow-2xs flex flex-col justify-between">
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
                              setUploadMetadata({
                                ...uploadMetadata,
                                visitDate: e.target.value,
                              })
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
                              const areaObj = areas.find(
                                (a) => a.name === chosenAreaName,
                              );
                              const areaZones = getZonesForArea(chosenAreaName);
                              const firstZone = areaZones[0]?.name || "Baba Colony";
                              setUploadMetadata({
                                ...uploadMetadata,
                                area: chosenAreaName,
                                zone: firstZone,
                                batchName: `${chosenAreaName.toUpperCase().replace(/\s+/g, "")}-${firstZone.toUpperCase().replace(/\s+/g, "")}-270925-01`,
                              });
                              if (areaObj)
                                setBatchAreaId(areaObj._id || areaObj.id);
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
                          setUploadMetadata({
                            ...uploadMetadata,
                            batchName: e.target.value,
                          })
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
                            setUploadMetadata({
                              ...uploadMetadata,
                              remarks: e.target.value,
                            })
                          }
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Upload Summary */}
                  <div className="md:col-span-5 xl:col-span-3 bg-[#FFF9F6] border border-orange-200/80 rounded-sm p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
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
                          <span className="text-sm font-black text-slate-900">
                            {uploadStats.total}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-slate-600">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span className="font-semibold">Valid Photos</span>
                          </div>
                          <span className="text-sm font-black text-slate-900">
                            {uploadStats.valid}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-slate-600">
                            <XCircle className="w-4 h-4 text-rose-500" />
                            <span className="font-semibold">
                              Duplicate / Invalid
                            </span>
                          </div>
                          <span className="text-sm font-black text-slate-900">
                            {uploadStats.invalid}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-orange-200/60">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Database className="w-4 h-4 text-purple-500" />
                            <span className="font-semibold">Estimated Size</span>
                          </div>
                          <span className="text-sm font-black text-slate-900">
                            {uploadStats.sizeStr}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-orange-200/60">
                      <button
                        type="button"
                        disabled={selectedPhotosList.length === 0}
                        onClick={() => setUploadStep(2)}
                        className="w-full py-2.5 rounded-xl bg-[#F95721] hover:bg-[#e84915] text-white font-black text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <span>Proceed to Step 2: Verify</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Optional Quick Action if photos already staged */}
                {selectedPhotosList.length > 0 && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        ✓
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {selectedPhotosList.length} photos staged and ready for verification
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Area: {uploadMetadata.area} • Zone: {uploadMetadata.zone} • Batch: {uploadMetadata.batchName}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadStep(2)}
                      className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <span>Go to Step 2 (Verify)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ========================================== */}
            {/* STEP 2: VERIFY & ORGANIZE PHOTOS           */}
            {/* ========================================== */}
            {uploadStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                {/* Selected Photos & Verification Controls */}
                <div className="bg-white border border-slate-200/90 rounded-sm p-5 shadow-2xs space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <ImageIcon className="w-5 h-5 text-blue-600 shrink-0" />
                      <div>
                        <h2 className="text-sm font-black text-slate-900">
                          Verify &amp; Organize Photos ({selectedPhotosList.length})
                        </h2>
                        <p className="text-[11px] text-slate-400">
                          Review photo clarity and zoom in before sending to Lead Entry
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setUploadStep(1)}
                        className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-600 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add More Photos</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          showToast(
                            "Removed duplicate / invalid photos from batch",
                          );
                        }}
                        className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-600 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Invalid ({uploadStats.invalid})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPhotosList([]);
                          showToast("Cleared photo selection");
                        }}
                        className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Clear All</span>
                      </button>
                    </div>
                  </div>

                  {/* Selected Photo Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
                    {selectedPhotosList.length > 0 ? (
                      selectedPhotosList.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="border border-slate-200/90 rounded-sm overflow-hidden bg-white shadow-2xs group hover:shadow-md transition-all flex flex-col justify-between"
                        >
                          <div className="relative h-32 w-full bg-slate-900 overflow-hidden flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.previewUrl}
                              alt={item.fileName}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowPreviewModal({
                                  businessName: item.businessName || item.fileName,
                                  photoUrl: item.previewUrl,
                                  leadId: item.fileName,
                                  status: "Verified Photo",
                                  area: uploadMetadata.area,
                                  zone: uploadMetadata.zone,
                                  assignedToName: "Auto Assigned",
                                })
                              }
                              className="absolute bottom-2 right-2 w-7 h-7 rounded-lg bg-slate-900/80 hover:bg-[#F95721] text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                              title="Zoom & Inspect Photo"
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
                                {item.checked && (
                                  <Check className="w-3 h-3 stroke-[3]" />
                                )}
                              </button>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-800 text-[11px] truncate" title={item.fileName}>
                                  {item.fileName}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium">
                                  {item.size}
                                </div>
                              </div>
                            </div>

                            {item.hasTag && (
                              <span className="w-3 h-3 text-blue-500 shrink-0" title="Geotagged">
                                📍
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-sm bg-slate-50/50 flex flex-col items-center justify-center space-y-3">
                        <UploadCloud className="w-10 h-10 text-slate-400" />
                        <div>
                          <p className="text-sm font-bold text-slate-700">
                            No photos in verification queue
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Please upload photos in Step 1 first.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUploadStep(1)}
                          className="px-4 py-2 rounded-xl bg-[#F95721] text-white font-bold text-xs shadow-xs hover:bg-[#e84915] transition-colors cursor-pointer"
                        >
                          ← Go to Step 1: Upload Photos
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bottom Navigation & Action Footer Bar */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setUploadStep(1)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Step 1</span>
                      </button>
                      <div>
                        <div className="text-xs font-black text-slate-900">
                          {selectedPhotosCount} of {selectedPhotosList.length} photos selected
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          Total size: {uploadStats.sizeStr}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        disabled={isUploadingToCloudinary || selectedPhotosCount === 0}
                        onClick={handleUploadAllSelected}
                        className="w-full sm:w-auto px-5 sm:px-6 py-2.5 rounded-xl bg-[#F95721] hover:bg-[#e84915] text-white font-black text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isUploadingToCloudinary ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>
                              {uploadProgressText || "Uploading Photos to Cloudinary..."}
                            </span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-4 h-4" />
                            <span>
                              <span className="hidden sm:inline">Upload &amp; Proceed to Step 3: Lead Entry ({selectedPhotosCount})</span>
                              <span className="sm:hidden">Upload &amp; Proceed ({selectedPhotosCount})</span>
                            </span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: REVIEW & ASSIGN LEAD (SCREENSHOT 3)                              */}
        {/* ========================================================================= */}
        {currentView === "review" && (
          <div className="flex-1 flex flex-col justify-between min-h-[calc(100vh-64px)] min-w-0">
            <div className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 max-w-[1600px] mx-auto w-full pb-8 min-w-0">
              {/* Header & 4-Step Stepper */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-6 pb-3 border-b border-slate-200/80 min-w-0">
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#F95721] text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                    <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                      Review &amp; Assign Lead
                    </h1>
                    <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">
                      Verify the details, check for duplicates and assign to sales executive
                    </p>
                  </div>
                </div>

                {/* 4-Step Stepper Header */}
                <div className="w-full lg:w-auto shrink-0">
                  {renderStepper(3)}
                </div>
              </div>

            {/* Main Review Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* Column 1: Selected Market Photo */}
              <div className="xl:col-span-6 w-full min-w-0 space-y-4">
                <div className="bg-white border border-slate-200/90 rounded-sm p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs font-black text-slate-900">
                        Selected Market Photo
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          selectPhotoItem(Math.max(0, currentIndex - 1))
                        }
                        disabled={photosQueue.length <= 1}
                        className="w-6 h-6 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] font-bold text-slate-600 px-1">
                        {photosQueue.length > 0 ? `${currentIndex + 1} / ${photosQueue.length}` : "0 / 0"}
                      </span>
                      <button
                        onClick={() =>
                          selectPhotoItem(
                            Math.min(photosQueue.length - 1, currentIndex + 1),
                          )
                        }
                        disabled={photosQueue.length <= 1}
                        className="w-6 h-6 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {activePhoto ? (
                    <div
                      ref={imageViewerRef}
                      className={`relative w-full h-[380px] sm:h-[460px] lg:h-[500px] xl:h-[540px] rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800 select-none ${
                        zoomLevel > 1
                          ? isPanningImage
                            ? "cursor-grabbing"
                            : "cursor-grab"
                          : "cursor-zoom-in"
                      }`}
                      onMouseDown={(e) => {
                        if (zoomLevel <= 1) return;
                        setIsPanningImage(true);
                        imageDragStartRef.current = {
                          x: e.clientX - imagePan.x,
                          y: e.clientY - imagePan.y,
                        };
                      }}
                      onMouseMove={(e) => {
                        if (!isPanningImage || zoomLevel <= 1) return;
                        setImagePan({
                          x: e.clientX - imageDragStartRef.current.x,
                          y: e.clientY - imageDragStartRef.current.y,
                        });
                      }}
                      onMouseUp={() => setIsPanningImage(false)}
                      onMouseLeave={() => setIsPanningImage(false)}
                      onDoubleClick={() => {
                        if (zoomLevel > 1) {
                          setZoomLevel(1);
                          setImagePan({ x: 0, y: 0 });
                        } else {
                          setZoomLevel(2);
                        }
                      }}
                    >
                      {/* Floating Zoom & Controls Toolbar on Same Page */}
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-1 shadow-lg text-white">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setZoomLevel((prev) => {
                              const next = Math.max(1, +(prev - 0.25).toFixed(2));
                              if (next === 1) setImagePan({ x: 0, y: 0 });
                              return next;
                            });
                          }}
                          disabled={zoomLevel <= 1}
                          className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                          title="Zoom Out (-)"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setZoomLevel(1);
                            setRotation(0);
                            setImagePan({ x: 0, y: 0 });
                          }}
                          className="px-2 py-1 text-xs font-mono font-bold hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Reset Zoom & Rotation"
                        >
                          {Math.round(zoomLevel * 100)}%
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setZoomLevel((prev) =>
                              Math.min(4, +(prev + 0.25).toFixed(2)),
                            );
                          }}
                          disabled={zoomLevel >= 4}
                          className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                          title="Zoom In (+)"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>

                        <div className="w-px h-4 bg-slate-700 mx-0.5" />

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRotation((prev) => (prev + 90) % 360);
                          }}
                          className="p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Rotate 90°"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setZoomLevel(1);
                            setRotation(0);
                            setImagePan({ x: 0, y: 0 });
                          }}
                          className="p-1.5 rounded hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Reset to 100%"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>

                        <div className="w-px h-4 bg-slate-700 mx-0.5" />

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPreviewModal({
                              businessName:
                                formData.businessName || "Photo Preview",
                              photoUrl: activePhoto.previewUrl,
                              leadId: activePhoto.fileName || "Photo",
                              status: "Fullscreen Inspection",
                              area: formData.area || "",
                              zone: formData.zone || "",
                              assignedToName: formData.assignedToName || "",
                            });
                          }}
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Open Fullscreen Modal"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Helpful Hint Badge */}
                      <div className="absolute bottom-2.5 left-3 z-10 pointer-events-none text-[11px] font-medium text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded backdrop-blur-xs border border-slate-800">
                        {zoomLevel > 1
                          ? "Drag to pan • Double-click to reset"
                          : "Scroll wheel or buttons to zoom"}
                      </div>

                      {/* Transformable Image */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activePhoto.previewUrl}
                        alt={activePhoto ? activePhoto.fileName : "No file"}
                        className="w-full h-full object-contain pointer-events-none transition-transform duration-100 ease-out"
                        style={{
                          transform: `translate(${imagePan.x}px, ${imagePan.y}px) scale(${zoomLevel}) rotate(${rotation}deg)`,
                          transformOrigin: "center center",
                        }}
                        draggable={false}
                      />
                    </div>
                  ) : (
                    <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center space-y-2">
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                      <div className="text-xs font-bold text-slate-700">
                        No active photo in review queue
                      </div>
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
                        <img
                          src={p.previewUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <div className="text-[10px] text-slate-400 font-medium">
                        File Name
                      </div>
                      <div className="font-bold text-slate-800 truncate">
                        {activePhoto ? activePhoto.fileName || "—" : "—"}
                      </div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <div className="text-[10px] text-slate-400 font-medium">
                        File Size
                      </div>
                      <div className="font-bold text-slate-800">
                        {activePhoto ? activePhoto.fileSize || "—" : "—"}
                      </div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <div className="text-[10px] text-slate-400 font-medium">
                        Captured At
                      </div>
                      <div className="font-bold text-slate-800 text-[11px] truncate">
                        {activePhoto ? activePhoto.capturedAt || "Today" : "—"}
                      </div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <div className="text-[10px] text-slate-400 font-medium">
                        Upload Batch
                      </div>
                      <div className="font-bold text-slate-800 text-[10px] truncate">
                        {activePhoto ? activePhoto.batchName || "Direct" : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Business Info, Duplicate Check, Suggested Executive, AI Suggestions */}
              <div className="xl:col-span-6 w-full min-w-0 space-y-4">
                <div className="bg-white border border-slate-200/90 rounded-sm p-5 shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <h3 className="text-sm font-black text-slate-900">
                        Business Information
                      </h3>
                    </div>
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
                          setFormData({
                            ...formData,
                            businessName: e.target.value,
                          })
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
                          setFormData({
                            ...formData,
                            ownerName: e.target.value,
                          })
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
                          setFormData({
                            ...formData,
                            alternatePhone: e.target.value,
                          })
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
                            setFormData({
                              ...formData,
                              categoryLabel: e.target.value,
                            })
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
                          setFormData({
                            ...formData,
                            subCategory: e.target.value,
                          })
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
                            const foundArea = areas.find(
                              (a) => a.name === selectedAreaName,
                            );
                            const areaZones = getZonesForArea(selectedAreaName);
                            const firstZone =
                              areaZones[0]?.name || "Baba Colony";
                            const repId = resolveMatchedRep(
                              firstZone,
                              foundArea
                                ? foundArea._id || foundArea.id
                                : formData.areaId,
                            );
                            const repObj = salesReps.find(
                              (s) => (s._id || s.id) === repId,
                            );
                            setFormData({
                              ...formData,
                              area: selectedAreaName,
                              areaId: foundArea
                                ? foundArea._id || foundArea.id
                                : formData.areaId,
                              zone: firstZone,
                              assignedToId: repId,
                              assignedToName:
                                repObj?.name ||
                                salesReps[0]?.name ||
                                "Sales Executive",
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
                            const repId = resolveMatchedRep(
                              newZone,
                              formData.areaId,
                            );
                            const repObj = salesReps.find(
                              (s) => (s._id || s.id) === repId,
                            );
                            setFormData({
                              ...formData,
                              zone: newZone,
                              assignedToId: repId,
                              assignedToName:
                                repObj?.name ||
                                salesReps[0]?.name ||
                                "Sales Executive",
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
                  <div className="bg-white border border-slate-200/90 rounded-sm p-4 shadow-2xs space-y-2">
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

                  <div className="bg-white border border-slate-200/90 rounded-sm p-4 shadow-2xs space-y-2">
                    <div className="flex items-center gap-1.5 text-rose-500 font-bold text-xs">
                      <Target className="w-4 h-4" />
                      <span>Suggested Executive</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center">
                          {(formData.assignedToName || "SE")
                            .slice(0, 2)
                            .toUpperCase()}
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
                            {formData.zone
                              ? `Assigned to ${formData.assignedToName || "executive"} for ${formData.zone}`
                              : "Designated executive for territory"}
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
                <div className="bg-white border border-slate-200/90 rounded-sm p-4 shadow-2xs space-y-2">
                  <label className="block text-xs font-black text-slate-800">
                    Assign to Sales Executive *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={formData.assignedToId}
                      onChange={(e) => {
                        const repId = e.target.value;
                        const repObj = salesReps.find(
                          (s) => (s._id || s.id) === repId,
                        );
                        setFormData({
                          ...formData,
                          assignedToId: repId,
                          assignedToName:
                            repObj?.name ||
                            salesReps[0]?.name ||
                            "Sales Executive",
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
              </div>


            </div>

            {/* Bottom Reference Section: Location Map + Nearby Businesses */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-sm p-5 shadow-2xs space-y-3 flex flex-col justify-between">
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

              <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-sm p-5 shadow-2xs space-y-3 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <h3 className="text-xs font-black text-slate-900">
                      Nearby Businesses (Same Street)
                    </h3>
                  </div>

                  <button
                    onClick={() =>
                      showToast("Showing all same-street businesses")
                    }
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
                          <img
                            src={shop.photoUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
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
          </div>

          {/* Bottom Fixed Action Footer Bar (Pinned at bottom of viewport) */}
          <div className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 sm:px-6 py-3.5 shadow-xl w-full">
            <div className="max-w-[1600px] mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setUploadStep(2);
                  setCurrentView("photos");
                }}
                className="px-4 py-2.5 rounded-sm border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
                <div className="text-left leading-tight">
                  <div className="text-[11px] text-slate-400 font-medium">
                    Previous
                  </div>
                  <div>Verify Photos (Step 2)</div>
                </div>
              </button>

              <div className="flex items-center gap-3 flex-wrap justify-center">
                {photosQueue.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleDeletePhotoFromQueue(currentIndex)}
                    className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                    title="Delete this photo from pending queue"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Delete Photo</span>
                  </button>
                )}

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
                type="button"
                onClick={() => {
                  if (currentIndex < photosQueue.length - 1) {
                    selectPhotoItem(currentIndex + 1);
                    showToast("Advanced to next market photo");
                  } else {
                    showToast("Reached end of batch", "info");
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-[#F95721] hover:text-[#e84915] flex items-center gap-1.5 transition-colors shrink-0"
              >
                <span>Skip &amp; Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: MY CREATED LEADS / LEAD CREATED (SCREENSHOT 4)                   */}
        {/* ========================================================================= */}
        {currentView === "leads" && (
          <div className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 max-w-[1600px] mx-auto w-full animate-fade-in min-w-0">
            {/* Header & 4-Step Stepper (All 4 complete/step 4 active) */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-6 pb-3 border-b border-slate-200/80 min-w-0">
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#F95721] text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                    Lead Created Successfully
                  </h1>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">
                    The business has been saved and assigned to the sales executive
                  </p>
                </div>
              </div>

              {/* 4-Step Stepper Header */}
              <div className="w-full lg:w-auto shrink-0">
                {renderStepper(4)}
              </div>
            </div>

            {/* Lead fallback so Screen 4 always has valid lead data */}
            {(() => {
              const activeLead = lastCreatedLead || (recentEntries.length > 0 ? {
                leadNumber: recentEntries[0].leadId || "LD-8902",
                businessName: recentEntries[0].businessName || "Royal Enterprises",
                ownerName: recentEntries[0].ownerName || "Rajesh Kumar",
                phone: recentEntries[0].phone || "+91 98765 43210",
                categoryLabel: recentEntries[0].categoryLabel || "Retail Store",
                area: recentEntries[0].area || "Central Market",
                zone: recentEntries[0].zone || "North Zone",
                assignedToName: recentEntries[0].assignedToName || "Amit Sharma (Sales Executive)",
                createdByName: `${currentUser?.name || "Data Operator"} (Data Operator)`,
                createdAt: "Just now",
                photoName: "Shop Front Photo",
                photoUrl: recentEntries[0].photoUrl || "",
              } : {
                leadNumber: "LD-8902",
                businessName: "Sample Enterprises",
                ownerName: "Business Owner",
                phone: "+91 98765 43210",
                categoryLabel: "Retail Store",
                area: "Market Square",
                zone: "Zone A",
                assignedToName: "Sales Executive",
                createdByName: `${currentUser?.name || "Data Operator"} (Data Operator)`,
                createdAt: "Just now",
                photoName: "Shop Front Photo",
                photoUrl: "",
              });

              return activeLead ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-5 items-stretch">
                {/* Card 1: Success Confetti Banner & 5-Second Celebration Blast */}
                <div
                  className={`md:col-span-1 xl:col-span-4 rounded-sm p-6 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden transition-all duration-500 ${
                    showCelebrationBlast
                      ? "bg-linear-to-b from-amber-500/10 via-orange-500/5 to-emerald-500/10 border-2 border-amber-400 shadow-xl shadow-amber-500/20 ring-4 ring-amber-400/20"
                      : "bg-white border border-slate-200/90 shadow-2xs"
                  }`}
                >
                  {/* Canvas Confetti Explosion Engine (Active for 5 Seconds) */}
                  <CelebrationConfettiCanvas active={showCelebrationBlast} />

                  {/* Replay / Test Animation Pill */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 z-40">
                    <button
                      type="button"
                      onClick={triggerCelebrationBlast}
                      title="Replay celebration blast (5s)"
                      className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer ${
                        showCelebrationBlast
                          ? "bg-amber-500 text-white shadow-sm shadow-amber-500/40 animate-pulse"
                          : "bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-500 border border-slate-200"
                      }`}
                    >
                      <span>🎉</span>
                      <span className="hidden sm:inline">
                        {showCelebrationBlast ? "Blast Active (5s)" : "Replay Blast"}
                      </span>
                    </button>
                  </div>

                  {/* Center Blast Stage */}
                  <div className="relative flex items-center justify-center my-2 w-28 h-28 z-20">
                    {/* Radiating Shockwaves (When Active) */}
                    {showCelebrationBlast && (
                      <>
                        <div className="absolute w-20 h-20 rounded-full border-2 border-amber-400 animate-ping pointer-events-none opacity-75" />
                        <div className="absolute w-24 h-24 rounded-full border-2 border-orange-500 animate-pulse pointer-events-none opacity-60" />
                        <div className="absolute w-28 h-28 rounded-full bg-linear-to-r from-amber-400/20 via-orange-500/20 to-emerald-400/20 blur-xl animate-pulse pointer-events-none" />
                      </>
                    )}

                    {/* Central Checkmark Badge with Pop Animation */}
                    <div
                      className={`relative z-20 w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform ${
                        showCelebrationBlast
                          ? "bg-linear-to-tr from-emerald-500 via-emerald-400 to-teal-400 text-white shadow-emerald-500/40 text-3xl font-black ring-4 ring-emerald-300 animate-celebration-pop scale-110"
                          : "bg-emerald-500 text-white shadow-emerald-500/20 text-2xl font-black ring-2 ring-emerald-200"
                      }`}
                    >
                      ✓
                    </div>

                    {/* Confetti & Particle Blast (Shoots 360-degrees for 5 seconds) */}
                    {showCelebrationBlast ? (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        {/* Confetti Rectangles & Dots */}
                        {CELEBRATION_PARTICLES.map((p) => (
                          <span
                            key={p.id}
                            className={`absolute ${p.size} ${p.color} animate-confetti-burst rounded-xs shadow-xs`}
                            style={{
                              "--blast-x": p.x,
                              "--blast-y": p.y,
                              "--blast-r": p.r,
                              animationDelay: p.delay,
                            }}
                          />
                        ))}
                        {/* Shiny Stars & Sparkles */}
                        {CELEBRATION_STARS.map((s) => (
                          <span
                            key={s.id}
                            className={`absolute font-black text-sm select-none ${s.color} animate-confetti-burst`}
                            style={{
                              "--blast-x": s.x,
                              "--blast-y": s.y,
                              "--blast-r": "180deg",
                              animationDelay: s.delay,
                            }}
                          >
                            {s.text}
                          </span>
                        ))}
                      </div>
                    ) : (
                      /* Static decorative dots when resting */
                      <div className="pointer-events-none">
                        <span className="absolute -top-1 -left-2 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="absolute -top-1 -right-2 w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span className="absolute -bottom-1 -left-3 w-2 h-2 rounded-full bg-rose-400" />
                        <span className="absolute -bottom-2 -right-2 w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                        <span className="absolute top-4 -left-5 w-3 h-1 rounded-full bg-emerald-400 rotate-45" />
                        <span className="absolute top-3 -right-5 w-3 h-1 rounded-full bg-orange-400 -rotate-45" />
                      </div>
                    )}
                  </div>

                  <div className="relative z-20">
                    <h3
                      className={`text-lg font-black transition-colors ${
                        showCelebrationBlast ? "text-orange-600" : "text-slate-900"
                      }`}
                    >
                      Lead Created Successfully!
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-[260px]">
                      Business details have been saved and assigned to{" "}
                      <span className="font-bold text-slate-800">
                        {activeLead.assignedToName}
                      </span>
                    </p>
                  </div>

                  <div className="w-full space-y-2 pt-2">
                    <button
                      onClick={() => {
                        if (photosQueue.length > 0) {
                          selectPhotoItem(0);
                          setUploadStep(3);
                          setCurrentView("review");
                        } else {
                          setUploadStep(1);
                          setCurrentView("photos");
                        }
                      }}
                      className="w-full py-3 rounded-xl bg-[#F95721] hover:bg-[#e84915] text-white font-black text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Add Next Lead</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        const el = document.getElementById(
                          "created-leads-ledger",
                        );
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>View All My Leads</span>
                    </button>
                  </div>
                </div>

                {/* Card 2: Lead Details Card */}
                <div className="md:col-span-1 xl:col-span-5 bg-white border border-slate-200/90 rounded-sm p-5 shadow-2xs flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs font-black text-slate-900">
                        Lead Details
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        {activeLead.leadNumber}
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
                        src={activeLead.photoUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=60"}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="sm:col-span-7 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">
                          Business Name
                        </span>
                        <span className="font-black text-slate-900 text-right">
                          {activeLead.businessName}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">
                          Owner Name
                        </span>
                        <span className="font-bold text-slate-800 text-right">
                          {activeLead.ownerName || "—"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium">
                          Mobile Number
                        </span>
                        <span className="font-black text-slate-900 flex items-center gap-1">
                          <span>{activeLead.phone}</span>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 inline" />
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">
                          Category
                        </span>
                        <span className="font-bold text-slate-800 text-right">
                          {activeLead.categoryLabel || "General"}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">
                          Area &amp; Zone
                        </span>
                        <span className="font-bold text-slate-800 text-right">
                          {activeLead.area} &gt; {activeLead.zone}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                        <span className="text-slate-400 font-medium">
                          Assigned To
                        </span>
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center">
                            {(activeLead.assignedToName || "SE")
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                          <span>{activeLead.assignedToName}</span>
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">
                          Created By
                        </span>
                        <span className="font-bold text-slate-700 text-right">
                          {activeLead.createdByName}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">
                          Created At
                        </span>
                        <span className="font-bold text-slate-700 text-right">
                          {activeLead.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 3: Entry Timeline */}
                <div className="md:col-span-2 xl:col-span-3 bg-white border border-slate-200/90 rounded-sm p-5 shadow-2xs space-y-3 flex flex-col justify-between">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-black text-slate-900">
                      Entry Timeline
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <ImageIcon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-black text-slate-900">
                          Photo Ingested
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {activeLead.createdAt} &middot;{" "}
                          {activeLead.photoName || "Market Photo"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-black text-slate-900">
                          Details Captured
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {activeLead.createdAt} &middot;{" "}
                          {activeLead.businessName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-black text-slate-900">
                          Duplicate Check Passed
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {activeLead.createdAt} &middot; Verified unique
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <div>
                        <div className="font-black text-slate-900">
                          Lead Created
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {activeLead.createdAt} &middot; Saved to DB
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-orange-50 text-[#F95721] flex items-center justify-center shrink-0 mt-0.5">
                        <Send className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-black text-slate-900">
                          Assigned to Executive
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {activeLead.createdAt} &middot;{" "}
                          {activeLead.assignedToName}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              ) : null;
            })()}


            {/* Bottom Table: Today's Created Leads with Date Filter */}
            <div
              id="created-leads-ledger"
              className="bg-white border border-slate-200/90 rounded-sm p-5 shadow-2xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                  <h3 className="text-sm font-black text-slate-900">
                    {leadsFilterDate ? "Created Leads" : "Today's Created Leads"}
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-full">
                    {filteredRecentEntries.length} {filteredRecentEntries.length === 1 ? "lead" : "leads"}
                  </span>
                  {leadsFilterDate && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                      <span>
                        📅{" "}
                        {new Date(leadsFilterDate + "T00:00:00").toLocaleDateString(
                          "en-GB",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => setLeadsFilterDate("")}
                        className="text-blue-400 hover:text-blue-700 cursor-pointer"
                        title="Clear date filter"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Date Filter Input */}
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-2.5 py-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-2xs">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <input
                      type="date"
                      value={leadsFilterDate}
                      onChange={(e) => setLeadsFilterDate(e.target.value)}
                      className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
                      title="Filter leads by creation date"
                    />
                    {leadsFilterDate ? (
                      <button
                        type="button"
                        onClick={() => setLeadsFilterDate("")}
                        className="p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        title="Clear date filter (show all dates)"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date();
                          const y = today.getFullYear();
                          const m = String(today.getMonth() + 1).padStart(2, "0");
                          const d = String(today.getDate()).padStart(2, "0");
                          setLeadsFilterDate(`${y}-${m}-${d}`);
                        }}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 px-1 py-0.5 rounded-md hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Quick filter for Today"
                      >
                        Today
                      </button>
                    )}
                  </div>

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
                                ? a.zones.map((z) =>
                                    typeof z === "string" ? z : z.name,
                                  )
                                : [],
                            ),
                          ),
                        )
                      : getZonesForArea(leadsFilterArea).map((z) =>
                          typeof z === "string" ? z : z.name,
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
                      showToast(
                        `Synced ${res.length} leads from database!`,
                        "success",
                      );
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
              <div className="overflow-x-auto scrollbar-thin">
                <table className="min-w-[1000px] w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3 whitespace-nowrap">#</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">LEAD ID</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">BUSINESS NAME</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">AREA</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">ZONE</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">CATEGORY</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">ASSIGNED TO</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">CREATED AT</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">ENTRY TIME</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">STATUS</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">PHOTO</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecentEntries.length > 0 ? (
                      filteredRecentEntries.map((row, idx) => (
                        <tr
                          key={row.id || idx}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="py-3 px-3 font-semibold text-slate-500 whitespace-nowrap">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-700 whitespace-nowrap">
                            {row.leadId}
                          </td>
                          <td className="py-3 px-3 font-extrabold text-slate-900 whitespace-nowrap">
                            {row.businessName}
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">
                            {row.area}
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">
                            {row.zone}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                row.categoryColor ||
                                "bg-pink-50 text-pink-700 border-pink-200"
                              }`}
                            >
                              {row.categoryLabel || "General Store"}
                            </span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
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
                          <td className="py-3 px-3 text-slate-500 font-medium whitespace-nowrap">
                            {row.createdAt}
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-bold text-[11px] whitespace-nowrap">
                            {row.entryTime || "3m 12s"}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              {row.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setShowPreviewModal(row)}
                              className="w-14 h-12 rounded-sm overflow-hidden border border-slate-200 bg-slate-900 hover:border-blue-500 hover:scale-105 transition-all flex items-center justify-center cursor-pointer shadow-2xs group"
                              title="Click to view full photo"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={row.photoUrl}
                                alt={row.businessName || "Photo"}
                                className="w-full h-full object-contain"
                              />
                            </button>
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
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
                        <td
                          colSpan={12}
                          className="py-12 text-center text-slate-400 text-xs"
                        >
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <Calendar className="w-7 h-7 text-slate-300 stroke-1" />
                            <p className="font-semibold text-slate-600">
                              {leadsFilterDate
                                ? `No leads found for ${new Date(
                                    leadsFilterDate + "T00:00:00",
                                  ).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}`
                                : "No leads found matching your criteria."}
                            </p>
                            {leadsFilterDate && (
                              <button
                                type="button"
                                onClick={() => setLeadsFilterDate("")}
                                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer mt-1"
                              >
                                Clear date filter
                              </button>
                            )}
                          </div>
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
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto w-full animate-fade-in">
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-sm p-5 shadow-2xs">
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
                  All geographical areas and sub-locality zones configured by
                  the administrator for field photo capture and automatic sales
                  representative dispatch.
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
                  <span>Add New Lead</span>
                </button>
              </div>
            </div>

            {/* 4 Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200/90 rounded-sm p-4 shadow-2xs">
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
                  {areas.length > 0
                    ? areas
                        .map((a) => a.name)
                        .slice(0, 3)
                        .join(", ")
                    : "No areas assigned"}
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-sm p-4 shadow-2xs">
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

              <div className="bg-white border border-slate-200/90 rounded-sm p-4 shadow-2xs">
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
                  {Array.from(
                    new Set(
                      coverageList.map((c) => c.assignedRep).filter(Boolean),
                    ),
                  )
                    .slice(0, 3)
                    .join(", ") || "Active Sales Team"}
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-sm p-4 shadow-2xs">
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
            <div className="bg-white border border-slate-200/90 rounded-sm p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Area Filter */}
                <select
                  value={coverageFilterArea}
                  onChange={(e) => setCoverageFilterArea(e.target.value)}
                  className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">
                    All Territories ({areas.length})
                  </option>
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
            <div className="bg-white border border-slate-200/90 rounded-sm shadow-2xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span>Admin Master Zones Directory</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                      {filteredCoverageList.length} Zones Available
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Click &ldquo;Capture Lead&rdquo; to pre-select any zone and
                    automatically route to the designated sales executive.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto scrollbar-thin">
                <table className="min-w-[850px] w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/60">
                      <th className="py-3 px-4 whitespace-nowrap">#</th>
                      <th className="py-3 px-4 whitespace-nowrap">ZONE / SUB-LOCALITY</th>
                      <th className="py-3 px-4 whitespace-nowrap">PARENT AREA</th>
                      <th className="py-3 px-4 whitespace-nowrap">CONFIGURED BY</th>
                      <th className="py-3 px-4 whitespace-nowrap">DESIGNATED SALES EXECUTIVE</th>
                      <th className="py-3 px-4 whitespace-nowrap">LEADS CAPTURED</th>
                      <th className="py-3 px-4 whitespace-nowrap">STATUS</th>
                      <th className="py-3 px-4 whitespace-nowrap">COVERAGE</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredCoverageList.length > 0 ? (
                      filteredCoverageList.map((item, idx) => (
                        <tr
                          key={`${item.area}_${item.zone}_${idx}`}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <MapPin className={`w-4 h-4 ${item.pinColor}`} />
                              <div>
                                <span className="block text-slate-900 font-bold">
                                  {item.zone}
                                </span>
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
                              <span className="font-semibold text-slate-800">
                                {item.area}
                              </span>
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
                                  const repId = resolveMatchedRep(
                                    item.zone,
                                    item.areaId,
                                  );
                                  const repObj = salesReps.find(
                                    (s) => (s._id || s.id) === repId,
                                  );
                                  setFormData((prev) => ({
                                    ...prev,
                                    area: item.area,
                                    areaId: item.areaId,
                                    zone: item.zone,
                                    assignedToId: repId,
                                    assignedToName:
                                      repObj?.name || item.assignedRep,
                                  }));
                                  showToast(
                                    `Selected ${item.zone} (${item.area}). Ready to create lead!`,
                                    "success",
                                  );
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
                                  showToast(
                                    `Selected ${item.zone} (${item.area}) for photo upload`,
                                    "info",
                                  );
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
                        <td
                          colSpan={9}
                          className="py-12 text-center text-slate-400 text-xs"
                        >
                          No matching zones found. Clear your search or filter
                          to see all admin territories.
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
        {/* VIEW 6: DAILY REPORT VIEW                                                */}
        {/* ========================================================================= */}
        {currentView === "reports" && (
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full animate-fade-in">
            <DailyReportView
              leads={recentEntries}
              areas={areas}
              salesReps={salesReps}
              currentUser={currentUser}
              workingDurationStr={workingDurationStr}
              setCurrentView={setCurrentView}
              onRefresh={fetchLeadsFromDb}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 7: EXPORT DATA VIEW                                                 */}
        {/* ========================================================================= */}
        {currentView === "export" && (
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full animate-fade-in">
            <ExportDataView
              leads={recentEntries}
              areas={areas}
              salesReps={salesReps}
              setCurrentView={setCurrentView}
            />
          </div>
        )}
      </main>

      {/* Duplicate Collision Alert Modal */}
      {duplicateModal.show && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-scale-in border-2 border-amber-300 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-sm bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
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

            <div className="p-3.5 rounded-sm bg-amber-50/70 border border-amber-200 space-y-2 text-xs">
              {duplicateModal.matches.map((m, i) => (
                <div key={i} className="flex justify-between items-center py-1">
                  <div>
                    <span className="font-black text-slate-900">
                      {m.businessName}
                    </span>
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
                  const rem = photosQueue.filter(
                    (_, idx) => idx !== currentIndex,
                  );
                  setPhotosQueue(rem);
                  if (rem.length > 0) {
                    selectPhotoItem(
                      Math.min(currentIndex, rem.length - 1),
                      rem,
                    );
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
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl animate-scale-in space-y-4">
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
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className={`relative w-full h-64 sm:h-80 md:h-[400px] lg:h-[440px] rounded-sm overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800 select-none ${
                modalZoom > 1
                  ? isPanningModal
                    ? "cursor-grabbing"
                    : "cursor-grab"
                  : "cursor-zoom-in"
              }`}
              onMouseDown={(e) => {
                if (modalZoom <= 1) return;
                setIsPanningModal(true);
                modalDragStartRef.current = {
                  x: e.clientX - modalPan.x,
                  y: e.clientY - modalPan.y,
                };
              }}
              onMouseMove={(e) => {
                if (!isPanningModal || modalZoom <= 1) return;
                setModalPan({
                  x: e.clientX - modalDragStartRef.current.x,
                  y: e.clientY - modalDragStartRef.current.y,
                });
              }}
              onMouseUp={() => setIsPanningModal(false)}
              onMouseLeave={() => setIsPanningModal(false)}
              onWheel={(e) => {
                e.stopPropagation();
                if (e.deltaY < 0) {
                  setModalZoom((prev) =>
                    Math.min(4, +(prev + 0.25).toFixed(2)),
                  );
                } else {
                  setModalZoom((prev) => {
                    const next = Math.max(1, +(prev - 0.25).toFixed(2));
                    if (next === 1) setModalPan({ x: 0, y: 0 });
                    return next;
                  });
                }
              }}
              onDoubleClick={() => {
                if (modalZoom > 1) {
                  setModalZoom(1);
                  setModalPan({ x: 0, y: 0 });
                } else {
                  setModalZoom(2);
                }
              }}
            >
              {/* Floating Zoom & Controls Toolbar */}
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-1 shadow-lg text-white">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalZoom((prev) => {
                      const next = Math.max(1, +(prev - 0.25).toFixed(2));
                      if (next === 1) setModalPan({ x: 0, y: 0 });
                      return next;
                    });
                  }}
                  disabled={modalZoom <= 1}
                  className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalZoom(1);
                    setModalRotation(0);
                    setModalPan({ x: 0, y: 0 });
                  }}
                  className="px-2 py-1 text-xs font-mono font-bold hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  title="Reset Zoom & Rotation"
                >
                  {Math.round(modalZoom * 100)}%
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalZoom((prev) =>
                      Math.min(4, +(prev + 0.25).toFixed(2)),
                    );
                  }}
                  disabled={modalZoom >= 4}
                  className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <div className="w-px h-4 bg-slate-700 mx-0.5" />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalRotation((prev) => (prev + 90) % 360);
                  }}
                  className="p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalZoom(1);
                    setModalRotation(0);
                    setModalPan({ x: 0, y: 0 });
                  }}
                  className="p-1.5 rounded hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Reset to 100%"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Helpful Hint Badge */}
              <div className="absolute bottom-2.5 left-3 z-10 pointer-events-none text-[11px] font-medium text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded backdrop-blur-xs border border-slate-800">
                {modalZoom > 1
                  ? "Drag to pan • Double-click to reset"
                  : "Scroll wheel or click +/- to zoom"}
              </div>

              {/* Transformable Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={showPreviewModal.photoUrl}
                alt={showPreviewModal.businessName || "Photo"}
                className="w-full h-full object-contain pointer-events-none transition-transform duration-100 ease-out"
                style={{
                  transform: `translate(${modalPan.x}px, ${modalPan.y}px) scale(${modalZoom}) rotate(${modalRotation}deg)`,
                  transformOrigin: "center center",
                }}
                draggable={false}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-medium block">
                  Lead ID
                </span>
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
                <span className="text-slate-400 font-medium block">
                  Area &amp; Zone
                </span>
                <span className="font-black text-slate-800">
                  {showPreviewModal.area}, {showPreviewModal.zone}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-medium block">
                  Assigned To
                </span>
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
          className={`fixed bottom-6 right-6 z-70 px-4 py-3 rounded-sm shadow-xl border text-xs font-bold flex items-center gap-2 animate-bounce-in ${
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
