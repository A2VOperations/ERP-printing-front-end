"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import { normalizeRole } from "@/lib/rbacGuard";
import AlertCenterDrawer from "./alertCenterDrawer";
import { getNavSections, isRouteActive } from "@/lib/navigationConfig";
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
  MapPin,
  PlusCircle,
  Inbox,
  Sparkles,
  Check,
  CheckCircle2,
  Volume2,
  VolumeX,
} from "lucide-react";

export default function Navbar({ showNotificationCenter = true } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams ? searchParams.get("view") || "" : "";
  const currentFilter = searchParams ? searchParams.get("filter") || "" : "";

  // Dynamic user & tenant state with resilient localStorage hydration
  const [user, setUser] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const storedName = localStorage.getItem("userName") || "User";
        let storedRole = (localStorage.getItem("userRole") || "").toLowerCase();
        let storedId = "";
        try {
          const u = JSON.parse(localStorage.getItem("user") || "{}");
          storedId = u._id || u.id || "";
          if (!storedRole && (u.role || u.roleSlug)) {
            storedRole = String(u.roleSlug || u.role).toLowerCase();
          }
        } catch {}

        if (!storedRole) {
          if (pathname?.startsWith("/dashboard/data-operator"))
            storedRole = "data_operator";
          else if (pathname?.startsWith("/dashboard/admin"))
            storedRole = "admin";
          else if (pathname?.startsWith("/dashboard/manager"))
            storedRole = "manager";
          else storedRole = "sales";
        }

        let roleDisplay = "Sales Executive";
        if (storedRole.includes("admin")) roleDisplay = "Super Admin";
        else if (storedRole.includes("manager")) roleDisplay = "Sales Manager";
        else if (storedRole.includes("sales")) roleDisplay = "Sales Executive";
        else if (storedRole.includes("operator")) roleDisplay = "Data Operator";
        else roleDisplay = storedRole.toUpperCase();

        return {
          id: storedId,
          _id: storedId,
          name: storedName,
          email: storedEmail,
          role: storedRole,
          roleDisplay,
          initials: storedName.slice(0, 2).toUpperCase(),
          avatarUrl: storedAvatar,
        };
      } catch {}
    }
    return {
      id: "",
      _id: "",
      name: "User",
      email: "",
      role: "sales",
      roleDisplay: "Sales Executive",
      initials: "US",
      avatarUrl: null,
    };
  });

  const [tenant, setTenant] = useState({
    name: "A2V Prints",
    code: "",
  });

  // Strict Canonical Role Resolution
  const activeRoleRaw = (
    user?.role ||
    (typeof window !== "undefined"
      ? localStorage.getItem("userRole") || ""
      : "") ||
    (pathname?.startsWith("/dashboard/data-operator")
      ? "data_operator"
      : pathname?.startsWith("/dashboard/admin")
        ? "admin"
        : "sales")
  ).toLowerCase();

  const userRoleNorm = normalizeRole(activeRoleRaw);

  // Data Operator check - strict isolation (no notifications or alerts of any kind)
  const isDataOperator =
    showNotificationCenter === false ||
    pathname?.startsWith("/dashboard/data-operator") ||
    userRoleNorm === "data_operator" ||
    activeRoleRaw.includes("operator");

  // Admin & Manager check - strict isolation from top nav popups
  const isAdminOrManager =
    pathname?.startsWith("/dashboard/admin") ||
    pathname?.startsWith("/dashboard/manager") ||
    userRoleNorm === "admin" ||
    userRoleNorm === "manager" ||
    activeRoleRaw.includes("admin") ||
    activeRoleRaw.includes("manager");

  // True sales representative on sales workflows
  const isSalesPerson = userRoleNorm === "sales";

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

  // Incoming Assigned Leads State & Notification Bar
  const [assignedInboxCount, setAssignedInboxCount] = useState(0);
  const [assignedLeads, setAssignedLeads] = useState([]);
  const [showAssignedLeadsPopup, setShowAssignedLeadsPopup] = useState(false);
  const [showBigNotification, setShowBigNotification] = useState(false);
  const [incomingLeadAlert, setIncomingLeadAlert] = useState(null);
  const [isQuickAccepting, setIsQuickAccepting] = useState(false);

  // Refs for click-outside detection
  const userDropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const messagesRef = useRef(null);
  const assignedLeadsRef = useRef(null);

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
      supabase.auth
        .getSession()
        .then(({ data }) => {
          const sbAvatar = data?.session?.user?.user_metadata?.avatar_url;
          if (sbAvatar) {
            if (typeof sbAvatar === "string" && sbAvatar.startsWith("data:")) {
              // Clean legacy base64 avatar from Supabase metadata to prevent JWT token explosion (>16KB)
              supabase.auth
                .updateUser({ data: { avatar_url: null } })
                .catch(() => {});
            } else {
              setUser((prev) => ({
                ...prev,
                avatarUrl: prev.avatarUrl || sbAvatar,
              }));
              if (
                typeof window !== "undefined" &&
                !localStorage.getItem("userAvatar")
              ) {
                localStorage.setItem("userAvatar", sbAvatar);
              }
            }
          }
        })
        .catch(() => {});
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
          else roleTitle = rawRole.toUpperCase();

          const currentCachedAvatar =
            typeof window !== "undefined"
              ? localStorage.getItem("userAvatar")
              : null;
          const effectiveAvatar =
            u.avatarUrl || u.profileImage || currentCachedAvatar || null;

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
              const directory = JSON.parse(
                localStorage.getItem("crm_user_avatars") || "{}",
              );
              if (u.email)
                directory[u.email.toLowerCase().trim()] = effectiveAvatar;
              if (fullName)
                directory[fullName.toLowerCase().trim()] = effectiveAvatar;
              if (u._id || u.id)
                directory[(u._id || u.id).toString()] = effectiveAvatar;
              localStorage.setItem(
                "crm_user_avatars",
                JSON.stringify(directory),
              );
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

    // Fetch operational alerts summary for real-time unread badge (unless Data Operator)
    if (!isDataOperator) {
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
    }

    // Communication message threads disabled until backend communications module is active
    // api
    //   .get("/communications/threads?limit=5", { silent: true })
    //   .then((res) => {
    //     const list = res?.data || [];
    //     if (Array.isArray(list) && list.length > 0) {
    //       setThreads(list);
    //       const unread = list.filter((t) => t.unreadCount > 0).length;
    //       setUnreadMessageCount(unread || list.length);
    //     }
    //   })
    //   .catch(() => {
    //     // Fail gracefully
    //   });

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
      if (
        assignedLeadsRef.current &&
        !assignedLeadsRef.current.contains(e.target)
      ) {
        setShowAssignedLeadsPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false);
  }, [pathname]);

  // 2.5 Real-time Incoming Assigned Leads & Mobile/Tablet Resilient Sound Engine
  const audioCtxRef = useRef(null);
  const audioBufferRef = useRef(null);
  const activeSourceNodeRef = useRef(null);
  const leadAudioRef = useRef(null);
  const soundIntervalRef = useRef(null);
  const soundStartTimeRef = useRef(0);
  const [isAlertSounding, setIsAlertSounding] = useState(false);

  // Unlocks audio hardware for Mobile Safari (iOS), Android Chrome, tablet browsers
  const unlockAudioContext = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
          audioCtxRef.current = new AudioCtx();
        }
        if (audioCtxRef.current.state === "suspended") {
          audioCtxRef.current.resume().catch(() => {});
        }
        // Play an inaudible 1-sample buffer to satisfy iOS audio session activation
        const silentBuf = audioCtxRef.current.createBuffer(1, 1, 22050);
        const src = audioCtxRef.current.createBufferSource();
        src.buffer = silentBuf;
        src.connect(audioCtxRef.current.destination);
        src.start(0);
      }

      if (!leadAudioRef.current && typeof Audio !== "undefined") {
        const audio = new Audio("/lead-alert.mp3");
        audio.preload = "auto";
        audio.setAttribute("playsinline", "true");
        audio.setAttribute("webkit-playsinline", "true");
        leadAudioRef.current = audio;
      }
      if (leadAudioRef.current) {
        leadAudioRef.current.load();
      }
    } catch {
      // Ignore
    }
  }, []);

  // Pre-load audio on mount and bind unlock handlers for mobile devices
  useEffect(() => {
    let isCancelled = false;
    const preloadBuffer = async () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
          audioCtxRef.current = new AudioCtx();
        }
        const resp = await fetch("/lead-alert.mp3");
        if (!resp.ok) return;
        const arrayBuf = await resp.arrayBuffer();
        if (isCancelled) return;
        audioCtxRef.current.decodeAudioData(
          arrayBuf,
          (buf) => {
            if (!isCancelled) {
              audioBufferRef.current = buf;
            }
          },
          () => {},
        );
      } catch {}
    };
    preloadBuffer();

    // Global listener to unlock mobile/tablet audio on first touch or tap anywhere
    const handleFirstUserGesture = () => {
      unlockAudioContext();
      window.removeEventListener("touchstart", handleFirstUserGesture);
      window.removeEventListener("touchend", handleFirstUserGesture);
      window.removeEventListener("pointerdown", handleFirstUserGesture);
      window.removeEventListener("click", handleFirstUserGesture);
    };

    window.addEventListener("touchstart", handleFirstUserGesture, {
      once: true,
      passive: true,
    });
    window.addEventListener("touchend", handleFirstUserGesture, {
      once: true,
      passive: true,
    });
    window.addEventListener("pointerdown", handleFirstUserGesture, {
      once: true,
      passive: true,
    });
    window.addEventListener("click", handleFirstUserGesture, {
      once: true,
      passive: true,
    });

    return () => {
      isCancelled = true;
      window.removeEventListener("touchstart", handleFirstUserGesture);
      window.removeEventListener("touchend", handleFirstUserGesture);
      window.removeEventListener("pointerdown", handleFirstUserGesture);
      window.removeEventListener("click", handleFirstUserGesture);
    };
  }, [unlockAudioContext]);

  // Stop recurring sound, clear interval, and rewind audio immediately
  const stopLeadSound = useCallback(() => {
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }
    soundStartTimeRef.current = 0;
    setIsAlertSounding(false);

    // Stop Web Audio node if playing
    if (activeSourceNodeRef.current) {
      try {
        activeSourceNodeRef.current.stop();
        activeSourceNodeRef.current.disconnect();
      } catch {}
      activeSourceNodeRef.current = null;
    }

    // Stop HTML5 Audio if playing
    if (leadAudioRef.current) {
      try {
        leadAudioRef.current.pause();
        leadAudioRef.current.currentTime = 0;
      } catch {}
    }
  }, []);

  // Play incoming lead audio across desktop, mobile Safari, Chrome, and tablets
  const playLeadAssignedSound = useCallback(() => {
    try {
      if (typeof window === "undefined") return;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
          audioCtxRef.current = new AudioCtx();
        }
        if (audioCtxRef.current.state === "suspended") {
          audioCtxRef.current.resume().catch(() => {});
        }
      }

      // Priority 1: Web Audio API Buffer playback (bypasses mobile media element lockouts)
      if (audioCtxRef.current && audioBufferRef.current) {
        try {
          const ctx = audioCtxRef.current;
          if (ctx.state === "running") {
            const srcNode = ctx.createBufferSource();
            srcNode.buffer = audioBufferRef.current;
            srcNode.connect(ctx.destination);
            srcNode.start(0);
            activeSourceNodeRef.current = srcNode;
            srcNode.onended = () => {
              if (activeSourceNodeRef.current === srcNode) {
                activeSourceNodeRef.current = null;
              }
            };
            return;
          }
        } catch {
          // Fall through to HTML5 Audio Element
        }
      }

      // Priority 2: HTML5 Audio Element with mobile playsinline attributes
      if (!leadAudioRef.current) {
        const audio = new Audio("/lead-alert.mp3");
        audio.preload = "auto";
        audio.setAttribute("playsinline", "true");
        audio.setAttribute("webkit-playsinline", "true");
        audio.onerror = () => {
          audio.src = "/lead-alert.mpeg";
        };
        leadAudioRef.current = audio;
      }

      const audio = leadAudioRef.current;
      audio.currentTime = 0;
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Mobile browser blocked programmatic autoplay before screen tap
          const resumeAudio = () => {
            unlockAudioContext();
            if (leadAudioRef.current) {
              leadAudioRef.current.play().catch(() => {});
            }
            window.removeEventListener("touchstart", resumeAudio);
            window.removeEventListener("pointerdown", resumeAudio);
            window.removeEventListener("click", resumeAudio);
          };
          window.addEventListener("touchstart", resumeAudio, {
            once: true,
            passive: true,
          });
          window.addEventListener("pointerdown", resumeAudio, {
            once: true,
            passive: true,
          });
          window.addEventListener("click", resumeAudio, {
            once: true,
            passive: true,
          });
        });
      }
    } catch {
      // Audio playback error or autoplay restriction
    }
  }, [unlockAudioContext]);

  // Starts recurring audio: plays every 3 seconds for up to 3 minutes (180s)
  const startLeadSoundLoop = useCallback(() => {
    stopLeadSound();
    soundStartTimeRef.current = Date.now();
    setIsAlertSounding(true);

    // Initial audio play immediately
    playLeadAssignedSound();

    // Repeat every 3 seconds for up to 3 minutes
    soundIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - soundStartTimeRef.current;
      if (elapsed >= 3 * 60 * 1000) {
        stopLeadSound();
        return;
      }
      playLeadAssignedSound();
    }, 3000);
  }, [playLeadAssignedSound, stopLeadSound]);

  // Sound loop lifecycle for incoming unaccepted leads (every 3s for up to 3 minutes)
  useEffect(() => {
    if (isSalesPerson && showBigNotification && incomingLeadAlert) {
      startLeadSoundLoop();
    } else {
      stopLeadSound();
    }
    return () => {
      stopLeadSound();
    };
  }, [
    isSalesPerson,
    showBigNotification,
    incomingLeadAlert,
    startLeadSoundLoop,
    stopLeadSound,
  ]);

  const fetchAssignedLeads = useCallback(
    async (isInitial = false) => {
      try {
        // STRICT ROLE GATE: Only Sales Executives receive incoming assigned lead alerts & notification bar
        // NEVER show any incoming lead alerts to Data Operators, Admin, Managers
        if (!isSalesPerson) {
          setAssignedInboxCount(0);
          setAssignedLeads([]);
          setShowBigNotification(false);
          setIncomingLeadAlert(null);
          return;
        }

        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("token") ||
              localStorage.getItem("auth_token")
            : null;
        if (!token) return;

        // Resolve my user ID to ensure leads are ONLY those assigned to this specific salesperson
        let myUserId = user?._id || user?.id || "";
        if (!myUserId && typeof window !== "undefined") {
          try {
            const u = JSON.parse(localStorage.getItem("user") || "{}");
            myUserId = u._id || u.id || "";
          } catch {}
        }

        const res = await api.get(
          "/leads?acceptanceStatus=PENDING&limit=25&sortBy=createdAt&sortOrder=desc",
          { silent: true },
        );
        const raw = res?.data;
        const list = Array.isArray(raw) ? raw : raw?.leads || raw?.data || [];

        // Helper to cleanly extract ObjectId string whether populated or scalar
        const extractAssigneeId = (ld) => {
          if (!ld) return "";
          const target = ld.assignedToId || ld.assignedTo;
          if (typeof target === "object" && target !== null) {
            return String(target._id || target.id || "");
          }
          return typeof target === "string" ? target : "";
        };

        // Since backend already enforces assignedToId = user._id for salespersons,
        // list contains this user's leads. We safely verify only if both IDs exist.
        const myAssignedLeads =
          myUserId && list.length > 0
            ? list.filter((ld) => {
                const assignedId = extractAssigneeId(ld);
                return !assignedId || String(assignedId) === String(myUserId);
              })
            : list;

        const total =
          raw?.pagination?.totalRecords !== undefined
            ? raw.pagination.totalRecords
            : myAssignedLeads.length;

        setAssignedInboxCount(total);
        setAssignedLeads(myAssignedLeads);

        // Synchronize badge with sidebar
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("refresh-inbox-count", {
              detail: { count: total },
            }),
          );
        }

        if (myAssignedLeads.length > 0) {
          const latest = myAssignedLeads[0];
          const lastNotifiedId =
            typeof window !== "undefined"
              ? sessionStorage.getItem("crm_last_notified_lead_id")
              : null;

          // If a new lead is assigned to this salesperson that hasn't been acknowledged in this session
          if (latest._id && latest._id !== lastNotifiedId) {
            setIncomingLeadAlert(latest);
            setShowBigNotification(true);
          }
        } else {
          setShowBigNotification(false);
          setIncomingLeadAlert(null);
        }
      } catch {
        // Fail silently
      }
    },
    [isSalesPerson, user?._id, user?.id],
  );

  const hasFetchedAssignedLeadsRef = useRef(false);

  useEffect(() => {
    // If not strictly sales (e.g. data_operator or admin), do not poll or register assignment alerts
    if (!isSalesPerson) {
      setAssignedInboxCount(0);
      setAssignedLeads([]);
      setShowBigNotification(false);
      setIncomingLeadAlert(null);
      return;
    }

    if (!hasFetchedAssignedLeadsRef.current) {
      hasFetchedAssignedLeadsRef.current = true;
      fetchAssignedLeads(true);
    }

    const handleLeadAssignedEvent = (e) => {
      if (!isSalesPerson) return;

      // Strictly verify that this lead was assigned to THIS specific salesperson
      let myUserId = user?._id || user?.id || "";
      if (!myUserId && typeof window !== "undefined") {
        try {
          const u = JSON.parse(localStorage.getItem("user") || "{}");
          myUserId = u._id || u.id || "";
        } catch {}
      }

      const lead = e?.detail?.lead;
      const rawTarget =
        e?.detail?.targetUserId ||
        (typeof lead?.assignedToId === "object"
          ? lead?.assignedToId?._id
          : lead?.assignedToId) ||
        (typeof lead?.assignedTo === "object"
          ? lead?.assignedTo?._id
          : lead?.assignedTo);
      const targetUserId = rawTarget ? String(rawTarget) : "";

      // If target user is specified, verify it matches this salesperson
      if (
        targetUserId &&
        myUserId &&
        String(targetUserId) !== String(myUserId)
      ) {
        return;
      }

      if (lead) {
        setIncomingLeadAlert(lead);
        setShowBigNotification(true);
      }
    };

    const handleRefreshCount = (e) => {
      setTimeout(() => {
        if (!isSalesPerson) return;
        if (e?.detail?.count !== undefined) {
          setAssignedInboxCount(Number(e.detail.count) || 0);
        }
      }, 0);
    };

    const handleLeadAcceptedEvent = () => {
      stopLeadSound();
      setShowBigNotification(false);
      setIncomingLeadAlert(null);
    };

    window.addEventListener("lead-assigned", handleLeadAssignedEvent);
    window.addEventListener("refresh-inbox-count", handleRefreshCount);
    window.addEventListener("lead-accepted", handleLeadAcceptedEvent);

    return () => {
      window.removeEventListener("lead-assigned", handleLeadAssignedEvent);
      window.removeEventListener("refresh-inbox-count", handleRefreshCount);
      window.removeEventListener("lead-accepted", handleLeadAcceptedEvent);
    };
  }, [fetchAssignedLeads, isSalesPerson, stopLeadSound, user?._id, user?.id]);

  const handleQuickAccept = async () => {
    if (!incomingLeadAlert || isQuickAccepting) return;
    setIsQuickAccepting(true);
    stopLeadSound();
    try {
      await api.post(`/leads/${incomingLeadAlert._id}/accept`, {});
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "crm_last_notified_lead_id",
          incomingLeadAlert._id,
        );
        window.dispatchEvent(
          new CustomEvent("lead-accepted", {
            detail: { leadId: incomingLeadAlert._id },
          }),
        );
      }
      setShowBigNotification(false);
      setIncomingLeadAlert(null);
      await fetchAssignedLeads(false);
      router.push(`/dashboard/leads/${incomingLeadAlert._id}`);
    } catch (err) {
      console.error("Failed to accept lead:", err);
    } finally {
      setIsQuickAccepting(false);
    }
  };

  const handleDismissBigNotification = () => {
    stopLeadSound();
    if (incomingLeadAlert && typeof window !== "undefined") {
      sessionStorage.setItem(
        "crm_last_notified_lead_id",
        incomingLeadAlert._id,
      );
    }
    setShowBigNotification(false);
    setIncomingLeadAlert(null);
  };

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
      const newUrl =
        e.detail?.avatarUrl !== undefined ? e.detail.avatarUrl : null;
      setUser((prev) => ({ ...prev, avatarUrl: newUrl }));
    };
    window.addEventListener("crm:avatar-updated", handleAvatarSync);
    return () =>
      window.removeEventListener("crm:avatar-updated", handleAvatarSync);
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
        const directory = JSON.parse(
          localStorage.getItem("crm_user_avatars") || "{}",
        );
        if (user.email)
          directory[user.email.toLowerCase().trim()] = optimizedDataUrl;
        if (user.name)
          directory[user.name.toLowerCase().trim()] = optimizedDataUrl;
        if (user.id || user._id)
          directory[(user.id || user._id).toString()] = optimizedDataUrl;
        localStorage.setItem("crm_user_avatars", JSON.stringify(directory));
      } catch {}
      window.dispatchEvent(
        new CustomEvent("crm:avatar-updated", {
          detail: { avatarUrl: optimizedDataUrl, user },
        }),
      );

      // 3. Send to backend /auth/avatar (saves to Cloudinary/storage and returns hosted URL)
      try {
        const formData = new FormData();
        formData.append("avatar", file);
        const res = await api.post("/auth/avatar", formData, { silent: true });
        if (res?.data?.avatarUrl || res?.avatarUrl) {
          const finalUrl = res?.data?.avatarUrl || res?.avatarUrl;
          setUser((prev) => ({ ...prev, avatarUrl: finalUrl }));
          localStorage.setItem("userAvatar", finalUrl);

          // Only sync clean HTTP/HTTPS hosted URLs to Supabase auth metadata (never large base64 strings)
          if (
            supabase?.auth &&
            typeof finalUrl === "string" &&
            (finalUrl.startsWith("http://") || finalUrl.startsWith("https://"))
          ) {
            supabase.auth
              .updateUser({
                data: { avatar_url: finalUrl },
              })
              .catch(() => {});
          }
        }
      } catch {
        // Backend not yet redeployed with /avatar endpoint; preserved safely in local storage
      }
    } catch (err) {
      console.error("Avatar upload failed:", err);
      const fallback = localStorage.getItem("userAvatar") || null;
      setUser((prev) => ({ ...prev, avatarUrl: fallback }));
      setAvatarError(
        err.message || "Failed to process photo. Please try again.",
      );
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
        new CustomEvent("crm:avatar-updated", { detail: { avatarUrl: null } }),
      );

      // 2. Clear from Supabase user metadata
      if (supabase?.auth) {
        supabase.auth
          .updateUser({
            data: { avatar_url: null },
          })
          .catch(() => {});
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
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "sales":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
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
        return "bg-[#F95721]";
      case "sales":
        return "bg-emerald-600";
      default:
        return "bg-teal-600";
    }
  };

  return (
    <>
      <header className="h-14 sm:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs transition-all">
        {/* Left: Menu Toggle, Tenant Context & Interactive Search Bar */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 max-w-2xl min-w-0">
          <button
            onClick={() => {
              setShowMobileMenu((prev) => !prev);
              window.dispatchEvent(new CustomEvent("toggle-sidebar"));
            }}
            className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/20 shrink-0"
            title="Toggle Navigation Menu"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Quick Search Launch Bar */}
          <div
            onClick={() => setShowSearchModal(true)}
            className="relative flex-1 cursor-pointer group min-w-0"
          >
            <Search className="w-4 h-4 absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-[#F95721] transition-colors shrink-0" />
            <div className="w-full pl-8.5 sm:pl-10 pr-2.5 sm:pr-3 lg:pr-14 py-1.5 sm:py-2 rounded-xl sm:rounded-sm bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-400 group-hover:border-slate-300 group-hover:bg-slate-100/70 select-none shadow-2xs transition-all flex items-center justify-between">
              <span className="truncate">
                <span className="hidden sm:inline">
                  Search customers, leads, quotes, orders...
                </span>
                <span className="sm:hidden">Search CRM...</span>
              </span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-2xs shrink-0 ml-2">
                Ctrl K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right: Dynamic Channels, Interactive Notifications & User Profile */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
          <div className="flex items-center gap-0.5 sm:gap-1.5 md:gap-2 text-slate-500">
            {/* WhatsApp / Messaging Shortcut */}
            <button
              onClick={() => router.push("/dashboard/whatsapp")}
              className="p-1.5 sm:p-2 rounded-xl hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-colors"
              title="WhatsApp & Omni-Channel Messaging"
              aria-label="WhatsApp & Omni-Channel Messaging"
            >
              <MessageSquare className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </button>

            {/*Notification Center  */}
            {!isDataOperator && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowAlertCenter(true);
                    setShowNotifications(false);
                    setShowMessages(false);
                    setShowUserDropdown(false);
                  }}
                  className={`p-1.5 sm:p-2 rounded-xl transition-colors relative ${
                    showAlertCenter
                      ? "bg-indigo-50 text-indigo-600"
                      : "hover:bg-slate-100 text-slate-600"
                  }`}
                  title="Notification Center"
                  aria-label="Notification Center"
                >
                  <Bell className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                  {(unreadNotificationCount > 0 ||
                    (isSalesPerson && assignedInboxCount > 0)) && (
                    <span className="absolute top-1 right-1 w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                  )}
                </button>
              </div>
            )}

            {/* Calendar Shortcut */}
            <button
              onClick={() => router.push("/dashboard/followups")}
              className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-[#F95721] transition-colors hidden sm:inline-flex"
              title="Calendar & Tasks"
              aria-label="Calendar & Tasks"
            >
              <Calendar className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </button>
          </div>

          <div className="h-5 sm:h-6 w-px bg-slate-200 mx-0.5 sm:mx-1" />

          {/* Dynamic User Profile Pill & Dropdown */}
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => {
                setShowUserDropdown((prev) => !prev);
                setShowNotifications(false);
                setShowMessages(false);
              }}
              className="flex items-center gap-1.5 sm:gap-2.5 p-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 rounded-xl hover:bg-slate-100 transition-all focus:outline-none"
              aria-expanded={showUserDropdown}
            >
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full ${getAvatarBg(
                  user.role,
                )} text-white flex items-center justify-center font-bold text-xs sm:text-sm md:text-base shadow-xs shrink-0 overflow-hidden border border-slate-200/80 bg-slate-100`}
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
              <div className="hidden lg:block text-left">
                <span className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight truncate max-w-28 xl:max-w-36">
                  {user.name}
                </span>
                <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {user.roleDisplay}
                </span>
              </div>
              <div className="hidden md:block lg:hidden text-left">
                <span className="text-xs font-bold text-slate-900 block leading-tight truncate max-w-24">
                  {user.name?.split(" ")[0]}
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 transition-transform duration-200 hidden sm:block ${
                  showUserDropdown ? "rotate-180 text-[#F95721]" : ""
                }`}
              />
            </button>

            {/* User Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-scale-up">
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
                        title={
                          user.avatarUrl
                            ? "Change profile picture"
                            : "Upload profile picture"
                        }
                        className={`w-14 h-14 rounded-full ${getAvatarBg(
                          user.role,
                        )} text-white font-black text-base flex items-center justify-center shadow-xs overflow-hidden border-2 border-white ring-1 ring-slate-200 relative transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500/40 cursor-pointer`}
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
                            isUploadingAvatar
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100"
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
                        className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-[#F95721] hover:bg-[#e84915] text-white flex items-center justify-center shadow-xs border-2 border-white transition-all cursor-pointer"
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
                          className="text-[12px] font-semibold text-[#F95721] hover:text-[#e84915] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          <span>
                            {user.avatarUrl ? "Change Photo" : "Add Photo"}
                          </span>
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
                    href={
                      user.role?.includes("sales") ||
                      user.role?.includes("employee") ||
                      user.role?.includes("executive")
                        ? "/dashboard/sales"
                          : user.role === "data_operator"
                            ? "/dashboard/data-operator"
                            : "/dashboard"
                    }
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-[#F95721] transition-colors"
                  >
                    <Layers className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">
                      {user.role?.includes("sales") ||
                      user.role?.includes("employee") ||
                      user.role?.includes("executive")
                        ? "Sales Dashboard"
                        : "Dashboard Home"}
                    </span>
                  </Link>

                  <Link
                    href="/dashboard/reports"
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-[#F95721] transition-colors"
                  >
                    <BarChart3 className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">Reports & Analytics</span>
                  </Link>

                  {user.role === "admin" && (
                    <Link
                      href="/dashboard/admin/settings/company"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-[#F95721] transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Company Settings</span>
                    </Link>
                  )}

                  {user.role === "manager" && (
                    <Link
                      href="/dashboard/manager/team"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-[#F95721] transition-colors"
                    >
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>Team Performance</span>
                    </Link>
                  )}

                  {user.role === "data_operator" && (
                    <Link
                      href="/dashboard/data-operator"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-[#F95721] transition-colors"
                    >
                      <Layers className="w-4 h-4 text-slate-400" />
                      <span>Data Operator Workspace</span>
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

      {/* Big Notification Bar for Incoming Assigned Lead in Top Nav Bar (Sales Only) */}
      {isSalesPerson && showBigNotification && incomingLeadAlert && (
        <div
          onClick={() => {
            unlockAudioContext();
          }}
          className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-xl border-b-2 border-red-400/80 px-3 sm:px-6 py-2.5 sm:py-3 transition-all animate-slide-down sticky top-14 sm:top-16 z-29"
        >
          <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Left: Big Icon + Beacon + Lead Details */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 shadow-inner">
                <Inbox className="w-5 h-5 text-white animate-bounce" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-red-100 font-semibold hidden xs:inline">
                    • Action Required: Review &amp; Accept
                  </span>
                  {assignedInboxCount > 1 && (
                    <span className="bg-red-950/40 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-300/30">
                      {assignedInboxCount} total waiting in Inbox
                    </span>
                  )}
                </div>
                <h4 className="text-sm sm:text-base font-extrabold tracking-tight text-white mt-0.5 truncate">
                  {incomingLeadAlert.businessName ||
                    incomingLeadAlert.contactName ||
                    "New Assigned Lead"}
                  {incomingLeadAlert.contactName &&
                  incomingLeadAlert.businessName
                    ? ` (${incomingLeadAlert.contactName})`
                    : ""}
                  {incomingLeadAlert.phone
                    ? ` • ${incomingLeadAlert.phone}`
                    : ""}
                </h4>
                {incomingLeadAlert.requirement && (
                  <p className="text-xs text-red-100/90 font-medium truncate max-w-2xl hidden sm:block">
                    Requirement: {incomingLeadAlert.requirement}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <Link
                href="/dashboard/leads/inbox"
                onClick={() => {
                  stopLeadSound();
                  setShowBigNotification(false);
                }}
                className="px-3.5 py-1.5 sm:py-2 rounded-xl bg-white hover:bg-red-50 text-red-700 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02]"
              >
                <span>Review in Lead Inbox ({assignedInboxCount})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={handleQuickAccept}
                disabled={isQuickAccepting}
                className="px-3 py-1.5 sm:py-2 rounded-xl bg-red-950/40 hover:bg-red-950/60 border border-white/30 text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                title="Quick Accept Lead"
              >
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>
                  {isQuickAccepting ? "Accepting..." : "Quick Accept"}
                </span>
              </button>
              <button
                onClick={handleDismissBigNotification}
                className="p-1.5 rounded-lg text-red-200 hover:text-white hover:bg-white/10 transition-colors ml-1 cursor-pointer"
                title="Dismiss Notification Bar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Search Modal (Ctrl+K / Cmd+K) */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-start justify-center pt-10 sm:pt-16 md:pt-20 p-3 sm:p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
            {/* Search Input Bar */}
            <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center gap-2.5 sm:gap-3 shrink-0">
              <Search className="w-5 h-5 text-[#F95721] shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search customers, leads, phone numbers, quotes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
              />
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results Body */}
            <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-4">
              {isSearching && (
                <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#F95721] border-t-transparent rounded-full animate-spin" />
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
                            className="p-2.5 rounded-xl bg-slate-50 hover:bg-orange-50 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <Building2 className="w-4 h-4 text-[#F95721]" />
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
                            className="p-2.5 rounded-xl bg-slate-50 hover:bg-orange-50 flex items-center justify-between cursor-pointer transition-colors"
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
                          className="p-3 rounded-xl bg-slate-50 hover:bg-orange-50 hover:text-[#F95721] border border-slate-100 text-slate-700 flex flex-col items-center justify-center gap-1.5 transition-all group"
                        >
                          <Icon className="w-7 h-7 text-slate-400 group-hover:text-[#F95721] transition-colors" />
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
                  onClick={() => setShowMobileMenu(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dynamic Navigation Sections - Identical to desktop */}
              <div className="flex-1 py-4 space-y-5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                {getNavSections(activeRoleRaw).map((section, sIdx) => (
                  <div
                    key={section.title || `mobile-sec-${sIdx}`}
                    className="space-y-1"
                  >
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
                        currentFilter,
                      );

                      return (
                        <Link
                          key={item.name + item.href}
                          href={item.href}
                          onClick={() => {
                            setShowMobileMenu(false);
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
                          <span className="truncate text-base">
                            {item.name}
                          </span>

                          {item.href === "/dashboard/leads/inbox" &&
                            isSalesPerson &&
                            assignedInboxCount > 0 && (
                              <span
                                className="ml-auto inline-flex items-center gap-1.5 bg-linear-to-r from-red-600 to-rose-600 text-white font-black text-[11px] px-2.5 py-0.5 rounded-full shadow-md shadow-red-600/40 border border-red-400/40 animate-pulse tracking-wide"
                                title={`${assignedInboxCount} lead${assignedInboxCount > 1 ? "s" : ""} assigned to you`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                                <span>{assignedInboxCount}</span>
                              </span>
                            )}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Bottom Footer Info */}
              <div className="p-3 border-t border-slate-800/80 shrink-0 flex items-center justify-between text-xs font-medium text-slate-400">
                <span className="truncate">{user.name || "User"}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold shrink-0">
                  {user.roleDisplay}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Operational Alerts & Exception Center Slide-Over Drawer */}
      {!isDataOperator && (
        <AlertCenterDrawer
          isOpen={showAlertCenter}
          onClose={() => setShowAlertCenter(false)}
          onCountUpdated={(count) => setUnreadNotificationCount(count)}
        />
      )}
    </>
  );
}
