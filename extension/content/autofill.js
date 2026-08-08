/**
 * Xerox Real Browser Autofill Injector
 */

(function () {
  window.XeroxAutofill = {
    fillCredentials(usernameInput, passwordInput, credential) {
      if (!credential) return;

      if (usernameInput && credential.username) {
        this.setInputValue(usernameInput, credential.username);
      }

      if (passwordInput && credential.password) {
        this.setInputValue(passwordInput, credential.password);
      }
    },

    setInputValue(inputElement, value) {
      if (!inputElement) return;

      // React / Vue input value tracker workaround
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(inputElement, value);
      } else {
        inputElement.value = value;
      }

      // Dispatch native browser events so modern UI frameworks detect changes
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));
      inputElement.dispatchEvent(new Event('blur', { bubbles: true }));
    },

    attachAutofillBadge(targetInput, onBadgeClick) {
      if (targetInput.dataset.xeroxBadgeAttached === 'true') return;
      targetInput.dataset.xeroxBadgeAttached = 'true';

      const wrapper = document.createElement('div');
      wrapper.className = 'xerox-autofill-badge-wrapper';
      wrapper.style.cssText = `
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        z-index: 99999;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #181b26;
        border: 1px solid #2e344a;
        border-radius: 6px;
        padding: 4px 8px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 12px;
        color: #e2e8f0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        transition: all 0.2s ease;
      `;

      wrapper.innerHTML = `
        <span style="font-size: 13px; margin-right: 4px;">🔐</span>
        <span style="font-weight: 500; font-size: 11px;">Xerox</span>
      `;

      wrapper.addEventListener('mouseenter', () => {
        wrapper.style.borderColor = '#3b82f6';
        wrapper.style.background = '#222738';
      });

      wrapper.addEventListener('mouseleave', () => {
        wrapper.style.borderColor = '#2e344a';
        wrapper.style.background = '#181b26';
      });

      wrapper.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onBadgeClick();
      });

      // Ensure parent container is positioned
      const parent = targetInput.parentElement;
      if (parent) {
        const computedPos = window.getComputedStyle(parent).position;
        if (computedPos === 'static') {
          parent.style.position = 'relative';
        }
        parent.appendChild(wrapper);
      }
    }
  };
})();
