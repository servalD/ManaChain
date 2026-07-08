"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { Navbar } from "@/components/ui/navbar";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateBlockchainAddress } from "@/hooks/api/useAuth";
import { toast } from "@/lib/toast";
import { useMyBrand } from "@/hooks/api/useBrands";
import { MyBrandChart, BrandEvents, BrandNotifications, BrandContentMedia } from "@/components/dashboard";

export default function BrandDashboardPage() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const updateBlockchainAddress = useUpdateBlockchainAddress();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [shouldDisconnectWallet, setShouldDisconnectWallet] = useState(false);
  const shouldSkipBrandFetch = user?.role === "BRANDUSER" && user?.passwordChanged === false;
  const { data: brand, isLoading: isLoadingBrand } = useMyBrand({ enabled: !!user && !shouldSkipBrandFetch });
  // Mock: always set hasToken to true for testing (see BrandService.getBrandStats, historically commented out)
  const hasToken = !shouldSkipBrandFetch && !!user && !!brand;
  const brandId = brand?.id ?? null;
  const brandName = brand?.name ?? "";
  const brandLogo = brand?.logoUrl ?? null;

  useEffect(() => {
    if (user?.role === "BRANDUSER" && user?.passwordChanged === false) {
      router.replace("/brand/change-password-required");
      return;
    }
  }, [user, router]);

  const handleWalletConnected = async (address: string) => {
    setShouldDisconnectWallet(false);
    const freshUser = await refreshUser();

    if (!freshUser) {
      toast({
        title: "Error",
        description: "Unable to verify user data. Please try again.",
        variant: "error",
      });
      setShouldDisconnectWallet(true);
      return;
    }

    if (freshUser.blockchainAddress) {
      if (freshUser.blockchainAddress.toLowerCase() !== address.toLowerCase()) {
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
      try {
        await updateBlockchainAddress.mutateAsync({ data: { blockchainAddress: address } });
        await refreshUser();
        setWalletAddress(address);
        toast({
          title: "Wallet Connected & Saved",
          description: "Your wallet has been connected and saved to your account.",
          variant: "success",
        });
      } catch {
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
    <RoleProtectedRoute allowedRoles={['BRANDUSER']}>
      <div className="min-h-screen bg-background">
        <Navbar
          currentPage="dashboard"
          isLoggedIn={true}
          userName={user?.username}
          userAvatarUrl={user?.avatarUrl}
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
                Brand Dashboard
              </span>
            </h1>

            {/* My Brand Section */}
            {isLoadingBrand ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
              </div>
            ) : brandId ? (
              <>
                <MyBrandChart brandId={brandId} hasToken={hasToken} brandName={brandName} brandLogo={brandLogo} />
                <BrandEvents />
                <BrandContentMedia brandId={brandId} />
                <BrandNotifications />
              </>
            ) : (
              <div className="p-6 border border-border rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-center">
                  No brand found. Please contact support if you believe this is an error.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleProtectedRoute>
  );
}
