"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart } from "lucide-react";
import { Brand } from "@/components/ui/brand-swipe";
import BrandService from "@/services/brand.service";
import PinataService from "@/services/pinata.service";
import { BrandMedia } from "@/types/brand-media.types";
import { BrandFromAPI } from "@/types/brand.types";

interface BrandDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand: Brand | null;
  imagePosition?: { x: number; y: number; width: number; height: number };
  onSwipeRight?: (brand: Brand) => void;
  onSwipeLeft?: (brand: Brand) => void;
  onTriggerSwipeRight?: () => void;
  onTriggerSwipeLeft?: () => void;
}

export function BrandDetailModal({
  isOpen,
  onClose,
  brand,
  imagePosition,
  onSwipeRight,
  onSwipeLeft,
  onTriggerSwipeRight,
  onTriggerSwipeLeft,
}: BrandDetailModalProps) {
  const [brandDetails, setBrandDetails] = useState<BrandFromAPI | null>(null);
  const [brandMedia, setBrandMedia] = useState<BrandMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFullscreenImageOpen, setIsFullscreenImageOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Fetch brand details and media when modal opens
  useEffect(() => {
    if (isOpen && brand) {
      setIsLoading(true);
      const fetchData = async () => {
        // Fetch brand details
        const details = await BrandService.getBrandById(brand.id);
        setBrandDetails(details);

        // Fetch brand media
        const media = await BrandService.getBrandMedia(brand.id);
        setBrandMedia(media);
        setIsLoading(false);
      };
      fetchData();
    }
  }, [isOpen, brand]);

  // Reset selected image when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedImageIndex(0);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!brand) return null;

  // Get all images (cover + media, logo only at the end).
  const normalizedCover = brand.coverImage ? PinataService.normalizeIpfsUrl(brand.coverImage) : "";
  const mediaUrls = brandMedia.map((m) => PinataService.normalizeIpfsUrl(m.imageUrl));
  const mediaWithoutDuplicateCover = normalizedCover
    ? mediaUrls.filter((url) => url !== normalizedCover)
    : mediaUrls;
  const allImages = [
    ...(brand.coverImage && brand.coverImage !== brand.logo ? [brand.coverImage] : []),
    ...mediaWithoutDuplicateCover,
    ...(brand.logo ? [brand.logo] : []),
  ].filter(Boolean);

  const currentImage = allImages[selectedImageIndex] ?? allImages[0] ?? brand.coverImage;

  // Calculate initial transform origin and scale for animation
  const getInitialTransform = () => {
    if (!imagePosition) {
      return { scale: 0.8, opacity: 0 };
    }

    const centerX = imagePosition.x + imagePosition.width / 2;
    const centerY = imagePosition.y + imagePosition.height / 2;
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;

    // Calculate the offset needed to center the image
    const offsetX = viewportCenterX - centerX;
    const offsetY = viewportCenterY - centerY;

    // Calculate scale based on image size vs viewport
    const scaleX = window.innerWidth / imagePosition.width;
    const scaleY = window.innerHeight / imagePosition.height;
    const minScale = Math.min(scaleX, scaleY, 1) * 0.9; // Use 90% to leave some margin

    return {
      x: offsetX,
      y: offsetY,
      scale: minScale,
      opacity: 0,
    };
  };

  const getFinalTransform = () => ({
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
  });

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="brand-detail-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={onClose}
            />

            {/* Modal Content */}
            <motion.div
              key="brand-detail-content"
              ref={modalRef}
              initial={getInitialTransform()}
              animate={getFinalTransform()}
              exit={getInitialTransform()}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-32 sm:pt-36 pb-8 overflow-y-auto pointer-events-none"
            >
              <div
                ref={modalRef}
                className="relative w-full max-w-6xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden pointer-events-auto shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Like/Dislike Buttons */}
              {brand && (
                <div className="absolute bottom-4 right-4 z-50 flex gap-2 opacity-75 hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (brand) {
                        // Trigger the swipe first to remove the card
                        if (onTriggerSwipeLeft) {
                          onTriggerSwipeLeft();
                        }
                        // Then call the handler
                        if (onSwipeLeft) {
                          onSwipeLeft(brand);
                        }
                        // Close the modal
                        onClose();
                      }
                    }}
                    className="w-10 h-10 rounded-full bg-red-500/80 hover:bg-red-500 backdrop-blur-sm border border-red-400/50 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg"
                    aria-label="Dislike"
                  >
                    <X className="w-5 h-5" strokeWidth={3} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (brand) {
                        // Trigger the swipe first to remove the card
                        if (onTriggerSwipeRight) {
                          onTriggerSwipeRight();
                        }
                        // Then call the handler
                        if (onSwipeRight) {
                          onSwipeRight(brand);
                        }
                        // Close the modal
                        onClose();
                      }
                    }}
                    className="w-10 h-10 rounded-full bg-green-500/80 hover:bg-green-500 backdrop-blur-sm border border-green-400/50 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg"
                    aria-label="Like"
                  >
                    <Heart className="w-5 h-5" fill="currentColor" />
                  </button>
                </div>
              )}

              {isLoading ? (
                <div className="flex items-center justify-center min-h-[500px]">
                  <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                </div>
              ) : (
                <div className="flex flex-col max-h-[85vh] overflow-hidden min-h-0">
                  {/* ——— Mobile: single column (name, then photos, then content) ——— */}
                  <div className="flex flex-col md:hidden min-h-0 flex-1">
                    {/* 1. Brand name + logo (top) */}
                    <div className="shrink-0 p-6 pb-4 border-b border-border">
                      <div className="flex items-center gap-4">
                        {brand.logo ? (
                          <img
                            src={PinataService.normalizeIpfsUrl(brand.logo)}
                            alt={brand.name}
                            className="w-14 h-14 rounded-full object-cover border-2 border-border"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const placeholder =
                                target.nextElementSibling as HTMLElement;
                              if (placeholder)
                                placeholder.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-14 h-14 rounded-full bg-violet-500/30 border-2 border-border flex items-center justify-center ${
                            brand.logo ? "hidden" : ""
                          }`}
                        >
                          <span className="text-2xl">🏢</span>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-foreground">
                            {brand.name}
                          </h2>
                          <p className="text-muted-foreground text-sm">
                            {brand.industry}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 2. Photos (below name) */}
                    <div className="relative bg-black/20 min-h-[200px] max-h-[350px] shrink-0 overflow-hidden">
                    {currentImage ? (
                      <motion.img
                        key={selectedImageIndex}
                        src={PinataService.normalizeIpfsUrl(currentImage)}
                        alt={brand.name}
                        className="w-full h-full object-cover cursor-pointer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => setIsFullscreenImageOpen(true)}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-violet-500/20 to-fuchsia-500/20">
                        <div className="text-center p-8">
                          <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-violet-500/30 flex items-center justify-center">
                            <span className="text-3xl">🏢</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            No image available
                          </p>
                        </div>
                      </div>
                    )}

                    {allImages.length > 1 && (
                      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2">
                        {allImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              index === selectedImageIndex
                                ? "bg-white w-6"
                                : "bg-white/40 hover:bg-white/60"
                            }`}
                            aria-label={`View image ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}

                    {allImages.length > 1 && (
                      <>
                        <button
                          onClick={() =>
                            setSelectedImageIndex(
                              (prev) =>
                                (prev - 1 + allImages.length) %
                                allImages.length
                            )
                          }
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                          aria-label="Previous image"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() =>
                            setSelectedImageIndex(
                              (prev) => (prev + 1) % allImages.length
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                          aria-label="Next image"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </>
                    )}
                    </div>

                    {/* Thumbnails - hidden on mobile */}
                    {allImages.length > 1 && (
                      <div className="hidden sm:block shrink-0 px-4 py-2 border-b border-border bg-muted/30">
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {allImages.map((url, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedImageIndex(index)}
                              className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                                selectedImageIndex === index
                                  ? "border-violet-500 ring-2 ring-violet-500/50"
                                  : "border-border hover:border-violet-500/50 opacity-70 hover:opacity-100"
                              }`}
                            >
                              <img
                                src={PinataService.normalizeIpfsUrl(url)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. About + Badge + Website (mobile scrollable) */}
                    <div
                      className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6 space-y-6 overscroll-contain touch-pan-y"
                      style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
                    >
                    {/* About */}
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        About
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {brandDetails?.description || brand.description}
                      </p>
                    </div>

                    {/* Badge Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">
                        Badge Information
                      </h3>
                      {brand.hasToken ? (
                        <div className="p-4 bg-accent/50 rounded-lg border border-border">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Symbol
                              </p>
                              <p className="text-xl font-bold" style={{ color: "#D4AF37" }}>
                                {brand.tokenSymbol}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Current Price
                              </p>
                              <p className="text-xl font-semibold text-foreground">
                                ${brand.tokenPrice.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Holders
                              </p>
                              <p className="text-xl font-semibold text-foreground">
                                {brand.holders.toLocaleString("en-US")}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Total Raised
                              </p>
                              <p className="text-xl font-semibold text-foreground">
                                ${brand.raised.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-accent/30 rounded-lg border border-border border-dashed">
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <svg
                              className="w-5 h-5 shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <div>
                              <p className="font-medium">No badge available</p>
                              <p className="text-sm">
                                This brand hasn't issued badges yet
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Website */}
                    {brandDetails?.websiteUrl && (
                      <div>
                        <a
                          href={brandDetails.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-violet-500 hover:text-violet-600 transition-colors"
                        >
                          <span>Visit Website</span>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      </div>
                    )}
                    </div>
                  </div>

                  {/* ——— Desktop: two columns (photos left, description right) ——— */}
                  <div className="hidden md:flex flex-1 min-h-0 border-t md:border-t-0 md:border-l border-border">
                    {/* Left: photos only */}
                    <div className="md:w-[45%] lg:w-2/5 shrink-0 flex flex-col bg-black/10">
                      <div className="relative flex-1 min-h-[280px] overflow-hidden">
                        {currentImage ? (
                          <motion.img
                            key={selectedImageIndex}
                            src={PinataService.normalizeIpfsUrl(currentImage)}
                            alt={brand.name}
                            className="w-full h-full object-cover cursor-pointer"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            onClick={() => setIsFullscreenImageOpen(true)}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-violet-500/20 to-fuchsia-500/20">
                            <div className="text-center p-8">
                              <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-violet-500/30 flex items-center justify-center">
                                <span className="text-3xl">🏢</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                No image available
                              </p>
                            </div>
                          </div>
                        )}
                        {allImages.length > 1 && (
                          <>
                            <button
                              onClick={() =>
                                setSelectedImageIndex(
                                  (prev) =>
                                    (prev - 1 + allImages.length) %
                                    allImages.length
                                )
                              }
                              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                              aria-label="Previous image"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 19l-7-7 7-7"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() =>
                                setSelectedImageIndex(
                                  (prev) => (prev + 1) % allImages.length
                                )
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                              aria-label="Next image"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {/* Right: name + About + Badge + Website + Gallery */}
                    <div className="flex-1 overflow-y-auto flex flex-col min-w-0">
                      <div className="p-6 pb-4 border-b border-border shrink-0">
                        <div className="flex items-center gap-4">
                          {brand.logo ? (
                            <img
                              src={PinataService.normalizeIpfsUrl(brand.logo)}
                              alt={brand.name}
                              className="w-14 h-14 rounded-full object-cover border-2 border-border"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const placeholder =
                                  target.nextElementSibling as HTMLElement;
                                if (placeholder)
                                  placeholder.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-14 h-14 rounded-full bg-violet-500/30 border-2 border-border flex items-center justify-center ${
                              brand.logo ? "hidden" : ""
                            }`}
                          >
                            <span className="text-2xl">🏢</span>
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-foreground">
                              {brand.name}
                            </h2>
                            <p className="text-muted-foreground text-sm">
                              {brand.industry}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            About
                          </h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {brandDetails?.description || brand.description}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-3">
                            Token Information
                          </h3>
                          {brand.hasToken ? (
                            <div className="p-4 bg-accent/50 rounded-lg border border-border">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    Symbol
                                  </p>
                                  <p className="text-xl font-bold" style={{ color: "#D4AF37" }}>
                                    {brand.tokenSymbol}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    Current Price
                                  </p>
                                  <p className="text-xl font-semibold text-foreground">
                                    ${brand.tokenPrice.toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    Holders
                                  </p>
                                  <p className="text-xl font-semibold text-foreground">
                                    {brand.holders.toLocaleString("en-US")}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    Total Raised
                                  </p>
                                  <p className="text-xl font-semibold text-foreground">
                                    ${brand.raised.toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 bg-accent/30 rounded-lg border border-border border-dashed">
                              <div className="flex items-center gap-3 text-muted-foreground">
                                <svg
                                  className="w-5 h-5 shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <div>
                                  <p className="font-medium">No badge available</p>
                                  <p className="text-sm">
                                    This brand hasn&apos;t issued badges yet
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        {brandDetails?.websiteUrl && (
                          <div>
                            <a
                              href={brandDetails.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-violet-500 hover:text-violet-600 transition-colors"
                            >
                              <span>Visit Website</span>
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </a>
                          </div>
                        )}
                        {/* Gallery (thumbnails) - last part on the right */}
                        {allImages.length > 1 && (
                          <div className="pt-4 border-t border-border">
                            <h3 className="text-lg font-semibold text-foreground mb-3">
                              Gallery
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {allImages.map((url, index) => (
                                <button
                                  key={index}
                                  onClick={() => setSelectedImageIndex(index)}
                                  className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                                    selectedImageIndex === index
                                      ? "border-violet-500 ring-2 ring-violet-500/50"
                                      : "border-border hover:border-violet-500/50 opacity-70 hover:opacity-100"
                                  }`}
                                >
                                  <img
                                    src={PinataService.normalizeIpfsUrl(url)}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Fullscreen Image Modal */}
      <AnimatePresence>
        {isFullscreenImageOpen && currentImage && (
          <motion.div
            key="fullscreen-image-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-60 flex items-center justify-center p-4"
            onClick={() => setIsFullscreenImageOpen(false)}
          >
              <button
                onClick={() => setIsFullscreenImageOpen(false)}
                className="absolute top-4 right-4 z-70 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              
              <motion.img
                src={PinataService.normalizeIpfsUrl(currentImage)}
                alt={brand.name}
                className="max-w-full max-h-[90vh] object-contain"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
              />

              {/* Navigation buttons for fullscreen */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(
                        (prev) =>
                          (prev - 1 + allImages.length) % allImages.length
                      );
                    }}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                    aria-label="Previous image"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(
                        (prev) => (prev + 1) % allImages.length
                      );
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                    aria-label="Next image"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
    </>
  );
}
