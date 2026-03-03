import { MatchesListSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-3 py-3 space-y-3 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-1">
        <div className="h-6 bg-muted rounded w-40 animate-pulse" />
        <div className="h-3 bg-muted rounded w-48 animate-pulse" />
      </div>

      {/* View toggle pill */}
      <div className="h-9 bg-muted rounded-lg animate-pulse" />

      {/* Section header */}
      <div className="flex items-center gap-2 py-1">
        <div className="h-3.5 w-3.5 bg-muted rounded animate-pulse" />
        <div className="h-3.5 bg-muted rounded w-36 animate-pulse" />
        <div className="ml-auto h-3 bg-muted rounded w-6 animate-pulse" />
      </div>

      {/* Match rows */}
      <MatchesListSkeleton count={8} />
    </div>
  );
}
