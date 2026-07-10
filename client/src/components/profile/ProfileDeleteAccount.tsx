"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileDeleteAccountProps {
  onDeleteAccountClick: () => void;
}

export function ProfileDeleteAccount({ onDeleteAccountClick }: ProfileDeleteAccountProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-red-500 flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Danger zone
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Permanently delete your account and personal data
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onDeleteAccountClick}
        className="border-red-500/40 text-red-500 hover:bg-red-500/10 hover:text-red-500"
      >
        Delete my account
      </Button>
    </div>
  );
}
