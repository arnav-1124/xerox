import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Database, Lock } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
  }

  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Xerox Vault Uncaught Error:', error, errorInfo);
  }

  private handleExportEmergencyBackup = () => {
    try {
      const allData: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          allData[key] = localStorage.getItem(key);
        }
      }
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `xerox-emergency-local-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Could not export emergency backup: ' + (e as Error).message);
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-500/15 border border-red-500/30 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>
            
            <h1 className="text-xl font-bold tracking-tight mb-2">Vault Protection Intercepted Error</h1>
            <p className="text-sm text-slate-400 mb-6">
              Xerox encountered an unexpected state. Your encrypted data remains safe and untouched locally in your browser storage.
            </p>

            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-left font-mono text-xs text-red-300 mb-6 overflow-x-auto max-h-32">
              {this.state.error?.message || 'Unknown runtime error'}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-xl transition shadow-lg shadow-blue-600/20"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Vault Securely
              </button>

              <button
                onClick={this.handleExportEmergencyBackup}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2.5 px-4 rounded-xl transition border border-slate-700"
              >
                <Database className="w-4 h-4 text-emerald-400" />
                Export Raw Local Storage Backup
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span>Zero-Knowledge Architecture • No Data Sent to Cloud</span>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
