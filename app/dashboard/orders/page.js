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
  X,
} from "lucide-react";

export default function OrdersBillingPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("admin");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const stored = (localStorage.getItem("userRole") || "admin").toLowerCase();
    setUserRole(stored);
  }, []);

  const isSalesRole =
    userRole.includes("sales") ||
    userRole.includes("employee") ||
    userRole.includes("executive");

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
    });
    setShowSpecsModal(true);
  };

  const handleSaveOrderSpecs = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;
    try {
      setSavingSpecs(true);
      const res = await api.patch(`/orders/${editingOrder._id}/specifications`, specsForm);
      const updatedOrder = res?.data || res?.order;
      if (updatedOrder) {
        setOrders((prev) =>
          prev.map((o) => (o._id === editingOrder._id ? { ...o, ...updatedOrder } : o))
        );
      }
      setShowSpecsModal(false);
      loadOrders(true);
    } catch (err) {
      alert(err.message || "Failed to update order specifications");
    } finally {
      setSavingSpecs(false);
    }
  };

  const loadOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get("/orders");
      if (res?.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

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

    return matchesSearch;
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
                <ShoppingBag className="w-6 h-6 text-[#F95721]" />
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
                  className="pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#F95721] focus:ring-1 focus:ring-orange-500/20 shadow-xs w-64 transition-all"
                />
              </div>
              <button
                onClick={loadOrders}
                disabled={loading}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-xs transition-colors cursor-pointer"
                title="Refresh Orders"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin text-[#F95721]" : ""}`}
                />
              </button>
            </div>
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
                      <span className="text-[11px] font-mono font-bold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-md border border-orange-200">
                        {ord.orderNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ord.orderStatus === "PRODUCTION"
                            ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                            : ord.orderStatus === "APPROVAL"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {ord.orderStatus}
                      </span>
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
                          <Layers className="w-3.5 h-3.5 text-[#F95721]" />{" "}
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
                              className="p-1 rounded hover:bg-slate-200 text-[#F95721] hover:text-[#e84915] transition-colors cursor-pointer"
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
                        onClick={() => handleOpenSpecsModal(ord)}
                        className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-semibold transition-colors cursor-pointer"
                        title="Edit product specifications"
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
                              err.message || "Failed to download Invoice",
                            );
                          }
                        }}
                        className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                        title="Download Tax Invoice"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Invoice
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Edit Product Specifications */}
      {showSpecsModal && editingOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-md w-full max-w-xl p-6 space-y-4 shadow-xl animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-[#F95721]">
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
              Update the product specifications for this order.
            </p>

            <form onSubmit={handleSaveOrderSpecs} className="space-y-4 text-xs">
              {/* Dimensions & Quantity */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2.5">
                <span className="text-[11px] font-bold text-[#F95721] uppercase tracking-wider block">
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
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-[#F95721]"
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
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-[#F95721]"
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
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-[#F95721]"
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
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-[#F95721]"
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
                      className="px-5 py-2 rounded-xl bg-[#F95721] hover:bg-[#e84915] text-white font-semibold text-xs shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
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

    </div>
  );
}
