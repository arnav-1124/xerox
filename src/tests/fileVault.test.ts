import { compressAndEncryptFile, decryptAndDecompressFile, decryptWithoutDecompress } from '../lib/fileCrypto';
import { deriveKeyBundle } from '../lib/crypto';

async function runFileVaultTests() {
  console.log('===============================================================');
  console.log('XEROX CLIENT-SIDE FILE COMPRESSION & ENCRYPTION TEST SUITE');
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

  try {
    // 1. Derive a mock key bundle
    const masterPassword = 'MySecretSuperMasterPassword123!';
    const saltBase64 = 'c2FsdF9mb3JfdGVzdGluZ19wdXJwb3NlX29ubHk='; // Base64 of 'salt_for_testing_purpose_only'
    const keyBundle = await deriveKeyBundle(masterPassword, saltBase64);

    assert(keyBundle !== null, 'Successfully derived mock Key Bundle');
    assert(keyBundle.fallbackKeyHex !== null, 'CryptoJS fallback key hex exists');

    // 2. Prepare a compressible test payload (repeated string to trigger gzip savings)
    const testString = 'Xerox Secure Vault. '.repeat(100); // 2000 characters
    const originalBlob = new Blob([testString], { type: 'text/plain' });
    const originalSize = originalBlob.size;

    console.log(`\nOriginal Payload Size: ${originalSize} bytes`);

    // 3. Compress & Encrypt
    const result = await compressAndEncryptFile(originalBlob, keyBundle);

    assert(result.encryptedBlob !== null, 'Encryption returned a valid Blob payload');
    assert(typeof result.iv === 'string' && result.iv.length > 0, 'Returned valid initialization vector (iv)');
    assert(typeof result.salt === 'string' && result.salt.length > 0, 'Returned valid key derivation salt');
    assert(result.compressedSize > 0, 'Returned valid compressed size metadata');
    assert(result.compressedSize < originalSize, `Compression succeeded: ${originalSize} bytes -> ${result.compressedSize} bytes`);

    console.log(`Compressed Payload Size: ${result.compressedSize} bytes`);
    console.log(`Saved: ${Math.round(((originalSize - result.compressedSize) / originalSize) * 100)}% of storage space`);

    // 4. Decrypt & Decompress (WebCrypto / Fallback automatically selected)
    const decryptedBlob = await decryptAndDecompressFile(
      result.encryptedBlob,
      result.iv,
      result.salt,
      keyBundle
    );

    assert(decryptedBlob !== null, 'Decryption returned a valid decompressed Blob payload');
    assert(decryptedBlob.size === originalSize, `Restored blob size matches original size exactly (${decryptedBlob.size} bytes)`);

    const restoredText = await decryptedBlob.text();
    assert(restoredText === testString, 'Decompressed text content matches original test string exactly');

    // 4b. Verify decryption without decompression (downloads compressed version)
    console.log('\n[Testing Decryption Without Decompression]');
    const rawCompressedBlob = await decryptWithoutDecompress(
      result.encryptedBlob,
      result.iv,
      result.salt,
      keyBundle
    );
    assert(rawCompressedBlob !== null, 'Decrypted raw compressed Blob is not null');
    assert(rawCompressedBlob.size === result.compressedSize, `Decrypted compressed Blob size matches declared compressed size (${rawCompressedBlob.size} bytes)`);

    // 5. Test CryptoJS Fallback Mode explicitly
    console.log('\n[Testing CryptoJS Fallback Encryption]');
    const mockKeyBundleNoWebCrypto = {
      cryptoKey: null, // Force CryptoJS fallback path
      fallbackKeyHex: keyBundle.fallbackKeyHex,
      saltBase64: keyBundle.saltBase64,
    };

    const fallbackResult = await compressAndEncryptFile(originalBlob, mockKeyBundleNoWebCrypto);
    assert(fallbackResult.encryptedBlob !== null, 'CryptoJS encryption returned valid Blob payload');
    
    const fallbackTextPayload = await fallbackResult.encryptedBlob.text();
    assert(fallbackTextPayload.startsWith('cjs:'), 'Payload is correctly prefixed with "cjs:" for fallback parsing');

    const fallbackDecryptedBlob = await decryptAndDecompressFile(
      fallbackResult.encryptedBlob,
      fallbackResult.iv,
      fallbackResult.salt,
      mockKeyBundleNoWebCrypto
    );

    assert(fallbackDecryptedBlob !== null, 'CryptoJS decryption returned valid decompressed Blob');
    assert(fallbackDecryptedBlob.size === originalSize, 'CryptoJS restored blob size matches original exactly');

    const fallbackRestoredText = await fallbackDecryptedBlob.text();
    assert(fallbackRestoredText === testString, 'CryptoJS restored text content matches original exactly');

    console.log(`\n===============================================================`);
    console.log(`TEST RESULTS: ${passed}/${total} assertions passed successfully.`);
    console.log(`===============================================================`);
  } catch (err: any) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

runFileVaultTests();
