import { LandingNav } from "@/components/landing/landing-nav";
import { SmoothScroll } from "@/components/landing/smooth-scroll";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ProgressMotivation } from "@/components/landing/progress-motivation";
import { Trust } from "@/components/landing/trust";
import { FAQPreview } from "@/components/landing/faq-preview";
import { FinalCTA } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";
import { PageTransition } from "@/components/layout/page-transition";

/**
 * Marketing homepage — always dark.
 * Hero → Loop → Progress → Principles → FAQ → Close.
 * Restraint over spectacle.
 */
export default function LandingPage() {
  return (
    <div data-theme="dark" className="relative min-h-screen bg-background text-foreground">
      <SmoothScroll />
      <div className="relative z-10">
        <LandingNav />
        <PageTransition>
          <main>
            <Hero />
            <HowItWorks />
            <ProgressMotivation />
            <Trust />
            <FAQPreview />
            <FinalCTA />
          </main>
          <Footer />
        </PageTransition>
      </div>
      <div aria-hidden className="grain-overlay !z-20" />
    </div>
  );
}
