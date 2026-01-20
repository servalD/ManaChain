"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import RotatingText from "@/components/ui/rotating-text/RotatingText";
import { Rocket, Globe2, ChevronDown } from "lucide-react";

export function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section id="hero" className="min-h-screen flex items-center justify-center px-4 sm:px-6 pt-20 sm:pt-24">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-[1.8fr_1fr] gap-12 lg:gap-16 items-end">
          
          {/* Left Column - Takes more space */}
          <div className="space-y-6 sm:space-y-8">
            {/* Main Headline */}
            <div className={`transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black text-foreground tracking-tighter leading-[1.1]" style={{
                fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif'
              }}>
                Support<br />
                <span className="whitespace-nowrap">
                  the{' '}
                  <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
                    brands
                  </span>
                  {' '}you
                </span>
                <br />
                believe in.
              </h1>
            </div>

            {/* Rotating Text Section */}
            <div className={`transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h2 className="text-xl md:text-3xl lg:text-4xl font-bold leading-tight">
                <span className="text-foreground">
                  Redefine the relationship between{' '}
                </span>
                <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent inline-block">
                  <RotatingText
                    texts={['brands', 'creators', 'artists', 'companies']}
                    rotationInterval={2500}
                    staggerDuration={0.02}
                    staggerFrom="first"
                    splitBy="characters"
                    className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent"
                    elementLevelClassName="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent"
                  />
                </span>
                <br />
                <span className="text-foreground">
                  and their{' '}
                </span>
                <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent inline-block">
                  <RotatingText
                    texts={['communities', 'fans', 'supporters', 'early adopters']}
                    rotationInterval={2500}
                    staggerDuration={0.02}
                    staggerFrom="first"
                    splitBy="characters"
                    className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent"
                    elementLevelClassName="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent"
                  />
                </span>
              </h2>
            </div>

            {/* Buttons */}
            <div className={`flex flex-col sm:flex-row gap-3 transition-all duration-1000 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <Button variant="gradient" size="lg" className="rounded-full text-base px-8 py-6 font-semibold pointer-events-auto">
                <Rocket className="mr-2 h-5 w-5" />
                Create My Community
              </Button>
              <Button variant="gradientOutline" size="lg" className="rounded-full text-base px-8 py-6 font-semibold pointer-events-auto">
                <Globe2 className="mr-2 h-5 w-5" />
                Discover Projects
              </Button>
            </div>
          </div>

          {/* Right Column - Smaller - Hidden on mobile */}
          <div className={`hidden lg:block transition-all duration-1000 delay-300 lg:pt-16 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <div className="flex flex-col items-center lg:items-start space-y-6 text-center lg:text-left">
              {/* Brand Name */}
              <div>
                <h3 className="text-5xl md:text-6xl font-bold mb-3" style={{
                  background: 'linear-gradient(to right, #FFD700, #FFC700, #FFD700)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Mana <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">Chain</span>
                </h3>
              </div>

              {/* Description */}
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Issue a <span style={{ color: '#FFD700' }} className="font-semibold">community token</span>, 
                raise funds in a <span className="text-violet-400 font-semibold">decentralized</span> way, 
                and offer a new form of authentic engagement.
              </p>

              {/* Decorative elements */}
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-violet-400/50"></div>
                <div className="w-2 h-2 rounded-full bg-fuchsia-400/50"></div>
                <div className="w-2 h-2 rounded-full bg-indigo-400/50"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className={`flex justify-center animate-bounce transition-all duration-1000 delay-800 mt-16 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <ChevronDown className="h-8 w-8 text-violet-400" />
        </div>
      </div>
    </section>
  );
}
