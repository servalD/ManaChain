"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Brand } from "@/components/ui/brand-swipe";
import { Navbar } from "@/components/ui/navbar";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useWalletSync } from "@/hooks/useWalletSync";
import { toast } from "@/lib/toast";
import { DiscoverHeader, DiscoverContent, DiscoverContentRef } from "@/components/discover";
import { InvestmentModal } from "@/components/ui/investment-modal";
import { BrandDetailModal } from "@/components/discover/BrandDetailModal";
import { useQueryClient } from "@tanstack/react-query";
import {
  likesControllerMyLikes,
  likesControllerCreate,
  getLikesControllerMyLikesQueryKey,
} from "@/api/generated/endpoints/likes/likes";
import {
  brandsControllerList,
  brandsControllerMedia,
  brandsControllerStats,
} from "@/api/generated/endpoints/brands/brands";
import type { BrandResponse } from "@/api/generated/models";
import PinataService from "@/services/pinata.service";
import { asAxiosError } from "@/lib/api-error";

export default function DiscoverPage() {
  const router = useRouter();
  const t = useTranslations("discover.page");
  const { user, logout, refreshUser } = useAuth();
  const { shouldDisconnectWallet, handleWalletConnected, handleWalletDisconnected } = useWalletSync(refreshUser);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailModalBrand, setDetailModalBrand] = useState<Brand | null>(null);
  const [imagePosition, setImagePosition] = useState<{ x: number; y: number; width: number; height: number } | undefined>(undefined);
  const discoverContentRef = useRef<DiscoverContentRef | null>(null);
  const queryClient = useQueryClient();

  // Fetch brands from API; use first media image as cover when available (not logo)
  //
  // Orchestration nécessitant un fetch séquentiel (likes -> exclude -> brands) puis
  // un fetch parallèle par marque (media + stats) : pas exprimable proprement avec des
  // hooks TanStack Query (règles des hooks interdisent leur appel dans une boucle/callback).
  // On appelle donc directement les fonctions générées par Orval, en reproduisant à la
  // main les toasts que les anciens services affichaient.
  useEffect(() => {
    const fetchBrands = async () => {
      setIsLoadingBrands(true);

      let excludeBrandIds: string[] | undefined;
      try {
        const myLikes = await likesControllerMyLikes();
        excludeBrandIds = myLikes.map((l) => l.brand.id);
      } catch (error) {
        console.error("Error fetching user likes:", error);
        toast({
          title: t("likesFetchErrorTitle"),
          description: t("likesFetchErrorMessage"),
          variant: "error",
        });
      }

      let brandsFromApi: BrandResponse[];
      try {
        const response = await brandsControllerList({ limit: 50, offset: 0, excludeBrandIds });
        brandsFromApi = response.brands;
      } catch (error) {
        console.error("Error fetching brands:", error);
        toast({
          title: t("brandsFetchErrorTitle"),
          description: t("brandsFetchErrorMessage"),
          variant: "error",
        });
        setIsLoadingBrands(false);
        return;
      }

      const [mediaPerBrand, statsPerBrand] = await Promise.all([
        Promise.all(brandsFromApi.map((b) => brandsControllerMedia(b.id).catch(() => []))),
        Promise.all(brandsFromApi.map((b) => brandsControllerStats(b.id).catch(() => null))),
      ]);

      const transformedBrands: Brand[] = brandsFromApi.map((brand, index) => {
        const industry = brand.interests && brand.interests.length > 0
          ? brand.interests.map((i) => i.label).join(", ")
          : t("industryFallback");

        const stats = statsPerBrand[index];
        const hasToken = !!stats?.tokenSymbol;
        const tokenSymbol = stats?.tokenSymbol || "N/A";
        const tokenPrice = stats?.tokenPrice ? parseFloat(stats.tokenPrice) : 0;
        const holders = stats?.tokenHolders ?? 0;
        const raised = stats?.totalRaised ? parseFloat(stats.totalRaised) : 0;

        const normalizedLogo = brand.logoUrl ? PinataService.normalizeIpfsUrl(brand.logoUrl) : "";
        const media = mediaPerBrand[index];
        const firstImage = media?.length
          ? PinataService.normalizeIpfsUrl(media[0].imageUrl)
          : null;
        const coverImage = firstImage && firstImage !== normalizedLogo ? firstImage : normalizedLogo;

        return {
          id: brand.id,
          name: brand.name,
          logo: normalizedLogo,
          coverImage,
          description: brand.description || t("descriptionFallback"),
          industry,
          tokenSymbol,
          tokenPrice,
          holders,
          raised,
          hasToken,
        };
      });

      setBrands(transformedBrands);
      setIsLoadingBrands(false);
    };

    fetchBrands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSwipeRight = async (brand: Brand) => {
    // Create like in database with real brand ID
    try {
      await likesControllerCreate({ brandId: brand.id });
      toast({
        title: t("brandLikedTitle"),
        description: t("brandLikedMessage"),
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: getLikesControllerMyLikesQueryKey() });

      // Show investment modal
      setSelectedBrand(brand);
      setIsInvestmentModalOpen(true);
    } catch (error) {
      toast({
        title: t("likeErrorTitle"),
        description:
          asAxiosError(error)?.response?.data?.message || t("likeErrorFallback"),
        variant: "error",
      });
    }
  };

  const handleSwipeLeft = (brand: Brand) => {
    console.log("Passed on brand:", brand.name);
  };

  const handleCloseInvestmentModal = () => {
    setIsInvestmentModalOpen(false);
    setSelectedBrand(null);
  };

  const handleImageClick = (brand: Brand, position: { x: number; y: number; width: number; height: number }) => {
    setDetailModalBrand(brand);
    setImagePosition(position);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setDetailModalBrand(null);
    setImagePosition(undefined);
  };

  const handleLogout = async () => {
    await logout();
    // Toast is already shown in logout()
  };

  const handleProfile = () => {
    router.push("/profile");
  };

  return (
    <RoleProtectedRoute allowedRoles={['CLIENT']}>
      <div className="min-h-screen bg-background">
        {/* Navbar */}
        <Navbar
          currentPage="discover"
          isLoggedIn={true}
          userName={user?.username}
          userAvatarUrl={user?.avatarUrl}
          userRole={user?.role}
          onLogout={handleLogout}
          onProfile={handleProfile}
          onWalletConnected={handleWalletConnected}
          onWalletDisconnected={handleWalletDisconnected}
          shouldDisconnectWallet={shouldDisconnectWallet}
        />

      {/* Main Content */}
      <div className="pt-34 sm:pt-24 pb-8 sm:pb-12 px-2 sm:px-4">
        <div className="max-w-8xl mx-auto">
          {/* Header */}
          <DiscoverHeader />

          {/* Main Content Area */}
          {isLoadingBrands ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            </div>
          ) : brands.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">{t("noBrandsAvailable")}</p>
            </div>
          ) : (
            <DiscoverContent
              ref={discoverContentRef}
              brands={brands}
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSwipeLeft}
              onImageClick={handleImageClick}
            />
          )}
        </div>
      </div>
      </div>

      {/* Investment Modal */}
      <InvestmentModal
        isOpen={isInvestmentModalOpen}
        onClose={handleCloseInvestmentModal}
        brand={selectedBrand}
      />

      {/* Brand Detail Modal */}
      <BrandDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        brand={detailModalBrand}
        imagePosition={imagePosition}
        onSwipeRight={handleSwipeRight}
        onSwipeLeft={handleSwipeLeft}
        onTriggerSwipeRight={() => {
          discoverContentRef.current?.swipeRight();
        }}
        onTriggerSwipeLeft={() => {
          discoverContentRef.current?.swipeLeft();
        }}
      />
    </RoleProtectedRoute>
  );
}
