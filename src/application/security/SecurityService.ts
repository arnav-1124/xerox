/**
 * Security Service
 * Computes vault security score, password age, reused credentials, and manages Local Recovery Kit.
 */

import { PasswordEntry, PasswordHealthReport, PasswordHealthItem, LocalRecoveryKit } from '../../types';
import { calculatePasswordStrength } from '../../lib/crypto';

const RECOVERY_STORAGE_KEY = 'xerox_local_recovery_kit';

export class SecurityService {
  /**
   * Generates a 256-bit emergency recovery key stored in IndexedDB/localStorage.
   */
  generateLocalRecoveryKit(): LocalRecoveryKit {
    const bytes = new Uint8Array(32);
    window.crypto.getRandomValues(bytes);
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

    const kit: LocalRecoveryKit = {
      recoveryKeyHex: hex,
      createdAt: Date.now(),
      confirmedSaved: false,
    };

    localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(kit));
    return kit;
  }

  getRecoveryKit(): LocalRecoveryKit | null {
    try {
      const raw = localStorage.getItem(RECOVERY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  confirmRecoveryKitSaved(): void {
    const kit = this.getRecoveryKit();
    if (kit) {
      kit.confirmedSaved = true;
      localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(kit));
    }
  }

  revokeRecoveryKit(): void {
    localStorage.removeItem(RECOVERY_STORAGE_KEY);
  }

  /**
   * Calculates comprehensive password health report with password age and breach statistics.
   */
  auditVaultLogins(logins: PasswordEntry[]): PasswordHealthReport {
    const passwordCounts: Record<string, number> = {};
    logins.forEach((item) => {
      if (item.password) {
        passwordCounts[item.password] = (passwordCounts[item.password] || 0) + 1;
      }
    });

    const now = Date.now();
    let weakCount = 0;
    let reusedCount = 0;
    let breachedCount = 0;
    let missingTotpCount = 0;
    let oldPasswordCount = 0;

    const auditedItems: PasswordHealthItem[] = logins.map((item) => {
      const strength = calculatePasswordStrength(item.password || '');
      if (strength.label === 'Weak') weakCount++;

      const isReused = (passwordCounts[item.password || ''] || 0) > 1;
      if (isReused) reusedCount++;

      const isTotpMissing = !item.totpSecret || item.totpSecret.trim().length === 0;
      if (isTotpMissing) missingTotpCount++;

      const ageMs = now - (item.updatedAt || item.createdAt || now);
      const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
      if (ageDays > 180) oldPasswordCount++;

      return {
        id: item.id,
        websiteName: item.websiteName,
        websiteUrl: item.websiteUrl,
        username: item.username,
        score: strength.score,
        label: strength.label,
        reusedCount: passwordCounts[item.password || ''] || 1,
        isBreached: false, // Calculated via async HIBP scan
        breachCount: 0,
        missingTotp: isTotpMissing,
        passwordAgeDays: ageDays,
      };
    });

    const total = logins.length || 1;
    const scoreDeductions =
      weakCount * 15 + reusedCount * 10 + missingTotpCount * 5 + oldPasswordCount * 2;
    const overallScore = Math.max(10, Math.min(100, 100 - Math.round(scoreDeductions / total)));

    return {
      overallScore,
      totalLogins: logins.length,
      weakCount,
      reusedCount,
      breachedCount,
      missingTotpCount,
      oldPasswordCount,
      items: auditedItems,
    };
  }
}

export const defaultSecurityService = new SecurityService();
