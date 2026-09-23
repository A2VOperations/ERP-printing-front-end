"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import {
  Truck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  X,
  ShieldCheck,
  Package,
} from "lucide-react";

export default function DispatchDeliveryPage() {
  const [deliveryJobs, setDeliveryJobs] = useState([]);
  const [readyProductionJobs, setReadyProductionJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState("admin");

  // Modals
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedJobForDispatch, setSelectedJobForDispatch] = useState(null);
  const [deliveryType, setDeliveryType] = useState("CUSTOMER_DELIVERY");
  const [courierName, setCourierName] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");

  // Attempt Modal
  const [showAttemptModal, setShowAttemptModal] = useState(false);
  const [selectedDeliveryJob, setSelectedDeliveryJob] = useState(null);
  const [attemptReason, setAttemptReason] = useState(
    "Customer unavailable / Premises closed",
  );
  const [attemptNotes, setAttemptNotes] = useState("");

  // Complete POD Modal
  const [showPodModal, setShowPodModal] = useState(false);
  const [podRecipientName, setPodRecipientName] = useState("");
  const [podNotes, setPodNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const canManage = userRole === "admin" || userRole === "manager";

  const loadData = async () => {
    try {
      setLoading(true);
      const role = (localStorage.getItem("userRole") || "admin").toLowerCase();
      setUserRole(role);

      const [deliveryRes, prodRes] = await Promise.allSettled([
        api.get("/delivery-jobs"),
        api.get(
          "/production-jobs?productionStatus=READY_FOR_DISPATCH&status=READY_FOR_DISPATCH",
        ),
      ]);

      if (deliveryRes.status === "fulfilled") {
        const list =
          deliveryRes.value?.data ||
          (Array.isArray(deliveryRes.value) ? deliveryRes.value : []);
        setDeliveryJobs(list);
      }

      if (prodRes.status === "fulfilled") {
        const pList =
          prodRes.value?.data ||
          (Array.isArray(prodRes.value) ? prodRes.value : []);
        const readyOnly = pList.filter(
          (j) => j.productionStatus === "READY_FOR_DISPATCH",
        );
        setReadyProductionJobs(readyOnly);
      }
    } catch (err) {
      console.error("Failed to load delivery data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openDispatchModalForProduction = (prodJob) => {
    setSelectedJobForDispatch({ type: "PRODUCTION", data: prodJob });
    setDeliveryType("CUSTOMER_DELIVERY");
    setCourierName("Internal Delivery Van");
    setDriverName("");
    setDriverPhone("");
    setVehicleNumber("");
    setTrackingNumber("");
    setErrorMsg("");
    setShowDispatchModal(true);
  };

  const openDispatchModalForDelivery = (delJob) => {
    setSelectedJobForDispatch({ type: "DELIVERY", data: delJob });
    setDeliveryType(delJob.deliveryType || "CUSTOMER_DELIVERY");
    setCourierName(
      delJob.courierMetadata?.courierName || "Internal Delivery Van",
    );
    setDriverName(delJob.courierMetadata?.driverName || "");
    setDriverPhone(delJob.courierMetadata?.driverPhone || "");
    setVehicleNumber(delJob.courierMetadata?.vehicleNumber || "");
    setTrackingNumber(delJob.courierMetadata?.trackingNumber || "");
    setErrorMsg("");
    setShowDispatchModal(true);
  };

  const openAttemptModal = (delJob) => {
    setSelectedDeliveryJob(delJob);
    setAttemptReason("Customer unavailable / Premises closed");
    setAttemptNotes("");
    setErrorMsg("");
    setShowAttemptModal(true);
  };

  const openPodModal = (delJob) => {
    setSelectedDeliveryJob(delJob);
    setPodRecipientName(
      delJob.customerId?.displayName ||
        delJob.customerId?.name ||
        delJob.orderId?.customerSnapshot?.displayName ||
        delJob.orderId?.customerSnapshot?.name ||
        "",
    );
    setPodNotes("");
    setErrorMsg("");
    setShowPodModal(true);
  };

  const handleConfirmDispatch = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      const courierMetadata = {
        courierName,
        driverName,
        driverPhone,
        vehicleNumber,
        trackingNumber,
      };

      if (selectedJobForDispatch?.type === "PRODUCTION") {
        // Create delivery job first, then dispatch
        const prodJob = selectedJobForDispatch.data;
        const created = await api.post("/delivery-jobs", {
          productionJobId: prodJob._id,
          deliveryType,
          courierMetadata,
          scheduledDate: scheduledDate || new Date().toISOString(),
        });
        const delId = created.data?._id || created.delivery?._id || created._id;
        await api.post(`/delivery-jobs/${delId}/dispatch`, { courierMetadata });
      } else {
        const delJob = selectedJobForDispatch.data;
        await api.post(`/delivery-jobs/${delJob._id}/dispatch`, {
          courierMetadata,
        });
      }

      alert("Job successfully dispatched with transit manifest!");
      setShowDispatchModal(false);
      loadData();
    } catch (err) {
      setErrorMsg(err.message || "Failed to dispatch job");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordAttempt = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      await api.post(`/delivery-jobs/${selectedDeliveryJob._id}/attempt`, {
        reason: attemptReason,
        outcome: "FAILED",
        notes: attemptNotes,
      });
      alert("Failed delivery attempt recorded. Status updated.");
      setShowAttemptModal(false);
      loadData();
    } catch (err) {
      setErrorMsg(err.message || "Failed to record attempt");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteDelivery = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      await api.post(`/delivery-jobs/${selectedDeliveryJob._id}/complete`, {
        recipientName: podRecipientName,
        receivedAt: new Date().toISOString(),
        notes: podNotes,
      });
      alert("Delivery marked Completed with Proof of Delivery!");
      setShowPodModal(false);
      loadData();
    } catch (err) {
      setErrorMsg(err.message || "Failed to complete delivery");
    } finally {
      setSubmitting(false);
    }
  };

  const inTransitCount = deliveryJobs.filter(
    (d) => d.status === "DISPATCHED" || d.status === "OUT_FOR_DELIVERY",
  ).length;
  const deliveredCount = deliveryJobs.filter(
    (d) => d.status === "DELIVERED",
  ).length;
  const failedAttemptsCount = deliveryJobs.reduce(
    (acc, d) => acc + (d.attempts?.length || 0),
    0,
  );

  const filteredDeliveryJobs = useMemo(() => {
    if (!searchQuery.trim()) return deliveryJobs;
    const q = searchQuery.toLowerCase();
    return deliveryJobs.filter(
      (d) =>
        (d.deliveryNumber || "").toLowerCase().includes(q) ||
        (d.customerId?.name || "").toLowerCase().includes(q) ||
        (d.orderId?.orderNumber || "").toLowerCase().includes(q) ||
        (d.courierMetadata?.driverName || "").toLowerCase().includes(q),
    );
  }, [deliveryJobs, searchQuery]);

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Navbar />

        <div className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* In-page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Dispatch &amp; Delivery Operations
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Quality gate enforcement, dispatch manifests, attempt audit
                history &amp; proof of delivery (POD)
              </p>
            </div>
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
              title="Refresh"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-md bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Ready for Dispatch
                </span>
                <Package className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-700">
                {readyProductionJobs.length}
              </p>
              <span className="text-[10px] text-slate-400 font-medium">
                Passed QC Quality Gate
              </span>
            </div>

            <div className="p-4 rounded-md bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  In Transit
                </span>
                <Truck className="w-4 h-4 text-cyan-600" />
              </div>
              <p className="text-2xl font-black text-cyan-700">
                {inTransitCount}
              </p>
              <span className="text-[10px] text-slate-400 font-medium">
                Dispatched on route
              </span>
            </div>

            <div className="p-4 rounded-md bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Delivered
                </span>
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {deliveredCount}
              </p>
              <span className="text-[10px] text-slate-400 font-medium">
                Confirmed with POD
              </span>
            </div>

            <div className="p-4 rounded-md bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Failed Attempts
                </span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-2xl font-black text-rose-700">
                {failedAttemptsCount}
              </p>
              <span className="text-[10px] text-slate-400 font-medium">
                Audit preserved
              </span>
            </div>
          </div>

          {/* Section 1: Ready to Dispatch Queue (QC-Passed Jobs) */}
          <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    QC-Passed Ready for Dispatch ({readyProductionJobs.length})
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Quality gate enforced: Only jobs with passed QC can be
                  dispatched
                </p>
              </div>
            </div>

            {readyProductionJobs.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                <Package className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-xs font-semibold text-slate-700">
                  No jobs waiting for dispatch.
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Jobs clear into this queue once QC inspection passes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {readyProductionJobs.map((pJob) => (
                  <div
                    key={pJob._id}
                    className="p-4 rounded-xl bg-slate-50 border border-emerald-200 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex justify-between items-center">
                        <Link
                          href={`/dashboard/production/jobs/${pJob._id}`}
                          className="font-bold text-slate-900 hover:text-blue-600 text-xs"
                        >
                          {pJob.productionJobNumber}
                        </Link>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          QC PASSED
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1">
                        Customer: {pJob.customerId?.name || "Customer"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Order: {pJob.orderId?.orderNumber || "N/A"}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">
                        Qty: {pJob.printingDetails?.producedQuantity || 1} units
                      </span>
                      {canManage ? (
                        <button
                          onClick={() => openDispatchModalForProduction(pJob)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Dispatch</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">
                          View Only
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Active & Historical Delivery Jobs */}
          <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Dispatched Consignments &amp; Tracking
                </h4>
                <p className="text-[11px] text-slate-500">
                  Courier metadata, transit attempts &amp; POD verification
                </p>
              </div>

              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search delivery #, customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs transition-colors"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Delivery #</th>
                    <th className="py-3 px-4">Order / Customer</th>
                    <th className="py-3 px-4">Delivery Mode</th>
                    <th className="py-3 px-4">Courier &amp; Driver</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Attempts</th>
                    <th className="py-3 px-4">POD Recipient</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="py-12 text-center text-slate-500"
                      >
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                        <span>Loading delivery records...</span>
                      </td>
                    </tr>
                  ) : filteredDeliveryJobs.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="py-12 text-center text-slate-500"
                      >
                        <Truck className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <p className="font-semibold text-slate-700">
                          No delivery consignments found.
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Dispatched jobs will automatically populate here.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredDeliveryJobs.map((del) => {
                      const isDispatched =
                        del.status === "DISPATCHED" ||
                        del.status === "OUT_FOR_DELIVERY";
                      const isDelivered = del.status === "DELIVERED";

                      return (
                        <tr
                          key={del._id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {del.deliveryNumber}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-900 block">
                              {del.customerId?.name || "Customer"}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Order: {del.orderId?.orderNumber || "N/A"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {del.deliveryType}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-900 block">
                              {del.courierMetadata?.courierName ||
                                del.courierMetadata?.driverName ||
                                "Internal"}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {del.courierMetadata?.driverPhone ||
                                del.courierMetadata?.vehicleNumber ||
                                ""}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                isDelivered
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : isDispatched
                                    ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {del.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-800 font-bold">
                              {del.attempts?.length || 0}
                            </span>
                            {del.attempts?.length > 0 && (
                              <span className="text-[10px] text-rose-600 block">
                                Last:{" "}
                                {del.attempts[del.attempts.length - 1]?.reason}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {del.proofOfDelivery?.recipientName ? (
                              <div>
                                <span className="font-bold text-emerald-700 block">
                                  {del.proofOfDelivery.recipientName}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {new Date(
                                    del.deliveredAt ||
                                      del.proofOfDelivery.receivedAt,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {canManage && isDispatched && (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openAttemptModal(del)}
                                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                                  title="Log Failed Delivery Attempt"
                                >
                                  Log Attempt
                                </button>
                                <button
                                  onClick={() => openPodModal(del)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                                  title="Confirm Delivery with Proof of Delivery (POD)"
                                >
                                  POD Sign
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Dispatch Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-md w-full max-w-md p-6 space-y-4 shadow-xl text-slate-800 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Create Dispatch Manifest
                </h3>
                <p className="text-xs text-slate-500">
                  Quality gate cleared: Hand off package to courier/driver
                </p>
              </div>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-800 p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                {errorMsg}
              </p>
            )}

            <form onSubmit={handleConfirmDispatch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Delivery Channel
                </label>
                <select
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="CUSTOMER_DELIVERY">
                    CUSTOMER_DELIVERY (Internal Driver)
                  </option>
                  <option value="COURIER">COURIER (External Logistics)</option>
                  <option value="CUSTOMER_PICKUP">
                    CUSTOMER_PICKUP (Workshop Counter)
                  </option>
                  <option value="DIRECT_DELIVERY">
                    DIRECT_DELIVERY (Direct Drop)
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Courier / Service
                  </label>
                  <input
                    type="text"
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    placeholder="e.g. BlueDart / Van 01"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Driver Name
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="e.g. Mukesh"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Driver Phone
                  </label>
                  <input
                    type="text"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Vehicle / Tracking #
                  </label>
                  <input
                    type="text"
                    value={vehicleNumber || trackingNumber}
                    onChange={(e) => {
                      setVehicleNumber(e.target.value);
                      setTrackingNumber(e.target.value);
                    }}
                    placeholder="e.g. MH-04-AB-1234"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attempt Logger Modal */}
      {showAttemptModal && selectedDeliveryJob && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-md w-full max-w-md p-6 space-y-4 shadow-xl text-slate-800 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Record Delivery Attempt
                </h3>
                <p className="text-xs text-slate-500">
                  Preserves audit history without deleting job
                </p>
              </div>
              <button
                onClick={() => setShowAttemptModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-800 p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                {errorMsg}
              </p>
            )}

            <form onSubmit={handleRecordAttempt} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Reason for Failure
                </label>
                <select
                  value={attemptReason}
                  onChange={(e) => setAttemptReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="Customer unavailable / Premises closed">
                    Customer unavailable / Premises closed
                  </option>
                  <option value="Wrong address / Relocated">
                    Wrong address / Relocated
                  </option>
                  <option value="Refused delivery">Refused delivery</option>
                  <option value="Weather / Road blockage">
                    Weather / Road blockage
                  </option>
                  <option value="Payment pending on delivery">
                    Payment pending on delivery
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Attempt Notes
                </label>
                <textarea
                  rows="3"
                  value={attemptNotes}
                  onChange={(e) => setAttemptNotes(e.target.value)}
                  placeholder="Driver observations, customer phone interaction..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAttemptModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  Log Failed Attempt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proof of Delivery (POD) Modal */}
      {showPodModal && selectedDeliveryJob && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-md w-full max-w-md p-6 space-y-4 shadow-xl text-slate-800 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Record Proof of Delivery (POD)
                </h3>
                <p className="text-xs text-slate-500">
                  Final handover to customer
                </p>
              </div>
              <button
                onClick={() => setShowPodModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-800 p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                {errorMsg}
              </p>
            )}

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
              <span className="font-bold block text-blue-950">
                Automated Financial Settlement Logic:
              </span>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                If the associated Order balance is fully settled (0 balance
                due), the Order will automatically advance to{" "}
                <strong className="text-blue-950">COMPLETED</strong>. If an
                outstanding balance remains, the Order will transition to{" "}
                <strong className="text-blue-950">DELIVERED</strong> awaiting
                financial closure.
              </p>
            </div>

            <form onSubmit={handleCompleteDelivery} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={podRecipientName}
                  onChange={(e) => setPodRecipientName(e.target.value)}
                  placeholder="Person who accepted delivery"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Handover Notes
                </label>
                <textarea
                  rows="2"
                  value={podNotes}
                  onChange={(e) => setPodNotes(e.target.value)}
                  placeholder="Package condition, receipt signed on site..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPodModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  Sign &amp; Confirm Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
