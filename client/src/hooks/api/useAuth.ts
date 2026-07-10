"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  getAuthControllerRegisterMutationOptions,
  getAuthControllerLoginMutationOptions,
  getAuthControllerVerifyEmailMutationOptions,
  getAuthControllerResendVerificationMutationOptions,
  getAuthControllerForgotPasswordMutationOptions,
  getAuthControllerResetPasswordMutationOptions,
  getAuthControllerChangePasswordMutationOptions,
} from "@/api/generated/endpoints/auth/auth";
import {
  usersControllerMe,
  getUsersControllerMeQueryKey,
  getUsersControllerUpdateMeMutationOptions,
  getUsersControllerUpdateMyBlockchainAddressMutationOptions,
  getUsersControllerDeleteMeMutationOptions,
} from "@/api/generated/endpoints/users/users";
import type { UserResponse } from "@/api/generated/models";
import { asAxiosError } from "@/lib/api-error";
import { toast } from "@/lib/toast";
import { useToastMutation } from "./useToastMutation";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("Token");
}

function clearSession() {
  localStorage.removeItem("Token");
}

/**
 * Vérifie la session courante (remplace `AuthService.isLogged`). Ne fait aucun
 * appel réseau si aucun token n'est présent. Sur 401/404, nettoie le token et
 * redirige durement vers `/` (comportement de l'ancien `logout()` interne).
 */
export async function checkSession(): Promise<UserResponse | null> {
  const token = getToken();
  if (!token) return null;

  try {
    return await usersControllerMe();
  } catch (err) {
    const axiosErr = asAxiosError(err);
    if (axiosErr?.response) {
      switch (axiosErr.response.status) {
        case 401:
          toast({ title: "Session expired", description: "Please log in again", variant: "warning" });
          clearSession();
          if (typeof window !== "undefined") window.location.href = "/";
          break;
        case 403:
          toast({
            title: "Access denied",
            description: "You don't have the necessary permissions",
            variant: "error",
          });
          break;
        case 404:
          toast({ title: "User not found", description: "Your account no longer exists", variant: "warning" });
          clearSession();
          if (typeof window !== "undefined") window.location.href = "/";
          break;
        default:
          toast({
            title: "Authentication error",
            description: "Problem verifying your session",
            variant: "error",
          });
      }
    } else if (axiosErr?.request) {
      toast({ title: "Connection error", description: "Unable to reach the server", variant: "error" });
    }
    return null;
  }
}

/** Déconnexion (remplace `AuthService.logout`). */
export function logout() {
  clearSession();
  toast({ title: "Logout successful", description: "See you soon on Mana Chain", variant: "default" });
  if (typeof window !== "undefined") window.location.href = "/";
}

/** Connexion email + mot de passe (remplace `AuthService.login`). */
export function useLogin() {
  return useToastMutation({
    ...getAuthControllerLoginMutationOptions(),
    successToast: (data) => ({
      title: "Login successful",
      description: `Welcome ${data.user.username}`,
      variant: "success",
    }),
    errorToast: (error) => {
      const axiosErr = asAxiosError(error);
      if (axiosErr?.response) {
        const data = axiosErr.response.data;
        switch (data?.error) {
          case "EmailNotVerifiedError":
            return {
              title: "Account not verified",
              description: data.message || "Please verify your email address before logging in",
              variant: "warning",
            };
          case "InvalidCredentialsError":
            return { title: "Authentication failed", description: "Incorrect email or password", variant: "error" };
          default:
            if (axiosErr.response.status === 500) {
              return { title: "Server error", description: "Temporary issue, please try again", variant: "error" };
            }
            return {
              title: "Connection error",
              description: data?.message || "An unexpected error occurred",
              variant: "error",
            };
        }
      }
      if (axiosErr?.request) {
        return {
          title: "Connection error",
          description: "Unable to reach the server. Check your internet connection.",
          variant: "error",
        };
      }
      return { title: "Connection error", description: "An unexpected error occurred", variant: "error" };
    },
    onSuccess: (data) => {
      if (data.token) localStorage.setItem("Token", data.token);
    },
  });
}

/** Inscription (remplace `AuthService.register`). Ne stocke pas de token : l'email doit être vérifié d'abord. */
export function useRegister() {
  return useToastMutation({
    ...getAuthControllerRegisterMutationOptions(),
    successToast: () => ({
      title: "Registration successful",
      description: "Please check your email to confirm your account",
      variant: "success",
    }),
    errorToast: (error) => {
      const axiosErr = asAxiosError(error);
      if (axiosErr?.response) {
        const status = axiosErr.response.status;
        const data = axiosErr.response.data;
        if (status === 409) {
          if (data?.error === "EmailAlreadyRegisteredError") {
            return {
              title: "Email already in use",
              description: "This email is already associated with an account",
              variant: "error",
            };
          }
          if (data?.error === "UsernameAlreadyTakenError") {
            return { title: "Username already taken", description: "Please choose another username", variant: "error" };
          }
          return { title: "Conflict", description: data?.message || "Please check your information", variant: "error" };
        }
        if (status === 400) {
          return { title: "Input error", description: data?.message || "Please check your information", variant: "error" };
        }
        if (status === 500) {
          return { title: "Server error", description: "Temporary issue, please try again", variant: "error" };
        }
        return { title: "Registration error", description: data?.message || "An unexpected error occurred", variant: "error" };
      }
      if (axiosErr?.request) {
        return {
          title: "Connection error",
          description: "Unable to reach the server. Check your internet connection.",
          variant: "error",
        };
      }
      return { title: "Registration error", description: "An unexpected error occurred", variant: "error" };
    },
  });
}

