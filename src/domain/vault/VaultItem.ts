/**
 * Extensible VaultItem Domain Abstraction
 * Supports Login, Secure Note, Credit Card, and Identity items cleanly.
 */

export type VaultItemType = 'login' | 'secure-note' | 'credit-card' | 'identity';

export interface PasswordHistoryItem {
  id: string;
  password: string;
  updatedAt: number;
}

export interface LoginPayload {
  websiteUrl: string;
  username: string;
  password: string;
  notes?: string;
  totpSecret?: string;
  history?: PasswordHistoryItem[];
}

export interface SecureNotePayload {
  content: string;
}

export interface CreditCardPayload {
  cardNumber: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  notes?: string;
}

export interface IdentityPayload {
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  documentNumber?: string;
  notes?: string;
}

export type VaultItemPayload =
  | LoginPayload
  | SecureNotePayload
  | CreditCardPayload
  | IdentityPayload;

export interface VaultItem {
  id: string;
  type: VaultItemType;
  title: string;
  categoryId?: string;
  tags?: string[];
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
  payload: VaultItemPayload;
}
