import axios from "axios";
import { ApiService } from "./api.service";
import { toast } from "@/lib/toast";
import {
  BrandApplication,
  CreateBrandApplicationData,
  GetBrandApplicationsParams,
  GetBrandApplicationsResponse,
  ApproveBrandApplicationResponse,
  RejectBrandApplicationData,
  RejectBrandApplicationResponse,
} from "@/types/brand-application.types";
import { asAxiosError } from "@/lib/api-error";

/** Traduit la forme interne (snake_case) du wizard vers le contrat API (camelCase). */
function toWireRequest(data: CreateBrandApplicationData) {
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
    registrationProofUrl: data.registration_proof_url,
    motivation: data.motivation,
    estimatedCommunitySize: data.estimated_community_size,
    socialMediaLinks: data.social_media_links,
    howDidYouHearAboutUs: data.how_did_you_hear_about_us,
  };
}

export default class BrandApplicationService {
  /**
   * Create a new brand application (public endpoint)
   */
  static async createApplication(
    data: CreateBrandApplicationData
  ): Promise<BrandApplication | null> {
    try {
      const res = await axios.post(
        `${ApiService.baseURL}/brands/applications`,
        toWireRequest(data)
      );

      if (res.status === 201 || res.status === 200) {
        toast({
          title: "Application submitted",
          description: "Your brand application has been submitted successfully! Please check your email to verify your address. We'll review your application once your email is verified.",
          variant: "success",
        });

        return res.data;
      }
      return null;
    } catch (err) {
      const axiosErr = asAxiosError(err);
      if (axiosErr?.response) {
        const status = axiosErr.response.status;
        const data = axiosErr.response.data;

        switch (status) {
          case 400:
            toast({
              title: "Validation error",
              description: data?.message || "Please check your information",
              variant: "error",
            });
            break;
          case 409:
            toast({
              title: "Conflict",
              description: data?.message || "This brand or registration number is already in use",
              variant: "error",
            });
            break;
          case 500:
            toast({
              title: "Server error",
              description: "Temporary issue, please try again",
              variant: "error",
            });
            break;
          default:
            toast({
              title: "Application error",
              description: data?.message || "An unexpected error occurred",
              variant: "error",
            });
        }
      } else if (axiosErr?.request) {
        toast({
          title: "Connection error",
          description: "Unable to reach the server. Check your internet connection.",
          variant: "error",
        });
      } else {
        toast({
          title: "Application error",
          description: "An unexpected error occurred",
          variant: "error",
        });
      }
      return null;
    }
  }

  /**
   * Verify email for a brand application (public endpoint)
   */
  static async verifyEmail(token: string): Promise<BrandApplication | null> {
    try {
      const res = await axios.post(
        `${ApiService.baseURL}/brands/applications/verify-email`,
        { token }
      );

      if (res.status === 200) {
        toast({
          title: "Email verified",
          description: "Your email has been successfully verified! Your application will be reviewed soon.",
          variant: "success",
        });

        return res.data;
      }
      return null;
    } catch (err) {
      const axiosErr = asAxiosError(err);
      if (axiosErr?.response) {
        const status = axiosErr.response.status;
        const data = axiosErr.response.data;

        switch (status) {
          case 400:
            toast({
              title: "Verification error",
              description: data?.message || "The verification link is invalid or expired",
              variant: "error",
            });
            break;
          case 500:
            toast({
              title: "Server error",
              description: "Temporary issue, please try again",
              variant: "error",
            });
            break;
          default:
            toast({
              title: "Verification error",
              description: data?.message || "An unexpected error occurred",
              variant: "error",
            });
        }
      } else if (axiosErr?.request) {
        toast({
          title: "Connection error",
          description: "Unable to reach the server. Check your internet connection.",
          variant: "error",
        });
      } else {
        toast({
          title: "Verification error",
          description: "An unexpected error occurred",
          variant: "error",
        });
      }
      return null;
    }
  }

