const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');

(async () => {
  const extensionPath = path.resolve(__dirname, 'extension');
  console.log('===================================================');
  console.log('Xerox Extension Real Autofill Automated Verification');
  console.log('Extension path:', extensionPath);
  console.log('===================================================\n');

  // Start local HTTP server to serve test_autofill.html on http://localhost:8089
  const server = http.createServer((req, res) => {
    const filePath = path.join(__dirname, 'public', req.url === '/' ? 'test_autofill.html' : req.url);
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(filePath));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  await new Promise(resolve => server.listen(8089, resolve));
  console.log('[0/5] Local test HTTP server running at http://localhost:8089');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
    }
  }

  try {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    console.log('[1/5] Waiting for Service Worker registration...');
    let serviceWorker = context.serviceWorkers()[0];
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker');
    }
    assert(!!serviceWorker, 'Service worker active');
    console.log('      SW URL:', serviceWorker.url());

    // SEED TEST CREDENTIALS & UNLOCKED VAULT IN STORAGE
    console.log('\n[2/5] Seeding Vault Credentials in Extension Storage');
    const testCredentials = [
      {
        id: 'cred-001',
        websiteName: 'Localhost Test',
        websiteUrl: 'http://localhost:8089',
        username: 'testuser@xerox.local',
        password: 'SuperSecretPassword123!'
      },
      {
        id: 'cred-002',
        websiteName: 'GitHub',
        websiteUrl: 'https://github.com',
        username: 'octocat',
        password: 'GitHubPassword456!'
      }
    ];

    await serviceWorker.evaluate(async (creds) => {
      await chrome.storage.local.set({
        isUnlocked: true,
        vaultMeta: { isInitialized: true, salt: 'dGVzdHNhbHQ=' },
        encryptedVault: { cipherText: 'mock', iv: 'mock', salt: 'mock' }
      });
      if (chrome.storage.session) {
        await chrome.storage.session.set({
          decryptedVault: creds,
          isUnlocked: true,
          unlockedAt: Date.now(),
          autoLockMinutes: 15
        });
      }
    }, testCredentials);

    // TEST DOMAIN MATCHING RULES (VIA SW MESSAGE HANDLER)
    console.log('\n[3/5] Verification: Strict Domain Matching & Security Rules');
    const matchRes1 = await serviceWorker.evaluate(async () => {
      return new Promise(resolve => {
        chrome.runtime.onMessage.dispatch(
          { action: 'GET_MATCHING_CREDENTIALS', payload: { url: 'https://github.com/login' } },
          {},
          resolve
        );
      });
    });

    const matchResSub = await serviceWorker.evaluate(async () => {
      return new Promise(resolve => {
        chrome.runtime.onMessage.dispatch(
          { action: 'GET_MATCHING_CREDENTIALS', payload: { url: 'https://login.github.com/auth' } },
          {},
          resolve
        );
      });
    });

    const matchResAttacker1 = await serviceWorker.evaluate(async () => {
      return new Promise(resolve => {
        chrome.runtime.onMessage.dispatch(
          { action: 'GET_MATCHING_CREDENTIALS', payload: { url: 'https://github.com.attacker.com/login' } },
          {},
          resolve
        );
      });
    });

    const matchResAttacker2 = await serviceWorker.evaluate(async () => {
      return new Promise(resolve => {
        chrome.runtime.onMessage.dispatch(
          { action: 'GET_MATCHING_CREDENTIALS', payload: { url: 'https://attacker-github.com/login' } },
          {},
          resolve
        );
      });
    });

    assert(matchRes1 && matchRes1.matches.length === 1 && matchRes1.matches[0].id === 'cred-002', 'github.com matches github.com credential');
    assert(matchResSub && matchResSub.matches.length === 1 && matchResSub.matches[0].id === 'cred-002', 'login.github.com matches github.com credential');
    assert(matchResAttacker1 && matchResAttacker1.matches.length === 0, 'github.com.attacker.com REJECTED (0 matches)');
    assert(matchResAttacker2 && matchResAttacker2.matches.length === 0, 'attacker-github.com REJECTED (0 matches)');

    // OPEN TEST PAGE
    console.log('\n[4/5] Opening Test Page & Verifying Field Detection + Autofill');
    const page = await context.newPage();
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[XEROX') || text.includes('Autofill')) {
        console.log(`      [PAGE LOG] ${text}`);
      }
    });

    await page.goto('http://localhost:8089/test_autofill.html');
    await page.waitForTimeout(600);

    // Get tab ID from Playwright context
    const tabs = await context.pages();
    const testPage = tabs.find(p => p.url().includes('test_autofill.html'));

    // Test 1: Standard form autofill execution via SW -> Content Script messaging
    console.log('\n   Sub-test A: Autofill Standard Login Form');
    await testPage.focus('#std-user');

    const autofillMsgRes = await serviceWorker.evaluate(async (cred) => {
      const tabs = await chrome.tabs.query({ url: '*://localhost/*' });
      if (tabs.length === 0) return { success: false, error: 'No tab found' };
      return new Promise(resolve => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'EXECUTE_AUTOFILL',
          credential: cred
        }, resolve);
      });
    }, { username: testCredentials[0].username, password: testCredentials[0].password });

    assert(autofillMsgRes && autofillMsgRes.success === true, 'EXECUTE_AUTOFILL message sent to tab content script returned success');

    const stdUserVal = await testPage.$eval('#std-user', el => el.value);
    const stdPassVal = await testPage.$eval('#std-pass', el => el.value);

    assert(stdUserVal === testCredentials[0].username, `Standard username filled: "${stdUserVal}"`);
    assert(stdPassVal === testCredentials[0].password, `Standard password filled: "${stdPassVal}"`);

    // Test 2: React-controlled input state dispatching
    console.log('\n   Sub-test B: Autofill React-Controlled Inputs');
    await testPage.focus('#react-user');

    await serviceWorker.evaluate(async (cred) => {
      const tabs = await chrome.tabs.query({ url: '*://localhost/*' });
      return new Promise(resolve => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'EXECUTE_AUTOFILL',
          credential: cred
        }, resolve);
      });
    }, { username: 'react_dev_user', password: 'ReactSecretPassword99' });

    const reactStateText = await testPage.$eval('#react-user-state', el => el.textContent);
    const reactUserVal = await testPage.$eval('#react-user', el => el.value);

    assert(reactUserVal === 'react_dev_user', `React input value updated: "${reactUserVal}"`);
    assert(reactStateText.includes('react_dev_user'), `React state listener fired: "${reactStateText}"`);

    // Test 3: Dynamic modal form SPA insertion
    console.log('\n   Sub-test C: Dynamic Modal SPA Form');
    await testPage.click('#spawn-modal-btn');
    await testPage.waitForSelector('#dyn-user', { timeout: 2000 });
    await testPage.focus('#dyn-user');

    const dynAutofillRes = await serviceWorker.evaluate(async (cred) => {
      const tabs = await chrome.tabs.query({ url: '*://localhost/*' });
      return new Promise(resolve => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'EXECUTE_AUTOFILL',
          credential: cred
        }, resolve);
      });
    }, { username: 'modal_user', password: 'modal_password_77' });

    assert(dynAutofillRes && dynAutofillRes.success === true, 'Dynamic modal fields located and filled via message handler');

    const dynUserVal = await testPage.$eval('#dyn-user', el => el.value);
    const dynPassVal = await testPage.$eval('#dyn-pass', el => el.value);
    assert(dynUserVal === 'modal_user', `Dynamic modal username filled: "${dynUserVal}"`);
    assert(dynPassVal === 'modal_password_77', `Dynamic modal password filled: "${dynPassVal}"`);

    // SECURITY CHECK: ORIGIN AUTHORIZATION IN SERVICE WORKER
    console.log('\n[5/5] Verification: Origin Authorization Security Enforcer');
    const authSuccessMatch = await serviceWorker.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.runtime.onMessage.dispatch(
          { action: 'AUTHORIZE_AUTOFILL', payload: { id: 'cred-002', url: 'https://github.com/login' } },
          {},
          resolve
        );
      });
    });

    const authFailMismatch = await serviceWorker.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.runtime.onMessage.dispatch(
          { action: 'AUTHORIZE_AUTOFILL', payload: { id: 'cred-002', url: 'https://github.com.attacker.com/login' } },
          {},
          resolve
        );
      });
    });

    assert(authSuccessMatch && authSuccessMatch.success === true, 'AUTHORIZE_AUTOFILL accepted for valid matching origin (github.com)');
    assert(authFailMismatch && authFailMismatch.success === false, 'AUTHORIZE_AUTOFILL REJECTED for unauthorized attacker origin (github.com.attacker.com)');

    console.log('\n===================================================');
    console.log(`SUMMARY: ${passedTests} / ${totalTests} verification checks passed.`);
    console.log('===================================================');

    await context.close();
    server.close();
    process.exit(passedTests === totalTests ? 0 : 1);
  } catch (err) {
    console.error('\n❌ TEST RUNNER EXCEPTION:', err);
    server.close();
    process.exit(1);
  }
})();
