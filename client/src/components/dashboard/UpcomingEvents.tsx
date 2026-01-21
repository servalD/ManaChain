"use client";

import { useState } from "react";
import { Calendar, MapPin, ExternalLink, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";

interface Event {
  id: string;
  name: string;
  brand: string;
  brandLogo?: string;
  date: Date;
  location: string;
  type: string;
  status: "upcoming" | "past";
}

// Mock events data
const mockEvents: Event[] = [
  {
    id: "1",
    name: "Nike Exclusive Product Launch",
    brand: "Nike",
    brandLogo: "/Logo_NIKE.svg",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    location: "New York, USA",
    type: "Product Launch",
    status: "upcoming",
  },
  {
    id: "2",
    name: "BMW Innovation Summit",
    brand: "BMW",
    brandLogo: "/BMW_logo_(gray).svg",
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    location: "Munich, Germany",
    type: "Conference",
    status: "upcoming",
  },
  {
    id: "3",
    name: "LVMH Fashion Week Reception",
    brand: "LVMH",
    brandLogo: "/LVMH_wordmark.svg",
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
    location: "Paris, France",
    type: "Reception",
    status: "upcoming",
  },
  {
    id: "4",
    name: "Nike Community Meetup",
    brand: "Nike",
    brandLogo: "/Logo_NIKE.svg",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    location: "Los Angeles, USA",
    type: "Meetup",
    status: "past",
  },
  {
    id: "5",
    name: "BMW Test Drive Event",
    brand: "BMW",
    brandLogo: "/BMW_logo_(gray).svg",
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
    location: "Berlin, Germany",
    type: "Test Drive",
    status: "past",
  },
];

export function UpcomingEvents() {
  const [eventFilter, setEventFilter] = useState<"upcoming" | "past">("upcoming");
  
  const filteredEvents = mockEvents.filter(event => event.status === eventFilter);
  const sortedEvents = filteredEvents.sort((a, b) => {
    if (eventFilter === "upcoming") {
      return a.date.getTime() - b.date.getTime();
    } else {
      return b.date.getTime() - a.date.getTime();
    }
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
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

  if (sortedEvents.length === 0) {
    return (
      <div className="space-y-4 pt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Events</h2>
          <Select 
            value={eventFilter} 
            onValueChange={(value) => setEventFilter(value as "upcoming" | "past")}
            className="w-[180px]"
          >
            <SelectItem value="upcoming">Upcoming Events</SelectItem>
            <SelectItem value="past">Past Events</SelectItem>
          </Select>
        </div>
        <div className="text-center py-12 border border-border rounded-lg">
          <p className="text-muted-foreground text-sm">
            No {eventFilter === "upcoming" ? "upcoming" : "past"} events
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-8 w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Events</h2>
          <Select 
            value={eventFilter} 
            onValueChange={(value) => setEventFilter(value as "upcoming" | "past")}
            className="w-[180px]"
          >
            <SelectItem value="upcoming">Upcoming Events</SelectItem>
            <SelectItem value="past">Past Events</SelectItem>
          </Select>
        </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Event</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Date</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Location</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Type</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedEvents.map((event, index) => (
                <tr
                  key={event.id}
                  className={`border-b border-border hover:bg-muted/20 transition-colors ${
                    index === sortedEvents.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {event.brandLogo ? (
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 border border-border overflow-hidden">
                          <img
                            src={event.brandLogo}
                            alt={event.brand}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              const parent = target.parentElement;
                              if (parent) {
                                target.style.display = 'none';
                                const placeholder = document.createElement('div');
                                placeholder.className = 'w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center';
                                placeholder.textContent = event.brand.charAt(0);
                                parent.appendChild(placeholder);
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-violet-400">
                            {event.brand.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-sm">{event.name}</div>
                        <div className="text-xs text-muted-foreground">{event.brand}</div>
                      </div>
                    </div>
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
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
