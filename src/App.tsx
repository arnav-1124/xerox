/*
 * Xerox - Secure Local-First Password Manager & Bookmarks
 * Copyright (C) 2026 Xerox Vault Open Source Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bookmark, Category, PasswordEntry, VaultSettings, ViewMode } from './types';
import {
  getBookmarks,
  saveBookmark,
  saveAllBookmarks,
  deleteBookmarkDB,
  getCategories,
  saveCategoryDB,
  deleteCategoryDB,
  getVaultMeta,
  saveVaultMeta,
  getSettings,
  saveSettings,
  resetDatabase,
  VaultMetadata,
  getEncryptedFiles,
  saveAllEncryptedFiles,
  saveAllCategories,
} from './lib/db';
import {
  createPasswordVerifier,
  verifyMasterPassword,
  encryptVaultData,
  decryptVaultData,
  DerivedKeyBundle,
  deriveKeyBundle,
  encryptVaultDataWithKey,
  decryptVaultDataWithKey,
} from './lib/crypto';
import { INITIAL_DEMO_VAULT_ITEMS } from './lib/sampleData';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BookmarkList } from './components/BookmarkList';
import { PasswordList } from './components/PasswordList';
import { BookmarkModal } from './components/BookmarkModal';
import { PasswordModal } from './components/PasswordModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { MasterPasswordModal } from './components/MasterPasswordModal';
import { CommandPalette } from './components/CommandPalette';
import { SettingsView } from './components/SettingsView';
import { SecurityAuditView } from './components/SecurityAuditView';
import { FeatureGuideView } from './components/FeatureGuideView';
import { ExtensionGuideModal } from './components/ExtensionGuideModal';
import { SharePasswordModal, ReceiveShareModal } from './components/SharePasswordModal';
import { LandingHero } from './components/LandingHero';
import { StandaloneGeneratorView } from './components/StandaloneGeneratorView';
import { ImportExportView } from './components/ImportExportView';
import { FileVaultView } from './components/FileVaultView';
import { TotpAuthenticatorView } from './components/TotpAuthenticatorView';
import { MaskedEmailsView } from './components/MaskedEmailsView';
import { PeerSyncModal } from './components/PeerSyncModal';
import { DecentralizedBackupModal } from './components/DecentralizedBackupModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { BackupPasswordModal } from './components/BackupPasswordModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { Puzzle, Star } from 'lucide-react';

import { MarketingHome } from './pages/marketing/MarketingHome';
import { MarketingFeatures } from './pages/marketing/MarketingFeatures';
import { MarketingSecurity } from './pages/marketing/MarketingSecurity';
import { MarketingPrivacy } from './pages/marketing/MarketingPrivacy';
import { MarketingDownload } from './pages/marketing/MarketingDownload';
import { MarketingDocs } from './pages/marketing/MarketingDocs';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);
  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    const p = window.location.pathname;
    if (p === '/app') return 'home';
    if (p.startsWith('/')) {
      const routeName = p.slice(1);
      if (['bookmarks', 'passwords', 'totp', 'files', 'security-audit', 'import-export', 'settings', 'favorites', 'generator', 'blog', 'categories', 'extension'].includes(routeName)) {
        return routeName as ViewMode;
      }
    }
    return 'home';
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const navigateTo = useCallback((newPath: string) => {
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
    setCurrentPath(newPath);

    if (newPath === '/app') {
      setCurrentView('home');
    } else if (newPath.startsWith('/')) {
      const routeName = newPath.slice(1);
      if (['bookmarks', 'passwords', 'totp', 'files', 'security-audit', 'import-export', 'settings', 'favorites', 'generator', 'blog', 'categories', 'extension'].includes(routeName)) {
        setCurrentView(routeName as ViewMode);
      }
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname;
      setCurrentPath(p);
      if (p === '/app') {
        setCurrentView('home');
      } else if (p.startsWith('/')) {
        const routeName = p.slice(1);
        if (['bookmarks', 'passwords', 'totp', 'files', 'security-audit', 'import-export', 'settings', 'favorites', 'generator', 'blog', 'categories', 'extension'].includes(routeName)) {
          setCurrentView(routeName as ViewMode);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectView = (view: ViewMode) => {
    setCurrentView(view);
    const targetPath = view === 'home' ? '/app' : `/${view}`;
    navigateTo(targetPath);
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Local storage state
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettingsState] = useState<VaultSettings>({
    autoLockMinutes: 15,
    requireConfirmationForAutofill: true,
    trustedDomains: [],
  });

  // Vault Security State
  const [vaultMeta, setVaultMeta] = useState<VaultMetadata | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [derivedKey, setDerivedKey] = useState<DerivedKeyBundle | null>(null);
  const [decryptedPasswords, setDecryptedPasswords] = useState<PasswordEntry[]>([]);

  // Zero-retention clock offset and clipboard refs
  const [clockSkew, setClockSkew] = useState<number>(0);
  const clipboardTimeoutRef = useRef<any>(null);

  // Modals & UI Controls
  const [isMasterPasswordModalOpen, setIsMasterPasswordModalOpen] = useState(false);
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalParentId, setCategoryModalParentId] = useState<string | undefined>(undefined);

  const handleOpenCategoryManager = (defaultParentId?: string) => {
    setCategoryModalParentId(defaultParentId);
    setIsCategoryModalOpen(true);
  };
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isExtensionGuideOpen, setIsExtensionGuideOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isIpfsBackupOpen, setIsIpfsBackupOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Secure Zero-Knowledge Share States
  const [sharingPassword, setSharingPassword] = useState<PasswordEntry | null>(null);
  const [receivedShareHash, setReceivedShareHash] = useState<string | null>(null);

  // Encrypted Backup Import State
  const [backupFileToDecrypt, setBackupFileToDecrypt] = useState<any>(null);
  const [backupPasswordError, setBackupPasswordError] = useState<string | null>(null);

  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
  } | null>(null);

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    isDestructive?: boolean,
    confirmText?: string,
    cancelText?: string,
    onCancel?: () => void
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(null);
      },
      onCancel: () => {
        if (onCancel) onCancel();
        setConfirmDialog(null);
      },
      confirmText,
      cancelText,
      isDestructive,
    });
  };

  // Check URL hash for #share=...
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#share=')) {
      const payloadHash = hash.replace('#share=', '');
      if (payloadHash) {
        setReceivedShareHash(payloadHash);
      }
    }
  }, []);

  // Persistent storage request and self-origin clock sync
  useEffect(() => {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then((persistent) => {
        console.log(persistent ? 'Local storage persistent' : 'Local storage volatile');
      });
    }

    const syncClock = async () => {
      try {
        const startTime = Date.now();
        const res = await fetch(window.location.href, { method: 'HEAD', cache: 'no-cache' });
        const dateHeader = res.headers.get('Date');
        if (dateHeader) {
          const serverTime = new Date(dateHeader).getTime();
          const endTime = Date.now();
          const latency = (endTime - startTime) / 2;
          const actualServerTime = serverTime + latency;
          const skew = actualServerTime - endTime;
          setClockSkew(skew);
        }
      } catch (err) {
        console.warn('Clock sync failed, using default system time:', err);
      }
    };
    syncClock();
  }, []);

  // Toast System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, text, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initialize DB data
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [bms, cats, meta, st] = await Promise.all([
          getBookmarks(),
          getCategories(),
          getVaultMeta(),
          getSettings(),
        ]);

        setBookmarks(bms);
        setCategories(cats);
        setVaultMeta(meta);
        setSettingsState(st);

        // Safe existing-user detection: Redirect / -> /app if local vault is already initialized
        if (window.location.pathname === '/' && meta && meta.isInitialized) {
          window.history.replaceState(null, '', '/app');
          setCurrentPath('/app');
          setCurrentView('home');
        }

        // If vault hasn't been set up yet and on app routes, show initial setup modal
        if ((!meta || !meta.isInitialized) && window.location.pathname !== '/') {
          setIsMasterPasswordModalOpen(true);
        }
      } catch (err) {
        console.error('Failed to load initial vault database:', err);
      }
    }
    loadInitialData();
  }, []);

  // Synchronize vault changes to the browser extension
  useEffect(() => {
    console.log('App: vaultMeta changed:', vaultMeta);
    if (vaultMeta && vaultMeta.encryptedVault) {
      try {
        console.log('App: Syncing vault to extension...');
        localStorage.setItem('xerox_vault_meta_sync', JSON.stringify(vaultMeta));
        window.postMessage({
          type: 'XEROX_SYNC_VAULT',
          vaultMeta,
          encryptedVault: vaultMeta.encryptedVault,
        }, '*');
      } catch (e) {
        console.error('App: Failed to sync vault:', e);
      }
    } else if (vaultMeta === null) {
      try {
        console.log('App: Clearing synced vault...');
        localStorage.removeItem('xerox_vault_meta_sync');
      } catch (e) {}
    }
  }, [vaultMeta]);

  // Lock Vault Helper
  const lockVault = useCallback(() => {
    setIsUnlocked(false);
    setDerivedKey(null);
    setDecryptedPasswords([]);
    addToast('Password Vault locked', 'info');
  }, [addToast]);

  // Auto-lock timer effect
  useEffect(() => {
    if (!isUnlocked || settings.autoLockMinutes === 0) return;

    const timer = setTimeout(() => {
      lockVault();
    }, settings.autoLockMinutes * 60 * 1000);

    return () => clearTimeout(timer);
  }, [isUnlocked, settings.autoLockMinutes, lockVault]);

  // Master Password Submission (Setup or Unlock)
  const handleMasterPasswordSubmit = async (password: string, isSetup: boolean): Promise<boolean> => {
    if (isSetup) {
      // Create new vault
      const saltBytes = new Uint8Array(16);
      window.crypto.getRandomValues(saltBytes);
      const salt = btoa(String.fromCharCode(...saltBytes));

      const keyBundle = await deriveKeyBundle(password, salt);
      const { cipherText, iv } = await encryptVaultDataWithKey(INITIAL_DEMO_VAULT_ITEMS, keyBundle);
      const verifier = await createPasswordVerifier(password, salt);

      const meta: VaultMetadata = {
        isInitialized: true,
        salt,
        verifier,
        encryptedVault: {
          cipherText,
          iv,
          salt,
          version: 1,
          updatedAt: Date.now(),
        },
      };

      await saveVaultMeta(meta);
      setVaultMeta(meta);
      setDerivedKey(keyBundle);
      setDecryptedPasswords(INITIAL_DEMO_VAULT_ITEMS);
      setIsUnlocked(true);
      setIsMasterPasswordModalOpen(false);

      addToast('Local vault initialized with AES-GCM 256-bit encryption!', 'success');
      return true;
    } else {
      // Unlock existing vault
      if (!vaultMeta || !vaultMeta.encryptedVault) return false;

      try {
        const isValid = await verifyMasterPassword(password, vaultMeta.salt, vaultMeta.verifier);
        if (!isValid) return false;

        const keyBundle = await deriveKeyBundle(password, vaultMeta.salt);
        const decrypted = await decryptVaultDataWithKey(
          vaultMeta.encryptedVault.cipherText,
          vaultMeta.encryptedVault.iv,
          vaultMeta.encryptedVault.salt,
          keyBundle
        );

        setDerivedKey(keyBundle);
        setDecryptedPasswords(decrypted);
        setIsUnlocked(true);
        setIsMasterPasswordModalOpen(false);

        addToast('Password Vault unlocked', 'success');
        return true;
      } catch (err) {
        return false;
      }
    }
  };

  // Save Decrypted Passwords & Re-encrypt
  const saveAndEncryptPasswords = async (newPasswords: PasswordEntry[]) => {
    setDecryptedPasswords(newPasswords);

    if (!derivedKey || !vaultMeta) return;

    try {
      const { cipherText, iv, salt } = await encryptVaultDataWithKey(
        newPasswords,
        derivedKey
      );

      const updatedMeta: VaultMetadata = {
        ...vaultMeta,
        encryptedVault: {
          cipherText,
          iv,
          salt,
          version: 1,
          updatedAt: Date.now(),
        },
      };

      await saveVaultMeta(updatedMeta);
      setVaultMeta(updatedMeta);
    } catch (err) {
      addToast('Failed to re-encrypt vault data', 'error');
    }
  };

  const normalizeHost = (str: string) => {
    if (!str) return '';
    try {
      const raw = str.startsWith('http') ? str : `https://${str}`;
      return new URL(raw).hostname.replace(/^www\./, '').toLowerCase();
    } catch {
      return str.trim().toLowerCase();
    }
  };

  // Bookmark handlers
  const handleSaveBookmark = async (bookmark: Bookmark) => {
    const existingIndex = bookmarks.findIndex((b) => b.id === bookmark.id);
    let updatedBookmarks: Bookmark[];
    if (existingIndex >= 0) {
      updatedBookmarks = [...bookmarks];
      updatedBookmarks[existingIndex] = bookmark;
    } else {
      updatedBookmarks = [bookmark, ...bookmarks];
    }
    setBookmarks(updatedBookmarks);
    await saveBookmark(bookmark);

    // Sync to Password Vault if unlocked
    if (isUnlocked && decryptedPasswords) {
      const bmHost = normalizeHost(bookmark.url || bookmark.title);
      const existingPwdIndex = decryptedPasswords.findIndex(
        (p) => normalizeHost(p.websiteUrl || p.websiteName) === bmHost
      );

      let updatedPwds: PasswordEntry[];
      if (existingPwdIndex >= 0) {
        const existing = decryptedPasswords[existingPwdIndex];
        const syncedPwd: PasswordEntry = {
          ...existing,
          websiteName: bookmark.title,
          websiteUrl: bookmark.url || existing.websiteUrl,
          category: bookmark.category || existing.category,
          tags: bookmark.tags || existing.tags,
          isFavorite: bookmark.isFavorite !== undefined ? bookmark.isFavorite : existing.isFavorite,
          notes: bookmark.description || existing.notes,
          updatedAt: Date.now(),
        };
        updatedPwds = [...decryptedPasswords];
        updatedPwds[existingPwdIndex] = syncedPwd;
      } else {
        const newPwd: PasswordEntry = {
          id: 'pwd-sync-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          websiteName: bookmark.title,
          websiteUrl: bookmark.url,
          username: '',
          password: '',
          category: bookmark.category || 'General',
          tags: bookmark.tags || [],
          isFavorite: !!bookmark.isFavorite,
          notes: bookmark.description || '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        updatedPwds = [newPwd, ...decryptedPasswords];
      }
      await saveAndEncryptPasswords(updatedPwds);
    }

    addToast(existingIndex >= 0 ? 'Bookmark updated & synced' : 'Bookmark added & synced to vault', 'success');
  };

  const handleToggleBookmarkFavorite = async (id: string) => {
    const updated = bookmarks.map((b) => (b.id === id ? { ...b, isFavorite: !b.isFavorite } : b));
    setBookmarks(updated);
    const target = updated.find((b) => b.id === id);
    if (target) await saveBookmark(target);
  };

  const handleDeleteBookmark = async (id: string) => {
    const target = bookmarks.find((b) => b.id === id);
    const title = target ? target.title : 'this bookmark';
    showConfirm(
      'Delete Bookmark',
      `Are you sure you want to permanently delete the bookmark "${title}"?`,
      async () => {
        const updated = bookmarks.filter((b) => b.id !== id);
        setBookmarks(updated);
        await deleteBookmarkDB(id);
        addToast('Bookmark deleted', 'info');
      },
      true,
      'Delete'
    );
  };

  // Password Vault handlers
  const handleSavePassword = async (entry: PasswordEntry) => {
    const existingIndex = decryptedPasswords.findIndex((p) => p.id === entry.id);
    let updatedPwds: PasswordEntry[];
    if (existingIndex >= 0) {
      updatedPwds = [...decryptedPasswords];
      updatedPwds[existingIndex] = entry;
    } else {
      updatedPwds = [entry, ...decryptedPasswords];
    }
    await saveAndEncryptPasswords(updatedPwds);

    // Sync to Bookmarks
    const pwdHost = normalizeHost(entry.websiteUrl || entry.websiteName);
    const existingBmIndex = bookmarks.findIndex(
      (b) => normalizeHost(b.url || b.title) === pwdHost
    );

    let updatedBookmarks: Bookmark[];
    if (existingBmIndex >= 0) {
      const existing = bookmarks[existingBmIndex];
      const syncedBm: Bookmark = {
        ...existing,
        title: entry.websiteName,
        url: entry.websiteUrl || existing.url,
        category: entry.category || existing.category,
        tags: entry.tags || existing.tags,
        isFavorite: entry.isFavorite !== undefined ? entry.isFavorite : existing.isFavorite,
        description: entry.notes || existing.description,
        updatedAt: Date.now(),
      };
      updatedBookmarks = [...bookmarks];
      updatedBookmarks[existingBmIndex] = syncedBm;
      await saveBookmark(syncedBm);
    } else {
      const newBm: Bookmark = {
        id: 'bm-sync-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        title: entry.websiteName,
        url: entry.websiteUrl || (entry.websiteName.startsWith('http') ? entry.websiteName : `https://${entry.websiteName.toLowerCase().replace(/\s+/g, '')}.com`),
        category: entry.category || 'General',
        tags: entry.tags || [],
        isFavorite: !!entry.isFavorite,
        description: entry.notes || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      updatedBookmarks = [newBm, ...bookmarks];
      await saveBookmark(newBm);
    }
    setBookmarks(updatedBookmarks);

    addToast(existingIndex >= 0 ? 'Password entry updated & synced' : 'Password stored securely & synced to bookmarks', 'success');
  };

  const handleTogglePasswordFavorite = async (id: string) => {
    const updated = decryptedPasswords.map((p) =>
      p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
    );
    await saveAndEncryptPasswords(updated);
  };

  const handleDeletePassword = async (id: string) => {
    const target = decryptedPasswords.find((p) => p.id === id);
    const title = target ? target.websiteName : 'this password entry';
    showConfirm(
      'Delete Password Entry',
      `Are you sure you want to permanently delete the credentials for "${title}"? This action cannot be undone.`,
      async () => {
        const updated = decryptedPasswords.filter((p) => p.id !== id);
        await saveAndEncryptPasswords(updated);
        addToast('Password entry deleted', 'info');
      },
      true,
      'Delete'
    );
  };

  // Categories handlers
  const handleAddCategory = async (name: string, color: string, parentId?: string) => {
    const newCat: Category = {
      id: 'cat-' + Date.now(),
      name,
      color,
      parentId,
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    await saveCategoryDB(newCat);
    addToast(`Category "${name}" created`, 'success');
  };

  const handleDeleteCategory = async (id: string) => {
    const target = categories.find((c) => c.id === id);
    const catName = target ? target.name : 'this category';
    showConfirm(
      'Delete Category',
      `Are you sure you want to delete the category "${catName}"? Any nested subcategories will be moved to the top level.`,
      async () => {
        const updated = categories
          .filter((c) => c.id !== id)
          .map((c) => (c.parentId === id ? { ...c, parentId: undefined } : c));
        setCategories(updated);
        await saveAllCategories(updated);
        addToast('Category deleted', 'info');
      },
      true,
      'Delete'
    );
  };

  // Copy Clipboard Helper with Auto-Clear security
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast(`${label} copied to clipboard`, 'success');

    // Auto-clear clipboard after 30 seconds for sensitive keys
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('password') || lowerLabel.includes('code') || lowerLabel.includes('totp') || lowerLabel.includes('cvv')) {
      if (clipboardTimeoutRef.current) {
        clearTimeout(clipboardTimeoutRef.current);
      }
      clipboardTimeoutRef.current = setTimeout(async () => {
        try {
          const currentClip = await navigator.clipboard.readText();
          if (currentClip === text) {
            await navigator.clipboard.writeText('');
            addToast('Clipboard cleared for security', 'info');
          }
        } catch {
          await navigator.clipboard.writeText('');
          addToast('Clipboard cleared for security', 'info');
        }
      }, 30000);
    }
  };

  // Settings & Export/Import
  const handleUpdateSettings = async (newSettings: VaultSettings) => {
    setSettingsState(newSettings);
    await saveSettings(newSettings);
    addToast('Settings updated', 'success');
  };

  const handleSyncComplete = async (newPasswords: PasswordEntry[], newCategories: Category[]) => {
    try {
      setCategories(newCategories);
      await saveAllCategories(newCategories);
      await saveAndEncryptPasswords(newPasswords);
    } catch (err: any) {
      console.error('Sync complete error', err);
      addToast('Error saving synchronized vault data.', 'error');
    }
  };

  const handleIpfsRestoreComplete = async (decrypted: any) => {
    try {
      if (decrypted.categories) {
        setCategories(decrypted.categories);
        await saveAllCategories(decrypted.categories);
      }
      if (decrypted.bookmarks) {
        setBookmarks(decrypted.bookmarks);
        await saveAllBookmarks(decrypted.bookmarks);
      }
      if (decrypted.passwords) {
        await saveAndEncryptPasswords(decrypted.passwords);
      }
      if (decrypted.settings) {
        setSettingsState(decrypted.settings);
        await saveSettings(decrypted.settings);
      }
    } catch (err: any) {
      console.error('IPFS restore save error', err);
      addToast('Error saving restored vault data.', 'error');
    }
  };

  const handleExportJSON = async (encrypted: boolean) => {
    if (!isUnlocked || !derivedKey) {
      addToast('Please unlock your vault first to export.', 'error');
      setIsMasterPasswordModalOpen(true);
      return;
    }

    try {
      const files = await getEncryptedFiles();

      // Convert Blobs to Base64 strings for standard JSON backup compatibility
      const serializedFiles = await Promise.all(
        files.map(async (file) => {
          if (file.data instanceof Blob) {
            const base64Data = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file.data as Blob);
            });
            return {
              ...file,
              data: base64Data,
            };
          }
          return file;
        })
      );

      const updatedSettings = {
        ...settings,
        lastBackupTime: Date.now(),
      };
      setSettingsState(updatedSettings);
      await saveSettings(updatedSettings);

      const backupData = {
        app: 'Xerox Password & Bookmark Manager',
        version: 2,
        exportedAt: new Date().toISOString(),
        unencrypted: !encrypted,
        passwords: decryptedPasswords,
        bookmarks,
        categories,
        settings: updatedSettings,
        files: serializedFiles,
      };

      let finalPayload: any = backupData;

      if (encrypted) {
        const { cipherText, iv, salt } = await encryptVaultDataWithKey(
          backupData,
          derivedKey
        );
        finalPayload = {
          app: 'Xerox Password & Bookmark Manager',
          version: 2,
          exportedAt: new Date().toISOString(),
          isEncryptedBackup: true,
          cipherText,
          iv,
          salt,
        };
      }

      const jsonStr = JSON.stringify(finalPayload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `xerox-vault-${encrypted ? 'encrypted' : 'unencrypted'}-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addToast(
        encrypted
          ? 'Successfully exported fully encrypted vault backup.'
          : 'Successfully exported unencrypted vault backup.',
        'success'
      );
    } catch (err) {
      console.error(err);
      addToast('Failed to export vault backup.', 'error');
    }
  };

  const handleExportCSV = () => {
    if (!isUnlocked || decryptedPasswords.length === 0) {
      addToast('No decrypted passwords to export. Unlock vault first.', 'error');
      return;
    }

    const headers = ['title', 'url', 'username', 'password', 'notes', 'category'];
    const rows = decryptedPasswords.map((p) => [
      `"${(p.websiteName || '').replace(/"/g, '""')}"`,
      `"${(p.websiteUrl || '').replace(/"/g, '""')}"`,
      `"${(p.username || '').replace(/"/g, '""')}"`,
      `"${(p.password || '').replace(/"/g, '""')}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
      `"${(p.category || 'General').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xerox-passwords-export-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast('CSV Passwords Exported successfully', 'success');
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) return;

        if (file.name.endsWith('.csv')) {
          if (!isUnlocked) {
            addToast('Please unlock your vault before importing CSV credentials.', 'error');
            setIsMasterPasswordModalOpen(true);
            return;
          }
          await handleImportCSVContent(text);
        } else {
          const content = JSON.parse(text);
          await handleImportJSONContent(content);
        }
      } catch (err) {
        console.error(err);
        addToast('Failed to parse or import backup file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleImportCSVContent = async (text: string) => {
    // Custom RFC 4180 CSV line parser supporting embedded commas & escaped quotes
    const parseCSVRow = (row: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          if (inQuotes && row[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    try {
      // Split by line endings (ignoring trailing blank lines)
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        addToast('CSV file appears empty or invalid', 'error');
        return;
      }

      // Parse Header columns and clean quotes
      const headerCols = parseCSVRow(lines[0]).map((h) => h.toLowerCase());

      // Explicit index lookups with fallback checks to prevent overlaps (e.g. name matching username)
      const titleIdx = headerCols.findIndex(
        (h) =>
          ['name', 'title', 'website name', 'label'].includes(h) ||
          (h.includes('name') && h !== 'username' && h !== 'login name')
      );
      const urlIdx = headerCols.findIndex(
        (h) => ['url', 'website', 'website url', 'link', 'address'].includes(h) || h.includes('url')
      );
      const userIdx = headerCols.findIndex(
        (h) =>
          ['username', 'login', 'email', 'user', 'login username', 'username value'].includes(h) ||
          h.includes('user') ||
          h.includes('email') ||
          h.includes('login')
      );
      const passIdx = headerCols.findIndex(
        (h) =>
          ['password', 'pass', 'secret', 'secret key', 'password value'].includes(h) ||
          h.includes('pass') ||
          h.includes('secret')
      );
      const notesIdx = headerCols.findIndex(
        (h) => ['note', 'notes', 'comment', 'description'].includes(h) || h.includes('note') || h.includes('comment')
      );
      const catIdx = headerCols.findIndex(
        (h) => ['cat', 'folder', 'category'].includes(h) || h.includes('cat') || h.includes('folder') || h.includes('category')
      );

      const newEntries: PasswordEntry[] = [];
      for (let i = 1; i < lines.length; i++) {
        const rawRow = lines[i];
        if (!rawRow.trim()) continue;
        
        const cleanCols = parseCSVRow(rawRow);

        const title = (titleIdx >= 0 && cleanCols[titleIdx]) || cleanCols[0] || 'Imported Entry';
        const websiteUrl = (urlIdx >= 0 && cleanCols[urlIdx]) || '';
        const username = (userIdx >= 0 && cleanCols[userIdx]) || '';
        const password = (passIdx >= 0 && cleanCols[passIdx]) || '';
        const notes = (notesIdx >= 0 && cleanCols[notesIdx]) || '';
        const category = (catIdx >= 0 && cleanCols[catIdx]) || 'Imported';

        if (title || password) {
          newEntries.push({
            id: 'pwd-imp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            websiteName: title,
            websiteUrl: websiteUrl.startsWith('http') ? websiteUrl : websiteUrl ? `https://${websiteUrl}` : '',
            username,
            password,
            notes,
            category,
            isFavorite: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      }

      if (newEntries.length > 0) {
        const merged = [...newEntries, ...decryptedPasswords];
        await saveAndEncryptPasswords(merged);
        addToast(`Successfully imported ${newEntries.length} password entries`, 'success');
      } else {
        addToast('No valid password records parsed from CSV', 'error');
      }
    } catch (err) {
      addToast('Failed to parse CSV content', 'error');
    }
  };

  const handleImportJSONContent = async (content: any, usedPassword?: string) => {
    // 1. New Encrypted Backup
    if (content.isEncryptedBackup) {
      if (!usedPassword) {
        setBackupFileToDecrypt(content);
        return;
      }

      try {
        const keyBundle = await deriveKeyBundle(usedPassword, content.salt);
        const decryptedData = await decryptVaultDataWithKey(
          content.cipherText,
          content.iv,
          content.salt,
          keyBundle
        );

        showConfirm(
          'Import Encrypted Backup',
          'Importing this backup will overwrite your entire current vault. All passwords, bookmarks, settings, and files will be replaced. Do you want to proceed?',
          async () => {
            await performRestore(decryptedData, usedPassword);
            addToast('Encrypted backup imported and restored successfully!', 'success');
            setBackupFileToDecrypt(null);
            setBackupPasswordError(null);
          }
        );
      } catch (err) {
        console.error(err);
        setBackupPasswordError('Incorrect password for this backup file.');
      }
      return;
    }

    // 2. New Unencrypted Backup
    if (content.unencrypted && (content.passwords || content.bookmarks)) {
      if (!usedPassword) {
        setBackupFileToDecrypt(content);
        return;
      }

      showConfirm(
        'Import Unencrypted Backup',
        'Importing this backup will overwrite your entire current vault. All passwords, bookmarks, settings, and files will be replaced. Do you want to proceed?',
        async () => {
          await performRestore(content, usedPassword);
          addToast('Unencrypted backup imported and restored successfully!', 'success');
          setBackupFileToDecrypt(null);
          setBackupPasswordError(null);
        }
      );
      return;
    }

    // 3. Legacy Full Backup containing vaultMeta
    if (content.vaultMeta) {
      showConfirm(
        'Import Legacy Backup',
        'Importing this legacy backup will overwrite your entire current vault. All passwords, bookmarks, and categories will be replaced. Do you want to proceed?',
        async () => {
          if (content.bookmarks) {
            setBookmarks(content.bookmarks);
            await saveAllBookmarks(content.bookmarks);
          }
          if (content.categories) {
            setCategories(content.categories);
            await saveAllCategories(content.categories);
          }
          setVaultMeta(content.vaultMeta);
          await saveVaultMeta(content.vaultMeta);

          if (isUnlocked && derivedKey) {
            try {
              const decrypted = await decryptVaultDataWithKey(
                content.vaultMeta.encryptedVault.cipherText,
                content.vaultMeta.encryptedVault.iv,
                content.vaultMeta.encryptedVault.salt,
                derivedKey
              );
              setDecryptedPasswords(decrypted);
            } catch {
              lockVault();
            }
          } else {
            setIsUnlocked(false);
            setDerivedKey(null);
            setDecryptedPasswords([]);
          }
          addToast('Legacy vault backup imported successfully', 'success');
        }
      );
      return;
    }

    // 4. Simple entries array or parsed passwords/bookmarks JSON
    if (Array.isArray(content.passwords) || Array.isArray(content)) {
      if (!isUnlocked) {
        addToast('Please unlock your vault before importing passwords.', 'error');
        setIsMasterPasswordModalOpen(true);
        return;
      }
      const importedP = Array.isArray(content.passwords) ? content.passwords : content;
      const importedB = content.bookmarks || [];
      const mergedP = [...importedP, ...decryptedPasswords];
      await saveAndEncryptPasswords(mergedP);
      if (importedB.length > 0) {
        const mergedB = [...importedB, ...bookmarks];
        setBookmarks(mergedB);
        await saveAllBookmarks(mergedB);
      }
      addToast(`Successfully imported entries!`, 'success');
      return;
    }

    addToast('Unrecognized JSON backup format', 'error');
  };

  const performRestore = async (data: any, password: string) => {
    if (data.settings) {
      setSettingsState(data.settings);
      await saveSettings(data.settings);
    }

    if (data.categories) {
      setCategories(data.categories);
      await saveAllCategories(data.categories);
    }

    if (data.bookmarks) {
      setBookmarks(data.bookmarks);
      await saveAllBookmarks(data.bookmarks);
    }

    if (data.files) {
      // Convert base64 string files back to binary Blobs
      const restoredFiles = data.files.map((file: any) => {
        if (typeof file.data === 'string' && file.data.includes(';base64,')) {
          try {
            const parts = file.data.split(';base64,');
            const raw = parts[1] || parts[0];
            const contentType = parts[0].split(':')[1] || file.type;
            const rawData = atob(raw);
            const rawLength = rawData.length;
            const uInt8Array = new Uint8Array(rawLength);
            for (let i = 0; i < rawLength; ++i) {
              uInt8Array[i] = rawData.charCodeAt(i);
            }
            return {
              ...file,
              data: new Blob([uInt8Array], { type: contentType }),
            };
          } catch (e) {
            console.warn('Failed to parse file data during restore:', e);
          }
        }
        return file;
      });
      await saveAllEncryptedFiles(restoredFiles);
    } else {
      await saveAllEncryptedFiles([]);
    }

    if (data.passwords) {
      setDecryptedPasswords(data.passwords);
      const keyBundle = await deriveKeyBundle(password, vaultMeta?.salt || 'salt-' + Date.now());
      setDerivedKey(keyBundle);
      setIsUnlocked(true);

      const { cipherText, iv, salt } = await encryptVaultDataWithKey(
        data.passwords,
        keyBundle
      );
      const verifier = await createPasswordVerifier(password, salt);

      const updatedMeta: VaultMetadata = {
        isInitialized: true,
        salt,
        verifier,
        encryptedVault: {
          cipherText,
          iv,
          salt,
          version: 1,
          updatedAt: Date.now(),
        },
      };

      await saveVaultMeta(updatedMeta);
      setVaultMeta(updatedMeta);
    }
  };

  const handleResetVault = async () => {
    await resetDatabase();
    setBookmarks([]);
    setDecryptedPasswords([]);
    setVaultMeta(null);
    setIsUnlocked(false);
    setDerivedKey(null);
    setIsMasterPasswordModalOpen(true);
    addToast('Local vault reset completed', 'info');
  };

  // Render Public Marketing Pages for marketing routes
  if (currentPath === '/' && (!vaultMeta || !vaultMeta.isInitialized)) {
    return <MarketingHome theme={theme} onToggleTheme={toggleTheme} onNavigate={navigateTo} />;
  }
  if (currentPath === '/features') {
    return <MarketingFeatures theme={theme} onToggleTheme={toggleTheme} onNavigate={navigateTo} />;
  }
  if (currentPath === '/security') {
    return <MarketingSecurity theme={theme} onToggleTheme={toggleTheme} onNavigate={navigateTo} />;
  }
  if (currentPath === '/privacy') {
    return <MarketingPrivacy theme={theme} onToggleTheme={toggleTheme} onNavigate={navigateTo} />;
  }
  if (currentPath === '/download') {
    return <MarketingDownload theme={theme} onToggleTheme={toggleTheme} onNavigate={navigateTo} />;
  }
  if (currentPath === '/docs') {
    return <MarketingDocs theme={theme} onToggleTheme={toggleTheme} onNavigate={navigateTo} />;
  }

  return (
    <div className="flex h-screen bg-background text-foreground font-sans antialiased overflow-hidden select-none">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={handleSelectView}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        isUnlocked={isUnlocked}
        onOpenCategoryManager={handleOpenCategoryManager}
        bookmarkCount={bookmarks.length}
        passwordCount={decryptedPasswords.length}
        maskedEmailCount={decryptedPasswords.filter((p) => p.username.toLowerCase().endsWith('@duck.com')).length}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header
          currentView={currentView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isUnlocked={isUnlocked}
          autoLockMinutes={settings.autoLockMinutes}
          theme={theme}
          onToggleTheme={toggleTheme}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onToggleLock={() => {
            if (isUnlocked) lockVault();
            else setIsMasterPasswordModalOpen(true);
          }}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenNewItemModal={() => {
            if (currentView === 'bookmarks') {
              setEditingBookmark(null);
              setIsBookmarkModalOpen(true);
            } else if (currentView === 'passwords') {
              if (!isUnlocked) {
                setIsMasterPasswordModalOpen(true);
              } else {
                setEditingPassword(null);
                setIsPasswordModalOpen(true);
              }
            }
          }}
          onOpenExtensionGuide={() => setIsExtensionGuideOpen(true)}
        />

        {/* View Content Renderer */}
        <main className="flex-1 pb-16">
          {currentView === 'home' && (
            <LandingHero
              onNavigate={setCurrentView}
              onOpenExtensionGuide={() => setIsExtensionGuideOpen(true)}
              isUnlocked={isUnlocked}
              onUnlockClick={() => setIsMasterPasswordModalOpen(true)}
              lastBackupTime={settings.lastBackupTime}
              onBackupExportClick={() => handleExportJSON(true)}
            />
          )}

          {currentView === 'bookmarks' && (
            <BookmarkList
              bookmarks={bookmarks}
              selectedCategory={selectedCategory}
              searchQuery={searchQuery}
              onToggleFavorite={handleToggleBookmarkFavorite}
              onEdit={(bm) => {
                setEditingBookmark(bm);
                setIsBookmarkModalOpen(true);
              }}
              onDelete={handleDeleteBookmark}
              onOpenAddModal={() => {
                setEditingBookmark(null);
                setIsBookmarkModalOpen(true);
              }}
              categories={categories}
            />
          )}

          {currentView === 'passwords' && (
            <PasswordList
              passwords={decryptedPasswords}
              isUnlocked={isUnlocked}
              selectedCategory={selectedCategory}
              searchQuery={searchQuery}
              onUnlockVaultClick={() => setIsMasterPasswordModalOpen(true)}
              onToggleFavorite={handleTogglePasswordFavorite}
              onEdit={(entry) => {
                setEditingPassword(entry);
                setIsPasswordModalOpen(true);
              }}
              onDelete={handleDeletePassword}
              onCopyText={handleCopyText}
              onOpenAddModal={() => {
                setEditingPassword(null);
                setIsPasswordModalOpen(true);
              }}
              onShare={(entry) => setSharingPassword(entry)}
              categories={categories}
            />
          )}

          {currentView === 'favorites' && (
            <div className="p-6 max-w-7xl mx-auto space-y-6">
              <div className="pb-4 border-b border-border">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span>Favorited Items</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Quick access to pinned bookmarks and passwords.</p>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Bookmarks</h3>
                  <BookmarkList
                    bookmarks={bookmarks.filter((b) => b.isFavorite)}
                    selectedCategory={null}
                    searchQuery={searchQuery}
                    onToggleFavorite={handleToggleBookmarkFavorite}
                    onEdit={(bm) => {
                      setEditingBookmark(bm);
                      setIsBookmarkModalOpen(true);
                    }}
                    onDelete={handleDeleteBookmark}
                    onOpenAddModal={() => {
                      setEditingBookmark(null);
                      setIsBookmarkModalOpen(true);
                    }}
                    categories={categories}
                  />
                </div>

                {isUnlocked && (
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Password Vault</h3>
                    <PasswordList
                      passwords={decryptedPasswords.filter((p) => p.isFavorite)}
                      isUnlocked={true}
                      selectedCategory={null}
                      searchQuery={searchQuery}
                      onUnlockVaultClick={() => {}}
                      onToggleFavorite={handleTogglePasswordFavorite}
                      onEdit={(entry) => {
                        setEditingPassword(entry);
                        setIsPasswordModalOpen(true);
                      }}
                      onDelete={handleDeletePassword}
                      onCopyText={handleCopyText}
                      onOpenAddModal={() => {
                        setEditingPassword(null);
                        setIsPasswordModalOpen(true);
                      }}
                      categories={categories}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {currentView === 'generator' && (
            <StandaloneGeneratorView onCopyText={handleCopyText} />
          )}

          {currentView === 'import-export' && (
            <ImportExportView
              isUnlocked={isUnlocked}
              onUnlockVaultClick={() => setIsMasterPasswordModalOpen(true)}
              onImportFile={handleImportFile}
              onExportJSON={handleExportJSON}
              onExportCSV={handleExportCSV}
              addToast={addToast}
            />
          )}

          {currentView === 'security-audit' && (
            <div className="p-6">
              <SecurityAuditView
                passwords={decryptedPasswords}
                isUnlocked={isUnlocked}
                onUnlockClick={() => setIsMasterPasswordModalOpen(true)}
                onEditPassword={(entry) => {
                  setEditingPassword(entry);
                  setIsPasswordModalOpen(true);
                }}
                onUpdatePassword={handleSavePassword}
                addToast={addToast}
              />
            </div>
          )}

          {currentView === 'blog' && (
            <div className="p-6">
              <FeatureGuideView
                onSelectView={setCurrentView}
                onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              />
            </div>
          )}

          {currentView === 'files' && (
            <FileVaultView
              addToast={addToast}
              derivedKey={derivedKey}
              showConfirm={showConfirm}
              onUnlockClick={() => setIsMasterPasswordModalOpen(true)}
            />
          )}

          {currentView === 'totp' && (
            <TotpAuthenticatorView
              passwords={decryptedPasswords}
              addToast={addToast}
              onEditPassword={(entry) => {
                setEditingPassword(entry);
                setIsPasswordModalOpen(true);
              }}
            />
          )}

          {currentView === 'masked-emails' && (
            <MaskedEmailsView
              passwords={decryptedPasswords}
              isUnlocked={isUnlocked}
              onUnlockClick={() => setIsMasterPasswordModalOpen(true)}
              onEditPassword={(entry) => {
                setEditingPassword(entry);
                setIsPasswordModalOpen(true);
              }}
              addToast={addToast}
              onNavigate={handleSelectView}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onExportJSON={handleExportJSON}
              onExportCSV={handleExportCSV}
              onImportFile={handleImportFile}
              onResetVault={handleResetVault}
              isUnlocked={isUnlocked}
              onOpenExtensionGuide={() => setIsExtensionGuideOpen(true)}
              onOpenSyncModal={() => setIsSyncModalOpen(true)}
              onOpenIpfsBackup={() => setIsIpfsBackupOpen(true)}
            />
          )}

          {currentView === 'extension' && (
            <div className="p-6 max-w-4xl mx-auto space-y-6">
              <div className="p-8 rounded-2xl bg-card border border-border text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center text-3xl mx-auto">
                  🧩
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-card-foreground">Chrome & Edge Real Autofill Extension</h2>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Enjoy real password autofill directly in website forms. Local Manifest V3 architecture with zero server dependencies.
                  </p>
                </div>
                <button
                  onClick={() => setIsExtensionGuideOpen(true)}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-2"
                >
                  <Puzzle className="w-4 h-4" />
                  <span>Open Setup Guide & Download Zip</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Dialog Modals */}
      <MasterPasswordModal
        isOpen={isMasterPasswordModalOpen}
        isInitialSetup={!vaultMeta || !vaultMeta.isInitialized}
        onClose={vaultMeta?.isInitialized ? () => setIsMasterPasswordModalOpen(false) : undefined}
        onSubmitPassword={handleMasterPasswordSubmit}
      />

      <BackupPasswordModal
        isOpen={backupFileToDecrypt !== null}
        onClose={() => {
          setBackupFileToDecrypt(null);
          setBackupPasswordError(null);
        }}
        onSubmit={async (pw) => {
          if (backupFileToDecrypt) {
            await handleImportJSONContent(backupFileToDecrypt, pw);
          }
        }}
        error={backupPasswordError}
      />

      <BookmarkModal
        isOpen={isBookmarkModalOpen}
        onClose={() => setIsBookmarkModalOpen(false)}
        onSave={handleSaveBookmark}
        initialBookmark={editingBookmark}
        categories={categories}
        defaultCategoryId={selectedCategory || undefined}
      />

      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSave={handleSavePassword}
        initialEntry={editingPassword}
        categories={categories}
        defaultCategoryId={selectedCategory || undefined}
        settings={settings}
      />

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
        defaultParentId={categoryModalParentId}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        bookmarks={bookmarks}
        passwords={decryptedPasswords}
        isUnlocked={isUnlocked}
        onCopyText={handleCopyText}
      />

      <ExtensionGuideModal
        isOpen={isExtensionGuideOpen}
        onClose={() => setIsExtensionGuideOpen(false)}
      />

      <SharePasswordModal
        isOpen={!!sharingPassword}
        onClose={() => setSharingPassword(null)}
        entry={sharingPassword}
        addToast={addToast}
      />

      {receivedShareHash && (
        <ReceiveShareModal
          encryptedHash={receivedShareHash}
          onClose={() => {
            setReceivedShareHash(null);
            window.history.replaceState(null, '', window.location.pathname);
          }}
          addToast={addToast}
        />
      )}

      {/* Custom Sleek Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmDialog !== null && confirmDialog.isOpen}
        title={confirmDialog?.title || ''}
        message={confirmDialog?.message || ''}
        confirmText={confirmDialog?.confirmText}
        cancelText={confirmDialog?.cancelText}
        isDestructive={confirmDialog?.isDestructive}
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        onClose={confirmDialog?.onCancel || (() => {})}
      />

      <PeerSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        localPasswords={decryptedPasswords}
        localCategories={categories}
        onSyncComplete={handleSyncComplete}
        addToast={addToast}
      />

      <DecentralizedBackupModal
        isOpen={isIpfsBackupOpen}
        onClose={() => setIsIpfsBackupOpen(false)}
        passwords={decryptedPasswords}
        bookmarks={bookmarks}
        categories={categories}
        settings={settings}
        derivedKey={derivedKey}
        isUnlocked={isUnlocked}
        onUnlockClick={() => setIsMasterPasswordModalOpen(true)}
        onRestoreComplete={handleIpfsRestoreComplete}
        addToast={addToast}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
