import React, { useState } from 'react';
import { Lock, Sun, Moon, ArrowRight, Menu, X, Shield, Download, BookOpen, KeyRound } from 'lucide-react';

interface MarketingHeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  currentPath?: string;
  onNavigate: (path: string) => void;
}

export const MarketingHeader: React.FC<MarketingHeaderProps> = ({
  theme,
  onToggleTheme,
  currentPath = '/',
  onNavigate,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Features', path: '/features' },
    { label: 'Security', path: '/security' },
    { label: 'Download', path: '/download' },
    { label: 'Privacy', path: '/privacy' },
    { label: 'Docs', path: '/docs' },
  ];

  const handleNavClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <button
          onClick={() => handleNavClick('/')}
          className="flex items-center gap-2.5 text-foreground hover:opacity-90 transition-opacity cursor-pointer text-left"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            🔐
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-foreground block leading-none">Xerox</span>
            <span className="text-[10px] text-muted-foreground font-mono leading-none">Local-First Vault</span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-muted/50 border border-border/50 rounded-full px-3 py-1">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-background text-foreground shadow-xs border border-border/50'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl border border-border bg-card text-foreground hover:bg-accent transition-colors cursor-pointer"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          <button
            onClick={() => handleNavClick('/app')}
            className="py-2 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Open Vault App</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-border bg-card text-foreground cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card p-4 space-y-2 text-xs font-semibold animate-in slide-in-from-top-2 duration-200">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                currentPath === item.path ? 'bg-blue-600 text-white font-bold' : 'text-foreground hover:bg-muted'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
