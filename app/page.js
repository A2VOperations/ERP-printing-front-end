"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { User, Lock, Check, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { API_BASE_URL } from "../lib/apiConfig";

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

  // Check if user is already logged in or has saved rememberMe email
  useEffect(() => {
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
          if (authMeRes.ok) {
            const authMeData = await authMeRes.json();
            if (authMeData.success && authMeData.data) {
              const u = authMeData.data.user;
              if (u.role) userRole = u.role;
              if (u.name) userName = u.name;
              if (u.id) userMongoId = u.id;
              tenantInfo = authMeData.data.tenant;
              permissions = authMeData.data.permissions || [];
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

  return (
    <main
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 relative select-none overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 50% 38%, #194e58 0%, #11363f 38%, #092026 75%, #06161b 100%)",
      }}
    >
      {/* Ambient Lighting Orbs for Glass Refraction */}
      <div className="absolute w-[460px] h-[460px] rounded-full bg-teal-400/15 blur-[120px] -top-24 -left-20 pointer-events-none" />
      <div className="absolute w-[520px] h-[520px] rounded-full bg-cyan-500/15 blur-[140px] -bottom-28 -right-24 pointer-events-none" />
      <div className="absolute w-[360px] h-[360px] rounded-full bg-emerald-400/10 blur-[100px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Central Login Wrapper */}
      <div className="w-full max-w-[370px] sm:max-w-[400px] flex flex-col items-center z-10">
        
        {/* Brand Logo */}
        <div className="mb-4 flex items-center justify-center">
          <Image
            src="/logo/A2V  Groups Logo.png"
            alt="A2V Groups Logo"
            width={170}
            height={55}
            priority
            style={{ width: "auto", height: "auto" }}
            className="object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
          />
        </div>

        {/* Mockup Heading: USER LOGIN */}
        <h1 className="text-white text-xl sm:text-2xl font-light tracking-[0.28em] text-center mb-6 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
          USER LOGIN
        </h1>

        {/* Feedback Alerts */}
        {(error || success) && (
          <div className="w-full mb-3">
            {error && (
              <div className="w-full bg-[#1b0d12]/80 backdrop-blur-md border border-rose-500/50 text-rose-200 text-xs px-3.5 py-2.5 rounded-sm flex items-center gap-2 shadow-lg animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="flex-1">{error}</span>
              </div>
            )}
            {success && (
              <div className="w-full bg-[#0a1e16]/80 backdrop-blur-md border border-emerald-500/50 text-emerald-200 text-xs px-3.5 py-2.5 rounded-sm flex items-center gap-2 shadow-lg animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="flex-1">{success}</span>
              </div>
            )}
          </div>
        )}

        {/* Main Card Container with Glassmorphism */}
        <div className="w-full bg-[#0e2127]/65 backdrop-blur-xl border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.18)] p-6 sm:p-9 rounded-sm transition-all">
          <form onSubmit={handleLoginSubmit} className="flex flex-col">
            
            {/* Field 1: Email ID (Frosted Glass Finish) */}
            <div className="flex items-stretch w-full h-12 mb-3.5 rounded-none overflow-hidden border border-white/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]">
              <div className="w-13 bg-[#e2e4e6]/90 backdrop-blur-md flex items-center justify-center shrink-0 border-r border-[#c2c5c8]">
                <User className="w-5 h-5 text-[#2b3a3f] fill-[#2b3a3f]" />
              </div>
              <input
                type="email"
                required
                disabled={isLoading}
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Email ID"
                className="flex-1 bg-[#d0d5d8]/85 backdrop-blur-md px-3.5 text-sm font-medium text-[#152327] placeholder:text-[#53656d] focus:bg-[#e4e7ea]/95 focus:ring-1 focus:ring-teal-400/50 focus:outline-none transition-all"
              />
            </div>

            {/* Field 2: Password (Frosted Glass Finish) */}
            <div className="flex items-stretch w-full h-12 mb-4 rounded-none overflow-hidden border border-white/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]">
              <div className="w-13 bg-[#e2e4e6]/90 backdrop-blur-md flex items-center justify-center shrink-0 border-r border-[#c2c5c8]">
                <Lock className="w-5 h-5 text-[#2b3a3f] fill-[#2b3a3f]" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                disabled={isLoading}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Password"
                className="flex-1 bg-[#d0d5d8]/85 backdrop-blur-md px-3.5 text-sm font-medium text-[#152327] placeholder:text-[#53656d] focus:bg-[#e4e7ea]/95 focus:ring-1 focus:ring-teal-400/50 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="bg-[#d0d5d8]/85 backdrop-blur-md px-3 flex items-center justify-center text-[#53656d] hover:text-[#152327] transition-colors focus:outline-none cursor-pointer"
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
            <div className="flex items-center justify-between mb-6 text-xs text-[#a1b8be]">
              <label
                onClick={() => setRememberMe(!rememberMe)}
                className="flex items-center gap-2 cursor-pointer select-none group"
              >
                <div
                  className={`w-3.5 h-3.5 flex items-center justify-center rounded-[1px] transition-colors ${
                    rememberMe
                      ? "bg-[#09161a]/90 border border-teal-500/50 shadow-xs"
                      : "bg-[#09161a]/60 border border-white/15"
                  }`}
                >
                  {rememberMe && (
                    <Check className="w-3 h-3 text-[#589ba7] stroke-[3]" />
                  )}
                </div>
                <span className="text-[#a1b8be] group-hover:text-white transition-colors">
                  Remember me
                </span>
              </label>
            </div>

            {/* LOGIN Button with Glass Highlight */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11.5 bg-gradient-to-r from-[#4c7e87]/95 to-[#427078]/95 hover:from-[#58929c] hover:to-[#4a7e87] active:scale-[0.99] text-white font-bold tracking-[0.22em] text-xs sm:text-sm uppercase transition-all shadow-[0_8px_24px_rgba(35,115,130,0.35),inset_0_1px_1px_rgba(255,255,255,0.25)] border border-white/20 flex items-center justify-center cursor-pointer rounded-none disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>SIGNING IN...</span>
                </div>
              ) : (
                "LOGIN"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
