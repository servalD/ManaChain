"use client";

import { Calendar, Mail, User } from "lucide-react";
import type { UserResponse } from "@/api/generated/models";

interface ProfileInfoReadOnlyProps {
  user: UserResponse | null;
}

export function ProfileInfoReadOnly({ user }: ProfileInfoReadOnlyProps) {
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  const fields = [
    { label: "First name", value: user?.firstName ?? "—", icon: User },
    { label: "Last name", value: user?.lastName ?? "—", icon: User },
    { label: "Username", value: user?.username ?? "—", icon: User },
    { label: "Email", value: user?.email ?? "—", icon: Mail },
  ];

  return (
    <div className="space-y-4 w-full">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Personal and account information
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your profile and account details
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
        {fields.map(({ label, value, icon: Icon }) => (
          <div key={label} className="min-w-0">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              {label}
            </label>
            <p className="text-foreground flex items-center gap-2 text-sm sm:text-base truncate">
              <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="min-w-0 truncate" title={String(value)}>
                {value}
              </span>
            </p>
          </div>
        ))}
      </div>
      {memberSince && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Calendar className="w-4 h-4 shrink-0" />
          <span>Member since {memberSince}</span>
        </div>
      )}
    </div>
  );
}
