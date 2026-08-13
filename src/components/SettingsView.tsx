import React, { useState } from 'react';
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
} from 'lucide-react';
import { VaultSettings } from '../types';

interface SettingsViewProps {
  settings: VaultSettings;
  onUpdateSettings: (newSettings: VaultSettings) => void;
  onExportJSON: (encrypted: boolean) => void;
  onExportCSV: () => void;
  onImportFile: (file: File) => void;
  onResetVault: () => void;
  isUnlocked: boolean;
  onOpenExtensionGuide: () => void;
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
}) => {
  const [resetConfirm, setResetConfirm] = useState(false);

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

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 sm:space-y-8 text-foreground">
      {/* Page Title */}
      <div className="border-b border-border pb-4">
        <h2 className="text-xl font-bold">Settings & Security Architecture</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Manage local auto-lock timer, encrypted backup exports, and extension autofill parameters.
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
                className="rounded bg-muted border-border text-blue-600 focus:ring-0"
              />
              <span>Require user confirmation before extension autofill</span>
            </label>
          </div>
        </div>

        {/* Extension Info Card */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center">
              <Puzzle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-card-foreground">Browser Extension</h3>
              <p className="text-[11px] text-muted-foreground">Real Chrome & Edge autofill integration</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed pt-1">
            Install the Xerox Manifest V3 extension to enjoy real username & password field detection and automated autofill on websites.
          </p>

          <button
            onClick={onOpenExtensionGuide}
            className="w-full py-2 px-3 rounded-lg bg-muted hover:bg-accent border border-border text-xs font-semibold text-blue-600 dark:text-blue-300 transition-colors flex items-center justify-center gap-2"
          >
            <Puzzle className="w-3.5 h-3.5" />
            <span>Open Extension Setup & Download (.zip)</span>
          </button>
        </div>
      </div>

      {/* Encrypted Vault Backup & Restore */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-card-foreground">Encrypted Vault Backup & Migration</h3>
            <p className="text-[11px] text-muted-foreground">Export or import your vault in Encrypted JSON, Unencrypted JSON, or CSV format</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Backups exported in JSON format can be fully encrypted using AES-GCM 256-bit encryption. You can also export/import unencrypted JSON or plain CSV files (compatible with Bitwarden, Chrome, and 1Password).
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={() => onExportJSON(true)}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Encrypted Backup (JSON)</span>
          </button>

          <button
            onClick={() => onExportJSON(false)}
            className="px-4 py-2 rounded-lg bg-secondary border border-border text-foreground hover:bg-accent font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <FileJson className="w-3.5 h-3.5 text-blue-500" />
            <span>Export Unencrypted Backup (JSON)</span>
          </button>

          {isUnlocked && (
            <button
              onClick={onExportCSV}
              className="px-4 py-2 rounded-lg bg-secondary border border-border text-foreground hover:bg-accent font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-500" />
              <span>Export CSV (Passwords only)</span>
            </button>
          )}

          <label className="px-4 py-2 rounded-lg bg-muted hover:bg-accent border border-border text-foreground font-semibold text-xs cursor-pointer transition-colors flex items-center gap-2">
            <Upload className="w-3.5 h-3.5 text-blue-500" />
            <span>Import JSON / CSV</span>
            <input type="file" accept=".json,.csv" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
      </div>

      {/* Local Wipe / Reset */}
      <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-destructive/20 text-destructive flex items-center justify-center">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-destructive">Reset Local Vault</h3>
            <p className="text-[11px] text-destructive/80">Wipe all bookmarks, passwords, and local IndexedDB database</p>
          </div>
        </div>

        {!resetConfirm ? (
          <button
            onClick={() => setResetConfirm(true)}
            className="px-4 py-2 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive font-semibold text-xs border border-destructive/30 transition-colors"
          >
            Reset Entire Vault...
          </button>
        ) : (
          <div className="space-y-3 bg-destructive/15 p-4 rounded-xl border border-destructive/30">
            <p className="text-xs text-destructive font-semibold">Are you completely sure? This will permanently delete all local bookmarks and encrypted password data.</p>
            <div className="flex gap-2">
              <button
                onClick={onResetVault}
                className="px-4 py-1.5 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold text-xs"
              >
                Yes, Wipe Everything
              </button>
              <button
                onClick={() => setResetConfirm(false)}
                className="px-4 py-1.5 rounded-lg bg-secondary hover:bg-accent text-secondary-foreground font-medium text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
