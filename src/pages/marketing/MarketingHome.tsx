import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
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
  Github,
  Key,
  Smartphone,
  RefreshCw,
  Search,
  Check,
  X,
  FileText,
  AlertTriangle,
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
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<'vault' | 'locked' | 'autofill' | 'totp'>('vault');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const faqs = [
    {
      q: 'Does Lokker store my passwords on a server?',
      a: 'No. Lokker operates no central password database. Your master password, encryption keys, and vault entries are generated, encrypted, and stored entirely within your browser local IndexedDB database on your own device.',
    },
    {
      q: 'Does Lokker have a server-side password database?',
      a: 'No. Lokker is engineered around a local-first philosophy. There is no cloud backend storing or processing your plaintext passwords or encrypted blobs.',
    },
    {
      q: 'Does my master password leave my device?',
      a: 'Never. Your master password is used client-side to derive a Key Encryption Key (KEK) via PBKDF2 (100,000 iterations) with SHA-256 and WebCrypto. It is never transmitted across the network.',
    },
    {
      q: 'Can I use Lokker without an account?',
      a: 'Yes. Lokker requires zero account registration, email confirmation, or credit card for local vault usage. You open the application and your vault exists on your device.',
    },
    {
      q: 'Can Lokker work offline?',
      a: 'Yes, 100%. The application is bundled with a Service Worker that enables full offline execution. Both the web vault and the browser extension operate completely without an internet connection.',
    },
    {
      q: 'How does browser autofill work?',
      a: 'Lokker includes a Manifest V3 browser extension. When you navigate to a login page, the extension inspects form fields locally, checks your unlocked vault for matching domain origins, and securely fills the credentials with your explicit authorization via Shadow DOM isolation.',
    },
    {
      q: 'How does Lokker verify websites against phishing?',
      a: 'The extension extracts the fully qualified domain and matches credentials strictly against the active tab domain. It never injects credentials into unverified origins or untrusted frames.',
    },
    {
      q: 'What happens if I forget my master password?',
      a: 'During setup, Lokker generates a 256-bit cryptographic Emergency Recovery Key. If you forget your master password, you can use this key to unwrap your Vault Encryption Key (VEK) and set a new master password.',
    },
    {
      q: 'How does biometric / passkey unlocking work?',
      a: 'Lokker supports WebAuthn PRF (Pseudo-Random Function) extension. When configured, your device hardware authenticator (Touch ID, Windows Hello, or security key) derives an encryption key to unlock your vault without retyping your password.',
    },
    {
      q: 'Can I export and import my vault?',
      a: 'Yes. You can export both encrypted and plaintext JSON backups or standard CSV files. You can import from Chrome, Bitwarden, 1Password, Firefox, and standard CSV formats with an instant pre-import conflict preview.',
    },
    {
      q: 'Is Lokker open source?',
      a: 'Yes. Lokker source code is available on GitHub under the GNU Affero General Public License (AGPLv3). You can inspect every cryptographic primitive, storage contract, and extension script yourself.',
    },
    {
      q: 'What happens if Lokker website goes offline?',
      a: 'Your vault continues to function completely because it is stored locally in your browser IndexedDB and the extension operates standalone. You retain full ownership of your data at all times.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. Header Navigation */}
      <MarketingHeader theme={theme} onToggleTheme={onToggleTheme} currentPath="/" onNavigate={onNavigate} />

      <main className="flex-1 space-y-16 sm:space-y-24 py-8 sm:py-12">
        {/* 2. HERO SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-6 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Local-First Password Vault</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight text-foreground">
            Your passwords don't need a server.
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Lokker stores your encrypted vault locally and keeps your master password on your device. Manage credentials, generate 2FA codes, and autofill securely without handing your vault to a centralized password database.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('/app')}
              className="w-full sm:w-auto py-3 px-6 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Open Vault App</span>
            </button>

            <button
              onClick={() => onNavigate('/security')}
              className="w-full sm:w-auto py-3 px-6 rounded-lg text-sm font-semibold bg-card hover:bg-muted text-foreground border border-border transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4 text-blue-500" />
              <span>See How It Works</span>
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="pt-6 border-t border-border/60 max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs text-muted-foreground">
            <div className="flex items-center justify-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Local-First</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Encrypted Locally</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>No Mandatory Account</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Browser Autofill</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 font-medium col-span-2 sm:col-span-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Open Source</span>
            </div>
          </div>
        </section>

        {/* 3. REAL PRODUCT SHOWCASE */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Store it. Lock it. Use it.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              Experience the actual Lokker application interface. Clean, fast, and engineered strictly for your local workflow.
            </p>
          </div>

          {/* Interactive Showcase Tabs */}
          <div className="flex items-center justify-center gap-2 border-b border-border pb-3">
            {[
              { id: 'vault', label: 'Vault View' },
              { id: 'locked', label: 'Locked State' },
              { id: 'autofill', label: 'Browser Autofill' },
              { id: 'totp', label: '2FA TOTP' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveShowcaseTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeShowcaseTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <BrowserFrame url={`https://lokker.local/${activeShowcaseTab === 'vault' ? 'passwords' : activeShowcaseTab}`}>
            {activeShowcaseTab === 'vault' && (
              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-foreground">Password Vault</h3>
                    <p className="text-[11px] text-muted-foreground">3 credentials stored &bull; AES-GCM 256-bit encrypted</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Decrypted in Memory
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { site: 'GitHub', user: 'alex.developer@example.com', cat: 'Developer', score: 'Strong' },
                    { site: 'ProtonMail', user: 'alex.vault@proton.me', cat: 'Personal', score: 'Very Strong' },
                    { site: 'AWS Console', user: 'admin-iam-production', cat: 'Infrastructure', score: 'Strong' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center font-bold text-foreground">
                          {item.site[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{item.site}</div>
                          <div className="text-muted-foreground font-mono text-[11px]">{item.user}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-muted-foreground hidden sm:inline">{item.cat}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          {item.score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeShowcaseTab === 'locked' && (
              <div className="p-8 sm:p-12 text-center space-y-4 max-w-md mx-auto">
                <div className="w-12 h-12 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center text-xl mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">Vault Locked</h3>
                  <p className="text-xs text-muted-foreground">
                    All cryptographic keys have been cleared from memory. Enter your master password or use WebAuthn PRF biometric unlock.
                  </p>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="h-9 rounded-lg bg-muted border border-border flex items-center px-3 text-xs text-muted-foreground">
                    &bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;
                  </div>
                  <button className="w-full py-2 rounded-lg bg-blue-600 text-white text-xs font-bold">
                    Unlock Vault
                  </button>
                </div>
              </div>
            )}

            {activeShowcaseTab === 'autofill' && (
              <div className="p-6 space-y-4 max-w-lg mx-auto">
                <div className="p-4 rounded-lg bg-card border border-border space-y-3">
                  <div className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>Sign in to github.com</span>
                    <span className="text-[10px] text-emerald-500 font-mono">Domain Matched</span>
                  </div>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground">Username</label>
                      <div className="h-8 rounded bg-muted/60 border border-border px-2.5 flex items-center text-xs text-foreground font-mono">
                        alex.developer@example.com
                      </div>
                    </div>
                    <div className="space-y-1 relative">
                      <label className="text-[11px] text-muted-foreground">Password</label>
                      <div className="h-8 rounded bg-muted/60 border border-border px-2.5 flex items-center justify-between text-xs font-mono">
                        <span>&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;</span>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold">
                          🔐 Lokker Autofill
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  Isolated Shadow DOM prevents host page scripts from tampering with the Lokker extension badge.
                </p>
              </div>
            )}

            {activeShowcaseTab === 'totp' && (
              <div className="p-6 space-y-4 max-w-md mx-auto">
                <div className="p-4 rounded-lg bg-card border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-foreground">GitHub 2FA Verification</div>
                    <span className="text-[10px] text-blue-500 font-mono">RFC 6238 TOTP</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded bg-muted/50 border border-border">
                    <div className="text-2xl font-mono font-bold tracking-widest text-blue-500">
                      482 910
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-500">22s</div>
                      <div className="text-[10px] text-muted-foreground">remaining</div>
                    </div>
                  </div>
                  <button className="w-full py-1.5 rounded bg-secondary text-secondary-foreground text-xs font-medium border border-border">
                    Copy TOTP Code
                  </button>
                </div>
              </div>
            )}
          </BrowserFrame>
        </section>

        {/* 4. WHY LOCAL-FIRST? */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Why Local-First Architecture Matters
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto">
              Your password manager shouldn't need custody of your passwords. Centralized password servers create high-value breach targets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Traditional Cloud Model */}
            <div className="p-6 rounded-xl bg-card border border-border space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Traditional Cloud Architecture</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono text-destructive bg-destructive/10 border border-destructive/20">
                  Centralized Custody
                </span>
              </div>
              <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-3 text-xs">
                <div className="flex items-center justify-between font-mono text-muted-foreground">
                  <span>Your Device</span>
                  <span>&rarr;</span>
                  <span className="text-destructive">Cloud Server Database</span>
                  <span>&rarr;</span>
                  <span>Remote Sync</span>
                </div>
                <ul className="space-y-1.5 text-muted-foreground text-xs">
                  <li className="flex items-start gap-1.5">
                    <span className="text-destructive font-bold">&times;</span>
                    <span>Encrypted vaults stored on remote vendor servers</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-destructive font-bold">&times;</span>
                    <span>Mandatory user accounts and authentication sessions</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-destructive font-bold">&times;</span>
                    <span>Single server breach puts millions of vaults at risk</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Lokker Local-First Model */}
            <div className="p-6 rounded-xl bg-card border border-blue-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Lokker Local-First Model</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-500 bg-emerald-500/10 border border-emerald-500/20">
                  Zero Server Custody
                </span>
              </div>
              <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-3 text-xs">
                <div className="flex items-center justify-between font-mono text-muted-foreground">
                  <span>Your Device</span>
                  <span>&rarr;</span>
                  <span className="text-emerald-500">AES-GCM Encryption</span>
                  <span>&rarr;</span>
                  <span className="text-foreground">Local IndexedDB</span>
                </div>
                <ul className="space-y-1.5 text-muted-foreground text-xs">
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Vault encrypted and stored strictly on your local hardware</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Zero mandatory accounts or centralized credential databases</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Full functionality remains 100% operational offline</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 5. WHAT HAPPENS TO YOUR PASSWORD? (Encryption Flow) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              What Happens to Your Master Password?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              Lokker implements a 3-tier Envelope Encryption Model (VEK / KEK). Your master password never encrypts the data directly.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border space-y-6 max-w-4xl mx-auto">
            {/* Flow Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center text-xs">
              <div className="p-3 rounded-lg bg-muted/60 border border-border space-y-1">
                <div className="font-bold text-foreground">1. Master Password</div>
                <div className="text-[10px] text-muted-foreground">Entered locally</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/60 border border-border space-y-1">
                <div className="font-bold text-blue-500">2. Derive KEK</div>
                <div className="text-[10px] text-muted-foreground">PBKDF2 100k iters</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/60 border border-border space-y-1">
                <div className="font-bold text-blue-500">3. Unwrap VEK</div>
                <div className="text-[10px] text-muted-foreground">Vault Encryption Key</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/60 border border-border space-y-1">
                <div className="font-bold text-emerald-500">4. AES-GCM 256</div>
                <div className="text-[10px] text-muted-foreground">Payload encryption</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/60 border border-border space-y-1">
                <div className="font-bold text-foreground">5. IndexedDB</div>
                <div className="text-[10px] text-muted-foreground">Local storage</div>
              </div>
            </div>

            {/* Toggle Technical Deep Dive */}
            <div className="text-center pt-2">
              <button
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="text-xs font-semibold text-blue-500 hover:text-blue-400 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{showTechnicalDetails ? 'Hide Technical Details' : 'View Technical Cryptographic Details'}</span>
                {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showTechnicalDetails && (
              <div className="p-4 rounded-lg bg-muted/30 border border-border text-xs text-muted-foreground space-y-3 font-mono">
                <div><strong>Key Derivation:</strong> PBKDF2-HMAC-SHA256, 100,000 iterations with 16-byte cryptographically secure random salt via <code>crypto.getRandomValues()</code>.</div>
                <div><strong>Cipher:</strong> AES-GCM with 256-bit key length and 12-byte initialization vector (IV) generated per write operation.</div>
                <div><strong>Envelope Architecture:</strong> Vault Encryption Key (VEK) is wrapped separately by the Password KEK, Emergency Recovery KEK, and optional WebAuthn PRF KEK. Password changes re-wrap the VEK in &lt;5ms without re-encrypting the vault payload.</div>
                <div><strong>Memory Lifetime:</strong> Decrypted items exist strictly in ephemeral component memory. Locking clears all key bundles immediately.</div>
              </div>
            )}
          </div>
        </section>

        {/* 6. SECURITY ARCHITECTURE */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Security Architecture
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              Every component is built on standard Web Crypto API primitives and platform security boundaries.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-card border border-border space-y-2">
              <Lock className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-bold text-foreground">AES-GCM 256-bit</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Authenticated encryption ensures both confidentiality and cryptographic integrity for every vault entry.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-card border border-border space-y-2">
              <Key className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-bold text-foreground">VEK / KEK Envelope</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Decouples master password authentication from payload encryption, enabling instant password rotation and recovery paths.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-card border border-border space-y-2">
              <Fingerprint className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-bold text-foreground">WebAuthn PRF</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Derives symmetric keys directly from hardware passkeys and biometric authenticators without server involvement.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-card border border-border space-y-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-bold text-foreground">Origin Verification</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Extension content scripts enforce strict origin allowlisting before processing any sync or autofill message.
              </p>
            </div>
          </div>
        </section>

        {/* 7. WHAT LOKKER DOES NOT HAVE (Trust Section) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              What We Don't Need to Protect Your Vault
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              Our infrastructure is designed so that we never have custody of your credentials.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-xl bg-card border border-border space-y-1.5">
              <div className="text-destructive font-bold text-base">&times;</div>
              <div className="text-xs font-bold text-foreground">No Plaintext Database</div>
              <div className="text-[11px] text-muted-foreground">We operate no server-side password repository.</div>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border space-y-1.5">
              <div className="text-destructive font-bold text-base">&times;</div>
              <div className="text-xs font-bold text-foreground">No Master Password Storage</div>
              <div className="text-[11px] text-muted-foreground">Your master password stays exclusively on your device.</div>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border space-y-1.5">
              <div className="text-destructive font-bold text-base">&times;</div>
              <div className="text-xs font-bold text-foreground">No Mandatory Cloud Account</div>
              <div className="text-[11px] text-muted-foreground">No registration or email required for local use.</div>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border space-y-1.5">
              <div className="text-destructive font-bold text-base">&times;</div>
              <div className="text-xs font-bold text-foreground">No Analytics Trackers</div>
              <div className="text-[11px] text-muted-foreground">Zero third-party telemetry, trackers, or pixel beacons.</div>
            </div>
          </div>
        </section>

        {/* 8. BROWSER AUTOFILL */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Browser Autofill With User Authorization
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              Lokker autofills only when you authorize it. The extension runs in an isolated Shadow DOM container to prevent malicious page tampering.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border max-w-3xl mx-auto space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
                <div className="font-bold text-foreground">1. Login Page</div>
                <div className="text-[10px] text-muted-foreground">User navigates to site</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
                <div className="font-bold text-blue-500">2. Field Detection</div>
                <div className="text-[10px] text-muted-foreground">Extension finds inputs</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
                <div className="font-bold text-blue-500">3. Domain Check</div>
                <div className="text-[10px] text-muted-foreground">Matches active origin</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
                <div className="font-bold text-emerald-500">4. User Autofill</div>
                <div className="text-[10px] text-muted-foreground">1-click authorization</div>
              </div>
            </div>
          </div>
        </section>

        {/* 9. COMPLETE SECURITY TOOLKIT */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              A Complete Local Security Toolkit
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              Everything you need for credential hygiene and private authentication in a single lightweight application.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-card border border-border space-y-2">
              <KeyRound className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-bold text-foreground">Password Vault</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Store passwords, usernames, URLs, categories, custom tags, and private notes with instant search.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-card border border-border space-y-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-bold text-foreground">2FA TOTP Authenticator</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                RFC 6238 time-based one-time passcodes with circular countdowns and 1-click clipboard auto-copy.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-card border border-border space-y-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h3 className="text-sm font-bold text-foreground">Security Health Audit</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Local password strength scoring, reused password detection, and k-Anonymity dark web breach checking.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-card border border-border space-y-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-bold text-foreground">Import & Export</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Multi-format parser for Chrome, Bitwarden, 1Password, and CSV with conflict resolution preview.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-card border border-border space-y-2">
              <Bookmark className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-bold text-foreground">Encrypted Bookmarks</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Keep private bookmarks organized alongside your credentials with seamless bidirectional syncing.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-card border border-border space-y-2">
              <Fingerprint className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-bold text-foreground">Passkeys & WebAuthn</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Hardware-bound biometric unlock via Touch ID, Windows Hello, or FIDO2 security keys.
              </p>
            </div>
          </div>
        </section>

        {/* 10. RECOVERY ARCHITECTURE */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Cryptographic Emergency Recovery
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              If you lose your master password, your 256-bit Emergency Recovery Key provides an independent cryptographic recovery path.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border max-w-2xl mx-auto space-y-3 text-xs text-muted-foreground leading-relaxed">
            <p>
              During setup, Lokker generates a high-entropy recovery key formatted in readable 4-character chunks. This key independently wraps your Vault Encryption Key (VEK).
            </p>
            <p>
              Because Lokker has no server database to reset passwords, storing this recovery key securely ensures you can regain access to your vault without vendor intervention.
            </p>
          </div>
        </section>

        {/* 11. OPEN SOURCE / TRANSPARENCY */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <div className="p-8 rounded-xl bg-card border border-border max-w-2xl mx-auto space-y-4">
            <Github className="w-8 h-8 mx-auto text-foreground" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Don't take our word for it. Inspect the code.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Lokker is open source under the AGPLv3 license. You can inspect every cryptographic primitive, verify that no network telemetry exists, and build the extension yourself.
            </p>
            <div className="pt-2">
              <a
                href="https://github.com/arnav-1124/xerox"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-secondary hover:bg-accent text-secondary-foreground border border-border text-xs font-semibold transition"
              >
                <Github className="w-4 h-4" />
                <span>View on GitHub</span>
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
              </a>
            </div>
          </div>
        </section>

        {/* 12. PRIVACY SUMMARY */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Privacy by Architecture
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              We believe privacy should be mathematically enforced by system architecture, not promised in a terms document.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border max-w-3xl mx-auto space-y-3 text-xs text-muted-foreground leading-relaxed">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="font-bold text-foreground mb-1">What is Stored Locally</div>
                <p>Your encrypted vault payload, categories, settings, and encrypted bookmarks reside exclusively in your browser's local IndexedDB.</p>
              </div>
              <div>
                <div className="font-bold text-foreground mb-1">What Leaves Your Device</div>
                <p>Nothing. The only optional outbound request is dark web breach checking, which uses 5-character SHA-1 k-Anonymity prefixes with padding.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 13. FAQ SECTION */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Clear, transparent answers about Lokker architecture, cryptography, and privacy.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-border rounded-xl bg-card overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full py-3.5 px-4 sm:px-5 flex items-center justify-between text-left font-semibold text-xs sm:text-sm text-foreground hover:bg-muted/40 transition cursor-pointer"
                >
                  <span className="pr-4">{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-blue-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </button>

                {openFaq === idx && (
                  <div className="px-4 sm:px-5 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 14. FINAL CTA */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="p-8 sm:p-12 rounded-2xl bg-card border border-border space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Your credentials belong to you.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Start with a private, local-first password vault. No cloud accounts, zero subscription fees, and complete cryptographic control.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('/app')}
                className="py-3 px-8 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition shadow-sm cursor-pointer inline-flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>Open Lokker Vault</span>
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
