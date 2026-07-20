import Link from "next/link";
import { Zap } from "lucide-react";
import { NAV_ITEMS } from "@/constants/navigation";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border bg-background/92 px-6 py-12 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent">
                <Zap className="h-4 w-4 text-accent-foreground" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-semibold tracking-tight">Axon</span>
            </div>
            <p className="mt-3 text-sm text-muted">
              A local-first study dashboard with optional cloud sync. Built for focus —
              not distraction.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Product
              </p>
              <ul className="mt-3 space-y-2">
                {NAV_ITEMS.filter((item) => !item.disabled).map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Explore
              </p>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="#why-axon" className="text-sm text-muted transition-colors hover:text-foreground">
                    Why Axon
                  </Link>
                </li>
                <li>
                  <Link href="#how-it-works" className="text-sm text-muted transition-colors hover:text-foreground">
                    How it works
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-sm text-muted transition-colors hover:text-foreground">
                    Login
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Legal
              </p>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/terms" className="text-sm text-muted transition-colors hover:text-foreground">
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm text-muted transition-colors hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Axon. Built for focus.</p>
          <p>Offline-first by default · optional Supabase sync</p>
        </div>
      </div>
    </footer>
  );
}
