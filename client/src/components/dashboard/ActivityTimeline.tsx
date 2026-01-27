"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Heart, TrendingUp, Calendar } from "lucide-react";

// Mock activity data
const generateActivityData = (days: number) => {
  const data = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Generate random activity counts
    const likes = Math.floor(Math.random() * 5) + 1;
    const tokens = Math.floor(Math.random() * 3);
    const events = Math.floor(Math.random() * 2);
    const total = likes + tokens + events;
    
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      likes,
      tokens,
      events,
      total,
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

export function ActivityTimeline() {
  const [selectedRange, setSelectedRange] = useState<number>(30);
  const [axisColor, setAxisColor] = useState<string>("#ffffff");
  const data = generateActivityData(selectedRange);
  
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
  
  const totalLikes = data.reduce((sum, day) => sum + day.likes, 0);
  const totalTokens = data.reduce((sum, day) => sum + day.tokens, 0);
  const totalEvents = data.reduce((sum, day) => sum + day.events, 0);

  return (
    <div className="space-y-4 pt-8 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Activity Timeline</h2>
          <p className="text-sm text-muted-foreground">
            Track your engagement and interactions over time
          </p>
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-4 w-4 text-violet-500" />
            <span className="text-sm text-muted-foreground">Likes</span>
          </div>
          <div className="text-2xl font-bold">{totalLikes}</div>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-fuchsia-500" />
            <span className="text-sm text-muted-foreground">Tokens</span>
          </div>
          <div className="text-2xl font-bold">{totalTokens}</div>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-indigo-500" />
            <span className="text-sm text-muted-foreground">Events</span>
          </div>
          <div className="text-2xl font-bold">{totalEvents}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="border border-border rounded-lg p-6">
        <div className="h-64 w-full">
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
                  const label = name === "likes" ? "Likes" : name === "tokens" ? "Tokens" : "Events";
                  return [value ?? 0, label];
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: "20px" }}
                iconType="line"
                formatter={(value: string) => {
                  return value === "likes" ? "Likes" : value === "tokens" ? "Tokens" : "Events";
                }}
              />
              <Line 
                type="monotone" 
                dataKey="likes" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={{ fill: "#8b5cf6", r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line 
                type="monotone" 
                dataKey="tokens" 
                stroke="#c026d3" 
                strokeWidth={2}
                dot={{ fill: "#c026d3", r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line 
                type="monotone" 
                dataKey="events" 
                stroke="#6366f1" 
                strokeWidth={2}
                dot={{ fill: "#6366f1", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
