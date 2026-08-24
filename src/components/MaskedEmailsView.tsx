import React, { useState } from 'react';
import { PasswordEntry } from '../types';
import { Mail, Search, Copy, Check, ExternalLink, Lock, Unlock, HelpCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface MaskedEmailsViewProps {
  passwords: PasswordEntry[];
  isUnlocked: boolean;
  onUnlockClick: () => void;
  onEditPassword: (entry: PasswordEntry) => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const MaskedEmailsView: React.FC<MaskedEmailsViewProps> = ({
  passwords,
  isUnlocked,
  onUnlockClick,
  onEditPassword,
  addToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedPassId, setCopiedPassId] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Filter passwords where the username ends with @duck.com (DuckDuckGo Email Protection)
  const maskedEmails = passwords.filter((entry) => {
    return entry.username && entry.username.toLowerCase().endsWith('@duck.com');
  });

  const filteredEmails = maskedEmails.filter((entry) => {
    return (
      entry.websiteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getFaviconUrl = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
    } catch (e) {
      return '';
    }
  };

  const handleCopyEmail = (id: string, email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    addToast('Copied masked email address', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyPassword = (id: string, pass: string) => {
    navigator.clipboard.writeText(pass);
    setCopiedPassId(id);
    addToast('Copied password securely', 'success');
    setTimeout(() => setCopiedPassId(null), 2000);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Locked View
  if (!isUnlocked) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Vault is Locked</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Unlock your Password Vault to view, copy, and manage your private DuckDuckGo email aliases.
          </p>
        </div>
        <button
          onClick={onUnlockClick}
          className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold text-sm shadow-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2 rounded-lg cursor-pointer"
        >
          <Unlock className="w-4 h-4" />
          Unlock Vault
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Mail className="w-7 h-7 text-amber-500" />
            <span>Masked Email Manager</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            View and manage your generated DuckDuckGo private email aliases (`@duck.com`) to protect your inbox from spam.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-xs font-mono font-medium">DuckDuckGo Protection Active</span>
        </div>
      </div>

      {/* Main List */}
      {maskedEmails.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-5">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto text-xl">
            📬
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-foreground">No Masked Emails Found</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When creating password entries, click the <strong>Generate</strong> button and select <strong>Generate Private Duck Email Address</strong> to keep your real email hidden.
            </p>
          </div>
          <div className="p-4 bg-muted border border-border rounded-xl text-left space-y-2">
            <span className="text-[11px] font-bold text-foreground block flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-amber-500" /> Quick Getting Started:
            </span>
            <ol className="list-decimal pl-4 text-[10px] text-muted-foreground space-y-1">
              <li>Enable the integration and add your DuckToken in <strong>Settings</strong>.</li>
              <li>Add a new login entry in <strong>Password Vault</strong>.</li>
              <li>Click the magic wand icon next to the password input field.</li>
              <li>Check "Generate Private Duck Email Address" to fill in the username instantly!</li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search masked emails or websites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-ring transition-all shadow-2xs"
            />
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEmails.map((entry) => {
              const favicon = getFaviconUrl(entry.websiteUrl);
              const isPassVisible = !!visiblePasswords[entry.id];

              return (
                <div key={entry.id} className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between gap-4 shadow-2xs group hover:border-muted-foreground/30 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {favicon ? (
                          <img
                            src={favicon}
                            alt=""
                            className="w-5 h-5 object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-lg">📧</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-foreground truncate">{entry.websiteName}</h4>
                        {entry.websiteUrl && (
                          <a
                            href={entry.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-blue-500 dark:text-blue-400 hover:underline flex items-center gap-1 mt-0.5 truncate"
                          >
                            <span>{new URL(entry.websiteUrl).hostname}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onEditPassword(entry)}
                      className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg hover:bg-primary/20 transition cursor-pointer"
                    >
                      Open Entry
                    </button>
                  </div>

                  <div className="space-y-2">
                    {/* Username/Email Input Block */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground font-medium block">Masked Address</span>
                      <div className="flex items-center justify-between gap-2 p-2 bg-muted border border-border rounded-xl text-xs font-mono">
                        <span className="font-semibold text-amber-600 dark:text-amber-400 select-all truncate">{entry.username}</span>
                        <button
                          onClick={() => handleCopyEmail(entry.id, entry.username)}
                          className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          title="Copy Email"
                        >
                          {copiedId === entry.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Password Input Block */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground font-medium block">Associated Password</span>
                      <div className="flex items-center justify-between gap-2 p-2 bg-muted border border-border rounded-xl text-xs font-mono">
                        <span className="font-semibold text-foreground select-all truncate">
                          {isPassVisible ? entry.password : '••••••••••••••••'}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => togglePasswordVisibility(entry.id)}
                            className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            title={isPassVisible ? 'Hide Password' : 'Show Password'}
                          >
                            {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleCopyPassword(entry.id, entry.password)}
                            className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            title="Copy Password"
                          >
                            {copiedPassId === entry.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
