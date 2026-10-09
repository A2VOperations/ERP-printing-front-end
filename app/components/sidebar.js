"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";
import { api } from "@/lib/api";
import { normalizeRole } from "@/lib/rbacGuard";
import { getNavSections, isRouteActive } from "@/lib/navigationConfig";

export default function Sidebar({ isMobileOpen = false, onCloseMobile = null } = {}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [inboxCount, setInboxCount] = useState(0);
  const [userRole, setUserRole] = useState(() => {
    if (typeof window !== "undefined") {
      let r = localStorage.getItem("userRole");
      if (!r) {
        try {
          const u = JSON.parse(localStorage.getItem("user") || "{}");
          r = u.roleSlug || u.role || "";
        } catch {}
      }
      if (!r) {
        if (pathname?.startsWith("/dashboard/data-operator"))
          r = "data_operator";
        else if (pathname?.startsWith("/dashboard/admin")) r = "admin";
        else if (pathname?.startsWith("/dashboard/manager")) r = "manager";
        else r = "sales";
      }
      return r.toLowerCase();
    }
    return "sales";
  });
  const isDataOperator =
    pathname?.startsWith("/dashboard/data-operator") ||
    normalizeRole(userRole) === "data_operator" ||
    userRole.includes("operator");

  const isAdminOrManager =
    pathname?.startsWith("/dashboard/admin") ||
    pathname?.startsWith("/dashboard/manager") ||
    normalizeRole(userRole) === "admin" ||
    normalizeRole(userRole) === "manager" ||
    userRole.includes("admin") ||
    userRole.includes("manager");

  // Strictly ONLY a true sales representative on sales-related workflows
  const isSalesPerson = normalizeRole(userRole) === "sales";

  const [currentUser] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const u = localStorage.getItem("user");
        return u ? JSON.parse(u) : null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [currentFilter, setCurrentFilter] = useState(() =>
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("filter") || ""
      : "",
  );
  const [currentView, setCurrentView] = useState(() =>
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("view") || ""
      : "",
  );

  useEffect(() => {
    if (searchParams) {
      setCurrentFilter(searchParams.get("filter") || "");
      setCurrentView(searchParams.get("view") || "");
    }
  }, [searchParams]);

  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("sidebar_collapsed") === "true"
      : false,
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleToggle = () => {
        setCollapsed((prev) => {
          const next = !prev;
          localStorage.setItem("sidebar_collapsed", String(next));
          return next;
        });
      };

      window.addEventListener("toggle-sidebar", handleToggle);
      return () => window.removeEventListener("toggle-sidebar", handleToggle);
    }
  }, [pathname]);

  const hasFetchedInboxRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const fetchPendingInbox = async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("token") ||
              localStorage.getItem("auth_token")
            : null;
        if (!token) return;

        if (!isSalesPerson) {
          if (isMounted) setInboxCount(0);
          return;
        }

        const res = await api.get("/leads?acceptanceStatus=PENDING&limit=1", { silent: true });
        if (isMounted && res?.data?.pagination) {
          setInboxCount(res.data.pagination.totalRecords || 0);
        } else if (isMounted && Array.isArray(res?.data)) {
          setInboxCount(res.data.length);
        }
      } catch (e) {}
    };

    if (!hasFetchedInboxRef.current && isSalesPerson) {
      hasFetchedInboxRef.current = true;
      fetchPendingInbox();
    }

    const handleRefresh = (e) => {
      setTimeout(() => {
        if (!isMounted) return;
        if (!isSalesPerson) {
          setInboxCount(0);
          return;
        }
        if (e?.detail?.count !== undefined) {
          setInboxCount(Number(e.detail.count) || 0);
        }
      }, 0);
    };
    window.addEventListener("refresh-inbox-count", handleRefresh);
    window.addEventListener("lead-assigned", handleRefresh);

    return () => {
      isMounted = false;
      window.removeEventListener("refresh-inbox-count", handleRefresh);
      window.removeEventListener("lead-assigned", handleRefresh);
    };
  }, [isSalesPerson]);

  const navSections = getNavSections(userRole);

  return (
    <>
      {/* Optional Mobile Slide-Over Drawer (when isMobileOpen prop is active) */}
      {isMobileOpen && (
        <div
          onClick={() => onCloseMobile?.()}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-start animate-fade-in md:hidden cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-72 max-w-[85vw] bg-[#0F172A] text-slate-300 h-full flex flex-col justify-between shadow-2xl border-r border-slate-800 animate-slide-right cursor-default overflow-hidden select-none"
          >
            <div className="flex flex-col h-full overflow-hidden">
              {/* Brand Header */}
              <div className="h-16 flex items-center justify-between border-b border-slate-800/80 px-4 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <Image
                    src="/logo/A2V  Groups Logo.png"
                    alt="logo"
                    width={50}
                    height={50}
                    style={{ width: "auto", height: "auto" }}
                    className="shrink-0"
                  />
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <span className="font-medium text-[22px] text-white block truncate">
                      A2V PRINTS
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onCloseMobile?.()}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                  aria-label="Close navigation menu"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>

              {/* Dynamic Navigation Sections */}
              <div className="flex-1 py-4 space-y-5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                {navSections.map((section, sIdx) => (
                  <div key={section.title || `mob-sec-${sIdx}`} className="space-y-1">
                    {section.title && (
                      <span className="px-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5 truncate">
                        {section.title}
                      </span>
                    )}
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = isRouteActive(
                        item,
                        pathname,
                        currentView,
                        currentFilter
                      );

                      return (
                        <Link
                          key={item.name + item.href}
                          href={item.href}
                          onClick={() => {
                            onCloseMobile?.();
                            if (item.href.includes("?view=")) {
                              setCurrentView(item.href.split("?view=")[1]);
                            } else if (item.href === "/dashboard/data-operator") {
                              setCurrentView("");
                            }
                          }}
                          className={`relative group flex items-center text-xs font-semibold transition-all duration-150 gap-3 px-3 py-2 mx-2 rounded-xl ${
                            isActive
                              ? "bg-[#F95721] text-white shadow-md shadow-orange-600/30"
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 shrink-0 ${
                              isActive
                                ? "text-white"
                                : "text-slate-400 group-hover:text-slate-200"
                            }`}
                          />
                          <span className="truncate text-base">{item.name}</span>

                          {item.href === "/dashboard/leads/inbox" &&
                            isSalesPerson &&
                            inboxCount > 0 && (
                              <span
                                className="ml-auto inline-flex items-center gap-1.5 bg-linear-to-r from-red-600 to-rose-600 text-white font-black text-[11px] px-2.5 py-0.5 rounded-full shadow-md shadow-red-600/40 border border-red-400/40 animate-pulse tracking-wide"
                                title={`${inboxCount} lead${inboxCount > 1 ? "s" : ""} assigned to you`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                                <span>{inboxCount}</span>
                              </span>
                            )}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:flex flex-col justify-between shrink-0 bg-[#0F172A] text-slate-300 min-h-screen border-r border-slate-800 select-none transition-all duration-300 ease-in-out sticky top-0 h-screen z-20 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div
            className={`h-16 flex items-center border-b border-slate-800/80 shrink-0 transition-all ${
              collapsed ? "px-0 justify-center" : "px-6 gap-3"
            }`}
          >
            <button
              type="button"
              title={collapsed ? "Expand sidebar" : "A2V Prints Enterprise CRM"}
              onClick={() => {
                setCollapsed((prev) => {
                  const next = !prev;
                  if (typeof window !== "undefined") {
                    localStorage.setItem("sidebar_collapsed", String(next));
                  }
                  return next;
                });
              }}
              className=" flex items-center justify-center font-black  text-white shrink-0 cursor-pointer hover:scale-105 transition-transform"
            >
              <Image
                src="/logo/A2V  Groups Logo.png"
                alt="logo"
                width={60}
                height={60}
                style={{ width: "auto", height: "auto" }}
                className="shrink-0"
              />
            </button>
            {!collapsed && (
              <div className="min-w-0 flex-1 overflow-hidden animate-fade-in">
                <span className="font-medium text-[23px] text-white block truncate">
                  A2V PRINTS
                </span>
              </div>
            )}
          </div>

          {/* Dynamic Navigation Sections */}
          <div className="flex-1 py-4 space-y-5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1">
                {collapsed ? (
                  <div className="h-px bg-slate-800/80 my-2 mx-1" />
                ) : (
                  <span className="px-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5 truncate">
                    {section.title}
                  </span>
                )}
                {section.items.map((item) => {
                  const Icon = item.icon;

                  const isActive = isRouteActive(item, pathname, currentView, currentFilter);

                  return (
                    <Link
                      key={item.name + item.href}
                      href={item.href}
                      title={collapsed ? item.name : undefined}
                      onClick={() => {
                        if (item.href.includes("?view=")) {
                          setCurrentView(item.href.split("?view=")[1]);
                        } else if (item.href === "/dashboard/data-operator") {
                          setCurrentView("");
                        }
                      }}
                      className={`relative group flex items-center text-xs font-semibold transition-all duration-150 ${
                        collapsed
                          ? "justify-center p-2.5 mx-1 rounded-lg"
                          : "gap-3 px-3 py-2 mx-2 rounded-xl"
                      } ${
                        isActive ? "bg-[#F95721] text-white shadow-md shadow-orange-600/30"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 shrink-0 ${
                          isActive
                            ? "text-white"
                            : "text-slate-400 group-hover:text-slate-200"
                        }`}
                      />
                      {!collapsed && (
                        <span className="truncate text-base">{item.name}</span>
                      )}

                      {!collapsed &&
                        item.href === "/dashboard/leads/inbox" &&
                        isSalesPerson &&
                        inboxCount > 0 && (
                          <span
                            className="ml-auto inline-flex items-center gap-1.5 bg-linear-to-r from-red-600 to-rose-600 text-white font-black text-[11px] px-2.5 py-0.5 rounded-full shadow-md shadow-red-600/40 border border-red-400/40 animate-pulse tracking-wide"
                            title={`${inboxCount} lead${inboxCount > 1 ? "s" : ""} assigned to you`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                            <span>{inboxCount}</span>
                          </span>
                        )}

                      {collapsed &&
                        item.href === "/dashboard/leads/inbox" &&
                        isSalesPerson &&
                        inboxCount > 0 && (
                          <>
                            <span className="absolute top-1 right-1 w-3 h-3 bg-red-600 rounded-full animate-ping ring-2 ring-white" />
                            <span className="absolute top-1 right-1 w-3 h-3 bg-red-600 rounded-full ring-2 ring-slate-900 flex items-center justify-center text-[8px] font-black text-white">
                              {inboxCount > 9 ? "9+" : inboxCount}
                            </span>
                          </>
                        )}

                      {/* Floating Tooltip in Collapsed Mode */}
                      {collapsed && (
                        <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-2xl border border-slate-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 flex items-center gap-2">
                          <span>{item.name}</span>
                          {inboxCount > 0 &&
                            isSalesPerson &&
                            item.href === "/dashboard/leads/inbox" && (
                              <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
                                {inboxCount} assigned
                              </span>
                            )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Bottom Collapse Toggle Footer */}
          <div className="p-3 border-t border-slate-800/80 shrink-0">
            <button
              onClick={() => {
                setCollapsed((prev) => {
                  const next = !prev;
                  if (typeof window !== "undefined") {
                    localStorage.setItem("sidebar_collapsed", String(next));
                  }
                  return next;
                });
              }}
              className={`w-full flex items-center ${
                collapsed ? "justify-center p-2" : "justify-between px-3 py-2"
              } rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors`}
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {!collapsed && <span>Collapse Sidebar</span>}
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
