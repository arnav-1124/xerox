import type { IncomingMessage, ServerResponse } from 'http';

const getRequestBody = (request: IncomingMessage): Promise<string> => {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      resolve(body);
    });
    request.on('error', (err) => {
      reject(err);
    });
  });
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Add CORS Headers for local development access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  let requestBody = '';
  try {
    requestBody = await getRequestBody(req);
  } catch (err: any) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to read request body' }));
    return;
  }

  let encryptedData = '';
  try {
    const parsed = JSON.parse(requestBody);
    encryptedData = parsed.encryptedData;
  } catch {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Invalid JSON request body' }));
    return;
  }

  if (!encryptedData) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Missing encryptedData in request body' }));
    return;
  }

  const pinataJwt = process.env.PINATA_JWT;
  if (!pinataJwt) {
    // Fallback: return a mock CID for local dev testing when Pinata token is not configured
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        IpfsHash: 'QmMockHash1234567890ForTestingPurposeOnly',
        PinSize: 1024,
        Timestamp: new Date().toISOString(),
        isMock: true,
      })
    );
    return;
  }

  try {
    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pinataJwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pinataContent: {
          encryptedData,
          backupVersion: 2,
          createdAt: Date.now(),
        },
        pinataMetadata: {
          name: 'Xerox Encrypted Backup',
        },
      }),
    });

    if (!pinataResponse.ok) {
      const errText = await pinataResponse.text();
      res.statusCode = pinataResponse.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: `Pinata API responded with status ${pinataResponse.status}: ${errText}` }));
      return;
    }

    const data = await pinataResponse.json();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  } catch (error: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: error.message || 'Internal Server Error' }));
  }
}
