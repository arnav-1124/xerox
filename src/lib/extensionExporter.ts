import JSZip from 'jszip';

export async function generateExtensionZip(): Promise<Blob> {
  const zip = new JSZip();

  // Manifest
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

  // Background
  const bgFolder = zip.folder('background');
  bgFolder?.file(
    'service-worker.js',
    `
import { extractDomain, isSafeDomainMatch, filterMatchingCredentials } from '../vault/credential-matcher.js';
import { decryptVault } from '../vault/secure-storage.js';

let activeDecryptedVault = null;
let autoLockTimer = null;
let autoLockMinutes = 15;

function resetAutoLock() {
  if (autoLockTimer) clearTimeout(autoLockTimer);
  if (autoLockMinutes > 0 && activeDecryptedVault) {
    autoLockTimer = setTimeout(() => {
      activeDecryptedVault = null;
      chrome.storage.local.set({ isUnlocked: false });
    }, autoLockMinutes * 60 * 1000);
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { action, payload } = request;

  if (action === 'GET_LOCK_STATUS') {
    sendResponse({ isUnlocked: !!activeDecryptedVault });
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
`
  );

  // Content
  const contentFolder = zip.folder('content');
  contentFolder?.file(
    'field-detector.js',
    `
(function () {
  window.XeroxFieldDetector = {
    findLoginFields() {
      const passwordInputs = Array.from(document.querySelectorAll('input[type="password"]'));
      if (passwordInputs.length === 0) return null;
      const visiblePassword = passwordInputs.find(input => {
        const style = window.getComputedStyle(input);
        return style.display !== 'none' && style.visibility !== 'hidden' && input.type === 'password';
      }) || passwordInputs[0];
      const form = visiblePassword.closest('form');
      let usernameInput = null;
      if (form) {
        const textInputs = Array.from(form.querySelectorAll('input[type="text"], input[type="email"], input[type="username"], input:not([type])'));
        usernameInput = textInputs.find(i => {
          const nameOrId = (i.name + ' ' + i.id + ' ' + i.autocomplete + ' ' + i.placeholder).toLowerCase();
          return nameOrId.includes('user') || nameOrId.includes('email') || nameOrId.includes('login') || nameOrId.includes('identifier');
        }) || textInputs[0];
      }
      if (!usernameInput) {
        const allTextInputs = Array.from(document.querySelectorAll('input[type="text"], input[type="email"], input[type="username"]'));
        usernameInput = allTextInputs.find(i => {
          const nameOrId = (i.name + ' ' + i.id + ' ' + i.autocomplete + ' ' + i.placeholder).toLowerCase();
          return nameOrId.includes('user') || nameOrId.includes('email') || nameOrId.includes('login');
        });
      }
      return { usernameInput, passwordInput: visiblePassword, form };
    },
    observeDynamicForms(callback) {
      const observer = new MutationObserver((mutations) => {
        let hasNewInputs = false;
        for (const mutation of mutations) {
          if (mutation.addedNodes.length) { hasNewInputs = true; break; }
        }
        if (hasNewInputs) {
          const fields = window.XeroxFieldDetector.findLoginFields();
          if (fields && fields.passwordInput) callback(fields);
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
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(inputElement, value);
      } else {
        inputElement.value = value;
      }
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));
      inputElement.dispatchEvent(new Event('blur', { bubbles: true }));
    },
    makeDraggable(element) {
      let isDragging = false;
      let startX, startY, initialLeft, initialTop;

      element.style.cursor = 'grab';
      
      const onMouseDown = (e) => {
        if (e.target.closest('.xerox-no-drag')) return;
        isDragging = true;
        element.style.cursor = 'grabbing';
        startX = e.clientX;
        startY = e.clientY;
        
        const rect = element.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        // Switch to fixed positioning for global viewport movement
        element.style.position = 'fixed';
        element.style.left = initialLeft + 'px';
        element.style.top = initialTop + 'px';
        element.style.right = 'auto';
        element.style.bottom = 'auto';
        element.style.transform = 'none';

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        e.preventDefault();
      };

      const onMouseMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        element.style.left = Math.max(10, Math.min(window.innerWidth - element.offsetWidth - 10, initialLeft + dx)) + 'px';
        element.style.top = Math.max(10, Math.min(window.innerHeight - element.offsetHeight - 10, initialTop + dy)) + 'px';
      };

      const onMouseUp = () => {
        isDragging = false;
        element.style.cursor = 'grab';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      element.addEventListener('mousedown', onMouseDown);
    },
    attachAutofillBadge(targetInput, onBadgeClick) {
      if (targetInput.dataset.xeroxBadgeAttached === 'true') return;
      targetInput.dataset.xeroxBadgeAttached = 'true';
      const wrapper = document.createElement('div');
      wrapper.className = 'xerox-autofill-badge-wrapper';
      wrapper.style.cssText = \`
        position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
        z-index: 999999; cursor: grab; display: flex; align-items: center; gap: 4px;
        background: #181b26; border: 1px solid #3b82f6; border-radius: 8px; padding: 4px 10px;
        font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #e2e8f0;
        box-shadow: 0 4px 16px rgba(0,0,0,0.6); transition: background 0.2s, border-color 0.2s;
        user-select: none;
      \`;
      wrapper.innerHTML = \`
        <span style="font-size: 13px; cursor: grabbing;" title="Drag to move">⋮⋮</span>
        <span style="font-size: 13px;">🔐</span>
        <span style="font-weight: 600; font-size: 11px; color: #60a5fa;">Xerox</span>
        <button class="xerox-no-drag" style="background: #2563eb; color: #fff; border: none; border-radius: 4px; padding: 2px 6px; font-size: 10px; font-weight: 600; margin-left: 4px; cursor: pointer;">Autofill</button>
      \`;
      
      this.makeDraggable(wrapper);

      const autofillBtn = wrapper.querySelector('button');
      if (autofillBtn) {
        autofillBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          onBadgeClick();
        });
      }

      wrapper.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onBadgeClick();
      });

      const parent = targetInput.parentElement;
      if (parent) {
        if (window.getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
        parent.appendChild(wrapper);
      }
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
  function initDetector() {
    fields = window.XeroxFieldDetector.findLoginFields();
    if (fields && fields.passwordInput) { setupBadge(fields); }
    else {
      window.XeroxFieldDetector.observeDynamicForms((newFields) => {
        fields = newFields;
        if (fields && fields.passwordInput) setupBadge(fields);
      });
    }
  }

  // Listen for messages from extension popup or background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'EXECUTE_AUTOFILL' && message.credential) {
      if (!fields) fields = window.XeroxFieldDetector.findLoginFields();
      if (fields) {
        window.XeroxAutofill.fillCredentials(fields.usernameInput, fields.passwordInput, message.credential);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'No login fields found on page' });
      }
    }
    return true;
  });

  function setupBadge(loginFields) {
    window.XeroxAutofill.attachAutofillBadge(loginFields.passwordInput, () => {
      handleAutofillTrigger(loginFields);
    });
  }

  function handleAutofillTrigger(loginFields) {
    const currentUrl = window.location.href;
    chrome.runtime.sendMessage({ action: 'GET_MATCHING_CREDENTIALS', payload: { url: currentUrl } }, (response) => {
      if (!response) { alert('Xerox Extension error: Background worker unresponsive.'); return; }
      if (!response.isUnlocked) { alert('🔐 Xerox Vault is locked. Click the Xerox extension icon to unlock.'); return; }
      if (!response.matches || response.matches.length === 0) { alert(\`No credentials found for "\${response.domain || currentUrl}".\`); return; }
      if (response.matches.length === 1) { authorizeAndFill(response.matches[0].id, loginFields); }
      else { showAccountPickerModal(response.matches, (selectedId) => authorizeAndFill(selectedId, loginFields)); }
    });
  }

  function authorizeAndFill(credentialId, loginFields) {
    chrome.runtime.sendMessage({ action: 'AUTHORIZE_AUTOFILL', payload: { id: credentialId, url: window.location.href } }, (res) => {
      if (res && res.success && res.credential) {
        window.XeroxAutofill.fillCredentials(loginFields.usernameInput, loginFields.passwordInput, res.credential);
      } else { alert(res?.error || 'Failed to authorize credential autofill.'); }
    });
  }

  function showAccountPickerModal(matches, onSelect) {
    const existing = document.getElementById('xerox-account-picker');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'xerox-account-picker';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);z-index:999999;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;';
    const box = document.createElement('div');
    box.style.cssText = 'background:#12141c;border:1px solid #2e344a;border-radius:12px;padding:20px;width:320px;color:#f8fafc;box-shadow:0 10px 25px rgba(0,0,0,0.8);';
    let html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><span style="font-weight:600;font-size:14px;">🔐 Select Xerox Account</span><button id="xerox-picker-close" style="background:none;border:none;color:#94a3b8;cursor:pointer;">✕</button></div><div style="font-size:12px;color:#94a3b8;margin-bottom:12px;">Select credential to fill:</div><div style="display:flex;flex-direction:column;gap:8px;">';
    matches.forEach(m => {
      html += \`<button class="xerox-picker-item" data-id="\${m.id}" style="background:#1c202e;border:1px solid #2e344a;border-radius:8px;padding:10px;text-align:left;color:#fff;cursor:pointer;font-size:13px;display:flex;flex-direction:column;"><span style="font-weight:600;">\${m.websiteName}</span><span style="font-size:11px;color:#94a3b8;">\${m.username}</span></button>\`;
    });
    html += '</div>';
    box.innerHTML = html;
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    document.getElementById('xerox-picker-close').onclick = () => overlay.remove();
    box.querySelectorAll('.xerox-picker-item').forEach(btn => {
      btn.onclick = () => { overlay.remove(); onSelect(btn.dataset.id); };
    });
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initDetector); }
  else { initDetector(); }
})();
`
  );

  // Vault
  const vaultFolder = zip.folder('vault');
  vaultFolder?.file(
    'credential-matcher.js',
    `
export function extractDomain(urlOrHostname) {
  if (!urlOrHostname) return '';
  try {
    let hostname = urlOrHostname;
    if (urlOrHostname.includes('://')) hostname = new URL(urlOrHostname).hostname;
    else if (urlOrHostname.includes('/')) hostname = urlOrHostname.split('/')[0];
    return hostname.split(':')[0].toLowerCase();
  } catch (e) { return ''; }
}
export function getRootDomain(hostname) {
  const cleanHost = extractDomain(hostname);
  if (!cleanHost) return '';
  const parts = cleanHost.split('.');
  if (parts.length <= 2) return cleanHost;
  return parts.slice(-2).join('.');
}
export function isSafeDomainMatch(pageUrl, credentialUrl) {
  const pageHost = extractDomain(pageUrl);
  const credHost = extractDomain(credentialUrl);
  if (!pageHost || !credHost) return false;
  if (pageHost === credHost) return true;
  const pageRoot = getRootDomain(pageHost);
  const credRoot = getRootDomain(credHost);
  if (pageRoot === credRoot && pageRoot.length > 3) {
    if (pageHost === credRoot || pageHost.endsWith('.' + credRoot)) {
      if (credHost === pageRoot || credHost.endsWith('.' + pageRoot)) return true;
    }
  }
  return false;
}
export function filterMatchingCredentials(pageUrl, credentials) {
  if (!pageUrl || !Array.isArray(credentials)) return [];
  return credentials.filter((item) => isSafeDomainMatch(pageUrl, item.websiteUrl || item.url));
}
`
  );

  vaultFolder?.file(
    'secure-storage.js',
    `
const PBKDF2_ITERATIONS = 100000;
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
export async function deriveKey(masterPassword, saltUint8) {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey('raw', enc.encode(masterPassword), { name: 'PBKDF2' }, false, ['deriveKey']);
  return await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: saltUint8, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, passwordKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function decryptVault(cipherText, ivBase64, saltBase64, masterPassword) {
  const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));
  const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
  const cipherBuffer = base64ToArrayBuffer(cipherText);
  const key = await deriveKey(masterPassword, salt);
  const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBuffer);
  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(decryptedBuffer));
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
          <div id="unlocked-section" class="view-section hidden"><div class="tab-domain-box"><span class="domain-label">Current Site:</span><span id="current-domain" class="domain-value">loading...</span></div><div id="credentials-container" class="credentials-list"></div><div id="no-matches" class="no-matches hidden"><p>No matching credentials found.</p></div></div>
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
    input[type="password"]{background:#181c2b;border:1px solid #2e354a;border-radius:8px;padding:9px 12px;color:#fff;width:100%;margin-bottom:10px;}
    .btn{border:none;border-radius:8px;padding:9px 14px;font-weight:600;cursor:pointer;width:100%;}
    .btn-primary{background:#3b82f6;color:#fff;}
    .btn-autofill{background:#10b981;color:#fff;margin-top:8px;}
    .btn-ghost{background:transparent;color:#94a3b8;margin-top:4px;}
    .tab-domain-box{background:#131622;border:1px solid #232738;border-radius:8px;padding:8px 12px;margin-bottom:12px;display:flex;justify-content:space-between;}
    .domain-value{color:#60a5fa;font-weight:600;font-family:monospace;}
    .credential-card{background:#181c2b;border:1px solid #2e354a;border-radius:8px;padding:12px;margin-bottom:8px;}
    .cred-title{font-weight:600;color:#fff;} .cred-user{color:#94a3b8;font-size:12px;}
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

      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
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
        const pwd = masterPasswordInput.value.trim();
        if (!pwd) return;
        chrome.runtime.sendMessage({ action: 'UNLOCK_VAULT', payload: { masterPassword: pwd } }, (res) => {
          if (res && res.success) { setUnlockedUI(); loadMatchingCredentials(); }
          else { errorMsg.textContent = res?.error || 'Invalid password'; }
        });
      });
      lockBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'LOCK_VAULT' }, () => setLockedUI());
      });
      openVaultBtn.addEventListener('click', () => { chrome.tabs.create({ url: 'http://localhost:3000' }); });
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
                  chrome.tabs.sendMessage(activeTab.id, { action: 'EXECUTE_AUTOFILL', credential: fillRes.credential });
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
