"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  Users,
  Clock,
  ShoppingBag,
  FileText,
  CreditCard,
  Palette,
  Folder,
  BarChart3,
  TrendingUp,
  Award,
  Settings,
  ShieldCheck,
  History,
  Layers,
  FileCheck,
  RefreshCw,
  MapPin,
  CheckSquare,
  DollarSign,
  Eye,
  Lock,
  Target,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Image as ImageIcon,
  PlusCircle,
  List,
  Download,
  Headphones,
  Inbox,
} from "lucide-react";
import Image from "next/image";
import { api } from "@/lib/api";
import { normalizeRole } from "@/lib/rbacGuard";

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [inboxCount, setInboxCount] = useState(0);
  const [userRole, setUserRole] = useState(() =>
    typeof window !== "undefined"
      ? (localStorage.getItem("userRole") || "admin").toLowerCase()
      : "admin"
  );
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
  const isSalesPerson =
    !isDataOperator &&
    !isAdminOrManager &&
    normalizeRole(userRole) === "sales" &&
    !pathname?.startsWith("/dashboard/designer");

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
      : ""
  );
  const [currentView, setCurrentView] = useState(() =>
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("view") || ""
      : ""
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
      : false
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

  useEffect(() => {
    let isMounted = true;
    const fetchPendingInbox = async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("token") || localStorage.getItem("auth_token")
            : null;
        if (!token) return;

        if (!isSalesPerson) {
          if (isMounted) setInboxCount(0);
          return;
        }

        const res = await api.get("/leads?acceptanceStatus=PENDING&assignedToId=my&limit=1");
        if (isMounted && res?.data?.pagination) {
          setInboxCount(res.data.pagination.totalRecords || 0);
        }
      } catch (e) {}
    };

    fetchPendingInbox();
    const interval = setInterval(fetchPendingInbox, 12000);
    const handleRefresh = (e) => {
      if (!isSalesPerson) {
        setInboxCount(0);
        return;
      }
      if (e?.detail?.count !== undefined) {
        setInboxCount(Number(e.detail.count) || 0);
      } else {
        fetchPendingInbox();
      }
    };
    window.addEventListener("refresh-inbox-count", handleRefresh);
    window.addEventListener("lead-assigned", handleRefresh);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("refresh-inbox-count", handleRefresh);
      window.removeEventListener("lead-assigned", handleRefresh);
    };
  }, [isSalesPerson]);

  // Determine role-based menu structures strictly matching specification
  const getNavSections = () => {
    const role = userRole.toLowerCase();

    // 0. DATA OPERATOR MENU
    if (role.includes("data_operator") || role.includes("operator")) {
      return [
        {
          title: "",
          items: [
            {
              name: "Dashboard",
              href: "/dashboard/data-operator",
              icon: Home,
              exact: true,
              isOrange: true,
            },
          ],
        },
        {
          title: "| LEAD ENTRY",
          items: [
            {
              name: "Market Photos",
              href: "/dashboard/data-operator?view=photos",
              icon: ImageIcon,
              isOrange: true,
            },
            {
              name: "Add New Lead",
              href: "/dashboard/data-operator?view=review",
              icon: PlusCircle,
              isOrange: true,
            },
            {
              name: "My Created Leads",
              href: "/dashboard/data-operator?view=leads",
              icon: List,
              isOrange: true,
            },
          ],
        },
        {
          title: "| MARKET COVERAGE",
          items: [
            {
              name: "Area / Zone Status",
              href: "/dashboard/data-operator?view=coverage",
              icon: MapPin,
              isOrange: true,
            },
          ],
        },
        {
          title: "| REPORTS",
          items: [
            {
              name: "Daily Report",
              href: "/dashboard/data-operator?view=reports",
              icon: BarChart3,
              isOrange: true,
            },
            {
              name: "Export Data",
              href: "/dashboard/data-operator?view=export",
              icon: Download,
              isOrange: true,
            },
          ],
        },
      ];
    }

    // 1. DESIGNER MENU
    if (role.includes("designer")) {
      return [
        {
          title: "MAIN",
          items: [
            {
              name: "Home",
              href: "/dashboard/designer",
              icon: Home,
              exact: true,
            },
            {
              name: "Design Analytics",
              href: "/dashboard/reports",
              icon: BarChart3,
            },
          ],
        },
        {
          title: "DESIGN",
          items: [
            { name: "My Projects", href: "/dashboard/design", icon: Folder },
            {
              name: "New Assignments",
              href: "/dashboard/design?filter=NEW",
              icon: FileCheck,
            },
            {
              name: "Due / Overdue",
              href: "/dashboard/design?filter=DUE",
              icon: Clock,
            },
            {
              name: "Client Review",
              href: "/dashboard/design?filter=CLIENT_REVIEW",
              icon: Eye,
            },
            {
              name: "Revisions",
              href: "/dashboard/design?filter=REVISION",
              icon: RefreshCw,
            },
            {
              name: "Preflight",
              href: "/dashboard/design?filter=PREFLIGHT",
              icon: ShieldCheck,
            },
            {
              name: "Production Ready",
              href: "/dashboard/design?filter=PRODUCTION_READY",
              icon: CheckSquare,
            },
          ],
        },
        {
          title: "OTHER",
          items: [
            { name: "Documents", href: "/dashboard/documents", icon: Folder },
          ],
        },
      ];
    }

    // 2. MANAGER MENU
    if (role.includes("manager")) {
      return [
        {
          title: "MAIN",
          items: [
            {
              name: "Dashboard",
              href: "/dashboard",
              icon: LayoutDashboard,
              exact: true,
            },
            {
              name: "Manager Dashboard",
              href: "/dashboard/manager",
              icon: LayoutDashboard,
              exact: true,
            },
            {
              name: "Analytics & Reports",
              href: "/dashboard/reports",
              icon: BarChart3,
            },
          ],
        },
        {
          title: "TEAM OPERATIONS",
          items: [
            { name: "Lead Inbox", href: "/dashboard/leads/inbox", icon: Inbox, exact: true },
            { name: "Leads", href: "/dashboard/leads", icon: Users },
            { name: "Follow-ups", href: "/dashboard/followups", icon: Clock },
            {
              name: "Quotations",
              href: "/dashboard/quotations",
              icon: FileText,
            },
            { name: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
            { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
            {
              name: "Receivables",
              href: "/dashboard/receivables",
              icon: DollarSign,
            },
          ],
        },
        {
          title: "WHATSAPP",
          items: [
            {
              name: "WhatsApp Web",
              href: "/dashboard/whatsapp",
              icon: MessageCircle,
            },
          ],
        },
        {
          title: "APPROVALS",
          items: [
            {
              name: "Approval Center",
              href: "/dashboard/manager/approvals",
              icon: CheckSquare,
            },
          ],
        },
        {
          title: "DESIGN STUDIO",
          items: [
            {
              name: "Design Projects",
              href: "/dashboard/design",
              icon: Palette,
            },
            {
              name: "Production Releases",
              href: "/dashboard/manager/production-release",
              icon: Lock,
            },
          ],
        },
        {
          title: "PRODUCTION",
          items: [
            {
              name: "Production Jobs",
              href: "/dashboard/production",
              icon: Layers,
              exact: true,
            },
            {
              name: "Deliveries",
              href: "/dashboard/production/delivery",
              icon: MapPin,
            },
          ],
        },
        {
          title: "TEAM",
          items: [
            { name: "My Team", href: "/dashboard/manager/team", icon: Users },
            {
              name: "Sales Targets",
              href: "/dashboard/admin/targets",
              icon: Target,
            },
            {
              name: "Performance",
              href: "/dashboard/admin/targets",
              icon: TrendingUp,
            },
            {
              name: "Leaderboard",
              href: "/dashboard/leaderboard",
              icon: Award,
            },
          ],
        },
        {
          title: "OTHER",
          items: [
            { name: "Documents", href: "/dashboard/documents", icon: Folder },
          ],
        },
      ];
    }

    // 3. SALES MENU
    if (
      role.includes("sales") ||
      role.includes("employee") ||
      role.includes("executive")
    ) {
      return [
        {
          title: "MAIN",
          items: [
            {
              name: "Sales Dashboard",
              href: "/dashboard/sales",
              icon: LayoutDashboard,
              exact: true,
            },
            {
              name: "Sales Analytics",
              href: "/dashboard/reports",
              icon: BarChart3,
            },
          ],
        },
        {
          title: "SALES",
          items: [
            { name: "Lead Inbox", href: "/dashboard/leads/inbox", icon: Inbox, exact: true },
            { name: "My Leads", href: "/dashboard/leads", icon: Users },
            { name: "Follow-ups", href: "/dashboard/followups", icon: Clock },
            {
              name: "Quotations",
              href: "/dashboard/quotations",
              icon: FileText,
            },
            { name: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
            { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
            {
              name: "Receivables",
              href: "/dashboard/receivables",
              icon: DollarSign,
            },
          ],
        },
        {
          title: "WHATSAPP",
          items: [
            {
              name: "WhatsApp Web",
              href: "/dashboard/whatsapp",
              icon: MessageCircle,
            },
          ],
        },
        {
          title: "DESIGN & PRODUCTION",
          items: [
            { name: "Design Status", href: "/dashboard/design", icon: Palette },
          ],
        },
        {
          title: "PERFORMANCE",
          items: [
            {
              name: "Performance",
              href: "/dashboard/performance",
              icon: TrendingUp,
            },
            {
              name: "Leaderboard",
              href: "/dashboard/leaderboard",
              icon: Award,
            },
          ],
        },
        {
          title: "OTHER",
          items: [
            { name: "Documents", href: "/dashboard/documents", icon: Folder },
          ],
        },
      ];
    }

    // 4. ADMIN MENU
    return [
      {
        title: "MAIN",
        items: [
          {
            name: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
            exact: true,
          },
          {
            name: "Admin Dashboard",
            href: "/dashboard/admin",
            icon: LayoutDashboard,
            exact: true,
          },
          {
            name: "Analytics & Reports",
            href: "/dashboard/reports",
            icon: BarChart3,
          },
          { name: "Lead Inbox", href: "/dashboard/leads/inbox", icon: Inbox, exact: true },
          { name: "Leads", href: "/dashboard/leads", icon: Users },
          { name: "Follow-ups", href: "/dashboard/followups", icon: Clock },
          { name: "Quotations", href: "/dashboard/quotations", icon: FileText },
          { name: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
          { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
          {
            name: "Receivables",
            href: "/dashboard/receivables",
            icon: DollarSign,
          },
          { name: "Design Studio", href: "/dashboard/design", icon: Palette },
          {
            name: "Production Releases",
            href: "/dashboard/manager/production-release",
            icon: Lock,
          },
          { name: "Documents", href: "/dashboard/documents", icon: Folder },
          { name: "Leaderboard", href: "/dashboard/leaderboard", icon: Award },
        ],
      },
      {
        title: "WHATSAPP",
        items: [
          {
            name: "WhatsApp Web",
            href: "/dashboard/whatsapp",
            icon: MessageCircle,
          },
        ],
      },
      {
        title: "PRODUCTION",
        items: [
          {
            name: "Production Jobs",
            href: "/dashboard/production",
            icon: Layers,
            exact: true,
          },
          {
            name: "Deliveries",
            href: "/dashboard/production/delivery",
            icon: MapPin,
          },
        ],
      },
      {
        title: "ADMINISTRATION",
        items: [
          {
            name: "User Dashboards",
            href: "/dashboard/admin/user-dashboards",
            icon: LayoutDashboard,
          },
          {
            name: "Users Directory",
            href: "/dashboard/admin/users",
            icon: Users,
          },
          {
            name: "Sales Targets",
            href: "/dashboard/admin/targets",
            icon: Target,
          },
          {
            name: "Roles & Permissions",
            href: "/dashboard/admin/roles",
            icon: ShieldCheck,
          },
          {
            name: "Areas & Territories",
            href: "/dashboard/admin/areas",
            icon: MapPin,
          },
          {
            name: "Company Settings",
            href: "/dashboard/admin/settings/company",
            icon: Settings,
          },
          {
            name: "System Settings",
            href: "/dashboard/admin/settings/system",
            icon: Settings,
          },
          { name: "Audit Logs", href: "/dashboard/admin/audit", icon: History },
        ],
      },
    ];
  };

  const navSections = getNavSections();

  return (
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

                let isActive = false;
                if (item.href.includes("?view=")) {
                  const itemView = item.href.split("?view=")[1];
                  isActive =
                    pathname === "/dashboard/data-operator" &&
                    currentView === itemView;
                } else if (item.href === "/dashboard/data-operator") {
                  isActive =
                    pathname === "/dashboard/data-operator" &&
                    (!currentView || currentView === "dashboard");
                } else if (item.href.includes("?filter=")) {
                  const itemFilter = item.href.split("?filter=")[1];
                  isActive =
                    pathname === "/dashboard/design" &&
                    currentFilter === itemFilter;
                } else if (item.href === "/dashboard/design") {
                  isActive = pathname === "/dashboard/design" && !currentFilter;
                } else if (item.href === "/dashboard/leads/inbox") {
                  isActive = pathname === "/dashboard/leads/inbox";
                } else if (item.href === "/dashboard/leads") {
                  isActive =
                    pathname === "/dashboard/leads" ||
                    (pathname.startsWith("/dashboard/leads/") &&
                      !pathname.startsWith("/dashboard/leads/inbox"));
                } else if (item.exact) {
                  isActive = pathname === item.href;
                } else {
                  isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href) &&
                      !item.href.includes("design") &&
                      (item.href !== "/dashboard/leads" ||
                        !pathname.startsWith("/dashboard/leads/inbox")));
                }

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
                      } else if (item.href.includes("?filter=")) {
                        setCurrentFilter(item.href.split("?filter=")[1]);
                      } else if (item.href === "/dashboard/design") {
                        setCurrentFilter("");
                      }
                    }}
                    className={`relative group flex items-center text-xs font-semibold transition-all duration-150 ${
                      collapsed
                        ? "justify-center p-2.5 mx-1 rounded-lg"
                        : "gap-3 px-3 py-2 mx-2 rounded-xl"
                    } ${
                      isActive
                        ? item.isOrange
                          ? "bg-[#F95721] text-white shadow-md shadow-orange-600/30"
                          : "bg-blue-600 text-white shadow-md shadow-blue-600/30"
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

                    {!collapsed && item.href === "/dashboard/leads/inbox" && isSalesPerson && inboxCount > 0 && (
                      <span
                        className="ml-auto inline-flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-[11px] px-2.5 py-0.5 rounded-full shadow-md shadow-red-600/40 border border-red-400/40 animate-pulse tracking-wide"
                        title={`${inboxCount} lead${inboxCount > 1 ? "s" : ""} assigned to you`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                        <span>{inboxCount}</span>
                      </span>
                    )}

                    {collapsed && item.href === "/dashboard/leads/inbox" && isSalesPerson && inboxCount > 0 && (
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
                        {inboxCount > 0 && isSalesPerson && item.href === "/dashboard/leads/inbox" && (
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
  );
}
