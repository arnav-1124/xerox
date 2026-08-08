import React, { useState } from 'react';
import {
  Wand2,
  Copy,
  CopyCheck,
  RefreshCw,
  ShieldCheck,
  Zap,
  Sliders,
  Flame,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { calculatePasswordStrength, generateSecurePassword } from '../lib/crypto';

// Diceware wordlist dictionary (curated memorable English words)
const DICEWARE_WORDS = [
  'correct', 'horse', 'battery', 'staple', 'galaxy', 'quantum', 'cipher', 'vector',
  'monarch', 'nebula', 'glacier', 'horizon', 'phantom', 'solstice', 'vanguard',
  'cascade', 'eclipse', 'pyramid', 'sentinel', 'velvet', 'aurora', 'catalyst',
  'domino', 'falcon', 'gravity', 'harmony', 'infinity', 'javelin', 'kingdom',
  'lantern', 'magnet', 'nautilus', 'odyssey', 'pioneer', 'quartz', 'radiant',
  'sapphire', 'titanium', 'umbrella', 'vortex', 'whisper', 'xenon', 'yearling', 'zenith'
];

interface StandaloneGeneratorViewProps {
  onCopyText: (text: string, label: string) => void;
}

export const StandaloneGeneratorView: React.FC<StandaloneGeneratorViewProps> = ({ onCopyText }) => {
  const [mode, setMode] = useState<'random' | 'passphrase'>('random');

  // Random Password Config
  const [length, setLength] = useState<number>(18);
  const [includeUpper, setIncludeUpper] = useState<boolean>(true);
  const [includeLower, setIncludeLower] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);

  // Diceware Passphrase Config
  const [wordCount, setWordCount] = useState<number>(4);
  const [separator, setSeparator] = useState<string>('-');
  const [capitalizeWords, setCapitalizeWords] = useState<boolean>(true);

  // Generated Result & History
  const [generatedResult, setGeneratedResult] = useState<string>(() => generateSecurePassword(18, true, true, true, true));
  const [history, setHistory] = useState<Array<{ id: string; val: string; timestamp: number }>>([]);
  const [copied, setCopied] = useState<boolean>(false);

  const handleGenerate = () => {
    let result = '';
    if (mode === 'random') {
      result = generateSecurePassword(length, includeUpper, includeLower, includeNumbers, includeSymbols);
    } else {
      const words: string[] = [];
      const array = new Uint32Array(wordCount);
      window.crypto.getRandomValues(array);
      for (let i = 0; i < wordCount; i++) {
        let word = DICEWARE_WORDS[array[i] % DICEWARE_WORDS.length];
        if (capitalizeWords) {
          word = word.charAt(0).toUpperCase() + word.slice(1);
        }
        words.push(word);
      }
      result = words.join(separator);
    }

    setGeneratedResult(result);
    setCopied(false);
    setHistory((prev) => [{ id: 'pwd-' + Date.now(), val: result, timestamp: Date.now() }, ...prev.slice(0, 9)]);
  };

  const handleCopy = () => {
    onCopyText(generatedResult, 'Generated Password');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const strength = calculatePasswordStrength(generatedResult);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 text-foreground">
      {/* Header Bar */}
      <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[11px] font-semibold uppercase tracking-wider mb-2">
            <Wand2 className="w-3.5 h-3.5" />
            <span>Cryptographic Studio</span>
          </div>
          <h2 className="text-xl font-bold">Password & Passphrase Generator</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Generate high-entropy keys locally using browser WebCrypto CSPRNG engine.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex rounded-xl bg-muted p-1 border border-border shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setMode('random')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === 'random'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Random Characters
          </button>
          <button
            onClick={() => setMode('passphrase')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === 'passphrase'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Diceware Passphrase
          </button>
        </div>
      </div>

      {/* Main Display Box */}
      <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/60 p-4 rounded-xl border border-border">
          <div className="font-mono text-base sm:text-lg font-bold tracking-wider break-all text-center sm:text-left selection:bg-blue-500 selection:text-white">
            {generatedResult || 'Click generate below'}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={handleGenerate}
              className="p-2.5 rounded-lg bg-secondary border border-border hover:bg-accent text-secondary-foreground transition-all cursor-pointer"
              title="Regenerate Password"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {copied ? <CopyCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
            </button>
          </div>
        </div>

        {/* Strength Meter Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-muted-foreground">Entropy Strength:</span>
            <span
              className={
                strength.score > 80
                  ? 'text-emerald-500 font-bold'
                  : strength.score > 50
                  ? 'text-amber-500 font-bold'
                  : 'text-destructive font-bold'
              }
            >
              {strength.label} ({strength.score}/100)
            </span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-300 ${
                strength.score > 80
                  ? 'bg-emerald-500'
                  : strength.score > 50
                  ? 'bg-amber-500'
                  : 'bg-destructive'
              }`}
              style={{ width: `${strength.score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Control Sliders & Switches */}
      <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-xs space-y-6">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Sliders className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-bold">Customization Parameters</h3>
        </div>

        {mode === 'random' ? (
          <div className="space-y-5 text-xs">
            {/* Length Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center font-semibold">
                <span>Password Length: {length} Characters</span>
                <span className="text-muted-foreground text-[11px]">{length < 12 ? 'Weak' : length < 16 ? 'Good' : 'Strong'}</span>
              </div>
              <input
                type="range"
                min={8}
                max={64}
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Checkboxes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/50 border border-border hover:bg-muted cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={includeUpper}
                  onChange={(e) => setIncludeUpper(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span className="font-semibold">Uppercase (A-Z)</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/50 border border-border hover:bg-muted cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={includeLower}
                  onChange={(e) => setIncludeLower(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span className="font-semibold">Lowercase (a-z)</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/50 border border-border hover:bg-muted cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={includeNumbers}
                  onChange={(e) => setIncludeNumbers(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span className="font-semibold">Numbers (0-9)</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/50 border border-border hover:bg-muted cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={includeSymbols}
                  onChange={(e) => setIncludeSymbols(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span className="font-semibold">Symbols (!@#$)</span>
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-5 text-xs">
            {/* Word Count Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center font-semibold">
                <span>Passphrase Word Count: {wordCount} Words</span>
                <span className="text-emerald-500 font-semibold">{wordCount >= 4 ? 'Memorable & High Entropy' : 'Moderate'}</span>
              </div>
              <input
                type="range"
                min={3}
                max={8}
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">Word Separator Character</label>
                <input
                  type="text"
                  maxLength={3}
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-border font-mono text-center outline-none focus:border-ring"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2.5 p-2.5 w-full rounded-xl bg-muted/50 border border-border cursor-pointer">
                  <input
                    type="checkbox"
                    checked={capitalizeWords}
                    onChange={(e) => setCapitalizeWords(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span className="font-semibold">Capitalize First Letter of Words</span>
                </label>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Wand2 className="w-4 h-4" />
          <span>Generate New Password</span>
        </button>
      </div>

      {/* History Section */}
      {history.length > 0 && (
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
              Recent Generated Keys ({history.length})
            </span>
            <button
              onClick={() => setHistory([])}
              className="text-muted-foreground hover:text-foreground text-[11px]"
            >
              Clear History
            </button>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {history.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50 font-mono text-xs hover:bg-muted transition-colors"
              >
                <span className="truncate max-w-[280px] sm:max-w-md font-semibold">{h.val}</span>
                <button
                  onClick={() => onCopyText(h.val, 'Generated Key')}
                  className="p-1 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                  title="Copy"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
