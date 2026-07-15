"use client";

import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PinataService from "@/services/pinata.service";
import type { BrandResponse } from "@/api/generated/models";

interface BrandDetailsModalProps {
  brand: BrandResponse | null;
  onClose: () => void;
}

/** Lecture seule, à partir des données déjà chargées par la table — pas d'appel réseau. */
export function BrandDetailsModal({ brand, onClose }: BrandDetailsModalProps) {
  const t = useTranslations("dashboard.admin.brandDetailsModal");

  const address = brand
    ? [brand.headquartersStreet, brand.headquartersAddressComplement, brand.headquartersCity, brand.headquartersZipCode, brand.country]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <Dialog open={!!brand} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        {brand && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                {brand.logoUrl ? (
                  <img
                    src={PinataService.normalizeIpfsUrl(brand.logoUrl)}
                    alt={brand.name}
                    className="w-12 h-12 rounded-lg object-contain bg-white border border-border shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-violet-400">{brand.name.charAt(0)}</span>
                  </div>
                )}
                <DialogTitle>{brand.name}</DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-3 py-2 text-sm">
              {brand.description && (
                <p className="text-muted-foreground">{brand.description}</p>
              )}

              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
                <span className="text-muted-foreground">{t("address")}</span>
                <span>{address}</span>

                {brand.websiteUrl && (
                  <>
                    <span className="text-muted-foreground">{t("website")}</span>
                    <a href={brand.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:underline truncate">
                      {brand.websiteUrl}
                    </a>
                  </>
                )}

                {brand.businessRegistrationNumber && (
                  <>
                    <span className="text-muted-foreground">{t("registrationNumber")}</span>
                    <span>{brand.businessRegistrationNumber}</span>
                  </>
                )}

                {brand.interests.length > 0 && (
                  <>
                    <span className="text-muted-foreground">{t("interests")}</span>
                    <span>{brand.interests.map((i) => i.label).join(", ")}</span>
                  </>
                )}

                {brand.socialMedias && Object.keys(brand.socialMedias).length > 0 && (
                  <>
                    <span className="text-muted-foreground">{t("socials")}</span>
                    <span className="space-x-2">
                      {Object.entries(brand.socialMedias).map(([platform, url]) => (
                        <a key={platform} href={String(url)} target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:underline">
                          {platform}
                        </a>
                      ))}
                    </span>
                  </>
                )}

                <span className="text-muted-foreground">{t("createdAt")}</span>
                <span>
                  {new Date(brand.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
