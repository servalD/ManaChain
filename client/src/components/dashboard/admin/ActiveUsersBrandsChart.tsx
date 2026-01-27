"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Users, Building2 } from "lucide-react";

// Mock data for active users and brands over time
const generateMockData = (days: number) => {
  const data = [];
  const today = new Date();
  
  // Base values
  const baseUsers = 150;
  const baseBrands = 25;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Generate realistic fluctuations with upward trend
    const userVariation = (Math.random() - 0.5) * 20;
    const brandVariation = (Math.random() - 0.5) * 5;
    const userTrend = (days - i) * 2;
    const brandTrend = (days - i) * 0.3;
    
    const users = Math.max(0, Math.round(baseUsers + userVariation + userTrend));
    const brands = Math.max(0, Math.round(baseBrands + brandVariation + brandTrend));
    
    data.push({
      date: days === 1 
        ? date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
        : date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      users,
      brands,
      fullDate: date.toISOString(),
    });
  }
  
  return data;
};

const timeRanges = [
  { label: "24H", days: 1 },
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
] as const;

export function ActiveUsersBrandsChart() {
  const [selectedRange, setSelectedRange] = useState<number>(7);
  const [axisColor, setAxisColor] = useState<string>("#ffffff");
  const data = generateMockData(selectedRange);
  
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
  
  const currentUsers = data[data.length - 1]?.users || 0;
  const currentBrands = data[data.length - 1]?.brands || 0;
  const previousUsers = data[0]?.users || 0;
  const previousBrands = data[0]?.brands || 0;
  
  const usersChange = currentUsers - previousUsers;
  const brandsChange = currentBrands - previousBrands;
  const usersChangePercent = previousUsers > 0 ? ((usersChange / previousUsers) * 100).toFixed(1) : "0.0";
  const brandsChangePercent = previousBrands > 0 ? ((brandsChange / previousBrands) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Active Users & Brands</h2>
          <p className="text-sm text-muted-foreground">
            Track platform growth over time
          </p>
        </div>
        
        {/* Stats */}
        <div className="flex items-end gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-violet-500" />
              <span className="text-sm text-muted-foreground">Users</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {currentUsers.toLocaleString()}
            </div>
            <div className={`text-xs font-medium ${usersChange >= 0 ? "text-green-500" : "text-red-500"}`}>
              {usersChange >= 0 ? "+" : ""}{usersChangePercent}% ({usersChange >= 0 ? "+" : ""}{usersChange.toLocaleString()})
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-fuchsia-500" />
              <span className="text-sm text-muted-foreground">Brands</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {currentBrands.toLocaleString()}
            </div>
            <div className={`text-xs font-medium ${brandsChange >= 0 ? "text-green-500" : "text-red-500"}`}>
              {brandsChange >= 0 ? "+" : ""}{brandsChangePercent}% ({brandsChange >= 0 ? "+" : ""}{brandsChange.toLocaleString()})
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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedRange === range.days
                ? "bg-violet-500 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
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
                const label = name === "users" ? "Users" : "Brands";
                return [value ?? 0, label];
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="line"
              formatter={(value: string) => {
                return value === "users" ? "Users" : "Brands";
              }}
            />
            <Line 
              type="monotone" 
              dataKey="users" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              dot={{ fill: "#8b5cf6", r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line 
              type="monotone" 
              dataKey="brands" 
              stroke="#c026d3" 
              strokeWidth={2}
              dot={{ fill: "#c026d3", r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
