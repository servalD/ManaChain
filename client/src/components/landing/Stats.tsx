"use client";

import ElectricBorder from '@/components/ui/electric-border/ElectricBorder';
import { Users, Calendar, Sparkles, HeartHandshake } from "lucide-react";

const stats = [
  { label: "Active Communities", value: "847", icon: Users, color: "text-violet-400" },
  { label: "Community Badges Issued", value: "12.5M", icon: Sparkles, color: "text-fuchsia-400" },
  { label: "Events Organized", value: "1,234", icon: Calendar, color: "text-indigo-400" },
  { label: "Community Contributions", value: "8.9M+", icon: HeartHandshake, color: "text-cyan-400" }
];

export function Stats() {
  return (
    <section className="py-12 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <ElectricBorder
              key={index}
              color={
                stat.color.includes('violet') ? '#7E22CE' :
                stat.color.includes('fuchsia') ? '#C026D3' :
                stat.color.includes('indigo') ? '#4338CA' :
                '#06B6D4'
              }
              speed={1}
              chaos={0.12}
              borderRadius={16}
              className="h-full"
              style={{ borderRadius: '1rem' }}
            >
              <div className="bg-card p-4 rounded-2xl h-full flex flex-col items-center justify-center text-center">
                <stat.icon className={`h-8 w-8 ${stat.color} mb-2`} />
                <div className="text-3xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </ElectricBorder>
          ))}
        </div>
      </div>
    </section>
  );
}
