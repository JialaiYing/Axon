import type { LucideIcon } from "lucide-react";
import { AppPage } from "@/components/layout/app-page";
import { EmptyState } from "@/components/ui/empty-state";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  phaseLabel: string;
}

/**
 * Stays a server component and resolves `icon` into an element itself —
 * `AppPage`/`EmptyState` are client components, and a bare component
 * reference (unlike an already-rendered element) can't cross that boundary.
 */
export function PlaceholderPage({ title, description, icon: Icon, phaseLabel }: PlaceholderPageProps) {
  return (
    <AppPage title={title} description={description}>
      <EmptyState
        icon={<Icon className="h-5.5 w-5.5 text-muted" />}
        title={`${title} is coming soon`}
        description={phaseLabel}
      />
    </AppPage>
  );
}
