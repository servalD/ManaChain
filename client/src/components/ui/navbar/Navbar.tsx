"use client";

import React from "react";
import Link from "next/link";
import { UserMenu } from "@/components/ui/user-menu";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export interface NavbarProps {
  currentPage?: string;
  isLoggedIn?: boolean;
  userName?: string;
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
  onLogout,
  onProfile,
  onWalletConnected,
  onWalletDisconnected,
  shouldDisconnectWallet,
}: NavbarProps) {
  const navItems = [
    { label: "Home", href: "/" },
    { label: "Discover", href: "/discover" },
    { label: "Portfolio", href: "#portfolio" },
    { label: "Events", href: "#events" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-100 border-b border-border backdrop-blur-xl bg-background/80 dark:bg-background/60" style={{
      backdropFilter: 'blur(20px)',
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            <img 
              src="/logo.png" 
              alt="Mana Chain" 
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover transform transition-transform group-hover:scale-110" 
            />
            <span className="text-lg sm:text-xl font-bold bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
              Mana Chain
            </span>
          </Link>

          {/* Navigation Links - Desktop Only */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = currentPage === item.href.replace("/", "") || (item.href === "/" && currentPage === "");
              
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

                {/* User Menu */}
                <UserMenu 
                  userName={userName || "User"}
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
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium text-white transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(to right, #7c3aed, #a855f7)',
                    boxShadow: '0 4px 14px 0 rgba(124, 58, 237, 0.39)'
                  }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden flex items-center gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
          {navItems.map((item) => {
            const isActive = currentPage === item.href.replace("/", "") || (item.href === "/" && currentPage === "");
            
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
