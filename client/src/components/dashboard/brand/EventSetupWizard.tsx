"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { decodeEventLog, type Address } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import PinataService from "@/services/pinata.service";
import { useTxFlow } from "@/hooks/web3/useTxFlow";
import {
  useCreateEvent,
  useLinkEventContracts,
  usePublishEvent,
  useEventTicketTypes,
} from "@/hooks/api/useEvents";
import { eventFactoryAbi, saleFactoryAbi, eventTicketsAbi, ticketSaleAbi } from "@/lib/web3/generated";
import { CONTRACT_ADDRESSES } from "@/lib/web3/addresses";
import type { EventResponse } from "@/api/generated/models";
import type { TransactionReceipt } from "viem";

function StepShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border rounded-lg p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

/** Décode l'adresse déployée depuis le reçu de tx (event log), sans dépendre de l'indexer. */
function decodeDeployedAddress(
  receipt: TransactionReceipt,
  abi: typeof eventFactoryAbi | typeof saleFactoryAbi,
  eventName: "EventModuleDeployed" | "TicketSaleDeployed",
  argName: "eventTickets" | "ticketSale",
): Address | null {
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({ abi, data: log.data, topics: log.topics, eventName });
      const value = (decoded.args as Record<string, unknown>)[argName];
      if (typeof value === "string") return value as Address;
    } catch {
      // Log d'un autre event émis dans la même tx — ignoré.
    }
  }
  return null;
}

interface EventSetupWizardProps {
  brandAddress: Address;
  onDone: () => void;
}

/**
 * Wizard de création d'événement : draft DB → deployEventModule →
 * deployTicketSale → link contracts → types de billets → publish. Contraire
 * au wizard token (chain-first), celui-ci est DB-first : l'état de chaque
 * étape vient de l'objet `Event` retourné par l'API. Les adresses déployées
 * sont décodées directement du reçu de transaction (pas d'attente indexer
 * pour les faire transiter d'une étape à l'autre).
 */
export function EventSetupWizard({ brandAddress, onDone }: EventSetupWizardProps) {
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [pendingEventTicketsAddress, setPendingEventTicketsAddress] = useState<Address | null>(null);

  if (!event) {
    return <DraftStep onCreated={setEvent} />;
  }
  if (!pendingEventTicketsAddress && !event.eventTicketsAddress) {
    return (
      <DeployModuleStep
        brandAddress={brandAddress}
        event={event}
        onDeployed={setPendingEventTicketsAddress}
      />
    );
  }
  if (!event.ticketSaleAddress) {
    return (
      <DeployTicketSaleStep
        eventTicketsAddress={(pendingEventTicketsAddress ?? event.eventTicketsAddress) as Address}
        event={event}
        onLinked={setEvent}
      />
    );
  }
  return <TicketTypesStep event={event} onPublished={onDone} />;
}

function DraftStep({ onCreated }: { onCreated: (e: EventResponse) => void }) {
  const t = useTranslations("dashboard.brand.eventSetupWizard.draftStep");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [description, setDescription] = useState("");
  const createEvent = useCreateEvent();

  const isBusy = createEvent.isPending;

  const handleCreate = async () => {
    if (!title.trim() || !type.trim() || !startsAt) {
      toast({ title: t("toasts.missingFieldsTitle"), description: t("toasts.missingFieldsMessage"), variant: "error" });
      return;
    }
    const created = await createEvent.mutateAsync({
      data: {
        title: title.trim(),
        type: type.trim(),
        description: description.trim() || undefined,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
      },
    });
    onCreated(created);
  };

  return (
    <StepShell title={t("title")} description={t("description")}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">{t("titleLabel")}</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("titlePlaceholder")} disabled={isBusy} />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">{t("typeLabel")}</label>
          <Input value={type} onChange={(e) => setType(e.target.value)} placeholder={t("typePlaceholder")} disabled={isBusy} />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">{t("startsAtLabel")}</label>
          <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} disabled={isBusy} />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">{t("endsAtLabel")}</label>
          <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} disabled={isBusy} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">{t("descriptionLabel")}</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isBusy}
          rows={3}
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
        />
      </div>
      <Button onClick={handleCreate} disabled={isBusy} className="w-full">
        {isBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        {t("saveDraft")}
      </Button>
    </StepShell>
  );
}

