"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { Navbar } from "@/components/ui/navbar";
import { useAuth } from "@/hooks/useAuth";
import { useWalletSync } from "@/hooks/useWalletSync";
import { toast } from "@/lib/toast";
import { BrandWhitelistTable } from "@/components/dashboard";

export default function AdminBrandsPage() {
  const router = useRouter();
  const t = useTranslations("dashboard.admin.brandsPage");
  const { user, logout, refreshUser } = useAuth();
  const { shouldDisconnectWallet, handleWalletConnected, handleWalletDisconnected } = useWalletSync(refreshUser);

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
    <RoleProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-background">
        <Navbar
          currentPage="brands"
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

        <div className="pt-28 sm:pt-32 md:pt-36 pb-8 sm:pb-12 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
                {t("title")}
              </span>
            </h1>
            <p className="text-muted-foreground mb-8">{t("description")}</p>
            <BrandWhitelistTable />
          </div>
        </div>
      </div>
    </RoleProtectedRoute>
  );
}
