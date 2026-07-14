import { Injectable } from '@nestjs/common';
import { BrandRepository } from '../../domain/brand.repository';
import { BrandBanRepository } from '../../domain/brand-ban.repository';
import { BrandBan } from '../../domain/brand-ban';
import {
  BrandAlreadyBannedError,
  BrandNotFoundError,
} from '../../domain/brand.errors';
import { NotificationRepository } from '../../../notifications/domain/notification.repository';
import { BanBrandRequest } from '../dto/ban-brand.request';
import { bestEffort } from '../../../../shared/application/best-effort';

/**
 * D8 : le front a déjà passé les tx on-chain (blacklist + éventuel
 * cancel-sale) avant d'appeler cette route — ce use-case ne fait qu'auditer
 * en DB et notifier le propriétaire. Pas de `TransactionRunner` : une seule
 * table écrite, la notification est une best-effort secondaire.
 */
@Injectable()
export class BanBrandUseCase {
  constructor(
    private readonly brandRepository: BrandRepository,
    private readonly brandBans: BrandBanRepository,
    private readonly notifications: NotificationRepository,
  ) {}

  async execute(
    adminId: string,
    brandId: string,
    body: BanBrandRequest,
  ): Promise<BrandBan> {
    const brand = await this.brandRepository.findById(brandId);
    if (!brand) throw new BrandNotFoundError();

    const existing = await this.brandBans.findActive(brandId);
    if (existing) throw new BrandAlreadyBannedError();

    const ban = await this.brandBans.create({
      brandId,
      reason: body.reason,
      bannedBy: adminId,
      isPermanent: body.isPermanent,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      notes: body.notes ?? null,
      blacklistTxHash: body.blacklistTxHash ?? null,
      cancelSaleTxHash: body.cancelSaleTxHash ?? null,
    });

    await bestEffort('brand banned notification', () =>
      this.notifications.create({
        userId: brand.ownerId,
        type: 'brand_banned',
        title: 'Your brand has been banned',
        body: body.reason,
        createdBy: adminId,
      }),
    );

    return ban;
  }
}
