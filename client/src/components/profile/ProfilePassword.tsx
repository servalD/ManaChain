"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfilePasswordProps {
  onChangePasswordClick: () => void;
}

export function ProfilePassword({ onChangePasswordClick }: ProfilePasswordProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Password
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Change your password to keep your account secure
        </p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onChangePasswordClick}>
        Change password
      </Button>
    </div>
  );
}
