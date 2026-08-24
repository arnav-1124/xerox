import handler from '../../api/duck-alias';
import { IncomingMessage, ServerResponse } from 'http';
import { Socket } from 'net';

async function runDuckAliasTests() {
  console.log('===============================================================');
  console.log('XEROX DUCKDUCKGO EMAIL ALIAS API TEST SUITE');
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
  function createMockHttp(method: string, headers: Record<string, string> = {}) {
    const req = new IncomingMessage(new Socket());
    req.method = method;
    req.headers = headers;

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
      }
    } as unknown as ServerResponse;

    Object.defineProperty(res, 'statusCode', {
      get() { return resStatus; },
      set(val) { resStatus = val; }
    });

    let resBodyPromiseResolve: () => void = () => {};
    const resBodyPromise = new Promise<void>((resolve) => {
      resBodyPromiseResolve = resolve;
    });

    return {
      req,
      res,
      getResponseBody: async () => {
        await resBodyPromise;
        return resBody;
      },
      getResponseStatus: () => resStatus,
      getResponseHeaders: () => resHeaders
    };
  }

  // TEST 1: CORS Headers are set on OPTIONS preflight
  console.log('\n[TEST 1] Preflight OPTIONS Request');
  {
    const { req, res, getResponseStatus, getResponseHeaders } = createMockHttp('OPTIONS');
    await handler(req, res);
    assert(getResponseStatus() === 204, 'OPTIONS response code is 204');
    assert(getResponseHeaders()['access-control-allow-origin'] === '*', 'Access-Control-Allow-Origin is "*"');
    assert(getResponseHeaders()['access-control-allow-methods'] === 'POST, OPTIONS', 'Access-Control-Allow-Methods includes POST and OPTIONS');
  }

  // TEST 2: Reject non-POST requests
  console.log('\n[TEST 2] HTTP Method Validation');
  {
    const { req, res, getResponseBody, getResponseStatus } = createMockHttp('GET');
    await handler(req, res);
    assert(getResponseStatus() === 405, 'GET request returns 405 Method Not Allowed');
    const body = JSON.parse(await getResponseBody());
    assert(body.error === 'Method Not Allowed', 'Error message matches Method Not Allowed');
  }

  // TEST 3: Reject request with missing Authorization header
  console.log('\n[TEST 3] Missing Authorization Token Validation');
  {
    const { req, res, getResponseBody, getResponseStatus } = createMockHttp('POST', {
      'content-type': 'application/json'
    });
    await handler(req, res);
    assert(getResponseStatus() === 400, 'POST without token returns 400 Bad Request');
    const body = JSON.parse(await getResponseBody());
    assert(body.error.includes('Missing or invalid Authorization token'), 'Error message details missing token');
  }

  console.log(`\n===============================================================`);
  console.log(`TEST RESULTS: ${passed}/${total} assertions passed successfully.`);
  console.log(`===============================================================`);
}

runDuckAliasTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
