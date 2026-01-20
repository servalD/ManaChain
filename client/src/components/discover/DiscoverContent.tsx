"use client";

import { useRef } from "react";
import { BrandSwipeCard, Brand } from "@/components/ui/brand-swipe";

interface DiscoverContentProps {
  brands: Brand[];
  onSwipeRight: (brand: Brand) => void;
  onSwipeLeft: (brand: Brand) => void;
}

export function DiscoverContent({ brands, onSwipeRight, onSwipeLeft }: DiscoverContentProps) {
  const swipeCardRef = useRef<{ swipeLeft: () => void; swipeRight: () => void } | null>(null);

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Swipe Cards with buttons */}
      <div className="w-full max-w-md lg:max-w-xl xl:max-w-2xl">
        <BrandSwipeCard
          brands={brands}
          onSwipeRight={onSwipeRight}
          onSwipeLeft={onSwipeLeft}
          onButtonClickRef={swipeCardRef}
        />
      </div>
    </div>
  );
}
