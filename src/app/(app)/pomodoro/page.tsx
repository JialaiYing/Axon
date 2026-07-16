import { Timer } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function PomodoroPage() {
  return (
    <PlaceholderPage
      title="Pomodoro"
      description="Timed focus intervals with custom durations and session history."
      icon={Timer}
      phaseLabel="Arriving in Phase 5"
    />
  );
}
