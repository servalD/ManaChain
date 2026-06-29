/**
 * Modèle de domaine PUR d'un token de marque (table `brand_token`). Une marque a
 * au plus un token. `currentPrice` est conservé en chaîne (décimal précis) ;
 * `totalSupply` en nombre (arithmétique d'émission).
 */
export class Token {
  constructor(
    public readonly id: string,
    public readonly brandId: string,
    public readonly symbol: string,
    public readonly totalSupply: number,
    public readonly currentPrice: string,
    public readonly nftTokenId: string | null,
    public readonly nftName: string | null,
    public readonly nftSymbol: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
