"use client";

import ScrollFloat from "@/components/ui/scroll-float/scroll-float";
import { Badge } from "@/components/ui/badge";

const testimonials = [
  {
    id: 1,
    author: "Marie L.",
    role: "Founder, EcoWave",
    content: "Mana Chain allowed us to create a truly engaged community. Our customers have become our best ambassadors!",
    avatar: "👩‍💼",
    brand: "EcoWave"
  },
  {
    id: 2,
    author: "Thomas K.",
    role: "Early Supporter",
    content: "I discovered incredible brands and feel truly connected to their missions. The exclusive events are amazing!",
    avatar: "👨‍💻",
    brand: "Multiple"
  },
  {
    id: 3,
    author: "Sophie R.",
    role: "CEO, TechNova",
    content: "Decentralized fundraising has opened unimaginable doors for us. Our community is our greatest asset.",
    avatar: "👩‍🔬",
    brand: "TechNova"
  }
];

export function TheyTrustUs() {
  return (
    <section className="py-20 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <ScrollFloat
            animationDuration={1}
            ease="back.inOut(2)"
            scrollStart="center bottom+=50%"
            scrollEnd="bottom bottom-=40%"
            stagger={0.03}
            containerClassName="mb-4"
            textClassName="text-3xl md:text-5xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent"
          >
            They Trust Us
          </ScrollFloat>
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
            Discover what our founders and supporters say
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="w-full rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-4 h-full flex flex-col"
            >
              <div className="text-3xl mb-3">{testimonial.avatar}</div>
              <p className="text-sm text-muted-foreground italic mb-3 flex-1">"{testimonial.content}"</p>
              <div>
                <div className="font-semibold text-sm text-foreground">{testimonial.author}</div>
                <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                <Badge className="mt-2 text-xs">{testimonial.brand}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
