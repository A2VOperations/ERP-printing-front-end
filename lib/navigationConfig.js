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
  MessageCircle,
  Image as ImageIcon,
  PlusCircle,
  List,
  Inbox,
} from "lucide-react";

/**
 * Returns the unified role-based navigation sections used across desktop and mobile.
 * @param {string} rawRole
 * @returns {Array<{title: string, items: Array<{name: string, href: string, icon: any, exact?: boolean, isOrange?: boolean}>}>}
 */
export function getNavSections(rawRole = "") {
  const role = (rawRole || "").toLowerCase();

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
        ],
      },
      {
        title: "TEAM OPERATIONS",
        items: [
          {
            name: "Lead Inbox",
            href: "/dashboard/leads/inbox",
            icon: Inbox,
            exact: true,
          },
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
        ],
      },
      {
        title: "SALES",
        items: [
          {
            name: "Lead Inbox",
            href: "/dashboard/leads/inbox",
            icon: Inbox,
            exact: true,
          },
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
    ];
  }

  // 4. ADMIN MENU (DEFAULT)
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
          name: "Lead Inbox",
          href: "/dashboard/leads/inbox",
          icon: Inbox,
          exact: true,
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
}

/**
 * Checks if a given nav item is active based on pathname and search query params.
 */
export function isRouteActive(item, pathname = "", currentView = "", currentFilter = "") {
  if (item.href.includes("?view=")) {
    const itemView = item.href.split("?view=")[1];
    return (
      pathname === "/dashboard/data-operator" &&
      currentView === itemView
    );
  } else if (item.href === "/dashboard/data-operator") {
    return (
      pathname === "/dashboard/data-operator" &&
      (!currentView || currentView === "dashboard")
    );
  } else if (item.href.includes("?filter=")) {
    const itemFilter = item.href.split("?filter=")[1];
    return (
      pathname === "/dashboard/design" &&
      currentFilter === itemFilter
    );
  } else if (item.href === "/dashboard/design") {
    return pathname === "/dashboard/design" && !currentFilter;
  } else if (item.href === "/dashboard/leads/inbox") {
    return pathname === "/dashboard/leads/inbox";
  } else if (item.href === "/dashboard/leads") {
    return (
      pathname === "/dashboard/leads" ||
      (pathname.startsWith("/dashboard/leads/") &&
        !pathname.startsWith("/dashboard/leads/inbox"))
    );
  } else if (item.href === "/dashboard/sales") {
    return pathname === "/dashboard/sales" || pathname === "/dashboard";
  } else if (item.exact) {
    return pathname === item.href;
  } else {
    return (
      pathname === item.href ||
      (item.href !== "/dashboard" &&
        pathname.startsWith(item.href) &&
        !item.href.includes("design") &&
        (item.href !== "/dashboard/leads" ||
          !pathname.startsWith("/dashboard/leads/inbox")))
    );
  }
}
