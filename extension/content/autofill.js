/**
 * Lokker Real Browser Autofill Injector
 * Handles Shadow DOM UI isolation, framework-compatible DOM input value setting,
 * full event dispatch, badge UI positioning and contextual dismissal.
 */

(function () {
  let isDismissedForCurrentContext = false;

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

      let usernameFilled = false;
      let passwordFilled = false;

      if (usernameInput && credential.username) {
        usernameFilled = this.setInputValue(usernameInput, credential.username);
      }
      if (passwordInput && credential.password) {
        passwordFilled = this.setInputValue(passwordInput, credential.password);
      }

      // Automatically hide badge after autofilling
      this.hideBadge();

      return { usernameFilled, passwordFilled };
    },

    setInputValue(inputElement, value) {
      if (!inputElement || typeof value !== 'string') return false;

      try {
        inputElement.focus();
        inputElement.click();

        const proto = Object.getPrototypeOf(inputElement);
        const descriptor =
          Object.getOwnPropertyDescriptor(proto, 'value') ||
          Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value') ||
          Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');

        if (descriptor && descriptor.set) {
          descriptor.set.call(inputElement, value);
        } else {
          inputElement.value = value;
        }

        // Dispatch comprehensive sequence of events simulating hardware interactions
        inputElement.dispatchEvent(new Event('focus', { bubbles: true, composed: true }));
        inputElement.dispatchEvent(new Event('keydown', { bubbles: true, composed: true }));
        inputElement.dispatchEvent(new Event('keypress', { bubbles: true, composed: true }));

        try {
          inputElement.dispatchEvent(
            new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: value })
          );
        } catch (e) {
          inputElement.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        }

        inputElement.dispatchEvent(new Event('keyup', { bubbles: true, composed: true }));
        inputElement.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        inputElement.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));

        // Verify value was retained
        return inputElement.value === value;
      } catch (e) {
        try {
          inputElement.value = value;
          return inputElement.value === value;
        } catch (e2) {
          return false;
        }
      }
    },

    makeDraggable(element) {
      let isDragging = false;
      let startX = 0, startY = 0;
      let initialLeft = 0, initialTop = 0;

      const onMouseDown = (e) => {
        if (e.target.closest('.xerox-autofill-btn') || e.target.closest('.xerox-dismiss-btn')) return;

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
      if (isDismissedForCurrentContext) return;

      const shadow = this.getShadowRoot();
      let wrapper = shadow.getElementById('xerox-floating-badge');

      if (wrapper) {
        const btn = wrapper.querySelector('.xerox-autofill-btn');
        if (btn) {
          const newBtn = btn.cloneNode(true);
          btn.parentNode.replaceChild(newBtn, btn);
          newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            onBadgeClick();
          });
        }

        const dismissBtn = wrapper.querySelector('.xerox-dismiss-btn');
        if (dismissBtn) {
          const newDismiss = dismissBtn.cloneNode(true);
          dismissBtn.parentNode.replaceChild(newDismiss, dismissBtn);
          newDismiss.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isDismissedForCurrentContext = true;
            wrapper.style.display = 'none';
          });
        }

        wrapper.style.display = 'flex';

        const updatePositionExisting = () => {
          if (!targetInput || !document.body.contains(targetInput) || isDismissedForCurrentContext) {
            wrapper.style.display = 'none';
            return;
          }
          const rect = targetInput.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) {
            wrapper.style.display = 'none';
            return;
          }
          wrapper.style.display = 'flex';
          const left = Math.max(10, Math.min(window.innerWidth - 180, rect.right - 120));
          const top = Math.max(5, Math.min(window.innerHeight - 40, rect.top + rect.height / 2 - 15));
          wrapper.style.left = left + 'px';
          wrapper.style.top = top + 'px';
        };

        updatePositionExisting();
        return;
      }

      wrapper = document.createElement('div');
      wrapper.id = 'xerox-floating-badge';
      wrapper.style.cssText = `
        position: fixed;
        z-index: 2147483647;
        cursor: grab;
        display: flex;
        align-items: center;
        gap: 5px;
        background: #111827;
        border: 1.5px solid #3b82f6;
        border-radius: 8px;
        padding: 4px 8px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 12px;
        color: #f3f4f6;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.6), 0 8px 10px -6px rgba(0,0,0,0.5);
        user-select: none;
        transition: border-color 0.2s, box-shadow 0.2s;
      `;

      wrapper.innerHTML = `
        <span style="font-size: 12px; opacity: 0.7; cursor: grab;" title="Drag to move">⋮⋮</span>
        <span style="font-size: 13px;">🔐</span>
        <span style="font-weight: 700; font-size: 11px; color: #60a5fa; letter-spacing: 0.3px;">Lokker</span>
        <button type="button" class="xerox-autofill-btn" style="background: #2563eb; color: #ffffff; border: none; border-radius: 5px; padding: 3px 8px; font-size: 11px; font-weight: 600; margin-left: 2px; cursor: pointer; transition: background 0.15s;">Autofill</button>
        <button type="button" class="xerox-dismiss-btn" aria-label="Dismiss Lokker autofill" style="background: transparent; color: #9ca3af; border: none; border-radius: 4px; padding: 2px 5px; font-size: 13px; font-weight: 700; margin-left: 1px; cursor: pointer; transition: color 0.15s;">✕</button>
      `;

      const updatePosition = () => {
        if (!targetInput || !document.body.contains(targetInput) || isDismissedForCurrentContext) {
          wrapper.style.display = 'none';
          return;
        }
        const rect = targetInput.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          wrapper.style.display = 'none';
          return;
        }
        wrapper.style.display = 'flex';
        const left = Math.max(10, Math.min(window.innerWidth - 180, rect.right - 120));
        const top = Math.max(5, Math.min(window.innerHeight - 40, rect.top + rect.height / 2 - 15));
        wrapper.style.left = left + 'px';
        wrapper.style.top = top + 'px';
      };

      updatePosition();
      window.addEventListener('scroll', updatePosition, { passive: true });
      window.addEventListener('resize', updatePosition, { passive: true });

      shadow.appendChild(wrapper);
      this.makeDraggable(wrapper);

      const btn = wrapper.querySelector('.xerox-autofill-btn');
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          onBadgeClick();
        });
      }

      const dismissBtn = wrapper.querySelector('.xerox-dismiss-btn');
      if (dismissBtn) {
        dismissBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          isDismissedForCurrentContext = true;
          wrapper.style.display = 'none';
        });
      }

      let dragMoved = false;
      wrapper.addEventListener('mousedown', () => { dragMoved = false; });
      wrapper.addEventListener('mousemove', () => { dragMoved = true; });
      wrapper.addEventListener('click', (e) => {
        if (e.target.closest('.xerox-autofill-btn') || e.target.closest('.xerox-dismiss-btn')) return;
        if (!dragMoved) {
          onBadgeClick();
        }
      });
    },

    hideBadge() {
      const container = document.getElementById('xerox-shadow-container');
      if (container && container.shadowRoot) {
        const badge = container.shadowRoot.getElementById('xerox-floating-badge');
        if (badge) {
          badge.style.display = 'none';
        }
      }
    }
  };
})();
