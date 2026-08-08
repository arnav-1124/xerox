import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Bookmark,
  Puzzle,
  Download,
  Lock,
  Unlock,
  GripVertical,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Database,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Zap
} from 'lucide-react';
import { ViewMode } from '../types';

interface LandingHeroProps {
  onNavigate: (view: ViewMode) => void;
  onOpenExtensionGuide: () => void;
  isUnlocked: boolean;
  onUnlockClick: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onNavigate,
  onOpenExtensionGuide,
  isUnlocked,
  onUnlockClick,
}) => {
  // Demo interactive form state for live draggable widget testing
  const [demoUsername, setDemoUsername] = useState('');
  const [demoPassword, setDemoPassword] = useState('');
  const [demoFilled, setDemoFilled] = useState(false);

  // Draggable widget positioning state for live demo
  const [widgetPos, setWidgetPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; initX: number; initY: number }>({ x: 0, y: 0, initX: 0, initY: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initX: widgetPos.x,
      initY: widgetPos.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setWidgetPos({
      x: dragStartRef.current.initX + dx,
      y: dragStartRef.current.initY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTriggerDemoAutofill = () => {
    setDemoUsername('alex.dev@xerox.local');
    setDemoPassword('Xerox#Super$ecure2026!');
    setDemoFilled(true);
    setTimeout(() => setDemoFilled(false), 3000);
  };

  return (
    <div
      className="space-y-16 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-card via-card/90 to-background border border-border/80 p-8 sm:p-12 shadow-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-semibold tracking-wide">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Zero Cloud • 100% Client-Side Privacy • AES-256</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Local-First Vault & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500">Movable Autofill</span> Extension
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
            Xerox stores all your passwords and bookmarks directly on your device using <strong>PBKDF2</strong> key derivation and <strong>AES-GCM 256-bit encryption</strong>. No servers, no tracking, and no external dependencies.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {!isUnlocked ? (
              <button
                onClick={onUnlockClick}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2 active:scale-95"
              >
                <Unlock className="w-4 h-4" />
                <span>Unlock Password Vault</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigate('passwords')}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2 active:scale-95"
              >
                <KeyRound className="w-4 h-4" />
                <span>Open Passwords Vault</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('bookmarks')}
              className="px-6 py-3 rounded-xl bg-secondary hover:bg-accent text-secondary-foreground font-semibold text-xs sm:text-sm border border-border transition-all flex items-center gap-2 active:scale-95"
            >
              <Bookmark className="w-4 h-4 text-blue-400" />
              <span>Browse Bookmarks</span>
            </button>

            <button
              onClick={onOpenExtensionGuide}
              className="px-6 py-3 rounded-xl bg-card hover:bg-accent/80 text-foreground font-semibold text-xs sm:text-sm border border-blue-500/30 transition-all flex items-center gap-2 active:scale-95"
            >
              <Puzzle className="w-4 h-4 text-indigo-400" />
              <span>Download Extension</span>
            </button>
          </div>
        </div>
      </section>

      {/* Feature 1: Live Draggable Widget Demo */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500 mb-1">
              <GripVertical className="w-4 h-4" />
              <span>New Feature Highlight</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Movable & Draggable Extension Autofill Badge
            </h2>
          </div>
          <p className="text-xs text-muted-foreground max-w-md">
            The Xerox extension inserts a floating widget onto web login inputs. You can click and drag it anywhere on the screen so it never blocks input text or custom UI!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
          {/* Interactive Demo Sandbox */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between bg-muted/50 px-4 py-2.5 rounded-xl border border-border text-xs">
              <span className="font-semibold text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Interactive Sandbox Demo
              </span>
              <span className="text-[11px] text-muted-foreground">Drag badge & test click</span>
            </div>

            <div className="relative min-h-[260px] bg-background/80 border border-border rounded-2xl p-6 flex flex-col justify-center gap-4 overflow-hidden shadow-inner">
              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-foreground">Sign In to Acme Inc</h3>
                <p className="text-xs text-muted-foreground">Simulated target website login form</p>
              </div>

              <div className="space-y-3 max-w-md mx-auto w-full">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={demoUsername}
                    onChange={(e) => setDemoUsername(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-card border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="relative">
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={demoPassword}
                    onChange={(e) => setDemoPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-card border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 pr-28"
                  />

                  {/* Live Draggable Xerox Badge Simulation */}
                  <div
                    style={{
                      transform: `translate(${widgetPos.x}px, ${widgetPos.y}px)`,
                    }}
                    className={`absolute right-2 top-8 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-blue-500 text-slate-100 shadow-xl text-xs select-none cursor-grab active:cursor-grabbing transition-shadow ${
                      isDragging ? 'ring-2 ring-blue-400 scale-105' : 'hover:border-blue-400'
                    }`}
                    onMouseDown={handleMouseDown}
                  >
                    <GripVertical className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="text-sm">🔐</span>
                    <span className="font-bold text-[11px] text-blue-400">Xerox</span>
                    <button
                      onClick={handleTriggerDemoAutofill}
                      className="ml-1 px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] transition-colors"
                      title="Click to autofill credentials"
                    >
                      Autofill
                    </button>
                  </div>
                </div>

                {demoFilled && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Credentials filled automatically from Xerox Vault!</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Explanation Box */}
          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">Why Movable Widgets Matter</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Many modern password managers place rigid icons that cover unmask-password toggles or custom inputs. Xerox lets you <strong>drag the badge anywhere on screen</strong>.
              </p>
            </div>

            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-xs text-foreground">
                <div className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span><strong>Full Pointer Dragging:</strong> Smooth mouse & touch gesture support.</span>
              </li>
              <li className="flex items-start gap-3 text-xs text-foreground">
                <div className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span><strong>Instant 1-Click Fill:</strong> Direct dispatch of input events matching React & standard DOM input listeners.</span>
              </li>
              <li className="flex items-start gap-3 text-xs text-foreground">
                <div className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span><strong>Safe Domain Match:</strong> Strictly verifies protocol and domain before authorization.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Feature 2: Core Security Architecture */}
      <section className="space-y-6">
        <div className="border-b border-border pb-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-500 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero-Knowledge Security</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            How Xerox Protects Your Passwords
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-3 hover:border-blue-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-card-foreground">PBKDF2 Key Derivation</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your Master Password undergoes 100,000 PBKDF2 iterations with SHA-256 and salt to generate a 256-bit AES cryptographic key right inside browser memory.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border space-y-3 hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-card-foreground">AES-GCM 256 Encryption</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Vault items are encrypted using WebCrypto AES-GCM before writing to local IndexedDB/LocalStorage. Data remains unreadable ciphertext on disk.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border space-y-3 hover:border-indigo-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-card-foreground">Zero Cloud Storage</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No backend servers, no analytics, no remote DBs. You have 100% data ownership with full offline export and import capabilities.
            </p>
          </div>
        </div>
      </section>

      {/* Feature 3: How to Get Started */}
      <section className="space-y-6">
        <div className="border-b border-border pb-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-500 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Getting Started Guide</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Get Up and Running in 3 Easy Steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative p-6 rounded-2xl bg-card border border-border space-y-3">
            <div className="text-2xl font-black text-blue-500 font-mono">01</div>
            <h3 className="text-base font-bold text-foreground">Create Master Password</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Initialize your local vault with a strong Master Password. Remember: zero recovery means you hold the only key.
            </p>
          </div>

          <div className="relative p-6 rounded-2xl bg-card border border-border space-y-3">
            <div className="text-2xl font-black text-indigo-500 font-mono">02</div>
            <h3 className="text-base font-bold text-foreground">Add Passwords & Links</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Store login credentials and organize bookmarks with custom categories, colors, and search tags.
            </p>
          </div>

          <div className="relative p-6 rounded-2xl bg-card border border-border space-y-3">
            <div className="text-2xl font-black text-emerald-500 font-mono">03</div>
            <h3 className="text-base font-bold text-foreground">Install Extension</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Download the zip bundle, load unpacked in Chrome/Edge (<code>chrome://extensions</code>), and enjoy movable browser autofill!
            </p>
          </div>
        </div>

        <div className="pt-4 text-center">
          <button
            onClick={onOpenExtensionGuide}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/20 transition-all inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Real Autofill Chrome Extension (.Zip)</span>
          </button>
        </div>
      </section>
    </div>
  );
};
