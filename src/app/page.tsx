// src/app/page.tsx

import MainHeader from "@/components/layout/MainHeader";
import MainFooter from "@/components/layout/MainFooter";
import HeroSection from "@/components/sections/home/HeroSection";
import ServiceOverviewSection from "@/components/sections/home/ServiceOverviewSection";
import HowItWorksSection from "@/components/sections/home/HowItWorksSection";
import AnalysisGuideSection from "@/components/sections/home/AnalysisGuideSection";
import TrustIndicatorsSection from "@/components/sections/home/TrustIndicatorsSection";
import TargetUsersSection from "@/components/sections/home/TargetUsersSection";
import FaqSection from "@/components/sections/home/FaqSection";
import FinalCtaSection from "@/components/sections/home/FinalCtaSection";

export default function HomePage() {
  return (
    <>
      <MainHeader />

      <main id="main-content" className="bg-white text-slate-900">
        <HeroSection />
        <ServiceOverviewSection />
        <HowItWorksSection />
        <AnalysisGuideSection />
        <TrustIndicatorsSection />
        <TargetUsersSection />
        <FaqSection />
        <FinalCtaSection />
      </main>

      <MainFooter />
    </>
  );
}
