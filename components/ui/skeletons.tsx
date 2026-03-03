"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Skeleton for a single compact prediction row (matches new PredictionCard compact layout)
export function MatchListSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          {/* Home name + flag */}
          <div className="flex items-center gap-1.5 flex-1 justify-end">
            <div className="h-3 bg-muted rounded w-14 animate-pulse" />
            <div className="w-7 h-5 bg-muted rounded animate-pulse flex-shrink-0" />
          </div>
          {/* Score controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="h-9 w-9 bg-muted rounded-l-lg animate-pulse" />
            <div className="h-9 w-10 bg-muted animate-pulse" />
            <div className="h-9 w-9 bg-muted rounded-r-lg animate-pulse" />
            <div className="w-3 h-3 bg-muted rounded animate-pulse mx-0.5" />
            <div className="h-9 w-9 bg-muted rounded-l-lg animate-pulse" />
            <div className="h-9 w-10 bg-muted animate-pulse" />
            <div className="h-9 w-9 bg-muted rounded-r-lg animate-pulse" />
          </div>
          {/* Away flag + name */}
          <div className="flex items-center gap-1.5 flex-1">
            <div className="w-7 h-5 bg-muted rounded animate-pulse flex-shrink-0" />
            <div className="h-3 bg-muted rounded w-14 animate-pulse" />
          </div>
          {/* Save btn */}
          <div className="h-9 w-9 bg-muted rounded-lg animate-pulse flex-shrink-0" />
        </div>
        {/* Meta row */}
        <div className="flex justify-between mt-1.5">
          <div className="h-2.5 bg-muted rounded w-28 animate-pulse" />
          <div className="h-2.5 bg-muted rounded w-16 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export function MatchesListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="space-y-1.5">
      {[...Array(count)].map((_, i) => (
        <MatchListSkeleton key={i} />
      ))}
    </div>
  );
}

// Keep MatchCardSkeleton for potential card mode reuse
export function MatchCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="mb-3 space-y-1">
          <div className="h-3 bg-muted rounded w-16 animate-pulse" />
          <div className="h-3.5 bg-muted rounded w-28 animate-pulse" />
        </div>
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded w-24 animate-pulse" />
            </div>
            <div className="flex gap-1">
              <div className="h-9 w-9 bg-muted rounded-l-lg animate-pulse" />
              <div className="h-9 w-10 bg-muted animate-pulse" />
              <div className="h-9 w-9 bg-muted rounded-r-lg animate-pulse" />
            </div>
          </div>
          <div className="h-3 bg-muted rounded w-6 mx-auto animate-pulse" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded w-24 animate-pulse" />
            </div>
            <div className="flex gap-1">
              <div className="h-9 w-9 bg-muted rounded-l-lg animate-pulse" />
              <div className="h-9 w-10 bg-muted animate-pulse" />
              <div className="h-9 w-9 bg-muted rounded-r-lg animate-pulse" />
            </div>
          </div>
        </div>
        <div className="h-11 bg-muted rounded-lg animate-pulse" />
      </CardContent>
    </Card>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-1.5">
      {[...Array(rows)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl border animate-pulse"
        >
          <div className="w-7 h-5 bg-muted rounded flex-shrink-0" />
          <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-muted rounded w-28" />
            <div className="h-2.5 bg-muted rounded w-20" />
          </div>
          <div className="h-6 w-10 bg-muted rounded flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function LeaderboardSkeleton() {
  return <TableSkeleton rows={6} />;
}

export function AdminTableSkeleton() {
  return (
    <div className="space-y-1.5">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-lg border bg-card animate-pulse"
        >
          <div className="w-10 h-10 bg-muted rounded-full" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 bg-muted rounded w-36" />
            <div className="h-3 bg-muted rounded w-24" />
          </div>
          <div className="h-9 w-20 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

export function MatchesGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(count)].map((_, i) => (
        <MatchCardSkeleton key={i} />
      ))}
    </div>
  );
}
