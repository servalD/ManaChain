import { Injectable } from '@nestjs/common';
import { TokenHolder } from '../../domain/token-holder';
import { TokenHolderRepository } from '../../domain/token-holder.repository';

/** Liste paginée des détenteurs d'un token (public). */
@Injectable()
export class ListTokenHoldersUseCase {
  constructor(private readonly holderRepository: TokenHolderRepository) {}

  execute(
    tokenId: string,
    limit: number,
    offset: number,
  ): Promise<{ holders: TokenHolder[]; total: number }> {
    return this.holderRepository.listByToken(tokenId, limit, offset);
  }
}
