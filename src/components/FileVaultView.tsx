import React, { useState, useEffect } from 'react';
import { EncryptedFile } from '../types';
import { getEncryptedFiles, saveEncryptedFile, deleteEncryptedFileDB } from '../lib/db';
import { compressAndEncryptFile, decryptAndDecompressFile, decryptWithoutDecompress } from '../lib/fileCrypto';
import {
  Shield,
  Upload,
  FileText,
  Download,
  Trash2,
  Lock,
  Unlock,
  FileCheck,
  AlertCircle,
  Loader2,
  HardDriveDownload,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';

interface Props {
  addToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  derivedKey: any;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    isDestructive?: boolean,
    confirmText?: string
  ) => void;
  onUnlockClick?: () => void;
}

export function FileVaultView({ addToast, derivedKey, showConfirm, onUnlockClick }: Props) {
  const [files, setFiles] = useState<EncryptedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
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
    if (!derivedKey) {
      addToast('Please unlock your vault first to encrypt files.', 'error');
      if (onUnlockClick) onUnlockClick();
      return;
    }

    setIsProcessing(true);
    try {
      for (const file of fileList) {
        if (file.size > 15 * 1024 * 1024) {
          addToast(`File ${file.name} is too large (Max 15MB for local store)`, 'error');
          continue;
        }

        // Compress and encrypt client-side
        const { encryptedBlob, iv, salt, compressedSize } = await compressAndEncryptFile(file, derivedKey);

        const newFile: EncryptedFile = {
          id: 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          name: file.name,
          size: file.size, // Original uncompressed size
          compressedSize: compressedSize, // Compressed size
          type: file.type || 'application/octet-stream',
          data: encryptedBlob, // Encrypted binary Blob
          iv,
          salt,
          createdAt: Date.now(),
        };

        await saveEncryptedFile(newFile);
        addToast(`Successfully compressed, encrypted, and stored ${file.name} locally!`, 'success');
      }
      await loadFiles();
    } catch (e: any) {
      console.error(e);
      addToast(`Failed to encrypt and store file: ${e.message || e}`, 'error');
    } finally {
      setIsProcessing(false);
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

  const handleDownload = async (file: EncryptedFile, forceCompressed = false) => {
    if (!derivedKey) {
      addToast('Please unlock your vault first to decrypt files.', 'error');
      if (onUnlockClick) onUnlockClick();
      return;
    }

    try {
      let blob: Blob;
      let filename = file.name;

      // Check if file is encrypted (has metadata headers)
      if (file.iv && file.salt) {
        if (forceCompressed) {
          blob = await decryptWithoutDecompress(file.data, file.iv, file.salt, derivedKey);
          filename = file.name + '.gz';
        } else {
          blob = await decryptAndDecompressFile(file.data, file.iv, file.salt, derivedKey);
        }
      } else {
        // Fallback for legacy (unencrypted) files
        if (file.data instanceof Blob) {
          blob = file.data;
        } else {
          const parts = file.data.split(';base64,');
          const raw = parts[1] || parts[0];
          const contentType = parts[0].split(':')[1] || file.type;
          const rawData = atob(raw);
          const rawLength = rawData.length;
          const uInt8Array = new Uint8Array(rawLength);
          for (let i = 0; i < rawLength; ++i) {
            uInt8Array[i] = rawData.charCodeAt(i);
          }
          blob = new Blob([uInt8Array], { type: contentType });
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast(`Decrypted and downloaded ${filename}`, 'success');
    } catch (err: any) {
      console.error(err);
      addToast(`Failed to decrypt and download file: ${err.message || err}`, 'error');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Locked View
  if (!derivedKey) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded bg-secondary border border-border flex items-center justify-center mx-auto shadow-xs">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">File Vault is Locked</h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Unlock your credentials vault with your Master Password to access, encrypt, and view stored documents.
          </p>
        </div>
        {onUnlockClick && (
          <button
            onClick={onUnlockClick}
            className="px-5 py-2 bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 rounded cursor-pointer animate-pulse"
          >
            <Unlock className="w-3.5 h-3.5" />
            Unlock Vault
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-500" />
            <span>Encrypted File & Document Vault</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Store passport scans, SSH credentials, certificates, and private documents compressed & encrypted client-side locally in IndexedDB.
          </p>
        </div>
        <label className="cursor-pointer inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded shadow-xs hover:opacity-90 transition cursor-pointer self-start md:self-auto text-xs">
          <Upload className="w-3.5 h-3.5" />
          <span>Upload File</span>
          <input type="file" onChange={handleFileUpload} className="hidden" multiple disabled={isProcessing} />
        </label>
      </div>

      {/* Drag & Drop Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(Array.from(e.dataTransfer.files));
          }
        }}
        className={`border border-dashed rounded p-8 text-center transition ${
          isDragging
            ? 'border-emerald-500 bg-emerald-500/10'
            : 'border-border bg-card/50 hover:border-muted-foreground/30'
        }`}
      >
        <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded flex items-center justify-center mx-auto mb-3">
          <Lock className="w-5 h-5" />
        </div>
        <h3 className="text-xs font-semibold text-foreground">Drag & Drop sensitive documents here</h3>
        <p className="text-[11px] text-muted-foreground mt-1.5">
          Files are compressed with GZIP, encrypted with AES-256-GCM, and stored only on this browser device. Max file size: 15MB.
        </p>
      </div>

      {/* Processing Loader */}
      {isProcessing && (
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
          <span className="text-xs font-semibold text-foreground">
            Compressing & encrypting documents client-side...
          </span>
        </div>
      )}

      {/* File List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <FileCheck className="w-4.5 h-4.5 text-emerald-500" />
          <span>Stored Encrypted Files ({files.length})</span>
        </h2>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-xs">Loading secure files...</div>
        ) : files.length === 0 ? (
          <div className="bg-card border border-border rounded p-12 text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium text-xs">No files stored in your secure vault yet.</p>
            <p className="text-[10px] text-muted-foreground mt-1">Upload your confidential documents above to keep them encrypted.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => {
              const hasCompression = file.compressedSize !== undefined && file.compressedSize < file.size;
              const savings = hasCompression
                ? Math.max(0, Math.round(((file.size - file.compressedSize!) / file.size) * 100))
                : 0;

              return (
                <div
                  key={file.id}
                  className="bg-card border border-border rounded p-4 flex flex-col justify-between group hover:border-amber-500/30 transition shadow-2xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-9 h-9 rounded bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4.5 h-4.5" />
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {formatSize(file.size)}
                        </span>
                        {hasCompression && (
                          <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded" title={`Compressed size: ${formatSize(file.compressedSize!)}`}>
                            <TrendingDown className="w-2.5 h-2.5" />
                            <span>Saved {savings}%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <h3 className="font-bold text-foreground text-xs truncate mb-1" title={file.name}>
                      {file.name}
                    </h3>
                    
                    <div className="space-y-1 mt-1 text-[10px] text-muted-foreground font-mono">
                      <div>Added: {new Date(file.createdAt).toLocaleDateString()}</div>
                      {hasCompression && (
                        <div className="flex items-center gap-1.5 text-[9px]">
                          <span>{formatSize(file.size)}</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                          <span className="font-bold text-foreground">{formatSize(file.compressedSize!)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-5 pt-4 border-t border-border">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(file, false)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-muted hover:bg-accent text-foreground border border-border rounded text-[10px] font-bold transition cursor-pointer"
                        title="Decrypt and restore uncompressed original file"
                      >
                        <HardDriveDownload className="w-3.5 h-3.5" />
                        Original
                      </button>
                      {file.iv && (
                        <button
                          onClick={() => handleDownload(file, true)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold transition cursor-pointer"
                          title="Download the compressed GZIP archive directly"
                        >
                          <TrendingDown className="w-3.5 h-3.5" />
                          Compressed (.gz)
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(file.id, file.name)}
                      className="w-full flex items-center justify-center gap-1.5 py-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition cursor-pointer text-[10px]"
                      title="Delete file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete File
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
