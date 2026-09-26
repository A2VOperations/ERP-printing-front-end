"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import { CardGridSkeleton } from "@/app/components/ui/skeleton";

import {
  ShoppingBag,
  CreditCard,
  Search,
  RefreshCw,
  Download,
  Building2,
  Printer,
  Edit3,
  Layers,
  Palette,
  Eye,
  Phone,
  Mail,
  MessageSquare,
  MessageCircle,
  ArrowUpRight,
  X,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function OrdersBillingPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("admin");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Specific Design Status States
  const [designStatusFilter, setDesignStatusFilter] = useState("ALL");
  const [selectedDesignOrder, setSelectedDesignOrder] = useState(null);
  const [designProjectDetails, setDesignProjectDetails] = useState(null);
  const [loadingDesignDetails, setLoadingDesignDetails] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem("userRole") || "admin").toLowerCase();
    setUserRole(stored);
  }, []);

  const isSalesRole =
    userRole.includes("sales") ||
    userRole.includes("employee") ||
    userRole.includes("executive");

  const handleOpenDesignStatus = async (order) => {
    setSelectedDesignOrder(order);
    setDesignProjectDetails(null);
    setLoadingDesignDetails(true);
    try {
      const res = await api.get(`/design-projects?orderId=${order._id}`);
      const list = Array.isArray(res) ? res : res?.data || res?.projects || [];
      if (list.length > 0) {
        const proj = list[0];
        const [versionsRes, revisionsRes] = await Promise.allSettled([
          api.get(`/design-projects/${proj._id}/versions`),
          api.get(`/design-projects/${proj._id}/revisions`),
        ]);
        const versions =
          versionsRes.status === "fulfilled"
            ? versionsRes.value?.versions || versionsRes.value?.data || []
            : [];
        const revisions =
          revisionsRes.status === "fulfilled"
            ? revisionsRes.value?.revisions || revisionsRes.value?.data || []
            : [];
        setDesignProjectDetails({
          ...proj,
          versions,
          revisions,
        });
      }
    } catch (err) {
      console.error("Failed to fetch specific design project details:", err);
    } finally {
      setLoadingDesignDetails(false);
    }
  };

  // Payment Form State
  const [paymentAmountRupees, setPaymentAmountRupees] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [referenceNumber, setReferenceNumber] = useState("");

  // Technical Specifications Form State
  const [showSpecsModal, setShowSpecsModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [savingSpecs, setSavingSpecs] = useState(false);
  const [specsForm, setSpecsForm] = useState({
    width: "",
    height: "",
    dimensionUnit: "inch",
    quantity: 1,
    material: "",
    gsm: "",
    colors: "CMYK",
    dpi: 100,
    printSides: "SINGLE",
    finishing: [],
    designNotes: "",
    designDeadline: "",
  });

  const handleOpenSpecsModal = (order) => {
    setEditingOrder(order);
    const item = order.items?.[0] || {};
    setSpecsForm({
      width: item.width !== null && item.width !== undefined ? item.width : "",
      height:
        item.height !== null && item.height !== undefined ? item.height : "",
      dimensionUnit: item.dimensionUnit || "inch",
      quantity: item.quantity || 1,
      material: item.paperType || "",
      gsm:
        item.paperGsm !== null && item.paperGsm !== undefined
          ? item.paperGsm
          : "",
      colors: item.colors || "CMYK",
      dpi: item.dpi || 100,
      printSides: item.printSides || "SINGLE",
      finishing: Array.isArray(item.finishing) ? item.finishing : [],
      designNotes: order.designNotes || "",
      designDeadline: order.designDeadline
        ? new Date(order.designDeadline).toISOString().split("T")[0]
        : "",
    });
    setShowSpecsModal(true);
  };

  const handleSaveOrderSpecs = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;
    try {
      setSavingSpecs(true);
      await api.patch(`/orders/${editingOrder._id}/specifications`, specsForm);
      setShowSpecsModal(false);
      await loadOrders();
    } catch (err) {
      alert(err.message || "Failed to update order specifications");
    } finally {
      setSavingSpecs(false);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/orders");
      if (res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const amountNum = Number(paymentAmountRupees);
    if (!amountNum || isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a valid payment amount greater than ₹0.");
      return;
    }

    const orderBalanceRupees = (selectedOrder.balancePaise !== undefined
      ? selectedOrder.balancePaise
      : selectedOrder.grandTotalPaise || 0) / 100;
    const orderTotalRupees = (selectedOrder.grandTotalPaise || 0) / 100;

    if (amountNum > orderBalanceRupees) {
      alert(
        `[Payment Rejected - Amount Mismatch]\n\n` +
        `Entered Amount: ₹${amountNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}\n` +
        `Allowable Balance: ₹${orderBalanceRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })} (Order Total: ₹${orderTotalRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })})\n\n` +
        `The client cannot pay more than the agreed total of ₹${orderBalanceRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}.\n` +
        `Overpayments are strictly not accepted. If additional services or quantities are required, please create a new quotation or a new order.`
      );
      return;
    }

    const mappedMethod =
      paymentMethod === "BANK_TRANSFER"
        ? "BANK_TRANSFER_NEFT_RTGS"
        : paymentMethod;

    try {
      await api.post(`/payments/orders/${selectedOrder._id}`, {
        amountPaise: Math.round(amountNum * 100),
        paymentMethod: mappedMethod,
        method: mappedMethod,
        transactionReference: referenceNumber,
        referenceNumber,
      });
      alert("Payment Recorded Successfully & Ledger Updated!");
      setShowPaymentModal(false);
      setPaymentAmountRupees("");
      setReferenceNumber("");
      loadOrders();
    } catch (err) {
      alert(err.message || "Failed to record payment");
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      (o.orderNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (
        o.customerId?.name ||
        o.customerSnapshot?.displayName ||
        o.customerSnapshot?.companyName ||
        ""
      )
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const ds = (
      o.designStatus || (o.assignedDesignerId ? "IN_DESIGN" : "PENDING_DESIGN")
    ).toUpperCase();

    const matchesDesignStatus =
      designStatusFilter === "ALL" ||
      (designStatusFilter === "IN_DESIGN" &&
        (ds === "IN_DESIGN" || ds === "PENDING_DESIGN")) ||
      (designStatusFilter === "PROOF_SHARED" &&
        (ds === "PROOF_SHARED" || ds === "CLIENT_REVIEW")) ||
      (designStatusFilter === "REVISION_REQUESTED" &&
        ds === "REVISION_REQUESTED") ||
      (designStatusFilter === "DESIGN_APPROVED" &&
        (ds === "DESIGN_APPROVED" || ds === "APPROVED")) ||
      (designStatusFilter === "COMPLETED" &&
        (ds === "COMPLETED" || ds === "PRODUCTION_LOCKED"));

    return matchesSearch && matchesDesignStatus;
  });

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
                Orders & Commercial Billing
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Strict Payment Immutability, 50% Advance Requirement & Invoicing
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search order # or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 shadow-xs w-64 transition-all"
                />
              </div>
              <button
                onClick={loadOrders}
                disabled={loading}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-xs transition-colors cursor-pointer"
                title="Refresh Orders"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Specific Design Status Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-indigo-600" /> Specific
              Design Status:
            </span>
            {[
              { id: "ALL", label: "All Orders" },
              { id: "IN_DESIGN", label: "🎨 In Design" },
              { id: "PROOF_SHARED", label: "👁️ Client Proof Review" },
              { id: "REVISION_REQUESTED", label: "🔄 Revision Requested" },
              { id: "DESIGN_APPROVED", label: "✅ Client Approved" },
              { id: "COMPLETED", label: "🔒 Production Locked" },
            ].map((tab) => {
              const active = designStatusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setDesignStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <CardGridSkeleton count={6} />
          ) : filteredOrders.length === 0 ? (
            <div className="h-64 border border-dashed border-slate-200 rounded-md flex flex-col items-center justify-center text-slate-400 gap-2 bg-white shadow-xs">
              <ShoppingBag className="w-8 h-8 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">
                No orders found
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredOrders.map((ord) => {
                const totalRupees = (ord.grandTotalPaise || 0) / 100;
                const balanceRupees = (ord.balancePaise || 0) / 100;
                const paidRupees = totalRupees - balanceRupees;
                const isCleared =
                  ord.commercialStatus === "CLEARED" || ord.commercialReady;

                return (
                  <div
                    key={ord._id}
                    className="p-5 rounded-md bg-white border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                        {ord.orderNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ord.orderStatus === "PRODUCTION"
                            ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                            : ord.orderStatus === "APPROVAL"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : ord.orderStatus === "DESIGN"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {ord.orderStatus}
                      </span>
                    </div>

                    {/* Designer & Order Status Tracking */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Palette className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="text-slate-500 font-medium">
                          Designer:
                        </span>
                        <strong className="text-slate-800 font-bold truncate">
                          {ord.assignedDesignerId?.name ||
                            (typeof ord.assignedDesignerId === "string"
                              ? "Assigned"
                              : "Not Assigned")}
                        </strong>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider ${
                            ord.designStatus === "DESIGN_APPROVED" ||
                            ord.designStatus === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : ord.designStatus === "IN_DESIGN"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : ord.designStatus === "PROOF_SHARED"
                                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                                  : ord.designStatus === "REVISION_REQUESTED"
                                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                                    : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {ord.designStatus?.replace(/_/g, " ") ||
                            (ord.assignedDesignerId
                              ? "IN DESIGN"
                              : "PENDING DESIGN")}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenDesignStatus(ord)}
                          className="px-2 py-0.5 rounded text-[10px] text-indigo-700 bg-white hover:bg-indigo-100 border border-indigo-200 font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="View specific design status & proof details to contact customer"
                        >
                          <Eye className="w-3 h-3 text-indigo-600" />
                          <span>Status →</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-bold text-slate-900">
                        ₹
                        {totalRupees.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {ord.customerId?.name || "Customer"}
                      </p>
                    </div>

                    {/* Product & Print Technical Specifications */}
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 text-[11px] text-slate-600 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-blue-600" />{" "}
                          Specs:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">
                            {ord.items?.[0]?.width || 0}×
                            {ord.items?.[0]?.height || 0}{" "}
                            {ord.items?.[0]?.dimensionUnit || "inch"} •{" "}
                            {ord.items?.[0]?.quantity || 1} Units
                          </span>
                          {!isSalesRole && (
                            <button
                              type="button"
                              onClick={() => handleOpenSpecsModal(ord)}
                              className="p-1 rounded hover:bg-slate-200 text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                              title="Edit Technical Specifications"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span className="truncate max-w-37.5">
                          {ord.items?.[0]?.paperType || "Standard Media"}{" "}
                          {ord.items?.[0]?.paperGsm
                            ? `(${ord.items[0].paperGsm} GSM)`
                            : ""}
                        </span>
                        <span className="text-blue-600 font-semibold">
                          {ord.items?.[0]?.colors || "CMYK"} •{" "}
                          {ord.items?.[0]?.dpi || 100} DPI
                        </span>
                      </div>
                      {ord.items?.[0]?.finishing &&
                      ord.items[0].finishing.length > 0 ? (
                        <div className="text-[10px] text-amber-700 font-medium truncate">
                          Finishing: {ord.items[0].finishing.join(", ")}
                        </div>
                      ) : null}
                    </div>

                    {/* Advance / Commercial Status Indicator */}
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">
                          Commercial Status:
                        </span>
                        <span
                          className={`font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                            isCleared
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {ord.creditBypassApplied
                            ? "Credit Client Bypass"
                            : isCleared
                              ? "Commercial Cleared"
                              : "Pending 50% Advance"}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>
                          Paid:{" "}
                          <strong className="text-slate-800 font-semibold">
                            ₹{paidRupees.toFixed(2)}
                          </strong>
                        </span>
                        <span>
                          Balance:{" "}
                          <strong className="text-slate-800 font-semibold">
                            ₹{balanceRupees.toFixed(2)}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const cId =
                            ord.customerId?._id || ord.customerId || "";
                          const phone =
                            ord.customerId?.phone ||
                            ord.customerSnapshot?.phone ||
                            "";
                          const orderNo = ord.orderNumber || "";
                          router.push(
                            `/dashboard/whatsapp?customerId=${cId}&phone=${phone}&orderNo=${orderNo}&template=order_update`,
                          );
                        }}
                        className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
                        title="Contact Customer via WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        WhatsApp
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenSpecsModal(ord)}
                        className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors cursor-pointer"
                        title="Edit Technical Specifications & Designer Handoff"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        Specs
                      </button>

                      <button
                        onClick={async () => {
                          try {
                            await api.downloadPdf(
                              `/orders/${ord._id}/invoice`,
                              `TaxInvoice-${ord.orderNumber || ord._id}.pdf`,
                            );
                          } catch (err) {
                            alert(
                              err.message || "Failed to download Invoice PDF",
                            );
                          }
                        }}
                        className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                        title="Download Tax Invoice PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Invoice PDF
                      </button>

                      {["PRODUCTION", "APPROVAL", "CONFIRMED"].includes(
                        ord.orderStatus,
                      ) && (
                        <Link
                          href="/dashboard/production"
                          className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 text-xs font-semibold transition-colors"
                          title="View Production Jobs on Workshop Floor"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Production</span>
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          setSelectedOrder(ord);
                          setPaymentAmountRupees(
                            balanceRupees > 0 ? balanceRupees.toFixed(2) : "0",
                          );
                          setShowPaymentModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Record Payment
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Record Payment Modal */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-md w-full max-w-md p-6 space-y-4 shadow-xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Record Payment
                </h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Order Payment Summary */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">
                  Order Number:
                </span>
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {selectedOrder.orderNumber}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 text-center">
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Total
                  </span>
                  <strong className="text-slate-800 font-bold text-xs">
                    ₹
                    {(
                      (selectedOrder.grandTotalPaise || 0) / 100
                    ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-emerald-600 font-medium block">
                    Paid
                  </span>
                  <strong className="text-emerald-700 font-bold text-xs">
                    ₹
                    {(
                      ((selectedOrder.grandTotalPaise || 0) -
                        (selectedOrder.balancePaise || 0)) /
                      100
                    ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div className="bg-blue-50/80 p-2 rounded-lg border border-blue-200/60">
                  <span className="text-[10px] text-blue-700 font-medium block">
                    Balance Due
                  </span>
                  <strong className="text-blue-800 font-black text-xs">
                    ₹
                    {((selectedOrder.balancePaise || 0) / 100).toLocaleString(
                      "en-IN",
                      { minimumFractionDigits: 2 },
                    )}
                  </strong>
                </div>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-700 font-semibold block">
                    Amount (₹) *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const bal = (selectedOrder.balancePaise || 0) / 100;
                      setPaymentAmountRupees(bal > 0 ? bal.toFixed(2) : "0");
                    }}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
                  >
                    Set Full Balance (₹
                    {((selectedOrder.balancePaise || 0) / 100).toFixed(2)})
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={(selectedOrder.balancePaise !== undefined ? selectedOrder.balancePaise : selectedOrder.grandTotalPaise || 0) / 100}
                  required
                  value={paymentAmountRupees}
                  onChange={(e) => setPaymentAmountRupees(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl bg-slate-50 border text-slate-900 font-semibold text-sm focus:outline-none focus:bg-white ${
                    Number(paymentAmountRupees || 0) > ((selectedOrder.balancePaise !== undefined ? selectedOrder.balancePaise : selectedOrder.grandTotalPaise || 0) / 100)
                      ? "border-rose-400 focus:border-rose-600 bg-rose-50/30"
                      : "border-slate-200 focus:border-blue-600"
                  }`}
                />
                {(() => {
                  const balRupees = (selectedOrder.balancePaise !== undefined ? selectedOrder.balancePaise : selectedOrder.grandTotalPaise || 0) / 100;
                  const amt = Number(paymentAmountRupees || 0);
                  if (amt > balRupees) {
                    return (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 mt-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">Payment Exceeds Allowed Amount</span>
                          <span>
                            The entered payment (₹{amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}) exceeds the maximum allowed balance of ₹{balRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}.
                          </span>
                          <p className="mt-1 text-[11px] text-rose-700">
                            Overpayment is not accepted. If the client is paying for additional scope or quantities, please create a new quotation or a new order.
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                >
                  <option value="UPI">UPI / QR Code</option>
                  <option value="BANK_TRANSFER">
                    Bank Transfer (NEFT/RTGS/IMPS)
                  </option>
                  <option value="CASH">Cash in Hand</option>
                  <option value="CHEQUE">Cheque (Requires Clearing)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Reference / UTR / Cheque Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR-982138923 or Cheque #000124"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !paymentAmountRupees ||
                    Number(paymentAmountRupees) <= 0 ||
                    Number(paymentAmountRupees) >
                      ((selectedOrder.balancePaise !== undefined
                        ? selectedOrder.balancePaise
                        : selectedOrder.grandTotalPaise || 0) / 100)
                  }
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold shadow-xs cursor-pointer transition-opacity"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Specifications Modal (Salesperson Designer Handoff) */}
      {showSpecsModal && editingOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-md w-full max-w-xl p-6 space-y-4 shadow-xl animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-blue-600">
                <Layers className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">
                  Product Technical Specifications ({editingOrder.orderNumber})
                </h3>
              </div>
              <button
                onClick={() => setShowSpecsModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Update technical specs for designer handoff. Changes sync directly
              to the assigned designer studio.
            </p>

            <form onSubmit={handleSaveOrderSpecs} className="space-y-4 text-xs">
              {/* Dimensions & Quantity */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2.5">
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                  1. Size &amp; Quantity
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
                      value={specsForm.width}
                      onChange={(e) =>
                        setSpecsForm({ ...specsForm, width: e.target.value })
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
                      value={specsForm.height}
                      onChange={(e) =>
                        setSpecsForm({ ...specsForm, height: e.target.value })
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">
                      Unit
                    </label>
                    <select
                      value={specsForm.dimensionUnit || "inch"}
                      onChange={(e) =>
                        setSpecsForm({
                          ...specsForm,
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
                      value={specsForm.quantity || 1}
                      onChange={(e) =>
                        setSpecsForm({ ...specsForm, quantity: e.target.value })
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Material & GSM */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2.5">
                <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block">
                  2. Substrate &amp; GSM
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="text-slate-700 font-semibold block mb-1">
                      Material / Media Substrate
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Star Flex, Art Card, Vinyl..."
                      value={specsForm.material}
                      onChange={(e) =>
                        setSpecsForm({ ...specsForm, material: e.target.value })
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-purple-600"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">
                      GSM / Density
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 350"
                      value={specsForm.gsm}
                      onChange={(e) =>
                        setSpecsForm({ ...specsForm, gsm: e.target.value })
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-purple-600"
                    />
                  </div>
                </div>
              </div>

              {/* Colors & Print Sides */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2.5">
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                  3. Color &amp; Print Sides
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">
                      Color Mode
                    </label>
                    <select
                      value={specsForm.colors || "CMYK"}
                      onChange={(e) =>
                        setSpecsForm({ ...specsForm, colors: e.target.value })
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
                      value={specsForm.printSides || "SINGLE"}
                      onChange={(e) =>
                        setSpecsForm({
                          ...specsForm,
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
                      Target DPI
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        placeholder="100"
                        value={specsForm.dpi}
                        onChange={(e) =>
                          setSpecsForm({ ...specsForm, dpi: e.target.value })
                        }
                        className="w-16 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-amber-700 font-bold font-mono focus:outline-none focus:border-amber-600"
                      />
                      <div className="flex gap-1 flex-1">
                        {[100, 150, 300].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() =>
                              setSpecsForm({ ...specsForm, dpi: preset })
                            }
                            className={`flex-1 px-1 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              Number(specsForm.dpi) === preset
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
                </div>
              </div>

              {/* Finishing Requirements */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2.5">
                <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
                  4. Finishing &amp; Post-Press
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Gloss Lamination",
                    "Matte Lamination",
                    "Velvet Lamination",
                    "UV Coating",
                    "Die Cut",
                    "Eyelets / Grommets",
                    "Hemming / Tape",
                    "Creasing & Folding",
                    "Staple / Binding",
                    "Foiling (Gold/Silver)",
                    "Round Corners",
                  ].map((opt) => {
                    const isSelected =
                      Array.isArray(specsForm.finishing) &&
                      specsForm.finishing.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          const cur = Array.isArray(specsForm.finishing)
                            ? specsForm.finishing
                            : [];
                          if (cur.includes(opt)) {
                            setSpecsForm({
                              ...specsForm,
                              finishing: cur.filter((x) => x !== opt),
                            });
                          } else {
                            setSpecsForm({
                              ...specsForm,
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

              {/* Notes & Target Proof Date */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2.5">
                <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
                  5. Instructions &amp; Target Date
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="text-slate-700 font-semibold block mb-1">
                      Artwork Notes &amp; Special Instructions
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Special instructions for the designer..."
                      value={specsForm.designNotes}
                      onChange={(e) =>
                        setSpecsForm({
                          ...specsForm,
                          designNotes: e.target.value,
                        })
                      }
                      className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">
                      Target Proof Date
                    </label>
                    <input
                      type="date"
                      value={specsForm.designDeadline}
                      onChange={(e) =>
                        setSpecsForm({
                          ...specsForm,
                          designDeadline: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-amber-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {isSalesRole && (
                  <span className="text-[11px] text-slate-500 font-medium italic">
                    Sales View-Only: Technical specifications are managed by
                    design &amp; pre-press.
                  </span>
                )}
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowSpecsModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                  >
                    {isSalesRole ? "Close" : "Cancel"}
                  </button>
                  {!isSalesRole && (
                    <button
                      type="submit"
                      disabled={savingSpecs}
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {savingSpecs ? "Saving..." : "Save Specifications"}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Specific Design Status & Customer Contact Modal */}
      {selectedDesignOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl p-6 space-y-5 shadow-2xl animate-scale-up max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Specific Design Status &amp; Proof Details
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {selectedDesignOrder.orderNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Customer:{" "}
                  <strong className="text-slate-800">
                    {selectedDesignOrder.customerId?.displayName ||
                      selectedDesignOrder.customerId?.companyName ||
                      selectedDesignOrder.customerSnapshot?.displayName ||
                      selectedDesignOrder.customerSnapshot?.companyName ||
                      "Valued Client"}
                  </strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedDesignOrder(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDesignDetails ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
                <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                <span>
                  Fetching live design project details &amp; proofs...
                </span>
              </div>
            ) : (
              <>
                {/* Specific Live Stage Indicator Banner */}
                {(() => {
                  const currentStatus =
                    designProjectDetails?.status ||
                    selectedDesignOrder.designStatus ||
                    (selectedDesignOrder.assignedDesignerId
                      ? "IN_DESIGN"
                      : "PENDING_DESIGN");

                  const stageInfo = {
                    BRIEFING: {
                      label: "Briefing & Pending Designer",
                      desc: "Design specifications received. Waiting for designer to start initial layout.",
                      bg: "bg-amber-50 border-amber-200 text-amber-900",
                      badge: "bg-amber-100 text-amber-800",
                    },
                    PENDING_DESIGN: {
                      label: "Pending Designer Assignment",
                      desc: "Order is commercially active. Ready for designer handoff.",
                      bg: "bg-amber-50 border-amber-200 text-amber-900",
                      badge: "bg-amber-100 text-amber-800",
                    },
                    ASSIGNED: {
                      label: "Designer Assigned",
                      desc: "Designer has been assigned and is reviewing the brief requirements.",
                      bg: "bg-blue-50 border-blue-200 text-blue-900",
                      badge: "bg-blue-100 text-blue-800",
                    },
                    IN_DESIGN: {
                      label: "In Design Progress",
                      desc: "The assigned designer is actively working on artwork drafts and proofs.",
                      bg: "bg-blue-50 border-blue-200 text-blue-900",
                      badge: "bg-blue-100 text-blue-800",
                    },
                    IN_PROGRESS: {
                      label: "In Design Progress",
                      desc: "The assigned designer is actively working on artwork drafts and proofs.",
                      bg: "bg-blue-50 border-blue-200 text-blue-900",
                      badge: "bg-blue-100 text-blue-800",
                    },
                    CLIENT_REVIEW: {
                      label: "Client Proof Review (Action Recommended)",
                      desc: "Digital proof has been generated and sent to client. Contact client to obtain design sign-off!",
                      bg: "bg-purple-50 border-purple-200 text-purple-900",
                      badge: "bg-purple-100 text-purple-800",
                    },
                    PROOF_SHARED: {
                      label: "Client Proof Review (Action Recommended)",
                      desc: "Digital proof has been generated and sent to client. Contact client to obtain design sign-off!",
                      bg: "bg-purple-50 border-purple-200 text-purple-900",
                      badge: "bg-purple-100 text-purple-800",
                    },
                    REVISION_REQUESTED: {
                      label: "Revisions Requested",
                      desc: "Client has requested modifications. Designer is amending the artwork accordingly.",
                      bg: "bg-rose-50 border-rose-200 text-rose-900",
                      badge: "bg-rose-100 text-rose-800",
                    },
                    DESIGN_APPROVED: {
                      label: "Design Approved by Client",
                      desc: "Client gave sign-off on the proof. Pre-press preflight and file locking can proceed.",
                      bg: "bg-emerald-50 border-emerald-200 text-emerald-900",
                      badge: "bg-emerald-100 text-emerald-800",
                    },
                    APPROVED: {
                      label: "Design Approved by Client",
                      desc: "Client gave sign-off on the proof. Pre-press preflight and file locking can proceed.",
                      bg: "bg-emerald-50 border-emerald-200 text-emerald-900",
                      badge: "bg-emerald-100 text-emerald-800",
                    },
                    PRODUCTION_LOCKED: {
                      label: "Production Locked & Ready to Print",
                      desc: "Artwork file is cryptographically locked with SHA-256 seal and queued for press.",
                      bg: "bg-cyan-50 border-cyan-200 text-cyan-900",
                      badge: "bg-cyan-100 text-cyan-800",
                    },
                    COMPLETED: {
                      label: "Production Locked & Completed",
                      desc: "Artwork file is cryptographically locked with SHA-256 seal and queued for press.",
                      bg: "bg-cyan-50 border-cyan-200 text-cyan-900",
                      badge: "bg-cyan-100 text-cyan-800",
                    },
                  };

                  const currentInfo =
                    stageInfo[currentStatus] || stageInfo.IN_DESIGN;

                  return (
                    <div
                      className={`p-4 rounded-md border ${currentInfo.bg} space-y-1`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Palette className="w-4 h-4" /> Specific Design Stage:
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${currentInfo.badge}`}
                        >
                          {currentInfo.label}
                        </span>
                      </div>
                      <p className="text-xs">{currentInfo.desc}</p>
                    </div>
                  );
                })()}

                {/* Quick Customer Contact Section */}
                <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-600" /> Customer
                      Contact Information
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Use to contact customer regarding design
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">
                        Client / Business
                      </span>
                      <strong className="text-slate-900 text-sm">
                        {selectedDesignOrder.customerId?.companyName ||
                          selectedDesignOrder.customerId?.displayName ||
                          selectedDesignOrder.customerSnapshot?.companyName ||
                          selectedDesignOrder.customerSnapshot?.displayName ||
                          "Client"}
                      </strong>
                      {selectedDesignOrder.customerId?.contactPersonName && (
                        <span className="text-slate-500 block text-[11px]">
                          Attn:{" "}
                          {selectedDesignOrder.customerId.contactPersonName}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5 sm:text-right">
                      {(() => {
                        const phone =
                          selectedDesignOrder.customerId?.phone ||
                          selectedDesignOrder.customerSnapshot?.phone;
                        const email =
                          selectedDesignOrder.customerId?.email ||
                          selectedDesignOrder.customerSnapshot?.email;

                        <div className="flex flex-wrap sm:justify-end gap-2">
                          {phone && (
                            <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-mono text-xs flex items-center gap-1.5 border border-slate-200">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />{" "}
                              {phone}
                            </span>
                          )}
                          {email && (
                            <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs flex items-center gap-1.5 border border-slate-200">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />{" "}
                              {email}
                            </span>
                          )}
                        </div>;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Assigned Designer & Proof Deadline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-md bg-white border border-slate-200 space-y-1 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Assigned Designer Studio
                    </span>
                    <strong className="text-slate-900 text-sm block">
                      {selectedDesignOrder.assignedDesignerId?.name ||
                        designProjectDetails?.assignedDesignerId?.name ||
                        "No Designer Assigned Yet"}
                    </strong>
                    {(selectedDesignOrder.assignedDesignerId?.email ||
                      designProjectDetails?.assignedDesignerId?.email) && (
                      <span className="text-slate-500 text-[11px] block">
                        {selectedDesignOrder.assignedDesignerId?.email ||
                          designProjectDetails?.assignedDesignerId?.email}
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 rounded-md bg-white border border-slate-200 space-y-1 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Target Proof Deadline
                    </span>
                    <strong className="text-slate-900 text-sm block">
                      {selectedDesignOrder.designDeadline
                        ? new Date(
                            selectedDesignOrder.designDeadline,
                          ).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : designProjectDetails?.dueDate
                          ? new Date(
                              designProjectDetails.dueDate,
                            ).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Not Scheduled"}
                    </strong>
                    <span className="text-slate-500 text-[11px] block">
                      Promised turn-around for customer proof
                    </span>
                  </div>
                </div>

                {/* Proofing Link & Latest Version */}
                {designProjectDetails?.versions &&
                designProjectDetails.versions.length > 0 ? (
                  <div className="p-4 rounded-md bg-purple-50/70 border border-purple-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-purple-600" />
                        <strong className="text-purple-900 text-xs font-bold uppercase tracking-wider">
                          Client Digital Proof (Version{" "}
                          {designProjectDetails?.currentVersionNumber || 1})
                        </strong>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                        Active Proof
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <p className="text-[11px] text-purple-800">
                        Share the live proof link with your customer to view
                        design on desktop or mobile.
                      </p>
                      <Link
                        href={`/dashboard/design?orderId=${selectedDesignOrder._id}`}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all"
                      >
                        Open in Design Studio{" "}
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ) : null}

                {/* Client Revisions List (if any) */}
                {designProjectDetails?.revisions &&
                designProjectDetails.revisions.length > 0 ? (
                  <div className="p-4 rounded-md bg-rose-50/70 border border-rose-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 text-rose-600" />{" "}
                        Client Revision History (
                        {designProjectDetails.revisions.length})
                      </span>
                      <span className="text-[10px] text-rose-700 font-semibold">
                        Latest feedback from client
                      </span>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {designProjectDetails.revisions.map((rev, rIdx) => (
                        <div
                          key={rIdx}
                          className="p-2.5 rounded-xl bg-white border border-rose-100 text-xs text-slate-700 space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <strong className="text-rose-800 font-bold">
                              {rev.reason || "Client Revision Request"}
                            </strong>
                            <span className="text-slate-400">
                              {new Date(rev.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px]">
                            {rev.notes ||
                              rev.feedback ||
                              "Modification requested on design proof."}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Technical Brief Specs Snapshot */}
                <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    Technical Specifications &amp; Notes
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[9px]">
                        Dimensions
                      </span>
                      <strong className="text-slate-800">
                        {selectedDesignOrder.items?.[0]?.width || 0} ×{" "}
                        {selectedDesignOrder.items?.[0]?.height || 0}{" "}
                        {selectedDesignOrder.items?.[0]?.dimensionUnit || "in"}
                      </strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[9px]">
                        Quantity
                      </span>
                      <strong className="text-slate-800">
                        {selectedDesignOrder.items?.[0]?.quantity || 1} Units
                      </strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[9px]">
                        Substrate
                      </span>
                      <strong className="text-slate-800 truncate block">
                        {selectedDesignOrder.items?.[0]?.paperType ||
                          "Standard Media"}
                      </strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[9px]">
                        Color Mode
                      </span>
                      <strong className="text-slate-800">
                        {selectedDesignOrder.items?.[0]?.colors || "CMYK"}
                      </strong>
                    </div>
                  </div>
                  {selectedDesignOrder.designNotes && (
                    <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
                      <strong className="text-slate-800">Instructions:</strong>{" "}
                      {selectedDesignOrder.designNotes}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-medium">
                Sales Read-Only • Updated directly from Design Studio
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/design?orderId=${selectedDesignOrder._id}`}
                  className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-all flex items-center gap-1.5"
                >
                  Full Design View <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => setSelectedDesignOrder(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
