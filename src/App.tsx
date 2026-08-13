import React, { useState, useEffect, useCallback } from 'react';
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
import { ToastContainer, ToastMessage } from './components/Toast';
import { BackupPasswordModal } from './components/BackupPasswordModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { Puzzle, Star } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
  const [masterPasswordMem, setMasterPasswordMem] = useState<string | null>(null);
  const [decryptedPasswords, setDecryptedPasswords] = useState<PasswordEntry[]>([]);

  // Modals & UI Controls
  const [isMasterPasswordModalOpen, setIsMasterPasswordModalOpen] = useState(false);
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isExtensionGuideOpen, setIsExtensionGuideOpen] = useState(false);
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

        // If vault hasn't been set up yet, show initial setup modal
        if (!meta || !meta.isInitialized) {
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
    setMasterPasswordMem(null);
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
      const { cipherText, iv, salt } = await encryptVaultData(INITIAL_DEMO_VAULT_ITEMS, password);
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
      setMasterPasswordMem(password);
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

        const decrypted = await decryptVaultData(
          vaultMeta.encryptedVault.cipherText,
          vaultMeta.encryptedVault.iv,
          vaultMeta.encryptedVault.salt,
          password
        );

        setMasterPasswordMem(password);
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

    if (!masterPasswordMem || !vaultMeta) return;

    try {
      const { cipherText, iv, salt } = await encryptVaultData(
        newPasswords,
        masterPasswordMem,
        vaultMeta.salt
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

  // Bookmark handlers
  const handleSaveBookmark = async (bookmark: Bookmark) => {
    const existingIndex = bookmarks.findIndex((b) => b.id === bookmark.id);
    let updated: Bookmark[];
    if (existingIndex >= 0) {
      updated = [...bookmarks];
      updated[existingIndex] = bookmark;
    } else {
      updated = [bookmark, ...bookmarks];
    }
    setBookmarks(updated);
    await saveBookmark(bookmark);
    addToast(existingIndex >= 0 ? 'Bookmark updated' : 'Bookmark added', 'success');
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
    let updated: PasswordEntry[];
    if (existingIndex >= 0) {
      updated = [...decryptedPasswords];
      updated[existingIndex] = entry;
    } else {
      updated = [entry, ...decryptedPasswords];
    }
    await saveAndEncryptPasswords(updated);
    addToast(existingIndex >= 0 ? 'Password entry updated' : 'Password stored securely', 'success');
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

  // Copy Clipboard Helper
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast(`${label} copied to clipboard`, 'success');
  };

  // Settings & Export/Import
  const handleUpdateSettings = async (newSettings: VaultSettings) => {
    setSettingsState(newSettings);
    await saveSettings(newSettings);
    addToast('Settings updated', 'success');
  };

  const handleExportJSON = async (encrypted: boolean) => {
    if (!isUnlocked || !masterPasswordMem) {
      addToast('Please unlock your vault first to export.', 'error');
      setIsMasterPasswordModalOpen(true);
      return;
    }

    try {
      const files = await getEncryptedFiles();
      const backupData = {
        app: 'Xerox Password & Bookmark Manager',
        version: 2,
        exportedAt: new Date().toISOString(),
        unencrypted: !encrypted,
        passwords: decryptedPasswords,
        bookmarks,
        categories,
        settings,
        files,
      };

      let finalPayload: any = backupData;

      if (encrypted) {
        const { cipherText, iv, salt } = await encryptVaultData(
          backupData,
          masterPasswordMem
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
    try {
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        addToast('CSV file appears empty or invalid', 'error');
        return;
      }

      // Parse Header
      const headerCols = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim().toLowerCase());
      const titleIdx = headerCols.findIndex((h) => h.includes('title') || h.includes('name'));
      const urlIdx = headerCols.findIndex((h) => h.includes('url') || h.includes('website'));
      const userIdx = headerCols.findIndex((h) => h.includes('user') || h.includes('login') || h.includes('email'));
      const passIdx = headerCols.findIndex((h) => h.includes('pass') || h.includes('secret'));
      const notesIdx = headerCols.findIndex((h) => h.includes('note') || h.includes('comment'));
      const catIdx = headerCols.findIndex((h) => h.includes('cat') || h.includes('folder'));

      const newEntries: PasswordEntry[] = [];
      for (let i = 1; i < lines.length; i++) {
        const rawRow = lines[i];
        const cols = rawRow.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || rawRow.split(',');
        const cleanCols = cols.map((c) => c.replace(/^"|"$/g, '').trim());

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
      const decryptPassword = usedPassword || masterPasswordMem;
      if (!decryptPassword) {
        setBackupFileToDecrypt(content);
        return;
      }

      try {
        const decryptedData = await decryptVaultData(
          content.cipherText,
          content.iv,
          content.salt,
          decryptPassword
        );

        showConfirm(
          'Import Encrypted Backup',
          'Importing this backup will overwrite your entire current vault. All passwords, bookmarks, settings, and files will be replaced. Do you want to proceed?',
          async () => {
            await performRestore(decryptedData, decryptPassword);
            addToast('Encrypted backup imported and restored successfully!', 'success');
            setBackupFileToDecrypt(null);
            setBackupPasswordError(null);
          }
        );
      } catch (err) {
        console.error(err);
        if (usedPassword) {
          setBackupPasswordError('Incorrect password for this backup file.');
        } else {
          setBackupFileToDecrypt(content);
        }
      }
      return;
    }

    // 2. New Unencrypted Backup
    if (content.unencrypted && (content.passwords || content.bookmarks)) {
      if (!isUnlocked || !masterPasswordMem) {
        addToast('Please unlock your vault before importing backup.', 'error');
        setIsMasterPasswordModalOpen(true);
        return;
      }

      showConfirm(
        'Import Unencrypted Backup',
        'Importing this backup will overwrite your entire current vault. All passwords, bookmarks, settings, and files will be replaced. Do you want to proceed?',
        async () => {
          await performRestore(content, masterPasswordMem);
          addToast('Unencrypted backup imported and restored successfully!', 'success');
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

          if (isUnlocked && masterPasswordMem) {
            try {
              const decrypted = await decryptVaultData(
                content.vaultMeta.encryptedVault.cipherText,
                content.vaultMeta.encryptedVault.iv,
                content.vaultMeta.encryptedVault.salt,
                masterPasswordMem
              );
              setDecryptedPasswords(decrypted);
            } catch {
              lockVault();
            }
          } else {
            setIsUnlocked(false);
            setMasterPasswordMem(null);
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
      await saveAllEncryptedFiles(data.files);
    } else {
      await saveAllEncryptedFiles([]);
    }

    if (data.passwords) {
      setDecryptedPasswords(data.passwords);
      setMasterPasswordMem(password);
      setIsUnlocked(true);

      const { cipherText, iv, salt } = await encryptVaultData(
        data.passwords,
        password
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
    setMasterPasswordMem(null);
    setIsMasterPasswordModalOpen(true);
    addToast('Local vault reset completed', 'info');
  };

  return (
    <div className="flex h-screen bg-background text-foreground font-sans antialiased overflow-hidden select-none">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        isUnlocked={isUnlocked}
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
        bookmarkCount={bookmarks.length}
        passwordCount={decryptedPasswords.length}
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
            <FileVaultView addToast={addToast} masterPasswordMem={masterPasswordMem} showConfirm={showConfirm} />
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
      />

      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSave={handleSavePassword}
        initialEntry={editingPassword}
        categories={categories}
      />

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
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

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
