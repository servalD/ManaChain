"use client";

import { useRouter } from "next/navigation";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { Navbar } from "@/components/ui/navbar";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/hooks/api/useAuth";
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
          userAvatarUrl={user?.avatarUrl}
          userRole={user?.role}
          onLogout={() => logout()}
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
