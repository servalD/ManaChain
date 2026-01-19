"use client";

import ScrollFloat from "@/components/ui/scroll-float/scroll-float";
import SpotlightCard from '@/components/ui/spotlight-card/SpotlightCard';

export function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Create Your Token",
      description: "In just a few clicks, issue your symbolic support token. Simplified process, no technical skills required.",
      color: "#7E22CE",
      gradient: "from-violet-950 to-violet-900"
    },
    {
      number: "2",
      title: "Unite Community",
      description: "Share your project and bring your supporters together. Discussion channels, voting, exclusive events.",
      color: "#C026D3",
      gradient: "from-fuchsia-950 to-fuchsia-900"
    },
    {
      number: "3",
      title: "Generate Revenue",
      description: "Transform engagement into value. Tokenization campaigns, premium subscriptions, secondary transactions.",
      color: "#4338CA",
      gradient: "from-indigo-950 to-indigo-900"
    }
  ];

  return (
    <section id="features" className="py-20 px-6 relative">
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
            How It Works
          </ScrollFloat>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((item, index) => (
            <div key={index}>
              <SpotlightCard 
                className="h-full"
                spotlightColor={`${item.color}40`}
              >
                <div className="flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                  <div className="text-7xl font-bold bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent mb-6">
                    {item.number}
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">{item.title}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </SpotlightCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
