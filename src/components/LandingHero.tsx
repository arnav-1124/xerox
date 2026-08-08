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
  Sparkles,
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
  const [demoUsername, setDemoUsername] = useState('');
  const [demoPassword, setDemoPassword] = useState('');
  const [demoFilled, setDemoFilled] = useState(false);

  const [widgetPos, setWidgetPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, initX: 0, initY: 0 });

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
    setWidgetPos({
      x: dragStartRef.current.initX + (e.clientX - dragStartRef.current.x),
      y: dragStartRef.current.initY + (e.clientY - dragStartRef.current.y),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTriggerDemoAutofill = () => {
    setDemoUsername('alex@company.com');
    setDemoPassword('••••••••••••');
    setDemoFilled(true);
    setTimeout(() => setDemoFilled(false), 3000);
  };

  return (
    <div
      className="space-y-12 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* ─── Hero ─── */}
      <section className="border border-border bg-card p-8 sm:p-12 shadow-sm rounded-2xl">
        <div className="max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary border border-border text-muted-foreground text-xs font-medium tracking-wide rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            <span>Private by Design · Encrypted · No Cloud</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
            Your Passwords, Stored Safely on Your Device
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Xerox keeps every password and bookmark locked inside your browser
            using industry-standard encryption. No accounts, no servers, no data
            leaving your machine — ever.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {!isUnlocked ? (
              <button
                onClick={onUnlockClick}
                className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2 rounded-lg cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                Unlock Vault
              </button>
            ) : (
              <button
                onClick={() => onNavigate('passwords')}
                className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2 rounded-lg cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                Open Vault
              </button>
            )}

            <button
              onClick={() => onNavigate('bookmarks')}
              className="px-5 py-2.5 bg-secondary text-secondary-foreground font-medium text-sm border border-border hover:bg-accent transition-colors flex items-center gap-2 rounded-lg cursor-pointer"
            >
              <Bookmark className="w-4 h-4" />
              Bookmarks
            </button>

            <button
              onClick={onOpenExtensionGuide}
              className="px-5 py-2.5 bg-background text-foreground font-medium text-sm border border-border hover:bg-secondary transition-colors flex items-center gap-2 rounded-lg cursor-pointer"
            >
              <Puzzle className="w-4 h-4 text-blue-500" />
              Get Extension
            </button>
          </div>
        </div>
      </section>

      {/* ─── Autofill Demo ─── */}
      <section className="space-y-5">
        <div className="border-b border-border pb-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            <GripVertical className="w-3.5 h-3.5" />
            <span>Autofill</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Drag-and-Drop Password Fill
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-lg">
            The Xerox extension places a small badge next to login fields. Move
            it anywhere so it never gets in your way.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-border bg-card shadow-sm rounded-2xl overflow-hidden">
          {/* Preview Canvas */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:border-r border-border">
            <div className="flex items-center justify-between bg-secondary px-3.5 py-2 border border-border rounded-t-lg text-xs">
              <span className="font-medium text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Interactive Preview
              </span>
              <span className="text-[11px] text-muted-foreground">
                Try dragging the badge
              </span>
            </div>

            <div className="relative min-h-[240px] bg-background p-6 border-x border-b border-border rounded-b-lg flex flex-col justify-center gap-4">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-semibold text-foreground">
                  Sign In to Acme Inc
                </h3>
                <p className="text-xs text-muted-foreground">
                  Example login form
                </p>
              </div>

              <div className="space-y-3 max-w-sm mx-auto w-full">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={demoUsername}
                    onChange={(e) => setDemoUsername(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-3 py-2 bg-card border border-input text-xs text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div className="relative">
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={demoPassword}
                    onChange={(e) => setDemoPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 bg-card border border-input text-xs text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-ring pr-24"
                  />

                  {/* Draggable Xerox badge */}
                  <div
                    style={{
                      transform: `translate(${widgetPos.x}px, ${widgetPos.y}px)`,
                    }}
                    className={`absolute right-2 top-7 z-20 flex items-center gap-1.5 px-2.5 py-1 bg-primary text-primary-foreground border border-border shadow-md text-xs rounded-md select-none cursor-grab active:cursor-grabbing ${
                      isDragging ? 'ring-2 ring-blue-500/50' : ''
                    }`}
                    onMouseDown={handleMouseDown}
                  >
                    <GripVertical className="w-3 h-3 opacity-60 shrink-0" />
                    <span className="font-semibold text-[11px]">Xerox</span>
                    <button
                      onClick={handleTriggerDemoAutofill}
                      className="ml-1 px-1.5 py-0.5 bg-secondary text-secondary-foreground font-semibold text-[10px] border border-border rounded hover:bg-accent transition-colors cursor-pointer"
                    >
                      Fill
                    </button>
                  </div>
                </div>

                {demoFilled && (
                  <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Credentials filled from your vault</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="lg:col-span-5 p-6 sm:p-8 space-y-5">
            <h3 className="text-base font-bold text-foreground">
              Why It Matters
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Most password managers lock their fill button to one spot, often
              covering toggles or custom fields. Xerox lets you reposition it
              freely so it never blocks what you need.
            </p>

            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-xs text-foreground">
                <div className="w-5 h-5 rounded bg-secondary border border-border flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <span>
                  <strong>Drag Anywhere</strong> — Smooth repositioning with
                  mouse or touch.
                </span>
              </li>
              <li className="flex items-start gap-3 text-xs text-foreground">
                <div className="w-5 h-5 rounded bg-secondary border border-border flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <span>
                  <strong>One-Click Fill</strong> — Instantly populates your
                  saved credentials.
                </span>
              </li>
              <li className="flex items-start gap-3 text-xs text-foreground">
                <div className="w-5 h-5 rounded bg-secondary border border-border flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <span>
                  <strong>Site Verification</strong> — Only activates on
                  websites you've saved.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─── Security ─── */}
      <section className="space-y-5">
        <div className="border-b border-border pb-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            How Your Data Stays Protected
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 border border-border rounded-2xl overflow-hidden bg-card">
          <div className="p-6 space-y-3 border-b md:border-b-0 md:border-r border-border">
            <div className="w-8 h-8 rounded bg-secondary border border-border flex items-center justify-center">
              <Lock className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="text-sm font-bold text-foreground">
              Advanced Key Protection
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your master password is strengthened through thousands of
              iterations, producing a unique encryption key that never leaves
              your browser.
            </p>
          </div>

          <div className="p-6 space-y-3 border-b md:border-b-0 md:border-r border-border">
            <div className="w-8 h-8 rounded bg-secondary border border-border flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="text-sm font-bold text-foreground">
              End-to-End Encryption
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every password is locked with military-grade encryption before
              being stored. Even if someone accesses your files, the data is
              unreadable without your key.
            </p>
          </div>

          <div className="p-6 space-y-3">
            <div className="w-8 h-8 rounded bg-secondary border border-border flex items-center justify-center">
              <Zap className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="text-sm font-bold text-foreground">
              Completely Offline
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No servers, no accounts, no internet required. Your vault lives
              entirely on your device — you have full control at all times.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Getting Started ─── */}
      <section className="space-y-5">
        <div className="border-b border-border pb-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Get Started</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Up and Running in Three Steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 border border-border rounded-2xl overflow-hidden bg-card">
          <div className="p-6 space-y-3 border-b md:border-b-0 md:border-r border-border">
            <div className="text-lg font-bold text-blue-500 font-mono">
              01
            </div>
            <h3 className="text-sm font-bold text-foreground">
              Set a Master Password
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Choose a strong password to protect your vault. This is the only
              key — make sure it's one you'll remember.
            </p>
          </div>

          <div className="p-6 space-y-3 border-b md:border-b-0 md:border-r border-border">
            <div className="text-lg font-bold text-blue-500 font-mono">
              02
            </div>
            <h3 className="text-sm font-bold text-foreground">
              Save Your Credentials
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Add logins and organize bookmarks with folders and tags.
              Everything stays encrypted and instantly searchable.
            </p>
          </div>

          <div className="p-6 space-y-3">
            <div className="text-lg font-bold text-blue-500 font-mono">
              03
            </div>
            <h3 className="text-sm font-bold text-foreground">
              Install the Browser Extension
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Load the extension into your browser and enjoy one-click autofill
              on any website you've saved.
            </p>
          </div>
        </div>

        <div className="pt-3">
          <button
            onClick={onOpenExtensionGuide}
            className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold text-sm shadow-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2 rounded-lg cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Browser Extension
          </button>
        </div>
      </section>
    </div>
  );
};
