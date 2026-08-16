/**
 * Security & Recovery Kit Domain Models
 */

export interface PasswordHealthItem {
  id: string;
  websiteName: string;
  websiteUrl: string;
  username: string;
  score: number;
  label: 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  reusedCount: number;
  isBreached: boolean;
  breachCount: number;
  missingTotp: boolean;
  passwordAgeDays: number;
}

export interface PasswordHealthReport {
  overallScore: number;
  totalLogins: number;
  weakCount: number;
  reusedCount: number;
  breachedCount: number;
  missingTotpCount: number;
  oldPasswordCount: number; // > 180 days
  items: PasswordHealthItem[];
}

export interface LocalRecoveryKit {
  recoveryKeyHex: string;
  createdAt: number;
  confirmedSaved: boolean;
}
