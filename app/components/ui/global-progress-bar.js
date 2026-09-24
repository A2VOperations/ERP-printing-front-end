"use client";

import React, { useEffect, useState, useRef } from "react";
import { subscribeToApiLoading } from "@/lib/api";
import { Loader2, ArrowUpRight, CheckCircle2 } from "lucide-react";

/**
 * Global Top-Edge Progress Bar & Request Buffering Indicator
 *
 * Provides instant, silky-smooth visual feedback whenever ANY API request
 * is flying between the client and server.
 */
export default function GlobalProgressBar() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [currentMethod, setCurrentMethod] = useState("GET");
  const [activeCount, setActiveCount] = useState(0);
  const progressTimerRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeToApiLoading((state) => {
      setActiveCount(state.activeRequests);
      if (state.currentMethod) {
        setCurrentMethod(state.currentMethod);
      }

      if (state.isLoading) {
        setLoading(true);
        setVisible(true);

        // Smooth incremental progress simulation
        if (!progressTimerRef.current) {
          setProgress((prev) => (prev === 0 ? 15 : prev));
          progressTimerRef.current = setInterval(() => {
            setProgress((old) => {
              if (old < 40) return old + 12;
              if (old < 70) return old + 6;
              if (old < 88) return old + 2;
              return old; // Cap at 88% while waiting for network
            });
          }, 200);
        }
      } else {
        // Complete the bar
        if (progressTimerRef.current) {
          clearInterval(progressTimerRef.current);
          progressTimerRef.current = null;
        }

        setProgress(100);
        setLoading(false);

        // Fade out
        const hideTimeout = setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, 350);

        return () => clearTimeout(hideTimeout);
      }
    });

    return () => {
      unsubscribe();
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  const getActionLabel = (method) => {
    switch (method) {
      case "POST":
        return "Saving data...";
      case "PUT":
      case "PATCH":
        return "Updating record...";
      case "DELETE":
        return "Removing item...";
      case "GET":
      default:
        return "Loading data...";
    }
  };

  const getActionAccent = (method) => {
    switch (method) {
      case "POST":
        return "from-emerald-500 via-teal-400 to-emerald-300";
      case "DELETE":
        return "from-rose-500 via-pink-400 to-rose-300";
      case "PUT":
      case "PATCH":
        return "from-amber-500 via-orange-400 to-amber-300";
      case "GET":
      default:
        return "from-blue-600 via-cyan-400 to-indigo-400";
    }
  };

  return (
    <>
      {/* 1. Top Edge Neon Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <div className="h-[3px] w-full bg-transparent overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${getActionAccent(currentMethod)} shadow-[0_0_12px_rgba(59,130,246,0.8)] transition-all duration-300 ease-out`}
            style={{
              width: `${progress}%`,
              transitionProperty: "width",
            }}
          />
        </div>
      </div>

      {/* 2. Floating Live Activity Pill (Bottom-Right) */}
      {visible && (
        <div className="fixed bottom-5 right-5 z-[9998] pointer-events-none animate-fade-in">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/95 text-slate-800 border border-slate-200 shadow-xl backdrop-blur-md text-xs font-semibold tracking-normal">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
            </span>

            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />

            <span className="text-slate-800">
              {getActionLabel(currentMethod)}
            </span>

            {activeCount > 1 && (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] text-slate-600 font-semibold border border-slate-200">
                {activeCount}
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
