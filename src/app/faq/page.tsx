import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/landing-nav";
import { SmoothScroll } from "@/components/landing/smooth-scroll";
import { FAQContent } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about Axon — study dashboard, accounts, sync, and AI.",
};

export default function FAQPage() {
  return (
    <div data-theme="dark" className="relative min-h-screen bg-background text-foreground">
      <SmoothScroll />
      <div className="relative z-10">
        <LandingNav />
        <main className="px-6 py-24 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Frequently Asked Questions
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
              Straight answers about accounts, sync, AI, and how Axon keeps your study data safe.
            </p>
            <div className="mt-12 text-left md:mt-14">
              <FAQContent />
            </div>
          </div>
        </main>
        <Footer />
      </div>
      <div aria-hidden className="grain-overlay !z-20" />
    </div>
  );
}
