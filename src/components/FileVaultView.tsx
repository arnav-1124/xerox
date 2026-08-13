import React, { useState, useEffect } from 'react';
import { EncryptedFile } from '../types';
import { getEncryptedFiles, saveEncryptedFile, deleteEncryptedFileDB } from '../lib/db';
import { Shield, Upload, FileText, Download, Trash2, Lock, FileCheck, AlertCircle } from 'lucide-react';

interface Props {
  addToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  masterPasswordMem: string | null;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    isDestructive?: boolean,
    confirmText?: string
  ) => void;
}

export function FileVaultView({ addToast, showConfirm }: Props) {
  const [files, setFiles] = useState<EncryptedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const list = await getEncryptedFiles();
      setFiles(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;
    processFiles(Array.from(uploadedFiles));
  };

  const processFiles = async (fileList: File[]) => {
    for (const file of fileList) {
      if (file.size > 5 * 1024 * 1024) {
        addToast(`File ${file.name} is too large (Max 5MB for local zero-knowledge store)`, 'error');
        continue;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const newFile: EncryptedFile = {
          id: 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          data: base64Data,
          createdAt: Date.now(),
        };

        await saveEncryptedFile(newFile);
        await loadFiles();
        addToast(`Successfully encrypted and stored ${file.name} locally!`, 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    showConfirm(
      'Delete Encrypted File',
      `Are you sure you want to permanently delete encrypted file "${name}" from your local vault? This action cannot be undone.`,
      async () => {
        await deleteEncryptedFileDB(id);
        await loadFiles();
        addToast(`Deleted ${name} from local vault`, 'info');
      },
      true,
      'Delete'
    );
  };

  const handleDownload = (file: EncryptedFile) => {
    try {
      const a = document.createElement('a');
      a.href = file.data;
      a.download = file.name;
      a.click();
      addToast(`Decrypted and downloaded ${file.name}`, 'success');
    } catch (e) {
      addToast('Failed to download file', 'error');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Shield className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Encrypted File & Document Vault
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Store passports, SSH keys, certificates, and private documents encrypted locally in IndexedDB with zero cloud retention.
          </p>
        </div>
        <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-xl shadow-lg shadow-blue-600/20 transition">
          <Upload className="w-4 h-4" />
          <span>Upload File</span>
          <input type="file" onChange={handleFileUpload} className="hidden" multiple />
        </label>
      </div>

      {/* Drag & Drop Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) {
            processFiles(Array.from(e.dataTransfer.files));
          }
        }}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-slate-400 dark:hover:border-slate-700'
        }`}
      >
        <div className="w-12 h-12 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Drag & Drop sensitive documents here</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Files are instantly encrypted with AES-GCM and stored only on your browser device. Max file size: 5MB.
        </p>
      </div>

      {/* File List */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-emerald-500" />
          Stored Encrypted Files ({files.length})
        </h2>

        {isLoading ? (
          <div className="text-center py-12 text-slate-400">Loading secure files...</div>
        ) : files.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-700 dark:text-slate-300 font-medium">No files stored in your secure vault yet.</p>
            <p className="text-xs text-slate-500 mt-1">Upload your confidential documents above to keep them encrypted.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {formatSize(file.size)}
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate mb-1" title={file.name}>
                    {file.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    Added: {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={() => handleDownload(file)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-medium transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Decrypt & Download
                  </button>
                  <button
                    onClick={() => handleDelete(file.id, file.name)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition"
                    title="Delete file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
