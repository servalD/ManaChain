"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, Ban, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import PinataService from "@/services/pinata.service";
import { useAdminActiveBrands } from "@/hooks/api/useAdminUsers";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { BanBrandModal } from "./BanBrandModal";
import { BrandDetailsModal } from "./BrandDetailsModal";
import type { BrandResponse } from "@/api/generated/models";

export function ActiveBrandsTable() {
  const t = useTranslations("dashboard.admin.activeBrandsTable");
  const [searchQuery, setSearchQuery] = useState("");
  const [limit, setLimit] = useState<number>(10);
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 500);

  const { data, isLoading } = useAdminActiveBrands({
    limit,
    offset: 0,
    search: debouncedSearchQuery || undefined,
  });
  const brands = data?.brands ?? [];
  const total = data?.total ?? 0;

  const [banTarget, setBanTarget] = useState<BrandResponse | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<BrandResponse | null>(null);

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
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">{t("columns.brand")}</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">{t("columns.country")}</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">{t("columns.created")}</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    {t("loading")}
                  </td>
                </tr>
              ) : brands.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                brands.map((brand, index) => (
                  <tr
                    key={brand.id}
                    className={`border-b border-border hover:bg-muted/20 transition-colors ${
                      index === brands.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {brand.logoUrl ? (
                          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 p-1.5 border border-border overflow-hidden">
                            <img
                              src={PinataService.normalizeIpfsUrl(brand.logoUrl)}
                              alt={brand.name}
                              className="w-full h-full object-contain"
                              style={{ maxWidth: '100%', maxHeight: '100%' }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                const parent = target.parentElement;
                                if (parent) {
                                  target.style.display = 'none';
                                  const placeholder = document.createElement('div');
                                  placeholder.className = 'w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center';
                                  placeholder.textContent = brand.name.charAt(0);
                                  parent.appendChild(placeholder);
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-violet-400">
                              {brand.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-sm">{brand.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground">{brand.country}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground">
                        {new Date(brand.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          onClick={() => setBanTarget(brand)}
                        >
                          <Ban className="h-3 w-3 mr-1" />
                          {t("banAction")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => setDetailsTarget(brand)}
                        >
                          <MoreHorizontal className="h-3 w-3 mr-1" />
                          {t("detailsAction")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BanBrandModal
        key={banTarget?.id ?? "none"}
        isOpen={!!banTarget}
        onClose={() => setBanTarget(null)}
        initialSearch={banTarget?.name}
      />
      <BrandDetailsModal brand={detailsTarget} onClose={() => setDetailsTarget(null)} />
    </div>
  );
}
