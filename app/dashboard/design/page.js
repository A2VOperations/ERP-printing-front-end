"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import {
  Palette,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ExternalLink,
  Upload,
  RefreshCw,
  FileCheck,
  FileCode,
  Copy,
  Check,
  ShieldAlert,
  Sparkles,
  Search,
  Clock,
  ArrowRight,
  Eye,
  FileText,
  Download,
  Image as ImageIcon,
  Layers,
  User,
  Phone,
  Mail,
  Calendar,
  ShieldCheck,
  CheckSquare,
  X,
  ChevronRight,
  Paperclip,
  Share2,
  FolderPlus,
  Play,
  History,
  MessageSquare,
  HelpCircle,
  Hash,
  Filter,
  Edit3,
  Printer,
} from "lucide-react";

const COLUMNS = [
  {
    id: "BRIEFING",
    label: "Briefing & Assigned",
    color: "border-amber-400",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    id: "IN_PROGRESS",
    label: "In Design",
    color: "border-blue-400",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: "CLIENT_REVIEW",
    label: "Client Proof Review",
    color: "border-purple-400",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    id: "REVISION_REQUESTED",
    label: "Revisions Requested",
    color: "border-rose-400",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    id: "APPROVED",
    label: "Client Approved",
    color: "border-emerald-400",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    id: "PRODUCTION_LOCKED",
    label: "Production Locked",
    color: "border-cyan-400",
    badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
];

const FILTER_CONFIG = {
  ALL: {
    title: "Design Studio & Pre-Press Hub",
    subtitle:
      "Complete artwork workflow: Client brief, version proofs, client reviews & production locks",
    badge: "All Projects",
    icon: Palette,
  },
  NEW: {
    title: "New Assignments & Briefing Queue",
    subtitle:
      "Fresh design briefs and new commercial print jobs awaiting initial design",
    badge: "New Assignments",
    icon: FileCheck,
    columnIds: ["BRIEFING", "IN_PROGRESS"],
  },
  DUE: {
    title: "Due & Overdue Projects",
    subtitle:
      "Urgent design deadlines and customer deliveries scheduled within the next 48 hours",
    badge: "Due / Overdue",
    icon: Clock,
  },
  CLIENT_REVIEW: {
    title: "Client Proof Review",
    subtitle:
      "Digital proofs shared with clients awaiting review, proof views, and sign-offs",
    badge: "Client Review",
    icon: Eye,
    columnIds: ["CLIENT_REVIEW"],
  },
  REVISION: {
    title: "Revision Requests",
    subtitle:
      "Client requested modifications, text changes, dimension updates, or corrections",
    badge: "Revisions",
    icon: RefreshCw,
    columnIds: ["REVISION_REQUESTED"],
  },
  PRODUCTION_READY: {
    title: "Production Ready & Locked Artworks",
    subtitle:
      "Approved artworks with SHA-256 lock release ready for press operators",
    badge: "Production Ready",
    icon: CheckSquare,
    columnIds: ["APPROVED", "PRODUCTION_LOCKED"],
  },
};

const NAV_FILTERS = [
  { key: "ALL", label: "All Projects", icon: Layers },
  { key: "NEW", label: "New Assignments", icon: FileCheck },
  { key: "DUE", label: "Due / Overdue", icon: Clock },
  { key: "CLIENT_REVIEW", label: "Client Review", icon: Eye },
  { key: "REVISION", label: "Revisions", icon: RefreshCw },
  { key: "PRODUCTION_READY", label: "Production Ready", icon: CheckSquare },
];

function DesignStudioContent() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("admin");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [modeFilter, setModeFilter] = useState("ALL");

  useEffect(() => {
    const stored = (localStorage.getItem("userRole") || "admin").toLowerCase();
    setUserRole(stored);
  }, []);

  const isSalesRole =
    userRole.includes("sales") ||
    userRole.includes("employee") ||
    userRole.includes("executive");

  // Modal / Drawer state
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState("brief"); // 'brief' | 'assets' | 'versions' | 'approval'
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [projectAssets, setProjectAssets] = useState([]);
  const [projectVersions, setProjectVersions] = useState([]);
  const [projectRevisions, setProjectRevisions] = useState([]);

  // Proof Link state
  const [proofUrl, setProofUrl] = useState("");
  const [copiedProof, setCopiedProof] = useState(false);
  const [generatingProof, setGeneratingProof] = useState(false);

  // Asset Upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState("PROOF");
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState("");
  const fileInputRef = useRef(null);

  // Version creation state
  const [selectedProofAssetId, setSelectedProofAssetId] = useState("");
  const [designerComment, setDesignerComment] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [creatingVersion, setCreatingVersion] = useState(false);

  // Manual Approval state
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalClientName, setApprovalClientName] = useState("");
  const [approvalEvidenceType, setApprovalEvidenceType] =
    useState("EMAIL_CONFIRMATION");
  const [approvalEvidenceRef, setApprovalEvidenceRef] = useState("");
  const [approvalFeedback, setApprovalFeedback] = useState("");
  const [submittingApproval, setSubmittingApproval] = useState(false);

  // Production Lock state
  const [lockingLoading, setLockingLoading] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideType, setOverrideType] = useState("BOTH");

  // Action feedback message
  const [actionSuccess, setActionSuccess] = useState("");

  // Dynamic Specs & Edit Specs Modal state
  const [showEditSpecsModal, setShowEditSpecsModal] = useState(false);
  const [savingSpecs, setSavingSpecs] = useState(false);
  const [editSpecsForm, setEditSpecsForm] = useState({
    width: "",
    height: "",
    dimensionUnit: "inch",
    quantity: 1,
    material: "",
    gsm: "",
    colorMode: "CMYK",
    dpi: 100,
    printSides: "SINGLE",
    finishing: [],
    printingMethod: "Digital Offset / Large Format",
    specialInstructions: "",
    dueDate: "",
  });

  const handleOpenEditSpecs = () => {
    if (!selectedProject) return;
    const primaryItem =
      selectedProject.orderItemId &&
      typeof selectedProject.orderItemId === "object"
        ? selectedProject.orderItemId
        : selectedProject.orderId?.items?.[0] || {};

    setEditSpecsForm({
      width:
        selectedProject.brief?.productDimensions?.width ??
        primaryItem.width ??
        "",
      height:
        selectedProject.brief?.productDimensions?.height ??
        primaryItem.height ??
        "",
      dimensionUnit:
        selectedProject.brief?.productDimensions?.unit ||
        primaryItem.dimensionUnit ||
        "inch",
      quantity: selectedProject.brief?.quantity || primaryItem.quantity || 1,
      material:
        selectedProject.brief?.material ||
        selectedProject.brief?.paperMedia ||
        primaryItem.paperType ||
        "",
      gsm: selectedProject.brief?.gsm || primaryItem.paperGsm || "",
      colorMode:
        selectedProject.brief?.colorMode || primaryItem.colors || "CMYK",
      dpi: selectedProject.brief?.dpi || primaryItem.dpi || 100,
      printSides:
        selectedProject.brief?.printSides || primaryItem.printSides || "SINGLE",
      finishing:
        Array.isArray(selectedProject.brief?.finishing) &&
        selectedProject.brief.finishing.length > 0
          ? selectedProject.brief.finishing
          : Array.isArray(primaryItem.finishing)
            ? primaryItem.finishing
            : [],
      printingMethod:
        selectedProject.brief?.printingMethod ||
        "Digital Offset / Large Format",
      specialInstructions:
        selectedProject.brief?.specialInstructions ||
        selectedProject.orderId?.designNotes ||
        selectedProject.orderId?.notes ||
        "",
      dueDate: selectedProject.dueDate
        ? new Date(selectedProject.dueDate).toISOString().split("T")[0]
        : "",
    });
    setShowEditSpecsModal(true);
  };

  const handleSaveSpecs = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      setSavingSpecs(true);
      const res = await api.patch(
        `/design-projects/${selectedProject._id}/brief`,
        editSpecsForm,
      );
      if (res?.success || res?.project || res?.data) {
        setActionSuccess(
          "Technical specifications updated and synchronized with Order!",
        );
        setShowEditSpecsModal(false);
        await fetchProjectDetails(selectedProject._id);
        await loadProjects();
      }
    } catch (err) {
      alert(err.message || "Failed to update technical specifications");
    } finally {
      setSavingSpecs(false);
    }
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get("/design-projects?limit=100");
      if (res) {
        const rawList = Array.isArray(res)
          ? res
          : Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.projects)
              ? res.projects
              : res.data?.projects || res.records || [];
        setProjects(rawList);
      }
    } catch (err) {
      console.error("Failed to load design projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Fetch project sub-resources (assets, versions, revisions)
  const fetchProjectDetails = async (projectId) => {
    try {
      setLoadingDetails(true);
      const [projRes, assetsRes, versionsRes, revisionsRes] =
        await Promise.allSettled([
          api.get(`/design-projects/${projectId}`),
          api.get(`/design-projects/${projectId}/assets`),
          api.get(`/design-projects/${projectId}/versions`),
          api.get(`/design-projects/${projectId}/revisions`),
        ]);

      if (projRes.status === "fulfilled" && projRes.value) {
        const val = projRes.value;
        const proj = val.project || val.data?.project || val.data || val;
        setSelectedProject(proj);
      }

      if (assetsRes.status === "fulfilled" && assetsRes.value) {
        const val = assetsRes.value;
        const aList = Array.isArray(val)
          ? val
          : Array.isArray(val.data)
            ? val.data
            : Array.isArray(val.assets)
              ? val.assets
              : val.data?.assets || [];
        setProjectAssets(aList);
        // Default first proof asset for version form if none selected
        if (aList.length > 0 && !selectedProofAssetId) {
          const firstProof =
            aList.find((a) => a.category === "PROOF") || aList[0];
          setSelectedProofAssetId(firstProof._id);
        }
      }

      if (versionsRes.status === "fulfilled" && versionsRes.value) {
        const val = versionsRes.value;
        const vList = Array.isArray(val)
          ? val
          : Array.isArray(val.data)
            ? val.data
            : Array.isArray(val.versions)
              ? val.versions
              : val.data?.versions || [];
        setProjectVersions(vList);
      }

      if (revisionsRes.status === "fulfilled" && revisionsRes.value) {
        const val = revisionsRes.value;
        const rList = Array.isArray(val)
          ? val
          : Array.isArray(val.data)
            ? val.data
            : Array.isArray(val.revisions)
              ? val.revisions
              : val.data?.revisions || [];
        setProjectRevisions(rList);
      }
    } catch (err) {
      console.error("Failed to load project details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const openProjectDetails = (proj) => {
    setSelectedProject(proj);
    setActiveTab("brief");
    setUploadStatusMsg("");
    setActionSuccess("");
    setProofUrl("");
    fetchProjectDetails(proj._id);
  };

  // Start Design Action (BRIEFING/ASSIGNED -> IN_PROGRESS)
  const handleStartDesign = async () => {
    if (!selectedProject) return;
    try {
      await api.post(`/design-projects/${selectedProject._id}/start`, {});
      setActionSuccess(
        "Project moved to In Design! You can now upload proofs.",
      );
      fetchProjectDetails(selectedProject._id);
      loadProjects();
    } catch (err) {
      alert(err.message || "Failed to start design");
    }
  };

  // Upload Asset (Cloudinary)
  const handleUploadAsset = async (e) => {
    e.preventDefault();
    if (!uploadFile || !selectedProject) return;

    try {
      setUploadingAsset(true);
      setUploadStatusMsg("");

      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("category", uploadCategory);

      const res = await api.post(
        `/design-projects/${selectedProject._id}/assets`,
        formData,
      );

      const uploadedAsset =
        res?.asset || res?.data?.asset || (res?.success && res?.data);
      if (res?.success || uploadedAsset) {
        setUploadStatusMsg(`Asset "${uploadFile.name}" uploaded successfully!`);
        setUploadFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";

        // Refresh assets list
        const assetsRes = await api.get(
          `/design-projects/${selectedProject._id}/assets`,
        );
        const updatedAssets = Array.isArray(assetsRes?.assets)
          ? assetsRes.assets
          : Array.isArray(assetsRes?.data?.assets)
            ? assetsRes.data.assets
            : Array.isArray(assetsRes?.data)
              ? assetsRes.data
              : [];
        setProjectAssets(updatedAssets);

        // If proof asset uploaded, preselect for version creation
        if (uploadedAsset && uploadedAsset.category === "PROOF") {
          setSelectedProofAssetId(uploadedAsset._id);
          setActiveTab("versions");
        }
      }
    } catch (err) {
      alert(err.message || "Failed to upload artwork asset");
    } finally {
      setUploadingAsset(false);
    }
  };

  // Create Design Version
  const handleCreateVersion = async (e) => {
    e.preventDefault();
    if (!selectedProofAssetId || !selectedProject) {
      alert("Please select a Proof Asset before publishing a version.");
      return;
    }

    try {
      setCreatingVersion(true);
      const res = await api.post(
        `/design-projects/${selectedProject._id}/versions`,
        {
          proofAssetId: selectedProofAssetId,
          designerComment,
          changeSummary,
        },
      );

      const ver = res?.version || res?.data?.version;
      if (res?.success || ver) {
        setActionSuccess(
          `Version ${ver?.versionLabel || "published"} successfully!`,
        );
        setDesignerComment("");
        setChangeSummary("");
        fetchProjectDetails(selectedProject._id);
        loadProjects();
      }
    } catch (err) {
      alert(err.message || "Failed to create version");
    } finally {
      setCreatingVersion(false);
    }
  };

  // Generate Proof Link
  const handleGenerateProofLink = async () => {
    if (!selectedProject) return;
    if (
      !selectedProject.currentVersionId &&
      (!projectVersions || projectVersions.length === 0)
    ) {
      alert(
        'Proof link generate karne ke liye pehle ek Design Version (V1) publish karein. Versions tab me jaake proof asset select karein aur "Publish Version" click karein.',
      );
      setActiveTab("versions");
      return;
    }
    try {
      setGeneratingProof(true);
      const res = await api.post(
        `/design-projects/${selectedProject._id}/create-proof-link`,
        {},
      );
      const rawToken = res?.rawToken || res?.data?.rawToken;
      if (rawToken) {
        const fullUrl = `${window.location.origin}/proof/${rawToken}`;
        setProofUrl(fullUrl);
        navigator.clipboard.writeText(fullUrl);
        setCopiedProof(true);
        setTimeout(() => setCopiedProof(false), 3500);
        fetchProjectDetails(selectedProject._id);
        loadProjects();
      }
    } catch (err) {
      alert(
        err.message ||
          "Failed to generate proof link. Ensure at least 1 version is uploaded.",
      );
    } finally {
      setGeneratingProof(false);
    }
  };

  // Acknowledge Revision
  const handleAcknowledgeRevision = async (revisionId) => {
    if (!selectedProject) return;
    try {
      await api.post(
        `/design-projects/${selectedProject._id}/revisions/${revisionId}/acknowledge`,
        {},
      );
      setActionSuccess("Revision acknowledged! Ready to upload new version.");
      fetchProjectDetails(selectedProject._id);
      loadProjects();
    } catch (err) {
      alert(err.message || "Failed to acknowledge revision");
    }
  };

  // Record Manual Approval
  const handleRecordApproval = async (e) => {
    e.preventDefault();
    if (!approvalClientName || !approvalEvidenceRef) {
      alert(
        "Client Name and Evidence Reference (e.g. chat screenshot / email text) are required.",
      );
      return;
    }

    try {
      setSubmittingApproval(true);
      await api.post(
        `/design-projects/${selectedProject._id}/manual-approval`,
        {
          approvedByClientName: approvalClientName,
          evidenceType: approvalEvidenceType,
          evidenceReference: approvalEvidenceRef,
          feedback: approvalFeedback,
        },
      );

      setActionSuccess(
        "Manual client approval recorded successfully! Order status synced.",
      );
      setShowApprovalModal(false);
      setApprovalClientName("");
      setApprovalEvidenceRef("");
      setApprovalFeedback("");
      fetchProjectDetails(selectedProject._id);
      loadProjects();
    } catch (err) {
      alert(err.message || "Failed to record manual approval");
    } finally {
      setSubmittingApproval(false);
    }
  };

  // Lock Production File
  const handleProductionLock = async () => {
    if (!selectedProject) return;
    if (!isCurrentVersionApproved) {
      alert(
        "Cannot lock production file: Current version is not approved by client. Please record client approval first or use CEO Override.",
      );
      return;
    }
    try {
      setLockingLoading(true);
      await api.post(
        `/design-projects/${selectedProject._id}/lock-production-file`,
        {},
      );
      setActionSuccess(
        "Production File Locked Successfully! Artwork released for printing.",
      );
      fetchProjectDetails(selectedProject._id);
      loadProjects();
    } catch (err) {
      alert(err.message || "Failed to lock production file");
    } finally {
      setLockingLoading(false);
    }
  };

  // Admin / CEO Override
  const handleAdminOverride = async () => {
    if (!overrideReason.trim()) {
      alert("Override reason is strictly required for audit.");
      return;
    }
    try {
      setLockingLoading(true);
      await api.post(
        `/design-projects/${selectedProject._id}/production-lock-override`,
        {
          reason: overrideReason,
          overrideType,
        },
      );
      setActionSuccess("CEO/Admin Override Audited & Production File Locked!");
      setShowOverrideModal(false);
      setOverrideReason("");
      fetchProjectDetails(selectedProject._id);
      loadProjects();
    } catch (err) {
      alert(err.message || "Override failed");
    } finally {
      setLockingLoading(false);
    }
  };

  const handleHandoffToProduction = async () => {
    if (!selectedProject) return;
    try {
      const res = await api.post("/production-jobs/handoff", {
        designProjectId: selectedProject._id,
        orderId: selectedProject.orderId?._id || selectedProject.orderId,
        orderItemId:
          selectedProject.orderItemId?._id || selectedProject.orderItemId,
      });
      const jobId = res?.data?._id || res?.job?._id;
      if (jobId) {
        router.push(`/dashboard/production/jobs/${jobId}`);
      } else {
        router.push("/dashboard/production");
      }
    } catch (err) {
      alert(err.message || "Failed to initialize production job");
    }
  };

  const searchParams = useSearchParams();
  const router = useRouter();
  const rawFilter = searchParams ? searchParams.get("filter") : null;
  const orderIdParam = searchParams ? searchParams.get("orderId") : null;
  const hasAutoOpenedRef = useRef(false);

  useEffect(() => {
    if (
      !projects ||
      projects.length === 0 ||
      !orderIdParam ||
      hasAutoOpenedRef.current
    )
      return;
    const targetProj = projects.find(
      (p) =>
        String(p.orderId?._id || p.orderId) === String(orderIdParam) ||
        String(p.orderId?.orderNumber || "").toLowerCase() ===
          String(orderIdParam).toLowerCase(),
    );
    if (targetProj) {
      hasAutoOpenedRef.current = true;
      openProjectDetails(targetProj);
    }
  }, [projects, orderIdParam]);

  const activeFilter =
    rawFilter && FILTER_CONFIG[rawFilter] ? rawFilter : "ALL";
  const currentConfig = FILTER_CONFIG[activeFilter] || FILTER_CONFIG.ALL;

  // Dynamic live project counts for each category
  const counts = useMemo(() => {
    return {
      ALL: projects.length,
      NEW: projects.filter(
        (p) => p.status === "BRIEFING" || p.status === "ASSIGNED",
      ).length,
      DUE: projects.filter((p) => {
        const isDueSoon =
          p.dueDate &&
          new Date(p.dueDate).getTime() <= Date.now() + 3 * 24 * 60 * 60 * 1000;
        const isUrgent = p.priority === "URGENT" || p.priority === "HIGH";
        return (isDueSoon || isUrgent) && p.status !== "PRODUCTION_LOCKED";
      }).length,
      CLIENT_REVIEW: projects.filter(
        (p) =>
          (p.status === "CLIENT_REVIEW" || p.status === "IN_REVIEW") &&
          p.approvalStatus !== "APPROVED" &&
          p.status !== "APPROVED" &&
          p.status !== "PRODUCTION_LOCKED",
      ).length,
      REVISION: projects.filter((p) => p.status === "REVISION_REQUESTED")
        .length,
      PREFLIGHT: projects.filter(
        (p) =>
          (p.preflightStatus === "NOT_STARTED" ||
            p.preflightStatus === "MANUAL_REVIEW_REQUIRED" ||
            p.preflightStatus === "FAILED" ||
            p.status === "APPROVED" ||
            p.approvalStatus === "APPROVED") &&
          p.status !== "PRODUCTION_LOCKED",
      ).length,
      PRODUCTION_READY: projects.filter(
        (p) =>
          p.status === "PRODUCTION_LOCKED" ||
          ((p.status === "APPROVED" || p.approvalStatus === "APPROVED") &&
            p.preflightStatus === "PASSED"),
      ).length,
    };
  }, [projects]);

  // Filtered project list for Kanban columns
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.projectNumber || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (p.customerId?.businessName || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchPriority =
        priorityFilter === "ALL" || p.priority === priorityFilter;
      const matchMode = modeFilter === "ALL" || p.workflowMode === modeFilter;

      if (orderIdParam) {
        const matchesOrder =
          String(p.orderId?._id || p.orderId) === String(orderIdParam) ||
          String(p.orderId?.orderNumber || "").toLowerCase() ===
            String(orderIdParam).toLowerCase();
        if (!matchesOrder) return false;
      }

      if (!matchSearch || !matchPriority || !matchMode) return false;

      if (activeFilter === "ALL") return true;

      if (activeFilter === "NEW") {
        return p.status === "BRIEFING" || p.status === "ASSIGNED";
      }

      if (activeFilter === "DUE") {
        const isDueSoon =
          p.dueDate &&
          new Date(p.dueDate).getTime() <= Date.now() + 3 * 24 * 60 * 60 * 1000;
        const isUrgent = p.priority === "URGENT" || p.priority === "HIGH";
        return (isDueSoon || isUrgent) && p.status !== "PRODUCTION_LOCKED";
      }

      if (activeFilter === "CLIENT_REVIEW") {
        return (
          (p.status === "CLIENT_REVIEW" || p.status === "IN_REVIEW") &&
          p.approvalStatus !== "APPROVED" &&
          p.status !== "APPROVED" &&
          p.status !== "PRODUCTION_LOCKED"
        );
      }

      if (activeFilter === "REVISION") {
        return p.status === "REVISION_REQUESTED";
      }

      if (activeFilter === "PREFLIGHT") {
        return (
          (p.preflightStatus === "NOT_STARTED" ||
            p.preflightStatus === "MANUAL_REVIEW_REQUIRED" ||
            p.preflightStatus === "FAILED" ||
            p.status === "APPROVED" ||
            p.approvalStatus === "APPROVED") &&
          p.status !== "PRODUCTION_LOCKED"
        );
      }

      if (activeFilter === "PRODUCTION_READY") {
        return (
          p.status === "PRODUCTION_LOCKED" ||
          ((p.status === "APPROVED" || p.approvalStatus === "APPROVED") &&
            p.preflightStatus === "PASSED")
        );
      }

      return true;
    });
  }, [projects, searchQuery, priorityFilter, modeFilter, activeFilter]);

  // Column matching logic
  const getColumnProjects = (colId) => {
    return filteredProjects.filter((p) => {
      if (colId === "BRIEFING")
        return p.status === "BRIEFING" || p.status === "ASSIGNED";
      if (colId === "IN_PROGRESS")
        return p.status === "IN_PROGRESS" || p.status === "IN_DESIGN";
      if (colId === "CLIENT_REVIEW")
        return (
          (p.status === "CLIENT_REVIEW" || p.status === "IN_REVIEW") &&
          p.approvalStatus !== "APPROVED" &&
          p.status !== "APPROVED" &&
          p.status !== "PRODUCTION_LOCKED"
        );
      if (colId === "REVISION_REQUESTED")
        return p.status === "REVISION_REQUESTED";
      if (colId === "APPROVED")
        return (
          (p.status === "APPROVED" || p.approvalStatus === "APPROVED") &&
          p.status !== "PRODUCTION_LOCKED"
        );
      if (colId === "PRODUCTION_LOCKED")
        return p.status === "PRODUCTION_LOCKED";
      return p.status === colId;
    });
  };

  // Determine which columns to display
  const displayedColumns = useMemo(() => {
    if (activeFilter === "ALL" || !currentConfig.columnIds) {
      return COLUMNS;
    }
    return COLUMNS.filter((c) => currentConfig.columnIds.includes(c.id));
  }, [activeFilter, currentConfig]);

  const gridClass =
    displayedColumns.length === 1
      ? "grid grid-cols-1 md:grid-cols-2 max-w-4xl gap-6"
      : displayedColumns.length === 2
        ? "grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl"
        : displayedColumns.length === 3
          ? "grid grid-cols-1 md:grid-cols-3 gap-5 max-w-6xl"
          : "grid grid-cols-6 gap-4 min-w-[1450px]";

  const getCustDisplayName = (p) => {
    if (p.customerId) {
      return (
        p.customerId.businessName ||
        p.customerId.contactPersonName ||
        p.customerId.displayName ||
        "Client"
      );
    }
    return p.title?.split("-")[0]?.trim() || "Client";
  };

  // Current version approval & Production Lock verification
  const currentVersionId = useMemo(() => {
    if (!selectedProject) return null;
    return selectedProject.currentVersionId?._id
      ? String(selectedProject.currentVersionId._id)
      : selectedProject.currentVersionId
        ? String(selectedProject.currentVersionId)
        : null;
  }, [selectedProject]);

  const isCurrentVersionApproved =
    selectedProject?.approvalStatus === "APPROVED";

  // Rule: Lock for Production is enabled when current version is approved
  const canLockProduction = Boolean(
    selectedProject?.status !== "PRODUCTION_LOCKED" && isCurrentVersionApproved,
  );

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-6 pb-0 space-y-4 max-w-[1600px] w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                <Palette className="w-6 h-6 text-blue-600" />
                {currentConfig.title}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {currentConfig.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/designer"
                className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
              >
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                Designer Dashboard
              </Link>
              <button
                onClick={loadProjects}
                disabled={loading}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-2xs transition-colors cursor-pointer"
                title="Refresh Board"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Navigation Tabs Bar */}
        <div className="px-6 py-2.5 bg-white border-y border-slate-200 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs mt-4">
          {NAV_FILTERS.map((f) => {
            const isSelected = activeFilter === f.key;
            const count = counts[f.key] || 0;
            const Icon = f.icon;
            return (
              <button
                key={f.key}
                onClick={() => {
                  if (f.key === "ALL") {
                    router.push("/dashboard/design");
                  } else {
                    router.push(`/dashboard/design?filter=${f.key}`);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{f.label}</span>
                <span
                  className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                    isSelected
                      ? "bg-white/25 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Filter Indicator Banner */}
        {activeFilter !== "ALL" && (
          <div className="mx-6 mt-3 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs text-blue-700">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>
                Filtered by <strong>{currentConfig.badge}</strong> — Showing{" "}
                <strong>{filteredProjects.length}</strong> project
                {filteredProjects.length !== 1 ? "s" : ""}
              </span>
            </div>
            <Link
              href="/dashboard/design"
              className="px-2.5 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-[11px] border border-blue-300 transition-all flex items-center gap-1"
            >
              Clear Filter <X className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Sales View-Only Notification Banner */}
        {isSalesRole && (
          <div className="mx-6 mt-3 p-3.5 rounded-xl bg-blue-50/90 border border-blue-200 flex items-center justify-between text-xs text-blue-900 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <Eye className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="font-bold">Sales Project Status Monitor:</span>{" "}
                <span>
                  You can see live designer status, proofs, and artwork progress
                  for each order to update and contact your customers. Technical
                  specifications, artwork uploads, and production releases are
                  read-only.
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-blue-200/70 text-blue-900 font-extrabold text-[10px] uppercase tracking-wide shrink-0">
              View Only
            </span>
          </div>
        )}

        {/* Specific Order Design Status Banner */}
        {orderIdParam && (
          <div className="mx-6 mt-3 px-4 py-2.5 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between text-xs text-purple-700">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
              <span>
                Filtered to specific design project for Order{" "}
                <strong>#{orderIdParam}</strong>
              </span>
            </div>
            <Link
              href="/dashboard/design"
              className="px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-[11px] border border-purple-300 transition-all flex items-center gap-1"
            >
              View All Projects <X className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Studio Search & Dropdown Filter Bar */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search project #, title or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/20 shadow-2xs transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium">
              Priority:
            </span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white shadow-2xs cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent Only</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>

            <span className="text-[11px] text-slate-500 font-medium ml-2">
              Workflow:
            </span>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white shadow-2xs cursor-pointer"
            >
              <option value="ALL">All Modes</option>
              <option value="DESIGN_REQUIRED">Creative Studio</option>
              <option value="CLIENT_PRINT_READY">Client Print-Ready</option>
            </select>
          </div>
        </div>

        {/* Kanban Board Container */}
        <div className="p-6 flex-1 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-80 text-sm text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mr-2.5 text-blue-600" />
              Loading Design Projects...
            </div>
          ) : (
            <div className={gridClass}>
              {displayedColumns.map((col) => {
                const columnProjects = getColumnProjects(col.id);

                return (
                  <div
                    key={col.id}
                    className="flex flex-col bg-slate-100/70 rounded-md border border-slate-200 p-3.5 min-h-[700px] shadow-2xs"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            col.id === "PRODUCTION_LOCKED"
                              ? "bg-cyan-500 shadow-xs shadow-cyan-500/50"
                              : col.id === "APPROVED"
                                ? "bg-emerald-500 shadow-xs shadow-emerald-500/50"
                                : col.id === "REVISION_REQUESTED"
                                  ? "bg-rose-500 shadow-xs shadow-rose-500/50"
                                  : col.id === "CLIENT_REVIEW"
                                    ? "bg-purple-500"
                                    : col.id === "IN_PROGRESS"
                                      ? "bg-blue-500"
                                      : "bg-amber-500"
                          }`}
                        />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          {col.label}
                        </h3>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 shadow-2xs">
                        {columnProjects.length}
                      </span>
                    </div>

                    {/* Cards Container */}
                    <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                      {columnProjects.length === 0 ? (
                        <div className="h-28 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-[11px] text-slate-400 font-medium bg-white/50">
                          No Projects
                        </div>
                      ) : (
                        columnProjects.map((p) => {
                          const isOverdue =
                            p.dueDate &&
                            new Date(p.dueDate) < new Date() &&
                            p.status !== "PRODUCTION_LOCKED" &&
                            p.status !== "APPROVED";

                          return (
                            <div
                              key={p._id}
                              onClick={() => openProjectDetails(p)}
                              className={`p-3.5 rounded-xl bg-white border transition-all cursor-pointer shadow-xs hover:shadow-md group relative ${
                                isOverdue
                                  ? "border-rose-300 hover:border-rose-400 bg-rose-50/40"
                                  : "border-slate-200 hover:border-blue-500 hover:bg-white"
                              }`}
                            >
                              {/* Top Bar: Project ID & Priority */}
                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                  {p.projectNumber || "DSN"}
                                </span>
                                <div className="flex items-center gap-1">
                                  {p.priority === "URGENT" ||
                                  p.priority === "HIGH" ? (
                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                      {p.priority}
                                    </span>
                                  ) : null}
                                  <span
                                    className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                                      p.workflowMode === "CLIENT_PRINT_READY"
                                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                                        : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                    }`}
                                  >
                                    {p.workflowMode === "CLIENT_PRINT_READY"
                                      ? "Print-Ready"
                                      : "Creative"}
                                  </span>
                                </div>
                              </div>

                              {/* Customer & Title */}
                              <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                {getCustDisplayName(p)}
                              </h4>
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                {p.title}
                              </p>

                              {/* Badges: Version, Attachments & Due Date */}
                              <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 text-[10px] text-slate-500">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-slate-700 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                    {p.currentVersionNumber
                                      ? `V${p.currentVersionNumber}`
                                      : "V0 Draft"}
                                  </span>
                                  {p.briefAttachments &&
                                  p.briefAttachments.length > 0 ? (
                                    <span
                                      className="flex items-center gap-0.5 text-blue-600 font-semibold"
                                      title="Files attached during hand-off"
                                    >
                                      <Paperclip className="w-3 h-3" />
                                      {p.briefAttachments.length}
                                    </span>
                                  ) : null}
                                </div>

                                {p.dueDate ? (
                                  <span
                                    className={`flex items-center gap-1 font-semibold ${
                                      isOverdue
                                        ? "text-rose-600"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    <Clock className="w-3 h-3" />
                                    {new Date(p.dueDate).toLocaleDateString(
                                      [],
                                      { month: "short", day: "numeric" },
                                    )}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* FULL PROJECT STUDIO MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 md:p-6 overflow-hidden">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up text-slate-800">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                  <Palette className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      {selectedProject.projectNumber}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedProject.title}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider ${
                        selectedProject.status === "PRODUCTION_LOCKED"
                          ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                          : selectedProject.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : selectedProject.status === "REVISION_REQUESTED"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : selectedProject.status === "CLIENT_REVIEW"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {selectedProject.status}
                    </span>
                    {isSalesRole && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold">
                        VIEW ONLY
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Client:{" "}
                    <strong className="text-slate-800">
                      {getCustDisplayName(selectedProject)}
                    </strong>{" "}
                    • Order:{" "}
                    <span className="font-mono text-slate-700 font-semibold">
                      {selectedProject.orderId?.orderNumber || "—"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Quick Actions Header Buttons */}
              <div className="flex items-center gap-2">
                {!isSalesRole &&
                (selectedProject.status === "BRIEFING" ||
                  selectedProject.status === "ASSIGNED") ? (
                  <button
                    onClick={handleStartDesign}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Start Design
                  </button>
                ) : null}

                <button
                  onClick={handleGenerateProofLink}
                  disabled={generatingProof}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                  title="Generate Client Proofing Link"
                >
                  {copiedProof ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5" />
                  )}
                  {copiedProof ? "Proof Link Copied!" : "Share Proof Link"}
                </button>

                <button
                  onClick={() => {
                    setSelectedProject(null);
                    setActionSuccess("");
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Success Banner */}
            {actionSuccess ? (
              <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between text-xs text-emerald-700 font-semibold">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {actionSuccess}
                </span>
                <button
                  onClick={() => setActionSuccess("")}
                  className="text-emerald-700 hover:underline text-[10px] cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            ) : null}

            {/* Proof Link Copied Card if active */}
            {proofUrl ? (
              <div className="px-6 py-2.5 bg-purple-50 border-b border-purple-200 flex items-center justify-between text-xs text-purple-700">
                <span className="font-mono text-[11px] truncate max-w-md">
                  {proofUrl}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(proofUrl);
                      setCopiedProof(true);
                      setTimeout(() => setCopiedProof(false), 2000);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold cursor-pointer"
                  >
                    {copiedProof ? "Copied!" : "Copy"}
                  </button>
                  <a
                    href={proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 hover:bg-purple-100 text-purple-800 text-[11px] font-semibold flex items-center gap-1 shadow-2xs"
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ) : null}

            {/* Modal Tabs Bar */}
            <div className="flex border-b border-slate-200 px-6 bg-slate-50/50 gap-6 text-xs overflow-x-auto">
              <button
                onClick={() => setActiveTab("brief")}
                className={`py-3 font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                  activeTab === "brief"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileText className="w-4 h-4" />
                Brief &amp; Specs
                {selectedProject.briefAttachments &&
                selectedProject.briefAttachments.length > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-blue-100 text-blue-700 font-mono">
                    {selectedProject.briefAttachments.length}
                  </span>
                ) : null}
              </button>

              <button
                onClick={() => setActiveTab("assets")}
                className={`py-3 font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                  activeTab === "assets"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Upload className="w-4 h-4" />
                Artwork Upload ({projectAssets.length})
              </button>

              <button
                onClick={() => setActiveTab("versions")}
                className={`py-3 font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                  activeTab === "versions"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <History className="w-4 h-4" />
                Version History ({projectVersions.length})
              </button>

              <button
                onClick={() => setActiveTab("revisions")}
                className={`py-3 font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                  activeTab === "revisions"
                    ? "border-rose-600 text-rose-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                Client Revisions
                {projectRevisions.length > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-100 text-rose-700 font-bold">
                    {projectRevisions.length}
                  </span>
                ) : null}
              </button>

              <button
                onClick={() => setActiveTab("approval")}
                className={`py-3 font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                  activeTab === "approval"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Approval &amp; Release
              </button>
            </div>

            {/* Modal Body Container */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* TAB 1: 7-POINT TECHNICAL BRIEF & HAND-OFF ATTACHMENTS */}
              {activeTab === "brief" &&
                (() => {
                  const primaryItem =
                    selectedProject?.orderItemId &&
                    typeof selectedProject.orderItemId === "object"
                      ? selectedProject.orderItemId
                      : selectedProject?.orderId?.items?.[0] || {};

                  const dynamicSpecs = {
                    width:
                      selectedProject?.brief?.productDimensions?.width ??
                      primaryItem.width ??
                      0,
                    height:
                      selectedProject?.brief?.productDimensions?.height ??
                      primaryItem.height ??
                      0,
                    unit:
                      selectedProject?.brief?.productDimensions?.unit ||
                      primaryItem.dimensionUnit ||
                      "inch",
                    quantity:
                      selectedProject?.brief?.quantity ||
                      primaryItem.quantity ||
                      1,
                    material:
                      selectedProject?.brief?.material ||
                      selectedProject?.brief?.paperMedia ||
                      primaryItem.paperType ||
                      "Standard Media",
                    printingMethod:
                      selectedProject?.brief?.printingMethod ||
                      "Digital Offset / Large Format",
                    gsm:
                      selectedProject?.brief?.gsm ||
                      primaryItem.paperGsm ||
                      null,
                    colorMode:
                      selectedProject?.brief?.colorMode ||
                      primaryItem.colors ||
                      "CMYK Full Color",
                    dpi: selectedProject?.brief?.dpi || primaryItem.dpi || 100,
                    printSides:
                      selectedProject?.brief?.printSides ||
                      primaryItem.printSides ||
                      "SINGLE",
                    finishing:
                      selectedProject?.brief?.finishing &&
                      selectedProject.brief.finishing.length > 0
                        ? selectedProject.brief.finishing
                        : primaryItem.finishing &&
                            primaryItem.finishing.length > 0
                          ? primaryItem.finishing
                          : [],
                    specialInstructions:
                      selectedProject?.brief?.specialInstructions ||
                      selectedProject?.orderId?.designNotes ||
                      selectedProject?.orderId?.notes ||
                      "",
                    targetDate:
                      selectedProject?.dueDate ||
                      selectedProject?.orderId?.designDeadline ||
                      selectedProject?.orderId?.promisedDeliveryDate,
                  };

                  return (
                    <div className="space-y-6">
                      {/* 7-Point Technical Specifications Checklist */}
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-blue-600" />
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                              7-Point Technical Production Brief (Step 12)
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />{" "}
                              Live Order Synced
                            </span>
                          </div>

                          {!isSalesRole ? (
                            <button
                              type="button"
                              onClick={handleOpenEditSpecs}
                              className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Edit Specs / Brief
                            </button>
                          ) : (
                            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 font-semibold flex items-center gap-1">
                              <Lock className="w-3 h-3 text-slate-400" /> Specs
                              Locked for Sales
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 bg-slate-50 p-4 rounded-md border border-slate-200">
                          {/* 1. Size / Dimensions */}
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                                1. Size
                              </span>
                              <span className="text-[9px] px-1 rounded bg-blue-50 text-blue-700 font-mono border border-blue-200">
                                DIMENSIONS
                              </span>
                            </div>
                            <span className="font-bold text-slate-800 text-sm block">
                              {dynamicSpecs.width} × {dynamicSpecs.height}{" "}
                              {dynamicSpecs.unit}
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5 block">
                              Width × Height
                            </span>
                          </div>

                          {/* 2. Quantity */}
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                                2. Quantity
                              </span>
                              <span className="text-[9px] px-1 rounded bg-amber-50 text-amber-700 font-mono border border-amber-200">
                                UNITS
                              </span>
                            </div>
                            <span className="font-bold text-slate-800 text-sm block">
                              {dynamicSpecs.quantity} Units
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5 block">
                              Total Production Run
                            </span>
                          </div>

                          {/* 3. Material */}
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                                3. Material
                              </span>
                              <span className="text-[9px] px-1 rounded bg-purple-50 text-purple-700 font-mono border border-purple-200">
                                MEDIA
                              </span>
                            </div>
                            <span
                              className="font-bold text-slate-800 text-sm block truncate"
                              title={dynamicSpecs.material}
                            >
                              {dynamicSpecs.material}
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5 block truncate">
                              {dynamicSpecs.printingMethod}
                            </span>
                          </div>

                          {/* 4. GSM */}
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider">
                                4. GSM
                              </span>
                              <span className="text-[9px] px-1 rounded bg-cyan-50 text-cyan-700 font-mono border border-cyan-200">
                                WEIGHT
                              </span>
                            </div>
                            <span className="font-bold text-slate-800 text-sm block">
                              {dynamicSpecs.gsm
                                ? `${dynamicSpecs.gsm} GSM`
                                : "Standard Weight"}
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5 block">
                              Paper/Substrate Density
                            </span>
                          </div>

                          {/* 5. Colors */}
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                5. Colors
                              </span>
                              <span className="text-[9px] px-1 rounded bg-emerald-50 text-emerald-700 font-mono border border-emerald-200">
                                PROFILE
                              </span>
                            </div>
                            <span className="font-bold text-emerald-700 text-sm block">
                              {dynamicSpecs.colorMode}
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5 block">
                              {dynamicSpecs.printSides} Side Print
                            </span>
                          </div>

                          {/* 6. Resolution / DPI */}
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                                6. Resolution
                              </span>
                              <span className="text-[9px] px-1 rounded bg-amber-50 text-amber-700 font-mono font-bold border border-amber-200">
                                DPI
                              </span>
                            </div>
                            <span className="font-bold text-amber-700 text-sm block">
                              {dynamicSpecs.dpi} DPI
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5 block">
                              {Number(dynamicSpecs.dpi) <= 100
                                ? "Large Format / Outdoor"
                                : "High Resolution Print"}
                            </span>
                          </div>

                          {/* 7. Finishing */}
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                                7. Finishing
                              </span>
                              <span className="text-[9px] px-1 rounded bg-rose-50 text-rose-700 font-mono border border-rose-200">
                                POST-PRESS
                              </span>
                            </div>
                            <span
                              className="font-bold text-slate-800 text-sm block truncate"
                              title={dynamicSpecs.finishing.join(", ")}
                            >
                              {dynamicSpecs.finishing &&
                              dynamicSpecs.finishing.length > 0
                                ? dynamicSpecs.finishing.join(", ")
                                : "Standard Cut to Size"}
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5 block truncate">
                              Lamination &amp; Post-Press
                            </span>
                          </div>

                          {/* Delivery / Promised Date */}
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                                Target Date
                              </span>
                              <Clock className="w-3 h-3 text-indigo-600" />
                            </div>
                            <span className="font-bold text-slate-800 text-sm block">
                              {dynamicSpecs.targetDate
                                ? new Date(
                                    dynamicSpecs.targetDate,
                                  ).toLocaleDateString()
                                : "Standard TAT"}
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5 block">
                              Client Promised Deadline
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 7. Special Instructions & Remarks */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-amber-600" />
                          7. Instructions, Sales Remarks &amp; Customer Notes
                        </h4>
                        {dynamicSpecs.specialInstructions ? (
                          <div className="p-4 rounded-md bg-amber-50 border border-amber-200 text-amber-900 font-medium whitespace-pre-wrap leading-relaxed">
                            {dynamicSpecs.specialInstructions}
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs">
                            No special notes provided. Follow standard brand
                            guidelines.
                          </div>
                        )}
                      </div>

                      {/* Sales Handoff Brief Attachments */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-blue-600" />
                            Client Files Attached in Handoff (
                            {selectedProject.briefAttachments?.length || 0})
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            Reference artwork, logos and client photos
                          </span>
                        </div>

                        {!selectedProject.briefAttachments ||
                        selectedProject.briefAttachments.length === 0 ? (
                          <div className="p-6 rounded-md bg-slate-50 border border-dashed border-slate-200 text-center text-slate-500">
                            No reference photos or artwork files were attached
                            during hand-off.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {selectedProject.briefAttachments.map(
                              (att, idx) => {
                                const isImg =
                                  att.fileUrl &&
                                  /\.(jpe?g|png|webp|gif|svg)$/i.test(
                                    att.fileUrl,
                                  );

                                return (
                                  <a
                                    key={idx}
                                    href={att.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 flex flex-col justify-between transition-all shadow-2xs"
                                  >
                                    <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 border border-slate-200 mb-2 flex items-center justify-center">
                                      {isImg ? (
                                        <img
                                          src={att.fileUrl}
                                          alt={att.fileName || "Attachment"}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                      ) : (
                                        <FileCode className="w-8 h-8 text-blue-500" />
                                      )}
                                    </div>
                                    <div>
                                      <span className="font-semibold text-slate-800 block truncate text-[11px]">
                                        {att.fileName ||
                                          `Attachment #${idx + 1}`}
                                      </span>
                                      <span className="text-[10px] text-blue-600 group-hover:underline flex items-center gap-1 mt-0.5 font-medium">
                                        View / Download{" "}
                                        <Download className="w-2.5 h-2.5" />
                                      </span>
                                    </div>
                                  </a>
                                );
                              },
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

              {/* TAB 2: ARTWORK UPLOAD & ASSETS */}
              {activeTab === "assets" && (
                <div className="space-y-6">
                  {isSalesRole ? (
                    <div className="p-4 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-700 shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <Eye className="w-4 h-4 text-blue-600 shrink-0" />
                        <div>
                          <strong className="block text-slate-900">
                            Artwork &amp; Proof Files (Read Only)
                          </strong>
                          <span className="text-slate-500 text-[11px]">
                            File uploads are managed by the assigned designer.
                            You can preview and download all client assets below
                            to contact your customer.
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold uppercase">
                        View Only
                      </span>
                    </div>
                  ) : (
                    /* Uploader Card */
                    <form
                      onSubmit={handleUploadAsset}
                      className="p-5 rounded-md bg-slate-50 border border-slate-200 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <Upload className="w-4 h-4 text-blue-600" />
                          Upload Artwork Asset to Cloudinary
                        </h4>
                        <span className="text-[10px] text-slate-500">
                          PDF, PNG, JPG, TIFF up to 50MB
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                            Asset Category
                          </label>
                          <select
                            value={uploadCategory}
                            onChange={(e) => setUploadCategory(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          >
                            <option value="PROOF">
                              PROOF (Client Review Artwork)
                            </option>
                            <option value="PRINT_READY">
                              PRINT_READY (High-Res Production File)
                            </option>
                            <option value="DESIGN_SOURCE">
                              DESIGN_SOURCE (Corel/AI/PSD)
                            </option>
                            <option value="PHOTO">
                              PHOTO (Hi-Res Graphic/Asset)
                            </option>
                            <option value="LOGO">
                              LOGO (Vector/Transparent)
                            </option>
                            <option value="OTHER">OTHER</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                            Select Artwork File *
                          </label>
                          <input
                            ref={fileInputRef}
                            type="file"
                            required
                            onChange={(e) =>
                              setUploadFile(e.target.files?.[0] || null)
                            }
                            className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                          />
                        </div>

                        <div>
                          <button
                            type="submit"
                            disabled={uploadingAsset || !uploadFile}
                            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Upload className="w-4 h-4" />
                            {uploadingAsset
                              ? "Uploading to Cloudinary..."
                              : "Upload Asset"}
                          </button>
                        </div>
                      </div>

                      {uploadStatusMsg ? (
                        <p className="text-xs text-emerald-600 font-semibold">
                          {uploadStatusMsg}
                        </p>
                      ) : null}
                    </form>
                  )}

                  {/* Project Assets Grid */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
                      <span>
                        Uploaded Artwork Assets ({projectAssets.length})
                      </span>
                    </h4>

                    {projectAssets.length === 0 ? (
                      <div className="p-8 rounded-md bg-slate-50 border border-dashed border-slate-200 text-center text-slate-500">
                        No artwork assets uploaded yet. Upload your first proof
                        file above.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {projectAssets.map((asset) => {
                          const isImg =
                            asset.fileUrl &&
                            /\.(jpe?g|png|webp|gif|svg)$/i.test(asset.fileUrl);

                          return (
                            <div
                              key={asset._id}
                              className="p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-400 shadow-2xs flex flex-col justify-between transition-all"
                            >
                              <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 border border-slate-200 mb-2 flex items-center justify-center">
                                {isImg ? (
                                  <img
                                    src={asset.fileUrl}
                                    alt={asset.originalFilename}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <FileCode className="w-8 h-8 text-blue-500" />
                                )}
                                <span className="absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800/80 text-white">
                                  {asset.category}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <span className="font-semibold text-slate-800 block truncate text-[11px]">
                                  {asset.originalFilename}
                                </span>
                                <span className="text-[10px] text-slate-500 block">
                                  {(asset.sizeBytes / 1024).toFixed(1)} KB •{" "}
                                  {new Date(
                                    asset.createdAt,
                                  ).toLocaleDateString()}
                                </span>

                                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                                  <a
                                    href={asset.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                                  >
                                    View{" "}
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>

                                  <button
                                    onClick={() => {
                                      setSelectedProofAssetId(asset._id);
                                      setActiveTab("versions");
                                    }}
                                    className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 text-[10px] font-bold cursor-pointer"
                                  >
                                    Use for Version
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: VERSION MANAGEMENT & TIMELINE */}
              {activeTab === "versions" && (
                <div className="space-y-6">
                  {isSalesRole ? (
                    <div className="p-4 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-700 shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <History className="w-4 h-4 text-purple-600 shrink-0" />
                        <div>
                          <strong className="block text-slate-900">
                            Design Versions &amp; Proof History (Read Only)
                          </strong>
                          <span className="text-slate-500 text-[11px]">
                            Publishing design versions is handled by the
                            designer. You can inspect all proofs and versions
                            below to update your client.
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold uppercase">
                        View Only
                      </span>
                    </div>
                  ) : (
                    /* Publish Version Form */
                    <form
                      onSubmit={handleCreateVersion}
                      className="p-5 rounded-md bg-slate-50 border border-slate-200 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <Layers className="w-4 h-4 text-purple-600" />
                          Publish New Design Version
                        </h4>
                        <span className="text-[10px] text-slate-500">
                          Creates immutable version with SHA-256 hash
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                            Select Proof Artwork *
                          </label>
                          <select
                            required
                            value={selectedProofAssetId}
                            onChange={(e) =>
                              setSelectedProofAssetId(e.target.value)
                            }
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                          >
                            <option value="">
                              -- Choose Uploaded Asset --
                            </option>
                            {projectAssets.map((asset) => (
                              <option key={asset._id} value={asset._id}>
                                [{asset.category}] {asset.originalFilename} (
                                {(asset.sizeBytes / 1024).toFixed(0)} KB)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                            Change Summary (e.g. V2 changes)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Updated logo size and altered font to Montserrat"
                            value={changeSummary}
                            onChange={(e) => setChangeSummary(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                            Designer Comments / Client Notes
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Notes for client and sales rep reviewing this version..."
                            value={designerComment}
                            onChange={(e) => setDesignerComment(e.target.value)}
                            className="w-full p-3 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={creatingVersion || !selectedProofAssetId}
                          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                        >
                          <History className="w-4 h-4" />
                          {creatingVersion
                            ? "Publishing Version..."
                            : "Publish New Version"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Version Timeline */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                      Version Timeline ({projectVersions.length})
                    </h4>

                    {projectVersions.length === 0 ? (
                      <div className="p-8 rounded-md bg-slate-50 border border-dashed border-slate-200 text-center text-slate-500">
                        No published versions yet. Upload an asset and publish
                        your first version above.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {projectVersions.map((v) => (
                          <div
                            key={v._id}
                            className={`p-4 rounded-md border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                              v.isCurrent
                                ? "bg-purple-50/60 border-purple-200"
                                : "bg-white border-slate-200 shadow-2xs"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center font-mono font-black text-purple-700 text-sm shrink-0">
                                {v.versionLabel || `V${v.versionNumber}`}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <strong className="text-slate-900 text-sm font-bold">
                                    {v.versionLabel ||
                                      `Version ${v.versionNumber}`}
                                  </strong>
                                  {v.isCurrent ? (
                                    <span className="px-2 py-0.5 rounded text-[9px] font-black bg-purple-600 text-white">
                                      CURRENT
                                    </span>
                                  ) : null}
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    SHA:{" "}
                                    {v.sha256
                                      ? `${v.sha256.slice(0, 10)}...`
                                      : "N/A"}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 mt-1">
                                  {v.changeSummary ||
                                    v.designerComment ||
                                    "Initial artwork version"}
                                </p>
                                <span className="text-[10px] text-slate-400 mt-0.5 block">
                                  Uploaded on{" "}
                                  {new Date(
                                    v.uploadedAt || v.createdAt,
                                  ).toLocaleString()}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={handleGenerateProofLink}
                                className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                Share Proof
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: CLIENT REVISIONS & PIN COMMENTS (STEP 15) */}
              {activeTab === "revisions" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-rose-600" />
                        Client Revision Requests &amp; Artwork Feedback (
                        {projectRevisions.length})
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Client feedback submitted via the public proof portal
                        with pinned visual annotations.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab("versions");
                        setChangeSummary(
                          `V${(selectedProject.currentVersionNumber || 1) + 1} - Addressing client revision feedback`,
                        );
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Upload Corrected V
                      {(selectedProject.currentVersionNumber || 1) + 1}
                    </button>
                  </div>

                  {projectRevisions.length === 0 ? (
                    <div className="p-8 rounded-md bg-slate-50 border border-dashed border-slate-200 text-center text-slate-500">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">
                        No revisions requested by client.
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Artwork is currently progressing through the standard
                        approval workflow.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {projectRevisions.map((rev, idx) => (
                        <div
                          key={rev._id || idx}
                          className="p-5 rounded-md bg-white border border-rose-200 shadow-xs space-y-3.5"
                        >
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                                Revision #{projectRevisions.length - idx}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                Requested by:{" "}
                                {rev.requesterName ||
                                  rev.requestedByType ||
                                  "Client"}
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium">
                                • {new Date(rev.createdAt).toLocaleString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {rev.status !== "ACKNOWLEDGED" &&
                              rev.status !== "RESOLVED" ? (
                                !isSalesRole ? (
                                  <button
                                    onClick={() =>
                                      handleAcknowledgeRevision(rev._id)
                                    }
                                    className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                                  >
                                    Acknowledge
                                  </button>
                                ) : (
                                  <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                                    Pending Designer Action
                                  </span>
                                )
                              ) : (
                                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />{" "}
                                  Acknowledged
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Reason & Feedback */}
                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                                Client Reason:
                              </span>
                              <span className="text-xs font-bold text-slate-800">
                                {rev.reason || "General Revision"}
                              </span>
                            </div>
                            {rev.notes || rev.feedback ? (
                              <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                                {rev.notes || rev.feedback}
                              </p>
                            ) : null}
                          </div>

                          {/* Spatial Pin Markers */}
                          {rev.pinComments && rev.pinComments.length > 0 ? (
                            <div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                Pinned Proof Annotations (
                                {rev.pinComments.length}):
                              </span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {rev.pinComments.map((pin, pIdx) => (
                                  <div
                                    key={pIdx}
                                    className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-slate-700"
                                  >
                                    <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                                      {pIdx + 1}
                                    </span>
                                    <div className="min-w-0">
                                      <p className="font-medium text-rose-900 truncate">
                                        {pin.comment}
                                      </p>
                                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                                        Position: X:{" "}
                                        {(pin.xNormalized * 100).toFixed(0)}%,
                                        Y: {(pin.yNormalized * 100).toFixed(0)}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: APPROVAL, PREFLIGHT & PRODUCTION RELEASE (STEPS 17, 18, 19, 20) */}
              {activeTab === "approval" && (
                <div className="space-y-6">
                  {/* Step 17: Client Approval Status */}
                  <div className="p-5 rounded-md bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-0.5 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Step 17: Client Approval (Version-Bound)
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Proof approval is strictly tied to{" "}
                          <strong className="text-slate-700">
                            V{selectedProject.currentVersionNumber || 1}
                          </strong>
                          . Uploading new versions resets this approval.
                        </p>
                      </div>

                      {selectedProject.approvalStatus === "APPROVED" ? (
                        <span className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />{" "}
                          V{selectedProject.currentVersionNumber || 1} APPROVED
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-bold text-xs flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-600" /> PENDING
                          CLIENT APPROVAL
                        </span>
                      )}
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                      {selectedProject.approvalStatus !== "APPROVED" ? (
                        !isSalesRole ? (
                          <button
                            onClick={() => setShowApprovalModal(true)}
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            Record Manual Client Approval
                          </button>
                        ) : (
                          <div className="text-xs text-slate-500 italic">
                            Awaiting client review &amp; designer/manager
                            approval.
                          </div>
                        )
                      ) : (
                        <div className="text-xs text-slate-500">
                          Signed-off by client for production press run.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Production File Lock & Press Release */}
                  <div className="p-5 rounded-md bg-slate-50 border border-slate-200 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-0.5 flex items-center gap-2">
                          <Lock className="w-4 h-4 text-cyan-600" />
                          Production File Lock &amp; Press Release
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Cryptographically locks the approved artwork using
                          SHA-256 for release to the print floor.
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {selectedProject.status !== "PRODUCTION_LOCKED" &&
                        !isSalesRole ? (
                          <>
                            <button
                              onClick={() => setShowOverrideModal(true)}
                              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                              CEO Override
                            </button>
                            <button
                              onClick={handleProductionLock}
                              disabled={lockingLoading || !canLockProduction}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                              title={
                                !isCurrentVersionApproved
                                  ? "Client approval required before locking"
                                  : "Lock production file and release to press"
                              }
                            >
                              <Lock className="w-3.5 h-3.5" />
                              Lock for Production
                            </button>
                          </>
                        ) : isSalesRole &&
                          selectedProject.status !== "PRODUCTION_LOCKED" ? (
                          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                            Lock Managed by Production
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {!canLockProduction &&
                      selectedProject.status !== "PRODUCTION_LOCKED" && (
                        <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1.5 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                          Production lock requires client approval on current
                          version V{selectedProject?.currentVersionNumber || 1}.
                          Click &quot;Record Manual Client Approval&quot; or use
                          CEO Override.
                        </p>
                      )}

                    {/* Final Current End Banner */}
                    {selectedProject.status === "PRODUCTION_LOCKED" ? (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 space-y-2.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2 text-cyan-800 font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                            <span>
                              PRODUCTION LOCKED &amp; RELEASED TO PRESS
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 border border-cyan-200 font-mono">
                            READY FOR PRINTING
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] pt-1 border-t border-cyan-200">
                          <div>
                            <span className="text-slate-500 block">
                              Locked Version:
                            </span>
                            <span className="font-bold text-slate-800">
                              V{selectedProject.currentVersionNumber || 1}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">
                              Approval Status:
                            </span>
                            <span className="font-bold text-emerald-700">
                              CLIENT APPROVED
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">
                              Operator Release:
                            </span>
                            <span className="font-bold text-cyan-700">
                              Queued for Print Machine
                            </span>
                          </div>
                        </div>

                        {!isSalesRole && (
                          <div className="pt-2 flex justify-end border-t border-cyan-200">
                            <button
                              onClick={handleHandoffToProduction}
                              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <Printer className="w-4 h-4" />
                              <span>
                                Go to Production Job &amp; Press Queue →
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RECORD MANUAL CLIENT APPROVAL MODAL */}
      {showApprovalModal && selectedProject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-60 flex items-center justify-center p-4">
          <form
            onSubmit={handleRecordApproval}
            className="bg-white border border-slate-200 rounded-md w-full max-w-lg p-6 space-y-4 shadow-xl animate-scale-up text-slate-800"
          >
            <div className="flex items-center gap-3 text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">
                Record Client Approval
              </h3>
            </div>

            <p className="text-xs text-slate-500">
              Record approval given by the client via email, WhatsApp, phone, or
              in person. This moves the project to APPROVED.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Approved By (Client Full Name) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={approvalClientName}
                onChange={(e) => setApprovalClientName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Evidence Channel *
                </label>
                <select
                  value={approvalEvidenceType}
                  onChange={(e) => setApprovalEvidenceType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                >
                  <option value="EMAIL_CONFIRMATION">Email Confirmation</option>
                  <option value="SIGNED_PROOF">Signed Proof Copy</option>
                  <option value="IN_PERSON">In Person Approval</option>
                  <option value="OTHER">WhatsApp / Chat</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Evidence Reference *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WhatsApp message on 9876543210"
                  value={approvalEvidenceRef}
                  onChange={(e) => setApprovalEvidenceRef(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Client Feedback / Remarks
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Approved the color tone and text formatting."
                value={approvalFeedback}
                onChange={(e) => setApprovalFeedback(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingApproval}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {submittingApproval ? "Recording..." : "Confirm Approval"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT TECHNICAL SPECIFICATIONS (DESIGNER HANDOFF) MODAL */}
      {showEditSpecsModal && selectedProject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-60 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-md w-full max-w-2xl p-6 space-y-4 shadow-xl animate-scale-up max-h-[90vh] overflow-y-auto text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-blue-600">
                <Layers className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">
                  Edit 7-Point Technical Production Brief
                </h3>
              </div>
              <button
                onClick={() => setShowEditSpecsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Update production specifications for{" "}
              <span className="font-semibold text-slate-800">
                {selectedProject.projectNumber}
              </span>
              . All modifications are synchronized live with the linked Order.
            </p>

            <form onSubmit={handleSaveSpecs} className="space-y-4 text-xs">
              {/* 1. Dimensions & Quantity */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                  1. Dimensions &amp; Quantity
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">
                      Width
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 3.5"
                      value={editSpecsForm.width ?? ""}
                      onChange={(e) =>
                        setEditSpecsForm({
                          ...editSpecsForm,
                          width: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">
                      Height
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 2"
                      value={editSpecsForm.height ?? ""}
                      onChange={(e) =>
                        setEditSpecsForm({
                          ...editSpecsForm,
                          height: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">
                      Unit
                    </label>
                    <select
                      value={editSpecsForm.dimensionUnit || "inch"}
                      onChange={(e) =>
                        setEditSpecsForm({
                          ...editSpecsForm,
                          dimensionUnit: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-600"
                    >
                      <option value="inch">Inches (in)</option>
                      <option value="mm">Millimeter (mm)</option>
                      <option value="cm">Centimeter (cm)</option>
                      <option value="ft">Feet (ft)</option>
                      <option value="m">Meter (m)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={editSpecsForm.quantity || 1}
                      onChange={(e) =>
                        setEditSpecsForm({
                          ...editSpecsForm,
                          quantity: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Material & GSM */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block">
                  2. Substrate &amp; Weight
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="text-slate-700 font-semibold block mb-1">
                      Material / Media Substrate
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Art Card, Star Flex, Vinyl..."
                      value={editSpecsForm.material ?? ""}
                      onChange={(e) =>
                        setEditSpecsForm({
                          ...editSpecsForm,
                          material: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-purple-600"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[
                        { label: "Art Card", gsm: 350 },
                        { label: "Star Flex", gsm: 440 },
                        { label: "Vinyl Matte", gsm: 120 },
                        { label: "Backlit Film", gsm: 210 },
                        { label: "One-Way Vision", gsm: 140 },
                        { label: "Canvas", gsm: 380 },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() =>
                            setEditSpecsForm({
                              ...editSpecsForm,
                              material: item.label,
                              gsm: item.gsm.toString(),
                            })
                          }
                          className="px-2 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-[10px] text-purple-700 border border-purple-200 transition-colors cursor-pointer"
                        >
                          + {item.label} ({item.gsm} GSM)
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">
                      GSM / Density
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 350"
                      value={editSpecsForm.gsm ?? ""}
                      onChange={(e) =>
                        setEditSpecsForm({
                          ...editSpecsForm,
                          gsm: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-purple-600"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Colors & Print Sides & Method */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                  3. Color &amp; Print Configuration
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">
                      Color Mode
                    </label>
                    <select
                      value={editSpecsForm.colorMode || "CMYK"}
                      onChange={(e) =>
                        setEditSpecsForm({
                          ...editSpecsForm,
                          colorMode: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-emerald-600"
                    >
                      <option value="CMYK">CMYK Full Color (4-Process)</option>
                      <option value="SINGLE_BLACK">
                        Single Color (Black / 1C)
                      </option>
                      <option value="2C">2 Spot Colors</option>
                      <option value="PANTONE">Pantone Match</option>
                      <option value="RGB">RGB (Digital Only)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">
                      Print Sides
                    </label>
                    <select
                      value={editSpecsForm.printSides || "SINGLE"}
                      onChange={(e) =>
                        setEditSpecsForm({
                          ...editSpecsForm,
                          printSides: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-emerald-600"
                    >
                      <option value="SINGLE">Single Side (Front Only)</option>
                      <option value="DOUBLE">
                        Double Sided (Front &amp; Back)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">
                      Target Resolution (DPI)
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        placeholder="100"
                        value={editSpecsForm.dpi ?? ""}
                        onChange={(e) =>
                          setEditSpecsForm({
                            ...editSpecsForm,
                            dpi: e.target.value,
                          })
                        }
                        className="w-20 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-amber-700 font-bold font-mono focus:outline-none focus:border-amber-600"
                      />
                      <div className="flex gap-1 flex-1">
                        {[100, 150, 300].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() =>
                              setEditSpecsForm({
                                ...editSpecsForm,
                                dpi: preset,
                              })
                            }
                            className={`flex-1 px-1.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              Number(editSpecsForm.dpi) === preset
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">
                      Printing Method
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Digital Offset"
                      value={editSpecsForm.printingMethod ?? ""}
                      onChange={(e) =>
                        setEditSpecsForm({
                          ...editSpecsForm,
                          printingMethod: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Finishing (Post-Press) Selection */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
                  4. Post-Press &amp; Finishing
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Gloss Lamination",
                    "Matte Lamination",
                    "Velvet Lamination",
                    "UV Coating",
                    "Spot UV",
                    "Die Cut",
                    "Eyelets / Grommets",
                    "Hemming / Tape",
                    "Creasing & Folding",
                    "Staple / Binding",
                    "Foiling (Gold/Silver)",
                    "Round Corners",
                  ].map((opt) => {
                    const isSelected =
                      Array.isArray(editSpecsForm.finishing) &&
                      editSpecsForm.finishing.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          const cur = Array.isArray(editSpecsForm.finishing)
                            ? editSpecsForm.finishing
                            : [];
                          if (cur.includes(opt)) {
                            setEditSpecsForm({
                              ...editSpecsForm,
                              finishing: cur.filter((x) => x !== opt),
                            });
                          } else {
                            setEditSpecsForm({
                              ...editSpecsForm,
                              finishing: [...cur, opt],
                            });
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Special Instructions & Due Date */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
                  5. Instructions &amp; Promised Deadline
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="text-slate-700 font-semibold block mb-1">
                      Artwork Notes &amp; Special Instructions
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Special instructions from client or salesperson..."
                      value={editSpecsForm.specialInstructions ?? ""}
                      onChange={(e) =>
                        setEditSpecsForm({
                          ...editSpecsForm,
                          specialInstructions: e.target.value,
                        })
                      }
                      className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">
                      Target Proof Date
                    </label>
                    <input
                      type="date"
                      value={editSpecsForm.dueDate ?? ""}
                      onChange={(e) =>
                        setEditSpecsForm({
                          ...editSpecsForm,
                          dueDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-amber-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditSpecsModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSpecs}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingSpecs ? "Saving..." : "Save & Sync Specifications"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CEO OVERRIDE MODAL */}
      {showOverrideModal && selectedProject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-60 flex items-center justify-center p-4">
          <div className="bg-white border border-amber-200 rounded-md w-full max-w-lg p-6 space-y-4 shadow-xl animate-scale-up text-slate-800">
            <div className="flex items-center gap-3 text-amber-600">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">
                CEO / Admin Lock Override
              </h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              This action bypasses standard client approval or preflight checks
              and logs an immutable audit event for compliance.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Override Scope
              </label>
              <select
                value={overrideType}
                onChange={(e) => setOverrideType(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white"
              >
                <option value="BOTH">
                  Bypass Both (Approval &amp; Preflight)
                </option>
                <option value="APPROVAL_OVERRIDE">
                  Approval Override Only
                </option>
                <option value="PREFLIGHT_OVERRIDE">
                  Preflight Override Only
                </option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Auditable Reason *
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Verbal sign-off given directly to CEO over phone..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowOverrideModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAdminOverride}
                disabled={lockingLoading}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {lockingLoading
                  ? "Recording Override..."
                  : "Confirm & Record Override"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DesignStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-500 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            Loading Design Studio...
          </div>
        </div>
      }
    >
      <DesignStudioContent />
    </Suspense>
  );
}
