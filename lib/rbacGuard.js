/**
 * Frontend Role-Based Access Control (RBAC) Guard
 * Strictly restricts URL route navigation according to enterprise user role.
 */

export const CANONICAL_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  SALES: 'sales',
  DATA_OPERATOR: 'data_operator',
};

/**
 * Normalizes any stored role string into one of the supported roles.
 */
export function normalizeRole(rawRole) {
  if (!rawRole) return '';
  const r = String(rawRole).trim().toLowerCase();
  if (r === 'admin' || r === 'super_admin' || r === 'superadmin' || r === 'ceo_admin') {
    return CANONICAL_ROLES.ADMIN;
  }
  if (r === 'manager' || r === 'sales_manager' || r === 'operations_manager') {
    return CANONICAL_ROLES.MANAGER;
  }
  if (r === 'designer' || r === 'graphic_designer') return '';
  if (r === 'data_operator' || r === 'data-operator' || r === 'data operator' || r === 'operator') {
    return CANONICAL_ROLES.DATA_OPERATOR;
  }
  if (r === 'sales' || r === 'sales_executive' || r === 'employee' || r === 'executive') {
    return CANONICAL_ROLES.SALES;
  }
  return r;
}

/**
 * User-friendly display label for each role.
 */
export function getRoleDisplayName(role) {
  const norm = normalizeRole(role);
  switch (norm) {
    case CANONICAL_ROLES.ADMIN:
      return 'Administrator';
    case CANONICAL_ROLES.MANAGER:
      return 'Operations Manager';
    case CANONICAL_ROLES.DATA_OPERATOR:
      return 'Data Operator';
    case CANONICAL_ROLES.SALES:
      return 'Sales Executive';
    default:
      return 'Standard User';
  }
}

/**
 * Default authorized home page for each role.
 */
export function getDefaultDashboardForRole(role) {
  const norm = normalizeRole(role);
  switch (norm) {
    case CANONICAL_ROLES.ADMIN:
      return '/dashboard/admin';
    case CANONICAL_ROLES.MANAGER:
      return '/dashboard/manager';
    case CANONICAL_ROLES.DATA_OPERATOR:
      return '/dashboard/data-operator';
    case CANONICAL_ROLES.SALES:
      return '/dashboard/sales';
    default:
      return '/dashboard';
  }
}

/**
 * Route protection rules.
 * Sorted from most specific to least specific.
 */
export const ROUTE_PERMISSIONS = [
  // 1. Admin only (Governance, users, roles, audit, targets, settings, areas, products)
  {
    prefix: '/dashboard/admin',
    allowedRoles: [CANONICAL_ROLES.ADMIN],
    label: 'Administration & System Governance',
  },

  // 2. Operations Manager & Admin (Team oversight, approvals, production release)
  {
    prefix: '/dashboard/manager',
    allowedRoles: [CANONICAL_ROLES.ADMIN, CANONICAL_ROLES.MANAGER],
    label: 'Operations & Management Center',
  },


  // 4. Data Operator Workspace (Admin, Data Operator)
  {
    prefix: '/dashboard/data-operator',
    allowedRoles: [CANONICAL_ROLES.ADMIN, CANONICAL_ROLES.DATA_OPERATOR],
    label: 'Data Operator Workspace',
  },



  // 6. Sales Dashboard (Admin, Manager, Sales)
  {
    prefix: '/dashboard/sales',
    allowedRoles: [CANONICAL_ROLES.ADMIN, CANONICAL_ROLES.MANAGER, CANONICAL_ROLES.SALES],
    label: 'Sales Executive Dashboard',
  },

  // 7. Commercial CRM Modules (Admin, Manager, Sales)
  {
    prefix: '/dashboard/leads',
    allowedRoles: [CANONICAL_ROLES.ADMIN, CANONICAL_ROLES.MANAGER, CANONICAL_ROLES.SALES],
    label: 'Leads & Inquiry Management',
  },
  {
    prefix: '/dashboard/leadboard',
    allowedRoles: [CANONICAL_ROLES.ADMIN, CANONICAL_ROLES.MANAGER, CANONICAL_ROLES.SALES],
    label: 'Leads Pipeline Board',
  },
  {
    prefix: '/dashboard/customers',
    allowedRoles: [CANONICAL_ROLES.ADMIN, CANONICAL_ROLES.MANAGER, CANONICAL_ROLES.SALES],
    label: 'Customer Accounts Ledger',
  },
  {
    prefix: '/dashboard/quotations',
    allowedRoles: [CANONICAL_ROLES.ADMIN, CANONICAL_ROLES.MANAGER, CANONICAL_ROLES.SALES],
    label: 'Quotations & Commercial Pricing',
  },
  {
    prefix: '/dashboard/orders',
    allowedRoles: [CANONICAL_ROLES.ADMIN, CANONICAL_ROLES.MANAGER, CANONICAL_ROLES.SALES],
    label: 'Commercial Orders & Billing',
  },
  {
    prefix: '/dashboard/payments',
    allowedRoles: [CANONICAL_ROLES.ADMIN, CANONICAL_ROLES.MANAGER, CANONICAL_ROLES.SALES],
    label: 'Payment Ledgers & Receipts',
  },
  {
    prefix: '/dashboard/receivables',
    allowedRoles: [CANONICAL_ROLES.ADMIN, CANONICAL_ROLES.MANAGER, CANONICAL_ROLES.SALES],
    label: 'Accounts Receivable & Ageing',
  },
  {
    prefix: '/dashboard/followups',
    allowedRoles: [CANONICAL_ROLES.ADMIN, CANONICAL_ROLES.MANAGER, CANONICAL_ROLES.SALES],
    label: 'Sales Follow-up Schedules',
  },
  {
    prefix: '/dashboard/performance',
    allowedRoles: [CANONICAL_ROLES.ADMIN, CANONICAL_ROLES.MANAGER, CANONICAL_ROLES.SALES],
    label: 'Sales Targets & Performance',
  },
];

/**
 * Checks if a user role is authorized to view a specific pathname.
 */
export function checkRouteAccess(pathname, role) {
  if (!pathname) return { authorized: true };

  const normRole = normalizeRole(role);

  // Find the first matching prefix rule (sorted by specificity)
  const matchedRule = ROUTE_PERMISSIONS.find((rule) => {
    // Exact match or prefix match followed by / or end of string
    if (pathname === rule.prefix) return true;
    if (pathname.startsWith(`${rule.prefix}/`)) return true;
    return false;
  });

  if (!matchedRule) {
    // General routes (e.g. /dashboard, /dashboard/notes, /dashboard/leaderboard, /dashboard/reports)
    return { authorized: true };
  }

  const isAllowed = matchedRule.allowedRoles.includes(normRole);

  return {
    authorized: isAllowed,
    rule: matchedRule,
    normRole,
  };
}
