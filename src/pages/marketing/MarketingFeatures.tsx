import React from 'react';
import { MarketingHeader } from '../../components/marketing/MarketingHeader';
import { MarketingFooter } from '../../components/marketing/MarketingFooter';
import { BrowserFrame } from '../../components/marketing/BrowserFrame';
import {
  KeyRound,
  Bookmark,
  Clock,
  ShieldCheck,
  FileSpreadsheet,
  Puzzle,
  Lock,
  ExternalLink,
  ArrowRight,
  Fingerprint,
  FileText,
  RefreshCw,
  Check,
} from 'lucide-react';

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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Lokker Feature Matrix</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Full Security Suite. Zero Cloud.</h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Every capability in Lokker is engineered to execute locally on your device without transmitting telemetry or credentials to external servers.
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
              Store login credentials with custom categories, tags, notes, and password history. Features instant 1-click clipboard copy with automatic 30-second clipboard clearing and direct site links.
            </p>
            <ul className="space-y-1.5 text-xs text-muted-foreground font-medium">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> AES-GCM 256-bit encrypted payload</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Automatic password generator with custom character rules</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Auto-clearing clipboard for sensitive credentials</li>
            </ul>
          </div>
          <BrowserFrame url="https://lokker.local/passwords">
            <div className="p-4 bg-card text-xs space-y-2 font-mono">
              <div className="p-2.5 rounded-lg bg-background border border-border flex justify-between items-center">
                <span className="font-bold font-sans">GitHub</span>
                <span className="text-muted-foreground">alex@example.com</span>
                <span>••••••••••••</span>
              </div>
              <div className="p-2.5 rounded-lg bg-background border border-border flex justify-between items-center">
                <span className="font-bold font-sans">ProtonMail</span>
                <span className="text-muted-foreground">alex.vault@proton.me</span>
                <span>••••••••••••</span>
              </div>
            </div>
          </BrowserFrame>
        </div>

        {/* Feature 2: Browser Extension & Real Autofill */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-b border-border pb-12">
          <div className="order-2 md:order-1">
            <BrowserFrame url="https://lokker.local/extension">
              <div className="p-4 bg-card text-xs space-y-2">
                <div className="p-3 rounded-lg bg-background border border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Puzzle className="w-4 h-4 text-blue-500" />
                    <span className="font-bold font-sans">Manifest V3 Extension</span>
                  </div>
                  <span className="text-[10px] text-emerald-500 font-mono">Offline Ready</span>
                </div>
              </div>
            </BrowserFrame>
          </div>
          <div className="space-y-4 order-1 md:order-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center font-bold">
              <Puzzle className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">2. Manifest V3 Browser Extension</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Real browser autofill for Chrome, Edge, and Chromium browsers. Operates inside an isolated Shadow DOM container with origin verification.
            </p>
            <ul className="space-y-1.5 text-xs text-muted-foreground font-medium">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Isolated Shadow DOM prevents page script access</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Strict origin verification against phishing attacks</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Standalone offline extension execution</li>
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
              No need for a separate phone app. Lokker generates standard RFC 6238 6-digit TOTP verification codes with 30-second live circular timers and 1-click clipboard auto-copy.
            </p>
            <ul className="space-y-1.5 text-xs text-muted-foreground font-medium">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> RFC 6238 standard TOTP algorithm</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Live circular countdown timers</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> QR code import and secret key entry</li>
            </ul>
          </div>
          <BrowserFrame url="https://lokker.local/totp">
            <div className="p-4 bg-card text-xs text-center font-mono">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold text-sm">
                <span>482 910</span>
                <span className="text-[10px] text-muted-foreground">(22s)</span>
              </div>
            </div>
          </BrowserFrame>
        </div>

        {/* Feature 4: Security Health Audit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-b border-border pb-12">
          <div className="order-2 md:order-1">
            <BrowserFrame url="https://lokker.local/security-audit">
              <div className="p-4 bg-card text-xs space-y-2">
                <div className="p-2.5 rounded-lg bg-background border border-border flex justify-between items-center">
                  <span className="font-bold font-sans">Vault Health Score</span>
                  <span className="text-emerald-500 font-bold font-mono">92/100</span>
                </div>
                <div className="text-[11px] text-muted-foreground">0 breached &bull; 0 reused &bull; 1 weak</div>
              </div>
            </BrowserFrame>
          </div>
          <div className="space-y-4 order-1 md:order-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">4. Security Health & Breach Detection</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Automated audit of password strength, reuse across services, and dark web breach checks using k-Anonymity mathematical privacy.
            </p>
            <ul className="space-y-1.5 text-xs text-muted-foreground font-medium">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> k-Anonymity 5-char SHA-1 prefix check (zero plaintext leak)</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Password reuse detection across all accounts</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Stale and weak credential scoring</li>
            </ul>
          </div>
        </div>

        {/* Feature 5: WebAuthn PRF */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-b border-border pb-12">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center font-bold">
              <Fingerprint className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">5. WebAuthn PRF Biometric Unlock</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Derive symmetric encryption keys directly from your device hardware passkey (Touch ID, Windows Hello, or YubiKey) using the WebAuthn PRF extension.
            </p>
            <ul className="space-y-1.5 text-xs text-muted-foreground font-medium">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Hardware-bound symmetric key derivation</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Zero master password caching in memory</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Seamless biometric authentication</li>
            </ul>
          </div>
          <BrowserFrame url="https://lokker.local/settings">
            <div className="p-4 bg-card text-xs space-y-2 font-mono text-center">
              <div className="p-3 rounded-lg bg-background border border-border flex items-center justify-center gap-2 text-foreground font-bold">
                <Fingerprint className="w-4 h-4 text-blue-500" />
                <span>WebAuthn PRF Passkey Active</span>
              </div>
            </div>
          </BrowserFrame>
        </div>

        {/* Call to Action */}
        <div className="text-center pt-4">
          <button
            onClick={() => onNavigate('/app')}
            className="py-3 px-6 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition shadow-sm cursor-pointer inline-flex items-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>Try All Features in Lokker Vault</span>
          </button>
        </div>
      </main>

      <MarketingFooter onNavigate={onNavigate} />
    </div>
  );
};
