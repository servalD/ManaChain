"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMyActivityHistory } from "@/hooks/api/useAuth";
import type { ActivityPointResponse } from "@/api/generated/models";

/** Formate l'historique d'activité pour l'AreaChart : score de support cumulé, jour par jour. */
function formatSupportHistory(points: ActivityPointResponse[]) {
  return points.map((point) => {
    const date = new Date(`${point.date}T00:00:00Z`);
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      value: point.supportScore,
      fullDate: point.date,
    };
  });
}

const timeRanges = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
] as const;

export function PortfolioValueChart() {
  const t = useTranslations("dashboard.client.portfolioValueChart");
  const [selectedRange, setSelectedRange] = useState<7 | 30 | 90>(30);
  const [axisColor, setAxisColor] = useState<string>("#ffffff");
  const { data: history } = useMyActivityHistory(selectedRange);
  const data = formatSupportHistory(history ?? []);

  // Get the actual color from CSS variable based on theme
  useEffect(() => {
    const updateAxisColor = () => {
      const root = document.documentElement;
      const isDark = root.classList.contains('dark');
      // Get computed style value
      const style = getComputedStyle(root);
      const foregroundColor = style.getPropertyValue('--foreground').trim();
      // Convert oklch to a usable color, or use a fallback
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
  
  const currentValue = data[data.length - 1]?.value || 0;
  const previousValue = data[0]?.value || 0;
  const change = currentValue - previousValue;
  const changePercent = previousValue > 0 ? ((change / previousValue) * 100).toFixed(2) : "0.00";
  const isPositive = change >= 0;

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">{t("title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>
          
          {/* Value and Change */}
          <div className="flex items-end gap-4">
            <div>
              <div className="text-3xl font-bold text-foreground">
                {currentValue.toLocaleString()}
              </div>
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium",
                isPositive ? "text-green-500" : "text-red-500"
              )}>
                {isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>
                  {isPositive ? "+" : ""}{changePercent}% ({isPositive ? "+" : ""}{Math.abs(change).toLocaleString()})
                </span>
              </div>
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
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                tickFormatter={(value) => `${value}`}
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
                formatter={(value: number | undefined) => [
                  (value ?? 0).toLocaleString(),
                  t("supportScoreTooltip"),
                ]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
  );
}
