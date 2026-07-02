import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
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
import { UpdateUserRequest } from '../application/dto/update-user.request';
import { UpdateBlockchainAddressRequest } from '../application/dto/update-blockchain-address.request';
import { UpdateInterestsRequest } from '../application/dto/update-interests.request';
import { ListUsersQuery } from '../application/dto/list-users.query';
import {
  PaginatedUsersResponse,
  toUserResponse,
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

  /** Liste paginée des utilisateurs — admin uniquement. */
  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Lister les utilisateurs (admin)' })
  @ApiOkResponse({ type: PaginatedUsersResponse })
  async findAll(
    @Query() query: ListUsersQuery,
  ): Promise<PaginatedUsersResponse> {
    const { users, total } = await this.getAllUsers.execute(query);
    return { users: users.map(toUserResponse), total };
  }
}
