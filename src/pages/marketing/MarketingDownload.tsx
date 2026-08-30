import React from 'react';
import { MarketingHeader } from '../../components/marketing/MarketingHeader';
import { MarketingFooter } from '../../components/marketing/MarketingFooter';
import { Puzzle, Download, CheckCircle2, ShieldCheck, Chrome, ExternalLink, ArrowRight } from 'lucide-react';
import { generateExtensionZip } from '../../lib/extensionExporter';

interface MarketingDownloadProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onNavigate: (path: string) => void;
}

export const MarketingDownload: React.FC<MarketingDownloadProps> = ({
  theme,
  onToggleTheme,
  onNavigate,
}) => {
  const [downloading, setDownloading] = React.useState(false);

  const handleDownloadZip = async () => {
    setDownloading(true);
    try {
      const blob = await generateExtensionZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'lokker-browser-extension-mv3.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <MarketingHeader theme={theme} onToggleTheme={onToggleTheme} currentPath="/download" onNavigate={onNavigate} />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold">
            <Puzzle className="w-3.5 h-3.5" />
            <span>Manifest V3 Extension Package</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Download Lokker Extension</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Enjoy real password autofill directly in website login forms across Chrome, Edge, Brave, and Chromium browsers.
          </p>
        </div>

        {/* Download Box */}
        <div className="bg-card border border-border rounded-xl p-8 text-center space-y-4 shadow-sm max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-xl bg-blue-600/10 border border-blue-600/20 text-blue-600 flex items-center justify-center mx-auto text-2xl">
            🧩
          </div>
          <h2 className="text-lg font-bold">Chrome & Edge Real Autofill Package</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Download the ready-to-load Manifest V3 zip package containing background service workers, content scripts, and Shadow DOM autofill injectors.
          </p>
          <button
            onClick={handleDownloadZip}
            disabled={downloading}
            className="py-3 px-6 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition shadow-sm cursor-pointer inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Preparing Package...' : 'Download Extension Package (.zip)'}</span>
          </button>
        </div>

        {/* Setup Steps */}
        <div className="bg-card border border-border rounded-xl p-6 sm:p-8 space-y-4 shadow-xs">
          <h3 className="text-base font-bold text-foreground">3-Step Installation Guide</h3>
          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">1</span>
              <div>
                <strong className="text-foreground block">Extract the ZIP file</strong>
                Extract the downloaded <code className="font-mono text-[11px]">lokker-browser-extension-mv3.zip</code> to a permanent folder on your computer.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">2</span>
              <div>
                <strong className="text-foreground block">Open Chrome Extensions</strong>
                Navigate to <code className="font-mono text-[11px]">chrome://extensions</code> or <code className="font-mono text-[11px]">edge://extensions</code> and enable <strong>Developer mode</strong>.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">3</span>
              <div>
                <strong className="text-foreground block">Load Unpacked Extension</strong>
                Click <strong>"Load unpacked"</strong> and select the extracted extension directory.
              </div>
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter onNavigate={onNavigate} />
    </div>
  );
};
