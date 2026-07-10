"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, Shield, Users, Building2, Eye, Clock, Ban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useUserBans, useBrandBans, useUnbanUser, useUnbanBrand } from "@/hooks/api/useBans";
import { BanUserModal } from "./BanUserModal";
import { BanBrandModal } from "./BanBrandModal";
import type { UserBanResponse, BrandBanResponse } from "@/api/generated/models";

type BanType = "users" | "brands";
type AnyBan = UserBanResponse | BrandBanResponse;

const isUserBan = (ban: AnyBan): ban is UserBanResponse => "userId" in ban;

export function BanManagementTable() {
  const t = useTranslations("dashboard.admin.banManagementTable");
  const [banType, setBanType] = useState<BanType>("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBan, setSelectedBan] = useState<AnyBan | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isNewUserBanOpen, setIsNewUserBanOpen] = useState(false);
  const [isNewBrandBanOpen, setIsNewBrandBanOpen] = useState(false);
  const [now] = useState(() => Date.now());

  const { data: userBansData, isLoading: userBansLoading } = useUserBans({ limit: 50, offset: 0 });
  const { data: brandBansData, isLoading: brandBansLoading } = useBrandBans({ limit: 50, offset: 0 });
  const unbanUser = useUnbanUser();
  const unbanBrand = useUnbanBrand();

  const isLoading = banType === "users" ? userBansLoading : brandBansLoading;
  const currentBans: AnyBan[] = banType === "users" ? (userBansData?.bans ?? []) : (brandBansData?.bans ?? []);

  const filteredBans = currentBans.filter((ban) => {
    const searchLower = searchQuery.toLowerCase();
    if (isUserBan(ban)) {
      return (
        (ban.username ?? "").toLowerCase().includes(searchLower) ||
        ban.reason.toLowerCase().includes(searchLower)
      );
    }
    return (
      (ban.brandName ?? "").toLowerCase().includes(searchLower) || ban.reason.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateString: string): string =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getTimeRemaining = (expiresAt: string | null): string => {
    if (!expiresAt) return t("permanent");
    const diff = new Date(expiresAt).getTime() - now;
    if (diff <= 0) return t("expired");
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return days > 0 ? t("timeRemainingDaysHours", { days, hours }) : t("timeRemainingHours", { hours });
  };

  const handleViewDetails = (ban: AnyBan) => {
    setSelectedBan(ban);
    setIsDetailsModalOpen(true);
  };

  const handleUnban = async (ban: AnyBan) => {
    if (isUserBan(ban)) {
      await unbanUser.mutateAsync({ id: ban.userId });
    } else {
      await unbanBrand.mutateAsync({ id: ban.brandId });
    }
  };

  return (
    <div className="space-y-6 pt-8 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button
          onClick={() => (banType === "users" ? setIsNewUserBanOpen(true) : setIsNewBrandBanOpen(true))}
          className="bg-linear-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("newBan")}
        </Button>
      </div>

      {/* Type Selector */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setBanType("users")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all",
            banType === "users"
              ? "border-violet-500 bg-violet-500/10 text-violet-500"
              : "border-border hover:border-violet-500/50 text-muted-foreground hover:text-foreground",
          )}
        >
          <Users className="h-4 w-4" />
          <span className="font-medium">{t("userBansTab")}</span>
        </button>
        <button
          type="button"
          onClick={() => setBanType("brands")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all",
            banType === "brands"
              ? "border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-500"
              : "border-border hover:border-fuchsia-500/50 text-muted-foreground hover:text-foreground",
          )}
        >
          <Building2 className="h-4 w-4" />
          <span className="font-medium">{t("brandBansTab")}</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={banType === "users" ? t("searchPlaceholderUsers") : t("searchPlaceholderBrands")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-4 text-left text-sm font-semibold">{banType === "users" ? t("columns.user") : t("columns.brand")}</th>
                <th className="p-4 text-left text-sm font-semibold">{t("columns.reason")}</th>
                <th className="p-4 text-left text-sm font-semibold">{t("columns.bannedBy")}</th>
                <th className="p-4 text-left text-sm font-semibold">{t("columns.date")}</th>
                <th className="p-4 text-left text-sm font-semibold">{t("columns.status")}</th>
                <th className="p-4 text-left text-sm font-semibold">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : filteredBans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                filteredBans.map((ban) => (
                  <tr key={ban.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-violet-400">
                            {(isUserBan(ban) ? ban.username : ban.brandName)?.charAt(0).toUpperCase() ?? "?"}
                          </span>
                        </div>
                        <div className="font-semibold text-sm">
                          {isUserBan(ban) ? (ban.username ?? t("deletedUser")) : (ban.brandName ?? t("deletedBrand"))}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm max-w-xs truncate" title={ban.reason}>
                        {ban.reason}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">{ban.bannedByUsername ?? "—"}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">{formatDate(ban.bannedAt)}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {ban.isActive ? (
                          <>
                            <Ban className="h-4 w-4 text-red-500" />
                            <span className="text-sm text-red-500 font-medium">{t("statusActive")}</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{t("statusLifted")}</span>
                          </>
                        )}
                      </div>
                      {ban.isPermanent ? (
                        <div className="text-xs text-muted-foreground mt-1">{t("permanent")}</div>
                      ) : ban.expiresAt ? (
                        <div className="text-xs text-muted-foreground mt-1">
                          {t("remaining", { time: getTimeRemaining(ban.expiresAt) })}
                        </div>
                      ) : null}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(ban)}>
                          <Eye className="h-4 w-4 mr-1" />
                          {t("detailsAction")}
                        </Button>
                        {ban.isActive && (
                          <Button variant="outline" size="sm" onClick={() => void handleUnban(ban)}>
                            {t("liftBan")}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-violet-500" />
              {t("detailsModal.title")}
            </DialogTitle>
            <DialogDescription>{t("detailsModal.description")}</DialogDescription>
          </DialogHeader>

          {selectedBan && (
            <div className="space-y-6 py-4">
              <div className="border border-border rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                  {isUserBan(selectedBan) ? t("detailsModal.userInformation") : t("detailsModal.brandInformation")}
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                    <span className="text-xl font-bold text-violet-400">
                      {(isUserBan(selectedBan) ? selectedBan.username : selectedBan.brandName)
                        ?.charAt(0)
                        .toUpperCase() ?? "?"}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-lg">
                      {isUserBan(selectedBan) ? (selectedBan.username ?? t("deletedUser")) : (selectedBan.brandName ?? t("deletedBrand"))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {t("detailsModal.id", { id: isUserBan(selectedBan) ? selectedBan.userId : selectedBan.brandId })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">{t("detailsModal.banInformation")}</h3>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t("columns.reason")}</label>
                  <p className="text-sm mt-1">{selectedBan.reason}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{t("columns.bannedBy")}</label>
                    <p className="text-sm mt-1">{selectedBan.bannedByUsername ?? "—"}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{t("detailsModal.bannedAt")}</label>
                    <p className="text-sm mt-1">{formatDate(selectedBan.bannedAt)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{t("detailsModal.type")}</label>
                    <p className="text-sm mt-1">
                      {selectedBan.isPermanent ? (
                        <span className="text-red-500 font-medium">{t("permanent")}</span>
                      ) : (
                        <span className="text-violet-500 font-medium">{t("detailsModal.temporary")}</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{t("detailsModal.expiresAt")}</label>
                    <p className="text-sm mt-1">
                      {selectedBan.isPermanent ? (
                        <span className="text-muted-foreground">{t("detailsModal.never")}</span>
                      ) : selectedBan.expiresAt ? (
                        <>
                          <span>{formatDate(selectedBan.expiresAt)}</span>
                          <span className="text-xs text-muted-foreground block mt-1">
                            {t("remainingParenthesized", { time: getTimeRemaining(selectedBan.expiresAt) })}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">{t("detailsModal.notSet")}</span>
                      )}
                    </p>
                  </div>
                </div>

                {!isUserBan(selectedBan) && (selectedBan.blacklistTxHash || selectedBan.cancelSaleTxHash) && (
                  <div className="grid grid-cols-1 gap-2">
                    {selectedBan.blacklistTxHash && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">{t("detailsModal.blacklistTx")}</label>
                        <p className="text-xs font-mono mt-1 break-all">{selectedBan.blacklistTxHash}</p>
                      </div>
                    )}
                    {selectedBan.cancelSaleTxHash && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">{t("detailsModal.cancelSaleTx")}</label>
                        <p className="text-xs font-mono mt-1 break-all">{selectedBan.cancelSaleTxHash}</p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t("columns.status")}</label>
                  <p className="text-sm mt-1">
                    {selectedBan.isActive ? (
                      <span className="text-red-500 font-medium flex items-center gap-2">
                        <Ban className="h-4 w-4" />
                        {t("statusActive")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {t("statusLifted")}
                      </span>
                    )}
                  </p>
                </div>

                {selectedBan.notes && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{t("detailsModal.internalNotes")}</label>
                    <p className="text-sm mt-1 p-3 bg-muted/50 rounded-md whitespace-pre-wrap">{selectedBan.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BanUserModal isOpen={isNewUserBanOpen} onClose={() => setIsNewUserBanOpen(false)} />
      <BanBrandModal isOpen={isNewBrandBanOpen} onClose={() => setIsNewBrandBanOpen(false)} />
    </div>
  );
}
