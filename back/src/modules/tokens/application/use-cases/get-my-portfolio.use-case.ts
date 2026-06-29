import { Injectable } from '@nestjs/common';
import {
  PortfolioEntry,
  TokenHolderRepository,
} from '../../domain/token-holder.repository';

/** Portefeuille de l'utilisateur courant (soldes > 0 + tokens). */
@Injectable()
export class GetMyPortfolioUseCase {
  constructor(private readonly holderRepository: TokenHolderRepository) {}

  execute(userId: string): Promise<PortfolioEntry[]> {
    return this.holderRepository.listPortfolio(userId);
  }
}
