"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useAccount } from "wagmi";
import { Plus, X } from "lucide-react";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { Navbar } from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useWalletSync } from "@/hooks/useWalletSync";
import { toast } from "@/lib/toast";
import { useMyBrandEvents } from "@/hooks/api/useEvents";
import { EventSetupWizard } from "@/components/dashboard/brand/EventSetupWizard";

export default function BrandEventsPage() {
  const t = useTranslations("dashboard.brand.eventsPage");
  const locale = useLocale();
  const dateLocale = locale === "fr" ? "fr-FR" : "en-US";
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const { shouldDisconnectWallet, handleWalletConnected, handleWalletDisconnected } = useWalletSync(refreshUser);
  const { address } = useAccount();
  const [isCreating, setIsCreating] = useState(false);

  const { data, isLoading } = useMyBrandEvents({ limit: 50, offset: 0 });
  const events = data?.events ?? [];

  const handleLogout = async () => {
    await logout();
    toast({ title: t("toasts.loggedOutTitle"), description: t("toasts.loggedOutMessage"), variant: "success" });
  };
  const handleProfile = () => router.push("/profile");

  return (
    <RoleProtectedRoute allowedRoles={["BRANDUSER"]}>
      <div className="min-h-screen bg-background">
        <Navbar
          currentPage="events"
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
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl sm:text-4xl font-bold">
                <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
                  {t("heading")}
                </span>
              </h1>
              {!isCreating && (
                <Button onClick={() => setIsCreating(true)} disabled={!address}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("createEvent")}
                </Button>
              )}
            </div>

            {!address && (
              <p className="text-sm text-muted-foreground">
                {t("connectWalletHint")}
              </p>
            )}

            {isCreating && address ? (
              <div className="space-y-3">
                <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
                  <X className="h-4 w-4 mr-2" />
                  {t("cancel")}
                </Button>
                <EventSetupWizard brandAddress={address} onDone={() => setIsCreating(false)} />
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
              </div>
            ) : events.length === 0 ? (
              <div className="border border-border rounded-lg p-12 text-center text-muted-foreground text-sm">
                {t("noEvents")}
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">{t("table.title")}</th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">{t("table.starts")}</th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">{t("table.status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event.id} className="border-b border-border last:border-b-0">
                        <td className="p-4 font-medium text-sm">{event.title}</td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(event.startsAt).toLocaleDateString(dateLocale, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-500/10 text-violet-500">
                            {t.has(`table.statusValues.${event.status}`) ? t(`table.statusValues.${event.status}`) : event.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleProtectedRoute>
  );
}
