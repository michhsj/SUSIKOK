import MainHeader from "@/components/layout/MainHeader";
import MainFooter from "@/components/layout/MainFooter";
import ServiceOverviewSection from "@/components/sections/home/ServiceOverviewSection";
import AnalysisGuideSection from "@/components/sections/home/AnalysisGuideSection";
import TargetUsersSection from "@/components/sections/home/TargetUsersSection";
import FinalCtaSection from "@/components/sections/home/FinalCtaSection";

export default function HomePage() {
  return (
    <>
      <MainHeader />

      <main id="main-content" className="bg-white text-slate-900">
        <FinalCtaSection />
        <ServiceOverviewSection />
        <TargetUsersSection />
        <AnalysisGuideSection />
      </main>

      <MainFooter />
    </>
  );
}
