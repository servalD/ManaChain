"use client";

import { useTranslations } from "next-intl";
import { formatUnits, type Address } from "viem";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { useSaleManagement } from "@/hooks/web3/useSaleManagement";
import type { TokenSaleResponse } from "@/api/generated/models";

interface SaleManagementPanelProps {
  sale: TokenSaleResponse;
  /** Invalidation de la query API — l'indexer met à jour `status`/`soldAmount`, pas d'écriture optimiste. */
  onChanged: () => Promise<void>;
}

/**
 * Actions brand sur une vente ouverte/clôturée : voir `temp-plan/phase-3-front-flows.md`,
 * point 6 ("écran vente ouverte") — manquant jusqu'ici, `MyBrandChart` retombait sur son
 * panneau générique après `openSale`.
 */
export function SaleManagementPanel({ sale, onChanged }: SaleManagementPanelProps) {
  const t = useTranslations("dashboard.brand.saleManagement");
  const escrowAddress = sale.escrowAddress as Address;

  const {
    endSale,
    endSaleStatus,
    endSaleError,
    cancel,
    cancelStatus,
    cancelError,
    claim,
    claimStatus,
    claimError,
  } = useSaleManagement(escrowAddress, async () => {
    toast({ title: t("toasts.confirmedTitle"), description: t("toasts.confirmedMessage"), variant: "success" });
    await onChanged();
  });

  const isEndBusy = endSaleStatus === "signing" || endSaleStatus === "pending";
  const isCancelBusy = cancelStatus === "signing" || cancelStatus === "pending";
  const isClaimBusy = claimStatus === "signing" || claimStatus === "pending";
  const isAnyBusy = isEndBusy || isCancelBusy || isClaimBusy;

  const sold = formatUnits(BigInt(sale.soldAmount), 18);
  const total = formatUnits(BigInt(sale.totalForSale), 18);

  return (
    <div className="border border-border rounded-lg p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{t("title")}</h3>
        <p className="text-sm text-muted-foreground">{t("soldOf", { sold, total })}</p>
      </div>

      {sale.status === "open" && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => endSale()} disabled={isAnyBusy}>
            {isEndBusy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("endSaleButton")}
          </Button>
          <Button variant="destructive" onClick={() => cancel()} disabled={isAnyBusy}>
            {isCancelBusy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("cancelButton")}
          </Button>
        </div>
      )}

      {sale.status === "closed" && (
        <Button onClick={() => claim()} disabled={isAnyBusy}>
          {isClaimBusy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {t("claimButton")}
        </Button>
      )}

      {(sale.status === "cancelled_by_brand" || sale.status === "cancelled_by_admin") && (
        <p className="text-sm text-muted-foreground">{t("cancelledHint")}</p>
      )}

      {endSaleError && <p className="text-sm text-destructive">{endSaleError.message}</p>}
      {cancelError && <p className="text-sm text-destructive">{cancelError.message}</p>}
      {claimError && <p className="text-sm text-destructive">{claimError.message}</p>}
    </div>
  );
}
