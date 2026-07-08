"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { User, Menu, X } from "lucide-react";
import { checkSession } from "@/hooks/api/useAuth";
import { useTranslations } from "next-intl";

export function LandingNavbar() {
  const t = useTranslations("landing.navbar");
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoSrc, setLogoSrc] = useState("/Logo_ManaChain_Noir.svg"); // Default to light mode to avoid hydration mismatch
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setLogoSrc(isDark ? "/Logo_ManaChain_Blanc.svg" : "/Logo_ManaChain_Noir.svg");
    };

    // Initial check
    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleSignInClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    const user = await checkSession();

    if (user) {
      const role = user.role;

      if (role === 'CLIENT') {
        router.push('/discover');
      } else if (role === 'BRANDUSER') {
        router.push(user.passwordChanged === false ? '/brand/change-password-required' : '/brand/dashboard');
      } else if (role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/discover');
      }
    } else {
      router.push('/login');
    }
  };

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (target.closest('a')) {
        return;
      }

      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMenuOpen || isMobileMenuOpen) {
      // Utiliser 'click' au lieu de 'mousedown' pour permettre aux liens de fonctionner
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isMenuOpen, isMobileMenuOpen]);

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/50 border-b border-border/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center justify-between">
          {/* Logo */}
          <Link 
            href="#hero" 
            className="flex items-center"
            onClick={(e) => handleSmoothScroll(e, 'hero')}
          >
            <img
              src={logoSrc}
              alt="Mana Chain"
              className="h-5 w-auto sm:h-6 object-contain"
            />
          </Link>

          {/* Navigation Links - Centered */}
          <div className="flex items-center gap-6">
            <Link 
              href="#hero" 
              className="text-sm font-medium text-foreground/80 hover:text-violet-400 transition-colors"
              onClick={(e) => handleSmoothScroll(e, 'hero')}
            >
              {t('home')}
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-foreground/80 hover:text-indigo-400 transition-colors"
              onClick={(e) => handleSmoothScroll(e, 'how-it-works')}
            >
              {t('howItWorks')}
            </Link>
            <Link
              href="#faq"
              className="text-sm font-medium text-foreground/80 hover:text-violet-400 transition-colors"
              onClick={(e) => handleSmoothScroll(e, 'faq')}
            >
              {t('faq')}
            </Link>
          </div>

          {/* Right Side - User Menu & Theme Toggler */}
          <div className="flex items-center gap-3">
            {/* User Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg bg-card/50 backdrop-blur-md border border-border hover:bg-accent transition-colors text-foreground"
                aria-label={t('userMenuAriaLabel')}
              >
                <User className="h-5 w-5" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-popover/95 backdrop-blur-md border border-border rounded-lg shadow-lg overflow-hidden">
                  <Link
                    href="/login"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    onClick={(e) => {
                      setIsMenuOpen(false);
                      handleSignInClick(e);
                    }}
                  >
                    {t('signIn')}
                  </Link>
                  <Link
                    href="/register"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('signUp')}
                  </Link>
                  <Link
                    href="/brand-application"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('applyAsBrand')}
                  </Link>
                </div>
              )}
            </div>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Theme Toggler */}
            <AnimatedThemeToggler
              className="p-2 rounded-lg bg-card/50 backdrop-blur-md border border-border hover:bg-accent transition-colors text-foreground [&>svg]:h-5 [&>svg]:w-5"
            />
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden flex items-center justify-between">
          {/* Logo - same as desktop: single logo image only */}
          <Link 
            href="#hero" 
            className="flex items-center"
            onClick={(e) => handleSmoothScroll(e, 'hero')}
          >
            <img
              src={logoSrc}
              alt="Mana Chain"
              className="h-5 w-auto sm:h-6 object-contain"
            />
          </Link>

          {/* Right Side - Mobile Menu Button, User Menu & Theme Toggler */}
          <div className="flex items-center gap-2">
            {/* User Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg bg-card/50 backdrop-blur-md border border-border hover:bg-accent transition-colors text-foreground"
                aria-label={t('userMenuAriaLabel')}
              >
                <User className="h-4 w-4" />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-popover/95 backdrop-blur-md border border-border rounded-lg shadow-lg overflow-hidden z-50">
                  <Link
                    href="/login"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors "
                    onClick={(e) => {
                      setIsMenuOpen(false);
                      handleSignInClick(e);
                    }}
                  >
                    {t('signIn')}
                  </Link>
                  <Link
                    href="/register"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors "
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('signUp')}
                  </Link>
                  <Link
                    href="/brand-application"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('applyAsBrand')}
                  </Link>
                </div>
              )}
            </div>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Theme Toggler */}
            <AnimatedThemeToggler
              className="p-2 rounded-lg bg-card/50 backdrop-blur-md border border-border hover:bg-accent transition-colors text-foreground [&>svg]:h-4 [&>svg]:w-4"
            />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-card/50 backdrop-blur-md border border-border hover:bg-accent transition-colors text-foreground"
              aria-label={t('menuAriaLabel')}
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-border/30 pt-4" ref={mobileMenuRef}>
            <div className="flex flex-col gap-4">
              <Link 
                href="#hero" 
                className="text-sm font-medium text-foreground/80 hover:text-violet-400 transition-colors"
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  handleSmoothScroll(e, 'hero');
                }}
              >
                {t('home')}
              </Link>
              <Link
                href="#how-it-works"
                className="text-sm font-medium text-foreground/80 hover:text-indigo-400 transition-colors"
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  handleSmoothScroll(e, 'how-it-works');
                }}
              >
                {t('howItWorks')}
              </Link>
              <Link
                href="#faq"
                className="text-sm font-medium text-foreground/80 hover:text-violet-400 transition-colors"
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  handleSmoothScroll(e, 'faq');
                }}
              >
                {t('faq')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
