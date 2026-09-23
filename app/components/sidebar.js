"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
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
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState("admin");
  const [currentFilter, setCurrentFilter] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const storedRole = (
      localStorage.getItem("userRole") || "admin"
    ).toLowerCase();

    setUserRole(storedRole);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setCurrentFilter(params.get("filter") || "");

      const savedCollapsed = localStorage.getItem("sidebar_collapsed");
      if (savedCollapsed === "true") {
        setCollapsed(true);
      }

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

  // Determine role-based menu structures strictly matching specification
  const getNavSections = () => {
    const role = userRole.toLowerCase();

    // 1. DESIGNER MENU
    if (role.includes("designer")) {
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
              name: "Designer Dashboard",
              href: "/dashboard/designer",
              icon: LayoutDashboard,
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
          title: "PRODUCTION",
          items: [
            {
              name: "Production Dashboard",
              href: "/dashboard/production",
              icon: Layers,
              exact: true,
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
              name: "Dashboard",
              href: "/dashboard",
              icon: LayoutDashboard,
              exact: true,
            },
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
            className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white text-sm shadow-md shadow-blue-500/20 shrink-0 cursor-pointer hover:scale-105 transition-transform"
          >
            A2V
          </button>
          {!collapsed && (
            <div className="min-w-0 flex-1 overflow-hidden animate-fade-in">
              <span className="font-black tracking-wider text-sm text-white block truncate">
                A2V PRINTS
              </span>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase block truncate">
                Enterprise CRM
              </span>
            </div>
          )}
        </div>

        {/* Dynamic Navigation Sections */}
        <div className="flex-1 px-3 py-4 space-y-5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {collapsed ? (
                <div className="h-px bg-slate-800/80 my-2 mx-1" />
              ) : (
                <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1.5 truncate">
                  {section.title}
                </span>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;

                let isActive = false;
                if (item.href.includes("?filter=")) {
                  const itemFilter = item.href.split("?filter=")[1];
                  isActive =
                    pathname === "/dashboard/design" &&
                    currentFilter === itemFilter;
                } else if (item.href === "/dashboard/design") {
                  isActive = pathname === "/dashboard/design" && !currentFilter;
                } else if (item.exact) {
                  isActive = pathname === item.href;
                } else {
                  isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href) &&
                      !item.href.includes("design"));
                }

                return (
                  <Link
                    key={item.name + item.href}
                    href={item.href}
                    title={collapsed ? item.name : undefined}
                    onClick={() => {
                      if (item.href.includes("?filter=")) {
                        setCurrentFilter(item.href.split("?filter=")[1]);
                      } else if (item.href === "/dashboard/design") {
                        setCurrentFilter("");
                      }
                    }}
                    className={`relative group flex items-center rounded-xl text-xs font-semibold transition-all duration-150 ${
                      collapsed
                        ? "justify-center p-2.5"
                        : "gap-3 px-3 py-2"
                    } ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    />
                    {!collapsed && (
                      <span className="truncate">{item.name}</span>
                    )}

                    {/* Floating Tooltip in Collapsed Mode */}
                    {collapsed && (
                      <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl border border-slate-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                        {item.name}
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

