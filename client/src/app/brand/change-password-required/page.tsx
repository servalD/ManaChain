"use client";

import { useRouter } from "next/navigation";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { Navbar } from "@/components/ui/navbar";
import { useAuth } from "@/hooks/useAuth";
import AuthService from "@/services/auth.service";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";

export default function BrandChangePasswordRequiredPage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <RoleProtectedRoute allowedRoles={["BRANDUSER"]}>
      <div className="min-h-screen bg-background">
        <Navbar
          currentPage="dashboard"
          isLoggedIn={true}
          userName={user?.username}
          userAvatarUrl={user?.avatar_url}
          userRole={user?.role}
          onLogout={() => AuthService.logout()}
          onProfile={() => router.push("/profile")}
        />
        <ChangePasswordForm
          resetToken={null}
          redirectTo="/brand/dashboard"
          title="Set your password"
          description="Welcome! For security reasons, please set your own password before accessing your dashboard."
          hideBackLink={true}
        />
      </div>
    </RoleProtectedRoute>
  );
}
