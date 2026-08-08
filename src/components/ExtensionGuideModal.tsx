import React, { useState } from 'react';
import { X, Puzzle, Download, CheckCircle2, ArrowRight, ShieldCheck, Chrome } from 'lucide-react';
import { generateExtensionZip } from '../lib/extensionExporter';

interface ExtensionGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExtensionGuideModal: React.FC<ExtensionGuideModalProps> = ({ isOpen, onClose }) => {
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownloadZip = async () => {
    setDownloading(true);
    try {
      const blob = await generateExtensionZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'xerox-browser-extension-mv3.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download extension failed', e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-2xl bg-popover border border-border rounded-2xl p-6 sm:p-8 shadow-2xl text-popover-foreground relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center text-xl shadow-sm">
            🧩
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Xerox Chrome / Edge Extension</h2>
            <p className="text-xs text-muted-foreground">Real browser password autofill with Manifest V3 local security.</p>
          </div>
        </div>

        {/* Big Download Callout */}
        <div className="p-5 rounded-2xl bg-muted border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Manifest V3 Extension Ready</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Download the unpacked extension package zip file and load it directly in Chrome or Edge in 30 seconds.
            </p>
          </div>

          <button
            onClick={handleDownloadZip}
            disabled={downloading}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 shrink-0 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Preparing Zip...' : 'Download Extension (.zip)'}</span>
          </button>
        </div>

        {/* Step-by-Step Guide */}
        <div className="space-y-4 text-xs">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Installation Instructions</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-muted/60 border border-border space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-300 flex items-center justify-center text-[10px]">
                  1
                </span>
                <span>Unzip Package</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Click <strong>Download Extension (.zip)</strong> above and extract the folder to your computer.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/60 border border-border space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-300 flex items-center justify-center text-[10px]">
                  2
                </span>
                <span>Open Extensions Page</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                In Chrome, go to <code className="text-blue-500 dark:text-blue-300">chrome://extensions</code>. In Edge, go to{' '}
                <code className="text-blue-500 dark:text-blue-300">edge://extensions</code>.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/60 border border-border space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-300 flex items-center justify-center text-[10px]">
                  3
                </span>
                <span>Enable Developer Mode</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Toggle the <strong>Developer mode</strong> switch in the upper right corner of the Extensions page.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/60 border border-border space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-300 flex items-center justify-center text-[10px]">
                  4
                </span>
                <span>Load Unpacked</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Click <strong>Load unpacked</strong> button and select the unzipped <code>extension</code> folder.
              </p>
            </div>
          </div>

          {/* Autofill demonstration note */}
          <div className="p-4 rounded-xl bg-muted border border-border space-y-2 mt-4">
            <div className="font-semibold text-foreground flex items-center gap-2">
              <span>🔐 How Real Autofill Operates</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground text-[11px] leading-relaxed">
              <li>When visiting sites like github.com, Xerox detects password fields automatically.</li>
              <li>A subtle 🔐 badge appears next to the password input field.</li>
              <li>Clicking the badge searches your local Xerox vault for matching origin domain credentials.</li>
              <li>You authorize autofill with a single click, filling credentials cleanly via native DOM events.</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end pt-5 mt-5 border-t border-border">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-accent text-secondary-foreground transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
