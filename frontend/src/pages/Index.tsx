import { SimpleHeader } from "@/components/landing/SimpleHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { CommandViewSection } from "@/components/landing/CommandViewSection";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <SimpleHeader />
      <HeroSection />
      <FeaturesSection />
      <CommandViewSection />
      <Footer />
    </div>
  );
};

export default Index;
