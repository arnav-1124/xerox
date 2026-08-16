import React, { useState, useEffect } from 'react';
import {
  Shield,
  Clock,
  Download,
  Upload,
  RotateCcw,
  KeyRound,
  CheckCircle2,
  Lock,
  Puzzle,
  FileJson,
  Fingerprint,
  Trash2,
} from 'lucide-react';
import { VaultSettings } from '../types';
import { defaultVaultService } from '../application/vault/VaultService';
import { registerWebAuthnCredential } from '../lib/webauthn';
import { WebAuthnProtection } from '../domain/vault/VaultEnvelope';

interface SettingsViewProps {
  settings: VaultSettings;
  onUpdateSettings: (newSettings: VaultSettings) => void;
  onExportJSON: (encrypted: boolean) => void;
  onExportCSV: () => void;
  onImportFile: (file: File) => void;
  onResetVault: () => void;
  isUnlocked: boolean;
  onOpenExtensionGuide: () => void;
  addToast?: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onExportJSON,
  onExportCSV,
  onImportFile,
  onResetVault,
  isUnlocked,
  onOpenExtensionGuide,
  addToast,
}) => {
  const [resetConfirm, setResetConfirm] = useState(false);
  const [authenticators, setAuthenticators] = useState<WebAuthnProtection[]>([]);
  const [passkeyLabel, setPasskeyLabel] = useState('');
  const [registeringModal, setRegisteringModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAuthenticators();
  }, []);

  const loadAuthenticators = async () => {
    const list = await defaultVaultService.getBiometricAuthenticators();
    setAuthenticators(list);
  };

  const handleAutoLockChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateSettings({
      ...settings,
      autoLockMinutes: Number(e.target.value),
    });
  };

  const handleRequireConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSettings({
      ...settings,
      requireConfirmationForAutofill: e.target.checked,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onImportFile(file);
    e.target.value = '';
  };

  const handleAddPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeVEK = defaultVaultService.getActiveVEK();
    if (!activeVEK) {
      addToast?.('Vault must be unlocked to register a passkey.', 'error');
      return;
    }

    setLoading(true);
    try {
      const protection = await registerWebAuthnCredential(
        passkeyLabel.trim() || 'Hardware Passkey',
        activeVEK
      );
      await defaultVaultService.addBiometricAuthenticator(protection);
      await loadAuthenticators();
      setRegisteringModal(false);
      setPasskeyLabel('');
      addToast?.('WebAuthn Passkey registered successfully!', 'success');
    } catch (err: any) {
      addToast?.(err.message || 'Passkey registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePasskey = async (credId: string) => {
    try {
      await defaultVaultService.removeBiometricAuthenticator(credId);
      await loadAuthenticators();
      addToast?.('Passkey removed successfully.', 'info');
    } catch (err: any) {
      addToast?.(err.message || 'Failed to remove passkey', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 sm:space-y-8 text-foreground">
      {/* Page Title */}
      <div className="border-b border-border pb-4">
        <h2 className="text-xl font-bold">Settings & Security Architecture</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Manage local auto-lock timer, WebAuthn PRF passkeys, encrypted backups, and extension parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security & Lock Options */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-card-foreground">Auto-Lock Timer</h3>
              <p className="text-[11px] text-muted-foreground">Lock vault after inactivity</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs text-foreground font-medium mb-1">Inactivity Timeout</label>
              <select
                value={settings.autoLockMinutes}
                onChange={handleAutoLockChange}
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-xs text-foreground outline-none focus:border-ring"
              >
                <option value={5} className="bg-popover text-popover-foreground">5 minutes</option>
                <option value={15} className="bg-popover text-popover-foreground">15 minutes (Default)</option>
                <option value={30} className="bg-popover text-popover-foreground">30 minutes</option>
                <option value={60} className="bg-popover text-popover-foreground">1 hour</option>
                <option value={0} className="bg-popover text-popover-foreground">Never (Requires Manual Lock)</option>
              </select>
            </div>

            <label className="flex items-center gap-2.5 pt-2 text-xs text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.requireConfirmationForAutofill}
                onChange={handleRequireConfirmChange}
                className="rounded border-border text-primary focus:ring-ring"
              />
              <span>Require confirmation before autofilling extension</span>
            </label>
          </div>
        </div>

        {/* Biometric WebAuthn PRF Unlock */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center">
              <Fingerprint className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-card-foreground">Biometric & Passkey Unlock</h3>
              <p className="text-[11px] text-muted-foreground">Touch ID / Windows Hello / YubiKey (WebAuthn PRF)</p>
            </div>
          </div>

          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-[11px] text-purple-700 dark:text-purple-300 leading-relaxed">
            Biometric unlock protects access to a cryptographic key wrapper using WebAuthn PRF extension. Your Master Password is <strong>never stored</strong>.
          </div>

          <div className="space-y-2">
            {authenticators.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No passkeys currently registered.</p>
            ) : (
              authenticators.map((auth) => (
                <div key={auth.credentialId} className="flex items-center justify-between p-2.5 rounded-xl bg-muted border border-border text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-semibold">{auth.label || 'Passkey'}</span>
                  </div>
                  <button
                    onClick={() => handleRemovePasskey(auth.credentialId)}
                    className="text-muted-foreground hover:text-destructive p-1 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => setRegisteringModal(true)}
            disabled={!isUnlocked}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            Register New Passkey
          </button>
        </div>
      </div>

      {/* Passkey Registration Modal */}
      {registeringModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-sm bg-popover border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Register WebAuthn Passkey</h3>
            <p className="text-xs text-muted-foreground">
              Touch your fingerprint sensor, Face ID, or Security Key to derive a hardware key wrapper.
            </p>
            <form onSubmit={handleAddPasskey} className="space-y-3">
              <input
                type="text"
                value={passkeyLabel}
                onChange={(e) => setPasskeyLabel(e.target.value)}
                placeholder="Passkey Name (e.g., Touch ID, YubiKey)"
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-xs text-foreground outline-none"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 transition cursor-pointer"
                >
                  {loading ? 'Authenticating...' : 'Authenticate & Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setRegisteringModal(false)}
                  className="py-2 px-4 rounded-xl bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Multi-Device Readiness / Sync Settings */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-card-foreground">Multi-Device & Sync Status</h3>
            <p className="text-[11px] text-muted-foreground">Local-first zero-knowledge device architecture</p>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">
            <span>Active Storage Mode</span>
            <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Local-Only (Active)</span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted border border-border text-muted-foreground">
            <span>Encrypted Cloud Sync</span>
            <span className="bg-muted-foreground/20 text-muted-foreground text-[10px] px-2 py-0.5 rounded-full font-semibold">Coming Later</span>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Your vault is stored locally on this device. No account or central cloud server is required.
        </p>
      </div>

      {/* Extension & Data Management */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
            <Puzzle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-card-foreground">Browser Extension Package</h3>
            <p className="text-[11px] text-muted-foreground">Manifest V3 Extension with real browser autofill</p>
          </div>
        </div>

        <button
          onClick={onOpenExtensionGuide}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-sm cursor-pointer"
        >
          Open Extension Installation & Security Guide
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-destructive">Reset Vault</h3>
            <p className="text-[11px] text-muted-foreground">Permanently wipe local IndexedDB data</p>
          </div>
        </div>

        {!resetConfirm ? (
          <button
            onClick={() => setResetConfirm(true)}
            className="py-2 px-4 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-semibold border border-destructive/20 transition cursor-pointer"
          >
            Reset All Vault Data
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={onResetVault}
              className="py-2 px-4 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold transition cursor-pointer"
            >
              Confirm Wipe Vault
            </button>
            <button
              onClick={() => setResetConfirm(false)}
              className="py-2 px-4 rounded-xl bg-muted text-foreground text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
