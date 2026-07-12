"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { Navbar } from "@/components/ui/navbar";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/hooks/api/useAuth";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";

export default function BrandChangePasswordRequiredPage() {
  const t = useTranslations("dashboard.brand.changePasswordRequiredPage");
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
          title={t("title")}
          description={t("description")}
          hideBackLink={true}
        />
      </div>
    </RoleProtectedRoute>
  );
}
