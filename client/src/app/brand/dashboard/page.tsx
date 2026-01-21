"use client";

import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { Navbar } from "@/components/ui/navbar";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/lib/toast";
import AuthService from "@/services/auth.service";
import { useState, useEffect } from "react";
import { BrandLikes } from "@/components/dashboard";

export default function BrandDashboardPage() {
  const { user, logout, refreshUser } = useAuth();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [shouldDisconnectWallet, setShouldDisconnectWallet] = useState(false);
  const [brandId, setBrandId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBrandId = async () => {
      // Fetch the brand ID for the current user
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/brands/me`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setBrandId(data.data.id);
        }
      }
    };

    if (user) {
      fetchBrandId();
    }
  }, [user]);

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
    <RoleProtectedRoute allowedRoles={['BRANDUSER']}>
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
                  Brand Dashboard
                </span>
              </h1>
              <p className="text-muted-foreground">
                Welcome to your brand dashboard. Manage your community and tokens here.
              </p>
            </div>

            {/* Brand Likes Section */}
            {brandId && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-2xl font-bold mb-6">Community Engagement</h2>
                <BrandLikes brandId={brandId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleProtectedRoute>
  );
}
