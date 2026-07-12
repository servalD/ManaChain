"use client";

import { useAccount, useReadContract } from "wagmi";
import { zeroAddress, type Address } from "viem";
import { manaAdminAbi, brandFactoryAbi, fractionalVaultAbi } from "@/lib/web3/generated";
import { CONTRACT_ADDRESSES } from "@/lib/web3/addresses";

export type BrandSetupStep =
  | "connect"
  | "not-whitelisted"
  | "deploy"
  | "genesis"
  | "sale"
  | "done";

/**
 * État de setup d'une marque dérivé entièrement de la chaîne — reprise
 * gratuite après refresh ou échec en cours de route, aucun état local
 * persisté. Une seule adresse (le wallet connecté) fait foi tout du long.
 */
export function useBrandSetupState() {
  const { address } = useAccount();

  const isAllowedQuery = useReadContract({
    address: CONTRACT_ADDRESSES.manaAdmin,
    abi: manaAdminAbi,
    functionName: "isBrandAllowed",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const hasDeployedQuery = useReadContract({
    address: CONTRACT_ADDRESSES.brandFactory,
    abi: brandFactoryAbi,
    functionName: "hasDeployed",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const vaultQuery = useReadContract({
    address: CONTRACT_ADDRESSES.brandFactory,
    abi: brandFactoryAbi,
    functionName: "vaultOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && hasDeployedQuery.data === true },
  });

  const genesisNftAddressQuery = useReadContract({
    address: CONTRACT_ADDRESSES.brandFactory,
    abi: brandFactoryAbi,
    functionName: "genesisNFTOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && hasDeployedQuery.data === true },
  });

  const vaultAddress = vaultQuery.data;
  const vaultReady = !!vaultAddress && vaultAddress !== zeroAddress;

  const vaultGenesisQuery = useReadContract({
    address: vaultAddress,
    abi: fractionalVaultAbi,
    functionName: "getGenesisNFT",
    query: { enabled: vaultReady },
  });

  const vaultEscrowQuery = useReadContract({
    address: vaultAddress,
    abi: fractionalVaultAbi,
    functionName: "getEscrow",
    query: { enabled: vaultReady },
  });

  const genesisNftInVault = vaultGenesisQuery.data?.[0];
  const isGenesisDeposited = !!genesisNftInVault && genesisNftInVault !== zeroAddress;
  const escrowAddress = vaultEscrowQuery.data;
  const isSaleOpen = !!escrowAddress && escrowAddress !== zeroAddress;

  const isLoading =
    isAllowedQuery.isLoading ||
    hasDeployedQuery.isLoading ||
    (hasDeployedQuery.data === true &&
      (vaultQuery.isLoading || genesisNftAddressQuery.isLoading));

  const step: BrandSetupStep = !address
    ? "connect"
    : isAllowedQuery.data !== true
      ? "not-whitelisted"
      : hasDeployedQuery.data !== true
        ? "deploy"
        : !isGenesisDeposited
          ? "genesis"
          : !isSaleOpen
            ? "sale"
            : "done";

  const refetchAll = async () => {
    await Promise.all([
      isAllowedQuery.refetch(),
      hasDeployedQuery.refetch(),
      vaultQuery.refetch(),
      genesisNftAddressQuery.refetch(),
      vaultGenesisQuery.refetch(),
      vaultEscrowQuery.refetch(),
    ]);
  };

  return {
    address,
    isLoading,
    step,
    vaultAddress: vaultReady ? (vaultAddress as Address) : undefined,
    genesisNftAddress: genesisNftAddressQuery.data,
    escrowAddress: isSaleOpen ? (escrowAddress as Address) : undefined,
    refetchAll,
  };
}
