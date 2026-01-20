import { AdminTableSkeleton } from "@/components/ui/skeletons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-10 bg-muted rounded w-64 animate-pulse"></div>
        <div className="h-4 bg-muted rounded w-96 animate-pulse"></div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2 border-b">
        <div className="h-10 bg-muted rounded-t w-40 animate-pulse"></div>
        <div className="h-10 bg-muted rounded-t w-40 animate-pulse"></div>
        <div className="h-10 bg-muted rounded-t w-40 animate-pulse"></div>
      </div>

      {/* Content Skeleton */}
      <Card>
        <CardHeader className="space-y-3">
          <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <AdminTableSkeleton />
        </CardContent>
      </Card>
    </div>
  );
}
