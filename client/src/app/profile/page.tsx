"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { Navbar } from "@/components/ui/navbar";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateProfile, logout } from "@/hooks/api/useAuth";
import PinataService from "@/services/pinata.service";
import {
  ProfileAvatar,
  ProfileInfoReadOnly,
  ProfilePersonalInfo,
  ProfilePassword,
  ProfileTwoFactor,
  ProfileDeleteAccount,
} from "@/components/profile";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import type { UserResponse } from "@/api/generated/models";

export default function ProfilePage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const updateProfile = useUpdateProfile();
  const [first_name, setFirst_name] = useState("");
  const [last_name, setLast_name] = useState("");
  const [username, setUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [syncedUser, setSyncedUser] = useState<UserResponse | null>(null);

  // Réinitialise les champs éditables à chaque fois que l'objet user change de référence
  // (chargement initial ou après refreshUser()), pas seulement quand l'id change, pour bien
  // resynchroniser les champs si les valeurs ont changé entre-temps (ex: refreshUser() après édition).
  if (user && user !== syncedUser) {
    setSyncedUser(user);
    setFirst_name(user.firstName ?? "");
    setLast_name(user.lastName ?? "");
    setUsername(user.username ?? "");
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    updateProfile.mutate(
      {
        data: {
          firstName: first_name.trim() || undefined,
          lastName: last_name.trim() || undefined,
          username: username.trim() || undefined,
        },
      },
      {
        onSuccess: async () => {
          await refreshUser();
          setIsEditingProfile(false);
        },
        onSettled: () => setIsSaving(false),
      }
    );
  };

  const handleAvatarUploadStart = () => {
    setIsUploadingAvatar(true);
  };

  const handleAvatarUploadComplete = async (avatarUrl: string) => {
    const oldAvatarUrl = user?.avatarUrl ?? null;
    updateProfile.mutate(
      { data: { avatarUrl } },
      {
        onSuccess: async () => {
          await refreshUser();
          // Unpin previous avatar from Pinata if it was an IPFS URL
          if (
            oldAvatarUrl &&
            (PinataService.isIpfsUrl(oldAvatarUrl) ||
              /^Qm[a-zA-Z0-9]{44,}$/.test(String(oldAvatarUrl).trim()))
          ) {
            await PinataService.deleteFile(oldAvatarUrl);
          }
        },
        onSettled: () => setIsUploadingAvatar(false),
      }
    );
  };

  const handleAvatarUploadError = () => {
    setIsUploadingAvatar(false);
  };

  const handleChangePassword = () => {
    router.push("/profile/change-password");
  };

  const handleManageTwoFactor = () => {
    router.push("/profile/two-factor");
  };

  const handleDeleteAccount = () => {
    router.push("/profile/delete-account");
  };

  const handleLogout = () => {
    logout();
  };

  const handleProfile = () => {
    router.push("/profile");
  };

  return (
    <RoleProtectedRoute allowedRoles={["CLIENT", "BRANDUSER", "ADMIN"]}>
      <div className="min-h-screen bg-background">
        <Navbar
          currentPage="profile"
          isLoggedIn={true}
          userName={user?.username}
          userAvatarUrl={user?.avatarUrl}
          userRole={user?.role}
          onLogout={handleLogout}
          onProfile={handleProfile}
        />

        <div className="pt-30 sm:pt-30 pb-8 sm:pb-12 px-4 sm:px-6 md:px-8 w-full">
          <div className="w-full max-w-7xl mx-auto space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
                  My Profile
                </span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your account details and preferences
              </p>
            </div>

            <div className="space-y-8">
              <ProfileAvatar
                user={user ?? null}
                isUploading={isUploadingAvatar}
                onUploadStart={handleAvatarUploadStart}
                onUploadComplete={handleAvatarUploadComplete}
                onUploadError={handleAvatarUploadError}
              />

              <div className="border-t border-border pt-6">
                <ProfileInfoReadOnly user={user ?? null} />
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingProfile((v) => !v)}
                    className="gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    {isEditingProfile ? "Hide form" : "Edit my profile"}
                  </Button>
                </div>
                <AnimatePresence>
                  {isEditingProfile && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-6 mt-6 border-t border-border">
                        <ProfilePersonalInfo
                          first_name={first_name}
                          last_name={last_name}
                          username={username}
                          isSaving={isSaving}
                          onFirstNameChange={setFirst_name}
                          onLastNameChange={setLast_name}
                          onUsernameChange={setUsername}
                          onSave={handleSaveProfile}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="border-t border-border pt-6">
                <ProfilePassword onChangePasswordClick={handleChangePassword} />
              </div>

              <div className="border-t border-border pt-6">
                <ProfileTwoFactor
                  enabled={user?.twoFactorEnabled ?? false}
                  onManageClick={handleManageTwoFactor}
                />
              </div>

              <div className="border-t border-border pt-6">
                <ProfileDeleteAccount onDeleteAccountClick={handleDeleteAccount} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleProtectedRoute>
  );
}
