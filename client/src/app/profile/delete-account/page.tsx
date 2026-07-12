"use client";

import { useRouter } from "next/navigation";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { Navbar } from "@/components/ui/navbar";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/hooks/api/useAuth";
import { DeleteAccountForm } from "@/components/profile/DeleteAccountForm";

export default function DeleteAccountPage() {
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
          onLogout={() => logout()}
          onProfile={() => router.push("/profile")}
        />
        <DeleteAccountForm user={user} />
      </div>
    </RoleProtectedRoute>
  );
}
