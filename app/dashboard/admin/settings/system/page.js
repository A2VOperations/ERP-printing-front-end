"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import {
  Sliders,
  Save,
  Building2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

export default function SystemSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Grouped system settings
  const [systemRules, setSystemRules] = useState({
    // CRM Group
    followUpGraceHours: 24,
    autoAssignLeads: true,
    // Quotation Group
    maxSalesDiscountPercent: 5,
    managerApprovalThresholdPercent: 15,
    defaultGstPercent: 18,
    // Payments Group
    mandatoryAdvancePercent: 50,
    creditTermGraceDays: 15,
    // Design Prepress Group
    includedRevisionLimit: 3,
    minPreflightDpi: 300,
    dimensionToleranceMm: 2,
  });

  const fetchSystemSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/settings");
      if (res && res.data) {
        const br = res.data.businessRules || {};
        setSystemRules((prev) => ({
          ...prev,
          ...br,
          defaultGstPercent:
            res.data.defaultTaxRate !== undefined
              ? Number(res.data.defaultTaxRate)
              : (br.defaultGstPercent ?? prev.defaultGstPercent ?? 18),
          mandatoryAdvancePercent:
            res.data.defaultAdvancePercent !== undefined
              ? Number(res.data.defaultAdvancePercent)
              : (br.mandatoryAdvancePercent ??
                prev.mandatoryAdvancePercent ??
                50),
          maxSalesDiscountPercent:
            res.data.salesDiscountThresholdPercent !== undefined
              ? Number(res.data.salesDiscountThresholdPercent)
              : (br.maxSalesDiscountPercent ??
                prev.maxSalesDiscountPercent ??
                5),
          managerApprovalThresholdPercent:
            res.data.managerDiscountThresholdPercent !== undefined
              ? Number(res.data.managerDiscountThresholdPercent)
              : (br.managerApprovalThresholdPercent ??
                prev.managerApprovalThresholdPercent ??
                15),
        }));
      }
    } catch (err) {
      if (err?.message?.includes("403")) {
        setIsAuthorized(false);
      }
      console.error("Failed to load system settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const role = (localStorage.getItem("userRole") || "").toLowerCase();
    if (!role.includes("admin") && role !== "ceo_admin") {
      setIsAuthorized(false);
    }
    fetchSystemSettings();
  }, []);

  const handleSaveSystemSettings = async () => {
    try {
      setSaving(true);
      setSuccessMsg("");
      setShowConfirmModal(false);

      await api.patch("/settings", {
        businessRules: systemRules,
        defaultTaxRate: Number(systemRules.defaultGstPercent) || 18,
        defaultAdvancePercent:
          Number(systemRules.mandatoryAdvancePercent) || 50,
        salesDiscountThresholdPercent:
          Number(systemRules.maxSalesDiscountPercent) || 5,
        managerDiscountThresholdPercent:
          Number(systemRules.managerApprovalThresholdPercent) || 15,
      });

      setSuccessMsg(
        "System business rules successfully updated across Phase 1–4 engines.",
      );
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      alert(err.message || "Failed to update system rules");
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <div className="p-8 max-w-2xl mx-auto w-full text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900">
              403 — Access Denied
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              System business rules configuration is restricted to System
              Administrators.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Sliders className="w-6 h-6 text-purple-600" />
                System Business Rules & Configuration
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Canonical business constraints for CRM pipeline, BPS discount
                governance, and Phase 4 prepress standards
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/admin/settings/company"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs hover:bg-slate-50"
              >
                <Building2 className="w-3.5 h-3.5" />
                Company Profile →
              </Link>
            </div>
          </div>

          {/* Settings Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
            <Link
              href="/dashboard/admin/settings/company"
              className="px-3 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              Company Identity
            </Link>
            <Link
              href="/dashboard/admin/settings/system"
              className="px-3 py-1.5 rounded-xl bg-blue-600 text-white shadow-xs"
            >
              System Business Rules
            </Link>
          </div>

          {successMsg && (
            <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {successMsg}
            </div>
          )}

          {/* Form */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6 text-xs">
            {/* Group 1: CRM & Pipeline */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                1. CRM & Inbound Pipeline Governance
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Follow-up Grace Window (Hours)
                  </label>
                  <input
                    type="number"
                    value={systemRules.followUpGraceHours}
                    onChange={(e) =>
                      setSystemRules({
                        ...systemRules,
                        followUpGraceHours: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500 font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Time before due follow-up marks as OVERDUE
                  </span>
                </div>
              </div>
            </div>

            {/* Group 2: Quotation & Discount BPS */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                2. Quotation Engine & Discount Approval Thresholds
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Auto-Approved Max Discount %
                  </label>
                  <input
                    type="number"
                    value={systemRules.maxSalesDiscountPercent}
                    onChange={(e) =>
                      setSystemRules({
                        ...systemRules,
                        maxSalesDiscountPercent: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500 font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Discounts $\le$ this rate require no manager sign-off
                  </span>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Manager Approval Limit %
                  </label>
                  <input
                    type="number"
                    value={systemRules.managerApprovalThresholdPercent}
                    onChange={(e) =>
                      setSystemRules({
                        ...systemRules,
                        managerApprovalThresholdPercent: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500 font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Discounts above this escalate to CEO / Super Admin
                  </span>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Default Standard GST %
                  </label>
                  <input
                    type="number"
                    value={systemRules.defaultGstPercent}
                    onChange={(e) =>
                      setSystemRules({
                        ...systemRules,
                        defaultGstPercent: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500 font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Intrastate CGST (9%) + SGST (9%) or IGST (18%)
                  </span>
                </div>
              </div>
            </div>

            {/* Group 3: Payments & Commercial Clearance */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                3. Commercial Clearance & Advance Requirements
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Mandatory Advance Percentage %
                  </label>
                  <input
                    type="number"
                    value={systemRules.mandatoryAdvancePercent}
                    onChange={(e) =>
                      setSystemRules({
                        ...systemRules,
                        mandatoryAdvancePercent: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500 font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Minimum payment to trigger commercialReady clearance
                  </span>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Receivables Ageing Grace Days
                  </label>
                  <input
                    type="number"
                    value={systemRules.creditTermGraceDays}
                    onChange={(e) =>
                      setSystemRules({
                        ...systemRules,
                        creditTermGraceDays: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500 font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Grace period before balance moves to OVERDUE bucket
                  </span>
                </div>
              </div>
            </div>

            {/* Group 4: Design & Prepress Standards */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                4. Design Studio & Preflight Standards
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Included Proof Revisions
                  </label>
                  <input
                    type="number"
                    value={systemRules.includedRevisionLimit}
                    onChange={(e) =>
                      setSystemRules({
                        ...systemRules,
                        includedRevisionLimit: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500 font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Free client revision cycles per design project
                  </span>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Minimum Preflight DPI
                  </label>
                  <input
                    type="number"
                    value={systemRules.minPreflightDpi}
                    onChange={(e) =>
                      setSystemRules({
                        ...systemRules,
                        minPreflightDpi: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500 font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Resolution threshold for preflight verification PASS
                  </span>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Dimension Tolerance (mm)
                  </label>
                  <input
                    type="number"
                    value={systemRules.dimensionToleranceMm}
                    onChange={(e) =>
                      setSystemRules({
                        ...systemRules,
                        dimensionToleranceMm: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500 font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Allowed bleed variance before preflight WARNING
                  </span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/25 transition-all"
              >
                <Save className="w-4 h-4" />
                {saving
                  ? "Updating System Rules..."
                  : "Save System Business Rules"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* High-Risk Setting Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl animate-scale-up text-center">
            <div className="w-12 h-12 rounded-md bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Update System Business Rules?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              These rules directly affect commercial discounts, mandatory
              advance requirements, and preflight criteria system-wide.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSystemSettings}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
