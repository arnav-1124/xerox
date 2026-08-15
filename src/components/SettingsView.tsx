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
} from 'lucide-react';
import { VaultSettings } from '../types';
import {
  isWebAuthnSupported,
  isBiometricsConfigured,
  registerBiometrics,
  clearBiometricsConfig,
} from '../lib/webauthn';

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
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricsModal, setBiometricsModal] = useState(false);
  const [masterPasswordInput, setMasterPasswordInput] = useState('');
  const [biometricsLoading, setBiometricsLoading] = useState(false);

  useEffect(() => {
    setBiometricsEnabled(isBiometricsConfigured());
  }, []);

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

  const handleEnableBiometricsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterPasswordInput) return;
    setBiometricsLoading(true);

    try {
      await registerBiometrics(masterPasswordInput);
      setBiometricsEnabled(true);
      setBiometricsModal(false);
      setMasterPasswordInput('');
      addToast?.('Biometric authentication registered successfully!', 'success');
    } catch (err: any) {
      addToast?.(err.message || 'Biometric registration failed', 'error');
    } finally {
      setBiometricsLoading(false);
    }
  };

  const handleDisableBiometrics = () => {
    clearBiometricsConfig();
    setBiometricsEnabled(false);
    addToast?.('Biometric authentication disabled', 'info');
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 sm:space-y-8 text-foreground">
      {/* Page Title */}
      <div className="border-b border-border pb-4">
        <h2 className="text-xl font-bold">Settings & Security Architecture</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Manage local auto-lock timer, biometric authentication, encrypted backups, and extension parameters.
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

        {/* Biometric WebAuthn Unlock */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center">
              <Fingerprint className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-card-foreground">Biometric Unlock</h3>
              <p className="text-[11px] text-muted-foreground">Touch ID / Face ID / Windows Hello</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Unlock your Xerox Vault instantly with hardware biometrics or WebAuthn platform authenticators.
            </p>

            {biometricsEnabled ? (
              <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-purple-500" />
                  <span>Biometrics Enabled</span>
                </div>
                <button
                  onClick={handleDisableBiometrics}
                  className="text-xs text-destructive hover:underline font-medium"
                >
                  Disable
                </button>
              </div>
            ) : (
              <button
                onClick={() => setBiometricsModal(true)}
                disabled={!isUnlocked}
                className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enable Biometric Unlock
              </button>
            )}
          </div>
        </div>

        {/* Extension Integration Card */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center">
              <Puzzle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-card-foreground">Browser Extension</h3>
              <p className="text-[11px] text-muted-foreground">Manifest V3 Chrome/Edge extension</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Install the Xerox extension to autofill credentials directly inside login forms on web pages.
          </p>

          <button
            onClick={onOpenExtensionGuide}
            className="w-full py-2 px-3 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold border border-border transition cursor-pointer"
          >
            Download Extension & Setup Guide
          </button>
        </div>

        {/* Danger Zone: Reset Vault */}
        <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-destructive">Danger Zone</h3>
              <p className="text-[11px] text-muted-foreground">Purge local database</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Permanently delete all local IndexedDB bookmarks, credentials, and settings.
          </p>

          {!resetConfirm ? (
            <button
              onClick={() => setResetConfirm(true)}
              className="w-full py-2 px-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 text-xs font-semibold transition cursor-pointer"
            >
              Reset Local Vault Data
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={onResetVault}
                className="flex-1 py-2 px-3 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold shadow-xs hover:bg-destructive/90 transition cursor-pointer"
              >
                Confirm Reset
              </button>
              <button
                onClick={() => setResetConfirm(false)}
                className="py-2 px-3 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Enable Biometrics Modal */}
      {biometricsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-popover border border-border rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <Fingerprint className="w-6 h-6 text-purple-500" />
              <h3 className="font-bold text-sm">Register Biometric Unlock</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter your Master Password to bind WebAuthn biometrics (Touch ID / Face ID / Windows Hello) for passwordless vault unlock.
            </p>
            <form onSubmit={handleEnableBiometricsSubmit} className="space-y-3">
              <input
                type="password"
                required
                placeholder="Master Password"
                value={masterPasswordInput}
                onChange={(e) => setMasterPasswordInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-xs outline-none focus:border-ring"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={biometricsLoading}
                  className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer"
                >
                  {biometricsLoading ? 'Scanning...' : 'Register Scan'}
                </button>
                <button
                  type="button"
                  onClick={() => setBiometricsModal(false)}
                  className="py-2 px-4 rounded-xl bg-muted text-foreground text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
