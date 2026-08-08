import React, { useState } from 'react';
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
} from 'lucide-react';
import { PasswordEntry } from '../types';

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
}

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
}) => {
  const [revealedMap, setRevealedMap] = useState<Record<string, boolean>>({});

  const toggleReveal = (id: string) => {
    setRevealedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredPasswords = passwords.filter((p) => {
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {selectedCategory ? `${selectedCategory} Passwords` : 'Password Vault'}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {filteredPasswords.length} decrypted {filteredPasswords.length === 1 ? 'entry' : 'entries'} in memory
          </p>
        </div>
      </div>

      {filteredPasswords.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-border space-y-4 shadow-sm">
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
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-all inline-flex items-center gap-2"
          >
            <span>+ Add Password Entry</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
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
      )}
    </div>
  );
};
