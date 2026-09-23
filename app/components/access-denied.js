"use client";

import React from "react";
import Link from "next/link";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import {
  ShieldAlert,
  Lock,
  ArrowRight,
  Home,
  AlertTriangle,
  ChevronLeft,
} from "lucide-react";
import {
  getRoleDisplayName,
  getDefaultDashboardForRole,
} from "@/lib/rbacGuard";

export default function AccessDeniedView({ pathname, role, rule }) {
  const roleDisplay = getRoleDisplayName(role);
  const homePath = getDefaultDashboardForRole(role);
  const allowedRolesDisplay = (rule?.allowedRoles || [])
    .map((r) => getRoleDisplayName(r))
    .join(" or ");

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div className="max-w-xl w-full bg-white border border-slate-200 shadow-sm rounded-3xl p-8 md:p-10 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Top Shield Icon */}
            <div className="mx-auto w-16 h-16 rounded-md bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-8 h-8" />
            </div>

            {/* Title & Badge */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold uppercase tracking-wider">
                <Lock className="w-3 h-3" />
                <span>Security Policy Restriction</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Access Denied — 403 Forbidden
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                You do not have authorization to view this enterprise section.
              </p>
            </div>

            {/* Diagnostic Details Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-md p-4 text-xs space-y-2.5 text-left font-medium">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <span className="text-slate-500">Attempted Route:</span>
                <code className="font-mono text-rose-600 bg-white px-2 py-0.5 rounded border border-slate-200 font-bold">
                  {pathname || "/restricted"}
                </code>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <span className="text-slate-500">Your Current Role:</span>
                <span className="font-bold text-slate-900 bg-slate-200/60 px-2 py-0.5 rounded">
                  {roleDisplay}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Required Role:</span>
                <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded">
                  {allowedRolesDisplay || "Administrator"}
                </span>
              </div>
            </div>

            {/* Explanation */}
            <p className="text-xs text-slate-500 leading-relaxed">
              Direct URL entry to restricted management, administrative, or
              departmental workspaces is blocked by enterprise role-based access
              control (RBAC). If you believe you should have access to this
              resource, please contact your organization administrator.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href={homePath}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/25 transition-all"
              >
                <span>Return to Your Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-all"
              >
                <Home className="w-3.5 h-3.5 text-slate-500" />
                <span>Main Overview</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
