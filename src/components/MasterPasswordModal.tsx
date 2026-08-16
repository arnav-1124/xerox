import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, ShieldAlert, Key } from 'lucide-react';
import { defaultVaultService } from '../application/vault/VaultService';

interface MasterPasswordModalProps {
  isOpen: boolean;
  isInitialSetup: boolean;
  onClose?: () => void;
  onSubmitPassword: (masterPassword: string, isSetup: boolean) => Promise<boolean>;
}

export const MasterPasswordModal: React.FC<MasterPasswordModalProps> = ({
  isOpen,
  isInitialSetup,
  onClose,
  onSubmitPassword,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSecs, setLockoutSecs] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setPassword('');
    setConfirmPassword('');
    setRecoveryKey('');
    setError('');
    setIsRecoveryMode(false);
  }, [isOpen]);

  useEffect(() => {
    if (lockoutSecs <= 0) return;
    const timer = setInterval(() => {
      setLockoutSecs((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSecs]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSecs > 0) return;
    setError('');

    if (isRecoveryMode) {
      if (!recoveryKey.trim()) {
        setError('Please enter your 256-bit Recovery Key.');
        return;
      }
      if (!password.trim()) {
        setError('Please enter a new Master Password.');
        return;
      }
      if (password.length < 8) {
        setError('New Master Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Master Passwords do not match.');
        return;
      }

      setLoading(true);
      try {
        const success = await defaultVaultService.resetMasterPasswordWithRecoveryKey(recoveryKey.trim(), password);
        if (success) {
          await onSubmitPassword(password, false);
          setPassword('');
          setConfirmPassword('');
          setRecoveryKey('');
          setIsRecoveryMode(false);
        } else {
          setError('Invalid recovery key or corrupted vault payload.');
        }
      } catch (err: any) {
        setError(err.message || 'Recovery failed.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password.trim()) {
      setError('Master Password cannot be empty.');
      return;
    }

    if (isInitialSetup) {
      if (password.length < 8) {
        setError('Master Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Master Passwords do not match.');
        return;
      }
    }

    setLoading(true);

    try {
      const success = await onSubmitPassword(password, isInitialSetup);
      if (!success) {
        const newFailCount = failedAttempts + 1;
        setFailedAttempts(newFailCount);

        if (newFailCount >= 5) {
          setLockoutSecs(60);
          setError('Too many failed attempts. Security lockout active for 60 seconds.');
        } else if (newFailCount === 4) {
          setLockoutSecs(15);
          setError('Incorrect master password. Security delay active for 15 seconds.');
        } else if (newFailCount === 3) {
          setLockoutSecs(5);
          setError('Incorrect master password. Security delay active for 5 seconds.');
        } else {
          setError('Incorrect master password. Please try again.');
        }
      } else {
        setFailedAttempts(0);
        setLockoutSecs(0);
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Unlock failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-popover border border-border rounded-2xl p-6 shadow-2xl space-y-6 relative text-foreground">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shadow-inner">
            {isRecoveryMode ? <Key className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            {isInitialSetup
              ? 'Create Master Password'
              : isRecoveryMode
              ? 'Restore Vault with Recovery Key'
              : 'Unlock Xerox Vault'}
          </h2>
          <p className="text-xs text-muted-foreground max-w-xs">
            {isInitialSetup
              ? 'Set a strong master password. This encrypts your vault locally using 256-bit AES-GCM envelope encryption.'
              : isRecoveryMode
              ? 'Enter your 256-bit emergency recovery key to unwrap your vault key and set a new master password.'
              : 'Enter your master password to decrypt your zero-knowledge local vault.'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {lockoutSecs > 0 && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-600 dark:text-amber-400 font-semibold text-center">
            Security Lockout Active: Retry in {lockoutSecs}s
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRecoveryMode && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground">Emergency Recovery Key</label>
              <input
                type="text"
                value={recoveryKey}
                onChange={(e) => setRecoveryKey(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                className="w-full px-3.5 py-2.5 rounded-xl bg-muted border border-border text-foreground font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground">
              {isRecoveryMode ? 'New Master Password' : 'Master Password'}
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={lockoutSecs > 0}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition disabled:opacity-50"
                autoFocus
              />
              <KeyRound className="w-4 h-4 absolute right-3.5 top-3 text-muted-foreground" />
            </div>
          </div>

          {(isInitialSetup || isRecoveryMode) && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground">Confirm Master Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={lockoutSecs > 0}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition disabled:opacity-50"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading || lockoutSecs > 0}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition shadow-lg shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
          >
            {loading
              ? 'Decrypting Vault...'
              : isInitialSetup
              ? 'Initialize Encrypted Vault'
              : isRecoveryMode
              ? 'Recover Vault & Reset Password'
              : 'Unlock Vault'}
          </button>
        </form>

        {!isInitialSetup && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setIsRecoveryMode(!isRecoveryMode);
                setError('');
              }}
              className="text-xs text-blue-500 hover:text-blue-400 font-medium underline transition cursor-pointer"
            >
              {isRecoveryMode ? '← Back to Master Password Unlock' : 'Forgot Master Password? Use Recovery Key'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
