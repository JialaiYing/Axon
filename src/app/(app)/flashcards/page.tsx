"use client";

import { AppPage } from "@/components/layout/app-page";
import { FlashcardsSection } from "@/components/flashcards/flashcards-section";

export default function FlashcardsPage() {
  return (
    <AppPage
      title="Flashcards"
      feature="flashcards"
    >
      <FlashcardsSection />
    </AppPage>
  );
}
