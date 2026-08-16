import React, { useState, useEffect } from 'react';
import { ShieldCheck, Copy, Check, Key, AlertTriangle, X } from 'lucide-react';
import { defaultSecurityService } from '../application/security/SecurityService';
import { LocalRecoveryKit } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const RecoveryKitModal: React.FC<Props> = ({ isOpen, onClose, addToast }) => {
  const [kit, setKit] = useState<LocalRecoveryKit | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      let existing = defaultSecurityService.getRecoveryKit();
      if (!existing) {
        existing = defaultSecurityService.generateLocalRecoveryKit();
      }
      setKit(existing);
    }
  }, [isOpen]);

  if (!isOpen || !kit) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(kit.recoveryKeyHex);
    setCopied(true);
    defaultSecurityService.confirmRecoveryKitSaved();
    setKit({ ...kit, confirmedSaved: true });
    addToast('Local Recovery Key copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    const newKit = defaultSecurityService.generateLocalRecoveryKit();
    setKit(newKit);
    addToast('New Local Recovery Key generated!', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-popover border border-border rounded-2xl p-6 shadow-2xl space-y-5 relative text-foreground">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold">Xerox Emergency Recovery Kit</h3>
            <p className="text-xs text-muted-foreground">Local 256-bit emergency recovery key</p>
          </div>
        </div>

        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs space-y-1.5 text-amber-700 dark:text-amber-300">
          <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Store this key in a safe offline location!</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Xerox is 100% local-first. There is zero server-side password reset. Anyone with this 256-bit recovery key can restore local access to your vault key on this device.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-foreground">Emergency Recovery Key</label>
          <div className="p-4 rounded-xl bg-muted border border-border font-mono text-xs text-purple-600 dark:text-purple-300 break-all select-all text-center tracking-wider font-bold">
            {kit.recoveryKeyHex.match(/.{1,4}/g)?.join(' ')}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleCopy}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white transition flex items-center justify-center gap-2 cursor-pointer ${
              copied ? 'bg-emerald-600' : 'bg-purple-600 hover:bg-purple-500 shadow-sm shadow-purple-500/10'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Recovery Key'}</span>
          </button>
          <button
            onClick={handleRegenerate}
            className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border transition cursor-pointer"
          >
            Regenerate
          </button>
        </div>
      </div>
    </div>
  );
};
