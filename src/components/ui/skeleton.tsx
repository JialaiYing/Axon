import { cn } from "@/lib/utils";

/**
 * A shimmering placeholder block. Never use a spinner where a Skeleton
 * can approximate the shape of the real content instead.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-surface",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/8 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

export function KanbanColumnSkeleton() {
  return (
    <div className="flex w-[300px] shrink-0 flex-col gap-3 md:w-[320px]">
      <div className="flex items-center justify-between px-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-6 rounded-md" />
      </div>
      <div className="flex flex-col gap-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-3.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-2 h-3 w-full" />
            <div className="mt-3 flex gap-1.5">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function KanbanBoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      <KanbanColumnSkeleton />
      <KanbanColumnSkeleton />
      <KanbanColumnSkeleton />
    </div>
  );
}