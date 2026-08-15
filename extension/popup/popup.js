/**
 * Xerox Extension Popup Logic
 * Controls vault lock/unlock status, displays domain matches, and manages popup -> content script autofill triggers.
 */

document.addEventListener('DOMContentLoaded', async () => {
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

  // Get current active tab
  let activeTab = null;
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    activeTab = tabs && tabs[0];
  } catch (e) {}

  const currentUrl = activeTab?.url || '';

  // Check initial lock status
  checkStatus();

  function checkStatus() {
    chrome.runtime.sendMessage({ action: 'GET_LOCK_STATUS' }, (res) => {
      if (res && res.isUnlocked) {
        setUnlockedUI();
        loadMatchingCredentials();
      } else {
        setLockedUI();
      }
    });
  }

  function setLockedUI() {
    statusBadge.className = 'status-badge locked';
    statusText.textContent = 'Locked';
    unlockSection.classList.remove('hidden');
    unlockedSection.classList.add('hidden');
    lockBtn.classList.add('hidden');
    errorMsg.textContent = '';
  }

  function setUnlockedUI() {
    statusBadge.className = 'status-badge unlocked';
    statusText.textContent = 'Unlocked';
    unlockSection.classList.add('hidden');
    unlockedSection.classList.remove('hidden');
    lockBtn.classList.remove('hidden');
  }

  unlockBtn.addEventListener('click', () => {
    const pwd = masterPasswordInput.value.trim();
    if (!pwd) {
      errorMsg.textContent = 'Please enter your Master Password.';
      return;
    }

    errorMsg.textContent = 'Unlocking...';

    chrome.runtime.sendMessage(
      { action: 'UNLOCK_VAULT', payload: { masterPassword: pwd } },
      (res) => {
        if (res && res.success) {
          masterPasswordInput.value = '';
          setUnlockedUI();
          loadMatchingCredentials();
        } else {
          errorMsg.textContent = res?.error || 'Invalid Master Password.';
        }
      }
    );
  });

  masterPasswordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') unlockBtn.click();
  });

  lockBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'LOCK_VAULT' }, () => {
      setLockedUI();
    });
  });

  openVaultBtn.addEventListener('click', () => {
    chrome.tabs.query({ url: ['*://localhost/*', '*://127.0.0.1/*', 'https://xerox-orcin.vercel.app/*'] }, (tabs) => {
      if (tabs && tabs.length > 0) {
        chrome.tabs.update(tabs[0].id, { active: true });
      } else {
        chrome.tabs.create({ url: 'https://xerox-orcin.vercel.app' });
      }
    });
  });

  function loadMatchingCredentials() {
    currentDomainEl.textContent = 'Loading...';
    credentialsContainer.innerHTML = '';
    noMatchesEl.classList.add('hidden');

    chrome.runtime.sendMessage(
      { action: 'GET_MATCHING_CREDENTIALS', payload: { url: currentUrl } },
      (res) => {
        if (!res || !res.isUnlocked) {
          setLockedUI();
          return;
        }

        currentDomainEl.textContent = res.domain || 'Unknown Domain';

        if (!res.matches || res.matches.length === 0) {
          noMatchesEl.classList.remove('hidden');
          return;
        }

        res.matches.forEach((item) => {
          const card = document.createElement('div');
          card.className = 'credential-card';
          card.innerHTML = `
            <div class="cred-title">${escapeHtml(item.websiteName)}</div>
            <div class="cred-user">${escapeHtml(item.username)}</div>
            <button class="btn btn-autofill" data-id="${item.id}">
              <span>⚡</span> Autofill Credentials
            </button>
          `;

          const btn = card.querySelector('.btn-autofill');
          btn.addEventListener('click', () => {
            triggerAutofillInTab(item.id);
          });

          credentialsContainer.appendChild(card);
        });
      }
    );
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function triggerAutofillInTab(credentialId) {
    if (!activeTab || !activeTab.id) {
      alert('Cannot trigger autofill: No active browser tab.');
      return;
    }

    chrome.runtime.sendMessage(
      {
        action: 'AUTHORIZE_AUTOFILL',
        payload: { id: credentialId, url: currentUrl }
      },
      (res) => {
        if (res && res.success && res.credential) {
          sendAutofillMessageToTab(activeTab.id, res.credential);
        } else {
          alert(res?.error || 'Autofill authorization failed.');
        }
      }
    );
  }

  function sendAutofillMessageToTab(tabId, credential) {
    chrome.tabs.sendMessage(
      tabId,
      { action: 'EXECUTE_AUTOFILL', credential },
      async (res) => {
        const lastErr = chrome.runtime.lastError;
        if (lastErr) {
          console.warn('[Xerox Popup] sendMessage failed, attempting scripting injection:', lastErr.message);
          
          if (currentUrl.startsWith('http://') || currentUrl.startsWith('https://') || currentUrl.startsWith('file://')) {
            try {
              await chrome.scripting.executeScript({
                target: { tabId },
                files: ['content/field-detector.js', 'content/autofill.js', 'content/content-script.js']
              });

              setTimeout(() => {
                chrome.tabs.sendMessage(tabId, { action: 'EXECUTE_AUTOFILL', credential }, (res2) => {
                  if (chrome.runtime.lastError || (res2 && !res2.success)) {
                    alert(res2?.error || 'Autofill could not locate login fields on target tab.');
                  } else {
                    window.close();
                  }
                });
              }, 100);
              return;
            } catch (e) {
              alert('Could not inject content script into target tab: ' + e.message);
              return;
            }
          } else {
            alert('Autofill is not supported on restricted browser pages (chrome:// or extension://).');
            return;
          }
        }

        if (res && res.success) {
          window.close();
        } else if (res && !res.success) {
          alert(res.error || 'Autofill could not locate login fields on target page.');
        } else {
          window.close();
        }
      }
    );
  }
});
