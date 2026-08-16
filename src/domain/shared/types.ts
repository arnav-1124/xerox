/**
 * Xerox Domain Shared Types & State Specifications
 */

export type VaultState =
  | 'uninitialized'
  | 'locked'
  | 'unlocking'
  | 'unlocked'
  | 'locking'
  | 'error';

export type ViewMode =
  | 'home'
  | 'bookmarks'
  | 'passwords'
  | 'notes'
  | 'cards'
  | 'identities'
  | 'favorites'
  | 'categories'
  | 'generator'
  | 'import-export'
  | 'settings'
  | 'extension'
  | 'security-audit'
  | 'files'
  | 'totp'
  | 'blog';

export interface VaultSettings {
  autoLockMinutes: number; // 5, 15, 30, 60, 0 (Never)
  requireConfirmationForAutofill: boolean;
  trustedDomains: string[];
  lastUnlockedTime?: number;
  lastBackupTime?: number;
}
