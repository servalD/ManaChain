"use client";

import { useState } from "react";
import { Calendar, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMyBrandEvents } from "@/hooks/api/useEvents";

const limitOptions = [5, 10, 25, 50];

export function BrandEvents() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<"upcoming" | "past">("upcoming");
  const [limit, setLimit] = useState<number>(10);

  const { data, isLoading } = useMyBrandEvents({ limit: 50, offset: 0 });
  const events = data?.events ?? [];
  const [now] = useState(() => Date.now());

  const filtered = events
    .filter((event) =>
      statusFilter === "upcoming"
        ? new Date(event.startsAt).getTime() >= now
        : new Date(event.startsAt).getTime() < now,
    )
    .sort((a, b) =>
      statusFilter === "upcoming"
        ? new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
        : new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
    )
    .slice(0, limit);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-4 pt-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-bold">Events</h2>
        <Button onClick={() => router.push("/brand/events")} variant="outline" className="h-9">
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter("upcoming")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors h-9",
              statusFilter === "upcoming" ? "bg-violet-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            Upcoming
          </button>
          <button
            onClick={() => setStatusFilter("past")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors h-9",
              statusFilter === "past" ? "bg-violet-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            Past
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Show:</span>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {limitOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground text-sm">No {statusFilter} events</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Event Name</th>
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Date</th>
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Type</th>
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Status</th>
                  <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((event, index) => (
                  <tr
                    key={event.id}
                    className={cn(
                      "border-b border-border hover:bg-muted/20 transition-colors",
                      index === filtered.length - 1 && "border-b-0",
                    )}
                  >
                    <td className="p-4">
                      <div className="font-semibold text-sm">{event.title}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm font-medium">{formatDate(event.startsAt)}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-500/10 text-violet-500">
                        {event.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          event.status === "published" && "bg-green-500/10 text-green-500",
                          event.status === "draft" && "bg-muted text-muted-foreground",
                          event.status === "cancelled" && "bg-destructive/10 text-destructive",
                        )}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => router.push("/brand/events")}
                        >
                          <MoreHorizontal className="h-3 w-3 mr-1" />
                          More Details
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
