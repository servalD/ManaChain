import type { Address } from "viem";

/**
 * Adresses des contrats "plateforme" (un seul déploiement, partagé par tous les
 * utilisateurs). Les adresses par-marque (vault, escrow, supportToken) ne sont
 * PAS ici : elles viennent de l'API, jamais d'une variable d'env.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not defined in environment variables`);
  }
  return value;
}

function requireAddress(name: string): Address {
  return requireEnv(name) as Address;
}

function requireChainId(name: string): number {
  const value = requireEnv(name);
  const chainId = Number(value);
  if (!Number.isInteger(chainId)) {
    throw new Error(`${name} is not a valid integer: ${value}`);
  }
  return chainId;
}

export const CHAIN_ID = requireChainId("NEXT_PUBLIC_CHAIN_ID");

export const CONTRACT_ADDRESSES = {
  manaAdmin: requireAddress("NEXT_PUBLIC_MANA_ADMIN_ADDRESS"),
  brandFactory: requireAddress("NEXT_PUBLIC_BRAND_FACTORY_ADDRESS"),
  saleFactory: requireAddress("NEXT_PUBLIC_SALE_FACTORY_ADDRESS"),
  eventFactory: requireAddress("NEXT_PUBLIC_EVENT_FACTORY_ADDRESS"),
  usdc: requireAddress("NEXT_PUBLIC_USDC_ADDRESS"),
} as const satisfies Record<string, Address>;
