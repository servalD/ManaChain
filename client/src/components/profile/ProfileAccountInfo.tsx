"use client";

import { Calendar, Mail } from "lucide-react";
import { IUser } from "@/types/user.types";

interface ProfileAccountInfoProps {
  user: IUser | null;
}

export function ProfileAccountInfo({ user }: ProfileAccountInfoProps) {
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Account info</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your email cannot be changed here
        </p>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-0.5">
            Email
          </label>
          <p className="text-foreground flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            {user?.email ?? "—"}
          </p>
        </div>
        {memberSince && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Calendar className="w-4 h-4" />
            <span>Member since {memberSince}</span>
          </div>
        )}
      </div>
    </div>
  );
}
