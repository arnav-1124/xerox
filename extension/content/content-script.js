/**
 * Xerox Content Script Orchestrator
 */

(function () {
  let fields = null;

  function initDetector() {
    fields = window.XeroxFieldDetector.findLoginFields();

    if (fields && fields.passwordInput) {
      setupBadge(fields);
    } else {
      window.XeroxFieldDetector.observeDynamicForms((newFields) => {
        fields = newFields;
        if (fields && fields.passwordInput) {
          setupBadge(fields);
        }
      });
    }
  }

  function setupBadge(loginFields) {
    window.XeroxAutofill.attachAutofillBadge(loginFields.passwordInput, () => {
      handleAutofillTrigger(loginFields);
    });
  }

  function handleAutofillTrigger(loginFields) {
    const currentUrl = window.location.href;

    chrome.runtime.sendMessage(
      { action: 'GET_MATCHING_CREDENTIALS', payload: { url: currentUrl } },
      (response) => {
        if (!response) {
          alert('Xerox Extension error: Background worker unresponsive.');
          return;
        }

        if (!response.isUnlocked) {
          alert('🔐 Xerox Vault is locked. Click the Xerox extension icon in your browser toolbar to unlock.');
          return;
        }

        if (!response.matches || response.matches.length === 0) {
          alert(`No credentials found in Xerox vault matching domain "${response.domain || currentUrl}".`);
          return;
        }

        if (response.matches.length === 1) {
          // Authorize single match
          authorizeAndFill(response.matches[0].id, loginFields);
        } else {
          // Present modal selection for multiple matching accounts
          showAccountPickerModal(response.matches, (selectedId) => {
            authorizeAndFill(selectedId, loginFields);
          });
        }
      }
    );
  }

  function authorizeAndFill(credentialId, loginFields) {
    chrome.runtime.sendMessage(
      {
        action: 'AUTHORIZE_AUTOFILL',
        payload: { id: credentialId, url: window.location.href }
      },
      (res) => {
        if (res && res.success && res.credential) {
          window.XeroxAutofill.fillCredentials(
            loginFields.usernameInput,
            loginFields.passwordInput,
            res.credential
          );
        } else {
          alert(res?.error || 'Failed to authorize credential autofill.');
        }
      }
    );
  }

  function showAccountPickerModal(matches, onSelect) {
    const existing = document.getElementById('xerox-account-picker');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'xerox-account-picker';
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
      background: #12141c;
      border: 1px solid #2e344a;
      border-radius: 12px;
      padding: 20px;
      width: 320px;
      color: #f8fafc;
      box-shadow: 0 10px 25px rgba(0,0,0,0.8);
    `;

    let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <span style="font-weight:600; font-size:14px;">🔐 Select Xerox Account</span>
        <button id="xerox-picker-close" style="background:none; border:none; color:#94a3b8; font-size:16px; cursor:pointer;">✕</button>
      </div>
      <div style="font-size:12px; color:#94a3b8; margin-bottom:12px;">Multiple credentials found for this site:</div>
      <div style="display:flex; flex-direction:column; gap:8px;">
    `;

    matches.forEach(m => {
      html += `
        <button class="xerox-picker-item" data-id="${m.id}" style="
          background:#1c202e; border:1px solid #2e344a; border-radius:8px; padding:10px;
          text-align:left; color:#fff; cursor:pointer; font-size:13px; display:flex; flex-direction:column; gap:2px;
        ">
          <span style="font-weight:600; color:#e2e8f0;">${m.websiteName}</span>
          <span style="font-size:11px; color:#94a3b8;">${m.username}</span>
        </button>
      `;
    });

    html += `</div>`;
    box.innerHTML = html;
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    document.getElementById('xerox-picker-close').onclick = () => overlay.remove();

    box.querySelectorAll('.xerox-picker-item').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        overlay.remove();
        onSelect(id);
      };
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDetector);
  } else {
    initDetector();
  }
})();
