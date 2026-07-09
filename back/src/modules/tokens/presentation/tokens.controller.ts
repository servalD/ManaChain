import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { Public } from '../../../shared/decorators/public.decorator';
import { User } from '../../users/domain/user';
import { GetTokenUseCase } from '../application/use-cases/get-token.use-case';
import { GetTokenByBrandUseCase } from '../application/use-cases/get-token-by-brand.use-case';
import { ListTokenHoldersUseCase } from '../application/use-cases/list-token-holders.use-case';
import { GetMyBalanceUseCase } from '../application/use-cases/get-my-balance.use-case';
import { ListTokenTransactionsUseCase } from '../application/use-cases/list-token-transactions.use-case';
import { ListMyTransactionsUseCase } from '../application/use-cases/list-my-transactions.use-case';
import { GetMyPortfolioUseCase } from '../application/use-cases/get-my-portfolio.use-case';
import { PaginationQuery } from '../application/dto/pagination.query';
import { GetTokenChainInfoUseCase } from '../../chain-sync/application/get-token-chain-info.use-case';
import {
  PaginatedTokenHoldersResponse,
  PaginatedTokenTransactionsResponse,
  PortfolioEntryResponse,
  TokenBalanceResponse,
  TokenResponse,
  toHolderResponse,
  toPortfolioEntryResponse,
  toTokenResponse,
  toTransactionResponse,
} from './token.presenter';

/** Lecture seule : les écritures sont pilotées par les events on-chain (module chain-sync). */
@ApiTags('tokens')
@Controller('tokens')
export class TokensController {
  constructor(
    private readonly getToken: GetTokenUseCase,
    private readonly getTokenByBrand: GetTokenByBrandUseCase,
    private readonly getTokenChainInfo: GetTokenChainInfoUseCase,
    private readonly listHolders: ListTokenHoldersUseCase,
    private readonly getMyBalance: GetMyBalanceUseCase,
    private readonly listTokenTransactions: ListTokenTransactionsUseCase,
    private readonly listMyTransactions: ListMyTransactionsUseCase,
    private readonly getMyPortfolio: GetMyPortfolioUseCase,
  ) {}

  // --- Routes spécifiques AVANT /:id ---

  @Public()
  @Get('brand/:brandId')
  @ApiOperation({ summary: "Token d'une marque" })
  @ApiParam({ name: 'brandId', format: 'uuid' })
  @ApiOkResponse({ type: TokenResponse })
  async byBrand(
    @Param('brandId', ParseUUIDPipe) brandId: string,
  ): Promise<TokenResponse> {
    const token = await this.getTokenByBrand.execute(brandId);
    return toTokenResponse(
      token,
      await this.getTokenChainInfo.execute(token.id),
    );
  }

  @Get('my/transactions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes transactions' })
  @ApiOkResponse({ type: PaginatedTokenTransactionsResponse })
  async myTransactions(
    @CurrentUser() user: User,
    @Query() query: PaginationQuery,
  ): Promise<PaginatedTokenTransactionsResponse> {
    const { transactions, total } = await this.listMyTransactions.execute(
      user.id,
      query.limit,
      query.offset,
    );
    return { transactions: transactions.map(toTransactionResponse), total };
  }

  @Get('my/portfolio')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mon portefeuille' })
  @ApiOkResponse({ type: PortfolioEntryResponse, isArray: true })
  async myPortfolio(
    @CurrentUser() user: User,
  ): Promise<PortfolioEntryResponse[]> {
    const portfolio = await this.getMyPortfolio.execute(user.id);
    return portfolio.map(toPortfolioEntryResponse);
  }

  @Public()
  @Get(':id/holders')
  @ApiOperation({ summary: "Détenteurs d'un token" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PaginatedTokenHoldersResponse })
  async holders(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQuery,
  ): Promise<PaginatedTokenHoldersResponse> {
    const { holders, total } = await this.listHolders.execute(
      id,
      query.limit,
      query.offset,
    );
    return { holders: holders.map(toHolderResponse), total };
  }

  @Get(':id/balance')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mon solde pour un token' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TokenBalanceResponse })
  async balance(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TokenBalanceResponse> {
    return { balance: await this.getMyBalance.execute(user.id, id) };
  }

  @Public()
  @Get(':id/transactions')
  @ApiOperation({ summary: "Transactions d'un token" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PaginatedTokenTransactionsResponse })
  async tokenTransactions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQuery,
  ): Promise<PaginatedTokenTransactionsResponse> {
    const { transactions, total } = await this.listTokenTransactions.execute(
      id,
      query.limit,
      query.offset,
    );
    return { transactions: transactions.map(toTransactionResponse), total };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Token par id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TokenResponse })
  async getOne(@Param('id', ParseUUIDPipe) id: string): Promise<TokenResponse> {
    const token = await this.getToken.execute(id);
    return toTokenResponse(
      token,
      await this.getTokenChainInfo.execute(token.id),
    );
  }
}
