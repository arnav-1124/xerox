/**
 * Zero-Knowledge Client-Side Encrypted Google Drive Backup & Sync
 * Uploads and downloads encrypted vault payloads to the user's private Google Drive storage.
 */

const DRIVE_FILE_NAME = 'xerox_vault_encrypted_backup.json';

export interface DriveBackupMeta {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
}

export async function uploadVaultToGoogleDrive(
  accessToken: string,
  encryptedVaultData: any
): Promise<{ fileId: string; modifiedTime: string }> {
  if (!accessToken) throw new Error('Missing Google Drive Access Token');

  // Search if backup file already exists
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_FILE_NAME}' and trashed=false&fields=files(id,name,modifiedTime)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!searchRes.ok) {
    const errText = await searchRes.text();
    throw new Error(`Google Drive API error (${searchRes.status}): ${errText}`);
  }

  const searchData = await searchRes.json();
  const existingFile = searchData.files && searchData.files[0];

  const payloadString = JSON.stringify(
    {
      app: 'Xerox Password Vault',
      version: 1,
      savedAt: new Date().toISOString(),
      encryptedVault: encryptedVaultData,
    },
    null,
    2
  );

  if (existingFile) {
    // Update existing file
    const updateRes = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: payloadString,
      }
    );

    if (!updateRes.ok) throw new Error('Failed to update encrypted backup on Google Drive');
    const updateData = await updateRes.json();
    return { fileId: existingFile.id, modifiedTime: new Date().toISOString() };
  } else {
    // Create new file with multipart upload
    const metadata = {
      name: DRIVE_FILE_NAME,
      mimeType: 'application/json',
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([payloadString], { type: 'application/json' }));

    const createRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      }
    );

    if (!createRes.ok) throw new Error('Failed to create encrypted backup on Google Drive');
    const createData = await createRes.json();
    return { fileId: createData.id, modifiedTime: createData.modifiedTime || new Date().toISOString() };
  }
}

export async function downloadVaultFromGoogleDrive(
  accessToken: string
): Promise<{ encryptedVault: any; modifiedTime: string }> {
  if (!accessToken) throw new Error('Missing Google Drive Access Token');

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_FILE_NAME}' and trashed=false&fields=files(id,name,modifiedTime)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!searchRes.ok) throw new Error('Could not list Google Drive files');
  const searchData = await searchRes.json();
  const file = searchData.files && searchData.files[0];

  if (!file) throw new Error(`No encrypted backup file named "${DRIVE_FILE_NAME}" found on Google Drive.`);

  const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!downloadRes.ok) throw new Error('Failed to download backup file from Google Drive');
  const content = await downloadRes.json();

  return {
    encryptedVault: content.encryptedVault || content,
    modifiedTime: file.modifiedTime || new Date().toISOString(),
  };
}
