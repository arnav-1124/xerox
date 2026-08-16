import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Copy,
  Check,
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
  Tag,
} from 'lucide-react';
import { PasswordEntry, Category } from '../types';
import { getDescendantCategoryIdsAndNames, getCategoryPath } from '../lib/categoryHelper';
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

const TOTPBadge: React.FC<{
  secret: string;
  copyKey: string;
  copied: boolean;
  onCopy: (code: string) => void;
}> = ({ secret, copyKey, copied, onCopy }) => {
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
        {copied ? (
          <Check className="w-3 h-3 text-emerald-500 animate-in zoom-in duration-150" />
        ) : (
          <Copy className="w-3 h-3" />
        )}
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
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const toggleReveal = (id: string) => {
    setRevealedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const triggerCopy = (text: string, label: string, key: string) => {
    onCopyText(text, label);
    setCopiedMap((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedMap((prev) => ({ ...prev, [key]: false }));
    }, 1600);
  };

  const handleRedirect = (targetUrl: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!targetUrl) return;
    let url = targetUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const targetCategoryObj = categories.find(
    (c) => c.id === selectedCategory || c.name === selectedCategory
  );
  const { ids: allowedIds, names: allowedNames } = targetCategoryObj
    ? getDescendantCategoryIdsAndNames(targetCategoryObj.id, categories)
    : { ids: [], names: [] };

  const selectedCategoryObj = categories.find(
    (c) => c.id === selectedCategory || c.name === selectedCategory
  );
  const headerTitle = selectedCategoryObj
    ? getCategoryPath(selectedCategoryObj.id, categories)
    : '';

  const filteredPasswords = passwords.filter((p) => {
    const matchesCategory = selectedCategory
      ? allowedIds.includes(p.category) || allowedNames.includes(p.category)
      : true;

    const q = searchQuery.toLowerCase();
    const tagsString = (p.websiteName + ' ' + (p.notes || '')).toLowerCase();

    const matchesSearch =
      !searchQuery ||
      p.websiteName.toLowerCase().includes(q) ||
      (p.websiteUrl && p.websiteUrl.toLowerCase().includes(q)) ||
      p.username.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.notes && p.notes.toLowerCase().includes(q));

    const matchesTag = !selectedTag || tagsString.includes(selectedTag.toLowerCase());

    return matchesCategory && matchesSearch && matchesTag;
  });

  const allTags = Array.from(
    new Set(
      passwords.flatMap((p) =>
        (p.websiteName + ' ' + (p.notes || '')).match(/#[a-zA-Z0-9_-]+/g) || []
      )
    )
  );

  if (!isUnlocked) {
    return (
      <div className="p-8 sm:p-12 max-w-lg mx-auto text-center space-y-6 mt-12 bg-card border border-border rounded-2xl shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-500 flex items-center justify-center mx-auto text-2xl shadow-sm">
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
          className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
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
            {selectedCategory ? `${headerTitle} Passwords` : 'Password Vault'}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {filteredPasswords.length} decrypted {filteredPasswords.length === 1 ? 'entry' : 'entries'} in memory
          </p>
        </div>
      </div>

      {/* Quick Tag Filter Pills */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap overflow-x-auto pb-1">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" /> Filter by Tag:
          </span>
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
              !selectedTag
                ? 'bg-blue-600 text-white'
                : 'bg-muted hover:bg-muted/80 text-foreground border border-border'
            }`}
          >
            All
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTag(selectedTag === t ? null : t)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                selectedTag === t
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 hover:bg-purple-500/20'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

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
              const targetUrl = item.websiteUrl || item.websiteName;

              return (
                <div
                  key={item.id}
                  className="bg-card border border-border rounded-xl p-3.5 space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground truncate">{item.websiteName}</span>
                        {targetUrl && (
                          <button
                            onClick={(e) => handleRedirect(targetUrl, e)}
                            className="text-muted-foreground hover:text-blue-500 shrink-0 p-0.5 cursor-pointer"
                            title={`Open ${targetUrl}`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{item.username || '(No username set)'}</div>
                    </div>
                    <button
                      onClick={() => onToggleFavorite(item.id)}
                      className={`p-1 shrink-0 ${item.isFavorite ? 'text-amber-500' : 'text-muted-foreground'}`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  {item.totpSecret && (
                    <TOTPBadge
                      secret={item.totpSecret}
                      copyKey={`totp-${item.id}`}
                      copied={!!copiedMap[`totp-${item.id}`]}
                      onCopy={(code) => triggerCopy(code, '2FA Code', `totp-${item.id}`)}
                    />
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-[11px] font-mono">{isRevealed ? (item.password || '(No password set)') : '••••••••••••'}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleReveal(item.id)} className="p-1 text-muted-foreground hover:text-foreground">
                        {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => triggerCopy(item.password, 'Password', `pwd-${item.id}`)}
                        className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Copy Password"
                      >
                        {copiedMap[`pwd-${item.id}`] ? (
                          <Check className="w-4 h-4 text-emerald-500 animate-in zoom-in duration-150" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button onClick={() => onEdit(item)} className="p-1 text-muted-foreground hover:text-foreground">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(item.id)} className="p-1 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-muted-foreground font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Title & Domain</th>
                  <th className="py-3 px-4">Username / Email</th>
                  <th className="py-3 px-4">Password</th>
                  <th className="py-3 px-4">2FA TOTP</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPasswords.map((item) => {
                  const isRevealed = revealedMap[item.id];
                  const itemTags = (item.websiteName + ' ' + (item.notes || '')).match(/#[a-zA-Z0-9_-]+/g) || [];
                  const targetUrl = item.websiteUrl || item.websiteName;

                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onToggleFavorite(item.id)}
                            className={`cursor-pointer ${item.isFavorite ? 'text-amber-500' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <span className="font-semibold">{item.websiteName}</span>
                          {targetUrl && (
                            <button
                              onClick={(e) => handleRedirect(targetUrl, e)}
                              className="p-0.5 text-muted-foreground hover:text-blue-500 transition-colors cursor-pointer"
                              title={`Open ${targetUrl}`}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {itemTags.map((tg) => (
                            <span key={tg} className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/20">
                              {tg}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-mono">
                        <div className="flex items-center gap-1.5">
                          <span>{item.username || <em className="text-muted-foreground/60 font-sans text-[11px]">(No username)</em>}</span>
                          {item.username && (
                            <button
                              onClick={() => triggerCopy(item.username, 'Username', `usr-${item.id}`)}
                              className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Copy Username"
                            >
                              {copiedMap[`usr-${item.id}`] ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500 animate-in zoom-in duration-150" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span>{isRevealed ? (item.password || <em className="text-muted-foreground/60 font-sans text-[11px]">(No password)</em>) : '••••••••••••'}</span>
                          {item.password && (
                            <>
                              <button onClick={() => toggleReveal(item.id)} className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer">
                                {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={() => triggerCopy(item.password, 'Password', `pwd-${item.id}`)}
                                className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Copy Password"
                              >
                                {copiedMap[`pwd-${item.id}`] ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500 animate-in zoom-in duration-150" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {item.totpSecret ? (
                          <TOTPBadge
                            secret={item.totpSecret}
                            copyKey={`totp-${item.id}`}
                            copied={!!copiedMap[`totp-${item.id}`]}
                            onCopy={(code) => triggerCopy(code, '2FA Code', `totp-${item.id}`)}
                          />
                        ) : (
                          <span className="text-muted-foreground opacity-50">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {targetUrl && (
                            <button
                              onClick={(e) => handleRedirect(targetUrl, e)}
                              className="p-1 text-muted-foreground hover:text-blue-500 transition-colors cursor-pointer"
                              title={`Open ${targetUrl}`}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onShare && (
                            <button onClick={() => onShare(item)} className="p-1 text-muted-foreground hover:text-foreground cursor-pointer" title="Zero-Knowledge Share">
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => onEdit(item)} className="p-1 text-muted-foreground hover:text-foreground cursor-pointer" title="Edit Entry">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => onDelete(item.id)} className="p-1 text-muted-foreground hover:text-destructive cursor-pointer" title="Delete Entry">
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
