/**
 * Login field & form detection module
 */

(function () {
  window.XeroxFieldDetector = {
    findLoginFields() {
      const passwordInputs = Array.from(document.querySelectorAll('input[type="password"]'));
      if (passwordInputs.length === 0) {
        return null;
      }

      // Find the primary visible password input
      const visiblePassword = passwordInputs.find(input => {
        const style = window.getComputedStyle(input);
        return style.display !== 'none' && style.visibility !== 'hidden' && input.type === 'password';
      }) || passwordInputs[0];

      // Find associated username/email input
      const form = visiblePassword.closest('form');
      let usernameInput = null;

      if (form) {
        const textInputs = Array.from(
          form.querySelectorAll('input[type="text"], input[type="email"], input[type="username"], input:not([type])')
        );

        usernameInput = textInputs.find(i => {
          const nameOrId = (i.name + ' ' + i.id + ' ' + i.autocomplete + ' ' + i.placeholder).toLowerCase();
          return nameOrId.includes('user') || nameOrId.includes('email') || nameOrId.includes('login') || nameOrId.includes('identifier');
        }) || textInputs[0];
      }

      if (!usernameInput) {
        // Look outside form in nearby elements
        const allTextInputs = Array.from(
          document.querySelectorAll('input[type="text"], input[type="email"], input[type="username"]')
        );
        usernameInput = allTextInputs.find(i => {
          const nameOrId = (i.name + ' ' + i.id + ' ' + i.autocomplete + ' ' + i.placeholder).toLowerCase();
          return nameOrId.includes('user') || nameOrId.includes('email') || nameOrId.includes('login');
        });
      }

      return {
        usernameInput,
        passwordInput: visiblePassword,
        form
      };
    },

    observeDynamicForms(callback) {
      const observer = new MutationObserver((mutations) => {
        let hasNewInputs = false;
        for (const mutation of mutations) {
          if (mutation.addedNodes.length) {
            hasNewInputs = true;
            break;
          }
        }
        if (hasNewInputs) {
          const fields = window.XeroxFieldDetector.findLoginFields();
          if (fields && fields.passwordInput) {
            callback(fields);
          }
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      return observer;
    }
  };
})();
