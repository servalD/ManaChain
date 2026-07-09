import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DatabaseContext } from '../../../infrastructure/database/database-context';
import { EventContracts } from '../domain/event-contracts';
import {
  CreateEventContractsParams,
  EventContractsRepository,
} from '../domain/event-contracts.repository';
import { EventContractsOrmEntity } from './event-contracts.orm-entity';

@Injectable()
export class TypeOrmEventContractsRepository extends EventContractsRepository {
  constructor(private readonly db: DatabaseContext) {
    super();
  }

  private get repository(): Repository<EventContractsOrmEntity> {
    return this.db.getRepository(EventContractsOrmEntity);
  }

  async findByEventTicketsAddress(
    eventTicketsAddress: string,
  ): Promise<EventContracts | null> {
    const entity = await this.repository.findOne({
      where: { eventTicketsAddress },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async create(params: CreateEventContractsParams): Promise<EventContracts> {
    const saved = await this.repository.save(
      this.repository.create({
        eventTicketsAddress: params.eventTicketsAddress,
        brandAddress: params.brandAddress,
        deployTxHash: params.deployTxHash,
        blockNumber: params.blockNumber.toString(),
      }),
    );
    return this.toDomain(saved);
  }

  async setTicketSaleAddress(
    eventTicketsAddress: string,
    ticketSaleAddress: string,
  ): Promise<void> {
    await this.repository.update(
      { eventTicketsAddress },
      { ticketSaleAddress },
    );
  }

  async listEventTicketsAddresses(): Promise<string[]> {
    const rows = await this.repository.find({
      select: ['eventTicketsAddress'],
    });
    return rows.map((r) => r.eventTicketsAddress);
  }

  async listTicketSaleAddresses(): Promise<string[]> {
    const rows = await this.repository.find({ select: ['ticketSaleAddress'] });
    return rows.map((r) => r.ticketSaleAddress).filter((a): a is string => !!a);
  }

  private toDomain(e: EventContractsOrmEntity): EventContracts {
    return new EventContracts(
      e.eventTicketsAddress,
      e.brandAddress,
      e.ticketSaleAddress,
      e.deployTxHash,
      BigInt(e.blockNumber),
      e.createdAt,
      e.updatedAt,
    );
  }
}
