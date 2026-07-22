import Link from "next/link";
import { AxonLogo } from "@/components/brand/axon-logo";
import { NAV_ITEMS } from "@/constants/navigation";

export function Footer() {
  const year = new Date().getFullYear();

  const linkClass =
    "text-sm text-white/55 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm";

  return (
    <footer className="relative border-t border-white/10 bg-black px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <Link
              href="/"
              aria-label="Axon home"
              className="inline-flex rounded-sm transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <AxonLogo
                withWordmark
                iconClassName="h-7 w-7"
                wordmarkClassName="text-sm text-white"
              />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-white/55">
              A study dashboard that syncs to your account. Built for focus — not
              distraction.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">
                Product
              </p>
              <ul className="mt-3 space-y-2">
                {NAV_ITEMS.filter((item) => !item.disabled).map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={linkClass}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">
                Explore
              </p>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/faq" className={linkClass}>
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/#how-it-works" className={linkClass}>
                    How it works
                  </Link>
                </li>
                <li>
                  <Link href="/login" className={linkClass}>
                    Login
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">
                Legal
              </p>
              <ul className="mt-3 space-y-2">
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

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Axon. Built for focus.</p>
          <p>Account required · cloud sync via Supabase</p>
        </div>
      </div>
    </footer>
  );
}
