/**
 * Login field & form detection module
 * Advanced multi-signal field matching supporting target input context, shadow DOM, SPA modals, and username-first forms.
 */

(function () {
  window.XeroxFieldDetector = {
    findLoginFields(contextTarget) {
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

      function isVisible(el) {
        if (!el || !el.ownerDocument) return false;
        try {
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
          const rect = el.getBoundingClientRect();
          return rect.width > 0 || rect.height > 0 || el.offsetWidth > 0 || el.offsetHeight > 0;
        } catch (e) {
          return true;
        }
      }

      function getAttrString(input) {
        if (!input) return '';
        return (
          (input.name || '') + ' ' +
          (input.id || '') + ' ' +
          (input.getAttribute('autocomplete') || '') + ' ' +
          (input.placeholder || '') + ' ' +
          (input.getAttribute('aria-label') || '') + ' ' +
          (input.getAttribute('title') || '') + ' ' +
          (input.type || '')
        ).toLowerCase();
      }

      const activeTarget = contextTarget || (document.activeElement && document.activeElement.tagName === 'INPUT' ? document.activeElement : null);

      // Search root: if active target exists, scope to its form or container first
      let searchRoot = document;
      if (activeTarget) {
        searchRoot = activeTarget.closest('form') || activeTarget.closest('[role="dialog"]') || activeTarget.parentElement || document;
      }

      let allInputs = getInputsRecursive(searchRoot);
      if (allInputs.length === 0 && searchRoot !== document) {
        allInputs = getInputsRecursive(document);
      }

      const visibleInputs = allInputs.filter(isVisible);

      // Password input selection
      let passwordInputs = visibleInputs.filter(i => {
        const type = (i.type || '').toLowerCase();
        const auto = (i.getAttribute('autocomplete') || '').toLowerCase();
        return type === 'password' || auto === 'current-password' || auto === 'new-password';
      });

      let passwordInput = passwordInputs[0] || null;

      // If activeTarget itself is a password field
      if (activeTarget && activeTarget.type === 'password' && isVisible(activeTarget)) {
        passwordInput = activeTarget;
      }

      let usernameCandidate = null;

      if (passwordInput) {
        const form = passwordInput.closest('form');
        let candidates = [];
        if (form) {
          candidates = Array.from(form.querySelectorAll('input:not([type="password"]):not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])')).filter(isVisible);
        } else {
          candidates = visibleInputs.filter(i => i !== passwordInput && i.type !== 'password');
        }

        // If activeTarget is a non-password input, prioritize it as usernameCandidate
        if (activeTarget && activeTarget !== passwordInput && activeTarget.type !== 'password') {
          usernameCandidate = activeTarget;
        }

        if (!usernameCandidate) {
          usernameCandidate = candidates.find(i => {
            const auto = (i.getAttribute('autocomplete') || '').toLowerCase();
            return auto === 'username' || auto === 'email';
          });
        }

        if (!usernameCandidate) {
          const preceding = candidates.filter(i => (i.compareDocumentPosition(passwordInput) & Node.DOCUMENT_POSITION_PRECEDING) !== 0);
          usernameCandidate = preceding.slice().reverse().find(i => {
            const attr = getAttrString(i);
            return i.type === 'email' || attr.includes('user') || attr.includes('email') || attr.includes('login') || attr.includes('identifier') || attr.includes('account');
          }) || preceding[preceding.length - 1];
        }

        if (!usernameCandidate) {
          usernameCandidate = candidates.find(i => {
            const attr = getAttrString(i);
            return i.type === 'email' || attr.includes('user') || attr.includes('email') || attr.includes('login') || attr.includes('identifier') || attr.includes('account');
          }) || candidates[0] || null;
        }

        return {
          usernameInput: usernameCandidate,
          passwordInput: passwordInput,
          targetInput: activeTarget || passwordInput || usernameCandidate,
          form: form || passwordInput.closest('form') || (usernameCandidate && usernameCandidate.closest('form')),
          isUsernameFirst: false
        };
      } else {
        // Username-first flow: No visible password field in scope
        let target = activeTarget && activeTarget.type !== 'password' ? activeTarget : null;

        if (!target) {
          const emailOrUserInputs = visibleInputs.filter(i => {
            const attr = getAttrString(i);
            const auto = (i.getAttribute('autocomplete') || '').toLowerCase();
            return i.type === 'email' || auto === 'username' || auto === 'email' || attr.includes('user') || attr.includes('email') || attr.includes('login') || attr.includes('identifier') || attr.includes('account');
          });
          target = emailOrUserInputs[0] || visibleInputs[0] || null;
        }

        if (target) {
          return {
            usernameInput: target,
            passwordInput: null,
            targetInput: target,
            form: target.closest('form'),
            isUsernameFirst: true
          };
        }
      }

      return null;
    },

    observeDynamicForms(callback) {
      let timer = null;
      const observer = new MutationObserver((mutations) => {
        let relevant = false;
        for (const m of mutations) {
          if (m.addedNodes.length > 0) {
            for (const node of m.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName === 'INPUT' || node.querySelector?.('input')) {
                  relevant = true;
                  break;
                }
              }
            }
          }
          if (relevant) break;
        }

        if (relevant) {
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => {
            const fields = window.XeroxFieldDetector.findLoginFields();
            if (fields && (fields.passwordInput || fields.usernameInput)) {
              callback(fields);
            }
          }, 150);
        }
      });

      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
      }
      return observer;
    }
  };
})();
