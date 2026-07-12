"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("landing.footer");
  const [logoSrc, setLogoSrc] = useState("/Logo_ManaChain_Noir.svg"); // Default to light mode logo (avoid hydration mismatch)

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

  return (
    <footer className="py-12 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center">
              <img
                src={logoSrc}
                alt="Mana Chain"
                className="h-5 w-auto object-contain"
              />
            </h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {t('tagline')}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-violet-400 mb-3 text-sm">{t('platformHeading')}</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition-colors pointer-events-auto">{t('howItWorks')}</a></li>
              <li><a href="/discover" className="hover:text-foreground transition-colors pointer-events-auto">{t('discover')}</a></li>
              <li><a href="/login" className="hover:text-foreground transition-colors pointer-events-auto">{t('login')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-fuchsia-400 mb-3 text-sm">{t('resourcesHeading')}</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li><a href="#faq" className="hover:text-foreground transition-colors pointer-events-auto">{t('faq')}</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors pointer-events-auto">{t('documentation')}</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors pointer-events-auto">{t('blog')}</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors pointer-events-auto">{t('support')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-indigo-400 mb-3 text-sm">{t('followUsHeading')}</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors pointer-events-auto">{t('twitter')}</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors pointer-events-auto">{t('discord')}</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors pointer-events-auto">{t('linkedin')}</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors pointer-events-auto">{t('instagram')}</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-6 text-center">
          <p className="text-muted-foreground text-xs">
            {t('copyright')}
          </p>
          <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
            <a href="/privacy" className="hover:text-foreground transition-colors pointer-events-auto">{t('privacy')}</a>
            <a href="#" className="hover:text-foreground transition-colors pointer-events-auto">{t('terms')}</a>
            <a href="#" className="hover:text-foreground transition-colors pointer-events-auto">{t('legal')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
