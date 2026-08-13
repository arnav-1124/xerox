import React, { useState } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileJson,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Database,
} from 'lucide-react';
import { PasswordEntry, Bookmark } from '../types';

interface ImportExportViewProps {
  isUnlocked: boolean;
  onUnlockVaultClick: () => void;
  onImportFile: (file: File) => void;
  onExportJSON: (encrypted: boolean) => void;
  onExportCSV: () => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ImportExportView: React.FC<ImportExportViewProps> = ({
  isUnlocked,
  onUnlockVaultClick,
  onImportFile,
  onExportJSON,
  onExportCSV,
  addToast,
}) => {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onImportFile(file);
    // Reset file input value so same file can be selected again
    e.target.value = '';
  };

  if (!isUnlocked) {
    return (
      <div className="p-12 max-w-lg mx-auto text-center space-y-6 mt-12 bg-card border border-border rounded-2xl shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto text-2xl shadow-sm">
          🔒
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">Vault Locked</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Importing and exporting credentials requires decrypting or encrypting entries with your Master Password.
          </p>
        </div>
        <button
          onClick={onUnlockVaultClick}
          className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
        >
          <Lock className="w-4 h-4" />
          <span>Unlock Vault to Access Import/Export</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 text-foreground">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[11px] font-semibold uppercase tracking-wider mb-2">
          <Database className="w-3.5 h-3.5" />
          <span>Vault Backup & Migration</span>
        </div>
        <h2 className="text-xl font-bold">Import & Export Credentials</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Seamlessly backup your zero-knowledge vault or migrate passwords from Chrome, Bitwarden, 1Password, or LastPass.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import Box */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Import Passwords & Bookmarks</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Upload a CSV file (passwords) or a Xerox Vault JSON backup file (fully encrypted or unencrypted).
              </p>
            </div>

            <div className="p-3 bg-muted/50 rounded-xl border border-border text-xs space-y-1">
              <span className="font-semibold text-foreground block">Supported Formats:</span>
              <ul className="text-[11px] text-muted-foreground list-disc list-inside space-y-0.5">
                <li>Chrome / Bitwarden / 1Password CSV Files</li>
                <li>Xerox Vault Native JSON Backups (Encrypted or Unencrypted)</li>
              </ul>
            </div>
          </div>

          <div>
            <label className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Select File to Import (CSV or JSON)</span>
              <input
                type="file"
                accept=".csv, .json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Export Box */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Export Vault Backup</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Download a local backup copy of your entire password vault, bookmarks, categories, files, and settings.
              </p>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl text-xs space-y-1">
              <span className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Security Warning:
              </span>
              <p className="text-[11px] leading-relaxed">
                Unencrypted backups contain plain-text passwords and sensitive data. Store them in a secure offline drive.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => onExportJSON(true)}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Export Encrypted Backup (JSON)</span>
            </button>

            <button
              onClick={() => onExportJSON(false)}
              className="py-2.5 px-4 rounded-xl bg-secondary border border-border hover:bg-accent text-secondary-foreground font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileJson className="w-4 h-4 text-blue-500" />
              <span>Export Unencrypted Backup (JSON)</span>
            </button>

            <button
              onClick={onExportCSV}
              className="py-2.5 px-4 rounded-xl bg-secondary border border-border hover:bg-accent text-secondary-foreground font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Export Passwords only (CSV)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
