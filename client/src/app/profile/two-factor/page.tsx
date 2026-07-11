"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { Navbar } from "@/components/ui/navbar";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/hooks/api/useAuth";
import { TwoFactorSetup, TwoFactorDisable } from "@/components/profile";
import { ArrowLeft } from "lucide-react";

export default function TwoFactorPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const handleDone = async () => {
    await refreshUser();
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
          onLogout={() => logout()}
          onProfile={() => router.push("/profile")}
        />

        <div className="pt-30 sm:pt-30 pb-8 sm:pb-12 px-4 sm:px-6 md:px-8 w-full">
          <div className="w-full max-w-xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
                  Two-factor authentication
                </span>
              </h1>
            </div>

            {user?.twoFactorEnabled ? (
              <TwoFactorDisable onDisabled={handleDone} />
            ) : (
              <TwoFactorSetup onCompleted={handleDone} />
            )}

            <div className="pt-2">
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </RoleProtectedRoute>
  );
}
