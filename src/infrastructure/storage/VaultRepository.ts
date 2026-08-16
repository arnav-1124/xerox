/**
 * Vault Storage Repository Abstraction & IndexedDB Adapter
 * Decouples storage details from domain/application logic.
 */

import { EncryptedVaultData } from '../../types';
import { getVaultMeta, saveVaultMeta, clearVaultMeta } from '../../lib/db';

export interface IVaultRepository {
  getVault(): Promise<EncryptedVaultData | null>;
  saveVault(vault: EncryptedVaultData): Promise<void>;
  clearVault(): Promise<void>;
}

export class IndexedDBVaultRepository implements IVaultRepository {
  async getVault(): Promise<EncryptedVaultData | null> {
    const meta = await getVaultMeta();
    if (!meta) return null;
    return meta.encryptedVault || null;
  }

  async saveVault(vault: EncryptedVaultData): Promise<void> {
    await saveVaultMeta({
      isInitialized: true,
      salt: vault.salt,
      encryptedVault: vault,
    });
  }

  async clearVault(): Promise<void> {
    await clearVaultMeta();
  }
}

export const defaultVaultRepository: IVaultRepository = new IndexedDBVaultRepository();
