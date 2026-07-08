"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import RotatingText from "@/components/ui/rotating-text/RotatingText";
import { Rocket, Globe2, ChevronDown } from "lucide-react";
import { checkSession } from "@/hooks/api/useAuth";
import { useMounted } from "@/hooks/useMounted";

export function Hero() {
  const t = useTranslations("landing.hero");
  const mounted = useMounted();
  const [logoSrc, setLogoSrc] = useState("/Logo_ManaChain_Noir.svg"); // Default to light mode logo (avoid hydration mismatch)
  const router = useRouter();

  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setLogoSrc(isDark ? "/Logo_ManaChain_Blanc.svg" : "/Logo_ManaChain_Noir.svg");
    };

    // Initial check
    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleDiscoverClick = async () => {
    const user = await checkSession();

    if (user?.role === "CLIENT") {
      router.push("/discover");
      return;
    }

    router.push("/login");
  };

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
                {t('headlineSupport')}<br />
                <span className="whitespace-nowrap">
                  {t('headlineThe')}{' '}
                  <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
                    {t('headlineBrands')}
                  </span>
                  {' '}{t('headlineYou')}
                </span>
                <br />
                {t('headlineBelieveIn')}
              </h1>
            </div>

            {/* Rotating Text Section */}
            <div className={`transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h2 className="text-xl md:text-3xl lg:text-4xl font-bold leading-tight">
                <span className="text-foreground">
                  {t('subtitlePrefix')}{' '}
                </span>
                <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent inline-block">
                  <RotatingText
                    texts={t.raw('subtitleRotatingSubjects') as string[]}
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
                  {t('subtitleAnd')}{' '}
                </span>
                <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent inline-block">
                  <RotatingText
                    texts={t.raw('subtitleRotatingAudiences') as string[]}
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
              <Link href="/brand-application" className="pointer-events-auto">
                <Button variant="gradient" size="lg" className="rounded-full text-base px-8 py-6 font-semibold w-full sm:w-auto">
                  <Rocket className="mr-2 h-5 w-5" />
                  {t('ctaCreateCommunity')}
                </Button>
              </Link>
            <Button
              variant="gradientOutline"
              size="lg"
              className="rounded-full text-base px-8 py-6 font-semibold pointer-events-auto"
              onClick={handleDiscoverClick}
            >
                <Globe2 className="mr-2 h-5 w-5" />
                {t('ctaDiscoverProjects')}
              </Button>
            </div>
          </div>

          {/* Right Column - Smaller - Hidden on mobile */}
          <div className={`hidden lg:block transition-all duration-1000 delay-300 lg:pt-16 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <div className="flex flex-col items-center lg:items-start space-y-6 text-center lg:text-left">
              {/* Brand Name */}
              <div>
                <h3 className="text-5xl md:text-6xl font-bold mb-3 flex items-center">
                  <img
                    src={logoSrc}
                    alt="Mana Chain"
                    className="h-18 w-auto md:h-18 lg:h-12 object-contain"
                  />
                </h3>
              </div>

              {/* Description */}
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                {t('descriptionGetA')} <span style={{ color: '#FFD700' }} className="font-semibold">{t('descriptionCommunityBadge')}</span>{" "}
                {t('descriptionMiddle')} <span className="text-fuchsia-400 font-semibold">{t('descriptionAuthenticEngagement')}</span> {t('descriptionSuffix')}
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
