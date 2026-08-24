import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Copy, ShieldCheck, Check, Loader2 } from 'lucide-react';
import { generateSecurePassword, calculatePasswordStrength, PasswordGeneratorOptions } from '../lib/crypto';
import { VaultSettings } from '../types';

interface PasswordGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPassword?: (password: string) => void;
  onSelectEmail?: (email: string) => void;
  settings?: VaultSettings;
}

export const PasswordGeneratorModal: React.FC<PasswordGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSelectPassword,
  onSelectEmail,
  settings,
}) => {
  const [options, setOptions] = useState<PasswordGeneratorOptions>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: true,
  });

  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  // DuckDuckGo Alias Generator States
  const [generateEmail, setGenerateEmail] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');

  const fetchDuckEmail = async () => {
    if (!settings?.duckEnabled || !settings?.duckToken) return;
    setIsGeneratingEmail(true);
    setEmailError('');
    try {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiUrl = isLocal 
        ? 'https://xerox-orcin.vercel.app/api/duck-alias' 
        : '/api/duck-alias';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.duckToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate alias');
      }

      const data = await response.json();
      if (data && data.address) {
        setGeneratedEmail(`${data.address}@duck.com`);
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err: any) {
      console.error(err);
      setEmailError(err.message || 'Error generating Duck email');
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const generate = () => {
    const pwd = generateSecurePassword(options);
    setPassword(pwd);
    setCopied(false);
  };

  const handleRegenerate = () => {
    generate();
    if (generateEmail) {
      fetchDuckEmail();
    }
  };

  useEffect(() => {
    if (isOpen) {
      generate();
      // Reset email state when generator modal is opened
      setGeneratedEmail('');
      setGenerateEmail(false);
      setEmailError('');
    }
  }, [isOpen]);

  // Regenerate password when options (checkboxes/slider) change, but do NOT fetch email
  useEffect(() => {
    if (isOpen) {
      generate();
    }
  }, [options]);

  if (!isOpen) return null;

  const strength = calculatePasswordStrength(password);

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (onSelectPassword) {
      onSelectPassword(password);
    }
    if (generateEmail && generatedEmail && onSelectEmail) {
      onSelectEmail(generatedEmail);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-popover border border-border rounded-2xl p-6 shadow-2xl text-popover-foreground relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Password Generator</h3>
            <p className="text-xs text-muted-foreground">Cryptographically secure random password generation.</p>
          </div>
        </div>

        {/* Generated Output Box */}
        <div className="space-y-3 mb-5">
          <div className="relative bg-muted border border-border rounded-xl p-3.5 flex items-center justify-between gap-3">
            <span className="font-mono text-sm sm:text-base font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider break-all select-all">
              {password}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleRegenerate}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Regenerate"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-500 hover:bg-accent transition-colors"
                title="Copy to Clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Strength Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
              <span>Entropy Strength</span>
              <span style={{ color: strength.color }}>{strength.label}</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300 rounded-full"
                style={{ width: `${strength.score}%`, backgroundColor: strength.color }}
              />
            </div>
          </div>

          {/* DuckDuckGo Email Protection Alias Generator */}
          {settings?.duckEnabled && settings?.duckToken && (
            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground select-none">
                <input
                  type="checkbox"
                  checked={generateEmail}
                  onChange={(e) => {
                    setGenerateEmail(e.target.checked);
                    if (e.target.checked && !generatedEmail) {
                      fetchDuckEmail();
                    }
                  }}
                  className="rounded border-border text-blue-600 focus:ring-0 text-xs"
                />
                <span>Generate Private Duck Email Address</span>
              </label>

              {generateEmail && (
                <div className="flex items-center justify-between gap-2 bg-muted border border-border rounded-lg p-2 font-mono text-xs text-foreground min-h-[36px]">
                  {isGeneratingEmail ? (
                    <span className="text-muted-foreground flex items-center gap-1.5 animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                      Generating @duck.com alias...
                    </span>
                  ) : emailError ? (
                    <span className="text-destructive font-sans">{emailError}</span>
                  ) : generatedEmail ? (
                    <>
                      <span className="font-semibold text-amber-600 dark:text-amber-400 select-all">
                        {generatedEmail}
                      </span>
                      <button
                        onClick={fetchDuckEmail}
                        className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title="Regenerate Duck Email"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <span className="text-muted-foreground italic">No email generated.</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4 text-xs">
          {/* Length Slider */}
          <div>
            <div className="flex justify-between text-foreground font-medium mb-1.5">
              <span>Length: {options.length} characters</span>
            </div>
            <input
              type="range"
              min={8}
              max={64}
              value={options.length}
              onChange={(e) => setOptions((prev) => ({ ...prev, length: Number(e.target.value) }))}
              className="w-full accent-blue-600 bg-muted h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Toggle Options */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <label className="flex items-center gap-2 p-2 rounded-lg bg-muted border border-border cursor-pointer text-foreground">
              <input
                type="checkbox"
                checked={options.includeUppercase}
                onChange={(e) => setOptions((p) => ({ ...p, includeUppercase: e.target.checked }))}
                className="rounded border-border text-blue-600 focus:ring-0"
              />
              <span>Uppercase (A-Z)</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-muted border border-border cursor-pointer text-foreground">
              <input
                type="checkbox"
                checked={options.includeLowercase}
                onChange={(e) => setOptions((p) => ({ ...p, includeLowercase: e.target.checked }))}
                className="rounded border-border text-blue-600 focus:ring-0"
              />
              <span>Lowercase (a-z)</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-muted border border-border cursor-pointer text-foreground">
              <input
                type="checkbox"
                checked={options.includeNumbers}
                onChange={(e) => setOptions((p) => ({ ...p, includeNumbers: e.target.checked }))}
                className="rounded border-border text-blue-600 focus:ring-0"
              />
              <span>Numbers (0-9)</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-muted border border-border cursor-pointer text-foreground">
              <input
                type="checkbox"
                checked={options.includeSymbols}
                onChange={(e) => setOptions((p) => ({ ...p, includeSymbols: e.target.checked }))}
                className="rounded border-border text-blue-600 focus:ring-0"
              />
              <span>Symbols (!@#$)</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-5 mt-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Close
          </button>
          {onSelectPassword && (
            <button
              onClick={handleApply}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs transition-all"
            >
              Use This Password
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
