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
  Cloud,
  RefreshCw,
} from 'lucide-react';
import { uploadVaultToGoogleDrive, downloadVaultFromGoogleDrive } from '../lib/googleDriveSync';
import { getVaultMeta } from '../lib/db';

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
  const [driveToken, setDriveToken] = useState(() => localStorage.getItem('xerox_gdrive_token') || '');
  const [driveLoading, setDriveLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => localStorage.getItem('xerox_gdrive_last_sync'));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onImportFile(file);
    e.target.value = '';
  };

  const handleGoogleDriveBackup = async () => {
    if (!driveToken.trim()) {
      addToast('Please enter your Google OAuth Access Token', 'error');
      return;
    }
    setDriveLoading(true);
    try {
      const meta = await getVaultMeta();
      if (!meta || !meta.encryptedVault) {
        throw new Error('No encrypted vault payload found to backup.');
      }

      const res = await uploadVaultToGoogleDrive(driveToken.trim(), meta.encryptedVault);
      localStorage.setItem('xerox_gdrive_token', driveToken.trim());
      const nowStr = new Date().toLocaleTimeString();
      localStorage.setItem('xerox_gdrive_last_sync', nowStr);
      setLastSyncTime(nowStr);
      addToast('Successfully synced encrypted vault to Google Drive!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Google Drive sync failed', 'error');
    } finally {
      setDriveLoading(false);
    }
  };

  const handleGoogleDriveRestore = async () => {
    if (!driveToken.trim()) {
      addToast('Please enter your Google OAuth Access Token', 'error');
      return;
    }
    setDriveLoading(true);
    try {
      const res = await downloadVaultFromGoogleDrive(driveToken.trim());
      if (res && res.encryptedVault) {
        const file = new File(
          [JSON.stringify(res.encryptedVault, null, 2)],
          'xerox_gdrive_backup.json',
          { type: 'application/json' }
        );
        onImportFile(file);
        addToast('Downloaded encrypted backup from Google Drive! Processing restore...', 'success');
      }
    } catch (err: any) {
      addToast(err.message || 'Google Drive restore failed', 'error');
    } finally {
      setDriveLoading(false);
    }
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
          Seamlessly backup your zero-knowledge vault or migrate passwords from Chrome, Bitwarden, 1Password, or Google Drive.
        </p>
      </div>

      {/* Cloud Sync Section */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Zero-Knowledge Google Drive Cloud Sync</h3>
              <p className="text-xs text-muted-foreground">Sync encrypted vault payload directly to your private Google Drive</p>
            </div>
          </div>
          {lastSyncTime && (
            <span className="text-[11px] text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border">
              Last synced: {lastSyncTime}
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <input
            type="password"
            placeholder="Enter Google Drive OAuth Access Token..."
            value={driveToken}
            onChange={(e) => setDriveToken(e.target.value)}
            className="flex-1 px-3.5 py-2 rounded-xl bg-muted border border-border text-xs outline-none focus:border-ring font-mono"
          />
          <div className="flex gap-2">
            <button
              onClick={handleGoogleDriveBackup}
              disabled={driveLoading}
              className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{driveLoading ? 'Syncing...' : 'Backup to Drive'}</span>
            </button>
            <button
              onClick={handleGoogleDriveRestore}
              disabled={driveLoading}
              className="py-2 px-4 rounded-xl bg-muted hover:bg-muted/80 border border-border text-foreground text-xs font-semibold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Restore from Drive</span>
            </button>
          </div>
        </div>
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
                <li>Chrome / Brave / Edge / Opera (Chromium) CSV Files</li>
                <li>Bitwarden / 1Password CSV Files</li>
                <li>Xerox Vault Native JSON Backups (Encrypted or Unencrypted)</li>
              </ul>
            </div>
          </div>

          <label className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-blue-500/10">
            <Upload className="w-4 h-4" />
            <span>Select File to Import</span>
            <input type="file" accept=".csv,.json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Export Box */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Export Vault Backups</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Download your local vault entries. We recommend the <strong>Encrypted JSON</strong> format for secure backups.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => onExportJSON(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all flex items-center justify-between cursor-pointer shadow-sm shadow-emerald-500/10"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Export Encrypted JSON (Recommended)</span>
              </div>
              <Download className="w-4 h-4 opacity-80" />
            </button>

            <button
              onClick={() => onExportCSV()}
              className="w-full py-2 px-4 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium text-xs border border-border transition-all flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>Export Passwords to CSV</span>
              </div>
              <Download className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
