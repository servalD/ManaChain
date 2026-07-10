import { Injectable } from '@nestjs/common';
import { BrandRepository } from '../../domain/brand.repository';
import { BrandBanRepository } from '../../domain/brand-ban.repository';
import { BrandBan } from '../../domain/brand-ban';
import { UserRepository } from '../../../users/domain/user.repository';
import { ListBansQuery } from '../dto/list-bans.query';

export interface BrandBanEntry {
  ban: BrandBan;
  brandName: string | null;
  bannedByUsername: string | null;
}

/** Liste admin des bans marques, avec les noms résolus (même schéma N+1 assumé
 * que `list-brands-for-whitelist.use-case.ts`, échelle admin réduite). */
@Injectable()
export class ListBrandBansUseCase {
  constructor(
    private readonly brandBans: BrandBanRepository,
    private readonly brandRepository: BrandRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    query: ListBansQuery,
  ): Promise<{ bans: BrandBanEntry[]; total: number }> {
    const { bans, total } = await this.brandBans.list(query);
    const entries = await Promise.all(
      bans.map(async (ban) => {
        const [brand, bannedBy] = await Promise.all([
          this.brandRepository.findById(ban.brandId),
          this.userRepository.findById(ban.bannedBy),
        ]);
        return {
          ban,
          brandName: brand?.name ?? null,
          bannedByUsername: bannedBy?.username ?? null,
        };
      }),
    );
    return { bans: entries, total };
  }
}
