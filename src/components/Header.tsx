import React from 'react';
import { Search, Lock, Unlock, Plus, Puzzle, ShieldCheck, Sun, Moon } from 'lucide-react';
import { ViewMode } from '../types';

interface HeaderProps {
  currentView: ViewMode;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isUnlocked: boolean;
  onToggleLock: () => void;
  onOpenCommandPalette: () => void;
  onOpenNewItemModal: () => void;
  onOpenExtensionGuide: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  searchQuery,
  onSearchChange,
  isUnlocked,
  onToggleLock,
  onOpenCommandPalette,
  onOpenNewItemModal,
  onOpenExtensionGuide,
  theme,
  onToggleTheme,
}) => {
  const getViewTitle = () => {
    switch (currentView) {
      case 'home':
        return 'Overview & Features';
      case 'bookmarks':
        return 'Bookmarks';
      case 'passwords':
        return 'Password Vault';
      case 'favorites':
        return 'Favorites';
      case 'categories':
        return 'Categories';
      case 'settings':
        return 'Settings & Security';
      case 'extension':
        return 'Browser Extension';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-6 py-3.5 flex items-center justify-between gap-4 transition-colors duration-200">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-foreground tracking-tight">{getViewTitle()}</h1>
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="w-3 h-3" />
          <span>Local Storage Only</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search trigger / input */}
        <div
          onClick={onOpenCommandPalette}
          className="relative hidden md:flex items-center w-64 px-3 py-1.5 rounded-lg bg-muted/60 border border-border text-muted-foreground hover:border-ring transition-all cursor-pointer group"
        >
          <Search className="w-4 h-4 text-muted-foreground group-hover:text-foreground mr-2 shrink-0 transition-colors" />
          <input
            type="text"
            placeholder="Search vault..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-foreground placeholder-muted-foreground w-full cursor-pointer"
            readOnly
          />
          <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-accent/50 rounded border border-border">
            ⌘K
          </kbd>
        </div>

        {/* Extension Download/Guide CTA */}
        <button
          onClick={onOpenExtensionGuide}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-secondary hover:bg-accent border border-border rounded-lg transition-all"
          title="Install Chrome/Edge Extension for Real Autofill"
        >
          <Puzzle className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
          <span>Extension</span>
        </button>

        {/* Lock / Unlock Toggle */}
        <button
          onClick={onToggleLock}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
            isUnlocked
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20'
          }`}
          title={isUnlocked ? 'Lock Vault Now' : 'Unlock Vault'}
        >
          {isUnlocked ? <Unlock className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-destructive" />}
          <span className="hidden sm:inline">{isUnlocked ? 'Vault Unlocked' : 'Vault Locked'}</span>
        </button>

        {/* Add New Item Button */}
        {(currentView === 'bookmarks' || currentView === 'passwords') && (
          <button
            onClick={onOpenNewItemModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add {currentView === 'bookmarks' ? 'Bookmark' : 'Password'}</span>
          </button>
        )}

        {/* Theme Toggler Button */}
        <button
          onClick={onToggleTheme}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary hover:bg-accent text-secondary-foreground border border-border transition-all duration-300 active:scale-90 group shrink-0"
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          aria-label="Toggle theme"
        >
          <div className={`transition-transform duration-500 ease-in-out ${theme === 'dark' ? 'rotate-[360deg]' : 'rotate-0'}`}>
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 group-hover:-rotate-12 transition-transform duration-300" />
            )}
          </div>
        </button>
      </div>
    </header>
  );
};

