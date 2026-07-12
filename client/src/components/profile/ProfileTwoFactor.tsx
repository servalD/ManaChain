"use client";

import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileTwoFactorProps {
  enabled: boolean;
  onManageClick: () => void;
}

export function ProfileTwoFactor({ enabled, onManageClick }: ProfileTwoFactorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          Two-factor authentication
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {enabled
            ? "Enabled — a 6-digit code is required to sign in."
            : "Add a second step to sign-in using an authenticator app."}
        </p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onManageClick}>
        {enabled ? "Manage" : "Set up two-factor authentication"}
      </Button>
    </div>
  );
}
