import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { encryptVaultDataWithKey, decryptVaultDataWithKey } from '../lib/crypto';
import { PasswordEntry, Bookmark, Category, VaultSettings, DerivedKeyBundle } from '../types';
import {
  X,
  UploadCloud,
  DownloadCloud,
  Copy,
  Check,
  QrCode,
  Lock,
  Unlock,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';

interface DecentralizedBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  passwords: PasswordEntry[];
  bookmarks: Bookmark[];
  categories: Category[];
  settings: VaultSettings;
  derivedKey: DerivedKeyBundle | null;
  isUnlocked: boolean;
  onUnlockClick: () => void;
  onRestoreComplete: (data: any) => Promise<void>;
  addToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const DecentralizedBackupModal: React.FC<DecentralizedBackupModalProps> = ({
  isOpen,
  onClose,
  passwords,
  bookmarks,
  categories,
  settings,
  derivedKey,
  isUnlocked,
  onUnlockClick,
  onRestoreComplete,
  addToast,
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'restore'>('backup');
  const [isLoading, setIsLoading] = useState(false);
  const [cidResult, setCidResult] = useState('');
  const [restoreCid, setRestoreCid] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedCid, setCopiedCid] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Clear states on open/close
  useEffect(() => {
    if (isOpen) {
      setCidResult('');
      setRestoreCid('');
      setErrorMessage('');
      setIsLoading(false);
    }
  }, [isOpen]);

  // Generate QR code for CID on canvas
  useEffect(() => {
    if (canvasRef.current && cidResult) {
      QRCode.toCanvas(
        canvasRef.current,
        cidResult,
        {
          width: 170,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (err) => {
          if (err) console.error('QR generation error:', err);
        }
      );
    }
  }, [cidResult]);

  const handleCreateBackup = async () => {
    if (!isUnlocked || !derivedKey) {
      addToast('Please unlock your vault before running backups.', 'error');
      onUnlockClick();
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setCidResult('');

    try {
      // Pack current database state
      const backupData = {
        app: 'Lokker Password Vault',
        version: 2,
        exportedAt: new Date().toISOString(),
        passwords,
        bookmarks,
        categories,
        settings,
      };

      // Encrypt client-side
      const { cipherText, iv, salt } = await encryptVaultDataWithKey(backupData, derivedKey);
      const encryptedBundle = { cipherText, iv, salt };

      // Upload to serverless IPFS proxy
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiUrl = isLocal ? 'https://xerox-orcin.vercel.app/api/ipfs-backup' : '/api/ipfs-backup';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          encryptedData: JSON.stringify(encryptedBundle),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to upload backup payload to IPFS.');
      }

      const resData = await response.json();
      if (resData && resData.IpfsHash) {
        setCidResult(resData.IpfsHash);
        addToast('Backup pinned to decentralized web (IPFS)!', 'success');
      } else {
        throw new Error('Invalid IPFS pinning response payload.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error occurred during decentralized backup.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!isUnlocked || !derivedKey) {
      addToast('Please unlock your vault before restoring backups.', 'error');
      onUnlockClick();
      return;
    }

    if (!restoreCid.trim()) {
      addToast('Please enter a valid IPFS CID.', 'error');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // Handle mock CID fallback for local testing
      if (restoreCid === 'QmMockHash1234567890ForTestingPurposeOnly') {
        addToast('Restoring simulated local database state...', 'info');
        const simulatedRestore = {
          passwords: [
            ...passwords,
            {
              id: 'pwd-mock-restored-' + Date.now(),
              websiteName: 'Simulated Restored Site',
              username: 'restored_user',
              password: 'password123',
              category: 'General',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              tags: ['restored'],
            },
          ],
          categories,
          bookmarks,
        };
        await onRestoreComplete(simulatedRestore);
        addToast('Simulated backup restored successfully!', 'success');
        onClose();
        return;
      }

      // Fetch from public IPFS gateways with resilient fallback polling
      const gateways = [
        `https://gateway.pinata.cloud/ipfs/${restoreCid}`,
        `https://cloudflare-ipfs.com/ipfs/${restoreCid}`,
        `https://ipfs.io/ipfs/${restoreCid}`,
      ];

      let payload: any = null;
      let lastErr = '';

      for (const url of gateways) {
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
          if (res.ok) {
            payload = await res.json();
            break;
          }
        } catch (e: any) {
          lastErr = e.message || 'Fetch failed';
        }
      }

      if (!payload) {
        throw new Error(`Failed to retrieve backup from IPFS gateways. Last error: ${lastErr}`);
      }

      if (!payload.encryptedData) {
        throw new Error('Retrieved IPFS payload does not contain valid encryptedData.');
      }

      // Decrypt client-side
      const parsedBundle = JSON.parse(payload.encryptedData);
      const decrypted = await decryptVaultDataWithKey(
        parsedBundle.cipherText,
        parsedBundle.iv,
        parsedBundle.salt,
        derivedKey
      );

      if (!decrypted || !decrypted.passwords) {
        throw new Error('Decrypted backup payload is corrupted or invalid.');
      }

      await onRestoreComplete(decrypted);
      addToast('Vault database restored successfully from IPFS!', 'success');
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error occurred during decentralized restore.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCid(true);
    addToast('Copied Backup CID to clipboard', 'success');
    setTimeout(() => setCopiedCid(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-popover border border-border rounded shadow-2xl text-popover-foreground overflow-hidden flex flex-col relative">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Decentralized IPFS Backup</h3>
              <p className="text-[11px] text-muted-foreground">Permanent Web3 encrypted backups</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-border bg-muted/40">
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-3 text-center text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'backup'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-popover'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Create Backup
          </button>
          <button
            onClick={() => setActiveTab('restore')}
            className={`flex-1 py-3 text-center text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'restore'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-popover'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Restore Backup
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 bg-destructive/10 border border-destructive/20 rounded flex items-start gap-2.5">
              <AlertTriangle className="w-4.5 h-4.5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-destructive block">Operation Failed</span>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {!isUnlocked ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded bg-muted flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-foreground block">Vault is Locked</span>
                <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">
                  Please unlock your credentials vault using your Master Password first to backup or restore data.
                </p>
              </div>
              <button
                onClick={onUnlockClick}
                className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded hover:opacity-90 transition-opacity flex items-center gap-1.5 mx-auto"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Unlock Vault</span>
              </button>
            </div>
          ) : isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-foreground block">
                  {activeTab === 'backup' ? 'Encrypting & Pinning to IPFS...' : 'Fetching & Decrypting Backup...'}
                </span>
                <p className="text-[10px] text-muted-foreground">This may take a moment depending on network speed.</p>
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: BACKUP */}
              {activeTab === 'backup' && (
                <div className="space-y-4">
                  {!cidResult ? (
                    <div className="space-y-4 text-center">
                      <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded text-[11px] text-muted-foreground leading-normal text-left space-y-2">
                        <span className="font-bold text-foreground block">🛡️ Client-Side Security Assurance:</span>
                        <p>
                          Your backup payload is completely encrypted with your Master Password key **before** leaving your computer. The public IPFS server only stores an unbreakable chunk of scrambled data.
                        </p>
                      </div>
                      <button
                        onClick={handleCreateBackup}
                        className="w-full py-2.5 bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs rounded shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload Encrypted Vault to IPFS</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 text-center flex flex-col items-center animate-in fade-in duration-200">
                      <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center text-lg">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-foreground block">Backup Generated Successfully!</span>
                        <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed">
                          Save this Backup CID. Anyone with this CID and your Master Password can restore your vault.
                        </p>
                      </div>

                      {/* QR Code display */}
                      <div className="p-3 bg-white rounded border border-border mt-2">
                        <canvas ref={canvasRef} />
                      </div>

                      <div className="w-full space-y-1 text-left text-xs">
                        <span className="text-[10px] font-bold text-muted-foreground block">Backup CID</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={cidResult}
                            className="w-full px-3 py-2 bg-muted border border-border rounded font-mono text-[10px] text-muted-foreground outline-none"
                          />
                          <button
                            onClick={() => handleCopyText(cidResult)}
                            className="px-3 bg-card border border-border rounded hover:bg-accent text-muted-foreground shrink-0 transition"
                          >
                            {copiedCid ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: RESTORE */}
              {activeTab === 'restore' && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted border border-border rounded text-[11px] text-muted-foreground leading-normal space-y-2">
                    <span className="font-bold text-foreground block">⚠️ Read Before Proceeding:</span>
                    <p>
                      Restoring a backup will merge the entries with your current local vault. Any duplicate credentials will follow the **Last-Write-Wins** timestamp comparison rules.
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <label className="font-bold text-foreground block">Enter IPFS Backup CID:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. QmXoypizjW3WknFixtdKL9..."
                        value={restoreCid}
                        onChange={(e) => setRestoreCid(e.target.value.trim())}
                        className="w-full px-3 py-2 bg-card border border-border rounded font-mono text-[10px] text-foreground outline-none focus:border-ring"
                      />
                      <button
                        onClick={handleRestoreBackup}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded shadow-md shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <DownloadCloud className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
