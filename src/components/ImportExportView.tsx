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
  passwords: PasswordEntry[];
  bookmarks: Bookmark[];
  isUnlocked: boolean;
  onUnlockVaultClick: () => void;
  onImportEntries: (importedPasswords: PasswordEntry[], importedBookmarks?: Bookmark[]) => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ImportExportView: React.FC<ImportExportViewProps> = ({
  passwords,
  bookmarks,
  isUnlocked,
  onUnlockVaultClick,
  onImportEntries,
  addToast,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // 1. Export CSV
  const handleExportCSV = () => {
    if (!isUnlocked) {
      addToast('Please unlock your vault before exporting decrypted credentials.', 'error');
      return;
    }

    if (passwords.length === 0) {
      addToast('No passwords found in vault to export.', 'info');
      return;
    }

    const headers = ['websiteName', 'websiteUrl', 'username', 'password', 'category', 'notes'];
    const rows = passwords.map((p) => [
      `"${(p.websiteName || '').replace(/"/g, '""')}"`,
      `"${(p.websiteUrl || '').replace(/"/g, '""')}"`,
      `"${(p.username || '').replace(/"/g, '""')}"`,
      `"${(p.password || '').replace(/"/g, '""')}"`,
      `"${(p.category || '').replace(/"/g, '""')}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `xerox-vault-passwords-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Successfully downloaded CSV passwords backup.', 'success');
  };

  // 2. Export Full JSON Backup
  const handleExportJSON = () => {
    if (!isUnlocked) {
      addToast('Please unlock your vault before exporting credentials.', 'error');
      return;
    }

    const exportData = {
      version: 2,
      exportDate: new Date().toISOString(),
      passwords,
      bookmarks,
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `xerox-vault-full-backup-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Successfully exported full vault JSON backup file.', 'success');
  };

  // 3. Handle File Upload Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isUnlocked) {
      addToast('Please unlock your vault before importing credentials.', 'error');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        if (!text) return;

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed.passwords)) {
            onImportEntries(parsed.passwords, parsed.bookmarks || []);
            addToast(`Successfully imported ${parsed.passwords.length} password entries from JSON backup!`, 'success');
          } else if (Array.isArray(parsed)) {
            onImportEntries(parsed);
            addToast(`Successfully imported ${parsed.length} entries from JSON array!`, 'success');
          } else {
            addToast('Invalid JSON structure. Expected passwords array.', 'error');
          }
        } else if (file.name.endsWith('.csv') || text.includes(',')) {
          // Parse CSV
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (lines.length < 2) {
            addToast('CSV file is empty or missing data rows.', 'error');
            return;
          }

          const headerLine = lines[0].toLowerCase();
          const importedPasswords: PasswordEntry[] = [];

          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
            if (cols.length < 3) continue;

            // Map common CSV columns (Chrome: name, url, username, password | Bitwarden: folder, favorite, type, name, notes, fields, login_uri, login_username, login_password)
            let name = cols[0] || 'Imported Site';
            let url = cols[1] || '';
            let user = cols[2] || '';
            let pass = cols[3] || '';

            if (headerLine.includes('url') && headerLine.includes('username') && headerLine.includes('password')) {
              // Standard layout
              name = cols[0] || 'Imported Entry';
              url = cols[1] || '';
              user = cols[2] || '';
              pass = cols[3] || '';
            }

            if (pass) {
              importedPasswords.push({
                id: 'imp-' + Date.now() + '-' + i,
                websiteName: name,
                websiteUrl: url.startsWith('http') ? url : url ? 'https://' + url : '',
                username: user,
                password: pass,
                category: 'Imported',
                isFavorite: false,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              });
            }
          }

          if (importedPasswords.length > 0) {
            onImportEntries(importedPasswords);
            addToast(`Successfully imported ${importedPasswords.length} credentials from CSV!`, 'success');
          } else {
            addToast('Could not parse any valid password rows from CSV.', 'error');
          }
        }
      } catch (err) {
        console.error('Import failed', err);
        addToast('Failed to parse import file.', 'error');
      }
    };

    reader.readAsText(file);
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
                Upload a CSV file exported from Google Chrome / Bitwarden / 1Password or a Xerox Vault JSON backup file.
              </p>
            </div>

            <div className="p-3 bg-muted/50 rounded-xl border border-border text-xs space-y-1">
              <span className="font-semibold text-foreground block">Supported Formats:</span>
              <ul className="text-[11px] text-muted-foreground list-disc list-inside space-y-0.5">
                <li>Chrome / Bitwarden / 1Password CSV Files</li>
                <li>Xerox Vault Native JSON Backups</li>
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
                Download a local backup copy of your decrypted password vault or bookmarks database.
              </p>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl text-xs space-y-1">
              <span className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Security Warning:
              </span>
              <p className="text-[11px] leading-relaxed">
                Exported CSV/JSON files contain unencrypted passwords. Store exported backup files in a secure offline drive.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleExportCSV}
              className="py-2.5 px-3 rounded-xl bg-secondary border border-border hover:bg-accent text-secondary-foreground font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Export Passwords (CSV)</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="py-2.5 px-3 rounded-xl bg-secondary border border-border hover:bg-accent text-secondary-foreground font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileJson className="w-4 h-4 text-blue-500" />
              <span>Full Vault (JSON)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
