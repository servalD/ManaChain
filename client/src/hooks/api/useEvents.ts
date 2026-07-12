"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  getEventsControllerListQueryOptions,
  getEventsControllerGetOneQueryOptions,
  getEventsControllerMyBrandEventsQueryOptions,
  getEventsControllerMyBrandEventsQueryKey,
  getEventsControllerMyTicketsQueryOptions,
  getEventsControllerMyTicketsQueryKey,
  getEventsControllerTicketTypesQueryOptions,
  getEventsControllerTicketTypesQueryKey,
  getEventsControllerCreateMutationOptions,
  getEventsControllerLinkContractsMutationOptions,
  getEventsControllerPublishMutationOptions,
} from "@/api/generated/endpoints/events/events";
import type {
  EventsControllerListParams,
  EventsControllerMyBrandEventsParams,
  EventsControllerMyTicketsParams,
} from "@/api/generated/models";
import { apiErrorToast } from "@/lib/api-error";
import { useToastQuery } from "./useToastQuery";
import { useToastMutation } from "./useToastMutation";

/** Découverte publique (événements publiés). */
export function useEvents(params?: EventsControllerListParams) {
  return useToastQuery({ ...getEventsControllerListQueryOptions(params) });
}

/** Événement par id. */
export function useEvent(eventId: string | undefined, options?: { enabled?: boolean }) {
  return useToastQuery({
    ...getEventsControllerGetOneQueryOptions(eventId ?? ""),
    enabled: !!eventId && (options?.enabled ?? true),
  });
}

/** Mes événements (brand, tous statuts). */
export function useMyBrandEvents(params?: EventsControllerMyBrandEventsParams) {
  return useToastQuery({ ...getEventsControllerMyBrandEventsQueryOptions(params) });
}

/** Mes billets achetés. */
export function useMyTickets(params?: EventsControllerMyTicketsParams) {
  return useToastQuery({ ...getEventsControllerMyTicketsQueryOptions(params) });
}

/** Types de billets d'un événement (prix + quantité mintée). */
export function useEventTicketTypes(eventId: string | undefined, options?: { enabled?: boolean }) {
  return useToastQuery({
    ...getEventsControllerTicketTypesQueryOptions(eventId ?? ""),
    enabled: !!eventId && (options?.enabled ?? true),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useToastMutation({
    ...getEventsControllerCreateMutationOptions(),
    errorToast: apiErrorToast("Failed to create event."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getEventsControllerMyBrandEventsQueryKey() });
    },
  });
}

export function useLinkEventContracts() {
  return useToastMutation({
    ...getEventsControllerLinkContractsMutationOptions(),
    errorToast: apiErrorToast("Failed to link the deployed module."),
  });
}

export function usePublishEvent() {
  const queryClient = useQueryClient();
  return useToastMutation({
    ...getEventsControllerPublishMutationOptions(),
    errorToast: apiErrorToast("Failed to publish event."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getEventsControllerMyBrandEventsQueryKey() });
    },
  });
}

export { getEventsControllerTicketTypesQueryKey, getEventsControllerMyTicketsQueryKey };
