import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/landing-nav";
import { SmoothScroll } from "@/components/landing/smooth-scroll";
import { FAQContent } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about Axon — local-first study dashboard, accounts, sync, and AI.",
};

export default function FAQPage() {
  return (
    <div className="relative min-h-screen bg-black">
      <SmoothScroll />
      <div className="relative z-10">
        <LandingNav />
        <main className="px-6 py-24 md:py-28">
          <div className="mx-auto max-w-6xl">
            <h1 className="font-display max-w-xl text-left text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Frequently Asked Questions
            </h1>
            <div className="mt-12 max-w-2xl md:mt-14">
              <FAQContent />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
