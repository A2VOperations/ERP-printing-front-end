"use client";

import React from "react";
import LeadStatusActions from "./LeadStatusActions";

export default function LeadTable({
  leads,
  loading,
  onLeadAction,
  onLeadSelect,
  currentUser,
}) {
  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-3"></div>
        <p className="text-zinc-400 text-sm">Loading lead pipeline...</p>
      </div>
    );
  }

  if (!leads || leads.length === 0) {
    return (
      <div className="py-20 text-center text-zinc-400">
        <p className="text-base font-medium text-zinc-300 mb-1">No leads found in this view</p>
        <p className="text-xs text-zinc-500">Create a new lead inquiry or adjust active filters.</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "NEW":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "CONTACTED":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "INTERESTED":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "FOLLOW_UP":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "WON":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "LOST":
      case "NOT_INTERESTED":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "ON_HOLD":
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
      default:
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-800/40 text-zinc-400 border-b border-zinc-800 font-medium">
          <tr>
            <th className="py-3.5 px-4">Lead ID</th>
            <th className="py-3.5 px-4">Contact / Company</th>
            <th className="py-3.5 px-4">Requirement Details</th>
            <th className="py-3.5 px-4">Source</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4">Assigned To</th>
            <th className="py-3.5 px-4 text-right">Workflow Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
          {leads.map((lead) => (
            <tr
              key={lead._id}
              onClick={() => onLeadSelect && onLeadSelect(lead)}
              className="hover:bg-zinc-800/40 transition cursor-pointer group"
            >
              <td className="py-3.5 px-4 font-mono text-xs font-bold text-blue-400 group-hover:text-blue-300">
                {lead.leadNumber || "LEAD-NEW"}
              </td>
              <td className="py-3.5 px-4">
                <div className="font-semibold text-white flex items-center gap-2">
                  <span>{lead.contactName || lead.name}</span>
                  {lead.customerId && (
                    <span className="px-1.5 py-0.5 text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                      Linked
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-400">
                  {lead.businessName || lead.companyName || lead.phone}
                </div>
              </td>
              <td className="py-3.5 px-4 max-w-xs truncate">
                <div className="text-zinc-200 truncate">{lead.requirement || "Printing Inquiry"}</div>
                {lead.printingRequirement?.productName && (
                  <div className="text-xs text-zinc-500">
                    {lead.printingRequirement.productName} ({lead.printingRequirement.quantity || 0} pcs)
                  </div>
                )}
              </td>
              <td className="py-3.5 px-4 text-xs text-zinc-400">
                <span className="px-2 py-0.5 bg-zinc-800/80 rounded border border-zinc-700/60 font-medium">
                  {lead.source || "MANUAL"}
                </span>
              </td>
              <td className="py-3.5 px-4">
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(lead.status)}`}>
                  {lead.status}
                </span>
              </td>
              <td className="py-3.5 px-4 text-xs text-zinc-400">
                {lead.assignedToId?.name || lead.assignedTo || "Unassigned"}
              </td>
              <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                <LeadStatusActions
                  lead={lead}
                  currentUser={currentUser}
                  onActionComplete={onLeadAction}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
