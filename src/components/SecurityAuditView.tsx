import React, { useState, useMemo } from 'react';
import { PasswordEntry } from '../types';
import { calculatePasswordStrength, generateSecurePassword, checkPasswordBreached } from '../lib/crypto';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  KeyRound,
  ExternalLink,
  Lock,
  Unlock,
  CheckCircle2,
  Copy,
  Sparkles,
  Search,
  Clock,
  CopyCheck,
  Flame,
  Loader2,
} from 'lucide-react';

interface SecurityAuditViewProps {
  passwords: PasswordEntry[];
  isUnlocked: boolean;
  onUnlockClick: () => void;
  onEditPassword: (entry: PasswordEntry) => void;
  onUpdatePassword: (entry: PasswordEntry) => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SecurityAuditView: React.FC<SecurityAuditViewProps> = ({
  passwords,
  isUnlocked,
  onUnlockClick,
  onEditPassword,
  onUpdatePassword,
  addToast,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'weak' | 'reused' | 'stale' | 'breached'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isScanningBreaches, setIsScanningBreaches] = useState(false);
  const [breachedMap, setBreachedMap] = useState<Record<string, number>>({});

  const handleScanBreaches = async () => {
    if (!isUnlocked || passwords.length === 0) return;
    setIsScanningBreaches(true);
    addToast('Scanning passwords against HaveIBeenPwned k-Anonymity database...', 'info');

    const results: Record<string, number> = {};
    let breachCount = 0;

    for (const entry of passwords) {
      const res = await checkPasswordBreached(entry.password);
      if (res.breached) {
        results[entry.id] = res.count;
        breachCount++;
      }
    }

    setBreachedMap(results);
    setIsScanningBreaches(false);

    if (breachCount > 0) {
      addToast(`⚠️ Found ${breachCount} compromised password(s) in public data breaches!`, 'error');
    } else {
      addToast('✅ Great news! None of your saved passwords were found in dark web breach dumps.', 'success');
    }
  };

  // Analyze Passwords
  const auditResults = useMemo(() => {
    if (!isUnlocked || passwords.length === 0) {
      return {
        score: 100,
        weakList: [],
        reusedList: [],
        staleList: [],
        total: passwords.length,
      };
    }

    const weakList: PasswordEntry[] = [];
    const reusedMap: Map<string, PasswordEntry[]> = new Map();
    const staleList: PasswordEntry[] = [];

    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

    passwords.forEach((entry) => {
      // Check strength
      const strength = calculatePasswordStrength(entry.password);
      if (strength.score < 60 || entry.password.length < 10) {
        weakList.push(entry);
      }

      // Check reuse
      if (entry.password) {
        const existing = reusedMap.get(entry.password) || [];
        existing.push(entry);
        reusedMap.set(entry.password, existing);
      }

      // Check age
      const updatedTime = entry.updatedAt || entry.createdAt || Date.now();
      if (updatedTime < ninetyDaysAgo) {
        staleList.push(entry);
      }
    });

    // Reused list flatten
    const reusedList: PasswordEntry[] = [];
    reusedMap.forEach((entries) => {
      if (entries.length > 1) {
        reusedList.push(...entries);
      }
    });

    // Calculate overall score (0 to 100)
    let scoreDeductions = 0;
    scoreDeductions += weakList.length * 15;
    scoreDeductions += (reusedList.length / 2) * 20;
    scoreDeductions += staleList.length * 5;

    const finalScore = Math.max(10, Math.min(100, 100 - scoreDeductions));

    return {
      score: Math.round(finalScore),
      weakList,
      reusedList,
      staleList,
      total: passwords.length,
    };
  }, [passwords, isUnlocked]);

  const handleCopyPassword = (pass: string, id: string) => {
    navigator.clipboard.writeText(pass);
    setCopiedId(id);
    addToast('Password copied to clipboard', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAutoUpgradePassword = (entry: PasswordEntry) => {
    const newPass = generateSecurePassword({
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
    });

    const updated = {
      ...entry,
      password: newPass,
      updatedAt: Date.now(),
    };

    onUpdatePassword(updated);
    addToast(`Upgraded password for ${entry.websiteName}`, 'success');
  };

  if (!isUnlocked) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Vault is Locked</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Unlock your Xerox Password Vault with your Master Password to run a real-time security audit on your saved credentials.
          </p>
        </div>
        <button
          onClick={onUnlockClick}
          className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold text-sm shadow-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2 rounded-lg cursor-pointer"
        >
          <Unlock className="w-4 h-4" />
          Unlock Vault
        </button>
      </div>
    );
  }

  const filteredEntries = passwords.filter((entry) => {
    const matchesSearch =
      entry.websiteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.username.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'weak') {
      return auditResults.weakList.some((e) => e.id === entry.id);
    }
    if (filterType === 'reused') {
      return auditResults.reusedList.some((e) => e.id === entry.id);
    }
    if (filterType === 'stale') {
      return auditResults.staleList.some((e) => e.id === entry.id);
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 p-4 sm:p-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            <span>Zero-Knowledge Security Audit</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Password Health Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Calculated locally on your browser without transmitting any password data to external servers.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleScanBreaches}
            disabled={isScanningBreaches}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isScanningBreaches ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Flame className="w-3.5 h-3.5" />
            )}
            <span>k-Anonymity Leak Scan</span>
          </button>

