import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { Role } from '../../../shared/enums/role.enum';
import { User } from '../../users/domain/user';
import { SendNotificationUseCase } from '../application/use-cases/send-notification.use-case';
import { ListMyNotificationsUseCase } from '../application/use-cases/list-my-notifications.use-case';
import { MarkNotificationReadUseCase } from '../application/use-cases/mark-notification-read.use-case';
import { SendNotificationRequest } from '../application/dto/send-notification.request';
import { ListNotificationsQuery } from '../application/dto/list-notifications.query';
import {
  NotificationResponse,
  PaginatedNotificationsResponse,
  SendNotificationResponse,
  toNotificationResponse,
} from './notification.presenter';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly sendNotification: SendNotificationUseCase,
    private readonly listMyNotifications: ListMyNotificationsUseCase,
    private readonly markNotificationRead: MarkNotificationReadUseCase,
  ) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Envoyer une notification (admin)' })
  @ApiCreatedResponse({ type: SendNotificationResponse })
  async send(
    @CurrentUser() admin: User,
    @Body() body: SendNotificationRequest,
  ): Promise<SendNotificationResponse> {
    const recipientCount = await this.sendNotification.execute(admin.id, body);
    return { recipientCount };
  }

  @Get('me')
  @ApiOperation({ summary: 'Mes notifications' })
  @ApiOkResponse({ type: PaginatedNotificationsResponse })
  async myNotifications(
    @CurrentUser() user: User,
    @Query() query: ListNotificationsQuery,
  ): Promise<PaginatedNotificationsResponse> {
    const { notifications, total, unreadCount } =
      await this.listMyNotifications.execute(user.id, query);
    return {
      notifications: notifications.map(toNotificationResponse),
      total,
      unreadCount,
    };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  @ApiOkResponse({ type: NotificationResponse })
  async markRead(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<NotificationResponse> {
    const notification = await this.markNotificationRead.execute(user.id, id);
    return toNotificationResponse(notification);
  }
}
