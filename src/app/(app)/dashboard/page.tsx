import { LayoutDashboard } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function DashboardPage() {
  return (
    <PlaceholderPage
      title="Dashboard"
      description="Your productivity overview — rank, streaks, focus sessions, and activity."
      icon={LayoutDashboard}
      phaseLabel="Arriving in Phase 3"
    />
  );
}
