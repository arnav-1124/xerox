import React from 'react';
import { MarketingHeader } from '../../components/marketing/MarketingHeader';
import { MarketingFooter } from '../../components/marketing/MarketingFooter';
import { ShieldCheck, Lock, Fingerprint, KeyRound, Cpu, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface MarketingSecurityProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onNavigate: (path: string) => void;
}

export const MarketingSecurity: React.FC<MarketingSecurityProps> = ({
  theme,
  onToggleTheme,
  onNavigate,
}) => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <MarketingHeader theme={theme} onToggleTheme={onToggleTheme} currentPath="/security" onNavigate={onNavigate} />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        {/* Page Title */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Cryptographic Architecture & Threat Model</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Zero-Knowledge Envelope Security</h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Lokker uses a 3-tier Envelope Encryption Model (VEK / KEK) designed so that plaintext data exists only in ephemeral client memory.
          </p>
        </div>

        {/* Key Hierarchy Section */}
        <div className="bg-card border border-border rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-500" />
            <span>3-Tier Key Encryption Architecture</span>
          </h2>

          <div className="p-4 rounded-lg bg-background border border-border font-mono text-xs text-muted-foreground leading-relaxed">
            <div className="text-blue-500 font-bold mb-2">VEK / KEK Hierarchy Diagram:</div>
            <pre className="overflow-x-auto">
{`  Master Password  ──────► Password KEK  ──────┐
  Recovery Key     ──────► Recovery KEK  ──────┼──► Unwrap VEK ──► AES-GCM Encrypted Vault
  Touch ID / PRF   ──────► Biometric KEK ─────┘`}
            </pre>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-1.5">
              <span className="font-bold text-foreground">Vault Encryption Key (VEK)</span>
              <p className="text-muted-foreground">
                Random 256-bit AES-GCM key generated via <code className="font-mono text-[11px]">crypto.getRandomValues()</code>. Encrypts the entire vault payload directly.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-1.5">
              <span className="font-bold text-foreground">Key Encryption Key (KEK)</span>
              <p className="text-muted-foreground">
                Derived via PBKDF2 (SHA-256, 100,000 iterations, 16-byte random salt). Used to wrap/unwrap the VEK via AES-GCM.
              </p>
            </div>
          </div>
        </div>

        {/* WebAuthn PRF & Recovery Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl bg-card border border-border space-y-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
              <Fingerprint className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold">WebAuthn PRF Hardware Protection</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Biometric unlock derives a <code className="font-mono">Biometric KEK</code> directly from hardware authenticator WebAuthn PRF evaluation bytes (<code className="font-mono">eval: &#123; first: salt &#125;</code>). <strong>Your Master Password is NEVER stored or XORed.</strong>
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border space-y-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold">Genuine Offline Recovery Key</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Generates a 256-bit emergency recovery key formatted as <code className="font-mono">XXXX-XXXX-XXXX-...</code>. Derives an RKEK via PBKDF2 to unwrap the VEK and restore vault access without data loss.
            </p>
          </div>
        </div>

        {/* Origin Guard & Tamper Resistance */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-xs">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>Phishing Guard & AES-GCM Integrity</span>
          </h3>

          <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p>
              • <strong>AES-GCM Tag Tamper Resistance:</strong> Any 1-byte mutation of ciphertext, IV, salt, or wrapped VEK triggers immediate authentication tag rejection.
            </p>
            <p>
              • <strong>Extension Origin Allowlist:</strong> Extension synchronization messages are strictly filtered against an explicit origin allowlist. Unrelated origins or phishing sites are rejected.
            </p>
          </div>
        </div>
      </main>

      <MarketingFooter onNavigate={onNavigate} />
    </div>
  );
};
