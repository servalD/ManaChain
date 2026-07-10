"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Calendar, MapPin } from "lucide-react";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { Navbar } from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useWalletSync } from "@/hooks/useWalletSync";
import { toast } from "@/lib/toast";
import { useEvents } from "@/hooks/api/useEvents";
import { TicketPurchaseModal } from "@/components/ui/ticket-purchase-modal/TicketPurchaseModal";
import PinataService from "@/services/pinata.service";
import type { EventResponse } from "@/api/generated/models";

export default function EventsPage() {
  const router = useRouter();
  const t = useTranslations("events.page");
  const locale = useLocale();
  const dateLocale = locale === "fr" ? "fr-FR" : "en-US";
  const { user, logout, refreshUser } = useAuth();
  const { shouldDisconnectWallet, handleWalletConnected, handleWalletDisconnected } = useWalletSync(refreshUser);
  const { data, isLoading } = useEvents({ limit: 50, offset: 0 });
  const events = data?.events ?? [];

  const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast({ title: t("loggedOutTitle"), description: t("loggedOutMessage"), variant: "success" });
  };
  const handleProfile = () => router.push("/profile");

  const openPurchase = (event: EventResponse) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const location = (event: EventResponse) =>
    [event.addressCity, event.addressCountry].filter(Boolean).join(", ") || t("onlineOrTba");

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(dateLocale, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <RoleProtectedRoute allowedRoles={["CLIENT"]}>
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
          <div className="max-w-6xl mx-auto space-y-6">
            <h1 className="text-3xl sm:text-4xl font-bold">
              <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
                {t("title")}
              </span>
            </h1>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-20 border border-border rounded-lg">
                <p className="text-muted-foreground">{t("noEventsPublished")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="border border-border rounded-lg overflow-hidden flex flex-col hover:border-violet-500/50 transition-colors"
                  >
                    <div className="h-36 bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                      {event.coverImageUrl ? (
                        <img
                          src={PinataService.normalizeIpfsUrl(event.coverImageUrl)}
                          alt={event.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <span className="text-2xl font-bold text-violet-400">{event.title.charAt(0)}</span>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col gap-3">
                      <div>
                        <h3 className="font-semibold">{event.title}</h3>
                        <span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-500/10 text-violet-500">
                          {event.type}
                        </span>
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                      )}
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4 shrink-0" />
                        {formatDate(event.startsAt)}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0" />
                        {location(event)}
                      </div>
                      <Button
                        onClick={() => openPurchase(event)}
                        disabled={!event.ticketSaleAddress}
                        className="mt-auto w-full bg-linear-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                      >
                        {event.ticketSaleAddress ? t("getTickets") : t("ticketsComingSoon")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <TicketPurchaseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
      />
    </RoleProtectedRoute>
  );
}
