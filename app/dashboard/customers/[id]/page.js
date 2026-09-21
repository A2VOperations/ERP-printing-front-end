"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../../../components/sidebar";
import Navbar from "../../../components/navbar";
import Customer360View from "../../../components/customers/customer-360-view";
import GlobalSearchModal from "../../../components/search/global-search-modal";

export default function CustomerDetailPage() {
  const rawId = params?.id;
  const customerId = typeof rawId === 'string' ? rawId : (rawId?.id || '');

  const [user, setUser] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  useEffect(() => {
    const rawUser = localStorage.getItem("crm_user") || localStorage.getItem("user");
    if (rawUser) {
      try {
        setUser(JSON.parse(rawUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  // Global search shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowGlobalSearch((prev) => !prev);
      }
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 antialiased overflow-hidden selection:bg-blue-600 selection:text-white">
      <Sidebar
        activeTab="customers"
        setActiveTab={(tab) => {
          if (tab === "customers") router.push("/dashboard/customers");
          else router.push("/dashboard");
        }}
        user={user}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar
          user={user}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          onOpenGlobalSearch={() => setShowGlobalSearch(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Customer360View customerId={customerId} user={user} />
          </div>
        </main>
      </div>

      <GlobalSearchModal isOpen={showGlobalSearch} onClose={() => setShowGlobalSearch(false)} />
    </div>
  );
}
