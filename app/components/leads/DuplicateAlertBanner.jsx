"use client";

import React from "react";
import Link from "next/link";

export default function DuplicateAlertBanner({ duplicateData }) {
  if (!duplicateData || !duplicateData.hasMatch) return null;

  return (
    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-300 text-sm flex items-start gap-3 animate-in fade-in">
      <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <div className="space-y-1">
        <div className="font-semibold text-white">Existing Customer Profile Detected</div>
        <p className="text-xs text-amber-200/80">
          A registered customer profile exists matching this phone number or email. This new inquiry will automatically link to the existing account history.
        </p>
        {duplicateData.exactPhoneMatch && (
          <Link
            href={`/dashboard/customers/${duplicateData.exactPhoneMatch._id}`}
            className="text-xs font-semibold text-blue-400 hover:underline inline-block pt-1"
          >
            View Customer Profile ({duplicateData.exactPhoneMatch.customerNumber}: {duplicateData.exactPhoneMatch.displayName}) →
          </Link>
        )}
      </div>
    </div>
  );
}
