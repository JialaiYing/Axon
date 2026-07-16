import { Settings } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      description="Preferences and configuration for your Axon workspace."
      icon={Settings}
      phaseLabel="Not yet scheduled"
    />
  );
}
