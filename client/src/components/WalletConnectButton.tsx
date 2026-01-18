"use client";

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { Check } from "lucide-react";
import { toast } from "@/lib/toast";
import { useEffect, useRef, useCallback } from "react";

interface WalletConnectButtonProps {
  onConnected?: (address: string) => void;
  onDisconnected?: () => void;
  shouldDisconnect?: boolean;
}

export function WalletConnectButton({ onConnected, onDisconnected, shouldDisconnect }: WalletConnectButtonProps) {
  const { primaryWallet, setShowAuthFlow, handleLogOut } = useDynamicContext();
  const lastNotifiedAddress = useRef<string | null>(null);

  // Handle wallet connection - only notify once per address
  useEffect(() => {
    if (primaryWallet?.address && onConnected && lastNotifiedAddress.current !== primaryWallet.address) {
      lastNotifiedAddress.current = primaryWallet.address;
      onConnected(primaryWallet.address);
    } else if (!primaryWallet?.address) {
      lastNotifiedAddress.current = null;
    }
  }, [primaryWallet?.address, onConnected]);

  const handleDisconnect = useCallback(async () => {
    try {
      await handleLogOut();
      lastNotifiedAddress.current = null;
      if (onDisconnected) {
        onDisconnected();
      }
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect wallet.",
        variant: "error",
      });
    }
  }, [handleLogOut, onDisconnected]);

  // Handle forced disconnect
  useEffect(() => {
    if (shouldDisconnect && primaryWallet) {
      handleDisconnect();
    }
  }, [shouldDisconnect, primaryWallet, handleDisconnect]);

  const handleConnect = () => {
    setShowAuthFlow(true);
  };

  // If wallet is connected, show the connected state
  if (primaryWallet?.address) {
    const address = primaryWallet.address;
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Connected Wallet Display */}
        <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-green-500/20 border border-green-500/30">
          <Check className="w-3 h-3 text-green-400" />
          <span className="text-[10px] sm:text-xs text-green-300 font-medium">{shortAddress}</span>
        </div>

        {/* Disconnect Button */}
        <button
          onClick={handleDisconnect}
          className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium text-white border border-white/10 bg-white/5 hover:bg-red-500/20 hover:border-red-500/30 transition-all"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // If not connected, show the connect button
  return (
    <button
      onClick={handleConnect}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:scale-105"
      style={{
        background: 'linear-gradient(to right, #7c3aed, #a855f7)',
        boxShadow: '0 2px 8px 0 rgba(124, 58, 237, 0.3)',
      }}
    >
      Connect Wallet
    </button>
  );
}
