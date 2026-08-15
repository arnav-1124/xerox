import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, ShieldAlert, CheckCircle2, Fingerprint } from 'lucide-react';
import { isBiometricsConfigured, authenticateBiometrics, isWebAuthnSupported } from '../lib/webauthn';

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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSecs, setLockoutSecs] = useState(0);
  const [hasBiometrics, setHasBiometrics] = useState(false);

  useEffect(() => {
    setHasBiometrics(isBiometricsConfigured());
  }, [isOpen]);

  useEffect(() => {
    if (lockoutSecs <= 0) return;
    const timer = setInterval(() => {
      setLockoutSecs((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSecs]);

  if (!isOpen) return null;

  const handleBiometricUnlock = async () => {
    setError('');
    setLoading(true);
    try {
      const decryptedPwd = await authenticateBiometrics();
      const success = await onSubmitPassword(decryptedPwd, false);
      if (!success) {
        setError('Biometric authentication failed to unlock vault.');
      } else {
        setFailedAttempts(0);
        setLockoutSecs(0);
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Biometric authentication was cancelled.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSecs > 0) return;
    setError('');

    if (!password.trim()) {
      setError('Master Password cannot be empty.');
      return;
    }

    if (isInitialSetup) {
      if (password.length < 6) {
        setError('Master Password should be at least 6 characters.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Master passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      const success = await onSubmitPassword(password, isInitialSetup);
      if (!success) {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);

        let seconds = 0;
        if (nextAttempts >= 5) {
          seconds = 60;
        } else if (nextAttempts === 4) {
          seconds = 15;
        } else if (nextAttempts === 3) {
          seconds = 5;
        }

        if (seconds > 0) {
          setLockoutSecs(seconds);
          setError(`Too many failed attempts. Locked out for ${seconds} seconds.`);
        } else {
          setError('Incorrect Master Password. Please try again.');
        }
      } else {
        setFailedAttempts(0);
        setLockoutSecs(0);
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-popover border border-border rounded-2xl p-7 shadow-2xl text-popover-foreground relative">
        <div className="text-center space-y-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center mx-auto text-2xl shadow-sm">
            🔐
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {isInitialSetup ? 'Create Your Local Vault' : 'Unlock Xerox Vault'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
              {isInitialSetup
                ? 'Your master password derives an AES-GCM 256-bit key locally on your device. Zero cloud. Zero server.'
                : 'Enter your Master Password to decrypt your password vault entries in memory.'}
            </p>
          </div>
        </div>

        {isInitialSetup && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-5 text-[11px] text-amber-700 dark:text-amber-300 leading-normal flex gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-amber-800 dark:text-amber-200 mb-0.5">Zero-Recovery Local Privacy</strong>
              If you lose your Master Password, there is no server-side recovery. Keep it safe!
            </div>
          </div>
        )}

        {!isInitialSetup && hasBiometrics && (
          <button
            type="button"
            onClick={handleBiometricUnlock}
            disabled={loading}
            className="w-full mb-4 py-3 px-4 rounded-xl bg-purple-600/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-600/20 font-semibold transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            <Fingerprint className="w-5 h-5 text-purple-500" />
            <span>Unlock with Biometrics (Touch ID / Windows Hello)</span>
          </button>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-foreground font-medium mb-1.5">Master Password</label>
            <input
              type="password"
              required
              autoFocus
              placeholder="Enter Master Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={lockoutSecs > 0}
              className="w-full px-3.5 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-ring transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {isInitialSetup && (
            <div>
              <label className="block text-foreground font-medium mb-1.5">Confirm Master Password</label>
              <input
                type="password"
                required
                placeholder="Re-enter Master Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-ring transition-colors text-sm"
              />
            </div>
          )}

          {error && <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs text-center font-medium">{error}</div>}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || lockoutSecs > 0}
              className={`w-full py-2.5 px-4 rounded-xl font-semibold text-white shadow-sm transition-all flex items-center justify-center gap-2 text-xs cursor-pointer ${
                lockoutSecs > 0
                  ? 'bg-muted-foreground/30 text-muted-foreground cursor-not-allowed border border-border'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-sm shadow-blue-500/10'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>
                {loading
                  ? 'Decrypting Vault...'
                  : lockoutSecs > 0
                  ? `Locked out (${lockoutSecs}s)`
                  : isInitialSetup
                  ? 'Create Local Vault'
                  : 'Unlock Vault'}
              </span>
            </button>
          </div>

          {!isInitialSetup && onClose && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Cancel / Keep Locked
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
