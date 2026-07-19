import { LandingNav } from "@/components/landing/landing-nav";
import { LandingBackground } from "@/components/landing/landing-background";
import { SmoothScroll } from "@/components/landing/smooth-scroll";
import { GrainOverlay } from "@/components/ui/grain-overlay";
import { Hero } from "@/components/landing/hero";
import { WhyAxon } from "@/components/landing/why-axon";
import { Features } from "@/components/landing/features";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Gamification } from "@/components/landing/gamification";
import { Benefits } from "@/components/landing/benefits";
import { FAQ } from "@/components/landing/faq";
import { FinalCTA } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";
import { PageTransition } from "@/components/layout/page-transition";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background">
      <SmoothScroll />
      <LandingBackground />
      <GrainOverlay />
      <div className="relative z-10">
        <LandingNav />
        <PageTransition>
          <Hero />
          <WhyAxon />
          <Features />
          <DashboardPreview />
          <HowItWorks />
          <Gamification />
          <Benefits />
          <FAQ />
          <FinalCTA />
          <Footer />
        </PageTransition>
      </div>
    </div>
  );
}
