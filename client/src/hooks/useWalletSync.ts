"use client";

import { useState } from "react";
import { useUpdateBlockchainAddress } from "@/hooks/api/useAuth";
import { toast } from "@/lib/toast";
import type { UserResponse } from "@/api/generated/models";

/**
 * Synchronise l'adresse du wallet connecté (Dynamic) avec `user.blockchainAddress`.
 * Factorise le pattern dupliqué dans discover/dashboard/brand-dashboard/admin-dashboard/
 * admin-brands : garde d'égalité d'adresse + force disconnect en cas de mismatch.
 *
 * `refreshUser` vient du `useAuth()` déjà instancié par la page appelante — on ne
 * ré-instancie pas `useAuth()` ici pour ne pas dupliquer son check de session.
 */
export function useWalletSync(refreshUser: () => Promise<UserResponse | null>) {
  const updateBlockchainAddress = useUpdateBlockchainAddress();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [shouldDisconnectWallet, setShouldDisconnectWallet] = useState(false);

  const handleWalletConnected = async (address: string) => {
    setShouldDisconnectWallet(false);
    const freshUser = await refreshUser();

    if (!freshUser) {
      toast({
        title: "Error",
        description: "Unable to verify user data. Please try again.",
        variant: "error",
      });
      setShouldDisconnectWallet(true);
      return;
    }

    if (freshUser.blockchainAddress) {
      if (freshUser.blockchainAddress.toLowerCase() !== address.toLowerCase()) {
        toast({
          title: "Wallet Already Connected",
          description:
            "You already have a different wallet connected to your account. Please use your registered wallet or contact support.",
          variant: "error",
        });
        setShouldDisconnectWallet(true);
        return;
      }
      setWalletAddress(address);
      toast({
        title: "Wallet Connected",
        description: "Your registered wallet has been connected successfully.",
        variant: "success",
      });
    } else {
      try {
        await updateBlockchainAddress.mutateAsync({ data: { blockchainAddress: address } });
        await refreshUser();
        setWalletAddress(address);
        toast({
          title: "Wallet Connected & Saved",
          description: "Your wallet has been connected and saved to your account.",
          variant: "success",
        });
      } catch {
        setShouldDisconnectWallet(true);
        setWalletAddress(null);
      }
    }
  };

  const handleWalletDisconnected = () => {
    setWalletAddress(null);
    setShouldDisconnectWallet(false);
  };

  return { walletAddress, shouldDisconnectWallet, handleWalletConnected, handleWalletDisconnected };
}
