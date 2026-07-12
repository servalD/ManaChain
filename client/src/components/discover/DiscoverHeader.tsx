"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";

export function DiscoverHeader() {
  const t = useTranslations("discover.header");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex items-center justify-between mb-8 sm:mb-12 px-2 sm:px-8 relative z-10">
      {/* Title - Left */}
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold m-0">
        <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
          {t("title")}
        </span>
      </h1>

      {/* Search - Right */}
      <div className="relative m-0">
        {isSearchOpen ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 sm:w-64 md:w-80 px-4 py-2 rounded-full bg-accent/50 backdrop-blur-sm border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400/50 transition-all"
              autoFocus
            />
            <button
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery("");
              }}
              className="p-2 rounded-full bg-accent/50 backdrop-blur-sm border border-border hover:bg-accent transition-all"
              aria-label={t("closeSearchAria")}
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-3 rounded-full bg-accent/50 backdrop-blur-sm border border-border hover:bg-violet-500/20 hover:border-violet-500/50 transition-all duration-300 shadow-lg"
            aria-label={t("searchAria")}
          >
            <Search className="w-5 h-5 text-violet-400" />
          </button>
        )}
      </div>
    </div>
  );
}
