"use client";

import React from "react";

/**
 * Base Shimmer Primitive (Light Theme)
 */
export function Skeleton({ className = "", ...props }) {
  return (
    <div
      className={`bg-slate-200/75 shimmer-mask rounded-md ${className}`}
      {...props}
    />
  );
}

/**
 * Metric Card Skeleton (for dashboard KPI summaries)
 */
export function MetricCardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 shimmer-mask"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-36 rounded" />
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Card Grid Skeleton (for order cards, design project cards, product cards)
 */
export function CardGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4 shimmer-mask"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-28 rounded" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-44 rounded" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <Skeleton className="h-5 w-24 rounded" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Table Skeleton (for customer lists, order tables, quotation lists, leads tables)
 */
export function TableSkeleton({ rows = 6, columns = 6 }) {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      {/* Table Header */}
      <div className="bg-slate-50/90 border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
        {Array.from({ length: columns }).map((_, idx) => (
          <Skeleton key={idx} className="h-4 w-24 rounded bg-slate-300/80" />
        ))}
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div
            key={rIdx}
            className="px-6 py-4 flex items-center justify-between gap-4 shimmer-mask hover:bg-slate-50/50"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </div>
            <Skeleton className="h-4 w-28 rounded hidden sm:block" />
            <Skeleton className="h-4 w-24 rounded hidden md:block" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-24 rounded hidden lg:block" />
            <div className="flex items-center gap-2 justify-end">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Table Pagination Footer */}
      <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <Skeleton className="h-4 w-36 rounded" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/**
 * Sales Funnel Skeleton (Light Theme)
 */
export function FunnelSkeleton() {
  const widths = ["w-full", "w-[85%]", "w-[70%]", "w-[55%]", "w-[40%]"];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 shimmer-mask">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-44 rounded" />
        <Skeleton className="h-4 w-24 rounded" />
      </div>

      <div className="space-y-3 pt-2">
        {widths.map((w, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-3.5 w-12 rounded" />
            </div>
            <div className="h-7 bg-slate-100 rounded-lg overflow-hidden">
              <div className={`h-full bg-slate-200/80 ${w} rounded-lg`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Activity Feed Skeleton (Light Theme)
 */
export function ActivityFeedSkeleton({ count = 5 }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-36 rounded" />
        <Skeleton className="h-4 w-16 rounded" />
      </div>

      <div className="space-y-4 pt-1">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="flex items-start gap-3.5 shimmer-mask">
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
            <Skeleton className="h-3 w-14 rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Full Dashboard Skeleton (Light Theme)
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full animate-fade-in">
      {/* Top Greeting Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64 rounded-lg" />
          <Skeleton className="h-4 w-80 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>

      {/* Primary KPI Row Skeleton */}
      <MetricCardSkeleton count={4} />

      {/* Target Progress Banner Skeleton */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 shimmer-mask">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-48 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-3.5 w-36 rounded" />
          <Skeleton className="h-3.5 w-28 rounded" />
        </div>
      </div>

      {/* Split Section: Funnel + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FunnelSkeleton />
        </div>
        <div>
          <ActivityFeedSkeleton count={5} />
        </div>
      </div>

      {/* Bottom Table Skeleton */}
      <TableSkeleton rows={4} columns={5} />
    </div>
  );
}