  /**
   * Get all brand applications with pagination and filters (admin only)
   */
  static async getAllApplications(
    params?: GetBrandApplicationsParams
  ): Promise<GetBrandApplicationsResponse | null> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.limit) {
        queryParams.append("limit", params.limit.toString());
      }
      if (params?.offset) {
        queryParams.append("offset", params.offset.toString());
      }
      if (params?.status) {
        queryParams.append("status", params.status);
      }
      if (params?.search) {
        queryParams.append("search", params.search);
      }

      const url = `${ApiService.baseURL}/brands/applications${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;

      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("Token")}`,
        },
      });

      if (res.status === 200) {
        return res.data;
      }
      return null;
    } catch (err) {
      const axiosErr = asAxiosError(err);
      if (axiosErr?.response) {
        const status = axiosErr.response.status;
        const data = axiosErr.response.data;

        switch (status) {
          case 401:
            toast({
              title: "Unauthorized",
              description: "You must be logged in as an admin to view applications",
              variant: "error",
            });
            break;
          case 403:
            toast({
              title: "Forbidden",
              description: "You don't have permission to view applications",
              variant: "error",
            });
            break;
          case 500:
            toast({
              title: "Server error",
              description: "Temporary issue, please try again",
              variant: "error",
            });
            break;
          default:
            toast({
              title: "Error",
              description: data?.message || "Failed to fetch applications",
              variant: "error",
            });
        }
      } else if (axiosErr?.request) {
        toast({
          title: "Connection error",
          description: "Unable to reach the server. Check your internet connection.",
          variant: "error",
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "error",
        });
      }
      return null;
    }
  }

  /**
   * Get brand application by ID (admin only)
   */
  static async getApplicationById(
    id: string
  ): Promise<BrandApplication | null> {
    try {
      const res = await axios.get(
        `${ApiService.baseURL}/brands/applications/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("Token")}`,
          },
        }
      );

      if (res.status === 200) {
        return res.data;
      }
      return null;
    } catch (err) {
      const axiosErr = asAxiosError(err);
      if (axiosErr?.response) {
        const status = axiosErr.response.status;
        const data = axiosErr.response.data;

        switch (status) {
          case 401:
            toast({
              title: "Unauthorized",
              description: "You must be logged in as an admin",
              variant: "error",
            });
            break;
          case 403:
            toast({
              title: "Forbidden",
              description: "You don't have permission to view this application",
              variant: "error",
            });
            break;
          case 404:
            toast({
              title: "Not found",
              description: "Application not found",
              variant: "error",
            });
            break;
          case 500:
            toast({
              title: "Server error",
              description: "Temporary issue, please try again",
              variant: "error",
            });
            break;
          default:
            toast({
              title: "Error",
              description: data?.message || "Failed to fetch application",
              variant: "error",
            });
        }
      } else if (axiosErr?.request) {
        toast({
          title: "Connection error",
          description: "Unable to reach the server. Check your internet connection.",
          variant: "error",
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "error",
        });
      }
      return null;
    }
  }

  /**
   * Approve a brand application (admin only)
   */
  static async approveApplication(
    id: string
  ): Promise<ApproveBrandApplicationResponse | null> {
    try {
      const res = await axios.put(
        `${ApiService.baseURL}/brands/applications/${id}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("Token")}`,
          },
        }
      );

      if (res.status === 200) {
        toast({
          title: "Application approved",
          description: "The brand application has been approved successfully. A user account has been created.",
          variant: "success",
        });

        return res.data;
      }
      return null;
    } catch (err) {
      const axiosErr = asAxiosError(err);
      if (axiosErr?.response) {
        const status = axiosErr.response.status;
        const data = axiosErr.response.data;

        switch (status) {
          case 400:
          case 409:
            toast({
              title: "Validation error",
              description: data?.message || "Unable to approve application",
              variant: "error",
            });
            break;
          case 401:
            toast({
              title: "Unauthorized",
              description: "You must be logged in as an admin",
              variant: "error",
            });
            break;
          case 403:
            toast({
              title: "Forbidden",
              description: "You don't have permission to approve applications",
              variant: "error",
            });
            break;
          case 500:
            toast({
              title: "Server error",
              description: "Temporary issue, please try again",
              variant: "error",
            });
            break;
          default:
            toast({
              title: "Error",
              description: data?.message || "Failed to approve application",
              variant: "error",
            });
        }
      } else if (axiosErr?.request) {
        toast({
          title: "Connection error",
          description: "Unable to reach the server. Check your internet connection.",
          variant: "error",
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "error",
        });
      }
      return null;
    }
  }

  /**
   * Reject a brand application (admin only)
   */
  static async rejectApplication(
    id: string,
    data: RejectBrandApplicationData
  ): Promise<RejectBrandApplicationResponse | null> {
    try {
      const res = await axios.put(
        `${ApiService.baseURL}/brands/applications/${id}/reject`,
        data,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("Token")}`,
          },
        }
      );

      if (res.status === 200) {
        toast({
          title: "Application rejected",
          description: "The brand application has been rejected.",
          variant: "success",
        });

        return res.data;
      }
      return null;
    } catch (err) {
      const axiosErr = asAxiosError(err);
      if (axiosErr?.response) {
        const status = axiosErr.response.status;
        const data = axiosErr.response.data;

        switch (status) {
          case 400:
            toast({
              title: "Validation error",
              description: data?.message || "Please provide a reason for rejection",
              variant: "error",
            });
            break;
          case 401:
            toast({
              title: "Unauthorized",
              description: "You must be logged in as an admin",
              variant: "error",
            });
            break;
          case 403:
            toast({
              title: "Forbidden",
              description: "You don't have permission to reject applications",
              variant: "error",
            });
            break;
          case 500:
            toast({
              title: "Server error",
              description: "Temporary issue, please try again",
              variant: "error",
            });
            break;
          default:
            toast({
              title: "Error",
              description: data?.message || "Failed to reject application",
              variant: "error",
            });
        }
      } else if (axiosErr?.request) {
        toast({
          title: "Connection error",
          description: "Unable to reach the server. Check your internet connection.",
          variant: "error",
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "error",
        });
      }
      return null;
    }
  }
}
