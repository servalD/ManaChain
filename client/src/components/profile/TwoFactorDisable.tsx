"use client";

import { useState } from "react";
import { useTwoFactorDisable } from "@/hooks/api/useAuth";
import { Button } from "@/components/ui/button";
import { ShieldOff } from "lucide-react";

const inputClassName =
  "w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500 text-sm";

export interface TwoFactorDisableProps {
  onDisabled: () => void;
}

export function TwoFactorDisable({ onDisabled }: TwoFactorDisableProps) {
  const [password, setPassword] = useState("");
  const disable = useTwoFactorDisable();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    disable.mutate(
      { data: { password } },
      { onSuccess: onDisabled, onSettled: () => setPassword("") },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-4 text-sm text-green-600 dark:text-green-400">
        Two-factor authentication is currently enabled on your account.
      </div>
      <div>
        <label htmlFor="disable-password" className="block text-sm font-medium text-foreground mb-1">
          Confirm your password to disable it
        </label>
        <input
          id="disable-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClassName}
          placeholder="Current password"
          autoComplete="current-password"
          disabled={disable.isPending}
        />
      </div>
      <Button type="submit" size="sm" variant="destructive" className="gap-2" disabled={!password || disable.isPending}>
        <ShieldOff className="w-4 h-4" />
        {disable.isPending ? "Disabling…" : "Disable two-factor authentication"}
      </Button>
    </form>
  );
}
