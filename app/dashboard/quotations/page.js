"use client";

import React, { useState, useEffect, Suspense } from "react";
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
  const customerNameParam = searchParams.get("customerName") || "";
  const phoneParam = searchParams.get("phone") || "";

  const [quotations, setQuotations] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
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
      .get("/tenants/current", { silent: true })
      .then((res) => {
        if (res?.data?.tenant) setCurrentTenant(res.data.tenant);
        else if (res?.data) setCurrentTenant(res.data);
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
    customerName: "",
    phone: "",
    items: [
      {
        title: "Flex Banner 440 GSM",
        description: "Outdoor Frontlit 10x4 ft",
        quantity: 1,
        rate: 1500,
        discountPercent: 0,
        taxRatePercent: 18,
      },
    ],
    discountPercent: 0,
    validityDays: 15,
    notes: "Standard turn-around 24-48 hours upon artwork approval.",
    termsAndConditions:
      "50% advance along with confirmed purchase order. Balance upon pre-dispatch delivery intimation.",
  });

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [editDiscountPercent, setEditDiscountPercent] = useState(0);
  const [editValidityDays, setEditValidityDays] = useState(15);
  const [editNotes, setEditNotes] = useState("");
  const [editTerms, setEditTerms] = useState("");
  const [editIsRevision, setEditIsRevision] = useState(false);

  // Multi-Order / Convert to Orders State
  const [designers, setDesigners] = useState([]);
  const [quoteOrders, setQuoteOrders] = useState([]);
  const [quoteOrdersLoading, setQuoteOrdersLoading] = useState(false);
  const [showConvertOrderModal, setShowConvertOrderModal] = useState(false);
  const [convertQuote, setConvertQuote] = useState(null);
  const [convertForm, setConvertForm] = useState({
    selectedItemIndexes: [],
    assignedDesignerId: "",
    designNotes: "",
    designDeadline: "",
    promisedDeliveryDate: "",
    deliveryMethod: "PICKUP",
    advanceRequiredPercent: 50,
    orderNotes: "",
  });

  // Direct Quotation Payment State (Products / Retail items without design/orders)
  const [quotePayments, setQuotePayments] = useState([]);
  const [quotePaymentsLoading, setQuotePaymentsLoading] = useState(false);
  const [showDirectPaymentModal, setShowDirectPaymentModal] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [directPaymentForm, setDirectPaymentForm] = useState({
    selectedItemIndexes: [],
    amount: "",
    paymentMethod: "CASH",
    paymentType: "FINAL_SETTLEMENT",
    transactionReference: "",
    bankName: "",
    chequeNumber: "",
    notes: "",
  });

  useEffect(() => {
    api
      .get("/users?limit=100")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.records || [];
        setDesigners(list);
      })
      .catch(() => {});
  }, []);

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
    if (leadIdParam || customerNameParam || phoneParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNewQuote((prev) => ({
        ...prev,
        leadId: leadIdParam || prev.leadId,
        customerName: customerNameParam || prev.customerName,
        phone: phoneParam || prev.phone,
      }));
      setShowBuilderModal(true);
    }
  }, [leadIdParam, customerNameParam, phoneParam]);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await api.get("/quotations?limit=100");
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
        }
      }
    } catch (err) {
      console.error("Failed to fetch quotations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchQuotations();
  }, []);

  // Creation Item Management
  const handleAddCreateItem = () => {
    setNewQuote({
      ...newQuote,
      items: [
        ...newQuote.items,
        {
          title: "Visiting Cards Matte 350 GSM",
          description: "Standard 3.5x2 in, Double Sided",
          quantity: 1000,
          rate: 1.5,
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
        customerName: newQuote.customerName,
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
        customerName: "",
        phone: "",
        items: [
          {
            title: "Flex Banner 440 GSM",
            description: "Outdoor Frontlit 10x4 ft",
            quantity: 1,
            rate: 1500,
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
      alert("This quotation has already been accepted and converted into an active order. Accepted quotations cannot be revised. If changes are needed, please create a new quotation.");
      return;
    }
    setEditingQuote(quote);
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
      alert(
        "Discount approved successfully! Status is now APPROVED (Ready to send).",
      );
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
      alert("Quotation discount rejected.");
      await fetchQuotations();
    } catch (err) {
      alert(err.message || "Failed to reject discount");
    } finally {
      setActionLoading(false);
    }
  };

  // Send Quotation to Client
  const handleSendQuotation = async (quote) => {
    if (
      !confirm(
        `Dispatch quotation ${quote.quotationNumber} to customer? Status will change to SENT.`,
      )
    )
      return;
    try {
      setActionLoading(true);
      const res = await api.post(`/quotations/${quote._id}/send`);
      alert(
        `Quotation dispatched to client successfully! Digital token acceptance link generated: ${res.data?.acceptanceUrl || ""}`,
      );
      await fetchQuotations();
    } catch (err) {
      alert(err.message || "Failed to send quotation");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Convert to Order Modal (with item selection and designer assignment)
  const handleOpenConvertOrder = (quote) => {
    const targetQuote = quote || selectedQuote;
    if (!targetQuote) return;

    setConvertQuote(targetQuote);

    // Compute which items in quote.items were already ordered
    const alreadyOrderedIndexes = new Set();
    (quoteOrders || []).forEach((ord) => {
      (ord.items || []).forEach((it) => {
        if (it.quotationItemIndex !== undefined && it.quotationItemIndex !== null) {
          alreadyOrderedIndexes.add(Number(it.quotationItemIndex));
        }
      });
    });

    const items = targetQuote.items || [];
    // If some items are not yet ordered, default to selecting the remaining unordered items!
    // If all are ordered or none are ordered, default to all items.
    const unorderedIndexes = items
      .map((_, idx) => idx)
      .filter((idx) => !alreadyOrderedIndexes.has(idx));
    const initialSelected =
      unorderedIndexes.length > 0 ? unorderedIndexes : items.map((_, idx) => idx);

    // Default dates
    const dDeadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const dDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    setConvertForm({
      selectedItemIndexes: initialSelected,
      assignedDesignerId: "",
      designNotes: "",
      designDeadline: dDeadline,
      promisedDeliveryDate: dDelivery,
      deliveryMethod: "PICKUP",
      advanceRequiredPercent: 50,
      orderNotes: "",
    });

    setShowConvertOrderModal(true);
  };

  // Submit Create Order from Quotation
  const handleCreateOrderFromQuote = async (e) => {
    if (e) e.preventDefault();
    if (!convertQuote) return;
    if (
      !convertForm.selectedItemIndexes ||
      convertForm.selectedItemIndexes.length === 0
    ) {
      alert(
        "Please select at least one quotation line item to include in this order.",
      );
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        selectedItemIndexes: convertForm.selectedItemIndexes,
        assignedDesignerId: convertForm.assignedDesignerId || undefined,
        designNotes: convertForm.designNotes || "",
        designDeadline: convertForm.designDeadline || undefined,
        promisedDeliveryDate: convertForm.promisedDeliveryDate || undefined,
        deliveryMethod: convertForm.deliveryMethod || "PICKUP",
        advanceRequiredPercent:
          Number(convertForm.advanceRequiredPercent) || 50,
        notes: convertForm.orderNotes || "",
      };

      const res = await api.post(
        `/quotations/${convertQuote._id}/create-order`,
        payload,
      );
      alert(
        `Commercial Order ${res.data?.orderNumber || ""} successfully created for selected item(s)!`,
      );
      setShowConvertOrderModal(false);
      await fetchQuotations();
      await fetchQuoteOrders(convertQuote._id);
    } catch (err) {
      alert(err.message || "Failed to create order from quotation");
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Item Selection in Direct Payment Modal
  const handleToggleDirectItem = (idx) => {
    const targetIdx = Number(idx);
    const current = (directPaymentForm.selectedItemIndexes || []).map(Number);
    const next = current.includes(targetIdx)
      ? current.filter((i) => i !== targetIdx)
      : [...current, targetIdx];

    const newTotal = next.reduce((sum, itemIdx) => {
      const itemObj = selectedQuote?.items?.[itemIdx];
      const price = (itemObj?.itemTotalPaise || 0) / 100;
      const paid = (itemObj?.directPaymentPaidPaise || 0) / 100;
      return sum + Math.max(0, price - paid);
    }, 0);

    setDirectPaymentForm((prev) => ({
      ...prev,
      selectedItemIndexes: next,
      amount: newTotal > 0 ? newTotal.toFixed(2) : "0",
    }));
  };

  // Open Direct Quotation Payment Modal (Pay directly for products/hardware)
  const handleOpenDirectPaymentModal = (targetQuote = selectedQuote, specificItemIndex = null) => {
    if (!targetQuote) return;
    const items = targetQuote.items || [];
    let initialSelected = [];
    let initialAmount = "0";

    if (specificItemIndex !== null && specificItemIndex !== undefined) {
      const sIdx = Number(specificItemIndex);
      initialSelected = [sIdx];
      const itemObj = items[sIdx];
      const price = (itemObj?.itemTotalPaise || 0) / 100;
      const paid = (itemObj?.directPaymentPaidPaise || 0) / 100;
      const rem = Math.max(0, price - paid);
      initialAmount = rem > 0 ? rem.toFixed(2) : (price || 0).toFixed(2);
    } else {
      // Default select unpaid direct items (or items where directPaymentStatus !== 'PAID')
      const unpaidIndexes = items
        .map((it, idx) => idx)
        .filter((idx) => items[idx].directPaymentStatus !== "PAID");
      initialSelected =
        unpaidIndexes.length > 0 ? unpaidIndexes : items.map((_, idx) => idx);

      // Sum remaining unpaid for selected items
      const selectedTotal = initialSelected.reduce((sum, idx) => {
        const it = items[idx];
        const itemPrice = (it?.itemTotalPaise || 0) / 100;
        const alreadyPaid = (it?.directPaymentPaidPaise || 0) / 100;
        return sum + Math.max(0, itemPrice - alreadyPaid);
      }, 0);

      initialAmount =
        selectedTotal > 0
          ? selectedTotal.toFixed(2)
          : (
              (targetQuote.directBalancePaise !== undefined
                ? targetQuote.directBalancePaise
                : targetQuote.grandTotalPaise || 0) / 100
            ).toFixed(2);
    }

    setDirectPaymentForm({
      selectedItemIndexes: initialSelected,
      amount: initialAmount,
      paymentMethod: "CASH",
      paymentType: "FINAL_SETTLEMENT",
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
    if (!selectedQuote) return;
    if (
      !directPaymentForm.selectedItemIndexes ||
      directPaymentForm.selectedItemIndexes.length === 0
    ) {
      alert("Please select at least one quotation line item for this direct payment.");
      return;
    }
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
        selectedItemIndexes: directPaymentForm.selectedItemIndexes,
        transactionReference: directPaymentForm.transactionReference || undefined,
        bankName: directPaymentForm.bankName || undefined,
        chequeNumber: directPaymentForm.chequeNumber || undefined,
        notes: directPaymentForm.notes || undefined,
      };

      const res = await api.post(
        `/quotations/${selectedQuote._id}/payments`,
        payload,
      );
      alert(
        `Direct payment of ₹${enteredAmt.toLocaleString("en-IN")} successfully recorded! (Receipt: ${res.data?.receiptNumber || "Confirmed"})`,
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

  // Mark Client Accepted (Opens item selection and designer assignment modal)
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
    return matchesSearch && matchesStatus;
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

  // Live calculation of selected items in convertForm
  const convertSelectedItems = (convertQuote?.items || []).filter((_, idx) =>
    (convertForm?.selectedItemIndexes || []).includes(idx),
  );

  const convertSubtotal = convertSelectedItems.reduce((acc, it) => {
    const gross =
      (Number(it.quantity) || 1) *
      (it.unitRatePaise ? it.unitRatePaise / 100 : Number(it.rate) || 0);
    return acc + gross;
  }, 0);

  const convertDiscount = convertSelectedItems.reduce((acc, it) => {
    const gross =
      (Number(it.quantity) || 1) *
      (it.unitRatePaise ? it.unitRatePaise / 100 : Number(it.rate) || 0);
    const disc = Number(it.discountPercent || 0);
    return acc + (gross * disc) / 100;
  }, 0);

  const convertTaxable = Math.max(0, convertSubtotal - convertDiscount);

  const convertGst = convertSelectedItems.reduce((acc, it) => {
    const gross =
      (Number(it.quantity) || 1) *
      (it.unitRatePaise ? it.unitRatePaise / 100 : Number(it.rate) || 0);
    const disc = Number(it.discountPercent || 0);
    const taxable = Math.max(0, gross - (gross * disc) / 100);
    const taxRate = Number(
      it.taxRatePercent !== undefined ? it.taxRatePercent : 18,
    );
    return acc + (taxable * taxRate) / 100;
  }, 0);

  const convertGrandTotal = convertTaxable + convertGst;
  const convertAdvanceReq =
    (convertGrandTotal * (Number(convertForm?.advanceRequiredPercent) || 50)) /
    100;

  // Selected Quote Resolved Values
  const tenantName = currentTenant?.name || "A2V PRINTING SOLUTIONS";
  const tenantTagline =
    currentTenant?.branding?.tagline ||
    "Commercial Printing & Packaging Solutions";
  const tenantPhone = currentTenant?.phone || "+91 98765 43210";
  const tenantEmail = currentTenant?.email || "contact@a2vprinting.com";
  const tenantGstin = currentTenant?.gstin || "27AAAAA0000A1Z5";

  const snap = selectedQuote?.customerSnapshot || {};
  const clientDisplayName =
    snap.displayName ||
    snap.companyName ||
    selectedQuote?.customerName ||
    "Valued Customer";
  const clientCompany =
    snap.companyName && snap.companyName !== clientDisplayName
      ? snap.companyName
      : "";
  const clientContact =
    snap.contactPerson || (!clientCompany ? clientDisplayName : "");
  const clientPhone = snap.phone || selectedQuote?.phone || "Not provided";
  const clientEmail = snap.email || "Not provided";
  const clientGstin = snap.gstin || "Unregistered";

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
        return "bg-blue-100 text-blue-800 border-blue-300";
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
              <div className="w-11 h-11 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
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
                  className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`}
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
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
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
                  const client =
                    item.customerSnapshot?.displayName ||
                    item.customerSnapshot?.companyName ||
                    item.customerName ||
                    "Direct Customer";

                  return (
                    <div
                      key={item._id}
                      onClick={() => setSelectedQuote(item)}
                      className={`p-4 rounded-md border transition-all cursor-pointer space-y-2.5 ${
                        isSelected
                          ? "bg-blue-50/70 border-blue-400 shadow-xs ring-1 ring-blue-400/30"
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
                          {item.directPaidPaise > 0 && (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                              Direct Paid: ₹{(item.directPaidPaise / 100).toLocaleString("en-IN")}
                            </span>
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
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        OFFICIAL QUOTATION
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-200">
                        {selectedQuote.quotationNumber} (v
                        {selectedQuote.version || 1})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenDirectPaymentModal(selectedQuote)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                        title="Record direct payment for products (e.g. iron, hardware) without converting to order or assigning to designers"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Record Direct Payment
                      </button>

                      <button
                        onClick={() => handleOpenConvertOrder(selectedQuote)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                        title="Create dedicated orders for items in this quotation and assign to designers"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        Create Order (Split Items)
                      </button>

                      {selectedQuote.status !== "ACCEPTED" ? (
                        <button
                          onClick={() => handleOpenEdit(selectedQuote)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-400" />
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
                          Accepted ({quoteOrders.length} Order{quoteOrders.length === 1 ? "" : "s"})
                        </span>
                      )}

                      <button
                        onClick={() => {
                          const cId =
                            selectedQuote.customerId ||
                            selectedQuote.customerSnapshot?._id ||
                            selectedQuote.leadId ||
                            "";
                          const phone =
                            selectedQuote.customerSnapshot?.phone ||
                            selectedQuote.customerPhone ||
                            "";
                          const quoteNo = selectedQuote.quotationNumber || "";
                          router.push(
                            `/dashboard/whatsapp?customerId=${cId}&phone=${phone}&quoteNo=${quoteNo}&template=quotation_followup`,
                          );
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                        title="Follow up / Share via WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp
                      </button>

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
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all"
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

                      <button
                        onClick={() => handleSendQuotation(selectedQuote)}
                        disabled={actionLoading}
                        className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all"
                      >
                        <Send className="w-4 h-4" />
                        🚀 Send to Client
                      </button>
                    </div>
                  )}

                  {/* 3. Sent Banner (Awaiting Client Acceptance or Rejection) */}
                  {selectedQuote.status === "SENT" && (
                    <div className="p-4 bg-blue-50 border-b border-blue-200 text-blue-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-5 h-5 text-blue-600 shrink-0" />
                        <div>
                          <strong className="block text-blue-950 font-bold">
                            Quotation Sent to Client
                          </strong>
                          <span className="text-[11px] text-blue-800">
                            Awaiting client response. You can record direct payment for products (no order) or convert custom items to an order for designers.
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleOpenDirectPaymentModal(selectedQuote)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Record payment directly for products (iron, hardware) without creating orders or sending to designers"
                        >
                          <CreditCard className="w-4 h-4" />
                          💳 Pay Directly (Products - No Order)
                        </button>
                        <button
                          onClick={() =>
                            handleMarkClientAccepted(selectedQuote)
                          }
                          disabled={actionLoading}
                          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Convert items that need design/fabrication into orders and assign to designers"
                        >
                          <Layers className="w-4 h-4" />
                          Convert Items to Order (Designers)
                        </button>
                        <button
                          onClick={() => handleMarkNotAccepted(selectedQuote)}
                          disabled={actionLoading}
                          className="px-3 py-2 rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-4 h-4" />✕ Not Accepted
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
                            ✓ Quotation Accepted by Client ({quoteOrders.length} Order{quoteOrders.length === 1 ? "" : "s"} Created)
                          </strong>
                          <span className="text-[11px] text-green-800">
                            Commercial deal closed. You can create multiple orders for specific items and assign them to different designers.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
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
                    <div className="rounded-md p-5 md:p-6 bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h2 className="text-xl md:text-2xl font-black tracking-tight">
                          {tenantName}
                        </h2>
                        <p className="text-sky-100 text-xs mt-1 font-medium">
                          {tenantTagline}
                        </p>
                      </div>

                      <div className="text-left md:text-right bg-white/10 backdrop-blur-xs border border-white/20 px-4 py-2.5 rounded-xl space-y-0.5">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-sky-200 block">
                          COMMERCIAL QUOTATION
                        </span>
                        <div className="font-mono font-bold text-white text-xs">
                          No: {selectedQuote.quotationNumber || "QT-DRAFT"} (v
                          {selectedQuote.version || 1})
                        </div>
                        <div className="text-[11px] text-sky-100">
                          Date Issued: {quoteCreatedAt}
                        </div>
                        <div className="text-[11px] text-sky-200 font-semibold">
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
                        <strong className="text-slate-900 text-sm block font-bold">
                          {tenantName}
                        </strong>
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
                          {clientDisplayName}
                        </strong>
                        {(clientCompany || clientContact) && (
                          <div className="text-slate-600 text-xs">
                            {clientCompany
                              ? `Company: ${clientCompany}`
                              : `Contact: ${clientContact}`}
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
                        <div className="text-slate-600 text-xs">
                          GSTIN:{" "}
                          <span className="font-mono font-semibold text-slate-800">
                            {clientGstin}
                          </span>
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
                            <th className="py-3 px-3 text-center">ACTION</th>
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
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                    {specs.length > 0 && (
                                      <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-block font-medium border border-blue-100">
                                        {specs.join(" • ")}
                                      </span>
                                    )}
                                    {item.directPaymentStatus === "PAID" && (
                                      <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md inline-flex items-center gap-1 font-bold border border-emerald-300">
                                        ✓ Paid Directly (Product - ₹{((item.directPaymentPaidPaise || item.itemTotalPaise || 0) / 100).toLocaleString("en-IN")})
                                      </span>
                                    )}
                                    {item.directPaymentStatus === "PARTIALLY_PAID" && (
                                      <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md inline-flex items-center gap-1 font-bold border border-amber-300">
                                        Partially Paid Directly (₹{((item.directPaymentPaidPaise || 0) / 100).toLocaleString("en-IN")})
                                      </span>
                                    )}
                                  </div>
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
                                <td className="py-3 px-3 text-center whitespace-nowrap">
                                  {item.directPaymentStatus === "PAID" ? (
                                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                      ✓ Paid
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenDirectPaymentModal(selectedQuote, idx)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-2xs transition-all cursor-pointer"
                                      title="Pay directly for this specific item without creating an order or assigning to a designer"
                                    >
                                      <CreditCard className="w-3 h-3" />
                                      Pay Direct
                                    </button>
                                  )}
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

                          <div className="flex justify-between items-center text-slate-900 font-extrabold text-sm pt-2.5 border-t-2 border-slate-300 p-2 bg-sky-50/80 rounded-xl border border-sky-200">
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

                          {selectedQuote.directPaidPaise > 0 && (
                            <div className="flex justify-between items-center text-emerald-800 font-bold text-xs p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                              <span>Direct Paid (Products):</span>
                              <span className="font-mono">
                                ₹
                                {(selectedQuote.directPaidPaise / 100).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          )}

                          {selectedQuote.directPaidPaise > 0 && (
                            <div className="flex justify-between items-center text-slate-900 font-bold text-xs p-2 bg-slate-100 rounded-xl border border-slate-200">
                              <span>Remaining Balance:</span>
                              <span className="font-mono font-bold text-slate-800">
                                ₹
                                {(
                                  (selectedQuote.directBalancePaise !== undefined
                                    ? selectedQuote.directBalancePaise
                                    : Math.max(0, (selectedQuote.grandTotalPaise || 0) - (selectedQuote.directPaidPaise || 0))) / 100
                                ).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>
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

                  {/* ORDERS GENERATED FROM THIS QUOTATION SECTION */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            Orders Generated from this Quotation ({quoteOrders.length})
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Create multiple orders from this quotation to assign items to different designers.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenConvertOrder(selectedQuote)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Create Order (Split Items)
                      </button>
                    </div>

                    {quoteOrdersLoading ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-indigo-500" />
                        Loading linked orders...
                      </div>
                    ) : quoteOrders.length === 0 ? (
                      <div className="p-6 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs space-y-2">
                        <Package className="w-6 h-6 text-slate-400 mx-auto" />
                        <p className="font-semibold text-slate-700">
                          No orders created from this quotation yet.
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Click &quot;Create Order (Split Items)&quot; to convert items into orders and assign to designers.
                        </p>
                        <button
                          onClick={() => handleOpenConvertOrder(selectedQuote)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-xs font-bold transition-all shadow-2xs mt-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Convert to Order Now
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {quoteOrders.map((ord) => {
                          const grandTotal = ord.grandTotalPaise
                            ? ord.grandTotalPaise / 100
                            : ord.totalAmount || 0;
                          const totalPaid = ord.totalPaidPaise
                            ? ord.totalPaidPaise / 100
                            : 0;
                          const balance =
                            ord.balancePaise !== undefined
                              ? ord.balancePaise / 100
                              : Math.max(0, grandTotal - totalPaid);
                          const designer = ord.assignedDesignerId;

                          return (
                            <div
                              key={ord._id}
                              className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono font-bold text-xs text-slate-900">
                                    {ord.orderNumber}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                      ord.orderStatus === "CONFIRMED"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                    }`}
                                  >
                                    {ord.orderStatus}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                      ord.paymentStatus === "PAID"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : ord.paymentStatus === "PARTIALLY_PAID"
                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                        : "bg-rose-50 text-rose-700 border-rose-200"
                                    }`}
                                  >
                                    {ord.paymentStatus}
                                  </span>
                                  {ord.designStatus && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                      🎨 {ord.designStatus.replace(/_/g, " ")}
                                    </span>
                                  )}
                                </div>

                                {/* Order items summary */}
                                <div className="text-xs text-slate-700 flex flex-wrap items-center gap-1.5">
                                  <span className="font-medium text-slate-500">
                                    Items:
                                  </span>
                                  {(ord.items || []).map((it, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-medium text-slate-800"
                                    >
                                      {it.quantity}× {it.title}
                                    </span>
                                  ))}
                                </div>

                                {/* Designer and dates */}
                                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <Palette className="w-3 h-3 text-purple-500" />
                                    Designer:{" "}
                                    <strong className="text-slate-700 font-semibold">
                                      {designer
                                        ? designer.name || designer.email
                                        : "Unassigned"}
                                    </strong>
                                  </span>
                                  {ord.designDeadline && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-slate-400" />
                                      Due: {formatDate(ord.designDeadline)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                                    Order Total
                                  </span>
                                  <span className="font-mono font-bold text-sm text-slate-900">
                                    ₹
                                    {grandTotal.toLocaleString("en-IN", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </span>
                                  <span className="text-[10px] text-slate-500 block">
                                    Bal: ₹
                                    {balance.toLocaleString("en-IN", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </span>
                                </div>

                                <Link
                                  href={`/dashboard/orders`}
                                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1 transition-all"
                                >
                                  View in Orders <ArrowRight className="w-3 h-3" />
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* DIRECT PAYMENTS & RECEIPTS RECORDED ON THIS QUOTATION */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            Direct Payments & Receipts ({quotePayments.length})
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Payments recorded directly for products (like iron, hardware, materials) without routing through design or orders.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenDirectPaymentModal(selectedQuote)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Record Direct Payment
                      </button>
                    </div>

                    {quotePaymentsLoading ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-emerald-500" />
                        Loading direct payments...
                      </div>
                    ) : quotePayments.length === 0 ? (
                      <div className="p-6 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs space-y-2">
                        <CreditCard className="w-6 h-6 text-slate-400 mx-auto" />
                        <p className="font-semibold text-slate-700">
                          No direct payments recorded for this quotation yet.
                        </p>
                        <p className="text-[11px] text-slate-400">
                          For products (like iron, stands, hardware) that don&apos;t go to designers, record payment directly here.
                        </p>
                        <button
                          onClick={() => handleOpenDirectPaymentModal(selectedQuote)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs font-bold transition-all shadow-2xs mt-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Record Direct Payment Now
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {quotePayments.map((pmt) => {
                          const amt = (pmt.amountPaise || 0) / 100;
                          return (
                            <div
                              key={pmt._id}
                              className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all bg-slate-50/50 space-y-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-xs text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                                    {pmt.receiptNumber || "RECEIPT"}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    {pmt.status || "CONFIRMED"}
                                  </span>
                                  <span className="text-[10px] font-medium text-slate-500">
                                    {pmt.paymentMethod?.replace(/_/g, " ")} • {formatDate(pmt.createdAt)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-bold text-emerald-700 font-mono">
                                    ₹{amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                  </span>
                                  <button
                                    onClick={async () => {
                                      try {
                                        const res = await api.get(`/payments/${pmt._id}/receipt`, { responseType: "blob" });
                                        const blob = new Blob([res.data], { type: "application/pdf" });
                                        const url = window.URL.createObjectURL(blob);
                                        window.open(url, "_blank");
                                      } catch (err) {
                                        alert("Failed to view receipt: " + (err.message || "Error"));
                                      }
                                    }}
                                    className="p-1.5 px-2.5 rounded-lg border border-slate-200 hover:bg-white text-slate-700 hover:text-emerald-700 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                                    title="View Electronic PDF Receipt"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    Receipt PDF
                                  </button>
                                </div>
                              </div>

                              {pmt.selectedItemTitles && pmt.selectedItemTitles.length > 0 && (
                                <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
                                  <span className="font-semibold text-slate-700">For Items: </span>
                                  {pmt.selectedItemTitles.join(", ")}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
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
                <FileText className="w-5 h-5 text-blue-600" />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Customer / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Retailers"
                    value={newQuote.customerName}
                    onChange={(e) =>
                      setNewQuote({ ...newQuote, customerName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
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
                    className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />+ Add Item
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
                          placeholder="e.g. Flex Banner 440 GSM"
                          value={item.title}
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
                          placeholder="e.g. 10x4 ft Frontlit"
                          value={item.description}
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
                          value={item.quantity}
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
                          value={item.rate}
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
                          value={item.discountPercent}
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
              <div className="p-4 rounded-md bg-gradient-to-r from-slate-50 to-blue-50/40 border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
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
                    <span className="font-bold text-blue-600 font-mono">
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
                  <span className="font-black text-base text-blue-700 font-mono">
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
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20"
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
                <Edit3 className="w-5 h-5 text-blue-600" />
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
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-slate-800 font-bold">
                    Line Items &amp; Pricing
                  </label>
                  <button
                    type="button"
                    onClick={handleAddEditItem}
                    className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />+ Add Item
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
                          value={item.title}
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
                          value={item.description}
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
                          value={item.quantity}
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
                          value={item.rate}
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
                          value={item.discountPercent}
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
              <div className="p-4 rounded-md bg-gradient-to-r from-slate-50 to-blue-50/40 border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
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
                    <span className="font-bold text-blue-600 font-mono">
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
                  <span className="font-black text-base text-blue-700 font-mono">
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
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20"
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

      {/* CREATE ORDER FROM QUOTATION (SPLIT ITEMS / ASSIGN DESIGNER) MODAL */}
      {showConvertOrderModal && convertQuote && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl p-6 md:p-8 space-y-6 shadow-2xl animate-scale-up max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Create Order from Quotation
                    </h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                      {convertQuote.quotationNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select line items for this specific order and assign to a designer with dedicated deadlines and notes.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConvertOrderModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrderFromQuote} className="space-y-6">
              {/* Step 1: Select Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">
                      1
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Select Quotation Items for this Order
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        setConvertForm({
                          ...convertForm,
                          selectedItemIndexes: (convertQuote.items || []).map((_, i) => i),
                        })
                      }
                      className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() =>
                        setConvertForm({
                          ...convertForm,
                          selectedItemIndexes: [],
                        })
                      }
                      className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
                  {(convertQuote.items || []).map((it, idx) => {
                    const isSelected = convertForm.selectedItemIndexes.includes(idx);
                    const grossPaise =
                      (Number(it.quantity) || 1) *
                      (it.unitRatePaise || (it.rate ? it.rate * 100 : 0));
                    const discPaise =
                      (grossPaise * Number(it.discountPercent || 0)) / 100;
                    const taxPaise =
                      ((grossPaise - discPaise) *
                        Number(
                          it.taxRatePercent !== undefined ? it.taxRatePercent : 18,
                        )) /
                      100;
                    const totalVal = (grossPaise - discPaise + taxPaise) / 100;

                    // Check if already ordered in any existing order
                    const alreadyOrderedIn = (quoteOrders || []).find((ord) =>
                      (ord.items || []).some(
                        (oIt) => Number(oIt.quotationItemIndex) === idx,
                      ),
                    );

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          const current = convertForm.selectedItemIndexes;
                          const next = current.includes(idx)
                            ? current.filter((i) => i !== idx)
                            : [...current, idx];
                          setConvertForm({ ...convertForm, selectedItemIndexes: next });
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-indigo-50/70 border-indigo-300 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by parent div
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 pointer-events-none"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">
                                {it.title || "Print Item"}
                              </span>
                              {alreadyOrderedIn && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  Ordered in {alreadyOrderedIn.orderNumber}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span>
                                Qty: <strong>{it.quantity}</strong> × ₹
                                {(
                                  it.unitRatePaise
                                    ? it.unitRatePaise / 100
                                    : it.rate || 0
                                ).toLocaleString("en-IN")}
                              </span>
                              {it.width && it.height && (
                                <span>
                                  • Size: {it.width}×{it.height}{" "}
                                  {it.dimensionUnit || "inch"}
                                </span>
                              )}
                              {it.paperType && <span>• Media: {it.paperType}</span>}
                              {it.colors && <span>• Colors: {it.colors}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-xs text-slate-900 block">
                            ₹
                            {totalVal.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                          <span className="text-[10px] text-slate-400">incl. GST</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {convertForm.selectedItemIndexes.length === 0 && (
                  <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Please select at least one item to generate this order.
                  </p>
                )}
              </div>

              {/* Step 2: Designer Assignment */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] font-bold flex items-center justify-center">
                    2
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Designer Assignment &amp; Artwork Instructions
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-700 font-semibold text-xs block mb-1">
                      Assign Designer for this Order
                    </label>
                    <select
                      value={convertForm.assignedDesignerId}
                      onChange={(e) =>
                        setConvertForm({
                          ...convertForm,
                          assignedDesignerId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-purple-500/20"
                    >
                      <option value="">-- Unassigned (Assign Designer Later) --</option>
                      {designers.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name || u.email} ({u.roleSlug || u.role?.name || u.role || "Staff"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold text-xs block mb-1">
                      Design Artwork Due Date
                    </label>
                    <input
                      type="date"
                      value={convertForm.designDeadline}
                      onChange={(e) =>
                        setConvertForm({
                          ...convertForm,
                          designDeadline: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-slate-700 font-semibold text-xs block mb-1">
                      Design Instructions / Brief for Assigned Designer
                    </label>
                    <textarea
                      rows={2}
                      value={convertForm.designNotes}
                      onChange={(e) =>
                        setConvertForm({
                          ...convertForm,
                          designNotes: e.target.value,
                        })
                      }
                      placeholder="Specific instructions for this designer (e.g., Flag artwork specifications, bleed, color profiles, client logo guidelines)..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Production & Commercial Details */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
                    3
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Delivery &amp; Advance Payment Configuration
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-slate-700 font-semibold text-xs block mb-1">
                      Promised Delivery Date
                    </label>
                    <input
                      type="date"
                      value={convertForm.promisedDeliveryDate}
                      onChange={(e) =>
                        setConvertForm({
                          ...convertForm,
                          promisedDeliveryDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold text-xs block mb-1">
                      Delivery Method
                    </label>
                    <select
                      value={convertForm.deliveryMethod}
                      onChange={(e) =>
                        setConvertForm({
                          ...convertForm,
                          deliveryMethod: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold"
                    >
                      <option value="PICKUP">Pickup at Workshop</option>
                      <option value="STANDARD_DELIVERY">Standard Local Delivery</option>
                      <option value="EXPRESS_COURIER">Express Courier</option>
                      <option value="SELF_INSTALLATION">On-site Installation</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold text-xs block mb-1">
                      Advance Required (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={convertForm.advanceRequiredPercent}
                      onChange={(e) =>
                        setConvertForm({
                          ...convertForm,
                          advanceRequiredPercent: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Live Calculation Summary */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 border border-indigo-200/80 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider block">
                    ORDER FINANCIAL PREVIEW ({convertForm.selectedItemIndexes.length} item{convertForm.selectedItemIndexes.length === 1 ? "" : "s"} selected)
                  </span>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <span>
                      Subtotal:{" "}
                      <strong>
                        ₹
                        {convertSubtotal.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </strong>
                    </span>
                    <span>
                      GST Tax:{" "}
                      <strong>
                        ₹
                        {convertGst.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </strong>
                    </span>
                    <span className="text-indigo-900 font-bold">
                      Advance Req ({convertForm.advanceRequiredPercent || 50}%): ₹
                      {convertAdvanceReq.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                    Order Grand Total
                  </span>
                  <span className="font-mono text-xl font-black text-indigo-900">
                    ₹
                    {convertGrandTotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConvertOrderModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    actionLoading || convertForm.selectedItemIndexes.length === 0
                  }
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating Order...
                    </>
                  ) : (
                    <>
                      <Layers className="w-4 h-4" />
                      Generate Order ({convertForm.selectedItemIndexes.length} item{convertForm.selectedItemIndexes.length === 1 ? "" : "s"})
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* DIRECT QUOTATION PAYMENT MODAL (PRODUCTS / HARDWARE WITHOUT ORDERS) */}
      {showDirectPaymentModal && selectedQuote && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl p-6 md:p-8 space-y-6 shadow-2xl animate-scale-up max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Record Direct Payment (Products / Retail)
                    </h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                      {selectedQuote.quotationNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pay directly for items (e.g. iron rod, hardware, materials) without sending them to designers or creating production orders.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDirectPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informative Notice */}
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                <Check className="w-4 h-4 font-bold" />
              </div>
              <div className="text-xs">
                <strong className="block font-bold text-emerald-950">
                  Direct Payment Flow (Quotation → Payment Only)
                </strong>
                <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                  Items selected below will be settled directly. They will <strong>NOT</strong> create an order and will <strong>NOT</strong> be sent to any designer or production queue.
                </p>
              </div>
            </div>

            <form onSubmit={handleRecordDirectPayment} className="space-y-6">
              {/* Step 1: Select Items to Pay For */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
                      1
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Select Quotation Item(s) to Pay For
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        const allIdx = (selectedQuote.items || []).map((_, i) => i);
                        const selTotal = allIdx.reduce((sum, idx) => {
                          const it = selectedQuote.items[idx];
                          const itemPrice = (it?.itemTotalPaise || 0) / 100;
                          const alreadyPaid = (it?.directPaymentPaidPaise || 0) / 100;
                          return sum + Math.max(0, itemPrice - alreadyPaid);
                        }, 0);
                        setDirectPaymentForm({
                          ...directPaymentForm,
                          selectedItemIndexes: allIdx,
                          amount: selTotal > 0 ? selTotal.toFixed(2) : directPaymentForm.amount,
                        });
                      }}
                      className="text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() =>
                        setDirectPaymentForm({
                          ...directPaymentForm,
                          selectedItemIndexes: [],
                          amount: "0",
                        })
                      }
                      className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
                  {(selectedQuote.items || []).map((it, idx) => {
                    const isSelected = (directPaymentForm.selectedItemIndexes || [])
                      .map(Number)
                      .includes(Number(idx));
                    const itemTotal = (it.itemTotalPaise || 0) / 100;
                    const alreadyPaid = (it.directPaymentPaidPaise || 0) / 100;
                    const remainingItemPayable = Math.max(0, itemTotal - alreadyPaid);
                    const isFullyPaid = it.directPaymentStatus === "PAID" || remainingItemPayable <= 0.01;

                    return (
                      <div
                        key={idx}
                        onClick={() => handleToggleDirectItem(idx)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id={`direct-chk-${idx}`}
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleDirectItem(idx);
                            }}
                            className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">
                                {it.title || "Quotation Item"}
                              </span>
                              {isSelected && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 text-white">
                                  ✓ Selected for Direct Payment
                                </span>
                              )}
                              {isFullyPaid ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  ✓ Fully Paid Directly
                                </span>
                              ) : it.directPaymentStatus === "PARTIALLY_PAID" ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  Partially Paid: ₹{alreadyPaid.toLocaleString("en-IN")}
                                </span>
                              ) : null}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span>
                                Qty: <strong>{it.quantity}</strong>
                              </span>
                              <span>
                                • Line Total: <strong>₹{itemTotal.toLocaleString("en-IN")}</strong>
                              </span>
                              {alreadyPaid > 0 && !isFullyPaid && (
                                <span className="text-amber-700 font-semibold">
                                  • Remaining: ₹{remainingItemPayable.toLocaleString("en-IN")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-slate-900 block">
                            ₹{remainingItemPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {isFullyPaid ? "Paid in full" : "Payable"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Calculation Summary */}
                {directPaymentForm.selectedItemIndexes.length > 0 && (() => {
                  const selSum = directPaymentForm.selectedItemIndexes.reduce((sum, idx) => {
                    const it = selectedQuote.items[idx];
                    const itemPrice = (it?.itemTotalPaise || 0) / 100;
                    const alreadyPaid = (it?.directPaymentPaidPaise || 0) / 100;
                    return sum + Math.max(0, itemPrice - alreadyPaid);
                  }, 0);

                  return (
                    <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                      <span className="text-emerald-900 font-semibold">
                        Total Remaining Balance for Selected ({directPaymentForm.selectedItemIndexes.length} item{directPaymentForm.selectedItemIndexes.length === 1 ? "" : "s"}):
                      </span>
                      <strong className="text-emerald-900 font-mono text-sm font-bold">
                        ₹{selSum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                  );
                })()}
              </div>

              {/* Step 2: Payment Particulars */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
                    2
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Payment Particulars
                  </h4>
                </div>

                {/* Payment Type Selection (Advance / Part / Full Settlement) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Payment Category
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: "ADVANCE", label: "Advance Payment", desc: "Token / Deposit payment" },
                      { id: "PART_PAYMENT", label: "Part Payment", desc: "Partial milestone installment" },
                      { id: "FINAL_SETTLEMENT", label: "Full Settlement", desc: "100% total balance" },
                    ].map((pt) => {
                      const isChosen = directPaymentForm.paymentType === pt.id;
                      return (
                        <button
                          key={pt.id}
                          type="button"
                          onClick={() => {
                            const selSum = (directPaymentForm.selectedItemIndexes || []).reduce((sum, idx) => {
                              const it = selectedQuote?.items?.[idx];
                              const price = (it?.itemTotalPaise || 0) / 100;
                              const paid = (it?.directPaymentPaidPaise || 0) / 100;
                              return sum + Math.max(0, price - paid);
                            }, 0);
                            let newAmt = directPaymentForm.amount;
                            if (pt.id === "FINAL_SETTLEMENT") {
                              newAmt = selSum > 0 ? selSum.toFixed(2) : "0";
                            } else if (pt.id === "ADVANCE" && (!Number(newAmt) || Number(newAmt) === selSum)) {
                              newAmt = (selSum * 0.5).toFixed(2);
                            }
                            setDirectPaymentForm({
                              ...directPaymentForm,
                              paymentType: pt.id,
                              amount: newAmt,
                            });
                          }}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isChosen
                              ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20"
                              : "bg-slate-50 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="font-bold text-xs text-slate-900">{pt.label}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{pt.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Amount with Quick Percentages */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Payment Amount (₹) <span className="text-red-500">*</span>
                      </label>
                      {directPaymentForm.selectedItemIndexes.length > 0 && (() => {
                        const selSum = directPaymentForm.selectedItemIndexes.reduce((sum, idx) => {
                          const it = selectedQuote.items[idx];
                          const price = (it?.itemTotalPaise || 0) / 100;
                          const paid = (it?.directPaymentPaidPaise || 0) / 100;
                          return sum + Math.max(0, price - paid);
                        }, 0);
                        return (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setDirectPaymentForm({
                                  ...directPaymentForm,
                                  amount: (selSum * 0.5).toFixed(2),
                                })
                              }
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                            >
                              50%
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDirectPaymentForm({
                                  ...directPaymentForm,
                                  amount: selSum.toFixed(2),
                                })
                              }
                              className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold cursor-pointer"
                            >
                              100%
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        value={directPaymentForm.amount}
                        onChange={(e) =>
                          setDirectPaymentForm({
                            ...directPaymentForm,
                            amount: e.target.value,
                          })
                        }
                        className="w-full pl-8 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Payment Method <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={directPaymentForm.paymentMethod}
                      onChange={(e) =>
                        setDirectPaymentForm({
                          ...directPaymentForm,
                          paymentMethod: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI / QR Code</option>
                      <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="CARD">Debit / Credit Card</option>
                    </select>
                  </div>

                  {/* Transaction Ref (for UPI/Bank/Card) */}
                  {["UPI", "BANK_TRANSFER", "CARD"].includes(directPaymentForm.paymentMethod) && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Transaction Reference / UTR Number
                      </label>
                      <input
                        type="text"
                        value={directPaymentForm.transactionReference}
                        onChange={(e) =>
                          setDirectPaymentForm({
                            ...directPaymentForm,
                            transactionReference: e.target.value,
                          })
                        }
                        placeholder="e.g. UPI Ref / Bank UTR #12345678"
                        className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 shadow-2xs"
                      />
                    </div>
                  )}

                  {/* Cheque Details */}
                  {directPaymentForm.paymentMethod === "CHEQUE" && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Cheque Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={directPaymentForm.chequeNumber}
                          onChange={(e) =>
                            setDirectPaymentForm({
                              ...directPaymentForm,
                              chequeNumber: e.target.value,
                            })
                          }
                          placeholder="e.g. 000123"
                          className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 shadow-2xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Bank Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={directPaymentForm.bankName}
                          onChange={(e) =>
                            setDirectPaymentForm({
                              ...directPaymentForm,
                              bankName: e.target.value,
                            })
                          }
                          placeholder="e.g. HDFC Bank, SBI"
                          className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 shadow-2xs"
                          required
                        />
                      </div>
                    </>
                  )}

                  {/* Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Internal Notes / Remarks
                    </label>
                    <input
                      type="text"
                      value={directPaymentForm.notes}
                      onChange={(e) =>
                        setDirectPaymentForm({
                          ...directPaymentForm,
                          notes: e.target.value,
                        })
                      }
                      placeholder="e.g. Direct payment for iron rod (no order / no design)"
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDirectPaymentModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    paymentSubmitting ||
                    directPaymentForm.selectedItemIndexes.length === 0 ||
                    !Number(directPaymentForm.amount)
                  }
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {paymentSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Recording Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Record Direct Payment (₹{Number(directPaymentForm.amount || 0).toLocaleString("en-IN")}) — No Order Created
                    </>
                  )}
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
              <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-blue-600" />
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
