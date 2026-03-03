import { LeaderboardSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-3 py-3 space-y-3 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-6 bg-muted rounded w-44 animate-pulse" />
          <div className="h-3 bg-muted rounded w-24 animate-pulse" />
        </div>
        <div className="h-6 bg-muted rounded-full w-10 animate-pulse" />
      </div>

      {/* Phase filter chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {[60, 52, 52, 56, 48, 44, 40].map((w, i) => (
          <div
            key={i}
            className={`h-7 bg-muted rounded-full flex-shrink-0 animate-pulse`}
            style={{ width: w }}
          />
        ))}
      </div>

      {/* Leaderboard rows */}
      <LeaderboardSkeleton />
    </div>
  );
}
