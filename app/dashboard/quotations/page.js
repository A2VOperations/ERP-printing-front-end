"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import {
  FileText,
  Plus,
  Search,
  Download,
  Printer,
  Edit3,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Percent,
  Trash2,
  ArrowRight,
  ShieldAlert,
  Send,
  ShoppingBag,
  RotateCcw,
  Check,
  X,
  Share2,
  MessageCircle,
  Layers,
  Package,
  Palette,
  CreditCard,
  Receipt,
} from "lucide-react";

const formatDate = (dateVal) => {
  if (!dateVal) return "-";
  try {
    return new Date(dateVal).toLocaleDateString("en-IN");
  } catch (e) {
    return "-";
  }
};

function QuotationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadIdParam = searchParams.get("leadId") || "";
  const businessNameParam =
    searchParams.get("businessName") || searchParams.get("companyName") || "";
  const contactPersonParam =
    searchParams.get("contactPerson") || searchParams.get("customerName") || "";
  const customerNameParam = contactPersonParam;
  const phoneParam = searchParams.get("phone") || "";

  const [quotations, setQuotations] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dispatchSuccessUrl, setDispatchSuccessUrl] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored =
        typeof window !== "undefined" ? localStorage.getItem("user") : null;
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });
  const [currentTenant, setCurrentTenant] = useState(() => {
    try {
      if (typeof window === "undefined") return null;
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return u?.tenant || JSON.parse(localStorage.getItem("tenant") || "null");
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => {
        if (res?.data?.user) setCurrentUser(res.data.user);
        else if (res?.data) setCurrentUser(res.data);
        if (res?.data?.tenant) setCurrentTenant(res.data.tenant);
      })
      .catch(() => {});

    api
      .get("/settings", { silent: true })
      .then((res) => {
        if (res?.data) {
          const s = res.data;
          setCurrentTenant({
            name: s.companyName || "A2V Prints",
            phone: s.phone || "+91 98765 43210",
            email: s.email || "contact@a2vprinting.com",
            gstin: s.gstin || "27AAAAA0000A1Z5",
            branding: {
              tagline: s.legalEntityName || "",
            },
          });
        }
      })
      .catch(() => {});
  }, []);

  const userRole = (
    currentUser?.roleSlug ||
    currentUser?.role?.name ||
    currentUser?.role ||
    ""
  ).toUpperCase();
  const isCEOOrAdmin = ["ADMIN", "SUPER_ADMIN", "CEO", "CEO_ADMIN"].includes(
    userRole,
  );
  const isManager = ["SALES_MANAGER", "MANAGER"].includes(userRole);

  // Create Modal State
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [newQuote, setNewQuote] = useState({
    leadId: "",
    businessName: "",
    contactPerson: "",
    customerName: "",
    phone: "",
    items: [
      {
        title: "",
        description: "",
        quantity: 1,
        rate: 0,
        discountPercent: 0,
        taxRatePercent: 18,
      },
    ],
    discountPercent: 0,
    validityDays: 15,
    notes: "Standard turn-around 24-48 hours.",
    termsAndConditions:
      "50% advance along with confirmed purchase order. Balance upon pre-dispatch delivery intimation.",
  });

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [editBusinessName, setEditBusinessName] = useState("");
  const [editContactPerson, setEditContactPerson] = useState("");
  const [editItems, setEditItems] = useState([]);
  const [editDiscountPercent, setEditDiscountPercent] = useState(0);
  const [editValidityDays, setEditValidityDays] = useState(15);
  const [editNotes, setEditNotes] = useState("");
  const [editTerms, setEditTerms] = useState("");
  const [editIsRevision, setEditIsRevision] = useState(false);

  // Multi-Order / Convert to Orders State
  const [quoteOrders, setQuoteOrders] = useState([]);
  const [quoteOrdersLoading, setQuoteOrdersLoading] = useState(false);
  const [showConvertOrderModal, setShowConvertOrderModal] = useState(false);
  const [convertQuote, setConvertQuote] = useState(null);
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

  // Quotation payments are recorded against an accepted quotation.
  const [quotePayments, setQuotePayments] = useState([]);
  const [quotePaymentsLoading, setQuotePaymentsLoading] = useState(false);
  const [showDirectPaymentModal, setShowDirectPaymentModal] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [directPaymentForm, setDirectPaymentForm] = useState({
    amount: "",
    paymentMethod: "CASH",
    paymentType: "ADVANCE",
    transactionReference: "",
    bankName: "",
    chequeNumber: "",
    notes: "",
  });


  const fetchQuoteOrders = async (quoteId) => {
    if (!quoteId) {
      setQuoteOrders([]);
      return;
    }
    try {
      setQuoteOrdersLoading(true);
      const res = await api.get(`/quotations/${quoteId}/orders`);
      const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setQuoteOrders(list);
    } catch (err) {
      console.error("Failed to fetch quote orders:", err);
      setQuoteOrders([]);
    } finally {
      setQuoteOrdersLoading(false);
    }
  };

  const fetchQuotePayments = async (quoteId) => {
    if (!quoteId) {
      setQuotePayments([]);
      return;
    }
    try {
      setQuotePaymentsLoading(true);
      const res = await api.get(`/quotations/${quoteId}/payments`);
      const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setQuotePayments(list);
    } catch (err) {
      console.error("Failed to fetch quote direct payments:", err);
      setQuotePayments([]);
    } finally {
      setQuotePaymentsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedQuote?._id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchQuoteOrders(selectedQuote._id);
      fetchQuotePayments(selectedQuote._id);
    } else {
      setQuoteOrders([]);
      setQuotePayments([]);
    }
  }, [selectedQuote?._id]);

  useEffect(() => {
    if (leadIdParam || businessNameParam || contactPersonParam || phoneParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNewQuote((prev) => ({
        ...prev,
        leadId: leadIdParam || prev.leadId,
        businessName: businessNameParam || prev.businessName,
        contactPerson: contactPersonParam || prev.contactPerson,
        customerName: contactPersonParam || businessNameParam || prev.customerName,
        phone: phoneParam || prev.phone,
      }));
      setShowBuilderModal(true);

      // If leadIdParam exists and businessName or contactPerson is missing, fetch full lead record
      if (leadIdParam && (!businessNameParam || !contactPersonParam || !phoneParam)) {
        api
          .get(`/leads/${leadIdParam}`, { silent: true })
          .then((res) => {
            const ld = res?.data?.lead || res?.data;
            if (ld) {
              const bName = ld.businessName || ld.companyName || "";
              const cName = ld.contactName || ld.customerName || "";
              const ph = ld.phone || "";
              setNewQuote((prev) => ({
                ...prev,
                businessName: prev.businessName || bName,
                contactPerson: prev.contactPerson || cName,
                customerName: prev.customerName || cName || bName,
                phone: prev.phone || ph,
              }));
            }
          })
          .catch(() => {});
      }
    }
  }, [leadIdParam, businessNameParam, contactPersonParam, phoneParam]);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const url = leadIdParam
        ? `/quotations?leadId=${encodeURIComponent(leadIdParam)}&limit=100`
        : "/quotations?limit=100";
      const res = await api.get(url);
      if (res && res.data) {
        const list = Array.isArray(res.data)
          ? res.data
          : res.data.records || [];
        setQuotations(list);
        if (list.length > 0) {
          setSelectedQuote((prev) => {
            if (!prev) return list[0];
            const found = list.find((q) => q._id === prev._id);
            return found || list[0];
          });
        } else {
          setSelectedQuote(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch quotations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [leadIdParam]);

  // Creation Item Management
  const handleAddCreateItem = () => {
    setNewQuote({
      ...newQuote,
      items: [
        ...newQuote.items,
        {
          title: "",
          description: "",
          quantity: "",
          rate: "",
          discountPercent: 0,
          taxRatePercent: 18,
        },
      ],
    });
  };

  const handleRemoveCreateItem = (index) => {
    setNewQuote({
      ...newQuote,
      items: newQuote.items.filter((_, idx) => idx !== index),
    });
  };

  const handleCreateQuotation = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.post("/quotations", {
        leadId: newQuote.leadId || leadIdParam || undefined,
        businessName: newQuote.businessName?.trim() || undefined,
        companyName: newQuote.businessName?.trim() || undefined,
        contactPerson: (newQuote.contactPerson?.trim() || newQuote.customerName?.trim()) || undefined,
        customerName: (newQuote.contactPerson?.trim() || newQuote.customerName?.trim() || newQuote.businessName?.trim()) || undefined,
        phone: newQuote.phone,
        items: newQuote.items.map((item) => ({
          title: item.title || item.product || "Print Item",
          description: item.description || "",
          quantity: Number(item.quantity) || 1,
          unitRatePaise: Math.round((Number(item.rate) || 0) * 100),
          discountPercent: Number(
            item.discountPercent || newQuote.discountPercent || 0,
          ),
          taxRatePercent: Number(
            item.taxRatePercent !== undefined ? item.taxRatePercent : 18,
          ),
        })),
        validityDays: Number(newQuote.validityDays) || 15,
        notes: newQuote.notes,
        termsAndConditions: newQuote.termsAndConditions,
      });

      setShowBuilderModal(false);
      setNewQuote({
        leadId: "",
        businessName: "",
        contactPerson: "",
        customerName: "",
        phone: "",
        items: [
          {
            title: "",
            description: "",
            quantity: 1,
            rate: 0,
            discountPercent: 0,
          },
        ],
        discountPercent: 0,
        validityDays: 15,
        notes: "Standard turn-around 24-48 hours upon artwork approval.",
        termsAndConditions:
          "50% advance along with confirmed purchase order. Balance upon pre-dispatch delivery intimation.",
      });
      await fetchQuotations();
    } catch (err) {
      alert(err.message || "Failed to create quotation");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (quote) => {
    if (!quote) return;
    if (quote.status === "ACCEPTED") {
      alert(
        "This quotation has already been accepted and converted into an active order. Accepted quotations cannot be revised. If changes are needed, please create a new quotation.",
      );
      return;
    }
    setEditingQuote(quote);
    setEditBusinessName(
      quote.customerSnapshot?.companyName ||
      quote.leadId?.businessName ||
      quote.customerId?.companyName ||
      ""
    );
    const existingContact =
      quote.customerSnapshot?.contactPerson ||
      quote.customerName ||
      quote.leadId?.contactName ||
      quote.leadId?.customerName ||
      quote.customerId?.contactPerson ||
      (quote.customerSnapshot?.companyName !== quote.customerSnapshot?.displayName
        ? quote.customerSnapshot?.displayName
        : "") ||
      quote.customerId?.displayName ||
      "";
    setEditContactPerson(existingContact);
    const isEditable =
      quote.status === "DRAFT" || quote.status === "PENDING_DISCOUNT_APPROVAL";
    setEditIsRevision(!isEditable);

    const items = (quote.items || []).map((item) => ({
      title: item.title || "Print Item",
      description: item.description || "",
      quantity: item.quantity || 1,
      rate: item.unitRatePaise ? item.unitRatePaise / 100 : item.rate || 0,
      discountPercent: item.discountPercent || 0,
      taxRatePercent:
        item.taxRatePercent !== undefined ? Number(item.taxRatePercent) : 18,
    }));

    setEditItems(
      items.length > 0
        ? items
        : [
            {
              title: "Print Item",
              description: "",
              quantity: 1,
              rate: 100,
              discountPercent: 0,
              taxRatePercent: 18,
            },
          ],
    );
    setEditDiscountPercent(quote.overallDiscountPercent || 0);
    setEditValidityDays(15);
    setEditNotes(
      quote.notes || "Standard turn-around 24-48 hours upon artwork approval.",
    );
    setEditTerms(
      quote.termsAndConditions ||
        "50% advance along with confirmed purchase order.",
    );
    setShowEditModal(true);
  };

  const handleAddEditItem = () => {
    setEditItems([
      ...editItems,
      {
        title: "Brochures A4 Trifold",
        description: "170 GSM Gloss, 4+4 Color",
        quantity: 500,
        rate: 12,
        discountPercent: 0,
        taxRatePercent: 18,
      },
    ]);
  };

  const handleRemoveEditItem = (index) => {
    setEditItems(editItems.filter((_, idx) => idx !== index));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingQuote) return;

    try {
      setActionLoading(true);
      const payload = {
        businessName: editBusinessName?.trim() || undefined,
        companyName: editBusinessName?.trim() || undefined,
        contactPerson: editContactPerson?.trim() || undefined,
        customerName: editContactPerson?.trim() || editBusinessName?.trim() || undefined,
        items: editItems.map((item) => ({
          title: item.title,
          description: item.description,
          quantity: Number(item.quantity) || 1,
          unitRatePaise: Math.round((Number(item.rate) || 0) * 100),
          discountPercent: Number(item.discountPercent || 0),
          taxRatePercent: Number(
            item.taxRatePercent !== undefined ? item.taxRatePercent : 18,
          ),
        })),
        validityDays: Number(editValidityDays) || 15,
        notes: editNotes,
        termsAndConditions: editTerms,
      };

      if (editingQuote.status === "ACCEPTED") {
        alert(
          "This quotation has already been accepted and confirmed into an active order. Accepted quotations cannot be revised.",
        );
        setShowEditModal(false);
        return;
      }

      if (
        editingQuote.status === "DRAFT" ||
        editingQuote.status === "PENDING_DISCOUNT_APPROVAL"
      ) {
        await api.patch(`/quotations/${editingQuote._id}`, payload);
      } else {
        await api.post(`/quotations/${editingQuote._id}/revise`, payload);
      }

      setShowEditModal(false);
      await fetchQuotations();
    } catch (err) {
      alert(err.message || "Failed to update quotation");
    } finally {
      setActionLoading(false);
    }
  };

  // Discount Approval / Rejection Handlers
  const handleDirectApproveDiscount = async (quote) => {
    try {
      setActionLoading(true);
      await api.post(`/quotations/${quote._id}/approve`, {
        notes: "Discount approved by Manager/Admin.",
      });
      const approvedQuote = { ...quote, status: "APPROVED" };
      setSelectedQuote((prev) => (prev?._id === quote._id ? approvedQuote : prev));
      setQuotations((prev) =>
        prev.map((q) => (q._id === quote._id ? approvedQuote : q)),
      );
      if (statusFilter === "PENDING_DISCOUNT_APPROVAL") {
        setStatusFilter("APPROVED");
      }
      await fetchQuotations();
    } catch (err) {
      alert(err.message || "Failed to approve discount");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDirectRejectDiscount = async (quote, reason) => {
    try {
      setActionLoading(true);
      await api.post(`/quotations/${quote._id}/reject`, { reason });
      const rejectedQuote = { ...quote, status: "REJECTED" };
      setSelectedQuote((prev) => (prev?._id === quote._id ? rejectedQuote : prev));
      setQuotations((prev) =>
        prev.map((q) => (q._id === quote._id ? rejectedQuote : q)),
      );
      await fetchQuotations();
    } catch (err) {
      alert(err.message || "Failed to reject discount");
    } finally {
      setActionLoading(false);
    }
  };

  // Send Quotation to Client (Executes on first click without blocking modal prompts)
  const handleSendQuotation = async (quote) => {
    if (!quote?._id || actionLoading) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/quotations/${quote._id}/send`);
      const sentQuotation = res?.data?.quotation || {
        ...quote,
        status: "SENT",
        sentAt: new Date().toISOString(),
      };
      const tokenUrl = res?.data?.acceptanceUrl || "";
      if (tokenUrl) {
        setDispatchSuccessUrl(tokenUrl);
      }

      // Optimistically & immediately update UI state on first click
      setSelectedQuote((prev) =>
        prev?._id === quote._id ? { ...prev, ...sentQuotation } : prev,
      );
      setQuotations((prev) =>
        prev.map((q) => (q._id === quote._id ? { ...q, ...sentQuotation } : q)),
      );

      // If viewing APPROVED tab, advance filter to SENT so quotation remains selected and active
      if (statusFilter === "APPROVED") {
        setStatusFilter("SENT");
      }

      await fetchQuotations();
    } catch (err) {
      alert(err.message || "Failed to send quotation");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Convert to Commercial Order Modal
  const handleOpenConvertOrder = (quote) => {
    const targetQuote = quote || selectedQuote;
    if (!targetQuote) return;

    setConvertQuote(targetQuote);

    const items = targetQuote.items || [];
    const allTitles = items.map((it) => it.title).filter(Boolean).join(", ");
    const totalVal = (
      targetQuote.grandTotalPaise
        ? targetQuote.grandTotalPaise / 100
        : targetQuote.totalAmount || 0
    ).toString();

    const dDeadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const dDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const firstIt = items[0] || {};

    setOrderForm({
      quotationId: targetQuote._id,
      selectedItemIndex: "",
      title: allTitles || firstIt.title || "Commercial Print Order",
      amount: totalVal,
      advanceRequiredPercent: 50,
      promisedDeliveryDate: dDelivery,
      deliveryMethod: "PICKUP",
      notes: targetQuote.notes || "",
      width: firstIt.width ? firstIt.width.toString() : "",
      height: firstIt.height ? firstIt.height.toString() : "",
      dimensionUnit: firstIt.dimensionUnit || "inch",
      quantity: firstIt.quantity || 1,
      material: firstIt.paperType || "",
      gsm: firstIt.paperGsm ? firstIt.paperGsm.toString() : "",
      colors: firstIt.colors || "CMYK",
      printSides: firstIt.printSides || "SINGLE",
      finishing: firstIt.finishing || [],
    });

    setShowConvertOrderModal(true);
  };

  // Submit Create Commercial Order
  const handleCreateOrderSubmit = async (e) => {
    if (e) e.preventDefault();
    const activeQuote =
      quotations.find((q) => q._id === orderForm.quotationId) ||
      convertQuote ||
      selectedQuote;
    if (!activeQuote) return;

    try {
      setActionLoading(true);
      const isSingleItem =
        orderForm.selectedItemIndex !== "" &&
        orderForm.selectedItemIndex !== undefined;

      const payload = {
        leadId: activeQuote.leadId?._id || activeQuote.leadId || undefined,
        customerId:
          activeQuote.customerId?._id ||
          activeQuote.customerId ||
          undefined,
        quotationId: orderForm.quotationId || activeQuote._id,
        selectedItemIndexes: isSingleItem
          ? [Number(orderForm.selectedItemIndex)]
          : undefined,
        allowMultipleOrders: true,
        title: orderForm.title || "Commercial Print Order",
        totalAmount: orderForm.amount ? Number(orderForm.amount) : undefined,
        advanceRequiredPercent:
          Number(orderForm.advanceRequiredPercent) || 50,
        promisedDeliveryDate: orderForm.promisedDeliveryDate || undefined,
        deliveryMethod: orderForm.deliveryMethod || "PICKUP",
        notes: orderForm.notes || "",
        // Technical Specifications
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

      const res = await api.post("/orders", payload);
      alert(
        `Commercial Order ${res.data?.orderNumber || ""} successfully created!`,
      );
      setShowConvertOrderModal(false);
      setSelectedQuote((prev) =>
        prev?._id === activeQuote._id
          ? { ...prev, status: "ACCEPTED", acceptedAt: new Date().toISOString() }
          : prev,
      );
      setQuotations((prev) =>
        prev.map((q) =>
          q._id === activeQuote._id
            ? { ...q, status: "ACCEPTED", acceptedAt: new Date().toISOString() }
            : q,
        ),
      );
      if (statusFilter === "SENT") {
        setStatusFilter("ACCEPTED");
      }
      await fetchQuotations();
      await fetchQuoteOrders(activeQuote._id);
    } catch (err) {
      alert(err.message || "Failed to create commercial order");
    } finally {
      setActionLoading(false);
    }
  };

  const getQuoteAdvanceRequiredPaise = (quote) =>
    Number(
      quote?.advanceRequiredPaise ??
        Math.round((Number(quote?.grandTotalPaise || 0) * 50) / 100),
    );

  const getQuotePaymentStage = (quote) =>
    Number(quote?.advanceReceivedPaise || 0) <
    getQuoteAdvanceRequiredPaise(quote)
      ? "ADVANCE"
      : "BALANCE";

  const hasPendingQuotePayment = (quoteId) =>
    quotePayments.some(
      (payment) =>
        String(payment.quotationId?._id || payment.quotationId) ===
          String(quoteId) &&
        payment.status === "PENDING_VERIFICATION",
    );

  const handleOpenDirectPaymentModal = (targetQuote = selectedQuote) => {
    if (!targetQuote || targetQuote.status !== "ACCEPTED") return;
    const stage = getQuotePaymentStage(targetQuote);
    const balancePaise = Number(
      targetQuote.directBalancePaise ?? targetQuote.grandTotalPaise ?? 0,
    );
    const remainingAdvancePaise = Math.max(
      0,
      getQuoteAdvanceRequiredPaise(targetQuote) -
        Number(targetQuote.advanceReceivedPaise || 0),
    );
    const amountPaise =
      stage === "ADVANCE"
        ? Math.min(balancePaise, remainingAdvancePaise)
        : balancePaise;

    setDirectPaymentForm({
      amount: (amountPaise / 100).toFixed(2),
      paymentMethod: "CASH",
      paymentType: stage,
      transactionReference: "",
      bankName: "",
      chequeNumber: "",
      notes: "",
    });
    setShowDirectPaymentModal(true);
  };

  // Submit Direct Quotation Payment
  const handleRecordDirectPayment = async (e) => {
    if (e) e.preventDefault();
    if (!selectedQuote || selectedQuote.status !== "ACCEPTED") return;
    const enteredAmt = Number(directPaymentForm.amount);
    if (!enteredAmt || enteredAmt <= 0) {
      alert("Please enter a valid payment amount greater than zero.");
      return;
    }

    try {
      setPaymentSubmitting(true);
      const payload = {
        amount: enteredAmt,
        paymentMethod: directPaymentForm.paymentMethod,
        paymentType: directPaymentForm.paymentType,
        transactionReference:
          directPaymentForm.transactionReference || undefined,
        bankName: directPaymentForm.bankName || undefined,
        chequeNumber: directPaymentForm.chequeNumber || undefined,
        notes: directPaymentForm.notes || undefined,
      };

      const res = await api.post(
        `/quotations/${selectedQuote._id}/payments`,
        payload,
      );
      alert(
        `Quotation payment of ₹${enteredAmt.toLocaleString("en-IN")} recorded. (Receipt: ${res.data?.receiptNumber || "Confirmed"})`,
      );
      setShowDirectPaymentModal(false);
      await fetchQuotations();
      await fetchQuotePayments(selectedQuote._id);
      const updatedQuoteRes = await api.get(`/quotations/${selectedQuote._id}`);
      if (updatedQuoteRes.data) {
        setSelectedQuote(updatedQuoteRes.data);
      }
    } catch (err) {
      alert(err.message || "Failed to record direct payment");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Verify Quotation Payment (Manager / Admin)
  const handleVerifyQuotePayment = async (paymentId) => {
    if (!confirm("Confirm and verify this quotation payment? The ledger balance will be updated.")) return;
    try {
      setActionLoading(true);
      await api.post(`/payments/${paymentId}/verify`);
      await fetchQuotations();
      if (selectedQuote?._id) {
        await fetchQuotePayments(selectedQuote._id);
        const updatedRes = await api.get(`/quotations/${selectedQuote._id}`);
        if (updatedRes.data) setSelectedQuote(updatedRes.data);
      }
    } catch (err) {
      alert(err.message || "Failed to verify quotation payment");
    } finally {
      setActionLoading(false);
    }
  };

  // Mark Client Accepted (Opens item selection and order creation)
  const handleMarkClientAccepted = (quote) => {
    handleOpenConvertOrder(quote);
  };

  // Mark Client Declined (Not Accepted)
  const handleMarkNotAccepted = async (quote) => {
    const reason = prompt("Please enter reason why client declined:");
    if (!reason || !reason.trim()) return;
    try {
      setActionLoading(true);
      await api.post(`/quotations/${quote._id}/not-accepted`, {
        reason: reason.trim(),
      });
      alert("Quotation marked NOT_ACCEPTED.");
      await fetchQuotations();
    } catch (err) {
      alert(err.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter list
  const filteredQuotes = quotations.filter((q) => {
    const qNum = (q.quotationNumber || "").toLowerCase();
    const cName = (
      q.customerSnapshot?.displayName ||
      q.customerSnapshot?.companyName ||
      q.customerName ||
      ""
    ).toLowerCase();
    const matchesSearch =
      !searchQuery ||
      qNum.includes(searchQuery.toLowerCase()) ||
      cName.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || q.status === statusFilter;

    let matchesLead = true;
    if (leadIdParam) {
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
      matchesLead =
        qLeadId === leadIdParam.toString() ||
        (qLeadNumber && qLeadNumber === leadIdParam.toString());
    }

    return matchesSearch && matchesStatus && matchesLead;
  });

  // Calculate live edit totals with dynamic per-item GST
  const editSubtotal = editItems.reduce(
    (sum, item) =>
      sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0),
    0,
  );
  const editDiscountAmount = editItems.reduce((sum, item) => {
    const gross = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
    const disc = Number(
      item.discountPercent !== undefined
        ? item.discountPercent
        : editDiscountPercent || 0,
    );
    return sum + (gross * disc) / 100;
  }, 0);
  const editTaxable = Math.max(0, editSubtotal - editDiscountAmount);
  const editGst = editItems.reduce((sum, item) => {
    const gross = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
    const disc = Number(
      item.discountPercent !== undefined
        ? item.discountPercent
        : editDiscountPercent || 0,
    );
    const taxable = Math.max(0, gross - (gross * disc) / 100);
    const taxRate = Number(
      item.taxRatePercent !== undefined ? item.taxRatePercent : 18,
    );
    return sum + (taxable * taxRate) / 100;
  }, 0);
  const editGrandTotal = editTaxable + editGst;

  // Calculate live builder totals with dynamic per-item GST
  const builderSubtotal = newQuote.items.reduce(
    (sum, item) =>
      sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0),
    0,
  );
  const builderDiscountAmount = newQuote.items.reduce((sum, item) => {
    const gross = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
    const disc = Number(
      item.discountPercent !== undefined
        ? item.discountPercent
        : newQuote.discountPercent || 0,
    );
    return sum + (gross * disc) / 100;
  }, 0);
  const builderTaxable = Math.max(0, builderSubtotal - builderDiscountAmount);
  const builderGst = newQuote.items.reduce((sum, item) => {
    const gross = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
    const disc = Number(
      item.discountPercent !== undefined
        ? item.discountPercent
        : newQuote.discountPercent || 0,
    );
    const taxable = Math.max(0, gross - (gross * disc) / 100);
    const taxRate = Number(
      item.taxRatePercent !== undefined ? item.taxRatePercent : 18,
    );
    return sum + (taxable * taxRate) / 100;
  }, 0);
  const builderGrandTotal = builderTaxable + builderGst;

  // Selected Quote Resolved Values
  const tenantName = currentTenant?.name || "A2V Prints";
  const tenantTagline =
    currentTenant?.branding?.tagline ||
    "Print your identity and build your brand. ";
  const tenantPhone = currentTenant?.phone || "+91 98765 43210";
  const tenantEmail = currentTenant?.email || "contact@a2vprinting.com";
  const tenantGstin = currentTenant?.gstin || "27AAAAA0000A1Z5";
  const tenantLogo =
    currentTenant?.logoUrl ||
    currentTenant?.branding?.logoUrl ||
    "/logo/A2V  Groups Logo.png";

  const snap = selectedQuote?.customerSnapshot || {};
  const clientCompany = (
    snap.companyName ||
    selectedQuote?.leadId?.businessName ||
    selectedQuote?.customerId?.companyName ||
    ""
  ).trim();
  let resolvedContact = (
    snap.contactPerson ||
    selectedQuote?.customerName ||
    selectedQuote?.leadId?.contactName ||
    selectedQuote?.leadId?.customerName ||
    selectedQuote?.customerId?.contactPerson ||
    ""
  ).trim();

  if (clientCompany && resolvedContact.toLowerCase() === clientCompany.toLowerCase()) {
    const leadContact = (selectedQuote?.leadId?.contactName || "").trim();
    const custContact = (selectedQuote?.customerId?.contactPerson || "").trim();
    if (leadContact && leadContact.toLowerCase() !== clientCompany.toLowerCase()) {
      resolvedContact = leadContact;
    } else if (custContact && custContact.toLowerCase() !== clientCompany.toLowerCase()) {
      resolvedContact = custContact;
    }
  }

  const clientContact = resolvedContact;
  const clientDisplayName =
    clientContact ||
    (snap.displayName && snap.displayName.toLowerCase() !== clientCompany.toLowerCase() ? snap.displayName : "") ||
    (selectedQuote?.customerId?.displayName && selectedQuote?.customerId?.displayName.toLowerCase() !== clientCompany.toLowerCase() ? selectedQuote?.customerId?.displayName : "") ||
    selectedQuote?.customerName ||
    "Contact Person";
  const clientPhone =
    snap.phone ||
    selectedQuote?.phone ||
    selectedQuote?.leadId?.phone ||
    selectedQuote?.customerId?.phone ||
    "Not provided";
  const clientEmail =
    snap.email ||
    selectedQuote?.leadId?.email ||
    selectedQuote?.customerId?.email ||
    "Not provided";
  const clientGstin =
    snap.gstin ||
    selectedQuote?.customerId?.gstin ||
    "Unregistered";

  const salesRep = selectedQuote?.assignedSalesId || {};
  const salesRepName = salesRep.name || "";
  const salesRepEmail = salesRep.email || "";
  const salesRepPhone = salesRep.phone || "";

  const quoteCreatedAt = formatDate(selectedQuote?.createdAt);
  const quoteValidUntil = formatDate(selectedQuote?.validUntil);

  const subtotalVal =
    selectedQuote?.subtotalPaise !== undefined
      ? selectedQuote.subtotalPaise / 100
      : (selectedQuote?.items || []).reduce(
          (sum, it) =>
            sum +
            (it.grossAmountPaise
              ? it.grossAmountPaise / 100
              : (Number(it.quantity) || 1) *
                (it.unitRatePaise ? it.unitRatePaise / 100 : it.rate || 0)),
          0,
        );
  const discountVal =
    selectedQuote?.discountTotalPaise !== undefined
      ? selectedQuote.discountTotalPaise / 100
      : (selectedQuote?.items || []).reduce(
          (sum, it) =>
            sum + (it.discountAmountPaise ? it.discountAmountPaise / 100 : 0),
          0,
        );
  const taxableVal =
    selectedQuote?.taxableTotalPaise !== undefined
      ? selectedQuote.taxableTotalPaise / 100
      : subtotalVal - discountVal;
  const cgstVal =
    selectedQuote?.cgstTotalPaise !== undefined
      ? selectedQuote.cgstTotalPaise / 100
      : 0;
  const sgstVal =
    selectedQuote?.sgstTotalPaise !== undefined
      ? selectedQuote.sgstTotalPaise / 100
      : 0;
  const igstVal =
    selectedQuote?.igstTotalPaise !== undefined
      ? selectedQuote.igstTotalPaise / 100
      : 0;
  const grandTotalVal =
    selectedQuote?.grandTotalPaise !== undefined
      ? selectedQuote.grandTotalPaise / 100
      : selectedQuote?.totalAmount || taxableVal + cgstVal + sgstVal + igstVal;

  const getStatusBadge = (st) => {
    switch (st) {
      case "APPROVED":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "SENT":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "ACCEPTED":
        return "bg-green-100 text-green-900 border-green-400 font-black";
      case "PENDING_DISCOUNT_APPROVAL":
        return "bg-amber-100 text-amber-800 border-amber-300 animate-pulse";
      case "NOT_ACCEPTED":
      case "REJECTED":
        return "bg-rose-100 text-rose-800 border-rose-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-md bg-orange-50 text-[#F95721] flex items-center justify-center border border-orange-100">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Quotations &amp; Commercial Studio
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Discount approval governance (≤5% Direct, 5-15% Manager,
                  &gt;15% Admin), send dispatch, and client acceptance
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchQuotations}
                disabled={loading}
                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs transition-all"
                title="Refresh Quotations"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin text-[#F95721]" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "ALL", label: "All Quotations" },
              { id: "APPROVED", label: "Approved (Ready to Send)" },
              {
                id: "PENDING_DISCOUNT_APPROVAL",
                label: "Pending Discount Approval",
              },
              { id: "SENT", label: "Sent to Client" },
              { id: "ACCEPTED", label: "Accepted by Client" },
              { id: "NOT_ACCEPTED", label: "Not Accepted" },
              { id: "REJECTED", label: "Rejected" },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === st.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {leadIdParam && (
            <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 text-indigo-800 px-4 py-2.5 rounded-2xl text-xs font-medium shadow-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-950">
                  Filtered strictly for Lead:
                </span>
                <span className="bg-indigo-200/70 text-indigo-900 px-2.5 py-0.5 rounded-lg font-mono font-semibold text-[11px]">
                  {leadIdParam}
                </span>
              </div>
              <button
                onClick={() => router.push("/dashboard/quotations")}
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-950 underline cursor-pointer"
              >
                Clear Filter & Show All
              </button>
            </div>
          )}

          {/* 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Quotation List */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Proposals Collection
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Showing {filteredQuotes.length} of {quotations.length}{" "}
                    quotes
                  </span>
                </div>
                <div className="relative w-44">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search quote #, client..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#F95721]"
                  />
                </div>
              </div>

              {/* Quotations Cards */}
              <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
                {filteredQuotes.map((item) => {
                  const isSelected = selectedQuote?._id === item._id;
                  const total = (
                    item.grandTotalPaise
                      ? item.grandTotalPaise / 100
                      : item.totalAmount || 0
                  ).toLocaleString("en-IN");
                  const compName = (
                    item.customerSnapshot?.companyName ||
                    item.leadId?.businessName ||
                    item.customerId?.companyName ||
                    ""
                  ).trim();
                  let contPerson = (
                    item.customerSnapshot?.contactPerson ||
                    item.customerName ||
                    item.leadId?.contactName ||
                    item.leadId?.customerName ||
                    item.customerId?.contactPerson ||
                    ""
                  ).trim();
                  if (compName && contPerson.toLowerCase() === compName.toLowerCase()) {
                    const alt = (item.leadId?.contactName || item.customerId?.contactPerson || "").trim();
                    if (alt && alt.toLowerCase() !== compName.toLowerCase()) {
                      contPerson = alt;
                    }
                  }
                  const client =
                    contPerson ||
                    (item.customerSnapshot?.displayName && item.customerSnapshot?.displayName.toLowerCase() !== compName.toLowerCase() ? item.customerSnapshot?.displayName : "") ||
                    item.customerName ||
                    compName ||
                    "Direct Customer";

                  return (
                    <div
                      key={item._id}
                      onClick={() => setSelectedQuote(item)}
                      className={`p-4 rounded-md border transition-all cursor-pointer space-y-2.5 ${
                        isSelected
                          ? "bg-orange-50/70 border-orange-400 shadow-xs ring-1 ring-orange-400/30"
                          : "bg-white hover:bg-slate-50/80 border-slate-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-extrabold text-slate-900">
                              {item.quotationNumber || "QT-DRAFT"}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              v{item.version || 1}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-800 text-sm mt-0.5 truncate max-w-[200px]">
                            {client}
                          </h4>
                          {compName && compName.toLowerCase() !== (contPerson || "").toLowerCase() && (
                            <span className="text-[11px] text-slate-500 font-medium block truncate max-w-[200px]">
                              Shop: <span className="text-slate-700 font-semibold">{compName}</span>
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {formatDate(item.createdAt)} •{" "}
                            {item.items?.length || 1} Items
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(item.status)}`}
                        >
                          {item.status?.replace(/_/g, " ")}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-500 text-[11px]">
                          Grand Total
                        </span>
                        <div className="text-right">
                          <strong className="font-mono font-bold text-slate-900 block">
                            ₹{total}
                          </strong>
                          {item.status === "ACCEPTED" ? (
                            (() => {
                              const bPaise = item.directBalancePaise !== undefined ? item.directBalancePaise : Math.max(0, (item.grandTotalPaise || 0) - (item.directPaidPaise || 0));
                              const advRec = (item.advanceReceivedPaise || 0) / 100;
                              const balDue = bPaise / 100;
                              const isPaid = balDue <= 0 && ((item.directPaidPaise || 0) > 0 || advRec > 0);

                              if (isPaid) {
                                return (
                                  <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 inline-block mt-0.5">
                                    ✓ Fully Paid
                                  </span>
                                );
                              }
                              if (advRec > 0) {
                                return (
                                  <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 inline-block mt-0.5">
                                    Adv: ₹{advRec.toLocaleString("en-IN")} · Bal: ₹{balDue.toLocaleString("en-IN")}
                                  </span>
                                );
                              }
                              return (
                                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block mt-0.5">
                                  Bal: ₹{balDue.toLocaleString("en-IN")}
                                </span>
                              );
                            })()
                          ) : (
                            item.directPaidPaise > 0 && (
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                                Paid: ₹
                                {(item.directPaidPaise / 100).toLocaleString(
                                  "en-IN",
                                )}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredQuotes.length === 0 && !loading && (
                  <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                    <p>No matching quotations found.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Quotation Sheet & Action Center */}
            <div className="lg:col-span-7 space-y-6">
              {selectedQuote ? (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden animate-fade-in">
                  {/* Action Top Bar */}
                  <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-300 border border-orange-400/30">
                        OFFICIAL QUOTATION
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-200">
                        {selectedQuote.quotationNumber} (v
                        {selectedQuote.version || 1})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedQuote.status !== "ACCEPTED" ? (
                        <button
                          onClick={() => handleOpenEdit(selectedQuote)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-orange-400" />
                          {selectedQuote.status === "DRAFT" ||
                          selectedQuote.status === "PENDING_DISCOUNT_APPROVAL"
                            ? "Edit Quotation"
                            : "Revise Version"}
                        </button>
                      ) : (
                        <span
                          title="Accepted quotation with generated orders."
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Accepted ({quoteOrders.length} Order
                          {quoteOrders.length === 1 ? "" : "s"})
                        </span>
                      )}

                      <button
                        onClick={async () => {
                          try {
                            await api.downloadPdf(
                              `/quotations/${selectedQuote._id}/pdf`,
                              `Quotation-${selectedQuote.quotationNumber || selectedQuote._id}.pdf`,
                            );
                          } catch (err) {
                            alert(err.message || "Failed to download PDF");
                          }
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#F95721] hover:bg-[#e84915] text-white text-xs font-semibold shadow-xs transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download PDF
                      </button>

                      <button
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print
                      </button>
                    </div>
                  </div>

                  {/* LIFECYCLE ACTION BANNERS BASED ON QUOTATION STATUS */}

                  {/* 1. Pending Approval Banner */}
                  {selectedQuote.status === "PENDING_DISCOUNT_APPROVAL" &&
                    (() => {
                      const discountVal =
                        selectedQuote.overallDiscountPercent ||
                        Math.round(
                          (selectedQuote.governingDiscountBps || 0) / 100,
                        );
                      const isExceedingManagerLimit = discountVal > 15;
                      const canUserApprove =
                        isCEOOrAdmin || (isManager && !isExceedingManagerLimit);

                      return (
                        <div className="p-4 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                            <div>
                              <strong className="block text-amber-950 font-bold">
                                Discount Approval Required ({discountVal}%
                                Concession):
                              </strong>
                              <span className="text-[11px] text-amber-800">
                                {isExceedingManagerLimit
                                  ? "Exceeds 15% manager limit — requires CEO / Admin authorization only."
                                  : "Requires Manager / Admin authorization (5% to 15% discount)."}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {canUserApprove ? (
                              <>
                                <button
                                  onClick={() =>
                                    handleDirectApproveDiscount(selectedQuote)
                                  }
                                  disabled={actionLoading}
                                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-4 h-4" />✓ Approve
                                  Discount
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt(
                                      "Please enter rejection reason:",
                                    );
                                    if (reason && reason.trim()) {
                                      handleDirectRejectDiscount(
                                        selectedQuote,
                                        reason.trim(),
                                      );
                                    }
                                  }}
                                  disabled={actionLoading}
                                  className="px-3.5 py-2 rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs transition-all flex items-center gap-1"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300">
                                🔒 Requires Admin Approval (&gt;15%)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                  {/* 2. Approved Banner (Ready to Send by Sales) */}
                  {selectedQuote.status === "APPROVED" && (
                    <div className="p-4 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <strong className="block text-emerald-950 font-bold">
                            Quotation is Approved &amp; Ready to Send
                          </strong>
                          <span className="text-[11px] text-emerald-800">
                            Sales representative can now dispatch the official
                            quotation to the customer.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenConvertOrder(selectedQuote)}
                          disabled={actionLoading}
                          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Convert selected quotation items into orders"
                        >
                          <Layers className="w-4 h-4" />
                          Convert Item to Order
                        </button>
                        <button
                          onClick={() => handleSendQuotation(selectedQuote)}
                          disabled={actionLoading}
                          className="px-5 py-2 rounded-xl bg-[#F95721] hover:bg-[#e84915] disabled:opacity-60 text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          {actionLoading ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Sending to Client...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              🚀 Send to Client
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3. Sent Banner (Awaiting Client Acceptance or Rejection) */}
                  {selectedQuote.status === "SENT" && (
                    <div className="p-4 bg-orange-50 border-b border-orange-200 text-orange-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-5 h-5 text-[#F95721] shrink-0" />
                        <div>
                          <strong className="block text-orange-950 font-bold text-sm">
                            Quotation Sent to Client
                          </strong>
                          <span className="text-[11px] text-orange-800">
                            Awaiting client review and digital acceptance.
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() =>
                            handleOpenConvertOrder(selectedQuote)
                          }
                          disabled={actionLoading}
                          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Convert selected quotation items into orders"
                        >
                          <Layers className="w-4 h-4" />
                          Convert Item to Order
                        </button>
                        <button
                          onClick={() => handleMarkNotAccepted(selectedQuote)}
                          disabled={actionLoading}
                          className="px-3 py-2 rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-4 h-4" />Not Accepted
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 4. Accepted Banner */}
                  {selectedQuote.status === "ACCEPTED" && (
                    <div className="p-4 bg-green-50 border-b border-green-200 text-green-950 text-xs flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                        <div>
                          <strong className="block font-bold">
                            ✓ Quotation Accepted by Client ({quoteOrders.length}{" "}
                            Order{quoteOrders.length === 1 ? "" : "s"} Created)
                          </strong>
                          <span className="text-[11px] text-green-800">
                            Commercial deal closed. You can create multiple
                            orders for specific items and assign them to
                            separate orders.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {Number(selectedQuote.directBalancePaise ?? selectedQuote.grandTotalPaise ?? 0) > 0 ? (
                          <button
                            onClick={() => handleOpenDirectPaymentModal(selectedQuote)}
                            disabled={paymentSubmitting || hasPendingQuotePayment(selectedQuote._id)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            {hasPendingQuotePayment(selectedQuote._id)
                              ? "Payment Awaiting Verification"
                              : getQuotePaymentStage(selectedQuote) === "ADVANCE"
                                ? "Record Advance Payment"
                                : "Record Final Balance"}
                          </button>
                        ) : (
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1 border border-emerald-300">
                            ✓ Fully Paid
                          </span>
                        )}
                        <button
                          onClick={() => handleOpenConvertOrder(selectedQuote)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Create Another Order
                        </button>
                        <Link
                          href={`/dashboard/orders`}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          View in Orders →
                        </Link>
                      </div>
                    </div>
                  )}

                  {selectedQuote.status === "ACCEPTED" && (
                    <div className="p-4 bg-white border-b border-slate-200 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="block text-slate-500">Advance Required</span>
                          <strong className="block mt-1 font-mono text-slate-900">₹{(getQuoteAdvanceRequiredPaise(selectedQuote) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                          <span className="block text-emerald-700">Advance Received</span>
                          <strong className="block mt-1 font-mono text-emerald-900">₹{((selectedQuote.advanceReceivedPaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                        </div>
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                          <span className="block text-amber-700">Final Balance Due</span>
                          <strong className="block mt-1 font-mono text-amber-900">₹{((selectedQuote.directBalancePaise ?? selectedQuote.grandTotalPaise ?? 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-slate-800">Quotation Payment History</h4>
                        {quotePaymentsLoading ? (
                          <p className="text-xs text-slate-500">Loading payment history...</p>
                        ) : quotePayments.length === 0 ? (
                          <p className="text-xs text-slate-500">No payments recorded for this quotation.</p>
                        ) : (
                          quotePayments.map((payment) => (
                            <div key={payment._id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                              <div>
                                <span className="font-semibold text-slate-800 block">
                                  {payment.paymentType === "ADVANCE" ? "Advance Deposit" : "Final Balance"} · {payment.receiptNumber || "Receipt pending"}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                    payment.status === "CONFIRMED"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : payment.status === "PENDING_VERIFICATION"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-slate-100 text-slate-600 border-slate-200"
                                  }`}>
                                    {payment.status?.replace(/_/g, " ")}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {payment.paymentMethod} {payment.transactionReference ? `• Ref: ${payment.transactionReference}` : ""}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-900 text-sm">₹{((payment.amountPaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                {payment.status === "PENDING_VERIFICATION" && (isManager || isCEOOrAdmin) && (
                                  <button
                                    onClick={() => handleVerifyQuotePayment(payment._id)}
                                    disabled={actionLoading}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-all cursor-pointer"
                                  >
                                    Verify
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* 5. Not Accepted / Rejected Banner */}
                  {(selectedQuote.status === "NOT_ACCEPTED" ||
                    selectedQuote.status === "REJECTED") && (
                    <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-950 text-xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        <div>
                          <strong className="block font-bold">
                            {selectedQuote.status === "NOT_ACCEPTED"
                              ? "Client Declined Quotation"
                              : "Quotation Discount Rejected"}
                          </strong>
                          <span className="text-[11px] text-rose-800">
                            {selectedQuote.rejectedReason ||
                              selectedQuote.rejectionReason ||
                              "No reason specified."}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenEdit(selectedQuote)}
                        className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Revise Proposal
                      </button>
                    </div>
                  )}

                  {/* Formal Quotation Document Body (Mirroring the Official PDF Document) */}
                  <div className="p-6 md:p-8 space-y-6 text-xs text-slate-700 bg-white">
                    {/* Header Banner matching PDF */}
                    <div className="rounded-md p-5 md:p-6 bg-linear-to-r from-[#F95721] to-[#FF7043] text-white shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-lg bg-white p-2 shadow-xs flex items-center justify-center shrink-0 border border-white/20">
                          <img
                            src={tenantLogo}
                            alt="Logo"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div>
                          <h2 className="text-xl md:text-2xl font-black tracking-tight">
                            {tenantName}
                          </h2>
                          <p className="text-orange-100 text-xs mt-0.5 font-medium">
                            {tenantTagline}
                          </p>
                        </div>
                      </div>

                      <div className="text-left md:text-right bg-white/10 backdrop-blur-xs border border-white/20 px-4 py-2.5 rounded-xl space-y-0.5">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-orange-200 block">
                          COMMERCIAL QUOTATION
                        </span>
                        <div className="font-mono font-bold text-white text-xs">
                          No: {selectedQuote.quotationNumber || "QT-DRAFT"} (v
                          {selectedQuote.version || 1})
                        </div>
                        <div className="text-[11px] text-orange-100">
                          Date Issued: {quoteCreatedAt}
                        </div>
                        <div className="text-[11px] text-orange-200 font-semibold">
                          Valid Until: {quoteValidUntil}
                        </div>
                      </div>
                    </div>

                    {/* Two-Column Seller & Client Particulars */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2 border-b border-slate-200">
                      {/* Seller (Left) */}
                      <div className="p-4 rounded-md bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                          ISSUED BY:
                        </span>
                        <div className="flex items-center gap-2 mb-1">
                          <img
                            src={tenantLogo}
                            alt="Logo"
                            className="w-5 h-5 object-contain shrink-0"
                          />
                          <strong className="text-slate-900 text-sm block font-bold">
                            {tenantName}
                          </strong>
                        </div>
                        <div className="text-slate-600 text-xs">
                          Phone:{" "}
                          <span className="font-medium text-slate-800">
                            {tenantPhone}
                          </span>
                        </div>
                        <div className="text-slate-600 text-xs">
                          Email:{" "}
                          <span className="font-medium text-slate-800">
                            {tenantEmail}
                          </span>
                        </div>
                        <div className="text-slate-600 text-xs">
                          GSTIN:{" "}
                          <span className="font-mono font-semibold text-slate-800">
                            {tenantGstin}
                          </span>
                        </div>
                      </div>

                      {/* Customer (Right) */}
                      <div className="p-4 rounded-md bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                          PREPARED FOR:
                        </span>
                        <strong className="text-slate-900 text-sm block font-bold">
                          {clientContact || clientDisplayName}
                        </strong>
                        {clientCompany && clientCompany.toLowerCase() !== (clientContact || "").toLowerCase() && (
                          <div className="text-slate-600 text-xs font-medium">
                            Shop / Business:{" "}
                            <span className="text-slate-800 font-semibold">
                              {clientCompany}
                            </span>
                          </div>
                        )}
                        <div className="text-slate-600 text-xs">
                          Phone:{" "}
                          <span className="font-medium text-slate-800">
                            {clientPhone}
                          </span>
                          {clientEmail && clientEmail !== "Not provided" && (
                            <span>
                              {" "}
                              | Email:{" "}
                              <span className="font-medium text-slate-800">
                                {clientEmail}
                              </span>
                            </span>
                          )}
                        </div>

                        {salesRepName && (
                          <div className="text-[11px] text-slate-500 pt-0.5 border-t border-slate-200 mt-1">
                            Sales Rep:{" "}
                            <strong className="text-slate-700">
                              {salesRepName}
                            </strong>{" "}
                            {salesRepEmail && `(${salesRepEmail})`}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Items Table matching PDF columns */}
                    <div className="border border-slate-200 rounded-md overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                            <th className="py-3 px-3 text-center w-10">#</th>
                            <th className="py-3 px-4">
                              ITEM &amp; SPECIFICATIONS
                            </th>
                            <th className="py-3 px-3 text-right">QTY</th>
                            <th className="py-3 px-3 text-right">RATE (₹)</th>
                            <th className="py-3 px-3 text-right">DISC (₹)</th>
                            <th className="py-3 px-3 text-right">
                              TAXABLE (₹)
                            </th>
                            <th className="py-3 px-3 text-right">TAX (₹)</th>
                            <th className="py-3 px-4 text-right">TOTAL (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(selectedQuote.items || []).map((item, idx) => {
                            const qty = Number(item.quantity) || 1;
                            const unitRate =
                              item.unitRatePaise !== undefined
                                ? item.unitRatePaise / 100
                                : Number(item.rate || 0);
                            const gross =
                              item.grossAmountPaise !== undefined
                                ? item.grossAmountPaise / 100
                                : qty * unitRate;
                            const disc =
                              item.discountAmountPaise !== undefined
                                ? item.discountAmountPaise / 100
                                : (gross * Number(item.discountPercent || 0)) /
                                  100;
                            const taxable =
                              item.taxableAmountPaise !== undefined
                                ? item.taxableAmountPaise / 100
                                : gross - disc;
                            const tax =
                              item.taxAmountPaise !== undefined
                                ? item.taxAmountPaise / 100
                                : (taxable *
                                    Number(item.taxRatePercent || 18)) /
                                  100;
                            const lineTotal =
                              item.itemTotalPaise !== undefined
                                ? item.itemTotalPaise / 100
                                : taxable + tax;

                            const specs = [];
                            if (item.paperGsm)
                              specs.push(
                                `${item.paperGsm} GSM ${item.paperType || ""}`.trim(),
                              );
                            if (item.width && item.height)
                              specs.push(
                                `${item.width}x${item.height} ${item.dimensionUnit || "inch"}`,
                              );
                            if (item.printSides && item.printSides !== "NA")
                              specs.push(
                                item.printSides === "SINGLE"
                                  ? "Single Side"
                                  : "Double Side",
                              );
                            if (item.colors) specs.push(item.colors);
                            if (item.finishing?.length)
                              specs.push(
                                `Finishing: ${Array.isArray(item.finishing) ? item.finishing.join(", ") : item.finishing}`,
                              );

                            return (
                              <tr
                                key={idx}
                                className="hover:bg-slate-50/70 transition-colors"
                              >
                                <td className="py-3 px-3 text-center text-slate-400 font-mono font-medium">
                                  {idx + 1}
                                </td>
                                <td className="py-3 px-4">
                                  <strong className="text-slate-900 block font-bold text-xs">
                                    {item.title || "Print Item"}
                                  </strong>
                                  {item.description && (
                                    <span className="text-[11px] text-slate-500 block mt-0.5">
                                      {item.description}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-right font-semibold text-slate-800 font-mono">
                                  {qty}
                                </td>
                                <td className="py-3 px-3 text-right font-mono text-slate-700">
                                  ₹
                                  {unitRate.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td className="py-3 px-3 text-right font-mono text-slate-600">
                                  {disc > 0 ? (
                                    <span>
                                      ₹
                                      {disc.toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                      {item.discountPercent ? (
                                        <span className="text-[10px] text-slate-400 block font-normal">
                                          ({item.discountPercent}%)
                                        </span>
                                      ) : null}
                                    </span>
                                  ) : (
                                    "-"
                                  )}
                                </td>
                                <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                                  ₹
                                  {taxable.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td className="py-3 px-3 text-right font-mono text-slate-600">
                                  ₹
                                  {tax.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                  {item.taxRatePercent ? (
                                    <span className="text-[10px] text-slate-400 block font-normal">
                                      ({item.taxRatePercent}%)
                                    </span>
                                  ) : null}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                                  ₹
                                  {lineTotal.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Totals & Notes Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 items-start">
                      {/* Notes & Terms Box */}
                      <div className="p-4 rounded-md bg-slate-50 border border-slate-200/80 space-y-3">
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">
                            SPECIAL NOTES / INSTRUCTIONS
                          </span>
                          <p className="text-slate-700 text-xs leading-relaxed">
                            {selectedQuote.notes ||
                              "Standard turn-around 24-48 hours upon client artwork approval."}
                          </p>
                        </div>

                        <div className="pt-2.5 border-t border-slate-200">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">
                            TERMS &amp; CONDITIONS
                          </span>
                          <p className="text-slate-600 text-[11px] leading-relaxed whitespace-pre-line">
                            {selectedQuote.termsAndConditions ||
                              "1. Quotation valid for 15 days from issuance.\n2. 50% advance along with purchase order. Balance prior to delivery.\n3. Custom manufactured materials cannot be cancelled once processed."}
                          </p>
                          <div className="mt-2 text-[11px] font-semibold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100 inline-block">
                            Valid Until: {quoteValidUntil}
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Financial Totals + Signatory */}
                      <div className="space-y-4">
                        <div className="p-4 rounded-md bg-slate-50 border border-slate-200/80 space-y-2 font-mono">
                          <div className="flex justify-between text-slate-600 text-xs">
                            <span>Subtotal (Gross):</span>
                            <span>
                              ₹
                              {subtotalVal.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>

                          {discountVal > 0 && (
                            <div className="flex justify-between text-emerald-600 text-xs font-semibold">
                              <span>
                                Total Discount (
                                {selectedQuote.overallDiscountPercent || 0}%):
                              </span>
                              <span>
                                -₹
                                {discountVal.toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between text-slate-800 text-xs font-bold pt-1.5 border-t border-slate-200">
                            <span>Taxable Amount:</span>
                            <span>
                              ₹
                              {taxableVal.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>

                          {cgstVal > 0 && (
                            <div className="flex justify-between text-slate-500 text-xs">
                              <span>CGST:</span>
                              <span>
                                ₹
                                {cgstVal.toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          )}

                          {sgstVal > 0 && (
                            <div className="flex justify-between text-slate-500 text-xs">
                              <span>SGST:</span>
                              <span>
                                ₹
                                {sgstVal.toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          )}

                          {igstVal > 0 && (
                            <div className="flex justify-between text-slate-500 text-xs">
                              <span>IGST:</span>
                              <span>
                                ₹
                                {igstVal.toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between items-center text-slate-900 font-extrabold text-sm pt-2.5 border-t-2 border-slate-300 p-2 bg-sky-50/80 rounded-xl border">
                            <span className="text-xs uppercase tracking-wider font-black text-sky-950">
                              GRAND TOTAL:
                            </span>
                            <span className="text-base text-sky-700 font-black">
                              ₹
                              {grandTotalVal.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>

                          {selectedQuote.status === "ACCEPTED" ? (
                            (() => {
                              const advRec = (selectedQuote.advanceReceivedPaise || 0) / 100;
                              const totPaid = (selectedQuote.directPaidPaise || 0) / 100;
                              const balDue = (selectedQuote.directBalancePaise !== undefined ? selectedQuote.directBalancePaise : Math.max(0, (selectedQuote.grandTotalPaise || 0) - (selectedQuote.directPaidPaise || 0))) / 100;
                              const isPaid = balDue <= 0 && (totPaid > 0 || advRec > 0);

                              return (
                                <>
                                  <div className="flex justify-between items-center text-emerald-800 font-bold text-xs p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                                    <span>Advance Received:</span>
                                    <span className="font-mono">₹{advRec.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  {totPaid > advRec && (
                                    <div className="flex justify-between items-center text-emerald-900 font-bold text-xs p-2 bg-emerald-100/70 rounded-xl border border-emerald-300">
                                      <span>Total Paid:</span>
                                      <span className="font-mono">₹{totPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                    </div>
                                  )}
                                  <div className={`flex justify-between items-center font-bold text-xs p-2 rounded-xl border ${
                                    isPaid
                                      ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                                      : "bg-amber-50 text-amber-900 border-amber-200"
                                  }`}>
                                    <span>{isPaid ? "Balance Due (Fully Paid):" : "Balance Due:"}</span>
                                    <span className="font-mono">₹{balDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                  </div>
                                </>
                              );
                            })()
                          ) : (
                            selectedQuote.directPaidPaise > 0 && (
                              <>
                                <div className="flex justify-between items-center text-emerald-800 font-bold text-xs p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                                  <span>Total Received:</span>
                                  <span className="font-mono">
                                    ₹{(selectedQuote.directPaidPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-slate-900 font-bold text-xs p-2 bg-slate-100 rounded-xl border border-slate-200">
                                  <span>Balance Due:</span>
                                  <span className="font-mono font-bold text-slate-800">
                                    ₹{(((selectedQuote.directBalancePaise !== undefined ? selectedQuote.directBalancePaise : Math.max(0, (selectedQuote.grandTotalPaise || 0) - (selectedQuote.directPaidPaise || 0)))) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </>
                            )
                          )}
                        </div>

                        {/* Signatory Box */}
                        <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200/80 text-right">
                          <span className="text-[11px] font-bold text-slate-800 block">
                            For {tenantName}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-5 uppercase tracking-wider font-semibold">
                            Authorized Commercial Signatory
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-400 text-xs space-y-3">
                  <FileText className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-600 text-sm">
                    Select a quotation to preview details
                  </p>
                  <p>
                    Choose an offer from the collection on the left or create a
                    new quotation.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* CREATE QUOTATION MODAL */}
      {showBuilderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl p-6 md:p-8 space-y-6 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#F95721]" />
                <h3 className="text-base font-bold text-slate-900">
                  Create New Quotation
                </h3>
              </div>
              <button
                onClick={() => setShowBuilderModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateQuotation}
              className="space-y-5 text-xs"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Business / Company Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Retailers"
                    value={newQuote.businessName || ""}
                    onChange={(e) =>
                      setNewQuote({ ...newQuote, businessName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#F95721]"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Customer / Contact Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={newQuote.contactPerson || newQuote.customerName || ""}
                    onChange={(e) =>
                      setNewQuote({
                        ...newQuote,
                        contactPerson: e.target.value,
                        customerName: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#F95721]"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210"
                    value={newQuote.phone}
                    onChange={(e) =>
                      setNewQuote({ ...newQuote, phone: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#F95721]"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-slate-800 font-bold">
                    Line Items &amp; Specifications
                  </label>
                  <button
                    type="button"
                    onClick={handleAddCreateItem}
                    className="text-[#F95721] hover:text-[#e84915] font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>

                {newQuote.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-md bg-slate-50 border border-slate-200/80 space-y-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      <div className="md:col-span-5">
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                          Item Title
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Flex"
                          value={item.title ?? ""}
                          onChange={(e) => {
                            const copy = [...newQuote.items];
                            copy[idx].title = e.target.value;
                            setNewQuote({ ...newQuote, items: copy });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-semibold"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                          Specifications
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 10x4 "
                          value={item.description ?? ""}
                          onChange={(e) => {
                            const copy = [...newQuote.items];
                            copy[idx].description = e.target.value;
                            setNewQuote({ ...newQuote, items: copy });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity ?? 1}
                          onChange={(e) => {
                            const copy = [...newQuote.items];
                            copy[idx].quantity = e.target.value;
                            setNewQuote({ ...newQuote, items: copy });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-semibold"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                          Unit Rate (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={item.rate ?? 0}
                          onChange={(e) => {
                            const copy = [...newQuote.items];
                            copy[idx].rate = e.target.value;
                            setNewQuote({ ...newQuote, items: copy });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-semibold">
                          Discount (%):
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent ?? 0}
                          onChange={(e) => {
                            const copy = [...newQuote.items];
                            copy[idx].discountPercent = Number(e.target.value);
                            setNewQuote({ ...newQuote, items: copy });
                          }}
                          className="w-20 px-2 py-1 rounded bg-white border border-slate-200 text-xs font-mono font-bold"
                        />
                        {item.discountPercent > 15 ? (
                          <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            🔒 Requires Admin Approval (&gt;15%)
                          </span>
                        ) : item.discountPercent > 5 ? (
                          <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            ⏳ Requires Manager Approval (5-15%)
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                            ✓ Direct Approved (≤5%)
                          </span>
                        )}

                        <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-200">
                          <span className="text-[10px] text-slate-500 font-semibold">
                            GST:
                          </span>
                          <select
                            value={
                              item.taxRatePercent !== undefined
                                ? item.taxRatePercent
                                : 18
                            }
                            onChange={(e) => {
                              const copy = [...newQuote.items];
                              copy[idx].taxRatePercent = Number(e.target.value);
                              setNewQuote({ ...newQuote, items: copy });
                            }}
                            className="px-2 py-1 rounded bg-white border border-slate-200 text-xs font-mono font-bold text-slate-800"
                          >
                            <option value={0}>0% (Exempt)</option>
                            <option value={5}>5%</option>
                            <option value={12}>12%</option>
                            <option value={18}>18% (Standard)</option>
                            <option value={28}>28%</option>
                          </select>
                        </div>
                      </div>

                      {newQuote.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCreateItem(idx)}
                          className="text-rose-600 hover:text-rose-700 font-semibold text-[11px] flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Validity (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newQuote.validityDays}
                    onChange={(e) =>
                      setNewQuote({ ...newQuote, validityDays: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Turnaround &amp; Remarks
                  </label>
                  <input
                    type="text"
                    value={newQuote.notes}
                    onChange={(e) =>
                      setNewQuote({ ...newQuote, notes: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                  />
                </div>
              </div>

              {/* Live Quotation Financials Breakdown */}
              <div className="p-4 rounded-md bg-gradient-to-r from-slate-50 to-orange-50/40 border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex flex-wrap items-center gap-5">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Subtotal
                    </span>
                    <span className="font-bold text-slate-700 font-mono">
                      ₹
                      {builderSubtotal.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Discount
                    </span>
                    <span className="font-bold text-amber-600 font-mono">
                      -₹
                      {builderDiscountAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Taxable
                    </span>
                    <span className="font-bold text-slate-800 font-mono">
                      ₹
                      {builderTaxable.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      GST Total
                    </span>
                    <span className="font-bold text-[#F95721] font-mono">
                      +₹
                      {builderGst.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                    Grand Total (Incl. GST)
                  </span>
                  <span className="font-black text-base text-orange-700 font-mono">
                    ₹
                    {builderGrandTotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBuilderModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#F95721] hover:bg-[#e84915] text-white font-bold shadow-md shadow-orange-500/20"
                >
                  {actionLoading
                    ? "Creating Quotation..."
                    : "Create Official Quotation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT / REVISE QUOTATION MODAL */}
      {showEditModal && editingQuote && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl p-6 md:p-8 space-y-6 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#F95721]" />
                <h3 className="text-base font-bold text-slate-900">
                  {editIsRevision
                    ? `Revise Quotation (V${editingQuote.version + 1})`
                    : `Edit Quotation ${editingQuote.quotationNumber}`}
                </h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Business / Company Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Retailers"
                    value={editBusinessName}
                    onChange={(e) => setEditBusinessName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-medium focus:outline-none focus:border-[#F95721]"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Customer / Contact Person Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={editContactPerson}
                    onChange={(e) => setEditContactPerson(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-medium focus:outline-none focus:border-[#F95721]"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-slate-800 font-bold">
                    Line Items &amp; Pricing
                  </label>
                  <button
                    type="button"
                    onClick={handleAddEditItem}
                    className="text-[#F95721] hover:text-[#e84915] font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>

                {editItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-md bg-slate-50 border border-slate-200/80 space-y-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      <div className="md:col-span-5">
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                          Item Title
                        </label>
                        <input
                          type="text"
                          required
                          value={item.title ?? ""}
                          onChange={(e) => {
                            const copy = [...editItems];
                            copy[idx].title = e.target.value;
                            setEditItems(copy);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-semibold"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                          Specifications
                        </label>
                        <input
                          type="text"
                          value={item.description ?? ""}
                          onChange={(e) => {
                            const copy = [...editItems];
                            copy[idx].description = e.target.value;
                            setEditItems(copy);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity ?? 1}
                          onChange={(e) => {
                            const copy = [...editItems];
                            copy[idx].quantity = e.target.value;
                            setEditItems(copy);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-semibold"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                          Unit Rate (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={item.rate ?? 0}
                          onChange={(e) => {
                            const copy = [...editItems];
                            copy[idx].rate = e.target.value;
                            setEditItems(copy);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-semibold">
                          Discount (%):
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent ?? 0}
                          onChange={(e) => {
                            const copy = [...editItems];
                            copy[idx].discountPercent = Number(e.target.value);
                            setEditItems(copy);
                          }}
                          className="w-20 px-2 py-1 rounded bg-white border border-slate-200 text-xs font-mono font-bold"
                        />
                        {item.discountPercent > 15 ? (
                          <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            🔒 Requires Admin Approval (&gt;15%)
                          </span>
                        ) : item.discountPercent > 5 ? (
                          <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            ⏳ Requires Manager Approval (5-15%)
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                            ✓ Direct Approved (≤5%)
                          </span>
                        )}

                        <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-200">
                          <span className="text-[10px] text-slate-500 font-semibold">
                            GST:
                          </span>
                          <select
                            value={
                              item.taxRatePercent !== undefined
                                ? item.taxRatePercent
                                : 18
                            }
                            onChange={(e) => {
                              const copy = [...editItems];
                              copy[idx].taxRatePercent = Number(e.target.value);
                              setEditItems(copy);
                            }}
                            className="px-2 py-1 rounded bg-white border border-slate-200 text-xs font-mono font-bold text-slate-800"
                          >
                            <option value={0}>0% (Exempt)</option>
                            <option value={5}>5%</option>
                            <option value={12}>12%</option>
                            <option value={18}>18% (Standard)</option>
                            <option value={28}>28%</option>
                          </select>
                        </div>
                      </div>

                      {editItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEditItem(idx)}
                          className="text-rose-600 hover:text-rose-700 font-semibold text-[11px] flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Edit Financials Breakdown */}
              <div className="p-4 rounded-md bg-gradient-to-r from-slate-50 to-orange-50/40 border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex flex-wrap items-center gap-5">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Subtotal
                    </span>
                    <span className="font-bold text-slate-700 font-mono">
                      ₹
                      {editSubtotal.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Discount
                    </span>
                    <span className="font-bold text-amber-600 font-mono">
                      -₹
                      {editDiscountAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Taxable
                    </span>
                    <span className="font-bold text-slate-800 font-mono">
                      ₹
                      {editTaxable.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      GST Total
                    </span>
                    <span className="font-bold text-[#F95721] font-mono">
                      +₹
                      {editGst.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                    Grand Total (Incl. GST)
                  </span>
                  <span className="font-black text-base text-orange-700 font-mono">
                    ₹
                    {editGrandTotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#F95721] hover:bg-[#e84915] text-white font-bold shadow-md shadow-orange-500/20"
                >
                  {actionLoading
                    ? "Saving..."
                    : editIsRevision
                      ? "Save New Revision"
                      : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUOTATION PAYMENT MODAL */}
      {showDirectPaymentModal && selectedQuote && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-scale-up">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {directPaymentForm.paymentType === "ADVANCE" ? "Record Advance Payment" : "Record Final Payment"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedQuote.quotationNumber} · Accepted quotation payment
                </p>
              </div>
              <button type="button" onClick={() => setShowDirectPaymentModal(false)} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="block text-slate-500">Quotation Total</span>
                <strong className="block mt-1 font-mono text-slate-900">₹{((selectedQuote.grandTotalPaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="block text-emerald-700">Advance Received</span>
                <strong className="block mt-1 font-mono text-emerald-900">₹{((selectedQuote.advanceReceivedPaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <span className="block text-amber-700">Balance Due</span>
                <strong className="block mt-1 font-mono text-amber-900">₹{((selectedQuote.directBalancePaise ?? selectedQuote.grandTotalPaise ?? 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>

            <p className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900">
              {directPaymentForm.paymentType === "ADVANCE"
                ? "Record the quotation advance first. The final balance can be recorded after the advance is verified."
                : "The advance is complete. Record the remaining quotation balance as the final payment."}
            </p>

            <form onSubmit={handleRecordDirectPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {directPaymentForm.paymentType === "ADVANCE" ? "Advance Amount (₹)" : "Final Payment Amount (₹)"}
                </label>
                <input type="number" min="0.01" step="0.01" required value={directPaymentForm.amount} onChange={(e) => setDirectPaymentForm({ ...directPaymentForm, amount: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <select value={directPaymentForm.paymentMethod} onChange={(e) => setDirectPaymentForm({ ...directPaymentForm, paymentMethod: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER_NEFT_RTGS">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CREDIT_CARD">Credit / Debit Card</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transaction Reference</label>
                <input value={directPaymentForm.transactionReference} onChange={(e) => setDirectPaymentForm({ ...directPaymentForm, transactionReference: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                <textarea rows={2} value={directPaymentForm.notes} onChange={(e) => setDirectPaymentForm({ ...directPaymentForm, notes: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800" />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowDirectPaymentModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={paymentSubmitting || !Number(directPaymentForm.amount)} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold">
                  {paymentSubmitting ? "Recording..." : directPaymentForm.paymentType === "ADVANCE" ? "Record Advance" : "Record Final Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* CREATE COMMERCIAL ORDER MODAL */}
      {showConvertOrderModal && (
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
                type="button"
                onClick={() => setShowConvertOrderModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
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
                      const allTitles = (q?.items || []).map((i) => i.title).filter(Boolean).join(", ");
                      setOrderForm({
                        ...orderForm,
                        quotationId: selectedQId,
                        selectedItemIndex: "",
                        title: allTitles || it?.title || orderForm.title || "",
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
                      if (q) setConvertQuote(q);
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
                    const selectedQ =
                      quotations.find(
                        (item) => item._id === orderForm.quotationId,
                      ) || convertQuote || selectedQuote;
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
                              const allTitles = (selectedQ.items || []).map((i) => i.title).filter(Boolean).join(", ");
                              setOrderForm({
                                ...orderForm,
                                selectedItemIndex: "",
                                title: allTitles || it0?.title || orderForm.title,
                                amount: (selectedQ.grandTotalPaise
                                  ? selectedQ.grandTotalPaise / 100
                                  : selectedQ.totalAmount || 0
                                ).toString(),
                                width: it0?.width ? it0.width.toString() : "",
                                height: it0?.height ? it0.height.toString() : "",
                                dimensionUnit: it0?.dimensionUnit || "inch",
                                quantity: it0?.quantity || 1,
                                material: it0?.paperType || "",
                                gsm: it0?.paperGsm ? it0.paperGsm.toString() : "",
                                colors: it0?.colors || "CMYK",
                                printSides: it0?.printSides || "SINGLE",
                                finishing: it0?.finishing || [],
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
                              const itemTotal = Math.round(gross - disc + tax);

                              setOrderForm({
                                ...orderForm,
                                selectedItemIndex: itemIdx,
                                title:
                                  it?.title || `Item ${Number(itemIdx) + 1}`,
                                amount: itemTotal.toString(),
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
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-[#F95721] text-[11px] text-slate-700 font-medium border border-slate-200 transition-colors cursor-pointer"
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
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
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
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono font-bold"
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
                  onClick={() => setShowConvertOrderModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {actionLoading
                    ? "Creating Commercial Order..."
                    : "Create Commercial Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuotationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <Navbar />
            <div className="p-16 text-center text-slate-400 text-xs my-auto">
              <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-[#F95721]" />
              Loading Quotations Studio...
            </div>
          </main>
        </div>
      }
    >
      <QuotationsContent />
    </Suspense>
  );
}
