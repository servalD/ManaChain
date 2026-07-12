import { DecodedLog } from './chain-reader';

/** Contrat commun à tous les handlers d'event on-chain (dispatch par `eventName`). */
export interface ChainEventHandler {
  readonly eventName: string;
  handle(log: DecodedLog): Promise<void>;
}
