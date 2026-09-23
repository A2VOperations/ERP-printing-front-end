import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../lib/apiConfig";

export default function UserManagement({ user: currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Track inline updating states per user ID: { [userId]: 'idle' | 'updating' | 'success' | 'error' }
  const [updateStates, setUpdateStates] = useState({});

  // Add User Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("employee");
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  useEffect(() => {
    fetchUsers(true);
    // Poll every 10 seconds for real-time online/offline status updates
    const interval = setInterval(() => {
      fetchUsers(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [currentUser?.id, currentUser?._id, currentUser?.email]);

  const fetchUsers = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser?.email || currentUser?.id,
        },
      });
      const res = await response.json();
      if (response.ok && res.success) {
        setUsers(res.users);
      } else {
        if (showLoading) setError(res.error || "Failed to fetch users.");
      }
    } catch (err) {
      console.error(err);
      if (showLoading)
        setError("Could not connect to the backend server to retrieve users.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Helper to determine if a target user row matches the currently logged in admin user
  const checkIsSelf = (targetUser) => {
    if (!currentUser || !targetUser) return false;
    if (
      currentUser.email &&
      targetUser.email &&
      currentUser.email.toLowerCase() === targetUser.email.toLowerCase()
    )
      return true;
    if (
      currentUser.id &&
      (targetUser._id === currentUser.id || targetUser.id === currentUser.id)
    )
      return true;
    return false;
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!newUserName || !newUserEmail || !newUserPassword) {
      setError("Name, email, and password are required fields.");
      return;
    }

    if (newUserPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsCreatingUser(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser?.email || currentUser?.id,
        },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      const res = await response.json();
      if (response.ok && res.success) {
        setSuccessMsg(
          `User ${res.user.name} created successfully with role ${res.user.role}!`,
        );
        setUsers((prev) => [res.user, ...prev]);
        setIsAddUserModalOpen(false);
        // Reset form
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserRole("employee");
      } else {
        setError(res.error || "Failed to create user.");
      }
    } catch (err) {
      console.error(err);
      setError("Could not connect to the server to create user.");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    const targetUser = users.find((u) => u._id === userId);
    // Prevent updating current user role to avoid locking oneself out
    if (checkIsSelf(targetUser)) {
      setError(
        "You cannot change your own role to prevent administrator lockout.",
      );
      return;
    }

    // Set updating state for this user
    setUpdateStates((prev) => ({ ...prev, [userId]: "updating" }));
    setError("");
    setSuccessMsg("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser?.email || currentUser?.id,
        },
        body: JSON.stringify({ role: newRole }),
      });

      const res = await response.json();
      if (response.ok && res.success) {
        // Update user local state list
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u)),
        );
        // Show success status
        setUpdateStates((prev) => ({ ...prev, [userId]: "success" }));
        setSuccessMsg(
          `Successfully updated role of ${res.user.name} to ${newRole}.`,
        );

        // Reset success state after a few seconds
        setTimeout(() => {
          setUpdateStates((prev) => ({ ...prev, [userId]: "idle" }));
        }, 3000);
      } else {
        setUpdateStates((prev) => ({ ...prev, [userId]: "error" }));
        setError(res.error || "Failed to update user role.");
      }
    } catch (err) {
      console.error(err);
      setUpdateStates((prev) => ({ ...prev, [userId]: "error" }));
      setError("Could not connect to the backend server to update user role.");
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    const targetUser = users.find((u) => u._id === userId);
    if (checkIsSelf(targetUser)) {
      setError("You cannot delete your own account.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete user account for "${userName}"?`,
      )
    ) {
      return;
    }

    setError("");
    setSuccessMsg("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser?.email || currentUser?.id,
        },
      });

      const res = await response.json();
      if (response.ok && res.success) {
        setUsers((prev) => prev.filter((u) => u._id !== userId));
        setSuccessMsg(`User ${userName} deleted successfully.`);
      } else {
        setError(res.error || "Failed to delete user.");
      }
    } catch (err) {
      console.error(err);
      setError("Could not connect to the backend server to delete user.");
    }
  };

  // Filter users based on search query and role filter
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Helper to choose initials avatar background color
  const getAvatarBg = (name = "User") => {
    const colors = [
      "bg-blue-100 text-blue-600 border-blue-200/50",
      "bg-emerald-100 text-emerald-600 border-emerald-200/50",
      "bg-indigo-100 text-indigo-600 border-indigo-200/50",
      "bg-purple-100 text-purple-600 border-purple-200/50",
      "bg-pink-100 text-pink-600 border-pink-200/50",
      "bg-blue-100 text-blue-600 border-blue-200/50",
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 p-5 rounded-md shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            User Authorization & Management
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Admin console to create user credentials, assign roles, and manage
            system access
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={fetchUsers}
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17"
              />
            </svg>
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsAddUserModalOpen(true)}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Create New User</span>
          </button>
        </div>
      </div>

      {/* Dynamic Alerts */}
      <div className="w-full flex flex-col gap-3">
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs font-semibold text-rose-700 flex items-center gap-2 shadow-sm animate-fade-in">
            <svg
              className="w-4 h-4 text-rose-500 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs font-semibold text-emerald-700 flex items-center gap-2 shadow-sm animate-fade-in">
            <svg
              className="w-4 h-4 text-emerald-500 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {successMsg}
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-md shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search Bar */}
        <div className="relative w-full sm:max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/10 outline-none transition-all"
          />
        </div>

        {/* Role Filter Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
            Filter Role:
          </label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all cursor-pointer min-w-35"
          >
            <option value="all">All Roles</option>
            <option value="employee">Employee (Default)</option>
            <option value="designer">Graphic Designer</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="bg-white border border-slate-200/80 rounded-md shadow-sm overflow-hidden min-h-50 flex flex-col justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <svg
              className="animate-spin h-7 w-7 text-sky-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Loading Users Database...
            </span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <svg
              className="w-10 h-10 text-slate-300 mb-2.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h4 className="font-bold text-slate-800 text-xs">No users found</h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">
              {searchTerm || roleFilter !== "all"
                ? "Try adjusting your search filters."
                : "No users exist in the database."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4 border-r border-slate-100/60">
                    User Identity
                  </th>
                  <th className="p-4 border-r border-slate-100/60 text-center">
                    Presence Status
                  </th>
                  <th className="p-4 border-r border-slate-100/60">
                    Created Date
                  </th>
                  <th className="p-4 border-r border-slate-100/60 text-center">
                    Auth Status Badge
                  </th>
                  <th className="p-4 border-r border-slate-100/60 text-center">
                    Modify Authorization Role
                  </th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((userObj) => {
                  const isSelf = checkIsSelf(userObj);
                  const currentRole = userObj.role;
                  const rowState = updateStates[userObj._id] || "idle";
                  const avatarClass = getAvatarBg(userObj.name || "User");
                  const isOnline = Boolean(userObj.isOnline);

                  return (
                    <tr
                      key={userObj._id}
                      className="border-b border-slate-100/60 last:border-0 hover:bg-slate-50/50 font-semibold text-xs text-slate-600 transition-colors"
                    >
                      {/* Column 1: Identity */}
                      <td className="p-4 border-r border-slate-100/60">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <div
                              className={`w-8.5 h-8.5 rounded-full border flex items-center justify-center font-extrabold text-xs uppercase shadow-xs ${avatarClass}`}
                            >
                              {(userObj.name || "U").substring(0, 2)}
                            </div>
                            <span
                              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                isOnline ? "bg-emerald-500" : "bg-slate-400"
                              }`}
                              title={isOnline ? "Online" : "Offline"}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                              {userObj.name}
                              {isSelf && (
                                <span className="bg-sky-100 text-sky-700 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  You
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {userObj.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Presence Status */}
                      <td className="p-4 border-r border-slate-100/60 text-center select-none">
                        {isOnline ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide uppercase bg-slate-100 text-slate-500 border border-slate-200/80">
                            <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                            Offline
                          </span>
                        )}
                      </td>

                      {/* Column 2: Date */}
                      <td className="p-4 border-r border-slate-100/60 text-slate-500 font-mono text-[11px]">
                        {userObj.createdAt
                          ? new Date(userObj.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )
                          : "System Seed Account"}
                      </td>

                      {/* Column 3: Current Badge */}
                      <td className="p-4 border-r border-slate-100/60 text-center select-none">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide uppercase ${
                            currentRole === "admin"
                              ? "bg-sky-50 text-sky-600 border border-sky-100"
                              : currentRole === "manager"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                : currentRole === "designer"
                                  ? "bg-pink-50 text-pink-600 border border-pink-100"
                                  : "bg-purple-50 text-purple-600 border border-purple-100"
                          }`}
                        >
                          {currentRole === "designer"
                            ? "Graphic Designer"
                            : currentRole || "employee"}
                        </span>
                      </td>

                      {/* Column 4: Dropdown selector */}
                      <td className="p-4 border-r border-slate-100/60">
                        <div className="flex items-center justify-center gap-2">
                          <select
                            value={currentRole}
                            disabled={isSelf || rowState === "updating"}
                            onChange={(e) =>
                              handleRoleChange(userObj._id, e.target.value)
                            }
                            className={`h-9 px-2.5 border rounded-xl text-xs font-semibold outline-none transition-all min-w-32.5 ${
                              isSelf
                                ? "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 focus:border-sky-500 cursor-pointer"
                            }`}
                          >
                            <option value="employee">Employee (Default)</option>
                            <option value="designer">Graphic Designer</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>

                          {/* Saving Status Spinner/Checkmark */}
                          <div className="w-5 h-5 flex items-center justify-center shrink-0">
                            {rowState === "updating" && (
                              <svg
                                className="animate-spin h-3.5 w-3.5 text-sky-500"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                            )}
                            {rowState === "success" && (
                              <svg
                                className="w-4.5 h-4.5 text-emerald-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                            {rowState === "error" && (
                              <svg
                                className="w-4.5 h-4.5 text-rose-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 5: Delete Action */}
                      <td className="p-4 text-center">
                        <button
                          disabled={isSelf}
                          onClick={() =>
                            handleDeleteUser(userObj._id, userObj.name)
                          }
                          className={`p-1.5 rounded-lg border transition-all ${
                            isSelf
                              ? "opacity-30 border-slate-200 text-slate-400 cursor-not-allowed"
                              : "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white cursor-pointer shadow-2xs"
                          }`}
                          title={
                            isSelf
                              ? "You cannot delete your own account"
                              : "Delete User"
                          }
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Create User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-9999 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-md shadow-2xl border border-slate-200/80 w-full max-w-md overflow-hidden animate-slide-up">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4.5 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-sky-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                  <span>Create User Credentials</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Generate User ID, password, and assign corporate authorization
                  role
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer transition-colors p-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form
              onSubmit={handleCreateUserSubmit}
              className="p-6 flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                  User ID / Email Address{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="rahul@company.com"
                  className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                  Assigned User Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white cursor-pointer"
                >
                  <option value="employee">Employee (Default)</option>
                  <option value="designer">Graphic Designer</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isCreatingUser ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
