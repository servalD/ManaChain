"use client";

import { useRef, useImperativeHandle, forwardRef } from "react";
import { BrandSwipeCard, Brand } from "@/components/ui/brand-swipe";

interface DiscoverContentProps {
  brands: Brand[];
  onSwipeRight: (brand: Brand) => void;
  onSwipeLeft: (brand: Brand) => void;
  onImageClick?: (brand: Brand, imagePosition: { x: number; y: number; width: number; height: number }) => void;
}

export interface DiscoverContentRef {
  swipeLeft: () => void;
  swipeRight: () => void;
}

export const DiscoverContent = forwardRef<DiscoverContentRef, DiscoverContentProps>(
  ({ brands, onSwipeRight, onSwipeLeft, onImageClick }, ref) => {
    const swipeCardRef = useRef<{ swipeLeft: () => void; swipeRight: () => void } | null>(null);

    useImperativeHandle(ref, () => ({
      swipeLeft: () => {
        swipeCardRef.current?.swipeLeft();
      },
      swipeRight: () => {
        swipeCardRef.current?.swipeRight();
      },
    }));

    return (
      <div className="flex flex-col items-center justify-center">
        {/* Swipe Cards with buttons */}
        <div className="w-full max-w-md lg:max-w-xl xl:max-w-2xl">
          <BrandSwipeCard
            brands={brands}
            onSwipeRight={onSwipeRight}
            onSwipeLeft={onSwipeLeft}
            onButtonClickRef={swipeCardRef}
            onImageClick={onImageClick}
          />
        </div>
      </div>
    );
  }
);

DiscoverContent.displayName = "DiscoverContent";
