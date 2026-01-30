"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Users, Heart, Coins, DollarSign, Image as ImageIcon, Scissors, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import PinataService from "@/services/pinata.service";

// Mock data generator for holders and likes over time
const generateMockData = (days: number, hasToken: boolean) => {
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
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
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
  brandName?: string;
  brandLogo?: string | null;
}

// Mock token data
const mockTokenData = {
  symbol: "BRAND",
  totalSupply: 1000000,
  holders: 150,
  basePrice: 0.50,
};

export function MyBrandChart({ brandId, hasToken = false, brandName = "My Brand", brandLogo = null }: MyBrandChartProps) {
  const [selectedRange, setSelectedRange] = useState<number>(30);
  const [axisColor, setAxisColor] = useState<string>("#ffffff");
  const data = generateMockData(selectedRange, hasToken);
  
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
                  alt={brandName}
                  className="w-full h-full object-contain p-1"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const parent = target.parentElement;
                    if (parent) {
                      target.style.display = 'none';
                      const placeholder = document.createElement('div');
                      placeholder.className = 'w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center';
                      placeholder.textContent = getInitials(brandName);
                      parent.appendChild(placeholder);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-violet-400">
                  {getInitials(brandName)}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold mb-1">{brandName}</h2>
              <p className="text-sm text-muted-foreground">
                Create your NFT and fractionalize it to engage with your community
              </p>
            </div>
          </div>
          
          {/* Likes Stats */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart className="h-4 w-4 text-fuchsia-500 fill-fuchsia-500" />
              <span className="text-xs text-muted-foreground">Likes</span>
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
                formatter={(value: number | undefined) => [value?.toLocaleString() || 0, 'Likes']}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
                formatter={() => 'Likes'}
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

        {/* NFT Creation Interface */}
        <div className="border border-border rounded-lg p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Create & Fractionalize Your NFT</h3>
            <p className="text-sm text-muted-foreground">
              Create a unique NFT representing your brand and fractionalize it into tokens for your community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1: Create NFT */}
            <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <h4 className="font-semibold">Step 1: Create NFT</h4>
                  <p className="text-xs text-muted-foreground">Upload your brand NFT</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">NFT Name</label>
                  <input
                    type="text"
                    placeholder="My Brand NFT"
                    disabled
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">NFT Description</label>
                  <textarea
                    placeholder="Describe your brand NFT..."
                    disabled
                    rows={3}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Upload Image</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
                <Button disabled className="w-full" variant="outline">
                  Create NFT
                </Button>
              </div>
            </div>

            {/* Step 2: Fractionalize */}
            <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
                  <Scissors className="h-5 w-5 text-fuchsia-500" />
                </div>
                <div>
                  <h4 className="font-semibold">Step 2: Fractionalize</h4>
                  <p className="text-xs text-muted-foreground">Split NFT into tokens</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Token Symbol</label>
                  <input
                    type="text"
                    placeholder="BRAND"
                    disabled
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Total Supply</label>
                  <input
                    type="number"
                    placeholder="1000000"
                    disabled
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Base Price (USD)</label>
                  <input
                    type="number"
                    placeholder="0.50"
                    step="0.01"
                    disabled
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <Button disabled className="w-full" variant="outline">
                  Fractionalize NFT
                </Button>
              </div>
            </div>
          </div>
        </div>
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
                alt={brandName}
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const parent = target.parentElement;
                  if (parent) {
                    target.style.display = 'none';
                    const placeholder = document.createElement('div');
                    placeholder.className = 'w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center';
                    placeholder.textContent = getInitials(brandName);
                    parent.appendChild(placeholder);
                  }
                }}
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-violet-400">
                {getInitials(brandName)}
              </span>
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold mb-1">{brandName}</h2>
            <p className="text-sm text-muted-foreground">
              Track your token holders and community engagement
            </p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex items-end gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-violet-500" />
              <span className="text-xs text-muted-foreground">Holders</span>
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
              <span className="text-xs text-muted-foreground">Likes</span>
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
                if (name === 'holders') return [value?.toLocaleString() || 0, 'Holders'];
                if (name === 'likes') return [value?.toLocaleString() || 0, 'Likes'];
                return [value ?? 0, name || ''];
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
              formatter={(value) => {
                if (value === 'holders') return 'Holders';
                if (value === 'likes') return 'Likes';
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

      {/* Token Information */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Token Symbol</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">In Circulation</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Holders</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Base Price</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border hover:bg-muted/20 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-violet-500" />
                    <span className="font-semibold text-sm">{mockTokenData.symbol}</span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <span className="font-semibold text-sm">{mockTokenData.totalSupply.toLocaleString()}</span>
                </td>
                <td className="p-4 text-right">
                  <span className="font-semibold text-sm">{mockTokenData.holders.toLocaleString()}</span>
                </td>
                <td className="p-4 text-right">
                  <span className="font-semibold text-sm">${mockTokenData.basePrice.toFixed(2)}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                    >
                      <MoreHorizontal className="h-3 w-3 mr-1" />
                      More Details
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
