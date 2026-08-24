import handler from '../../api/ipfs-backup';
import { IncomingMessage, ServerResponse } from 'http';
import { Socket } from 'net';

async function runIpfsBackupTests() {
  console.log('===============================================================');
  console.log('XEROX DECENTRALIZED IPFS BACKUP API TEST SUITE');
  console.log('===============================================================');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, description: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${description}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${description}`);
      throw new Error(`Test failed: ${description}`);
    }
  }

  // Helper to create mock request and response objects
  function createMockHttp(method: string, bodyObj?: any) {
    const req = new IncomingMessage(new Socket());
    req.method = method;
    req.headers = {
      'content-type': 'application/json',
    };

    let resBody = '';
    let resStatus = 200;
    const resHeaders: Record<string, string> = {};

    const res = {
      statusCode: 200,
      setHeader(name: string, value: string) {
        resHeaders[name.toLowerCase()] = value;
        return this;
      },
      headers: resHeaders,
      end(chunk?: any) {
        if (chunk) resBody += chunk;
        resBodyPromiseResolve();
      },
    } as unknown as ServerResponse;

    Object.defineProperty(res, 'statusCode', {
      get() {
        return resStatus;
      },
      set(val) {
        resStatus = val;
      },
    });

    let resBodyPromiseResolve: () => void = () => {};
    const resBodyPromise = new Promise<void>((resolve) => {
      resBodyPromiseResolve = resolve;
    });

    // Seed request data streams
    if (bodyObj) {
      const dataStr = JSON.stringify(bodyObj);
      setTimeout(() => {
        req.emit('data', Buffer.from(dataStr));
        req.emit('end');
      }, 50);
    } else {
      setTimeout(() => {
        req.emit('end');
      }, 50);
    }

    return {
      req,
      res,
      getResponseBody: async () => {
        await resBodyPromise;
        return resBody;
      },
      getResponseStatus: () => resStatus,
      getResponseHeaders: () => resHeaders,
    };
  }

  // TEST 1: OPTIONS CORS Check
  console.log('\n[TEST 1] OPTIONS preflight request');
  {
    const { req, res, getResponseStatus, getResponseHeaders } = createMockHttp('OPTIONS');
    await handler(req, res);
    assert(getResponseStatus() === 204, 'OPTIONS response code is 204');
    assert(getResponseHeaders()['access-control-allow-origin'] === '*', 'Access-Control-Allow-Origin is "*"');
  }

  // TEST 2: GET method reject check
  console.log('\n[TEST 2] Reject non-POST requests');
  {
    const { req, res, getResponseBody, getResponseStatus } = createMockHttp('GET');
    await handler(req, res);
    assert(getResponseStatus() === 405, 'GET returns 405 Method Not Allowed');
    const body = JSON.parse(await getResponseBody());
    assert(body.error === 'Method Not Allowed', 'Error matches "Method Not Allowed"');
  }

  // TEST 3: POST missing data check
  console.log('\n[TEST 3] Missing encryptedData validation');
  {
    const { req, res, getResponseBody, getResponseStatus } = createMockHttp('POST', {
      someOtherField: 'value',
    });
    await handler(req, res);
    assert(getResponseStatus() === 400, 'POST without data returns 400 Bad Request');
    const body = JSON.parse(await getResponseBody());
    assert(body.error.includes('encryptedData'), 'Error highlights missing encryptedData');
  }

  // TEST 4: Mock hash fallback check (when PINATA_JWT is not set)
  console.log('\n[TEST 4] Fallback mock hash return check');
  {
    const { req, res, getResponseBody, getResponseStatus } = createMockHttp('POST', {
      encryptedData: 'scrambled-text-here',
    });
    await handler(req, res);
    assert(getResponseStatus() === 200, 'Mock run returns 200 OK');
    const body = JSON.parse(await getResponseBody());
    assert(body.IpfsHash === 'QmMockHash1234567890ForTestingPurposeOnly', 'Returns the designated mock testing CID');
    assert(body.isMock === true, 'Response payload declares isMock is true');
  }

  console.log(`\n===============================================================`);
  console.log(`TEST RESULTS: ${passed}/${total} assertions passed successfully.`);
  console.log(`===============================================================`);
}

runIpfsBackupTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
