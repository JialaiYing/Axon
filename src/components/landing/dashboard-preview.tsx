import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function DashboardPreview() {
  return (
    <section className="px-6 pb-24">
      <ScrollReveal className="mx-auto max-w-5xl">
        <Card className="glass overflow-hidden p-2 shadow-[0_0_0_1px_rgba(59,130,246,0.15),0_8px_30px_-10px_rgba(59,130,246,0.35)]">
          <div className="rounded-md bg-surface/60 p-6">
            <div className="mb-4 flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: "Rank", value: "Scholar II" },
                { label: "Streak", value: "12 days" },
                { label: "Intervals", value: "34" },
                { label: "Productivity", value: "82%" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-md border border-border bg-card p-4">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-md border border-border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-muted">Weekly XP Progress</p>
                <p className="text-xs text-muted-foreground">Level 7</p>
              </div>
              <ProgressBar value={68} showLabel />
            </div>
          </div>
        </Card>
      </ScrollReveal>
    </section>
  );
}
