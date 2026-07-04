"use client";

import * as React from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { Heart, X } from "lucide-react";
import PinataService from "@/services/pinata.service";

export interface Brand {
  id: string;
  name: string;
  logo: string;
  coverImage: string;
  description: string;
  industry: string;
  tokenSymbol: string;
  tokenPrice: number;
  holders: number;
  raised: number;
  hasToken: boolean; // Indicates if the brand has a token
}

export interface BrandSwipeCardProps {
  brands: Brand[];
  onSwipeRight?: (brand: Brand) => void;
  onSwipeLeft?: (brand: Brand) => void;
  onButtonClickRef?: React.MutableRefObject<{ swipeLeft: () => void; swipeRight: () => void } | null>;
  onImageClick?: (brand: Brand, imagePosition: { x: number; y: number; width: number; height: number }) => void;
}

export function BrandSwipeCard({ brands, onSwipeRight, onSwipeLeft, onButtonClickRef, onImageClick }: BrandSwipeCardProps) {
  const [cards, setCards] = React.useState<Brand[]>([...brands]);
  const [dragDirections, setDragDirections] = React.useState<Record<number, string | null>>({});
  const swipeThreshold = 100;
  
  // Get the current swipe direction for the top card
  const topCardIndex = cards.length - 1;
  const currentSwipeDirection = topCardIndex >= 0 ? dragDirections[topCardIndex] : null;

  React.useEffect(() => {
    if (brands.length > 0 && cards.length === 0) {
      const timer = setTimeout(() => {
        setCards([...brands]);
        setDragDirections({});
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [cards.length, brands]);

  React.useEffect(() => {
    setCards([...brands]);
  }, [brands]);

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, index: number) => {
    setDragDirections((prev) => ({
      ...prev,
      [index]: info.offset.x > 0 ? "right" : "left",
    }));
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, index: number) => {
    const direction = info.offset.x > 0 ? "right" : "left";
    
    if (Math.abs(info.offset.x) > swipeThreshold) {
      // Swipe immediately without delay
      handleSwipe(index, direction);
    } else {
      // Reset if not enough movement
      setDragDirections((prev) => ({ ...prev, [index]: null }));
    }
  };

  const handleSwipe = (index: number, direction: string) => {
    const brand = cards[index];
    
    // Trigger callbacks immediately
    if (direction === "right" && onSwipeRight) {
      onSwipeRight(brand);
    } else if (direction === "left" && onSwipeLeft) {
      onSwipeLeft(brand);
    }

    // Remove card immediately, animation will handle the visual
    setCards((prevCards) => prevCards.filter((_, i) => i !== index));
    setDragDirections((prev) => {
      const newDirs = { ...prev };
      delete newDirs[index];
      return newDirs;
    });
  };

  const handleButtonClick = (direction: "right" | "left") => {
    if (cards.length > 0) {
      handleSwipe(cards.length - 1, direction);
    }
  };

  // Expose button click handlers via ref
  React.useEffect(() => {
    if (onButtonClickRef) {
      onButtonClickRef.current = {
        swipeLeft: () => handleButtonClick("left"),
        swipeRight: () => handleButtonClick("right"),
      };
    }
  }, [cards.length, onButtonClickRef]);

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4 sm:px-6">
        <div className="text-5xl sm:text-6xl mb-4">🎉</div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">No more brands!</h2>
        <p className="text-sm sm:text-base text-muted-foreground">You&apos;ve seen all available brands. Check back later for more.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center z-10">
      {/* Card Stack */}
      <div className="relative w-full max-w-md lg:max-w-xl xl:max-w-2xl h-[500px] sm:h-[550px] md:h-[600px] lg:h-[550px] xl:h-[600px]">
        <AnimatePresence>
          {cards.map((brand, index) => {
            const isTopCard = index === cards.length - 1;
            const direction = dragDirections[index];

            return (
              <motion.div
                key={brand.id}
                drag={isTopCard ? "x" : false}
                dragConstraints={{ left: -500, right: 500 }}
                dragElastic={0.2}
                onDrag={(e, i) => handleDrag(e, i, index)}
                onDragEnd={(e, i) => handleDragEnd(e, i, index)}
                custom={{ direction }}
                initial={{ scale: 0.95, y: 20, opacity: 0 }}
                animate={{
                  scale: isTopCard ? 1 : 0.95,
                  y: isTopCard ? 0 : -20,
                  opacity: 1,
                  x: 0,
                  rotate: 0,
                  transition: { duration: 0.2, ease: "easeOut" },
                }}
                exit={{
                  x: direction === "right" ? 500 : -500,
                  rotate: direction === "right" ? 30 : -30,
                  opacity: 0,
                  scale: 0.8,
                  transition: { duration: 0.25, ease: "easeIn" },
                }}
                className="absolute inset-0 rounded-2xl sm:rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing z-10"
                style={{
                  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)",
                }}
              >
                {/* Cover Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center bg-accent/30"
                  style={brand.coverImage ? { backgroundImage: `url(${PinataService.normalizeIpfsUrl(brand.coverImage)})` } : {}}
                >
                  {/* Placeholder if no image */}
                  {!brand.coverImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-violet-500/20 to-fuchsia-500/20">
                      <div className="text-center p-8">
                        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-violet-500/30 flex items-center justify-center">
                          <span className="text-4xl">🏢</span>
                        </div>
                        <p className="text-sm text-muted-foreground">No image available</p>
                      </div>
                    </div>
                  )}
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent" />

                  {/* Swipe Indicators */}
                  {isTopCard && direction && (
                    <>
                      {/* Green overlay for like */}
                      <div
                        className={`absolute inset-0 transition-opacity duration-200 ${
                          direction === "right" ? "opacity-100" : "opacity-0"
                        }`}
                        style={{
                          background: "linear-gradient(to top, rgba(45, 150, 45, 0.75) 0%, transparent 60%)",
                        }}
                      />
                      {/* Red overlay for dislike */}
                      <div
                        className={`absolute inset-0 transition-opacity duration-200 ${
                          direction === "left" ? "opacity-100" : "opacity-0"
                        }`}
                        style={{
                          background: "linear-gradient(to top, rgba(224, 83, 83, 0.75) 0%, transparent 60%)",
                        }}
                      />
                      {/* Icon */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        {direction === "right" ? (
                          <Heart className="w-16 h-16 sm:w-20 sm:h-20 text-green-400 fill-green-400" />
                        ) : (
                          <X className="w-16 h-16 sm:w-20 sm:h-20 text-red-400" strokeWidth={3} />
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Brand Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8 z-10">
                  {/* Logo and Name */}
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    {brand.logo ? (
                      <img
                        src={PinataService.normalizeIpfsUrl(brand.logo)}
                        alt={brand.name}
                        className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full object-cover border-2 border-white/20"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const placeholder = target.nextElementSibling as HTMLElement;
                          if (placeholder) placeholder.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-violet-500/30 border-2 border-white/20 flex items-center justify-center ${brand.logo ? 'hidden' : ''}`}
                    >
                      <span className="text-2xl sm:text-3xl">🏢</span>
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">{brand.name}</h2>
                      <p className="text-sm sm:text-base lg:text-lg text-gray-300">{brand.industry}</p>
                    </div>
                  </div>

                  {/* Description with See Details Button */}
                  <div className="flex items-start justify-between gap-3 mb-4 sm:mb-5 lg:mb-6">
                    <p className="text-sm sm:text-base lg:text-lg text-gray-200 flex-1">
                      {brand.description && brand.description.length > 45
                        ? `${brand.description.substring(0, 45)}...`
                        : brand.description}
                    </p>
                    {isTopCard && onImageClick && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const cardElement = e.currentTarget.closest('[class*="absolute"]');
                          if (cardElement) {
                            const rect = (cardElement as HTMLElement).getBoundingClientRect();
                            onImageClick(brand, {
                              x: rect.left,
                              y: rect.top,
                              width: rect.width,
                              height: rect.height,
                            });
                          }
                        }}
                        className="bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/40 rounded-lg px-3 py-1.5 text-white font-medium text-xs sm:text-sm transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shrink-0"
                      >
                        See Details
                      </button>
                    )}
                  </div>

                  {/* Token Info */}
                  {brand.hasToken ? (
                    <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-6 bg-black/40 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-white/20">
                      <div>
                        <p className="text-xs sm:text-sm lg:text-base text-gray-400 mb-1">Token</p>
                        <p className="text-base sm:text-xl lg:text-2xl font-bold" style={{ color: "#D4AF37" }}>
                          {brand.tokenSymbol}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm lg:text-base text-gray-400 mb-1">Price</p>
                        <p className="text-base sm:text-xl lg:text-2xl font-semibold text-white">${brand.tokenPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm lg:text-base text-gray-400 mb-1">Holders</p>
                        <p className="text-base sm:text-xl lg:text-2xl font-semibold text-white">{brand.holders.toLocaleString("en-US")}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-black/40 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-white/20 text-center">
                      <p className="text-sm sm:text-base lg:text-lg text-gray-300">
                        No token available yet
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        This brand hasn&apos;t issued units yet
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 lg:gap-4 mt-4 sm:mt-6 lg:mt-4">
        <button
          onClick={() => handleButtonClick("left")}
          className={`group w-16 h-16 sm:w-18 sm:h-18 lg:w-18 lg:h-18 rounded-full backdrop-blur-sm border-2 flex items-center justify-center transition-all duration-300 shadow-lg active:scale-95 ${
            currentSwipeDirection === "left"
              ? "bg-red-500/40 border-red-500/70 shadow-red-500/50"
              : "bg-accent/50 border-border hover:bg-red-500/20 hover:border-red-500/50"
          }`}
          aria-label="Dislike"
        >
          <X className={`w-8 h-8 sm:w-9 sm:h-9 lg:w-9 lg:h-9 group-hover:scale-110 transition-transform ${
            currentSwipeDirection === "left" ? "text-red-300" : "text-red-400"
          }`} strokeWidth={2.5} />
        </button>
        <button
          onClick={() => handleButtonClick("right")}
          className={`group w-16 h-16 sm:w-18 sm:h-18 lg:w-18 lg:h-18 rounded-full backdrop-blur-sm border-2 flex items-center justify-center transition-all duration-300 shadow-lg active:scale-95 ${
            currentSwipeDirection === "right"
              ? "bg-green-500/40 border-green-500/70 shadow-green-500/50"
              : "bg-accent/50 border-border hover:bg-green-500/20 hover:border-green-500/50"
          }`}
          aria-label="Like"
        >
          <Heart className={`w-8 h-8 sm:w-9 sm:h-9 lg:w-9 lg:h-9 group-hover:scale-110 transition-transform ${
            currentSwipeDirection === "right" ? "text-green-300 fill-green-300/60" : "text-green-400 fill-green-400/20 group-hover:fill-green-400/40"
          }`} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
