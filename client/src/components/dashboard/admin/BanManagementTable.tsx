"use client";

import { useState } from "react";
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
    if (!expiresAt) return "Permanent";
    const diff = new Date(expiresAt).getTime() - now;
    if (diff <= 0) return "Expired";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
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
          <h2 className="text-xl font-bold">Ban Management</h2>
          <p className="text-sm text-muted-foreground">View and manage user and brand bans</p>
        </div>
        <Button
          onClick={() => (banType === "users" ? setIsNewUserBanOpen(true) : setIsNewBrandBanOpen(true))}
          className="bg-linear-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Ban
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
          <span className="font-medium">User Bans</span>
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
          <span className="font-medium">Brand Bans</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`Search ${banType === "users" ? "users" : "brands"} by name or reason…`}
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
                <th className="p-4 text-left text-sm font-semibold">{banType === "users" ? "User" : "Brand"}</th>
                <th className="p-4 text-left text-sm font-semibold">Reason</th>
                <th className="p-4 text-left text-sm font-semibold">Banned By</th>
                <th className="p-4 text-left text-sm font-semibold">Date</th>
                <th className="p-4 text-left text-sm font-semibold">Status</th>
                <th className="p-4 text-left text-sm font-semibold">Actions</th>
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
                    No bans found
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
                          {isUserBan(ban) ? (ban.username ?? "Deleted user") : (ban.brandName ?? "Deleted brand")}
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
                            <span className="text-sm text-red-500 font-medium">Active</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Lifted</span>
                          </>
                        )}
                      </div>
                      {ban.isPermanent ? (
                        <div className="text-xs text-muted-foreground mt-1">Permanent</div>
                      ) : ban.expiresAt ? (
                        <div className="text-xs text-muted-foreground mt-1">
                          {getTimeRemaining(ban.expiresAt)} remaining
                        </div>
                      ) : null}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(ban)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                        {ban.isActive && (
                          <Button variant="outline" size="sm" onClick={() => void handleUnban(ban)}>
                            Lift ban
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
              Ban Details
            </DialogTitle>
            <DialogDescription>Complete information about this ban</DialogDescription>
          </DialogHeader>

          {selectedBan && (
            <div className="space-y-6 py-4">
              <div className="border border-border rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                  {isUserBan(selectedBan) ? "USER INFORMATION" : "BRAND INFORMATION"}
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
                      {isUserBan(selectedBan) ? (selectedBan.username ?? "Deleted user") : (selectedBan.brandName ?? "Deleted brand")}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      ID: {isUserBan(selectedBan) ? selectedBan.userId : selectedBan.brandId}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">BAN INFORMATION</h3>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Reason</label>
                  <p className="text-sm mt-1">{selectedBan.reason}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Banned By</label>
                    <p className="text-sm mt-1">{selectedBan.bannedByUsername ?? "—"}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Banned At</label>
                    <p className="text-sm mt-1">{formatDate(selectedBan.bannedAt)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Type</label>
                    <p className="text-sm mt-1">
                      {selectedBan.isPermanent ? (
                        <span className="text-red-500 font-medium">Permanent</span>
                      ) : (
                        <span className="text-violet-500 font-medium">Temporary</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Expires At</label>
                    <p className="text-sm mt-1">
                      {selectedBan.isPermanent ? (
                        <span className="text-muted-foreground">Never</span>
                      ) : selectedBan.expiresAt ? (
                        <>
                          <span>{formatDate(selectedBan.expiresAt)}</span>
                          <span className="text-xs text-muted-foreground block mt-1">
                            ({getTimeRemaining(selectedBan.expiresAt)} remaining)
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </p>
                  </div>
                </div>

                {!isUserBan(selectedBan) && (selectedBan.blacklistTxHash || selectedBan.cancelSaleTxHash) && (
                  <div className="grid grid-cols-1 gap-2">
                    {selectedBan.blacklistTxHash && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Blacklist tx</label>
                        <p className="text-xs font-mono mt-1 break-all">{selectedBan.blacklistTxHash}</p>
                      </div>
                    )}
                    {selectedBan.cancelSaleTxHash && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Cancel-sale tx</label>
                        <p className="text-xs font-mono mt-1 break-all">{selectedBan.cancelSaleTxHash}</p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <p className="text-sm mt-1">
                    {selectedBan.isActive ? (
                      <span className="text-red-500 font-medium flex items-center gap-2">
                        <Ban className="h-4 w-4" />
                        Active
                      </span>
                    ) : (
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Lifted
                      </span>
                    )}
                  </p>
                </div>

                {selectedBan.notes && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Internal Notes</label>
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
