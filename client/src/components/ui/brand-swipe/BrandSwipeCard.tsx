"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X } from "lucide-react";

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
}

export interface BrandSwipeCardProps {
  brands: Brand[];
  onSwipeRight?: (brand: Brand) => void;
  onSwipeLeft?: (brand: Brand) => void;
}

export function BrandSwipeCard({ brands, onSwipeRight, onSwipeLeft }: BrandSwipeCardProps) {
  const [cards, setCards] = React.useState<Brand[]>([...brands]);
  const [dragDirections, setDragDirections] = React.useState<Record<number, string | null>>({});
  const swipeThreshold = 100;

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

  const handleDrag = (event: any, info: any, index: number) => {
    setDragDirections((prev) => ({
      ...prev,
      [index]: info.offset.x > 0 ? "right" : "left",
    }));
  };

  const handleDragEnd = (event: any, info: any, index: number) => {
    if (Math.abs(info.offset.x) > swipeThreshold) {
      handleSwipe(index, dragDirections[index] || "left");
    } else {
      setDragDirections((prev) => ({ ...prev, [index]: null }));
    }
  };

  const handleSwipe = (index: number, direction: string) => {
    const brand = cards[index];
    setDragDirections((prev) => ({ ...prev, [index]: direction }));

    // Trigger callbacks
    if (direction === "right" && onSwipeRight) {
      onSwipeRight(brand);
    } else if (direction === "left" && onSwipeLeft) {
      onSwipeLeft(brand);
    }

    setTimeout(() => {
      setCards((prevCards) => prevCards.filter((_, i) => i !== index));
    }, 300);
  };

  const handleButtonClick = (direction: "right" | "left") => {
    if (cards.length > 0) {
      handleSwipe(cards.length - 1, direction);
    }
  };

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4 sm:px-6">
        <div className="text-5xl sm:text-6xl mb-4">🎉</div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">No more brands!</h2>
        <p className="text-sm sm:text-base text-muted-foreground">You've seen all available brands. Check back later for more.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center z-10">
      {/* Card Stack */}
      <div className="relative w-full max-w-md h-[500px] sm:h-[550px] md:h-[600px] mb-6 sm:mb-8">
        <AnimatePresence>
          {cards.map((brand, index) => {
            const isTopCard = index === cards.length - 1;
            const direction = dragDirections[index];

            return (
              <motion.div
                key={brand.id}
                drag={isTopCard ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.5}
                onDrag={(e, i) => handleDrag(e, i, index)}
                onDragEnd={(e, i) => handleDragEnd(e, i, index)}
                custom={{ direction }}
                initial={{ scale: 0.95, y: 20, opacity: 0 }}
                animate={{
                  scale: isTopCard ? 1 : 0.95,
                  y: isTopCard ? 0 : -20,
                  opacity: 1,
                  transition: { duration: 0.3, ease: "easeOut" },
                }}
                exit={{
                  x: direction === "right" ? 400 : -400,
                  rotate: direction === "right" ? 20 : -20,
                  opacity: 0,
                  transition: { duration: 0.3, ease: "easeIn" },
                }}
                className="absolute inset-0 rounded-2xl sm:rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing z-10"
                style={{
                  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)",
                }}
              >
                {/* Cover Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${brand.coverImage})` }}
                >
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
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-foreground z-10">
                  {/* Logo and Name */}
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-border"
                    />
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold">{brand.name}</h2>
                      <p className="text-xs sm:text-sm text-muted-foreground">{brand.industry}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-foreground/90 mb-3 sm:mb-4 line-clamp-2">{brand.description}</p>

                  {/* Token Info */}
                  <div className="flex items-center justify-between gap-2 sm:gap-4 bg-background/40 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-border">
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Token</p>
                      <p className="text-sm sm:text-lg font-bold" style={{ color: "#D4AF37" }}>
                        {brand.tokenSymbol}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Price</p>
                      <p className="text-sm sm:text-lg font-semibold">${brand.tokenPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Holders</p>
                      <p className="text-sm sm:text-lg font-semibold">{brand.holders.toLocaleString("en-US")}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 sm:gap-6">
        <button
          onClick={() => handleButtonClick("left")}
          className="group w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-accent/50 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-300"
        >
          <X className="w-7 h-7 sm:w-8 sm:h-8 text-red-400 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
        </button>
        <button
          onClick={() => handleButtonClick("right")}
          className="group w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-accent/50 backdrop-blur-sm border-2 border-border flex items-center justify-center hover:bg-green-500/20 hover:border-green-500/50 transition-all duration-300"
        >
          <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-green-400 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
