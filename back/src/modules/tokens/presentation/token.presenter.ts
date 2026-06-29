import { ApiProperty } from '@nestjs/swagger';
import { Token } from '../domain/token';
import { TokenHolder } from '../domain/token-holder';
import { TokenTransaction } from '../domain/token-transaction';
import { PortfolioEntry } from '../domain/token-holder.repository';

export class TokenResponse {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) brandId: string;
  @ApiProperty() symbol: string;
  @ApiProperty() totalSupply: number;
  @ApiProperty() currentPrice: string;
  @ApiProperty({ type: String, nullable: true }) nftTokenId: string | null;
  @ApiProperty({ type: String, nullable: true }) nftName: string | null;
  @ApiProperty({ type: String, nullable: true }) nftSymbol: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt: string;
}

export class TokenHolderResponse {
  @ApiProperty({ format: 'uuid' }) userId: string;
  @ApiProperty({ format: 'uuid' }) tokenId: string;
  @ApiProperty() balance: number;
}

export class TokenTransactionResponse {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) tokenId: string;
  @ApiProperty({ type: String, nullable: true }) fromUserId: string | null;
  @ApiProperty({ format: 'uuid' }) toUserId: string;
  @ApiProperty() amount: number;
  @ApiProperty() transactionType: string;
  @ApiProperty({ format: 'date-time' }) createdAt: string;
}

export class PortfolioEntryResponse {
  @ApiProperty() balance: number;
  @ApiProperty({ type: TokenResponse }) token: TokenResponse;
}

export const toTokenResponse = (t: Token): TokenResponse => ({
  id: t.id,
  brandId: t.brandId,
  symbol: t.symbol,
  totalSupply: t.totalSupply,
  currentPrice: t.currentPrice,
  nftTokenId: t.nftTokenId,
  nftName: t.nftName,
  nftSymbol: t.nftSymbol,
  createdAt: t.createdAt.toISOString(),
});

export const toHolderResponse = (h: TokenHolder): TokenHolderResponse => ({
  userId: h.userId,
  tokenId: h.tokenId,
  balance: h.balance,
});

export const toTransactionResponse = (
  t: TokenTransaction,
): TokenTransactionResponse => ({
  id: t.id,
  tokenId: t.tokenId,
  fromUserId: t.fromUserId,
  toUserId: t.toUserId,
  amount: t.amount,
  transactionType: t.transactionType,
  createdAt: t.createdAt.toISOString(),
});

export const toPortfolioEntryResponse = (
  e: PortfolioEntry,
): PortfolioEntryResponse => ({
  balance: e.holder.balance,
  token: toTokenResponse(e.token),
});
