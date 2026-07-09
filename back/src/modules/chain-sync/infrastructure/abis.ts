import { parseAbi } from 'viem';

/**
 * ABIs locales au back (events seulement — chain-sync ne fait que lire), pour
 * ne pas dépendre du dossier `contracts/` (artifacts Foundry non publiés).
 * Garder synchronisé avec `contracts/src/**\/*.sol` en cas de changement de
 * signature d'event.
 */

export const manaAdminAbi = parseAbi([
  'event BrandWhitelisted(address indexed brand, bool allowed)',
  'event BrandBlacklisted(address indexed brand, bool banned)',
]);

export const brandFactoryAbi = parseAbi([
  'event BrandModuleDeployed(address indexed brand, address indexed genesisNFT, address indexed vault, address supportToken)',
]);

export const saleFactoryAbi = parseAbi([
  'event TokenSaleDeployed(address indexed brand, address indexed escrow, address indexed supportToken, uint256 pricePerToken, uint256 totalForSale, uint256 startTime, uint256 endTime)',
]);

export const tokenSaleEscrowAbi = parseAbi([
  'event Bought(address indexed buyer, uint256 amount, uint256 paid)',
  'event SaleClosed()',
  'event SaleCancelledByAdmin()',
  'event SaleCancelledByBrand()',
  'event RefundClaimed(address indexed user, uint256 tokenAmount, uint256 refundAmount)',
]);

export const erc20Abi = parseAbi([
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function symbol() view returns (string)',
  'function balanceOf(address account) view returns (uint256)',
]);

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
