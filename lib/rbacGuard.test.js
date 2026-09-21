const { checkRouteAccess, normalizeRole, CANONICAL_ROLES } = require('./rbacGuard');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log('Starting Frontend RBAC Route Security Guard Test Suite...\n');

// 1. Sales role direct URL access tests
assert(!checkRouteAccess('/dashboard/admin', 'sales').authorized, 'Sales typing /dashboard/admin is BLOCKED');
assert(!checkRouteAccess('/dashboard/admin/users', 'sales').authorized, 'Sales typing /dashboard/admin/users is BLOCKED');
assert(!checkRouteAccess('/dashboard/admin/roles', 'sales').authorized, 'Sales typing /dashboard/admin/roles is BLOCKED');
assert(!checkRouteAccess('/dashboard/admin/settings', 'sales').authorized, 'Sales typing /dashboard/admin/settings is BLOCKED');
assert(!checkRouteAccess('/dashboard/admin/targets', 'sales').authorized, 'Sales typing /dashboard/admin/targets is BLOCKED');
assert(!checkRouteAccess('/dashboard/manager', 'sales').authorized, 'Sales typing /dashboard/manager is BLOCKED');
assert(!checkRouteAccess('/dashboard/manager/approvals', 'sales').authorized, 'Sales typing /dashboard/manager/approvals is BLOCKED');
assert(!checkRouteAccess('/dashboard/manager/team', 'sales').authorized, 'Sales typing /dashboard/manager/team is BLOCKED');
assert(!checkRouteAccess('/dashboard/manager/production-release', 'sales').authorized, 'Sales typing /dashboard/manager/production-release is BLOCKED');
assert(!checkRouteAccess('/dashboard/production', 'sales').authorized, 'Sales typing /dashboard/production is BLOCKED');
assert(!checkRouteAccess('/dashboard/production/partners', 'sales').authorized, 'Sales typing /dashboard/production/partners is BLOCKED');
assert(!checkRouteAccess('/dashboard/designer', 'sales').authorized, 'Sales typing /dashboard/designer is BLOCKED');
assert(!checkRouteAccess('/dashboard/design', 'sales').authorized, 'Sales typing /dashboard/design is BLOCKED');
assert(!checkRouteAccess('/dashboard/communication/settings', 'sales').authorized, 'Sales typing /dashboard/communication/settings is BLOCKED');
assert(checkRouteAccess('/dashboard/sales', 'sales').authorized, 'Sales typing /dashboard/sales is ALLOWED');
assert(checkRouteAccess('/dashboard/sales-report', 'sales').authorized, 'Sales typing /dashboard/sales-report is ALLOWED');
assert(checkRouteAccess('/dashboard/leads', 'sales').authorized, 'Sales typing /dashboard/leads is ALLOWED');
assert(checkRouteAccess('/dashboard/customers', 'sales').authorized, 'Sales typing /dashboard/customers is ALLOWED');
assert(checkRouteAccess('/dashboard/quotations', 'sales').authorized, 'Sales typing /dashboard/quotations is ALLOWED');
assert(checkRouteAccess('/dashboard/orders', 'sales').authorized, 'Sales typing /dashboard/orders is ALLOWED');
assert(checkRouteAccess('/dashboard/payments', 'sales').authorized, 'Sales typing /dashboard/payments is ALLOWED');
assert(checkRouteAccess('/dashboard/receivables', 'sales').authorized, 'Sales typing /dashboard/receivables is ALLOWED');
assert(checkRouteAccess('/dashboard/reports', 'sales').authorized, 'Sales typing /dashboard/reports is ALLOWED');

