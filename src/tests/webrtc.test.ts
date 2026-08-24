import { compressData, decompressData, mergeVaultData } from '../lib/webrtc';
import { PasswordEntry, Category } from '../types';

async function runWebRTCSyncTests() {
  console.log('===============================================================');
  console.log('XEROX WEBRTC LOCAL P2P SYNC TEST SUITE');
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

  // Define mock categories
  const localCategories: Category[] = [
    { id: 'cat-1', name: 'Work', color: '#111111' },
    { id: 'cat-2', name: 'Personal', color: '#222222' },
  ];

  const incomingCategories: Category[] = [
    { id: 'cat-2', name: 'Personal', color: '#222222' }, // duplicate
    { id: 'cat-3', name: 'Entertainment', color: '#333333' }, // new
  ];

  // Define mock passwords
  const localPasswords: PasswordEntry[] = [
    {
      id: 'pwd-1',
      websiteName: 'GitHub',
      username: 'alice',
      password: 'local-password-1',
      category: 'Work',
      createdAt: 1000,
      updatedAt: 2000,
      tags: [],
    },
    {
      id: 'pwd-2',
      websiteName: 'Google',
      username: 'alice_personal',
      password: 'local-password-2',
      category: 'Personal',
      createdAt: 1000,
      updatedAt: 5000, // newer than incoming
      tags: [],
    },
  ];

  const incomingPasswords: PasswordEntry[] = [
    {
      id: 'pwd-1',
      websiteName: 'GitHub',
      username: 'alice',
      password: 'incoming-password-updated', // updated password
      category: 'Work',
      createdAt: 1000,
      updatedAt: 8000, // newer than local (8000 > 2000)
      tags: [],
    },
    {
      id: 'pwd-2',
      websiteName: 'Google',
      username: 'alice_personal',
      password: 'incoming-password-old',
      category: 'Personal',
      createdAt: 1000,
      updatedAt: 3000, // older than local (3000 < 5000)
      tags: [],
    },
    {
      id: 'pwd-3',
      websiteName: 'Netflix',
      username: 'alice_netflix',
      password: 'incoming-password-new', // new entry
      category: 'Personal',
      createdAt: 1000,
      updatedAt: 1000,
      tags: [],
    },
  ];

  // TEST 1: Merge conflict resolution
  console.log('\n[TEST 1] Last-Write-Wins Merge Conflict Resolution');
  {
    const { passwords, categories, summary } = mergeVaultData(
      localPasswords,
      localCategories,
      incomingPasswords,
      incomingCategories
    );

    // Assert counts
    assert(summary.addedPass === 1, 'Correctly added 1 new password entry (Netflix)');
    assert(summary.updatedPass === 1, 'Correctly updated 1 password entry (GitHub has newer incoming timestamp)');
    assert(summary.addedCat === 1, 'Correctly added 1 new category (Entertainment)');

    // Assert state values
    const github = passwords.find((p) => p.id === 'pwd-1');
    assert(github?.password === 'incoming-password-updated', 'GitHub password was updated to the incoming value');

    const google = passwords.find((p) => p.id === 'pwd-2');
    assert(google?.password === 'local-password-2', 'Google password remained the local value (local timestamp is newer)');

    const netflix = passwords.find((p) => p.id === 'pwd-3');
    assert(netflix !== undefined, 'Netflix password was added to the list');

    assert(passwords.length === 3, 'Total password list length is 3 after merge');
    assert(categories.length === 3, 'Total category list length is 3 after merge');
  }

  // TEST 2: GZip/JSZip data compression and decompression
  console.log('\n[TEST 2] JSZip End-to-End Compression & Decompression');
  {
    const dataset = { passwords: localPasswords, categories: localCategories };
    const base64Str = await compressData(dataset);
    assert(typeof base64Str === 'string' && base64Str.length > 0, 'Compression returned a non-empty string');

    const decompressed = await decompressData(base64Str);
    assert(decompressed.passwords.length === localPasswords.length, 'Decompressed passwords length matches');
    assert(decompressed.categories[0].name === 'Work', 'Decompressed category data matches original');
  }

  console.log(`\n===============================================================`);
  console.log(`TEST RESULTS: ${passed}/${total} assertions passed successfully.`);
  console.log(`===============================================================`);
}

runWebRTCSyncTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
