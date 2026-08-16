import React, { useState } from 'react';
import { ViewMode } from '../types';
import {
  ShieldCheck,
  KeyRound,
  Bookmark,
  Puzzle,
  Download,
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
  Info,
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

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12 p-4 sm:p-8 pb-20">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 sm:p-10 shadow-sm">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simple User & Office Guide</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
            How to Use Xerox Every Day
          </h1>

          <p className="text-base text-muted-foreground leading-relaxed">
            Welcome to your secure digital workspace! Xerox helps you organize passwords, bookmarks, confidential documents, and 2FA codes in one private vault stored directly on your computer. Here is a simple guide with real-life examples on how to use every feature.
          </p>

          {/* Quick Navigation Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-3">
            {[
              { id: 'vault', label: 'Password Vault', icon: KeyRound },
              { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
              { id: 'totp', label: '2FA TOTP Codes', icon: Smartphone },
              { id: 'files', label: 'Encrypted Files', icon: FileText },
              { id: 'generator', label: 'Password Studio', icon: Wand2 },
              { id: 'security', label: 'Security Health', icon: ShieldCheck },
              { id: 'extension', label: 'Browser Extension', icon: Puzzle },
              { id: 'backup', label: 'Backup & Restore', icon: Database },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => scrollToSection(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                      : 'bg-secondary text-secondary-foreground hover:bg-accent border border-border'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 1: Password Vault */}
      <div id="vault" className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Core Feature 1</div>
            <h2 className="text-2xl font-bold text-foreground">Password Vault</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Store all your website logins, office usernames, and passwords safely behind your Master Password.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-3 bg-secondary/30 p-5 rounded-2xl border border-border">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Real-Life Example
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You log into your company’s HR portal, your bank, and your personal email. Instead of writing them on a sticky note or reusing the same password, you save them here. Next time, you can instantly copy your username or password with one click.
            </p>
          </div>

          <div className="space-y-3 bg-secondary/30 p-5 rounded-2xl border border-border">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              How to Use
            </h3>
            <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside leading-relaxed">
              <li>Click on <span className="font-semibold text-foreground">Password Vault</span> in the left menu.</li>
              <li>Click <span className="font-semibold text-foreground">"Add Password"</span> in the top right.</li>
              <li>Enter the website name (e.g. <i>Work Gmail</i>), your email, and password.</li>
              <li>Click save! Your data is instantly encrypted and locked.</li>
            </ol>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => onSelectView('passwords')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <span>Open Password Vault</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Section 2: Smart Bookmarks */}
      <div id="bookmarks" className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Core Feature 2</div>
            <h2 className="text-2xl font-bold text-foreground">Smart Bookmark Manager</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Organize your favorite work tools, news sites, and reference links with automatic website icons and categories.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-3 bg-secondary/30 p-5 rounded-2xl border border-border">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Real-Life Example
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You often visit 5 different project dashboards every morning. Instead of keeping 20 browser tabs open, save them under a "Work Projects" category so you can open them in one click.
            </p>
          </div>

          <div className="space-y-3 bg-secondary/30 p-5 rounded-2xl border border-border">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              How to Use
            </h3>
            <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside leading-relaxed">
              <li>Click <span className="font-semibold text-foreground">Bookmarks</span> in the sidebar.</li>
              <li>Click <span className="font-semibold text-foreground">"Add Bookmark"</span>.</li>
              <li>Paste the web address (URL) and give it a helpful title.</li>
              <li>Assign it to a category like "Development" or "Entertainment".</li>
            </ol>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => onSelectView('bookmarks')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
          >
            <span>Open Bookmarks Manager</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Section 3: 2FA TOTP Codes */}
      <div id="totp" className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">Core Feature 3</div>
            <h2 className="text-2xl font-bold text-foreground">2FA TOTP Authenticator</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Generate 6-digit security codes right on your screen without needing to look at your phone.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-3 bg-secondary/30 p-5 rounded-2xl border border-border">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Is 2FA Generation Real? How it Works
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Yes! 2FA TOTP (Time-based One-Time Password, RFC 6238) is 100% real and standard. When you set up 2FA on Google, GitHub, or office portals, instead of scanning the QR code with a phone app, you save the secret text key here. Xerox uses the exact same mathematical formula (HMAC-SHA1 with the current 30-second clock) to generate live 6-digit codes right on your device—completely offline, without needing SMS or phone carrier signals!
            </p>
          </div>

          <div className="space-y-3 bg-secondary/30 p-5 rounded-2xl border border-border">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-500" />
              How to Use
            </h3>
            <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside leading-relaxed">
              <li>When editing any password entry, paste your 2FA secret key in the TOTP field.</li>
              <li>Click <span className="font-semibold text-foreground">2FA TOTP Codes</span> in the sidebar.</li>
              <li>See live ticking 6-digit codes and click to copy them instantly!</li>
            </ol>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => onSelectView('totp')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
          >
            <span>Open 2FA TOTP Vault</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Section 4: Encrypted Files */}
      <div id="files" className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Core Feature 4</div>
            <h2 className="text-2xl font-bold text-foreground">Encrypted File & Document Vault</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Store confidential files, tax forms, passport scans, and digital certificates with military-grade encryption.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-3 bg-secondary/30 p-5 rounded-2xl border border-border">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Real-Life Example
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You have a PDF scan of your passport or a private SSH key for your company server. Instead of leaving them unencrypted in your Downloads folder, drag and drop them here so they are locked away safely.
            </p>
          </div>

          <div className="space-y-3 bg-secondary/30 p-5 rounded-2xl border border-border">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-500" />
              How to Use
            </h3>
            <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside leading-relaxed">
              <li>Click <span className="font-semibold text-foreground">Encrypted Files</span> in the sidebar.</li>
              <li>Drag and drop your file into the box or click "Upload File".</li>
              <li>Download or decrypt your file anytime with a single click.</li>
            </ol>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => onSelectView('files')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <span>Open File Vault</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Section 5: Password Studio */}
      <div id="generator" className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Wand2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">Core Feature 5</div>
            <h2 className="text-2xl font-bold text-foreground">Password Studio & Generator</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Instantly create unbreakable, cryptographically secure passwords and memorable passphrase sentences.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-3 bg-secondary/30 p-5 rounded-2xl border border-border">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Real-Life Example
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When creating a new account, websites require complex symbols, uppercase letters, and numbers. Use the Password Studio to generate a 32-character random masterpiece instantly.
            </p>
          </div>

          <div className="space-y-3 bg-secondary/30 p-5 rounded-2xl border border-border">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-rose-500" />
              How to Use
            </h3>
            <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside leading-relaxed">
              <li>Click <span className="font-semibold text-foreground">Password Studio</span> in the sidebar.</li>
              <li>Adjust the length slider or toggle special symbols.</li>
              <li>Click copy and paste into your signup form!</li>
            </ol>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => onSelectView('generator')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
          >
            <span>Open Password Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Section 6: Security Health Audit */}
      <div id="security" className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Core Feature 6</div>
            <h2 className="text-2xl font-bold text-foreground">Security Health Audit</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Instantly scan your vault for weak, reused, or compromised passwords so you can fix them before trouble starts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-3 bg-secondary/30 p-5 rounded-2xl border border-border">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Real-Life Example
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If you used "Password123" for three different websites, the Security Health scanner will flag it as a reused password risk, helping you secure your accounts.
            </p>
          </div>

          <div className="space-y-3 bg-secondary/30 p-5 rounded-2xl border border-border">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-500" />
              How to Use
            </h3>
            <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside leading-relaxed">
              <li>Click <span className="font-semibold text-foreground">Security Health</span> in the sidebar.</li>
              <li>Review your overall security score and warning lists.</li>
              <li>Follow recommendations to update vulnerable passwords.</li>
            </ol>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => onSelectView('security-audit')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <span>Open Security Health Audit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Section 7: Browser Extension */}
      <div id="extension" className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <Puzzle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-1">Core Feature 7</div>
            <h2 className="text-2xl font-bold text-foreground">Browser Extension (Auto-Fill)</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Download the free Chrome/Edge extension to automatically fill login forms on any website without copying and pasting.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-3 bg-secondary/30 p-5 rounded-2xl border border-border">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Real-Life Example
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When visiting Netflix.com, the extension automatically detects the login form and lets you sign in with one click using your saved credentials.
            </p>
          </div>

          <div className="space-y-3 bg-secondary/30 p-5 rounded-2xl border border-border">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-500" />
              How to Use
            </h3>
            <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside leading-relaxed">
              <li>Click <span className="font-semibold text-foreground">Browser Extension</span> in the sidebar.</li>
              <li>Click <span className="font-semibold text-foreground">Download Extension (.zip)</span>.</li>
              <li>Load unpacked in Chrome extensions settings (free & no store fee).</li>
            </ol>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => onSelectView('extension')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
          >
            <span>Open Browser Extension Guide</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Section 8: Backup & Restore */}
      <div id="backup" className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">Core Feature 8</div>
            <h2 className="text-2xl font-bold text-foreground">Encrypted Backups & Export</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Keep your data safe by downloading an encrypted backup file to your computer or USB drive.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-3 bg-secondary/30 p-5 rounded-2xl border border-border">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Real-Life Example
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Before getting a new computer or laptop, export your encrypted vault file. On your new device, import the file and enter your master password to restore everything instantly.
            </p>
          </div>

          <div className="space-y-3 bg-secondary/30 p-5 rounded-2xl border border-border">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" />
              How to Use
            </h3>
            <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside leading-relaxed">
              <li>Click <span className="font-semibold text-foreground">Import / Export</span> in the sidebar.</li>
              <li>Click <span className="font-semibold text-foreground">Download Encrypted Backup</span>.</li>
              <li>Store the file securely on a USB drive or secure folder.</li>
            </ol>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => onSelectView('import-export')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline"
          >
            <span>Open Import / Export</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Section 9: Vercel Health & Cron Keep-Alive */}
      <div id="health-cron" className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Server & Deployment</div>
            <h2 className="text-2xl font-bold text-foreground">Vercel Health & Cron Keep-Alive Routes</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Active API endpoints configured to keep your serverless instances warm and responsive.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-3 bg-secondary/30 p-5 rounded-2xl border border-border">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Available Endpoints
            </h3>
            <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside leading-relaxed">
              <li><code className="text-foreground bg-background px-1.5 py-0.5 rounded border border-border">/api/health</code>: Returns server uptime, status timestamp, and service info.</li>
              <li><code className="text-foreground bg-background px-1.5 py-0.5 rounded border border-border">/api/ping</code>: Lightweight ping check returning pong status.</li>
            </ul>
          </div>

          <div className="space-y-3 bg-secondary/30 p-5 rounded-2xl border border-border">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-500" />
              How to Start a Cron Job
            </h3>
            <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside leading-relaxed">
              <li><span className="font-semibold text-foreground">Vercel Cron:</span> Automatically configured in <code className="text-foreground bg-background px-1 py-0.5 rounded border border-border">vercel.json</code> to ping <code className="text-foreground">/api/health</code> every 10 minutes.</li>
              <li><span className="font-semibold text-foreground">External Cron (GitHub Actions, UptimeRobot, etc.):</span> Set up a scheduled task to send a GET request to your deployed app URL: <code className="text-foreground bg-background px-1 py-0.5 rounded border border-border">https://your-app.vercel.app/api/health</code>.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
