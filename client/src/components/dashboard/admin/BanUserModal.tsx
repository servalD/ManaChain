"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminUsersList } from "@/hooks/api/useAdminUsers";
import { useBanUser } from "@/hooks/api/useBans";
import { toast } from "@/lib/toast";
import type { UserResponse } from "@/api/generated/models";

interface BanUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BanUserModal({ isOpen, onClose }: BanUserModalProps) {
  const t = useTranslations("dashboard.admin.banUserModal");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [reason, setReason] = useState("");
  const [isPermanent, setIsPermanent] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");

  const { data } = useAdminUsersList({ search: search || undefined, limit: 8, offset: 0 });
  const results = search.trim() && !selectedUser ? (data?.users ?? []) : [];

  const banUser = useBanUser();

  const reset = () => {
    setSearch("");
    setSelectedUser(null);
    setReason("");
    setIsPermanent(true);
    setExpiresAt("");
    setNotes("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      toast({ title: t("toasts.selectUserTitle"), description: t("toasts.selectUserMessage"), variant: "error" });
      return;
    }
    if (!reason.trim()) {
      toast({ title: t("toasts.reasonRequiredTitle"), description: t("toasts.reasonRequiredMessage"), variant: "error" });
      return;
    }
    if (!isPermanent && !expiresAt) {
      toast({ title: t("toasts.expiryRequiredTitle"), description: t("toasts.expiryRequiredMessage"), variant: "error" });
      return;
    }

    await banUser.mutateAsync({
      id: selectedUser.id,
      data: {
        reason: reason.trim(),
        isPermanent,
        expiresAt: isPermanent ? undefined : new Date(expiresAt).toISOString(),
        notes: notes.trim() || undefined,
      },
    });
    toast({ title: t("toasts.bannedTitle"), description: t("toasts.bannedMessage", { name: selectedUser.username }), variant: "success" });
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium block">{t("userLabel")}</label>
            {selectedUser ? (
              <div className="flex items-center justify-between rounded-md border border-input px-3 py-2 text-sm">
                <span>
                  {selectedUser.username} <span className="text-muted-foreground">({selectedUser.email})</span>
                </span>
                <button
                  type="button"
                  className="text-xs text-violet-500 hover:underline"
                  onClick={() => setSelectedUser(null)}
                >
                  {t("change")}
                </button>
              </div>
            ) : (
              <>
                <Input
                  placeholder={t("searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {results.length > 0 && (
                  <div className="border border-border rounded-md divide-y divide-border max-h-48 overflow-y-auto">
                    {results.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50"
                        onClick={() => {
                          setSelectedUser(user);
                          setSearch("");
                        }}
                      >
                        {user.username} <span className="text-muted-foreground">({user.email})</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium block">{t("reasonLabel")}</label>
            <textarea
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[70px]"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("reasonPlaceholder")}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ban-user-permanent"
              checked={isPermanent}
              onChange={(e) => setIsPermanent(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <label htmlFor="ban-user-permanent" className="text-sm">
              {t("permanentBan")}
            </label>
          </div>

          {!isPermanent && (
            <div className="space-y-2">
              <label className="text-sm font-medium block">{t("expiresAtLabel")}</label>
              <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium block">{t("notesLabel")}</label>
            <textarea
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[50px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={handleClose}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={banUser.isPending}
            className="bg-linear-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
          >
            {banUser.isPending ? t("banning") : t("submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
