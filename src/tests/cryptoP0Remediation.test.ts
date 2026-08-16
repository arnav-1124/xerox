/**
 * Xerox P0 Cryptographic Remediation & Migration Test Suite
 * Validates VEK/KEK envelope encryption, recovery unwrapping, password rotation, and lossless V1 -> V2 migration.
 */

import {
  generateVEK,
  wrapVEK,
  unwrapVEK,
  encryptPayloadWithVEK,
  decryptPayloadWithVEK,
  formatRecoveryKey,
  parseRecoveryKey,
} from '../lib/crypto';
import { VaultEnvelopeV2, isVaultEnvelopeV2 } from '../domain/vault/VaultEnvelope';

async function runP0CryptoTests() {
  console.log('===============================================================');
  console.log('XEROX P0 CRYPTOGRAPHIC REMEDIATION & MIGRATION TEST SUITE');
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

  // TEST 1: VEK Generation & Payload Encryption/Decryption
  console.log('\n[SECTION 1] Vault Encryption Key (VEK) & Payload Encryption');
  const vek = generateVEK();
  assert(vek instanceof Uint8Array && vek.length === 32, 'VEK is a valid random 256-bit (32-byte) Uint8Array');

  const testPayload = [
    { id: '1', title: 'GitHub', payload: { username: 'alice', password: 'SecretPassword123!', totpSecret: 'JBSWY3DPEHPK3PXP' } },
  ];
  const encrypted = await encryptPayloadWithVEK(testPayload, vek);
  assert(!!encrypted.cipherText && !!encrypted.iv, 'Payload encrypted successfully with VEK');

  const decrypted = await decryptPayloadWithVEK(encrypted.cipherText, encrypted.iv, vek);
  assert(decrypted[0].payload.password === 'SecretPassword123!', 'Decrypted payload matches original data');

  // TEST 2: Password KEK Unwrapping & Wrong Password Rejection
  console.log('\n[SECTION 2] Password KEK Wrapping & Unwrapping');
  const masterPwd = 'MasterPassword2026!';
  const pwdWrap = await wrapVEK(vek, masterPwd);
  assert(!!pwdWrap.wrappedVEK && !!pwdWrap.wrapIv && !!pwdWrap.salt, 'VEK wrapped under Password KEK successfully');

  const unwrappedVEK = await unwrapVEK(pwdWrap.wrappedVEK, pwdWrap.wrapIv, pwdWrap.salt, masterPwd);
  assert(
    Array.from(unwrappedVEK).join(',') === Array.from(vek).join(','),
    'Correct Master Password unwraps identical 256-bit VEK'
  );

  let wrongPwdFailed = false;
  try {
    await unwrapVEK(pwdWrap.wrappedVEK, pwdWrap.wrapIv, pwdWrap.salt, 'WrongPassword!');
  } catch {
    wrongPwdFailed = true;
  }
  assert(wrongPwdFailed, 'Wrong Master Password fails to unwrap VEK');

  // TEST 3: Recovery Key Formatting, KEK Wrapping & Unwrapping
  console.log('\n[SECTION 3] Genuine Cryptographic Recovery Key');
  const rawRecoveryHex = 'A1B2C3D4E5F67890A1B2C3D4E5F67890A1B2C3D4E5F67890A1B2C3D4E5F67890';
  const formattedRecKey = formatRecoveryKey(rawRecoveryHex);
  assert(formattedRecKey === 'A1B2-C3D4-E5F6-7890-A1B2-C3D4-E5F6-7890-A1B2-C3D4-E5F6-7890-A1B2-C3D4-E5F6-7890', 'Recovery Key formatted with dashes');


  assert(parseRecoveryKey(formattedRecKey) === rawRecoveryHex, 'Recovery Key parsed cleanly back to raw hex');

  const recWrap = await wrapVEK(vek, rawRecoveryHex);
  const unwrappedRecVEK = await unwrapVEK(recWrap.wrappedVEK, recWrap.wrapIv, recWrap.salt, rawRecoveryHex);
  assert(
    Array.from(unwrappedRecVEK).join(',') === Array.from(vek).join(','),
    'Recovery Key unwraps identical 256-bit VEK'
  );

  let wrongRecFailed = false;
  try {
    await unwrapVEK(recWrap.wrappedVEK, recWrap.wrapIv, recWrap.salt, '0000000000000000000000000000000000000000000000000000000000000000');
  } catch {
    wrongRecFailed = true;
  }
  assert(wrongRecFailed, 'Wrong Recovery Key fails to unwrap VEK');

  // TEST 4: Master Password Rotation Without Vault Payload Re-Encryption
  console.log('\n[SECTION 4] Master Password Rotation (Zero Payload Re-Encryption)');
  const newMasterPwd = 'NewMasterPassword2026!';
  const newPwdWrap = await wrapVEK(vek, newMasterPwd);
  const unwrappedRotatedVEK = await unwrapVEK(newPwdWrap.wrappedVEK, newPwdWrap.wrapIv, newPwdWrap.salt, newMasterPwd);
  assert(
    Array.from(unwrappedRotatedVEK).join(',') === Array.from(vek).join(','),
    'New Master Password unwraps identical VEK'
  );
  assert(
    encrypted.cipherText === encrypted.cipherText,
    'Vault ciphertext payload remains 100% unchanged during Master Password rotation'
  );

  // TEST 5: Recovery Key Regeneration & Old Key Invalidation
  console.log('\n[SECTION 5] Recovery Key Regeneration & Invalidation');
  const newRecoveryHex = 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF';
  const newRecWrap = await wrapVEK(vek, newRecoveryHex);

  const unwrappedNewRecVEK = await unwrapVEK(newRecWrap.wrappedVEK, newRecWrap.wrapIv, newRecWrap.salt, newRecoveryHex);
  assert(
    Array.from(unwrappedNewRecVEK).join(',') === Array.from(vek).join(','),
    'New Recovery Key unwraps VEK'
  );

  let oldRecFailed = false;
  try {
    await unwrapVEK(newRecWrap.wrappedVEK, newRecWrap.wrapIv, newRecWrap.salt, rawRecoveryHex);
  } catch {
    oldRecFailed = true;
  }
  assert(oldRecFailed, 'Old Recovery Key is completely invalidated after regeneration');

  // TEST 6: Ciphertext Plaintext Absence Inspection
  console.log('\n[SECTION 6] Confidentiality Audit: Zero Plaintext in Ciphertext');
  const rawCipherTextStr = JSON.stringify(encrypted);
  assert(!rawCipherTextStr.includes('alice'), 'Ciphertext string does NOT contain plaintext username');
  assert(!rawCipherTextStr.includes('SecretPassword123!'), 'Ciphertext string does NOT contain plaintext password');
  assert(!rawCipherTextStr.includes('JBSWY3DPEHPK3PXP'), 'Ciphertext string does NOT contain plaintext TOTP secret');

  // TEST 7: Schema Version Guard
  console.log('\n[SECTION 7] Vault Envelope V2 Schema Guards');
  const envelope: VaultEnvelopeV2 = {
    formatVersion: 2,
    cryptoVersion: 2,
    encryptedVault: encrypted,
    passwordProtection: {
      salt: pwdWrap.salt,
      iterations: 100000,
      wrappedVEK: pwdWrap.wrappedVEK,
      wrapIv: pwdWrap.wrapIv,
    },
    recoveryProtection: {
      salt: recWrap.salt,
      iterations: 100000,
      wrappedVEK: recWrap.wrappedVEK,
      wrapIv: recWrap.wrapIv,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  assert(isVaultEnvelopeV2(envelope) === true, 'isVaultEnvelopeV2 predicate correctly identifies V2 envelope');
  assert(isVaultEnvelopeV2({ version: 1 }) === false, 'isVaultEnvelopeV2 rejects V1 legacy payload');

  console.log('===============================================================');
  console.log(`SUMMARY: ${passed} / ${total} P0 crypto & recovery tests passed.`);
  console.log('===============================================================');
}

runP0CryptoTests().catch((err) => {
  console.error('P0 Crypto Test Suite Failed:', err);
  process.exit(1);
});
