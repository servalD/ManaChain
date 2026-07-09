/** Repository PORT de la table `chain_sync_cursor` — un curseur unique (`id = 'main'`). */
export abstract class SyncCursorRepository {
  abstract getLastProcessedBlock(id: string): Promise<bigint>;
  abstract setLastProcessedBlock(id: string, block: bigint): Promise<void>;
}
