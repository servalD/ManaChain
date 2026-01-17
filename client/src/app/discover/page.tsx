"use client";

import { useState } from "react";
import { BrandSwipeCard, Brand } from "@/components/ui/brand-swipe";
import { Navbar } from "@/components/ui/navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/lib/toast";
import AuthService from "@/services/auth.service";

// Mock data for brands
const mockBrands: Brand[] = [
  {
    id: "1",
    name: "EcoWear",
    logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=200&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
    description: "Sustainable fashion brand creating eco-friendly clothing from recycled materials. Join our community and support ethical fashion.",
    industry: "Fashion & Sustainability",
    tokenSymbol: "ECOW",
    tokenPrice: 2.45,
    holders: 12450,
    raised: 3250000,
  },
  {
    id: "2",
    name: "TechFlow",
    logo: "https://images.unsplash.com/photo-1563906267088-b029e7101114?w=200&h=200&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
    description: "Revolutionary tech startup building the future of AI-powered automation tools for creative professionals.",
    industry: "Technology",
    tokenSymbol: "TECH",
    tokenPrice: 5.80,
    holders: 28900,
    raised: 8500000,
  },
  {
    id: "3",
    name: "BiteBox",
    logo: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&h=200&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
    description: "Healthy meal delivery service bringing fresh, organic food to your doorstep. Supporting local farmers.",
    industry: "Food & Beverage",
    tokenSymbol: "BITE",
    tokenPrice: 1.20,
    holders: 8750,
    raised: 1200000,
  },
  {
    id: "4",
    name: "FitPulse",
    logo: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
    description: "Next-gen fitness app connecting trainers and athletes worldwide with personalized workout programs.",
    industry: "Health & Wellness",
    tokenSymbol: "FITP",
    tokenPrice: 3.15,
    holders: 19200,
    raised: 4800000,
  },
  {
    id: "5",
    name: "UrbanBeats",
    logo: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=200&h=200&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=800&q=80",
    description: "Independent music label discovering and promoting emerging artists from underground scenes.",
    industry: "Music & Entertainment",
    tokenSymbol: "URBN",
    tokenPrice: 4.50,
    holders: 15600,
    raised: 2900000,
  },
  {
    id: "6",
    name: "GreenDrive",
    logo: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=200&h=200&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80",
    description: "Electric vehicle charging network making sustainable transportation accessible for everyone.",
    industry: "Automotive & Environment",
    tokenSymbol: "GRND",
    tokenPrice: 6.25,
    holders: 22100,
    raised: 9800000,
  },
  {
    id: "7",
    name: "ArtVerse",
    logo: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=200&h=200&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80",
    description: "Digital art marketplace empowering creators to showcase and monetize their work through NFTs.",
    industry: "Art & Digital",
    tokenSymbol: "ARTV",
    tokenPrice: 7.90,
    holders: 31500,
    raised: 12400000,
  },
  {
    id: "8",
    name: "LearnHub",
    logo: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=200&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80",
    description: "Online education platform connecting students with expert mentors for personalized learning experiences.",
    industry: "Education",
    tokenSymbol: "LRNH",
    tokenPrice: 2.80,
    holders: 17800,
    raised: 5600000,
  },
];


export default function DiscoverPage() {
  const { user, logout, refreshUser } = useAuth();
  const [likedBrands, setLikedBrands] = useState<Brand[]>([]);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [shouldDisconnectWallet, setShouldDisconnectWallet] = useState(false);

  const handleSwipeRight = (brand: Brand) => {
    console.log("Liked brand:", brand.name);
    setLikedBrands((prev) => [...prev, brand]);
    toast({
      title: `You liked ${brand.name}! 💜`,
      description: `${brand.tokenSymbol} added to your interests`,
      variant: "success",
    });
  };

  const handleSwipeLeft = (brand: Brand) => {
    console.log("Passed on brand:", brand.name);
    toast({
      title: "Passed",
      description: `Maybe next time!`,
      variant: "default",
    });
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
    toast({
      title: "Logged out",
      description: "See you soon!",
      variant: "success",
    });
  };

  const handleProfile = () => {
    toast({
      title: "Profile",
      description: "Profile page coming soon!",
      variant: "default",
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-linear-to-br from-black via-gray-950 to-black">
        {/* Navbar */}
        <Navbar 
          currentPage="discover" 
          isLoggedIn={true}
          userName={user?.username}
          onLogout={handleLogout}
          onProfile={handleProfile}
          onWalletConnected={handleWalletConnected}
          onWalletDisconnected={handleWalletDisconnected}
          shouldDisconnectWallet={shouldDisconnectWallet}
        />

      {/* Main Content */}
      <div className="pt-28 sm:pt-32 md:pt-36 pb-8 sm:pb-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4">
              <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
                Discover Brands
              </span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4">
              Swipe right to support brands you love. Build your portfolio of community tokens.
            </p>
          </div>

          {/* Swipe Cards */}
          <div className="flex justify-center">
            <BrandSwipeCard
              brands={mockBrands}
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSwipeLeft}
            />
          </div>

          {/* Instructions */}
          <div className="mt-8 sm:mt-12 text-center px-2">
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-8 px-4 sm:px-8 py-3 sm:py-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                  <span className="text-red-400 text-sm">←</span>
                </div>
                <span className="text-xs sm:text-sm text-gray-400">Swipe left to pass</span>
              </div>
              <div className="hidden sm:block w-px h-8 bg-white/10" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                  <span className="text-green-400 text-sm">→</span>
                </div>
                <span className="text-xs sm:text-sm text-gray-400">Swipe right to like</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}
