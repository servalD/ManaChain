"use client";

import { useState } from "react";
import Link from "next/link";
import { useDeleteAccount } from "@/hooks/api/useAuth";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, Trash2 } from "lucide-react";
import type { UserResponse } from "@/api/generated/models";

const inputClassName =
  "w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500 text-sm";

export interface DeleteAccountFormProps {
  user: UserResponse | null;
}

export function DeleteAccountForm({ user }: DeleteAccountFormProps) {
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const deleteAccount = useDeleteAccount();

  const isBrandOwner = user?.isBrand ?? false;
  const canConfirm = !!user && confirmation === user.username && !isBrandOwner;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canConfirm) return;

    setIsSubmitting(true);
    deleteAccount.mutate(undefined, {
      onSettled: () => setIsSubmitting(false),
    });
  };

  return (
    <div className="pt-30 sm:pt-30 pb-8 sm:pb-12 px-4 sm:px-6 md:px-8 w-full">
      <div className="w-full max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-red-500">Delete my account</h1>
          <p className="text-sm text-muted-foreground mt-1">
            This action is irreversible. Your profile, avatar and blockchain link will be
            removed. Your past transaction history is kept for accounting purposes but is
            no longer linked to your identity.
          </p>
        </div>

        {isBrandOwner ? (
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>
              You own a brand — you must delete or transfer it before you can delete your
              account.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="delete-confirmation" className="block text-sm font-medium text-foreground mb-1">
                Type your username (<span className="font-mono">{user?.username}</span>) to confirm
              </label>
              <input
                id="delete-confirmation"
                type="text"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className={inputClassName}
                placeholder={user?.username}
                autoComplete="off"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="submit"
                disabled={!canConfirm || isSubmitting}
                size="sm"
                variant="destructive"
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {isSubmitting ? "Deleting…" : "Permanently delete my account"}
              </Button>
              <Link
                href="/profile"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to profile
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
