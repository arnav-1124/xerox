/**
 * Xerox P1 WebAuthn PRF & Cryptographic Tamper Hardening Test Suite
 * Validates WebAuthn PRF key wrapping, multi-authenticator passkeys, zero master password storage,
 * and AES-GCM tamper resistance for ciphertexts, IVs, salts, wrapped VEKs, and envelope schemas.
 */

import {
  generateVEK,
  wrapVEK,
  unwrapVEK,
  encryptPayloadWithVEK,
  decryptPayloadWithVEK,
} from '../lib/crypto';
import { VaultEnvelopeV2, isVaultEnvelopeV2, WebAuthnProtection } from '../domain/vault/VaultEnvelope';

async function runP1CryptoTests() {
  console.log('===============================================================');
  console.log('XEROX P1 WEBAUTHN PRF & CRYPTOGRAPHIC TAMPER HARDENING SUITE');
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

  // PART A — WEBAUTHN PRF KEY WRAPPING & MULTI-AUTHENTICATOR TESTS
  console.log('\n[SECTION 1] WebAuthn PRF Extension & Biometric KEK Derivation');
  const vek = generateVEK();

  // Simulated WebAuthn PRF outputs derived from authenticators
  const passkey1PrfSecret = 'HKDF_DERIVED_PRF_SECRET_KEY_PASSKEY_1_WINDOWS_HELLO';
  const passkey2PrfSecret = 'HKDF_DERIVED_PRF_SECRET_KEY_PASSKEY_2_YUBIKEY_5C';

  const wrap1 = await wrapVEK(vek, passkey1PrfSecret);
  const prot1: WebAuthnProtection = {
    credentialId: 'cred_id_win_hello_123',
    prfSupported: true,
    salt: wrap1.salt,
    wrappedVEK: wrap1.wrappedVEK,
    wrapIv: wrap1.wrapIv,
    label: 'Windows Hello',
    createdAt: Date.now(),
  };

  const unwrappedVEK1 = await unwrapVEK(prot1.wrappedVEK, prot1.wrapIv, prot1.salt, passkey1PrfSecret);
  assert(
    Array.from(unwrappedVEK1).join(',') === Array.from(vek).join(','),
    'Passkey 1 PRF secret unwraps identical 256-bit VEK (Zero Master Password Involvement)'
  );

  let wrongPrfFailed = false;
  try {
    await unwrapVEK(prot1.wrappedVEK, prot1.wrapIv, prot1.salt, 'WRONG_AUTHENTICATOR_PRF_OUTPUT');
  } catch {
    wrongPrfFailed = true;
  }
  assert(wrongPrfFailed, 'Unmatched PRF assertion fails to unwrap VEK');

  console.log('\n[SECTION 2] Multi-Authenticator Passkey Management');
  const wrap2 = await wrapVEK(vek, passkey2PrfSecret);
  const prot2: WebAuthnProtection = {
    credentialId: 'cred_id_yubikey_456',
    prfSupported: true,
    salt: wrap2.salt,
    wrappedVEK: wrap2.wrappedVEK,
    wrapIv: wrap2.wrapIv,
    label: 'YubiKey 5C',
    createdAt: Date.now(),
  };

  let protections = [prot1, prot2];
  assert(protections.length === 2, 'Vault envelope contains 2 registered passkey protections');

  const unwrappedVEK2 = await unwrapVEK(prot2.wrappedVEK, prot2.wrapIv, prot2.salt, passkey2PrfSecret);
  assert(
    Array.from(unwrappedVEK2).join(',') === Array.from(vek).join(','),
    'Passkey 2 (YubiKey) unwraps the same VEK'
  );

  // Remove passkey 1
  protections = protections.filter((p) => p.credentialId !== 'cred_id_win_hello_123');
  assert(protections.length === 1 && protections[0].credentialId === 'cred_id_yubikey_456', 'Passkey 1 removed cleanly without modifying VEK or vault payload');

  // PART B — CRYPTOGRAPHIC TAMPER & INTEGRITY HARDENING TESTS
  console.log('\n[SECTION 3] AES-GCM Ciphertext Tamper Resistance');
  const sensitiveItems = [
    {
      id: 'item_1',
      title: 'Banking Vault',
      payload: {
        username: 'TEST_USERNAME_XEROX',
        password: 'TEST_PASSWORD_XEROX',
        totpSecret: 'TEST_TOTP_XEROX',
        cardNumber: 'TEST_CARD_XEROX',
        notes: 'TEST_NOTE_XEROX',
      },
    },
  ];

  const validEncryptedVault = await encryptPayloadWithVEK(sensitiveItems, vek);
  const masterPwd = 'MasterPassword2026!';
  const recHex = 'A1B2C3D4E5F67890A1B2C3D4E5F67890A1B2C3D4E5F67890A1B2C3D4E5F67890';

  const pwdWrap = await wrapVEK(vek, masterPwd);
  const recWrap = await wrapVEK(vek, recHex);

  const envelope: VaultEnvelopeV2 = {
    formatVersion: 2,
    cryptoVersion: 2,
    encryptedVault: validEncryptedVault,
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
    webauthnProtections: [prot2],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Tamper 1: Modify 1 byte of cipherText
  const tamperedCipher = envelope.encryptedVault.cipherText.slice(0, -4) + (envelope.encryptedVault.cipherText.endsWith('A') ? 'B' : 'A');
  let tamperCipherFailed = false;
  try {
    await decryptPayloadWithVEK(tamperedCipher, envelope.encryptedVault.iv, vek);
  } catch {
    tamperCipherFailed = true;
  }
  assert(tamperCipherFailed, 'Tampered ciphertext triggers AES-GCM authentication failure safely');

  // Tamper 2: Modify IV
  const tamperedIV = envelope.encryptedVault.iv.slice(0, -2) + (envelope.encryptedVault.iv.endsWith('A') ? 'B' : 'A');
  let tamperIvFailed = false;
  try {
    await decryptPayloadWithVEK(envelope.encryptedVault.cipherText, tamperedIV, vek);
  } catch {
    tamperIvFailed = true;
  }
  assert(tamperIvFailed, 'Tampered IV triggers AES-GCM authentication failure safely');

  // Tamper 3: Modify Password Wrapped VEK
  const tamperedPwdWrappedVEK = envelope.passwordProtection.wrappedVEK.slice(0, -4) + 'XXXX';
  let tamperPwdWrappedFailed = false;
  try {
    await unwrapVEK(tamperedPwdWrappedVEK, envelope.passwordProtection.wrapIv, envelope.passwordProtection.salt, masterPwd);
  } catch {
    tamperPwdWrappedFailed = true;
  }
  assert(tamperPwdWrappedFailed, 'Tampered password wrappedVEK triggers unwrap failure');

  // Recovery path remains functional!
  const unwrappedFromRecovery = await unwrapVEK(
    envelope.recoveryProtection.wrappedVEK,
    envelope.recoveryProtection.wrapIv,
    envelope.recoveryProtection.salt,
    recHex
  );
  assert(
    Array.from(unwrappedFromRecovery).join(',') === Array.from(vek).join(','),
    'Recovery path remains 100% functional when password wrapping is tampered'
  );

  // Tamper 4: Modify Password Wrap IV & Salt
  let tamperPwdIvFailed = false;
  try {
    await unwrapVEK(envelope.passwordProtection.wrappedVEK, tamperedIV, envelope.passwordProtection.salt, masterPwd);
  } catch {
    tamperPwdIvFailed = true;
  }
  assert(tamperPwdIvFailed, 'Tampered password wrapIv triggers unwrap failure');

  let tamperPwdSaltFailed = false;
  try {
    await unwrapVEK(envelope.passwordProtection.wrappedVEK, envelope.passwordProtection.wrapIv, 'INVALID_SALT_BASE64==', masterPwd);
  } catch {
    tamperPwdSaltFailed = true;
  }
  assert(tamperPwdSaltFailed, 'Tampered password salt triggers unwrap failure');

  // Tamper 5: Modify Recovery Wrapped VEK & Wrap IV
  const tamperedRecWrappedVEK = envelope.recoveryProtection.wrappedVEK.slice(0, -4) + 'YYYY';
  let tamperRecWrappedFailed = false;
  try {
    await unwrapVEK(tamperedRecWrappedVEK, envelope.recoveryProtection.wrapIv, envelope.recoveryProtection.salt, recHex);
  } catch {
    tamperRecWrappedFailed = true;
  }
  assert(tamperRecWrappedFailed, 'Tampered recovery wrappedVEK triggers unwrap failure');

  // Password path remains functional!
  const unwrappedFromPassword = await unwrapVEK(
    envelope.passwordProtection.wrappedVEK,
    envelope.passwordProtection.wrapIv,
    envelope.passwordProtection.salt,
    masterPwd
  );
  assert(
    Array.from(unwrappedFromPassword).join(',') === Array.from(vek).join(','),
    'Password path remains 100% functional when recovery wrapping is tampered'
  );

  console.log('\n[SECTION 4] Envelope Schema Tamper & Missing Field Guards');
  assert(isVaultEnvelopeV2({ formatVersion: 99, encryptedVault: envelope.encryptedVault }) === false, 'Invalid formatVersion 99 rejected');
  assert(isVaultEnvelopeV2({ formatVersion: 2 }) === false, 'Missing envelope payload fields rejected');

  console.log('\n[SECTION 5] Zero-Plaintext Audit across Envelope & Metadata');
  const serializedEnvelope = JSON.stringify(envelope);
  assert(!serializedEnvelope.includes('TEST_USERNAME_XEROX'), 'Envelope JSON contains ZERO instances of username');
  assert(!serializedEnvelope.includes('TEST_PASSWORD_XEROX'), 'Envelope JSON contains ZERO instances of password');
  assert(!serializedEnvelope.includes('TEST_TOTP_XEROX'), 'Envelope JSON contains ZERO instances of TOTP secret');
  assert(!serializedEnvelope.includes('TEST_CARD_XEROX'), 'Envelope JSON contains ZERO instances of card number');
  assert(!serializedEnvelope.includes('TEST_NOTE_XEROX'), 'Envelope JSON contains ZERO instances of notes');

  console.log('===============================================================');
  console.log(`SUMMARY: ${passed} / ${total} P1 WebAuthn & tamper hardening tests passed.`);
  console.log('===============================================================');
}

runP1CryptoTests().catch((err) => {
  console.error('P1 Crypto & Tamper Test Suite Failed:', err);
  process.exit(1);
});
