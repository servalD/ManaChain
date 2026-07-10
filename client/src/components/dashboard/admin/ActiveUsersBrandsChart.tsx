"use client";

import { useTranslations } from "next-intl";
import { Users, Building2 } from "lucide-react";
import { useAdminUsersList, useAdminActiveBrands } from "@/hooks/api/useAdminUsers";

export function ActiveUsersBrandsChart() {
  const t = useTranslations("dashboard.admin.activeUsersBrandsChart");
  const { data: usersData, isLoading: usersLoading } = useAdminUsersList({ limit: 1, offset: 0 });
  const { data: brandsData, isLoading: brandsLoading } = useAdminActiveBrands({ limit: 1, offset: 0 });

  const totalUsers = usersData?.total ?? 0;
  const totalBrands = brandsData?.total ?? 0;
  const isLoading = usersLoading || brandsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-1">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-stretch gap-4">
        <div className="flex-1 min-w-[180px] border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-violet-500" />
            <span className="text-sm text-muted-foreground">{t("users")}</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {isLoading ? "…" : totalUsers.toLocaleString()}
          </div>
        </div>
        <div className="flex-1 min-w-[180px] border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-4 w-4 text-fuchsia-500" />
            <span className="text-sm text-muted-foreground">{t("brands")}</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {isLoading ? "…" : totalBrands.toLocaleString()}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{t("snapshotNote")}</p>
    </div>
  );
}
