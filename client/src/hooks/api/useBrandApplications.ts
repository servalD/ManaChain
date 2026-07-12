"use client";

import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import {
  getBrandApplicationsControllerCreateMutationOptions,
  getBrandApplicationsControllerVerifyMutationOptions,
  getBrandApplicationsControllerListQueryOptions,
  getBrandApplicationsControllerListQueryKey,
  getBrandApplicationsControllerApproveMutationOptions,
  getBrandApplicationsControllerRejectMutationOptions,
} from "@/api/generated/endpoints/brand-applications/brand-applications";
import type { BrandApplicationsControllerListParams, CreateBrandApplicationRequest } from "@/api/generated/models";
import type { CreateBrandApplicationData } from "@/types/brand-application.types";
import { asAxiosError } from "@/lib/api-error";
import type { ToastOptions } from "@/lib/toast";
import { useToastMutation } from "./useToastMutation";
import { useToastQuery } from "./useToastQuery";

const connectionErrorToast: ToastOptions = {
  title: "Connection error",
  description: "Unable to reach the server. Check your internet connection.",
  variant: "error",
};

/** Traduit la forme interne (snake_case) du wizard vers le contrat API (camelCase). */
export function toCreateBrandApplicationRequest(
  data: CreateBrandApplicationData,
): CreateBrandApplicationRequest {
  return {
    contactEmail: data.contact_email,
    contactFirstName: data.contact_first_name,
    contactLastName: data.contact_last_name,
    contactPhone: data.contact_phone,
    brandName: data.brand_name,
    interestIds: data.interest_ids,
    description: data.description,
    websiteUrl: data.website_url,
    logoUrl: data.logo_url,
    businessRegistrationNumber: data.business_registration_number,
    country: data.country,
    headquartersStreet: data.headquarters_street,
    headquartersCity: data.headquarters_city,
    headquartersZipCode: data.headquarters_zip_code,
    headquartersAddressComplement: data.headquarters_address_complement,
    registrationProofUploadId: data.registration_proof_upload_id,
    motivation: data.motivation,
    estimatedCommunitySize: data.estimated_community_size,
    socialMediaLinks: data.social_media_links,
    howDidYouHearAboutUs: data.how_did_you_hear_about_us,
  };
}

/** Déposer une candidature de marque (remplace `BrandApplicationService.createApplication`). */
export function useCreateBrandApplication() {
  const t = useTranslations("brandApplication.toasts");

  return useToastMutation({
    ...getBrandApplicationsControllerCreateMutationOptions(),
    successToast: () => ({
      title: "Application submitted",
      description:
        "Your brand application has been submitted successfully! Please check your email to verify your address. We'll review your application once your email is verified.",
      variant: "success",
    }),
    errorToast: (error) => {
      const axiosErr = asAxiosError(error);
      if (axiosErr?.response) {
        const message = axiosErr.response.data?.message;
        if (axiosErr.response.data?.error === "ApplicationContactEmailAlreadyRegisteredError") {
          return {
            title: t("emailTakenTitle"),
            description: t("emailTakenDescription"),
            variant: "error",
          };
        }
        switch (axiosErr.response.status) {
          case 400:
            return { title: "Validation error", description: message || "Please check your information", variant: "error" };
          case 409:
            return {
              title: "Conflict",
              description: message || "This brand or registration number is already in use",
              variant: "error",
            };
          case 500:
            return { title: "Server error", description: "Temporary issue, please try again", variant: "error" };
          default:
            return { title: "Application error", description: message || "An unexpected error occurred", variant: "error" };
        }
      }
      if (axiosErr?.request) return connectionErrorToast;
      return { title: "Application error", description: "An unexpected error occurred", variant: "error" };
    },
  });
}

/** Vérifier l'email d'une candidature (remplace `BrandApplicationService.verifyEmail`). */
export function useVerifyBrandApplicationEmail() {
  return useToastMutation({
    ...getBrandApplicationsControllerVerifyMutationOptions(),
    successToast: () => ({
      title: "Email verified",
      description: "Your email has been successfully verified! Your application will be reviewed soon.",
      variant: "success",
    }),
    errorToast: (error) => {
      const axiosErr = asAxiosError(error);
      if (axiosErr?.response) {
        const message = axiosErr.response.data?.message;
        switch (axiosErr.response.status) {
          case 400:
            return {
              title: "Verification error",
              description: message || "The verification link is invalid or expired",
              variant: "error",
            };
          case 500:
            return { title: "Server error", description: "Temporary issue, please try again", variant: "error" };
          default:
            return { title: "Verification error", description: message || "An unexpected error occurred", variant: "error" };
        }
      }
      if (axiosErr?.request) return connectionErrorToast;
      return { title: "Verification error", description: "An unexpected error occurred", variant: "error" };
    },
  });
}

