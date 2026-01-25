"use client";

import { useState } from "react";
import { Bell, Users, Calendar, Shield, X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  type: "new_holder" | "upcoming_event" | "admin_notification";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: "low" | "medium" | "high";
}

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "new_holder",
    title: "New Token Holder",
    message: "John Doe has purchased 50 tokens",
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    read: false,
    priority: "high",
  },
  {
    id: "2",
    type: "upcoming_event",
    title: "Event Starting Soon",
    message: "Product Launch Event starts in 2 hours",
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    read: false,
    priority: "high",
  },
  {
    id: "3",
    type: "admin_notification",
    title: "Admin Notification",
    message: "Your brand application has been reviewed and approved",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: false,
    priority: "medium",
  },
  {
    id: "4",
    type: "new_holder",
    title: "New Token Holder",
    message: "Jane Smith has purchased 25 tokens",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    read: true,
    priority: "medium",
  },
  {
    id: "5",
    type: "upcoming_event",
    title: "Event Reminder",
    message: "Community Meetup is scheduled for tomorrow at 2 PM",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    read: true,
    priority: "low",
  },
  {
    id: "6",
    type: "admin_notification",
    title: "System Update",
    message: "New features are now available in your dashboard",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    read: true,
    priority: "low",
  },
];

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "new_holder":
      return <Users className="h-5 w-5" />;
    case "upcoming_event":
      return <Calendar className="h-5 w-5" />;
    case "admin_notification":
      return <Shield className="h-5 w-5" />;
  }
};

const getNotificationColor = (type: Notification["type"]) => {
  switch (type) {
    case "new_holder":
      return "bg-violet-500/10 text-violet-500 border-violet-500/20";
    case "upcoming_event":
      return "bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20";
    case "admin_notification":
      return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
  }
};

const getPriorityColor = (priority: Notification["priority"]) => {
  switch (priority) {
    case "high":
      return "bg-red-500";
    case "medium":
      return "bg-yellow-500";
    case "low":
      return "bg-green-500";
  }
};

const formatTimestamp = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) {
    return "Just now";
  } else if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
};

export function BrandNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [showAll, setShowAll] = useState(false);

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "unread") {
      return !notif.read;
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const displayedNotifications = showAll ? filteredNotifications : filteredNotifications.slice(0, 3);
  const hasMore = filteredNotifications.length > 3;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  return (
    <div className="space-y-4 pt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold">Notifications</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setFilter("all");
                setShowAll(false);
              }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors h-9",
                filter === "all"
                  ? "bg-violet-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              All
            </button>
            <button
              onClick={() => {
                setFilter("unread");
                setShowAll(false);
              }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors h-9",
                filter === "unread"
                  ? "bg-violet-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Mark all as read */}
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              size="sm"
              className="h-9 text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="border border-border rounded-lg p-12 text-center">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground text-sm">
            No {filter === "unread" ? "unread" : ""} notifications
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayedNotifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "border border-border rounded-lg p-4 transition-all",
                !notification.read && "bg-muted/30 border-violet-500/30"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    "p-2 rounded-lg border shrink-0",
                    getNotificationColor(notification.type)
                  )}
                >
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{notification.title}</h3>
                        {!notification.read && (
                          <div className={cn("h-2 w-2 rounded-full", getPriorityColor(notification.priority))} />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {!notification.read && (
                        <Button
                          onClick={() => markAsRead(notification.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                        >
                          Mark as read
                        </Button>
                      )}
                      <Button
                        onClick={() => deleteNotification(notification.id)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Show More/Less Button */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                onClick={() => setShowAll(!showAll)}
                variant="ghost"
                size="sm"
                className="h-9"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show All ({filteredNotifications.length})
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
