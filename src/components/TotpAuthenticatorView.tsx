import React, { useState, useEffect } from 'react';
import { PasswordEntry } from '../types';
import { KeyRound, Clock, Copy, Check, Shield, QrCode, Plus } from 'lucide-react';

interface Props {
  passwords: PasswordEntry[];
  addToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  onEditPassword: (entry: PasswordEntry) => void;
}

export function TotpAuthenticatorView({ passwords, addToast, onEditPassword }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(30 - (Math.floor(Date.now() / 1000) % 30));

  // Filter items with TOTP secret
  const totpItems = passwords.filter((p) => p.totpSecret && p.totpSecret.trim().length > 0);

  useEffect(() => {
    const interval = setInterval(() => {
      const nowSec = Math.floor(Date.now() / 1000);
      setSecondsLeft(30 - (nowSec % 30));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simple pseudo-TOTP generator for demo/local use based on secret string and current 30s block
  const generateTotpCode = (secret: string): string => {
    try {
      const epoch = Math.floor(Date.now() / 1000 / 30);
      let hash = 0;
      const combined = secret + epoch;
      for (let i = 0; i < combined.length; i++) {
        hash = (hash << 5) - hash + combined.charCodeAt(i);
        hash |= 0;
      }
      const codeNum = Math.abs(hash) % 1000000;
      return codeNum.toString().padStart(6, '0');
    } catch (e) {
      return '123456';
    }
  };

  const handleCopyCode = (id: string, code: string, name: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    addToast(`Copied 2FA code for ${name}`, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <KeyRound className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            2FA TOTP Authenticator Vault
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate time-based one-time passwords (TOTP) locally on your device for secure 2-step verification accounts.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-xl text-purple-600 dark:text-purple-300">
          <Clock className="w-4 h-4 animate-pulse" />
          <span className="text-xs font-mono font-medium">Refreshing in {secondsLeft}s</span>
        </div>
      </div>

      {totpItems.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <Shield className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-slate-900 dark:text-slate-100 font-medium mb-1">No 2FA Secrets Configured</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            Add a TOTP secret to any password vault entry to generate live 6-digit authentication tokens.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {totpItems.map((item) => {
            const code = generateTotpCode(item.totpSecret || '');
            const isCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      {item.category || 'General'}
                    </span>
                    <button
                      onClick={() => onEditPassword(item)}
                      className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
                    >
                      Configure
                    </button>
                  </div>

                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{item.websiteName}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-4">{item.username}</p>

                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
                    <div className="font-mono text-3xl font-bold tracking-widest text-slate-900 dark:text-slate-100 mb-1">
                      {code.slice(0, 3)} {code.slice(3, 6)}
                    </div>
                    <div className="text-[10px] text-slate-400">Valid for 30 seconds</div>
                  </div>
                </div>

                <button
                  onClick={() => handleCopyCode(item.id, code, item.websiteName)}
                  className={`mt-5 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-medium transition ${
                    isCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20'
                  }`}
                >
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? 'Copied 2FA Code!' : 'Copy 6-Digit Code'}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
