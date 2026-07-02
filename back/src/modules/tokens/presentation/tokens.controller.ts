import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { Public } from '../../../shared/decorators/public.decorator';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { Role } from '../../../shared/enums/role.enum';
import { User } from '../../users/domain/user';
import { CreateTokenUseCase } from '../application/use-cases/create-token.use-case';
import { GetTokenUseCase } from '../application/use-cases/get-token.use-case';
import { GetTokenByBrandUseCase } from '../application/use-cases/get-token-by-brand.use-case';
import { UpdateTokenPriceUseCase } from '../application/use-cases/update-token-price.use-case';
import { ListTokenHoldersUseCase } from '../application/use-cases/list-token-holders.use-case';
import { GetMyBalanceUseCase } from '../application/use-cases/get-my-balance.use-case';
import { TransferTokensUseCase } from '../application/use-cases/transfer-tokens.use-case';
import { PurchaseTokensUseCase } from '../application/use-cases/purchase-tokens.use-case';
import { ListTokenTransactionsUseCase } from '../application/use-cases/list-token-transactions.use-case';
import { ListMyTransactionsUseCase } from '../application/use-cases/list-my-transactions.use-case';
import { GetMyPortfolioUseCase } from '../application/use-cases/get-my-portfolio.use-case';
import { CreateTokenRequest } from '../application/dto/create-token.request';
import { UpdatePriceRequest } from '../application/dto/update-price.request';
import { TransferRequest } from '../application/dto/transfer.request';
import { PurchaseRequest } from '../application/dto/purchase.request';
import { PaginationQuery } from '../application/dto/pagination.query';
import {
  PortfolioEntryResponse,
  TokenHolderResponse,
  TokenResponse,
  TokenTransactionResponse,
  toHolderResponse,
  toPortfolioEntryResponse,
  toTokenResponse,
  toTransactionResponse,
} from './token.presenter';

@ApiTags('tokens')
@Controller('tokens')
export class TokensController {
  constructor(
    private readonly createToken: CreateTokenUseCase,
    private readonly getToken: GetTokenUseCase,
    private readonly getTokenByBrand: GetTokenByBrandUseCase,
    private readonly updatePrice: UpdateTokenPriceUseCase,
    private readonly listHolders: ListTokenHoldersUseCase,
    private readonly getMyBalance: GetMyBalanceUseCase,
    private readonly transfer: TransferTokensUseCase,
    private readonly purchase: PurchaseTokensUseCase,
    private readonly listTokenTransactions: ListTokenTransactionsUseCase,
    private readonly listMyTransactions: ListMyTransactionsUseCase,
    private readonly getMyPortfolio: GetMyPortfolioUseCase,
  ) {}

  @Post()
  @Roles(Role.BRANDUSER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer le token de sa marque' })
  @ApiCreatedResponse({ type: TokenResponse })
  async create(
    @CurrentUser() user: User,
    @Body() body: CreateTokenRequest,
  ): Promise<TokenResponse> {
    return toTokenResponse(
      await this.createToken.execute(user.id, user.verified, body),
    );
  }

  // --- Routes spécifiques AVANT /:id ---

  @Public()
  @Get('brand/:brandId')
  @ApiOperation({ summary: "Token d'une marque" })
  @ApiParam({ name: 'brandId', format: 'uuid' })
  @ApiOkResponse({ type: TokenResponse })
  async byBrand(
    @Param('brandId', ParseUUIDPipe) brandId: string,
  ): Promise<TokenResponse> {
    return toTokenResponse(await this.getTokenByBrand.execute(brandId));
  }

  @Get('my/transactions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes transactions' })
  async myTransactions(
    @CurrentUser() user: User,
    @Query() query: PaginationQuery,
  ): Promise<{ transactions: TokenTransactionResponse[]; total: number }> {
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
  async holders(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQuery,
  ): Promise<{ holders: TokenHolderResponse[]; total: number }> {
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
  async balance(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ balance: number }> {
    return { balance: await this.getMyBalance.execute(user.id, id) };
  }

  @Public()
  @Get(':id/transactions')
  @ApiOperation({ summary: "Transactions d'un token" })
  @ApiParam({ name: 'id', format: 'uuid' })
  async tokenTransactions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQuery,
  ): Promise<{ transactions: TokenTransactionResponse[]; total: number }> {
    const { transactions, total } = await this.listTokenTransactions.execute(
      id,
      query.limit,
      query.offset,
    );
    return { transactions: transactions.map(toTransactionResponse), total };
  }

  @Put(':id/price')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour le prix (propriétaire)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TokenResponse })
  async setPrice(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdatePriceRequest,
  ): Promise<TokenResponse> {
    return toTokenResponse(
      await this.updatePrice.execute(user.id, id, body.price),
    );
  }

  @Post(':id/transfer')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transférer des tokens' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async transferTokens(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: TransferRequest,
  ): Promise<{ message: string }> {
    await this.transfer.execute(user, id, body.toUserId, body.amount);
    return { message: 'Transfer successful' };
  }

  @Post(':id/purchase')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Acheter des tokens' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async purchaseTokens(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: PurchaseRequest,
  ): Promise<{ message: string }> {
    await this.purchase.execute(user, id, body.amount, body.pricePerToken);
    return { message: 'Purchase successful' };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Token par id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TokenResponse })
  async getOne(@Param('id', ParseUUIDPipe) id: string): Promise<TokenResponse> {
    return toTokenResponse(await this.getToken.execute(id));
  }
}
