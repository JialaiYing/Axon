import { LandingNav } from "@/components/landing/landing-nav";
import { SmoothScroll } from "@/components/landing/smooth-scroll";
import { Hero } from "@/components/landing/hero";
import { WhyAxon } from "@/components/landing/why-axon";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Gamification } from "@/components/landing/gamification";
import { FinalCTA } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";
import { PageTransition } from "@/components/layout/page-transition";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-black">
      <SmoothScroll />
      <div className="relative z-10">
        <LandingNav />
        <PageTransition>
          <Hero />
          <WhyAxon />
          <Features />
          <HowItWorks />
          <Gamification />
          <FinalCTA />
          <Footer />
        </PageTransition>
      </div>
    </div>
  );
}
