/**
 * Xerox Extension Background Service Worker
 * Manages active session lock state and responds to popup & content script messages securely.
 */

import { extractDomain, isSafeDomainMatch, filterMatchingCredentials } from '../vault/credential-matcher.js';
import { decryptVault } from '../vault/secure-storage.js';

let activeDecryptedVault = null; // Stored in-memory while unlocked
let autoLockTimer = null;
let autoLockMinutes = 15;

function resetAutoLock() {
  if (autoLockTimer) clearTimeout(autoLockTimer);
  if (autoLockMinutes > 0 && activeDecryptedVault) {
    autoLockTimer = setTimeout(() => {
      activeDecryptedVault = null;
      chrome.storage.local.set({ isUnlocked: false });
      console.log('[Xerox Background] Auto-locked vault.');
    }, autoLockMinutes * 60 * 1000);
  }
}

// Service worker listeners
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { action, payload } = request;

  if (action === 'GET_LOCK_STATUS') {
    sendResponse({
      isUnlocked: !!activeDecryptedVault,
      hasVaultData: true
    });
    return true;
  }

  if (action === 'UNLOCK_VAULT') {
    const { masterPassword } = payload;
    chrome.storage.local.get(['vaultMeta', 'encryptedVault'], async (res) => {
      try {
        const meta = res.vaultMeta;
        const vault = res.encryptedVault || (meta && meta.encryptedVault);

        if (!vault) {
          sendResponse({ success: false, error: 'No vault data found in local storage.' });
          return;
        }

        const decrypted = await decryptVault(vault.cipherText, vault.iv, vault.salt, masterPassword);
        activeDecryptedVault = decrypted;
        resetAutoLock();

        chrome.storage.local.set({ isUnlocked: true });
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
    chrome.storage.local.set({ isUnlocked: false });
    sendResponse({ success: true });
    return true;
  }

  if (action === 'GET_MATCHING_CREDENTIALS') {
    const { url } = payload;
    if (!activeDecryptedVault) {
      sendResponse({ isUnlocked: false, matches: [] });
      return true;
    }

    resetAutoLock();
    const matches = filterMatchingCredentials(url, activeDecryptedVault);
    sendResponse({
      isUnlocked: true,
      domain: extractDomain(url),
      matches: matches.map(m => ({
        id: m.id,
        websiteName: m.websiteName,
        websiteUrl: m.websiteUrl,
        username: m.username,
        // Omit password from initial preview list for privacy
      }))
    });
    return true;
  }

  if (action === 'AUTHORIZE_AUTOFILL') {
    const { id, url } = payload;
    if (!activeDecryptedVault) {
      sendResponse({ success: false, error: 'Vault is locked.' });
      return true;
    }

    resetAutoLock();
    const item = activeDecryptedVault.find(c => c.id === id);
    if (!item) {
      sendResponse({ success: false, error: 'Credential not found.' });
      return true;
    }

    // Verify safe domain match before returning secret credential
    if (!isSafeDomainMatch(url, item.websiteUrl || item.url)) {
      sendResponse({ success: false, error: 'Domain mismatch security violation.' });
      return true;
    }

    sendResponse({
      success: true,
      credential: {
        username: item.username,
        password: item.password
      }
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
