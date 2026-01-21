"use client";

import { useState, useEffect } from "react";
import { Brand } from "@/components/ui/brand-swipe";
import { Navbar } from "@/components/ui/navbar";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/lib/toast";
import AuthService from "@/services/auth.service";
import { DiscoverHeader, DiscoverContent } from "@/components/discover";
import { InvestmentModal } from "@/components/ui/investment-modal";
import LikeService from "@/services/like.service";
import BrandService from "@/services/brand.service";
import PinataService from "@/services/pinata.service";
import { BrandFromAPI } from "@/types/brand.types";

export default function DiscoverPage() {
  const { user, logout, refreshUser } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [shouldDisconnectWallet, setShouldDisconnectWallet] = useState(false);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  // Fetch brands from API
  useEffect(() => {
    const fetchBrands = async () => {
      setIsLoadingBrands(true);
      const response = await BrandService.getAllBrands(50, 0);
      
      if (response) {
        // Transform API brands to Brand format
        const transformedBrands: Brand[] = response.brands.map((brand: BrandFromAPI) => {
          // Get interests as industry string
          const industry = brand.brand_interest && brand.brand_interest.length > 0
            ? brand.brand_interest.map((bi: { interest: { id: string; label: string } }) => bi.interest.label).join(", ")
            : "General";

          // Get token info (brand_token is an array, get first one or defaults)
          const token = brand.brand_token && brand.brand_token.length > 0 ? brand.brand_token[0] : null;
          const hasToken = !!token;
          const tokenSymbol = token?.symbol || "N/A";
          const tokenPrice = token ? parseFloat(token.current_price) : 0;
          const holders = token ? Math.floor(token.total_supply) : 0;
          const raised = token ? parseFloat(token.current_price) * token.total_supply : 0;

          // Normalize IPFS URLs to ensure they have https:// protocol
          const normalizedLogo = brand.logo_url ? PinataService.normalizeIpfsUrl(brand.logo_url) : "";
          
          return {
            id: brand.id,
            name: brand.name,
            logo: normalizedLogo,
            coverImage: normalizedLogo,
            description: brand.description || "No description available.",
            industry: industry,
            tokenSymbol: tokenSymbol,
            tokenPrice: tokenPrice,
            holders: holders,
            raised: raised,
            hasToken: hasToken,
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
    
    if (result?.success) {
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
    if (freshUser.blockchain_address) {
      if (freshUser.blockchain_address.toLowerCase() !== address.toLowerCase()) {
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
        // Refresh user data after saving to update user.blockchain_address
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
    toast({
      title: "Profile",
      description: "Profile page coming soon!",
      variant: "default",
    });
  };

  return (
    <RoleProtectedRoute allowedRoles={['CLIENT']}>
      <div className="min-h-screen bg-background">
        {/* Navbar */}
        <Navbar 
          currentPage="discover" 
          isLoggedIn={true}
          userName={user?.username}
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
              brands={brands}
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSwipeLeft}
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
    </RoleProtectedRoute>
  );
}
