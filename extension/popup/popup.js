/**
 * Xerox Extension Popup Logic
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

  // Get current tab URL
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
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
    // Open Xerox Web Vault in new tab
    chrome.tabs.create({ url: 'http://localhost:3000' });
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
            <div class="cred-title">${item.websiteName}</div>
            <div class="cred-user">${item.username}</div>
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

  function triggerAutofillInTab(credentialId) {
    chrome.runtime.sendMessage(
      {
        action: 'AUTHORIZE_AUTOFILL',
        payload: { id: credentialId, url: currentUrl }
      },
      (res) => {
        if (res && res.success && res.credential) {
          // Direct script injection fill trigger
          chrome.tabs.sendMessage(activeTab.id, {
            action: 'EXECUTE_AUTOFILL',
            credential: res.credential
          });
          window.close(); // Close popup upon autofill
        } else {
          alert(res?.error || 'Autofill authorization failed.');
        }
      }
    );
  }
});
