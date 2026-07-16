import { Target } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function GoalsPage() {
  return (
    <PlaceholderPage
      title="Goals"
      description="Daily targets, weekly goals, and progress toward each deadline."
      icon={Target}
      phaseLabel="Arriving in Phase 7"
    />
  );
}
