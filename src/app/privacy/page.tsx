import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Axon",
  description: "How Axon collects, stores, and protects personal and study data.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-foreground">
      <Link href="/" className="text-sm text-accent hover:underline">
        ← Back to Axon
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: July 21, 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-base font-semibold text-foreground">1. Overview</h2>
          <p>
            Axon requires an account to use the dashboard. Objectives, timers, flashcards, and
            progress sync to your account via Supabase so you can continue across devices.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">2. Data we process</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong className="text-foreground">Account data</strong>: email,
              authentication identifiers, optional display name — via Supabase Auth.
            </li>
            <li>
              <strong className="text-foreground">Study data</strong>: objectives,
              sessions, flashcards, goals, and progress payloads associated with your user id.
            </li>
            <li>
              <strong className="text-foreground">Local preferences</strong>: theme, Focus Mode
              settings, onboarding state — stored on-device.
            </li>
            <li>
              <strong className="text-foreground">Technical logs</strong>: standard web server and
              auth rate-limit metadata (e.g. IP for abuse prevention on login endpoints).
            </li>
          </ul>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">3. How we use data</h2>
          <p>
            To provide the Service, authenticate you, sync your study data across devices you
            choose, prevent abuse (rate limiting), and improve reliability. We do not sell personal
            data.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">4. Access controls</h2>
          <p>
            Cloud tables use Supabase Row Level Security so each authenticated user can only
            select/insert/update/delete their own rows (`auth.uid() = user_id`). Sharing a URL to
            an Axon page does not grant access to another user&apos;s data.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">5. Retention</h2>
          <p>
            Local data remains until you clear browser storage or sign out (sign-out clears
            synced study data from that browser). Cloud data persists while your account exists.
            Day-to-day deletes (objectives, flashcard sets, etc.) are pushed to the cloud via sync
            tombstones so other devices drop the same rows. You can permanently delete your account
            from Settings → Delete account; that removes your auth user, cascaded cloud table rows,
            and flashcard images stored under your user id (requires a properly configured
            deployment with a server-only service role key).
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">6. Third parties</h2>
          <p>
            Authentication and sync use Supabase. Google OAuth may be offered; Google&apos;s
            own policies apply to that sign-in flow. Browser notification permission is controlled
            by your OS/browser.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">7. Children</h2>
          <p>
            Axon is intended for students. If you are under the age of digital consent in your
            region, obtain a parent/guardian&apos;s permission before creating an account.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">8. Your rights</h2>
          <p>
            Depending on your region (e.g. GDPR/CCPA), you may request access, correction, or
            deletion of personal data. Use Settings → Delete account for self-serve deletion, or
            contact the project maintainers with your account email.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">9. Changes</h2>
          <p>
            We may update this Policy. The “Last updated” date will change when we do. Continued
            use constitutes acceptance of the revised Policy.
          </p>
        </section>
      </div>
    </main>
  );
}
