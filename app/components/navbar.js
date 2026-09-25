"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import AlertCenterDrawer from "./alertCenterDrawer";
import {
  Home,
  Menu,
  Search,
  PhoneCall,
  MessageSquare,
  Bell,
  Mail,
  Calendar,
  X,
  Users,
  Building2,
  ArrowRight,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Shield,
  Layers,
  BarChart3,
  FileText,
  ShoppingBag,
  CreditCard,
  Palette,
  Folder,
  CheckSquare,
  TrendingUp,
  Camera,
  Trash2,
  Loader2,
} from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  // Dynamic user & tenant state
  const [user, setUser] = useState({
    name: "User",
    email: "",
    role: "admin",
    roleDisplay: "Super Admin",
    initials: "US",
    avatarUrl: null,
  });

  const [tenant, setTenant] = useState({
    name: "A2V Printing Solutions",
    code: "",
  });

  // Avatar upload & management state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const avatarFileInputRef = useRef(null);

  // Modals & Dropdowns State
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAlertCenter, setShowAlertCenter] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Dynamic Notifications & Messages State
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [threads, setThreads] = useState([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // Refs for click-outside detection
  const userDropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const messagesRef = useRef(null);

  // 1. Initial Local State & Server-Verified Identity Sync
  useEffect(() => {
    // Read cached values immediately to eliminate flash of fallback
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("userName");
      const storedRole = (
        localStorage.getItem("userRole") || "admin"
      ).toLowerCase();
      const storedTenant = localStorage.getItem("tenantName");
      const storedEmail = localStorage.getItem("userEmail");
      const storedAvatar = localStorage.getItem("userAvatar");

      let roleDisplay = "Super Admin";
      if (storedRole === "admin") roleDisplay = "Super Admin";
      else if (storedRole === "manager") roleDisplay = "Sales Manager";
      else if (storedRole === "sales") roleDisplay = "Sales Executive";
      else if (storedRole === "designer") roleDisplay = "Graphic Designer";
      else roleDisplay = storedRole.toUpperCase();

      const initialName = storedName || "User";
      setUser({
        name: initialName,
        email: storedEmail || "",
        role: storedRole,
        roleDisplay,
        initials: initialName.slice(0, 2).toUpperCase(),
        avatarUrl: storedAvatar || null,
      });

      if (storedTenant) {
        setTenant((prev) => ({ ...prev, name: storedTenant }));
      }
    }

    // Check Supabase session metadata for avatar if available
    if (supabase?.auth) {
      supabase.auth.getSession().then(({ data }) => {
        const sbAvatar = data?.session?.user?.user_metadata?.avatar_url;
        if (sbAvatar) {
          setUser((prev) => ({ ...prev, avatarUrl: prev.avatarUrl || sbAvatar }));
          if (typeof window !== "undefined" && !localStorage.getItem("userAvatar")) {
            localStorage.setItem("userAvatar", sbAvatar);
          }
        }
      }).catch(() => {});
    }

    // Authoritative Server-Verified Check via /auth/me
    api
      .get("/auth/me", { silent: true })
      .then((res) => {
        if (res?.data) {
          const u = res.data.user || res.data;
          const t = res.data.tenant;

          const fullName =
            u.name ||
            `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
            u.email?.split("@")[0] ||
            "User";

          const rawRole = (
            u.roleSlug ||
            (typeof u.role === "string" ? u.role : u.role?.name) ||
            "admin"
          ).toLowerCase();
          let roleTitle = "Super Admin";
          if (rawRole === "admin") roleTitle = "Super Admin";
          else if (rawRole === "manager") roleTitle = "Sales Manager";
          else if (rawRole === "sales") roleTitle = "Sales Executive";
          else if (rawRole === "designer") roleTitle = "Graphic Designer";
          else roleTitle = rawRole.toUpperCase();

          const currentCachedAvatar = typeof window !== "undefined" ? localStorage.getItem("userAvatar") : null;
          const effectiveAvatar = u.avatarUrl || u.profileImage || currentCachedAvatar || null;

          setUser({
            id: u._id || u.id || "",
            name: fullName,
            email: u.email || "",
            role: rawRole,
            roleDisplay: roleTitle,
            initials: fullName.slice(0, 2).toUpperCase(),
            avatarUrl: effectiveAvatar,
          });

          if (effectiveAvatar) {
            try {
              const directory = JSON.parse(localStorage.getItem("crm_user_avatars") || "{}");
              if (u.email) directory[u.email.toLowerCase().trim()] = effectiveAvatar;
              if (fullName) directory[fullName.toLowerCase().trim()] = effectiveAvatar;
              if (u._id || u.id) directory[(u._id || u.id).toString()] = effectiveAvatar;
              localStorage.setItem("crm_user_avatars", JSON.stringify(directory));
            } catch {}
          }

          if (t?.name) {
            setTenant({
              name: t.name,
              code: t.code || "",
            });
            localStorage.setItem("tenantName", t.name);
          }

          localStorage.setItem("userName", fullName);
          localStorage.setItem("userRole", rawRole);
          if (u.email) localStorage.setItem("userEmail", u.email);
          if (effectiveAvatar) {
            localStorage.setItem("userAvatar", effectiveAvatar);
          }
        }
      })
      .catch(() => {
        // Handled gracefully via localStorage cache
      });

    // Fetch operational alerts summary for real-time unread badge
    api
      .get("/alerts/summary")
      .then((res) => {
        if (res?.data?.unreadAlerts !== undefined) {
          setUnreadNotificationCount(res.data.unreadAlerts);
        }
      })
      .catch(() => {
        // Fallback or ignore if unauthorized
      });

    // Fetch dynamic communication message threads
    api
      .get("/communications/threads?limit=5", { silent: true })
      .then((res) => {
        const list = res?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          setThreads(list);
          const unread = list.filter((t) => t.unreadCount > 0).length;
          setUnreadMessageCount(unread || list.length);
        }
      })
      .catch(() => {
        // Fail gracefully
      });

    // Global Keyboard Shortcuts (Ctrl+K / Cmd+K and Escape)
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
      if (e.key === "Escape") {
        setShowSearchModal(false);
        setShowUserDropdown(false);
        setShowNotifications(false);
        setShowMessages(false);
        setShowMobileMenu(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 2. Click Outside Listeners for Dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(e.target)
      ) {
        setShowUserDropdown(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target)
      ) {
        setShowNotifications(false);
      }
      if (messagesRef.current && !messagesRef.current.contains(e.target)) {
        setShowMessages(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false);
  }, [pathname]);

  // 3. Live Search Debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await api.get(
          `/search?q=${encodeURIComponent(searchQuery)}`,
        );
        if (res?.data) {
          setSearchResults(res.data);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Listen for real-time avatar changes across the application
  useEffect(() => {
    const handleAvatarSync = (e) => {
      const newUrl = e.detail?.avatarUrl !== undefined ? e.detail.avatarUrl : null;
      setUser((prev) => ({ ...prev, avatarUrl: newUrl }));
    };
    window.addEventListener("crm:avatar-updated", handleAvatarSync);
    return () => window.removeEventListener("crm:avatar-updated", handleAvatarSync);
  }, []);

  // Client-side image compression to smooth 256x256 Web JPEG (~20KB)
  const compressImage = (file, maxDim = 256) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = () => reject(new Error("Unable to process image."));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("Unable to read image file."));
      reader.readAsDataURL(file);
    });
  };

  // Upload or change profile picture handler
  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so selecting the same file again triggers change
    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select a valid image file (PNG, JPG, WEBP, GIF).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setAvatarError("Image file must be under 15MB.");
      return;
    }

    setAvatarError("");
    setIsUploadingAvatar(true);

    try {
      // 1. Compress image to clean, high-performance web data URL
      const optimizedDataUrl = await compressImage(file);

      // 2. Immediate instant display & persistence to localStorage
      setUser((prev) => ({ ...prev, avatarUrl: optimizedDataUrl }));
      localStorage.setItem("userAvatar", optimizedDataUrl);
      try {
        const directory = JSON.parse(localStorage.getItem("crm_user_avatars") || "{}");
        if (user.email) directory[user.email.toLowerCase().trim()] = optimizedDataUrl;
        if (user.name) directory[user.name.toLowerCase().trim()] = optimizedDataUrl;
        if (user.id || user._id) directory[(user.id || user._id).toString()] = optimizedDataUrl;
        localStorage.setItem("crm_user_avatars", JSON.stringify(directory));
      } catch {}
      window.dispatchEvent(
        new CustomEvent("crm:avatar-updated", { detail: { avatarUrl: optimizedDataUrl, user } })
      );

      // 3. Sync to Supabase user metadata if authenticated
      if (supabase?.auth) {
        supabase.auth.updateUser({
          data: { avatar_url: optimizedDataUrl },
        }).catch(() => {});
      }

      // 4. Send to backend /auth/avatar (if backend is running locally or once deployed on Render)
      try {
        const formData = new FormData();
        formData.append("avatar", file);
        const res = await api.post("/auth/avatar", formData, { silent: true });
        if (res?.data?.avatarUrl || res?.avatarUrl) {
          const finalUrl = res?.data?.avatarUrl || res?.avatarUrl;
          setUser((prev) => ({ ...prev, avatarUrl: finalUrl }));
          localStorage.setItem("userAvatar", finalUrl);
        }
      } catch {
        // Backend not yet redeployed with /avatar endpoint; preserved safely in localStorage & Supabase
      }
    } catch (err) {
      console.error("Avatar upload failed:", err);
      const fallback = localStorage.getItem("userAvatar") || null;
      setUser((prev) => ({ ...prev, avatarUrl: fallback }));
      setAvatarError(err.message || "Failed to process photo. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Delete profile picture handler
  const handleDeleteAvatar = async () => {
    setAvatarError("");
    setIsUploadingAvatar(true);

    try {
      // 1. Immediately remove from local state and storage
      setUser((prev) => ({ ...prev, avatarUrl: null }));
      localStorage.removeItem("userAvatar");
      window.dispatchEvent(
        new CustomEvent("crm:avatar-updated", { detail: { avatarUrl: null } })
      );

      // 2. Clear from Supabase user metadata
      if (supabase?.auth) {
        supabase.auth.updateUser({
          data: { avatar_url: null },
        }).catch(() => {});
      }

      // 3. Notify backend API
      try {
        await api.delete("/auth/avatar", { silent: true });
      } catch {
        // Suppress if backend endpoint is not yet redeployed
      }
    } catch (err) {
      console.error("Avatar delete failed:", err);
      setAvatarError(err.message || "Failed to remove photo.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Sign out handler
  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userName");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userAvatar");
      localStorage.removeItem("tenantId");
      localStorage.removeItem("tenantName");
    }
    router.push("/");
  };

  // Role pill color styling
  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "manager":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "sales":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "designer":
        return "bg-pink-100 text-pink-700 border-pink-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // Role avatar badge styling
  const getAvatarBg = (role) => {
    switch (role) {
      case "admin":
        return "bg-purple-600";
      case "manager":
        return "bg-blue-600";
      case "sales":
        return "bg-emerald-600";
      case "designer":
        return "bg-pink-600";
      default:
        return "bg-teal-600";
    }
  };

  // Mobile menu items based on role
  const getMobileNavItems = () => {
    const role = user.role.toLowerCase();
    const common = [
      { name: "Dashboard", href: "/dashboard", icon: Layers },
      {
        name: "Reports & Analytics",
        href: "/dashboard/reports",
        icon: BarChart3,
      },
    ];

    if (role === "admin") {
      return [
        ...common,
        { name: "Admin Console", href: "/dashboard/admin", icon: Shield },
        {
          name: "User Management",
          href: "/dashboard/admin/users",
          icon: Users,
        },
        {
          name: "Leads & Pipeline",
          href: "/dashboard/leads",
          icon: TrendingUp,
        },
        { name: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
        { name: "Quotations", href: "/dashboard/quotations", icon: FileText },
        { name: "Production", href: "/dashboard/production", icon: Layers },
        { name: "Design Projects", href: "/dashboard/design", icon: Palette },
        {
          name: "Communications",
          href: "/dashboard/communication",
          icon: MessageSquare,
        },
        {
          name: "System Settings",
          href: "/dashboard/admin/settings/company",
          icon: Settings,
        },
      ];
    }

    if (role === "manager") {
      return [
        ...common,
        { name: "Manager Overview", href: "/dashboard/manager", icon: Shield },
        {
          name: "Team Performance",
          href: "/dashboard/manager/team",
          icon: Users,
        },
        {
          name: "Discount Approvals",
          href: "/dashboard/manager/approvals",
          icon: CheckSquare,
        },
        {
          name: "Leads Management",
          href: "/dashboard/leads",
          icon: TrendingUp,
        },
        { name: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
        { name: "Quotations", href: "/dashboard/quotations", icon: FileText },
        {
          name: "Production Oversight",
          href: "/dashboard/production",
          icon: Layers,
        },
        {
          name: "Follow-ups & Calls",
          href: "/dashboard/followups",
          icon: PhoneCall,
        },
        {
          name: "Communications",
          href: "/dashboard/communication",
          icon: MessageSquare,
        },
      ];
    }

    if (role === "designer") {
      return [
        { name: "Home", href: "/dashboard/designer", icon: Home },
        {
          name: "Reports & Analytics",
          href: "/dashboard/reports",
          icon: BarChart3,
        },
        { name: "My Design Projects", href: "/dashboard/design", icon: Folder },
        {
          name: "Communications",
          href: "/dashboard/communication",
          icon: MessageSquare,
        },
      ];
    }

    // Default SALES
    return [
      ...common,
      { name: "Sales Pipeline", href: "/dashboard/leads", icon: TrendingUp },
      {
        name: "Follow-ups & Calls",
        href: "/dashboard/followups",
        icon: PhoneCall,
      },
      { name: "Quotations", href: "/dashboard/quotations", icon: FileText },
      { name: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
      {
        name: "Payments & Receivables",
        href: "/dashboard/receivables",
        icon: CreditCard,
      },
      {
        name: "Communications",
        href: "/dashboard/communication",
        icon: MessageSquare,
      },
    ];
  };

  return (
    <>
      <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs transition-all">
        {/* Left: Menu Toggle, Tenant Context & Interactive Search Bar */}
        <div className="flex items-center gap-3 md:gap-4 flex-1 max-w-2xl">
          <button
            onClick={() => {
              setShowMobileMenu((prev) => !prev);
              window.dispatchEvent(new CustomEvent("toggle-sidebar"));
            }}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            title="Toggle Navigation Menu"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Quick Search Launch Bar */}
          <div
            onClick={() => setShowSearchModal(true)}
            className="relative flex-1 cursor-pointer group"
          >
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-600 transition-colors" />
            <div className="w-full pl-10 pr-12 py-2 rounded-sm bg-slate-50 border border-slate-200 text-md text-slate-400 group-hover:border-slate-300 group-hover:bg-slate-100/70 select-none shadow-2xs transition-all flex items-center">
              Search customers, leads, quotes, orders...
            </div>
          </div>
        </div>

        {/* Right: Dynamic Channels, Interactive Notifications & User Profile */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-1.5 md:gap-2 text-slate-500">

            {/* WhatsApp / Messaging Shortcut */}
            <button
              onClick={() => router.push("/dashboard/whatsapp")}
              className="p-2 rounded-xl hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-colors"
              title="WhatsApp & Omni-Channel Messaging"
            >
              <MessageSquare className="w-6 h-6" />
            </button>

            {/*Notification Center  */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowAlertCenter(true);
                  setShowNotifications(false);
                  setShowMessages(false);
                  setShowUserDropdown(false);
                }}
                className={`p-2 rounded-xl transition-colors relative ${
                  showAlertCenter
                    ? "bg-indigo-50 text-indigo-600"
                    : "hover:bg-slate-100 text-slate-600"
                }`}
                title="Notification Center"
              >
                <Bell className="w-6 h-6" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                )}
              </button>
            </div>

            {/* Calendar Shortcut */}
            <button
              onClick={() => router.push("/dashboard/followups")}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition-colors hidden sm:inline-flex"
              title="Calendar & Tasks"
            >
              <Calendar className="w-6 h-6" />
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          {/* Dynamic User Profile Pill & Dropdown */}
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => {
                setShowUserDropdown((prev) => !prev);
                setShowNotifications(false);
                setShowMessages(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 transition-all focus:outline-none"
              aria-expanded={showUserDropdown}
            >
              <div
                className={`w-10 h-10 rounded-full ${getAvatarBg(
                  user.role,
                )} text-white flex items-center justify-center font-bold text-md shadow-xs shrink-0 overflow-hidden border border-slate-200/80 bg-slate-100`}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  user.initials
                )}
              </div>
              <div className="hidden md:block text-left">
                <span className="text-md font-bold text-slate-900 block leading-tight truncate max-w-32.5">
                  {user.name}
                </span>
                <span className="text-sm text-slate-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {user.roleDisplay}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 hidden sm:block ${
                  showUserDropdown ? "rotate-180 text-blue-600" : ""
                }`}
              />
            </button>

            {/* User Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-scale-up">
                {/* Hidden File Input for Avatar Selection */}
                <input
                  type="file"
                  ref={avatarFileInputRef}
                  onChange={handleAvatarSelect}
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                />

                {/* User Header with Avatar Management */}
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    {/* Avatar with Camera Trigger & Hover Overlay */}
                    <div className="relative group shrink-0">
                      <button
                        type="button"
                        onClick={() => avatarFileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        title={user.avatarUrl ? "Change profile picture" : "Upload profile picture"}
                        className={`w-14 h-14 rounded-full ${getAvatarBg(
                          user.role,
                        )} text-white font-black text-base flex items-center justify-center shadow-xs overflow-hidden border-2 border-white ring-1 ring-slate-200 relative transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer`}
                      >
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          user.initials
                        )}

                        {/* Hover Overlay with Camera Icon */}
                        <div
                          className={`absolute inset-0 bg-slate-900/50 rounded-full flex flex-col items-center justify-center text-white transition-opacity ${
                            isUploadingAvatar ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          }`}
                        >
                          {isUploadingAvatar ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Camera className="w-5 h-5 drop-shadow-sm" />
                          )}
                        </div>
                      </button>

                      {/* Small Camera Badge Button */}
                      <button
                        type="button"
                        onClick={() => avatarFileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        title={user.avatarUrl ? "Change photo" : "Upload photo"}
                        className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xs border-2 border-white transition-all cursor-pointer"
                      >
                        {isUploadingAvatar ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Camera className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    {/* User Info & Quick Action Buttons */}
                    <div className="min-w-0 flex-1">
                      <span className="text-md font-bold text-slate-900 block truncate">
                        {user.name}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {user.email || "Verified User"}
                      </span>


                      {/* Profile Photo Quick Actions */}
                      <div className="mt-2 flex items-center gap-2 pt-1 border-t border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => avatarFileInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                          className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          <span>{user.avatarUrl ? "Change Photo" : "Add Photo"}</span>
                        </button>

                        {user.avatarUrl && (
                          <>
                            <span className="text-slate-300 text-xs">•</span>
                            <button
                              type="button"
                              onClick={handleDeleteAvatar}
                              disabled={isUploadingAvatar}
                              className="text-[12px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors cursor-pointer"
                              title="Delete profile picture"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Inline Error Notice */}
                  {avatarError && (
                    <div className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center justify-between">
                      <span className="truncate">{avatarError}</span>
                      <button
                        type="button"
                        onClick={() => setAvatarError("")}
                        className="text-rose-500 hover:text-rose-700 ml-1 font-bold text-sm leading-none"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {/* Navigation Links */}
                <div className="p-2 space-y-0.5 text-xs font-medium">
                  <Link
                    href="/dashboard"
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                  >
                    <Layers className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">Dashboard Home</span>
                  </Link>

                  <Link
                    href="/dashboard/reports"
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                  >
                    <BarChart3 className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">Reports & Analytics</span>
                  </Link>

                  {user.role === "admin" && (
                    <Link
                      href="/dashboard/admin/settings/company"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Company Settings</span>
                    </Link>
                  )}

                  {user.role === "manager" && (
                    <Link
                      href="/dashboard/manager/team"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                    >
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>Team Performance</span>
                    </Link>
                  )}

                  {user.role === "designer" && (
                    <Link
                      href="/dashboard/design"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                    >
                      <Palette className="w-4 h-4 text-slate-400" />
                      <span>My Design Projects</span>
                    </Link>
                  )}
                </div>

                {/* Sign Out Action */}
                <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal (Ctrl+K / Cmd+K) */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-start justify-center pt-16 md:pt-20 p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-up">
            {/* Search Input Bar */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
              <Search className="w-5 h-5 text-blue-600 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search customers, leads, phone numbers, quotes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-md text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
              />
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results Body */}
            <div className="p-4 max-h-96 overflow-y-auto space-y-4">
              {isSearching && (
                <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>Searching CRM database...</span>
                </div>
              )}

              {searchResults &&
              (searchResults.customers?.length > 0 ||
                searchResults.leads?.length > 0) ? (
                <div className="space-y-4 text-xs">
                  {/* Customers */}
                  {searchResults.customers?.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Customers ({searchResults.customers.length})
                      </span>
                      <div className="space-y-1">
                        {searchResults.customers.map((c) => (
                          <div
                            key={c._id}
                            onClick={() => {
                              setShowSearchModal(false);
                              router.push(`/dashboard/customers/${c._id}`);
                            }}
                            className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <Building2 className="w-4 h-4 text-blue-600" />
                              <span className="font-bold text-slate-800">
                                {c.displayName || c.companyName || c.name}
                              </span>
                              <span className="text-slate-400">{c.phone}</span>
                              {c.customerNumber && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-semibold">
                                  {c.customerNumber}
                                </span>
                              )}
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Leads */}
                  {searchResults.leads?.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Leads ({searchResults.leads.length})
                      </span>
                      <div className="space-y-1">
                        {searchResults.leads.map((l) => (
                          <div
                            key={l._id}
                            onClick={() => {
                              setShowSearchModal(false);
                              router.push(`/dashboard/leads/${l._id}`);
                            }}
                            className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <Users className="w-4 h-4 text-emerald-600" />
                              <span className="font-bold text-slate-800">
                                {l.companyName || l.contactPerson || l.name}
                              </span>
                              <span className="text-slate-400">{l.phone}</span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                                {l.status}
                              </span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : searchQuery && !isSearching ? (
                <div className="p-8 text-center text-slate-400 text-md">
                  No records found matching &quot;{searchQuery}&quot;.
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  <span className="text-[15px] font-bold text-slate-400 uppercase tracking-wider block">
                    Quick Navigation Shortcuts
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      {
                        name: "Reports",
                        href: "/dashboard/reports",
                        icon: BarChart3,
                      },
                      {
                        name: "Leads",
                        href: "/dashboard/leads",
                        icon: TrendingUp,
                      },
                      {
                        name: "Quotations",
                        href: "/dashboard/quotations",
                        icon: FileText,
                      },
                      {
                        name: "Orders",
                        href: "/dashboard/orders",
                        icon: ShoppingBag,
                      },
                      {
                        name: "Production",
                        href: "/dashboard/production",
                        icon: Layers,
                      },
                      {
                        name: "Design",
                        href: "/dashboard/design",
                        icon: Palette,
                      },
                      {
                        name: "Follow-ups",
                        href: "/dashboard/followups",
                        icon: PhoneCall,
                      },
                      {
                        name: "Messages",
                        href: "/dashboard/communication",
                        icon: MessageSquare,
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.name}
                          onClick={() => {
                            setShowSearchModal(false);
                            router.push(item.href);
                          }}
                          className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-100 text-slate-700 flex flex-col items-center justify-center gap-1.5 transition-all group"
                        >
                          <Icon className="w-7 h-7 text-slate-400 group-hover:text-blue-600 transition-colors" />
                          <span className="text-md font-semibold">
                            {item.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Slide-Over Navigation Drawer */}
      {showMobileMenu && (
        <div
          onClick={() => setShowMobileMenu(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-start animate-fade-in md:hidden cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-72 bg-[#0B1120] text-slate-300 h-full p-4 flex flex-col justify-between shadow-2xl animate-slide-right cursor-default"
          >
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-blue-600/30">
                    A2
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block leading-tight">
                      {tenant.name}
                    </span>
                    <span className="text-[10px] text-blue-400 font-semibold">
                      CRM & ERP
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Navigation Links */}
              <div className="mt-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block px-2 mb-2">
                  Navigation ({user.roleDisplay})
                </span>
                {getMobileNavItems().map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Drawer User Card */}
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg ${getAvatarBg(
                      user.role,
                    )} text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden`}
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.initials
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-200 block truncate">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-blue-400 block truncate">
                      {user.roleDisplay}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Operational Alerts & Exception Center Slide-Over Drawer */}
      <AlertCenterDrawer
        isOpen={showAlertCenter}
        onClose={() => setShowAlertCenter(false)}
        onCountUpdated={(count) => setUnreadNotificationCount(count)}
      />
    </>
  );
}
