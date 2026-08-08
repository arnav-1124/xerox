import React, { useState } from 'react';
import { X, Share2, Lock, KeyRound, Copy, CopyCheck, CheckCircle2, Shield, Eye, EyeOff } from 'lucide-react';
import { PasswordEntry } from '../types';
import { encryptSharePayload, decryptSharePayload } from '../lib/crypto';

interface SharePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: PasswordEntry | null;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SharePasswordModal: React.FC<SharePasswordModalProps> = ({
  isOpen,
  onClose,
  entry,
  addToast,
}) => {
  const [passphrase, setPassphrase] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !entry) return null;

  const handleGenerateShareLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim()) {
      addToast('Please enter a secret passphrase to encrypt the share payload', 'error');
      return;
    }

    const payload = {
      websiteName: entry.websiteName,
      websiteUrl: entry.websiteUrl,
      username: entry.username,
      password: entry.password,
      notes: entry.notes || '',
      createdAt: Date.now(),
    };

    const encryptedBase64 = await encryptSharePayload(payload, passphrase.trim());
    const origin = window.location.origin + window.location.pathname;
    const fullShareUrl = `${origin}#share=${encryptedBase64}`;

    setGeneratedUrl(fullShareUrl);
    addToast('Encrypted share link generated!', 'success');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    addToast('Share link copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-popover border border-border rounded-2xl p-6 shadow-2xl text-popover-foreground relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Secure Zero-Knowledge Share</h3>
            <p className="text-xs text-muted-foreground">
              Share <strong className="text-foreground">{entry.websiteName}</strong> without sending data to any backend server.
            </p>
          </div>
        </div>

        <div className="p-3 bg-secondary/50 rounded-xl border border-border text-xs text-muted-foreground leading-relaxed">
          The credential payload will be encrypted in your browser using a one-time passphrase. The recipient will enter the passphrase to decrypt it in RAM.
        </div>

        {!generatedUrl ? (
          <form onSubmit={handleGenerateShareLink} className="space-y-4 text-xs">
            <div>
              <label className="block text-foreground font-medium mb-1">
                One-Time Decryption Passphrase
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MySecretPassphrase123!"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-mono outline-none focus:border-ring transition-colors"
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Share this passphrase securely with the recipient (e.g. via Signal or WhatsApp).
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Generate Share Link</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-card border border-border rounded-xl space-y-2">
              <span className="font-semibold text-foreground block">Shareable Encrypted Link:</span>
              <div className="p-2 bg-muted rounded font-mono text-[10px] text-muted-foreground break-all max-h-20 overflow-y-auto">
                {generatedUrl}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setGeneratedUrl('')}
                className="px-3 py-2 text-muted-foreground hover:text-foreground text-xs"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                {copied ? <CopyCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied Link!' : 'Copy Share Link'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Modal for Receiver when opening a #share= URL
interface ReceiveShareModalProps {
  encryptedHash: string;
  onClose: () => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ReceiveShareModal: React.FC<ReceiveShareModalProps> = ({
  encryptedHash,
  onClose,
  addToast,
}) => {
  const [passphrase, setPassphrase] = useState('');
  const [decryptedData, setDecryptedData] = useState<any | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const handleDecrypt = (e: React.FormEvent) => {
    e.preventDefault();
    const data = decryptSharePayload(encryptedHash, passphrase.trim());
    if (data && data.websiteName && data.password) {
      setDecryptedData(data);
      addToast('Shared credential decrypted successfully!', 'success');
    } else {
      addToast('Invalid passphrase or corrupted share link', 'error');
    }
  };

  const handleCopyPassword = () => {
    if (decryptedData?.password) {
      navigator.clipboard.writeText(decryptedData.password);
      setCopiedPass(true);
      addToast('Password copied to clipboard', 'success');
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-popover border border-border rounded-2xl p-6 shadow-2xl text-popover-foreground relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Received Shared Credential</h3>
            <p className="text-xs text-muted-foreground">
              Enter the secret passphrase provided by the sender to decrypt in RAM.
            </p>
          </div>
        </div>

        {!decryptedData ? (
          <form onSubmit={handleDecrypt} className="space-y-4 text-xs">
            <div>
              <label className="block text-foreground font-medium mb-1">
                Enter Decryption Passphrase
              </label>
              <input
                type="password"
                required
                placeholder="Passphrase..."
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-mono outline-none focus:border-ring transition-colors"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground"
              >
                Dismiss
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Decrypt Credential
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-xs bg-card p-4 rounded-xl border border-border">
            <div className="space-y-1">
              <span className="text-xs font-bold text-foreground block">{decryptedData.websiteName}</span>
              <span className="text-[11px] text-muted-foreground font-mono block">{decryptedData.websiteUrl}</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase">Username</span>
              <div className="p-2 bg-muted rounded font-mono text-foreground text-xs">
                {decryptedData.username || 'N/A'}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase">Password</span>
              <div className="p-2 bg-muted rounded font-mono text-foreground text-xs flex items-center justify-between">
                <span>{showPassword ? decryptedData.password : '••••••••••••••••'}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {copiedPass ? <CopyCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 text-[10px] text-muted-foreground text-center">
              This shared credential exists purely in temporary memory and is never saved to your vault.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
