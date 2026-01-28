"use client";

import { useState, useEffect } from "react";

export function Footer() {
  const [logoSrc, setLogoSrc] = useState('/logo.png'); // Default to light mode logo

  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setLogoSrc(isDark ? '/logo_white.png' : '/logo.png');
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
              <span style={{ 
                background: 'linear-gradient(to right, #FFD700, #FFC700, #FFD700)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Mana
              </span>
              <img src={logoSrc} alt="Mana Chain" className="w-8 h-8 rounded-full object-cover -mx-1" />
              <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
                Chain
              </span>
            </h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Redefining community engagement, one brand at a time.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-violet-400 mb-3 text-sm">Platform</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition-colors pointer-events-auto">How It Works</a></li>
              <li><a href="/discover" className="hover:text-foreground transition-colors pointer-events-auto">Discover</a></li>
              <li><a href="/login" className="hover:text-foreground transition-colors pointer-events-auto">Login</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-fuchsia-400 mb-3 text-sm">Resources</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li><a href="#faq" className="hover:text-foreground transition-colors pointer-events-auto">FAQ</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors pointer-events-auto">Documentation</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors pointer-events-auto">Blog</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors pointer-events-auto">Support</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-indigo-400 mb-3 text-sm">Follow Us</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors pointer-events-auto">Twitter</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors pointer-events-auto">Discord</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors pointer-events-auto">LinkedIn</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors pointer-events-auto">Instagram</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border pt-6 text-center">
          <p className="text-muted-foreground text-xs">
            © 2026 Mana Chain. Redefining community engagement together.
          </p>
          <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors pointer-events-auto">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors pointer-events-auto">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors pointer-events-auto">Legal</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
