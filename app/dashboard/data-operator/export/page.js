"use client";

import React from "react";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import ExportDataView from "../components/ExportDataView";

export default function DataOperatorExportPage() {
  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Navbar showNotificationCenter={false} />
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
          <ExportDataView />
        </div>
      </main>
    </div>
  );
}
