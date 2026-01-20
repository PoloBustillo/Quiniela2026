import { LeaderboardSkeleton } from "@/components/ui/skeletons";
import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-10 bg-muted rounded w-64 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-96 animate-pulse"></div>
        </div>
        <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
      </div>

      {/* Phase Selector Skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
        <div className="h-9 bg-muted rounded w-64 animate-pulse"></div>
      </div>

      {/* Leaderboard Table Skeleton */}
      <LeaderboardSkeleton />
    </div>
  );
}
