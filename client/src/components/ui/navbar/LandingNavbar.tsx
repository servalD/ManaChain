"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { User, Menu, X, Building2 } from "lucide-react";

interface LandingNavbarProps {
  logoSvg: string;
}

export function LandingNavbar({ logoSvg }: LandingNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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
          <Link href="#hero" className="flex items-center gap-2">
            <img src={logoSvg} alt="Mana Chain" className="w-8 h-8" />
            <span className="text-xl font-bold bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
              Mana Chain
            </span>
          </Link>

          {/* Navigation Links - Centered */}
          <div className="flex items-center gap-6">
            <Link 
              href="#hero" 
              className="text-sm font-medium text-foreground/80 hover:text-violet-400 transition-colors"
            >
              Home
            </Link>
            <Link 
              href="#features" 
              className="text-sm font-medium text-foreground/80 hover:text-indigo-400 transition-colors"
            >
              How It Works
            </Link>
            <Link 
              href="#faq" 
              className="text-sm font-medium text-foreground/80 hover:text-violet-400 transition-colors"
            >
              FAQ
            </Link>
          </div>

          {/* Right Side - User Menu & Theme Toggler */}
          <div className="flex items-center gap-3">
            {/* User Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg bg-card/50 backdrop-blur-md border border-border hover:bg-accent transition-colors text-foreground"
                aria-label="User menu"
              >
                <User className="h-5 w-5" />
              </button>
              
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-popover/95 backdrop-blur-md border border-border rounded-lg shadow-lg overflow-hidden">
                  <Link
                    href="/login"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                  <Link 
                    href="/brand-application" 
                    className="block px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Apply as a Brand
                  </Link>
                </div>
              )}
            </div>

            {/* Theme Toggler */}
            <AnimatedThemeToggler 
              className="p-2 rounded-lg bg-card/50 backdrop-blur-md border border-border hover:bg-accent transition-colors text-foreground [&>svg]:h-5 [&>svg]:w-5"
            />
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden flex items-center justify-between">
          {/* Logo */}
          <Link href="#hero" className="flex items-center gap-2">
            <img src={logoSvg} alt="Mana Chain" className="w-7 h-7" />
            <span className="text-lg font-bold bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
              Mana Chain
            </span>
          </Link>

          {/* Right Side - Mobile Menu Button, User Menu & Theme Toggler */}
          <div className="flex items-center gap-2">
            {/* User Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg bg-card/50 backdrop-blur-md border border-border hover:bg-accent transition-colors text-foreground"
                aria-label="User menu"
              >
                <User className="h-4 w-4" />
              </button>
              
                     {isMenuOpen && (
                       <div className="absolute right-0 mt-2 w-40 bg-popover/95 backdrop-blur-md border border-border rounded-lg shadow-lg overflow-hidden z-50">
                         <Link
                           href="/login"
                           className="block px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors "
                           onClick={() => setIsMenuOpen(false)}
                         >
                           Sign in
                         </Link>
                         <Link
                           href="/register"
                           className="block px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors "
                           onClick={() => setIsMenuOpen(false)}
                         >
                           Sign up
                         </Link>
                         <Link 
                           href="/brand-application" 
                           className="block px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                           onClick={() => setIsMenuOpen(false)}
                         >
                           Apply as a Brand
                         </Link>
                       </div>
                     )}
            </div>

            {/* Theme Toggler */}
            <AnimatedThemeToggler 
              className="p-2 rounded-lg bg-card/50 backdrop-blur-md border border-border hover:bg-accent transition-colors text-foreground [&>svg]:h-4 [&>svg]:w-4"
            />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-card/50 backdrop-blur-md border border-border hover:bg-accent transition-colors text-foreground"
              aria-label="Menu"
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
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="#features" 
                className="text-sm font-medium text-foreground/80 hover:text-indigo-400 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link 
                href="#faq" 
                className="text-sm font-medium text-foreground/80 hover:text-violet-400 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                FAQ
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
