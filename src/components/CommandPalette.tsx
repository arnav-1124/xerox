import React, { useState, useEffect } from 'react';
import { Search, Bookmark, KeyRound, ExternalLink, Copy, X } from 'lucide-react';
import { Bookmark as BookmarkType, PasswordEntry } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: BookmarkType[];
  passwords: PasswordEntry[];
  isUnlocked: boolean;
  onCopyText: (text: string, label: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  bookmarks,
  passwords,
  isUnlocked,
  onCopyText,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase();

  const matchingBookmarks = bookmarks.filter(
    (b) =>
      !query ||
      b.title.toLowerCase().includes(q) ||
      b.url.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q)
  );

  const matchingPasswords = isUnlocked
    ? passwords.filter(
        (p) =>
          !query ||
          p.websiteName.toLowerCase().includes(q) ||
          p.username.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden text-popover-foreground flex flex-col max-h-[80vh]">
        {/* Search Bar Input */}
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type to search bookmarks or passwords..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground font-medium"
          />
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="overflow-y-auto p-3 space-y-4 text-xs">
          {/* Bookmarks Section */}
          {matchingBookmarks.length > 0 && (
            <div>
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase px-2 mb-1.5 block">
                Bookmarks ({matchingBookmarks.length})
              </span>
              <div className="space-y-1">
                {matchingBookmarks.slice(0, 5).map((bm) => (
                  <div
                    key={bm.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-muted hover:bg-accent border border-border transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Bookmark className="w-4 h-4 text-blue-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-semibold text-foreground block truncate">{bm.title}</span>
                        <span className="text-[11px] text-muted-foreground font-mono truncate block">{bm.url}</span>
                      </div>
                    </div>

                    <a
                      href={bm.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-blue-600 hover:text-white text-secondary-foreground text-[11px] font-medium transition-colors flex items-center gap-1 shrink-0"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Passwords Section */}
          {isUnlocked && matchingPasswords.length > 0 && (
            <div>
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase px-2 mb-1.5 block">
                Password Vault ({matchingPasswords.length})
              </span>
              <div className="space-y-1">
                {matchingPasswords.slice(0, 5).map((pwd) => (
                  <div
                    key={pwd.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-muted hover:bg-accent border border-border transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <KeyRound className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-semibold text-foreground block truncate">{pwd.websiteName}</span>
                        <span className="text-[11px] text-muted-foreground font-mono truncate block">{pwd.username}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onCopyText(pwd.username, 'Username')}
                        className="px-2 py-1 rounded bg-secondary hover:bg-accent text-secondary-foreground text-[10px] font-medium transition-colors border border-border"
                      >
                        Copy User
                      </button>
                      <button
                        onClick={() => onCopyText(pwd.password, 'Password')}
                        className="px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-600 text-blue-600 dark:text-blue-300 hover:text-white text-[10px] font-medium transition-colors border border-blue-500/30"
                      >
                        Copy Pass
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isUnlocked && (
            <div className="p-3 rounded-xl bg-muted border border-border text-center text-muted-foreground text-xs">
              🔒 Unlock Vault to search encrypted credentials.
            </div>
          )}

          {matchingBookmarks.length === 0 && matchingPasswords.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No items found matching "{query}".</div>
          )}
        </div>
      </div>
    </div>
  );
};
