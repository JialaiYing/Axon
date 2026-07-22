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
    <div className="flex h-full w-full min-w-0 flex-col gap-3.5 rounded-xl border border-border bg-surface/50 p-3">
      <div className="flex items-center justify-between px-1 pt-0.5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-7 rounded-md" />
      </div>
      <div className="flex flex-col gap-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-2 h-3 w-full" />
            <div className="mt-3 flex gap-1.5">
              <Skeleton className="h-5 w-14 rounded-pill" />
              <Skeleton className="h-5 w-16 rounded-pill" />
            </div>
            <Skeleton className="mt-3 h-1.5 w-full rounded-pill" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function KanbanBoardSkeleton() {
  return (
    <div className="grid w-full grid-flow-col auto-cols-[minmax(280px,1fr)] gap-5 overflow-x-auto pb-4 lg:grid-flow-row lg:grid-cols-3">
      <KanbanColumnSkeleton />
      <KanbanColumnSkeleton />
      <KanbanColumnSkeleton />
    </div>
  );
}

export function ObjectivePickerSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3">
          <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-2/3" />
            <div className="mt-2 flex gap-1.5">
              <Skeleton className="h-5 w-14 rounded-pill" />
              <Skeleton className="h-5 w-16 rounded-pill" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}