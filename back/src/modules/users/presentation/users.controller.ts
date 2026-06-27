import { Body, Controller, Get, Put } from '@nestjs/common';
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
import { UpdateUserRequest } from '../application/dto/update-user.request';
import { UpdateBlockchainAddressRequest } from '../application/dto/update-blockchain-address.request';
import { toUserResponse, UserResponse } from './user.presenter';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly getAllUsers: GetAllUsersUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly updateBlockchainAddress: UpdateBlockchainAddressUseCase,
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

  /** Liste tous les utilisateurs — admin uniquement. */
  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Lister tous les utilisateurs (admin)' })
  @ApiOkResponse({ type: UserResponse, isArray: true })
  async findAll(): Promise<UserResponse[]> {
    const users = await this.getAllUsers.execute();
    return users.map(toUserResponse);
  }
}
