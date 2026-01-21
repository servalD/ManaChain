"use client";

import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { Navbar } from "@/components/ui/navbar";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/lib/toast";
import AuthService from "@/services/auth.service";
import { useState } from "react";
import { UserLikes } from "@/components/dashboard";

export default function ClientDashboardPage() {
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
    toast({
      title: "Profile",
      description: "Profile page coming soon!",
      variant: "default",
    });
  };

  return (
    <RoleProtectedRoute allowedRoles={['CLIENT']}>
      <div className="min-h-screen bg-background">
        <Navbar 
          currentPage="dashboard" 
          isLoggedIn={true}
          userName={user?.username}
          userRole={user?.role}
          onLogout={handleLogout}
          onProfile={handleProfile}
          onWalletConnected={handleWalletConnected}
          onWalletDisconnected={handleWalletDisconnected}
          shouldDisconnectWallet={shouldDisconnectWallet}
        />

        <div className="pt-28 sm:pt-32 md:pt-36 pb-8 sm:pb-12 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
                  My Dashboard
                </span>
              </h1>
              <p className="text-muted-foreground">
                Manage your liked brands and discover new opportunities.
              </p>
            </div>

            {/* User Likes Section */}
            <div className="bg-card border border-border rounded-xl p-6">
              <UserLikes />
            </div>
          </div>
        </div>
      </div>
    </RoleProtectedRoute>
  );
}
