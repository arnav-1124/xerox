import React from 'react';
import { ShieldCheck, Github, Lock } from 'lucide-react';

interface MarketingFooterProps {
  onNavigate: (path: string) => void;
}

export const MarketingFooter: React.FC<MarketingFooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-card border-t border-border py-12 px-4 sm:px-6 text-foreground">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Column */}
        <div className="space-y-3 md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
              🔐
            </div>
            <span className="font-extrabold text-base tracking-tight">Lokker</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Local-first password vault, 2FA TOTP authenticator, and browser autofill extension. Your credentials stay on your device.
          </p>
          <div className="pt-1 flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Zero-Knowledge AES-GCM 256-bit</span>
          </div>
        </div>

        {/* Product Navigation */}
        <div className="space-y-2 text-xs">
          <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">Product</h4>
          <ul className="space-y-1.5 text-muted-foreground">
            <li>
              <button onClick={() => onNavigate('/features')} className="hover:text-foreground transition-colors cursor-pointer">
                Features Overview
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/download')} className="hover:text-foreground transition-colors cursor-pointer">
                Extension Download
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/app')} className="hover:text-foreground transition-colors cursor-pointer">
                Open Vault Dashboard
              </button>
            </li>
          </ul>
        </div>

        {/* Security & Architecture */}
        <div className="space-y-2 text-xs">
          <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">Security & Privacy</h4>
          <ul className="space-y-1.5 text-muted-foreground">
            <li>
              <button onClick={() => onNavigate('/security')} className="hover:text-foreground transition-colors cursor-pointer">
                Cryptographic Architecture
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/privacy')} className="hover:text-foreground transition-colors cursor-pointer">
                Privacy Policy
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/docs')} className="hover:text-foreground transition-colors cursor-pointer">
                Documentation & Guides
              </button>
            </li>
          </ul>
        </div>

        {/* Open Source & Links */}
        <div className="space-y-2 text-xs">
          <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">Repository</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Open-source code available on GitHub. Verify security locally on your own machine.
          </p>
          <a
            href="https://github.com/arnav-1124/xerox"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-muted border border-border text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub Repository</span>
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground">
        <div>© 2026 Lokker. Stored on your device. Zero telemetry.</div>
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('/privacy')} className="hover:text-foreground">Privacy</button>
          <button onClick={() => onNavigate('/security')} className="hover:text-foreground">Security</button>
          <button onClick={() => onNavigate('/docs')} className="hover:text-foreground">Docs</button>
        </div>
      </div>
    </footer>
  );
};
