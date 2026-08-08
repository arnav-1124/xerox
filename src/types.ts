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

export type ViewMode = 'home' | 'bookmarks' | 'passwords' | 'favorites' | 'categories' | 'settings' | 'extension' | 'security-audit' | 'blog';