          <button
            onClick={() => addToast('Security audit refreshed', 'info')}
            className="px-4 py-2 bg-secondary text-secondary-foreground border border-border text-xs font-medium rounded-lg hover:bg-accent transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Re-Analyze
          </button>
        </div>
      </div>

      {/* Score Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Main Health Score */}
        <div className="md:col-span-1 border border-border bg-card p-5 rounded-2xl flex flex-col justify-between shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Overall Health
          </span>
          <div className="my-4 flex items-baseline gap-2">
            <span
              className={`text-5xl font-extrabold tracking-tight ${
                auditResults.score >= 80
                  ? 'text-emerald-500'
                  : auditResults.score >= 60
                  ? 'text-amber-500'
                  : 'text-red-500'
              }`}
            >
              {auditResults.score}%
            </span>
            <span className="text-xs font-medium text-muted-foreground">/ 100</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            {auditResults.score >= 80
              ? 'Excellent vault security standard.'
              : auditResults.score >= 60
              ? 'Good, but some passwords need attention.'
              : 'Action needed: weak or reused passwords detected.'}
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => setFilterType(filterType === 'weak' ? 'all' : 'weak')}
            className={`p-5 border rounded-2xl text-left transition-all cursor-pointer ${
              filterType === 'weak'
                ? 'border-red-500 bg-red-500/10 ring-1 ring-red-500'
                : 'border-border bg-card hover:bg-secondary/50'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-semibold">Weak Passwords</span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-3xl font-bold text-foreground">{auditResults.weakList.length}</div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Short or low entropy passwords
            </p>
          </button>

          <button
            onClick={() => setFilterType(filterType === 'reused' ? 'all' : 'reused')}
            className={`p-5 border rounded-2xl text-left transition-all cursor-pointer ${
              filterType === 'reused'
                ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500'
                : 'border-border bg-card hover:bg-secondary/50'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-semibold">Reused Passwords</span>
              <ShieldAlert className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-bold text-foreground">{auditResults.reusedList.length}</div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Used across multiple sites
            </p>
          </button>

          <button
            onClick={() => setFilterType(filterType === 'stale' ? 'all' : 'stale')}
            className={`p-5 border rounded-2xl text-left transition-all cursor-pointer ${
              filterType === 'stale'
                ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500'
                : 'border-border bg-card hover:bg-secondary/50'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-semibold">Stale (&gt;90 days)</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-foreground">{auditResults.staleList.length}</div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Not updated in over 3 months
            </p>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border border-border bg-card p-4 rounded-xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              filterType === 'all'
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            All Accounts ({passwords.length})
          </button>
          <button
            onClick={() => setFilterType('weak')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              filterType === 'weak'
                ? 'bg-red-500 text-white font-semibold'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            Weak ({auditResults.weakList.length})
          </button>
          <button
            onClick={() => setFilterType('reused')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              filterType === 'reused'
                ? 'bg-amber-500 text-white font-semibold'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            Reused ({auditResults.reusedList.length})
          </button>
          <button
            onClick={() => setFilterType('stale')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              filterType === 'stale'
                ? 'bg-blue-500 text-white font-semibold'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            Stale ({auditResults.staleList.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search credentials..."
            className="w-full pl-9 pr-3 py-1.5 bg-background border border-input text-xs rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Password Issues List */}
      <div className="border border-border bg-card rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>Account Credential</span>
          <span>Security Diagnostics & Actions</span>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-xs space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="font-medium text-foreground">No password issues found for this filter!</p>
            <p className="text-[11px]">Your passwords meet the current health guidelines.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredEntries.map((entry) => {
              const strength = calculatePasswordStrength(entry.password);
              const isWeak = auditResults.weakList.some((e) => e.id === entry.id);
              const isReused = auditResults.reusedList.some((e) => e.id === entry.id);
              const isStale = auditResults.staleList.some((e) => e.id === entry.id);

              return (
                <div
                  key={entry.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground truncate">
                        {entry.websiteName}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground font-mono">
                        {entry.category}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground font-mono truncate">
                      {entry.username || 'No Username'}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {isWeak && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-500 font-semibold">
                          <AlertTriangle className="w-3 h-3" /> Weak Password
                        </span>
                      )}
                      {isReused && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 font-semibold">
                          <ShieldAlert className="w-3 h-3" /> Reused Across Vault
                        </span>
                      )}
                      {isStale && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-500 font-semibold">
                          <Clock className="w-3 h-3" /> Password Age: {Math.floor((Date.now() - (entry.updatedAt || entry.createdAt || Date.now())) / (1000 * 60 * 60 * 24))}d
                        </span>
                      )}
                      {!isWeak && !isReused && !isStale && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Strong & Unique
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => handleCopyPassword(entry.password, entry.id)}
                      className="p-2 bg-secondary border border-border text-foreground hover:bg-accent rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                      title="Copy Password"
                    >
                      {copiedId === entry.id ? (
                        <CopyCheck className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => handleAutoUpgradePassword(entry)}
                      className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 font-medium text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      1-Click Upgrade
                    </button>

                    <button
                      onClick={() => onEditPassword(entry)}
                      className="px-3 py-1.5 bg-secondary text-secondary-foreground border border-border hover:bg-accent font-medium text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Credential
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
