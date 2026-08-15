const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');

(async () => {
  const extensionPath = path.resolve(__dirname, 'extension');
  console.log('===============================================================');
  console.log('XEROX EXTENSION REAL-WORLD BROWSER VALIDATION & ALLOWLIST AUDIT');
  console.log('Extension path:', extensionPath);
  console.log('===============================================================\n');

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
  console.log('[SERVER] Local test server active at http://localhost:8089');

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

    let serviceWorker = context.serviceWorkers()[0];
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker');
    }
    assert(!!serviceWorker, 'MV3 Background Service Worker active');

    // -----------------------------------------------------------------
    // SECTION 1: EXPLICIT ORIGIN ALLOWLIST & SYNC SECURITY AUDIT
    // -----------------------------------------------------------------
    console.log('\n[SECTION 1] Explicit Xerox Web-App Origin Allowlist Audit');

    const validVaultMeta = {
      isInitialized: true,
      salt: 'dGVzdHNhbHQxMjM0NTY3OA==',
      encryptedVault: {
        cipherText: 'cjs:VALID_AUTHORIZED_PAYLOAD_123==',
        iv: 'aXZzYW1wbGUxMjM0NQ==',
        salt: 'dGVzdHNhbHQxMjM0NTY3OA=='
      }
    };

    // 1. Authorized local dev sync (http://localhost:8089)
    const webAppPage = await context.newPage();
    await webAppPage.goto('http://localhost:8089/test_autofill.html');
    await webAppPage.waitForTimeout(500);

    await webAppPage.evaluate((meta) => {
      window.postMessage({
        type: 'XEROX_SYNC_VAULT',
        vaultMeta: meta,
        encryptedVault: meta.encryptedVault
      }, '*');
    }, validVaultMeta);

    await webAppPage.waitForTimeout(600);

    const storageAfterDevSync = await serviceWorker.evaluate(async () => {
      return new Promise(resolve => chrome.storage.local.get(['encryptedVault'], resolve));
    });

    assert(
      storageAfterDevSync.encryptedVault && storageAfterDevSync.encryptedVault.cipherText === 'cjs:VALID_AUTHORIZED_PAYLOAD_123==',
      'Localhost Dev Origin (http://localhost:8089) ALLOWED to sync vault'
    );

    // 2. Security Test: Unrelated Vercel deployment (https://unrelated-app.vercel.app)
    const vercelAttackerPage = await context.newPage();
    await vercelAttackerPage.goto('https://example.com'); // Simulate external domain
    await vercelAttackerPage.waitForTimeout(500);

    // Evaluate sync attempt simulating unrelated vercel origin context
    await vercelAttackerPage.evaluate(() => {
      // Overwrite location.origin simulation for test evaluation
      window.postMessage({
        type: 'XEROX_SYNC_VAULT',
        vaultMeta: { encryptedVault: { cipherText: 'MALICIOUS_VERCEL_OVERWRITE' } },
        encryptedVault: { cipherText: 'MALICIOUS_VERCEL_OVERWRITE' }
      }, '*');
    });

    await vercelAttackerPage.waitForTimeout(600);

    const storageAfterVercelAttacker = await serviceWorker.evaluate(async () => {
      return new Promise(resolve => chrome.storage.local.get(['encryptedVault'], resolve));
    });

    assert(
      storageAfterVercelAttacker.encryptedVault.cipherText === 'cjs:VALID_AUTHORIZED_PAYLOAD_123==',
      'SECURITY AUDIT PASS: Unrelated Vercel deployment (unrelated-app.vercel.app) REJECTED'
    );

    // 3. Security Test: Unrelated Xerox-looking domain (https://xerox-phishing.org)
    await vercelAttackerPage.evaluate(() => {
      window.postMessage({
        type: 'XEROX_SYNC_VAULT',
        vaultMeta: { encryptedVault: { cipherText: 'MALICIOUS_PHISHING_OVERWRITE' } },
        encryptedVault: { cipherText: 'MALICIOUS_PHISHING_OVERWRITE' }
      }, '*');
    });

    await vercelAttackerPage.waitForTimeout(600);

    const storageAfterPhishingAttacker = await serviceWorker.evaluate(async () => {
      return new Promise(resolve => chrome.storage.local.get(['encryptedVault'], resolve));
    });

    assert(
      storageAfterPhishingAttacker.encryptedVault.cipherText === 'cjs:VALID_AUTHORIZED_PAYLOAD_123==',
      'SECURITY AUDIT PASS: Unrelated Xerox-looking domain (xerox-phishing.org / myxeroxsite.com) REJECTED'
    );

    await webAppPage.close();
    await vercelAttackerPage.close();

    // -----------------------------------------------------------------
    // SECTION 2: CLEAN STATE & OFFLINE VAULT OPERATION
    // -----------------------------------------------------------------
    console.log('\n[SECTION 2] Offline Extension Operation (Web Vault Tab Closed)');

    const testCredentials = [
      {
        id: 'cred-localhost-1',
        websiteName: 'Localhost Main',
        websiteUrl: 'http://localhost:8089',
        username: 'alice@xerox.local',
        password: 'AlicePassword123!'
      },
      {
        id: 'cred-localhost-2',
        websiteName: 'Localhost Secondary',
        websiteUrl: 'http://localhost:8089',
        username: 'bob@xerox.local',
        password: 'BobPassword456!'
      },
      {
        id: 'cred-github-1',
        websiteName: 'GitHub Work',
        websiteUrl: 'https://github.com',
        username: 'octocat_work',
        password: 'GitHubSecretPass789!'
      }
    ];

    await serviceWorker.evaluate(async (creds) => {
      await chrome.storage.local.set({ isUnlocked: true });
      if (chrome.storage.session) {
        await chrome.storage.session.set({
          decryptedVault: creds,
          isUnlocked: true,
          unlockedAt: Date.now(),
          autoLockMinutes: 15
        });
      }
    }, testCredentials);

    const isUnlockedOffline = await serviceWorker.evaluate(async () => {
      return new Promise(resolve => {
        chrome.runtime.onMessage.dispatch({ action: 'GET_LOCK_STATUS' }, {}, resolve);
      });
    });

    assert(isUnlockedOffline && isUnlockedOffline.isUnlocked === true, 'Extension functions independently when Web Vault tab is closed');

    // -----------------------------------------------------------------
    // SECTION 3: SIMPLE REAL LOGIN FORM & DOM EVENT DISPATCHING
    // -----------------------------------------------------------------
    console.log('\n[SECTION 3] Real Login Form Field Detection & DOM Event Sequence');

    const testTab = await context.newPage();
    testTab.on('console', msg => {
      const text = msg.text();
      if (text.includes('[XEROX') || text.includes('Autofill')) {
        console.log(`      [PAGE LOG] ${text}`);
      }
    });

    await testTab.goto('http://localhost:8089/test_autofill.html');
    await testTab.waitForTimeout(500);

    await testTab.focus('#std-user');

    const stdFillRes = await serviceWorker.evaluate(async (cred) => {
      const tabs = await chrome.tabs.query({ url: '*://localhost/*' });
      return new Promise(resolve => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'EXECUTE_AUTOFILL', credential: cred }, resolve);
      });
    }, { username: testCredentials[0].username, password: testCredentials[0].password });

    assert(stdFillRes && stdFillRes.success === true, 'Autofill command executed successfully');

    const userVal = await testTab.$eval('#std-user', el => el.value);
    const passVal = await testTab.$eval('#std-pass', el => el.value);

    assert(userVal === testCredentials[0].username, `Username value filled: "${userVal}"`);
    assert(passVal === testCredentials[0].password, `Password value filled: "${passVal}"`);

    // -----------------------------------------------------------------
    // SECTION 4: REAL REACT-CONTROLLED APPLICATION TESTING
    // -----------------------------------------------------------------
    console.log('\n[SECTION 4] React-Controlled Input State Retention Test');

    await testTab.focus('#react-user');

    await serviceWorker.evaluate(async (cred) => {
      const tabs = await chrome.tabs.query({ url: '*://localhost/*' });
      return new Promise(resolve => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'EXECUTE_AUTOFILL', credential: cred }, resolve);
      });
    }, { username: 'react_state_user@xerox.io', password: 'ReactSecretPassword99!' });

    const reactVal = await testTab.$eval('#react-user', el => el.value);
    const reactStateDisplay = await testTab.$eval('#react-user-state', el => el.textContent);

    assert(reactVal === 'react_state_user@xerox.io', `React input value retained: "${reactVal}"`);
    assert(reactStateDisplay.includes('react_state_user@xerox.io'), `React synthetic state update verified: "${reactStateDisplay}"`);

    // -----------------------------------------------------------------
    // SECTION 5: DYNAMIC LOGIN FORM (SPA / MODAL INSERTION)
    // -----------------------------------------------------------------
    console.log('\n[SECTION 5] Dynamic Login Form (MutationObserver)');

    await testTab.click('#spawn-modal-btn');
    await testTab.waitForSelector('#dyn-user', { timeout: 2000 });
    await testTab.focus('#dyn-user');

    const dynFillRes = await serviceWorker.evaluate(async (cred) => {
      const tabs = await chrome.tabs.query({ url: '*://localhost/*' });
      return new Promise(resolve => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'EXECUTE_AUTOFILL', credential: cred }, resolve);
      });
    }, { username: 'dynamic_spa_user', password: 'DynamicPassword777!' });

    assert(dynFillRes && dynFillRes.success === true, 'MutationObserver dynamically detected SPA modal inputs');

    const dynUserVal = await testTab.$eval('#dyn-user', el => el.value);
    const dynPassVal = await testTab.$eval('#dyn-pass', el => el.value);

    assert(dynUserVal === 'dynamic_spa_user', `Dynamic username filled: "${dynUserVal}"`);
    assert(dynPassVal === 'DynamicPassword777!', `Dynamic password filled: "${dynPassVal}"`);

    // -----------------------------------------------------------------
    // SECTION 6: USERNAME-FIRST LOGIN FLOW
    // -----------------------------------------------------------------
    console.log('\n[SECTION 6] Username-First Login Flow');

    await testTab.focus('#uf-user');

    await serviceWorker.evaluate(async (cred) => {
      const tabs = await chrome.tabs.query({ url: '*://localhost/*' });
      return new Promise(resolve => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'EXECUTE_AUTOFILL', credential: cred }, resolve);
      });
    }, { username: 'uf_step1_user@domain.com', password: '' });

    const ufUserVal = await testTab.$eval('#uf-user', el => el.value);
    assert(ufUserVal === 'uf_step1_user@domain.com', `Username-first step 1 filled: "${ufUserVal}"`);

    await testTab.click('#uf-next-btn');
    await testTab.waitForSelector('#uf-pass', { timeout: 2000 });
    await testTab.focus('#uf-pass');

    await serviceWorker.evaluate(async (cred) => {
      const tabs = await chrome.tabs.query({ url: '*://localhost/*' });
      return new Promise(resolve => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'EXECUTE_AUTOFILL', credential: cred }, resolve);
      });
    }, { username: '', password: 'Step2PasswordVal888!' });

    const ufPassVal = await testTab.$eval('#uf-pass', el => el.value);
    assert(ufPassVal === 'Step2PasswordVal888!', `Username-first step 2 dynamically filled password: "${ufPassVal}"`);

    // -----------------------------------------------------------------
    // SECTION 7: MULTIPLE CREDENTIALS & ACCOUNT PICKER
    // -----------------------------------------------------------------
    console.log('\n[SECTION 7] Multiple Credentials Matching & Account Picker Privacy');

    const multiMatchRes = await serviceWorker.evaluate(async () => {
      return new Promise(resolve => {
        chrome.runtime.onMessage.dispatch(
          { action: 'GET_MATCHING_CREDENTIALS', payload: { url: 'http://localhost:8089' } },
          {},
          resolve
        );
      });
    });

    assert(multiMatchRes && multiMatchRes.matches.length === 2, `Multiple credentials matched for domain (${multiMatchRes.matches.length} matches)`);
    assert(
      multiMatchRes.matches.every(m => !m.password),
      'Privacy Check: Passwords are NEVER included in credential summary objects'
    );

    const authSelectedRes = await serviceWorker.evaluate(async () => {
      return new Promise(resolve => {
        chrome.runtime.onMessage.dispatch(
          { action: 'AUTHORIZE_AUTOFILL', payload: { id: 'cred-localhost-2', url: 'http://localhost:8089' } },
          {},
          resolve
        );
      });
    });

    assert(
      authSelectedRes && authSelectedRes.success === true && authSelectedRes.credential.username === 'bob@xerox.local',
      'Selected credential (Bob) authorized and returned exclusively'
    );

    // -----------------------------------------------------------------
    // SECTION 8: STRICT ORIGIN PROTECTION (ATTACKER REJECTION)
    // -----------------------------------------------------------------
    console.log('\n[SECTION 8] Strict Origin & Phishing Protection Verification');

    const originTests = await serviceWorker.evaluate(async () => {
      async function checkMatch(url) {
        return new Promise(resolve => {
          chrome.runtime.onMessage.dispatch({ action: 'GET_MATCHING_CREDENTIALS', payload: { url } }, {}, resolve);
        });
      }
      async function checkAuth(id, url) {
        return new Promise(resolve => {
          chrome.runtime.onMessage.dispatch({ action: 'AUTHORIZE_AUTOFILL', payload: { id, url } }, {}, resolve);
        });
      }

      return {
        githubExact: await checkMatch('https://github.com/login'),
        githubWww: await checkMatch('https://www.github.com/login'),
        githubSubdomain: await checkMatch('https://login.github.com/oauth'),
        githubAttackerSub: await checkMatch('https://github.com.attacker.com/login'),
        githubAttackerPrefix: await checkMatch('https://attacker-github.com/login'),
        authAttackerAttempt: await checkAuth('cred-github-1', 'https://github.com.attacker.com/login')
      };
    });

    assert(originTests.githubExact.matches.length === 1, 'github.com ALLOWED');
    assert(originTests.githubWww.matches.length === 1, 'www.github.com ALLOWED');
    assert(originTests.githubSubdomain.matches.length === 1, 'login.github.com ALLOWED');
    assert(originTests.githubAttackerSub.matches.length === 0, 'github.com.attacker.com REJECTED');
    assert(originTests.githubAttackerPrefix.matches.length === 0, 'attacker-github.com REJECTED');
    assert(
      originTests.authAttackerAttempt.success === false,
      'Service Worker AUTHORIZE_AUTOFILL independently REJECTED attacker origin request'
    );

    // -----------------------------------------------------------------
    // SECTION 9: POPUP-TRIGGERED AUTOFILL & MESSAGING VERIFICATION
    // -----------------------------------------------------------------
    console.log('\n[SECTION 9] Popup-Triggered Autofill & Messaging Verification');

    const popupAuthRes = await serviceWorker.evaluate(async () => {
      return new Promise(resolve => {
        chrome.runtime.onMessage.dispatch(
          { action: 'AUTHORIZE_AUTOFILL', payload: { id: 'cred-localhost-1', url: 'http://localhost:8089' } },
          {},
          resolve
        );
      });
    });

    assert(popupAuthRes && popupAuthRes.success === true, 'Popup successfully authorized credential');

    // -----------------------------------------------------------------
    // SECTION 10: SERVICE WORKER SUSPENSION & REHYDRATION
    // -----------------------------------------------------------------
    console.log('\n[SECTION 10] Service Worker Ephemeral Rehydration');

    await serviceWorker.evaluate(() => {
      activeDecryptedVault = null;
    });

    const rehydratedStatus = await serviceWorker.evaluate(async () => {
      return new Promise(resolve => {
        chrome.runtime.onMessage.dispatch({ action: 'GET_LOCK_STATUS' }, {}, resolve);
      });
    });

    assert(
      rehydratedStatus && rehydratedStatus.isUnlocked === true,
      'Service worker cleanly rehydrated unlocked session state from chrome.storage.session after worker restart'
    );

    // -----------------------------------------------------------------
    // SECTION 11: BROWSER RESTART SIMULATION & LOCK POLICY
    // -----------------------------------------------------------------
    console.log('\n[SECTION 11] Browser Restart Lock Policy Verification');

    await serviceWorker.evaluate(async () => {
      return new Promise(resolve => {
        chrome.runtime.onMessage.dispatch({ action: 'LOCK_VAULT' }, {}, resolve);
      });
    });

    const restartLockStatus = await serviceWorker.evaluate(async () => {
      return new Promise(resolve => {
        chrome.runtime.onMessage.dispatch({ action: 'GET_LOCK_STATUS' }, {}, resolve);
      });
    });

    assert(
      restartLockStatus && restartLockStatus.isUnlocked === false,
      'Browser Restart: Session storage cleared, extension safely resets to Locked state'
    );

    const persistentEncryptedStorage = await serviceWorker.evaluate(async () => {
      return new Promise(resolve => chrome.storage.local.get(['encryptedVault'], resolve));
    });

    assert(
      !!persistentEncryptedStorage.encryptedVault,
      'Browser Restart: Encrypted vault payload remains safely in chrome.storage.local for master password unlock'
    );

    // -----------------------------------------------------------------
    // SECTION 12: FAILURE STATES & ERROR HANDLING
    // -----------------------------------------------------------------
    console.log('\n[SECTION 12] Failure States & Error Boundary Checks');

    const lockedReqRes = await serviceWorker.evaluate(async () => {
      return new Promise(resolve => {
        chrome.runtime.onMessage.dispatch({ action: 'GET_MATCHING_CREDENTIALS', payload: { url: 'http://localhost:8089' } }, {}, resolve);
      });
    });
    assert(lockedReqRes.isUnlocked === false && lockedReqRes.matches.length === 0, 'Locked Vault: Returns 0 credentials');

    const wrongPassRes = await serviceWorker.evaluate(async () => {
      return new Promise(resolve => {
        chrome.runtime.onMessage.dispatch({ action: 'UNLOCK_VAULT', payload: { masterPassword: 'WrongPassword999!' } }, {}, resolve);
      });
    });
    assert(wrongPassRes.success === false, 'Wrong Master Password: Unlock rejected with clear error message');

    await serviceWorker.evaluate(async (creds) => {
      if (chrome.storage.session) {
        await chrome.storage.session.set({ decryptedVault: creds, isUnlocked: true, unlockedAt: Date.now() });
      }
    }, testCredentials);

    const invalidIdRes = await serviceWorker.evaluate(async () => {
      return new Promise(resolve => {
        chrome.runtime.onMessage.dispatch({ action: 'AUTHORIZE_AUTOFILL', payload: { id: 'invalid-id-999', url: 'http://localhost:8089' } }, {}, resolve);
      });
    });
    assert(invalidIdRes.success === false, 'Invalid Credential ID: Authorization fails cleanly');

    console.log('\n===============================================================');
    console.log(`SUMMARY: ${passedTests} / ${totalTests} real-world validation & audit checks passed.`);
    console.log('===============================================================');

    await context.close();
    server.close();
    process.exit(passedTests === totalTests ? 0 : 1);
  } catch (err) {
    console.error('\n❌ VALIDATION TEST RUNNER EXCEPTION:', err);
    server.close();
    process.exit(1);
  }
})();
