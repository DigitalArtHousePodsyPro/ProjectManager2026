/**
 * Google Drive Backup Service
 * Uses the drive.file scope to manage application backups.
 */

export async function uploadBackupToDrive(accessToken: string, filename: string, content: string) {
  try {
    // 1. Check if file already exists with this name (optional, or just create new)
    // 2. Create the file metadata
    const metadata = {
      name: filename,
      mimeType: 'application/json',
      description: 'OmniFocus Idea OS Backup',
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: 'application/json' }));

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Drive upload failed');
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Drive backup error:', error);
    throw error;
  }
}

export async function listBackupsFromDrive(accessToken: string) {
  const response = await fetch(
    "https://www.googleapis.com/drive/v3/files?q=name contains 'omnifocus_backup' and mimeType = 'application/json'&fields=files(id, name, createdTime)",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const data = await response.json();
  return data.files || [];
}
