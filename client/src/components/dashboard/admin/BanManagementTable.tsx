"use client";

import { useState } from "react";
import { Search, Shield, Users, Building2, Eye, Clock, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import PinataService from "@/services/pinata.service";

type BanType = 'users' | 'brands';

interface UserBan {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_avatar: string | null;
  reason: string;
  banned_by: string;
  banned_by_name: string;
  banned_at: string;
  expires_at: string | null;
  is_permanent: boolean;
  notes: string | null;
}

interface BrandBan {
  id: string;
  brand_id: string;
  brand_name: string;
  brand_logo: string | null;
  reason: string;
  banned_by: string;
  banned_by_name: string;
  banned_at: string;
  expires_at: string | null;
  is_permanent: boolean;
  notes: string | null;
}

// Mock data
const mockUserBans: UserBan[] = [
  {
    id: "1",
    user_id: "user-1",
    user_name: "John Doe",
    user_email: "john@example.com",
    user_avatar: null,
    reason: "Violation of terms of service - spam activity",
    banned_by: "admin-1",
    banned_by_name: "Admin User",
    banned_at: "2024-01-15T10:00:00Z",
    expires_at: "2024-02-15T10:00:00Z",
    is_permanent: false,
    notes: "User was sending spam messages to multiple users",
  },
  {
    id: "2",
    user_id: "user-2",
    user_name: "Jane Smith",
    user_email: "jane@example.com",
    user_avatar: null,
    reason: "Inappropriate content and harassment",
    banned_by: "admin-1",
    banned_by_name: "Admin User",
    banned_at: "2024-01-10T14:30:00Z",
    expires_at: null,
    is_permanent: true,
    notes: "Permanent ban due to repeated violations",
  },
  {
    id: "3",
    user_id: "user-3",
    user_name: "Bob Johnson",
    user_email: "bob@example.com",
    user_avatar: null,
    reason: "Fraudulent activity detected",
    banned_by: "admin-2",
    banned_by_name: "Super Admin",
    banned_at: "2024-01-20T09:15:00Z",
    expires_at: "2024-04-20T09:15:00Z",
    is_permanent: false,
    notes: "User attempted to manipulate token prices",
  },
];

const mockBrandBans: BrandBan[] = [
  {
    id: "1",
    brand_id: "brand-1",
    brand_name: "Fake Fashion Co",
    brand_logo: null,
    reason: "Misleading advertising and false claims",
    banned_by: "admin-1",
    banned_by_name: "Admin User",
    banned_at: "2024-01-18T11:00:00Z",
    expires_at: "2024-03-18T11:00:00Z",
    is_permanent: false,
    notes: "Brand was making false claims about product quality",
  },
  {
    id: "2",
    brand_id: "brand-2",
    brand_name: "Scam Token Inc",
    brand_logo: null,
    reason: "Fraudulent token distribution",
    banned_by: "admin-2",
    banned_by_name: "Super Admin",
    banned_at: "2024-01-12T16:45:00Z",
    expires_at: null,
    is_permanent: true,
    notes: "Permanent ban - brand was running a scam operation",
  },
];

export function BanManagementTable() {
  const [banType, setBanType] = useState<BanType>('users');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBan, setSelectedBan] = useState<UserBan | BrandBan | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const currentBans = banType === 'users' ? mockUserBans : mockBrandBans;

  const filteredBans = currentBans.filter((ban) => {
    const searchLower = searchQuery.toLowerCase();
    if (banType === 'users') {
      const userBan = ban as UserBan;
      return (
        userBan.user_name.toLowerCase().includes(searchLower) ||
        userBan.user_email.toLowerCase().includes(searchLower) ||
        userBan.reason.toLowerCase().includes(searchLower)
      );
    } else {
      const brandBan = ban as BrandBan;
      return (
        brandBan.brand_name.toLowerCase().includes(searchLower) ||
        brandBan.reason.toLowerCase().includes(searchLower)
      );
    }
  });

  const isBanActive = (ban: UserBan | BrandBan): boolean => {
    if (ban.is_permanent) return true;
    if (!ban.expires_at) return true;
    return new Date(ban.expires_at) > new Date();
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeRemaining = (expiresAt: string | null): string => {
    if (!expiresAt) return "Permanent";
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}j ${hours}h`;
    return `${hours}h`;
  };

  const handleViewDetails = (ban: UserBan | BrandBan) => {
    setSelectedBan(ban);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6 pt-8 w-full">
      <div>
        <h2 className="text-xl font-bold">Ban Management</h2>
        <p className="text-sm text-muted-foreground">
          View and manage user and brand bans
        </p>
      </div>

      {/* Type Selector */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setBanType('users')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all",
            banType === 'users'
              ? "border-violet-500 bg-violet-500/10 text-violet-500"
              : "border-border hover:border-violet-500/50 text-muted-foreground hover:text-foreground"
          )}
        >
          <Users className="h-4 w-4" />
          <span className="font-medium">User Bans</span>
        </button>
        <button
          type="button"
          onClick={() => setBanType('brands')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all",
            banType === 'brands'
              ? "border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-500"
              : "border-border hover:border-fuchsia-500/50 text-muted-foreground hover:text-foreground"
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
          placeholder={`Search ${banType === 'users' ? 'users' : 'brands'} by name, email, or reason...`}
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
                <th className="p-4 text-left text-sm font-semibold">
                  {banType === 'users' ? 'User' : 'Brand'}
                </th>
                <th className="p-4 text-left text-sm font-semibold">Reason</th>
                <th className="p-4 text-left text-sm font-semibold">Banned By</th>
                <th className="p-4 text-left text-sm font-semibold">Date</th>
                <th className="p-4 text-left text-sm font-semibold">Status</th>
                <th className="p-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No bans found
                  </td>
                </tr>
              ) : (
                filteredBans.map((ban) => {
                  const isActive = isBanActive(ban);
                  
                  return (
                    <tr
                      key={ban.id}
                      className="border-t border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4">
                        {banType === 'users' ? (
                          <div className="flex items-center gap-3">
                            {(ban as UserBan).user_avatar ? (
                              <div className="w-10 h-10 rounded-full bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                                <img
                                  src={PinataService.normalizeIpfsUrl((ban as UserBan).user_avatar!)}
                                  alt={(ban as UserBan).user_name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                                <span className="text-sm font-bold text-violet-400">
                                  {(ban as UserBan).user_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-sm">{(ban as UserBan).user_name}</div>
                              <div className="text-xs text-muted-foreground">{(ban as UserBan).user_email}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            {(ban as BrandBan).brand_logo ? (
                              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 p-1.5 border border-border overflow-hidden">
                                <img
                                  src={PinataService.normalizeIpfsUrl((ban as BrandBan).brand_logo!)}
                                  alt={(ban as BrandBan).brand_name}
                                  className="w-full h-full object-contain"
                                  style={{ maxWidth: '100%', maxHeight: '100%' }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    const parent = target.parentElement;
                                    if (parent) {
                                      target.style.display = 'none';
                                      const placeholder = document.createElement('div');
                                      placeholder.className = 'w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center';
                                      placeholder.textContent = (ban as BrandBan).brand_name.charAt(0);
                                      parent.appendChild(placeholder);
                                    }
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                                <span className="text-sm font-bold text-violet-400">
                                  {(ban as BrandBan).brand_name.charAt(0)}
                                </span>
                              </div>
                            )}
                            <div className="font-semibold text-sm">{(ban as BrandBan).brand_name}</div>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-sm max-w-xs truncate" title={ban.reason}>
                          {ban.reason}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{ban.banned_by_name}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{formatDate(ban.banned_at)}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {isActive ? (
                            <>
                              <Ban className="h-4 w-4 text-red-500" />
                              <span className="text-sm text-red-500 font-medium">Active</span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Expired</span>
                            </>
                          )}
                        </div>
                        {ban.is_permanent ? (
                          <div className="text-xs text-muted-foreground mt-1">Permanent</div>
                        ) : ban.expires_at ? (
                          <div className="text-xs text-muted-foreground mt-1">
                            {getTimeRemaining(ban.expires_at)} remaining
                          </div>
                        ) : null}
                      </td>
                      <td className="p-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(ban)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Details
                        </Button>
                      </td>
                    </tr>
                  );
                })
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
            <DialogDescription>
              Complete information about this ban
            </DialogDescription>
          </DialogHeader>
          
          {selectedBan && (
            <div className="space-y-6 py-4">
              {/* User/Brand Info */}
              <div className="border border-border rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                  {banType === 'users' ? 'USER INFORMATION' : 'BRAND INFORMATION'}
                </h3>
                {banType === 'users' ? (
                  <div className="flex items-center gap-4">
                    {(selectedBan as UserBan).user_avatar ? (
                      <div className="w-16 h-16 rounded-full bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                        <img
                          src={PinataService.normalizeIpfsUrl((selectedBan as UserBan).user_avatar!)}
                          alt={(selectedBan as UserBan).user_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                        <span className="text-xl font-bold text-violet-400">
                          {(selectedBan as UserBan).user_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-lg">{(selectedBan as UserBan).user_name}</div>
                      <div className="text-sm text-muted-foreground">{(selectedBan as UserBan).user_email}</div>
                      <div className="text-xs text-muted-foreground mt-1">ID: {(selectedBan as UserBan).user_id}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    {(selectedBan as BrandBan).brand_logo ? (
                      <div className="w-16 h-16 rounded-lg bg-white flex items-center justify-center shrink-0 p-2 border border-border overflow-hidden">
                        <img
                          src={PinataService.normalizeIpfsUrl((selectedBan as BrandBan).brand_logo!)}
                          alt={(selectedBan as BrandBan).brand_name}
                          className="w-full h-full object-contain"
                          style={{ maxWidth: '100%', maxHeight: '100%' }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const parent = target.parentElement;
                            if (parent) {
                              target.style.display = 'none';
                              const placeholder = document.createElement('div');
                              placeholder.className = 'w-16 h-16 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center';
                              placeholder.textContent = (selectedBan as BrandBan).brand_name.charAt(0);
                              parent.appendChild(placeholder);
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                        <span className="text-xl font-bold text-violet-400">
                          {(selectedBan as BrandBan).brand_name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-lg">{(selectedBan as BrandBan).brand_name}</div>
                      <div className="text-xs text-muted-foreground mt-1">ID: {(selectedBan as BrandBan).brand_id}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Ban Details */}
              <div className="border border-border rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">BAN INFORMATION</h3>
                
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Reason</label>
                  <p className="text-sm mt-1">{selectedBan.reason}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Banned By</label>
                    <p className="text-sm mt-1">{selectedBan.banned_by_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">ID: {selectedBan.banned_by}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Banned At</label>
                    <p className="text-sm mt-1">{formatDate(selectedBan.banned_at)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Type</label>
                    <p className="text-sm mt-1">
                      {selectedBan.is_permanent ? (
                        <span className="text-red-500 font-medium">Permanent</span>
                      ) : (
                        <span className="text-violet-500 font-medium">Temporary</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Expires At</label>
                    <p className="text-sm mt-1">
                      {selectedBan.is_permanent ? (
                        <span className="text-muted-foreground">Never</span>
                      ) : selectedBan.expires_at ? (
                        <>
                          <span>{formatDate(selectedBan.expires_at)}</span>
                          <span className="text-xs text-muted-foreground block mt-1">
                            ({getTimeRemaining(selectedBan.expires_at)} remaining)
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <p className="text-sm mt-1">
                    {isBanActive(selectedBan) ? (
                      <span className="text-red-500 font-medium flex items-center gap-2">
                        <Ban className="h-4 w-4" />
                        Active
                      </span>
                    ) : (
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Expired
                      </span>
                    )}
                  </p>
                </div>

                {selectedBan.notes && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Internal Notes</label>
                    <p className="text-sm mt-1 p-3 bg-muted/50 rounded-md whitespace-pre-wrap">
                      {selectedBan.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
