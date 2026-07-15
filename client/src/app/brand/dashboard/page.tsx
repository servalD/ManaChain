"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { Navbar } from "@/components/ui/navbar";
import { useAuth } from "@/hooks/useAuth";
import { useWalletSync } from "@/hooks/useWalletSync";
import { toast } from "@/lib/toast";
import { useMyBrand } from "@/hooks/api/useBrands";
import { useTokenByBrand } from "@/hooks/api/useTokens";
import { MyBrandChart, BrandEvents, BrandNotifications, BrandContentMedia, BrandLikes } from "@/components/dashboard";

export default function BrandDashboardPage() {
  const t = useTranslations("dashboard.brand.dashboardPage");
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const { shouldDisconnectWallet, handleWalletConnected, handleWalletDisconnected } = useWalletSync(refreshUser);
  const shouldSkipBrandFetch = user?.role === "BRANDUSER" && user?.passwordChanged === false;
  const { data: brand, isLoading: isLoadingBrand } = useMyBrand({ enabled: !!user && !shouldSkipBrandFetch });
  const { data: token } = useTokenByBrand(brand?.id);
  const hasToken = !!token;
  const brandId = brand?.id ?? null;
  const brandName = brand?.name ?? "";
  const brandLogo = brand?.logoUrl ?? null;

  useEffect(() => {
    if (user?.role === "BRANDUSER" && user?.passwordChanged === false) {
      router.replace("/brand/change-password-required");
      return;
    }
  }, [user, router]);

  const handleLogout = async () => {
    await logout();
    toast({
      title: t("toasts.loggedOutTitle"),
      description: t("toasts.loggedOutMessage"),
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
                {t("heading")}
              </span>
            </h1>

            {/* My Brand Section */}
            {isLoadingBrand ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
              </div>
            ) : brandId ? (
              <>
                <MyBrandChart brandId={brandId} hasToken={hasToken} token={token} brandName={brandName} brandLogo={brandLogo} />
                <BrandEvents />
                <BrandContentMedia brandId={brandId} />
                <BrandLikes brandId={brandId} />
                <BrandNotifications />
              </>
            ) : (
              <div className="p-6 border border-border rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-center">
                  {t("noBrandFound")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleProtectedRoute>
  );
}
