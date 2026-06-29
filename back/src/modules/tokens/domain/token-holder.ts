/** Détenteur d'un token et son solde (table `token_holder`). */
export class TokenHolder {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly tokenId: string,
    public readonly balance: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
