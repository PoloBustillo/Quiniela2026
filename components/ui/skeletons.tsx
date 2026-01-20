"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function MatchCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 sm:p-4 md:p-6">
        {/* Match Header */}
        <div className="mb-3 sm:mb-4">
          <div className="h-3 bg-muted rounded w-20 mb-1 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
        </div>

        {/* Teams and Scores */}
        <div className="space-y-3 sm:space-y-4 mb-4">
          {/* Home Team */}
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-md animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-24 sm:w-32 animate-pulse"></div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="h-11 w-11 bg-muted rounded-lg animate-pulse"></div>
              <div className="h-11 w-14 bg-muted rounded-lg animate-pulse"></div>
              <div className="h-11 w-11 bg-muted rounded-lg animate-pulse"></div>
            </div>
          </div>

          {/* VS Separator */}
          <div className="flex items-center justify-center">
            <div className="h-3 w-8 bg-muted rounded animate-pulse"></div>
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-md animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-24 sm:w-32 animate-pulse"></div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="h-11 w-11 bg-muted rounded-lg animate-pulse"></div>
              <div className="h-11 w-14 bg-muted rounded-lg animate-pulse"></div>
              <div className="h-11 w-11 bg-muted rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Stadium Info */}
        <div className="h-3 bg-muted rounded w-full mb-3 sm:mb-4 animate-pulse"></div>

        {/* Save Button */}
        <div className="h-11 sm:h-12 bg-muted rounded-lg animate-pulse"></div>
      </CardContent>
    </Card>
  );
}

export function MatchListSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-2 sm:p-3">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Teams */}
          <div className="flex items-center gap-1.5 flex-1">
            <div className="h-3 bg-muted rounded w-16 animate-pulse"></div>
            <div className="w-8 h-8 bg-muted rounded-md animate-pulse"></div>
          </div>

          {/* Scores */}
          <div className="flex items-center gap-1">
            <div className="h-9 w-9 bg-muted rounded-lg animate-pulse"></div>
            <div className="h-9 w-11 bg-muted rounded-lg animate-pulse"></div>
            <div className="h-9 w-9 bg-muted rounded-lg animate-pulse"></div>
            <div className="h-3 w-2 bg-muted rounded animate-pulse"></div>
            <div className="h-9 w-9 bg-muted rounded-lg animate-pulse"></div>
            <div className="h-9 w-11 bg-muted rounded-lg animate-pulse"></div>
            <div className="h-9 w-9 bg-muted rounded-lg animate-pulse"></div>
          </div>

          {/* Away Team */}
          <div className="flex items-center gap-1.5 flex-1">
            <div className="w-8 h-8 bg-muted rounded-md animate-pulse"></div>
            <div className="h-3 bg-muted rounded w-16 animate-pulse"></div>
          </div>

          {/* Save Button */}
          <div className="h-9 w-12 bg-muted rounded animate-pulse"></div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg border animate-pulse">
          <div className="w-10 h-10 bg-muted rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
          <div className="h-8 w-20 bg-muted rounded"></div>
        </div>
      ))}
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
              <div className="w-10 h-10 bg-muted rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                <div className="h-3 bg-muted rounded w-24 animate-pulse"></div>
              </div>
              <div className="text-right space-y-2">
                <div className="h-6 bg-muted rounded w-16 animate-pulse"></div>
                <div className="h-3 bg-muted rounded w-12 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminTableSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-card animate-pulse">
          <div className="w-10 h-10 bg-muted rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-48"></div>
            <div className="h-3 bg-muted rounded w-32"></div>
          </div>
          <div className="h-9 w-24 bg-muted rounded"></div>
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

export function MatchesListSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {[...Array(count)].map((_, i) => (
        <MatchListSkeleton key={i} />
      ))}
    </div>
  );
}
