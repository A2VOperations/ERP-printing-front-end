"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  User,
  Lock,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  LogIn,
  Users,
  FileText,
  Box,
  IndianRupee,
  Palette,
  BarChart3,
  ShieldCheck,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { API_BASE_URL } from "../lib/apiConfig";

// Multi-color Google Icon Component
function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

// 4-tile Multi-color Microsoft Icon Component
function MicrosoftIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 23 23">
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#00A4EF" d="M1 12h10v10H1z" />
      <path fill="#7FBA00" d="M12 1h10v10H12z" />
      <path fill="#FFB900" d="M12 12h10v10H12z" />
    </svg>
  );
}

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  // Check if user is already logged in or has saved rememberMe email
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlError = urlParams.get("error");
      if (urlError) {
        setError(urlError);
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }
    }

    const user = localStorage.getItem("user");
    if (user) {
      router.push("/dashboard");
      return;
    }
    const savedEmail = localStorage.getItem("crm_remembered_email");
    if (savedEmail) {
      setLoginEmail(savedEmail);
      setRememberMe(true);
    }
  }, [router]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      // Supabase Auth Login
      const { data, error: supabaseError } =
        await supabase.auth.signInWithPassword({
          email: loginEmail.trim(),
          password: loginPassword,
        });

      if (supabaseError) {
        setError(supabaseError.message || "Invalid login credentials.");
        return;
      }

      if (data?.user) {
        // Save or remove remembered email
        if (rememberMe) {
          localStorage.setItem("crm_remembered_email", loginEmail.trim());
        } else {
          localStorage.removeItem("crm_remembered_email");
        }

        let userRole = data.user.user_metadata?.role || "employee";
        let userName =
          data.user.user_metadata?.name || data.user.email.split("@")[0];
        let userMongoId = null;
        let tenantInfo = null;
        let permissions = [];

        // Fetch authoritative server-verified profile via /api/v1/auth/me
        try {
          const authMeRes = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
            headers: {
              Authorization: `Bearer ${data.session.access_token}`,
            },
          });
          const authMeData = await authMeRes.json().catch(() => ({}));

          if (authMeRes.ok && authMeData.success && authMeData.data) {
            const u = authMeData.data.user;
            if (u.role) userRole = u.role;
            if (u.name) userName = u.name;
            if (u.id) userMongoId = u.id;
            tenantInfo = authMeData.data.tenant;
            permissions = authMeData.data.permissions || [];
          } else {
            if (
              authMeRes.status === 403 ||
              authMeData?.code === "USER_DISABLED" ||
              (typeof authMeData?.message === "string" &&
                authMeData.message.toLowerCase().includes("disabled"))
            ) {
              await supabase.auth.signOut();
              setError(
                authMeData.message ||
                  "User account is disabled. Contact system administrator.",
              );
              setIsLoading(false);
              return;
            }
          }
        } catch (pErr) {
          console.warn("Backend /api/v1/auth/me profile sync notice:", pErr);
        }

        const userObj = {
          id: data.user.id,
          _id: userMongoId,
          name: userName,
          email: data.user.email,
          role: userRole,
          tenant: tenantInfo,
          permissions: permissions,
        };

        setSuccess(`Logged in successfully as ${userObj.name}!`);
        localStorage.setItem("user", JSON.stringify(userObj));
        if (tenantInfo) {
          localStorage.setItem("tenant", JSON.stringify(tenantInfo));
        }
        if (data.session?.access_token) {
          localStorage.setItem("token", data.session.access_token);
        }
        if (tenantInfo?.id || tenantInfo?._id) {
          localStorage.setItem("tenantId", tenantInfo.id || tenantInfo._id);
        }
        localStorage.setItem("userRole", userRole);
        localStorage.setItem("userName", userName);

        const roleNormalized = (userRole || "").toLowerCase();
        const targetRoute = roleNormalized.includes("designer")
          ? "/dashboard/designer"
          : roleNormalized.includes("admin")
            ? "/dashboard/admin"
            : roleNormalized.includes("manager")
              ? "/dashboard/manager"
              : roleNormalized.includes("data_operator") ||
                  roleNormalized.includes("data operator") ||
                  roleNormalized.includes("operator")
                ? "/dashboard/data-operator"
                : "/dashboard";

        setTimeout(() => {
          router.push(targetRoute);
        }, 500);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Could not connect to the Supabase authentication service.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError("");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/dashboard`
              : undefined,
        },
      });
      if (error) setError(error.message);
    } catch (err) {
      setError("Could not initiate Google login.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    try {
      setIsLoading(true);
      setError("");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "azure",
        options: {
          redirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/dashboard`
              : undefined,
        },
      });
      if (error) setError(error.message);
    } catch (err) {
      setError("Could not initiate Microsoft login.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError("Please enter your registered email address.");
      return;
    }
    setForgotLoading(true);
    setForgotError("");
    setForgotSuccess("");
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
        forgotEmail.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );
      if (resetErr) {
        setForgotError(resetErr.message);
      } else {
        setForgotSuccess(
          "Password reset link has been dispatched to your email.",
        );
      }
    } catch (err) {
      setForgotError("Failed to send reset link.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full relative flex items-center justify-center overflow-x-hidden selection:bg-[#F95721] selection:text-white">
      {/* Background Image with Newly Uploaded A2V Commercial Printing Studio */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: "url('/images/login-bg.jpg')",
        }}
      />
      {/* Balanced Contrast Overlay: Elegant dark tint on the left for text legibility while letting the vivid printing studio shine through */}
      <div className="absolute inset-0 bg-linear-to-r from-slate-950/85 via-slate-950/55 to-slate-950/30 pointer-events-none" />
      <div className="absolute inset-0 bg-linear-to-t from-slate-950/50 via-transparent to-black/20 pointer-events-none" />

      {/* Main Two-Column Layout Container */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 py-8 sm:py-12 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: HERO BRANDING, TYPOGRAPHY & 6 FEATURE TILES                 */}
        {/* ========================================================================= */}
        <div className="w-full lg:max-w-[580px] xl:max-w-[640px] text-left flex flex-col justify-center">
          {/* Brand Logo Header */}
          <div className="flex items-center gap-3.5 mb-7">
            <img
              src="/logo/A2V  Groups Logo.png"
              alt="A2V PRINTS"
              width={52}
              height={52}
              className="h-12 sm:h-14 w-auto object-contain filter drop-shadow-[0_4px_12px_rgba(249,87,33,0.35)]"
            />
            <div>
              <div className="text-2xl sm:text-4xl font-medium text-white tracking-tight leading-none">
                A2V PRINTS
              </div>
              <div className="text-[10px] sm:text-[11px] font-medium text-slate-300 tracking-[0.25em] uppercase mt-1">
                COMMERCIAL PRINTING CRM
              </div>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl xl:text-6xl font-medium text-white leading-[1.15] tracking-tight">
            <span>From Leads to Print.</span>
            <br />
            <span className="text-[#F95721]">All in One</span>{" "}
            <span>System</span>
            <span className="text-[#F95721]">.</span>
          </h1>

          {/* Subtitle / Description */}
          <p className="text-slate-300 text-sm sm:text-base font-normal leading-relaxed mt-4 max-w-xl">
            Manage leads, follow-ups, quotations, orders, payments and
            production — built for commercial printing businesses.
          </p>

        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: FLOATING CLEAN WHITE LOGIN CARD                             */}
        {/* ========================================================================= */}
        <div className="w-full max-w-[450px] sm:max-w-[480px]">
          <div className="w-full bg-white rounded-3xl p-7 sm:p-9 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] border border-slate-100 flex flex-col transition-all">
            {/* Top Center Logo inside Card */}
            <div className="flex items-center justify-center gap-3">
              <img
                src="/logo/A2V  Groups Logo.png"
                alt="A2V PRINTS"
                width={44}
                height={44}
                className="h-10 w-auto object-contain"
              />
              <div className="text-left">
                <div className="text-3xl font-medium text-slate-900 tracking-tight leading-none">
                  A2V PRINTS
                </div>
                <div className="text-[9px] font-bold text-slate-500 tracking-[0.22em] uppercase mt-1">
                  COMMERCIAL PRINTING CRM
                </div>
              </div>
            </div>

            {/* Welcome Back Heading */}
            <div className="text-center mt-5 mb-4">
              <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
                Welcome Back
              </h2>
              <p className="text-xs font-medium text-slate-500 mt-1">
                Login to your account to continue
              </p>
            </div>

            {/* Feedback Alerts */}
            {(error || success) && (
              <div className="w-full mb-3">
                {error && (
                  <div className="w-full bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 shadow-xs animate-fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="flex-1 font-medium">{error}</span>
                  </div>
                )}
                {success && (
                  <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 shadow-xs animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="flex-1 font-medium">{success}</span>
                  </div>
                )}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="flex flex-col">
              {/* Field 1: Employee ID / Email */}
              <div className="border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-3.5 bg-white focus-within:border-[#1864FF] focus-within:ring-3 focus-within:ring-blue-100 transition-all shadow-2xs">
                <User className="w-5 h-5 text-slate-400 shrink-0" />
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none">
                    Employee ID / Email
                  </label>
                  <input
                    type="email"
                    required
                    disabled={isLoading}
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none w-full bg-transparent mt-0.5"
                  />
                </div>
              </div>

              {/* Field 2: Password */}
              <div className="border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-3.5 bg-white focus-within:border-[#1864FF] focus-within:ring-3 focus-within:ring-blue-100 transition-all shadow-2xs mt-3.5">
                <Lock className="w-5 h-5 text-slate-400 shrink-0" />
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none">
                    Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={isLoading}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none w-full bg-transparent mt-0.5 tracking-wider"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer p-1"
                  tabIndex={-1}
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between mt-4">
                <label
                  onClick={() => setRememberMe(!rememberMe)}
                  className="flex items-center gap-2 cursor-pointer select-none group"
                >
                  <div
                    className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors ${
                      rememberMe
                        ? "bg-[#1864FF] border border-[#1864FF] text-white"
                        : "border border-slate-300 bg-white"
                    }`}
                  >
                    {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                    Remember me
                  </span>
                </label>
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-5 py-3.5 px-6 rounded-xl bg-[#1864FF] hover:bg-[#0d55e8] active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Login to CRM</span>
                  </>
                )}
              </button>

              {/* Security Access Box */}
              <div className="mt-5 bg-blue-50/80 border border-blue-100/90 rounded-xl p-3 flex items-start gap-2.5 text-left">
                <ShieldCheck className="w-5 h-5 text-[#1864FF] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 leading-snug">
                    Secure Access for A2V Prints Team Only
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                    All activities are tracked and monitored for better
                    performance.
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FORGOT PASSWORD MODAL                                                    */}
      {/* ========================================================================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => {
                setShowForgotModal(false);
                setForgotError("");
                setForgotSuccess("");
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1864FF] flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Reset Password
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your work email and we&apos;ll dispatch a password reset
                link.
              </p>
            </div>

            {forgotError && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-3 bg-white focus-within:border-[#1864FF] focus-within:ring-3 focus-within:ring-blue-100 transition-all">
                <User className="w-5 h-5 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block leading-none">
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="tanya@a2vprints.com"
                    className="text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none w-full bg-transparent mt-0.5"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 py-3 rounded-xl bg-[#1864FF] hover:bg-[#0d55e8] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                >
                  {forgotLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
