import React, { useState, useEffect } from 'react';
import { X, KeyRound, Wand2, Eye, EyeOff } from 'lucide-react';
import { PasswordEntry, Category } from '../types';
import { PasswordGeneratorModal } from './PasswordGeneratorModal';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: PasswordEntry) => void;
  initialEntry?: PasswordEntry | null;
  categories: Category[];
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEntry,
  categories,
}) => {
  const [websiteName, setWebsiteName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'Work');
  const [notes, setNotes] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  useEffect(() => {
    if (initialEntry) {
      setWebsiteName(initialEntry.websiteName);
      setWebsiteUrl(initialEntry.websiteUrl);
      setUsername(initialEntry.username);
      setPassword(initialEntry.password);
      setCategory(initialEntry.category);
      setNotes(initialEntry.notes || '');
      setIsFavorite(initialEntry.isFavorite);
    } else {
      setWebsiteName('');
      setWebsiteUrl('');
      setUsername('');
      setPassword('');
      setCategory(categories[0]?.name || 'Work');
      setNotes('');
      setIsFavorite(false);
    }
  }, [initialEntry, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let formattedUrl = websiteUrl.trim();
    if (formattedUrl && !formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    // Preserve history when updating password
    let updatedHistory = initialEntry?.history || [];
    if (initialEntry && initialEntry.password !== password) {
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
      websiteName: websiteName.trim(),
      websiteUrl: formattedUrl,
      username: username.trim(),
      password,
      notes: notes.trim(),
      category,
      isFavorite,
      createdAt: initialEntry?.createdAt || Date.now(),
      updatedAt: Date.now(),
      history: updatedHistory,
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
            <div>
              <label className="block text-foreground font-medium mb-1">Website Title / Service Name</label>
              <input
                type="text"
                required
                placeholder="e.g. GitHub"
                value={websiteName}
                onChange={(e) => setWebsiteName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-ring transition-colors"
              />
            </div>

            <div>
              <label className="block text-foreground font-medium mb-1">Website URL (Required for extension autofill)</label>
              <input
                type="text"
                required
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
                required
                placeholder="user@example.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-ring transition-colors"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-foreground font-medium">Password</label>
                <button
                  type="button"
                  onClick={() => setIsGeneratorOpen(true)}
                  className="text-blue-500 dark:text-blue-400 hover:underline flex items-center gap-1 text-[11px] font-medium"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>Generate</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground font-mono outline-none focus:border-ring transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-foreground font-medium mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground outline-none focus:border-ring transition-colors"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name} className="bg-popover text-popover-foreground">
                      {c.name}
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
