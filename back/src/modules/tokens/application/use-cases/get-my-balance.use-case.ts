import { Injectable } from '@nestjs/common';
import { TokenHolderRepository } from '../../domain/token-holder.repository';

/** Solde de l'utilisateur courant pour un token (0 s'il n'est pas détenteur). */
@Injectable()
export class GetMyBalanceUseCase {
  constructor(private readonly holderRepository: TokenHolderRepository) {}

  execute(userId: string, tokenId: string): Promise<number> {
    return this.holderRepository.getBalance(userId, tokenId);
  }
}
