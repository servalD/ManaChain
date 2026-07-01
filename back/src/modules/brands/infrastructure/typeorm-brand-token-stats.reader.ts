import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BrandTokenStats,
  BrandTokenStatsReader,
} from '../domain/brand-token-stats.reader';
import { BrandOrmEntity } from './brand.orm-entity';

interface TokenRow {
  id: string;
  symbol: string;
  current_price: string;
}
interface CountRow {
  count: string;
}
interface TotalRow {
  total: string;
}

/**
 * Adapter SQL de {@link BrandTokenStatsReader} : lit les tables du module
 * `tokens` (le module `brands` reste découplé ; réutilise le manager du
 * repository des marques). `totalRaised = Σ(amount × price_per_token)` sur les
 * transactions de type `purchase`.
 */
@Injectable()
export class TypeOrmBrandTokenStatsReader extends BrandTokenStatsReader {
  constructor(
    @InjectRepository(BrandOrmEntity)
    private readonly repository: Repository<BrandOrmEntity>,
  ) {
    super();
  }

  async getStatsByBrand(brandId: string): Promise<BrandTokenStats> {
    const manager = this.repository.manager;

    const tokenRows = await manager.query<TokenRow[]>(
      `SELECT id, symbol, current_price FROM brand_token WHERE brand_id = $1 LIMIT 1`,
      [brandId],
    );
    if (tokenRows.length === 0) {
      return {
        tokenHolders: 0,
        totalRaised: '0',
        tokenSymbol: null,
        tokenPrice: null,
      };
    }
    const token = tokenRows[0];

    const holderRows = await manager.query<CountRow[]>(
      `SELECT COUNT(*)::text AS count FROM token_holder WHERE token_id = $1 AND balance > 0`,
      [token.id],
    );

    const totalRows = await manager.query<TotalRow[]>(
      `SELECT COALESCE(SUM(amount * price_per_token), 0)::text AS total
         FROM token_transaction
        WHERE token_id = $1 AND transaction_type = 'purchase'`,
      [token.id],
    );

    return {
      tokenHolders: Number(holderRows[0]?.count ?? '0'),
      totalRaised: Number(totalRows[0]?.total ?? '0').toFixed(2),
      tokenSymbol: token.symbol,
      tokenPrice: token.current_price,
    };
  }
}
