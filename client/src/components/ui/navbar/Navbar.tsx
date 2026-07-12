"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { UserMenu } from "@/components/ui/user-menu";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { NotificationBell } from "./NotificationBell";

export interface NavbarProps {
  currentPage?: string;
  isLoggedIn?: boolean;
  userName?: string;
  userAvatarUrl?: string | null;
  userRole?: 'CLIENT' | 'BRANDUSER' | 'ADMIN';
  onLogout?: () => void;
  onProfile?: () => void;
  onWalletConnected?: (address: string) => void;
  onWalletDisconnected?: () => void;
  shouldDisconnectWallet?: boolean;
}

export function Navbar({ 
  currentPage = "discover", 
  isLoggedIn = false, 
  userName,
  userAvatarUrl,
  userRole,
  onLogout,
  onProfile,
  onWalletConnected,
  onWalletDisconnected,
  shouldDisconnectWallet,
}: NavbarProps) {
  const t = useTranslations("navbar");
  // Define nav items based on user role
  const getNavItems = () => {
    if (!isLoggedIn) {
      return [
        { label: t("home"), href: "/" },
        { label: t("discover"), href: "/discover" },
        { label: t("events"), href: "#events" },
      ];
    }

    switch (userRole) {
      case 'CLIENT':
        return [
          { label: t("discover"), href: "/discover" },
          { label: t("dashboard"), href: "/dashboard" },
          { label: t("events"), href: "/events" },
        ];
      case 'BRANDUSER':
        return [
          { label: t("dashboard"), href: "/brand/dashboard" },
          { label: t("events"), href: "/brand/events" },
        ];
      case 'ADMIN':
        return [
          { label: t("dashboard"), href: "/admin/dashboard" },
          { label: t("browseBrands"), href: "/admin/brands" },
          { label: t("events"), href: "/admin/events" },
        ];
      default:
        return [
          { label: t("home"), href: "/" },
          { label: t("discover"), href: "/discover" },
        ];
    }
  };

  const navItems = getNavItems();
  const [logoSrc, setLogoSrc] = useState("/Logo_ManaChain_Noir.svg");

  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setLogoSrc(isDark ? "/Logo_ManaChain_Blanc.svg" : "/Logo_ManaChain_Noir.svg");
    };

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

  return (
    <nav className="fixed top-0 left-0 right-0 z-100 border-b border-border backdrop-blur-xl bg-background/80 dark:bg-background/60" style={{
      backdropFilter: 'blur(20px)',
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <img 
              src={logoSrc} 
              alt="Mana Chain" 
              className="h-5 w-auto sm:h-6 object-contain transform transition-transform group-hover:scale-105" 
            />
          </Link>

          {/* Navigation Links - Desktop Only */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = currentPage === "dashboard" && item.href.includes("/dashboard") ||
                              currentPage === "discover" && item.href.includes("/discover") ||
                              currentPage === "events" && item.href.includes("/events") ||
                              currentPage === "brands" && item.href.includes("/brands") ||
                              (item.href === "/" && currentPage === "");
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Theme Toggler */}
            <AnimatedThemeToggler
              className="p-2 rounded-lg hover:bg-accent transition-colors text-foreground"
            />

            {isLoggedIn ? (
              <>
                {/* Wallet Connect Button - Desktop Only */}
                <div className="hidden lg:block">
                  <WalletConnectButton
                    onConnected={onWalletConnected}
                    onDisconnected={onWalletDisconnected}
                    shouldDisconnect={shouldDisconnectWallet}
                  />
                </div>

                {/* Notification Bell */}
                <NotificationBell />

                {/* User Menu */}
                <UserMenu
                  userName={userName || "User"}
                  userAvatarUrl={userAvatarUrl}
                  userRole={userRole}
                  onLogout={onLogout || (() => {})}
                  onProfile={onProfile}
                  onWalletConnected={onWalletConnected}
                  onWalletDisconnected={onWalletDisconnected}
                  shouldDisconnectWallet={shouldDisconnectWallet}
                />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium text-white transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(to right, #7c3aed, #a855f7)',
                    boxShadow: '0 4px 14px 0 rgba(124, 58, 237, 0.39)'
                  }}
                >
                  {t("signUp")}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden flex items-center gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
          {navItems.map((item) => {
            const isActive = currentPage === "dashboard" && item.href.includes("/dashboard") ||
                            currentPage === "discover" && item.href.includes("/discover") ||
                            currentPage === "events" && item.href.includes("/events") ||
                            currentPage === "brands" && item.href.includes("/brands") ||
                            (item.href === "/" && currentPage === "");
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-300 ${
                  isActive
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
