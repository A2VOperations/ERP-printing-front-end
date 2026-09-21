'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/sidebar';
import Navbar from '@/app/components/navbar';
import { api } from '@/lib/api';
import {
  Users,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit,
  Key,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  Trash2,
  Check,
  X,
  AlertTriangle,
  ChevronDown,
  Mail,
  Phone,
  Building,
} from 'lucide-react';

const ALLOWED_ROLES = [
  { slug: 'admin', label: 'Admin (Super Admin)' },
  { slug: 'manager', label: 'Manager' },
  { slug: 'sales', label: 'Sales Representative' },
  { slug: 'designer', label: 'Graphic Designer' },
];

const PERMISSION_RESOURCES = [
  { id: 'LEADS', label: 'Leads & Inquiries' },
  { id: 'CUSTOMERS', label: 'Clients / Customers' },
  { id: 'FOLLOWUPS', label: 'Follow-ups' },
  { id: 'QUOTATIONS', label: 'Quotations & Pricing' },
  { id: 'ORDERS', label: 'Orders & Commercials' },
  { id: 'PAYMENTS', label: 'Payments & Ledgers' },
  { id: 'DESIGN_PROJECTS', label: 'Design Studio' },
  { id: 'PRODUCTION', label: 'Production' },
  { id: 'DELIVERIES', label: 'Deliveries' },
  { id: 'REPORTS', label: 'Reports & Analytics' },
  { id: 'DOCUMENTS', label: 'Artwork & Files' },
  { id: 'AREAS', label: 'Areas & Zones' },
  { id: 'USERS', label: 'User Accounts' },
  { id: 'SETTINGS', label: 'System Settings' },
];

const PERMISSION_ACTIONS = ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'ASSIGN', 'OVERRIDE'];

