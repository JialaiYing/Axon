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

/** Grid-first calendar chrome: month grid + quiet side rail. */
export function CalendarSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-7 border-b border-border bg-surface/60 px-2 py-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="mx-auto h-3 w-8" />
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="min-h-[7.5rem] border-b border-r border-border p-1.5">
              <Skeleton className="mb-2 h-5 w-5 rounded-full" />
              {i % 4 !== 0 && <Skeleton className="mb-1 h-4 w-full rounded-md" />}
              {i % 5 === 0 && <Skeleton className="h-4 w-4/5 rounded-md" />}
            </div>
          ))}
        </div>
      </div>
      <div className="hidden flex-col gap-4 lg:flex">
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-2 h-3 w-36" />
          </div>
          <div className="space-y-3 px-4 py-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-2.5">
                <Skeleton className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between px-4 py-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}