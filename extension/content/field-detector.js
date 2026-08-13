/**
 * Login field & form detection module
 */

(function () {
  window.XeroxFieldDetector = {
    findLoginFields() {
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
            if (el.shadowRoot) {
              inputs.push(...getInputsRecursive(el.shadowRoot));
            }
          }
        } catch (e) {}
        return inputs;
      }

      const allInputs = getInputsRecursive(document);
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
