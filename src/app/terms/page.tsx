import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use — Axon",
  description: "Terms governing use of the Axon study productivity application.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-foreground">
      <Link href="/" className="text-sm text-accent hover:underline">
        ← Back to Axon
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Terms of Use</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: July 20, 2026</p>

      <div className="prose-invert mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-base font-semibold text-foreground">1. Acceptance</h2>
          <p>
            By accessing or using Axon (“the Service”), you agree to these Terms. If you do not
            agree, do not use the Service.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">2. The Service</h2>
          <p>
            Axon is a productivity tool for students. Core features work offline in your browser.
            Optional cloud sync requires an account via Supabase authentication.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">3. Accounts</h2>
          <p>
            You are responsible for credentials you create and for activity under your account.
            Provide accurate information. You must be old enough to form a binding contract in
            your jurisdiction (or have guardian consent).
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">4. Acceptable use</h2>
          <p>
            Do not misuse the Service: no unauthorized access, scraping that harms availability,
            malware, harassment, or illegal content. We may suspend accounts that violate these
            Terms.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">5. Your content</h2>
          <p>
            You retain ownership of study data you enter. You grant us a limited license to store
            and process that data solely to provide sync and the features you use.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">6. Disclaimer</h2>
          <p>
            The Service is provided “as is” without warranties of uninterrupted availability or
            fitness for a particular purpose. Study outcomes remain your responsibility.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">7. Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, Axon’s operators are not liable for indirect,
            incidental, or consequential damages arising from use of the Service.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">8. Changes</h2>
          <p>
            We may update these Terms. Continued use after changes constitutes acceptance of the
            revised Terms. Material changes will be noted by updating the date above.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">9. Contact</h2>
          <p>
            Questions about these Terms: use the contact channel published on the Axon project
            repository or site.
          </p>
        </section>
      </div>
    </main>
  );
}
