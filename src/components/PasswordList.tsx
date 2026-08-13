import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Star,
  Edit3,
  Trash2,
  Lock,
  KeyRound,
  ShieldAlert,
  Globe,
  Share2,
  CreditCard,
  FileText,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { PasswordEntry, Category } from '../types';
import { getDescendantCategoryIdsAndNames } from '../lib/categoryHelper';
import { generateTOTP, getTOTPTimeRemaining } from '../lib/totp';

interface PasswordListProps {
  passwords: PasswordEntry[];
  isUnlocked: boolean;
  selectedCategory: string | null;
  searchQuery: string;
  onUnlockVaultClick: () => void;
  onToggleFavorite: (id: string) => void;
  onEdit: (entry: PasswordEntry) => void;
  onDelete: (id: string) => void;
  onCopyText: (text: string, label: string) => void;
  onOpenAddModal: () => void;
  onShare?: (entry: PasswordEntry) => void;
  categories: Category[];
}

const TOTPBadge: React.FC<{ secret: string; onCopy: (code: string) => void }> = ({ secret, onCopy }) => {
  const [code, setCode] = useState<string>('------');
  const [remaining, setRemaining] = useState<number>(30);

  useEffect(() => {
    let isMounted = true;
    const update = async () => {
      const now = Date.now();
      const newCode = await generateTOTP(secret, now);
      if (isMounted) {
        setCode(newCode);
        setRemaining(getTOTPTimeRemaining(now));
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [secret]);

  const formattedCode = code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code;

  return (
    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-xs">
      <div className="flex items-center gap-1">
        <Clock className="w-3 h-3 animate-spin text-emerald-500" style={{ animationDuration: '4s' }} />
        <span className="font-bold tracking-wider">{formattedCode}</span>
        <span className="text-[10px] opacity-75 font-sans">({remaining}s)</span>
      </div>
      <button
        onClick={() => onCopy(code)}
        className="p-1 hover:bg-emerald-500/20 rounded transition-colors cursor-pointer"
        title="Copy 2FA Code"
      >
        <Copy className="w-3 h-3" />
      </button>
    </div>
  );
};

export const PasswordList: React.FC<PasswordListProps> = ({
  passwords,
  isUnlocked,
  selectedCategory,
  searchQuery,
  onUnlockVaultClick,
  onToggleFavorite,
  onEdit,
  onDelete,
  onCopyText,
  onOpenAddModal,
  onShare,
  categories,
}) => {
  const [revealedMap, setRevealedMap] = useState<Record<string, boolean>>({});

  const toggleReveal = (id: string) => {
    setRevealedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const targetCategoryObj = categories.find(c => c.id === selectedCategory || c.name === selectedCategory);
  const { ids: allowedIds, names: allowedNames } = targetCategoryObj 
    ? getDescendantCategoryIdsAndNames(targetCategoryObj.id, categories)
    : { ids: [], names: [] };

  const filteredPasswords = passwords.filter((p) => {
    const matchesCategory = selectedCategory 
      ? (allowedIds.includes(p.category) || allowedNames.includes(p.category))
      : true;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      p.websiteName.toLowerCase().includes(q) ||
      p.websiteUrl.toLowerCase().includes(q) ||
      p.username.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  if (!isUnlocked) {
    return (
      <div className="p-12 max-w-lg mx-auto text-center space-y-6 mt-12 bg-card border border-border rounded-2xl shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive flex items-center justify-center mx-auto text-2xl shadow-sm">
          🔒
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">Password Vault Locked</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your credentials are safely encrypted locally using AES-GCM 256-bit WebCrypto encryption. Enter your Master Password to decrypt.
          </p>
        </div>
        <button
          onClick={onUnlockVaultClick}
          className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-all inline-flex items-center gap-2"
        >
          <KeyRound className="w-4 h-4" />
          <span>Unlock Password Vault</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground">
            {selectedCategory ? `${selectedCategory} Passwords` : 'Password Vault'}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {filteredPasswords.length} decrypted {filteredPasswords.length === 1 ? 'entry' : 'entries'} in memory
          </p>
        </div>
      </div>

      {filteredPasswords.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-2xl bg-card border border-border space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center mx-auto text-xl">
            🔑
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">No passwords found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery ? `No credentials matching "${searchQuery}".` : 'Store your first encrypted login credential.'}
            </p>
          </div>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <span>+ Add Password Entry</span>
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout */}
          <div className="grid grid-cols-1 md:hidden gap-3">
            {filteredPasswords.map((item) => {
              const isRevealed = revealedMap[item.id];

              return (
                <div
                  key={item.id}
                  className="bg-card border border-border rounded-xl p-3.5 space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground truncate">{item.websiteName}</span>
                        {item.websiteUrl && (
                          <a
                            href={item.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                            title="Open URL"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded bg-muted border border-border text-foreground font-medium text-[10px]">
                        {item.category}
                      </span>
                    </div>

                    <button
                      onClick={() => onToggleFavorite(item.id)}
                      className={`p-1.5 rounded-lg border border-border transition-colors ${
                        item.isFavorite ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>

                  <div className="space-y-2 bg-muted/40 p-2.5 rounded-lg border border-border/50 text-xs">
                    {item.entryType === 'card' && item.cardDetails && (
                      <div className="p-2 rounded bg-background border border-border space-y-1 font-mono text-[11px]">
                        <div className="flex justify-between items-center text-muted-foreground">
                          <span>{item.cardDetails.cardholderName || 'Cardholder'}</span>
                          <span>{item.cardDetails.expiryMonth}/{item.cardDetails.expiryYear}</span>
                        </div>
                        <div className="flex justify-between items-center font-bold text-foreground">
                          <span>{item.cardDetails.cardNumber || '•••• •••• •••• ••••'}</span>
                          {item.cardDetails.cvv && <span className="text-muted-foreground text-[10px]">CVV: {isRevealed ? item.cardDetails.cvv : '•••'}</span>}
                        </div>
                      </div>
                    )}

                    {item.username && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase">Username</span>
                        <div className="flex items-center gap-1.5 font-mono text-muted-foreground truncate max-w-[200px]">
                          <span className="truncate">{item.username}</span>
                          <button
                            onClick={() => onCopyText(item.username, 'Username')}
                            className="p-1 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                            title="Copy Username"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {item.password && (
                      <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-1.5">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase">Password</span>
                        <div className="flex items-center gap-1 font-mono text-muted-foreground">
                          <span className="text-xs">{isRevealed ? item.password : '••••••••••••'}</span>
                          <button
                            onClick={() => toggleReveal(item.id)}
                            className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                            title={isRevealed ? 'Hide Password' : 'Show Password'}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => onCopyText(item.password, 'Password')}
                            className="p-1 text-muted-foreground hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer"
                            title="Copy Password"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {item.totpSecret && (
                      <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-1.5">
                        <span className="text-[10px] text-emerald-500 font-semibold uppercase">2FA Code</span>
                        <TOTPBadge secret={item.totpSecret} onCopy={(code) => onCopyText(code, '2FA Code')} />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/50">
                    {onShare && (
                      <button
                        onClick={() => onShare(item)}
                        className="px-2.5 py-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 rounded-md font-medium transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>Share</span>
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(item)}
                      className="p-1.5 text-muted-foreground hover:text-foreground bg-secondary rounded-md border border-border transition-colors cursor-pointer"
                      title="Edit Entry"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive bg-destructive/10 rounded-md border border-destructive/20 transition-colors cursor-pointer"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/70 text-muted-foreground font-medium">
                  <th className="py-3 px-4 w-10"></th>
                  <th className="py-3 px-4">Website</th>
                  <th className="py-3 px-4">Username / Email</th>
                  <th className="py-3 px-4">Password</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPasswords.map((item) => {
                  const isRevealed = revealedMap[item.id];

                  return (
                    <tr key={item.id} className="hover:bg-accent/40 transition-colors group">
                      {/* Favorite */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onToggleFavorite(item.id)}
                          className={`transition-colors ${
                            item.isFavorite ? 'text-amber-500' : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-amber-400' : ''}`} />
                        </button>
                      </td>

                      {/* Website */}
                      <td className="py-3 px-4 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{item.websiteName}</span>
                          {item.websiteUrl && (
                            <a
                              href={item.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                              title="Open URL"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Username */}
                      <td className="py-3 px-4 text-muted-foreground font-mono">
                        <div className="flex items-center gap-2">
                          <span>{item.username}</span>
                          <button
                            onClick={() => onCopyText(item.username, 'Username')}
                            className="text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                            title="Copy Username"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Password */}
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span>{isRevealed ? item.password : '••••••••••••'}</span>
                          <button
                            onClick={() => toggleReveal(item.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title={isRevealed ? 'Hide Password' : 'Show Password'}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => onCopyText(item.password, 'Password')}
                            className="text-muted-foreground hover:text-blue-500 dark:hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                            title="Copy Password"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-muted border border-border text-foreground font-medium">
                          {item.category}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {onShare && (
                            <button
                              onClick={() => onShare(item)}
                              className="p-1 text-muted-foreground hover:text-purple-500 transition-colors"
                              title="Secure Share Link"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit Entry"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(item.id)}
                            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                            title="Delete Entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
