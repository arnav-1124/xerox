import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';

interface BackupPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => Promise<void>;
  error: string | null;
}

export const BackupPasswordModal: React.FC<BackupPasswordModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  error,
}) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    try {
      await onSubmit(password);
      setPassword('');
    } catch (err) {
      // Handled by parent error state
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-popover border border-border rounded-2xl p-7 shadow-2xl text-popover-foreground relative">
        <div className="text-center space-y-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center mx-auto text-2xl shadow-sm">
            🔑
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Decrypt Backup File</h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
              This backup file is encrypted. Enter the Master Password that was used when creating this backup.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-foreground font-medium mb-1.5">Backup Password</label>
            <input
              type="password"
              required
              autoFocus
              placeholder="Enter Backup Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-ring transition-colors text-sm"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs text-center font-medium">
              {error}
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-foreground bg-secondary hover:bg-accent border border-border shadow-sm transition-all text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-sm transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Decrypting...' : 'Decrypt & Import'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
