import type { Address } from "viem";

/**
 * Adresses des contrats "plateforme" (un seul déploiement, partagé par tous les
 * utilisateurs). Les adresses par-marque (vault, escrow, supportToken) ne sont
 * PAS ici : elles viennent de l'API, jamais d'une variable d'env.
 */

function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`${name} is not defined in environment variables`);
  }
  return value;
}

function requireAddress(value: string | undefined, name: string): Address {
  return requireEnv(value, name) as Address;
}

function requireChainId(value: string | undefined, name: string): number {
  const envValue = requireEnv(value, name);
  const chainId = Number(envValue);
  if (!Number.isInteger(chainId)) {
    throw new Error(`${name} is not a valid integer: ${envValue}`);
  }
  return chainId;
}

export const CHAIN_ID = requireChainId(process.env.NEXT_PUBLIC_CHAIN_ID, "NEXT_PUBLIC_CHAIN_ID");

export const CONTRACT_ADDRESSES = {
  manaAdmin: requireAddress(process.env.NEXT_PUBLIC_MANA_ADMIN_ADDRESS, "NEXT_PUBLIC_MANA_ADMIN_ADDRESS"),
  brandFactory: requireAddress(process.env.NEXT_PUBLIC_BRAND_FACTORY_ADDRESS, "NEXT_PUBLIC_BRAND_FACTORY_ADDRESS"),
  saleFactory: requireAddress(process.env.NEXT_PUBLIC_SALE_FACTORY_ADDRESS, "NEXT_PUBLIC_SALE_FACTORY_ADDRESS"),
  eventFactory: requireAddress(process.env.NEXT_PUBLIC_EVENT_FACTORY_ADDRESS, "NEXT_PUBLIC_EVENT_FACTORY_ADDRESS"),
  usdc: requireAddress(process.env.NEXT_PUBLIC_USDC_ADDRESS, "NEXT_PUBLIC_USDC_ADDRESS"),
} as const satisfies Record<string, Address>;
