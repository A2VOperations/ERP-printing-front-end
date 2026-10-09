"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Folder,
  FileText,
  ShoppingBag,
  CreditCard,
  MessageSquare,
  MessageCircle,
  PhoneCall,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Layers,
  DollarSign,
  Printer,
  Download,
  Share2,
  ChevronDown,
  Upload,
  Pin,
  Target,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Check,
  Building,
  Palette,
  Truck,
  Receipt,
  UserCheck,
  Send,
  Eye,
  Image as ImageIcon,
  Camera,
  Loader2,
  History,
} from "lucide-react";

const PIPELINE_STAGES = [
  { id: "NEW", label: "New Lead" },
  { id: "CONTACTED", label: "Contacted" },
  { id: "INTERESTED", label: "Interested" },
  { id: "QUOTATION_SENT", label: "Quotation Sent" },
  { id: "NEGOTIATION", label: "Negotiation" },
  { id: "WON", label: "Order Won" },
  { id: "LOST", label: "Order Lost" },
];

const OUTCOME_OPTIONS = [
  { value: "INTERESTED", label: "Client Interested / Proceeding" },
  { value: "QUOTATION_REQUESTED", label: "Quotation / Estimate Requested" },
  { value: "ORDER_CONFIRMED", label: "Order Confirmed (Deal Won)" },
  { value: "CALLBACK_REQUESTED", label: "Callback Requested" },
  { value: "CALL_LATER", label: "Call Later / Reschedule" },
  { value: "NOT_INTERESTED", label: "Not Interested / Price High" },
  { value: "NO_RESPONSE", label: "No Response / Line Busy" },
  { value: "LOST", label: "Deal Lost to Competitor" },
];

