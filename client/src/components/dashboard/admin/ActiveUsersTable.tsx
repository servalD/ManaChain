"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { useAdminUsersList } from "@/hooks/api/useAdminUsers";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { BanUserModal } from "./BanUserModal";
import type { UserResponse } from "@/api/generated/models";

export function ActiveUsersTable() {
  const t = useTranslations("dashboard.admin.activeUsersTable");
  const [searchQuery, setSearchQuery] = useState("");
  const [limit, setLimit] = useState<number>(10);
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 500);

  const { data, isLoading } = useAdminUsersList({
    limit,
    offset: 0,
    search: debouncedSearchQuery || undefined,
  });
  const users = data?.users ?? [];
  const total = data?.total ?? 0;

  const [banTarget, setBanTarget] = useState<UserResponse | null>(null);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/20 text-purple-400';
      case 'BRANDUSER':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-4 pt-8">
      <div>
        <h2 className="text-xl font-bold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">
          {isLoading ? t("loading") : t("resultsCount", { count: total })}
        </p>
      </div>

      {/* Search and Limit Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select 
          value={limit.toString()} 
          onValueChange={(value) => setLimit(Number(value))} 
          className="w-32"
        >
          <SelectItem value="5">5</SelectItem>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="50">50</SelectItem>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">{t("columns.user")}</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">{t("columns.id")}</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">{t("columns.role")}</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">{t("columns.created")}</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    {t("loading")}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`border-b border-border hover:bg-muted/20 transition-colors ${
                      index === users.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                            <img
                              src={user.avatarUrl}
                              alt={user.username}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-violet-400">
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-sm">{user.username}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                          {!user.verified && (
                            <div className="text-xs text-yellow-500 mt-0.5">{t("unverified")}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground font-mono">
                        {user.id.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        {user.banned ? (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">
                            {t("bannedFlag")}
                          </span>
                        ) : (
                          user.role !== "ADMIN" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
                              onClick={() => setBanTarget(user)}
                            >
                              <Ban className="h-3 w-3 mr-1" />
                              {t("banAction")}
                            </Button>
                          )
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

      <BanUserModal
        key={banTarget?.id ?? "none"}
        isOpen={!!banTarget}
        onClose={() => setBanTarget(null)}
        initialUser={banTarget}
      />
    </div>
  );
}
