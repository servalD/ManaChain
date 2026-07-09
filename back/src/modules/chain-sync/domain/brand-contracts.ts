/**
 * Registre d'un module de marque déployé (table `brand_contracts`). `brandId`
 * est nullable : l'event `BrandModuleDeployed` peut être traité avant que
 * l'utilisateur n'ait lié son adresse blockchain à son compte.
 */
export class BrandContracts {
  constructor(
    public readonly id: string,
    public readonly brandId: string | null,
    public readonly brandAddress: string,
    public readonly genesisNftAddress: string,
    public readonly vaultAddress: string,
    public readonly supportTokenAddress: string,
    public readonly whitelisted: boolean,
    public readonly blacklisted: boolean,
    public readonly deployTxHash: string,
    public readonly blockNumber: bigint,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
