"use client";

import { useRef } from "react";
import { Camera } from "lucide-react";
import PinataService from "@/services/pinata.service";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { IUser } from "@/types/user.types";

const ALLOWED_AVATAR_TYPES = "image/jpeg,image/png,image/webp,image/gif";
const MAX_AVATAR_SIZE_MB = 2;

interface ProfileAvatarProps {
  user: IUser | null;
  isUploading: boolean;
  onUploadStart: () => void;
  onUploadComplete: (avatarUrl: string) => void;
  onUploadError: () => void;
}

export function ProfileAvatar({
  user,
  isUploading,
  onUploadStart,
  onUploadComplete,
  onUploadError,
}: ProfileAvatarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarUrl = user?.avatarUrl
    ? PinataService.normalizeIpfsUrl(user.avatarUrl)
    : null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ALLOWED_AVATAR_TYPES.split(",").map((t) => t.trim());
    if (!allowed.includes(file.type)) {
      toast({
        title: "Invalid file",
        description: "Please choose a JPEG, PNG, WebP or GIF image.",
        variant: "error",
      });
      e.target.value = "";
      return;
    }
    if (file.size > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Maximum size is ${MAX_AVATAR_SIZE_MB}MB.`,
        variant: "error",
      });
      e.target.value = "";
      return;
    }

    onUploadStart();
    try {
      const ipfsUrl = await PinataService.uploadFile(file);
      onUploadComplete(ipfsUrl);
    } catch (_) {
      onUploadError();
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Profile photo</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          JPEG, PNG, WebP or GIF, max {MAX_AVATAR_SIZE_MB}MB
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-muted border border-border flex items-center justify-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <span className="text-2xl font-bold text-muted-foreground">
                {user?.firstName?.charAt(0) || user?.username?.charAt(0) || "?"}
              </span>
            )}
          </div>
          {isUploading && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_AVATAR_TYPES}
            className="hidden"
            onChange={handleAvatarChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Camera className="w-4 h-4 mr-2" />
            {avatarUrl ? "Change photo" : "Add photo"}
          </Button>
        </div>
      </div>
    </div>
  );
}
