import React from 'react';
import { MarketingHeader } from '../../components/marketing/MarketingHeader';
import { MarketingFooter } from '../../components/marketing/MarketingFooter';
import { BrowserFrame } from '../../components/marketing/BrowserFrame';
import { KeyRound, Bookmark, Clock, ShieldCheck, FileSpreadsheet, Puzzle, Lock, ExternalLink, ArrowRight } from 'lucide-react';

interface MarketingFeaturesProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onNavigate: (path: string) => void;
}

export const MarketingFeatures: React.FC<MarketingFeaturesProps> = ({
  theme,
  onToggleTheme,
  onNavigate,
}) => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <MarketingHeader theme={theme} onToggleTheme={onToggleTheme} currentPath="/features" onNavigate={onNavigate} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-16">
        {/* Page Title */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Xerox Feature Matrix</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Enterprise Features. Zero Cloud.</h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Every feature in Xerox is engineered to execute locally on your device without transmitting telemetry or credentials to external servers.
          </p>
        </div>

        {/* Feature 1: Password Vault */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-b border-border pb-12">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">1. Zero-Knowledge Password Vault</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Store login credentials with custom categories, tags, notes, and password history. Features instant 1-click clipboard copy with automatic 30-second clipboard clearing and redirect site links.
            </p>
            <ul className="space-y-1.5 text-xs text-muted-foreground font-medium">
              <li className="flex items-center gap-2">✓ AES-GCM 256-bit encrypted payload</li>
              <li className="flex items-center gap-2">✓ Automatic password generator with custom rules</li>
              <li className="flex items-center gap-2">✓ Copy feedback indicators and zero-retention clipboard</li>
            </ul>
          </div>
          <BrowserFrame url="https://xerox.local/passwords">
            <div className="p-4 bg-card text-xs space-y-2 font-mono">
              <div className="p-2.5 rounded-lg bg-background border border-border flex justify-between items-center">
                <span className="font-bold font-sans">GitHub</span>
                <span className="text-muted-foreground">alex@xerox.local</span>
                <span>••••••••••••</span>
              </div>
            </div>
          </BrowserFrame>
        </div>

        {/* Feature 2: Bookmarks Sync */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-b border-border pb-12">
          <div className="order-2 md:order-1">
            <BrowserFrame url="https://xerox.local/bookmarks">
              <div className="p-4 bg-card text-xs space-y-2">
                <div className="p-2.5 rounded-lg bg-background border border-border flex justify-between items-center font-sans font-bold">
                  <span>GitHub Repository</span>
                  <span className="text-[10px] text-muted-foreground font-mono">github.com</span>
                </div>
              </div>
            </BrowserFrame>
          </div>
          <div className="space-y-4 order-1 md:order-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center font-bold">
              <Bookmark className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">2. Bi-Directional Bookmarks Sync</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Adding a password entry automatically creates a corresponding bookmark entry without credentials, keeping your quick-launch bookmarks and password vault perfectly in sync.
            </p>
            <ul className="space-y-1.5 text-xs text-muted-foreground font-medium">
              <li className="flex items-center gap-2">✓ Auto-sync by domain and site title</li>
              <li className="flex items-center gap-2">✓ Categorized bookmarks with instant search</li>
              <li className="flex items-center gap-2">✓ External redirect launch button</li>
            </ul>
          </div>
        </div>

        {/* Feature 3: 2FA TOTP Authenticator */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-b border-border pb-12">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">3. Integrated 2FA TOTP Authenticator</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No need for a separate phone app. Xerox generates standard 6-digit TOTP verification codes with 30-second live circular timers and 1-click clipboard auto-copy.
            </p>
          </div>
          <BrowserFrame url="https://xerox.local/totp">
            <div className="p-4 bg-card text-xs text-center font-mono">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold text-sm">
                <span>482 910</span>
                <span className="text-[10px] text-muted-foreground">(22s)</span>
              </div>
            </div>
          </BrowserFrame>
        </div>

        {/* Call to Action */}
        <div className="text-center pt-4">
          <button
            onClick={() => onNavigate('/app')}
            className="py-3 px-6 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition shadow-sm cursor-pointer inline-flex items-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>Try All Features in Xerox Vault</span>
          </button>
        </div>
      </main>

      <MarketingFooter onNavigate={onNavigate} />
    </div>
  );
};
