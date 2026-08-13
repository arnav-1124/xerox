import React, { useState, useEffect } from 'react';
import { X, KeyRound, Wand2, Eye, EyeOff, ShieldAlert, CreditCard, FileText, Lock } from 'lucide-react';
import { PasswordEntry, Category } from '../types';
import { getCategoryPath } from '../lib/categoryHelper';
import { PasswordGeneratorModal } from './PasswordGeneratorModal';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: PasswordEntry) => void;
  initialEntry?: PasswordEntry | null;
  categories: Category[];
  defaultCategoryId?: string;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEntry,
  categories,
  defaultCategoryId,
}) => {
  const [entryType, setEntryType] = useState<'login' | 'card' | 'note'>('login');
  const [websiteName, setWebsiteName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [category, setCategory] = useState(categories[0]?.id || '');
  const [notes, setNotes] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  useEffect(() => {
    if (initialEntry) {
      setEntryType(initialEntry.entryType || 'login');
      setWebsiteName(initialEntry.websiteName);
      setWebsiteUrl(initialEntry.websiteUrl);
      setUsername(initialEntry.username);
      setPassword(initialEntry.password);
      setTotpSecret(initialEntry.totpSecret || '');
      const matched = categories.find(c => c.id === initialEntry.category || c.name === initialEntry.category);
      setCategory(matched ? matched.id : (categories[0]?.id || ''));
      setNotes(initialEntry.notes || '');
      setIsFavorite(initialEntry.isFavorite);

      if (initialEntry.cardDetails) {
        setCardNumber(initialEntry.cardDetails.cardNumber || '');
        setCardholderName(initialEntry.cardDetails.cardholderName || '');
        setExpiryMonth(initialEntry.cardDetails.expiryMonth || '');
        setExpiryYear(initialEntry.cardDetails.expiryYear || '');
        setCvv(initialEntry.cardDetails.cvv || '');
      }
    } else {
      setEntryType('login');
      setWebsiteName('');
      setWebsiteUrl('');
      setUsername('');
      setPassword('');
      setTotpSecret('');
      setCategory(defaultCategoryId || categories[0]?.id || '');
      setNotes('');
      setIsFavorite(false);
      setCardNumber('');
      setCardholderName('');
      setExpiryMonth('');
      setExpiryYear('');
      setCvv('');
    }
  }, [initialEntry, isOpen, categories, defaultCategoryId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let formattedUrl = websiteUrl.trim();
    if (formattedUrl && !formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    // Preserve history when updating password
    let updatedHistory = initialEntry?.history || [];
    if (initialEntry && initialEntry.password !== password && password) {
      updatedHistory = [
        {
          id: 'hist-' + Date.now(),
          password: initialEntry.password,
          updatedAt: initialEntry.updatedAt || Date.now(),
        },
        ...updatedHistory,
      ].slice(0, 5); // Keep last 5 entries
    }

    const entry: PasswordEntry = {
      id: initialEntry?.id || 'pwd-' + Date.now(),
      entryType,
      websiteName: websiteName.trim() || (entryType === 'card' ? 'Payment Card' : 'Secure Note'),
      websiteUrl: formattedUrl,
      username: username.trim(),
      password,
      totpSecret: totpSecret.trim().toUpperCase(),
      notes: notes.trim(),
      category,
      isFavorite,
      createdAt: initialEntry?.createdAt || Date.now(),
      updatedAt: Date.now(),
      history: updatedHistory,
      cardDetails: entryType === 'card' ? {
        cardNumber: cardNumber.trim(),
        cardholderName: cardholderName.trim(),
        expiryMonth: expiryMonth.trim(),
        expiryYear: expiryYear.trim(),
        cvv: cvv.trim(),
      } : undefined,
    };

    onSave(entry);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-popover border border-border rounded-2xl p-6 shadow-2xl text-popover-foreground relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {initialEntry ? 'Edit Password Entry' : 'Add Password Entry'}
              </h3>
              <p className="text-xs text-muted-foreground">Encrypted in local vault using AES-GCM 256-bit.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Entry Type Selector */}
            <div className="flex rounded-lg bg-muted p-1 border border-border">
              <button
                type="button"
                onClick={() => setEntryType('login')}
                className={`flex-1 py-1.5 px-2 rounded-md font-medium text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  entryType === 'login'
                    ? 'bg-popover text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
              <button
                type="button"
                onClick={() => setEntryType('card')}
                className={`flex-1 py-1.5 px-2 rounded-md font-medium text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  entryType === 'card'
                    ? 'bg-popover text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Card</span>
              </button>
              <button
                type="button"
                onClick={() => setEntryType('note')}
                className={`flex-1 py-1.5 px-2 rounded-md font-medium text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  entryType === 'note'
                    ? 'bg-popover text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Note</span>
              </button>
            </div>

            <div>
              <label className="block text-foreground font-medium mb-1">
                {entryType === 'card' ? 'Card / Bank Identifier' : entryType === 'note' ? 'Note Title' : 'Website / Service Name'}
              </label>
              <input
                type="text"
                required
                placeholder={entryType === 'card' ? 'e.g. Visa Corporate' : entryType === 'note' ? 'e.g. Server SSH Key' : 'e.g. GitHub'}
                value={websiteName}
                onChange={(e) => setWebsiteName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-ring transition-colors"
              />
            </div>

            {entryType === 'login' && (
              <>
                <div>
                  <label className="block text-foreground font-medium mb-1">Website URL (for extension autofill)</label>
                  <input
                    type="text"
                    placeholder="https://github.com/login"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-ring transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-medium mb-1">Username / Email</label>
                  <input
                    type="text"
                    placeholder="user@example.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-ring transition-colors"
                  />
                </div>
              </>
            )}

            {entryType === 'card' && (
              <div className="space-y-3 p-3 bg-muted/40 rounded-xl border border-border">
                <div>
                  <label className="block text-foreground font-medium mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-ring transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-foreground font-medium mb-1">Card Number</label>
                  <input
                    type="text"
                    placeholder="4532 •••• •••• 8901"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground font-mono outline-none focus:border-ring transition-colors"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-foreground font-medium mb-1">Exp Month</label>
                    <input
                      type="text"
                      placeholder="08"
                      value={expiryMonth}
                      onChange={(e) => setExpiryMonth(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-mono text-center outline-none focus:border-ring transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-foreground font-medium mb-1">Exp Year</label>
                    <input
                      type="text"
                      placeholder="2028"
                      value={expiryYear}
                      onChange={(e) => setExpiryYear(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-mono text-center outline-none focus:border-ring transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-foreground font-medium mb-1">CVV / CVC</label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="•••"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-mono text-center outline-none focus:border-ring transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {entryType !== 'note' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-foreground font-medium">Password / PIN</label>
                  <button
                    type="button"
                    onClick={() => setIsGeneratorOpen(true)}
                    className="text-blue-500 dark:text-blue-400 hover:underline flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>Generate</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground font-mono outline-none focus:border-ring transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {entryType === 'login' && (
              <div>
                <label className="block text-foreground font-medium mb-1 flex items-center justify-between">
                  <span>2FA Authenticator Secret Key (TOTP)</span>
                  <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    6-Digit Live OTP Generator
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Base32 Secret e.g. JBSWY3DPEHPK3PXP"
                  value={totpSecret}
                  onChange={(e) => setTotpSecret(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-mono placeholder:text-muted-foreground uppercase outline-none focus:border-ring transition-colors"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-foreground font-medium mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground outline-none focus:border-ring transition-colors"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-popover text-popover-foreground">
                      {getCategoryPath(c.id, categories)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-foreground select-none">
                  <input
                    type="checkbox"
                    checked={isFavorite}
                    onChange={(e) => setIsFavorite(e.target.checked)}
                    className="rounded bg-muted border-border text-blue-600 focus:ring-0"
                  />
                  <span>Favorite ★</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-foreground font-medium mb-1">Secure Notes (Optional)</label>
              <textarea
                rows={2}
                placeholder="2FA recovery codes or security questions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-ring transition-colors resize-none"
              />
            </div>

            {initialEntry?.history && initialEntry.history.length > 0 && (
              <div className="p-3 bg-secondary/50 rounded-xl border border-border space-y-2">
                <span className="font-semibold text-[11px] text-muted-foreground block">
                  Password History (Last {initialEntry.history.length} Previous Passwords)
                </span>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {initialEntry.history.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between text-[11px] font-mono bg-background p-1.5 rounded border border-border"
                    >
                      <span className="text-foreground">{h.password}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(h.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-xs transition-all"
              >
                {initialEntry ? 'Save Entry' : 'Encrypt & Store'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <PasswordGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onSelectPassword={(genPwd) => {
          setPassword(genPwd);
          setShowPassword(true);
        }}
      />
    </>
  );
};
