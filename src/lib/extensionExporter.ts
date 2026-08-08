import JSZip from 'jszip';

export async function generateExtensionZip(): Promise<Blob> {
  const zip = new JSZip();

  // Manifest V3
  zip.file(
    'manifest.json',
    JSON.stringify(
      {
        manifest_version: 3,
        name: 'Xerox - Local Password & Bookmark Manager',
        version: '1.0.0',
        description: 'Local-first privacy-focused password vault and bookmark manager with real browser autofill.',
        permissions: ['activeTab', 'storage', 'scripting'],
        host_permissions: ['<all_urls>'],
        background: {
          service_worker: 'background/service-worker.js',
        },
        content_scripts: [
          {
            matches: ['<all_urls>'],
            js: ['content/field-detector.js', 'content/autofill.js', 'content/content-script.js'],
            run_at: 'document_idle',
          },
        ],
        action: {
          default_popup: 'popup/popup.html',
          default_title: 'Xerox Password Manager',
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
import { extractDomain, isSafeDomainMatch, filterMatchingCredentials } from '../vault/credential-matcher.js';
import { decryptVault } from '../vault/secure-storage.js';

let activeDecryptedVault = null;
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
    }, autoLockMinutes * 60 * 1000);
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { action, payload } = request;

  if (action === 'GET_LOCK_STATUS') {
    getActiveVault().then((vault) => {
      sendResponse({ isUnlocked: !!vault });
    });
    return true;
  }

  if (action === 'UNLOCK_VAULT') {
    const { masterPassword } = payload;
    chrome.storage.local.get(['vaultMeta', 'encryptedVault'], async (res) => {
      try {
        const meta = res.vaultMeta;
        const vault = res.encryptedVault || (meta && meta.encryptedVault);
        if (!vault || !vault.cipherText) {
          sendResponse({
            success: false,
            error: 'Vault data not synced yet.\\n\\nPlease open your Xerox Web Vault tab once to sync your vault.'
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
`
  );

  // Content Scripts
  const contentFolder = zip.folder('content');
  contentFolder?.file(
    'field-detector.js',
    `
(function () {
  window.XeroxFieldDetector = {
    findLoginFields() {
      const allInputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="image"])'));
      const visibleInputs = allInputs.filter(i => {
        const style = window.getComputedStyle(i);
        const rect = i.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && (rect.width > 0 || i.offsetWidth > 0);
      });

      const passwordInputs = visibleInputs.filter(i => i.type === 'password');
      const visiblePassword = passwordInputs[0] || allInputs.find(i => i.type === 'password');

      let usernameInput = null;

      if (visiblePassword) {
        const form = visiblePassword.closest('form');
        let candidateInputs = [];
        if (form) {
          candidateInputs = Array.from(form.querySelectorAll('input:not([type="password"]):not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])'));
        } else {
          candidateInputs = visibleInputs.filter(i => i.type !== 'password');
        }

        const preceding = candidateInputs.filter(i => (i.compareDocumentPosition(visiblePassword) & Node.DOCUMENT_POSITION_PRECEDING) !== 0);

        usernameInput = preceding.reverse().find(i => {
          const attr = (i.name + ' ' + i.id + ' ' + (i.getAttribute('autocomplete')||'') + ' ' + (i.placeholder||'') + ' ' + (i.getAttribute('aria-label')||'')).toLowerCase();
          return attr.includes('user') || attr.includes('email') || attr.includes('login') || attr.includes('identifier') || attr.includes('account');
        }) || preceding[0] || candidateInputs.find(i => {
          const attr = (i.name + ' ' + i.id + ' ' + (i.getAttribute('autocomplete')||'') + ' ' + (i.placeholder||'') + ' ' + (i.getAttribute('aria-label')||'')).toLowerCase();
          return attr.includes('user') || attr.includes('email') || attr.includes('login') || attr.includes('identifier') || attr.includes('account');
        }) || candidateInputs[0];

        return { usernameInput, passwordInput: visiblePassword, targetInput: visiblePassword || usernameInput, form };
      } else {
        const emailInput = visibleInputs.find(i => {
          const attr = (i.name + ' ' + i.id + ' ' + i.type + ' ' + (i.getAttribute('autocomplete')||'') + ' ' + (i.placeholder||'') + ' ' + (i.getAttribute('aria-label')||'')).toLowerCase();
          return i.type === 'email' || attr.includes('user') || attr.includes('email') || attr.includes('login') || attr.includes('identifier') || attr.includes('account');
        });
        if (emailInput) {
          return { usernameInput: emailInput, passwordInput: null, targetInput: emailInput, form: emailInput.closest('form') };
        }
      }
      return null;
    },
    observeDynamicForms(callback) {
      const observer = new MutationObserver((mutations) => {
        let hasNewInputs = false;
        for (const mutation of mutations) {
          if (mutation.addedNodes.length) { hasNewInputs = true; break; }
        }
        if (hasNewInputs) {
          const fields = window.XeroxFieldDetector.findLoginFields();
          if (fields && (fields.passwordInput || fields.usernameInput)) callback(fields);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
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
    fillCredentials(usernameInput, passwordInput, credential) {
      if (!credential) return;
      if (usernameInput && credential.username) this.setInputValue(usernameInput, credential.username);
      if (passwordInput && credential.password) this.setInputValue(passwordInput, credential.password);
    },
    setInputValue(inputElement, value) {
      if (!inputElement) return;
      try {
        inputElement.focus();
        inputElement.click();

        const proto = Object.getPrototypeOf(inputElement);
        const descriptor = Object.getOwnPropertyDescriptor(proto, 'value') || Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
        if (descriptor && descriptor.set) {
          descriptor.set.call(inputElement, value);
        } else {
          inputElement.value = value;
        }

        inputElement.dispatchEvent(new Event('keydown', { bubbles: true, composed: true }));
        inputElement.dispatchEvent(new Event('keypress', { bubbles: true, composed: true }));
        inputElement.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        inputElement.dispatchEvent(new Event('keyup', { bubbles: true, composed: true }));
        inputElement.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        inputElement.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));
      } catch (e) {
        inputElement.value = value;
      }
    },
    makeDraggable(element) {
      let isDragging = false;
      let startX = 0, startY = 0;
      let initialLeft = 0, initialTop = 0;

      const onMouseDown = (e) => {
        if (e.target.closest('.xerox-autofill-btn')) return;

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        const rect = element.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        element.style.cursor = 'grabbing';
        element.style.borderColor = '#60a5fa';
        element.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.4), 0 10px 25px rgba(0,0,0,0.8)';

        document.addEventListener('mousemove', onMouseMove, true);
        document.addEventListener('mouseup', onMouseUp, true);
        e.preventDefault();
      };

      const onMouseMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        const newLeft = Math.max(5, Math.min(window.innerWidth - element.offsetWidth - 5, initialLeft + dx));
        const newTop = Math.max(5, Math.min(window.innerHeight - element.offsetHeight - 5, initialTop + dy));

        element.style.left = newLeft + 'px';
        element.style.top = newTop + 'px';
      };

      const onMouseUp = () => {
        if (!isDragging) return;
        isDragging = false;
        element.style.cursor = 'grab';
        element.style.borderColor = '#3b82f6';
        element.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.6)';

        document.removeEventListener('mousemove', onMouseMove, true);
        document.removeEventListener('mouseup', onMouseUp, true);
      };

      element.addEventListener('mousedown', onMouseDown);
    },
    attachAutofillBadge(targetInput, onBadgeClick) {
      if (document.getElementById('xerox-floating-badge')) return;
      if (!targetInput) return;

      const wrapper = document.createElement('div');
      wrapper.id = 'xerox-floating-badge';
      wrapper.style.cssText = \`
        position: fixed;
        z-index: 2147483647;
        cursor: grab;
        display: flex;
        align-items: center;
        gap: 6px;
        background: #111827;
        border: 1.5px solid #3b82f6;
        border-radius: 8px;
        padding: 4px 10px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 12px;
        color: #f3f4f6;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.6), 0 8px 10px -6px rgba(0,0,0,0.5);
        user-select: none;
        transition: border-color 0.2s, box-shadow 0.2s;
      \`;

      wrapper.innerHTML = \`
        <span style="font-size: 12px; opacity: 0.7; cursor: grab;" title="Drag to move">⋮⋮</span>
        <span style="font-size: 13px;">🔐</span>
        <span style="font-weight: 700; font-size: 11px; color: #60a5fa; letter-spacing: 0.3px;">Xerox</span>
        <button type="button" class="xerox-autofill-btn" style="background: #2563eb; color: #ffffff; border: none; border-radius: 5px; padding: 3px 8px; font-size: 11px; font-weight: 600; margin-left: 2px; cursor: pointer; transition: background 0.15s;">Autofill</button>
      \`;

      const updatePosition = () => {
        if (!targetInput || !document.body.contains(targetInput)) {
          wrapper.style.display = 'none';
          return;
        }
        const rect = targetInput.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          wrapper.style.display = 'none';
          return;
        }
        wrapper.style.display = 'flex';
        const left = Math.max(10, Math.min(window.innerWidth - 170, rect.right - 110));
        const top = Math.max(5, Math.min(window.innerHeight - 40, rect.top + (rect.height / 2) - 15));
        wrapper.style.left = left + 'px';
        wrapper.style.top = top + 'px';
      };

      updatePosition();
      window.addEventListener('scroll', updatePosition, { passive: true });
      window.addEventListener('resize', updatePosition, { passive: true });

      (document.body || document.documentElement).appendChild(wrapper);

      this.makeDraggable(wrapper);

      const btn = wrapper.querySelector('.xerox-autofill-btn');
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          onBadgeClick();
        });
      }

      let dragMoved = false;
      wrapper.addEventListener('mousedown', () => { dragMoved = false; });
      wrapper.addEventListener('mousemove', () => { dragMoved = true; });
      wrapper.addEventListener('click', (e) => {
        if (e.target.closest('.xerox-autofill-btn')) return;
        if (!dragMoved) {
          onBadgeClick();
        }
      });
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

  function checkAndSyncWebVault() {
    try {
      const rawMeta = localStorage.getItem('xerox_vault_meta_sync');
      if (rawMeta) {
        const meta = JSON.parse(rawMeta);
        if (meta && meta.encryptedVault) {
          chrome.runtime.sendMessage({
            action: 'SYNC_VAULT_FROM_WEBAPP',
            payload: { vaultMeta: meta, encryptedVault: meta.encryptedVault }
          });
        }
      }
    } catch (e) {}
  }

  function initDetector() {
    checkAndSyncWebVault();

    fields = window.XeroxFieldDetector.findLoginFields();
    if (fields && fields.targetInput) { setupBadge(fields); }
    else {
      window.XeroxFieldDetector.observeDynamicForms((newFields) => {
        fields = newFields;
        if (fields && fields.targetInput) setupBadge(fields);
      });
    }
  }

  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'XEROX_SYNC_VAULT') {
      const { vaultMeta, encryptedVault } = event.data;
      if (vaultMeta && encryptedVault) {
        chrome.runtime.sendMessage({
          action: 'SYNC_VAULT_FROM_WEBAPP',
          payload: { vaultMeta, encryptedVault }
        });
      }
    }
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'EXECUTE_AUTOFILL' && message.credential) {
      const liveFields = window.XeroxFieldDetector.findLoginFields() || fields;
      if (liveFields) {
        window.XeroxAutofill.fillCredentials(liveFields.usernameInput, liveFields.passwordInput, message.credential);
        showBriefToast('✓ Xerox Autofilled Credentials!');
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'No login fields found on page' });
      }
    }
    return true;
  });

  function setupBadge(loginFields) {
    const target = loginFields.passwordInput || loginFields.usernameInput || loginFields.targetInput;
    window.XeroxAutofill.attachAutofillBadge(target, () => {
      handleAutofillTrigger(loginFields);
    });
  }

  function handleAutofillTrigger(loginFields) {
    const currentUrl = window.location.href;
    const liveFields = window.XeroxFieldDetector.findLoginFields() || loginFields;

    chrome.runtime.sendMessage({ action: 'GET_MATCHING_CREDENTIALS', payload: { url: currentUrl } }, (response) => {
      if (!response) {
        showNoticeModal('Extension Error', 'Background service worker is unresponsive. Please reload the page.');
        return;
      }

      if (!response.isUnlocked) {
        showInlineUnlockModal((masterPassword, setError) => {
          chrome.runtime.sendMessage({ action: 'UNLOCK_VAULT', payload: { masterPassword } }, (unlockRes) => {
            if (unlockRes && unlockRes.success) {
              handleAutofillTrigger(liveFields);
            } else {
              setError(unlockRes?.error || 'Incorrect master password.');
            }
          });
        });
        return;
      }

      const matches = response.matches || [];

      if (matches.length === 1) {
        authorizeAndFill(matches[0].id, liveFields);
      } else if (matches.length > 1) {
        showAccountPickerModal(matches, (selectedId) => authorizeAndFill(selectedId, liveFields));
      } else {
        chrome.runtime.sendMessage({ action: 'GET_ALL_CREDENTIALS_SUMMARY' }, (allRes) => {
          const allItems = (allRes && allRes.credentials) || [];
          if (allItems.length === 0) {
            showNoticeModal('No Vault Credentials', 'No credentials found in your Xerox Vault.\\n\\nOpen your Xerox Web Vault tab to add credentials!');
          } else {
            showAccountPickerModal(allItems, (selectedId) => authorizeAndFill(selectedId, liveFields), true);
          }
        });
      }
    });
  }

  function authorizeAndFill(credentialId, loginFields) {
    chrome.runtime.sendMessage({ action: 'AUTHORIZE_AUTOFILL', payload: { id: credentialId, url: window.location.href } }, (res) => {
      if (res && res.success && res.credential) {
        const liveFields = window.XeroxFieldDetector.findLoginFields() || loginFields;
        window.XeroxAutofill.fillCredentials(liveFields.usernameInput, liveFields.passwordInput, res.credential);
        showBriefToast('✓ Xerox Autofilled Credentials!');
      } else {
        showNoticeModal('Autofill Error', res?.error || 'Failed to fill credential.');
      }
    });
  }

  function showInlineUnlockModal(onSubmit) {
    const existing = document.getElementById('xerox-inline-unlock-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'xerox-inline-unlock-modal';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.65);backdrop-filter:blur(6px);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;';

    const box = document.createElement('div');
    box.style.cssText = 'background:#111827;border:1px solid #374151;border-radius:14px;padding:22px;width:320px;color:#f3f4f6;box-shadow:0 20px 25px -5px rgba(0,0,0,0.7);display:flex;flex-direction:column;gap:14px;';

    box.innerHTML = \`
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:18px;">🔐</span>
          <span style="font-weight:700;font-size:14px;color:#60a5fa;">Unlock Xerox Vault</span>
        </div>
        <button id="xerox-unlock-close" style="background:none;border:none;color:#9ca3af;cursor:pointer;font-size:18px;">✕</button>
      </div>
      <div style="font-size:12px;color:#9ca3af;line-height:1.4;">Enter your Master Password to unlock your vault and autofill this form.</div>
      <form id="xerox-inline-unlock-form" style="display:flex;flex-direction:column;gap:10px;">
        <input type="password" id="xerox-inline-master-pass" placeholder="Master Password" style="width:100%;background:#1f2937;border:1px solid #4b5563;border-radius:8px;padding:10px;color:#fff;font-size:13px;outline:none;box-sizing:border-box;">
        <div id="xerox-inline-error" style="color:#f87171;font-size:11px;display:none;line-height:1.3;"></div>
        <button type="submit" style="width:100%;background:#2563eb;color:#fff;border:none;border-radius:8px;padding:10px;font-weight:600;font-size:13px;cursor:pointer;margin-top:4px;">Unlock & Autofill</button>
      </form>
    \`;

    overlay.appendChild(box);
    (document.body || document.documentElement).appendChild(overlay);

    const closeBtn = document.getElementById('xerox-unlock-close');
    if (closeBtn) closeBtn.onclick = () => overlay.remove();

    const form = document.getElementById('xerox-inline-unlock-form');
    const input = document.getElementById('xerox-inline-master-pass');
    const errDiv = document.getElementById('xerox-inline-error');

    setTimeout(() => input.focus(), 50);

    form.onsubmit = (e) => {
      e.preventDefault();
      const pwd = input.value;
      if (!pwd) return;
      errDiv.style.display = 'none';
      onSubmit(pwd, (errMsg) => {
        errDiv.textContent = errMsg;
        errDiv.style.display = 'block';
      });
      overlay.remove();
    };
  }

  function showAccountPickerModal(matches, onSelect, isAllFallback = false) {
    const existing = document.getElementById('xerox-account-picker');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'xerox-account-picker';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;';

    const box = document.createElement('div');
    box.style.cssText = 'background:#111827;border:1px solid #374151;border-radius:14px;padding:20px;width:340px;color:#f3f4f6;box-shadow:0 20px 25px -5px rgba(0,0,0,0.8);max-height:80vh;display:flex;flex-direction:column;';

    const titleText = isAllFallback ? 'Select Account to Autofill' : 'Matching Xerox Credentials';
    const subText = isAllFallback ? 'Pick any credential from your vault to autofill:' : 'Select account to autofill:';

    let html = \`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="font-weight:700;font-size:14px;color:#60a5fa;">🔐 \${titleText}</span>
        <button id="xerox-picker-close" style="background:none;border:none;color:#9ca3af;cursor:pointer;font-size:18px;">✕</button>
      </div>
      <div style="font-size:12px;color:#9ca3af;margin-bottom:10px;">\${subText}</div>
      <input type="text" id="xerox-picker-search" placeholder="Search accounts..." style="width:100%;background:#1f2937;border:1px solid #4b5563;border-radius:6px;padding:8px 10px;color:#fff;font-size:12px;outline:none;margin-bottom:10px;box-sizing:border-box;">
      <div id="xerox-picker-list" style="display:flex;flex-direction:column;gap:8px;overflow-y:auto;max-height:300px;padding-right:4px;">
    \`;

    matches.forEach(m => {
      html += \`
        <button class="xerox-picker-item" data-id="\${m.id}" data-search="\${(m.websiteName + ' ' + m.username + ' ' + (m.websiteUrl||'')).toLowerCase()}" style="background:#1f2937;border:1px solid #374151;border-radius:8px;padding:10px 12px;text-align:left;color:#fff;cursor:pointer;font-size:13px;display:flex;flex-direction:column;transition:background 0.15s, border-color 0.15s;">
          <span style="font-weight:600;color:#f3f4f6;">\${m.websiteName}</span>
          <span style="font-size:11px;color:#9ca3af;margin-top:2px;">\${m.username || 'No username'}</span>
        </button>
      \`;
    });

    html += '</div>';
    box.innerHTML = html;
    overlay.appendChild(box);
    (document.body || document.documentElement).appendChild(overlay);

    document.getElementById('xerox-picker-close').onclick = () => overlay.remove();

    const searchInput = document.getElementById('xerox-picker-search');
    const items = box.querySelectorAll('.xerox-picker-item');

    if (items.length > 5) { searchInput.focus(); }

    searchInput.oninput = () => {
      const query = searchInput.value.toLowerCase().trim();
      items.forEach(item => {
        const text = item.dataset.search || '';
        if (!query || text.includes(query)) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    };

    items.forEach(btn => {
      btn.onclick = () => {
        overlay.remove();
        onSelect(btn.dataset.id);
      };
    });
  }

  function showNoticeModal(title, message) {
    const existing = document.getElementById('xerox-notice-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'xerox-notice-modal';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;';

    const box = document.createElement('div');
    box.style.cssText = 'background:#111827;border:1px solid #374151;border-radius:12px;padding:20px;width:320px;color:#f3f4f6;box-shadow:0 10px 25px rgba(0,0,0,0.8);display:flex;flex-direction:column;gap:12px;';

    box.innerHTML = \`
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-weight:700;font-size:14px;color:#60a5fa;">🔐 \${title}</span>
        <button id="xerox-notice-close" style="background:none;border:none;color:#9ca3af;cursor:pointer;font-size:16px;">✕</button>
      </div>
      <div style="font-size:12px;color:#d1d5db;white-space:pre-wrap;line-height:1.5;">\${message}</div>
      <button id="xerox-notice-ok" style="background:#2563eb;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-size:12px;font-weight:600;cursor:pointer;align-self:flex-end;">OK</button>
    \`;

    overlay.appendChild(box);
    (document.body || document.documentElement).appendChild(overlay);

    document.getElementById('xerox-notice-close').onclick = () => overlay.remove();
    document.getElementById('xerox-notice-ok').onclick = () => overlay.remove();
  }

  function showBriefToast(text) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1e293b;border:1.5px solid #3b82f6;color:#38bdf8;padding:10px 16px;border-radius:8px;font-family:system-ui,-apple-system,sans-serif;font-size:13px;font-weight:600;z-index:2147483647;box-shadow:0 10px 25px rgba(0,0,0,0.7);transition:opacity 0.3s;';
    toast.textContent = text;
    (document.body || document.documentElement).appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2200);
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initDetector); }
  else { initDetector(); }
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

export function getRootDomain(hostname) {
  const cleanHost = extractDomain(hostname);
  if (!cleanHost) return '';
  const parts = cleanHost.split('.');
  if (parts.length <= 2) return cleanHost;
  return parts.slice(-2).join('.');
}

function cleanString(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function isSafeDomainMatch(pageUrl, credentialUrl) {
  if (!pageUrl) return false;
  const pageHost = extractDomain(pageUrl);
  const pageRoot = getRootDomain(pageHost);

  if (!credentialUrl) return false;
  const credHost = extractDomain(credentialUrl);
  const credRoot = getRootDomain(credHost);

  if (pageHost && credHost && pageHost === credHost) return true;
  if (pageRoot && credRoot && pageRoot === credRoot && pageRoot.length > 2) return true;
  if (pageRoot && credHost && (credHost.includes(pageRoot) || pageHost.includes(credHost))) return true;

  const cleanPage = cleanString(pageHost);
  const cleanCred = cleanString(credentialUrl);
  if (cleanPage && cleanCred && cleanCred.length >= 3) {
    if (cleanPage.includes(cleanCred) || cleanCred.includes(cleanPage)) return true;
  }

  return false;
}

export function filterMatchingCredentials(pageUrl, credentials) {
  if (!pageUrl || !Array.isArray(credentials)) return [];
  return credentials.filter((item) => {
    const target = item.websiteUrl || item.url || item.websiteName || item.title;
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

export async function deriveKeyCbc(masterPassword, saltUint8) {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey('raw', enc.encode(masterPassword), { name: 'PBKDF2' }, false, ['deriveKey']);
  return await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: saltUint8, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, passwordKey, { name: 'AES-CBC', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function decryptVault(cipherText, ivBase64, saltBase64, masterPassword) {
  if (!cipherText || !ivBase64 || !saltBase64) {
    throw new Error('Incomplete vault payload. Please open Xerox Web Vault tab to sync.');
  }

  const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));
  const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
  const rawCipher = cipherText.startsWith('cjs:') ? cipherText.slice(4) : cipherText;
  const cipherBuffer = base64ToArrayBuffer(rawCipher);

  let lastError = null;

  // Try 1: WebCrypto AES-GCM
  try {
    const keyGcm = await deriveKeyGcm(masterPassword, salt);
    const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, keyGcm, cipherBuffer);
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decryptedBuffer));
  } catch (e1) {
    lastError = e1;
  }

  // Try 2: WebCrypto AES-CBC
  try {
    const keyCbc = await deriveKeyCbc(masterPassword, salt);
    const decryptedCbc = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, keyCbc, cipherBuffer);
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decryptedCbc));
  } catch (e2) {
    lastError = e2;
  }

  throw new Error('Incorrect master password or corrupted vault.');
}
`
  );

  // Popup
  const popupFolder = zip.folder('popup');
  popupFolder?.file(
    'popup.html',
    `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Xerox</title><link rel="stylesheet" href="popup.css"></head><body>
      <div class="popup-container">
        <header class="popup-header"><div class="brand"><span class="logo-icon">🔐</span><span class="brand-title">Xerox</span></div><div id="status-badge" class="status-badge locked"><span id="status-text">Locked</span></div></header>
        <main class="popup-main">
          <div id="unlock-section" class="view-section"><p class="section-desc">Enter Master Password to unlock local Xerox vault:</p><div class="input-group"><input type="password" id="master-password-input" placeholder="Master Password" autofocus /><button id="unlock-btn" class="btn btn-primary">Unlock Vault</button></div><p id="error-msg" class="error-msg"></p></div>
          <div id="unlocked-section" class="view-section hidden"><div class="tab-domain-box"><span class="domain-label">Current Site:</span><span id="current-domain" class="domain-value">loading...</span></div><div id="credentials-container" class="credentials-list"></div><div id="no-matches" class="no-matches hidden"><p>No matching credentials found for this domain.</p></div></div>
        </main>
        <footer class="popup-footer"><button id="open-vault-btn" class="btn btn-ghost">Open Web Vault</button><button id="lock-btn" class="btn btn-ghost danger hidden">Lock Vault</button></footer>
      </div>
      <script type="module" src="popup.js"></script>
    </body></html>`
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
        chrome.tabs.create({ url: 'https://ais-pre-x7uavyhknkd65sr2vtb34y-890638532946.asia-southeast1.run.app' });
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
                    chrome.tabs.sendMessage(activeTab.id, { action: 'EXECUTE_AUTOFILL', credential: fillRes.credential });
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
