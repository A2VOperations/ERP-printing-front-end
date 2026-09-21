"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { checkRouteAccess, normalizeRole } from "@/lib/rbacGuard";
import AccessDeniedView from "@/app/components/access-denied";
import { api } from "@/lib/api";

export default function DashboardSecurityLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [hasToken, setHasToken] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) {
        setHasToken(false);
        setMounted(true);
        router.push("/");
        return;
      }

      const stored = localStorage.getItem("userRole");
      let role = stored ? normalizeRole(stored) : "";
      if (!role) {
        try {
          const u = JSON.parse(localStorage.getItem("user") || "{}");
          if (u.role) role = normalizeRole(u.roleSlug || u.role);
        } catch {}
      }
      setUserRole(role);
      setMounted(true);

      // Background authoritative server check via /api/v1/auth/me
      api
        .get("/auth/me")
        .then((res) => {
          if (res?.data?.user?.role) {
            const serverRole = normalizeRole(
              res.data.user.roleSlug || res.data.user.role
            );
            setUserRole(serverRole);
            localStorage.setItem("userRole", serverRole);
          }
        })
        .catch((err) => {
          if (err?.statusCode === 401 || err?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("userRole");
            router.push("/");
          }
        });
    }
  }, [router, pathname]);

  // Neutral SSR & Hydration Frame: Prevents any hydration mismatch between server and client
  if (!mounted) {
    return (
      <div className="flex bg-[#F8FAFC] min-h-screen items-center justify-center font-sans antialiased">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  // If unauthenticated, redirecting to login
  if (!hasToken) {
    return (
      <div className="flex bg-[#F8FAFC] min-h-screen items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-semibold">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Security Check against current pathname
  const accessCheck = checkRouteAccess(pathname, userRole);

  if (!accessCheck.authorized) {
    return (
      <AccessDeniedView
        pathname={pathname}
        role={userRole}
        rule={accessCheck.rule}
      />
    );
  }

  // Authorized: render protected page
  return <>{children}</>;
}
