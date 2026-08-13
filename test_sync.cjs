const { chromium } = require('playwright');

(async () => {
  const extensionPath = 'c:/Users/Arnav112/OneDrive/Desktop/google-ai-studio/xerox/extension';
  console.log('Loading extension from:', extensionPath);

  try {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    console.log('Context launched! Waiting for service worker...');
    let serviceWorker = context.serviceWorkers()[0];
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker');
    }
    console.log('Service Worker found! URL:', serviceWorker.url());

    const page = await context.newPage();
    page.on('console', msg => {
      const txt = msg.text();
      if (txt.includes('[Xerox') || txt.includes('App:')) {
        console.log(`[PAGE ${msg.type()}] ${txt}`);
      }
    });
    page.on('pageerror', err => {
      console.error('PAGE EXCEPTION:', err);
    });

    // Step 1: Navigate to web vault
    console.log('Opening web vault...');
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(2000);

    // Step 2: Set up vault via keyboard + click
    const inputs = page.locator('input[type="password"]');
    const count = await inputs.count();
    console.log(`Password inputs found: ${count}`);

    if (count >= 2) {
      // Initial vault setup - fill both fields and submit
      await inputs.nth(0).click();
      await inputs.nth(0).type('TestPassword123');
      await inputs.nth(1).click();
      await inputs.nth(1).type('TestPassword123');
      await page.keyboard.press('Enter');
      console.log('Submitted vault setup form.');
    } else if (count === 1) {
      await inputs.nth(0).click();
      await inputs.nth(0).type('TestPassword123');
      await page.keyboard.press('Enter');
      console.log('Submitted vault unlock form.');
    } else {
      console.log('No password inputs - vault might already be unlocked.');
    }

    // Step 3: Wait for vault encryption + sync
    await page.waitForTimeout(6000);

    // Step 4: Check localStorage
    const localStorageVault = await page.evaluate(() => {
      return localStorage.getItem('xerox_vault_meta_sync');
    });
    console.log('localStorage xerox_vault_meta_sync:', localStorageVault ? 'FOUND (length: ' + localStorageVault.length + ')' : 'NOT FOUND');

    // Step 5: Check chrome.storage.local
    const storageData = await serviceWorker.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.storage.local.get(['vaultMeta', 'encryptedVault', 'isUnlocked'], (res) => {
          resolve({
            hasVaultMeta: !!res.vaultMeta,
            hasEncryptedVault: !!res.encryptedVault,
            isUnlocked: res.isUnlocked,
          });
        });
      });
    });

    console.log('\n=== Extension chrome.storage.local status ===');
    console.log(JSON.stringify(storageData, null, 2));

    await context.close();
  } catch (err) {
    console.error('Failed:', err);
  }
})();
