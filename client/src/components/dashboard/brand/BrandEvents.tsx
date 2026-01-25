"use client";

import { useState } from "react";
import { Calendar, MapPin, MoreHorizontal, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  name: string;
  date: Date;
  location: string;
  type: string;
  status: "upcoming" | "ongoing" | "past";
}

// Mock events data
const mockEvents: Event[] = [
  {
    id: "1",
    name: "Product Launch Event",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    location: "Paris, France",
    type: "Product Launch",
    status: "upcoming",
  },
  {
    id: "2",
    name: "Community Meetup",
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    location: "Lyon, France",
    type: "Meetup",
    status: "upcoming",
  },
  {
    id: "3",
    name: "Brand Showcase",
    date: new Date(), // Today (ongoing)
    location: "Marseille, France",
    type: "Showcase",
    status: "ongoing",
  },
  {
    id: "4",
    name: "Exclusive Preview",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    location: "Nice, France",
    type: "Preview",
    status: "past",
  },
  {
    id: "5",
    name: "Launch Party",
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
    location: "Toulouse, France",
    type: "Party",
    status: "past",
  },
  {
    id: "6",
    name: "Innovation Summit",
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
    location: "Bordeaux, France",
    type: "Conference",
    status: "upcoming",
  },
  {
    id: "7",
    name: "Customer Appreciation Day",
    date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
    location: "Nantes, France",
    type: "Event",
    status: "past",
  },
];

const limitOptions = [5, 10, 25, 50];

export function BrandEvents() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [eventFilter, setEventFilter] = useState<"upcoming" | "past">("upcoming");
  const [limit, setLimit] = useState<number>(10);

  // Filter events based on status
  const filteredByStatus = mockEvents.filter(event => {
    if (eventFilter === "upcoming") {
      // Include upcoming and ongoing events
      return event.status === "upcoming" || event.status === "ongoing";
    } else {
      return event.status === "past";
    }
  });

  // Filter by search query (inactive for now, but structure is ready)
  const filteredBySearch = filteredByStatus.filter(event => {
    if (!searchQuery.trim()) return true;
    // Search functionality is inactive for now
    return true;
  });

  // Apply limit
  const displayedEvents = filteredBySearch.slice(0, limit);

  // Sort events
  const sortedEvents = displayedEvents.sort((a, b) => {
    if (eventFilter === "upcoming") {
      return a.date.getTime() - b.date.getTime();
    } else {
      return b.date.getTime() - a.date.getTime();
    }
  });

  const formatDate = (date: Date) => {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimeUntil = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) {
      const daysAgo = Math.abs(days);
      return `${daysAgo} day${daysAgo > 1 ? "s" : ""} ago`;
    } else if (days === 0) {
      return "Today";
    } else if (days === 1) {
      return "Tomorrow";
    } else {
      return `In ${days} days`;
    }
  };

  const handleCreateEvent = () => {
    // Inactive for now - no action
  };

  const handleMoreDetails = (eventId: string) => {
    router.push(`/brand/events`);
  };

  return (
    <div className="space-y-4 pt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-bold">Events</h2>
        <Button
          onClick={handleCreateEvent}
          disabled
          variant="outline"
          className="h-9"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search (inactive) */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Event Type Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setEventFilter("upcoming")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors h-9",
              eventFilter === "upcoming"
                ? "bg-violet-500 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            Upcoming
          </button>
          <button
            onClick={() => setEventFilter("past")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors h-9",
              eventFilter === "past"
                ? "bg-violet-500 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            Past
          </button>
        </div>

        {/* Limit Selector */}
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

      {/* Table */}
      {sortedEvents.length === 0 ? (
        <div className="border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground text-sm">
            No {eventFilter === "upcoming" ? "upcoming" : "past"} events
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Event Name</th>
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Date</th>
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Location</th>
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Type</th>
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Status</th>
                  <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedEvents.map((event, index) => (
                  <tr
                    key={event.id}
                    className={cn(
                      "border-b border-border hover:bg-muted/20 transition-colors",
                      index === sortedEvents.length - 1 && "border-b-0"
                    )}
                  >
                    <td className="p-4">
                      <div className="font-semibold text-sm">{event.name}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">{formatDate(event.date)}</div>
                          <div className="text-xs text-muted-foreground">
                            {eventFilter === "upcoming" ? formatTimeUntil(event.date) : formatTimeUntil(event.date)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm text-muted-foreground">{event.location}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-500/10 text-violet-500">
                        {event.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        event.status === "ongoing" && "bg-fuchsia-500/10 text-fuchsia-500",
                        event.status === "upcoming" && "bg-green-500/10 text-green-500",
                        event.status === "past" && "bg-muted text-muted-foreground"
                      )}>
                        {event.status === "ongoing" ? "Ongoing" : event.status === "upcoming" ? "Upcoming" : "Past"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleMoreDetails(event.id)}
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
