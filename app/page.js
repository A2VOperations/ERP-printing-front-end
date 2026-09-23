'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

import { API_BASE_URL } from '../lib/apiConfig';

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Check if user is already logged in on mount
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Supabase Auth Login
      const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (supabaseError) {
        setError(supabaseError.message || 'Invalid login credentials.');
        return;
      }

      if (data?.user) {
        let userRole = data.user.user_metadata?.role || 'employee';
        let userName = data.user.user_metadata?.name || data.user.email.split('@')[0];
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
          console.warn('Backend /api/v1/auth/me profile sync notice:', pErr);
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
        localStorage.setItem('user', JSON.stringify(userObj));
        if (tenantInfo) {
          localStorage.setItem('tenant', JSON.stringify(tenantInfo));
        }
        if (data.session?.access_token) {
          localStorage.setItem('token', data.session.access_token);
        }
        if (tenantInfo?.id || tenantInfo?._id) {
          localStorage.setItem('tenantId', tenantInfo.id || tenantInfo._id);
        }
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('userName', userName);
        setTimeout(() => {
          router.push('/dashboard');
        }, 500);

      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Could not connect to the Supabase authentication service.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col flex-1 items-center justify-center min-h-screen bg-slate-50 px-4 py-12 font-sans text-slate-800">

      {/* Container Card */}
      <div className="w-full max-w-105 flex flex-col items-center">

        {/* Brand Header */}
        <div className="flex items-center gap-2.5 mb-6 select-none">
          <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-sky-600/20">
            A2V
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight uppercase leading-none text-slate-900">
              A2V CRM
            </span>
            <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-1">
              Outbound Calling Console
            </span>
          </div>
        </div>

        {/* Feedback Messages */}
        <div className="w-full min-h-11 mb-3">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs font-semibold text-rose-700 text-center flex items-center justify-center gap-2 shadow-sm animate-fade-in">
              <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs font-semibold text-emerald-700 text-center flex items-center justify-center gap-2 shadow-sm animate-fade-in">
              <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </div>
          )}
        </div>

        {/* Login Card */}
        <div className="w-full bg-white border border-slate-200/80 shadow-xl shadow-slate-100/60 rounded-2xl p-5 sm:p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Welcome back</h2>
            <p className="text-xs text-slate-500 mb-6 font-semibold">Sign in with your assigned Supabase Auth credentials</p>

            <form className="flex flex-col gap-4 w-full" onSubmit={handleLoginSubmit}>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">Email Address / User ID</label>
                <input
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/10 outline-none transition-all"
                  placeholder="user@company.com"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase pl-0.5">Password</label>
                <input
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/10 outline-none transition-all"
                  placeholder="••••••••"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-4 w-full h-11 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-xs font-bold text-white shadow-md shadow-sky-600/20 cursor-pointer transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : "Sign In to CRM"}
              </button>
            </form>
          </div>

          <div className="text-center mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              SUPABASE AUTHENTICATION ONLY
            </span>
          </div>
        </div>

      </div>
    </main>
  );
}
