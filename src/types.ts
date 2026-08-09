export interface Bookmark {
  id: string;
  title: string;
  url: string;
  category: string;
  description?: string;
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
  customIcon?: string;
}

export interface PasswordHistoryItem {
  id: string;
  password: string;
  updatedAt: number;
}

export interface PasswordEntry {
  id: string;
  websiteName: string;
  websiteUrl: string;
  username: string;
  password: string; // Plaintext when decrypted in memory
  notes?: string;
  category: string;
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
  history?: PasswordHistoryItem[];
  totpSecret?: string; // Base32 TOTP secret key for 2FA codes
  entryType?: 'login' | 'card' | 'note'; // Item type
  cardDetails?: {
    cardNumber?: string;
    cardholderName?: string;
    expiryMonth?: string;
    expiryYear?: string;
    cvv?: string;
  };
}

export interface EncryptedVaultData {
  cipherText: string;
  iv: string;
  salt: string;
  version: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  name: string;
  color?: string;
  isDefault?: boolean;
}

export interface VaultSettings {
  autoLockMinutes: number; // 5, 15, 30, 60, 0 (Never)
  requireConfirmationForAutofill: boolean;
  trustedDomains: string[];
  lastUnlockedTime?: number;
}

export interface EncryptedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string; // Base64 or encrypted data
  createdAt: number;
}

export type ViewMode =
  | 'home'
  | 'bookmarks'
  | 'passwords'
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

