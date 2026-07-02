"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/ui/brand-swipe";
import { Navbar } from "@/components/ui/navbar";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/lib/toast";
import AuthService from "@/services/auth.service";
import { DiscoverHeader, DiscoverContent, DiscoverContentRef } from "@/components/discover";
import { InvestmentModal } from "@/components/ui/investment-modal";
import { BrandDetailModal } from "@/components/discover/BrandDetailModal";
import LikeService from "@/services/like.service";
import BrandService from "@/services/brand.service";
import PinataService from "@/services/pinata.service";
import { BrandFromAPI } from "@/types/brand.types";

export default function DiscoverPage() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [shouldDisconnectWallet, setShouldDisconnectWallet] = useState(false);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailModalBrand, setDetailModalBrand] = useState<Brand | null>(null);
  const [imagePosition, setImagePosition] = useState<{ x: number; y: number; width: number; height: number } | undefined>(undefined);
  const discoverContentRef = useRef<DiscoverContentRef | null>(null);

  // Fetch brands from API; use first media image as cover when available (not logo)
  useEffect(() => {
    const fetchBrands = async () => {
      setIsLoadingBrands(true);
      const myLikes = await LikeService.getUserLikes();
      const excludeBrandIds = myLikes?.map((l) => l.brand.id);
      const response = await BrandService.getAllBrands(50, 0, excludeBrandIds);

      if (response) {
        const brandsFromApi = response.brands;
        const [mediaPerBrand, statsPerBrand] = await Promise.all([
          Promise.all(brandsFromApi.map((b: BrandFromAPI) => BrandService.getBrandMedia(b.id))),
          Promise.all(brandsFromApi.map((b: BrandFromAPI) => BrandService.getBrandStats(b.id))),
        ]);

        const transformedBrands: Brand[] = brandsFromApi.map((brand: BrandFromAPI, index: number) => {
          const industry = brand.interests && brand.interests.length > 0
            ? brand.interests.map((i) => i.label).join(", ")
            : "General";

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
            description: brand.description || "No description available.",
            industry,
            tokenSymbol,
            tokenPrice,
            holders,
            raised,
            hasToken,
          };
        });

        setBrands(transformedBrands);
      }

      setIsLoadingBrands(false);
    };

    fetchBrands();
  }, []);

  const handleSwipeRight = async (brand: Brand) => {
    // Create like in database with real brand ID
    const result = await LikeService.createLike(brand.id);

    if (result) {
      // Show investment modal
      setSelectedBrand(brand);
      setIsInvestmentModalOpen(true);
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

  const handleWalletConnected = async (address: string) => {
    // Reset disconnect flag
    setShouldDisconnectWallet(false);
    
    // Refresh user data to get latest blockchain_address
    await refreshUser();
    
    // Get fresh user data from AuthService
    const freshUser = await AuthService.getUser();
    
    if (!freshUser) {
      toast({
        title: "Error",
        description: "Unable to verify user data. Please try again.",
        variant: "error",
      });
      setShouldDisconnectWallet(true);
      return;
    }
    
    // Check if user already has a blockchain address
    if (freshUser.blockchainAddress) {
      if (freshUser.blockchainAddress.toLowerCase() !== address.toLowerCase()) {
        // Different wallet - show error and trigger disconnect
        toast({
          title: "Wallet Already Connected",
          description: "You already have a different wallet connected to your account. Please use your registered wallet or contact support.",
          variant: "error",
        });
        
        // Trigger disconnect
        setShouldDisconnectWallet(true);
        return;
      }
      
      // Same wallet - just update local state
      setWalletAddress(address);
      toast({
        title: "Wallet Connected",
        description: "Your registered wallet has been connected successfully.",
        variant: "success",
      });
    } else {
      // No blockchain address - save it
      const success = await AuthService.updateBlockchainAddress(address);
      
      if (success) {
        // Refresh user data after saving to update user.blockchainAddress
        await refreshUser();
        setWalletAddress(address);
        toast({
          title: "Wallet Connected & Saved",
          description: "Your wallet has been connected and saved to your account.",
          variant: "success",
        });
      } else {
        // If update failed, trigger disconnect
        setShouldDisconnectWallet(true);
        setWalletAddress(null);
      }
    }
  };

  const handleWalletDisconnected = () => {
    setWalletAddress(null);
    setShouldDisconnectWallet(false);
    console.log("Wallet disconnected");
  };

  const handleLogout = async () => {
    await logout();
    // Toast is already shown in AuthService.logout
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
              <p className="text-muted-foreground text-lg">No brands available at the moment.</p>
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
