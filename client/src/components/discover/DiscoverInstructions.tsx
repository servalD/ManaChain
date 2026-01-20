"use client";

export function DiscoverInstructions() {
  return (
    <div className="text-center px-2">
      <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-8 px-4 sm:px-8 py-3 sm:py-4 rounded-2xl bg-accent/30 backdrop-blur-sm border border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
            <span className="text-red-400 text-sm">←</span>
          </div>
          <span className="text-xs sm:text-sm text-muted-foreground">Swipe left to pass</span>
        </div>
        <div className="hidden sm:block w-px h-8 bg-border" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
            <span className="text-green-400 text-sm">→</span>
          </div>
          <span className="text-xs sm:text-sm text-muted-foreground">Swipe right to like</span>
        </div>
      </div>
    </div>
  );
}
