"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Truck,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  MapPin,
  Phone,
  User,
  Calendar,
  DollarSign,
  Palette,
  Package,
} from "lucide-react";
import { api } from "@/lib/api";

export default function JobCardModal(props) {
  if (!props.isOpen || !props.order) return null;
  return (
    <JobCardDialog
      key={props.order._id || "order"}
      {...props}
    />
  );
}

function JobCardDialog({
  onClose,
  order,
  onSaved,
}) {
  const [activeTab, setActiveTab] = useState("main"); // 'main' or 'vendor'
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const jc = order.jobCard || {};
  const vj = order.vendorJobCard || {};
  const cust = order.customerSnapshot || {};
  const firstItem = order.items?.[0] || {};

  const totalVal =
    jc.amountTotal !== undefined && jc.amountTotal !== null
      ? jc.amountTotal
      : Math.round((order.grandTotalPaise || 0) / 100);
  const advVal =
    jc.amountAdvance !== undefined && jc.amountAdvance !== null
      ? jc.amountAdvance
      : Math.round(
          (order.advanceReceivedPaise || order.totalPaidPaise || 0) / 100,
        );
  const balVal =
    jc.amountBalance !== undefined && jc.amountBalance !== null
      ? jc.amountBalance
      : Math.round((order.balancePaise || 0) / 100);

  const sizeStr =
    jc.size ||
    (firstItem.width && firstItem.height
      ? `${firstItem.width} x ${firstItem.height} ${firstItem.dimensionUnit || "inch"}`
      : "");
  const qtyStr = jc.qty || String(firstItem.quantity || "1");
  const matGsmStr =
    jc.materialGsm ||
    [
      firstItem.paperType,
      firstItem.paperGsm ? `${firstItem.paperGsm} GSM` : "",
    ]
      .filter(Boolean)
      .join(" ");

  // Main Job Card Form State (Image 2 reference)
  const [mainCard, setMainCard] = useState({
    priority: jc.priority || "Normal",
    clientBusiness:
      jc.clientBusiness ||
      cust.displayName ||
      cust.companyName ||
      cust.contactPerson ||
      "",
    area: jc.area || cust.billingAddress?.city || "",
    contactNo: jc.contactNo || cust.phone || "",
    address:
      jc.address ||
      cust.billingAddress?.street ||
      (typeof cust.billingAddress === "string" ? cust.billingAddress : "") ||
      "",
    workType: Array.isArray(jc.workType) && jc.workType.length
      ? jc.workType
      : [firstItem.title || "Visiting Card"],
    workTypeOther: jc.workTypeOther || "",
    size: sizeStr,
    qty: qtyStr,
    materialGsm: matGsmStr,
    printType: jc.printType || "Colour",
    finishing: Array.isArray(jc.finishing)
      ? jc.finishing
      : firstItem.finishing || [],
    frame: jc.frame || "",
    designRequired: jc.designRequired || "Yes",
    designer: jc.designer || "",
    status: jc.status || "Pending",
    amountTotal: totalVal,
    amountAdvance: advVal,
    amountBalance: balVal,
    deliveryRequired:
      jc.deliveryRequired ||
      (order.deliveryMethod === "PICKUP" ? "No" : "Yes"),
    deliveryDate:
      jc.deliveryDate ||
      (order.promisedDeliveryDate
        ? new Date(order.promisedDeliveryDate).toISOString().slice(0, 10)
        : ""),
    salesExecutive: jc.salesExecutive || order.assignedSalesId?.name || "",
    salesExecutiveOther: jc.salesExecutiveOther || "",
  });

  // Vendor Job Card Form State (Image 1 reference)
  const [vendorCard, setVendorCard] = useState({
    vendorName: vj.vendorName || "",
    vendorContact: vj.vendorContact || "",
    vendorLocation: vj.vendorLocation || "",
    goToFor:
      Array.isArray(vj.goToFor) && vj.goToFor.length ? vj.goToFor : ["Print"],
    goToForOther: vj.goToForOther || "",
    workDetails:
      Array.isArray(vj.workDetails) && vj.workDetails.length
        ? vj.workDetails
        : Array.isArray(jc.workType) && jc.workType.length
          ? jc.workType
          : [firstItem.title || "Visiting Card"],
    workDetailsOther: vj.workDetailsOther || jc.workTypeOther || "",
    size: vj.size || sizeStr,
    quantity: vj.quantity || qtyStr,
    materialGsm: vj.materialGsm || matGsmStr,
    print:
      Array.isArray(vj.print) && vj.print.length
        ? vj.print
        : [
            "Colour",
            firstItem.printSides === "DOUBLE" ? "Both Side" : "Single Side",
          ],
    finishing:
      Array.isArray(vj.finishing) && vj.finishing.length
        ? vj.finishing
        : Array.isArray(jc.finishing)
          ? jc.finishing
          : firstItem.finishing || [],
    finishingOther: vj.finishingOther || "",
    specialInstructions: vj.specialInstructions || order.notes || "",
    itemToCollect:
      Array.isArray(vj.itemToCollect) && vj.itemToCollect.length
        ? vj.itemToCollect
        : ["Printed Material"],
    itemToCollectOther: vj.itemToCollectOther || "",
    route: {
      stop1GoTo: vj.route?.stop1GoTo || "",
      stop1Work: vj.route?.stop1Work || "",
      stop2GoTo: vj.route?.stop2GoTo || "",
      stop2Work: vj.route?.stop2Work || "",
      stop3DeliverTo:
        vj.route?.stop3DeliverTo ||
        cust.displayName ||
        cust.companyName ||
        "",
      stop3Work: vj.route?.stop3Work || "Delivery & Handover",
    },
    paymentAmount: vj.paymentAmount || "",
    paymentMode: vj.paymentMode || "Cash",
    paymentModeOther: vj.paymentModeOther || "",
    assignedToName: vj.assignedToName || "",
    assignedToContact: vj.assignedToContact || "",
    officeGivenBy: vj.officeGivenBy || order.assignedSalesId?.name || "",
    officeApprovedBy: vj.officeApprovedBy || "",
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.patch(`/orders/${order._id}/job-cards`, {
        jobCard: mainCard,
        vendorJobCard: vendorCard,
      });
      if (onSaved) onSaved(res.data || res.order);
      alert("Job card details saved successfully!");
    } catch (err) {
      alert(err.message || "Failed to save job card");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadMainPdf = async () => {
    try {
      setDownloading(true);
      await api.downloadPdf(
        `/orders/${order._id}/job-card`,
        `Job-Card-${order.orderNumber || order._id}.pdf`
      );
    } catch (err) {
      alert(err.message || "Failed to download Job Card PDF");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadVendorPdf = async () => {
    try {
      setDownloading(true);
      await api.downloadPdf(
        `/orders/${order._id}/vendor-job-card`,
        `Vendor-Job-Card-${order.orderNumber || order._id}.pdf`
      );
    } catch (err) {
      alert(err.message || "Failed to download Vendor Job Card PDF");
    } finally {
      setDownloading(false);
    }
  };

  const toggleArrayItem = (list, item) => {
    if (list.includes(item)) {
      return list.filter((x) => x !== item);
    }
    return [...list, item];
  };

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

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-scale-up">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center text-[#F95721]">
              <Printer className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Job Card Production Control
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white/10 text-orange-300 border border-white/10">
                  {order.orderNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                A4 Printable Job Cards for Salesperson, Designer, Fitter &amp; Vendor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100 border-b border-slate-200 p-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("main")}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "main"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:bg-slate-200/60"
            }`}
          >
            <FileText className={`w-4 h-4 ${activeTab === "main" ? "text-[#F95721]" : "text-slate-400"}`} />
            <span>1. Designer / Main Job Card</span>
            <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-orange-100 text-orange-800 font-bold">
              Image 2 Spec
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("vendor")}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "vendor"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:bg-slate-200/60"
            }`}
          >
            <Truck className={`w-4 h-4 ${activeTab === "vendor" ? "text-indigo-600" : "text-slate-400"}`} />
            <span>2. Vendor Job Card (Outsourcing &amp; Route)</span>
            <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-indigo-100 text-indigo-800 font-bold">
              Image 1 Spec
            </span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs text-slate-700 bg-slate-50/50">
          {activeTab === "main" ? (
            /* TAB 1: DESIGNER / MAIN JOB CARD */
            <div className="space-y-5">
              {/* Top Banner & Priority */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">Priority Level:</span>
                  <div className="flex items-center gap-1.5">
                    {["Normal", "Urgent"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setMainCard({ ...mainCard, priority: p })}
                        className={`px-3 py-1 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                          mainCard.priority === p
                            ? p === "Urgent"
                              ? "bg-rose-500 text-white border-rose-600 shadow-xs"
                              : "bg-slate-900 text-white border-slate-900 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {mainCard.priority === p ? "✓ " : ""}
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-500">
                  <span>Job No: <strong className="text-slate-900 font-mono">{order.orderNumber}</strong></span>
                  <span>•</span>
                  <span>Date: <strong className="text-slate-900 font-mono">{mainCard.deliveryDate || new Date().toLocaleDateString("en-IN")}</strong></span>
                </div>
              </div>

              {/* Client & Address Information */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <User className="w-3.5 h-3.5 text-[#F95721]" />
                  Client &amp; Location Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Client / Business Name</label>
                    <input
                      type="text"
                      value={mainCard.clientBusiness}
                      onChange={(e) => setMainCard({ ...mainCard, clientBusiness: e.target.value })}
                      placeholder="e.g. Acme Prints Ltd."
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Contact No.</label>
                    <input
                      type="text"
                      value={mainCard.contactNo}
                      onChange={(e) => setMainCard({ ...mainCard, contactNo: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Area / Locality</label>
                    <input
                      type="text"
                      value={mainCard.area}
                      onChange={(e) => setMainCard({ ...mainCard, area: e.target.value })}
                      placeholder="e.g. Sector 18, Noida"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Full Delivery / Installation Address</label>
                    <input
                      type="text"
                      value={mainCard.address}
                      onChange={(e) => setMainCard({ ...mainCard, address: e.target.value })}
                      placeholder="e.g. Shop #4, Main Market Road"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Work Type Selection (Checkboxes from Image 2) */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#F95721]" />
                    Work Type
                  </h3>
                  <span className="text-[11px] text-slate-400">Select one or multiple items</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {workTypeOptionsMain.map((opt) => {
                    const isChecked = mainCard.workType.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setMainCard({
                            ...mainCard,
                            workType: toggleArrayItem(mainCard.workType, opt),
                          })
                        }
                        className={`p-2 rounded-lg text-left text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isChecked
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] border ${isChecked ? "border-white bg-white/20" : "border-slate-300"}`}>
                          {isChecked ? "✓" : ""}
                        </span>
                        <span className="truncate">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Other Work Type:</span>
                  <input
                    type="text"
                    value={mainCard.workTypeOther}
                    onChange={(e) => setMainCard({ ...mainCard, workTypeOther: e.target.value })}
                    placeholder="e.g. Acrylic Board, Standee..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-semibold"
                  />
                </div>
              </div>

              {/* Specs: Size, Qty, Material / GSM, Print */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Palette className="w-3.5 h-3.5 text-[#F95721]" />
                  Specifications &amp; Printing
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Size</label>
                    <input
                      type="text"
                      value={mainCard.size}
                      onChange={(e) => setMainCard({ ...mainCard, size: e.target.value })}
                      placeholder="e.g. 10x4 ft or 8.5x11 in"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Quantity</label>
                    <input
                      type="text"
                      value={mainCard.qty}
                      onChange={(e) => setMainCard({ ...mainCard, qty: e.target.value })}
                      placeholder="e.g. 1000"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Material / GSM</label>
                    <input
                      type="text"
                      value={mainCard.materialGsm}
                      onChange={(e) => setMainCard({ ...mainCard, materialGsm: e.target.value })}
                      placeholder="e.g. Star Flex 440 GSM"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Print Color</label>
                    <div className="flex gap-1.5 pt-0.5">
                      {["Colour", "B/W"].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setMainCard({ ...mainCard, printType: c })}
                          className={`flex-1 py-1.5 rounded-lg font-bold border text-xs transition-all cursor-pointer ${
                            mainCard.printType === c
                              ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {mainCard.printType === c ? "✓ " : ""}
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Finishing & Frame */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider pb-2 border-b border-slate-100">
                  Finishing &amp; Frame Specification
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-slate-600 font-semibold block">Post-Press Finishing:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {finishingOptionsMain.map((opt) => {
                        const isChecked = mainCard.finishing.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() =>
                              setMainCard({
                                ...mainCard,
                                finishing: toggleArrayItem(mainCard.finishing, opt),
                              })
                            }
                            className={`p-2 rounded-lg text-left text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                              isChecked
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] border ${isChecked ? "border-white bg-white/20" : "border-slate-300"}`}>
                              {isChecked ? "✓" : ""}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-600 font-semibold block">Frame Structure:</label>
                    <div className="flex flex-col gap-2">
                      {["None", "Iron", "Wooden"].map((fr) => (
                        <button
                          key={fr}
                          type="button"
                          onClick={() => setMainCard({ ...mainCard, frame: fr === "None" ? "" : fr })}
                          className={`p-2 rounded-lg text-left text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            (fr === "None" && !mainCard.frame) || mainCard.frame === fr
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] border ${(fr === "None" && !mainCard.frame) || mainCard.frame === fr ? "border-white bg-white/20" : "border-slate-300"}`}>
                            {(fr === "None" && !mainCard.frame) || mainCard.frame === fr ? "✓" : ""}
                          </span>
                          <span>{fr === "None" ? "No Frame" : `${fr} Frame`}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Design Details & Designer Assignment */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider pb-2 border-b border-slate-100">
                  Design Department Handover
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Design Required?</label>
                    <div className="flex gap-2">
                      {["Yes", "No"].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setMainCard({ ...mainCard, designRequired: d })}
                          className={`flex-1 py-2 rounded-lg font-bold border text-xs transition-all cursor-pointer ${
                            mainCard.designRequired === d
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                        >
                          {mainCard.designRequired === d ? "✓ " : ""}
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Assigned Designer Name</label>
                    <input
                      type="text"
                      value={mainCard.designer}
                      onChange={(e) => setMainCard({ ...mainCard, designer: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Design Status</label>
                    <input
                      type="text"
                      value={mainCard.status}
                      onChange={(e) => setMainCard({ ...mainCard, status: e.target.value })}
                      placeholder="e.g. In Progress, Approved, Ready"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Amount & Commercial Summary */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider pb-2 border-b border-slate-100">
                  Order Financials Snapshot
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Total (₹)</label>
                    <input
                      type="number"
                      value={mainCard.amountTotal}
                      onChange={(e) =>
                        setMainCard({
                          ...mainCard,
                          amountTotal: Number(e.target.value),
                          amountBalance: Math.max(0, Number(e.target.value) - (mainCard.amountAdvance || 0)),
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Advance Received (₹)</label>
                    <input
                      type="number"
                      value={mainCard.amountAdvance}
                      onChange={(e) =>
                        setMainCard({
                          ...mainCard,
                          amountAdvance: Number(e.target.value),
                          amountBalance: Math.max(0, (mainCard.amountTotal || 0) - Number(e.target.value)),
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-mono font-bold text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Balance Due (₹)</label>
                    <input
                      type="number"
                      value={mainCard.amountBalance}
                      onChange={(e) => setMainCard({ ...mainCard, amountBalance: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-mono font-bold text-rose-700"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery / Installation & Sales Executive */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider pb-2 border-b border-slate-100">
                  Delivery &amp; Sales Executive Attribution
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-slate-600 font-semibold block">Delivery / Installation Required?</label>
                    <div className="flex gap-2">
                      {["Yes", "No"].map((req) => (
                        <button
                          key={req}
                          type="button"
                          onClick={() => setMainCard({ ...mainCard, deliveryRequired: req })}
                          className={`flex-1 py-1.5 rounded-lg font-bold border text-xs transition-all cursor-pointer ${
                            mainCard.deliveryRequired === req
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                        >
                          {mainCard.deliveryRequired === req ? "✓ " : ""}
                          {req}
                        </button>
                      ))}
                    </div>

                    <div className="pt-1">
                      <label className="text-slate-600 font-semibold block mb-1">Target Delivery Date</label>
                      <input
                        type="date"
                        value={mainCard.deliveryDate}
                        onChange={(e) => setMainCard({ ...mainCard, deliveryDate: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-600 font-semibold block">Sales Executive:</label>
                    <div className="flex gap-1.5">
                      {["Roshni", "Tanya", "Other"].map((exec) => {
                        const isMatch =
                          exec === "Other"
                            ? mainCard.salesExecutive !== "Roshni" && mainCard.salesExecutive !== "Tanya"
                            : mainCard.salesExecutive === exec;
                        return (
                          <button
                            key={exec}
                            type="button"
                            onClick={() =>
                              setMainCard({
                                ...mainCard,
                                salesExecutive: exec === "Other" ? (mainCard.salesExecutiveOther || "") : exec,
                              })
                            }
                            className={`flex-1 py-1.5 rounded-lg font-bold border text-xs transition-all cursor-pointer ${
                              isMatch
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {isMatch ? "✓ " : ""}
                            {exec}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-1">
                      <input
                        type="text"
                        value={
                          mainCard.salesExecutive !== "Roshni" && mainCard.salesExecutive !== "Tanya"
                            ? mainCard.salesExecutive
                            : mainCard.salesExecutiveOther
                        }
                        onChange={(e) =>
                          setMainCard({
                            ...mainCard,
                            salesExecutive: e.target.value,
                            salesExecutiveOther: e.target.value,
                          })
                        }
                        placeholder="Executive name or other staff..."
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: VENDOR JOB CARD */
            <div className="space-y-5">
              {/* 1. VENDOR / LOCATION */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <span className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                  Vendor &amp; Location Destination
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Vendor Name</label>
                    <input
                      type="text"
                      value={vendorCard.vendorName}
                      onChange={(e) => setVendorCard({ ...vendorCard, vendorName: e.target.value })}
                      placeholder="e.g. Perfect Flex Printers"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Vendor Contact No.</label>
                    <input
                      type="text"
                      value={vendorCard.vendorContact}
                      onChange={(e) => setVendorCard({ ...vendorCard, vendorContact: e.target.value })}
                      placeholder="e.g. 9811122233"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Vendor Location / Area</label>
                    <input
                      type="text"
                      value={vendorCard.vendorLocation}
                      onChange={(e) => setVendorCard({ ...vendorCard, vendorLocation: e.target.value })}
                      placeholder="e.g. Okhla Phase 2"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Go To For:</label>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {["Print", "Cutting", "Material", "Other"].map((g) => {
                        const isChecked = vendorCard.goToFor.includes(g);
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() =>
                              setVendorCard({
                                ...vendorCard,
                                goToFor: toggleArrayItem(vendorCard.goToFor, g),
                              })
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              isChecked
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-slate-50 text-slate-700 border-slate-200"
                            }`}
                          >
                            {isChecked ? "✓ " : ""}
                            {g}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. WORK DETAILS (What to Print / Get) */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <span className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                  Work Details (What to Print / Get)
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {vendorWorkDetailsOptions.map((opt) => {
                    const isChecked = vendorCard.workDetails.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setVendorCard({
                            ...vendorCard,
                            workDetails: toggleArrayItem(vendorCard.workDetails, opt),
                          })
                        }
                        className={`p-2 rounded-lg text-left text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isChecked
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] border ${isChecked ? "border-white bg-white/20" : "border-slate-300"}`}>
                          {isChecked ? "✓" : ""}
                        </span>
                        <span className="truncate">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Size</label>
                    <input
                      type="text"
                      value={vendorCard.size}
                      onChange={(e) => setVendorCard({ ...vendorCard, size: e.target.value })}
                      placeholder="e.g. 10x4 ft"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Quantity</label>
                    <input
                      type="text"
                      value={vendorCard.quantity}
                      onChange={(e) => setVendorCard({ ...vendorCard, quantity: e.target.value })}
                      placeholder="e.g. 500"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Material / GSM</label>
                    <input
                      type="text"
                      value={vendorCard.materialGsm}
                      onChange={(e) => setVendorCard({ ...vendorCard, materialGsm: e.target.value })}
                      placeholder="e.g. Star Flex 440 GSM"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-900"
                    />
                  </div>
                </div>

                {/* Print & Finishing sub-options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Print Option:</label>
                    <div className="flex flex-wrap gap-1.5">
                      {["B/W", "Colour", "Single Side", "Both Side"].map((pr) => {
                        const isChecked = vendorCard.print.includes(pr);
                        return (
                          <button
                            key={pr}
                            type="button"
                            onClick={() =>
                              setVendorCard({
                                ...vendorCard,
                                print: toggleArrayItem(vendorCard.print, pr),
                              })
                            }
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              isChecked
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-slate-50 text-slate-700 border-slate-200"
                            }`}
                          >
                            {isChecked ? "✓ " : ""}
                            {pr}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Finishing:</label>
                    <div className="flex flex-wrap gap-1.5">
                      {vendorFinishingOptions.map((fn) => {
                        const isChecked = vendorCard.finishing.includes(fn);
                        return (
                          <button
                            key={fn}
                            type="button"
                            onClick={() =>
                              setVendorCard({
                                ...vendorCard,
                                finishing: toggleArrayItem(vendorCard.finishing, fn),
                              })
                            }
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              isChecked
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-slate-50 text-slate-700 border-slate-200"
                            }`}
                          >
                            {isChecked ? "✓ " : ""}
                            {fn}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 & 4. SPECIAL INSTRUCTIONS & ITEM TO COLLECT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 3. SPECIAL INSTRUCTIONS */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <span className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                    Special Instructions
                  </h3>
                  <textarea
                    rows={4}
                    value={vendorCard.specialInstructions}
                    onChange={(e) => setVendorCard({ ...vendorCard, specialInstructions: e.target.value })}
                    placeholder="Enter explicit instructions for the vendor / printer..."
                    className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium"
                  />
                </div>

                {/* 4. ITEM TO COLLECT / BRING BACK */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <span className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">4</span>
                    Item to Collect / Bring Back
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {vendorItemCollectOptions.map((it) => {
                      const isChecked = vendorCard.itemToCollect.includes(it);
                      return (
                        <button
                          key={it}
                          type="button"
                          onClick={() =>
                            setVendorCard({
                              ...vendorCard,
                              itemToCollect: toggleArrayItem(vendorCard.itemToCollect, it),
                            })
                          }
                          className={`p-2 rounded-lg text-left text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            isChecked
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] border ${isChecked ? "border-white bg-white/20" : "border-slate-300"}`}>
                            {isChecked ? "✓" : ""}
                          </span>
                          <span className="truncate">{it}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 5. ROUTE / PROCESS (If Multiple Stop) */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <span className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">5</span>
                  Route / Process Logistics (For Delivery Boy / Driver)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Stop 1 */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="font-bold text-slate-900 text-xs">1. First Stop</div>
                    <div>
                      <label className="text-[11px] text-slate-500 font-semibold block mb-0.5">Go To:</label>
                      <input
                        type="text"
                        value={vendorCard.route.stop1GoTo}
                        onChange={(e) =>
                          setVendorCard({
                            ...vendorCard,
                            route: { ...vendorCard.route, stop1GoTo: e.target.value },
                          })
                        }
                        placeholder="e.g. Master Paper Store"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 font-semibold block mb-0.5">Work:</label>
                      <input
                        type="text"
                        value={vendorCard.route.stop1Work}
                        onChange={(e) =>
                          setVendorCard({
                            ...vendorCard,
                            route: { ...vendorCard.route, stop1Work: e.target.value },
                          })
                        }
                        placeholder="e.g. Collect 300 GSM Sheets"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  {/* Stop 2 */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="font-bold text-slate-900 text-xs">2. Then Go To</div>
                    <div>
                      <label className="text-[11px] text-slate-500 font-semibold block mb-0.5">Go To:</label>
                      <input
                        type="text"
                        value={vendorCard.route.stop2GoTo}
                        onChange={(e) =>
                          setVendorCard({
                            ...vendorCard,
                            route: { ...vendorCard.route, stop2GoTo: e.target.value },
                          })
                        }
                        placeholder="e.g. Perfect Lamination Shop"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 font-semibold block mb-0.5">Work:</label>
                      <input
                        type="text"
                        value={vendorCard.route.stop2Work}
                        onChange={(e) =>
                          setVendorCard({
                            ...vendorCard,
                            route: { ...vendorCard.route, stop2Work: e.target.value },
                          })
                        }
                        placeholder="e.g. Matte Lamination"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  {/* Stop 3 */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="font-bold text-slate-900 text-xs">3. Final Delivery</div>
                    <div>
                      <label className="text-[11px] text-slate-500 font-semibold block mb-0.5">Deliver To:</label>
                      <input
                        type="text"
                        value={vendorCard.route.stop3DeliverTo}
                        onChange={(e) =>
                          setVendorCard({
                            ...vendorCard,
                            route: { ...vendorCard.route, stop3DeliverTo: e.target.value },
                          })
                        }
                        placeholder="e.g. Client Office / Workshop"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 font-semibold block mb-0.5">Work:</label>
                      <input
                        type="text"
                        value={vendorCard.route.stop3Work}
                        onChange={(e) =>
                          setVendorCard({
                            ...vendorCard,
                            route: { ...vendorCard.route, stop3Work: e.target.value },
                          })
                        }
                        placeholder="e.g. Handover & Sign Delivery Slip"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 6, 7 & 8: PAYMENT, ASSIGNED TO & OFFICE USE */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 6. PAYMENT DETAILS */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
                    <span className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">6</span>
                    Payment Details (If Given)
                  </h3>

                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block mb-0.5">Amount (₹):</label>
                    <input
                      type="text"
                      value={vendorCard.paymentAmount}
                      onChange={(e) => setVendorCard({ ...vendorCard, paymentAmount: e.target.value })}
                      placeholder="e.g. 1200"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block mb-0.5">Mode:</label>
                    <div className="flex gap-1">
                      {["Cash", "UPI", "Other"].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setVendorCard({ ...vendorCard, paymentMode: m })}
                          className={`flex-1 py-1 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
                            vendorCard.paymentMode === m
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 7. ASSIGNED TO */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
                    <span className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">7</span>
                    Assigned Logistics Person
                  </h3>

                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block mb-0.5">Name:</label>
                    <input
                      type="text"
                      value={vendorCard.assignedToName}
                      onChange={(e) => setVendorCard({ ...vendorCard, assignedToName: e.target.value })}
                      placeholder="e.g. Sonu Kumar (Rider)"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block mb-0.5">Contact No:</label>
                    <input
                      type="text"
                      value={vendorCard.assignedToContact}
                      onChange={(e) => setVendorCard({ ...vendorCard, assignedToContact: e.target.value })}
                      placeholder="e.g. 9899887766"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs"
                    />
                  </div>
                </div>

                {/* 8. OFFICE USE */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
                    <span className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">8</span>
                    Office Authorization
                  </h3>

                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block mb-0.5">Given By:</label>
                    <input
                      type="text"
                      value={vendorCard.officeGivenBy}
                      onChange={(e) => setVendorCard({ ...vendorCard, officeGivenBy: e.target.value })}
                      placeholder="e.g. Sales Executive"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block mb-0.5">Approved By:</label>
                    <input
                      type="text"
                      value={vendorCard.officeApprovedBy}
                      onChange={(e) => setVendorCard({ ...vendorCard, officeApprovedBy: e.target.value })}
                      placeholder="e.g. Manager / Floor Incharge"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar with Action Buttons */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadMainPdf}
              disabled={downloading}
              className="px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#F95721] border border-orange-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Download Job Card (PDF)
            </button>

            <button
              type="button"
              onClick={handleDownloadVendorPdf}
              disabled={downloading}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Download Vendor Job Card (PDF)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Job Card Details"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
