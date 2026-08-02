import { Suspense } from "react";
import { FlashcardsSection } from "@/components/flashcards/flashcards-section";
import { Skeleton } from "@/components/ui/skeleton";

export default function FlashcardsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 p-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-md" />
        </div>
      }
    >
      <FlashcardsSection />
    </Suspense>
  );
}
