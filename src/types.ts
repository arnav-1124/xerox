import {
  VaultItem,
  VaultItemType,
  LoginPayload,
  SecureNotePayload,
  CreditCardPayload,
  IdentityPayload,
  PasswordHistoryItem,
} from './domain/vault/VaultItem';
import { Bookmark } from './domain/bookmarks/Bookmark';
import { Category, CategoryNode } from './domain/categories/Category';
import { VaultSettings, ViewMode, VaultState } from './domain/shared/types';
import { PasswordHealthItem, PasswordHealthReport, LocalRecoveryKit } from './domain/security/SecurityModels';

export * from './domain/shared/types';
export * from './domain/vault/VaultItem';
export * from './domain/bookmarks/Bookmark';
export * from './domain/categories/Category';
export * from './domain/security/SecurityModels';

export interface EncryptedVaultData {
  cipherText: string;
  iv: string;
  salt: string;
  version: number;
  updatedAt: number;
}

export interface EncryptedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  data: Blob | string;
  createdAt: number;
}

/**
 * Legacy PasswordEntry interface retained for 100% backward compatibility.
 */
export interface PasswordEntry {
  id: string;
  websiteName: string;
  websiteUrl: string;
  username: string;
  password: string;
  notes?: string;
  category: string;
  tags?: string[];
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
  history?: PasswordHistoryItem[];
  totpSecret?: string;
  entryType?: 'login' | 'card' | 'note' | 'identity';
  cardDetails?: {
    cardNumber?: string;
    cardholderName?: string;
    expiryMonth?: string;
    expiryYear?: string;
    cvv?: string;
  };
}

/**
 * Bidirectional conversion: VaultItem <-> PasswordEntry
 */
export function vaultItemToPasswordEntry(item: VaultItem): PasswordEntry {
  if (item.type === 'login') {
    const payload = item.payload as LoginPayload;
    return {
      id: item.id,
      websiteName: item.title,
      websiteUrl: payload.websiteUrl || '',
      username: payload.username || '',
      password: payload.password || '',
      notes: payload.notes || '',
      category: item.categoryId || 'General',
      tags: item.tags || [],
      isFavorite: item.isFavorite,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      history: payload.history,
      totpSecret: payload.totpSecret,
      entryType: 'login',
    };
  }

  if (item.type === 'secure-note') {
    const payload = item.payload as SecureNotePayload;
    return {
      id: item.id,
      websiteName: item.title,
      websiteUrl: '',
      username: '',
      password: '',
      notes: payload.content || '',
      category: item.categoryId || 'Notes',
      tags: item.tags || [],
      isFavorite: item.isFavorite,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      entryType: 'note',
    };
  }

  if (item.type === 'credit-card') {
    const payload = item.payload as CreditCardPayload;
    return {
      id: item.id,
      websiteName: item.title,
      websiteUrl: '',
      username: payload.cardholderName || '',
      password: payload.cardNumber || '',
      notes: payload.notes || '',
      category: item.categoryId || 'Financials',
      tags: item.tags || [],
      isFavorite: item.isFavorite,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      entryType: 'card',
      cardDetails: {
        cardNumber: payload.cardNumber,
        cardholderName: payload.cardholderName,
        expiryMonth: payload.expiryMonth,
        expiryYear: payload.expiryYear,
        cvv: payload.cvv,
      },
    };
  }

  // Default / identity fallback
  const payload = item.payload as any;
  return {
    id: item.id,
    websiteName: item.title,
    websiteUrl: '',
    username: payload.email || payload.username || '',
    password: '',
    notes: payload.notes || '',
    category: item.categoryId || 'General',
    tags: item.tags || [],
    isFavorite: item.isFavorite,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    entryType: 'identity',
  };
}

export function passwordEntryToVaultItem(entry: PasswordEntry): VaultItem {
  if (entry.entryType === 'note') {
    return {
      id: entry.id,
      type: 'secure-note',
      title: entry.websiteName,
      categoryId: entry.category,
      tags: entry.tags || [],
      isFavorite: entry.isFavorite,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      payload: {
        content: entry.notes || '',
      } as SecureNotePayload,
    };
  }

  if (entry.entryType === 'card' && entry.cardDetails) {
    return {
      id: entry.id,
      type: 'credit-card',
      title: entry.websiteName,
      categoryId: entry.category,
      tags: entry.tags || [],
      isFavorite: entry.isFavorite,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      payload: {
        cardNumber: entry.cardDetails.cardNumber || entry.password || '',
        cardholderName: entry.cardDetails.cardholderName || entry.username || '',
        expiryMonth: entry.cardDetails.expiryMonth || '',
        expiryYear: entry.cardDetails.expiryYear || '',
        cvv: entry.cardDetails.cvv || '',
        notes: entry.notes,
      } as CreditCardPayload,
    };
  }

  if (entry.entryType === 'identity') {
    return {
      id: entry.id,
      type: 'identity',
      title: entry.websiteName,
      categoryId: entry.category,
      tags: entry.tags || [],
      isFavorite: entry.isFavorite,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      payload: {
        fullName: entry.websiteName,
        email: entry.username,
        notes: entry.notes,
      } as IdentityPayload,
    };
  }

  // Default: login item
  return {
    id: entry.id,
    type: 'login',
    title: entry.websiteName,
    categoryId: entry.category,
    tags: entry.tags || [],
    isFavorite: entry.isFavorite,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    payload: {
      websiteUrl: entry.websiteUrl || '',
      username: entry.username || '',
      password: entry.password || '',
      notes: entry.notes,
      totpSecret: entry.totpSecret,
      history: entry.history,
    } as LoginPayload,
  };
}
