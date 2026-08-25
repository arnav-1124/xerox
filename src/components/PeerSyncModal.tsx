import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { PeerSyncConnection, mergeVaultData } from '../lib/webrtc';
import { PasswordEntry, Category } from '../types';
import {
  X,
  Smartphone,
  Laptop,
  QrCode,
  Wifi,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  Camera,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

// Re-export the merge utility inside the lib directory for testing
export { mergeVaultData };

interface PeerSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  localPasswords: PasswordEntry[];
  localCategories: Category[];
  onSyncComplete: (newPasswords: PasswordEntry[], newCategories: Category[]) => void;
  addToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

type SyncRole = 'idle' | 'sender' | 'receiver';
type SyncMethod = 'idle' | 'manual' | 'broker';
type ConnectionStatus =
  | 'idle'
  | 'preparing'
  | 'waiting-for-answer'
  | 'connecting-broker'
  | 'joined-room'
  | 'connecting'
  | 'connected'
  | 'syncing'
  | 'finished'
  | 'failed'
  | 'broker-disconnected';

export const PeerSyncModal: React.FC<PeerSyncModalProps> = ({
  isOpen,
  onClose,
  localPasswords,
  localCategories,
  onSyncComplete,
  addToast,
}) => {
  const [role, setRole] = useState<SyncRole>('idle');
  const [method, setMethod] = useState<SyncMethod>('idle');
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Manual code states
  const [localOffer, setLocalOffer] = useState('');
  const [remoteAnswerInput, setRemoteAnswerInput] = useState('');
  const [remoteOfferInput, setRemoteOfferInput] = useState('');
  const [localAnswer, setLocalAnswer] = useState('');
  
  // Clipboard copy states
  const [copiedOffer, setCopiedOffer] = useState(false);
  const [copiedAnswer, setCopiedAnswer] = useState(false);

  // Broker states
  const [pinCode, setPinCode] = useState('');
  const [inputPin, setInputPin] = useState('');

  // Merged items summary
  const [syncSummary, setSyncSummary] = useState<{
    addedPass: number;
    updatedPass: number;
    addedCat: number;
    updatedCat: number;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const connRef = useRef<PeerSyncConnection | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Reset states when closed/opened
  useEffect(() => {
    if (isOpen) {
      setRole('idle');
      setMethod('idle');
      setStatus('idle');
      setErrorMessage('');
      setLocalOffer('');
      setRemoteAnswerInput('');
      setRemoteOfferInput('');
      setLocalAnswer('');
      setPinCode('');
      setInputPin('');
      setSyncSummary(null);
    } else {
      cleanupConnection();
    }
  }, [isOpen]);

  const cleanupConnection = () => {
    if (connRef.current) {
      connRef.current.disconnect();
      connRef.current = null;
    }
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
  };

  // Generate offer QR code canvas
  useEffect(() => {
    const textToEncode = localOffer || localAnswer;
    if (canvasRef.current && textToEncode) {
      QRCode.toCanvas(
        canvasRef.current,
        textToEncode,
        {
          width: 190,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (err) => {
          if (err) console.error('QR code generation error:', err);
        }
      );
    }
  }, [localOffer, localAnswer]);

  const initWebRTC = (): PeerSyncConnection => {
    cleanupConnection();
    const conn = new PeerSyncConnection();
    connRef.current = conn;

    conn.onStatusChange = (newStatus) => {
      setStatus(newStatus as ConnectionStatus);
      if (newStatus === 'connected') {
        addToast('Devices connected! Starting synchronization...', 'info');
        if (role === 'sender') {
          // Send payload automatically once connected
          setTimeout(() => {
            conn.sendPayload({ passwords: localPasswords, categories: localCategories }).catch((err) => {
              setErrorMessage(err.message);
              setStatus('failed');
            });
          }, 800);
        }
      }
    };

    conn.onDataReceived = (incoming) => {
      try {
        const { passwords, categories, summary } = mergeVaultData(
          localPasswords,
          localCategories,
          incoming.passwords || [],
          incoming.categories || []
        );
        onSyncComplete(passwords, categories);
        setSyncSummary(summary);
        setStatus('finished');
        addToast('Vault sync completed successfully!', 'success');
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to merge incoming vault data.');
        setStatus('failed');
      }
    };

    conn.onError = (err) => {
      setErrorMessage(err);
      setStatus('failed');
      addToast(err, 'error');
    };

    return conn;
  };

  // Host Action: Create Offer
  const startHostOffer = async () => {
    setStatus('preparing');
    const conn = initWebRTC();
    try {
      const base64Offer = await conn.createOffer();
      setLocalOffer(base64Offer);
      setStatus('waiting-for-answer');
    } catch (err: any) {
      setErrorMessage(err.message);
      setStatus('failed');
    }
  };

  // Joiner Action: Paste Offer & Create Answer
  const acceptOfferAndAnswer = async (offerStr: string) => {
    setStatus('preparing');
    const conn = initWebRTC();
    try {
      const base64Answer = await conn.acceptOfferAndCreateAnswer(offerStr);
      setLocalAnswer(base64Answer);
      setStatus('connecting');
    } catch (err: any) {
      setErrorMessage(err.message);
      setStatus('failed');
    }
  };

  // Host Action: Accept Answer from Joiner
  const completeManualConnection = async () => {
    if (!connRef.current) return;
    try {
      await connRef.current.acceptAnswer(remoteAnswerInput);
      setStatus('connecting');
    } catch (err: any) {
      setErrorMessage(err.message);
      setStatus('failed');
    }
  };

  // WebRTC Broker Code Start
  const startBrokerSync = (isHost: boolean) => {
    const conn = initWebRTC();
    if (isHost) {
      const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();
      setPinCode(generatedPin);
      conn.connectBroker(generatedPin, true);
    } else {
      if (!inputPin || inputPin.length !== 6) {
        addToast('Please enter a valid 6-digit sync PIN.', 'error');
        return;
      }
      conn.connectBroker(inputPin, false);
    }
  };

  // Web Camera QR Scan trigger
  const startQRScanner = () => {
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        'qr-reader-view',
        { fps: 10, qrbox: { width: 220, height: 220 } },
        false
      );
      scannerRef.current = scanner;
      scanner.render(
        async (decodedText) => {
          addToast('QR Code offer scanned successfully!', 'success');
          await scanner.clear();
          scannerRef.current = null;
          setRemoteOfferInput(decodedText);
          acceptOfferAndAnswer(decodedText);
        },
        (error) => {
          // Silent scan error updates
        }
      );
    }, 200);
  };

  const handleCopyText = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast('Copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-popover border border-border rounded shadow-2xl text-popover-foreground relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Peer-to-Peer Device Sync</h3>
              <p className="text-[11px] text-muted-foreground">Synchronize database completely offline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable View Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {status === 'failed' && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-destructive block">Sync Connection Error</span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{errorMessage}</p>
                <button
                  onClick={() => {
                    setStatus('idle');
                    setRole('idle');
                    setMethod('idle');
                  }}
                  className="text-[10px] text-destructive hover:underline font-semibold mt-1"
                >
                  Start Over
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: Idle - Select Role */}
          {role === 'idle' && (
            <div className="space-y-4">
              <span className="text-xs font-semibold text-muted-foreground block text-center">
                Choose the role of this device:
              </span>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setRole('sender')}
                  className="p-6 rounded bg-card border border-border hover:border-amber-500/50 hover:bg-amber-500/5 text-center space-y-3 cursor-pointer group transition-all"
                >
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto text-xl group-hover:scale-105 transition-transform">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-foreground">Send Data</h4>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Host connection & share entries FROM this device.
                  </p>
                </button>

                <button
                  onClick={() => setRole('receiver')}
                  className="p-6 rounded bg-card border border-border hover:border-emerald-500/50 hover:bg-emerald-500/5 text-center space-y-3 cursor-pointer group transition-all"
                >
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-xl group-hover:scale-105 transition-transform">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-foreground">Receive Data</h4>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Join connection & receive entries ONTO this device.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Select Sync Signaling Method */}
          {role !== 'idle' && method === 'idle' && (
            <div className="space-y-4">
              <span className="text-xs font-semibold text-muted-foreground block text-center">
                Select connection method:
              </span>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setMethod('manual');
                    if (role === 'sender') {
                      startHostOffer();
                    }
                  }}
                  className="w-full flex items-center justify-between p-4 bg-card border border-border rounded hover:border-muted-foreground/30 hover:bg-accent/20 cursor-pointer text-left transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-amber-500/10 text-amber-500 flex items-center justify-center text-sm">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">QR Code / Manual Signaling (Offline)</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Direct connection via QR Code scan. Serverless & ultra-secure.
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </button>

                <button
                  onClick={() => {
                    setMethod('broker');
                    if (role === 'sender') {
                      startBrokerSync(true);
                    }
                  }}
                  className="w-full flex items-center justify-between p-4 bg-card border border-border rounded hover:border-muted-foreground/30 hover:bg-accent/20 cursor-pointer text-left transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-purple-500/10 text-purple-500 flex items-center justify-center text-sm">
                      <Wifi className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Temporary Room Broker (Online)</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Connect instantly using a temporary 6-digit room PIN.
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Manual Connection Screens */}
          {role === 'sender' && method === 'manual' && status === 'waiting-for-answer' && (
            <div className="space-y-4 text-xs">
              <div className="flex flex-col items-center text-center space-y-3">
                <span className="font-bold text-foreground">1. Scan this QR Code from Receiver Device</span>
                <div className="p-3 bg-white rounded border border-border">
                  <canvas ref={canvasRef} />
                </div>
                <div className="w-full space-y-1.5 text-left">
                  <label className="text-[10px] font-semibold text-muted-foreground block">
                    Or copy the connection offer text:
                  </label>
                  <div className="flex gap-2">
                    <textarea
                      readOnly
                      value={localOffer}
                      className="w-full p-2 h-14 bg-muted border border-border rounded font-mono text-[9px] outline-none text-muted-foreground resize-none"
                    />
                    <button
                      onClick={() => handleCopyText(localOffer, setCopiedOffer)}
                      className="px-3 rounded bg-card border border-border hover:bg-accent shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      {copiedOffer ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <span className="font-bold text-foreground block">2. Paste Receiver's Answer Text here:</span>
                <div className="flex gap-2">
                  <textarea
                    placeholder="Paste Base64 answer from receiver..."
                    value={remoteAnswerInput}
                    onChange={(e) => setRemoteAnswerInput(e.target.value)}
                    className="w-full p-2 h-14 bg-card border border-border rounded font-mono text-[9px] outline-none text-foreground resize-none"
                  />
                  <button
                    onClick={completeManualConnection}
                    className="px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold shrink-0"
                  >
                    Connect
                  </button>
                </div>
              </div>
            </div>
          )}

          {role === 'receiver' && method === 'manual' && status === 'idle' && (
            <div className="space-y-4 text-xs">
              <div className="flex flex-col items-center text-center space-y-3">
                <span className="font-bold text-foreground">1. Scan Sender's QR Code</span>
                
                {/* Webcam scanner view container */}
                <div id="qr-reader-view" className="w-full rounded border border-border bg-black/5 overflow-hidden" />

                <button
                  onClick={startQRScanner}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Camera Scan</span>
                </button>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <span className="font-bold text-foreground block">Or paste Sender's Offer Text:</span>
                <div className="flex gap-2">
                  <textarea
                    placeholder="Paste Base64 offer from sender..."
                    value={remoteOfferInput}
                    onChange={(e) => setRemoteOfferInput(e.target.value)}
                    className="w-full p-2 h-14 bg-card border border-border rounded font-mono text-[9px] outline-none text-foreground resize-none"
                  />
                  <button
                    onClick={() => acceptOfferAndAnswer(remoteOfferInput)}
                    className="px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold shrink-0"
                  >
                    Import
                  </button>
                </div>
              </div>
            </div>
          )}

          {role === 'receiver' && method === 'manual' && status === 'connecting' && localAnswer && (
            <div className="space-y-4 text-xs text-center flex flex-col items-center">
              <span className="font-bold text-foreground">2. Show this Answer QR Code to Sender</span>
              <div className="p-3 bg-white rounded border border-border">
                <canvas ref={canvasRef} />
              </div>
              <div className="w-full space-y-1.5 text-left">
                <label className="text-[10px] font-semibold text-muted-foreground block">
                  Or copy the answer text and send it to the Host:
                </label>
                <div className="flex gap-2">
                  <textarea
                    readOnly
                    value={localAnswer}
                    className="w-full p-2 h-14 bg-muted border border-border rounded font-mono text-[9px] outline-none text-muted-foreground resize-none"
                  />
                  <button
                    onClick={() => handleCopyText(localAnswer, setCopiedAnswer)}
                    className="px-3 rounded bg-card border border-border hover:bg-accent shrink-0 text-muted-foreground"
                  >
                    {copiedAnswer ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground animate-pulse text-[11px] mt-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                <span>Waiting for host to process answer...</span>
              </div>
            </div>
          )}

          {/* STEP 3: Broker Code Screens */}
          {method === 'broker' && (
            <div className="space-y-4 text-xs text-center flex flex-col items-center">
              {role === 'sender' && pinCode && (
                <div className="space-y-4 w-full">
                  <span className="font-bold text-foreground text-center block">
                    Your 6-Digit Room Sync PIN
                  </span>
                  <div className="flex justify-center gap-2">
                    {pinCode.split('').map((char, i) => (
                      <span
                        key={i}
                        className="w-10 h-12 bg-muted border border-border rounded flex items-center justify-center font-bold text-base text-foreground shadow-2xs font-mono"
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    Open Sync on the receiving device, select "Receive Data" and enter this Room PIN to connect.
                  </p>
                  
                  {status === 'joined-room' && (
                    <div className="p-3 bg-amber-500/5 border border-amber-500/20 text-amber-500 rounded flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="font-medium text-[10px]">Room joined. Waiting for receiver to connect...</span>
                    </div>
                  )}
                </div>
              )}

              {role === 'receiver' && status === 'idle' && (
                <div className="space-y-4 w-full">
                  <span className="font-bold text-foreground text-center block">
                    Enter the 6-Digit Room PIN
                  </span>
                  <div className="flex justify-center">
                    <input
                      type="text"
                      maxLength={6}
                      value={inputPin}
                      onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 123456"
                      className="w-40 py-2.5 rounded bg-card border border-border text-center font-mono font-bold text-base outline-none focus:border-ring shadow-2xs"
                    />
                  </div>
                  <button
                    onClick={() => startBrokerSync(false)}
                    className="w-40 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold cursor-pointer transition-colors"
                  >
                    Join Room PIN
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sync Progress Loading State */}
          {(status === 'connecting' || status === 'connecting-broker' || status === 'connected' || status === 'syncing') && (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-foreground block capitalize">
                  {status === 'connecting' || status === 'connecting-broker' ? 'Negotiating WebRTC Connection...' : 'Syncing Encrypted Data...'}
                </span>
                <p className="text-[10px] text-muted-foreground">
                  Do not close this modal or reload the window during transfer.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Sync Finished / Success Summary */}
          {status === 'finished' && (
            <div className="space-y-4 text-xs text-center flex flex-col items-center py-4">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20 flex items-center justify-center text-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-sm font-bold text-foreground block">Vault Synced Successfully!</span>
                <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                  The local database was synchronized using secure end-to-end P2P encryption.
                </p>
              </div>

              {syncSummary && (
                <div className="p-4 bg-muted border border-border rounded w-full max-w-sm text-left grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-muted-foreground block">Passwords Added:</span>
                    <span className="font-bold text-foreground">{syncSummary.addedPass}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Passwords Updated:</span>
                    <span className="font-bold text-foreground">{syncSummary.updatedPass}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Categories Added:</span>
                    <span className="font-bold text-foreground">{syncSummary.addedCat}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Categories Updated:</span>
                    <span className="font-bold text-foreground">{syncSummary.updatedCat}</span>
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-40 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold cursor-pointer mt-2"
              >
                Close & Reload
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