const PAYMENT_METHODS = [
  { value: "UPI", label: "UPI (Google Pay / PhonePe / Paytm / QR)" },
  {
    value: "BANK_TRANSFER_NEFT_RTGS",
    label: "Bank Transfer (NEFT / RTGS / IMPS)",
  },
  { value: "CASH", label: "Cash Payment" },
  { value: "CHEQUE", label: "Cheque Payment" },
  { value: "CREDIT_CARD", label: "Credit / Debit Card" },
];

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const leadId = typeof rawId === "string" ? rawId : rawId?.id || "";

  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showCompleteFollowupModal, setShowCompleteFollowupModal] =
    useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [notes, setNotes] = useState([]);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState("GENERAL");
  const [newNotePinned, setNewNotePinned] = useState(false);
  const [notesCategoryFilter, setNotesCategoryFilter] = useState("ALL");
  const [documents, setDocuments] = useState([]);
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docForm, setDocForm] = useState({
    title: "",
    category: "CLIENT_WORK",
    description: "",
    file: null,
    previewUrl: "",
  });
  const [selectedImagePreview, setSelectedImagePreview] = useState(null);
  const [docCategoryFilter, setDocCategoryFilter] = useState("ALL");

  // Follow-up complete state
  const [completeTargetFollowup, setCompleteTargetFollowup] = useState(null);
  const [completeForm, setCompleteForm] = useState({
    outcome: "INTERESTED",
    outcomeNotes: "",
    nextAction: "NONE",
    nextFollowupTitle: "",
    nextFollowupDate: "",
  });

  // Record Payment state
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "UPI",
    transactionReference: "",
    bankName: "",
    chequeNumber: "",
    chequeDate: "",
    quotationId: "",
    orderId: "",
    selectedItemIndexes: [],
    isDirectQuotationPayment: false,
    notes: "",
  });

  // Create Order Form State
  const [orderForm, setOrderForm] = useState({
    quotationId: "",
    selectedItemIndex: "",
    title: "",
    amount: "",
    advanceRequiredPercent: 50,
    promisedDeliveryDate: "",
    deliveryMethod: "PICKUP",
    notes: "",
    width: "",
    height: "",
    dimensionUnit: "inch",
    quantity: 1,
    material: "",
    gsm: "",
    colors: "CMYK",
    printSides: "SINGLE",
    finishing: [],
  });


  // Form States
  const [editForm, setEditForm] = useState({
    contactName: "",
    businessName: "",
    phone: "",
    email: "",
    alternatePhone: "",
    source: "WALK_IN",
    requirement: "",
    expectedValue: "",
    priority: "HIGH",
    notes: "",
  });

  const [statusForm, setStatusForm] = useState({
    status: "NEW",
    lostReason: "",
    notes: "",
  });

  const [followupForm, setFollowupForm] = useState({
    title: "Follow-up Call",
    scheduledAt: "",
    description: "",
  });

  const [activityForm, setActivityForm] = useState({
    type: "CALL",
    description: "",
  });

  // Load current user profile from localStorage and API
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch {}

    api
      .get("/auth/me")
      .then((res) => {
        if (res?.data?.user) setCurrentUser(res.data.user);
        else if (res?.data) setCurrentUser(res.data);
      })
      .catch(() => {});

    // Fetch team members for lead ownership and reassignment.
    api
      .get("/users?limit=100")
      .then((res) => {
        if (res && res.data) {
          const list = Array.isArray(res.data)
            ? res.data
            : res.data.records || [];
          setTeamMembers(list);
        }
      })
      .catch(() => {});
  }, []);

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false);

  // Collect all photos attached by Data Operator, Sales, or uploaded as documents
  const allLeadPhotos = useMemo(() => {
    const list = [];
    const seenUrls = new Set();

    // 1. Direct shop image attached by Data Operator or Sales
    if (
      lead?.shopImageUrl &&
      typeof lead.shopImageUrl === "string" &&
      lead.shopImageUrl.trim()
    ) {
      const url = lead.shopImageUrl.trim();
      seenUrls.add(url);
      list.push({
        id: "shop-main",
        url,
        title: `Shop Photo - ${lead.businessName || "Client"}`,
        date: lead.createdAt ? new Date(lead.createdAt) : new Date(),
        uploadedBy:
          lead.createdById?.name ||
          (lead.source === "DATA_OPERATOR" ? "Data Operator" : "Sales Team"),
        isPrimary: true,
      });
    }

    // 2. Photos from documents collection (both lead.documents and loaded documents state)
    const combinedDocs = [
      ...(Array.isArray(lead?.documents) ? lead.documents : []),
      ...(Array.isArray(documents) ? documents : []),
    ];

    combinedDocs.forEach((doc, idx) => {
      if (!doc?.fileUrl) return;
      const url = doc.fileUrl.trim();
      const isPhoto =
        doc.category === "PHOTO" ||
        doc.category === "CLIENT_WORK" ||
        url.match(/\.(jpg|jpeg|png|webp|gif)($|\?)/i) ||
        (doc.fileType && doc.fileType.startsWith("image/"));

      if (isPhoto && !seenUrls.has(url)) {
        seenUrls.add(url);
        list.push({
          id: doc._id || `doc-photo-${idx}`,
          url,
          title: doc.title || doc.fileName || `Market Photo ${idx + 1}`,
          date: doc.uploadedAt
            ? new Date(doc.uploadedAt)
            : lead?.createdAt
              ? new Date(lead.createdAt)
              : new Date(),
          uploadedBy:
            doc.uploadedByName ||
            lead.createdById?.name ||
            "Team Member",
          isPrimary: false,
        });
      }
    });

    // 3. Photos from imageUrls array if any
    if (Array.isArray(lead?.imageUrls)) {
      lead.imageUrls.forEach((url, idx) => {
        if (typeof url === "string" && url.trim() && !seenUrls.has(url.trim())) {
          seenUrls.add(url.trim());
          list.push({
            id: `img-url-${idx}`,
            url: url.trim(),
            title: `Shop Photo ${idx + 1}`,
            date: lead.createdAt ? new Date(lead.createdAt) : new Date(),
            uploadedBy: lead.createdById?.name || "Uploaded Photo",
            isPrimary: false,
          });
        }
      });
    }

    // Sort/arrange strictly by date (newest first)
    return list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [lead, documents]);

  // Handler to upload or update shop photo directly from lead profile
  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingProfilePhoto(true);
      const res = await api.upload("/leads/upload-photo", file, "photo");
      const photoUrl = res?.data?.url || res?.url;
      if (photoUrl) {
        await api.patch(`/leads/${leadId}`, {
          shopImageUrl: photoUrl,
        });
        await loadLeadDetails();
      }
    } catch (err) {
      alert("Failed to upload photo: " + (err.message || "Unknown error"));
    } finally {
      setUploadingProfilePhoto(false);
    }
  };

  const activePhoto = allLeadPhotos[activePhotoIdx] || allLeadPhotos[0] || null;

  const roleRaw =
    currentUser?.roleSlug ||
    currentUser?.role?.slug ||
    currentUser?.role?.name ||
    currentUser?.role ||
    "";
  const userRole = (
    typeof roleRaw === "string" ? roleRaw : roleRaw?.slug || roleRaw?.name || ""
  ).toUpperCase();
  const isCEOOrAdmin = ["ADMIN", "SUPER_ADMIN", "CEO", "CEO_ADMIN"].includes(
    userRole,
  );
  const isManager = ["SALES_MANAGER", "MANAGER"].includes(userRole);
  const isSalesOnly =
    userRole === "SALES" || userRole === "SALES_REP";
  const isSalesUser =
    userRole.includes("SALES") ||
    userRole.includes("EMPLOYEE") ||
    userRole.includes("EXECUTIVE");
  const canVerifyPayment = isCEOOrAdmin || isManager || !isSalesOnly;
  const canAssignOrReassign = isCEOOrAdmin || isManager;

  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignTargetId, setReassignTargetId] = useState("");
  const [reassignNotes, setReassignNotes] = useState("");

  const handleReassignLead = async (e) => {
    e.preventDefault();
    if (!lead || !canAssignOrReassign) return;
    try {
      setActionLoading(true);
      await api.patch(`/leads/${lead._id}/assign`, {
        assignedToId: reassignTargetId || null,
        targetUserId: reassignTargetId || null,
        notes: reassignNotes,
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("lead-assigned", {
            detail: { lead, targetUserId: reassignTargetId },
          }),
        );
        window.dispatchEvent(new Event("refresh-inbox-count"));
      }
      setShowReassignModal(false);
      setReassignTargetId("");
      setReassignNotes("");
      await loadLeadDetails();
    } catch (err) {
      alert(err.message || "Failed to reassign lead");
    } finally {
      setActionLoading(false);
    }
  };

  // Only genuine sales reps in the reassign dropdown
  const salesPersonsList = teamMembers.filter((u) => {
    const r = (u.roleSlug || u.role?.slug || u.role?.name || u.role || "")
      .toLowerCase()
      .trim();
    if (
      r.includes("admin") ||
      r === "manager" ||
      r === "customer" ||
      r === "operator" ||
      r === "delivery"
    )
      return false;
    return r === "sales" || r === "employee";
  });

  const loadLeadDetails = useCallback(async () => {
    if (!leadId) return;
    try {
      setLoading(true);
      setErrorMsg("");

      const [leadRes, actRes, flwRes, qRes, oRes, pRes, notesRes, docsRes] =
        await Promise.allSettled([
          api.get(`/leads/${leadId}`),
          api.get(`/leads/${leadId}/activities`),
          api.get(`/followups?leadId=${leadId}`),
          api.get(`/quotations?leadId=${leadId}&limit=100`),
          api.get(`/orders?leadId=${leadId}&limit=100`),
          api.get(`/payments?leadId=${leadId}&limit=100`),
          api.get(`/leads/${leadId}/notes`),
          api.get(`/leads/${leadId}/documents`),
        ]);

      let loadedLead = null;
      if (leadRes.status === "fulfilled" && leadRes.value?.data) {
        const l = leadRes.value.data;
        loadedLead = l;
        setLead(l);
        if (l.notesTimeline && Array.isArray(l.notesTimeline)) {
          setNotes(l.notesTimeline);
        }
        if (l.documents && Array.isArray(l.documents)) {
          setDocuments(l.documents);
        }
        setStatusForm({
          status: l.status || "NEW",
          lostReason: l.lostReason || "",
          notes: "",
        });
        const bName = (
          (l.businessName && l.businessName.trim() !== "Direct Lead" && l.businessName.trim() !== "—" ? l.businessName.trim() : null) ||
          (l.companyName && l.companyName.trim() !== "Direct Lead" && l.companyName.trim() !== "—" ? l.companyName.trim() : null) ||
          ""
        );
        const cName = (
          (l.contactName && l.contactName.trim() !== "Direct Lead" && l.contactName.trim() !== "—" ? l.contactName.trim() : null) ||
          (l.customerName && l.customerName.trim() !== "Direct Lead" && l.customerName.trim() !== "—" ? l.customerName.trim() : null) ||
          ""
        );
        setEditForm({
          contactName: cName,
          businessName: bName,
          phone: l.phone || "",
          email: l.email || "",
          alternatePhone: l.alternatePhone || "",
          source: l.source || "WALK_IN",
          requirement: l.requirement || "",
          expectedValue: l.expectedValue || l.estimatedBudget || 0,
          priority: l.priority || "HIGH",
          notes: l.notes || "",
        });
      } else {
        setErrorMsg("Lead details could not be loaded.");
      }

      if (notesRes.status === "fulfilled" && notesRes.value?.data) {
        const nList = Array.isArray(notesRes.value.data)
          ? notesRes.value.data
          : notesRes.value.data?.records || [];
        if (nList.length > 0) setNotes(nList);
      }

      if (docsRes.status === "fulfilled" && docsRes.value?.data) {
        const dList = Array.isArray(docsRes.value.data)
          ? docsRes.value.data
          : docsRes.value.data?.records || docsRes.value.data?.documents || [];
        if (dList.length > 0) setDocuments(dList);
      }

      if (actRes.status === "fulfilled" && actRes.value?.data) {
        const list = Array.isArray(actRes.value.data)
          ? actRes.value.data
          : actRes.value.data?.records || [];
        setActivities(list);
      }

      if (flwRes.status === "fulfilled" && flwRes.value?.data) {
        const list = Array.isArray(flwRes.value.data)
          ? flwRes.value.data
          : flwRes.value.data?.records || flwRes.value.data?.data || [];
        setFollowups(list);
      }

      if (qRes.status === "fulfilled" && qRes.value?.data) {
        const allQuotes = Array.isArray(qRes.value.data)
          ? qRes.value.data
          : qRes.value.data?.records || [];
        const currentLeadDbId = (loadedLead?._id || leadId || "").toString();
        const currentLeadNumber = (
          loadedLead?.leadNumber ||
          loadedLead?.leadId ||
          ""
        ).toString();

        const matchingQuotes = allQuotes.filter((q) => {
          const qLeadObj = q.leadId;
          const qLeadId = (
            qLeadObj?._id ||
            qLeadObj?.id ||
            (typeof qLeadObj === "string" ? qLeadObj : "") ||
            ""
          ).toString();
          const qLeadNumber = (
            qLeadObj?.leadNumber ||
            qLeadObj?.leadId ||
            ""
          ).toString();

          if (
            qLeadId &&
            (qLeadId === currentLeadDbId ||
              (currentLeadNumber && qLeadId === currentLeadNumber))
          )
            return true;
          if (
            qLeadNumber &&
            (qLeadNumber === currentLeadNumber ||
              qLeadNumber === currentLeadDbId)
          )
            return true;
          return false;
        });
        setQuotations(matchingQuotes);
      }

      if (oRes.status === "fulfilled" && oRes.value?.data) {
        const allOrders = Array.isArray(oRes.value.data)
          ? oRes.value.data
          : oRes.value.data?.records || [];
        const currentLeadDbId = (loadedLead?._id || leadId || "").toString();
        const currentLeadNumber = (
          loadedLead?.leadNumber ||
          loadedLead?.leadId ||
          ""
        ).toString();

        const matchingOrders = allOrders.filter((o) => {
          const oLeadObj = o.leadId;
          const oLeadId = (
            oLeadObj?._id ||
            oLeadObj?.id ||
            (typeof oLeadObj === "string" ? oLeadObj : "") ||
            ""
          ).toString();
          const oLeadNumber = (
            oLeadObj?.leadNumber ||
            oLeadObj?.leadId ||
            ""
          ).toString();

          if (
            oLeadId &&
            (oLeadId === currentLeadDbId ||
              (currentLeadNumber && oLeadId === currentLeadNumber))
          )
            return true;
          if (
            oLeadNumber &&
            (oLeadNumber === currentLeadNumber ||
              oLeadNumber === currentLeadDbId)
          )
            return true;
          return false;
        });
        setOrders(matchingOrders);
      }

      if (pRes.status === "fulfilled" && pRes.value?.data) {
        const allPayments = Array.isArray(pRes.value.data)
          ? pRes.value.data
          : pRes.value.data?.records || [];
        const currentLeadDbId = (loadedLead?._id || leadId || "").toString();
        const currentLeadNumber = (
          loadedLead?.leadNumber ||
          loadedLead?.leadId ||
          ""
        ).toString();

        const matchingPayments = allPayments.filter((p) => {
          const pLeadObj = p.leadId;
          const pLeadId = (
            pLeadObj?._id ||
            pLeadObj?.id ||
            (typeof pLeadObj === "string" ? pLeadObj : "") ||
            ""
          ).toString();
          const pLeadNumber = (
            pLeadObj?.leadNumber ||
            pLeadObj?.leadId ||
            ""
          ).toString();

          if (
            pLeadId &&
            (pLeadId === currentLeadDbId ||
              (currentLeadNumber && pLeadId === currentLeadNumber))
          )
            return true;
          if (
            pLeadNumber &&
            (pLeadNumber === currentLeadNumber ||
              pLeadNumber === currentLeadDbId)
          )
            return true;
          return false;
        });
        setPayments(matchingPayments);
      }
    } catch (err) {
      console.error("Failed to load lead:", err);
      setErrorMsg(err.message || "Failed to load lead details.");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    loadLeadDetails();
  }, [loadLeadDetails]);

  // Direct Pipeline Stage Transition
  const handleStageClick = async (targetStage) => {
    if (!lead || targetStage === lead.status || actionLoading) return;

    if (targetStage === "LOST") {
      setStatusForm({
        status: "LOST",
        lostReason: lead.lostReason || "",
        notes: "",
      });
      setShowStatusModal(true);
      return;
    }

    if (targetStage === "WON") {
      if (
        !confirm(
          `Mark this lead as WON (Order Converted)? This confirms commercial closure.`,
        )
      ) {
        return;
      }
    }

    try {
      setActionLoading(true);
      await api.patch(`/leads/${leadId}/status`, {
        status: targetStage,
      });
      await loadLeadDetails();
    } catch (err) {
      alert(err.message || "Failed to transition stage");
    } finally {
      setActionLoading(false);
    }
  };

  // Reopen Closed/Won/Lost Lead
  const handleReopenLead = async () => {
    if (!lead || actionLoading) return;
    if (
      !confirm(
        "Reopen this lead for a new order / inquiry? The stage will be reset to New Lead.",
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      await api.post(`/leads/${leadId}/reopen`);
      await loadLeadDetails();
    } catch (err) {
      alert(err.message || "Failed to reopen lead");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Complete Follow-up Modal
  const handleOpenCompleteFollowup = (f) => {
    setCompleteTargetFollowup(f);
    setCompleteForm({
      outcome: "INTERESTED",
      outcomeNotes: "",
      nextAction: "NONE",
      nextFollowupTitle: `Follow-up with ${lead?.contactName || lead?.businessName || "Client"}`,
      nextFollowupDate: new Date(Date.now() + 86400000 * 2)
        .toISOString()
        .slice(0, 16),
    });
    setShowCompleteFollowupModal(true);
  };

  // Submit Complete Follow-up
  const handleCompleteFollowupSubmit = async (e) => {
    e.preventDefault();
    if (!completeTargetFollowup || !completeForm.outcome) {
      alert("Please select a valid follow-up outcome.");
      return;
    }

    try {
      setActionLoading(true);
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
          description:
            completeForm.outcomeNotes ||
            "Follow-up scheduled after call completion.",
        };
      }

      await api.post(
        `/followups/${completeTargetFollowup._id}/complete`,
        payload,
      );
      setShowCompleteFollowupModal(false);
      await loadLeadDetails();
    } catch (err) {
      alert(err.message || "Failed to complete follow-up");
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to open Create Order modal with defaults & reset attachments
  const handleOpenCreateOrderModal = (customFields = {}) => {
    setOrderForm({
      quotationId: quotations.length > 0 ? quotations[0]._id : "",
      selectedItemIndex: "",
      title: lead?.requirement || "Commercial Print Order",
      amount:
        lead?.expectedValue ||
        (quotations[0]?.grandTotalPaise
          ? quotations[0].grandTotalPaise / 100
          : ""),
      advanceRequiredPercent: 50,
      promisedDeliveryDate: new Date(Date.now() + 86400000 * 7)
        .toISOString()
        .slice(0, 10),
      deliveryMethod: "PICKUP",
      notes: "",
      width: "",
      height: "",
      dimensionUnit: "inch",
      quantity: 1,
      material: "",
      gsm: "",
      colors: "CMYK",
      printSides: "SINGLE",
      finishing: [],
      ...customFields,
    });
    setShowCreateOrderModal(true);
  };

  // Submit Create Commercial Order
  const handleCreateOrderSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const payload = {
        leadId,
        customerId: lead?.customerId?._id || lead?.customerId || undefined,
        quotationId: orderForm.quotationId || undefined,
        selectedItemIndexes:
          orderForm.selectedItemIndex !== "" &&
          orderForm.selectedItemIndex !== undefined
            ? [Number(orderForm.selectedItemIndex)]
            : undefined,
        allowMultipleOrders: true,
        title: orderForm.title || lead?.requirement || "Commercial Print Order",
        totalAmount: orderForm.amount ? Number(orderForm.amount) : undefined,
        advanceRequiredPercent: Number(orderForm.advanceRequiredPercent) || 50,
        promisedDeliveryDate: orderForm.promisedDeliveryDate || undefined,
        deliveryMethod: orderForm.deliveryMethod || "PICKUP",
        notes: orderForm.notes || "",
        // Product & technical specifications for the order.
        width: orderForm.width ? Number(orderForm.width) : undefined,
        height: orderForm.height ? Number(orderForm.height) : undefined,
        dimensionUnit: orderForm.dimensionUnit || "inch",
        quantity: orderForm.quantity ? Number(orderForm.quantity) : 1,
        material: orderForm.material || "Standard Media",
        gsm: orderForm.gsm ? Number(orderForm.gsm) : undefined,
        colors: orderForm.colors || "CMYK",
        printSides: orderForm.printSides || "SINGLE",
        finishing: orderForm.finishing || [],
      };

      await api.post("/orders", payload);
      setShowCreateOrderModal(false);
      setOrderForm({
        quotationId: "",
        selectedItemIndex: "",
        title: "",
        amount: "",
        advanceRequiredPercent: 50,
        promisedDeliveryDate: "",
        deliveryMethod: "PICKUP",
        notes: "",
        width: "",
        height: "",
        dimensionUnit: "inch",
        quantity: 1,
        material: "",
        gsm: "",
        colors: "CMYK",
        printSides: "SINGLE",
        finishing: [],
      });
      await loadLeadDetails();
      setActiveTab("Orders");
    } catch (err) {
      alert(err.message || "Failed to create commercial order");
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && lead) {
      const sp = new URLSearchParams(window.location.search);
      const tabParam = sp.get("tab");
      if (tabParam) {
        setActiveTab(tabParam);
      }
      if (sp.get("openOrder") === "true") {
        handleOpenCreateOrderModal();
      } else if (sp.get("openPayment") === "true") {
        setShowPaymentModal(true);
      } else if (sp.get("openDoc") === "true") {
        setShowUploadDocModal(true);
      }
    }
  }, [lead]);

  // Quotation Lifecycle Handlers
  const handleApproveQuotationDiscount = async (quotationId) => {
    try {
      setActionLoading(true);
      await api.post(`/quotations/${quotationId}/approve`, {
        notes: "Approved via Lead Management",
      });
      alert("Quotation discount approved! Status is now APPROVED.");
      await loadLeadDetails();
    } catch (err) {
      alert(err.message || "Failed to approve quotation discount");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectQuotationDiscount = async (quotationId) => {
    const reason = prompt("Please enter rejection reason:");
    if (!reason || !reason.trim()) return;
    try {
      setActionLoading(true);
      await api.post(`/quotations/${quotationId}/reject`, {
        reason: reason.trim(),
      });
      alert("Quotation discount rejected.");
      await loadLeadDetails();
    } catch (err) {
      alert(err.message || "Failed to reject quotation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendQuotationToClient = async (quotationId) => {
    if (
      !confirm("Send this quotation to the client? Status will change to SENT.")
    )
      return;
    try {
      setActionLoading(true);
      await api.post(`/quotations/${quotationId}/send`);
      alert("Quotation sent to client successfully!");
      await loadLeadDetails();
    } catch (err) {
      alert(err.message || "Failed to send quotation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkQuotationNotAccepted = async (quotationId) => {
    const reason = prompt("Please enter reason why client declined:");
    if (!reason || !reason.trim()) return;
    try {
      setActionLoading(true);
      await api.post(`/quotations/${quotationId}/not-accepted`, {
        reason: reason.trim(),
      });
      alert("Quotation marked NOT_ACCEPTED.");
      await loadLeadDetails();
    } catch (err) {
      alert(err.message || "Failed to update quotation");
    } finally {
      setActionLoading(false);
    }
  };

  // Notes & Remarks Action Handlers
  const handleAddNoteSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newNoteContent.trim()) {
      alert("Please enter remark content.");
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.post(`/leads/${leadId}/notes`, {
        content: newNoteContent.trim(),
        category: newNoteCategory,
        isPinned: newNotePinned,
      });

      setNewNoteContent("");
      setNewNotePinned(false);
      if (res?.data) {
        setNotes(Array.isArray(res.data) ? res.data : res.data.records || []);
      }
      await loadLeadDetails();
    } catch (err) {
      alert(err.message || "Failed to add remark");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePinNote = async (noteId) => {
    try {
      const res = await api.patch(`/leads/${leadId}/notes/${noteId}/pin`);
      if (res?.data) {
        setNotes(Array.isArray(res.data) ? res.data : res.data.records || []);
      }
      await loadLeadDetails();
    } catch (err) {
      alert(err.message || "Failed to pin/unpin note");
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm("Are you sure you want to delete this remark?")) return;
    try {
      const res = await api.delete(`/leads/${leadId}/notes/${noteId}`);
      if (res?.data) {
        setNotes(Array.isArray(res.data) ? res.data : res.data.records || []);
      }
      await loadLeadDetails();
    } catch (err) {
      alert(err.message || "Failed to delete note");
    }
  };

  // Document & Client Work Action Handlers (Cloudinary)
  const handleUploadDocSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!docForm.file) {
      alert("Please choose a file or photo to upload.");
      return;
    }

    try {
      setUploadingDoc(true);
      const formData = new FormData();
      formData.append("file", docForm.file);
      formData.append("title", docForm.title.trim() || docForm.file.name);
      formData.append("category", docForm.category || "CLIENT_WORK");
      formData.append("description", docForm.description.trim());

      const res = await api.post(`/leads/${leadId}/documents`, formData);
      if (res?.data) {
        setDocuments(
          Array.isArray(res.data) ? res.data : res.data.records || [],
        );
      }
      setShowUploadDocModal(false);
      setDocForm({
        title: "",
        category: "CLIENT_WORK",
        description: "",
        file: null,
        previewUrl: "",
      });
      await loadLeadDetails();
      alert("File uploaded to Cloudinary successfully!");
    } catch (err) {
      alert(err.message || "Failed to upload document");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!confirm("Are you sure you want to permanently delete this document?"))
      return;
    try {
      setActionLoading(true);
      const res = await api.delete(`/leads/${leadId}/documents/${docId}`);
      if (res?.data) {
        setDocuments(
          Array.isArray(res.data) ? res.data : res.data.records || [],
        );
      }
      await loadLeadDetails();
    } catch (err) {
      alert(err.message || "Failed to delete document");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Quotation Payment Modal (Only for ACCEPTED quotations)
  const handleOpenQuotationPaymentModal = (targetQuotationId) => {
    const acceptedQuotes = quotations.filter((q) => q.status === "ACCEPTED");
    if (acceptedQuotes.length === 0) {
      alert(
        "Payments can only be recorded after a quotation is accepted. Please approve and accept a quotation first.",
      );
      setActiveTab("Quotations");
      return;
    }
    const q = targetQuotationId
      ? quotations.find((quo) => quo._id === targetQuotationId) || acceptedQuotes[0]
      : acceptedQuotes[0];

    if (q.status !== "ACCEPTED") {
      alert("Payments can only be recorded after the quotation is accepted.");
      return;
    }

    const qTotal = q.grandTotalPaise ? q.grandTotalPaise / 100 : q.totalAmount || 0;
    const advReq = q.advanceRequiredPaise !== undefined ? q.advanceRequiredPaise / 100 : Math.round(qTotal * 0.5);
    const advRec = (q.advanceReceivedPaise || 0) / 100;
    const balPaise = q.directBalancePaise !== undefined ? q.directBalancePaise : Math.max(0, (q.grandTotalPaise || 0) - (q.directPaidPaise || 0));
    const balDue = balPaise / 100;

    if (balDue <= 0 && ((q.directPaidPaise || 0) > 0 || advRec > 0)) {
      alert("This quotation has already been fully paid.");
      return;
    }

    const stage = advRec < advReq ? "ADVANCE" : "BALANCE";
    const amt = stage === "ADVANCE" ? Math.min(balDue, Math.max(0, advReq - advRec)) : balDue;

    setPaymentForm({
      amount: amt > 0 ? amt.toString() : "",
      paymentMethod: "UPI",
      paymentType: stage,
      transactionReference: "",
      bankName: "",
      chequeNumber: "",
      chequeDate: "",
      quotationId: q._id,
      orderId: "",
      selectedItemIndexes: [],
      isDirectQuotationPayment: true,
      notes: `Payment for Quotation ${q.quotationNumber || q._id}`,
    });
    setShowPaymentModal(true);
  };

  // Submit Quotation Payment
  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    const amountNum = Number(paymentForm.amount);
    if (!amountNum || amountNum <= 0) {
      alert("Please enter a valid payment amount greater than zero.");
      return;
    }

    if (!paymentForm.quotationId) {
      alert("Please select an accepted quotation to record payment.");
      return;
    }

    const q = quotations.find((quo) => quo._id === paymentForm.quotationId);
    if (!q) {
      alert("Selected quotation was not found.");
      return;
    }
    if (q.status !== "ACCEPTED") {
      alert("Payments can only be recorded after the quotation is accepted.");
      return;
    }

    const qTotalRupees = (q.grandTotalPaise ? q.grandTotalPaise : (q.totalAmount || 0) * 100) / 100;
    const advReqRupees = (q.advanceRequiredPaise !== undefined ? q.advanceRequiredPaise : Math.round((q.grandTotalPaise || 0) * 0.5)) / 100;
    const advRecRupees = (q.advanceReceivedPaise || 0) / 100;
    const balRupees = (q.directBalancePaise !== undefined ? q.directBalancePaise : Math.max(0, (q.grandTotalPaise || 0) - (q.directPaidPaise || 0))) / 100;

    const paymentType = paymentForm.paymentType || (advRecRupees < advReqRupees ? "ADVANCE" : "BALANCE");

    if (paymentType === "ADVANCE") {
      const remAdv = Math.max(0, advReqRupees - advRecRupees);
      if (amountNum > remAdv) {
        alert(
          `Payment Rejected: Advance payment cannot exceed the remaining advance amount of ₹${remAdv.toLocaleString("en-IN", { minimumFractionDigits: 2 })}.\n\n` +
            `Once the advance is verified, the final balance of ₹${balRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })} can be recorded.`,
        );
        return;
      }
    } else {
      if (amountNum > balRupees) {
        alert(
          `Payment Rejected: Overpayment is not allowed.\n\n` +
            `Entered Amount: ₹${amountNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}\n` +
            `Quotation Balance Due: ₹${balRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}\n\n` +
            `Payments cannot exceed the remaining quotation balance.`,
        );
        return;
      }
    }

    try {
      setActionLoading(true);
      const res = await api.post(`/quotations/${paymentForm.quotationId}/payments`, {
        amount: amountNum,
        paymentType,
        paymentMethod: paymentForm.paymentMethod,
        transactionReference: paymentForm.transactionReference || undefined,
        bankName: paymentForm.bankName || undefined,
        chequeNumber: paymentForm.chequeNumber || undefined,
        chequeDate: paymentForm.chequeDate || undefined,
        notes: paymentForm.notes || undefined,
      });

      alert(
        `Quotation payment of ₹${amountNum.toLocaleString("en-IN")} recorded successfully! (Receipt: ${res.data?.receiptNumber || "Confirmed"})`,
      );

      setShowPaymentModal(false);
      setPaymentForm({
        amount: "",
        paymentMethod: "UPI",
        paymentType: "ADVANCE",
        transactionReference: "",
        bankName: "",
        chequeNumber: "",
        chequeDate: "",
        quotationId: "",
        orderId: "",
        selectedItemIndexes: [],
        isDirectQuotationPayment: true,
        notes: "",
      });
      await loadLeadDetails();
    } catch (err) {
      alert(err.message || "Failed to record payment");
    } finally {
      setActionLoading(false);
    }
  };

  // Verify & Confirm Payment (Manager / Admin / Privileged)
  const handleVerifyPayment = async (paymentId) => {
    if (
      !confirm(
        "Confirm and verify this payment? The amount will be marked CONFIRMED and credited to company ledger.",
      )
    )
      return;
    try {
      setActionLoading(true);
      await api.post(`/payments/${paymentId}/verify`);
      await loadLeadDetails();
    } catch (err) {
      alert(err.message || "Failed to verify payment");
    } finally {
      setActionLoading(false);
    }
  };

  // Reject / Bounce Payment (Manager / Admin / Privileged)
  const handleRejectPayment = async (paymentId) => {
    const reason = prompt("Please enter rejection / bounce reason:");
    if (!reason) return;
    try {
      setActionLoading(true);
      await api.post(`/payments/${paymentId}/bounce`, { reason });
      await loadLeadDetails();
    } catch (err) {
      alert(err.message || "Failed to reject payment");
    } finally {
      setActionLoading(false);
    }
  };

  // Update Lead Details
  const handleUpdateLead = async (e) => {
    e.preventDefault();
    try {
      const bName = editForm.businessName?.trim() || "";
      const cName = editForm.contactName?.trim() || "";
      await api.patch(`/leads/${leadId}`, {
        contactName: cName,
        customerName: cName,
        businessName: bName,
        companyName: bName,
        phone: editForm.phone,
        email: editForm.email,
        alternatePhone: editForm.alternatePhone,
        source: editForm.source,
        requirement: editForm.requirement,
        expectedValue: Number(editForm.expectedValue) || 0,
        priority: editForm.priority,
        notes: editForm.notes,
      });

      setShowEditModal(false);
      loadLeadDetails();
    } catch (err) {
      alert(err.message || "Failed to update lead");
    }
  };

  // Update Status Modal Submit
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/leads/${leadId}/status`, {
        status: statusForm.status,
        lostReason:
          statusForm.status === "LOST" ? statusForm.lostReason : undefined,
        notes: statusForm.notes,
      });

      setShowStatusModal(false);
      loadLeadDetails();
    } catch (err) {
      alert(err.message || "Failed to update status");
    }
  };

  // Schedule Follow-up
  const handleScheduleFollowup = async (e) => {
    e.preventDefault();
    try {
      await api.post("/followups", {
        leadId,
        customerId: lead.customerId?._id || undefined,
        title: followupForm.title,
        scheduledAt: followupForm.scheduledAt,
        description: followupForm.description,
      });

      await api.patch(`/leads/${leadId}`, {
        nextFollowUp: followupForm.scheduledAt,
      });

      setShowFollowupModal(false);
      setFollowupForm({
        scheduledAt: "",
        title: "Follow-up Call",
        description: "",
      });
      loadLeadDetails();
    } catch (err) {
      alert(err.message || "Failed to schedule follow-up");
    }
  };

  // Add Activity / Note
  const handleAddActivity = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/leads/${leadId}/activities`, {
        type: activityForm.type,
        description: activityForm.description,
      });

      setShowActivityModal(false);
      setActivityForm({ type: "CALL", description: "" });
      loadLeadDetails();
    } catch (err) {
      alert(err.message || "Failed to log activity");
    }
  };

  if (loading) {
    return (
      <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <div className="p-16 text-center text-slate-400 text-xs my-auto">
            <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-indigo-600" />
            Loading lead profile...
          </div>
        </main>
      </div>
    );
  }

  if (errorMsg || !lead) {
    return (
      <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <div className="p-8 max-w-lg mx-auto w-full text-center space-y-4 my-auto">
            <div className="w-12 h-12 rounded-md bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {errorMsg || "Lead Not Found"}
            </h3>
            <button
              onClick={() => router.push("/dashboard/leads")}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
            >
              Back to Leads
            </button>
          </div>
        </main>
      </div>
    );
  }

  const leadInitials = (lead.businessName || lead.contactName || "LD")
    .slice(0, 2)
    .toUpperCase();
  const isClosedLead = ["WON", "LOST", "NOT_INTERESTED", "ON_HOLD"].includes(
    lead.status,
  );

  // Helper: Status badge color
  const getStatusBadgeStyle = (st) => {
    switch (st) {
      case "NEW":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "CONTACTED":
        return "bg-yellow-50 text-yellow-800 border-yellow-200";
      case "INTERESTED":
        return "bg-[#f5ede4] text-[#6d4c33] border-[#d7c4b0]";
      case "QUOTATION_SENT":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "NEGOTIATION":
        return "bg-orange-100 text-orange-900 border-orange-300";
      case "WON":
        return "bg-emerald-100 text-emerald-800 border-emerald-300 font-black";
      case "LOST":
      case "NOT_INTERESTED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  // Helper: Stage Date
  const getStageDate = (stgId) => {
    if (stgId === "NEW") {
      return lead.createdAt
        ? new Date(lead.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
          })
        : "Created";
    }
    if (stgId === "CONTACTED" && lead.lastContactedAt) {
      return new Date(lead.lastContactedAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      });
    }
    if (stgId === "WON" && lead.convertedAt) {
      return new Date(lead.convertedAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      });
    }
    if (stgId === lead.status) {
      return lead.updatedAt
        ? new Date(lead.updatedAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
          })
        : "Active";
    }
    return "-";
  };

  // Score calculation
  const getLeadScore = () => {
    if (lead.status === "WON") return 100;
    if (lead.status === "NEGOTIATION") return 90;
    if (lead.status === "QUOTATION_SENT") return 80;
    if (lead.status === "INTERESTED") return 70;
    if (lead.status === "CONTACTED") return 50;
    if (lead.status === "NEW") return 35;
    return 20;
  };

  const currentStageIndex = PIPELINE_STAGES.findIndex(
    (s) => s.id === lead.status,
  );

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-6 md:p-8 space-y-5 max-w-[1600px] mx-auto w-full">
          {/* Top Breadcrumb & Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Link href="/dashboard" className="hover:text-slate-700">
                Dashboard
              </Link>
              <span>›</span>
              <Link href="/dashboard/leads" className="hover:text-slate-700">
                Leads
              </Link>
              <span>›</span>
              <span className="text-slate-800 font-bold">
                {lead.businessName || lead.contactName || lead.leadNumber}
              </span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {isClosedLead && (
                <button
                  onClick={handleReopenLead}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all animate-pulse"
                  title="Reopen this lead for another order"
                >
                  <RotateCcw className="w-3.5 h-3.5" />Reopen Lead (New Order)
                </button>
              )}

              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs hover:bg-slate-50 transition-all"
              >
                <Edit className="w-3.5 h-3.5 text-slate-500" />
                Edit Lead
              </button>

              <button
                onClick={() => handleOpenCreateOrderModal()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Create Order
              </button>

              <Link
                href={`/dashboard/quotations?leadId=${leadId}&businessName=${encodeURIComponent(lead?.businessName || lead?.companyName || "")}&contactPerson=${encodeURIComponent(lead?.contactName || lead?.customerName || "")}&phone=${encodeURIComponent(lead?.phone || "")}`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm shadow-emerald-600/25 transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                Quotation
              </Link>

              <button
                onClick={() => {
                  setFollowupForm({
                    scheduledAt: "",
                    title: `Follow-up with ${lead.contactName || "Client"}`,
                    description: "",
                  });
                  setShowFollowupModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F95721] hover:bg-[#e84915] text-white text-xs font-semibold shadow-sm shadow-orange-500/25 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Follow-up
              </button>
            </div>
          </div>

          {/* Reopen Alert Banner (Shown if lead was previously closed/won) */}
          {isClosedLead && (
            <div className="p-4 rounded-md bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <strong className="font-bold block">
                    This lead is closed with status:{" "}
                    <span className="underline uppercase">{lead.status}</span>
                  </strong>
                  <span className="text-amber-800 text-[11px]">
                    Client wants another order? Reopen the lead to restart
                    pipeline progression and create new proposals.
                  </span>
                </div>
              </div>

              <button
                onClick={handleReopenLead}
                disabled={actionLoading}
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all shrink-0 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reopen Lead Now
              </button>
            </div>
          )}

          {/* Lead Hero Profile - Excel / Table Format */}
          <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden mb-4">
            {/* Excel Sheet Header Bar */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#107c41]"></span>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Lead Information Sheet • {lead.leadNumber || `LD-${lead._id.slice(-6).toUpperCase()}`}
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getStatusBadgeStyle(lead.status)}`}>
                Status: {lead.status}
              </span>
            </div>

            {/* Excel Grid Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-xs">
                <tbody>
                  {/* Row 1 */}
                  <tr>
                    {/* Left Photo Column spanning rows */}
                    <td
                      rowSpan={lead.notes ? 5 : 4}
                      className="w-50 p-3 bg-slate-50/60 border border-slate-200 text-center align-middle shrink-0"
                    >
                      {allLeadPhotos.length > 0 ? (
                        <div className="flex flex-col items-center gap-2">
                          <div
                            onClick={() =>
                              setSelectedImagePreview(
                                activePhoto?.url || allLeadPhotos[0]?.url,
                              )
                            }
                            className="relative h-full overflow-hidden group cursor-pointer mx-auto"
                            title="Click to view full resolution"
                          >
                            <img
                              src={activePhoto?.url || allLeadPhotos[0]?.url}
                              alt={lead.businessName || "Shop Front"}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1 p-2 text-center">
                              <Eye className="w-4 h-4 text-white" />
                              <span>View Photo</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between w-full px-1">
                            {allLeadPhotos.length > 1 ? (
                              <div className="flex items-center gap-1.5 pt-0.5">
                                {allLeadPhotos.map((p, idx) => (
                                  <button
                                    key={p.id || idx}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActivePhotoIdx(idx);
                                    }}
                                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                      idx === activePhotoIdx
                                        ? "bg-[#107c41] w-4"
                                        : "bg-slate-300 hover:bg-slate-400 w-1.5"
                                    }`}
                                    title={`Photo ${idx + 1}`}
                                  />
                                ))}
                                <span className="text-[9px] font-bold text-slate-500">
                                  {activePhotoIdx + 1}/{allLeadPhotos.length}
                                </span>
                              </div>
                            ) : (
                              <span />
                            )}

                            <label
                              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1 hover:underline"
                              title="Update or change shop photo"
                            >
                              <Camera className="w-3 h-3" />
                              <span>Update</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingProfilePhoto}
                                onChange={handleProfilePhotoUpload}
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-16 h-16 rounded-xl bg-indigo-50 text-indigo-700 font-black text-xl flex items-center justify-center mx-auto border border-indigo-100 shadow-2xs">
                            {leadInitials}
                          </div>
                          <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-indigo-600 hover:text-indigo-700 text-[11px] font-bold cursor-pointer shadow-2xs transition-all">
                            {uploadingProfilePhoto ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Uploading...</span>
                              </>
                            ) : (
                              <>
                                <Camera className="w-3 h-3" />
                                <span>Add Photo</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingProfilePhoto}
                              onChange={handleProfilePhotoUpload}
                            />
                          </label>
                        </div>
                      )}
                    </td>

                    {/* Business Name */}
                    <th className="w-50 bg-slate-100/90 text-slate-600 font-bold text-sm uppercase tracking-wider px-3.5 py-2.5 border border-slate-200 text-left">
                      Business Name
                    </th>
                    <td className="px-3.5 py-2.5 bg-white border border-slate-200">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 text-sm">
                          {lead.businessName || lead.companyName || "—"}
                        </span>
                        {lead.acceptanceStatus === "PENDING" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                            Pending Acceptance
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Lead ID */}
                    <th className="w-40 bg-slate-100/90 text-slate-600 font-bold text-sm uppercase tracking-wider px-3.5 py-2.5 border border-slate-200 text-left">
                      Lead ID
                    </th>
                    <td className="px-3.5 py-2.5 bg-white border border-slate-200 font-mono font-bold text-slate-900 text-sm">
                      {lead.leadNumber || `LD-${lead._id.slice(-6).toUpperCase()}`}
                    </td>

                    {/* Priority */}
                    <th className="w-32 bg-slate-100/90 text-slate-600 font-bold text-sm uppercase tracking-wider px-3.5 py-2.5 border border-slate-200 text-left">
                      Priority
                    </th>
                    <td className="px-3.5 py-2.5 bg-white border border-slate-200 font-bold text-slate-900 text-sm">
                      <div className="relative inline-block">
                        {(() => {
                          const p = String(lead?.priority || "MEDIUM").toUpperCase();
                          const priorityStyles = {
                            URGENT: "bg-rose-100 text-rose-800 border-rose-300",
                            HIGH: "bg-amber-100 text-amber-900 border-amber-300",
                            MEDIUM: "bg-blue-100 text-blue-800 border-blue-300",
                            LOW: "bg-slate-100 text-slate-700 border-slate-300",
                          }[p] || "bg-blue-100 text-blue-800 border-blue-300";

                          return (
                            <select
                              value={p}
                              disabled={actionLoading}
                              onChange={async (e) => {
                                const newPriority = e.target.value;
                                try {
                                  setActionLoading(true);
                                  setLead((prev) =>
                                    prev ? { ...prev, priority: newPriority } : prev,
                                  );
                                  await api.patch(`/leads/${leadId}`, {
                                    priority: newPriority,
                                  });
                                  loadLeadDetails();
                                } catch (err) {
                                  alert(err.message || "Failed to update priority");
                                  loadLeadDetails();
                                } finally {
                                  setActionLoading(false);
                                }
                              }}
                              className={`font-bold text-sm px-2 py-0.5 rounded border appearance-none pr-5 cursor-pointer outline-none transition-all shadow-2xs ${priorityStyles}`}
                              title="Click to change lead priority"
                            >
                              <option value="URGENT">Urgent</option>
                              <option value="HIGH">High</option>
                              <option value="MEDIUM">Medium</option>
                              <option value="LOW">Low</option>
                            </select>
                          );
                        })()}
                        <ChevronDown className="w-2.5 h-2.5 text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </td>
                  </tr>

                  {/* Row 2 */}
                  <tr>
                    <th className="bg-slate-100/90 text-slate-600 font-bold text-sm uppercase tracking-wider px-3.5 py-2.5 border border-slate-200 text-left">
                      Contact Person
                    </th>
                    <td className="px-3.5 py-2.5 bg-white border border-slate-200 font-semibold text-slate-800">
                      <span className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                        <User className="w-5 h-5 text-slate-400" />
                        {lead.contactName || lead.customerName || "—"}
                      </span>
                    </td>

                    <th className="bg-slate-100/90 text-slate-600 font-bold text-sm uppercase tracking-wider px-3.5 py-2.5 border border-slate-200 text-left">
                      Phone Number
                    </th>
                    <td className="px-3.5 py-2.5 bg-white border border-slate-200">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={`tel:${lead.phone}`}
                          className="font-mono text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 text-sm"
                        >
                          <Phone className="w-4 h-4 text-orange-500" />
                          {lead.phone}
                        </a>
                        {lead.alternatePhone && (
                          <a
                            href={`tel:${lead.alternatePhone}`}
                            className="font-mono text-slate-500 hover:text-slate-700 text-md flex items-center gap-1"
                          >
                            <span className="text-slate-300">/</span>
                            {lead.alternatePhone}
                          </a>
                        )}
                      </div>
                    </td>

                    <th className="bg-slate-100/90 text-slate-600 font-bold text-sm uppercase tracking-wider px-3.5 py-2.5 border border-slate-200 text-left">
                      Email
                    </th>
                    <td className="px-3.5 py-2.5 bg-white border border-slate-200 font-semibold text-slate-800">
                      {lead.email ? (
                        <a
                          href={`mailto:${lead.email}`}
                          className="text-slate-700 hover:text-orange-600 flex items-center gap-1 truncate font-bold text-sm"
                        >
                          <Mail className="w-5 h-5 text-slate-400 shrink-0" />
                          {lead.email}
                        </a>
                      ) : (
                        <span className="text-slate-400 italic font-normal">-</span>
                      )}
                    </td>
                  </tr>

                  {/* Row 3 */}
                  <tr>
                    <th className="bg-slate-100/90 text-slate-600 font-bold text-sm uppercase tracking-wider px-3.5 py-2.5 border border-slate-200 text-left">
                      Territory / Area
                    </th>
                    <td className="px-3.5 py-2.5 bg-white border border-slate-200 font-medium text-slate-800">
                      <span className="flex items-center gap-1 text-sm">
                        <MapPin className="w-5 h-5 text-orange-500 shrink-0" />
                        {lead.areaId?.name
                          ? `${lead.areaId.name}${lead.areaId.city ? `, ${lead.areaId.city}` : ""}`
                          : lead.city || lead.zone || "Territory Assigned"}
                      </span>
                    </td>

                    <th className="bg-slate-100/90 text-slate-600 font-bold text-sm uppercase tracking-wider px-3.5 py-2.5 border border-slate-200 text-left">
                      Category
                    </th>
                    <td className="px-3.5 py-2.5 bg-white border border-slate-200">
                      <span className="font-bold text-slate-800 text-sm">
                        {lead.businessCategory || "Standard"}
                      </span>
                      {lead.subCategory && (
                        <span className="text-slate-500 text-xs ml-1">
                          ({lead.subCategory})
                        </span>
                      )}
                    </td>

                    <th className="bg-slate-100/90 text-slate-600 font-bold text-sm uppercase tracking-wider px-3.5 py-2.5 border border-slate-200 text-left">
                      Source
                    </th>
                    <td className="px-3.5 py-2.5 bg-white border border-slate-200">
                      {lead.source === "DATA_OPERATOR" ? (
                        <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-bold text-md border border-orange-200">
                          DATA OPERATOR
                        </span>
                      ) : (
                        <span className="font-bold text-slate-700 text-sm">
                          {lead.source || "MANUAL"}
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* Row 4 */}
                  <tr>
                    <th className="bg-slate-100/90 text-slate-600 font-bold text-sm uppercase tracking-wider px-3.5 py-2.5 border border-slate-200 text-left">
                      Assigned Executive
                    </th>
                    <td className="px-3.5 py-2.5 bg-white border border-slate-200 font-semibold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          {(lead.assignedToId?.name || "UN")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900 text-sm">
                          {lead.assignedToId?.name || "Unassigned"}
                        </span>
                        {canAssignOrReassign && (
                          <button
                            onClick={() => {
                              setReassignTargetId(
                                lead.assignedToId?._id || lead.assignedToId || "",
                              );
                              setShowReassignModal(true);
                            }}
                            className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-[#F95721] hover:bg-orange-50 border border-orange-200 transition-colors cursor-pointer"
                            title="Change Assignment (Manager/Admin Only)"
                          >
                            Change
                          </button>
                        )}
                      </div>
                    </td>

                    <th className="bg-slate-100/90 text-slate-600 font-bold text-sm uppercase tracking-wider px-3.5 py-2.5 border border-slate-200 text-left">
                      Created On
                    </th>
                    <td className="px-3.5 py-2.5 bg-white border border-slate-200 font-semibold text-slate-800 text-sm">
                      {new Date(lead.createdAt || Date.now()).toLocaleDateString(
                        "en-GB",
                        { day: "2-digit", month: "short", year: "numeric" },
                      )}
                    </td>

                    <th className="bg-slate-100/90 text-slate-600 font-bold text-sm uppercase tracking-wider px-3.5 py-2.5 border border-slate-200 text-left">
                      Next Follow-Up
                    </th>
                    <td className="px-3.5 py-2.5 bg-white border border-slate-200 font-semibold text-sm">
                      <span
                        className={`font-bold ${lead.nextFollowUp ? "text-amber-700" : "text-slate-400 italic font-normal"}`}
                      >
                        {lead.nextFollowUp
                          ? new Date(lead.nextFollowUp).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })
                          : "None Scheduled"}
                      </span>
                    </td>
                  </tr>

                  {/* Row 5: Notes (Optional) */}
                  {lead.notes && (
                    <tr>
                      <th className="bg-amber-50 text-amber-900 font-bold text-sm uppercase tracking-wider px-3.5 py-2 border border-slate-200 text-left">
                        Operator Note
                      </th>
                      <td
                        colSpan={5}
                        className="px-3.5 py-2 bg-amber-50/50 border border-slate-200 text-sm font-medium text-amber-950 leading-relaxed"
                      >
                        {lead.notes}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Dynamic Pipeline Stepper Bar */}
          <div className="mt-4 p-6 bg-white border-b border-slate-100 rounded-xl shadow-2xs flex items-center justify-center gap-2 overflow-x-auto">
            <div className="flex items-center gap-1 shrink-0 text-slate-400 text-[12px] font-bold uppercase tracking-wider mr-2">
              Status
            </div>

            <div className="flex items-center gap-2 flex-1 min-w-162.5">
              {PIPELINE_STAGES.map((stg, i) => {
                const isCurrent = lead.status === stg.id;
                const isPassed =
                  currentStageIndex !== -1 &&
                  i < currentStageIndex &&
                  lead.status !== "LOST";

                return (
                  <React.Fragment key={stg.id}>
                    <button
                      type="button"
                      onClick={() => handleStageClick(stg.id)}
                      disabled={actionLoading}
                      className={`flex-1 p-2 rounded-xl border text-center transition-all cursor-pointer group ${
                        isCurrent
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20 font-bold"
                          : isPassed
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100/70 font-semibold"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-100 font-medium"
                      }`}
                      title={`Click to set stage to ${stg.label}`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {isPassed && (
                          <span className="text-emerald-600 text-xs">✓</span>
                        )}
                        <strong
                          className={`block text-sm ${isCurrent ? "text-white" : ""}`}
                        >
                          {stg.label}
                        </strong>
                      </div>
                      <span
                        className={`text-[12px] block mt-0.5 ${isCurrent ? "text-indigo-100" : "text-slate-400"}`}
                      >
                        {getStageDate(stg.id)}
                      </span>
                    </button>

                    {i < PIPELINE_STAGES.length - 1 && (
                      <span
                        className={`font-bold ${isPassed ? "text-emerald-500" : "text-slate-300"}`}
                      >
                        →
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center gap-6 border-b border-slate-200/80 pb-2 text-md font-semibold overflow-x-auto">
            {[
              { id: "Overview", label: "Overview" },
              { id: "Orders", label: `Orders (${orders.length})` },
              { id: "Quotations", label: `Quotations (${quotations.length})` },
              { id: "Follow-ups", label: `Follow-ups (${followups.length})` },
              { id: "Payments", label: `Payments (${payments.length})` },

              {
                id: "Documents",
                label: `Documents (${documents.length + quotations.length + payments.length})`,
              },
              {
                id: "Notes & Remarks",
                label: `Notes & Remarks (${notes.length})`,
              },
              { id: "Activity Timeline", label: "Activity Timeline" },
            ].map((tab) => {
              const isActive =
                activeTab === tab.id || activeTab.startsWith(tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-2 transition-all relative whitespace-nowrap ${
                    isActive
                      ? "text-[#F95721] font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F95721] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* OVERVIEW TAB CONTENT */}
          {activeTab === "Overview" && (
            <div className="space-y-6 text-sm">
              {/* Row 1: 4 Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                {/* Card 1: Lead Information */}
                <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-base">
                      Lead Information
                    </h3>
                  </div>

                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500 font-medium">Business Name</span>
                      <strong className="text-slate-800 text-right">
                        {lead.businessName || "Individual / Retail"}
                      </strong>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500 font-medium">Contact Person</span>
                      <strong className="text-slate-800 text-right">
                        {lead.contactName || "-"}
                      </strong>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500 font-medium">Estimated Budget</span>
                      <strong className="text-slate-800 text-right">
                        {lead.expectedValue || lead.estimatedBudget
                          ? `₹${(lead.expectedValue || lead.estimatedBudget).toLocaleString("en-IN")}`
                          : "Not Specified"}
                      </strong>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500 font-medium">Priority</span>
                      <span className="font-bold text-slate-800">
                        {lead.priority || "MEDIUM"}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500 font-medium">Lead Source</span>
                      <span className="font-bold text-slate-800">
                        {lead.source || "MANUAL"}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-slate-500 block mb-1 font-semibold text-xs uppercase tracking-wider">
                        Requirement Summary
                      </span>
                      <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                        {lead.requirement ||
                          "No specific requirement details noted."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card 2: Last Interaction Summary */}
                <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-base">
                      Last Interaction Summary
                    </h3>
                    <button
                      onClick={() => setShowActivityModal(true)}
                      className="text-xs font-bold text-[#F95721] hover:underline"
                    >
                      + Add Note
                    </button>
                  </div>

                  <div className="space-y-2.5 text-sm">
                    {activities.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                            <Clock className="w-4 h-4 text-orange-500" />{" "}
                            Latest Activity
                          </span>
                          <span className="font-bold text-slate-800">
                            {activities[0].type ||
                              activities[0].action ||
                              "NOTE"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">
                            Date &amp; Time
                          </span>
                          <span className="font-bold text-slate-800">
                            {new Date(
                              activities[0].createdAt || Date.now(),
                            ).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-slate-500 block mb-1 font-semibold text-xs uppercase tracking-wider">
                            Note Details
                          </span>
                          <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                            {activities[0].description ||
                              activities[0].summary ||
                              "Interaction logged."}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6 text-slate-400 space-y-2">
                        <p className="text-sm">No activity logs recorded yet.</p>
                        <button
                          onClick={() => setShowActivityModal(true)}
                          className="px-3.5 py-1.5 rounded-xl bg-orange-50 text-orange-700 font-bold text-xs"
                        >
                          + Log First Call / Note
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 3: Quick Actions Grid */}
                <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs space-y-3">
                  <div className="pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-base">
                      Quick Actions
                    </h3>
                  </div>

                  <div className="flex flex-wrap justify-center items-center gap-2.5 text-center text-xs">
                    <button
                      onClick={() => handleOpenCreateOrderModal()}
                      className="p-3 rounded-md bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 font-bold flex flex-col items-center gap-1.5 transition-colors"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      Create Order
                    </button>

                    <Link
                      href={`/dashboard/quotations?leadId=${leadId}&businessName=${encodeURIComponent(lead?.businessName || lead?.companyName || "")}&contactPerson=${encodeURIComponent(lead?.contactName || lead?.customerName || "")}&phone=${encodeURIComponent(lead?.phone || "")}`}
                      className="p-3 rounded-md bg-cyan-50/80 hover:bg-cyan-100 text-cyan-700 font-bold flex flex-col items-center gap-1.5 transition-colors"
                    >
                      <FileText className="w-5 h-5" />
                      Quotation
                    </Link>

                    <button
                      onClick={() => handleOpenQuotationPaymentModal()}
                      className="p-3 rounded-md bg-emerald-50/80 hover:bg-emerald-100 text-emerald-700 font-bold flex flex-col items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CreditCard className="w-5 h-5" />
                      Advance Pay
                    </button>

                    <button
                      onClick={() => {
                        setFollowupForm({
                          scheduledAt: "",
                          title: `Follow-up with ${lead.contactName || "Client"}`,
                          description: "",
                        });
                        setShowFollowupModal(true);
                      }}
                      className="p-3 rounded-md bg-amber-50/80 hover:bg-amber-100 text-amber-700 font-bold flex flex-col items-center gap-1.5 transition-colors"
                    >
                      <Calendar className="w-5 h-5" />
                      Follow-up
                    </button>

                    <button
                      onClick={() => setActiveTab("Documents")}
                      className="p-3 rounded-md bg-purple-50/80 hover:bg-purple-100 text-purple-700 font-bold flex flex-col items-center gap-1.5 transition-colors"
                    >
                      <Folder className="w-5 h-5" />
                      Documents
                    </button>
                  </div>
                </div>

                {/* Card 4: Lead Status & Reopen Option */}
                <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs space-y-3.5">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-base">
                      Stage &amp; Governance
                    </h3>
                  </div>

                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Current Stage</span>
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-xs border ${getStatusBadgeStyle(lead.status)}`}
                      >
                        {lead.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Priority Level</span>
                      <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200">
                        {lead.priority || "HIGH"}
                      </span>
                    </div>

                    {isClosedLead ? (
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <span className="text-slate-500 font-medium block">
                          Lead Closed ({lead.status})
                        </span>
                        <button
                          onClick={handleReopenLead}
                          disabled={actionLoading}
                          className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-1.5"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Reopen for Next Order
                        </button>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <span className="text-slate-500 block font-semibold text-xs uppercase tracking-wider">
                          Stage Quick Switch
                        </span>
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          {PIPELINE_STAGES.filter(
                            (s) => s.id !== lead.status,
                          ).map((s) => (
                            <button
                              key={s.id}
                              onClick={() => handleStageClick(s.id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                            >
                              → {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 2: 3 Cards (Commercial Orders, Client Quotations, Payments) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                {/* Card 1: Commercial Orders */}
                <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-base">
                      Commercial Orders ({orders.length})
                    </h3>
                    <button
                      onClick={() => setActiveTab("Orders")}
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-2.5 text-sm">
                    {orders.length > 0 ? (
                      orders.slice(0, 2).map((o) => (
                        <div
                          key={o._id}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <strong className="text-slate-900 font-mono text-sm">
                              {o.orderNumber || o._id}
                            </strong>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {o.orderStatus || "CONFIRMED"}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-slate-600 text-xs">
                            <span className="font-bold text-slate-900 text-sm">
                              ₹
                              {(o.grandTotalPaise
                                ? o.grandTotalPaise / 100
                                : o.totalAmount || 0
                              ).toLocaleString("en-IN")}
                            </span>
                          </div>

                          <div className="flex items-center justify-end gap-2.5 pt-1.5 border-t border-slate-200/50">
                            <button
                              onClick={async () => {
                                try {
                                  await api.downloadPdf(
                                    `/orders/${o._id}/invoice`,
                                    `Invoice-${o.orderNumber || o._id}.pdf`,
                                  );
                                } catch (err) {
                                  alert(
                                    err.message ||
                                      "Failed to download Invoice",
                                  );
                                }
                              }}
                              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" /> Invoice
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-5 space-y-2">
                        <p className="text-slate-400 text-sm">
                          No orders created yet for this lead.
                        </p>
                        <button
                          onClick={() => handleOpenCreateOrderModal()}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
                        >
                          <Plus className="w-4 h-4" /> Create Commercial
                          Order
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 2: Client Quotations */}
                <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-base">
                      Client Quotations ({quotations.length})
                    </h3>
                    <button
                      onClick={() => setActiveTab("Quotations")}
                      className="text-xs font-bold text-[#F95721] hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-2.5 text-sm">
                    {quotations.length > 0 ? (
                      quotations.slice(0, 2).map((q) => (
                        <div
                          key={q._id}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <strong className="text-slate-900 font-mono text-sm">
                              {q.quotationNumber ||
                                `QT-${q._id.slice(-6).toUpperCase()}`}
                            </strong>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                q.status === "ACCEPTED"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : q.status === "APPROVED"
                                    ? "bg-orange-50 text-orange-700 border border-orange-200"
                                    : q.status === "REJECTED"
                                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {q.status}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-slate-600 text-xs">
                            <span>
                              {new Date(q.createdAt).toLocaleDateString(
                                "en-GB",
                              )}
                            </span>
                            <strong className="text-slate-900 font-bold text-sm">
                              ₹
                              {(q.grandTotalPaise
                                ? q.grandTotalPaise / 100
                                : q.totalAmount || 0
                              ).toLocaleString("en-IN")}
                            </strong>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-slate-200/50">
                            <button
                              onClick={() => {
                                handleOpenCreateOrderModal({
                                  quotationId: q._id,
                                  title:
                                    q.items?.[0]?.title ||
                                    "Order from Quotation",
                                  amount: q.grandTotalPaise
                                    ? q.grandTotalPaise / 100
                                    : q.totalAmount || 0,
                                });
                              }}
                              className="text-xs font-bold text-indigo-700 hover:underline flex items-center gap-1"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" /> Convert to
                              Order →
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-5 space-y-2">
                        <p className="text-slate-400 text-sm">
                          No quotations generated yet.
                        </p>
                        <Link
                          href={`/dashboard/quotations?leadId=${leadId}&businessName=${encodeURIComponent(lead?.businessName || lead?.companyName || "")}&companyName=${encodeURIComponent(lead?.businessName || lead?.companyName || "")}&contactPerson=${encodeURIComponent(lead?.contactName || lead?.customerName || "")}&customerName=${encodeURIComponent(lead?.customerName || lead?.contactName || "")}&phone=${encodeURIComponent(lead?.phone || "")}`}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                        >
                          <Plus className="w-4 h-4" /> Create Quotation
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 3: Payments & Advances with In-Place Verify */}
                <div className="bg-white rounded-md p-4 border border-slate-200/90 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-base">
                      Advance &amp; Payments ({payments.length})
                    </h3>
                    <button
                      onClick={() => setActiveTab("Payments")}
                      className="text-xs font-bold text-emerald-600 hover:underline"
                    >
                      View Ledger
                    </button>
                  </div>

                  <div className="space-y-2.5 text-sm">
                    {payments.length > 0 ? (
                      payments.slice(0, 2).map((p) => {
                        const isPending = p.status === "PENDING_VERIFICATION";
                        const isConfirmed = p.status === "CONFIRMED";
                        const amountRupees = p.amountPaise
                          ? p.amountPaise / 100
                          : p.amount || 0;

                        return (
                          <div
                            key={p._id}
                            className={`p-3.5 rounded-xl border space-y-2 ${isPending ? "bg-amber-50/40 border-amber-200" : "bg-slate-50 border-slate-100"}`}
                          >
                            <div className="flex justify-between items-center">
                              <strong className="text-slate-900 font-mono text-sm">
                                {p.receiptNumber || "RCT"}
                              </strong>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  isConfirmed
                                    ? "bg-emerald-100 text-emerald-800"
                                    : isPending
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {isConfirmed
                                  ? "✓ Verified"
                                  : isPending
                                    ? "⏳ Pending Verification"
                                    : "✕ Rejected"}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-600">
                              <span>{p.paymentMethod?.replace(/_/g, " ")}</span>
                              <strong className="text-slate-900 font-bold text-sm">
                                ₹{amountRupees.toLocaleString("en-IN")}
                              </strong>
                            </div>

                            {/* Direct Verify/Reject for Manager/Admin right from Overview */}
                            {isPending && canVerifyPayment && (
                              <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-amber-200/50">
                                <button
                                  type="button"
                                  onClick={() => handleVerifyPayment(p._id)}
                                  disabled={actionLoading}
                                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs flex items-center gap-1 transition-all"
                                  title="Confirm and verify payment into company ledger"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Confirm &amp; Verify
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectPayment(p._id)}
                                  disabled={actionLoading}
                                  className="px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-all"
                                  title="Reject payment"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-5 text-slate-400 space-y-2">
                        <p className="text-sm">No payments recorded yet.</p>
                        <button
                          onClick={() => handleOpenQuotationPaymentModal()}
                          className="px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs cursor-pointer transition-colors"
                        >
                          + Record Advance
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ORDERS TAB */}
          {(activeTab === "Orders" || activeTab.startsWith("Orders")) && (
            <div className="bg-white rounded-md p-6 border border-slate-200 shadow-xs space-y-6 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-indigo-600" />
                    Commercial Orders ({orders.length})
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Orders converted, financial fulfillment, and production
                    order tracking
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleOpenCreateOrderModal()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Create Commercial Order
                  </button>
                </div>
              </div>

              {/* Order KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-md bg-indigo-50/70 border border-indigo-200/80">
                  <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">
                    Total Orders
                  </span>
                  <strong className="text-xl font-bold font-mono text-indigo-950 mt-1 block">
                    {orders.length} Placed
                  </strong>
                  <span className="text-[10px] text-indigo-700 mt-0.5 block">
                    Commercial converted deals
                  </span>
                </div>

                <div className="p-4 rounded-md bg-emerald-50/70 border border-emerald-200/80">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Total Order Value
                  </span>
                  <strong className="text-xl font-bold font-mono text-emerald-950 mt-1 block">
                    ₹
                    {orders
                      .reduce(
                        (acc, o) =>
                          acc +
                          (o.grandTotalPaise
                            ? o.grandTotalPaise / 100
                            : o.totalAmount || 0),
                        0,
                      )
                      .toLocaleString("en-IN")}
                  </strong>
                  <span className="text-[10px] text-emerald-700 mt-0.5 block">
                    Total billing value
                  </span>
                </div>

                <div className="p-4 rounded-md bg-amber-50/70 border border-amber-200/80">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                    Outstanding Balance
                  </span>
                  <strong className="text-xl font-bold font-mono text-amber-950 mt-1 block">
                    ₹
                    {orders
                      .reduce(
                        (acc, o) =>
                          acc + (o.balancePaise ? o.balancePaise / 100 : 0),
                        0,
                      )
                      .toLocaleString("en-IN")}
                  </strong>
                  <span className="text-[10px] text-amber-700 mt-0.5 block">
                    Pending collections
                  </span>
                </div>
              </div>

              {/* Orders List */}
              <div className="space-y-4">
                {orders.length > 0 ? (
                  orders.map((o) => {
                    const grandTotal = o.grandTotalPaise
                      ? o.grandTotalPaise / 100
                      : o.totalAmount || 0;
                    const paid = o.totalPaidPaise
                      ? o.totalPaidPaise / 100
                      : o.advanceReceivedPaise
                        ? o.advanceReceivedPaise / 100
                        : 0;
                    const balance = o.balancePaise
                      ? o.balancePaise / 100
                      : Math.max(0, grandTotal - paid);

                    return (
                      <div
                        key={o._id}
                        className="bg-white rounded-md p-5 border border-slate-200/90 shadow-xs space-y-4 hover:border-indigo-300 transition-all"
                      >
                        {/* Order Header Row */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="font-mono font-black text-slate-900 text-sm">
                                {o.orderNumber ||
                                  `ORD-${o._id.slice(-6).toUpperCase()}`}
                              </span>
                              {o.invoiceNumber && (
                                <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                  Tax Inv: {o.invoiceNumber}
                                </span>
                              )}
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {o.orderStatus || "CONFIRMED"}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  balance === 0
                                    ? "bg-emerald-100 text-emerald-800"
                                    : paid > 0
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {balance === 0
                                  ? "✓ FULLY PAID"
                                  : paid > 0
                                    ? "PARTIALLY PAID"
                                    : "PAYMENT PENDING"}
                              </span>
                            </div>

                            <p className="text-slate-500 text-[11px]">
                              Ordered on{" "}
                              {new Date(
                                o.orderDate || o.createdAt,
                              ).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                              {o.promisedDeliveryDate &&
                                ` • Promised Delivery: ${new Date(o.promisedDeliveryDate).toLocaleDateString("en-GB")}`}
                            </p>
                          </div>

                          {/* Financial Badge */}
                          <div className="flex items-center gap-4 text-right">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-semibold">
                                Grand Total
                              </span>
                              <strong className="font-mono font-bold text-slate-900 text-base">
                                ₹{grandTotal.toLocaleString("en-IN")}
                              </strong>
                            </div>

                            <div className="border-l border-slate-100 pl-3">
                              <span className="text-[10px] text-emerald-600 block font-semibold">
                                Paid: ₹{paid.toLocaleString("en-IN")}
                              </span>
                              <span className="text-[10px] text-amber-700 block font-semibold">
                                Balance: ₹{balance.toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="grid grid-cols-1 gap-4">
                          {/* Left: Items Summary */}
                          <div className="p-3.5 rounded-md bg-slate-50/80 border border-slate-200/70 space-y-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Order Items &amp; Requirements
                            </span>
                            <div className="space-y-1.5">
                              {o.items && o.items.length > 0 ? (
                                o.items.map((it, idx) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between items-start text-xs"
                                  >
                                    <div>
                                      <strong className="text-slate-800 block">
                                        {it.title}
                                      </strong>
                                      <span className="text-[10px] text-slate-500">
                                        Qty: {it.quantity}{" "}
                                        {it.width && it.height
                                          ? `• Size: ${it.width}x${it.height} ${it.dimensionUnit || "inch"}`
                                          : ""}
                                      </span>
                                    </div>
                                    <span className="font-mono font-bold text-slate-800 text-[11px]">
                                      ₹
                                      {(it.itemTotalPaise
                                        ? it.itemTotalPaise / 100
                                        : it.itemTotal || 0
                                      ).toLocaleString("en-IN")}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-slate-700 font-medium">
                                  {o.notes ||
                                    "Printing requirement confirmed with client."}
                                </p>
                              )}
                            </div>
                          </div>


                        </div>

                        {/* Order Actions Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
                          <div className="text-[11px] text-slate-500">
                            Delivery:{" "}
                            <strong className="text-slate-700 uppercase">
                              {o.deliveryMethod || "PICKUP"}
                            </strong>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                try {
                                  await api.downloadPdf(
                                    `/orders/${o._id}/invoice`,
                                    `Invoice-${o.orderNumber || o._id}.pdf`,
                                  );
                                } catch (err) {
                                  alert(
                                    err.message ||
                                      "Failed to download invoice",
                                  );
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5 text-slate-500" />
                              Tax Invoice
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-16 space-y-3">
                    <div className="w-14 h-14 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                      <ShoppingBag className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-slate-900 font-bold text-sm">
                        No commercial orders generated yet
                      </h4>
                      <p className="text-slate-400 text-xs mt-0.5">
                        Convert an approved quotation or create a new order.
                      </p>
                    </div>
                    <button
                      onClick={() => handleOpenCreateOrderModal()}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20"
                    >
                      <Plus className="w-4 h-4" />
                      Create Commercial Order Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* QUOTATIONS TAB */}
          {(activeTab === "Quotations" ||
            activeTab.startsWith("Quotations")) && (
            <div className="bg-white rounded-md p-6 border border-slate-200 shadow-xs space-y-4 text-xs">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Customer Quotations ({quotations.length})
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Commercial estimates generated for this lead
                  </p>
                </div>
                <Link
                  href={`/dashboard/quotations?leadId=${leadId}&businessName=${encodeURIComponent(lead?.businessName || lead?.companyName || "")}&companyName=${encodeURIComponent(lead?.businessName || lead?.companyName || "")}&contactPerson=${encodeURIComponent(lead?.contactName || lead?.customerName || "")}&customerName=${encodeURIComponent(lead?.customerName || lead?.contactName || "")}&phone=${encodeURIComponent(lead?.phone || "")}`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Quotation
                </Link>
              </div>

              <div className="space-y-3">
                {quotations.length > 0 ? (
                  quotations.map((q) => {
                    const discountVal =
                      q.overallDiscountPercent ||
                      Math.round((q.governingDiscountBps || 0) / 100);
                    const isExceedingManagerLimit = discountVal > 15;
                    const canUserApproveDiscount =
                      isCEOOrAdmin || (isManager && !isExceedingManagerLimit);

                    const quoteTotal = q.grandTotalPaise
                      ? q.grandTotalPaise / 100
                      : q.totalAmount || 0;
                    const advReq =
                      q.advanceRequiredPaise !== undefined
                        ? q.advanceRequiredPaise / 100
                        : Math.round(quoteTotal * 0.5);
                    const advRec = (q.advanceReceivedPaise || 0) / 100;
                    const balPaise =
                      q.directBalancePaise !== undefined
                        ? q.directBalancePaise
                        : Math.max(
                            0,
                            (q.grandTotalPaise || Math.round(quoteTotal * 100)) -
                              (q.directPaidPaise || 0),
                          );
                    const balDue = balPaise / 100;
                    const isFullyPaid =
                      balDue <= 0 && ((q.directPaidPaise || 0) > 0 || advRec > 0);

                    return (
                      <div
                        key={q._id}
                        className="p-4 rounded-md bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              {q.quotationNumber ||
                                `QT-${q._id.slice(-6).toUpperCase()}`}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                q.status === "ACCEPTED"
                                  ? "bg-green-100 text-green-900 border border-green-300 font-extrabold"
                                  : q.status === "APPROVED"
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : q.status === "SENT"
                                      ? "bg-orange-100 text-orange-800 border border-orange-200"
                                      : q.status === "PENDING_DISCOUNT_APPROVAL"
                                        ? "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
                                        : "bg-rose-100 text-rose-800 border border-rose-200"
                              }`}
                            >
                              {q.status?.replace(/_/g, " ")}
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px]">
                            Created on{" "}
                            {new Date(q.createdAt).toLocaleDateString("en-GB")}{" "}
                            • Items: {q.items?.length || 1}
                            {discountVal > 0 && ` • Discount: ${discountVal}%`}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <div className="text-right space-y-0.5">
                            <span className="text-[10px] text-slate-400 block font-semibold">
                              Total Amount
                            </span>
                            <span className="font-mono font-bold text-slate-900 text-sm block">
                              ₹
                              {quoteTotal.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                            {q.status === "ACCEPTED" && (
                              <div className="flex flex-col items-end gap-0.5 mt-1">
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  Adv Paid: ₹{advRec.toLocaleString("en-IN")}
                                </span>
                                <span
                                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                                    balDue <= 0
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                      : "bg-amber-50 text-amber-800 border border-amber-200"
                                  }`}
                                >
                                  {balDue <= 0
                                    ? "✓ Balance: ₹0 (Fully Paid)"
                                    : `Bal Due: ₹${balDue.toLocaleString("en-IN")}`}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Lifecycle Action Buttons */}
                          {q.status === "PENDING_DISCOUNT_APPROVAL" &&
                            (canUserApproveDiscount ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() =>
                                    handleApproveQuotationDiscount(q._id)
                                  }
                                  disabled={actionLoading}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  onClick={() =>
                                    handleRejectQuotationDiscount(q._id)
                                  }
                                  disabled={actionLoading}
                                  className="px-2.5 py-1.5 rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs"
                                >
                                  ✕ Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-1 rounded-lg border border-amber-300">
                                🔒 Admin Approval Required (&gt;15%)
                              </span>
                            ))}

                          {q.status === "APPROVED" && (
                            <button
                              onClick={() => handleSendQuotationToClient(q._id)}
                              disabled={actionLoading}
                              className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#F95721] hover:bg-[#e84915] text-white font-bold text-xs shadow-xs"
                            >
                              <Send className="w-3.5 h-3.5" /> 🚀 Send
                            </button>
                          )}

                          {q.status === "SENT" && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  handleOpenCreateOrderModal({
                                    quotationId: q._id,
                                    title:
                                      q.items?.[0]?.title ||
                                      "Order from Quotation",
                                    amount: q.grandTotalPaise
                                      ? q.grandTotalPaise / 100
                                      : q.totalAmount || 0,
                                    });
                                }}
                                className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" /> Convert to
                                Order
                              </button>
                              <button
                                onClick={() =>
                                  handleMarkQuotationNotAccepted(q._id)
                                }
                                disabled={actionLoading}
                                className="px-2.5 py-1.5 rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs"
                              >
                                ✕ Not Accepted
                              </button>
                            </div>
                          )}

                          {q.status === "ACCEPTED" && (
                            <>
                              {balDue > 0 && !isFullyPaid ? (
                                <button
                                  onClick={() =>
                                    handleOpenQuotationPaymentModal(q._id)
                                  }
                                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  {advRec < advReq
                                    ? "Record Advance"
                                    : "Record Balance"}
                                </button>
                              ) : (
                                <span className="px-2.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-[11px] border border-emerald-300 flex items-center gap-1">
                                  ✓ Fully Paid
                                </span>
                              )}

                              <button
                                onClick={() => {
                                  handleOpenCreateOrderModal({
                                    quotationId: q._id,
                                    title:
                                      q.items?.[0]?.title ||
                                      "Order from Quotation",
                                    amount: q.grandTotalPaise
                                      ? q.grandTotalPaise / 100
                                      : q.totalAmount || 0,
                                  });
                                }}
                                className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" /> Convert to
                                Order
                              </button>
                            </>
                          )}

                          <button
                            onClick={async () => {
                              try {
                                await api.downloadPdf(
                                  `/quotations/${q._id}/pdf`,
                                  `Quotation-${q.quotationNumber || q._id}.pdf`,
                                );
                              } catch (err) {
                                alert(err.message || "Failed to download PDF");
                              }
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs border border-emerald-200 shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF
                          </button>

                          <Link
                            href={`/dashboard/quotations`}
                            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs shadow-xs"
                          >
                            Studio
                          </Link>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-12 h-12 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="text-slate-500 text-xs">
                      No quotations generated yet for this lead.
                    </p>
                    <Link
                      href={`/dashboard/quotations?leadId=${leadId}&businessName=${encodeURIComponent(lead?.businessName || lead?.companyName || "")}&companyName=${encodeURIComponent(lead?.businessName || lead?.companyName || "")}&contactPerson=${encodeURIComponent(lead?.contactName || lead?.customerName || "")}&customerName=${encodeURIComponent(lead?.customerName || lead?.contactName || "")}&phone=${encodeURIComponent(lead?.phone || "")}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create First Quotation
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FOLLOW-UPS TAB */}
          {activeTab === "Follow-ups" && (
            <div className="bg-white rounded-md p-6 border border-slate-200 shadow-xs space-y-4 text-xs">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Scheduled Follow-ups ({followups.length})
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Calls, meetings, and callback schedules with customer
                  </p>
                </div>
                <button
                  onClick={() => setShowFollowupModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#F95721] hover:bg-[#e84915] text-white font-semibold shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Schedule Follow-up
                </button>
              </div>

              <div className="space-y-3">
                {followups.length > 0 ? (
                  followups.map((f) => {
                    const isCompleted = f.status === "COMPLETED";
                    return (
                      <div
                        key={f._id}
                        className={`p-4 rounded-md border transition-all ${
                          isCompleted
                            ? "bg-slate-50/70 border-slate-200"
                            : "bg-white border-amber-200 shadow-xs ring-1 ring-amber-400/20"
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <strong className="text-slate-900 text-xs font-bold">
                                {f.title || "Follow-up"}
                              </strong>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isCompleted
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : "bg-amber-100 text-amber-800 border border-amber-200"
                                }`}
                              >
                                {isCompleted ? "✓ Completed" : "Pending Action"}
                              </span>
                              {isCompleted && f.outcome && (
                                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200">
                                  {f.outcome}
                                </span>
                              )}
                            </div>

                            <p className="text-slate-500 text-[11px]">
                              {f.description || "No description provided."}
                            </p>

                            {isCompleted && f.outcomeNotes && (
                              <p className="text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-100 text-[11px] font-medium">
                                <span className="font-bold">
                                  Outcome Notes:
                                </span>{" "}
                                {f.outcomeNotes}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block">
                                {isCompleted ? "Completed On" : "Scheduled For"}
                              </span>
                              <span className="font-mono text-xs font-bold text-slate-800">
                                {new Date(
                                  isCompleted
                                    ? f.completedAt || f.updatedAt
                                    : f.scheduledAt,
                                ).toLocaleString([], {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>

                            {!isCompleted ? (
                              <button
                                onClick={() => handleOpenCompleteFollowup(f)}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Complete Follow-up
                              </button>
                            ) : (
                              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                <Check className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 text-slate-400 text-xs space-y-2">
                    <p>No follow-ups recorded for this lead.</p>
                    <button
                      onClick={() => setShowFollowupModal(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-orange-50 text-orange-700 font-bold text-xs"
                    >
                      + Schedule Follow-up Call
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PAYMENTS & ADVANCE TAB */}
          {(activeTab === "Payments" || activeTab.startsWith("Payments")) && (
            <div className="bg-white rounded-md p-6 border border-slate-200 shadow-xs space-y-6 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                    Customer Payments &amp; Advances ({payments.length})
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Advance collections and payment receipts recorded for this
                    lead
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleOpenQuotationPaymentModal()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Record Advance Payment
                  </button>
                </div>
              </div>

              {/* Financial Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-md bg-emerald-50/70 border border-emerald-200/80">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Verified &amp; Credited
                  </span>
                  <strong className="text-xl font-bold font-mono text-emerald-950 mt-1 block">
                    ₹
                    {payments
                      .filter((p) => p.status === "CONFIRMED")
                      .reduce(
                        (acc, p) =>
                          acc +
                          (p.amountPaise ? p.amountPaise / 100 : p.amount || 0),
                        0,
                      )
                      .toLocaleString("en-IN")}
                  </strong>
                  <span className="text-[10px] text-emerald-700 mt-0.5 block">
                    Cleared in company ledger
                  </span>
                </div>

                <div className="p-4 rounded-md bg-amber-50/70 border border-amber-200/80">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                    Pending Verification
                  </span>
                  <strong className="text-xl font-bold font-mono text-amber-950 mt-1 block">
                    ₹
                    {payments
                      .filter((p) => p.status === "PENDING_VERIFICATION")
                      .reduce(
                        (acc, p) =>
                          acc +
                          (p.amountPaise ? p.amountPaise / 100 : p.amount || 0),
                        0,
                      )
                      .toLocaleString("en-IN")}
                  </strong>
                  <span className="text-[10px] text-amber-700 mt-0.5 block">
                    Awaiting Manager/Admin clearance
                  </span>
                </div>

                <div className="p-4 rounded-md bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Total Recorded
                  </span>
                  <strong className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                    ₹
                    {payments
                      .reduce(
                        (acc, p) =>
                          acc +
                          (p.amountPaise ? p.amountPaise / 100 : p.amount || 0),
                        0,
                      )
                      .toLocaleString("en-IN")}
                  </strong>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {payments.length} total entries
                  </span>
                </div>
              </div>

              {/* Payments List */}
              <div className="space-y-3">
                {payments.length > 0 ? (
                  payments.map((p) => {
                    const isPending = p.status === "PENDING_VERIFICATION";
                    const isConfirmed = p.status === "CONFIRMED";
                    const amountRupees = p.amountPaise
                      ? p.amountPaise / 100
                      : p.amount || 0;

                    return (
                      <div
                        key={p._id}
                        className={`p-4 rounded-md border transition-all ${
                          isPending
                            ? "bg-amber-50/30 border-amber-200/90 ring-1 ring-amber-400/20"
                            : isConfirmed
                              ? "bg-white border-slate-200"
                              : "bg-rose-50/30 border-rose-200"
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="font-mono font-bold text-slate-900 text-sm">
                                {p.receiptNumber ||
                                  `RCT-${p._id.slice(-6).toUpperCase()}`}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {p.paymentType || "ADVANCE"}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                                {p.paymentMethod?.replace(/_/g, " ")}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isConfirmed
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                    : isPending
                                      ? "bg-amber-100 text-amber-800 border-amber-300"
                                      : "bg-rose-100 text-rose-800 border-rose-300"
                                }`}
                              >
                                {isConfirmed
                                  ? "✓ Verified & Credited"
                                  : isPending
                                    ? "⏳ Pending Verification"
                                    : "✕ Rejected"}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
                              <span>
                                Recorded:{" "}
                                {new Date(
                                  p.receivedAt || p.createdAt,
                                ).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {p.transactionReference && (
                                <span className="font-mono text-slate-700 font-medium">
                                  Ref/UTR: {p.transactionReference}
                                </span>
                              )}
                              {p.bankName && <span>Bank: {p.bankName}</span>}
                              {p.collectedById?.name && (
                                <span>
                                  Recorded by:{" "}
                                  <strong className="text-slate-700">
                                    {p.collectedById.name}
                                  </strong>
                                </span>
                              )}
                            </div>

                            {p.notes && (
                              <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                <span className="font-semibold">Note:</span>{" "}
                                {p.notes}
                              </p>
                            )}

                            {isConfirmed && p.verifiedById?.name && (
                              <p className="text-[10px] text-emerald-800 font-medium">
                                ✓ Verified by {p.verifiedById.name} on{" "}
                                {new Date(
                                  p.verifiedAt || p.updatedAt,
                                ).toLocaleDateString("en-GB")}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-4 lg:border-l lg:border-slate-100 lg:pl-6 shrink-0 justify-between lg:justify-end">
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block font-semibold">
                                Amount
                              </span>
                              <strong className="font-mono font-bold text-slate-900 text-base">
                                ₹{amountRupees.toLocaleString("en-IN")}
                              </strong>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Manager / Admin / Privileged verification actions */}
                              {isPending && canVerifyPayment && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleVerifyPayment(p._id)}
                                    disabled={actionLoading}
                                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                                    title="Confirm and verify payment into company ledger"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Confirm &amp; Verify
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRejectPayment(p._id)}
                                    disabled={actionLoading}
                                    className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-all"
                                    title="Reject payment"
                                  >
                                    ✕ Reject
                                  </button>
                                </>
                              )}

                              {/* Sales sees clear status badge without verification actions */}
                              {isPending && isSalesOnly && (
                                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                                  ⏳ Awaiting Verification
                                </span>
                              )}

                              {/* Download Receipt - Only visible once payment is Approved / Confirmed */}
                              {isConfirmed && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await api.downloadPdf(
                                        `/payments/${p._id}/receipt`,
                                        `Receipt-${p.receiptNumber || p._id}.pdf`,
                                      );
                                    } catch (err) {
                                      alert(
                                        err.message ||
                                          "Failed to download receipt",
                                      );
                                    }
                                  }}
                                  className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs border border-emerald-200 transition-all flex items-center gap-1 shadow-xs"
                                  title="Download Official Payment Receipt"
                                >
                                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                                  Receipt
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-12 h-12 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-slate-700 font-semibold text-xs">
                        No advance payments recorded yet.
                      </p>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Sales can record token advance or upfront deposit
                        received from customer.
                      </p>
                    </div>
                    <button
                      onClick={() => handleOpenQuotationPaymentModal()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Record Advance Payment
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NOTES & REMARKS TAB */}
          {(activeTab === "Notes & Remarks" ||
            activeTab.startsWith("Notes")) && (
            <div className="space-y-6 text-xs animate-fade-in">
              {/* Header with Quick Stats & Category Filters */}
              <div className="bg-white rounded-md p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                    <Pin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Notes &amp; Internal Remarks
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Record deal observations, client preferences, technical
                      printing notes, and pinned instructions.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: "ALL", label: "All Remarks", count: notes.length },
                    {
                      id: "CLIENT_PREFERENCE",
                      label: "Client Preference",
                      count: notes.filter(
                        (n) => n.category === "CLIENT_PREFERENCE",
                      ).length,
                    },
                    {
                      id: "TECHNICAL_PRINTING",
                      label: "Technical Printing",
                      count: notes.filter(
                        (n) => n.category === "TECHNICAL_PRINTING",
                      ).length,
                    },
                    {
                      id: "NEGOTIATION",
                      label: "Negotiation / Price",
                      count: notes.filter((n) => n.category === "NEGOTIATION")
                        .length,
                    },
                    {
                      id: "URGENT_REMARK",
                      label: "Urgent Remarks",
                      count: notes.filter((n) => n.category === "URGENT_REMARK")
                        .length,
                    },
                    {
                      id: "GENERAL",
                      label: "General",
                      count: notes.filter(
                        (n) => n.category === "GENERAL" || !n.category,
                      ).length,
                    },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setNotesCategoryFilter(filter.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        notesCategoryFilter === filter.id
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {filter.label} {filter.count > 0 && `(${filter.count})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Note Studio Card */}
              <div className="bg-white rounded-md p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                    <Edit className="w-4 h-4 text-[#F95721]" />
                    <span>Add New Remark / Instruction</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {newNoteContent.length}/500 chars
                  </span>
                </div>

                <form onSubmit={handleAddNoteSubmit} className="space-y-3">
                  <textarea
                    rows={3}
                    maxLength={500}
                    placeholder="Write a clear note (e.g., Client requested matte lamination sample, agreed on 50% advance token, call back on Saturday at 4 PM)..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#F95721] leading-relaxed resize-none"
                  />

                  {/* One-Click Suggestion Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-semibold mr-1">
                      Quick Suggestions:
                    </span>
                    {[
                      {
                        text: "Client requested urgent sample before final run",
                        cat: "CLIENT_PREFERENCE",
                      },
                      {
                        text: "Technical: 350 GSM Matte + Spot UV required",
                        cat: "TECHNICAL_PRINTING",
                      },
                      {
                        text: "Commercial: 50% advance payment confirmed",
                        cat: "PAYMENT_REMARK",
                      },
                      {
                        text: "Follow-up requested after 5:00 PM",
                        cat: "GENERAL",
                      },
                    ].map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setNewNoteContent(sug.text);
                          setNewNoteCategory(sug.cat);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-[#e84915] text-slate-600 text-[10px] font-medium border border-slate-200 transition-all"
                      >
                        + {sug.text}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                          Category
                        </label>
                        <select
                          value={newNoteCategory}
                          onChange={(e) => setNewNoteCategory(e.target.value)}
                          className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs focus:outline-none"
                        >
                          <option value="GENERAL">📝 General Note</option>
                          <option value="CLIENT_PREFERENCE">
                            🎨 Client Preference
                          </option>
                          <option value="TECHNICAL_PRINTING">
                            🖨️ Technical / Printing Spec
                          </option>
                          <option value="NEGOTIATION">
                            💰 Price &amp; Negotiation
                          </option>
                          <option value="URGENT_REMARK">
                            🚨 Urgent Remark
                          </option>
                          <option value="PAYMENT_REMARK">
                            💳 Payment / Deposit Note
                          </option>
                        </select>
                      </div>

                      <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer select-none mt-3 sm:mt-0">
                        <input
                          type="checkbox"
                          checked={newNotePinned}
                          onChange={(e) => setNewNotePinned(e.target.checked)}
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="flex items-center gap-1 text-amber-700">
                          <Pin className="w-3.5 h-3.5 text-amber-600" /> Pin to
                          Top
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading || !newNoteContent.trim()}
                      className="px-5 py-2 rounded-xl bg-[#F95721] hover:bg-[#e84915] disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      {actionLoading ? "Saving..." : "Save Remark"}
                    </button>
                  </div>
                </form>
              </div>

              {/* PINNED REMARKS HIGHLIGHT SECTION */}
              {notes.filter((n) => n.isPinned).length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                    <Pin className="w-4 h-4 text-amber-600" />
                    <span>
                      Pinned Remarks ({notes.filter((n) => n.isPinned).length})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {notes
                      .filter((n) => n.isPinned)
                      .map((pNote, idx) => (
                        <div
                          key={pNote._id || idx}
                          className="p-4 rounded-md bg-amber-50/80 border border-amber-200/90 shadow-xs space-y-2 relative"
                        >
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-200/80 text-amber-900 uppercase tracking-wider">
                              📌{" "}
                              {pNote.category?.replace(/_/g, " ") ||
                                "PINNED NOTE"}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleTogglePinNote(pNote._id)}
                                className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 underline"
                                title="Unpin note"
                              >
                                Unpin
                              </button>
                              <button
                                onClick={() => handleDeleteNote(pNote._id)}
                                className="text-slate-400 hover:text-rose-600"
                                title="Delete remark"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-slate-800 font-medium text-xs leading-relaxed whitespace-pre-wrap">
                            {pNote.content}
                          </p>

                          <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-amber-200/60">
                            <span>
                              Author:{" "}
                              <strong>{pNote.authorName || "Sales Rep"}</strong>{" "}
                              ({pNote.authorRole || "Sales"})
                            </span>
                            <span className="font-mono">
                              {new Date(
                                pNote.createdAt || Date.now(),
                              ).toLocaleString("en-GB")}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* TIMELINE FEED OF ALL NOTES */}
              <div className="bg-white rounded-md p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="font-bold text-slate-900 text-xs">
                    All Remarks &amp; Notes History ({notes.length})
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Showing latest entries
                  </span>
                </div>

                <div className="space-y-3">
                  {notes.length > 0 ? (
                    notes
                      .filter(
                        (n) =>
                          notesCategoryFilter === "ALL" ||
                          n.category === notesCategoryFilter,
                      )
                      .map((note, idx) => {
                        const getCatColor = (cat) => {
                          switch (cat) {
                            case "CLIENT_PREFERENCE":
                              return "bg-purple-100 text-purple-800 border-purple-200";
                            case "TECHNICAL_PRINTING":
                              return "bg-cyan-100 text-cyan-800 border-cyan-200";
                            case "NEGOTIATION":
                              return "bg-emerald-100 text-emerald-800 border-emerald-200";
                            case "URGENT_REMARK":
                              return "bg-rose-100 text-rose-800 border-rose-200 animate-pulse";
                            case "PAYMENT_REMARK":
                              return "bg-green-100 text-green-800 border-green-200";
                            default:
                              return "bg-slate-100 text-slate-700 border-slate-200";
                          }
                        };

                        return (
                          <div
                            key={note._id || idx}
                            className={`p-4 rounded-md border transition-all space-y-2.5 ${
                              note.isPinned
                                ? "bg-amber-50/50 border-amber-200"
                                : "bg-slate-50/70 hover:bg-slate-50 border-slate-200/80"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-[10px]">
                                  {(note.authorName || "S")
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </div>
                                <div>
                                  <strong className="text-slate-900 text-xs block leading-tight font-bold">
                                    {note.authorName || "Sales User"}
                                  </strong>
                                  <span className="text-[10px] text-slate-400 block font-medium">
                                    {note.authorRole || "Representative"} •{" "}
                                    {new Date(
                                      note.createdAt || Date.now(),
                                    ).toLocaleString("en-GB")}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getCatColor(note.category)}`}
                                >
                                  {note.category?.replace(/_/g, " ") ||
                                    "GENERAL"}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleTogglePinNote(note._id)}
                                  className={`p-1.5 rounded-lg border transition-all ${
                                    note.isPinned
                                      ? "bg-amber-100 text-amber-800 border-amber-300"
                                      : "bg-white hover:bg-slate-100 text-slate-400 border-slate-200"
                                  }`}
                                  title={
                                    note.isPinned
                                      ? "Unpin remark"
                                      : "Pin remark to top"
                                  }
                                >
                                  <Pin className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteNote(note._id)}
                                  className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition-all"
                                  title="Delete remark"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-slate-800 text-xs font-normal leading-relaxed whitespace-pre-wrap pl-9">
                              {note.content}
                            </p>
                          </div>
                        );
                      })
                  ) : (
                    <div className="text-center py-12 space-y-3">
                      <div className="w-12 h-12 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                        <Pin className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-slate-700 font-semibold text-xs">
                          No remarks added yet.
                        </p>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          Write your first internal observation, client
                          preference, or printing requirement note above.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENTS & CLIENT WORK TAB */}
          {activeTab === "Documents" && (
            <div className="space-y-6 text-xs animate-fade-in">
              {/* Header Banner with Upload Button & Categories */}
              <div className="bg-white rounded-md p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Documents, Client Work &amp; Photos
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Upload client reference photos, design artwork, POs, and
                      GST certificates securely stored on Cloudinary.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDocForm({
                        title: "",
                        category: "CLIENT_WORK",
                        description: "",
                        file: null,
                        previewUrl: "",
                      });
                      setShowUploadDocModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Upload File / Photo
                  </button>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  {
                    id: "ALL",
                    label: "All Files",
                    count:
                      documents.length + quotations.length + payments.length,
                  },
                  {
                    id: "CLIENT_WORK",
                    label: "📸 Client Work & Photos",
                    count: documents.filter(
                      (d) =>
                        d.category === "CLIENT_WORK" || d.category === "PHOTO",
                    ).length,
                  },
                  {
                    id: "ARTWORK",
                    label: "🎨 Artwork & Proofs",
                    count: documents.filter((d) => d.category === "ARTWORK")
                      .length,
                  },
                  {
                    id: "PURCHASE_ORDER",
                    label: "📄 Purchase Orders",
                    count: documents.filter(
                      (d) => d.category === "PURCHASE_ORDER",
                    ).length,
                  },
                  {
                    id: "COMMERCIAL",
                    label: "💰 Quotations & Receipts",
                    count: quotations.length + payments.length,
                  },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setDocCategoryFilter(filter.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      docCategoryFilter === filter.id
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {filter.label} {filter.count > 0 && `(${filter.count})`}
                  </button>
                ))}
              </div>

              {/* UPLOADED CLIENT FILES & PHOTOS GRID */}
              {docCategoryFilter !== "COMMERCIAL" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-indigo-600" />
                      Client Assets &amp; Uploaded Media (
                      {
                        documents.filter((d) => {
                          if (docCategoryFilter === "ALL") return true;
                          if (docCategoryFilter === "CLIENT_WORK")
                            return (
                              d.category === "CLIENT_WORK" ||
                              d.category === "PHOTO"
                            );
                          if (docCategoryFilter === "ARTWORK")
                            return d.category === "ARTWORK";
                          if (docCategoryFilter === "PURCHASE_ORDER")
                            return d.category === "PURCHASE_ORDER";
                          return d.category === docCategoryFilter;
                        }).length
                      }
                      )
                    </h4>
                  </div>

                  {documents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {documents
                        .filter((d) => {
                          if (docCategoryFilter === "ALL") return true;
                          if (docCategoryFilter === "CLIENT_WORK")
                            return (
                              d.category === "CLIENT_WORK" ||
                              d.category === "PHOTO"
                            );
                          if (docCategoryFilter === "ARTWORK")
                            return d.category === "ARTWORK";
                          if (docCategoryFilter === "PURCHASE_ORDER")
                            return d.category === "PURCHASE_ORDER";
                          return d.category === docCategoryFilter;
                        })
                        .map((doc, idx) => {
                          const isImg =
                            doc.category === "PHOTO" ||
                            doc.fileUrl?.match(
                              /\.(jpeg|jpg|png|webp|gif|svg)(\?.*)?$/i,
                            ) ||
                            (doc.fileType && doc.fileType.startsWith("image"));

                          return (
                            <div
                              key={doc._id || idx}
                              className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                            >
                              {/* Preview Area */}
                              <div className="relative bg-slate-100 h-40 flex items-center justify-center overflow-hidden">
                                {isImg ? (
                                  <>
                                    <img
                                      src={doc.fileUrl}
                                      alt={doc.title}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                                      onClick={() =>
                                        setSelectedImagePreview(doc.fileUrl)
                                      }
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedImagePreview(doc.fileUrl)
                                      }
                                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100"
                                      title="Preview full screen"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-slate-400 space-y-1">
                                    <FileText className="w-10 h-10 text-indigo-500" />
                                    <span className="text-[10px] font-mono uppercase font-bold text-slate-500">
                                      {doc.fileName?.split(".").pop() || "FILE"}
                                    </span>
                                  </div>
                                )}

                                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur-xs">
                                  {doc.category?.replace(/_/g, " ") || "DOC"}
                                </span>
                              </div>

                              {/* Details Area */}
                              <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                                <div>
                                  <strong
                                    className="text-slate-900 text-xs font-bold block truncate"
                                    title={doc.title}
                                  >
                                    {doc.title}
                                  </strong>
                                  {doc.description && (
                                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                                      {doc.description}
                                    </p>
                                  )}
                                  <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                                    <span>
                                      By: {doc.uploadedByName || "Sales"}
                                    </span>
                                    <span>
                                      {doc.fileSizeBytes
                                        ? `${(doc.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`
                                        : ""}
                                    </span>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                  <a
                                    href={doc.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    download={doc.fileName || "file"}
                                    className="flex-1 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-slate-200 hover:border-indigo-200 transition-all flex items-center justify-center gap-1 shadow-2xs"
                                  >
                                    <Download className="w-3.5 h-3.5" />{" "}
                                    Download
                                  </a>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteDocument(doc._id)
                                    }
                                    disabled={actionLoading}
                                    className="p-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition-all"
                                    title="Delete file"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="bg-white rounded-md p-8 border border-slate-200 text-center space-y-3">
                      <div className="w-12 h-12 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-slate-800 font-semibold text-xs">
                          No client files or photos uploaded yet.
                        </p>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          Sales can upload reference pictures, client logos,
                          sample prints, or PO scans.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setDocForm({
                            title: "",
                            category: "CLIENT_WORK",
                            description: "",
                            file: null,
                            previewUrl: "",
                          });
                          setShowUploadDocModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Upload First Document
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* COMMERCIAL INVOICES & VERIFIED RECEIPTS */}
              {(docCategoryFilter === "ALL" ||
                docCategoryFilter === "COMMERCIAL") && (
                <div className="space-y-3 pt-2">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    Official Commercial Documents (
                    {quotations.length + payments.length})
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {quotations.map((q) => (
                      <div
                        key={q._id}
                        className="bg-white p-4 rounded-md border border-slate-200 shadow-xs space-y-2.5"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {q.quotationNumber}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-100 text-orange-800">
                            PDF QUOTE
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px]">
                          Official Commercial Quotation Proposal
                        </p>
                        <button
                          onClick={async () => {
                            try {
                              await api.downloadPdf(
                                `/quotations/${q._id}/pdf`,
                                `Quotation-${q.quotationNumber}.pdf`,
                              );
                            } catch (err) {
                              alert(err.message || "Failed to download PDF");
                            }
                          }}
                          className="w-full mt-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold flex items-center justify-center gap-1 shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5" /> Download Proposal
                        </button>
                      </div>
                    ))}

                    {payments
                      .filter(
                        (p) =>
                          p.status === "CONFIRMED" || p.status === "VERIFIED",
                      )
                      .map((p) => (
                        <div
                          key={p._id}
                          className="bg-white p-4 rounded-md border border-slate-200 shadow-xs space-y-2.5"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-mono font-bold text-slate-900 text-xs">
                              {p.receiptNumber || "RECEIPT"}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                              RECEIPT
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px]">
                            Advance Payment Receipt (₹
                            {p.amount || p.amountPaidPaise / 100})
                          </p>
                          <button
                            onClick={async () => {
                              try {
                                await api.downloadPdf(
                                  `/payments/${p._id}/receipt`,
                                  `Receipt-${p.receiptNumber || p._id}.pdf`,
                                );
                              } catch (err) {
                                alert(
                                  err.message || "Failed to download receipt",
                                );
                              }
                            }}
                            className="w-full mt-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold flex items-center justify-center gap-1 shadow-2xs"
                          >
                            <Download className="w-3.5 h-3.5" /> Download
                            Receipt
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ACTIVITY TIMELINE TAB */}
          {activeTab === "Activity Timeline" && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      Activity History &amp; Audit Trail
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        {activities.length} {activities.length === 1 ? "Event" : "Events"}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Chronological history of lead updates, communications, status transitions &amp; audits
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadLeadDetails()}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                    title="Refresh activities"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    onClick={() => setShowActivityModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F95721] hover:bg-[#e84915] text-white font-semibold shadow-xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Log Activity
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                {activities.length > 0 ? (
                  activities.map((a, idx) => {
                    const eventTypeStr = a.eventType || a.action || a.type || "ACTIVITY";
                    let badgeInfo = { label: "Activity", color: "bg-slate-100 text-slate-800 border-slate-200" };
                    const t = String(eventTypeStr).toUpperCase();

                    if (t.includes("CREATED") || t === "CREATE") {
                      badgeInfo = { label: "Lead Created", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
                    } else if (t.includes("UPDATED") || t === "UPDATE") {
                      badgeInfo = { label: "Lead Updated", color: "bg-sky-50 text-sky-700 border-sky-200" };
                    } else if (t.includes("STATUS")) {
                      badgeInfo = { label: "Status Transition", color: "bg-purple-50 text-purple-700 border-purple-200" };
                    } else if (t.includes("ASSIGN") || t.includes("FORWARD")) {
                      badgeInfo = { label: "Assignment", color: "bg-indigo-50 text-indigo-700 border-indigo-200" };
                    } else if (t.includes("FOLLOWUP")) {
                      badgeInfo = { label: "Follow-up", color: "bg-amber-50 text-amber-700 border-amber-200" };
                    } else if (t.includes("DOCUMENT") || t.includes("PHOTO")) {
                      badgeInfo = { label: "Attachment / Photo", color: "bg-teal-50 text-teal-700 border-teal-200" };
                    } else if (t.includes("CALL")) {
                      badgeInfo = { label: "Phone Call", color: "bg-blue-50 text-blue-700 border-blue-200" };
                    } else if (t.includes("WHATSAPP")) {
                      badgeInfo = { label: "WhatsApp Chat", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
                    } else if (t.includes("NOTE") || t.includes("REMARK")) {
                      badgeInfo = { label: "Interaction Remark", color: "bg-orange-50 text-orange-700 border-orange-200" };
                    } else if (t.includes("AUDIT")) {
                      badgeInfo = { label: "System Audit", color: "bg-rose-50 text-rose-700 border-rose-200" };
                    }

                    const changesList = Array.isArray(a.metadata?.changes) ? a.metadata.changes : null;
                    const timestampVal = a.occurredAt || a.createdAt || a.timestamp || null;

                    return (
                      <div
                        key={a._id || idx}
                        className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 hover:border-slate-300 transition-all flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-lg font-bold text-[10px] border ${badgeInfo.color}`}>
                              {badgeInfo.label}
                            </span>
                            <span className="font-semibold text-slate-800 text-[12px] leading-snug">
                              {a.summary || a.description}
                            </span>
                          </div>

                          {/* Changed fields breakdown */}
                          {changesList && changesList.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {changesList.map((c, cIdx) => (
                                <span
                                  key={cIdx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-white border border-slate-200 text-slate-600 font-mono"
                                >
                                  <span className="font-semibold text-slate-800">{c.label}:</span>
                                  <span className="line-through text-slate-400">{String(c.before || "None").slice(0, 20)}</span>
                                  <span className="text-slate-400">→</span>
                                  <span className="text-emerald-700 font-medium">{String(c.after || "None").slice(0, 20)}</span>
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-0.5">
                            <span className="flex items-center gap-1 font-medium text-slate-500">
                              <User className="w-3 h-3 text-slate-400" />
                              {a.actorName || a.actorEmail || "Sales User"}
                            </span>
                            {a.metadata?.leadNumber && (
                              <span className="font-mono text-slate-400">
                                Ref: {a.metadata.leadNumber}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0 pt-0.5">
                          <span className="text-[10px] text-slate-500 font-medium block">
                            {timestampVal
                              ? new Date(timestampVal).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "-"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {timestampVal
                              ? new Date(timestampVal).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 px-4 rounded-xl bg-slate-50/50 border border-dashed border-slate-200 text-slate-400 text-xs space-y-2">
                    <History className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-semibold text-slate-700">No activity logs recorded yet</p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      All lead updates, stage transitions, customer interactions, and audit logs will automatically appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CREATE COMMERCIAL ORDER MODAL */}
      {showCreateOrderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl p-6 space-y-4 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Create Commercial Order
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Create commercial order
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateOrderModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateOrderSubmit}
              className="space-y-4 text-xs"
            >
              {/* Quotation Selection or Custom */}
              {quotations.length > 0 && (
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Convert From Quotation (Optional)
                  </label>
                  <select
                    value={orderForm.quotationId || ""}
                    onChange={(e) => {
                      const selectedQId = e.target.value;
                      const q = quotations.find(
                        (item) => item._id === selectedQId,
                      );
                      const it = q?.items?.[0];
                      setOrderForm({
                        ...orderForm,
                        quotationId: selectedQId,
                        selectedItemIndex: "",
                        title: it?.title || orderForm.title || "",
                        amount: q
                          ? (q.grandTotalPaise
                              ? q.grandTotalPaise / 100
                              : q.totalAmount || 0
                            ).toString()
                          : orderForm.amount || "",
                        width: it?.width
                          ? it.width.toString()
                          : orderForm.width || "",
                        height: it?.height
                          ? it.height.toString()
                          : orderForm.height || "",
                        dimensionUnit:
                          it?.dimensionUnit ||
                          orderForm.dimensionUnit ||
                          "inch",
                        quantity: it?.quantity || orderForm.quantity || 1,
                        material: it?.paperType || orderForm.material || "",
                        gsm: it?.paperGsm
                          ? it.paperGsm.toString()
                          : orderForm.gsm || "",
                        colors: it?.colors || orderForm.colors || "CMYK",
                        printSides:
                          it?.printSides || orderForm.printSides || "SINGLE",
                        finishing: it?.finishing || orderForm.finishing || [],
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold"
                  >
                    <option value="">-- Direct Order (No quotation) --</option>
                    {quotations.map((q) => (
                      <option key={q._id} value={q._id}>
                        {q.quotationNumber || q._id} - ₹
                        {(q.grandTotalPaise
                          ? q.grandTotalPaise / 100
                          : q.totalAmount || 0
                        ).toLocaleString("en-IN")}{" "}
                        ({q.status})
                      </option>
                    ))}
                  </select>

                  {/* If quotation has multiple items, allow splitting by selecting specific item */}
                  {(() => {
                    const selectedQ = quotations.find(
                      (item) => item._id === orderForm.quotationId,
                    );
                    if (
                      !selectedQ ||
                      !selectedQ.items ||
                      selectedQ.items.length <= 1
                    )
                      return null;
                    return (
                      <div className="mt-2.5 p-3 rounded-xl bg-indigo-50/70 border border-indigo-200">
                        <label className="text-indigo-950 font-bold block mb-1 text-[11px]">
                          Select Item from Quotation to Order (Split Mode)
                        </label>
                        <select
                          value={
                            orderForm.selectedItemIndex !== undefined
                              ? orderForm.selectedItemIndex
                              : ""
                          }
                          onChange={(e) => {
                            const itemIdx = e.target.value;
                            if (itemIdx === "") {
                              const it0 = selectedQ.items[0];
                              setOrderForm({
                                ...orderForm,
                                selectedItemIndex: "",
                                title: it0?.title || orderForm.title,
                                amount: (selectedQ.grandTotalPaise
                                  ? selectedQ.grandTotalPaise / 100
                                  : selectedQ.totalAmount || 0
                                ).toString(),
                              });
                            } else {
                              const it = selectedQ.items[Number(itemIdx)];
                              const gross =
                                (Number(it.quantity) || 1) *
                                (it.unitRatePaise
                                  ? it.unitRatePaise / 100
                                  : it.rate || 0);
                              const disc =
                                (gross * Number(it.discountPercent || 0)) / 100;
                              const tax =
                                ((gross - disc) *
                                  Number(
                                    it.taxRatePercent !== undefined
                                      ? it.taxRatePercent
                                      : 18,
                                  )) /
                                100;
                              const itemTotal = gross - disc + tax;

                              setOrderForm({
                                ...orderForm,
                                selectedItemIndex: itemIdx,
                                title:
                                  it?.title || `Item ${Number(itemIdx) + 1}`,
                                amount: Math.round(itemTotal).toString(),
                                width: it?.width ? it.width.toString() : "",
                                height: it?.height ? it.height.toString() : "",
                                dimensionUnit: it?.dimensionUnit || "inch",
                                quantity: it?.quantity || 1,
                                material: it?.paperType || "",
                                gsm: it?.paperGsm ? it.paperGsm.toString() : "",
                                colors: it?.colors || "CMYK",
                                printSides: it?.printSides || "SINGLE",
                                finishing: it?.finishing || [],
                              });
                            }
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-white border border-indigo-300 text-slate-800 font-semibold text-xs"
                        >
                          <option value="">
                            -- All Items in Quotation (₹
                            {(selectedQ.grandTotalPaise
                              ? selectedQ.grandTotalPaise / 100
                              : selectedQ.totalAmount || 0
                            ).toLocaleString("en-IN")}
                            ) --
                          </option>
                          {selectedQ.items.map((it, idx) => {
                            const gross =
                              (Number(it.quantity) || 1) *
                              (it.unitRatePaise
                                ? it.unitRatePaise / 100
                                : it.rate || 0);
                            const disc =
                              (gross * Number(it.discountPercent || 0)) / 100;
                            const tax =
                              ((gross - disc) *
                                Number(
                                  it.taxRatePercent !== undefined
                                    ? it.taxRatePercent
                                    : 18,
                                )) /
                              100;
                            const itemTotal = Math.round(gross - disc + tax);
                            return (
                              <option key={idx} value={idx.toString()}>
                                Item #{idx + 1}: {it.title} (Qty: {it.quantity}{" "}
                                • ₹{itemTotal.toLocaleString("en-IN")})
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Order Title / Job Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5000 Brochure Printing"
                    value={orderForm.title || ""}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, title: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Total Order Value (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 15000"
                    value={orderForm.amount || ""}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, amount: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              {/* PRODUCT & TECHNICAL SPECIFICATIONS */}
              <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#F95721]" />
                    Product Technical Specifications
                  </span>
                </div>

                {/* 1. Size / Dimensions & Quantity */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div className="sm:col-span-1">
                    <label className="text-slate-700 font-semibold block mb-1">
                      Width
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 8"
                      value={orderForm.width || ""}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, width: e.target.value })
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="text-slate-700 font-semibold block mb-1">
                      Height
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 4"
                      value={orderForm.height || ""}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, height: e.target.value })
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="text-slate-700 font-semibold block mb-1">
                      Unit
                    </label>
                    <select
                      value={orderForm.dimensionUnit || "inch"}
                      onChange={(e) =>
                        setOrderForm({
                          ...orderForm,
                          dimensionUnit: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold"
                    >
                      <option value="inch">Inches (in)</option>
                      <option value="ft">Feet (ft)</option>
                      <option value="mm">Millimeter (mm)</option>
                      <option value="cm">Centimeter (cm)</option>
                      <option value="m">Meter (m)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-1">
                    <label className="text-slate-700 font-semibold block mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="1"
                      value={orderForm.quantity ?? 1}
                      onChange={(e) =>
                        setOrderForm({
                          ...orderForm,
                          quantity: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-bold"
                    />
                  </div>
                </div>

                {/* 2. Material & GSM */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div className="md:col-span-2">
                    <label className="text-slate-700 font-semibold block mb-1">
                      Material / Media Substrate
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Star Flex 440 GSM, Art Card, Vinyl, Canvas..."
                      value={orderForm.material || ""}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, material: e.target.value })
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold"
                    />
                    {/* Quick suggestion pills */}
                    <div className="flex flex-wrap gap-1.5 my-2">
                      {[
                        { label: "Star Flex" },
                        { label: "Vinyl Matte" },
                        { label: "Normal Flex" },
                        { label: "Backlit Film" },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() =>
                            setOrderForm({ ...orderForm, material: item.label })
                          }
                          className="px-2 py-0.5 rounded-md bg-slate-200 hover:bg-orange-100 hover:text-orange-800 text-[10px] text-slate-700 font-medium transition-colors"
                        >
                          + {item.label}
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
                      placeholder="e.g. 440"
                      value={orderForm.gsm || ""}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, gsm: e.target.value })
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold"
                    />
                  </div>
                </div>

                {/* 3. Print Sides */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">
                      Print Sides
                    </label>
                    <select
                      value={orderForm.printSides || "SINGLE"}
                      onChange={(e) =>
                        setOrderForm({
                          ...orderForm,
                          printSides: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold"
                    >
                      <option value="SINGLE">Single Side (Front Only)</option>
                      <option value="DOUBLE">
                        Double Sided (Front &amp; Back)
                      </option>
                    </select>
                  </div>
                </div>

                {/* 4. Finishing (Post-Press) Selection */}
                <div>
                  <label className="text-slate-700 font-semibold block mb-1.5">
                    Finishing / Post-Press Requirements
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Gloss Lamination",
                      "Matte Lamination",
                      "Velvet Lamination",
                      "UV Coating",
                      "Die Cut",
                      "Foiling",
                    ].map((opt) => {
                      const isSelected =
                        Array.isArray(orderForm.finishing) &&
                        orderForm.finishing.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            const cur = Array.isArray(orderForm.finishing)
                              ? orderForm.finishing
                              : [];
                            if (cur.includes(opt)) {
                              setOrderForm({
                                ...orderForm,
                                finishing: cur.filter((x) => x !== opt),
                              });
                            } else {
                              setOrderForm({
                                ...orderForm,
                                finishing: [...cur, opt],
                              });
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                            isSelected
                              ? "bg-[#F95721] text-white border-[#F95721] shadow-xs"
                              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {isSelected ? "✓ " : "+ "}
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Advance Required (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={orderForm.advanceRequiredPercent ?? 50}
                    onChange={(e) =>
                      setOrderForm({
                        ...orderForm,
                        advanceRequiredPercent: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Promised Delivery Date
                  </label>
                  <input
                    type="date"
                    value={orderForm.promisedDeliveryDate || ""}
                    onChange={(e) =>
                      setOrderForm({
                        ...orderForm,
                        promisedDeliveryDate: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Delivery Method
                </label>
                <select
                  value={orderForm.deliveryMethod || "PICKUP"}
                  onChange={(e) =>
                    setOrderForm({
                      ...orderForm,
                      deliveryMethod: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                >
                  <option value="PICKUP">Customer Pickup</option>
                  <option value="STANDARD_DELIVERY">
                    Standard Delivery (Doorstep)
                  </option>
                  <option value="EXPRESS_COURIER">Express Courier</option>
                  <option value="SELF_INSTALLATION">
                    Installation &amp; Fitting
                  </option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateOrderModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {actionLoading
                    ? "Creating Order..."
                    : "Confirm & Create Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD QUOTATION PAYMENT MODAL */}
      {showPaymentModal && (() => {
        const acceptedQuotes = quotations.filter((q) => q.status === "ACCEPTED");
        const activeQuote = quotations.find((q) => q._id === paymentForm.quotationId) || acceptedQuotes[0];
        const qTotal = activeQuote ? (activeQuote.grandTotalPaise ? activeQuote.grandTotalPaise / 100 : activeQuote.totalAmount || 0) : 0;
        const advReq = activeQuote ? (activeQuote.advanceRequiredPaise !== undefined ? activeQuote.advanceRequiredPaise / 100 : Math.round(qTotal * 0.5)) : 0;
        const advRec = activeQuote ? (activeQuote.advanceReceivedPaise || 0) / 100 : 0;
        const totalPaid = activeQuote ? (activeQuote.directPaidPaise || 0) / 100 : advRec;
        const balDue = activeQuote ? (activeQuote.directBalancePaise !== undefined ? activeQuote.directBalancePaise / 100 : Math.max(0, qTotal - totalPaid)) : 0;

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Record Quotation Payment
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Receipt recorded with status:{" "}
                      <strong className="text-amber-700 font-mono">
                        PENDING_VERIFICATION
                      </strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-lg hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              {!activeQuote || acceptedQuotes.length === 0 ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 text-xs">
                  <div className="font-bold flex items-center gap-1.5 text-sm text-amber-950">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> No Accepted Quotation Available
                  </div>
                  <p>
                    Payments are strictly recorded on accepted quotations. Please open the Quotations tab and mark a quotation as <strong>ACCEPTED</strong> first.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setActiveTab("Quotations");
                    }}
                    className="mt-2 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
                  >
                    Go to Quotations Tab
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs">
                  {/* Quotation Selector & Financial Breakdown */}
                  <div className="p-3.5 bg-gradient-to-br from-slate-50 to-slate-100/80 rounded-2xl border border-slate-200/90 space-y-3">
                    {acceptedQuotes.length > 1 ? (
                      <div>
                        <label className="text-slate-700 font-bold block mb-1">
                          Select Accepted Quotation
                        </label>
                        <select
                          value={paymentForm.quotationId || activeQuote._id}
                          onChange={(e) => {
                            const newQId = e.target.value;
                            const newQ = quotations.find((q) => q._id === newQId);
                            if (newQ) {
                              const nTot = newQ.grandTotalPaise ? newQ.grandTotalPaise / 100 : newQ.totalAmount || 0;
                              const nAdvReq = newQ.advanceRequiredPaise !== undefined ? newQ.advanceRequiredPaise / 100 : Math.round(nTot * 0.5);
                              const nAdvRec = (newQ.advanceReceivedPaise || 0) / 100;
                              const nBal = newQ.directBalancePaise !== undefined ? newQ.directBalancePaise / 100 : Math.max(0, nTot - ((newQ.directPaidPaise || 0) / 100));
                              const nStage = nAdvRec < nAdvReq ? "ADVANCE" : "BALANCE";
                              const nDefaultAmt = nStage === "ADVANCE" ? Math.min(nBal, Math.max(0, nAdvReq - nAdvRec)) : nBal;

                              setPaymentForm({
                                ...paymentForm,
                                quotationId: newQId,
                                paymentType: nStage,
                                amount: nDefaultAmt > 0 ? nDefaultAmt.toString() : "",
                                notes: `Payment for Quotation ${newQ.quotationNumber || newQ._id}`,
                              });
                            }
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold"
                        >
                          {acceptedQuotes.map((q) => (
                            <option key={q._id} value={q._id}>
                              {q.quotationNumber || q._id} (₹{(q.grandTotalPaise ? q.grandTotalPaise / 100 : q.totalAmount || 0).toLocaleString("en-IN")})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">
                          Quotation: <span className="font-mono text-indigo-700">{activeQuote.quotationNumber || activeQuote._id}</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ACCEPTED
                        </span>
                      </div>
                    )}

                    {/* 3-metric financial breakdown */}
                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Grand Total</div>
                        <div className="text-xs font-black text-slate-900 mt-0.5 font-mono">
                          ₹{qTotal.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 shadow-2xs">
                        <div className="text-[10px] uppercase font-bold text-emerald-700">Advance Paid</div>
                        <div className="text-xs font-black text-emerald-900 mt-0.5 font-mono">
                          ₹{advRec.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 shadow-2xs">
                        <div className="text-[10px] uppercase font-bold text-amber-700">Balance Due</div>
                        <div className="text-xs font-black text-amber-900 mt-0.5 font-mono">
                          ₹{balDue.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Type Selection (Advance vs Final Balance) */}
                  <div>
                    <label className="text-slate-700 font-bold block mb-1.5">
                      Payment Type *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const halfAmt = Math.min(balDue, Math.max(0, advReq - advRec || Math.round(qTotal * 0.5)));
                          setPaymentForm({
                            ...paymentForm,
                            paymentType: "ADVANCE",
                            amount: halfAmt > 0 ? halfAmt.toString() : paymentForm.amount,
                          });
                        }}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          paymentForm.paymentType === "ADVANCE"
                            ? "bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">1. Advance / Half</span>
                          {advRec >= advReq && <span className="text-[9px] bg-emerald-200 text-emerald-800 px-1 rounded font-bold">Done</span>}
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1">
                          Deposit / Token before starting
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPaymentForm({
                            ...paymentForm,
                            paymentType: "BALANCE",
                            amount: balDue > 0 ? balDue.toString() : paymentForm.amount,
                          });
                        }}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          paymentForm.paymentType === "BALANCE"
                            ? "bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950 font-bold"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">2. Final Balance</span>
                          {balDue <= 0 && <span className="text-[9px] bg-indigo-200 text-indigo-800 px-1 rounded font-bold">Cleared</span>}
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1">
                          Full settlement upon completion
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Amount and Payment Method */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-700 font-bold block">
                          Amount (₹) *
                        </label>
                        {paymentForm.paymentType === "ADVANCE" && balDue > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const half = Math.round(qTotal * 0.5);
                              setPaymentForm({ ...paymentForm, amount: half.toString() });
                            }}
                            className="text-[10px] text-emerald-600 hover:underline font-bold"
                          >
                            Set 50% (₹{Math.round(qTotal * 0.5).toLocaleString("en-IN")})
                          </button>
                        )}
                        {paymentForm.paymentType === "BALANCE" && balDue > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentForm({ ...paymentForm, amount: balDue.toString() });
                            }}
                            className="text-[10px] text-indigo-600 hover:underline font-bold"
                          >
                            Full Balance (₹{balDue.toLocaleString("en-IN")})
                          </button>
                        )}
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        max={balDue > 0 ? balDue : undefined}
                        required
                        placeholder="e.g. 1000"
                        value={paymentForm.amount ?? ""}
                        onChange={(e) =>
                          setPaymentForm({ ...paymentForm, amount: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-slate-700 font-bold block mb-1">
                        Payment Method *
                      </label>
                      <select
                        value={paymentForm.paymentMethod ?? "UPI"}
                        onChange={(e) =>
                          setPaymentForm({
                            ...paymentForm,
                            paymentMethod: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        {PAYMENT_METHODS.map((pm) => (
                          <option key={pm.value} value={pm.value}>
                            {pm.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Ref / UTR & Bank */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-700 font-semibold block mb-1">
                        Transaction Ref / UTR #
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. UPI Ref / Bank UTR #"
                        value={paymentForm.transactionReference ?? ""}
                        onChange={(e) =>
                          setPaymentForm({
                            ...paymentForm,
                            transactionReference: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-slate-700 font-semibold block mb-1">
                        Bank Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. HDFC Bank, SBI..."
                        value={paymentForm.bankName ?? ""}
                        onChange={(e) =>
                          setPaymentForm({
                            ...paymentForm,
                            bankName: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                      />
                    </div>
                  </div>

                  {paymentForm.paymentMethod === "CHEQUE" && (
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                      <div>
                        <label className="text-slate-700 font-semibold block mb-1">
                          Cheque Number *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="6-digit cheque #"
                          value={paymentForm.chequeNumber ?? ""}
                          onChange={(e) =>
                            setPaymentForm({
                              ...paymentForm,
                              chequeNumber: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-700 font-semibold block mb-1">
                          Cheque Date
                        </label>
                        <input
                          type="date"
                          value={paymentForm.chequeDate ?? ""}
                          onChange={(e) =>
                            setPaymentForm({
                              ...paymentForm,
                              chequeDate: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-mono"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">
                      Notes / Remarks
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. 50% advance token paid by client..."
                      value={paymentForm.notes ?? ""}
                      onChange={(e) =>
                        setPaymentForm({ ...paymentForm, notes: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
                    <span className="font-bold text-slate-700 block">
                      Verification Governance Notice:
                    </span>
                    <p>
                      This entry will be created in{" "}
                      <strong className="text-amber-700">
                        PENDING_VERIFICATION
                      </strong>{" "}
                      state. Manager or Admin will verify the deposit before
                      crediting to the quotation balance.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
                      className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading || balDue <= 0}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CreditCard className="w-4 h-4" />
                      {actionLoading
                        ? "Recording..."
                        : paymentForm.paymentType === "ADVANCE"
                        ? "Record Advance Payment"
                        : "Record Final Balance"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        );
      })()}

      {/* COMPLETE FOLLOW-UP MODAL */}
      {showCompleteFollowupModal && completeTargetFollowup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Complete Follow-up
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {completeTargetFollowup.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCompleteFollowupModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCompleteFollowupSubmit}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Call / Interaction Outcome *
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {OUTCOME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Outcome Remarks / Customer Response
                </label>
                <textarea
                  rows={3}
                  placeholder="Record summary of customer conversation, price discussion, or objections..."
                  value={completeForm.outcomeNotes}
                  onChange={(e) =>
                    setCompleteForm({
                      ...completeForm,
                      outcomeNotes: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Next Action
                </label>
                <select
                  value={completeForm.nextAction}
                  onChange={(e) =>
                    setCompleteForm({
                      ...completeForm,
                      nextAction: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold"
                >
                  <option value="NONE">No immediate next follow-up</option>
                  <option value="SCHEDULE_FOLLOWUP">
                    Schedule next follow-up call
                  </option>
                  <option value="SEND_PROPOSAL">
                    Send Quotation / Proposal
                  </option>
                  <option value="CALL_LATER">Call back later today</option>
                </select>
              </div>

              {completeForm.nextAction === "SCHEDULE_FOLLOWUP" && (
                <div className="p-3.5 rounded-md bg-indigo-50/70 border border-indigo-100 space-y-3">
                  <span className="text-[11px] font-bold text-indigo-900 block">
                    Next Follow-up Scheduling
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 block mb-1">Title</label>
                      <input
                        type="text"
                        value={completeForm.nextFollowupTitle}
                        onChange={(e) =>
                          setCompleteForm({
                            ...completeForm,
                            nextFollowupTitle: e.target.value,
                          })
                        }
                        className="w-full px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 block mb-1">
                        Date &amp; Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={completeForm.nextFollowupDate}
                        onChange={(e) =>
                          setCompleteForm({
                            ...completeForm,
                            nextFollowupDate: e.target.value,
                          })
                        }
                        className="w-full px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-slate-800 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompleteFollowupModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {actionLoading ? "Saving..." : "✓ Mark Completed"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Edit Lead Details
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateLead} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Contact / Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.contactName || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditForm({
                        ...editForm,
                        contactName: val,
                      });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Business / Company Name
                  </label>
                  <input
                    type="text"
                    value={editForm.businessName || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditForm({
                        ...editForm,
                        businessName: val,
                      });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone ?? ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Alternate Phone
                  </label>
                  <input
                    type="tel"
                    value={editForm.alternatePhone ?? ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        alternatePhone: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Printing Requirement
                </label>
                <textarea
                  rows={2}
                  value={editForm.requirement ?? ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, requirement: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Expected Sales Value (₹)
                  </label>
                  <input
                    type="number"
                    value={editForm.expectedValue ?? ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        expectedValue: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Priority
                  </label>
                  <select
                    value={editForm.priority ?? "HIGH"}
                    onChange={(e) =>
                      setEditForm({ ...editForm, priority: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#F95721] hover:bg-[#e84915] text-white font-semibold shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE FOLLOWUP MODAL */}
      {showFollowupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Schedule Follow-up
              </h3>
              <button
                onClick={() => setShowFollowupModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleScheduleFollowup}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={followupForm.title ?? ""}
                  onChange={(e) =>
                    setFollowupForm({ ...followupForm, title: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Date &amp; Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={followupForm.scheduledAt ?? ""}
                  onChange={(e) =>
                    setFollowupForm({
                      ...followupForm,
                      scheduledAt: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Agenda / Description
                </label>
                <textarea
                  rows={2}
                  value={followupForm.description ?? ""}
                  onChange={(e) =>
                    setFollowupForm({
                      ...followupForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFollowupModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#F95721] hover:bg-[#e84915] text-white font-semibold shadow-md"
                >
                  Schedule Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG ACTIVITY MODAL */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Log Interaction Note
              </h3>
              <button
                onClick={() => setShowActivityModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Activity Type
                </label>
                <select
                  value={activityForm.type}
                  onChange={(e) =>
                    setActivityForm({ ...activityForm, type: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold"
                >
                  <option value="CALL">Phone Call</option>
                  <option value="WHATSAPP">WhatsApp Chat</option>
                  <option value="EMAIL">Email</option>
                  <option value="MEETING">Meeting</option>
                  <option value="NOTE">General Note</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Summary / Note *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Record summary of call or message..."
                  value={activityForm.description}
                  onChange={(e) =>
                    setActivityForm({
                      ...activityForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#F95721] hover:bg-[#e84915] text-white font-semibold shadow-md"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE STATUS MODAL */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Update Pipeline Status
              </h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Target Stage
                </label>
                <select
                  value={statusForm.status}
                  onChange={(e) =>
                    setStatusForm({ ...statusForm, status: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold"
                >
                  <option value="NEW">New Lead</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="INTERESTED">Interested</option>
                  <option value="QUOTATION_SENT">Quotation Sent</option>
                  <option value="NEGOTIATION">Negotiation</option>
                  <option value="WON">Order Won</option>
                  <option value="LOST">Order Lost</option>
                  <option value="FOLLOW_UP">Follow Up Scheduled</option>
                  <option value="ON_HOLD">On Hold</option>
                </select>
              </div>

              {statusForm.status === "LOST" && (
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Lost Reason *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Budget mismatch, competitor chosen..."
                    value={statusForm.lostReason}
                    onChange={(e) =>
                      setStatusForm({
                        ...statusForm,
                        lostReason: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md"
                >
                  Update Stage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD CLIENT WORK / DOCUMENT MODAL (CLOUDINARY) */}
      {showUploadDocModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Upload Client Work &amp; Files
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Direct Cloudinary storage for client reference photos,
                    artwork &amp; documents
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadDocModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadDocSubmit} className="space-y-4">
              {/* File Dropzone / Picker */}
              <div>
                <label className="text-slate-700 font-bold block mb-1.5">
                  Select File or Photo <span className="text-rose-500">*</span>
                </label>
                <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-md p-4 text-center bg-slate-50/70 transition-all">
                  <input
                    type="file"
                    id="clientDocFileInput"
                    required
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const isImg = file.type.startsWith("image/");
                        const preview = isImg ? URL.createObjectURL(file) : "";
                        setDocForm({
                          ...docForm,
                          file,
                          title: docForm.title || file.name.split(".")[0],
                          previewUrl: preview,
                        });
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="clientDocFileInput"
                    className="cursor-pointer block space-y-2"
                  >
                    {docForm.previewUrl ? (
                      <div className="space-y-2">
                        <img
                          src={docForm.previewUrl}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-xl mx-auto border border-slate-200 shadow-xs"
                        />
                        <p className="text-indigo-600 font-bold text-[11px]">
                          Click to change photo
                        </p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-indigo-500 mx-auto" />
                        <div>
                          <span className="font-bold text-indigo-600 hover:underline">
                            Click to browse
                          </span>{" "}
                          or drag and drop
                          <p className="text-slate-400 text-[10px] mt-0.5">
                            Supports PNG, JPG, WEBP, PDF, CDR/AI previews, ZIP
                            (Max 25 MB)
                          </p>
                        </div>
                      </>
                    )}
                  </label>
                  {docForm.file && (
                    <div className="mt-2 text-[11px] font-semibold text-slate-700 bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-between">
                      <span className="truncate max-w-[280px]">
                        {docForm.file.name}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {(docForm.file.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Document Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Front Store Board Photo, Visiting Card Logo, Approved PO"
                  value={docForm.title}
                  onChange={(e) =>
                    setDocForm({ ...docForm, title: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Category Selector */}
              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Document Category
                </label>
                <select
                  value={docForm.category}
                  onChange={(e) =>
                    setDocForm({ ...docForm, category: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs focus:outline-none"
                >
                  <option value="CLIENT_WORK">
                    📸 Client Work / Photo Reference
                  </option>
                  <option value="PHOTO">🖼️ Sample Picture / Store Photo</option>
                  <option value="ARTWORK">🎨 Artwork &amp; Design Proof</option>
                  <option value="PURCHASE_ORDER">
                    📄 Purchase Order / Signed PO
                  </option>
                  <option value="GST_CERTIFICATE">
                    📑 GST Certificate / Business KYC
                  </option>
                  <option value="OTHER">📂 Other Attachment</option>
                </select>
              </div>

              {/* Description (Optional) */}
              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Notes / Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Add any context or instructions about this client file..."
                  value={docForm.description}
                  onChange={(e) =>
                    setDocForm({ ...docForm, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={uploadingDoc}
                  onClick={() => setShowUploadDocModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingDoc || !docForm.file}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  {uploadingDoc
                    ? "Uploading to Cloudinary..."
                    : "Upload & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REASSIGN LEAD MODAL (Manager / Admin Only) */}
      {showReassignModal && lead && canAssignOrReassign && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#F95721]" />
                Reassign Lead
              </h3>
              <button
                onClick={() => setShowReassignModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReassignLead} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                  Lead
                </span>
                <strong className="text-slate-900 text-sm block mt-0.5">
                  {lead.businessName || lead.contactName || "Lead"} (
                  {lead.phone})
                </strong>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Currently Assigned To:{" "}
                  <strong className="text-slate-700">
                    {lead.assignedToId?.name || "Unassigned"}
                  </strong>
                </span>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Assign To Executive *
                </label>
                <select
                  required
                  value={reassignTargetId}
                  onChange={(e) => setReassignTargetId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium"
                >
                  <option value="">Select Sales Person</option>
                  {salesPersonsList.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.roleSlug || u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Reassignment Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={reassignNotes}
                  onChange={(e) => setReassignNotes(e.target.value)}
                  placeholder="Reason or instructions for the new executive..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReassignModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-[#F95721] hover:bg-[#e84915] text-white font-semibold shadow-md shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? "Reassigning..." : "Confirm Reassignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE LIGHTBOX / PREVIEW MODAL */}
      {selectedImagePreview && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-60 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedImagePreview(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-transparent flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImagePreview}
              alt="Client Asset Preview"
              className="max-h-[82vh] max-w-full rounded-md shadow-2xl object-contain border border-white/20"
            />
            <div className="flex items-center gap-4 mt-3">
              <a
                href={selectedImagePreview}
                target="_blank"
                rel="noreferrer"
                download
                className="px-4 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-lg"
              >
                <Download className="w-3.5 h-3.5" /> Download Full Resolution
              </a>
              <button
                onClick={() => setSelectedImagePreview(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-semibold text-xs"
              >
                Close Preview (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
