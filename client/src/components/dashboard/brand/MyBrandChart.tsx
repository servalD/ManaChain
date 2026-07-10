"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatUnits } from "viem";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Users, Heart, Coins, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import PinataService from "@/services/pinata.service";
import { TokenSetupWizard } from "./TokenSetupWizard";
import { useTokenHoldersCount } from "@/hooks/api/useTokens";
import type { TokenResponse } from "@/api/generated/models";

// Mock data generator for holders and likes over time
const generateMockData = (days: number, hasToken: boolean, dateLocale: string) => {
  const data = [];
  const today = new Date();
  const baseHolders = hasToken ? 150 : 0;
  const baseLikes = 45;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Generate realistic fluctuations
    const holdersVariation = hasToken ? Math.floor((Math.random() - 0.3) * 10) : 0;
    const likesVariation = Math.floor((Math.random() - 0.2) * 3);
    const holdersTrend = hasToken ? Math.floor((days - i) * 0.5) : 0;
    const likesTrend = Math.floor((days - i) * 0.2);

    const holders = Math.max(0, baseHolders + holdersVariation + holdersTrend);
    const likes = Math.max(0, baseLikes + likesVariation + likesTrend);

    data.push({
      date: date.toLocaleDateString(dateLocale, { month: "short", day: "numeric" }),
      holders: holders,
      likes: likes,
      fullDate: date.toISOString(),
    });
  }

  return data;
};

const timeRanges = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
] as const;

interface MyBrandChartProps {
  brandId: string;
  hasToken?: boolean;
  token?: TokenResponse;
  brandName?: string;
  brandLogo?: string | null;
}

