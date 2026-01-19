"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { User } from "lucide-react";

interface LandingNavbarProps {
  logoSvg: string;
}

export function LandingNavbar({ logoSvg }: LandingNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/50 border-b border-border/30">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="#hero" className="flex items-center gap-2 pointer-events-auto">
          <img src={logoSvg} alt="Mana Chain" className="w-8 h-8" />
          <span className="text-xl font-bold bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
            Mana Chain
          </span>
        </Link>

        {/* Navigation Links - Centered */}
        <div className="flex items-center gap-6 pointer-events-auto">
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
        <div className="flex items-center gap-3 pointer-events-auto">
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
              </div>
            )}
          </div>

          {/* Theme Toggler */}
          <AnimatedThemeToggler 
            className="p-2 rounded-lg bg-card/50 backdrop-blur-md border border-border hover:bg-accent transition-colors text-foreground"
          />
        </div>
      </div>
    </nav>
  );
}
