/**
 * Xerox Extension Background Service Worker
 * Manages active session lock state and responds to popup & content script messages securely.
 */

import { extractDomain, filterMatchingCredentials } from '../vault/credential-matcher.js';
import { decryptVault } from '../vault/secure-storage.js';

let activeDecryptedVault = null; // Stored in-memory while unlocked
let autoLockTimer = null;
let autoLockMinutes = 15;

async function getActiveVault() {
  if (activeDecryptedVault) return activeDecryptedVault;
  try {
    if (chrome.storage.session) {
      const sess = await chrome.storage.session.get(['decryptedVault', 'isUnlocked']);
      if (sess && sess.isUnlocked && sess.decryptedVault) {
        activeDecryptedVault = sess.decryptedVault;
        return activeDecryptedVault;
      }
    }
  } catch (e) {}
  return null;
}

function resetAutoLock() {
  if (autoLockTimer) clearTimeout(autoLockTimer);
  if (autoLockMinutes > 0) {
    autoLockTimer = setTimeout(async () => {
      activeDecryptedVault = null;
      if (chrome.storage.session) {
        await chrome.storage.session.remove(['decryptedVault', 'isUnlocked']);
      }
      chrome.storage.local.set({ isUnlocked: false });
      console.log('[Xerox Background] Auto-locked vault.');
    }, autoLockMinutes * 60 * 1000);
  }
}

async function autoSyncFromWebAppTabs() {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (!tab.url) continue;
      if (tab.url.includes('localhost') || tab.url.includes('127.0.0.1') || tab.url.includes('xerox')) {
        try {
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              try {
                return localStorage.getItem('xerox_vault_meta_sync');
              } catch (e) {
                return null;
              }
            }
          });
          if (results && results[0] && results[0].result) {
            const meta = JSON.parse(results[0].result);
            if (meta && meta.encryptedVault) {
              await chrome.storage.local.set({ vaultMeta: meta, encryptedVault: meta.encryptedVault });
              console.log('[Xerox Background] Auto-synced vault payload from tab:', tab.url);
              return true;
            }
          }
        } catch (e) {}
      }
    }
  } catch (e) {}
  return false;
}

// Service worker listeners
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { action, payload } = request;

  if (action === 'GET_LOCK_STATUS') {
    getActiveVault().then((vault) => {
      sendResponse({
        isUnlocked: !!vault,
        hasVaultData: true
      });
    });
    return true;
  }

  if (action === 'UNLOCK_VAULT') {
    const { masterPassword } = payload;
    chrome.storage.local.get(['vaultMeta', 'encryptedVault'], async (res) => {
      try {
        let meta = res.vaultMeta;
        let vault = res.encryptedVault || (meta && meta.encryptedVault);

        if (!vault || !vault.cipherText) {
          await autoSyncFromWebAppTabs();
          const refreshed = await new Promise((resolve) =>
            chrome.storage.local.get(['vaultMeta', 'encryptedVault'], resolve)
          );
          meta = refreshed.vaultMeta;
          vault = refreshed.encryptedVault || (meta && meta.encryptedVault);
        }

        if (!vault || !vault.cipherText) {
          sendResponse({
            success: false,
            error: 'Vault data not synced yet.\n\nPlease open your Xerox Web Vault tab once to sync your vault.'
          });
          return;
        }

        let decrypted = null;
        let lastError = null;
        const saltToUse = vault.salt || (meta && meta.salt);

        try {
          decrypted = await decryptVault(vault.cipherText, vault.iv, saltToUse, masterPassword);
        } catch (e) {
          lastError = e;
        }

        if (!decrypted && meta && meta.salt && meta.salt !== vault.salt) {
          try {
            decrypted = await decryptVault(vault.cipherText, vault.iv, meta.salt, masterPassword);
          } catch (e) {
            lastError = e;
          }
        }

        if (!decrypted) {
          throw new Error(lastError?.message || 'Incorrect master password');
        }

        activeDecryptedVault = decrypted;
        
        if (chrome.storage.session) {
          await chrome.storage.session.set({ decryptedVault: decrypted, isUnlocked: true });
        }
        chrome.storage.local.set({ isUnlocked: true });
        resetAutoLock();

        sendResponse({ success: true, count: decrypted.length });
      } catch (err) {
        sendResponse({ success: false, error: err.message || 'Incorrect master password' });
      }
    });
    return true;
  }

  if (action === 'LOCK_VAULT') {
    activeDecryptedVault = null;
    if (autoLockTimer) clearTimeout(autoLockTimer);
    if (chrome.storage.session) {
      chrome.storage.session.remove(['decryptedVault', 'isUnlocked']);
    }
    chrome.storage.local.set({ isUnlocked: false });
    sendResponse({ success: true });
    return true;
  }

  if (action === 'GET_MATCHING_CREDENTIALS') {
    const { url } = payload;
    getActiveVault().then((vault) => {
      if (!vault) {
        sendResponse({ isUnlocked: false, matches: [] });
        return;
      }

      resetAutoLock();
      const matches = filterMatchingCredentials(url, vault);
      sendResponse({
        isUnlocked: true,
        domain: extractDomain(url),
        matches: matches.map(m => ({
          id: m.id,
          websiteName: m.websiteName,
          websiteUrl: m.websiteUrl,
          username: m.username,
        }))
      });
    });
    return true;
  }

  if (action === 'AUTHORIZE_AUTOFILL') {
    const { id, url } = payload;
    getActiveVault().then((vault) => {
      if (!vault) {
        sendResponse({ success: false, error: 'Vault is locked. Please unlock via extension.' });
        return;
      }

      resetAutoLock();
      const item = vault.find(c => c.id === id);
      if (!item) {
        sendResponse({ success: false, error: 'Credential not found in vault.' });
        return;
      }

      sendResponse({
        success: true,
        credential: {
          username: item.username || item.email || '',
          password: item.password || ''
        }
      });
    });
    return true;
  }

  if (action === 'GET_ALL_CREDENTIALS_SUMMARY') {
    getActiveVault().then((vault) => {
      if (!vault) {
        sendResponse({ isUnlocked: false, credentials: [] });
        return;
      }
      sendResponse({
        isUnlocked: true,
        credentials: vault.map(m => ({
          id: m.id,
          websiteName: m.websiteName || m.title || extractDomain(m.websiteUrl) || 'Untitled',
          websiteUrl: m.websiteUrl || m.url || '',
          username: m.username || m.email || '',
        }))
      });
    });
    return true;
  }

  if (action === 'SYNC_VAULT_FROM_WEBAPP') {
    const { vaultMeta, encryptedVault } = payload;
    chrome.storage.local.set({ vaultMeta, encryptedVault }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
