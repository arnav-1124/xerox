import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Fingerprint,
  Puzzle,
  Download,
  ArrowRight,
  CheckCircle2,
  Bookmark,
  Clock,
  Shield,
  FileSpreadsheet,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Cpu,
  EyeOff,
  ServerOff,
  Database,
  ExternalLink,
} from 'lucide-react';
import { MarketingHeader } from '../../components/marketing/MarketingHeader';
import { MarketingFooter } from '../../components/marketing/MarketingFooter';
import { BrowserFrame } from '../../components/marketing/BrowserFrame';

interface MarketingHomeProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onNavigate: (path: string) => void;
}

export const MarketingHome: React.FC<MarketingHomeProps> = ({
  theme,
  onToggleTheme,
  onNavigate,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Is my vault data sent to any cloud server or third party?',
      a: 'No. Xerox is 100% local-first by default. Your master password, encryption keys, and vault entries are generated, encrypted, and stored entirely within your browser local IndexedDB database on your own device.',
    },
    {
      q: 'How does real Chrome & Edge browser autofill work?',
      a: 'Xerox includes a native Manifest V3 extension package. It uses an isolated Shadow DOM and local browser messaging contracts to detect login fields on trusted domains and securely fill credentials without injecting raw script dependencies into web pages.',
    },
    {
      q: 'What happens if I forget my Master Password?',
      a: 'Xerox generates a 256-bit Emergency Recovery Key during setup. If you lose your Master Password, you can use your offline Recovery Key to unwrap your vault key and set a new password without losing any data.',
    },
    {
      q: 'Can I import passwords from Chrome, Bitwarden, 1Password, or CSV?',
      a: 'Yes! Xerox features a multi-format local parser with an instant pre-import preview modal. You can inspect duplicate entries, validate categories, and resolve conflicts before importing.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <MarketingHeader theme={theme} onToggleTheme={onToggleTheme} currentPath="/" onNavigate={onNavigate} />

      <main className="flex-1 space-y-16 sm:space-y-24 py-8 sm:py-12">
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-6 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            <span>Zero-Knowledge Local-First Security</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight text-foreground">
            Your passwords. Your device. <br className="hidden sm:inline" />
            Your control.
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A local-first password manager with secure browser autofill, 2FA TOTP, bookmarks sync, and WebCrypto AES-GCM 256-bit envelope encryption.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('/app')}
              className="w-full sm:w-auto py-3 px-6 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Get Started</span>
            </button>

            <button
              onClick={() => onNavigate('/security')}
              className="w-full sm:w-auto py-3 px-6 rounded-xl text-sm font-semibold bg-card hover:bg-muted text-foreground border border-border transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4 text-purple-500" />
              <span>See How It Works</span>
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-6 text-xs text-muted-foreground font-medium">
            <div className="p-2.5 rounded-xl bg-card border border-border flex items-center justify-center gap-2 shadow-xs">
              <ServerOff className="w-4 h-4 text-emerald-500" />
              <span>100% Local-First</span>
            </div>
            <div className="p-2.5 rounded-xl bg-card border border-border flex items-center justify-center gap-2 shadow-xs">
              <Lock className="w-4 h-4 text-blue-500" />
              <span>AES-GCM 256-bit</span>
            </div>
            <div className="p-2.5 rounded-xl bg-card border border-border flex items-center justify-center gap-2 shadow-xs">
              <Fingerprint className="w-4 h-4 text-purple-500" />
              <span>WebAuthn PRF</span>
            </div>
            <div className="p-2.5 rounded-xl bg-card border border-border flex items-center justify-center gap-2 shadow-xs">
              <Puzzle className="w-4 h-4 text-amber-500" />
              <span>Real Extension Autofill</span>
            </div>
          </div>

          {/* Real Application Framed Preview */}
          <div className="pt-6 max-w-5xl mx-auto">
            <BrowserFrame url="https://xerox.local/passwords">
              <div className="p-4 sm:p-8 bg-card text-left space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">Password Vault</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-mono font-bold">
                      4 Decrypted Entries
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">Local Storage Only</span>
                </div>

                <div className="divide-y divide-border rounded-xl border border-border overflow-hidden bg-background">
                  <div className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-bold">GitHub</span>
                      <span className="text-muted-foreground font-mono">alex.user@example.com</span>
                    </div>
                    <span className="font-mono text-muted-foreground">••••••••••••</span>
                  </div>
                  <div className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-bold">Google Account</span>
                      <span className="text-muted-foreground font-mono">alex.user@example.com</span>
                    </div>
                    <span className="font-mono text-muted-foreground">••••••••••••</span>
                  </div>
                  <div className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-bold">Notion Workspace</span>
                      <span className="text-muted-foreground font-mono">alex.user@example.com</span>
                    </div>
                    <span className="font-mono text-muted-foreground">••••••••••••</span>
                  </div>
                </div>
              </div>
            </BrowserFrame>
          </div>
        </section>

        {/* WHY LOCAL FIRST? */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Why Local-First?</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Centralized password servers invite massive data breach vectors. Xerox keeps your vault encrypted strictly on your own hardware.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold">Local-Only Execution</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your vault payload is stored directly inside your browser local IndexedDB. It works 100% offline without needing internet access or remote logins.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold">VEK / KEK Envelope Cryptography</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A random 256-bit Vault Encryption Key (VEK) encrypts your data using AES-GCM. KEK wrappers let you rotate Master Passwords without re-encrypting data.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <Fingerprint className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold">WebAuthn PRF Unlock</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Unlock your vault with Touch ID, Windows Hello, or YubiKey using hardware WebAuthn PRF key wrapping. Zero master password storage.
              </p>
            </div>
          </div>
        </section>

        {/* FEATURES OVERVIEW */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Complete Security Suite</h2>
              <p className="text-xs text-muted-foreground mt-1">Everything you need to manage credentials, 2FA codes, and site links effortlessly.</p>
            </div>
            <button
              onClick={() => onNavigate('/features')}
              className="text-xs font-semibold text-blue-500 hover:text-blue-400 flex items-center gap-1 cursor-pointer"
            >
              <span>Explore All Features</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-card border border-border space-y-2 shadow-xs">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-bold">Password Vault</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Store unlimited logins with automatic password generator, 1-click copy, password history, and redirect links.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border space-y-2 shadow-xs">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-purple-500" />
                <h3 className="text-sm font-bold">Bi-Directional Bookmarks Sync</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Vault entries automatically sync to Bookmarks without exposing credentials. Manage categorized site lists cleanly.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border space-y-2 shadow-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold">2FA TOTP Authenticator</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Built-in 2FA code generator with live countdown timers and 1-click clipboard auto-copy for seamless logins.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border space-y-2 shadow-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold">Security Health Audit</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Real-time password audit detecting weak, reused, and dark web breached passwords via k-Anonymity checks.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border space-y-2 shadow-xs">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-bold">Import & Export Preview</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Import from Chrome, Bitwarden, 1Password, or CSV with duplicate detection and conflict resolution choices.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border space-y-2 shadow-xs">
              <div className="flex items-center gap-2">
                <Puzzle className="w-4 h-4 text-purple-500" />
                <h3 className="text-sm font-bold">Chrome & Edge Autofill</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Manifest V3 browser extension with save/update prompts, Shadow DOM protection, and dismissible badge controls.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold tracking-tight">Frequently Asked Questions</h2>
            <p className="text-xs text-muted-foreground">Clear, transparent answers about Xerox architecture and privacy.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="rounded-2xl bg-card border border-border overflow-hidden transition-colors">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-foreground cursor-pointer select-none"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-blue-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="p-4 pt-0 text-xs text-muted-foreground leading-relaxed border-t border-border/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* FINAL CTA BANNER */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="p-8 sm:p-12 rounded-3xl bg-card border border-border text-center space-y-4 shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Ready to take back control of your credentials?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
              Start using Xerox local-first vault today. No cloud accounts, zero subscription fees, and complete local privacy.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('/app')}
                className="py-3 px-8 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition shadow-md cursor-pointer inline-flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>Open Xerox Vault</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <MarketingFooter onNavigate={onNavigate} />
    </div>
  );
};
