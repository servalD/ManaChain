"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { Navbar } from "@/components/ui/navbar";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/lib/toast";
import AuthService from "@/services/auth.service";
import { UserLikes, PortfolioValueChart, MyTokens, UpcomingEvents, ActivityTimeline } from "@/components/dashboard";

export default function ClientDashboardPage() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [shouldDisconnectWallet, setShouldDisconnectWallet] = useState(false);

  const handleWalletConnected = async (address: string) => {
    setShouldDisconnectWallet(false);
    await refreshUser();
    const freshUser = await AuthService.getUser();
    
    if (!freshUser) {
      toast({
        title: "Error",
        description: "Unable to verify user data. Please try again.",
        variant: "error",
      });
      setShouldDisconnectWallet(true);
      return;
    }
    
    if (freshUser.blockchain_address) {
      if (freshUser.blockchain_address.toLowerCase() !== address.toLowerCase()) {
        toast({
          title: "Wallet Already Connected",
          description: "You already have a different wallet connected to your account.",
          variant: "error",
        });
        setShouldDisconnectWallet(true);
        return;
      }
      setWalletAddress(address);
      toast({
        title: "Wallet Connected",
        description: "Your registered wallet has been connected successfully.",
        variant: "success",
      });
    } else {
      const success = await AuthService.updateBlockchainAddress(address);
      if (success) {
        await refreshUser();
        setWalletAddress(address);
        toast({
          title: "Wallet Connected & Saved",
          description: "Your wallet has been connected and saved to your account.",
          variant: "success",
        });
      } else {
        setShouldDisconnectWallet(true);
        setWalletAddress(null);
      }
    }
  };

  const handleWalletDisconnected = () => {
    setWalletAddress(null);
    setShouldDisconnectWallet(false);
  };

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logged out",
      description: "See you soon!",
      variant: "success",
    });
  };

  const handleProfile = () => {
    router.push("/profile");
  };

  return (
    <RoleProtectedRoute allowedRoles={['CLIENT']}>
      <div className="min-h-screen bg-background">
        <Navbar
          currentPage="dashboard"
          isLoggedIn={true}
          userName={user?.username}
          userAvatarUrl={user?.avatar_url}
          userRole={user?.role}
          onLogout={handleLogout}
          onProfile={handleProfile}
          onWalletConnected={handleWalletConnected}
          onWalletDisconnected={handleWalletDisconnected}
          shouldDisconnectWallet={shouldDisconnectWallet}
        />

        <div className="pt-30 sm:pt-30 pb-8 sm:pb-12 px-2 sm:px-4">
          <div className="max-w-8xl mx-auto space-y-8">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
                My Dashboard
              </span>
            </h1>

            {/* Portfolio Value Chart */}
            <PortfolioValueChart />

            {/* User Likes and My Badges Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UserLikes />
              <MyTokens />
            </div>

            {/* Upcoming Events Section */}
            <UpcomingEvents />

            {/* Activity Timeline Section */}
            <ActivityTimeline />
          </div>
        </div>
      </div>
    </RoleProtectedRoute>
  );
}