export default function UsersDirectoryPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [permissionsUser, setPermissionsUser] = useState(null);
  const [hasCustomPermissions, setHasCustomPermissions] = useState(false);
  const [customPolicies, setCustomPolicies] = useState([]);
  const [rolePolicies, setRolePolicies] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // Form States
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    roleSlug: 'sales',
    phone: '',
    areaIds: [],
  });

  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsersData = async () => {
    try {
      setLoading(true);
      const [uRes, aRes, rRes] = await Promise.allSettled([
        api.get('/users'),
        api.get('/areas'),
        api.get('/roles'),
      ]);

      if (uRes.status === 'rejected' && uRes.reason?.message?.includes('403')) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      if (uRes.status === 'fulfilled' && uRes.value?.data) {
        setUsers(uRes.value.data);
      }
      if (aRes.status === 'fulfilled' && aRes.value?.data) {
        setAreas(aRes.value.data);
      }
      if (rRes.status === 'fulfilled' && rRes.value?.data) {
        setRoles(rRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentRole = (localStorage.getItem('userRole') || '').toLowerCase();
    if (!currentRole.includes('admin') && currentRole !== 'ceo_admin') {
      setIsAuthorized(false);
    }
    fetchUsersData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      // Find matching role ID if available
      const matchingRole = roles.find(r => r.slug === newUser.roleSlug);
      await api.post('/users', {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.roleSlug,
        roleSlug: newUser.roleSlug,
        roleId: matchingRole?._id || undefined,
        phone: newUser.phone,
        areaIds: newUser.areaIds,
      });

      setShowCreateModal(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        roleSlug: 'sales',
        phone: '',
        areaIds: [],
      });
      fetchUsersData();
    } catch (err) {
      alert(err.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await api.patch(`/users/${selectedUser._id}`, {
        name: selectedUser.name,
        phone: selectedUser.phone,
        areaIds: selectedUser.areaIds,
      });

      // Role update if changed
      if (selectedUser.newRoleSlug && selectedUser.newRoleSlug !== selectedUser.roleSlug) {
        const matchingRole = roles.find((r) => r.slug === selectedUser.newRoleSlug);
        await api.patch(`/users/${selectedUser._id}/role`, {
          role: selectedUser.newRoleSlug.toLowerCase(),
          roleSlug: selectedUser.newRoleSlug.toLowerCase(),
          roleId: matchingRole?._id || undefined,
        });
      }

      // Password update if provided
      if (selectedUser.newPassword && selectedUser.newPassword.trim()) {
        if (selectedUser.newPassword.trim().length < 6) {
          alert('Password must be at least 6 characters long.');
          return;
        }
        await api.patch(`/users/${selectedUser._id}/password`, {
          password: selectedUser.newPassword.trim(),
        });
      }

      setShowEditModal(false);
      fetchUsersData();
    } catch (err) {
      alert(err.message || 'Failed to update user');
    }
  };

  const handlePasswordModalSubmit = async (e) => {
    e.preventDefault();
    if (!passwordUser || !newPasswordInput) return;
    if (newPasswordInput.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }
    try {
      setPasswordUpdating(true);
      await api.patch(`/users/${passwordUser._id}/password`, {
        password: newPasswordInput,
      });
      setShowPasswordModal(false);
      setPasswordUser(null);
      setNewPasswordInput('');
      alert(`Password for ${passwordUser.name} updated successfully.`);
    } catch (err) {
      alert(err.message || 'Failed to update user password');
    } finally {
      setPasswordUpdating(false);
    }
  };

  const handleOpenPermissionsModal = async (u) => {
    try {
      setPermissionsUser(u);
      setLoadingPermissions(true);
      setShowPermissionsModal(true);
      const res = await api.get(`/users/${u._id}/permissions`);
      if (res && res.data) {
        setHasCustomPermissions(Boolean(res.data.hasCustomPermissions));
        setCustomPolicies(res.data.customPermissions || []);
        setRolePolicies(res.data.rolePermissions || []);
      }
    } catch (err) {
      alert(err.message || 'Failed to load user permissions');
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleTogglePolicy = (resource, action) => {
    const exists = customPolicies.some(
      (p) => p.resource === resource && p.action === action
    );
    if (exists) {
      setCustomPolicies(
        customPolicies.filter((p) => !(p.resource === resource && p.action === action))
      );
    } else {
      setCustomPolicies([
        ...customPolicies,
        { resource, action, dataScope: 'OWN' },
      ]);
    }
  };

  const handleScopeChange = (resource, action, newScope) => {
    setCustomPolicies(
      customPolicies.map((p) =>
        p.resource === resource && p.action === action
          ? { ...p, dataScope: newScope }
          : p
      )
    );
  };

  const handleGrantAll = () => {
    const all = [];
    PERMISSION_RESOURCES.forEach((r) => {
      PERMISSION_ACTIONS.forEach((a) => {
        all.push({ resource: r.id, action: a, dataScope: 'ALL' });
      });
    });
    setCustomPolicies(all);
    setHasCustomPermissions(true);
  };

  const handleClearAll = () => {
    setCustomPolicies([]);
    setHasCustomPermissions(true);
  };

  const handleCopyRoleToCustom = () => {
    setCustomPolicies(JSON.parse(JSON.stringify(rolePolicies || [])));
    setHasCustomPermissions(true);
  };

  const handleSavePermissions = async (e) => {
    e.preventDefault();
    if (!permissionsUser) return;
    try {
      setSavingPermissions(true);
      await api.put(`/users/${permissionsUser._id}/permissions`, {
        hasCustomPermissions,
        permissions: hasCustomPermissions ? customPolicies : [],
      });
      setShowPermissionsModal(false);
      fetchUsersData();
      alert(`Permissions for ${permissionsUser.name} updated successfully.`);
    } catch (err) {
      alert(err.message || 'Failed to save permissions');
    } finally {
      setSavingPermissions(false);
    }
  };

  const executeStatusToggle = async (user) => {
    const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/users/${user._id}/status`, {
        status: nextStatus,
        reason: 'Administrative user status modification',
      });
      setShowConfirmModal(false);
      fetchUsersData();
    } catch (err) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const handlePromptStatusToggle = (user) => {
    setConfirmAction({
      title: user.status === 'ACTIVE' ? 'Deactivate User Account' : 'Activate User Account',
      description: user.status === 'ACTIVE'
        ? `Are you sure you want to deactivate ${user.name} (${user.email})? They will no longer be able to log in.`
        : `Are you sure you want to reactivate ${user.name} (${user.email})?`,
      confirmLabel: user.status === 'ACTIVE' ? 'Deactivate' : 'Activate',
      confirmColor: user.status === 'ACTIVE' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700',
      onConfirm: () => executeStatusToggle(user),
    });
    setShowConfirmModal(true);
  };

  const executeDeleteUser = async (user) => {
    try {
      await api.delete(`/users/${user._id}`);
      setShowConfirmModal(false);
      fetchUsersData();
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const handlePromptDeleteUser = (user) => {
    setConfirmAction({
      title: 'Delete User Account',
      description: `Are you sure you want to permanently deactivate and delete user ${user.name} (${user.email})?`,
      confirmLabel: 'Delete Permanently',
      confirmColor: 'bg-rose-600 hover:bg-rose-700',
      onConfirm: () => executeDeleteUser(user),
    });
    setShowConfirmModal(true);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || (u.roleSlug || u.role) === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (!isAuthorized) {
    return (
      <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <div className="p-8 max-w-2xl mx-auto w-full text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900">403 — Access Denied</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Users administration is restricted to System Administrators.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                Users Directory & Access Management
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Create and manage team members across the 4 authorized roles: Admin, Manager, Sales, Designer
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchUsersData}
                disabled={loading}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-600/25 transition-all"
              >
                <Plus className="w-4 h-4" />
                Create New User
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 md:max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search user by name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-white border border-slate-200 text-xs font-semibold px-3 py-2 rounded-xl text-slate-700 shadow-xs"
              >
                <option value="ALL">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="sales">Sales</option>
                <option value="designer">Designer</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 text-xs font-semibold px-3 py-2 rounded-xl text-slate-700 shadow-xs"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <th className="pb-3">User / Name</th>
                    <th className="pb-3">Email Address</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Last Updated</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => {
                      const roleSlug = (u.roleSlug || u.role || 'sales').toLowerCase();
                      const isActive = u.status === 'ACTIVE';

                      return (
                        <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center">
                                {(u.name || 'US').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block">{u.name}</span>
                                <span className="text-[10px] text-slate-400">{u.phone || 'No phone'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 text-slate-600">{u.email}</td>
                          <td className="py-3.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                roleSlug === 'admin'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : roleSlug === 'manager'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : roleSlug === 'designer'
                                  ? 'bg-pink-50 text-pink-700 border-pink-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                                {roleSlug.toUpperCase()}
                              </span>
                              {u.hasCustomPermissions && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200" title="Custom Permissions Configured">
                                  Custom
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {u.status || 'ACTIVE'}
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-400">
                            {u.updatedAt || u.createdAt ? new Date(u.updatedAt || u.createdAt).toLocaleDateString() : '-'}
                          </td>
                          <td className="py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedUser({
                                    ...u,
                                    areaIds: (u.areaIds || []).map((a) => (typeof a === 'object' ? a._id : a)),
                                    newRoleSlug: u.roleSlug || u.role || 'sales',
                                    newPassword: '',
                                  });
                                  setShowEditModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors"
                                title="Edit User"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  setPasswordUser(u);
                                  setNewPasswordInput('');
                                  setShowPasswordModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 transition-colors"
                                title="Change Password"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleOpenPermissionsModal(u)}
                                className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors"
                                title="Manage Permissions"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handlePromptStatusToggle(u)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isActive
                                    ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                }`}
                                title={isActive ? 'Deactivate User' : 'Activate User'}
                              >
                                {isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                              </button>

                              <button
                                onClick={() => handlePromptDeleteUser(u)}
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                                title="Delete User"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        No users matching filter criteria. Click &quot;Create New User&quot; to add a team member.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create New Team User</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanya Sharma"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="user@company.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">System Role *</label>
                  <select
                    value={newUser.roleSlug}
                    onChange={(e) => setNewUser({ ...newUser, roleSlug: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    {ALLOWED_ROLES.map((r) => (
                      <option key={r.slug} value={r.slug}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Assigned Territory / Area</label>
                <select
                  value={newUser.areaIds?.[0] || ''}
                  onChange={(e) => setNewUser({ ...newUser, areaIds: e.target.value ? [e.target.value] : [] })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- No Territory (Unassigned) --</option>
                  {areas.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name} ({a.city || 'Delhi'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Edit User Profile & Role</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Full Name</label>
                <input
                  type="text"
                  value={selectedUser.name}
                  onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={selectedUser.phone || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Assigned Role</label>
                <select
                  value={selectedUser.newRoleSlug}
                  onChange={(e) => setSelectedUser({ ...selectedUser, newRoleSlug: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                >
                  {ALLOWED_ROLES.map((r) => (
                    <option key={r.slug} value={r.slug}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Assigned Territory / Area</label>
                <select
                  value={
                    Array.isArray(selectedUser.areaIds) && selectedUser.areaIds.length > 0
                      ? typeof selectedUser.areaIds[0] === 'object'
                        ? selectedUser.areaIds[0]._id
                        : selectedUser.areaIds[0]
                      : ''
                  }
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, areaIds: e.target.value ? [e.target.value] : [] })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- No Territory (Unassigned) --</option>
                  {areas.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name} ({a.city || 'Delhi'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="text-slate-700 font-semibold block mb-1">
                  Change Password <span className="text-slate-400 font-normal text-[11px]">(Optional - min 6 chars)</span>
                </label>
                <input
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={selectedUser.newPassword || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, newPassword: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && passwordUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Change User Password</h3>
                  <p className="text-[11px] text-slate-400">{passwordUser.name}</p>
                </div>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handlePasswordModalSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Enter new password (min 6 characters)"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordUpdating}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-md shadow-amber-600/20 disabled:opacity-50"
                >
                  {passwordUpdating ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for High-Risk Actions */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl animate-scale-up text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{confirmAction.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{confirmAction.description}</p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAction.onConfirm}
                className={`px-5 py-2 rounded-xl text-white font-bold text-xs shadow-md ${confirmAction.confirmColor}`}
              >
                {confirmAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Management Modal */}
      {showPermissionsModal && permissionsUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Manage Permissions for {permissionsUser.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {permissionsUser.email} · Assigned Role: <span className="font-bold text-slate-700 capitalize">{permissionsUser.roleSlug || permissionsUser.role}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {loadingPermissions ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                  <p className="font-medium">Loading user permissions...</p>
                </div>
              ) : (
                <>
                  {/* Mode Selector */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-slate-900 block text-sm">
                        Permission Policy Mode
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Choose whether this user inherits permissions from their assigned role or uses customized individual permissions.
                      </span>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0">
                      <button
                        type="button"
                        onClick={() => setHasCustomPermissions(false)}
                        className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all ${
                          !hasCustomPermissions
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Role Defaults
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setHasCustomPermissions(true);
                          if (customPolicies.length === 0 && rolePolicies.length > 0) {
                            setCustomPolicies(JSON.parse(JSON.stringify(rolePolicies)));
                          }
                        }}
                        className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all ${
                          hasCustomPermissions
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Custom Override
                      </button>
                    </div>
                  </div>

                  {/* Notice when Role Defaults active */}
                  {!hasCustomPermissions ? (
                    <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-blue-900 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <Check className="w-4 h-4 text-blue-600" />
                        <span>Currently Inheriting Role Permissions ({permissionsUser.roleSlug || permissionsUser.role})</span>
                      </div>
                      <p className="text-[11px] text-blue-700 leading-relaxed">
                        This user automatically receives all permission updates made to the &quot;{permissionsUser.roleSlug || permissionsUser.role}&quot; role.
                        Click &quot;Custom Override&quot; above if you want to grant or restrict specific modules for this single user.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Toolbar */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-1">
                        <span className="font-bold text-slate-700 text-xs">
                          Granular Resource Permissions Matrix:
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCopyRoleToCustom}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px]"
                            title="Reset matrix to match role defaults"
                          >
                            Copy from Role
                          </button>
                          <button
                            type="button"
                            onClick={handleGrantAll}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px]"
                          >
                            Grant All
                          </button>
                          <button
                            type="button"
                            onClick={handleClearAll}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px]"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      {/* Permissions Matrix Table */}
                      <div className="border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto max-h-[48vh]">
                          <table className="w-full text-left border-collapse text-[11px]">
                            <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200 z-10">
                              <tr>
                                <th className="p-2.5 pl-4">Module / Resource</th>
                                {PERMISSION_ACTIONS.map((action) => (
                                  <th key={action} className="p-2.5 text-center">{action}</th>
                                ))}
                                <th className="p-2.5 pr-4 text-center">Data Scope</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              {PERMISSION_RESOURCES.map((res) => {
                                const resourcePolicies = customPolicies.filter((p) => p.resource === res.id);
                                const currentScope = resourcePolicies[0]?.dataScope || 'OWN';

                                return (
                                  <tr key={res.id} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="p-2.5 pl-4 font-bold text-slate-800">
                                      {res.label}
                                      <span className="block text-[9px] font-mono text-slate-400">{res.id}</span>
                                    </td>

                                    {PERMISSION_ACTIONS.map((action) => {
                                      const isChecked = customPolicies.some(
                                        (p) => p.resource === res.id && p.action === action
                                      );

                                      return (
                                        <td key={action} className="p-2.5 text-center">
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => handleTogglePolicy(res.id, action)}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                          />
                                        </td>
                                      );
                                    })}

                                    <td className="p-2.5 pr-4 text-center">
                                      <select
                                        value={currentScope}
                                        disabled={resourcePolicies.length === 0}
                                        onChange={(e) => {
                                          const newScope = e.target.value;
                                          resourcePolicies.forEach((p) => {
                                            handleScopeChange(p.resource, p.action, newScope);
                                          });
                                        }}
                                        className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-700 focus:outline-none focus:border-indigo-500 disabled:opacity-40"
                                      >
                                        <option value="ALL">ALL</option>
                                        <option value="TEAM">TEAM</option>
                                        <option value="AREA">AREA</option>
                                        <option value="OWN">OWN</option>
                                      </select>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50 rounded-b-3xl">
              <span className="text-[11px] text-slate-400">
                {hasCustomPermissions
                  ? `${customPolicies.length} active custom permission rules`
                  : 'Inheriting role standard policies'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPermissionsModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  disabled={savingPermissions || loadingPermissions}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {savingPermissions ? 'Saving...' : 'Save Permissions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
