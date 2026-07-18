import { PageHeader } from "@/components/layout/page-header";
import { FlashcardsSection } from "@/components/flashcards/flashcards-section";

export default function FlashcardsPage() {
  return (
    <div>
      <PageHeader
        title="Flashcards"
        description="Build sets, review, and track mastery across every subject."
      />
      <FlashcardsSection />
    </div>
  );
}
