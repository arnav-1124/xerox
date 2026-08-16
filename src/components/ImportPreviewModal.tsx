import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, X, ShieldAlert, FileSpreadsheet } from 'lucide-react';
import { ImportPreviewResult } from '../application/import-export/ImportExportService';

interface ImportPreviewModalProps {
  isOpen: boolean;
  preview: ImportPreviewResult | null;
  onConfirmImport: (resolution: 'import-all' | 'skip-duplicates' | 'replace-duplicates') => void;
  onCancel: () => void;
}

export const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({
  isOpen,
  preview,
  onConfirmImport,
  onCancel,
}) => {
  const [resolution, setResolution] = useState<'import-all' | 'skip-duplicates' | 'replace-duplicates'>('skip-duplicates');

  if (!isOpen || !preview) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-popover border border-border rounded-2xl p-6 shadow-2xl space-y-5 relative text-foreground">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold">Import Data Preview</h3>
            <p className="text-xs text-muted-foreground">Review parsed data before importing into your local vault</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center">
          <div className="p-2.5 bg-muted border border-border rounded-xl">
            <span className="block text-lg font-bold text-foreground">{preview.totalLogins}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Logins</span>
          </div>
          <div className="p-2.5 bg-muted border border-border rounded-xl">
            <span className="block text-lg font-bold text-foreground">{preview.totalNotes}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Notes</span>
          </div>
          <div className="p-2.5 bg-muted border border-border rounded-xl">
            <span className="block text-lg font-bold text-foreground">{preview.totalCards}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Cards</span>
          </div>
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <span className="block text-lg font-bold text-amber-600 dark:text-amber-400">{preview.duplicateCount}</span>
            <span className="text-[10px] text-amber-700 dark:text-amber-300 uppercase font-semibold">Duplicates</span>
          </div>
          <div className="p-2.5 bg-muted border border-border rounded-xl">
            <span className="block text-lg font-bold text-muted-foreground">{preview.invalidCount}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Invalid</span>
          </div>
        </div>

        {/* Duplicate Resolution Selection */}
        {preview.duplicateCount > 0 && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-foreground">Duplicate Handling</label>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted border border-border cursor-pointer">
                <input
                  type="radio"
                  name="duplicate-resolution"
                  checked={resolution === 'skip-duplicates'}
                  onChange={() => setResolution('skip-duplicates')}
                  className="text-blue-600"
                />
                <span><strong>Skip duplicates</strong> (Keep existing vault credentials)</span>
              </label>
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted border border-border cursor-pointer">
                <input
                  type="radio"
                  name="duplicate-resolution"
                  checked={resolution === 'replace-duplicates'}
                  onChange={() => setResolution('replace-duplicates')}
                  className="text-blue-600"
                />
                <span><strong>Replace duplicates</strong> (Overwrite matching credentials with imported data)</span>
              </label>
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted border border-border cursor-pointer">
                <input
                  type="radio"
                  name="duplicate-resolution"
                  checked={resolution === 'import-all'}
                  onChange={() => setResolution('import-all')}
                  className="text-blue-600"
                />
                <span><strong>Import all entries</strong> (Keep both existing and imported duplicates)</span>
              </label>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => onConfirmImport(resolution)}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition shadow-sm cursor-pointer"
          >
            Confirm & Import Data
          </button>
          <button
            onClick={onCancel}
            className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
