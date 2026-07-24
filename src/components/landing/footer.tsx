import Link from "next/link";
import { AxonLogo } from "@/components/brand/axon-logo";
import {
  LandingContainer,
  landingFocusRingClassName,
} from "@/components/landing/landing-primitives";
import { cn } from "@/lib/utils";

export function Footer() {
  const year = new Date().getFullYear();

  const linkClass = cn(
    "text-sm text-muted-foreground transition-colors hover:text-foreground rounded-md",
    landingFocusRingClassName
  );

  return (
    <footer className="relative border-t border-border/60 bg-background py-12 md:py-14">
      <LandingContainer>
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <Link
              href="/"
              aria-label="Axon home"
              className={cn(
                "inline-flex rounded-md transition-opacity hover:opacity-80",
                landingFocusRingClassName
              )}
            >
              <AxonLogo
                withWordmark
                iconClassName="h-7 w-7"
                wordmarkClassName="text-sm font-medium text-foreground"
              />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              A distraction-free study command center. Free account required —
              synced automatically across your devices.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-10">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
                Product
              </p>
              <ul className="mt-3 space-y-2.5">
                <li>
                  <Link href="/#how-it-works" className={linkClass}>
                    How it works
                  </Link>
                </li>
                <li>
                  <Link href="/#progress" className={linkClass}>
                    Progress
                  </Link>
                </li>
                <li>
                  <Link href="/#trust" className={linkClass}>
                    Principles
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
                Account
              </p>
              <ul className="mt-3 space-y-2.5">
                <li>
                  <Link href="/login" className={linkClass}>
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link href="/login?mode=signup" className={linkClass}>
                    Get started
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className={linkClass}>
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
                Legal
              </p>
              <ul className="mt-3 space-y-2.5">
                <li>
                  <Link href="/terms" className={linkClass}>
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className={linkClass}>
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Axon. Built for focus.</p>
          <p>Free account · synced automatically</p>
        </div>
      </LandingContainer>
    </footer>
  );
}
