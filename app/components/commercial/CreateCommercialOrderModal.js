"use client";

import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  FileText,
  Truck,
  Printer,
  Download,
  X,
  User,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";

export default function CreateCommercialOrderModal(props) {
  if (!props.isOpen) return null;
  return (
    <CreateCommercialOrderDialog
      key={`${props.lead?._id || "lead"}-${props.initialQuotationId || "quote"}`}
      {...props}
    />
  );
}

function CreateCommercialOrderDialog({
  isOpen,
  onClose,
  lead,
  customer,
  quotations = [],
  initialQuotationId = "",
  currentUser,
  onSuccess,
}) {
  const defaultQuote =
    quotations.find((q) => q._id === initialQuotationId) ||
    (quotations.length > 0 ? quotations[0] : null);

  const clientName =
    lead?.businessName ||
    lead?.contactName ||
    customer?.displayName ||
    customer?.companyName ||
    defaultQuote?.customerSnapshot?.displayName ||
    "";
  const contactPhone =
    lead?.phone ||
    customer?.phone ||
    defaultQuote?.customerSnapshot?.phone ||
    "";
  const clientArea =
    lead?.city ||
    customer?.billingAddress?.city ||
    "";
  const clientAddress =
    lead?.address ||
    (typeof customer?.billingAddress === "string"
      ? customer.billingAddress
      : customer?.billingAddress?.street) ||
    "";

  let initialTitle = lead?.requirement || "Commercial Printing Order";
  let initialTotal = lead?.expectedValue || "";
  let initialSize = "";
  let initialQty = "1";
  let initialMaterial = "";
  let initialAdvance = 0;
  let initialBalance = Number(initialTotal) || 0;

  if (defaultQuote) {
    const it0 = defaultQuote.items?.[0];
    if (it0) {
      initialTitle =
        defaultQuote.items?.map((i) => i.title).filter(Boolean).join(", ") ||
        it0.title ||
        initialTitle;
      if (it0.width && it0.height) {
        initialSize = `${it0.width} x ${it0.height} ${it0.dimensionUnit || "inch"}`;
      }
      initialQty = String(it0.quantity || "1");
      initialMaterial = [
        it0.paperType,
        it0.paperGsm ? `${it0.paperGsm} GSM` : "",
      ]
        .filter(Boolean)
        .join(" ");
    }
    const quoteVal = defaultQuote.grandTotalPaise
      ? defaultQuote.grandTotalPaise / 100
      : defaultQuote.totalAmount || 0;
    initialTotal = String(quoteVal);
    const advVal = defaultQuote.advanceReceivedPaise
      ? defaultQuote.advanceReceivedPaise / 100
      : Math.round((Number(quoteVal) * 50) / 100);
    initialAdvance = advVal;
    initialBalance = Math.max(0, quoteVal - advVal);
  }

  const userName = currentUser?.name || "Roshni";

  const [activeTab, setActiveTab] = useState("jobCard"); // 'jobCard' or 'vendorJobCard'
  const [actionLoading, setActionLoading] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [downloading, setDownloading] = useState(null);

  // General Order State
  const [selectedQuotationId, setSelectedQuotationId] = useState(defaultQuote?._id || "");
  const [selectedItemIndex, setSelectedItemIndex] = useState("");
  const [title, setTitle] = useState(initialTitle);
  const [totalOrderValue, setTotalOrderValue] = useState(String(initialTotal));

  // Designer / Main Job Card State (Image 2)
  const [jobCard, setJobCard] = useState(() => ({
    priority: "Normal",
    clientBusiness: clientName,
    contactNo: contactPhone,
    area: clientArea,
    address: clientAddress,
    workType: [initialTitle.includes("Flex") ? "Flex / Board" : "Visiting Card"],
    workTypeOther: "",
    size: initialSize,
    qty: initialQty,
    materialGsm: initialMaterial,
    printType: "Colour",
    finishing: ["Cutting"],
    frame: "",
    designRequired: "Yes",
    designer: "",
    status: "Pending",
    amountTotal: Number(initialTotal) || 0,
    amountAdvance: initialAdvance,
    amountBalance: initialBalance,
    deliveryRequired: "No",
    deliveryDate: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
    salesExecutive: ["Roshni", "Tanya"].includes(userName) ? userName : "Roshni",
    salesExecutiveOther: ["Roshni", "Tanya"].includes(userName) ? "" : userName,
  }));

  // Vendor Job Card State (Image 1)
  const [enableVendorCard, setEnableVendorCard] = useState(true);
  const [vendorJobCard, setVendorJobCard] = useState({
    vendorName: "",
    vendorContact: "",
    vendorLocation: "",
    goToFor: ["Print"],
    goToForOther: "",
    workDetails: [initialTitle.includes("Flex") ? "Flex / Board" : "Visiting Card"],
    workDetailsOther: "",
    size: initialSize,
    quantity: initialQty,
    materialGsm: initialMaterial,
    print: ["Colour", "Single Side"],
    finishing: ["Cutting"],
    finishingOther: "",
    specialInstructions: "",
    itemToCollect: ["Printed Material"],
    itemToCollectOther: "",
    route: {
      stop1GoTo: "",
      stop1Work: "",
      stop2GoTo: "",
      stop2Work: "",
      stop3DeliverTo: clientAddress || clientName,
      stop3Work: "Final Deliver & Handover",
    },
    paymentAmount: "",
    paymentMode: "Cash",
    paymentModeOther: "",
    assignedToName: "",
    assignedToContact: "",
    officeGivenBy: userName,
    officeApprovedBy: "",
  });

  const handleModalClose = () => {
    setCreatedOrder(null);
    onClose();
  };

  // Handle quotation dropdown change
  const handleQuotationChange = (qId) => {
    setSelectedQuotationId(qId);
    setSelectedItemIndex("");
    const q = quotations.find((item) => item._id === qId);
    if (!q) return;

    const it0 = q.items?.[0];
    const quoteVal = q.grandTotalPaise ? q.grandTotalPaise / 100 : q.totalAmount || 0;
    const allTitles = q.items?.map((i) => i.title).filter(Boolean).join(", ") || it0?.title || title;

    let sizeStr = "";
    if (it0?.width && it0?.height) {
      sizeStr = `${it0.width} x ${it0.height} ${it0.dimensionUnit || "inch"}`;
    }
    const qtyStr = String(it0?.quantity || "1");
    const matStr = [it0?.paperType, it0?.paperGsm ? `${it0.paperGsm} GSM` : ""].filter(Boolean).join(" ");
    const adv = q.advanceReceivedPaise ? q.advanceReceivedPaise / 100 : Math.round((Number(quoteVal) * 50) / 100);

    setTitle(allTitles);
    setTotalOrderValue(String(quoteVal));

    setJobCard((prev) => ({
      ...prev,
      workType: [it0?.title || "Flex / Board"],
      size: sizeStr || prev.size,
      qty: qtyStr,
      materialGsm: matStr || prev.materialGsm,
      amountTotal: quoteVal,
      amountAdvance: adv,
      amountBalance: Math.max(0, quoteVal - adv),
    }));

    setVendorJobCard((prev) => ({
      ...prev,
      workDetails: [it0?.title || "Flex / Board"],
      size: sizeStr || prev.size,
      quantity: qtyStr,
      materialGsm: matStr || prev.materialGsm,
    }));
  };

  // Handle split item from quotation
  const handleItemSplitChange = (idxStr) => {
    setSelectedItemIndex(idxStr);
    const q = quotations.find((item) => item._id === selectedQuotationId);
    if (!q) return;

    if (idxStr === "") {
      handleQuotationChange(selectedQuotationId);
      return;
    }

    const it = q.items?.[Number(idxStr)];
    if (!it) return;

    const gross = (Number(it.quantity) || 1) * (it.unitRatePaise ? it.unitRatePaise / 100 : it.rate || 0);
    const disc = (gross * Number(it.discountPercent || 0)) / 100;
    const tax = ((gross - disc) * Number(it.taxRatePercent !== undefined ? it.taxRatePercent : 18)) / 100;
    const itemTotal = Math.round(gross - disc + tax);
    const sizeStr = it.width && it.height ? `${it.width} x ${it.height} ${it.dimensionUnit || "inch"}` : "";
    const qtyStr = String(it.quantity || "1");
    const matStr = [it.paperType, it.paperGsm ? `${it.paperGsm} GSM` : ""].filter(Boolean).join(" ");
    const adv = Math.round(itemTotal * 0.5);

    setTitle(it.title || `Item #${Number(idxStr) + 1}`);
    setTotalOrderValue(String(itemTotal));

    setJobCard((prev) => ({
      ...prev,
      workType: [it.title || "Visiting Card"],
      size: sizeStr,
      qty: qtyStr,
      materialGsm: matStr,
      amountTotal: itemTotal,
      amountAdvance: adv,
      amountBalance: itemTotal - adv,
    }));

    setVendorJobCard((prev) => ({
      ...prev,
      workDetails: [it.title || "Visiting Card"],
      size: sizeStr,
      quantity: qtyStr,
      materialGsm: matStr,
    }));
  };

  // Checkbox toggle helpers
  const toggleArrayItem = (list = [], item) => {
    if (list.includes(item)) {
      return list.filter((x) => x !== item);
    }
    return [...list, item];
  };

  // Submit Order Creation
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);

      const parsedTotal = Number(totalOrderValue) || jobCard.amountTotal || 0;
      const parsedAdvance = Number(jobCard.amountAdvance) || 0;
      const advancePercent = parsedTotal > 0 ? Math.round((parsedAdvance / parsedTotal) * 100) : 50;

      const payload = {
        leadId: lead?._id || undefined,
        customerId: customer?._id || lead?.customerId?._id || lead?.customerId || undefined,
        quotationId: selectedQuotationId || undefined,
        selectedItemIndexes:
          selectedItemIndex !== "" && selectedItemIndex !== undefined
            ? [Number(selectedItemIndex)]
            : undefined,
        allowMultipleOrders: true,
        title: title || jobCard.workType?.[0] || "Commercial Printing Order",
        totalAmount: parsedTotal,
        amount: parsedTotal,
        advanceRequiredPercent: advancePercent,
        promisedDeliveryDate: jobCard.deliveryDate || undefined,
        deliveryMethod: jobCard.deliveryRequired === "Yes" ? "STANDARD_DELIVERY" : "PICKUP",
        notes: vendorJobCard.specialInstructions || "",
        // Pass complete Job Card details
        jobCard: {
          ...jobCard,
          amountTotal: parsedTotal,
          amountAdvance: parsedAdvance,
          amountBalance: Math.max(0, parsedTotal - parsedAdvance),
        },
        // Pass complete Vendor Job Card details if enabled
        vendorJobCard: enableVendorCard
          ? {
              ...vendorJobCard,
            }
          : undefined,
      };

      const res = await api.post("/orders", payload);
      const newOrder = res.data || res.order;
      setCreatedOrder(newOrder);

      if (onSuccess) {
        onSuccess(newOrder);
      }
    } catch (err) {
      alert(err.message || "Failed to create commercial order");
    } finally {
      setActionLoading(false);
    }
  };

  // Direct PDF Download
  const handleDownloadJobCardPdf = async (orderId, orderNo) => {
    try {
      setDownloading("jobCard");
      await api.downloadPdf(`/orders/${orderId}/job-card`, `JobCard-${orderNo || orderId}.pdf`);
    } catch (err) {
      alert(err.message || "Failed to download Job Card PDF");
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadVendorPdf = async (orderId, orderNo) => {
    try {
      setDownloading("vendorCard");
      await api.downloadPdf(`/orders/${orderId}/vendor-job-card`, `VendorJobCard-${orderNo || orderId}.pdf`);
    } catch (err) {
      alert(err.message || "Failed to download Vendor Job Card PDF");
    } finally {
      setDownloading(null);
    }
  };

  // Options from Image 2 (Job Card)
  const workTypeOptionsMain = [
    "Visiting Card",
    "Flex / Board",
    "Vinyl",
    "Sticker / Label",
    "Pamphlet",
    "Brochure / Catalogue",
    "Menu Card",
    "Bill Book",
    "T-Shirt / Mug",
  ];

  const finishingOptionsMain = [
    "Cutting",
    "Lamination",
    "Folding",
    "Binding",
    "Mounting",
    "Installation",
  ];

  // Options from Image 1 (Vendor Job Card)
  const vendorWorkDetailsOptions = [
    "Visiting Card",
    "Flex / Board",
    "Vinyl",
    "Sticker / Label",
    "Pamphlet",
    "Brochure / Catalogue",
    "Menu",
    "Bill Book",
    "T-Shirt / Mug",
    "Paper Purchase",
    "Master Print (B/W)",
    "Digital Print (Colour)",
    "Cutting Only",
  ];

  const vendorFinishingOptions = [
    "Cutting",
    "Folding",
    "Binding",
    "Lamination",
  ];

  const vendorItemCollectOptions = [
    "Printed Material",
    "Frame",
    "Flex",
    "Paper",
    "Vinyl",
    "Cut Material",
    "Bill/Invoice",
  ];

  const selectedQuoteObj = quotations.find((q) => q._id === selectedQuotationId);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-scale-up">
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center text-[#F95721]">
              <Printer className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Create Order &amp; Job Cards
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white/10 text-orange-300 border border-white/10">
                  A4 Printable Format
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Generate separate Job Card (Designer) &amp; Vendor Job Card (Logistics)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleModalClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* IF SUCCESS: SHOW INSTANT DOWNLOAD DASHBOARD */}
        {createdOrder ? (
          <div className="p-6 sm:p-8 space-y-6 text-center bg-slate-50 flex-1 overflow-y-auto flex flex-col justify-center items-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">
                Order &amp; Job Cards Created Successfully!
              </h3>
              <p className="text-xs text-slate-500 max-w-md">
                Order <strong className="font-mono text-slate-800">{createdOrder.orderNumber}</strong> has been confirmed. You can now download and print both A4 job cards directly.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg pt-2">
              {/* Designer Job Card Download */}
              <div className="p-4 rounded-xl bg-white border border-orange-200 shadow-sm text-left flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                      Image 2 Reference
                    </span>
                    <FileText className="w-4 h-4 text-orange-500" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Designer Job Card</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    For Salesperson, In-House Designer, and Floor Production Fitter.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadJobCardPdf(createdOrder._id, createdOrder.orderNumber)}
                  disabled={downloading === "jobCard"}
                  className="mt-4 w-full py-2.5 rounded-xl bg-[#F95721] hover:bg-[#e04510] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  {downloading === "jobCard" ? "Generating..." : "Download Job Card (PDF)"}
                </button>
              </div>

              {/* Vendor Job Card Download */}
              <div className="p-4 rounded-xl bg-white border border-indigo-200 shadow-sm text-left flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      Image 1 Reference
                    </span>
                    <Truck className="w-4 h-4 text-indigo-500" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Vendor Job Card</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    For Vendor Outsourcing, Collection checklist, and Multi-stop route.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadVendorPdf(createdOrder._id, createdOrder.orderNumber)}
                  disabled={downloading === "vendorCard"}
                  className="mt-4 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  {downloading === "vendorCard" ? "Generating..." : "Download Vendor Card (PDF)"}
                </button>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={handleModalClose}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                Close &amp; View Orders
              </button>
            </div>
          </div>
        ) : (
          /* ORDER CREATION FORM */
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden text-xs">
            {/* TOP BAR: QUOTATION & TITLE / AMOUNT */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
              {/* Optional Quotation Link */}
              {quotations.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">
                      Convert From Quotation (Optional)
                    </label>
                    <select
                      value={selectedQuotationId}
                      onChange={(e) => handleQuotationChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold"
                    >
                      <option value="">-- Direct Order (No quotation) --</option>
                      {quotations.map((q) => (
                        <option key={q._id} value={q._id}>
                          {q.quotationNumber || q._id} - ₹
                          {(q.grandTotalPaise ? q.grandTotalPaise / 100 : q.totalAmount || 0).toLocaleString("en-IN")}{" "}
                          ({q.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedQuoteObj && selectedQuoteObj.items?.length > 1 && (
                    <div>
                      <label className="text-indigo-950 font-bold block mb-1">
                        Select Item from Quotation (Split Mode)
                      </label>
                      <select
                        value={selectedItemIndex}
                        onChange={(e) => handleItemSplitChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-indigo-50/70 border border-indigo-300 text-indigo-950 font-semibold"
                      >
                        <option value="">-- All Items in Quotation --</option>
                        {selectedQuoteObj.items.map((it, idx) => (
                          <option key={idx} value={idx.toString()}>
                            Item #{idx + 1}: {it.title} (Qty: {it.quantity})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Order Title & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-slate-700 font-bold block mb-1">
                    Order Title / Job Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5000 Brochure Printing or Flex Board 8x4"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Total Order Value (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="e.g. 5000"
                    value={totalOrderValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTotalOrderValue(val);
                      const numVal = Number(val) || 0;
                      const adv = Number(jobCard.amountAdvance) || 0;
                      setJobCard((prev) => ({
                        ...prev,
                        amountTotal: numVal,
                        amountBalance: Math.max(0, numVal - adv),
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* TWO DEDICATED TABS: DESIGNER JOB CARD VS VENDOR JOB CARD */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("jobCard")}
                  className={`flex-1 py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === "jobCard"
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200/90"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  <FileText className={`w-4 h-4 ${activeTab === "jobCard" ? "text-[#F95721]" : "text-slate-400"}`} />
                  <span>1. Job Card (Designer)</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-orange-100 text-orange-800 font-bold hidden sm:inline">
                    Image 2 Spec
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("vendorJobCard")}
                  className={`flex-1 py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === "vendorJobCard"
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200/90"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  <Truck className={`w-4 h-4 ${activeTab === "vendorJobCard" ? "text-indigo-600" : "text-slate-400"}`} />
                  <span>2. Vendor Job Card (Outsourcing)</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-100 text-indigo-800 font-bold hidden sm:inline">
                    Image 1 Spec
                  </span>
                </button>
              </div>

              {/* Vendor Card Toggle */}
              {activeTab === "vendorJobCard" && (
                <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                  <input
                    type="checkbox"
                    checked={enableVendorCard}
                    onChange={(e) => setEnableVendorCard(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-[11px] font-bold text-slate-800">
                    Include Vendor Card
                  </span>
                </label>
              )}
            </div>

            {/* SCROLLABLE FORM BODY */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/60">
              {activeTab === "jobCard" ? (
                /* TAB 1: DESIGNER / MAIN JOB CARD (Image 2) */
                <div className="space-y-4">
                  {/* Top Bar: Priority & Date */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">Priority :</span>
                      <div className="flex items-center gap-1.5">
                        {["Normal", "Urgent"].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setJobCard({ ...jobCard, priority: p })}
                            className={`px-3 py-1 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                              jobCard.priority === p
                                ? p === "Urgent"
                                  ? "bg-rose-500 text-white border-rose-600 shadow-xs"
                                  : "bg-slate-900 text-white border-slate-900 shadow-xs"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {jobCard.priority === p ? "✓ " : ""}
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-500">
                      <span>Date :</span>
                      <strong className="text-slate-900 font-mono">
                        {new Date().toLocaleDateString("en-IN")}
                      </strong>
                    </div>
                  </div>

                  {/* Client / Business & Location Row */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                      <User className="w-3.5 h-3.5 text-[#F95721]" />
                      Client &amp; Address Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-700 font-semibold block mb-1">
                          Client / Business :
                        </label>
                        <input
                          type="text"
                          value={jobCard.clientBusiness}
                          onChange={(e) => setJobCard({ ...jobCard, clientBusiness: e.target.value })}
                          placeholder="Client or Firm Name"
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-slate-700 font-semibold block mb-1">
                          Contact No. :
                        </label>
                        <input
                          type="text"
                          value={jobCard.contactNo}
                          onChange={(e) => setJobCard({ ...jobCard, contactNo: e.target.value })}
                          placeholder="Phone / Mobile Number"
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-slate-700 font-semibold block mb-1">
                          Area :
                        </label>
                        <input
                          type="text"
                          value={jobCard.area}
                          onChange={(e) => setJobCard({ ...jobCard, area: e.target.value })}
                          placeholder="Locality / Sector"
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-slate-700 font-semibold block mb-1">
                          Address :
                        </label>
                        <input
                          type="text"
                          value={jobCard.address}
                          onChange={(e) => setJobCard({ ...jobCard, address: e.target.value })}
                          placeholder="Full delivery / site address"
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Work Type Checkboxes (Image 2) */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
                      <span>Work Type (Select applicable items)</span>
                      <span className="text-[11px] text-slate-400 font-normal">Checkboxes as per Image 2</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {workTypeOptionsMain.map((wt) => {
                        const isChecked = jobCard.workType.includes(wt);
                        return (
                          <button
                            key={wt}
                            type="button"
                            onClick={() =>
                              setJobCard({
                                ...jobCard,
                                workType: toggleArrayItem(jobCard.workType, wt),
                              })
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              isChecked
                                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {isChecked ? "✓ " : "+ "}
                            {wt}
                          </button>
                        );
                      })}
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Other work type (if any)..."
                        value={jobCard.workTypeOther || ""}
                        onChange={(e) => setJobCard({ ...jobCard, workTypeOther: e.target.value })}
                        className="w-full sm:w-1/2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs"
                      />
                    </div>
                  </div>

                  {/* Size, Quantity, Material / GSM, Print */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider pb-2 border-b border-slate-100">
                      Technical Specifications &amp; Material
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-slate-700 font-semibold block mb-1">
                          Size :
                        </label>
                        <input
                          type="text"
                          value={jobCard.size}
                          onChange={(e) => setJobCard({ ...jobCard, size: e.target.value })}
                          placeholder="e.g. 8 x 4 ft / 3.5x2 in"
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-slate-700 font-semibold block mb-1">
                          Qty :
                        </label>
                        <input
                          type="text"
                          value={jobCard.qty}
                          onChange={(e) => setJobCard({ ...jobCard, qty: e.target.value })}
                          placeholder="e.g. 1000 / 1"
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-semibold font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-700 font-semibold block mb-1">
                          Material / GSM :
                        </label>
                        <input
                          type="text"
                          value={jobCard.materialGsm}
                          onChange={(e) => setJobCard({ ...jobCard, materialGsm: e.target.value })}
                          placeholder="e.g. Star Flex 440 GSM"
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-slate-700 font-semibold block mb-1">
                          Print :
                        </label>
                        <div className="flex gap-2">
                          {["B/W", "Colour"].map((pt) => (
                            <button
                              key={pt}
                              type="button"
                              onClick={() => setJobCard({ ...jobCard, printType: pt })}
                              className={`flex-1 py-1.5 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                                jobCard.printType === pt
                                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {pt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Quick suggestion pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {["Star Flex 440 GSM", "Normal Flex", "Vinyl Matte", "Backlit Film", "350 GSM Art Card", "One Way Vision"].map((pill) => (
                        <button
                          key={pill}
                          type="button"
                          onClick={() => setJobCard({ ...jobCard, materialGsm: pill })}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-orange-100 hover:text-orange-900 text-[10px] text-slate-600 cursor-pointer transition-colors"
                        >
                          + {pill}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Finishing & Frame */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider pb-2 border-b border-slate-100">
                      Finishing &amp; Frame Fabrication
                    </h3>
                    <div>
                      <label className="text-slate-700 font-semibold block mb-1.5">
                        Finishing Options:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {finishingOptionsMain.map((fn) => {
                          const isChecked = jobCard.finishing.includes(fn);
                          return (
                            <button
                              key={fn}
                              type="button"
                              onClick={() =>
                                setJobCard({
                                  ...jobCard,
                                  finishing: toggleArrayItem(jobCard.finishing, fn),
                                })
                              }
                              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                isChecked
                                  ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {isChecked ? "✓ " : "+ "}
                              {fn}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="text-slate-700 font-semibold block mb-1.5">
                        Frame Structure:
                      </label>
                      <div className="flex gap-2">
                        {["", "Iron", "Wooden"].map((fr) => (
                          <button
                            key={fr || "None"}
                            type="button"
                            onClick={() => setJobCard({ ...jobCard, frame: fr })}
                            className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              jobCard.frame === fr
                                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {fr ? `${fr} Frame` : "No Frame"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Design & Designer & Status */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider pb-2 border-b border-slate-100">
                      Design &amp; Artwork Assignment
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-slate-700 font-semibold block mb-1">
                          Design Required?
                        </label>
                        <div className="flex gap-2">
                          {["Yes", "No"].map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setJobCard({ ...jobCard, designRequired: d })}
                              className={`flex-1 py-1.5 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                                jobCard.designRequired === d
                                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-slate-700 font-semibold block mb-1">
                          Designer Name :
                        </label>
                        <input
                          type="text"
                          value={jobCard.designer}
                          onChange={(e) => setJobCard({ ...jobCard, designer: e.target.value })}
                          placeholder="e.g. Rahul Designer"
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-slate-700 font-semibold block mb-1">
                          Artwork Status :
                        </label>
                        <select
                          value={jobCard.status}
                          onChange={(e) => setJobCard({ ...jobCard, status: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-semibold"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Approved">Approved</option>
                          <option value="Ready to Print">Ready to Print</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Amount Breakdown (Total, Advance, Balance) */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
                      <span>Order Payment Breakdown</span>
                      <span className="text-[11px] text-slate-400 font-normal">Auto-calculated</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-slate-700 font-semibold block mb-1">
                          Total : ₹
                        </label>
                        <input
                          type="number"
                          value={jobCard.amountTotal}
                          onChange={(e) => {
                            const tot = Number(e.target.value) || 0;
                            const adv = Number(jobCard.amountAdvance) || 0;
                            setJobCard({
                              ...jobCard,
                              amountTotal: tot,
                              amountBalance: Math.max(0, tot - adv),
                            });
                            setTotalOrderValue(String(tot));
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-slate-700 font-semibold block mb-1">
                          Advance Received : ₹
                        </label>
                        <input
                          type="number"
                          value={jobCard.amountAdvance}
                          onChange={(e) => {
                            const adv = Number(e.target.value) || 0;
                            const tot = Number(jobCard.amountTotal) || 0;
                            setJobCard({
                              ...jobCard,
                              amountAdvance: adv,
                              amountBalance: Math.max(0, tot - adv),
                            });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-emerald-700 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-slate-700 font-semibold block mb-1">
                          Balance Due : ₹
                        </label>
                        <input
                          type="number"
                          readOnly
                          value={jobCard.amountBalance}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-amber-800 font-mono font-bold cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Delivery & Sales Executive Attribution */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Delivery */}
                      <div>
                        <label className="text-slate-700 font-semibold block mb-1">
                          Delivery / Installation Required :
                        </label>
                        <div className="flex gap-2 mb-2">
                          {["No", "Yes"].map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setJobCard({ ...jobCard, deliveryRequired: r })}
                              className={`flex-1 py-1.5 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                                jobCard.deliveryRequired === r
                                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                        {jobCard.deliveryRequired === "Yes" && (
                          <div>
                            <label className="text-slate-600 text-[11px] block mb-1">Promised Date :</label>
                            <input
                              type="date"
                              value={jobCard.deliveryDate}
                              onChange={(e) => setJobCard({ ...jobCard, deliveryDate: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs"
                            />
                          </div>
                        )}
                      </div>

                      {/* Sales Executive Attribution */}
                      <div>
                        <label className="text-slate-700 font-semibold block mb-1">
                          Sales Executive Attribution :
                        </label>
                        <div className="flex gap-2 mb-2">
                          {["Roshni", "Tanya", "Other"].map((exec) => {
                            const isSel =
                              exec === "Other"
                                ? jobCard.salesExecutive !== "Roshni" && jobCard.salesExecutive !== "Tanya"
                                : jobCard.salesExecutive === exec;
                            return (
                              <button
                                key={exec}
                                type="button"
                                onClick={() =>
                                  setJobCard({
                                    ...jobCard,
                                    salesExecutive: exec === "Other" ? (jobCard.salesExecutiveOther || "Other Rep") : exec,
                                  })
                                }
                                className={`flex-1 py-1.5 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                                  isSel
                                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {isSel ? "✓ " : ""}
                                {exec}
                              </button>
                            );
                          })}
                        </div>
                        {jobCard.salesExecutive !== "Roshni" && jobCard.salesExecutive !== "Tanya" && (
                          <input
                            type="text"
                            placeholder="Enter executive name..."
                            value={jobCard.salesExecutiveOther || jobCard.salesExecutive}
                            onChange={(e) =>
                              setJobCard({
                                ...jobCard,
                                salesExecutive: e.target.value,
                                salesExecutiveOther: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* TAB 2: VENDOR JOB CARD (Image 1) */
                <div className="space-y-4">
                  {!enableVendorCard ? (
                    <div className="p-8 text-center bg-white border border-dashed border-slate-300 rounded-2xl space-y-3">
                      <Truck className="w-10 h-10 text-slate-400 mx-auto" />
                      <h4 className="font-bold text-slate-800 text-sm">Vendor Job Card is Disabled</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Enable this card if the order involves third-party print vendors, flex printing houses, or delivery drivers with a 3-stop route.
                      </p>
                      <button
                        type="button"
                        onClick={() => setEnableVendorCard(true)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-sm"
                      >
                        Enable Vendor Job Card
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Section 1: VENDOR / LOCATION */}
                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
                          <span>1. Vendor / Location</span>
                          <span className="text-[11px] text-slate-400 font-normal">Section 1</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-slate-700 font-semibold block mb-1">
                              Vendor Name :
                            </label>
                            <input
                              type="text"
                              value={vendorJobCard.vendorName}
                              onChange={(e) => setVendorJobCard({ ...vendorJobCard, vendorName: e.target.value })}
                              placeholder="e.g. Balaji Flex Print"
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-semibold"
                            />
                          </div>
                          <div>
                            <label className="text-slate-700 font-semibold block mb-1">
                              Contact No. :
                            </label>
                            <input
                              type="text"
                              value={vendorJobCard.vendorContact}
                              onChange={(e) => setVendorJobCard({ ...vendorJobCard, vendorContact: e.target.value })}
                              placeholder="Vendor phone"
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="text-slate-700 font-semibold block mb-1">
                              Location / Area :
                            </label>
                            <input
                              type="text"
                              value={vendorJobCard.vendorLocation}
                              onChange={(e) => setVendorJobCard({ ...vendorJobCard, vendorLocation: e.target.value })}
                              placeholder="e.g. Okhla / Chandni Chowk"
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
                            />
                          </div>
                        </div>

                        {/* Go To For checkboxes */}
                        <div className="pt-2">
                          <label className="text-slate-700 font-semibold block mb-1.5">
                            Go To For :
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {["Print", "Cutting", "Material"].map((gt) => {
                              const isChecked = vendorJobCard.goToFor.includes(gt);
                              return (
                                <button
                                  key={gt}
                                  type="button"
                                  onClick={() =>
                                    setVendorJobCard({
                                      ...vendorJobCard,
                                      goToFor: toggleArrayItem(vendorJobCard.goToFor, gt),
                                    })
                                  }
                                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                    isChecked
                                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  {isChecked ? "✓ " : "+ "}
                                  {gt}
                                </button>
                              );
                            })}
                          </div>
                          <input
                            type="text"
                            placeholder="Other reason (if any)..."
                            value={vendorJobCard.goToForOther || ""}
                            onChange={(e) => setVendorJobCard({ ...vendorJobCard, goToForOther: e.target.value })}
                            className="mt-2 w-full sm:w-1/2 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs"
                          />
                        </div>
                      </div>

                      {/* Section 2: WORK DETAILS (What to Print / Get) */}
                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
                          <span>2. Work Details (What to Print / Get)</span>
                          <span className="text-[11px] text-slate-400 font-normal">Section 2</span>
                        </h3>

                        {/* Checkboxes */}
                        <div className="flex flex-wrap gap-1.5">
                          {vendorWorkDetailsOptions.map((wt) => {
                            const isChecked = vendorJobCard.workDetails.includes(wt);
                            return (
                              <button
                                key={wt}
                                type="button"
                                onClick={() =>
                                  setVendorJobCard({
                                    ...vendorJobCard,
                                    workDetails: toggleArrayItem(vendorJobCard.workDetails, wt),
                                  })
                                }
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                                  isChecked
                                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {isChecked ? "✓ " : "+ "}
                                {wt}
                              </button>
                            );
                          })}
                        </div>

                        {/* Size, Quantity, Material */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                          <div>
                            <label className="text-slate-700 font-semibold block mb-1">Size :</label>
                            <input
                              type="text"
                              value={vendorJobCard.size}
                              onChange={(e) => setVendorJobCard({ ...vendorJobCard, size: e.target.value })}
                              placeholder="e.g. 8 x 4 ft"
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="text-slate-700 font-semibold block mb-1">Quantity :</label>
                            <input
                              type="text"
                              value={vendorJobCard.quantity}
                              onChange={(e) => setVendorJobCard({ ...vendorJobCard, quantity: e.target.value })}
                              placeholder="e.g. 1 / 500"
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-mono font-semibold"
                            />
                          </div>
                          <div>
                            <label className="text-slate-700 font-semibold block mb-1">Material / GSM :</label>
                            <input
                              type="text"
                              value={vendorJobCard.materialGsm}
                              onChange={(e) => setVendorJobCard({ ...vendorJobCard, materialGsm: e.target.value })}
                              placeholder="e.g. Star Flex 440 GSM"
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
                            />
                          </div>
                        </div>

                        {/* Print & Finishing */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          <div>
                            <label className="text-slate-700 font-semibold block mb-1.5">Print :</label>
                            <div className="flex flex-wrap gap-1.5">
                              {["B/W", "Colour", "Single Side", "Both Side"].map((pr) => {
                                const isChecked = vendorJobCard.print.includes(pr);
                                return (
                                  <button
                                    key={pr}
                                    type="button"
                                    onClick={() =>
                                      setVendorJobCard({
                                        ...vendorJobCard,
                                        print: toggleArrayItem(vendorJobCard.print, pr),
                                      })
                                    }
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                      isChecked
                                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                    }`}
                                  >
                                    {isChecked ? "✓ " : "+ "}
                                    {pr}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <label className="text-slate-700 font-semibold block mb-1.5">Finishing :</label>
                            <div className="flex flex-wrap gap-1.5">
                              {vendorFinishingOptions.map((fn) => {
                                const isChecked = vendorJobCard.finishing.includes(fn);
                                return (
                                  <button
                                    key={fn}
                                    type="button"
                                    onClick={() =>
                                      setVendorJobCard({
                                        ...vendorJobCard,
                                        finishing: toggleArrayItem(vendorJobCard.finishing, fn),
                                      })
                                    }
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                      isChecked
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                    }`}
                                  >
                                    {isChecked ? "✓ " : "+ "}
                                    {fn}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: SPECIAL INSTRUCTIONS */}
                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider pb-1 border-b border-slate-100">
                          3. Special Instructions (Notes for vendor / print operator)
                        </h3>
                        <textarea
                          rows={2}
                          value={vendorJobCard.specialInstructions}
                          onChange={(e) => setVendorJobCard({ ...vendorJobCard, specialInstructions: e.target.value })}
                          placeholder="e.g. Ensure accurate 1-inch border on all sides for wooden frame mounting..."
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs resize-none"
                        />
                      </div>

                      {/* Section 4: ITEM TO COLLECT / BRING BACK */}
                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-xs">
                        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider pb-1 border-b border-slate-100">
                          4. Item to Collect / Bring Back
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {vendorItemCollectOptions.map((ic) => {
                            const isChecked = vendorJobCard.itemToCollect.includes(ic);
                            return (
                              <button
                                key={ic}
                                type="button"
                                onClick={() =>
                                  setVendorJobCard({
                                    ...vendorJobCard,
                                    itemToCollect: toggleArrayItem(vendorJobCard.itemToCollect, ic),
                                  })
                                }
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                  isChecked
                                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {isChecked ? "✓ " : "+ "}
                                {ic}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section 5: ROUTE / PROCESS (If Multiple Stop) */}
                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center justify-between">
                          <span>5. Route / Process (Multi-Stop Field &amp; Delivery Boy)</span>
                          <span className="text-[11px] text-slate-400 font-normal">3 Stops with Delivery Arrow</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                          {/* Stop 1 */}
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                            <span className="font-bold text-slate-800 text-xs block">1. Go To :</span>
                            <input
                              type="text"
                              placeholder="Location / Shop"
                              value={vendorJobCard.route.stop1GoTo}
                              onChange={(e) =>
                                setVendorJobCard({
                                  ...vendorJobCard,
                                  route: { ...vendorJobCard.route, stop1GoTo: e.target.value },
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs"
                            />
                            <span className="text-slate-600 text-[11px] block">Work :</span>
                            <input
                              type="text"
                              placeholder="Task at Stop 1"
                              value={vendorJobCard.route.stop1Work}
                              onChange={(e) =>
                                setVendorJobCard({
                                  ...vendorJobCard,
                                  route: { ...vendorJobCard.route, stop1Work: e.target.value },
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs"
                            />
                          </div>

                          {/* Stop 2 */}
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                            <span className="font-bold text-slate-800 text-xs block">2. Then Go To :</span>
                            <input
                              type="text"
                              placeholder="Location / Shop"
                              value={vendorJobCard.route.stop2GoTo}
                              onChange={(e) =>
                                setVendorJobCard({
                                  ...vendorJobCard,
                                  route: { ...vendorJobCard.route, stop2GoTo: e.target.value },
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs"
                            />
                            <span className="text-slate-600 text-[11px] block">Work :</span>
                            <input
                              type="text"
                              placeholder="Task at Stop 2"
                              value={vendorJobCard.route.stop2Work}
                              onChange={(e) =>
                                setVendorJobCard({
                                  ...vendorJobCard,
                                  route: { ...vendorJobCard.route, stop2Work: e.target.value },
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs"
                            />
                          </div>

                          {/* Stop 3: Final Deliver To */}
                          <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-2">
                            <span className="font-bold text-indigo-950 text-xs block">3. Final Deliver To :</span>
                            <input
                              type="text"
                              placeholder="Client address / site"
                              value={vendorJobCard.route.stop3DeliverTo}
                              onChange={(e) =>
                                setVendorJobCard({
                                  ...vendorJobCard,
                                  route: { ...vendorJobCard.route, stop3DeliverTo: e.target.value },
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-indigo-300 text-slate-900 text-xs"
                            />
                            <span className="text-indigo-800 text-[11px] block">Work :</span>
                            <input
                              type="text"
                              placeholder="e.g. Fitting / Delivery"
                              value={vendorJobCard.route.stop3Work}
                              onChange={(e) =>
                                setVendorJobCard({
                                  ...vendorJobCard,
                                  route: { ...vendorJobCard.route, stop3Work: e.target.value },
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-indigo-300 text-slate-900 text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Sections 6, 7 & 8: Payment, Assigned To, Office Use */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Section 6: Payment Details */}
                        <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider pb-1 border-b border-slate-100">
                            6. Payment Details (If Given)
                          </h4>
                          <div>
                            <label className="text-slate-600 text-[11px] block mb-1">Amount : ₹</label>
                            <input
                              type="number"
                              value={vendorJobCard.paymentAmount}
                              onChange={(e) => setVendorJobCard({ ...vendorJobCard, paymentAmount: e.target.value })}
                              placeholder="Amount to pay"
                              className="w-full px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-slate-600 text-[11px] block mb-1">Payment Mode :</label>
                            <div className="flex gap-1.5">
                              {["Cash", "UPI", "Other"].map((pm) => (
                                <button
                                  key={pm}
                                  type="button"
                                  onClick={() => setVendorJobCard({ ...vendorJobCard, paymentMode: pm })}
                                  className={`flex-1 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
                                    vendorJobCard.paymentMode === pm
                                      ? "bg-slate-900 text-white border-slate-900"
                                      : "bg-slate-50 text-slate-700 border-slate-200"
                                  }`}
                                >
                                  {pm}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Section 7: Assigned To */}
                        <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider pb-1 border-b border-slate-100">
                            7. Assigned To (Delivery Boy)
                          </h4>
                          <div>
                            <label className="text-slate-600 text-[11px] block mb-1">Name :</label>
                            <input
                              type="text"
                              value={vendorJobCard.assignedToName}
                              onChange={(e) => setVendorJobCard({ ...vendorJobCard, assignedToName: e.target.value })}
                              placeholder="Delivery staff name"
                              className="w-full px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-slate-600 text-[11px] block mb-1">Contact No. :</label>
                            <input
                              type="text"
                              value={vendorJobCard.assignedToContact}
                              onChange={(e) => setVendorJobCard({ ...vendorJobCard, assignedToContact: e.target.value })}
                              placeholder="Staff contact"
                              className="w-full px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs"
                            />
                          </div>
                        </div>

                        {/* Section 8: Office Use */}
                        <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider pb-1 border-b border-slate-100">
                            8. Office Use
                          </h4>
                          <div>
                            <label className="text-slate-600 text-[11px] block mb-1">Given By :</label>
                            <input
                              type="text"
                              value={vendorJobCard.officeGivenBy}
                              onChange={(e) => setVendorJobCard({ ...vendorJobCard, officeGivenBy: e.target.value })}
                              placeholder="Given by"
                              className="w-full px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-slate-600 text-[11px] block mb-1">Approved By :</label>
                            <input
                              type="text"
                              value={vendorJobCard.officeApprovedBy}
                              onChange={(e) => setVendorJobCard({ ...vendorJobCard, officeApprovedBy: e.target.value })}
                              placeholder="Manager / Owner approval"
                              className="w-full px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
                    Job Card Ready
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <span className={`w-2 h-2 rounded-full ${enableVendorCard ? "bg-indigo-500" : "bg-slate-300"} inline-block`}></span>
                    {enableVendorCard ? "Vendor Card Active" : "Vendor Card Skipped"}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {actionLoading ? "Generating Order..." : "Confirm & Create Order"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