/** Liste paginée des candidatures, admin only (remplace `BrandApplicationService.getAllApplications`). */
export function useBrandApplicationsList(params?: BrandApplicationsControllerListParams) {
  return useToastQuery({
    ...getBrandApplicationsControllerListQueryOptions(params),
    errorToast: (error) => {
      const axiosErr = asAxiosError(error);
      if (axiosErr?.response) {
        const message = axiosErr.response.data?.message;
        switch (axiosErr.response.status) {
          case 401:
            return {
              title: "Unauthorized",
              description: "You must be logged in as an admin to view applications",
              variant: "error",
            };
          case 403:
            return { title: "Forbidden", description: "You don't have permission to view applications", variant: "error" };
          case 500:
            return { title: "Server error", description: "Temporary issue, please try again", variant: "error" };
          default:
            return { title: "Error", description: message || "Failed to fetch applications", variant: "error" };
        }
      }
      if (axiosErr?.request) return connectionErrorToast;
      return { title: "Error", description: "An unexpected error occurred", variant: "error" };
    },
  });
}

/** Approuver une candidature, admin only (remplace `BrandApplicationService.approveApplication`). */
export function useApproveBrandApplication() {
  const queryClient = useQueryClient();
  return useToastMutation({
    ...getBrandApplicationsControllerApproveMutationOptions(),
    successToast: (data) => {
      // temporaryPassword is only ever present in dev/démo (SKIP_EMAIL_VERIFICATION) —
      // in prod it's always undefined, sent by email instead, never shown here.
      if (data.temporaryPassword) {
        return {
          title: "Application approved (dev)",
          description: `Account created — ${data.username} / ${data.temporaryPassword}`,
          variant: "success",
          duration: 15000,
        };
      }
      return {
        title: "Application approved",
        description: "The brand application has been approved successfully. A user account has been created.",
        variant: "success",
      };
    },
    errorToast: (error) => {
      const axiosErr = asAxiosError(error);
      if (axiosErr?.response) {
        const message = axiosErr.response.data?.message;
        switch (axiosErr.response.status) {
          case 400:
          case 409:
            return { title: "Validation error", description: message || "Unable to approve application", variant: "error" };
          case 401:
            return { title: "Unauthorized", description: "You must be logged in as an admin", variant: "error" };
          case 403:
            return { title: "Forbidden", description: "You don't have permission to approve applications", variant: "error" };
          case 500:
            return { title: "Server error", description: "Temporary issue, please try again", variant: "error" };
          default:
            return { title: "Error", description: message || "Failed to approve application", variant: "error" };
        }
      }
      if (axiosErr?.request) return connectionErrorToast;
      return { title: "Error", description: "An unexpected error occurred", variant: "error" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getBrandApplicationsControllerListQueryKey() });
    },
  });
}

/** Rejeter une candidature, admin only (remplace `BrandApplicationService.rejectApplication`). */
export function useRejectBrandApplication() {
  const queryClient = useQueryClient();
  return useToastMutation({
    ...getBrandApplicationsControllerRejectMutationOptions(),
    successToast: () => ({
      title: "Application rejected",
      description: "The brand application has been rejected.",
      variant: "success",
    }),
    errorToast: (error) => {
      const axiosErr = asAxiosError(error);
      if (axiosErr?.response) {
        const message = axiosErr.response.data?.message;
        switch (axiosErr.response.status) {
          case 400:
            return {
              title: "Validation error",
              description: message || "Please provide a reason for rejection",
              variant: "error",
            };
          case 401:
            return { title: "Unauthorized", description: "You must be logged in as an admin", variant: "error" };
          case 403:
            return { title: "Forbidden", description: "You don't have permission to reject applications", variant: "error" };
          case 500:
            return { title: "Server error", description: "Temporary issue, please try again", variant: "error" };
          default:
            return { title: "Error", description: message || "Failed to reject application", variant: "error" };
        }
      }
      if (axiosErr?.request) return connectionErrorToast;
      return { title: "Error", description: "An unexpected error occurred", variant: "error" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getBrandApplicationsControllerListQueryKey() });
    },
  });
}
