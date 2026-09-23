"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../lib/apiClient";

export default function GlobalSearchModal({ isOpen, onClose }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ customers: [], leads: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults({ customers: [], leads: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults({ customers: [], leads: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(
          `/api/v1/search?q=${encodeURIComponent(query.trim())}`,
        );
        if (res.success && res.data) {
          setResults(res.data);
        }
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-800 rounded-md w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800">
          <svg
            className="w-5 h-5 text-blue-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers, leads, phone numbers, CUS- / LEAD- numbers..."
            className="w-full bg-transparent text-white text-base placeholder-zinc-500 focus:outline-none"
          />
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 shrink-0"></div>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-zinc-800 border border-zinc-700 text-zinc-400 rounded">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1"
          >
            ✕
          </button>
        </div>

        {/* Search Results */}
        <div className="overflow-y-auto p-4 space-y-4">
          {query.trim().length >= 2 &&
            results.customers.length === 0 &&
            results.leads.length === 0 &&
            !loading && (
              <div className="text-center py-8 text-zinc-500 text-sm">
                No matching customers or leads found for &quot;{query}&quot;.
              </div>
            )}

          {/* Customers Group */}
          {results.customers.length > 0 && (
            <div>
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-2 mb-2 flex items-center gap-2">
                <svg
                  className="w-3.5 h-3.5 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Customers ({results.customers.length})
              </div>
              <div className="space-y-1">
                {results.customers.map((c) => (
                  <div
                    key={c._id}
                    onClick={() => {
                      onClose();
                      router.push(`/dashboard/customers/${c._id}`);
                    }}
                    className="p-3 bg-zinc-800/40 hover:bg-zinc-800 rounded-xl cursor-pointer transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-blue-400">
                          {c.customerNumber}
                        </span>
                        <span className="font-medium text-white">
                          {c.displayName}
                        </span>
                        {c.companyName && (
                          <span className="text-xs text-zinc-400">
                            ({c.companyName})
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        {c.phone} {c.email ? `• ${c.email}` : ""}
                      </div>
                    </div>
                    <span className="text-xs text-zinc-500 group-hover:text-blue-400 transition">
                      View Profile →
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leads Group */}
          {results.leads.length > 0 && (
            <div>
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-2 mb-2 flex items-center gap-2">
                <svg
                  className="w-3.5 h-3.5 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Leads / Inquiries ({results.leads.length})
              </div>
              <div className="space-y-1">
                {results.leads.map((l) => (
                  <div
                    key={l._id}
                    onClick={() => {
                      onClose();
                      router.push("/dashboard");
                    }}
                    className="p-3 bg-zinc-800/40 hover:bg-zinc-800 rounded-xl cursor-pointer transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-emerald-400">
                          {l.leadNumber}
                        </span>
                        <span className="font-medium text-white">
                          {l.contactName}
                        </span>
                        {l.businessName && (
                          <span className="text-xs text-zinc-400">
                            ({l.businessName})
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5 truncate max-w-md">
                        {l.requirement || l.phone}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-semibold bg-zinc-700/60 rounded text-zinc-300">
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
