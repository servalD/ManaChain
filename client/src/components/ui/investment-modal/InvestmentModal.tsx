"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/ui/brand-swipe";
import { toast } from "@/lib/toast";
import PinataService from "@/services/pinata.service";

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand: Brand | null;
}

export function InvestmentModal({ isOpen, onClose, brand }: InvestmentModalProps) {
  if (!brand) return null;

  const handleInvest = () => {
    toast({
      title: "Coming Soon",
      description: "Community support via tokens will be available soon. No financial returns are promised.",
      variant: "default",
    });
    onClose();
  };

  const handleLater = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Support {brand.name}</DialogTitle>
          <DialogDescription>
            You&apos;ve liked this brand! Would you like to show your support and become part of their community with a badge?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Brand Info */}
          <div className="flex items-start gap-4">
            {brand.logo && (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                <img
                  src={PinataService.normalizeIpfsUrl(brand.logo)}
                  alt={brand.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{brand.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{brand.industry}</p>
              <p className="text-sm text-foreground/80 line-clamp-3">{brand.description}</p>
            </div>
          </div>

          {/* Token Info */}
          {brand.hasToken ? (
            <div className="bg-accent/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Token Symbol</span>
                <span className="font-semibold">{brand.tokenSymbol}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Reference Amount per Unit</span>
                <span className="font-semibold">${brand.tokenPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Holders</span>
                <span className="font-semibold">{brand.holders.toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <div className="bg-accent/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                This brand hasn&apos;t issued a badge yet
              </p>
              <p className="text-xs text-muted-foreground">
                Units will be available soon. Stay tuned!
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {brand.hasToken ? (
              <Button
                onClick={handleInvest}
                className="w-full bg-linear-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                size="lg"
              >
                Support this Brand
              </Button>
            ) : (
              <Button
                onClick={handleLater}
                className="w-full bg-linear-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                size="lg"
                disabled
              >
                No Badge Available Yet
              </Button>
            )}
            <div className="flex gap-3">
              <Button
                onClick={handleLater}
                variant="outline"
                className="flex-1"
              >
                Support
              </Button>
              <Button
                onClick={handleLater}
                variant="ghost"
                className="flex-1"
              >
                Later
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
