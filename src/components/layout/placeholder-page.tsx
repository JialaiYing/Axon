import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  phaseLabel: string;
}

export function PlaceholderPage({
  title,
  description,
  icon: Icon,
  phaseLabel,
}: PlaceholderPageProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border/40 bg-surface/20 backdrop-blur-sm">
          <Icon className="h-6 w-6 text-muted" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{title} is coming soon</p>
          <p className="mt-1 text-xs text-muted-foreground">{phaseLabel}</p>
        </div>
      </div>
    </div>
  );
}
