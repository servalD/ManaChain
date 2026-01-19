"use client";

import { MarqueeDemo } from "@/components/ui/marquee/MarqueeDemo";

export function TrustedByBrands() {
  return (
    <section className="py-20 px-6 relative">
      <div className="max-w-7xl mx-auto text-center mb-8">
        <h3 className="text-2xl md:text-3xl font-semibold text-muted-foreground mb-2">
          Trusted by World-Class Brands
        </h3>
      </div>
      <MarqueeDemo />
    </section>
  );
}
