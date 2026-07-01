import { TokenHolder } from './token-holder';
import { Token } from './token';

/** Élément de portefeuille : un solde + le token associé. */
export interface PortfolioEntry {
  holder: TokenHolder;
  token: Token;
}

/** Repository PORT de la table `token_holder`. */
export abstract class TokenHolderRepository {
  /** Solde d'un user pour un token (0 s'il n'est pas détenteur). */
  abstract getBalance(userId: string, tokenId: string): Promise<number>;
  /**
   * Comme {@link getBalance}, mais pose un verrou pessimiste sur la ligne (anti
   * lost-update). À utiliser dans une transaction avant un débit/crédit.
   */
  abstract getBalanceForUpdate(
    userId: string,
    tokenId: string,
  ): Promise<number>;
  /** Crée ou met à jour le solde (valeur absolue). */
  abstract setBalance(
    userId: string,
    tokenId: string,
    balance: number,
  ): Promise<void>;
  /** Détenteurs d'un token (solde > 0), triés par solde décroissant. */
  abstract listByToken(
    tokenId: string,
    limit: number,
    offset: number,
  ): Promise<{ holders: TokenHolder[]; total: number }>;
  /** Portefeuille d'un user (soldes > 0 + tokens joints). */
  abstract listPortfolio(userId: string): Promise<PortfolioEntry[]>;
}
