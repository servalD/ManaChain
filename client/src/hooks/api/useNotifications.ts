"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  getNotificationsControllerMyNotificationsQueryOptions,
  getNotificationsControllerMyNotificationsQueryKey,
  getNotificationsControllerSendMutationOptions,
  getNotificationsControllerMarkReadMutationOptions,
} from "@/api/generated/endpoints/notifications/notifications";
import type { NotificationsControllerMyNotificationsParams } from "@/api/generated/models";
import { asAxiosError } from "@/lib/api-error";
import { useToastQuery } from "./useToastQuery";
import { useToastMutation } from "./useToastMutation";

/** Mes notifications (toutes utilisateurs, pas juste admin). */
export function useMyNotifications(params?: NotificationsControllerMyNotificationsParams) {
  return useToastQuery({ ...getNotificationsControllerMyNotificationsQueryOptions(params) });
}

/** Envoi admin : destinataire unique / rôle / tout le monde. */
export function useSendNotification() {
  return useToastMutation({
    ...getNotificationsControllerSendMutationOptions(),
    errorToast: (error) => ({
      title: "Error",
      description: asAxiosError(error)?.response?.data?.message || "Failed to send notification.",
      variant: "error",
    }),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useToastMutation({
    ...getNotificationsControllerMarkReadMutationOptions(),
    errorToast: (error) => ({
      title: "Error",
      description: asAxiosError(error)?.response?.data?.message || "Failed to mark as read.",
      variant: "error",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getNotificationsControllerMyNotificationsQueryKey() });
    },
  });
}
