import { Bookmark, Category, EncryptedFile, EncryptedVaultData, VaultSettings } from '../types';
import { INITIAL_BOOKMARKS, INITIAL_CATEGORIES } from './sampleData';

const DB_NAME = 'XeroxLocalVaultDB';
const DB_VERSION = 2;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('bookmarks')) {
        db.createObjectStore('bookmarks', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('vault_meta')) {
        db.createObjectStore('vault_meta', { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains('encrypted_files')) {
        db.createObjectStore('encrypted_files', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// === BOOKMARKS ===

export async function getBookmarks(): Promise<Bookmark[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('bookmarks', 'readonly');
    const store = tx.objectStore('bookmarks');
    const req = store.getAll();
    req.onsuccess = () => {
      if (!req.result || req.result.length === 0) {
        // Seed initial bookmarks
        saveAllBookmarks(INITIAL_BOOKMARKS).then(() => resolve(INITIAL_BOOKMARKS));
      } else {
        resolve(req.result);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveAllBookmarks(bookmarks: Bookmark[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('bookmarks', 'readwrite');
  const store = tx.objectStore('bookmarks');
  store.clear();
  bookmarks.forEach((b) => store.put(b));
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveBookmark(bookmark: Bookmark): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('bookmarks', 'readwrite');
  tx.objectStore('bookmarks').put(bookmark);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteBookmarkDB(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('bookmarks', 'readwrite');
  tx.objectStore('bookmarks').delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// === CATEGORIES ===

export async function getCategories(): Promise<Category[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('categories', 'readonly');
    const req = tx.objectStore('categories').getAll();
    req.onsuccess = () => {
      if (!req.result || req.result.length === 0) {
        saveAllCategories(INITIAL_CATEGORIES).then(() => resolve(INITIAL_CATEGORIES));
      } else {
        resolve(req.result);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveAllCategories(categories: Category[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('categories', 'readwrite');
  const store = tx.objectStore('categories');
  store.clear();
  categories.forEach((c) => store.put(c));
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveCategoryDB(category: Category): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('categories', 'readwrite');
  tx.objectStore('categories').put(category);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteCategoryDB(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('categories', 'readwrite');
  tx.objectStore('categories').delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

declare const chrome: any;

// === ENCRYPTED VAULT META ===

export interface VaultMetadata {
  isInitialized: boolean;
  salt: string;
  verifier?: string;
  encryptedVault?: EncryptedVaultData;
}

export async function getVaultMeta(): Promise<VaultMetadata | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('vault_meta', 'readonly');
    const req = tx.objectStore('vault_meta').get('metadata');
    req.onsuccess = () => resolve(req.result ? req.result.value : null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveVaultMeta(meta: VaultMetadata): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('vault_meta', 'readwrite');
  tx.objectStore('vault_meta').put({ key: 'metadata', value: meta });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      // Sync to localStorage & Extension message channel
      try {
        localStorage.setItem('xerox_vault_meta_sync', JSON.stringify(meta));
        window.postMessage({ type: 'XEROX_SYNC_VAULT', vaultMeta: meta, encryptedVault: meta.encryptedVault }, '*');
        
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({
            action: 'SYNC_VAULT_FROM_WEBAPP',
            payload: { vaultMeta: meta, encryptedVault: meta.encryptedVault }
          }, () => {
            // Ignore runtime errors if extension is not installed
          });
        }
      } catch (e) {
        console.error('Vault metadata sync error:', e);
      }
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearVaultMeta(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('vault_meta', 'readwrite');
  tx.objectStore('vault_meta').delete('metadata');
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      try {
        localStorage.removeItem('xerox_vault_meta_sync');
      } catch (e) {}
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}



// === SETTINGS ===

const DEFAULT_SETTINGS: VaultSettings = {
  autoLockMinutes: 15,
  requireConfirmationForAutofill: true,
  trustedDomains: ['github.com', 'google.com', 'notion.so'],
};

export async function getSettings(): Promise<VaultSettings> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readonly');
    const req = tx.objectStore('settings').get('vault_settings');
    req.onsuccess = () => resolve(req.result ? req.result.value : DEFAULT_SETTINGS);
    req.onerror = () => reject(req.error);
  });
}

export async function saveSettings(settings: VaultSettings): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('settings', 'readwrite');
  tx.objectStore('settings').put({ key: 'vault_settings', value: settings });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// === ENCRYPTED FILES ===

export async function getEncryptedFiles(): Promise<EncryptedFile[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('encrypted_files', 'readonly');
    const req = tx.objectStore('encrypted_files').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function saveEncryptedFile(file: EncryptedFile): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('encrypted_files', 'readwrite');
  tx.objectStore('encrypted_files').put(file);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteEncryptedFileDB(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('encrypted_files', 'readwrite');
  tx.objectStore('encrypted_files').delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveAllEncryptedFiles(files: EncryptedFile[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('encrypted_files', 'readwrite');
  const store = tx.objectStore('encrypted_files');
  store.clear();
  files.forEach((f) => store.put(f));
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function resetDatabase(): Promise<void> {
  const db = await getDB();
  const stores = ['bookmarks', 'categories', 'vault_meta', 'settings', 'encrypted_files'];
  const tx = db.transaction(stores, 'readwrite');
  stores.forEach((store) => tx.objectStore(store).clear());
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      localStorage.removeItem('xerox_vault_meta_sync');
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}