function DeployModuleStep({
  brandAddress,
  event,
  onDeployed,
}: {
  brandAddress: Address;
  event: EventResponse;
  onDeployed: (address: Address) => void;
}) {
  const t = useTranslations("dashboard.brand.eventSetupWizard.deployModuleStep");
  const [isUploading, setIsUploading] = useState(false);
  const deployFlow = useTxFlow({
    abi: eventFactoryAbi,
    address: CONTRACT_ADDRESSES.eventFactory,
    onConfirmed: (receipt) => {
      const address = decodeDeployedAddress(receipt, eventFactoryAbi, "EventModuleDeployed", "eventTickets");
      if (!address) {
        toast({ title: t("toasts.errorTitle"), description: t("toasts.decodeErrorMessage"), variant: "error" });
        return;
      }
      toast({ title: t("toasts.deployedTitle"), description: t("toasts.deployedMessage"), variant: "success" });
      onDeployed(address);
    },
  });

  const isBusy = deployFlow.status === "signing" || deployFlow.status === "pending" || isUploading;

  const handleDeploy = async () => {
    setIsUploading(true);
    let uri = "";
    try {
      const metadata = { title: event.title, description: event.description, type: event.type };
      const file = new File([JSON.stringify(metadata)], "metadata.json", { type: "application/json" });
      uri = await PinataService.uploadFile(file);
    } catch {
      setIsUploading(false);
      return;
    }
    setIsUploading(false);
    await deployFlow.write("deployEventModule", [brandAddress, uri]);
  };

  return (
    <StepShell title={t("title")} description={t("description")}>
      <Button onClick={handleDeploy} disabled={isBusy} className="w-full">
        {isBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        {isUploading ? t("uploadingMetadata") : isBusy ? t("confirming") : t("deployButton")}
      </Button>
      {deployFlow.status === "failed" && deployFlow.error && (
        <p className="text-sm text-destructive">{deployFlow.error.message}</p>
      )}
    </StepShell>
  );
}

function DeployTicketSaleStep({
  eventTicketsAddress,
  event,
  onLinked,
}: {
  eventTicketsAddress: Address;
  event: EventResponse;
  onLinked: (e: EventResponse) => void;
}) {
  const t = useTranslations("dashboard.brand.eventSetupWizard.deployTicketSaleStep");
  const [freeEvent, setFreeEvent] = useState(false);
  const linkContracts = useLinkEventContracts();

  const link = async () => {
    const linked = await linkContracts.mutateAsync({
      id: event.id,
      data: { eventTicketsAddress, paymentFree: freeEvent },
    });
    onLinked(linked);
    if (!linked.ticketSaleAddress) {
      toast({
        title: t("toasts.stillSyncingTitle"),
        description: t("toasts.stillSyncingMessage"),
        variant: "default",
      });
    }
  };

  const saleFlow = useTxFlow({
    abi: saleFactoryAbi,
    address: CONTRACT_ADDRESSES.saleFactory,
    onConfirmed: async () => {
      toast({ title: t("toasts.deployedTitle"), description: t("toasts.deployedMessage"), variant: "success" });
      await link();
    },
  });

  const handleDeploySale = async () => {
    const start = BigInt(Math.floor(new Date(event.startsAt).getTime() / 1000));
    const end = event.endsAt
      ? BigInt(Math.floor(new Date(event.endsAt).getTime() / 1000))
      : start + BigInt(365 * 24 * 60 * 60);
    await saleFlow.write("deployTicketSale", [eventTicketsAddress, freeEvent, start, end]);
  };

  const isBusy = saleFlow.status === "signing" || saleFlow.status === "pending" || linkContracts.isPending;

  return (
    <StepShell title={t("title")} description={t("description")}>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={freeEvent} onChange={(e) => setFreeEvent(e.target.checked)} disabled={isBusy} />
        {t("freeEventLabel")}
      </label>
      <div className="flex gap-3">
        <Button onClick={handleDeploySale} disabled={isBusy} className="flex-1">
          {isBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          {t("deployButton")}
        </Button>
        <Button onClick={() => void link()} disabled={isBusy} variant="outline" className="flex-1">
          {t("linkRetryButton")}
        </Button>
      </div>
      {saleFlow.status === "failed" && saleFlow.error && (
        <p className="text-sm text-destructive">{saleFlow.error.message}</p>
      )}
    </StepShell>
  );
}

function TicketTypesStep({
  event,
  onPublished,
}: {
  event: EventResponse;
  onPublished: () => void;
}) {
  const t = useTranslations("dashboard.brand.eventSetupWizard.ticketTypesStep");
  const { data: ticketTypes } = useEventTicketTypes(event.id);
  const [tokenId, setTokenId] = useState("1");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const publishEvent = usePublishEvent();

  const priceFlow = useTxFlow({
    abi: ticketSaleAbi,
    address: event.ticketSaleAddress as Address,
    onConfirmed: () => {
      toast({ title: t("toasts.addedTitle"), description: t("toasts.addedMessage", { tokenId }), variant: "success" });
    },
  });
  const mintFlow = useTxFlow({
    abi: eventTicketsAbi,
    address: event.eventTicketsAddress as Address,
    onConfirmed: async () => {
      await priceFlow.write("setPrice", [BigInt(tokenId), event.paymentFree ? BigInt(0) : parseUsdc(price)]);
    },
  });

  const isBusy =
    mintFlow.status === "signing" || mintFlow.status === "pending" ||
    priceFlow.status === "signing" || priceFlow.status === "pending";

  const handleAddType = async () => {
    if (!quantity.trim() || (!event.paymentFree && !price.trim())) {
      toast({ title: t("toasts.missingFieldsTitle"), description: t("toasts.missingFieldsMessage"), variant: "error" });
      return;
    }
    await mintFlow.write("mint", [event.ticketSaleAddress as Address, BigInt(tokenId), BigInt(quantity)]);
  };

  return (
    <StepShell title={t("title")} description={t("description")}>
      {(ticketTypes ?? []).length > 0 && (
        <ul className="text-sm space-y-1">
          {(ticketTypes ?? []).map((ticketType) => (
            <li key={ticketType.id} className="flex justify-between border-b border-border py-1">
              <span>{t("tokenLabel", { tokenId: ticketType.tokenId })}</span>
              <span className="text-muted-foreground">
                {t("mintedSummary", { minted: ticketType.mintedQuantity, price: (Number(ticketType.price) / 1e6).toFixed(2) })}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-3 gap-3">
        <Input type="number" value={tokenId} onChange={(e) => setTokenId(e.target.value)} placeholder={t("tokenIdPlaceholder")} disabled={isBusy} />
        <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder={t("quantityPlaceholder")} disabled={isBusy} />
        <Input
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder={event.paymentFree ? t("freePlaceholder") : t("priceUsdcPlaceholder")}
          disabled={isBusy || event.paymentFree}
        />
      </div>
      <Button onClick={handleAddType} disabled={isBusy} variant="outline" className="w-full">
        {isBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        {t("addTicketType")}
      </Button>
      <Button
        onClick={async () => {
          await publishEvent.mutateAsync({ id: event.id });
          onPublished();
        }}
        disabled={publishEvent.isPending}
        className="w-full"
      >
        {t("publishEvent")}
      </Button>
    </StepShell>
  );
}

function parseUsdc(value: string): bigint {
  return BigInt(Math.round(Number(value) * 1e6));
}
