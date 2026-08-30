import React from 'react';
import { MarketingHeader } from '../../components/marketing/MarketingHeader';
import { MarketingFooter } from '../../components/marketing/MarketingFooter';
import { ShieldCheck, ServerOff, EyeOff, Lock, CheckCircle2 } from 'lucide-react';

interface MarketingPrivacyProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onNavigate: (path: string) => void;
}

export const MarketingPrivacy: React.FC<MarketingPrivacyProps> = ({
  theme,
  onToggleTheme,
  onNavigate,
}) => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <MarketingHeader theme={theme} onToggleTheme={onToggleTheme} currentPath="/privacy" onNavigate={onNavigate} />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <ServerOff className="w-3.5 h-3.5" />
            <span>Privacy Specification</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Privacy Policy & Local Data Guarantee</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Lokker is built on a fundamental privacy promise: your credentials remain strictly on your own device.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 sm:p-8 space-y-6 shadow-xs text-xs leading-relaxed text-muted-foreground">
          <div className="space-y-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>1. Zero Remote Server Storage</span>
            </h2>
            <p>
              Lokker operates without a central cloud vault or user account server. Your passwords, 2FA keys, secure notes, credit cards, and bookmarks are encrypted client-side and saved exclusively inside your browser local IndexedDB.
            </p>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>2. Zero Telemetry & Tracking</span>
            </h2>
            <p>
              Lokker contains no analytics scripts, third-party trackers, pixel beacons, or user tracking code. We do not collect or log usage statistics, search queries, or IP addresses.
            </p>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>3. k-Anonymity Leak Check Privacy</span>
            </h2>
            <p>
              When running dark web breach checks, Lokker uses SHA-1 k-Anonymity 5-character prefix search with <code className="font-mono text-[11px]">Add-Padding: true</code> headers. Plaintext passwords are never sent over the network.
            </p>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>4. Extension Isolation</span>
            </h2>
            <p>
              The Lokker Chrome/Edge Manifest V3 extension communicates with website forms through isolated Shadow DOM containers. It checks credentials against target domain origins locally.
            </p>
          </div>
        </div>
      </main>

      <MarketingFooter onNavigate={onNavigate} />
    </div>
  );
};
