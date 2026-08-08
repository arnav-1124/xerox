import React, { useState } from 'react';
import { ViewMode } from '../types';
import {
  ShieldCheck,
  KeyRound,
  Bookmark,
  Puzzle,
  Download,
  Terminal,
  Lock,
  Unlock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Zap,
  Search,
  Copy,
  FolderPlus,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldAlert,
  Clock,
  Laptop,
  HelpCircle,
  Smartphone,
  CreditCard,
  Wand2,
  FileText,
  Database,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';

interface FeatureGuideViewProps {
  onSelectView: (view: ViewMode) => void;
  onOpenCommandPalette: () => void;
}

export const FeatureGuideView: React.FC<FeatureGuideViewProps> = ({
  onSelectView,
  onOpenCommandPalette,
}) => {
  const [activeSection, setActiveSection] = useState<string>('vault');
  const [demoPassVisible, setDemoPassVisible] = useState(false);
  const [copiedDemo, setCopiedDemo] = useState(false);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCopyDemo = () => {
    setCopiedDemo(true);
    setTimeout(() => setCopiedDemo(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-10 p-4 sm:p-6 pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-secondary/50 p-8 sm:p-10 shadow-xs">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Visual Guide</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
            Discover Everything Xerox Vault Can Do
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            A privacy-first, zero-knowledge password manager and smart bookmark hub. Everything is encrypted locally on your browser using AES-256-GCM. Explore all features below with step-by-step instructions.
          </p>

          {/* Quick Nav Anchors */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              onClick={() => scrollToSection('vault')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSection === 'vault'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent border border-border'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" /> Password Vault
            </button>
            <button
              onClick={() => scrollToSection('bookmarks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSection === 'bookmarks'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent border border-border'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" /> Smart Bookmarks
            </button>
            <button
              onClick={() => scrollToSection('totp')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSection === 'totp'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent border border-border'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> 2FA TOTP Codes
            </button>
            <button
              onClick={() => scrollToSection('cards-notes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSection === 'cards-notes'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent border border-border'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" /> Cards & Notes
            </button>
            <button
              onClick={() => scrollToSection('generator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSection === 'generator'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent border border-border'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" /> Password Studio
            </button>
            <button
              onClick={() => scrollToSection('security')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSection === 'security'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent border border-border'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Security Audit
            </button>
            <button
              onClick={() => scrollToSection('extension')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSection === 'extension'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent border border-border'
              }`}
            >
              <Puzzle className="w-3.5 h-3.5" /> Chrome Autofill
            </button>
            <button
              onClick={() => scrollToSection('migration')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSection === 'migration'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent border border-border'
              }`}
            >
              <Download className="w-3.5 h-3.5" /> CSV / JSON Backup
            </button>
            <button
              onClick={() => scrollToSection('command')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSection === 'command'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent border border-border'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" /> Quick Hotkeys
            </button>
          </div>
        </div>
      </div>

      {/* Feature 1: Password Vault */}
      <section id="vault" className="space-y-6 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 font-bold text-lg">
              1
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Zero-Knowledge Password Vault</h2>
              <p className="text-xs text-muted-foreground">
                AES-256-GCM encryption with client-side Web Crypto API and automatic vault locking.
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectView('passwords')}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <span>Open Password Vault</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Instructions Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                How to Use the Vault
              </h3>
              <ol className="space-y-3 text-xs text-muted-foreground list-none">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-secondary border border-border text-foreground font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                    1
                  </span>
                  <span>
                    <strong className="text-foreground">Set Master Password:</strong> Create a single master key. It is hashed locally with PBKDF2 (100,000 iterations). We never store or send your master key.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-secondary border border-border text-foreground font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                    2
                  </span>
                  <span>
                    <strong className="text-foreground">Add & Generate Passwords:</strong> Save website logins or generate strong 16+ character passwords with 1-click.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-secondary border border-border text-foreground font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                    3
                  </span>
                  <span>
                    <strong className="text-foreground">Auto-Lock Protection:</strong> Configure an idle timeout in Settings (e.g. 15 minutes) to automatically encrypt and lock your memory state.
                  </span>
                </li>
              </ol>
            </div>

            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs text-blue-500 space-y-1">
              <span className="font-bold block">🔒 Zero-Knowledge Guarantee:</span>
              <p className="text-[11px] text-muted-foreground">
                Your credentials are stored as encrypted ciphertexts inside local IndexedDB. Even if someone inspects your browser storage, they cannot read your passwords without your master password.
              </p>
            </div>
          </div>

          {/* Interactive UI Screenshot Preview */}
          <div className="lg:col-span-7 border border-border bg-card rounded-2xl overflow-hidden shadow-xs">
            {/* Window Top Bar Mockup */}
            <div className="bg-secondary/60 border-b border-border p-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                <span className="text-[11px] font-mono text-muted-foreground ml-2">Xerox Vault UI — Active Unlocked State</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-semibold flex items-center gap-1">
                <Unlock className="w-3 h-3" /> Vault Unlocked
              </span>
            </div>

            {/* Content Mockup */}
            <div className="p-5 space-y-4 bg-background/50">
              {/* Sample Entry Card */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                      G
                    </div>
                    <div>
                      <span className="font-bold text-sm text-foreground block">GitHub Account</span>
                      <span className="text-[11px] text-muted-foreground font-mono">dev-user@gmail.com</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-secondary text-muted-foreground text-[10px] font-mono border border-border">
                    Developer
                  </span>
                </div>

                {/* Password Field Mockup */}
                <div className="p-2.5 rounded-lg bg-secondary/80 border border-border flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-foreground tracking-widest">
                    {demoPassVisible ? 'G9#kL$2m!vP8xQ1z' : '••••••••••••••••'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDemoPassVisible(!demoPassVisible)}
                      className="p-1.5 hover:bg-accent rounded text-muted-foreground cursor-pointer"
                      title="Toggle Visibility"
                    >
                      {demoPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={handleCopyDemo}
                      className="p-1.5 hover:bg-accent rounded text-muted-foreground cursor-pointer"
                      title="Copy Password"
                    >
                      {copiedDemo ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Strength Meter Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
                    <span>Entropy Rating</span>
                    <span className="text-emerald-500 font-bold">Strong (100%)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-emerald-500 w-full rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Smart Bookmarks */}
      <section id="bookmarks" className="space-y-6 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center shrink-0 font-bold text-lg">
              2
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Smart Web Bookmarks & Quick Launcher</h2>
              <p className="text-xs text-muted-foreground">
                Organize your essential web resources into custom categories with quick launch buttons.
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectView('bookmarks')}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <span>Open Bookmarks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Instructions Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-purple-500" />
                Bookmark Management
              </h3>
              <ol className="space-y-3 text-xs text-muted-foreground list-none">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-secondary border border-border text-foreground font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                    1
                  </span>
                  <span>
                    <strong className="text-foreground">Custom Categories:</strong> Create color-coded categories like "Development", "Design", or "Finance".
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-secondary border border-border text-foreground font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                    2
                  </span>
                  <span>
                    <strong className="text-foreground">Favorites View:</strong> Star your most frequented links to access them in 1 click from the sidebar.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-secondary border border-border text-foreground font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                    3
                  </span>
                  <span>
                    <strong className="text-foreground">Automatic Favicons:</strong> Xerox automatically fetches clean, crisp website favicons for every added link.
                  </span>
                </li>
              </ol>
            </div>
          </div>

          {/* Screenshot Mockup */}
          <div className="lg:col-span-7 border border-border bg-card rounded-2xl overflow-hidden shadow-xs">
            <div className="bg-secondary/60 border-b border-border p-3 flex items-center justify-between">
              <span className="text-[11px] font-mono text-muted-foreground">Bookmark Launcher Grid Preview</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 font-semibold border border-purple-500/20">
                1-Click Launch
              </span>
            </div>

            <div className="p-5 grid grid-cols-2 gap-3 bg-background/50">
              <div className="p-3 rounded-xl border border-border bg-card hover:border-blue-500/50 transition-colors flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs">
                  V
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-foreground block truncate">Vite Docs</span>
                  <span className="text-[10px] text-muted-foreground truncate block">vitejs.dev</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-border bg-card hover:border-emerald-500/50 transition-colors flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">
                  T
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-foreground block truncate">Tailwind CSS</span>
                  <span className="text-[10px] text-muted-foreground truncate block">tailwindcss.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2.5: Integrated 2FA TOTP Authenticator */}
      <section id="totp" className="space-y-6 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 font-bold text-lg">
              2FA
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Integrated 2FA TOTP Authenticator</h2>
              <p className="text-xs text-muted-foreground">
                Replace Google Authenticator or Authy with client-side RFC 6238 time-based 6-digit 2FA code generation.
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectView('passwords')}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <span>View Vault 2FA Codes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2">
              <span className="font-bold text-foreground block">🔑 Base32 Secret Key Storage</span>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Save the secret key provided during 2FA setup (e.g. <code className="text-foreground bg-background px-1 py-0.5 rounded">JBSWY3DPEHPK3PXP</code>) directly inside your encrypted vault entry.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2">
              <span className="font-bold text-foreground block">⚡ Live 30-Second Countdown</span>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                A live Web Crypto HMAC-SHA1 engine updates your 6-digit verification code every 30 seconds automatically without sending data to any external server.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2">
              <span className="font-bold text-foreground block">📋 1-Click Copy Badge</span>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Click any 2FA badge directly inside your password list to copy the active verification code to your clipboard instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2.6: Payment Cards & Secure Notes */}
      <section id="cards-notes" className="space-y-6 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 font-bold text-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Payment Cards & Encrypted Notes</h2>
              <p className="text-xs text-muted-foreground">
                Store credit cards, banking details, recovery codes, and sensitive text notes with zero-knowledge AES-256-GCM encryption.
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectView('passwords')}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <span>Add Card or Note</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
            <div className="flex items-center gap-2 text-blue-500 font-bold text-sm">
              <CreditCard className="w-4 h-4" />
              <span>Payment Cards Vault</span>
            </div>
            <p className="text-muted-foreground leading-relaxed text-[11px]">
              Store cardholder names, 16-digit card numbers, expiration dates, and secret CVV codes. CVV codes remain masked until toggled.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
            <div className="flex items-center gap-2 text-purple-500 font-bold text-sm">
              <FileText className="w-4 h-4" />
              <span>Encrypted Secure Notes</span>
            </div>
            <p className="text-muted-foreground leading-relaxed text-[11px]">
              Store confidential Wi-Fi keys, server SSH secrets, passport numbers, or account recovery phrases safely encrypted under your master password.
            </p>
          </div>
        </div>
      </section>

      {/* Feature 2.7: Standalone Password & Diceware Studio */}
      <section id="generator" className="space-y-6 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-500 flex items-center justify-center shrink-0 font-bold text-lg">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Password & Diceware Passphrase Studio</h2>
              <p className="text-xs text-muted-foreground">
                Generate high-entropy random keys or memorable Diceware passphrases with custom character rules and strength calculators.
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectView('generator')}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <span>Open Generator Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Feature 3: Security Health Audit */}
      <section id="security" className="space-y-6 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 font-bold text-lg">
              3
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Password Security Health Audit</h2>
              <p className="text-xs text-muted-foreground">
                Automatic diagnostics for weak, reused, or stale passwords with 1-click upgrades.
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectView('security-audit')}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <span>Run Health Audit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Audit Features
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span><strong className="text-foreground">Weak Password Alerts:</strong> Highlights short passwords or missing character variety.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span><strong className="text-foreground">Reused Credentials:</strong> Flags identical passwords shared across multiple services.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span><strong className="text-foreground">Stale Passwords:</strong> Identifies accounts unchanged for over 90 days.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span><strong className="text-foreground">1-Click Auto Upgrade:</strong> Generates a high-entropy 16-character replacement instantly.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Screenshot Mockup */}
          <div className="lg:col-span-7 border border-border bg-card rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                <span className="text-[10px] font-semibold text-red-500 block">Weak</span>
                <span className="text-2xl font-bold text-foreground">2</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <span className="text-[10px] font-semibold text-amber-500 block">Reused</span>
                <span className="text-2xl font-bold text-foreground">1</span>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                <span className="text-[10px] font-semibold text-blue-500 block">Stale (&gt;90d)</span>
                <span className="text-2xl font-bold text-foreground">0</span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border bg-background flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-foreground block">Old Email Login</span>
                <span className="text-[10px] text-red-500 font-semibold">⚠️ Weak password detected</span>
              </div>
              <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> 1-Click Upgrade
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 4: Chrome Extension */}
      <section id="extension" className="space-y-6 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 font-bold text-lg">
              4
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Browser Extension Autofill</h2>
              <p className="text-xs text-muted-foreground">
                Build & install your custom Chrome WebExtension package in under 60 seconds.
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectView('extension')}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <span>Extension Settings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Puzzle className="w-4 h-4 text-amber-500" />
                Installation Steps
              </h3>
              <ol className="space-y-3 text-xs text-muted-foreground list-none">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-secondary border border-border text-foreground font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                    1
                  </span>
                  <span>
                    <strong className="text-foreground">Export WebExtension:</strong> Click "Download Extension Zip" from the Extension tab in Xerox.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-secondary border border-border text-foreground font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                    2
                  </span>
                  <span>
                    <strong className="text-foreground">Open Chrome Extensions:</strong> Navigate to <code className="bg-secondary px-1 py-0.5 rounded text-[10px]">chrome://extensions</code> and enable <strong>Developer mode</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-secondary border border-border text-foreground font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                    3
                  </span>
                  <span>
                    <strong className="text-foreground">Load Unpacked:</strong> Click "Load unpacked" and select your extracted Xerox extension folder.
                  </span>
                </li>
              </ol>
            </div>
          </div>

          <div className="lg:col-span-7 border border-border bg-card rounded-2xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Puzzle className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-xs text-foreground">Chrome Extension Popup & Content Overlay Preview</span>
            </div>
            <div className="p-4 rounded-xl bg-background border border-border space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Xerox Autofill Overlay</span>
                <span className="text-[10px] text-emerald-500 font-mono">Connected</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                When visiting websites like <code className="text-foreground">github.com</code> or <code className="text-foreground">google.com</code>, the extension automatically matches your vault entries and offers a 1-click autofill prompt directly inside input fields.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 5: CSV/JSON Migration */}
      <section id="migration" className="space-y-6 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0 font-bold text-lg">
              5
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Data Ownership: CSV & Encrypted JSON Migration</h2>
              <p className="text-xs text-muted-foreground">
                Easily import from or export to Bitwarden, 1Password, Chrome, or encrypted backups.
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectView('settings')}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <span>Open Settings & Storage</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Standard CSV Import/Export</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Export your passwords in unencrypted CSV format compatible with standard password managers like Chrome, Bitwarden, and 1Password. You can also import CSV files directly.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
            <div className="flex items-center gap-2 text-blue-500 font-bold text-sm">
              <Download className="w-4 h-4" />
              <span>Encrypted Backup JSON</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Create a fully encrypted, portable backup payload file. Your passwords stay protected under your master key even during transport.
            </p>
          </div>
        </div>
      </section>

      {/* Feature 6: Quick Hotkeys */}
      <section id="command" className="space-y-6 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-500 flex items-center justify-center shrink-0 font-bold text-lg">
              6
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Command Palette & Universal Search</h2>
              <p className="text-xs text-muted-foreground">
                Press <code className="px-1.5 py-0.5 rounded bg-secondary border border-border font-mono text-[11px]">Ctrl + K</code> anywhere to instantly search passwords & bookmarks.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenCommandPalette}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Try Ctrl + K Palette</span>
          </button>
        </div>
      </section>
    </div>
  );
};
