"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Squares from "@/components/ui/squares/Squares";
import { LandingNavbar } from "@/components/ui/navbar/LandingNavbar";
import { Navbar } from "@/components/ui/navbar";
import { Hero, Stats, HowItWorks, TheyTrustUs, TrustedByBrands, FAQ, Footer } from "@/components/landing";
import { useMounted } from "@/hooks/useMounted";
import { checkSession, logout } from "@/hooks/api/useAuth";
import { useWalletSync } from "@/hooks/useWalletSync";
import type { UserResponse } from "@/api/generated/models";

export default function Home() {
  const mounted = useMounted();
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const refreshUser = async (): Promise<UserResponse | null> => {
    const userData = await checkSession();
    setUser(userData);
    return userData;
  };

  // Non-redirecting session check (unlike useAuth()) — the home page must stay
  // visible for anonymous visitors, it just swaps which navbar it shows.
  useEffect(() => {
    refreshUser().finally(() => setAuthChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { shouldDisconnectWallet, handleWalletConnected, handleWalletDisconnected } = useWalletSync(refreshUser);

  const handleProfile = () => {
    router.push("/profile");
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden pointer-events-none">
      {/* Squares Background */}
      {mounted && (
        <div className="fixed inset-0 z-0">
          <Squares
            direction="diagonal"
            speed={0.5}
            borderColor="rgba(139, 92, 246, 0.2)"
            squareSize={40}
            hoverFillColor="rgba(139, 92, 246, 0.3)"
          />
        </div>
      )}

      <main className="relative z-10 main-with-background">
        {/* Navigation */}
        {mounted && authChecked && (
          user ? (
            <Navbar
              currentPage=""
              isLoggedIn
              userName={user.username}
              userAvatarUrl={user.avatarUrl}
              userRole={user.role}
              onLogout={logout}
              onProfile={handleProfile}
              onWalletConnected={handleWalletConnected}
              onWalletDisconnected={handleWalletDisconnected}
              shouldDisconnectWallet={shouldDisconnectWallet}
            />
          ) : (
            <LandingNavbar />
          )
        )}

        {/* Hero Section */}
        <Hero />

        {/* Stats Section */}
        <Stats />

        {/* How It Works Section */}
        <HowItWorks />

        {/* Testimonials Section */}
        <TheyTrustUs />

        {/* FAQ Section */}
        <FAQ />

        {/* Trusted by World-Class Brands */}
        <TrustedByBrands />

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
}
