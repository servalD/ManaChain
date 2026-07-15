import {
  Body,
  Controller,
  Delete,
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
import { Roles } from '../../../shared/decorators/roles.decorator';
import { Role } from '../../../shared/enums/role.enum';
import { User } from '../domain/user';
import { GetAllUsersUseCase } from '../application/use-cases/get-all-users.use-case';
import { UpdateUserUseCase } from '../application/use-cases/update-user.use-case';
import { UpdateBlockchainAddressUseCase } from '../application/use-cases/update-blockchain-address.use-case';
import { GetMyInterestsUseCase } from '../application/use-cases/get-my-interests.use-case';
import { UpdateMyInterestsUseCase } from '../application/use-cases/update-my-interests.use-case';
import { BanUserUseCase } from '../application/use-cases/ban-user.use-case';
import { UnbanUserUseCase } from '../application/use-cases/unban-user.use-case';
import { ListUserBansUseCase } from '../application/use-cases/list-user-bans.use-case';
import { DeleteAccountUseCase } from '../application/use-cases/delete-account.use-case';
import { GetMyActivityHistoryUseCase } from '../application/use-cases/get-my-activity-history.use-case';
import { UpdateUserRequest } from '../application/dto/update-user.request';
import { UpdateBlockchainAddressRequest } from '../application/dto/update-blockchain-address.request';
import { UpdateInterestsRequest } from '../application/dto/update-interests.request';
import { ListUsersQuery } from '../application/dto/list-users.query';
import { BanUserRequest } from '../application/dto/ban-user.request';
import { ListBansQuery } from '../application/dto/list-bans.query';
import { HistoryRangeQuery } from '../../../shared/application/dto/history-range.query';
import {
  ActivityPointResponse,
  PaginatedUserBansResponse,
  PaginatedUsersResponse,
  toUserBanResponse,
  toUserResponse,
  UserBanResponse,
  UserResponse,
} from './user.presenter';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly getAllUsers: GetAllUsersUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly updateBlockchainAddress: UpdateBlockchainAddressUseCase,
    private readonly getMyInterests: GetMyInterestsUseCase,
    private readonly updateMyInterests: UpdateMyInterestsUseCase,
    private readonly banUser: BanUserUseCase,
    private readonly unbanUser: UnbanUserUseCase,
    private readonly listUserBans: ListUserBansUseCase,
    private readonly deleteAccount: DeleteAccountUseCase,
    private readonly getMyActivityHistory: GetMyActivityHistoryUseCase,
  ) {}

  /** Profil de l'utilisateur authentifié courant. */
  @Get('me')
  @ApiOperation({ summary: 'Profil de l’utilisateur courant' })
  @ApiOkResponse({ type: UserResponse })
  me(@CurrentUser() user: User): UserResponse {
    return toUserResponse(user);
  }

  /** Met à jour le profil de l'utilisateur courant. */
  @Put('me')
  @ApiOperation({ summary: 'Mettre à jour son profil' })
  @ApiOkResponse({ type: UserResponse })
  async updateMe(
    @CurrentUser() user: User,
    @Body() body: UpdateUserRequest,
  ): Promise<UserResponse> {
    const updated = await this.updateUser.execute(user.id, body);
    return toUserResponse(updated);
  }

  /**
   * Supprime (anonymise) le compte de l'utilisateur courant. RGPD — bloqué si
   * le compte possède une marque (409, cf. {@link DeleteAccountUseCase}).
   */
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer son compte' })
  async deleteMe(@CurrentUser() user: User): Promise<void> {
    await this.deleteAccount.execute(user.id);
  }

  /** Rattache / met à jour l'adresse blockchain de l'utilisateur courant. */
  @Put('me/blockchain-address')
  @ApiOperation({ summary: 'Mettre à jour son adresse blockchain' })
  @ApiOkResponse({ type: UserResponse })
  async updateMyBlockchainAddress(
    @CurrentUser() user: User,
    @Body() body: UpdateBlockchainAddressRequest,
  ): Promise<UserResponse> {
    const updated = await this.updateBlockchainAddress.execute(
      user.id,
      body.blockchainAddress,
    );
    return toUserResponse(updated);
  }

  /** Centres d'intérêt de l'utilisateur courant. */
  @Get('me/interests')
  @ApiOperation({ summary: 'Lister ses centres d’intérêt' })
  async myInterests(
    @CurrentUser() user: User,
  ): Promise<{ interestIds: string[] }> {
    return { interestIds: await this.getMyInterests.execute(user.id) };
  }

  /** Remplace les centres d'intérêt de l'utilisateur courant. */
  @Put('me/interests')
  @ApiOperation({ summary: 'Mettre à jour ses centres d’intérêt' })
  async updateMyInterestsEndpoint(
    @CurrentUser() user: User,
    @Body() body: UpdateInterestsRequest,
  ): Promise<{ interestIds: string[] }> {
    await this.updateMyInterests.execute(user.id, body.interestIds);
    return { interestIds: body.interestIds };
  }

  /** Historique d'activité (likes/supports/events par jour + score de support cumulé). */
  @Get('me/activity-history')
  @ApiOperation({ summary: "Mon historique d'activité (dashboard)" })
  @ApiOkResponse({ type: ActivityPointResponse, isArray: true })
  myActivityHistory(
    @CurrentUser() user: User,
    @Query() query: HistoryRangeQuery,
  ): Promise<ActivityPointResponse[]> {
    return this.getMyActivityHistory.execute(user.id, query.days);
  }

  /** Liste paginée des utilisateurs — admin uniquement. */
  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Lister les utilisateurs (admin)' })
  @ApiOkResponse({ type: PaginatedUsersResponse })
  async findAll(
    @Query() query: ListUsersQuery,
  ): Promise<PaginatedUsersResponse> {
    const { users, total } = await this.getAllUsers.execute(query);
    return {
      users: users.map((entry) => toUserResponse(entry.user, entry.banned)),
      total,
    };
  }

  /** Liste des bans utilisateurs — admin uniquement. */
  @Get('admin/bans')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Lister les bans utilisateurs (admin)' })
  @ApiOkResponse({ type: PaginatedUserBansResponse })
  async bans(
    @Query() query: ListBansQuery,
  ): Promise<PaginatedUserBansResponse> {
    const { bans, total } = await this.listUserBans.execute(query);
    return { bans: bans.map(toUserBanResponse), total };
  }

  /** Bannit un utilisateur — admin uniquement. */
  @Post(':id/ban')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Bannir un utilisateur (admin)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ type: UserBanResponse })
  async ban(
    @CurrentUser() admin: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: BanUserRequest,
  ): Promise<UserBanResponse> {
    const ban = await this.banUser.execute(admin.id, id, body);
    return toUserBanResponse({
      ban,
      username: null,
      bannedByUsername: admin.username,
    });
  }

  /** Lève le ban actif d'un utilisateur — admin uniquement. */
  @Delete(':id/ban')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Lever le ban d’un utilisateur (admin)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async unban(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    await this.unbanUser.execute(id);
    return { message: 'Ban lifted' };
  }
}