// 2. Designer role direct URL access tests
assert(!checkRouteAccess('/dashboard/admin', 'designer').authorized, 'Designer typing /dashboard/admin is BLOCKED');
assert(!checkRouteAccess('/dashboard/manager', 'designer').authorized, 'Designer typing /dashboard/manager is BLOCKED');
assert(!checkRouteAccess('/dashboard/leads', 'designer').authorized, 'Designer typing /dashboard/leads is BLOCKED');
assert(!checkRouteAccess('/dashboard/customers', 'designer').authorized, 'Designer typing /dashboard/customers is BLOCKED');
assert(!checkRouteAccess('/dashboard/quotations', 'designer').authorized, 'Designer typing /dashboard/quotations is BLOCKED');
assert(!checkRouteAccess('/dashboard/orders', 'designer').authorized, 'Designer typing /dashboard/orders is BLOCKED');
assert(!checkRouteAccess('/dashboard/payments', 'designer').authorized, 'Designer typing /dashboard/payments is BLOCKED');
assert(!checkRouteAccess('/dashboard/receivables', 'designer').authorized, 'Designer typing /dashboard/receivables is BLOCKED');
assert(!checkRouteAccess('/dashboard/production', 'designer').authorized, 'Designer typing /dashboard/production is BLOCKED');
assert(!checkRouteAccess('/dashboard/communication/settings', 'designer').authorized, 'Designer typing /dashboard/communication/settings is BLOCKED');
assert(!checkRouteAccess('/dashboard/sales', 'designer').authorized, 'Designer typing /dashboard/sales is BLOCKED');
assert(checkRouteAccess('/dashboard/designer', 'designer').authorized, 'Designer typing /dashboard/designer is ALLOWED');
assert(checkRouteAccess('/dashboard/design', 'designer').authorized, 'Designer typing /dashboard/design is ALLOWED');
assert(checkRouteAccess('/dashboard/reports', 'designer').authorized, 'Designer typing /dashboard/reports is ALLOWED');

// 3. Manager role direct URL access tests
assert(!checkRouteAccess('/dashboard/admin', 'manager').authorized, 'Manager typing /dashboard/admin is BLOCKED');
assert(!checkRouteAccess('/dashboard/admin/users', 'manager').authorized, 'Manager typing /dashboard/admin/users is BLOCKED');
assert(checkRouteAccess('/dashboard/manager', 'manager').authorized, 'Manager typing /dashboard/manager is ALLOWED');
assert(checkRouteAccess('/dashboard/manager/approvals', 'manager').authorized, 'Manager typing /dashboard/manager/approvals is ALLOWED');
assert(checkRouteAccess('/dashboard/production', 'manager').authorized, 'Manager typing /dashboard/production is ALLOWED');
assert(checkRouteAccess('/dashboard/design', 'manager').authorized, 'Manager typing /dashboard/design is ALLOWED');
assert(checkRouteAccess('/dashboard/leads', 'manager').authorized, 'Manager typing /dashboard/leads is ALLOWED');
assert(checkRouteAccess('/dashboard/reports', 'manager').authorized, 'Manager typing /dashboard/reports is ALLOWED');

// 4. Admin role direct URL access tests
assert(checkRouteAccess('/dashboard/admin', 'admin').authorized, 'Admin typing /dashboard/admin is ALLOWED');
assert(checkRouteAccess('/dashboard/admin/users', 'admin').authorized, 'Admin typing /dashboard/admin/users is ALLOWED');
assert(checkRouteAccess('/dashboard/admin/roles', 'admin').authorized, 'Admin typing /dashboard/admin/roles is ALLOWED');
assert(checkRouteAccess('/dashboard/manager', 'admin').authorized, 'Admin typing /dashboard/manager is ALLOWED');
assert(checkRouteAccess('/dashboard/production', 'admin').authorized, 'Admin typing /dashboard/production is ALLOWED');
assert(checkRouteAccess('/dashboard/designer', 'admin').authorized, 'Admin typing /dashboard/designer is ALLOWED');
assert(checkRouteAccess('/dashboard/design', 'admin').authorized, 'Admin typing /dashboard/design is ALLOWED');
assert(checkRouteAccess('/dashboard/sales', 'admin').authorized, 'Admin typing /dashboard/sales is ALLOWED');
assert(checkRouteAccess('/dashboard/reports', 'admin').authorized, 'Admin typing /dashboard/reports is ALLOWED');

console.log('\nAll 45 Frontend RBAC direct URL access tests PASSED successfully!');