export function MyBrandChart({ brandId, hasToken = false, token, brandName, brandLogo = null }: MyBrandChartProps) {
  const t = useTranslations("dashboard.brand.myBrandChart");
  const locale = useLocale();
  const dateLocale = locale === "fr" ? "fr-FR" : "en-US";
  const resolvedBrandName = brandName ?? t("defaultBrandName");
  const { data: holdersPage } = useTokenHoldersCount(token?.id, { enabled: hasToken });
  const [selectedRange, setSelectedRange] = useState<number>(30);
  const [axisColor, setAxisColor] = useState<string>("#ffffff");
  const data = generateMockData(selectedRange, hasToken, dateLocale);
  
  // Get the actual color from CSS variable based on theme
  useEffect(() => {
    const updateAxisColor = () => {
      const root = document.documentElement;
      const isDark = root.classList.contains('dark');
      setAxisColor(isDark ? "#ffffff" : "#000000");
    };

    updateAxisColor();

    // Watch for theme changes
    const observer = new MutationObserver(updateAxisColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const currentHolders = data[data.length - 1]?.holders || 0;
  const currentLikes = data[data.length - 1]?.likes || 0;
  const previousHolders = data[0]?.holders || 0;
  const previousLikes = data[0]?.likes || 0;
  
  const holdersChange = currentHolders - previousHolders;
  const likesChange = currentLikes - previousLikes;

  // Get initials from brand name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // If no token, show likes only with NFT creation interface
  if (!hasToken) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            {brandLogo ? (
              <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shrink-0 border border-border overflow-hidden">
                <img
                  src={PinataService.normalizeIpfsUrl(brandLogo)}
                  alt={resolvedBrandName}
                  className="w-full h-full object-contain p-1"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const parent = target.parentElement;
                    if (parent) {
                      target.style.display = 'none';
                      const placeholder = document.createElement('div');
                      placeholder.className = 'w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center';
                      placeholder.textContent = getInitials(resolvedBrandName);
                      parent.appendChild(placeholder);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-violet-400">
                  {getInitials(resolvedBrandName)}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold mb-1">{resolvedBrandName}</h2>
              <p className="text-sm text-muted-foreground">
                {t("noTokenSubtitle")}
              </p>
            </div>
          </div>

          {/* Likes Stats */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart className="h-4 w-4 text-fuchsia-500 fill-fuchsia-500" />
              <span className="text-xs text-muted-foreground">{t("likes")}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {currentLikes.toLocaleString()}
            </div>
            {previousLikes > 0 && (
              <div className={cn(
                "text-xs font-medium",
                likesChange >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {likesChange >= 0 ? "+" : ""}{likesChange}
              </div>
            )}
          </div>
        </div>

        {/* Likes Chart Only */}
        <div className="h-64 w-full border border-border rounded-lg p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                stroke={axisColor}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke={axisColor}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }}
                labelStyle={{
                  color: "hsl(var(--foreground))",
                  fontWeight: 600,
                }}
                formatter={(value: number | undefined) => [value?.toLocaleString() || 0, t("likes")]}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
                formatter={() => t("likes")}
              />
              <Line
                type="monotone"
                dataKey="likes"
                stroke="#d946ef"
                strokeWidth={2}
                dot={false}
                name="likes"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Token setup wizard — état dérivé de la chaîne, voir TokenSetupWizard */}
        <TokenSetupWizard brandId={brandId} />
      </div>
    );
  }

  // If token exists, show chart with holders and likes, then token info
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {brandLogo ? (
            <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shrink-0 border border-border overflow-hidden">
              <img
                src={PinataService.normalizeIpfsUrl(brandLogo)}
                alt={resolvedBrandName}
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const parent = target.parentElement;
                  if (parent) {
                    target.style.display = 'none';
                    const placeholder = document.createElement('div');
                    placeholder.className = 'w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center';
                    placeholder.textContent = getInitials(resolvedBrandName);
                    parent.appendChild(placeholder);
                  }
                }}
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-violet-400">
                {getInitials(resolvedBrandName)}
              </span>
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold mb-1">{resolvedBrandName}</h2>
            <p className="text-sm text-muted-foreground">
              {t("engagementSubtitle")}
            </p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex items-end gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-violet-500" />
              <span className="text-xs text-muted-foreground">{t("holders")}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {currentHolders.toLocaleString()}
            </div>
            {previousHolders > 0 && (
              <div className={cn(
                "text-xs font-medium",
                holdersChange >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {holdersChange >= 0 ? "+" : ""}{holdersChange}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart className="h-4 w-4 text-fuchsia-500 fill-fuchsia-500" />
              <span className="text-xs text-muted-foreground">{t("likes")}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {currentLikes.toLocaleString()}
            </div>
            {previousLikes > 0 && (
              <div className={cn(
                "text-xs font-medium",
                likesChange >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {likesChange >= 0 ? "+" : ""}{likesChange}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {timeRanges.map((range) => (
          <button
            key={range.label}
            onClick={() => setSelectedRange(range.days)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              selectedRange === range.days
                ? "bg-violet-500 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64 w-full border border-border rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke={axisColor}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke={axisColor}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                padding: "8px 12px",
              }}
              labelStyle={{
                color: "hsl(var(--foreground))",
                fontWeight: 600,
              }}
              formatter={(value: number | undefined, name: string | undefined) => {
                if (name === 'holders') return [value?.toLocaleString() || 0, t("holders")];
                if (name === 'likes') return [value?.toLocaleString() || 0, t("likes")];
                return [value ?? 0, name || ''];
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
              formatter={(value) => {
                if (value === 'holders') return t("holders");
                if (value === 'likes') return t("likes");
                return value;
              }}
            />
            <Line
              type="monotone"
              dataKey="holders"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
              name="holders"
            />
            <Line
              type="monotone"
              dataKey="likes"
              stroke="#d946ef"
              strokeWidth={2}
              dot={false}
              name="likes"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Badge Information */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">{t("table.badgeSymbol")}</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">{t("table.inCirculation")}</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">{t("table.holders")}</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">{t("table.basePrice")}</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">{t("table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border hover:bg-muted/20 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-violet-500" />
                    <span className="font-semibold text-sm">{token?.symbol ?? "—"}</span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <span className="font-semibold text-sm">
                    {(token?.totalSupply ?? 0).toLocaleString()}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <span className="font-semibold text-sm">{(holdersPage?.total ?? 0).toLocaleString()}</span>
                </td>
                <td className="p-4 text-right">
                  <span className="font-semibold text-sm">
                    {token?.sale
                      ? `$${formatUnits(BigInt(token.sale.pricePerToken), 6)}`
                      : `$${token?.currentPrice ?? "0"}`}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                    >
                      <MoreHorizontal className="h-3 w-3 mr-1" />
                      {t("table.moreDetails")}
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
