"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { Navbar } from "@/components/ui/navbar";
import { useAuth } from "@/hooks/useAuth";
import { useWalletSync } from "@/hooks/useWalletSync";
import { toast } from "@/lib/toast";
import { UserLikes, PortfolioValueChart, MyTokens, UpcomingEvents, MyTickets, ActivityTimeline } from "@/components/dashboard";

export default function ClientDashboardPage() {
  const router = useRouter();
  const t = useTranslations("dashboard.client.dashboardPage");
  const { user, logout, refreshUser } = useAuth();
  const { shouldDisconnectWallet, handleWalletConnected, handleWalletDisconnected } = useWalletSync(refreshUser);

  const handleLogout = async () => {
    await logout();
    toast({
      title: t("loggedOutTitle"),
      description: t("loggedOutDescription"),
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
                {t("title")}
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

            {/* My Tickets Section */}
            <MyTickets />

            {/* Activity Timeline Section */}
            <ActivityTimeline />
          </div>
        </div>
      </div>
    </RoleProtectedRoute>
  );
}
