/**
 * Xerox Extension Background Service Worker
 * Manages active session lock state, ephemeral storage rehydration, origin validation,
 * and responds to popup & content script messages securely.
 */

import { extractDomain, filterMatchingCredentials, isSafeDomainMatch } from '../vault/credential-matcher.js';
import { decryptVault } from '../vault/secure-storage.js';

const XEROX_DEBUG_AUTOFILL = true;

function debugLog(...args) {
  if (XEROX_DEBUG_AUTOFILL) {
    console.log('[XEROX DEBUG SW]', ...args);
  }
}

let activeDecryptedVault = null;
let autoLockMinutes = 15;

async function getActiveVault() {
  const now = Date.now();

  // Try memory cache first
  if (activeDecryptedVault) {
    try {
      if (chrome.storage.session) {
        const sess = await chrome.storage.session.get(['unlockedAt', 'autoLockMinutes']);
        const minutes = sess.autoLockMinutes || autoLockMinutes;
        const unlockedAt = sess.unlockedAt || 0;
        if (minutes > 0 && unlockedAt > 0 && (now - unlockedAt > minutes * 60 * 1000)) {
          debugLog('Session expired by timeout (in-memory reset)');
          await lockVaultInternal();
          return null;
        }
      }
    } catch (e) {}
    return activeDecryptedVault;
  }

  // Rehydrate from chrome.storage.session (survives service worker suspension)
  try {
    if (chrome.storage.session) {
      const sess = await chrome.storage.session.get(['decryptedVault', 'isUnlocked', 'unlockedAt', 'autoLockMinutes']);
      if (sess && sess.isUnlocked && sess.decryptedVault) {
        const minutes = sess.autoLockMinutes || autoLockMinutes;
        const unlockedAt = sess.unlockedAt || 0;
        
        if (minutes > 0 && unlockedAt > 0 && (now - unlockedAt > minutes * 60 * 1000)) {
          debugLog('Session expired by timeout during worker rehydration');
          await lockVaultInternal();
          return null;
        }

        activeDecryptedVault = sess.decryptedVault;
        debugLog('Successfully rehydrated vault from chrome.storage.session. Items count:', activeDecryptedVault.length);
        return activeDecryptedVault;
      }
    }
  } catch (e) {
    debugLog('Error reading chrome.storage.session:', e);
  }

  return null;
}

async function lockVaultInternal() {
  activeDecryptedVault = null;
  if (chrome.storage.session) {
    try {
      await chrome.storage.session.clear();
    } catch (e) {}
  }
  await chrome.storage.local.set({ isUnlocked: false });
  debugLog('Vault locked.');
}

async function touchSession() {
  if (chrome.storage.session) {
    try {
      await chrome.storage.session.set({ unlockedAt: Date.now() });
    } catch (e) {}
  }
}

// Service worker listeners
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { action, payload } = request;
  debugLog('Message received:', action, 'sender tab:', sender?.tab?.id || 'popup/internal');

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
    const { masterPassword } = payload || {};
    chrome.storage.local.get(['vaultMeta', 'encryptedVault'], async (res) => {
      try {
        let meta = res.vaultMeta;
        let vault = res.encryptedVault || (meta && meta.encryptedVault);

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
          await chrome.storage.session.set({
            decryptedVault: decrypted,
            isUnlocked: true,
            unlockedAt: Date.now(),
            autoLockMinutes: autoLockMinutes
          });
        }
        await chrome.storage.local.set({ isUnlocked: true });
        debugLog('Vault unlocked successfully. Item count:', decrypted.length);

        sendResponse({ success: true, count: decrypted.length });
      } catch (err) {
        debugLog('Vault unlock failed:', err.message);
        sendResponse({ success: false, error: err.message || 'Incorrect master password' });
      }
    });
    return true;
  }

  if (action === 'LOCK_VAULT') {
    lockVaultInternal().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (action === 'GET_MATCHING_CREDENTIALS') {
    const { url } = payload || {};
    getActiveVault().then((vault) => {
      if (!vault) {
        debugLog('GET_MATCHING_CREDENTIALS: Vault is locked');
        sendResponse({ isUnlocked: false, matches: [] });
        return;
      }

      touchSession();
      const matches = filterMatchingCredentials(url, vault);
      const host = extractDomain(url);
      debugLog(`GET_MATCHING_CREDENTIALS for "${host}": found ${matches.length} matches`);
      sendResponse({
        isUnlocked: true,
        domain: host,
        matches: matches.map(m => ({
          id: m.id,
          websiteName: m.websiteName || m.title || extractDomain(m.websiteUrl) || 'Untitled',
          websiteUrl: m.websiteUrl || m.url || '',
          username: m.username || m.email || '',
        }))
      });
    });
    return true;
  }

  if (action === 'AUTHORIZE_AUTOFILL') {
    const { id, url, allowCrossDomain } = payload || {};
    getActiveVault().then((vault) => {
      if (!vault) {
        debugLog('AUTHORIZE_AUTOFILL failed: Vault is locked');
        sendResponse({ success: false, error: 'Vault is locked. Please unlock via extension.' });
        return;
      }

      touchSession();
      const item = vault.find(c => c.id === id);
      if (!item) {
        debugLog('AUTHORIZE_AUTOFILL failed: Credential ID not found');
        sendResponse({ success: false, error: 'Credential not found in vault.' });
        return;
      }

      const credUrl = item.websiteUrl || item.url || item.websiteName || '';
      const domainMatch = isSafeDomainMatch(url, credUrl);

      if (!domainMatch && !allowCrossDomain) {
        debugLog(`AUTHORIZE_AUTOFILL origin validation rejected. Page URL: ${url}, Credential target: ${credUrl}`);
        sendResponse({
          success: false,
          error: `Security Warning: Credential domain (${extractDomain(credUrl) || 'unknown'}) does not match target website (${extractDomain(url)}).`
        });
        return;
      }

      debugLog(`AUTHORIZE_AUTOFILL approved for credential ID "${id}" on origin "${extractDomain(url)}"`);
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
    const { vaultMeta, encryptedVault } = payload || {};
    if (vaultMeta || encryptedVault) {
      const payloadToSave = {
        vaultMeta: vaultMeta || { encryptedVault },
        encryptedVault: encryptedVault || (vaultMeta && vaultMeta.encryptedVault)
      };
      chrome.storage.local.set(payloadToSave, () => {
        debugLog('Vault payload successfully synced into chrome.storage.local from Web App');
        sendResponse({ success: true });
      });
    } else {
      sendResponse({ success: false, error: 'Missing vault payload' });
    }
    return true;
  }
});
