"use client";

import { useEffect, useState } from "react";
import Squares from "@/components/ui/squares/Squares";
import { LandingNavbar } from "@/components/ui/navbar/LandingNavbar";
import { Hero, Stats, HowItWorks, TheyTrustUs, TrustedByBrands, FAQ, Footer } from "@/components/landing";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden pointer-events-none">
      {/* Squares Background */}
      {mounted && (
        <div className="fixed inset-0 z-0">
          <Squares
            direction="diagonal"
            speed={0.5}
            borderColor="rgba(139, 92, 246, 0.2)"
            squareSize={40}
            hoverFillColor="rgba(139, 92, 246, 0.3)"
          />
        </div>
      )}

      <main className="relative z-10 main-with-background">
        {/* Navigation */}
        {mounted && <LandingNavbar />}

        {/* Hero Section */}
        <Hero />

        {/* Stats Section */}
        <Stats />

        {/* How It Works Section */}
        <HowItWorks />

        {/* Testimonials Section */}
        <TheyTrustUs />

        {/* FAQ Section */}
        <FAQ />

        {/* Trusted by World-Class Brands */}
        <TrustedByBrands />

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
}
