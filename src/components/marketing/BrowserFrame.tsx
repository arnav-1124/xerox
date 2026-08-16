import React from 'react';

interface BrowserFrameProps {
  url?: string;
  children: React.ReactNode;
  className?: string;
}

export const BrowserFrame: React.FC<BrowserFrameProps> = ({
  url = 'https://xerox.local/vault',
  children,
  className = '',
}) => {
  return (
    <div className={`rounded-2xl border border-border bg-card shadow-2xl overflow-hidden ${className}`}>
      {/* Browser Bar */}
      <div className="bg-muted/80 border-b border-border px-4 py-2.5 flex items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
        </div>

        {/* Address Bar */}
        <div className="flex-1 max-w-xl mx-auto bg-background/80 border border-border rounded-lg px-3 py-1 text-center font-mono text-[11px] text-muted-foreground truncate flex items-center justify-center gap-1.5 shadow-inner">
          <span className="text-emerald-500 font-bold">🔒</span>
          <span className="truncate">{url}</span>
        </div>

        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0 hidden sm:block">
          Local Vault
        </div>
      </div>

      {/* Content */}
      <div className="relative overflow-hidden bg-background">
        {children}
      </div>
    </div>
  );
};
