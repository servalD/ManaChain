/**
 * Modèle de domaine PUR d'un like (table `brand_like`). Un utilisateur aime une
 * marque ; unicité (userId, brandId) garantie en base et au niveau métier.
 */
export class Like {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly brandId: string,
    public readonly createdAt: Date,
  ) {}
}