/** Vérification d'email utilisateur (remplace `AuthService.verifyEmail`). */
export function useVerifyEmail() {
  return useToastMutation({
    ...getAuthControllerVerifyEmailMutationOptions(),
    successToast: () => ({
      title: "Email verified",
      description: "Your account has been successfully activated",
      variant: "success",
    }),
    errorToast: (error) => {
      const axiosErr = asAxiosError(error);
      if (axiosErr?.response) {
        return {
          title: "Verification error",
          description: axiosErr.response.data?.message || "The verification link is invalid or expired",
          variant: "error",
        };
      }
      return { title: "Connection error", description: "Unable to reach the server", variant: "error" };
    },
  });
}

/** Renvoyer l'email de vérification (remplace `AuthService.resendVerification`). */
export function useResendVerification() {
  return useToastMutation({
    ...getAuthControllerResendVerificationMutationOptions(),
    successToast: () => ({ title: "Email sent", description: "A new verification link has been sent", variant: "success" }),
    errorToast: (error) => {
      const axiosErr = asAxiosError(error);
      if (axiosErr?.response) {
        return {
          title: "Sending error",
          description: axiosErr.response.data?.message || "Unable to send verification email",
          variant: "error",
        };
      }
      return { title: "Connection error", description: "Unable to reach the server", variant: "error" };
    },
  });
}

/**
 * Demander un reset de mot de passe (remplace `AuthService.forgotPassword`).
 * Anti-énumération : le toast est VOLONTAIREMENT identique en succès et en
 * échec (seul le `variant` diffère), pour ne pas révéler si l'email existe en
 * base. Ne pas "corriger" cette apparente incohérence.
 */
export function useForgotPassword() {
  return useToastMutation({
    ...getAuthControllerForgotPasswordMutationOptions(),
    successToast: () => ({
      title: "Check your email",
      description: "If an account exists with this email, you will receive a password reset link.",
      variant: "success",
    }),
    errorToast: () => ({
      title: "Check your email",
      description: "If an account exists with this email, you will receive a password reset link.",
      variant: "default",
    }),
  });
}

/** Réinitialiser le mot de passe via token (remplace `AuthService.resetPassword`). */
export function useResetPassword() {
  return useToastMutation({
    ...getAuthControllerResetPasswordMutationOptions(),
    successToast: () => ({
      title: "Password reset",
      description: "Your password has been successfully updated. You can now log in.",
      variant: "success",
    }),
    errorToast: (error) => {
      const axiosErr = asAxiosError(error);
      if (axiosErr?.response) {
        return {
          title: "Reset failed",
          description: axiosErr.response.data?.message || "Unable to reset password. The link may have expired.",
          variant: "error",
        };
      }
      return { title: "Connection error", description: "Unable to reach the server", variant: "error" };
    },
  });
}

/** Changer son mot de passe, utilisateur authentifié (remplace `AuthService.changePassword`). */
export function useChangePassword() {
  return useToastMutation({
    ...getAuthControllerChangePasswordMutationOptions(),
    successToast: () => ({
      title: "Password changed",
      description: "Your password has been successfully updated",
      variant: "success",
    }),
    errorToast: (error) => {
      const axiosErr = asAxiosError(error);
      if (axiosErr?.response) {
        return {
          title: "Modification error",
          description: axiosErr.response.data?.message || "Unable to change password",
          variant: "error",
        };
      }
      return { title: "Connection error", description: "Unable to reach the server", variant: "error" };
    },
  });
}

/** Mettre à jour son profil (remplace `AuthService.updateProfile`). */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useToastMutation({
    ...getUsersControllerUpdateMeMutationOptions(),
    successToast: () => ({ title: "Profile updated", description: "Your profile has been saved.", variant: "success" }),
    errorToast: (error) => ({
      title: "Error",
      description: asAxiosError(error)?.response?.data?.message || "Failed to update profile. Please try again.",
      variant: "error",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getUsersControllerMeQueryKey() });
    },
  });
}

/**
 * Supprimer son compte (anonymisation RGPD, cf. `DeleteAccountUseCase` côté back).
 * Redirige vers l'accueil comme `logout()` : le compte n'existe plus pour les
 * lookups suivants, la session locale n'a plus d'utilité.
 */
export function useDeleteAccount() {
  return useToastMutation({
    ...getUsersControllerDeleteMeMutationOptions(),
    successToast: () => ({
      title: "Account deleted",
      description: "Your account has been deleted. Goodbye!",
      variant: "success",
    }),
    errorToast: (error) => {
      const axiosErr = asAxiosError(error);
      if (axiosErr?.response) {
        if (axiosErr.response.data?.error === "BrandOwnerCannotDeleteAccountError") {
          return {
            title: "Cannot delete account",
            description: "You own a brand — delete or transfer it before deleting your account.",
            variant: "error",
          };
        }
        return {
          title: "Error",
          description: axiosErr.response.data?.message || "Failed to delete account. Please try again.",
          variant: "error",
        };
      }
      return { title: "Connection error", description: "Unable to reach the server", variant: "error" };
    },
    onSuccess: () => {
      clearSession();
      if (typeof window !== "undefined") window.location.href = "/";
    },
  });
}

/** Mettre à jour l'adresse blockchain (remplace `AuthService.updateBlockchainAddress`). */
export function useUpdateBlockchainAddress() {
  const queryClient = useQueryClient();
  return useToastMutation({
    ...getUsersControllerUpdateMyBlockchainAddressMutationOptions(),
    errorToast: (error) => {
      // L'ancien service ne toastait que si le serveur renvoyait un message.
      const message = asAxiosError(error)?.response?.data?.message;
      if (!message) return;
      return { title: "Error", description: message, variant: "error" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getUsersControllerMeQueryKey() });
    },
  });
}
