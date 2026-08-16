import React from 'react';
import { MarketingHeader } from '../../components/marketing/MarketingHeader';
import { MarketingFooter } from '../../components/marketing/MarketingFooter';
import { BookOpen, KeyRound, Fingerprint, ShieldCheck, FileSpreadsheet, Puzzle } from 'lucide-react';

interface MarketingDocsProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onNavigate: (path: string) => void;
}

export const MarketingDocs: React.FC<MarketingDocsProps> = ({
  theme,
  onToggleTheme,
  onNavigate,
}) => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <MarketingHeader theme={theme} onToggleTheme={onToggleTheme} currentPath="/docs" onNavigate={onNavigate} />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Xerox Documentation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">User & Developer Manual</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Complete guide to master passwords, emergency recovery keys, WebAuthn passkeys, and extension autofill.
          </p>
        </div>

        <div className="space-y-6 text-xs text-muted-foreground leading-relaxed">
          {/* Section 1 */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-3 shadow-xs">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-500" />
              <span>1. Vault Encryption & Master Password</span>
            </h2>
            <p>
              When initializing Xerox, you set a Master Password. Your Master Password derives a Password KEK via PBKDF2 (100k iterations) to unwrap your 256-bit Vault Encryption Key (VEK). The VEK encrypts all vault payload items using AES-GCM 256-bit encryption.
            </p>
          </div>

          {/* Section 2 */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-3 shadow-xs">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-purple-500" />
              <span>2. Emergency Recovery Key</span>
            </h2>
            <p>
              During vault initialization, Xerox generates a 256-bit Emergency Recovery Key (<code className="font-mono text-[11px]">XXXX-XXXX-XXXX-...</code>). Store this key in a secure location. If you forget your Master Password, click "Recovery Key Unlock" on the master password modal to restore access.
            </p>
          </div>

          {/* Section 3 */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-3 shadow-xs">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Puzzle className="w-4 h-4 text-amber-500" />
              <span>3. Browser Extension Synchronization</span>
            </h2>
            <p>
              Opening your Xerox Web Vault tab synchronizes your encrypted vault payload to your local extension storage via postMessage. The extension operates 100% offline even when the web vault tab is closed.
            </p>
          </div>
        </div>
      </main>

      <MarketingFooter onNavigate={onNavigate} />
    </div>
  );
};
