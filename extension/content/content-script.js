(function () {
  let fields = null;

  function checkAndSyncWebVault() {
    try {
      const rawMeta = localStorage.getItem('xerox_vault_meta_sync');
      console.log('[Xerox CS] checkAndSyncWebVault: localStorage key found =', !!rawMeta);
      if (rawMeta) {
        const meta = JSON.parse(rawMeta);
        if (meta && meta.encryptedVault) {
          console.log('[Xerox CS] Syncing vault from localStorage to background...');
          chrome.runtime.sendMessage({
            action: 'SYNC_VAULT_FROM_WEBAPP',
            payload: { vaultMeta: meta, encryptedVault: meta.encryptedVault }
          }, (res) => {
            console.log('[Xerox CS] SYNC_VAULT_FROM_WEBAPP response:', res);
            if (chrome.runtime.lastError) {
              console.error('[Xerox CS] sendMessage error:', chrome.runtime.lastError.message);
            }
          });
        }
      }
    } catch (e) {
      console.error('[Xerox CS] checkAndSyncWebVault error:', e);
    }
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
    console.log('[Xerox CS] window.message received, type:', event.data && event.data.type);
    if (event.data && event.data.type === 'XEROX_SYNC_VAULT') {
      const { vaultMeta, encryptedVault } = event.data;
      console.log('[Xerox CS] XEROX_SYNC_VAULT received, has vault:', !!encryptedVault);
      if (vaultMeta && encryptedVault) {
        chrome.runtime.sendMessage({
          action: 'SYNC_VAULT_FROM_WEBAPP',
          payload: { vaultMeta, encryptedVault }
        }, (res) => {
          console.log('[Xerox CS] SYNC_VAULT_FROM_WEBAPP (postMsg) response:', res);
          if (chrome.runtime.lastError) {
            console.error('[Xerox CS] sendMessage error:', chrome.runtime.lastError.message);
          }
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
            showNoticeModal('No Vault Credentials', 'No credentials found in your Xerox Vault.\n\nOpen your Xerox Web Vault tab to add credentials!');
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

    box.innerHTML = `
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
    `;

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

    let html = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="font-weight:700;font-size:14px;color:#60a5fa;">🔐 ${titleText}</span>
        <button id="xerox-picker-close" style="background:none;border:none;color:#9ca3af;cursor:pointer;font-size:18px;">✕</button>
      </div>
      <div style="font-size:12px;color:#9ca3af;margin-bottom:10px;">${subText}</div>
      <input type="text" id="xerox-picker-search" placeholder="Search accounts..." style="width:100%;background:#1f2937;border:1px solid #4b5563;border-radius:6px;padding:8px 10px;color:#fff;font-size:12px;outline:none;margin-bottom:10px;box-sizing:border-box;">
      <div id="xerox-picker-list" style="display:flex;flex-direction:column;gap:8px;overflow-y:auto;max-height:300px;padding-right:4px;">
    `;

    matches.forEach(m => {
      html += `
        <button class="xerox-picker-item" data-id="${m.id}" data-search="${(m.websiteName + ' ' + m.username + ' ' + (m.websiteUrl||'')).toLowerCase()}" style="background:#1f2937;border:1px solid #374151;border-radius:8px;padding:10px 12px;text-align:left;color:#fff;cursor:pointer;font-size:13px;display:flex;flex-direction:column;transition:background 0.15s, border-color 0.15s;">
          <span style="font-weight:600;color:#f3f4f6;">${m.websiteName}</span>
          <span style="font-size:11px;color:#9ca3af;margin-top:2px;">${m.username || 'No username'}</span>
        </button>
      `;
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

    box.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-weight:700;font-size:14px;color:#60a5fa;">🔐 ${title}</span>
        <button id="xerox-notice-close" style="background:none;border:none;color:#9ca3af;cursor:pointer;font-size:16px;">✕</button>
      </div>
      <div style="font-size:12px;color:#d1d5db;white-space:pre-wrap;line-height:1.5;">${message}</div>
      <button id="xerox-notice-ok" style="background:#2563eb;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-size:12px;font-weight:600;cursor:pointer;align-self:flex-end;">OK</button>
    `;

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
