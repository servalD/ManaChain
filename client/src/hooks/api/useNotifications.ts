"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  getNotificationsControllerMyNotificationsQueryOptions,
  getNotificationsControllerMyNotificationsQueryKey,
  getNotificationsControllerSendMutationOptions,
  getNotificationsControllerMarkReadMutationOptions,
} from "@/api/generated/endpoints/notifications/notifications";
import type { NotificationsControllerMyNotificationsParams } from "@/api/generated/models";
import { apiErrorToast } from "@/lib/api-error";
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
    errorToast: apiErrorToast("Failed to send notification."),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useToastMutation({
    ...getNotificationsControllerMarkReadMutationOptions(),
    errorToast: apiErrorToast("Failed to mark as read."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getNotificationsControllerMyNotificationsQueryKey() });
    },
  });
}
