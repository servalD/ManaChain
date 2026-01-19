"use client";

import { useEffect, useState } from "react";
import Squares from "@/components/ui/squares/Squares";
import { LandingNavbar } from "@/components/ui/navbar/LandingNavbar";
import { Hero, Stats, HowItWorks, TheyTrustUs, TrustedByBrands, FAQ, Footer } from "@/components/landing";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  
  const logoSvg = "data:image/svg+xml;base64," + btoa(`
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#D4AF37;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#C5A028;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#D4AF37;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <circle cx="20" cy="20" r="18" fill="url(#grad)" opacity="0.15"/>
      <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-family="Space Grotesk, sans-serif" font-size="32" font-weight="900" fill="url(#grad)" filter="url(#shadow)">M</text>
    </svg>
  `);

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
        {mounted && <LandingNavbar logoSvg={logoSvg} />}

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
