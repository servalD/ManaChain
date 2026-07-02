"use client";

import { useRouter } from "next/navigation";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { Navbar } from "@/components/ui/navbar";
import { useAuth } from "@/hooks/useAuth";
import AuthService from "@/services/auth.service";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <RoleProtectedRoute allowedRoles={["CLIENT", "BRANDUSER", "ADMIN"]}>
      <div className="min-h-screen bg-background">
        <Navbar
          currentPage="profile"
          isLoggedIn={true}
          userName={user?.username}
          userAvatarUrl={user?.avatarUrl}
          userRole={user?.role}
          onLogout={() => AuthService.logout()}
          onProfile={() => router.push("/profile")}
        />
        <ChangePasswordForm resetToken={null} />
      </div>
    </RoleProtectedRoute>
  );
}
