import JSZip from 'jszip';

export async function generateExtensionZip(): Promise<Blob> {
  const zip = new JSZip();

  // Manifest V3
  zip.file(
    'manifest.json',
    JSON.stringify(
      {
        manifest_version: 3,
        name: 'Lokker - Local-First Password Vault',
        version: '1.0.0',
        description: 'Local-first privacy-focused password vault and bookmark manager with real browser autofill.',
        permissions: ['activeTab', 'storage', 'scripting'],
        host_permissions: ['<all_urls>'],
        background: {
          service_worker: 'background/service-worker.js',
          type: 'module',
        },
        content_scripts: [
          {
            matches: ['<all_urls>'],
            js: ['content/field-detector.js', 'content/autofill.js', 'content/content-script.js'],
            run_at: 'document_idle',
            all_frames: true,
          },
        ],
        action: {
          default_popup: 'popup/popup.html',
          default_title: 'Lokker Password Vault',
          default_icon: {
            '16': 'icons/icon16.png',
            '48': 'icons/icon48.png',
            '128': 'icons/icon128.png',
          },
        },
        icons: {
          '16': 'icons/icon16.png',
          '48': 'icons/icon48.png',
          '128': 'icons/icon128.png',
        },
      },
      null,
      2
    )
  );

  // Background Service Worker
  const bgFolder = zip.folder('background');
  bgFolder?.file(
    'service-worker.js',
    `
import { extractDomain, filterMatchingCredentials, isSafeDomainMatch } from '../vault/credential-matcher.js';
import { decryptVault } from '../vault/secure-storage.js';

const XEROX_DEBUG_AUTOFILL = true;

function debugLog(...args) {
  if (XEROX_DEBUG_AUTOFILL) console.log('[XEROX DEBUG SW]', ...args);
}

let activeDecryptedVault = null;
let autoLockMinutes = 15;

async function getActiveVault() {
  const now = Date.now();
  if (activeDecryptedVault) {
    try {
      if (chrome.storage.session) {
        const sess = await chrome.storage.session.get(['unlockedAt', 'autoLockMinutes']);
        const minutes = sess.autoLockMinutes || autoLockMinutes;
        const unlockedAt = sess.unlockedAt || 0;
        if (minutes > 0 && unlockedAt > 0 && (now - unlockedAt > minutes * 60 * 1000)) {
          await lockVaultInternal();
          return null;
        }
      }
    } catch (e) {}
    return activeDecryptedVault;
  }

  try {
    if (chrome.storage.session) {
      const sess = await chrome.storage.session.get(['decryptedVault', 'isUnlocked', 'unlockedAt', 'autoLockMinutes']);
      if (sess && sess.isUnlocked && sess.decryptedVault) {
        const minutes = sess.autoLockMinutes || autoLockMinutes;
        const unlockedAt = sess.unlockedAt || 0;
        if (minutes > 0 && unlockedAt > 0 && (now - unlockedAt > minutes * 60 * 1000)) {
          await lockVaultInternal();
          return null;
        }
        activeDecryptedVault = sess.decryptedVault;
        return activeDecryptedVault;
      }
    }
  } catch (e) {}

  return null;
}

async function lockVaultInternal() {
  activeDecryptedVault = null;
  if (chrome.storage.session) {
    try { await chrome.storage.session.clear(); } catch (e) {}
  }
  await chrome.storage.local.set({ isUnlocked: false });
}

async function touchSession() {
  if (chrome.storage.session) {
    try { await chrome.storage.session.set({ unlockedAt: Date.now() }); } catch (e) {}
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { action, payload } = request;

  if (action === 'GET_LOCK_STATUS') {
    getActiveVault().then((vault) => {
      sendResponse({ isUnlocked: !!vault, hasVaultData: true });
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
            error: 'Vault data not synced yet.\\n\\nPlease open your Lokker Web Vault tab once to sync your vault.'
          });
          return;
        }

        let decrypted = null;
        let lastError = null;
        const saltToUse = vault.salt || (meta && meta.salt);

        try { decrypted = await decryptVault(vault.cipherText, vault.iv, saltToUse, masterPassword); } catch (e) { lastError = e; }

        if (!decrypted && meta && meta.salt && meta.salt !== vault.salt) {
          try { decrypted = await decryptVault(vault.cipherText, vault.iv, meta.salt, masterPassword); } catch (e) { lastError = e; }
        }

        if (!decrypted) throw new Error(lastError?.message || 'Incorrect master password');

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

        sendResponse({ success: true, count: decrypted.length });
      } catch (err) {
        sendResponse({ success: false, error: err.message || 'Incorrect master password' });
      }
    });
    return true;
  }

  if (action === 'LOCK_VAULT') {
    lockVaultInternal().then(() => sendResponse({ success: true }));
    return true;
  }

  if (action === 'GET_MATCHING_CREDENTIALS') {
    const { url } = payload || {};
    getActiveVault().then((vault) => {
      if (!vault) {
        sendResponse({ isUnlocked: false, matches: [] });
        return;
      }
      touchSession();
      const matches = filterMatchingCredentials(url, vault);
      sendResponse({
        isUnlocked: true,
        domain: extractDomain(url),
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
        sendResponse({ success: false, error: 'Vault is locked. Please unlock via extension.' });
        return;
      }

      touchSession();
      const item = vault.find(c => c.id === id);
      if (!item) {
        sendResponse({ success: false, error: 'Credential not found in vault.' });
        return;
      }

      const credUrl = item.websiteUrl || item.url || item.websiteName || '';
      const domainMatch = isSafeDomainMatch(url, credUrl);

      if (!domainMatch && !allowCrossDomain) {
        sendResponse({
          success: false,
          error: \`Security Warning: Credential domain (\${extractDomain(credUrl) || 'unknown'}) does not match target website (\${extractDomain(url)}).\`
        });
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
    const { vaultMeta, encryptedVault } = payload || {};
    if (vaultMeta || encryptedVault) {
      chrome.storage.local.set({
        vaultMeta: vaultMeta || { encryptedVault },
        encryptedVault: encryptedVault || (vaultMeta && vaultMeta.encryptedVault)
      }, () => sendResponse({ success: true }));
    } else {
      sendResponse({ success: false, error: 'Missing vault payload' });
    }
    return true;
  }
});
`
  );

  // Content Scripts
  const contentFolder = zip.folder('content');
  contentFolder?.file(
    'field-detector.js',
    `
(function () {
  window.XeroxFieldDetector = {
    findLoginFields(contextTarget) {
      function getInputsRecursive(root) {
        let inputs = [];
        if (!root) return inputs;
        try {
          const directInputs = Array.from(
            root.querySelectorAll(
              'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="image"])'
            )
          );
          inputs.push(...directInputs);
        } catch (e) {}
        try {
          const allElements = Array.from(root.querySelectorAll('*'));
          for (const el of allElements) {
            if (el.shadowRoot) inputs.push(...getInputsRecursive(el.shadowRoot));
          }
        } catch (e) {}
        return inputs;
      }

      function isVisible(el) {
        if (!el || !el.ownerDocument) return false;
        try {
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
          const rect = el.getBoundingClientRect();
          return rect.width > 0 || rect.height > 0 || el.offsetWidth > 0 || el.offsetHeight > 0;
        } catch (e) { return true; }
      }

      function getAttrString(input) {
        if (!input) return '';
        return ((input.name || '') + ' ' + (input.id || '') + ' ' + (input.getAttribute('autocomplete') || '') + ' ' + (input.placeholder || '') + ' ' + (input.getAttribute('aria-label') || '') + ' ' + (input.type || '')).toLowerCase();
      }

      const activeTarget = contextTarget || (document.activeElement && document.activeElement.tagName === 'INPUT' ? document.activeElement : null);
      let searchRoot = activeTarget ? (activeTarget.closest('form') || activeTarget.closest('[role="dialog"]') || activeTarget.parentElement || document) : document;

      let allInputs = getInputsRecursive(searchRoot);
      if (allInputs.length === 0 && searchRoot !== document) allInputs = getInputsRecursive(document);

      const visibleInputs = allInputs.filter(isVisible);

      let passwordInputs = visibleInputs.filter(i => {
        const type = (i.type || '').toLowerCase();
        const auto = (i.getAttribute('autocomplete') || '').toLowerCase();
        return type === 'password' || auto === 'current-password' || auto === 'new-password';
      });

      let passwordInput = passwordInputs[0] || null;
      if (activeTarget && activeTarget.type === 'password' && isVisible(activeTarget)) passwordInput = activeTarget;

      let usernameCandidate = null;

      if (passwordInput) {
        const form = passwordInput.closest('form');
        let candidates = form ? Array.from(form.querySelectorAll('input:not([type="password"]):not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])')).filter(isVisible) : visibleInputs.filter(i => i !== passwordInput && i.type !== 'password');

        if (activeTarget && activeTarget !== passwordInput && activeTarget.type !== 'password') usernameCandidate = activeTarget;

        if (!usernameCandidate) {
          usernameCandidate = candidates.find(i => {
            const auto = (i.getAttribute('autocomplete') || '').toLowerCase();
            return auto === 'username' || auto === 'email';
          });
        }

        if (!usernameCandidate) {
          const preceding = candidates.filter(i => (i.compareDocumentPosition(passwordInput) & Node.DOCUMENT_POSITION_PRECEDING) !== 0);
          usernameCandidate = preceding.slice().reverse().find(i => {
            const attr = getAttrString(i);
            return i.type === 'email' || attr.includes('user') || attr.includes('email') || attr.includes('login') || attr.includes('identifier') || attr.includes('account');
          }) || preceding[preceding.length - 1];
        }

        if (!usernameCandidate) {
          usernameCandidate = candidates.find(i => {
            const attr = getAttrString(i);
            return i.type === 'email' || attr.includes('user') || attr.includes('email') || attr.includes('login') || attr.includes('identifier') || attr.includes('account');
          }) || candidates[0] || null;
        }

        return { usernameInput: usernameCandidate, passwordInput, targetInput: activeTarget || passwordInput || usernameCandidate, form: form || (usernameCandidate && usernameCandidate.closest('form')), isUsernameFirst: false };
      } else {
        let target = activeTarget && activeTarget.type !== 'password' ? activeTarget : null;
        if (!target) {
          const emailOrUserInputs = visibleInputs.filter(i => {
            const attr = getAttrString(i);
            const auto = (i.getAttribute('autocomplete') || '').toLowerCase();
            return i.type === 'email' || auto === 'username' || auto === 'email' || attr.includes('user') || attr.includes('email') || attr.includes('login') || attr.includes('identifier') || attr.includes('account');
          });
          target = emailOrUserInputs[0] || visibleInputs[0] || null;
        }
        if (target) {
          return { usernameInput: target, passwordInput: null, targetInput: target, form: target.closest('form'), isUsernameFirst: true };
        }
      }
      return null;
    },
    observeDynamicForms(callback) {
      let timer = null;
      const observer = new MutationObserver((mutations) => {
        let relevant = false;
        for (const m of mutations) {
          if (m.addedNodes.length > 0) {
            for (const node of m.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE && (node.tagName === 'INPUT' || node.querySelector?.('input'))) {
                relevant = true; break;
              }
            }
          }
          if (relevant) break;
        }

        if (relevant) {
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => {
            const fields = window.XeroxFieldDetector.findLoginFields();
            if (fields && (fields.passwordInput || fields.usernameInput)) callback(fields);
          }, 150);
        }
      });
      if (document.body) observer.observe(document.body, { childList: true, subtree: true });
      return observer;
    }
  };
})();
`
  );

  contentFolder?.file(
    'autofill.js',
    `
(function () {
  window.XeroxAutofill = {
    getShadowRoot() {
      let container = document.getElementById('xerox-shadow-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'xerox-shadow-container';
        container.style.cssText = 'position: absolute; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647;';
        const shadowRoot = container.attachShadow({ mode: 'open' });
        (document.body || document.documentElement).appendChild(container);
      }
      return container.shadowRoot;
    },
    fillCredentials(usernameInput, passwordInput, credential) {
      if (!credential) return { usernameFilled: false, passwordFilled: false };
      let usernameFilled = false, passwordFilled = false;
      if (usernameInput && credential.username) usernameFilled = this.setInputValue(usernameInput, credential.username);
      if (passwordInput && credential.password) passwordFilled = this.setInputValue(passwordInput, credential.password);
      return { usernameFilled, passwordFilled };
    },
    setInputValue(inputElement, value) {
      if (!inputElement || typeof value !== 'string') return false;
      try {
        inputElement.focus();
        inputElement.click();
        const proto = Object.getPrototypeOf(inputElement);
        const descriptor = Object.getOwnPropertyDescriptor(proto, 'value') || Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
        if (descriptor && descriptor.set) descriptor.set.call(inputElement, value);
        else inputElement.value = value;

        inputElement.dispatchEvent(new Event('focus', { bubbles: true, composed: true }));
        inputElement.dispatchEvent(new Event('keydown', { bubbles: true, composed: true }));
        inputElement.dispatchEvent(new Event('keypress', { bubbles: true, composed: true }));
        try {
          inputElement.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: value }));
        } catch (e) {
          inputElement.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        }
        inputElement.dispatchEvent(new Event('keyup', { bubbles: true, composed: true }));
        inputElement.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        inputElement.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));
        return inputElement.value === value;
      } catch (e) {
        inputElement.value = value;
        return inputElement.value === value;
      }
    },
    makeDraggable(element) {
      let isDragging = false, startX = 0, startY = 0, initialLeft = 0, initialTop = 0;
      const onMouseDown = (e) => {
        if (e.target.closest('.xerox-autofill-btn')) return;
        isDragging = true; startX = e.clientX; startY = e.clientY;
        const rect = element.getBoundingClientRect(); initialLeft = rect.left; initialTop = rect.top;
        element.style.cursor = 'grabbing';
        document.addEventListener('mousemove', onMouseMove, true);
        document.addEventListener('mouseup', onMouseUp, true);
        e.preventDefault();
      };
      const onMouseMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX, dy = e.clientY - startY;
        element.style.left = Math.max(5, Math.min(window.innerWidth - element.offsetWidth - 5, initialLeft + dx)) + 'px';
        element.style.top = Math.max(5, Math.min(window.innerHeight - element.offsetHeight - 5, initialTop + dy)) + 'px';
      };
      const onMouseUp = () => {
        if (!isDragging) return; isDragging = false; element.style.cursor = 'grab';
        document.removeEventListener('mousemove', onMouseMove, true);
        document.removeEventListener('mouseup', onMouseUp, true);
      };
      element.addEventListener('mousedown', onMouseDown);
    },
    attachAutofillBadge(targetInput, onBadgeClick) {
      const shadow = this.getShadowRoot();
      let wrapper = shadow.getElementById('xerox-floating-badge');
      if (wrapper) {
        const btn = wrapper.querySelector('.xerox-autofill-btn');
        if (btn) {
          const newBtn = btn.cloneNode(true);
          btn.parentNode.replaceChild(newBtn, btn);
          newBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); onBadgeClick(); });
        }
        wrapper.style.display = 'flex';
        return;
      }
      wrapper = document.createElement('div');
      wrapper.id = 'xerox-floating-badge';
      wrapper.style.cssText = 'position:fixed;z-index:2147483647;cursor:grab;display:flex;align-items:center;gap:6px;background:#111827;border:1.5px solid #3b82f6;border-radius:8px;padding:4px 10px;font-family:system-ui,-apple-system,sans-serif;font-size:12px;color:#f3f4f6;box-shadow:0 10px 25px -5px rgba(0,0,0,0.6);user-select:none;';
      wrapper.innerHTML = \`<span style="font-size: 12px; opacity: 0.7; cursor: grab;">⋮⋮</span><span style="font-size: 13px;">🔐</span><span style="font-weight: 700; font-size: 11px; color: #60a5fa;">Lokker</span><button type="button" class="xerox-autofill-btn" style="background: #2563eb; color: #ffffff; border: none; border-radius: 5px; padding: 3px 8px; font-size: 11px; font-weight: 600; cursor: pointer;">Autofill</button>\`;

      const updatePosition = () => {
        if (!targetInput || !document.body.contains(targetInput)) { wrapper.style.display = 'none'; return; }
        const rect = targetInput.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) { wrapper.style.display = 'none'; return; }
        wrapper.style.display = 'flex';
        wrapper.style.left = Math.max(10, Math.min(window.innerWidth - 170, rect.right - 110)) + 'px';
        wrapper.style.top = Math.max(5, Math.min(window.innerHeight - 40, rect.top + rect.height / 2 - 15)) + 'px';
      };

      updatePosition();
      window.addEventListener('scroll', updatePosition, { passive: true });
      window.addEventListener('resize', updatePosition, { passive: true });
      shadow.appendChild(wrapper);
      this.makeDraggable(wrapper);
      wrapper.querySelector('.xerox-autofill-btn').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); onBadgeClick(); });
    },
    hideBadge() {
      const shadow = this.getShadowRoot();
      const badge = shadow.getElementById('xerox-floating-badge');
      if (badge) badge.style.display = 'none';
    }
  };
})();
`
  );

  contentFolder?.file(
    'content-script.js',
    `
(function () {
  let fields = null;

  const TRUSTED_XEROX_ORIGINS = [
    'https://xerox-orcin.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8089',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8089'
  ];

  function isTrustedXeroxOrigin() {
    const origin = (window.location.origin || '').toLowerCase();
    const host = (window.location.hostname || '').toLowerCase();
    if (TRUSTED_XEROX_ORIGINS.includes(origin)) return true;
    if (host === 'localhost' || host === '127.0.0.1') return true;
    return false;
  }

  function closeAllModals() {
    try {
      const shadow = window.XeroxAutofill.getShadowRoot();
      if (!shadow) return;
      ['xerox-inline-unlock-modal', 'xerox-account-picker', 'xerox-no-matches-modal', 'xerox-notice-modal'].forEach(id => {
        const modal = shadow.getElementById(id);
        if (modal) modal.remove();
      });
    } catch (e) {}
  }

  function handleFocusIn(e) {
    const target = e.composedPath()[0] || e.target;
    if (!target || target.tagName !== 'INPUT') return;
    const liveFields = window.XeroxFieldDetector.findLoginFields(target);
    if (liveFields && (liveFields.passwordInput || liveFields.usernameInput)) {
      fields = liveFields;
      if (target === liveFields.passwordInput || target === liveFields.usernameInput) {
        setupBadge(liveFields, target);
      }
    }
  }

  function initDetector() {
    window.XeroxFieldDetector.observeDynamicForms((newFields) => {
      fields = newFields;
      if (fields && (fields.passwordInput || fields.usernameInput)) setupBadge(fields);
    });
    const initialFields = window.XeroxFieldDetector.findLoginFields();
    if (initialFields && (initialFields.passwordInput || initialFields.usernameInput)) {
      fields = initialFields;
      setupBadge(initialFields);
    }
    document.addEventListener('focusin', handleFocusIn, true);
  }

  window.addEventListener('message', (event) => {
    if (!isTrustedXeroxOrigin()) return;
    if (event.origin && !isTrustedXeroxOrigin() && !event.origin.includes('localhost') && !event.origin.includes('127.0.0.1')) return;

    if (event.data && event.data.type === 'XEROX_SYNC_VAULT') {
      const { vaultMeta, encryptedVault } = event.data;
      if (vaultMeta || encryptedVault) {
        chrome.runtime.sendMessage({ action: 'SYNC_VAULT_FROM_WEBAPP', payload: { vaultMeta, encryptedVault } });
      }
    }
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'EXECUTE_AUTOFILL' && message.credential) {
      closeAllModals();
      const activeInput = document.activeElement && document.activeElement.tagName === 'INPUT' ? document.activeElement : null;
      const liveFields = window.XeroxFieldDetector.findLoginFields(activeInput) || fields;
      if (liveFields && (liveFields.usernameInput || liveFields.passwordInput)) {
        const res = window.XeroxAutofill.fillCredentials(liveFields.usernameInput, liveFields.passwordInput, message.credential);
        sendResponse({ success: true, details: res });
      } else {
        sendResponse({ success: false, error: 'No login fields found on page' });
      }
    }
    return true;
  });

  function setupBadge(loginFields, focusTarget) {
    const target = focusTarget || loginFields.passwordInput || loginFields.usernameInput || loginFields.targetInput;
    if (!target) return;
    window.XeroxAutofill.attachAutofillBadge(target, () => handleAutofillTrigger(loginFields));
  }

  function handleAutofillTrigger(loginFields) {
    const currentUrl = window.location.href;
    const activeInput = document.activeElement && document.activeElement.tagName === 'INPUT' ? document.activeElement : null;
    const liveFields = window.XeroxFieldDetector.findLoginFields(activeInput) || loginFields;

    chrome.runtime.sendMessage({ action: 'GET_MATCHING_CREDENTIALS', payload: { url: currentUrl } }, (response) => {
      if (!response) return;
      if (!response.isUnlocked) {
        showInlineUnlockModal((masterPassword, setError) => {
          chrome.runtime.sendMessage({ action: 'UNLOCK_VAULT', payload: { masterPassword } }, (unlockRes) => {
            if (unlockRes && unlockRes.success) {
              closeAllModals();
              handleAutofillTrigger(liveFields);
            } else setError(unlockRes?.error || 'Incorrect master password.');
          });
        });
        return;
      }
      const matches = response.matches || [];
      if (matches.length === 1) {
        authorizeAndFill(matches[0].id, liveFields);
      } else if (matches.length > 1) {
        showAccountPickerModal(matches, (selectedId, allowCrossDomain) => authorizeAndFill(selectedId, liveFields, allowCrossDomain));
      } else {
        showNoMatchesModal(currentUrl, liveFields);
      }
    });
  }

  function authorizeAndFill(credentialId, loginFields, allowCrossDomain = false) {
    chrome.runtime.sendMessage({ action: 'AUTHORIZE_AUTOFILL', payload: { id: credentialId, url: window.location.href, allowCrossDomain } }, (res) => {
      if (res && res.success && res.credential) {
        closeAllModals();
        const activeInput = document.activeElement && document.activeElement.tagName === 'INPUT' ? document.activeElement : null;
        const liveFields = window.XeroxFieldDetector.findLoginFields(activeInput) || loginFields;
        if (liveFields) window.XeroxAutofill.fillCredentials(liveFields.usernameInput, liveFields.passwordInput, res.credential);
      }
    });
  }

  function showNoMatchesModal(currentUrl, liveFields) {
    const shadow = window.XeroxAutofill.getShadowRoot();
    const existing = shadow.getElementById('xerox-no-matches-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'xerox-no-matches-modal';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.65);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;';
    overlay.innerHTML = \`<div style="background:#111827;border:1px solid #374151;border-radius:14px;padding:22px;width:340px;color:#f3f4f6;display:flex;flex-direction:column;gap:14px;"><div style="font-weight:700;color:#60a5fa;">🔐 No Matching Credential</div><div style="font-size:12px;color:#d1d5db;">No credential found for this domain.</div><button id="xerox-pick-all" style="background:#1f2937;border:1px solid #4b5563;color:#60a5fa;border-radius:8px;padding:9px;font-size:12px;cursor:pointer;">Choose another credential...</button><button id="xerox-cancel-no-match" style="background:#374151;border:none;color:#fff;border-radius:8px;padding:8px;font-size:12px;cursor:pointer;">Cancel</button></div>\`;
    shadow.appendChild(overlay);

    shadow.getElementById('xerox-cancel-no-match').onclick = () => overlay.remove();
    shadow.getElementById('xerox-pick-all').onclick = () => {
      overlay.remove();
      chrome.runtime.sendMessage({ action: 'GET_ALL_CREDENTIALS_SUMMARY' }, (allRes) => {
        const allItems = (allRes && allRes.credentials) || [];
        showAccountPickerModal(allItems, (selectedId) => authorizeAndFill(selectedId, liveFields, true), true);
      });
    };
  }

  function showInlineUnlockModal(onSubmit) {
    const shadow = window.XeroxAutofill.getShadowRoot();
    const existing = shadow.getElementById('xerox-inline-unlock-modal');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'xerox-inline-unlock-modal';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.65);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;';
    overlay.innerHTML = \`<div style="background:#111827;border:1px solid #374151;border-radius:14px;padding:22px;width:320px;color:#f3f4f6;display:flex;flex-direction:column;gap:14px;"><div style="font-weight:700;color:#60a5fa;">🔐 Unlock Vault</div><form id="xerox-unlock-form" style="display:flex;flex-direction:column;gap:10px;"><input type="password" id="xerox-pass-in" placeholder="Master Password" style="background:#1f2937;border:1px solid #4b5563;border-radius:8px;padding:10px;color:#fff;"><button type="submit" style="background:#2563eb;color:#fff;border:none;border-radius:8px;padding:10px;font-weight:600;">Unlock & Autofill</button></form></div>\`;
    shadow.appendChild(overlay);
    shadow.getElementById('xerox-unlock-form').onsubmit = (e) => {
      e.preventDefault();
      const pwd = shadow.getElementById('xerox-pass-in').value;
      if (pwd) onSubmit(pwd, () => {});
    };
  }

  function showAccountPickerModal(matches, onSelect, isAllFallback = false) {
    const shadow = window.XeroxAutofill.getShadowRoot();
    const existing = shadow.getElementById('xerox-account-picker');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'xerox-account-picker';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.65);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;';
    let html = \`<div style="background:#111827;border:1px solid #374151;border-radius:14px;padding:20px;width:340px;color:#f3f4f6;max-height:80vh;display:flex;flex-direction:column;"><div style="font-weight:700;color:#60a5fa;margin-bottom:10px;">🔐 Select Account</div><div style="display:flex;flex-direction:column;gap:8px;overflow-y:auto;">\`;
    matches.forEach(m => {
      html += \`<button class="xerox-picker-item" data-id="\${m.id}" style="background:#1f2937;border:1px solid #374151;border-radius:8px;padding:10px;text-align:left;color:#fff;cursor:pointer;"><div style="font-weight:600;">\${m.websiteName}</div><div style="font-size:11px;color:#9ca3af;">\${m.username}</div></button>\`;
    });
    html += '</div></div>';
    overlay.innerHTML = html;
    shadow.appendChild(overlay);
    overlay.querySelectorAll('.xerox-picker-item').forEach(b => {
      b.onclick = () => { overlay.remove(); onSelect(b.dataset.id, isAllFallback); };
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initDetector);
  else initDetector();
})();
`
  );

  // Vault modules
  const vaultFolder = zip.folder('vault');
  vaultFolder?.file(
    'credential-matcher.js',
    `
export function extractDomain(urlOrHostname) {
  if (!urlOrHostname) return '';
  try {
    let raw = urlOrHostname.trim().toLowerCase();
    if (raw.includes('://')) raw = new URL(raw).hostname;
    else if (raw.includes('/')) raw = raw.split('/')[0];
    return raw.split(':')[0].replace(/^www\./, '');
  } catch (e) {
    return urlOrHostname.trim().toLowerCase().split('/')[0].split(':')[0].replace(/^www\./, '');
  }
}

export function isSafeDomainMatch(pageUrl, credentialUrl) {
  if (!pageUrl || !credentialUrl) return false;
  const pageHost = extractDomain(pageUrl);
  const credHost = extractDomain(credentialUrl);
  if (!pageHost || !credHost) return false;
  if (pageHost === credHost) return true;
  if (pageHost.endsWith('.' + credHost)) return true;
  return false;
}

export function filterMatchingCredentials(pageUrl, credentials) {
  if (!pageUrl || !Array.isArray(credentials)) return [];
  return credentials.filter((item) => {
    const target = item.websiteUrl || item.url || item.websiteName;
    return isSafeDomainMatch(pageUrl, target);
  });
}
`
  );

  vaultFolder?.file(
    'secure-storage.js',
    `
const PBKDF2_ITERATIONS = 100000;
function base64ToArrayBuffer(base64) {
  if (!base64) return new ArrayBuffer(0);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
export async function deriveKeyGcm(masterPassword, saltUint8) {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey('raw', enc.encode(masterPassword), { name: 'PBKDF2' }, false, ['deriveKey']);
  return await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: saltUint8, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, passwordKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function decryptVault(cipherText, ivBase64, saltBase64, masterPassword) {
  if (!cipherText || !ivBase64 || !saltBase64) throw new Error('Incomplete vault payload.');
  const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));
  const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
  const rawCipher = cipherText.startsWith('cjs:') ? cipherText.slice(4) : cipherText;
  const cipherBuffer = base64ToArrayBuffer(rawCipher);
  const keyGcm = await deriveKeyGcm(masterPassword, salt);
  const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, keyGcm, cipherBuffer);
  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(decryptedBuffer));
}
`
  );

  // Popup
  const popupFolder = zip.folder('popup');
  popupFolder?.file(
    'popup.html',
    `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Lokker</title><link rel="stylesheet" href="popup.css"></head><body><div class="popup-container"><header class="popup-header"><div class="brand"><span class="logo-icon">🔐</span><span class="brand-title">Lokker</span></div><div id="status-badge" class="status-badge locked"><span id="status-text">Locked</span></div></header><main class="popup-main"><div id="unlock-section" class="view-section"><p class="section-desc">Enter Master Password to unlock local Lokker vault:</p><div class="input-group"><input type="password" id="master-password-input" placeholder="Master Password" autofocus /><button id="unlock-btn" class="btn btn-primary">Unlock Vault</button></div><p id="error-msg" class="error-msg"></p></div><div id="unlocked-section" class="view-section hidden"><div class="tab-domain-box"><span class="domain-label">Current Site:</span><span id="current-domain" class="domain-value">loading...</span></div><div id="credentials-container" class="credentials-list"></div><div id="no-matches" class="no-matches hidden"><p>No matching credentials found for this domain.</p></div></div></main><footer class="popup-footer"><button id="open-vault-btn" class="btn btn-ghost">Open Web Vault</button><button id="lock-btn" class="btn btn-ghost danger hidden">Lock Vault</button></footer></div><script type="module" src="popup.js"></script></body></html>`
  );

  popupFolder?.file(
    'popup.css',
    `body{width:320px;background:#0d0f17;color:#f1f5f9;font-family:system-ui,sans-serif;font-size:13px;margin:0;}
    .popup-container{display:flex;flex-direction:column;min-height:360px;}
    .popup-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#131622;border-bottom:1px solid #232738;}
    .brand-title{font-weight:700;font-size:15px;color:#fff;}
    .status-badge{padding:3px 8px;border-radius:12px;font-size:11px;font-weight:600;}
    .status-badge.locked{background:rgba(239,68,68,0.15);color:#f87171;}
    .status-badge.unlocked{background:rgba(16,185,129,0.15);color:#34d399;}
    .popup-main{flex:1;padding:16px;}
    .section-desc{color:#94a3b8;font-size:12px;margin-bottom:12px;}
    input[type="password"]{background:#181c2b;border:1px solid #2e354a;border-radius:8px;padding:9px 12px;color:#fff;width:100%;margin-bottom:10px;box-sizing:border-box;}
    .btn{border:none;border-radius:8px;padding:9px 14px;font-weight:600;cursor:pointer;width:100%;}
    .btn-primary{background:#3b82f6;color:#fff;}
    .btn-autofill{background:#10b981;color:#fff;margin-top:8px;}
    .btn-ghost{background:transparent;color:#94a3b8;margin-top:4px;}
    .tab-domain-box{background:#131622;border:1px solid #232738;border-radius:8px;padding:8px 12px;margin-bottom:12px;display:flex;justify-content:space-between;}
    .domain-value{color:#60a5fa;font-weight:600;font-family:monospace;}
    .credential-card{background:#181c2b;border:1px solid #2e354a;border-radius:8px;padding:12px;margin-bottom:8px;}
    .cred-title{font-weight:600;color:#fff;} .cred-user{color:#94a3b8;font-size:12px;}
    .error-msg{color:#f87171;font-size:11px;margin-top:6px;line-height:1.4;white-space:pre-wrap;}
    .hidden{display:none!important;}`
  );

  popupFolder?.file(
    'popup.js',
    `document.addEventListener('DOMContentLoaded', async () => {
      const statusBadge = document.getElementById('status-badge');
      const statusText = document.getElementById('status-text');
      const unlockSection = document.getElementById('unlock-section');
      const unlockedSection = document.getElementById('unlocked-section');
      const masterPasswordInput = document.getElementById('master-password-input');
      const unlockBtn = document.getElementById('unlock-btn');
      const lockBtn = document.getElementById('lock-btn');
      const openVaultBtn = document.getElementById('open-vault-btn');
      const errorMsg = document.getElementById('error-msg');
      const currentDomainEl = document.getElementById('current-domain');
      const credentialsContainer = document.getElementById('credentials-container');
      const noMatchesEl = document.getElementById('no-matches');

      let activeTab = null;
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        activeTab = tabs[0];
      } catch (e) {}
      const currentUrl = activeTab?.url || '';

      checkStatus();
      function checkStatus() {
        chrome.runtime.sendMessage({ action: 'GET_LOCK_STATUS' }, (res) => {
          if (res && res.isUnlocked) { setUnlockedUI(); loadMatchingCredentials(); }
          else { setLockedUI(); }
        });
      }
      function setLockedUI() {
        statusBadge.className = 'status-badge locked'; statusText.textContent = 'Locked';
        unlockSection.classList.remove('hidden'); unlockedSection.classList.add('hidden'); lockBtn.classList.add('hidden');
      }
      function setUnlockedUI() {
        statusBadge.className = 'status-badge unlocked'; statusText.textContent = 'Unlocked';
        unlockSection.classList.add('hidden'); unlockedSection.classList.remove('hidden'); lockBtn.classList.remove('hidden');
      }
      unlockBtn.addEventListener('click', () => {
        errorMsg.textContent = '';
        const pwd = masterPasswordInput.value.trim();
        if (!pwd) return;
        chrome.runtime.sendMessage({ action: 'UNLOCK_VAULT', payload: { masterPassword: pwd } }, (res) => {
          if (res && res.success) { setUnlockedUI(); loadMatchingCredentials(); }
          else { errorMsg.textContent = res?.error || 'Invalid master password'; }
        });
      });
      masterPasswordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') unlockBtn.click();
      });
      lockBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'LOCK_VAULT' }, () => setLockedUI());
      });
      openVaultBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://xerox-orcin.vercel.app' });
      });
      function loadMatchingCredentials() {
        currentDomainEl.textContent = 'Loading...'; credentialsContainer.innerHTML = ''; noMatchesEl.classList.add('hidden');
        chrome.runtime.sendMessage({ action: 'GET_MATCHING_CREDENTIALS', payload: { url: currentUrl } }, (res) => {
          if (!res || !res.isUnlocked) { setLockedUI(); return; }
          currentDomainEl.textContent = res.domain || 'Unknown';
          if (!res.matches || res.matches.length === 0) { noMatchesEl.classList.remove('hidden'); return; }
          res.matches.forEach((item) => {
            const card = document.createElement('div'); card.className = 'credential-card';
            card.innerHTML = \`<div class="cred-title">\${item.websiteName}</div><div class="cred-user">\${item.username}</div><button class="btn btn-autofill" data-id="\${item.id}">Autofill</button>\`;
            card.querySelector('.btn-autofill').addEventListener('click', () => {
              chrome.runtime.sendMessage({ action: 'AUTHORIZE_AUTOFILL', payload: { id: item.id, url: currentUrl } }, (fillRes) => {
                if (fillRes && fillRes.success) {
                  if (activeTab && activeTab.id) {
                    chrome.tabs.sendMessage(activeTab.id, { action: 'EXECUTE_AUTOFILL', credential: fillRes.credential }, async (res2) => {
                      if (chrome.runtime.lastError && (currentUrl.startsWith('http://') || currentUrl.startsWith('https://'))) {
                        await chrome.scripting.executeScript({ target: { tabId: activeTab.id }, files: ['content/field-detector.js', 'content/autofill.js', 'content/content-script.js'] });
                        chrome.tabs.sendMessage(activeTab.id, { action: 'EXECUTE_AUTOFILL', credential: fillRes.credential });
                      }
                    });
                  }
                  window.close();
                }
              });
            });
            credentialsContainer.appendChild(card);
          });
        });
      }
    });`
  );

  // Icon placeholders
  const iconsFolder = zip.folder('icons');
  const b64Icon = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  iconsFolder?.file('icon16.png', b64Icon, { base64: true });
  iconsFolder?.file('icon48.png', b64Icon, { base64: true });
  iconsFolder?.file('icon128.png', b64Icon, { base64: true });

  return await zip.generateAsync({ type: 'blob' });
}
