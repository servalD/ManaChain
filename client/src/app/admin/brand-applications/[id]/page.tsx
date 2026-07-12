"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Check, ExternalLink, X as XIcon } from "lucide-react";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { Navbar } from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useWalletSync } from "@/hooks/useWalletSync";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { axiosInstance } from "@/lib/api/mutator";
import { asAxiosError } from "@/lib/api-error";
import PinataService from "@/services/pinata.service";
import {
  useBrandApplicationsControllerGetOne,
} from "@/api/generated/endpoints/brand-applications/brand-applications";
import {
  useApproveBrandApplication,
  useRejectBrandApplication,
} from "@/hooks/api/useBrandApplications";

export default function AdminBrandApplicationDetailPage() {
  const t = useTranslations("dashboard.admin.brandApplicationDetail");
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const applicationId = params.id;
  const { user, logout, refreshUser } = useAuth();
  const { shouldDisconnectWallet, handleWalletConnected, handleWalletDisconnected } = useWalletSync(refreshUser);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoadingProof, setIsLoadingProof] = useState(false);

  const { data: application, isLoading } = useBrandApplicationsControllerGetOne(applicationId);
  const approveApplication = useApproveBrandApplication();
  const rejectApplication = useRejectBrandApplication();

  const handleLogout = async () => {
    await logout();
  };

  const handleApprove = () => {
    approveApplication.mutate(
      { id: applicationId },
      { onSuccess: () => router.push("/admin/dashboard") },
    );
  };

  const handleRejectConfirm = () => {
    if (!rejectionReason.trim()) return;
    rejectApplication.mutate(
      { id: applicationId, data: { rejectionReason } },
      {
        onSuccess: () => {
          setRejectModalOpen(false);
          router.push("/admin/dashboard");
        },
      },
    );
  };

  const handleViewProof = async () => {
    setIsLoadingProof(true);
    try {
      const response = await axiosInstance.get(
        `/api/brands/applications/${applicationId}/registration-proof`,
        { responseType: "blob" },
      );
      const blobUrl = URL.createObjectURL(response.data);
      window.open(blobUrl, "_blank");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (error) {
      toast({
        title: t("registrationProof.loadError"),
        description: asAxiosError(error)?.response?.data?.message,
        variant: "error",
      });
    } finally {
      setIsLoadingProof(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-500";
      case "approved":
        return "bg-green-500/20 text-green-500";
      case "rejected":
        return "bg-red-500/20 text-red-500";
      case "needs_review":
        return "bg-blue-500/20 text-blue-500";
      default:
        return "bg-gray-500/20 text-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return t("statuses.pending");
      case "approved":
        return t("statuses.approved");
      case "rejected":
        return t("statuses.rejected");
      case "needs_review":
        return t("statuses.needsReview");
      default:
        return status;
    }
  };

  const canReview = application?.status === "pending" || application?.status === "needs_review";

  return (
    <RoleProtectedRoute allowedRoles={["ADMIN"]}>
      <div className="min-h-screen bg-background">
        <Navbar
          currentPage="dashboard"
          isLoggedIn={true}
          userName={user?.username}
          userAvatarUrl={user?.avatarUrl}
          userRole={user?.role}
          onLogout={handleLogout}
          onProfile={() => router.push("/profile")}
          onWalletConnected={handleWalletConnected}
          onWalletDisconnected={handleWalletDisconnected}
          shouldDisconnectWallet={shouldDisconnectWallet}
        />

        <div className="pt-30 sm:pt-30 pb-8 sm:pb-12 px-2 sm:px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("back")}
            </button>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
              </div>
            ) : !application ? (
              <p className="text-muted-foreground text-center py-20">{t("notFound")}</p>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    {application.logoUrl ? (
                      <img
                        src={PinataService.normalizeIpfsUrl(application.logoUrl)}
                        alt={application.brandName}
                        className="w-14 h-14 rounded-lg object-contain bg-white border border-border p-1.5"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                        <span className="text-lg font-bold text-violet-400">
                          {application.brandName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h1 className="text-2xl font-bold">{application.brandName}</h1>
                      <span className={cn("px-2 py-1 rounded text-xs font-medium", getStatusBadgeColor(application.status))}>
                        {getStatusLabel(application.status)}
                      </span>
                    </div>
                  </div>

                  {canReview && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                        onClick={handleApprove}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {t("approveAction")}
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => setRejectModalOpen(true)}
                      >
                        <XIcon className="h-4 w-4 mr-1" />
                        {t("rejectAction")}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <section className="space-y-2 p-4 border border-border rounded-lg">
                    <h2 className="font-semibold text-sm text-muted-foreground">{t("contactSection")}</h2>
                    <p className="text-sm">{application.contactFirstName} {application.contactLastName}</p>
                    <p className="text-sm text-muted-foreground">{application.contactEmail}</p>
                  </section>

                  <section className="space-y-2 p-4 border border-border rounded-lg">
                    <h2 className="font-semibold text-sm text-muted-foreground">{t("legalSection")}</h2>
                    <p className="text-sm">{t("registrationNumber")}: {application.businessRegistrationNumber}</p>
                    <p className="text-sm">{t("country")}: {application.country}</p>
                  </section>

                  {application.description && (
                    <section className="space-y-2 p-4 border border-border rounded-lg sm:col-span-2">
                      <h2 className="font-semibold text-sm text-muted-foreground">{t("description")}</h2>
                      <p className="text-sm text-muted-foreground">{application.description}</p>
                    </section>
                  )}

                  {application.websiteUrl && (
                    <section className="space-y-2 p-4 border border-border rounded-lg">
                      <h2 className="font-semibold text-sm text-muted-foreground">{t("website")}</h2>
                      <a
                        href={application.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-violet-500 hover:text-violet-600 inline-flex items-center gap-1"
                      >
                        {application.websiteUrl}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </section>
                  )}

                  <section className="space-y-2 p-4 border border-border rounded-lg sm:col-span-2">
                    <h2 className="font-semibold text-sm text-muted-foreground">{t("documentsSection")}</h2>
                    <p className="text-sm font-medium">{t("registrationProof.label")}</p>
                    {application.registrationProofFileName ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isLoadingProof}
                        onClick={handleViewProof}
                      >
                        {isLoadingProof ? "…" : application.registrationProofFileName}
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t("registrationProof.none")}</p>
                    )}
                  </section>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("rejectAction")}</DialogTitle>
            <DialogDescription>{application?.brandName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectionReason.trim()}
            >
              {t("rejectAction")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </RoleProtectedRoute>
  );
}
