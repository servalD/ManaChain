/**
 * PORT du pont on-chain. **Jalon tokens : comportement off-chain conservé** — les
 * soldes restent en base. Ce port matérialise le point d'insertion de la future
 * synchronisation blockchain (émission / transfert on-chain). L'adapter par
 * défaut ({@link NoopBlockchainGateway}) ne fait rien : la bascule
 * « chaîne = source de vérité » se fera en remplaçant cet adapter, sans toucher
 * aux use-cases.
 */
export abstract class BlockchainGateway {
  abstract onTokensPurchased(
    tokenId: string,
    userId: string,
    amount: number,
  ): Promise<void>;

  abstract onTokensTransferred(
    tokenId: string,
    fromUserId: string,
    toUserId: string,
    amount: number,
  ): Promise<void>;
}
