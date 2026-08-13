/**
 * Xerox Real Browser Autofill Injector
 */

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

        // Standard framework change triggers simulating physical hardware events
        inputElement.dispatchEvent(new Event('focus', { bubbles: true, composed: true }));
        try {
          inputElement.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: value }));
        } catch (e) {
          inputElement.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        }
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
        wrapper.style.display = 'flex';
        
        // Re-align to targetInput
        const rect = targetInput.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const left = Math.max(10, Math.min(window.innerWidth - 170, rect.right - 110));
          const top = Math.max(5, Math.min(window.innerHeight - 40, rect.top + (rect.height / 2) - 15));
          wrapper.style.left = left + 'px';
          wrapper.style.top = top + 'px';
        }
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
      `;

      wrapper.innerHTML = `
        <span style="font-size: 12px; opacity: 0.7; cursor: grab;" title="Drag to move">⋮⋮</span>
        <span style="font-size: 13px;">🔐</span>
        <span style="font-weight: 700; font-size: 11px; color: #60a5fa; letter-spacing: 0.3px;">Xerox</span>
        <button type="button" class="xerox-autofill-btn" style="background: #2563eb; color: #ffffff; border: none; border-radius: 5px; padding: 3px 8px; font-size: 11px; font-weight: 600; margin-left: 2px; cursor: pointer; transition: background 0.15s;">Autofill</button>
      `;

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

      let dragMoved = false;
      wrapper.addEventListener('mousedown', () => { dragMoved = false; });
      wrapper.addEventListener('mousemove', () => { dragMoved = true; });
      wrapper.addEventListener('click', (e) => {
        if (e.target.closest('.xerox-autofill-btn')) return;
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
